export default interface SpeechRecognitionStrategy {
    start(onTranscript: (text: string) => void, onError: (error: string) => void, sound: HTMLAudioElement | null, onHandleStop: (automatic?: boolean) => void, onHandleTextSubmit: () => void): void;
    stop(): void;
    cleanup(): void;
}
