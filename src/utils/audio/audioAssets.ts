// Central storage for predefined audio assets used across the app
export const AUDIO_ASSETS = {
  HINTS: {
    FIRST_HINT: "https://res.cloudinary.com/dniififlx/video/upload/v1740062070/ElevenLabs_Cassidy_Voice_Feb_20_2025_jd0ah9.mp3",
    SECOND_HINT: "https://res.cloudinary.com/dniififlx/video/upload/v1740062070/ElevenLabs_Cassidy_Voice_Feb_20_2025_jd0ah9.mp3", 
    FINAL_HINT: "https://res.cloudinary.com/dniififlx/video/upload/v1740090069/dialogues/ppzod3blqn0v8kepeqad.mp3"
  },
  SUCCESS: {
    CORRECT: [
      "",
      "",
      ""
    ],
    EXCELLENT: ""
  },
  GENERAL: {
    INSTRUCTION: ""
  }
};

/**
 * Get a predefined audio URL for hint messages based on attempt number
 * @param attempt Current attempt number
 * @returns URL to audio file for this hint
 */
export function getHintAudioUrl(attempt: number): string {
  switch (attempt) {
    case 1:
      return AUDIO_ASSETS.HINTS.FIRST_HINT;
    case 2:
      return AUDIO_ASSETS.HINTS.SECOND_HINT;
    case 3:
    default:
      return AUDIO_ASSETS.HINTS.FINAL_HINT;
  }
}

/**
 * Get a random success audio URL
 * @returns URL to a random success audio file
 */
export function getRandomSuccessAudioUrl(): string {
  const successAudios = AUDIO_ASSETS.SUCCESS.CORRECT;
  const randomIndex = Math.floor(Math.random() * successAudios.length);
  return successAudios[randomIndex];
}

/**
 * Get the appropriate audio URL for a specific message type
 * or use a provided URL if available
 * 
 * @param type Message type
 * @param customAudioUrl Custom audio URL from dialogue definition
 * @param attempt Current attempt number (for hints)
 * @returns The audio URL to use
 */
export function getAudioUrlForMessage(
  type: 'instruction' | 'hint' | 'success' | 'conversation' | 'vocabulary',
  customAudioUrl?: string,
  attempt: number = 0
): string | undefined {
  // Always prioritize custom audio URLs from dialogue definitions
  if (customAudioUrl) return customAudioUrl;
  
  // Fall back to predefined assets for common message types
  switch (type) {
    case 'instruction':
      return AUDIO_ASSETS.GENERAL.INSTRUCTION;
    case 'hint':
      return getHintAudioUrl(attempt);
    case 'success':
      return getRandomSuccessAudioUrl();
    default:
      return undefined;
  }
}