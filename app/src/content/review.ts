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

/** New cards introduced per session, as in common spaced-repetition defaults, so a fresh deck isn't one 700-card sitting. */
export const NEW_CARDS_PER_SESSION = 20

/** Cards to review now: every overdue one, oldest first, then up to `NEW_CARDS_PER_SESSION` never seen. */
export function dueQueue(cards: Flashcard[], reviews: Reviews, now: Date): Flashcard[] {
  const overdue = cards
    .filter((card) => card.id in reviews && new Date(reviews[card.id].due) <= now)
    .sort((a, b) => new Date(reviews[a.id].due).getTime() - new Date(reviews[b.id].due).getTime())
  const unseen = cards.filter((card) => !(card.id in reviews)).slice(0, NEW_CARDS_PER_SESSION)
  return [...overdue, ...unseen]
}

/** Stores the review history; if storage is blocked or full, the session still works but progress won't survive a reload. */
export function saveReviews(reviews: Reviews): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews))
  } catch {
    // See above: nothing else to do without storage.
  }
}

/** Records a rating and returns the updated reviews. */
export function rateCard(reviews: Reviews, cardId: string, grade: Grade, now: Date): Reviews {
  const { card } = scheduler.next(reviews[cardId] ?? createEmptyCard(now), now, grade)
  const updated = { ...reviews, [cardId]: card }
  saveReviews(updated)
  return updated
}

function reviewsOf(topic: string, reviews: Reviews) {
  return Object.entries(reviews).filter(([id]) => id.startsWith(`${topic}/`))
}

/** Cards due now and cards never seen, for one topic's deck of `cardCount` cards. Ids of cards since removed are clamped away. */
export function deckStatus(topic: string, cardCount: number, reviews: Reviews, now: Date): { due: number; unseen: number } {
  const seen = reviewsOf(topic, reviews)
  const due = seen.filter(([, card]) => new Date(card.due) <= now).length
  return { due: Math.min(due, cardCount), unseen: Math.max(cardCount - seen.length, 0) }
}

/** When the soonest not-yet-due card in a topic comes due; `null` if none is scheduled. */
export function nextDue(topic: string, reviews: Reviews, now: Date): Date | null {
  const upcoming = reviewsOf(topic, reviews)
    .map(([, card]) => new Date(card.due))
    .filter((due) => due > now)
  return upcoming.length === 0 ? null : new Date(Math.min(...upcoming.map((due) => due.getTime())))
}
