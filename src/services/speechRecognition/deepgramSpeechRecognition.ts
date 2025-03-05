import SpeechRecognitionStrategy from './speechRecognitionStrategy';
import {DeepgramClient, ListenLiveClient, LiveTranscriptionEvents, SOCKET_STATES} from '@deepgram/sdk';

export default class DeepgramSpeechRecognition implements SpeechRecognitionStrategy {
    private static WORDS_SEPARATOR = ' ';
    private static MEDIA_BATCH_SIZE_MS = 250;
    private static SPEECH_DURATION_MAX_MS = 15000;
    private static SPEECH_DURATION_INCREMENT_MS = 1000;
    private client: DeepgramClient;
    private dgSocket: ListenLiveClient | null = null;
    private keepAliveInterval: NodeJS.Timeout | null = null;
    private mediaRecorder: MediaRecorder | null = null;
    private stream: MediaStream | null = null;
    private lastSpeechDuration = 0;
    private speechInProgress = false;
    private speechInterval: NodeJS.Timeout | null = null;
    private transcripts: string[] = [];
    private temporaryTranscripts: string[] = [];
    private temporaryTranscript = '';
    private preferredMimeType: string;
    private audioCtx: AudioContext | null = null;

    constructor(client: DeepgramClient, _language: string, preferredMimeType: string) {
        this.client = client;
        this.preferredMimeType = preferredMimeType;
        this.audioCtx = new AudioContext();
        if (this.dgSocket) {
            this.dgSocket.requestClose();
        }
    }

    start(onTranscript: (text: string) => void, onError: (error: string) => void, sound: HTMLAudioElement | null, onHandleStop: (automatic?: boolean) => void, onHandleTextSubmit: () => void) {
        this.lastSpeechDuration = 0;
        this.speechInProgress = false;
        this.speechInterval = null;
        this.transcripts = [];
        this.temporaryTranscripts = [];

        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        } else if (!this.audioCtx) {
            console.error("Audio context couldn't be initialized");
            return;
        }

        const dest: MediaStreamAudioDestinationNode = this.audioCtx.createMediaStreamDestination();

        try {
            // 1. Get User Media
            navigator.mediaDevices.getUserMedia({ audio: true }).then(micStream => {
                this.stream = micStream;

                if (!MediaRecorder.isTypeSupported(this.preferredMimeType)) {
                    console.error('Browser is not supported');
                    return;
                }

                const src = this.audioCtx!.createMediaStreamSource(micStream);
                src.connect(dest);
            
                // 2. Create MediaRecorder
                if (!this.mediaRecorder) {
                    this.mediaRecorder = new MediaRecorder(this.stream, {
                        mimeType: this.preferredMimeType
                    });
                }

                if (!this.dgSocket) {
                    // 3. Establish Deepgram Connection
                    const dgOptions = {
                        model: 'nova-3',
                        interim_results: true,
                        vad_events: true
                    };
                    this.dgSocket = this.client.listen.live(dgOptions);

                    // 4. Handle Keep-Alive
                    if (this.keepAliveInterval) {
                        clearInterval(this.keepAliveInterval);
                    }
                    this.keepAliveInterval = setInterval(() => {
                        this.dgSocket?.keepAlive();
                    }, 3000);
                }

                // 5. Handle Deepgram Events
                this.dgSocket.on(LiveTranscriptionEvents.Open, () => {
                    sound?.play();

                    this.dgSocket?.on(LiveTranscriptionEvents.Transcript, transcription => {
                        const received = transcription.channel.alternatives[0].transcript;
                        if (received && received.trim().length > 0 && this.dgSocket?.getReadyState() === SOCKET_STATES.open) { // TODO: check 2nd statement
                            if (this.temporaryTranscript && !received.includes(this.temporaryTranscript)) {
                                this.temporaryTranscripts.push(this.temporaryTranscript);
                            }
                            this.temporaryTranscript = received;
                            if (transcription.is_final === true) {
                                this.transcripts.push(this.temporaryTranscript);
                                this.temporaryTranscripts = [...this.transcripts];
                            }
                            const currentTranscription = this.temporaryTranscripts.length > 0 && this.temporaryTranscripts[this.temporaryTranscripts.length - 1].includes(this.temporaryTranscript) ?
                                this.temporaryTranscripts.join(DeepgramSpeechRecognition.WORDS_SEPARATOR) :
                                this.temporaryTranscripts.join(DeepgramSpeechRecognition.WORDS_SEPARATOR).concat(DeepgramSpeechRecognition.WORDS_SEPARATOR).concat(this.temporaryTranscript);
                            onTranscript(currentTranscription);
                        }
                    });

                    this.dgSocket?.on(LiveTranscriptionEvents.Error, err => {
                        onError(`Deepgram error: ${err.message}`);
                        onHandleStop();
                    });

                    // this.dgSocket?.on(LiveTranscriptionEvents.Close, () => {
                    //     console.log('Connection closed', this.transcripts, this.dgSocket?.getReadyState());
                    //     onTranscript(this.transcripts.join(DeepgramSpeechRecognition.WORDS_SEPARATOR));
                    //     onHandleStop();
                    // });

                    this.dgSocket?.on(LiveTranscriptionEvents.SpeechStarted, () => {
                        if (!this.speechInProgress) {
                            this.speechInProgress = true;
                            this.speechInterval = setInterval(() => {
                                if (this.lastSpeechDuration < DeepgramSpeechRecognition.SPEECH_DURATION_MAX_MS) {
                                    this.lastSpeechDuration += DeepgramSpeechRecognition.SPEECH_DURATION_INCREMENT_MS;
                                } else {
                                    this.speechInProgress = false;
                                    this.lastSpeechDuration = 0;
                                    if (this.speechInterval) {
                                        clearInterval(this.speechInterval);
                                    }

                                    onHandleTextSubmit();
                                    onHandleStop(true);
                                }
                            }, 1000);
                        }
                    });

                    // 6. Send Audio Data to Deepgram
                    this.mediaRecorder?.addEventListener('dataavailable', event => {
                        if (event.data.size > 0) {
                            this.dgSocket?.send(event.data);
                        }
                    });

                    this.mediaRecorder?.addEventListener('error', event => {
                        onError(`MediaRecorder error: ${event.error}`);
                        onHandleStop();
                    });

                    this.mediaRecorder?.start(DeepgramSpeechRecognition.MEDIA_BATCH_SIZE_MS);
                });

            });
        } catch (error) {
            onError(`Failed to start Deepgram recognition: ${error}`);
            onHandleStop();
        }
    }

    stop() {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            return;
        }
        this.audioCtx?.suspend();
        if (this.mediaRecorder?.state === 'recording') {
            this.mediaRecorder.stop();
        }
        if (this.dgSocket && this.dgSocket.getReadyState() === SOCKET_STATES.open) {
            this.dgSocket.requestClose();
        }
        
        this.dgSocket = null;
        this.stream?.getTracks().forEach(track => track.stop());
        this.stream = null;
        this.mediaRecorder = null;

        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
        }
        this.speechInProgress = false;
        this.lastSpeechDuration = 0;
        if (this.speechInterval) {
            clearInterval(this.speechInterval);
            this.speechInterval = null;
        }
        this.temporaryTranscript = '';
    }

    cleanup() {
        this.stop();
    }
}
