import SpeechRecognitionStrategy from './speechRecognitionStrategy';

const SPEECH_RECOGNITION_MODE = {
  ON_DEVICE_PREFERRED: 'ondevice-preferred',
  ON_DEVICE_ONLY: 'ondevice-only',
  CLOUD_ONLY: 'cloud-only',
};

const SPEECH_ERROR_MESSAGES = {
  NOT_ALLOWED: 'Please allow microphone access to use voice recording.',
  GENERIC_ERROR: 'Error with speech recognition. Please try again.',
  NOT_SUPPORTED: 'Speech recognition is not supported in this browser.',
};

interface ExtendedSpeechRecognition extends SpeechRecognition {
  mode?: SPEECH_RECOGNITION_MODE.ON_DEVICE_PREFERRED | SPEECH_RECOGNITION_MODE.ON_DEVICE_ONLY | SPEECH_RECOGNITION_MODE.CLOUD_ONLY;
}

export default class BrowserSpeechRecognition implements SpeechRecognitionStrategy {
  private recognition: ExtendedSpeechRecognition | null = null;
  private language: string;

  constructor(language: string) {
    this.language = language;
  }

  start(onTranscript: (text: string) => void, onError: (error: string) => void, onHandleStop: () => void, onRecordingStarted: () => void): void {
    if (this.recognition) {
      this.recognition.start();
      return;
    }
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        onError(SPEECH_ERROR_MESSAGES.NOT_SUPPORTED);
      }

      this.recognition = new SpeechRecognition() as ExtendedSpeechRecognition;
      this.recognition.mode = SPEECH_RECOGNITION_MODE.CLOUD_ONLY;
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.language;

      this.recognition.onstart = () => {
        onRecordingStarted();
      };

      this.recognition.onresult = (event: any) => {
        console.log('[browserSpeechRecognition].onStart(): recognition onresult', event);
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        onTranscript(transcript);
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        onError(
          event.error === 'not-allowed'
            ? SPEECH_ERROR_MESSAGES.NOT_ALLOWED
            : SPEECH_ERROR_MESSAGES.GENERIC_ERROR
        );
        stop();
      };

      this.recognition.onend = () => {
        console.log('[browserSpeechRecognition].onStart(): recognition onend');
        onHandleStop();
          // Do nothing, because in BrowserSpeechRecognition it's controlled outside
      };

      this.recognition.start();
    } catch (err) {
      onError('Speech recognition is not supported in this browser');
    }
  }

  stop(): void {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
  }

  cleanup() {}
}
