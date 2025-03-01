import { useState, useEffect, useCallback, useRef } from 'react';

// Platform detection
const isAndroid = typeof window !== 'undefined' && /Android/i.test(window.navigator.userAgent);
const isIOS = typeof window !== 'undefined' && (/iPad|iPhone|iPod/.test(window.navigator.userAgent) || 
  (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1));

interface SpeechOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  rate?: number;
  pitch?: number;
  volume?: number;
}

interface TextSegment {
  text: string;
  type: 'normal' | 'question' | 'exclamation' | 'parenthetical' | 'quote';
  emphasis?: 'light' | 'medium' | 'strong';
  isEndOfSentence?: boolean;
  isEndOfParagraph?: boolean;
}

const PREFERRED_VOICE = {
  primary: {
    android: {
      name: "Microsoft AVA - English (United States)",
      lang: "en-US"
    },
    ios: {
      name: "Google UK English Male",
      lang: "en-GB"
    },
    default: {
      name: "Google UK English Female",  // Це буде використовуватись для десктопу
      lang: "en-GB"
    }
  },
  fallbacks: [
    "Google UK English Female",  // Основний запасний варіант - жіночий голос
    "Chrome OS UK English Female",  // Змінено на жіночий
    "Android Speech Recognition and Synthesis from Google en-gb-x-gba-network",  // Змінено на жіночу мережу
  ],
  settings: {
    default: {
      rate: 1.05,
      pitch: 1.25,
      volume: 1.0
    },
    question: {
      rate: 1.05,
      pitch: 1.20,
      volume: 1.0,
      endPitch: 1.35
    },
    exclamation: {
      rate: 1.06,
      pitch: 1.3,
      volume: 1.0,
      emphasis: true
    },
    parenthetical: {
      rate: 1.05,
      pitch: 1.2,
      volume: 0.95
    },
    quote: {
      rate: 1.04,
      pitch: 1.22,
      volume: 1.0
    },
    pause: {
      short: isAndroid ? 150 : 60,
      medium: isAndroid ? 200 : 60,
      long: isAndroid ? 250 : 60,
      extraLong: isAndroid ? 300 : 60
    },
    emphasis: {
      light: 1.1,
      medium: 1.2,
      strong: 1.3
    }
  }
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const SPEECH_TIMEOUT = 20000;
const RESUME_CHECK_INTERVAL = 5000;

// Voice warmup state and settings
const WARMUP_SETTINGS = {
  maxAttempts: 3,
  timeout: 2000,
  retryDelay: 500
};

const preprocessText = (text: string): { 
  segments: TextSegment[];
  pauseDurations: number[] 
} => {
  const cleanText = text
    .replace(/\s+/g, ' ')
    .replace(/([.,!?;:])\s*/g, '$1 ')
    .trim();

  const segments: TextSegment[] = [];
  const pauseDurations: number[] = [];
  
  const paragraphs = cleanText.split(/\n\s*\n/);
  
  for (let p = 0; p < paragraphs.length; p++) {
    const sentences = isAndroid
      ? paragraphs[p].split(/(?<=[.!?])\s+/)
      : (paragraphs[p].match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [paragraphs[p]]);
    
    for (let s = 0; s < sentences.length; s++) {
      let sentence = sentences[s].trim();
      if (!sentence) continue;

      let type: TextSegment['type'] = 'normal';
      
      if (sentence.endsWith('?')) {
        type = 'question';
      } else if (sentence.endsWith('!')) {
        type = 'exclamation';
      }

      const parts = isAndroid
        ? [sentence]
        : sentence.split(/([,;:])/).filter(Boolean);
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i].trim();
        if (!part) continue;

        if (isAndroid && [',' ,';', ':'].includes(part)) {
          continue;
        }

        if (!isAndroid && [',' ,';', ':'].includes(part)) {
          pauseDurations.push(PREFERRED_VOICE.settings.pause.short);
          continue;
        }

        if (part.startsWith('(') && part.endsWith(')')) {
          segments.push({
            text: part.slice(1, -1),
            type: 'parenthetical'
          });
        } else if (part.startsWith('"') && part.endsWith('"')) {
          segments.push({
            text: part.slice(1, -1),
            type: 'quote'
          });
        } else {
          segments.push({
            text: isAndroid ? part : part.replace(/[,;:]$/, ''),
            type,
            isEndOfSentence: i === parts.length - 1,
            isEndOfParagraph: s === sentences.length - 1 && p === paragraphs.length - 1
          });
        }

        if (i === parts.length - 1) {
          if (p === paragraphs.length - 1 && s === sentences.length - 1) {
            pauseDurations.push(PREFERRED_VOICE.settings.pause.extraLong);
          } else if (s === sentences.length - 1) {
            pauseDurations.push(PREFERRED_VOICE.settings.pause.long);
          } else {
            pauseDurations.push(PREFERRED_VOICE.settings.pause.medium);
          }
        } else if (!isAndroid) {
          pauseDurations.push(PREFERRED_VOICE.settings.pause.short);
        }
      }
    }
  }

  return { segments, pauseDurations };
};

