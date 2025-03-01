import { IconName } from 'lucide-react';

export interface Milestone {
  id: string;
  wordsRequired: number;
  title: string;
  description: string;
  icon: IconName;
  isAchieved: boolean;
  achievedDate?: Date;
}

export interface MilestoneProgress {
  currentWords: number;
  nextMilestone: Milestone;
  progressToNext: number;
  achievedMilestones: Milestone[];
}