import React, { useState, useEffect, useRef } from 'react';
import { X, Volume2, Book, GraduationCap, ChevronRight, ChevronLeft, RotateCw, Play, RefreshCw, Check } from 'lucide-react';
import { DialogueResources } from '../../types/vocabulary';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';

interface VocabularyModalProps {
  isOpen: boolean;
  onClose: () => void;
  resources: DialogueResources;
  onStartDialogue: () => void;
}

// Grammar Practice Component
interface GrammarPracticeProps {
  grammarRules: GrammarRule[];
  onStartDialogue: () => void;
}

interface GrammarPractice {
  question: string;
  answer: string;
  options: string[];
}

interface GrammarRule {
  tense: string;
  notes: string;
  practice: GrammarPractice;
}

// Grammar Practice Component
const GrammarPractice: React.FC<{ grammarRules: GrammarRule[] }> = ({ grammarRules }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: string]: string}>({});
  const [showResults, setShowResults] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [score, setScore] = useState(0);
  const currentRule = grammarRules[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / grammarRules.length) * 100;

  const calculateScore = () => {
    let correct = 0;
    Object.entries(selectedAnswers).forEach(([question, answer]) => {
      const rule = grammarRules.find(r => r.practice.question === question);
      if (rule && answer === rule.practice.answer) {
        correct++;
      }
    });
    return Math.round((correct / grammarRules.length) * 100);
  };

  const handleAnswerSelect = (question: string, answer: string) => {
    if (!showResults) {
      setSelectedAnswers(prev => ({
        ...prev,
        [question]: answer
      }));
      const isCorrect = answer === currentRule.practice.answer;
      setShowResults(true);
      
      if (isCorrect) {
        setStreak(prev => prev + 1);
      } else {
        setStreak(0);
      }
    }
  };

  const moveToNextQuestion = () => {
    if (currentQuestionIndex < grammarRules.length - 1) {
      setShowResults(false);
      setShowHint(false);
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      const finalScore = calculateScore();
      setScore(finalScore);
      setShowCompletion(true);
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setStreak(0);
    setShowHint(false);
    setShowCompletion(false);
    setScore(0);
  };

  // Completion Screen
  if (showCompletion) {
    return (
      <div className="min-h-[60vh] p-4 animate-fade-in">
        <div className="max-w-md mx-auto space-y-6">
          {/* Score Display */}
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">
              {score >= 80 ? '🌟' : score >= 60 ? '🎉' : '💪'}
            </div>
            <h3 className="text-2xl font-bold text-indigo-900 mb-2">
              Practice Complete!
            </h3>
            <div className="inline-block bg-indigo-50 px-4 py-2 rounded-full">
              <span className="text-xl font-bold text-indigo-700">
                Score: {score}%
              </span>
            </div>
          </div>
          {/* Feedback Message */}
          <div className={`p-4 rounded-xl ${
            score >= 80 
              ? 'bg-emerald-50 text-emerald-600' 
              : score >= 60 
                ? 'bg-indigo-50 text-indigo-700'
                : 'bg-amber-50 text-amber-600'
          }`}>
            <p className="text-lg font-medium text-center">
              {score >= 80 
                ? "Excellent! You've mastered this grammar point!"
                : score >= 60
                  ? "Good progress! Keep practicing to improve further."
                  : "Keep going! Practice makes perfect."}
            </p>
          </div>
          {/* Action Buttons */}
          <button
            onClick={handleReset}
            className="w-full p-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700
              hover:from-indigo-700 hover:via-indigo-800 hover:to-purple-800 text-white text-lg font-medium
              transition-all duration-300 flex items-center justify-center gap-2
              shadow-md hover:shadow-lg active:scale-95"
          >
            <RefreshCw className="w-5 h-5" />
            Practice Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative pb-20"> {/* Increased bottom padding for fixed button */}
      <div className="space-y-3"> {/* Increased spacing between sections */}
        {/* Progress Section */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-300 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-medium text-gray-600">
              Question {currentQuestionIndex + 1} of {grammarRules.length}
            </span>
            <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              <span className="text-base font-medium text-indigo-700">Streak: {streak}</span>
              {streak >= 3 && <span className="animate-pulse">🔥</span>}
            </div>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-300">
            <div 
              className="h-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Practice Section */}
        <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-300">
          {/* Question Text */}
          <p className="text-xl font-semibold text-indigo-900 mb-6">
            {currentRule.practice.question}
          </p>
          
          {/* Options */}
          <div className="space-y-3"> {/* Increased spacing between options */}
            {currentRule.practice.options.map((option) => (
              <button
                key={option}
                onClick={() => handleAnswerSelect(currentRule.practice.question, option)}
                disabled={showResults}
                className={`w-full p-4 rounded-xl text-lg font-medium transition-all duration-300
                  ${showResults
                    ? option === currentRule.practice.answer
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-300'
                      : option === selectedAnswers[currentRule.practice.question]
                        ? 'bg-rose-50 text-rose-600 border-rose-300'
                        : 'bg-gray-50 text-gray-400'
                    : 'bg-white text-gray-600 hover:border-indigo-700'
                  } border-2 hover:shadow-md ${
                    !showResults && 'transform hover:-translate-y-0.5'
                  }`}
              >
                {option}
              </button>
            ))}
          </div>

          {/* Feedback and Hint Section */}
          <div className="mt-6 space-y-3">
            {showResults && (
              <div className={`p-4 rounded-xl text-lg font-medium flex items-center gap-3
                ${selectedAnswers[currentRule.practice.question] === currentRule.practice.answer
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-rose-50 text-rose-600'
                }`}
              >
                {selectedAnswers[currentRule.practice.question] === currentRule.practice.answer ? (
                  <>
                    <Check className="w-5 h-5 flex-shrink-0" />
                    <span>Correct! Well done!</span>
                  </>
                ) : (
                  <>
                    <X className="w-5 h-5 flex-shrink-0" />
                    <span>The correct answer is "{currentRule.practice.answer}"</span>
                  </>
                )}
              </div>
            )}
            {!showResults && (
              <button
                onClick={() => setShowHint(!showHint)}
                className="w-full p-4 text-left text-lg text-indigo-700 hover:bg-indigo-50 
                  rounded-xl transition-colors duration-200 flex items-center gap-2"
              >
                💡 <span className="font-medium">Need a hint?</span>
              </button>
            )}
            {showHint && (
              <div className="p-4 bg-indigo-50 rounded-xl text-indigo-700 text-lg">
                {currentRule.notes}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Navigation */}
      {showResults && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg z-50">
          <button
            onClick={moveToNextQuestion}
            className="w-full p-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700
              hover:from-indigo-700 hover:via-indigo-800 hover:to-purple-800 text-white text-lg font-medium
              transition-all duration-300 flex items-center justify-center gap-2
              shadow-md hover:shadow-lg active:scale-95"
          >
            {currentQuestionIndex < grammarRules.length - 1 ? (
              <>
                Next Question
                <ChevronRight className="w-5 h-5" />
              </>
            ) : (
              <>
                Complete Practice
                <Check className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default function VocabularyModal({ isOpen, onClose, resources, onStartDialogue }: VocabularyModalProps) {
  const [activeTab, setActiveTab] = useState<'vocabulary' | 'grammar'>('vocabulary');
  const [speakingWord, setSpeakingWord] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'flashcard'>('list');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { speak, speaking, cancel } = useSpeechSynthesis();
  const modalRef = useRef<HTMLDivElement>(null);

  const handleNextCard = () => {
    if (currentCardIndex < resources.vocabulary.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentCardIndex(prev => prev + 1);
        setIsFlipped(false);
        setIsAnimating(false);
      }, 200);
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentCardIndex(prev => prev - 1);
        setIsFlipped(false);
        setIsAnimating(false);
      }, 200);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setViewMode('list');
      setCurrentCardIndex(0);
      setIsFlipped(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen || viewMode !== 'flashcard' || isAnimating) return;
      
      switch (e.code) {
        case 'ArrowLeft':
          handlePrevCard();
          break;
        case 'ArrowRight':
          handleNextCard();
          break;
        case 'Space':
          e.preventDefault();
          setIsFlipped(!isFlipped);
          break;
        case 'Enter':
          e.preventDefault();
          const currentWord = resources.vocabulary[currentCardIndex];
          handleSpeak(currentWord.word);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, viewMode, currentCardIndex, isFlipped, isAnimating]);

  const handleSpeak = (text: string) => {
    if (speaking && speakingWord === text) {
      cancel();
      setSpeakingWord(null);
    } else {
      if (speaking) cancel();
      setSpeakingWord(text);
      speak(text, {
        onEnd: () => setSpeakingWord(null),
        lang: 'en-US'
      });
    }
  };

  // Start Dialogue button component with immediate navigation
  const StartDialogueButton = () => (
    <div className="flex justify-center w-full">
      <button
        onClick={() => {
          onClose();
          onStartDialogue();
        }}
        className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700
          hover:from-indigo-700 hover:via-indigo-800 hover:to-purple-800 text-white rounded-xl
          shadow-md hover:shadow-lg transition-all duration-300
          flex items-center justify-center gap-2 font-medium text-lg
          active:scale-95 transform min-w-[150px]"
      >
        <Play className="w-6 h-6" />
        Start Dialogue
      </button>
    </div>
  );

  const renderFlashcard = () => {
    const currentWord = resources.vocabulary[currentCardIndex];
    const progress = ((currentCardIndex + 1) / resources.vocabulary.length) * 100;
    
    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-3 pt-3 sm:pt-2">
        {/* Progress bar - Added mt-4 for extra spacing */}
        <div className="w-full max-w-md mb-4 mt-4">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Progress</span>
            <span>{currentCardIndex + 1} of {resources.vocabulary.length}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Flashcard */}
        <div className="w-full h-[36vh] sm:h-[45vh] perspective">
          <div 
            className={`relative w-full h-full cursor-pointer
              transition-all duration-500 transform-gpu preserve-3d
              ${isFlipped ? 'rotate-y-180' : ''}
              ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
            onClick={() => !isAnimating && setIsFlipped(!isFlipped)}
            style={{
              transform: isFlipped ? 'rotateY(180deg)' : '',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Front of card */}
            <div 
              className="absolute inset-0 w-full h-full"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="w-full h-full bg-gradient-to-br from-white to-indigo-50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-4 sm:p-8 flex flex-col items-center justify-center border border-gray-300">
                <h3 className="text-3xl sm:text-4xl font-bold text-indigo-900 mb-4 text-center break-words relative inline-block">
                  <span className="absolute inset-0 bg-indigo-100/70 -rotate-1 rounded-sm"></span>
                  <span className="relative">{currentWord.translation}</span>
                </h3>
                <div className="mt-4 flex flex-col items-center gap-2">
                  <div className="w-12 h-1 bg-indigo-200 rounded-full animate-pulse" />
                  <p className="text-sm text-gray-500">Tap to reveal English translation</p>
                </div>
              </div>
            </div>
            
            {/* Back of card */}
            <div 
              className="absolute inset-0 w-full h-full"
              style={{ 
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-4 sm:p-8 flex flex-col items-center justify-center border border-gray-300">
                <h3 className="text-3xl sm:text-4xl font-bold text-indigo-900 mb-6 text-center break-words relative inline-block">
                  <span className="absolute inset-0 bg-purple-100/70 rotate-1 rounded-sm"></span>
                  <span className="relative">{currentWord.word}</span>
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSpeak(currentWord.word);
                  }}
                  className={`p-3 sm:p-4 rounded-full transition-all duration-300 shadow-md
                    ${speakingWord === currentWord.word
                      ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white scale-110 shadow-indigo-200'
                      : 'bg-white text-indigo-700 hover:bg-gradient-to-r hover:from-indigo-600 hover:via-indigo-700 hover:to-purple-700 hover:text-white'
                    }`}
                >
                  <Volume2 className="w-6 h-6 sm:w-8 sm:h-8" />
                </button>
                <div className="mt-6 flex flex-col items-center gap-2">
                  <div className="w-12 h-1 bg-purple-200 rounded-full animate-pulse" />
                  <p className="text-sm text-gray-500">Tap to return</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation controls */}
        <div className="flex items-center gap-6 mt-6">
          <button
            onClick={() => !isAnimating && handlePrevCard()}
            disabled={currentCardIndex === 0 || isAnimating}
            className="p-4 sm:p-5 rounded-full bg-white text-gray-500 hover:text-indigo-700 
              disabled:opacity-50 disabled:cursor-not-allowed shadow-sm
              hover:shadow-md transition-all duration-300 border border-gray-300
              w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center group"
          >
            <ChevronLeft className="w-8 h-8 sm:w-9 sm:h-9 group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={() => !isAnimating && setIsFlipped(!isFlipped)}
            className="p-4 sm:p-5 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700
              hover:from-indigo-700 hover:via-indigo-800 hover:to-purple-800 text-white 
              shadow-md hover:shadow-lg transition-all duration-300 
              active:scale-95 disabled:opacity-50
              w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center"
            disabled={isAnimating}
          >
            <RotateCw className="w-8 h-8 sm:w-9 sm:h-9" />
          </button>
          
          <button
            onClick={() => !isAnimating && handleNextCard()}
            disabled={currentCardIndex === resources.vocabulary.length - 1 || isAnimating}
            className="p-4 sm:p-5 rounded-full bg-white text-gray-500 hover:text-indigo-700 
              disabled:opacity-50 disabled:cursor-not-allowed shadow-sm
              hover:shadow-md transition-all duration-300 border border-gray-300
              w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center group"
          >
            <ChevronRight className="w-8 h-8 sm:w-9 sm:h-9 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Keyboard shortcuts - only show on desktop */}
        <div className="mt-4 hidden sm:flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-gray-100 rounded-md">←</kbd>
            <kbd className="px-2 py-1 bg-gray-100 rounded-md">→</kbd>
            <span className="ml-1">to navigate</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-gray-100 rounded-md">space</kbd>
            <span className="ml-1">to flip</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-gray-100 rounded-md">enter</kbd>
            <span className="ml-1">to speak</span>
          </div>
        </div>

        {/* Start Dialogue button */}
        <div className="w-full mt-8 mb-4">
          <StartDialogueButton />
        </div>
      </div>
    );
  };

  const renderVocabularyList = () => (
    <div className="flex flex-col h-full">
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 flex-1">
        {resources.vocabulary.map((item, index) => (
          <div 
            key={index} 
            className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-300
              hover:shadow-md hover:border-indigo-700 transition-all duration-300"
          >
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-semibold text-indigo-900 mb-1 break-words">
                  {item.word}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 font-medium break-words">
                  {item.translation}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSpeak(item.word)}
                  className={`p-2 rounded-full transition-colors duration-200 flex-shrink-0
                    ${speakingWord === item.word
                      ? 'bg-indigo-100 text-indigo-700 scale-110 animate-pulse shadow-md'
                      : 'text-gray-500 hover:text-indigo-700'
                    }`}
                  aria-label="Speak English word"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Start Dialogue button */}
      <div className="mt-6 px-3 sm:px-6">
        <StartDialogueButton />
      </div>
    </div>
  );

  if (!isOpen || !resources) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-hidden">
      <div 
        ref={modalRef}
        className="relative w-full h-full sm:h-auto sm:max-h-[96vh] bg-gradient-to-b from-slate-100 to-white flex flex-col 
          transform transition-all duration-500 animate-in fade-in slide-in-from-bottom-4
          sm:rounded-2xl sm:shadow-2xl sm:max-w-5xl sm:mx-4 sm:mt-2"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 sm:p-6 border-b bg-gradient-to-r from-indigo-50 via-indigo-100 to-purple-100 sm:rounded-t-2xl">
          <h2 className="text-lg sm:text-2xl font-bold text-indigo-900 flex items-center gap-3">
            {activeTab === 'vocabulary' ? (
              <Book className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-700" />
            ) : (
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-purple-700" />
            )}
            Learning resources
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-indigo-700 rounded-full 
              hover:bg-white/80 transition-colors duration-200"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-white/50">
          <button
            onClick={() => {
              setActiveTab('vocabulary');
              setViewMode('list');
            }}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors duration-200 flex-1 sm:flex-none
              ${activeTab === 'vocabulary'
                ? 'text-indigo-700 border-b-2 border-indigo-700 bg-indigo-50/50'
                : 'text-gray-500 hover:text-indigo-700 hover:bg-gray-50'
              } sm:rounded-t-lg justify-center sm:justify-start sm:px-8 sm:py-4`}
          >
            <Book className="w-4 h-4" />
            Vocabulary
          </button>
          <button
            onClick={() => setActiveTab('grammar')}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors duration-200 flex-1 sm:flex-none
              ${activeTab === 'grammar'
                ? 'text-indigo-700 border-b-2 border-indigo-700 bg-indigo-50/50'
                : 'text-gray-500 hover:text-indigo-700 hover:bg-gray-50'
              } sm:rounded-t-lg justify-center sm:justify-start sm:px-8 sm:py-4`}
          >
            <GraduationCap className="w-4 h-4" />
            Grammar
          </button>
        </div>

        {/* View mode toggle for vocabulary */}
        {activeTab === 'vocabulary' && (
          <div className="flex justify-end p-2 sm:px-4 sm:py-2 bg-gray-50">
            <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1 shadow-sm">
              <button
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center gap-2 rounded-md px-3 sm:px-4 py-2 text-sm font-medium transition-colors duration-200
                  ${viewMode === 'list'
                    ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white shadow-sm'
                    : 'text-gray-500 hover:text-indigo-700 hover:bg-gray-50'
                  }`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode('flashcard')}
                className={`inline-flex items-center gap-2 rounded-md px-3 sm:px-4 py-2 text-sm font-medium transition-colors duration-200
                  ${viewMode === 'flashcard'
                    ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white shadow-sm'
                    : 'text-gray-500 hover:text-indigo-700 hover:bg-gray-50'
                  }`}
              >
                Flashcards
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-slate-100">
          {activeTab === 'vocabulary' ? (
            viewMode === 'list' ? (
              <div className="p-3 sm:p-6">
                {renderVocabularyList()}
              </div>
            ) : (
              renderFlashcard()
            )
          ) : (
            <div className="flex flex-col h-full">
              <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 flex-1">
                {/* Grammar Rules Section */}
                <div className="space-y-3 sm:space-y-4">
                  {resources.grammar.map((pattern, index) => (
                    <div 
                      key={index} 
                      className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-300
                        hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <ChevronRight className="w-5 h-5 text-indigo-700 flex-shrink-0" />
                        <h3 className="text-base sm:text-lg font-semibold text-indigo-900 break-words">
                          {pattern.tense}
                        </h3>
                      </div>
                      {pattern.notes && (
                        <p className="text-sm sm:text-base text-gray-600 pl-6 sm:pl-7 break-words">
                          {pattern.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Grammar Practice Section */}
                <GrammarPractice grammarRules={resources.grammar} />
              </div>
              
              {/* Start Dialogue button for grammar tab */}
              <div className="p-3 sm:p-6 border-t">
                <StartDialogueButton />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}