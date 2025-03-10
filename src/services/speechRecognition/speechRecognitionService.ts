import { createClient } from '@deepgram/sdk';
import BrowserSpeechRecognition from './browserSpeechRecognition';
import DeepgramSpeechRecognition from './deepgramSpeechRecognition';
import SpeechRecognitionStrategy from './speechRecognitionStrategy';

const checkSupportedTypes = () => {
  const supportedTypes = [
      'audio/wav',
      'audio/webm',
      'audio/x-m4a',
      'audio/ogg',
      'audio/mp4',
  ];

  for (const type of supportedTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
          return type;
      }
  }

  return null;
};

export class SpeechRecognitionService {
  private strategy: SpeechRecognitionStrategy;

  constructor(
    isMobile: boolean,
    language: string
  ) {
    const preferredMimeType = checkSupportedTypes();
    const lang = language && language !== 'en-UK' ? language : 'en-GB';

    if (isMobile && preferredMimeType !== null) {
        try {
            const deepgramClient = createClient(process.env.REACT_APP_DG_API_KEY);
            this.strategy = new DeepgramSpeechRecognition(deepgramClient, lang, preferredMimeType);
        } catch (err) {
            console.warn('Deepgram recognition couldn\'t be initiated, falling back to WebAPI')
            this.strategy = new BrowserSpeechRecognition(lang);
        }
    } else {
        this.strategy = new BrowserSpeechRecognition(lang);
    }
  }

  start(onTranscript: (text: string) => void, onError: (error: string) => void, sound: HTMLAudioElement | null, onHandleStop: () => void): void {
    this.strategy.start(onTranscript, onError, sound, onHandleStop);
  }

  stop(): void {
    this.strategy.stop();
  }
}
