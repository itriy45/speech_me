// Define the types internally since the imports are unresolved
interface Requirement {
  completedCategories: string[];
}

interface DialogueCategory {
  id: string;
  name: string;
  description: string;
  icon: MedicalIconName;
  dialogues: string[];
  isHidden: boolean;
  isLocked: boolean;
  requirement: Requirement;
  surveyLink?: string;
  surveyText?: string;
}

// Define medical icon types
type MedicalIconName = 'users' | 'heart-pulse' | 'scroll-text' | 'stethoscope' | string;

export const dialogueCategories: DialogueCategory[] = [
  {    
    id: 'English for doctors B1-B2',
    name: 'English for doctors B1-B2',
    description: 'Для курсу медичної англійської для досвідчених',
    icon: 'users',
    dialogues: [
      'patient-background-consultation',
      'second-conditional-medical',
      'medical-history-medications',
      'third-conditional-medical',
      'medical-phrasal-verbs-symptoms'
    ],
    isHidden: false,
    isLocked: false,
    requirement: {
      completedCategories: []
    }
  },
  {    
    id: 'medical-consultations',
    name: 'Coming soon...',
    description: '🐝 Працюємо над діалогами',
    icon: 'heart-pulse',
    dialogues: [
      'stomach-pain'
    ],
    isHidden: true,
    isLocked: true,
    requirement: {
      completedCategories: ['general-examination']
    },
    surveyLink: 'https://forms.gle/9k7VjiU9qJ4Mq76w5',
    surveyText: '📋 ГОЛОСУЙТЕ ЗА НОВИЙ ДІАЛОГ ТУТ'
  },
   {    
    id: 'Grammar dialogue',
    name: 'Practice medical grammar',
    description: 'Практикуйте граматику у медичному контексті',
    icon: 'scroll-text',
    dialogues: [
      'third-conditional-medical'
    ],
    isHidden: false,
    isLocked: false,
    requirement: {
      completedCategories: ['general-examination']
    },
    surveyLink: 'https://forms.gle/9k7VjiU9qJ4Mq76w5',
    surveyText: '📋 ГОЛОСУЙТЕ ЗА НОВИЙ ДІАЛОГ ТУТ'
  },
  {    
    id: 'example-with-audio',
    name: 'example-with-audio',
    description: 'Практикуйте граматику у медичному контексті',
    icon: 'scroll-text',
    dialogues: [
      'audio-example'
    ],
    isHidden: false,
    isLocked: false,
    requirement: {
      completedCategories: ['example-with-audio']
    },
    surveyLink: 'https://forms.gle/9k7VjiU9qJ4Mq76w5',
    surveyText: '📋 ГОЛОСУЙТЕ ЗА НОВИЙ ДІАЛОГ ТУТ'
  },


  
  {
    id: 'general-examination',
    name: 'General Examination',
    description: 'Practice general medical examination dialogues',
    icon: 'stethoscope',
    dialogues: [
      'general-examination'
    ],    
    isHidden: false,
    isLocked: false,
    requirement: {
      completedCategories: ['medical-consultations']
    },
       surveyLink: '',
    surveyText: '📋 ГОЛОСУЙТЕ ЗА НОВІ ДІАЛОГИ ТУТ'
  }
];

// Helper function to add new dialogues to categories
export const addDialogueToCategory = (categoryId: string, dialogueId: string) => {
  const category = dialogueCategories.find(c => c.id === categoryId);
  if (category && !category.dialogues.includes(dialogueId)) {
    category.dialogues.push(dialogueId);
  }
};

// Helper function to toggle category visibility
export const toggleCategoryVisibility = (categoryId: string, hidden: boolean) => {
  const category = dialogueCategories.find(c => c.id === categoryId);
  if (category) {
    category.isHidden = hidden;
  }
};

// Helper function to toggle category lock status
export const toggleCategoryLock = (categoryId: string, locked: boolean) => {
  const category = dialogueCategories.find(c => c.id === categoryId);
  if (category) {
    category.isLocked = locked;
  }
};

// Helper function to check if a category should be unlocked
export const shouldUnlockCategory = (categoryId: string, completedCategories: string[]): boolean => {
  const category = dialogueCategories.find(c => c.id === categoryId);
  if (!category || !category.requirement) return true;
  
  return category.requirement.completedCategories.every(
    requiredId => completedCategories.includes(requiredId)
  );
};

// Helper function to get unlock requirements text
export const getUnlockRequirements = (categoryId: string): string => {
  const category = dialogueCategories.find(c => c.id === categoryId);
  if (!category || !category.requirement || !category.requirement.completedCategories.length) {
    return '';
  }
  
  const requiredCategories = category.requirement.completedCategories
    .map(reqId => dialogueCategories.find(c => c.id === reqId)?.name)
    .filter(Boolean)
    .join(' and ');
  
  return `Complete ${requiredCategories} to unlock`;
};

// Helper function to update category icon
export const updateCategoryIcon = (categoryId: string, newIcon: MedicalIconName) => {
  const category = dialogueCategories.find(c => c.id === categoryId);
  if (category) {
    category.icon = newIcon;
  }
};

// New helper functions for survey functionality
export const updateCategorySurvey = (
  categoryId: string, 
  surveyLink: string, 
  surveyText?: string
) => {
  const category = dialogueCategories.find(c => c.id === categoryId);
  if (category) {
    category.surveyLink = surveyLink;
    if (surveyText) {
      category.surveyText = surveyText;
    }
  }
};

export const removeCategorySurvey = (categoryId: string) => {
  const category = dialogueCategories.find(c => c.id === categoryId);
  if (category) {
    delete category.surveyLink;
    delete category.surveyText;
  }
};