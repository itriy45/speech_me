import React, { useState, useEffect } from 'react';
import { ChevronRight, BookOpen, CheckCircle2 } from 'lucide-react';
import VocabularyModal from '../vocabulary/VocabularyModal';
import { loadDialogueResources } from '../../utils/dialogueLoader';

// Adding completion status to local storage utils
const COMPLETED_DIALOGUES_KEY = 'completed_dialogues';

const getCompletedDialogues = (): string[] => {
  try {
    const completed = localStorage.getItem(COMPLETED_DIALOGUES_KEY);
    if (!completed) return [];
    
    const parsedData = JSON.parse(completed);
    return Array.isArray(parsedData) ? parsedData : [];
  } catch (error) {
    console.error('Error reading completed dialogues:', error);
    return [];
  }
};

const setDialogueAsCompleted = (dialogueId: string): void => {
  try {
    const completed = getCompletedDialogues();
    if (!completed.includes(dialogueId)) {
      completed.push(dialogueId);
      localStorage.setItem(COMPLETED_DIALOGUES_KEY, JSON.stringify(completed));
    }
  } catch (error) {
    console.error('Error saving completed dialogue:', error);
  }
};

interface DialogueListItemProps {
  id: string;
  title: string;
  onClick: () => void;
  onStartDialogue?: () => void;
  isCompleted?: boolean;
  categoryId: string;
  onCompletion?: (dialogueId: string) => void;
}

export default function DialogueListItem({ 
  id, 
  title, 
  onClick, 
  onStartDialogue,
  isCompleted: propIsCompleted,
  categoryId,
  onCompletion 
}: DialogueListItemProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resources, setResources] = useState(null);
  const [isCompleted, setIsCompleted] = useState(propIsCompleted || false);

  useEffect(() => {
    // Check if dialogue is completed on mount
    const completedDialogues = getCompletedDialogues();
    setIsCompleted(completedDialogues.includes(id));
  }, [id]);

  const handleResourceClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!resources) {
      const dialogueResources = await loadDialogueResources(categoryId, id);
      setResources(dialogueResources);
    }
    
    setIsModalOpen(true);
  };

  const handleCompletion = () => {
    setDialogueAsCompleted(id);
    setIsCompleted(true);
    if (onCompletion) {
      onCompletion(id);
    }
  };

  return (
    <>
      <div 
        onClick={onClick}
        className={`group w-full bg-white rounded-xl border border-gray-300 
          hover:border-indigo-700 
          ${isCompleted
            ? 'hover:from-emerald-50 hover:to-white border-emerald-100' 
            : 'hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50'
          }
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50
          transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md`}
      >
        <div className="flex items-center p-4">
          <div className="flex-grow">
            <div className="flex items-center gap-3">
              <div className="relative">
                {isCompleted && (
                  <div className="absolute -left-1 -top-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                )}
                <span className={`text-base font-medium ${
                  isCompleted ? 'text-emerald-600' : 'text-indigo-900'
                } group-hover:text-indigo-700 transition-colors duration-300`}>
                  {title}
                </span>
              </div>
              {isCompleted && (
                <div className="flex items-center gap-1.5 px-3 py-1.5
                  bg-gradient-to-r from-emerald-50 to-emerald-100
                  border border-emerald-200 rounded-full shadow-sm
                  transition-all duration-300 group-hover:from-emerald-100 group-hover:to-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-600">
                    Completed
                  </span>
                  <div className="ml-1 flex space-x-0.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" style={{ animationDelay: '0.2s' }} />
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleResourceClick}
              className="relative p-2.5 rounded-full
                bg-indigo-50 text-indigo-700
                hover:bg-indigo-100 hover:text-indigo-800
                active:scale-95 group/btn
                transition-all duration-300
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                border border-indigo-100/50
                shadow-sm hover:shadow-md"
              aria-label="View vocabulary and grammar"
            >
              <div className="absolute inset-0 rounded-full opacity-0 
                group-hover/btn:opacity-100 transition-opacity duration-300
                bg-gradient-to-r from-indigo-100/80 to-purple-50/80 blur-[2px]"></div>
              
              <BookOpen className="w-5 h-5 relative z-10 transition-transform 
                duration-300 group-hover/btn:scale-110" />
            </button>

            <ChevronRight className="w-5 h-5 text-gray-500 
              group-hover:text-indigo-700 group-hover:translate-x-1 
              transition-all duration-300" />
          </div>
        </div>
      </div>

      {resources && (
        <VocabularyModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          resources={resources}
          onStartDialogue={() => {
            setIsModalOpen(false);
            onClick();
          }}
        />
      )}
    </>
  );
}