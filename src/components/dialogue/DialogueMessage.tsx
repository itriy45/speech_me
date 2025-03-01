import React, { useState, useEffect } from 'react';
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import AudioMessage from './AudioMessage';
import { Message } from '../../types/dialogue';

interface DialogueMessageProps {
  message: Message;
}

interface WordScore {
  word: string;
  confidence: number;
}

export default function DialogueMessage({ message }: DialogueMessageProps) {
  // States and core functionality remain unchanged
  const [hasDisplayedComparison, setHasDisplayedComparison] = useState(false);
  const [isComparisonVisible, setIsComparisonVisible] = useState(false);
  const [similarity, setSimilarity] = useState(0);
  const [wordScores, setWordScores] = useState<WordScore[]>([]);

  // All calculation functions remain unchanged
  useEffect(() => {
    if (message.originalText && message.expectedResponse) {
      const calculatedSimilarity = calculateWordSimilarity(
        message.originalText,
        message.expectedResponse
      );
      setSimilarity(calculatedSimilarity);
      
      const scores = calculateWordLevelScores(
        message.originalText,
        message.expectedResponse
      );
      setWordScores(scores);
    }
    setHasDisplayedComparison(false);
    setIsComparisonVisible(false);
  }, [message.id, message.originalText, message.expectedResponse]);

  // All helper functions remain unchanged
  const wordEquivalents: { [key: string]: string[] } = {
    'doctor': ['dr', 'doctor', 'dr.'],
    'practitioner': ['practitioner', 'practition', 'practice'],
  };

  // Keep all calculation functions unchanged...
  const normalizeWord = (word: string): string => {
    word = word.toLowerCase().trim();
    for (const [main, equivalents] of Object.entries(wordEquivalents)) {
      if (equivalents.includes(word)) {
        return main;
      }
    }
    return word;
  };

  const calculateWordLevelScores = (original: string, expected: string): WordScore[] => {
    // Existing implementation remains unchanged
    if (!original || !expected) return [];
    const normalizeString = (str: string) => {
      return str
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()'"]/g, " ")
        .trim()
        .replace(/\s+/g, ' ');
    };
    const getProcessedWords = (str: string) => {
      return normalizeString(str)
        .split(' ')
        .map(word => normalizeWord(word))
        .filter(word => word.length > 0);
    };
    const originalWords = original.split(' ');
    const expectedWordsProcessed = getProcessedWords(expected);
    return originalWords.map(word => {
      const normalizedWord = normalizeWord(word);
      if (expectedWordsProcessed.includes(normalizedWord)) {
        return { word, confidence: 1 };
      }
      let bestConfidence = 0;
      expectedWordsProcessed.forEach(expectedWord => {
        const similarity = calculateStringSimilarity(normalizedWord, expectedWord);
        if (similarity > bestConfidence) {
          bestConfidence = similarity;
        }
      });
      return { word, confidence: bestConfidence };
    });
  };

  // Other calculation functions remain unchanged...
  const calculateWordSimilarity = (original: string, expected: string): number => {
    // Existing implementation remains unchanged
    if (!original || !expected) return 0;
    const normalizeString = (str: string) => {
      return str
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()'"]/g, " ")
        .trim()
        .replace(/\s+/g, ' ');
    };
    const getProcessedWords = (str: string) => {
      return normalizeString(str)
        .split(' ')
        .map(word => normalizeWord(word))
        .filter(word => word.length > 0);
    };
    const originalWords = getProcessedWords(original);
    const expectedWords = getProcessedWords(expected);
    if (originalWords.join(' ') === expectedWords.join(' ')) {
      return 1;
    }
    let totalScore = 0;
    let maxScore = Math.max(originalWords.length, expectedWords.length);
    
    let remainingExpectedWords = [...expectedWords];
    let usedOriginalWords = new Set<number>();

    originalWords.forEach((word, index) => {
      if (index < expectedWords.length && word === expectedWords[index]) {
        totalScore += 1;
        remainingExpectedWords[index] = '';
        usedOriginalWords.add(index);
      }
    });

    originalWords.forEach((word, origIndex) => {
      if (!usedOriginalWords.has(origIndex)) {
        const matchIndex = remainingExpectedWords.findIndex(w => w === word);
        if (matchIndex !== -1) {
          totalScore += 0.9;
          remainingExpectedWords[matchIndex] = '';
          usedOriginalWords.add(origIndex);
        }
      }
    });

    const lengthRatio = Math.min(originalWords.length, expectedWords.length) / 
                       Math.max(originalWords.length, expectedWords.length);
    totalScore *= lengthRatio;
    return Math.min(1, totalScore / maxScore);
  };

  const calculateStringSimilarity = (str1: string, str2: string): number => {
    // Existing implementation remains unchanged
    if (str1 === str2) return 1;
    if (!str1 || !str2) return 0;
    str1 = str1.toLowerCase();
    str2 = str2.toLowerCase();
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    let matches = 0;
    let position = 0;
    
    for (let i = 0; i < shorter.length; i++) {
      const searchStr = shorter[i];
      position = longer.indexOf(searchStr, position);
      if (position !== -1) {
        matches++;
        position++;
      }
    }
    return matches / longer.length;
  };

  const shouldShowHint = () => {
    return message.isHint && similarity < 0.8;
  };

  // Keep original success colors, update others to match the gradient palette
  const getWordColor = (confidence: number): string => {
    if (confidence >= 0.95) return 'text-emerald-700';
    if (confidence >= 0.85) return 'text-green-700';
    if (confidence >= 0.75) return 'text-lime-700';
    if (confidence >= 0.65) return 'text-yellow-700';
    return 'text-orange-700';
  };

  // Updated message styles with consistent gradient palette
  const getMessageStyles = () => {
    if (message.isUser) {
      return 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white shadow-sm hover:shadow-md transition-all duration-300';
    }
    if (message.isCorrect) {
      return 'bg-green-50 text-green-800 border border-green-200 shadow-sm hover:shadow-md transition-all duration-300';
    }
    if (shouldShowHint()) {
      return 'bg-amber-50 text-gray-800 border border-amber-200 shadow-sm hover:shadow-md transition-all duration-300';
    }
    return 'bg-white text-gray-800 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300';
  };

  const getEncouragingMessage = (similarity: number) => {
    if (similarity >= 0.95) return "Perfect! ✨";
    if (similarity >= 0.85) return "Excellent! 🌟";
    if (similarity >= 0.75) return "Great job! 🎯";
    if (similarity >= 0.65) return "Well done! 👏";
    return "Keep going! 💪";
  };

  const shouldShowComparison = () => {
    return message.isUser && message.originalText && message.expectedResponse;
  };

  const handleComparisonDisplay = () => {
    if (!hasDisplayedComparison) {
      setHasDisplayedComparison(true);
    }
    setIsComparisonVisible(!isComparisonVisible);
  };

  const renderComparison = () => {
    if (!shouldShowComparison()) return null;
    const encouragingMessage = getEncouragingMessage(similarity);
    const showFeedback = similarity >= 0.6;

    return (
      <div className="mt-2">
        <button
          onClick={handleComparisonDisplay}
          className="flex items-center gap-1 text-sm font-medium text-gray-200 hover:text-gray-100 transition-colors duration-200"
        >
          <span className="flex items-center gap-2">
            Your speech
            {showFeedback && (
              <span className="text-gray-300 text-xs">
                {encouragingMessage}
              </span>
            )}
          </span>
          {isComparisonVisible ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        {isComparisonVisible && (
          <div className="mt-2 flex flex-col space-y-3 bg-gray-50 rounded-lg p-3">
            <div className="text-gray-800 flex flex-wrap gap-1">
              {wordScores.map((wordScore, index) => (
                <span
                  key={index}
                  className={`${getWordColor(wordScore.confidence)} font-medium transition-colors duration-200`}
                >
                  {wordScore.word}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start gap-3 max-w-[90%] ${
        message.isUser ? 'flex-row-reverse' : 'flex-row'
      }`}>
        {!message.isUser && (
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50
            flex items-center justify-center shadow-sm">
            <MessageSquare className="w-6 h-6 text-indigo-700" />
          </div>
        )}
        
        <div 
          className={`rounded-xl px-4 py-2.5 ${getMessageStyles()}
          ${message.isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
        >
          <div className="space-y-2">
            <div className={message.isUser ? 'text-white' : 'text-gray-800'}>
              {message.text}
            </div>
            
            {renderComparison()}
            <div className="flex items-center gap-3">
              {((message.isUser && message.isCorrect && message.expectedResponse) ||
                (!message.isUser && !message.isCorrect)) && (
                <AudioMessage 
                  message={message}
                  onlyShowButton={message.isUser}
                />
              )}
            </div>
            {message.grammarNote && !message.isUser && (
              <div className="text-sm text-indigo-700 mt-2 pt-2 border-t border-indigo-100">
                <span className="font-medium">Note:</span> {message.grammarNote}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}