function useSpeechSynthesis() {
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentVoice, setCurrentVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isWarmedUp, setIsWarmedUp] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const resumeIntervalRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef(0);
  const warmupAttemptRef = useRef(0);

  const warmupVoice = useCallback(async (): Promise<boolean> => {
    if (isWarmedUp || !window.speechSynthesis) return true;
    
    return new Promise((resolve) => {
      const warmup = new SpeechSynthesisUtterance('');
      warmup.volume = 0;
      
      const voice = findBestVoice();
      if (voice) {
        warmup.voice = voice;
        if (isIOS) {
          warmup.lang = 'en-GB';
        } else if (isAndroid) {
          warmup.lang = PREFERRED_VOICE.primary.android.lang;
        }
      }

      const timeoutId = setTimeout(() => {
        warmupAttemptRef.current++;
        if (warmupAttemptRef.current < WARMUP_SETTINGS.maxAttempts) {
          setTimeout(() => warmupVoice(), WARMUP_SETTINGS.retryDelay);
        }
        resolve(false);
      }, WARMUP_SETTINGS.timeout);

      warmup.onend = () => {
        clearTimeout(timeoutId);
        setIsWarmedUp(true);
        resolve(true);
      };

      warmup.onerror = () => {
        clearTimeout(timeoutId);
        warmupAttemptRef.current++;
        if (warmupAttemptRef.current < WARMUP_SETTINGS.maxAttempts) {
          setTimeout(() => warmupVoice(), WARMUP_SETTINGS.retryDelay);
        }
        resolve(false);
      };

      window.speechSynthesis.speak(warmup);
    });
  }, [isWarmedUp]);

  useEffect(() => {
    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const filteredVoices = voices.filter(voice => 
        voice.lang.startsWith('en-') && !voice.localService
      );
      setAvailableVoices(filteredVoices);
      
      if (!currentVoice && filteredVoices.length > 0) {
        const defaultVoice = findBestVoice();
        if (defaultVoice) {
          setCurrentVoice(defaultVoice);
        }
      }
    };

    updateVoices();
    
    if (window.speechSynthesis.addEventListener) {
      window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
      };
    } else {
      window.speechSynthesis.onvoiceschanged = updateVoices;
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (resumeIntervalRef.current) clearInterval(resumeIntervalRef.current);
    if (utteranceRef.current) window.speechSynthesis.cancel();
    setSpeaking(false);
    setError(null);
    utteranceRef.current = null;
    retryCountRef.current = 0;
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const findBestVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (currentVoice) {
      return currentVoice;
    }

    if (isIOS) {
      const iosVoice = availableVoices.find(voice => 
        voice.name === PREFERRED_VOICE.primary.ios.name &&
        voice.lang.startsWith('en-')
      );
      if (!iosVoice) {
        const fallbackIosVoice = availableVoices.find(voice =>
          voice.name.includes("Google UK English Male") &&
          voice.lang.startsWith('en-')
        );
        if (fallbackIosVoice) return fallbackIosVoice;
      }
      return iosVoice || null;
    }

    if (isAndroid) {
      const avaVoice = availableVoices.find(voice => 
        voice.name === PREFERRED_VOICE.primary.android.name &&
        voice.lang === PREFERRED_VOICE.primary.android.lang
      );
      if (avaVoice) return avaVoice;
    }

    // Логіка для настільних пристроїв: завжди використовувати жіночий голос
    if (!isIOS && !isAndroid) {
      // Спочатку шукаємо Google UK English Female
      const ukFemaleVoice = availableVoices.find(voice => 
        voice.name === "Google UK English Female" &&
        voice.lang === "en-GB"
      );
      if (ukFemaleVoice) return ukFemaleVoice;

      // Резервний варіант: будь-який англійський жіночий голос
      const anyFemaleVoice = availableVoices.find(voice => 
        voice.lang.startsWith('en-') && 
        !voice.localService &&
        voice.name.toLowerCase().includes('female')
      );
      if (anyFemaleVoice) return anyFemaleVoice;
      
      // Якщо не знайдено жодного жіночого голосу, шукаємо будь-який британський голос
      const anyUKVoice = availableVoices.find(voice => 
        voice.lang === "en-GB" && 
        !voice.localService
      );
      if (anyUKVoice) return anyUKVoice;
    }

    // Стандартний запасний варіант для всіх платформ
    return availableVoices.find(voice => 
      voice.lang.startsWith('en-') && 
      !voice.localService
    ) || null;
  }, [availableVoices, currentVoice]);

  const speakSegment = useCallback((
    segment: TextSegment,
    options: SpeechOptions = {},
    onComplete?: () => void
  ) => {
    const utterance = new SpeechSynthesisUtterance(segment.text);
    utteranceRef.current = utterance;

    const selectedVoice = currentVoice || findBestVoice();
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      if (isIOS) {
        utterance.lang = 'en-GB';
      }
    }

    const settings = PREFERRED_VOICE.settings;
    
    switch (segment.type) {
      case 'question':
        utterance.rate = options.rate ?? settings.question.rate;
        utterance.pitch = options.pitch ?? settings.question.pitch;
        if (segment.isEndOfSentence) {
          utterance.pitch = settings.question.endPitch;
        }
        break;
      case 'exclamation':
        utterance.rate = options.rate ?? settings.exclamation.rate;
        utterance.pitch = options.pitch ?? settings.exclamation.pitch;
        break;
      case 'parenthetical':
        utterance.rate = options.rate ?? settings.parenthetical.rate;
        utterance.pitch = options.pitch ?? settings.parenthetical.pitch;
        utterance.volume = settings.parenthetical.volume;
        break;
      case 'quote':
        utterance.rate = options.rate ?? settings.quote.rate;
        utterance.pitch = options.pitch ?? settings.quote.pitch;
        break;
      default:
        utterance.rate = options.rate ?? settings.default.rate;
        utterance.pitch = options.pitch ?? settings.default.pitch;
    }

    if (segment.emphasis) {
      utterance.pitch *= settings.emphasis[segment.emphasis];
    }

    utterance.volume = options.volume ?? settings.default.volume;
    
    if (isIOS) {
      utterance.lang = 'en-GB';
    } else if (isAndroid) {
      utterance.lang = PREFERRED_VOICE.primary.android.lang;
    } else {
      utterance.lang = PREFERRED_VOICE.primary.default.lang;
    }

    utterance.onend = () => {
      onComplete?.();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      cleanup();
      setError(`Speech synthesis error: ${event.error}`);
      options.onError?.(event.error);
    };

    if (isAndroid) {
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 50);
    } else {
      window.speechSynthesis.speak(utterance);
    }
  }, [findBestVoice, cleanup]);

  const speak = useCallback(async (text: string, options: SpeechOptions = {}) => {
    if (!text.trim()) return;
    
    cleanup();

    try {
      // Ensure voice is warmed up before speaking
      if (!isWarmedUp) {
        const warmupSuccess = await warmupVoice();
        if (!warmupSuccess) {
          console.warn('Voice warmup failed, attempting to speak anyway');
        }
      }

      const { segments, pauseDurations } = preprocessText(text);
      
      const speakNextSegment = (index: number) => {
        if (index >= segments.length) {
          cleanup();
          options.onEnd?.();
          return;
        }

        speakSegment(segments[index], options, () => {
          const pause = pauseDurations[index];
          if (pause > 0) {
            setTimeout(() => {
              speakNextSegment(index + 1);
            }, pause);
          } else {
            speakNextSegment(index + 1);
          }
        });

        if (index === 0) {
          setSpeaking(true);
          setError(null);
          options.onStart?.();

          resumeIntervalRef.current = setInterval(() => {
            if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
              window.speechSynthesis.resume();
            }
          }, RESUME_CHECK_INTERVAL);
        }
      };

      speakNextSegment(0);

      timeoutRef.current = setTimeout(() => {
        if (speaking && !window.speechSynthesis.speaking) {
          cleanup();
        }
      }, SPEECH_TIMEOUT);

    } catch (err) {
      console.error('Speech synthesis error:', err);
      cleanup();
      setError('Speech synthesis initialization failed');
      options.onError?.('initialization_failed');
    }
  }, [cleanup, speaking, speakSegment, isWarmedUp, warmupVoice]);

  const cancel = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const pause = useCallback(() => {
    if (resumeIntervalRef.current) clearInterval(resumeIntervalRef.current);
    window.speechSynthesis.pause();
    setSpeaking(false);
  }, []);

  const resume = useCallback(() => {
    window.speechSynthesis.resume();
    setSpeaking(true);
  }, []);

  return {
    speak,
    cancel,
    pause,
    resume,
    speaking,
    error,
    availableVoices,
    currentVoice,
    setVoice: setCurrentVoice,
    isWarmedUp
  };
}

export { useSpeechSynthesis };