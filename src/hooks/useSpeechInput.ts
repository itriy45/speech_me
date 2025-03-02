import { useState, useCallback, useEffect, useRef } from 'react';
import { useSpeechState } from '../context/SpeechStateContext';

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
  
  const recognitionRef = useRef<ExtendedSpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const setCurrentText = useCallback((text: string) => {
    setState(prev => ({ ...prev, currentText: text }));
  }, []);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
    }
  }, []);

  const handleTextSubmit = useCallback(() => {
    if (state.currentText.trim()) {
      onTranscript(state.currentText.trim());
      setState(prev => ({ ...prev, currentText: '' }));
    }
  }, [state.currentText, onTranscript]);

  const initializeRecognition = useCallback(() => {
    if (recognitionRef.current) return;

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error('Speech recognition is not supported in this browser');
      }

      const recognition = new SpeechRecognition() as ExtendedSpeechRecognition;
      recognition.mode = 'ondevice-preferred';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        setState(prev => ({
          ...prev,
          isRecording: true,
          error: null,
          currentText: ''
        }));
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setState(prev => ({ ...prev, currentText: transcript }));
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setState(prev => ({
          ...prev,
          isRecording: false,
          error: event.error === 'not-allowed'
            ? 'Please allow microphone access to use voice recording.'
            : 'Error with speech recognition. Please try again.',
        }));
        stopSpeechState();
        cleanup();
      };

      recognition.onend = () => {
        setState(prev => ({ ...prev, isRecording: false }));
        stopSpeechState();
      };

      recognitionRef.current = recognition;
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: 'Speech recognition is not supported in this browser'
      }));
    }
  }, [language, cleanup, stopSpeechState]);

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

  useEffect(() => {
    initializeRecognition();
    return cleanup;
  }, [initializeRecognition, cleanup]);

  // TODO: should be cached
  const playSound = new Audio('/navigation_forward-selection-minimal.wav');
  const stopSound = new Audio('/navigation_backward-selection-minimal.wav');

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

    if (!recognitionRef.current) {
      initializeRecognition();
    }

    try {
      recognitionRef.current?.start();
      startSpeechState();
      setState(prev => ({
        ...prev,
        isRecording: true,
        error: null,
        currentText: ''
      }));
      playSound.play();
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
  }, [initializeRecognition, speechState.isSpeaking, state.isRecording, startSpeechState, cleanup, stopSpeechState]);

  const handleStopRecording = useCallback(() => {
    cleanup();
    setState(prev => ({
      ...prev,
      isRecording: false,
      error: null
    }));
    stopSpeechState();
    stopSound.play();
  }, [cleanup, stopSpeechState]);

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