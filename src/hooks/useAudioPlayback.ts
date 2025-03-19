import { useCallback, useRef, useEffect, useState } from 'react';
import { useSpeechSynthesis } from './useSpeechSynthesis';
import { useSpeechState } from '../context/SpeechStateContext';

interface AudioPlaybackOptions {
  autoPlay?: boolean;
  rate?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export function useAudioPlayback() {
  const { speak, cancel, speaking: synthSpeaking } = useSpeechSynthesis();
  const { startSpeaking, stopSpeaking } = useSpeechState();
  const currentTextRef = useRef<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudioUrl, setIsPlayingAudioUrl] = useState(false);
  const audioRetryCountRef = useRef(0);
  const MAX_AUDIO_RETRIES = 2;

  // Monitor both synthetic speech and our internal speaking state
  useEffect(() => {
    if (synthSpeaking || isPlayingAudioUrl) {
      setIsSpeaking(true);
      startSpeaking();
    } else {
      const timeoutId = setTimeout(() => {
        setIsSpeaking(false);
        stopSpeaking();
      }, 100); // Small delay to ensure proper state synchronization
      
      return () => clearTimeout(timeoutId);
    }
  }, [synthSpeaking, isPlayingAudioUrl, startSpeaking, stopSpeaking]);

  const cleanTextForSpeech = useCallback((text: string) => {
    return text
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/[.,!?;:"'()\[\]{}]/g, ' ')
      .replace(/[\u0400-\u04FF]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  // Play audio from a URL with retry mechanism
  const playAudioFromUrl = useCallback(async (url: string, options: AudioPlaybackOptions = {}) => {
    // Cancel any current speech or audio
    cancel();
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current = null;
    }

    return new Promise<void>((resolve, reject) => {
      try {
        const audio = new Audio(url);
        audioRef.current = audio;
        audioRetryCountRef.current = 0;
        
        audio.onloadstart = () => {
          setIsPlayingAudioUrl(true);
          startSpeaking();
          options.onStart?.();
        };
        
        audio.onended = () => {
          setIsPlayingAudioUrl(false);
          stopSpeaking();
          audioRef.current = null;
          audioRetryCountRef.current = 0;
          options.onEnd?.();
          resolve();
        };

        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          if (audioRetryCountRef.current < MAX_AUDIO_RETRIES) {
            audioRetryCountRef.current++;
            console.log(`Retrying audio playback (${audioRetryCountRef.current}/${MAX_AUDIO_RETRIES})...`);
            
            // Small delay before retry
            setTimeout(() => {
              if (audioRef.current) {
                audioRef.current.load();
                audioRef.current.play().catch(err => {
                  console.error('Audio retry error:', err);
                  setIsPlayingAudioUrl(false);
                  stopSpeaking();
                  audioRef.current = null;
                  options.onError?.('Failed to play audio after retries');
                  reject(new Error('Failed to play audio after retries'));
                });
              }
            }, 500);
          } else {
            setIsPlayingAudioUrl(false);
            stopSpeaking();
            audioRef.current = null;
            options.onError?.('Failed to play audio file');
            reject(new Error('Failed to play audio file'));
          }
        };

        audio.play().catch(error => {
          console.error('Error playing audio:', error);
          if (audioRetryCountRef.current < MAX_AUDIO_RETRIES) {
            audioRetryCountRef.current++;
            console.log(`Retrying audio playback (${audioRetryCountRef.current}/${MAX_AUDIO_RETRIES})...`);
            
            // Small delay before retry
            setTimeout(() => {
              if (audioRef.current) {
                audioRef.current.play().catch(err => {
                  console.error('Audio retry error:', err);
                  setIsPlayingAudioUrl(false);
                  stopSpeaking();
                  audioRef.current = null;
                  options.onError?.('Failed to play audio after retries');
                  reject(new Error('Failed to play audio after retries'));
                });
              }
            }, 500);
          } else {
            setIsPlayingAudioUrl(false);
            stopSpeaking();
            audioRef.current = null;
            options.onError?.('Failed to play audio: ' + error.message);
            reject(error);
          }
        });
      } catch (error) {
        console.error('Error setting up audio:', error);
        setIsPlayingAudioUrl(false);
        stopSpeaking();
        options.onError?.('Failed to set up audio playback');
        reject(error);
      }
    });
  }, [cancel, startSpeaking, stopSpeaking]);

  const playAudio = useCallback((text: string, options: AudioPlaybackOptions = {}) => {
    console.log('[useAudioPlayback].playAudio', text, options);
    const cleanText = cleanTextForSpeech(text);
    
    // Cancel any current speech or audio
    cancel();
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    // Store current text and update state
    currentTextRef.current = cleanText;
    setIsSpeaking(true);
    startSpeaking();

    // Configure speech options
    const speechOptions = {
      rate: options.rate || 1,
      onStart: () => {
        setIsSpeaking(true);
        options.onStart?.();
      },
      onEnd: () => {
        currentTextRef.current = null;
        setIsSpeaking(false);
        stopSpeaking();
        options.onEnd?.();
      },
      onError: (error: string) => {
        currentTextRef.current = null;
        setIsSpeaking(false);
        stopSpeaking();
        options.onError?.(error);
      }
    };

    // Start speech
    speak(cleanText, speechOptions);
  }, [speak, cancel, cleanTextForSpeech, startSpeaking, stopSpeaking]);

  const stopAudio = useCallback(() => {
    cancel();
    currentTextRef.current = null;
    
    // Stop audio element if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    setIsSpeaking(false);
    setIsPlayingAudioUrl(false);
    stopSpeaking();
  }, [cancel, stopSpeaking]);

  return {
    playAudio,
    playAudioFromUrl,
    stopAudio,
    speaking: isSpeaking,
    currentText: currentTextRef.current
  };
}