export default interface SpeechRecognitionStrategy {
    start(onTranscript: (text: string) => void, onError: (error: string) => void, sound: HTMLAudioElement | null, onHandleStop: () => void, onHandleTextSubmit: () => void): void;
    stop(): void;
}
