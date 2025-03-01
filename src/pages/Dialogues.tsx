import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import DialogueListItem from '../components/dialogue/DialogueListItem';
import { 
  ChevronRight, 
  Lock, 
  ExternalLink, 
  CheckCircle2,
  ArrowLeft,
  Stethoscope,
  Users,
  Heart,
  HeartPulse,
  Brain,
  Pill,
  Activity,
  ClipboardCheck,
  Microscope,
  BookOpen,
  Building2,
  ScrollText,
  Baby,
  Thermometer,
  Syringe,
  Waves,
  Loader2
} from 'lucide-react';
import { dialogueCategories } from '../data/dialogueCategories';
import { useDialogues } from '../hooks/useDialogues';
import { useDialogueContext } from '../context/dialogue';
import { DialogueCategory } from '../types/medicalDialogue';

const getCategoryIcon = (iconName: string) => {
  const icons: { [key: string]: React.ElementType } = {
    'stethoscope': Stethoscope,
    'users': Users,
    'heart': Heart,
    'heart-pulse': HeartPulse,
    'brain': Brain,
    'pill': Pill,
    'activity': Activity,
    'clipboard-check': ClipboardCheck,
    'microscope': Microscope,
    'book-open': BookOpen,
    'building-2': Building2,
    'scroll-text': ScrollText,
    'baby': Baby,
    'thermometer': Thermometer,
    'syringe': Syringe,
    'waves': Waves
  };
  const IconComponent = icons[iconName] || Stethoscope;
  return <IconComponent className="w-5 h-5" />;
};

// Updated icon colors to match new theme
const iconColors: { [key: string]: string } = {
  'stethoscope': '#4338ca', // indigo-700
  'users': '#6366f1', // indigo-500
  'heart': '#7c3aed', // purple-600
  'heart-pulse': '#6d28d9', // purple-700
  'brain': '#4338ca', // indigo-700
  'pill': '#7c3aed', // purple-600
  'activity': '#4338ca', // indigo-700
  'clipboard-check': '#6366f1', // indigo-500
  'microscope': '#7c3aed', // purple-600
  'book-open': '#4338ca', // indigo-700
  'building-2': '#6366f1', // indigo-500
  'scroll-text': '#7c3aed', // purple-600
  'baby': '#4338ca', // indigo-700
  'thermometer': '#6366f1', // indigo-500
  'syringe': '#7c3aed', // purple-600
  'waves': '#4338ca' // indigo-700
};

