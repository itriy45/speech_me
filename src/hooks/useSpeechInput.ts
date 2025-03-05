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
  const timeoutRef = useRef<NodeJS.Timeout>();

  const setCurrentText = useCallback((text: string) => {
    setState(prev => ({ ...prev, currentText: text }));
  }, []);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    recognitionServiceRef.current?.cleanup();
  }, []);

  const handleTextSubmit = useCallback(() => {
    console.log('handleTextSubmit', state.currentText);
    if (state.currentText.trim()) {
      if (state.isRecording) {
        handleStopRecording();
      }
      onTranscript(state.currentText.trim());
      setState(prev => ({ ...prev, currentText: '' }));
    }
  }, [state.currentText, state.isRecording, onTranscript]);

  const handleError = useCallback((error: string) => {
    setState(prev => ({ ...prev, isRecording: false, error }));

    stopSpeechState();
  }, [stopSpeechState]);

  const handleTranscript = useCallback((text: string) => {
    console.log('handleTranscript', text);
    setState(prev => ({ ...prev, currentText: text }));
  }, []);

  // Handle keyboard shortcuts - Desktop only
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
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
  }, [isDesktop, state.isRecording, state.currentText, speechState.isSpeaking, onTranscript]);

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
  const stopSoundRef = useRef<HTMLAudioElement | null>(null);

  // Initialization of Playback Audio Elements
  useEffect(() => {
    if (!playSoundRef.current) {
        playSoundRef.current = new Audio('/navigation_forward-selection-minimal.wav');
        playSoundRef.current.preload = 'auto';
    }

    if (!stopSoundRef.current) {
        stopSoundRef.current = new Audio('/navigation_backward-selection-minimal.wav');
        stopSoundRef.current.preload = 'auto';
    }

    return () => {
        // Cleanup: Pause and reset audio on unmount
        if (playSoundRef.current) {
          playSoundRef.current.pause();
          playSoundRef.current.currentTime = 0;
        }
        if (stopSoundRef.current) {
          stopSoundRef.current.pause();
          stopSoundRef.current.currentTime = 0;
        }
    };
  }, []);

  const handleStopRecording = useCallback((automatic = false) => {
    stopSoundRef.current?.play();
    recognitionServiceRef.current?.stop();
    // cleanup();
    setState(prev => ({
      ...prev,
      isRecording: false,
      error: null
    }));
    if (!automatic) {
      stopSpeechState();
    }
  }, [stopSpeechState]);

  const handleStartRecording = useCallback(() => {
    if (speechState.isSpeaking) {
      console.log('Cannot start recording while speech is playing');
      setState(prev => ({
        ...prev,
        error: 'Please wait for the speech to finish'
      }));
      return;
    }

    if (state.isRecording) {
      console.log('Already recording');
      setState(prev => ({
        ...prev,
        error: 'Recording is already in progress'
      }));
      return;
    }

    try {
      startSpeechState();
      recognitionServiceRef.current?.start(handleTranscript, handleError, playSoundRef.current, handleStopRecording, handleTextSubmit);
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
      cleanup();
    }
  }, [speechState.isSpeaking, state.isRecording, startSpeechState, cleanup, stopSpeechState, handleTranscript, handleError]);

  // Initialize recognition
  useEffect(() => {
    // console.log('recognition initialization');
    if (!recognitionServiceRef.current) {
      recognitionServiceRef.current = new SpeechRecognitionService(
        isMobile(),
        language
      );
    }

    return cleanup;
  }, []);

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