import { MedicalDialogue } from '../../types/medicalDialogue';
import { Message } from '../../types/dialogue';

export interface DialogueState {
  currentDialogue: MedicalDialogue | null;
  currentSentenceIndex: number;
  messages: Message[];
  attempts: number;
  hintsUsed: number;
  showingAnswer: boolean;
  isTyping: boolean;
  isComplete: boolean;
  lastMessageId: number | null;
  completedDialogues: Set<string>;
  skippedPhrases: Set<number>;
  wordsSpoken: number;
  startTime: number | null;
  endTime: number | null;
  learnedWords: Set<string>;
}

export type DialogueAction =
  | { type: 'SET_DIALOGUE'; payload: MedicalDialogue }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_LAST_MESSAGE'; payload: Partial<Message> }
  | { type: 'UPDATE_MESSAGE'; payload: { id: number; updates: Partial<Message> } }
  | { type: 'INCREMENT_ATTEMPTS' }
  | { type: 'NEXT_SENTENCE' }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'SET_COMPLETE' }
  | { type: 'MARK_COMPLETED'; payload: string }
  | { type: 'ADD_LEARNED_WORD'; payload: string }
  | { type: 'SKIP_STEP' }
  | { type: 'RESET' };

export interface DialogueContextType {
  state: DialogueState;
  dispatch: React.Dispatch<DialogueAction>;
  handleTranscript: (text: string) => void;
}