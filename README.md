# Medical Dialogue App

A React-based application for practicing medical English dialogues with speech recognition and audio playback capabilities.

## Using Audio Files in Dialogues

The application supports both text-to-speech synthesis and pre-recorded audio files for dialogue playback.

### Adding Audio URLs to Dialogue JSON Files

To use pre-recorded audio files in your dialogues, add `audioUrl` and `responseAudioUrl` properties to the dialogue steps in your JSON files:

```json
{
  "type": "conversation",
  "teacherApp": "How do you say in English: У вас є якісь серйозні або хронічні захворювання?",
  "expectedResponse": "Do you have any severe or chronic diseases?",
  "ukrainian": "У вас є якісь серйозні або хронічні захворювання?",
  "audioUrl": "https://example.com/audio/dialogue/severe-diseases-instruction.mp3",
  "responseAudioUrl": "https://example.com/audio/dialogue/severe-diseases-response.mp3"
}
```

### Audio Properties

- `audioUrl`: The URL to the audio file for the instruction or prompt
- `responseAudioUrl`: The URL to the audio file for the expected response

### Supported Audio Formats

For maximum browser compatibility, use MP3 or WAV formats. Make sure your audio files are hosted on a CDN or server with proper CORS headers.

### Fallback Behavior

If an audio URL is provided but fails to load or play, the system will automatically fall back to using speech synthesis based on the text content.

## Example

See the example dialogue with audio URLs in `src/data/dialogues/example-with-audio/audio-example.json`.