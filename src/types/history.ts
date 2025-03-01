export interface HistoryEntry {
  id: string;
  dialogueId: string;
  isCompleted: boolean;
  completedAt: Date;
  date: Date;
  wordsSpoken: number;
  correctAnswers: number;
  totalAttempts: number;
  completionPercent: number;
  accuracy: number;
}