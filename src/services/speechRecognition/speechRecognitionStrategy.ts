export default interface SpeechRecognitionStrategy {
    start(onTranscript: (text: string) => void, onError: (error: string) => void, sound: HTMLAudioElement | null, onHandleStop: () => void): void;
    stop(): void;
}
