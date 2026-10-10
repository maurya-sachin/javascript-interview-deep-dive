// Spaced-repetition state for flashcards, kept in this browser's localStorage (there are no accounts).
// Each reviewed card maps to its ts-fsrs card, stored as JSON (dates become ISO strings, which ts-fsrs accepts back).

import { createEmptyCard, fsrs, type CardInput, type Grade } from 'ts-fsrs'
import type { Flashcard } from './types.ts'

const STORAGE_KEY = 'flashcard-reviews'
const scheduler = fsrs()

/** Review state by flashcard id. A card with no entry is new. */
export type Reviews = Record<string, CardInput>

export function loadReviews(): Reviews {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const data: unknown = raw ? JSON.parse(raw) : {}
    // Anything that isn't a plain object (or can't be read) counts as no history.
    return typeof data === 'object' && data !== null && !Array.isArray(data) ? (data as Reviews) : {}
  } catch {
    return {}
  }
}

/** Cards to review now: overdue ones, oldest first, then cards never seen. */
export function dueQueue(cards: Flashcard[], reviews: Reviews, now: Date): Flashcard[] {
  const overdue = cards
    .filter((card) => card.id in reviews && new Date(reviews[card.id].due) <= now)
    .sort((a, b) => new Date(reviews[a.id].due).getTime() - new Date(reviews[b.id].due).getTime())
  const unseen = cards.filter((card) => !(card.id in reviews))
  return [...overdue, ...unseen]
}

/** Records a rating and returns the updated reviews. */
export function rateCard(reviews: Reviews, cardId: string, grade: Grade, now: Date): Reviews {
  const { card } = scheduler.next(reviews[cardId] ?? createEmptyCard(now), now, grade)
  const updated = { ...reviews, [cardId]: card }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // Storage is blocked or full: the session still works, but progress won't survive a reload.
  }
  return updated
}