export default function Dialogues() {
  const { categoryId } = useParams();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryId || null);
  const navigate = useNavigate();
  const { state } = useDialogueContext();
  const location = useLocation();
  const visibleCategories = dialogueCategories.filter(category => !category.isHidden);
  
  useEffect(() => {
    if (categoryId) {
      setSelectedCategory(categoryId);
    }
  }, [categoryId]);
  
  useEffect(() => {
    if (location.state?.selectedCategory) {
      setSelectedCategory(location.state.selectedCategory);
    }
  }, [location.state]);

  const { dialogues, loading } = useDialogues(
    selectedCategory || '',
    selectedCategory 
      ? visibleCategories.find(c => c.id === selectedCategory)?.dialogues || []
      : []
  );

  const handleGoBack = () => {
    if (selectedCategory) {
      navigate('/dialogues');
      setSelectedCategory(null);
    } else {
      navigate('/');
    }
  };

  const handleCategorySelect = (category: DialogueCategory) => {
    if (category.isLocked) {
      return;
    }
    navigate(`/dialogues/${category.id}`);
    setSelectedCategory(category.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white">
      {/* Оновлений заголовок */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-indigo-50 via-indigo-100 to-purple-100 shadow-sm z-20">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleGoBack}
              className="p-2 rounded-full hover:bg-indigo-50 active:scale-95
                transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label={selectedCategory ? 'Back to categories' : 'Back to home'}
            >
              <ArrowLeft className="w-5 h-5 text-indigo-700" />
            </button>
            <h1 className="text-xl font-semibold text-indigo-900">
              {selectedCategory 
                ? visibleCategories.find(c => c.id === selectedCategory)?.name
                : 'Medical Library'
              }
            </h1>
          </div>
        </div>
      </div>

      {location.state?.completionMessage && (
        <div className="fixed top-14 left-0 right-0 bg-emerald-50 border-b border-emerald-200 z-10 animate-fade-in">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <p className="text-emerald-600 text-center font-medium">
              {location.state.completionMessage}
            </p>
          </div>
        </div>
      )}

      <div className="pt-1 px-4 pb-6">
        <div className="max-w-3xl mx-auto">
          <div className={`${location.state?.completionMessage ? 'pt-12' : 'pt-4'}`}>
            {!selectedCategory ? (
              <div className="space-y-4">
                {visibleCategories.map(category => (
                  <div key={category.id} className="w-full">
                    <button
                      onClick={() => handleCategorySelect(category)}
                      className={`group w-full bg-white rounded-xl border 
                        ${category.isLocked 
                          ? 'border-gray-300 cursor-not-allowed' 
                          : 'border-gray-300 hover:border-indigo-700 hover:shadow-md'} 
                        focus:outline-none focus:ring-2 focus:ring-indigo-500 
                        transition-all duration-300 relative overflow-hidden`}
                      aria-label={`Open ${category.name} category ${category.isLocked ? '(Locked)' : ''}`}
                      disabled={category.isLocked}
                    >
                      <div className="flex items-center p-6 sm:p-8">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-xl
                          flex items-center justify-center transition-all duration-300
                          ${category.isLocked ? 'bg-gray-50' : 'bg-indigo-50 group-hover:bg-indigo-100 group-hover:scale-110'}`}
                          style={{ color: category.isLocked ? '#9CA3AF' : iconColors[category.icon] }}>
                          {getCategoryIcon(category.icon)}
                        </div>
                        <div className="ml-4 flex-grow text-left">
                          <div className="flex items-center gap-2">
                            <h2 className={`text-base sm:text-lg font-medium 
                              ${category.isLocked ? 'text-gray-600' : 'text-indigo-900 group-hover:text-indigo-700'} 
                              transition-colors duration-200`}>
                              {category.name}
                            </h2>
                            {category.isLocked && (
                              <Lock className="w-4 h-4 text-gray-500" />
                            )}
                          </div>
                          <p className="text-sm sm:text-base text-gray-600 mt-1 group-hover:text-gray-600 transition-colors duration-200">
                            {category.description}
                          </p>
                          {category.isLocked && category.surveyLink && (
                            <a
                              href={category.surveyLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 inline-flex items-center px-4 py-2 text-sm font-medium
                                bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700
                                hover:from-indigo-700 hover:via-indigo-800 hover:to-purple-800
                                text-white
                                rounded-lg shadow-md hover:shadow-lg
                                transition-all duration-300 group/link"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(category.surveyLink, '_blank');
                              }}
                            >
                              <span className="group-hover/link:translate-x-0.5 transition-transform duration-200">
                                {category.surveyText || 'Take our survey'}
                              </span>
                              <ExternalLink className="ml-2 w-4 h-4 group-hover/link:translate-x-1 
                                transition-transform duration-200" />
                            </a>
                          )}
                        </div>
                        <ChevronRight className={`w-5 h-5 ml-4
                          ${category.isLocked 
                            ? 'text-gray-300' 
                            : 'text-gray-500 group-hover:text-indigo-700 group-hover:translate-x-1'} 
                          transition-all duration-300`} />
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-700" />
                      <p className="text-sm text-gray-600">Loading dialogues...</p>
                    </div>
                  </div>
                ) : (
                  visibleCategories
                    .find(c => c.id === selectedCategory)
                    ?.dialogues.map(dialogueId => {
                      const dialogue = dialogues[dialogueId];
                      return (
                        <DialogueListItem
                          key={dialogueId}
                          id={dialogueId}
                          title={dialogue?.title || 'Loading...'}
                          onClick={() => navigate(`/practice/${selectedCategory}/${dialogueId}`)}
                          isCompleted={state.completedDialogues.has(dialogueId)}
                          categoryId={selectedCategory}
                        />
                      );
                    })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}