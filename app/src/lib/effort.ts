// Reading effort shown on paths, from the length the site promises for a full answer.

export const MINUTES_PER_QUESTION = 5

/** Whole hours to read `questionCount` questions; at least one hour for any non-empty set. */
export function readingHours(questionCount: number): number {
  if (questionCount === 0) return 0
  return Math.max(1, Math.round((questionCount * MINUTES_PER_QUESTION) / 60))
}
