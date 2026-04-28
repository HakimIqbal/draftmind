export type ReadabilityGrade = 'Excellent' | 'Good' | 'Fair' | 'Poor';

export interface ReadabilityResult {
  score: ReadabilityGrade;
  wordCount: number;
  readTimeMinutes: number;
  avgSentenceLength: number;
}

export function computeReadability(text: string): ReadabilityResult {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { score: 'Excellent', wordCount: 0, readTimeMinutes: 0, avgSentenceLength: 0 };
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const readTimeMinutes = Math.ceil(wordCount / 250);

  // Split by sentence-ending punctuation followed by whitespace or end-of-string
  const sentences = trimmed
    .split(/[.!?]+(?:\s|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const sentenceCount = Math.max(sentences.length, 1);
  const avgSentenceLength = wordCount / sentenceCount;

  let score: ReadabilityGrade;
  if (avgSentenceLength < 20) {
    score = 'Excellent';
  } else if (avgSentenceLength < 25) {
    score = 'Good';
  } else if (avgSentenceLength < 30) {
    score = 'Fair';
  } else {
    score = 'Poor';
  }

  return {
    score,
    wordCount,
    readTimeMinutes,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
  };
}
