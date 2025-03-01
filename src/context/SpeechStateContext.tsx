import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

// Define the InterimResultStatus interface inline since the import is unresolved
interface InterimResultStatus {
  confidence?: number;
  isAudioReady?: boolean;
  retentionTimeRemaining?: number;
  lastUpdateTime?: number;
}

interface SpeechState {
  isSpeaking: boolean;
  isRecording: boolean;
  isBlocked: boolean;
  transcript: string;
  interimTranscript: string;
  interimStatus?: InterimResultStatus;
  retentionTime: number;
  speechQueue: string[];
  isReadingExpectedResponse: boolean;
  isStudentInputExpected: boolean;
  lastSpeakingTime: number | null;
  isPlayingStudentResponse: boolean;
}

interface SpeechStateContextType {
  state: SpeechState;
  startSpeaking: () => void;
  stopSpeaking: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  blockSpeechInput: () => void;
  unblockSpeechInput: () => void;
  updateTranscript: (text: string) => void;
  updateInterimTranscript: (text: string, status?: InterimResultStatus) => void;
  setRetentionTime: (time: number) => void;
  clearTranscripts: () => void;
  addToSpeechQueue: (text: string) => void;
  clearSpeechQueue: () => void;
  startReadingExpectedResponse: () => void;
  stopReadingExpectedResponse: () => void;
  expectStudentInput: () => void;
  stopExpectingStudentInput: () => void;
  startPlayingStudentResponse: () => void;
  stopPlayingStudentResponse: () => void;
}

const DEFAULT_RETENTION_TIME = 5000;
const SPEECH_COOLDOWN = 500;

const SpeechStateContext = createContext<SpeechStateContextType | undefined>(undefined);

