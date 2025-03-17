export default interface SpeechRecognitionStrategy {
    start(onTranscript: (text: string) => void, onError: (error: string) => void, sound: HTMLAudioElement | null, errorSound: HTMLAudioElement | null, onHandleStop: () => void): void;
    stop(): void;
    cleanup(): void;
}
