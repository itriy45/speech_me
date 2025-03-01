import { HintGeneratorOptions } from '../../types/hint';
import { HINT_MESSAGES } from './hintMessages';
import { getAudioUrlForMessage } from '../audio/audioAssets';

export function generateHint({ answer, attempt, totalWords, firstWord }: HintGeneratorOptions): string {
  switch (attempt) {
    case 1:
      // First hint with word count and starting word
      return `💡 The sentence starts with "${firstWord}" and has ${totalWords} words`;
    
    case 2:
      // Second hint with partially masked answer
      return `🎯 Try this one: ${generatePartialAnswer(answer)}`;
    
    case 3:
      // Final hint with full answer
      return `✨ The correct answer is: "${answer}"`;
    
    default:
      return `${HINT_MESSAGES.REPEAT_ANSWER} 🔄`;
  }
}

// Get the audio URL for a hint based on the attempt number
export function getHintAudioUrl(attempt: number): string | undefined {
  return getAudioUrlForMessage('hint', undefined, attempt);
}

function generatePartialAnswer(answer: string): string {
  return answer.split(' ').map(word => {
    if (word.length <= 2) return word;
    
    // Show approximately half of each word
    const showLength = Math.ceil(word.length / 2);
    const revealed = word.slice(0, showLength);
    const hidden = '_'.repeat(word.length - showLength);
    
    return revealed + hidden;
  }).join(' ');
}