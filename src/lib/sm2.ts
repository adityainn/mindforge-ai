/**
 * SuperMemo SM-2 algorithm implementation for Spaced Repetition.
 * Computes the next interval, repetitions count, and ease factor for a flashcard.
 *
 * @param grade User rating of recall quality (0 to 5)
 * @param prevInterval Previous interval in days
 * @param prevRepetitions Number of consecutive correct reviews
 * @param prevEaseFactor Previous difficulty ease factor (default is 2.5)
 * @returns updated spaced repetition values
 */
export function calculateSM2(
  grade: number,
  prevInterval: number,
  prevRepetitions: number,
  prevEaseFactor: number
) {
  let interval = 1;
  let repetitions = prevRepetitions;
  let easeFactor = prevEaseFactor;

  // Grade must be 0-5
  const q = Math.max(0, Math.min(5, grade));

  if (q >= 3) {
    // Correct recall
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(prevInterval * easeFactor);
    }
    repetitions += 1;
  } else {
    // Incorrect recall - reset repetitions and interval to 1 day
    repetitions = 0;
    interval = 1;
  }

  // Adjust Ease Factor (EF)
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  
  // EF must not fall below 1.3
  easeFactor = Math.max(1.3, easeFactor);

  // Return new values
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);
  // Reset review time to start of day for cleaner queries
  nextReview.setHours(0, 0, 0, 0);

  return {
    interval,
    repetitions,
    easeFactor: parseFloat(easeFactor.toFixed(3)),
    nextReview,
  };
}
