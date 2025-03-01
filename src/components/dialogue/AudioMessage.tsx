import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useAudioPlayback } from '../../hooks/useAudioPlayback';
import { useSpeechState } from '../../context/SpeechStateContext';
import { Message } from '../../types/dialogue';
import { getAudioUrlForMessage } from '../../utils/audio/audioAssets';

interface AudioMessageProps {
  message: Message;
  autoPlay?: boolean;
  onlyShowButton?: boolean;
}

export default function AudioMessage({ 
  message, 
  autoPlay = true,
  onlyShowButton = false 
}: AudioMessageProps) {
  const { playAudio, stopAudio, speaking, playAudioFromUrl } = useAudioPlayback();
  const { 
    state: speechState,
    startPlayingStudentResponse,
    stopPlayingStudentResponse
  } = useSpeechState();
  
  const hasPlayedRef = useRef<Set<number>>(new Set());
  const timeoutRef = useRef<NodeJS.Timeout>();
  const messageRef = useRef(message);
  const playQueueRef = useRef<Array<() => void>>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Clean and normalize text for speech synthesis
  const cleanText = useCallback((text: string): string => {
    return text
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/[^\x00-\x7F]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  // Get the appropriate text for speech synthesis
  const getPlayableText = useCallback((msg: Message): string | null => {
    if (msg.isUser) return null;

    if (msg.isHint) {
      if (msg.text.includes('Try this one:')) {
        return 'Try this one';
      }
      if (msg.text.includes('The correct answer is:')) {
        const match = msg.text.match(/The correct answer is: "(.*?)"/);
        return match ? match[1] : msg.text;
      }
      return cleanText(msg.text);
    }

    if (msg.isCorrect) {
      return null;
    }

    if (msg.teacherApp) {
      if (msg.type === 'instruction') {
        return cleanText(msg.teacherApp);
      }

      if ((msg.type === 'vocabulary' || msg.type === 'conversation') && msg.expectedResponse) {
        return cleanText(msg.expectedResponse);
      }

      const parts = msg.teacherApp.split(':');
      return parts.length > 1 ? cleanText(parts[1]) : cleanText(parts[0]);
    }

    return cleanText(msg.text);
  }, [cleanText]);

  // Get the effective audio URL for this message
  const getEffectiveAudioUrl = useCallback((msg: Message): string | undefined => {
    if (msg.audioUrl) return msg.audioUrl;
    
    const messageType = msg.isHint 
      ? 'hint' 
      : msg.isCorrect 
        ? 'success' 
        : msg.type || 'conversation';
    
    return getAudioUrlForMessage(
      messageType as any, 
      undefined, 
      messageType === 'hint' ? 3 : 0
    );
  }, []);

  // Enhanced audio playback with better fallback to speech synthesis
  const playWithSpeechState = useCallback(async (message: Message) => {
    startPlayingStudentResponse();
    setIsLoading(true);
    
    try {
      // Get the effective audio URL for this message
      const audioUrl = getEffectiveAudioUrl(message);
      const textToPlay = getPlayableText(message);
      
      // If audioUrl is provided, try to play that first
      if (audioUrl) {
        try {
          await playAudioFromUrl(audioUrl, {
            onEnd: () => {
              stopPlayingStudentResponse();
              setIsLoading(false);
            },
            onError: async (error) => {
              console.warn('Audio URL failed to load, falling back to TTS:', error);
              // Fallback to speech synthesis if audio URL fails
              if (textToPlay) {
                try {
                  await playAudio(textToPlay);
                } catch (ttsError) {
                  console.error('Text-to-speech fallback also failed:', ttsError);
                }
              }
              stopPlayingStudentResponse();
              setIsLoading(false);
            }
          });
        } catch (audioError) {
          console.warn('Error playing audio from URL, falling back to TTS:', audioError);
          // If playing from URL fails, fall back to TTS
          if (textToPlay) {
            await playAudio(textToPlay);
          }
          setIsLoading(false);
          stopPlayingStudentResponse();
        }
      } else if (textToPlay) {
        // No audio URL, use TTS directly
        try {
          await playAudio(textToPlay);
        } catch (ttsError) {
          console.error('Failed to play text with TTS:', ttsError);
        } finally {
          setIsLoading(false);
          stopPlayingStudentResponse();
        }
      } else {
        // No audio URL and no playable text
        console.warn('No audio URL or playable text available for message:', message.id);
        setIsLoading(false);
        stopPlayingStudentResponse();
      }
    } catch (error) {
      console.error('Unexpected error in audio playback:', error);
      setIsLoading(false);
      stopPlayingStudentResponse();
    }
  }, [playAudio, playAudioFromUrl, getPlayableText, getEffectiveAudioUrl, startPlayingStudentResponse, stopPlayingStudentResponse]);

  // Enhanced queue management
  const queueAudio = useCallback((message: Message, delay: number = 100) => {
    return new Promise<void>((resolve) => {
      timeoutRef.current = setTimeout(async () => {
        await playWithSpeechState(message);
        resolve();
      }, delay);
    });
  }, [playWithSpeechState]);

  // Handle cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      stopAudio();
      stopPlayingStudentResponse();
      playQueueRef.current = [];
    };
  }, [stopAudio, stopPlayingStudentResponse]);

  // Message playback logic
  useEffect(() => {
    messageRef.current = message;

    const playMessage = async () => {
      if (messageRef.current.id !== message.id) return;
      if (hasPlayedRef.current.has(message.id)) return;
      if (speaking) return;

      const hasAudioUrl = !!getEffectiveAudioUrl(message);
      const textToPlay = getPlayableText(message);
      
      // Allow playing if either audio URL or text-to-speech is available
      if (!hasAudioUrl && !textToPlay) return;

      hasPlayedRef.current.add(message.id);
      
      const delay = message.isCorrect ? 200 : 300;
      
      try {
        await queueAudio(message, delay);
      } catch (error) {
        console.error('Error playing audio:', error);
        stopPlayingStudentResponse(); // Ensure we stop blocking if there's an error
      }
    };

    if (!onlyShowButton && autoPlay && message.id) {
      playMessage();
    }
  }, [
    message.id, 
    message.audioUrl,
    autoPlay, 
    onlyShowButton, 
    speaking, 
    getPlayableText,
    getEffectiveAudioUrl,
    queueAudio, 
    stopPlayingStudentResponse
  ]);

  // Determine if we should show the audio button based on either audio URL or text availability
  const audioUrl = getEffectiveAudioUrl(message);
  const textToPlay = getPlayableText(message);
  const hasAudio = !!audioUrl || !!textToPlay;
  
  if (!hasAudio) return null;

  // Check if we should show the button - make sure instruction type is included
  const shouldShowButton = 
    (message.teacherApp && message.expectedResponse) || 
    message.isCorrect || 
    !!message.audioUrl || 
    message.type === 'instruction' ||
    message.isHint || 
    !!textToPlay; // Show button if there's text that can be played with TTS
    
  if (!shouldShowButton && !onlyShowButton) return null;

  // Enhanced click handler with speech state management
  const handleClick = async () => {
    if (speaking || isLoading) {
      stopAudio();
      stopPlayingStudentResponse();
      setIsLoading(false);
    } else {
      await playWithSpeechState(message);
    }
  };

  const isDisabled = (speechState.isBlocked || speechState.isPlayingStudentResponse) && !speaking && !isLoading;
  
  // Adjust colors based on if it's a student message (purple bubble)
  const getWaveColors = () => {
    const active = speaking || isLoading;
    
    // Check if it's a student message (typically would have isUser property)
    const isStudentMessage = message.isUser;
    
    if (isStudentMessage) {
      // For student messages (purple background)
      return active ? 'bg-white' : 'bg-purple-200';
    } else {
      // For normal messages
      return active ? 'bg-blue-500' : 'bg-gray-400';
    }
  };

  // Audio wave bars with enhanced animation
  const renderAudioWave = () => {
    const active = speaking || isLoading;
    const barCount = 4; // Added one more bar for wider appearance
    const bars = [];
    const colorClass = getWaveColors();
    
    // Heights pattern for visual variation
    const heights = [3, 5, 4, 6, 3];
    
    for (let i = 0; i < barCount; i++) {
      // Different heights for visual appeal
      const baseHeight = heights[i % heights.length];
      const height = active 
        ? baseHeight + Math.sin(i * 1.5) * 1.5 + 1  // More dynamic height when active
        : baseHeight;
      
      // More sophisticated animation classes
      const animationClass = active 
        ? i % 2 === 0 ? 'animate-pulse' : 'animate-bounce' 
        : '';
      
      // Animation duration and delay
      const animDuration = 0.8 + (i * 0.1); // Different durations for more organic feel
      
      bars.push(
        <div
          key={i}
          className={`
            rounded-full transition-all ease-in-out
            ${colorClass} ${animationClass}
          `}
          style={{ 
            height: `${height}px`,
            width: '2px',
            marginLeft: '2px',
            marginRight: '2px',
            animationDelay: `${i * 0.1}s`,
            animationDuration: `${animDuration}s`
          }}
        />
      );
    }
    
    return bars;
  };

  // Special positioning for student messages to prevent height issues
  const getPositioningClasses = () => {
    if (message.isUser) {
      // For student messages (purple bubbles), position carefully
      return 'absolute -top-3 right-2';
    } else {
      // For regular messages
      return 'inline-flex ml-2 relative -top-1';
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        ${getPositioningClasses()}
        items-end justify-center h-4
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      aria-label={
        isDisabled
          ? 'Please wait until current message finishes'
          : (speaking || isLoading)
          ? 'Stop playing' 
          : 'Play audio'
      }
    >
      <div className="flex items-end space-x-px">
        {renderAudioWave()}
      </div>
    </button>
  );
}