import { useState, useEffect } from 'react';
import { MedicalDialogue } from '../types/medicalDialogue';
import { loadDialogue } from '../utils/dialogueLoader';

export function useDialogues(categoryId: string, dialogueIds: string[]) {
  const [dialogues, setDialogues] = useState<Record<string, MedicalDialogue>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDialogues() {
      setLoading(true);
      setError(null);
      
      try {
        const loadedDialogues = await Promise.all(
          dialogueIds.map(async id => {
            try {
              const dialogue = await loadDialogue(categoryId, id);
              return [id, dialogue] as [string, MedicalDialogue];
            } catch (error) {
              console.error(`Failed to load dialogue: ${id}`, error);
              return null;
            }
          })
        );

        const dialogueMap = Object.fromEntries(
          loadedDialogues.filter((r): r is [string, MedicalDialogue] => r !== null)
        );
        
        setDialogues(dialogueMap);
      } catch (error) {
        setError('Failed to load dialogues');
        console.error('Error loading dialogues:', error);
      } finally {
        setLoading(false);
      }
    }

    if (categoryId && dialogueIds.length > 0) {
      loadDialogues();
    }
  }, [categoryId, dialogueIds]);

  return { dialogues, loading, error };
}