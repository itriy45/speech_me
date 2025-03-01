import { DialogueState, DialogueAction } from './types';
import { MedicalDialogue } from '../../types/medicalDialogue';
import { Message } from '../../types/dialogue';

export const initialState: DialogueState = {
  currentDialogue: null,
  currentSentenceIndex: 0,
  startTime: null,
  endTime: null,
  learnedWords: new Set(),
  hintsUsed: 0,
  skippedPhrases: new Set(),
  completedDialogues: new Set(),
  wordsSpoken: 0,
  messages: [],
  attempts: 0,
  isTyping: false,
  showingAnswer: false,
  isComplete: false,
  lastMessageId: null
};

export function dialogueReducer(state: DialogueState, action: DialogueAction): DialogueState {
  switch (action.type) {
    case 'SET_DIALOGUE':
      return {
        ...initialState,
        startTime: Date.now(),
        currentDialogue: action.payload
      };

    case 'ADD_MESSAGE': {
      // Only count explicit hint messages, not user messages or system responses
      const isHintMessage = action.payload.isHint && !action.payload.isUser;
      
      if (action.payload.isUser && action.payload.text) {
        const wordCount = action.payload.text.trim().split(/\s+/).length;
        // Add words to learned words when user answers correctly
        const newLearnedWords = action.payload.isCorrect && action.payload.expectedResponse
          ? new Set([...state.learnedWords, action.payload.expectedResponse])
          : state.learnedWords;
        
        return {
          ...state,
          messages: [...state.messages, { ...action.payload, wordCount }],
          wordsSpoken: state.wordsSpoken + wordCount,
          lastMessageId: action.payload.id || Date.now(),
          learnedWords: newLearnedWords
        };
      }
      
      if (action.payload.isUser && action.payload.text) {
        const wordCount = action.payload.text.trim().split(/\s+/).length;
        // Add words to learned words when user answers correctly
        const newLearnedWords = action.payload.isCorrect && action.payload.expectedResponse
          ? new Set([...state.learnedWords, action.payload.expectedResponse])
          : state.learnedWords;
        
        return {
          ...state,
          messages: [...state.messages, { ...action.payload, wordCount }],
          wordsSpoken: state.wordsSpoken + wordCount,
          lastMessageId: action.payload.id || Date.now(),
          learnedWords: newLearnedWords
        };
      }

      const newMessage = {
        ...action.payload,
        id: action.payload.id || Date.now()
      };

      return {
        ...state,
        messages: [...state.messages, newMessage],
        hintsUsed: isHintMessage ? state.hintsUsed + 1 : state.hintsUsed,
        lastMessageId: newMessage.id
      };
    }

    case 'UPDATE_LAST_MESSAGE': {
      if (!state.lastMessageId) return state;
      return {
        ...state,
        messages: state.messages.map(message => 
          message.id === state.lastMessageId
            ? { ...message, ...action.payload }
            : message
        )
      };
    }

    case 'UPDATE_MESSAGE': {
      return {
        ...state,
        messages: state.messages.map(message =>
          message.id === action.payload.id
            ? { ...message, ...action.payload.updates }
            : message
        )
      };
    }

    case 'INCREMENT_ATTEMPTS': {
      const nextAttempt = state.attempts + 1;
      return {
        ...state,
        attempts: nextAttempt,
        showingAnswer: nextAttempt >= 3
      };
    }

    case 'NEXT_SENTENCE':
      return {
        ...state,
        currentSentenceIndex: state.currentSentenceIndex + 1,
        isTyping: false,
        attempts: 0,
        showingAnswer: false,
        lastMessageId: null
      };

    case 'SKIP_STEP': {
      const { skippedIndex } = action.payload;
      return {
        ...state,
        skippedPhrases: new Set([...state.skippedPhrases, skippedIndex]),
        attempts: 0,
        showingAnswer: false,
        lastMessageId: null,
        // Do not increment currentSentenceIndex here as it will be handled by NEXT_SENTENCE
        isTyping: false
      };
    }

    case 'SET_TYPING':
      return {
        ...state,
        isTyping: action.payload
      };

    case 'SET_COMPLETE':
      return {
        ...state,
        endTime: Date.now(),
        completedDialogues: state.currentDialogue 
          ? new Set([...state.completedDialogues, state.currentDialogue.id])
          : state.completedDialogues,
        isTyping: false,
        isComplete: true
      };

    case 'ADD_LEARNED_WORD':
      return {
        ...state,
        learnedWords: new Set([...state.learnedWords, action.payload])
      };

    case 'MARK_COMPLETED':
      return {
        ...state,
        completedDialogues: new Set([...state.completedDialogues, action.payload])
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}