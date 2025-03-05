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
    console.log('preferredMimeType', preferredMimeType, (isMobile && preferredMimeType !== null));
    const lang = language && language !== 'en-UK' ? language : 'en-GB';

    if (isMobile && preferredMimeType !== null) {
        // const DG_API_KEY_OLD = '26e4d94440b115769beaf956760567f6feaec993';
        const DG_API_KEY = 'ebbb5f75e8eb3b4fda6a4d2e732b6946d4ee13a4';
        const deepgramClient = createClient(DG_API_KEY);
        this.strategy = new DeepgramSpeechRecognition(deepgramClient, lang, preferredMimeType);
    } else {
        this.strategy = new BrowserSpeechRecognition(lang);
    }
  }

  start(onTranscript: (text: string) => void, onError: (error: string) => void, sound: HTMLAudioElement | null, onHandleStop: (automatic?: boolean) => void, onHandleTextSubmit: () => void): void {
    this.strategy.start(onTranscript, onError, sound, onHandleStop, onHandleTextSubmit);
  }

  stop(): void {
    this.strategy.stop();
  }

  cleanup(): void {
    this.strategy.cleanup();
  }
}
