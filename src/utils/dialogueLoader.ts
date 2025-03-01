import { MedicalDialogue } from '../types/medicalDialogue';
import { DialogueResources } from '../types/vocabulary';

// Use Vite's import.meta.glob to load all dialogue files
const dialogueFiles = import.meta.glob('../data/dialogues/**/*.json', { eager: true });
const resourceFiles = import.meta.glob('../data/resources/**/*.json', { eager: true });

export async function loadDialogue(categoryId: string, dialogueId: string): Promise<MedicalDialogue> {
  try {
    // Normalize the path to match Vite's import.meta.glob pattern
    const dialoguePath = `../data/dialogues/${categoryId}/${dialogueId}.json`;
    const dialogue = dialogueFiles[dialoguePath];
    
    if (!dialogue) {
      throw new Error(`Dialogue not found: ${dialogueId}`);
    }
    
    return dialogue.default as MedicalDialogue;
  } catch (error) {
    console.error(`Failed to load dialogue: ${categoryId}/${dialogueId}`, error);
    throw error;
  }
}

export async function loadDialogueResources(categoryId: string, dialogueId: string): Promise<DialogueResources> {
  try {
    const resourcePath = `../data/resources/${categoryId}/${dialogueId}.json`;
    const resources = resourceFiles[resourcePath];
    
    if (!resources) {
      throw new Error(`Resources not found: ${dialogueId}`);
    }
    
    return resources.default as DialogueResources;
  } catch (error) {
    console.error(`Failed to load resources: ${categoryId}/${dialogueId}`, error);
    throw error;
  }
}

// Helper function to get all available dialogues
export async function getAllDialogues(): Promise<Record<string, MedicalDialogue>> {
  const dialogues: Record<string, MedicalDialogue> = {};
  
  for (const path in dialogueFiles) {
    const dialogue = (dialogueFiles[path] as { default: MedicalDialogue }).default;
    dialogues[dialogue.id] = dialogue;
  }
  
  return dialogues;
}

// Function to verify audio URLs in dialogue
export function verifyAudioUrls(dialogue: MedicalDialogue): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  dialogue.conversation.forEach((step, index) => {
    if (step.audioUrl) {
      try {
        const url = new URL(step.audioUrl);
        if (!url.protocol.startsWith('http')) {
          issues.push(`Step ${index+1}: Invalid audio URL protocol - ${step.audioUrl}`);
        }
      } catch (error) {
        issues.push(`Step ${index+1}: Invalid audio URL format - ${step.audioUrl}`);
      }
    }
    
    if (step.responseAudioUrl) {
      try {
        const url = new URL(step.responseAudioUrl);
        if (!url.protocol.startsWith('http')) {
          issues.push(`Step ${index+1}: Invalid response audio URL protocol - ${step.responseAudioUrl}`);
        }
      } catch (error) {
        issues.push(`Step ${index+1}: Invalid response audio URL format - ${step.responseAudioUrl}`);
      }
    }
  });
  
  return {
    valid: issues.length === 0,
    issues
  };
}