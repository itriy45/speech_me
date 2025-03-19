import React, { createContext, useReducer, useCallback, useEffect, ReactNode, useState } from 'react';
import { validateAnswer } from '../../utils/textProcessing';
import { generateHint } from '../../utils/hints/hintGenerator';
import { compareTexts, shouldShowCorrections } from '../../utils/textComparison';
import { DialogueContextType, DialogueStep } from '../../types/dialogue';
import { dialogueReducer, initialState, DialogueState } from './reducer';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { HINT_MESSAGES } from '../../utils/hints/hintMessages';
import { useAudioPlayback } from '../../hooks/useAudioPlayback';
import { getAudioUrlForMessage } from '../../utils/audio/audioAssets';

export const DialogueContext = createContext<DialogueContextType | undefined>(undefined);

// Голосові налаштування для забезпечення однакового голосу для всіх типів повідомлень
const VOICE_OPTIONS = {
  // Це гарантує, що на настільних комп'ютерах завжди буде використовуватись жіночий голос
  desktopVoiceOptions: {
    preferFemale: true,
    rate: 1.05,
    pitch: 1.25,
    volume: 1.0
  }
};

export function DialogueProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dialogueReducer, initialState);
  console.log('[DialogueContext].render(): useSpeechSynthesis init');
  const { speak, cancel, speaking } = useSpeechSynthesis();
  const { playAudioFromUrl, playAudio, stopAudio } = useAudioPlayback();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [pendingStep, setPendingStep] = useState<DialogueStep | null>(null);

  // Track skip confirmation state
  const [skipConfirmationTimeout, setSkipConfirmationTimeout] = useState<NodeJS.Timeout | null>(null);

  // Enhanced delay calculation based on content length and type
  const calculateMessageDelay = useCallback((text: string, type: string): number => {
    const baseDelay = type === 'instruction' ? 500 : 400;
    const wordCount = text.trim().split(/\s+/).length;
    const estimatedSpeechTime = wordCount * 100;
    const lengthFactor = wordCount > 8 ? 1.5 : 1;
    
    return Math.min(
      Math.max(estimatedSpeechTime * lengthFactor, baseDelay),
      1000
    );
  }, []);

  // Updated function to handle both speech synthesis and audio URLs
  const speakContent = useCallback(async (text: string, audioUrl: string | undefined, callbacks: any) => {
    console.log('[DialogueContext].speakContent', text, !audioUrl);
    if (audioUrl) {
      // Use audio URL if available
      try {
        await playAudioFromUrl(audioUrl, {
          onStart: () => {
            setIsSpeaking(true);
            callbacks.onStart?.();
          },
          onEnd: () => {
            setIsSpeaking(false);
            callbacks.onEnd?.();
          },
          onError: (error) => {
            console.error('Error playing audio:', error);
            // Fall back to speech synthesis if audio URL fails
            const options = {
              ...VOICE_OPTIONS.desktopVoiceOptions,
              ...callbacks
            };
            speak(text, options);
          }
        });
      } catch (error) {
        console.error('Error playing audio URL, falling back to speech synthesis:', error);
        const options = {
          ...VOICE_OPTIONS.desktopVoiceOptions,
          ...callbacks
        };
        speak(text, options);
      }
    } else {
      // Fall back to speech synthesis
      const options = {
        ...VOICE_OPTIONS.desktopVoiceOptions,
        ...callbacks
      };
      
      speak(text, options);
    }
  }, [speak, playAudioFromUrl]);

  const showDialogueStep = useCallback((step: DialogueStep) => {
    console.log('[DialogueContext].showDialogueStep', step, isSpeaking);
    if (isSpeaking) {
      setPendingStep(step);
      return;
    }

    dispatch({ type: 'SET_TYPING', payload: true });
    
    const messageText = step.teacherApp || step.ukrainian || '';
    const delay = calculateMessageDelay(messageText, step.type);

    requestAnimationFrame(() => {
      setTimeout(() => {
        let finalText = '';
        const grammarNote = step.grammarNote;
        
        switch (step.type) {
          case 'vocabulary':
            finalText = `${step.teacherApp}`;
            break;
          case 'conversation':
            finalText = step.teacherApp || step.ukrainian || '';
            break;
          case 'instruction':
            finalText = step.teacherApp || '';
            break;
          default:
            finalText = step.teacherApp || '';
        }

        if (finalText) {
          dispatch({
            type: 'ADD_MESSAGE',
            payload: {
              id: Date.now(),
              text: finalText,
              isUser: false,
              type: step.type,
              expectedResponse: step.expectedResponse,
              grammarNote: grammarNote,
              ukrainian: step.ukrainian,
              audioUrl: step.audioUrl // Pass the audio URL to the message
            }
          });
        }
        dispatch({ type: 'SET_TYPING', payload: false });
        
        if (step.type === 'instruction' && !step.expectedResponse) {
          setIsSpeaking(true);
          // For instruction type, make sure we prioritize the audio URL if available
          const effectiveAudioUrl = step.audioUrl || getAudioUrlForMessage('instruction');
          
          speakContent(finalText, effectiveAudioUrl, {
            onStart: () => setIsSpeaking(true),
            onEnd: () => {
              setIsSpeaking(false);
              const nextIndex = state.currentSentenceIndex + 1;
              if (state.currentDialogue && nextIndex < state.currentDialogue.conversation.length) {
                dispatch({ type: 'NEXT_SENTENCE' });
                const nextStep = state.currentDialogue.conversation[nextIndex];
                showDialogueStep(nextStep);
              } else {
                dispatch({ type: 'SET_COMPLETE' });
              }
            }
          });
        }
      }, delay);
    });
  }, [speakContent, calculateMessageDelay, isSpeaking, state.currentSentenceIndex, state.currentDialogue]);

  // Handle pending steps when speech ends
  useEffect(() => {
    if (!isSpeaking && pendingStep) {
      showDialogueStep(pendingStep);
      setPendingStep(null);
    }
  }, [isSpeaking, pendingStep, showDialogueStep]);

  const handleTranscript = useCallback((text: string) => {
    console.log('[DialogueContext].handleTranscript', text);
    if (!state.currentDialogue || !state.currentDialogue.conversation[state.currentSentenceIndex]) {
      return;
    }
    
    const currentStep = state.currentDialogue.conversation[state.currentSentenceIndex];
    const validation = validateAnswer(text, currentStep.expectedResponse || '', []);
    
    const { similarity, corrections } = compareTexts(text, currentStep.expectedResponse || '');
    
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: Date.now(),
        text: validation.similarity >= 0.8 ? validation.correctedText : text,
        originalText: text,
        isUser: true,
        type: 'student-response',
        similarity: validation.similarity,
        expectedResponse: currentStep.expectedResponse,
        corrections: corrections // Always include corrections
      }
    });

    if (validation.similarity >= 0.8) {
      dispatch({
        type: 'UPDATE_LAST_MESSAGE',
        payload: {
          isCorrect: true,
          expectedResponse: currentStep.expectedResponse
        }
      });

      if (currentStep.expectedResponse) {
        setIsSpeaking(true);
        
        // Play the response audio if available, otherwise use speech synthesis
        const responseAudioUrl = currentStep.responseAudioUrl || getAudioUrlForMessage('success');
        
        speakContent(currentStep.expectedResponse, responseAudioUrl, {
          onStart: () => setIsSpeaking(true),
          onEnd: () => {
            setIsSpeaking(false);
            const randomMessage = HINT_MESSAGES.SHORT_SUCCESS_MESSAGES[
              Math.floor(Math.random() * HINT_MESSAGES.SHORT_SUCCESS_MESSAGES.length)
            ];
            
            // Get a success audio URL for the success message
            const successAudioUrl = getAudioUrlForMessage('success');
            
            dispatch({
              type: 'ADD_MESSAGE',
              payload: {
                id: Date.now() + 1,
                text: randomMessage,
                isUser: false,
                isCorrect: true,
                type: 'conversation',
                audioUrl: successAudioUrl // Use success audio for correct responses
              }
            });

            const nextIndex = state.currentSentenceIndex + 1;
            if (state.currentDialogue && nextIndex < state.currentDialogue.conversation.length) {
              dispatch({ type: 'NEXT_SENTENCE' });
              showDialogueStep(state.currentDialogue.conversation[nextIndex]);
            } else {
              dispatch({ type: 'SET_COMPLETE' });
            }
          }
        });
      }
    } else {
      dispatch({ type: 'INCREMENT_ATTEMPTS' });
      
      const hint = generateHint({
        answer: currentStep.expectedResponse || '',
        attempt: state.attempts + 1,
        totalWords: (currentStep.expectedResponse || '').split(' ').length,
        firstWord: (currentStep.expectedResponse || '').split(' ')[0]
      });

      // Get appropriate hint audio for the current attempt
      const hintAudioUrl = getAudioUrlForMessage('hint', undefined, state.attempts + 1);

      requestAnimationFrame(() => {
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            id: Date.now() + 1,
            text: hint,
            isUser: false,
            isHint: true,
            type: 'conversation',
            audioUrl: hintAudioUrl // Use predefined hint audio based on attempt number
          }
        });

        if (state.showingAnswer && currentStep.expectedResponse) {
          setIsSpeaking(true);
          // Use response audio URL if available, otherwise use predefined hint
          const finalHintAudio = currentStep.responseAudioUrl || getAudioUrlForMessage('hint', undefined, 3);
          
          speakContent(currentStep.expectedResponse, finalHintAudio, {
            onStart: () => setIsSpeaking(true),
            onEnd: () => setIsSpeaking(false)
          });
        }
      });
    }
  }, [state.currentDialogue, state.currentSentenceIndex, state.attempts, state.showingAnswer, speakContent, showDialogueStep]);

  const handleSkip = useCallback(() => {
    if (!state.currentDialogue?.conversation) return;

    const currentStep = state.currentDialogue.conversation[state.currentSentenceIndex];
    
    if (skipConfirmationTimeout) {
      clearTimeout(skipConfirmationTimeout);
      setSkipConfirmationTimeout(null);
    }

    dispatch({
      type: 'SKIP_STEP',
      payload: {
        skippedIndex: state.currentSentenceIndex,
        timestamp: Date.now()
      }
    });

    dispatch({ type: 'SET_TYPING', payload: true });
    
    setTimeout(() => {
      dispatch({ type: 'SET_TYPING', payload: false });
      
      if (currentStep.expectedResponse) {
        // Get appropriate audio URL for the skipped answer
        const audioUrl = currentStep.responseAudioUrl || getAudioUrlForMessage('hint', undefined, 3);
        
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            id: Date.now(),
            text: currentStep.expectedResponse,
            isUser: false,
            type: 'correct-answer',
            isCorrect: true,
            audioUrl: audioUrl // Use response audio URL if available
          }
        });
        
        setIsSpeaking(true);
        speakContent(currentStep.expectedResponse, audioUrl, {
          onStart: () => setIsSpeaking(true),
          onEnd: () => {
            setIsSpeaking(false);
            const nextIndex = state.currentSentenceIndex + 1;
            if (nextIndex < state.currentDialogue.conversation.length) {
              dispatch({ type: 'NEXT_SENTENCE' });
              showDialogueStep(state.currentDialogue.conversation[nextIndex]);
            } else {
              dispatch({ type: 'SET_COMPLETE' });
            }
          }
        });
      }
    }, 800);
  }, [state.currentDialogue, state.currentSentenceIndex, skipConfirmationTimeout, speakContent, showDialogueStep]);

  // Initialize first step
  useEffect(() => {
    if (state.currentDialogue?.conversation && !state.messages.length) {
      showDialogueStep(state.currentDialogue.conversation[0]);
    }
  }, [state.currentDialogue, showDialogueStep]);

  // Cleanup speech synthesis
  useEffect(() => {
    return () => {
      cancel();
      stopAudio();
      setIsSpeaking(false);
      setPendingStep(null);
    };
  }, [cancel, stopAudio]);

  return (
    <DialogueContext.Provider value={{ 
      state, 
      dispatch, 
      handleTranscript,
      handleSkip,
      skipConfirmationTimeout,
      setSkipConfirmationTimeout
    }}>
      {children}
    </DialogueContext.Provider>
  );
}