import stringSimilarity from 'string-similarity';
import * as stringSimilarity from 'string-similarity';

// Enhanced text normalization for comparison
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[.,!?;:'"()\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Improved text formatting with more sophisticated rules
const formatText = (text: string): string => {
  let formattedText = text
    // Remove extra spaces first
    .replace(/\s+/g, ' ')
    .trim();

  // Add proper spacing after punctuation
  formattedText = formattedText
    .replace(/([.,!?;:])\s*/g, '$1 ')
    .trim();

  // Add question marks to questions if missing
  if (/^(what|where|when|why|how|are|is|can|could|would|will|does|do|did|has|have)/i.test(formattedText) 
      && !formattedText.endsWith('?')) {
    formattedText += '?';
  }

  // Add periods to statements if no ending punctuation
  if (!/[.!?]$/.test(formattedText)) {
    // Don't add period to questions
    if (!/^(what|where|when|why|how|are|is|can|could|would|will|does|do|did|has|have)/i.test(formattedText)) {
      formattedText += '.';
    }
  }

  // Capitalize first letter of each sentence
  formattedText = formattedText
    .split(/([.!?]\s+)/)
    .map((segment, index) => {
      // If it's the first segment or follows punctuation, capitalize
      if (index === 0 || /[.!?]\s+$/.test(segment)) {
        return segment;
      }
      return segment.charAt(0).toUpperCase() + segment.slice(1);
    })
    .join('');

  // Ensure first character is capitalized
  formattedText = formattedText.charAt(0).toUpperCase() + formattedText.slice(1);

  // Fix common capitalization mistakes in medical terms
  const medicalTerms = ['COVID', 'CT', 'MRI', 'ECG', 'EKG', 'BP', 'ICU', 'ER'];
  medicalTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    formattedText = formattedText.replace(regex, term);
  });

  return formattedText;
};

// Enhanced string similarity check with medical terminology consideration
const calculateSimilarity = (text1: string, text2: string): number => {
  const base = stringSimilarity.compareTwoStrings(text1, text2);
  
  // Give extra weight to correct medical terminology
  const medicalTerms = ['patient', 'symptoms', 'diagnosis', 'treatment', 'pain', 'medication'];
  const medicalTermBonus = medicalTerms.reduce((bonus, term) => {
    const term1 = text1.toLowerCase().includes(term);
    const term2 = text2.toLowerCase().includes(term);
    return bonus + (term1 === term2 ? 0.02 : 0);
  }, 0);

  return Math.min(1, base + medicalTermBonus);
};

export const validateAnswer = (
  userAnswer: string,
  correctAnswer: string,
  variations: string[] = []
): ValidationResult => {
  const normalizedUserAnswer = normalizeText(userAnswer);
  const normalizedCorrectAnswer = normalizeText(correctAnswer);
  const normalizedVariations = variations.map(normalizeText);

  // Check exact matches first (case-insensitive)
  if (normalizedUserAnswer === normalizedCorrectAnswer) {
    return {
      isCorrect: true,
      similarity: 1,
      closestMatch: correctAnswer,
      correctedText: formatText(correctAnswer)
    };
  }

  // Check variations
  const variationIndex = normalizedVariations.indexOf(normalizedUserAnswer);
  if (variationIndex !== -1) {
    return {
      isCorrect: true,
      similarity: 1,
      closestMatch: variations[variationIndex],
      correctedText: formatText(variations[variationIndex])
    };
  }

  // Find best match using enhanced similarity check
  const allPossibleAnswers = [correctAnswer, ...variations];
  const similarities = allPossibleAnswers.map(answer => ({
    text: answer,
    similarity: calculateSimilarity(normalizedUserAnswer, normalizeText(answer))
  }));

  const bestMatch = similarities.reduce((best, current) => 
    current.similarity > best.similarity ? current : best
  );

  const isAccepted = bestMatch.similarity >= 0.8;

  return {
    isCorrect: isAccepted,
    similarity: bestMatch.similarity,
    closestMatch: bestMatch.text,
    correctedText: isAccepted ? formatText(bestMatch.text) : formatText(userAnswer)
  };
};