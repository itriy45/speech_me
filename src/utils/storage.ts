import { HistoryEntry } from '../types/history';
import { Milestone } from '../types/milestone';

const HISTORY_KEY = 'medical_dialogue_history';
const MILESTONES_KEY = 'medical_dialogue_milestones';
const COMPLETED_DIALOGUES_KEY = 'completed_dialogues';
const LEARNED_WORDS_KEY = 'learned_words';

export function saveLearnedWords(words: string[]) {
  const existingWords = loadLearnedWords();
  const uniqueWords = new Set([...existingWords, ...words]);
  localStorage.setItem(LEARNED_WORDS_KEY, JSON.stringify(Array.from(uniqueWords)));
}

export function loadLearnedWords(): string[] {
  const stored = localStorage.getItem(LEARNED_WORDS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
}

export function saveCompletedDialogue(dialogueId: string, completedAt: Date) {
  const completed = loadCompletedDialogues();
  completed[dialogueId] = { 
    completedAt,
    timestamp: Date.now()
  };
  localStorage.setItem(COMPLETED_DIALOGUES_KEY, JSON.stringify(completed));
  
  // Dispatch custom event for completion
  window.dispatchEvent(new CustomEvent('dialogueCompleted', {
    detail: { dialogueId, completedAt }
  }));
}

export function saveDialogueStats(dialogueId: string, stats: {
  hintsUsed: number;
  wordsSpoken: number;
  completedAt: Date;
}) {
  const key = `dialogue_stats_${dialogueId}`;
  localStorage.setItem(key, JSON.stringify(stats));
}

export function loadDialogueStats(dialogueId: string) {
  const key = `dialogue_stats_${dialogueId}`;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : null;
}
export function loadCompletedDialogues(): Record<string, { 
  completedAt: Date;
  timestamp: number;
}> {
  const stored = localStorage.getItem(COMPLETED_DIALOGUES_KEY);
  return stored ? JSON.parse(stored) : {};
}

export function loadHistory(): HistoryEntry[] {
  const stored = localStorage.getItem(HISTORY_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveMilestones(milestones: Milestone[]) {
  localStorage.setItem(MILESTONES_KEY, JSON.stringify(milestones));
}

export function loadMilestones(): Milestone[] {
  const stored = localStorage.getItem(MILESTONES_KEY);
  return stored ? JSON.parse(stored) : [];
}