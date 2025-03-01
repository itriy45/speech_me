import * as stringSimilarity from 'string-similarity';

interface WordCorrection {
  original: string;
  correct: string;
  isCorrect: boolean;
}

export function compareTexts(spoken: string, expected: string): {
  similarity: number;
  corrections: WordCorrection[];
} {
  // Clean and normalize texts for comparison
  const cleanSpoken = spoken.toLowerCase().trim();
  const cleanExpected = expected.toLowerCase().trim();

  const similarity = stringSimilarity.compareTwoStrings(
    cleanSpoken,
    cleanExpected
  );

  const spokenWords = cleanSpoken.split(/\s+/);
  const expectedWords = cleanExpected.split(/\s+/);

  const corrections: WordCorrection[] = [];
  const maxLength = Math.max(spokenWords.length, expectedWords.length);

  for (let i = 0; i < maxLength; i++) {
    const spokenWord = spokenWords[i] || '';
    const expectedWord = expectedWords[i] || '';

    const wordSimilarity = stringSimilarity.compareTwoStrings(
      spokenWord,
      expectedWord
    );

    corrections.push({
      original: spokenWord,
      correct: expectedWord,
      isCorrect: wordSimilarity >= 0.9
    });
  }

  return { similarity, corrections };
}

export function shouldShowCorrections(similarity: number): boolean {
  return similarity >= 0.8 && similarity < 0.99;
}