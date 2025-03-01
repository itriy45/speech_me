import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { dialogueCategories } from '../data/dialogueCategories';
import DialogueBox from '../components/dialogue/DialogueBox';
import DialogueHeader from '../components/dialogue/DialogueHeader';
import SpeechInput from '../components/SpeechInput';
import { useDialogueContext } from '../context/dialogue';
import { loadDialogue, verifyAudioUrls } from '../utils/dialogueLoader';
import { MedicalDialogue } from '../types/medicalDialogue';
import CompletionMessage from '../components/CompletionMessage';

export default function DialoguePlayer() {
  const { categoryId, dialogueId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch, handleTranscript } = useDialogueContext();
  const [currentDialogue, setCurrentDialogue] = useState<MedicalDialogue | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLastInCategory, setIsLastInCategory] = useState(false);
  const [audioValidationIssues, setAudioValidationIssues] = useState<string[]>([]);

  useEffect(() => {
    if (categoryId && dialogueId) {
      const category = dialogueCategories.find(c => c.id === categoryId);
      if (category) {
        const currentIndex = category.dialogues.indexOf(dialogueId);
        setIsLastInCategory(currentIndex === category.dialogues.length - 1);
      }
    }
  }, [categoryId, dialogueId]);

  useEffect(() => {
    async function loadCurrentDialogue() {
      if (!categoryId || !dialogueId) {
        navigate('/dialogues');
        return;
      }
      try {
        setLoading(true);
        const dialogue = await loadDialogue(categoryId, dialogueId);
        setCurrentDialogue(dialogue);

        // Validate audio URLs
        const validation = verifyAudioUrls(dialogue);
        if (!validation.valid) {
          console.warn('Audio URL validation issues:', validation.issues);
          setAudioValidationIssues(validation.issues);
        }

        dispatch({ type: 'RESET' });
        dispatch({ type: 'SET_DIALOGUE', payload: dialogue });

        if (dialogue.conversation[0]) {
          dispatch({
            type: 'ADD_MESSAGE',
            payload: {
              id: Date.now(),
              text: dialogue.conversation[0].ukrainian || dialogue.conversation[0].teacherApp,
              isUser: false,
              type: dialogue.conversation[0].type,
              audioUrl: dialogue.conversation[0].audioUrl // Make sure to pass the audio URL
            }
          });
        }
      } catch (error) {
        console.error('Failed to load dialogue:', error);
        navigate('/dialogues');
      } finally {
        setLoading(false);
      }
    }
    loadCurrentDialogue();
  }, [categoryId, dialogueId, dispatch, navigate]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!currentDialogue) {
    return null;
  }

  const totalSteps = currentDialogue.conversation.length;
  const currentProgress = state.currentSentenceIndex;
  const progressPercentage = totalSteps > 0 
    ? Math.round((currentProgress / totalSteps) * 100)
    : 0;

  return (
    <div className="fixed inset-0 bg-gray-50">
      <DialogueHeader 
        title={currentDialogue.title}
        progress={progressPercentage}
      />
      
      {/* Audio URL validation issues warning */}
      {audioValidationIssues.length > 0 && (
        <div className="fixed top-16 left-0 right-0 bg-amber-50 border-b border-amber-200 py-2 px-4 z-40">
          <div className="max-w-3xl mx-auto">
            <p className="text-amber-700 text-sm">
              <strong>Warning:</strong> Some audio URLs may not be valid. Check the console for details.
            </p>
          </div>
        </div>
      )}
      
      {/* Dialogue Content */}
      <div className="h-[calc(100vh-8rem)]">
        <div className="h-full max-w-3xl mx-auto">
          <DialogueBox 
            messages={state.messages} 
            attempts={state.attempts}
          />
        </div>
      </div>
      <SpeechInput onTranscript={handleTranscript} />
      {state.isComplete && (
        <CompletionMessage
          dialogueTitle={currentDialogue.title}
          startTime={state.startTime || Date.now()}
          endTime={state.endTime || Date.now()}
          learnedWords={state.learnedWords}
          hintsUsed={state.hintsUsed}
          wordsSpoken={state.wordsSpoken}
          categoryId={categoryId || ''}
          dialogueId={dialogueId || ''}
          isLastInCategory={isLastInCategory}
        />
      )}
    </div>
  );
}