export function SpeechStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SpeechState>({
    isSpeaking: false,
    isRecording: false,
    isBlocked: true,
    transcript: '',
    interimTranscript: '',
    retentionTime: DEFAULT_RETENTION_TIME,
    speechQueue: [],
    isReadingExpectedResponse: false,
    isStudentInputExpected: false,
    lastSpeakingTime: null,
    isPlayingStudentResponse: false
  });

  const interimTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const speakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const blockingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      [interimTimeoutRef, speakingTimeoutRef, blockingTimeoutRef].forEach(ref => {
        if (ref.current) clearTimeout(ref.current);
      });
    };
  }, []);

  const shouldBeBlocked = useCallback((currentState: SpeechState): boolean => {
    const isAnySpeechActive = 
      currentState.isSpeaking || 
      currentState.speechQueue.length > 0 || 
      currentState.isReadingExpectedResponse ||
      currentState.isPlayingStudentResponse;

    const isInCooldown = currentState.lastSpeakingTime && 
                        Date.now() - currentState.lastSpeakingTime < SPEECH_COOLDOWN;

    return !currentState.isStudentInputExpected || 
           isAnySpeechActive || 
           isInCooldown;
  }, []);

  useEffect(() => {
    const newBlockedState = shouldBeBlocked(state);
    if (newBlockedState !== state.isBlocked) {
      if (blockingTimeoutRef.current) {
        clearTimeout(blockingTimeoutRef.current);
      }
      setState(prev => ({ ...prev, isBlocked: newBlockedState }));
    }
  }, [
    state.isStudentInputExpected,
    state.isSpeaking,
    state.speechQueue,
    state.isReadingExpectedResponse,
    state.isPlayingStudentResponse,
    state.lastSpeakingTime,
    shouldBeBlocked
  ]);

  const startPlayingStudentResponse = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPlayingStudentResponse: true,
      isBlocked: true,
      isRecording: false
    }));
  }, []);

  const stopPlayingStudentResponse = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPlayingStudentResponse: false,
      lastSpeakingTime: Date.now(),
      isBlocked: shouldBeBlocked({
        ...prev,
        isPlayingStudentResponse: false,
        lastSpeakingTime: Date.now()
      })
    }));
  }, [shouldBeBlocked]);

  const startSpeaking = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isSpeaking: true,
      isRecording: false,
      isBlocked: true,
      isStudentInputExpected: false,
      lastSpeakingTime: Date.now()
    }));
  }, []);

  const stopSpeaking = useCallback(() => {
    setState(prev => {
      const newState = { 
        ...prev, 
        isSpeaking: false,
        speechQueue: prev.speechQueue.slice(1),
        lastSpeakingTime: Date.now()
      };
      
      if (newState.speechQueue.length > 0) {
        if (speakingTimeoutRef.current) {
          clearTimeout(speakingTimeoutRef.current);
        }
        speakingTimeoutRef.current = setTimeout(() => {
          startSpeaking();
        }, SPEECH_COOLDOWN);
      }
      
      return newState;
    });
  }, []);

  const startRecording = useCallback(() => {
    setState(prev => {
      if (shouldBeBlocked(prev)) {
        return prev;
      }
      return { 
        ...prev, 
        isRecording: true, 
        isSpeaking: false,
        isPlayingStudentResponse: false
      };
    });
  }, [shouldBeBlocked]);

  const stopRecording = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isRecording: false 
    }));
  }, []);

  const addToSpeechQueue = useCallback((text: string) => {
    setState(prev => {
      const newQueue = [...prev.speechQueue, text];
      const newState = {
        ...prev,
        speechQueue: newQueue,
        isBlocked: true,
        isStudentInputExpected: false
      };

      if (!prev.isSpeaking && newQueue.length === 1) {
        if (speakingTimeoutRef.current) {
          clearTimeout(speakingTimeoutRef.current);
        }
        speakingTimeoutRef.current = setTimeout(() => {
          startSpeaking();
        }, SPEECH_COOLDOWN);
      }

      return newState;
    });
  }, []);

  const clearSpeechQueue = useCallback(() => {
    setState(prev => ({
      ...prev,
      speechQueue: [],
      isBlocked: shouldBeBlocked({ ...prev, speechQueue: [] })
    }));
  }, [shouldBeBlocked]);

  const expectStudentInput = useCallback(() => {
    setState(prev => ({
      ...prev,
      isStudentInputExpected: true,
      isBlocked: shouldBeBlocked({ ...prev, isStudentInputExpected: true })
    }));
  }, [shouldBeBlocked]);

  const stopExpectingStudentInput = useCallback(() => {
    setState(prev => ({
      ...prev,
      isStudentInputExpected: false,
      isBlocked: true
    }));
  }, []);

  const startReadingExpectedResponse = useCallback(() => {
    setState(prev => ({
      ...prev,
      isReadingExpectedResponse: true,
      isBlocked: true,
      isStudentInputExpected: false
    }));
  }, []);

  const stopReadingExpectedResponse = useCallback(() => {
    setState(prev => ({
      ...prev,
      isReadingExpectedResponse: false,
      lastSpeakingTime: Date.now(),
      isBlocked: shouldBeBlocked({ 
        ...prev, 
        isReadingExpectedResponse: false,
        lastSpeakingTime: Date.now()
      })
    }));
  }, [shouldBeBlocked]);

  const updateTranscript = useCallback((text: string) => {
    setState(prev => ({ 
      ...prev, 
      transcript: text 
    }));
  }, []);

  const updateInterimTranscript = useCallback((text: string, status?: InterimResultStatus) => {
    if (interimTimeoutRef.current) {
      clearTimeout(interimTimeoutRef.current);
    }

    setState(prev => ({ 
      ...prev, 
      interimTranscript: text,
      interimStatus: status ? {
        ...status,
        retentionTimeRemaining: prev.retentionTime,
        lastUpdateTime: Date.now()
      } : undefined
    }));

    if (text) {
      interimTimeoutRef.current = setTimeout(() => {
        setState(prev => {
          if (prev.interimStatus?.lastUpdateTime === Date.now()) {
            return {
              ...prev,
              interimTranscript: '',
              interimStatus: undefined
            };
          }
          return prev;
        });
      }, state.retentionTime);
    }
  }, [state.retentionTime]);

  const setRetentionTime = useCallback((time: number) => {
    setState(prev => ({
      ...prev,
      retentionTime: time
    }));
  }, []);

  const clearTranscripts = useCallback(() => {
    if (interimTimeoutRef.current) {
      clearTimeout(interimTimeoutRef.current);
    }
    setState(prev => ({
      ...prev,
      transcript: '',
      interimTranscript: '',
      interimStatus: undefined
    }));
  }, []);

  const blockSpeechInput = useCallback(() => {
    setState(prev => ({ ...prev, isBlocked: true }));
  }, []);

  const unblockSpeechInput = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isBlocked: shouldBeBlocked(prev)
    }));
  }, [shouldBeBlocked]);

  return (
    <SpeechStateContext.Provider 
      value={{ 
        state, 
        startSpeaking, 
        stopSpeaking, 
        startRecording, 
        stopRecording,
        blockSpeechInput,
        unblockSpeechInput,
        updateTranscript,
        updateInterimTranscript,
        setRetentionTime,
        clearTranscripts,
        addToSpeechQueue,
        clearSpeechQueue,
        startReadingExpectedResponse,
        stopReadingExpectedResponse,
        expectStudentInput,
        stopExpectingStudentInput,
        startPlayingStudentResponse,
        stopPlayingStudentResponse
      }}
    >
      {children}
    </SpeechStateContext.Provider>
  );
}

export function useSpeechState() {
  const context = useContext(SpeechStateContext);
  if (!context) {
    throw new Error('useSpeechState must be used within a SpeechStateProvider');
  }
  return context;
}