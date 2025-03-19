import { useState, useCallback, useEffect, useRef } from 'react';
import { useSpeechState } from '../context/SpeechStateContext';
import { SpeechRecognitionService } from '../services/speechRecognition/speechRecognitionService';

const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

interface RecognitionState {
  isRecording: boolean;
  error: string | null;
  currentText: string;
  showShortcutHint?: boolean;
}

interface UseSpeechInputProps {
  onTranscript: (text: string) => void;
  language?: string;
}

interface ExtendedSpeechRecognition extends SpeechRecognition {
  mode?: 'ondevice-preferred' | 'ondevice-only' | 'cloud-only';
}

export function useSpeechInput({
  onTranscript, 
  language = 'en-UK' 
}: UseSpeechInputProps) {
  const [state, setState] = useState<RecognitionState>({
    isRecording: false,
    error: null,
    currentText: '',
    showShortcutHint: false
  });
  const isDesktop = !isMobile();

  const { state: speechState, startRecording: startSpeechState, stopRecording: stopSpeechState } = useSpeechState();
  
  const recognitionServiceRef = useRef<SpeechRecognitionService | null>(null);

  const setCurrentText = useCallback((text: string) => {
    setState(prev => ({ ...prev, currentText: text }));
  }, []);

  const onRecordingStarted = useCallback(() => {
    console.log('[useSpeechInput].onRecordingStarted()');
    playSoundRef.current?.play();
    setState(prev => ({
      ...prev,
      isRecording: true,
      error: null,
      currentText: ''
    }));
  }, []);

  const cleanup = useCallback(() => {
    console.log('[useSpeechInput].cleanup(): cleanup in useSpeechInput');
    recognitionServiceRef.current?.stop();
    recognitionServiceRef.current?.cleanup();
  }, []);

  const handleError = useCallback((error: string) => {
    errorSoundRef.current?.play();
    setState(prev => ({ ...prev, isRecording: false, error }));

    stopSpeechState();
  }, [stopSpeechState]);

  const handleTranscript = useCallback((text: string) => {
    console.log('[useSpeechInput].handleTranscript()');
    setState(prev => ({ ...prev, currentText: text }));
  }, []);

  // Handle keyboard shortcuts - Desktop only
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    console.log('[useSpeechInput].onKeyPress()]');
    if (!isDesktop || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

    if (event.code === 'Space') {
      event.preventDefault();
      
      if (state.isRecording) {
        // Stop recording and immediately submit the text
        handleStopRecording();
        if (state.currentText.trim()) {
          onTranscript(state.currentText.trim());
          setState(prev => ({ ...prev, currentText: '' }));
        }
      } else if (!speechState.isSpeaking) {
        handleStartRecording();
      }
    }
  }, [state.isRecording, state.currentText, speechState.isSpeaking, onTranscript]);

  // Show shortcut hint for desktop users
  useEffect(() => {
    if (isDesktop) {
      setState(prev => ({ ...prev, showShortcutHint: true }));
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, showShortcutHint: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isDesktop]);

  // Add keyboard event listeners for desktop only
  useEffect(() => {
    if (isDesktop) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [handleKeyPress, isDesktop]);

  const playSoundRef = useRef<HTMLAudioElement | null>(null);
  const errorSoundRef = useRef<HTMLAudioElement | null>(null);

  // Initialization of Playback Audio Elements
  useEffect(() => {
    if (!playSoundRef.current) {
        playSoundRef.current = new Audio('/navigation_forward-selection-minimal.wav');
        playSoundRef.current.preload = 'auto';
    }

    if (!errorSoundRef.current) {
        errorSoundRef.current = new Audio('/alert_error.wav');
        errorSoundRef.current.preload = 'auto';
    }

    return () => {
        // Cleanup: Pause and reset audio on unmount
        if (playSoundRef.current) {
          playSoundRef.current.pause();
          playSoundRef.current.currentTime = 0;
        }
        if (errorSoundRef.current) {
          errorSoundRef.current.pause();
          errorSoundRef.current.currentTime = 0;
        }
    };
  }, []);

  const handleStopRecording = useCallback(() => {
    recognitionServiceRef.current?.stop();
    setState(prev => ({
      ...prev,
      isRecording: false,
      error: null
    }));
    stopSpeechState();
  }, [recognitionServiceRef.current?.stop, stopSpeechState]);

  const handleStartRecording = useCallback(() => {
    if (speechState.isSpeaking) {
      console.log('[useSpeechInput].handleStartRecording(): Cannot start recording while speech is playing');
      setState(prev => ({
        ...prev,
        error: 'Please wait for the speech to finish'
      }));
      return;
    }

    if (state.isRecording) {
      console.log('[useSpeechInput].handleStartRecording(): Already recording');
      setState(prev => ({
        ...prev,
        error: 'Recording is already in progress'
      }));
      return;
    }

    try {
      startSpeechState();
      recognitionServiceRef.current?.start(handleTranscript, handleError, handleStopRecording, onRecordingStarted);
      setState(prev => ({
        ...prev,
        isRecording: true,
        error: null,
        currentText: ''
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        isRecording: false,
        error: 'Failed to start recording. Please try again.',
        currentText: ''
      }));
      stopSpeechState();
      console.error('[useSpeechInput].handleStartRecording(): Failed to start recording', err);
      cleanup();
    }
  }, [speechState.isSpeaking, state.isRecording, startSpeechState, cleanup, stopSpeechState, handleTranscript, handleError]);

  const handleTextSubmit = useCallback(() => {
    console.log('[useSpeechInput].handleTextSubmit()');
    if (state.currentText.trim()) {
      onTranscript(state.currentText.trim());
      setState(prev => ({ ...prev, currentText: '' }));
    }
  }, [state.currentText]);

  // Initialize recognition
  useEffect(() => {
    if (!recognitionServiceRef.current) {
      recognitionServiceRef.current = new SpeechRecognitionService(
        isMobile(), language, errorSoundRef.current
      );
      console.log('[useSpeechInput].useEffect(): recognition service initialization', recognitionServiceRef.current.wsClientId);
      window.addEventListener("beforeunload", () => {
        console.log('[useSpeechInput].useEffect(): add beforeunload', recognitionServiceRef.current?.wsClientId);
        recognitionServiceRef.current?.emitEndEvent()
      });
    }

    return () => {
      if (recognitionServiceRef.current) {
        console.log('[useSpeechInput].useEffect() return: recognition service cleanup (after init useEffect)', recognitionServiceRef.current.wsClientId);
        recognitionServiceRef.current.stop();
        recognitionServiceRef.current.cleanup();
        recognitionServiceRef.current = null;
      }
      window.removeEventListener("beforeunload", () => {
        console.log('[useSpeechInput].useEffect(): remove beforeunload', recognitionServiceRef.current?.wsClientId);
        recognitionServiceRef.current?.emitEndEvent()
      });
    };
  }, [language, stopSpeechState]);

  useEffect(() => {
    if (isMobile() && state.currentText.trim() && !state.isRecording) {
      console.log('[useSpeechInput].useEffect(): Mobile: Submitting text', state, new Date());
      handleTextSubmit();
    }
  }, [state.isRecording]);

  return {
    isRecording: state.isRecording,
    error: state.error,
    currentText: state.currentText,
    setCurrentText,
    startRecording: handleStartRecording,
    stopRecording: handleStopRecording,
    handleTextSubmit, // Added back for mobile functionality
    showShortcutHint: state.showShortcutHint
  };
}