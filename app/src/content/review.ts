// Spaced-repetition logic for flashcards. Each reviewed card maps to its ts-fsrs card, stored as JSON
// (dates become ISO strings, which ts-fsrs accepts back). Browser storage lives in reviewStore.ts, so the
// Node scripts' tsconfig, which has no DOM types, can compile this file for its tests.

import { createEmptyCard, fsrs, Rating, type CardInput, type Grade } from 'ts-fsrs'
import type { Flashcard } from './types.ts'

const scheduler = fsrs()

/** Review state by flashcard id. A card with no entry is new. */
export type Reviews = Record<string, CardInput>

const NUMERIC_FIELDS = ['stability', 'difficulty', 'elapsed_days', 'scheduled_days', 'learning_steps', 'reps', 'lapses']

function isTime(value: unknown): boolean {
  return (typeof value === 'string' || typeof value === 'number') && Number.isFinite(new Date(value).getTime())
}

/** Whether `value` has every field ts-fsrs reads, so a damaged stored or imported card can't break scheduling. */
export function isValidCard(value: unknown): value is CardInput {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const card = value as Record<string, unknown>
  return (
    Number.isInteger(card.state) &&
    (card.state as number) >= 0 &&
    (card.state as number) <= 3 &&
    NUMERIC_FIELDS.every((field) => Number.isFinite(card[field])) &&
    isTime(card.due) &&
    (card.last_review == null || isTime(card.last_review))
  )
}

/** Reads stored review history; anything that isn't a plain object counts as no history, and damaged cards are dropped. */
export function parseReviews(raw: string | null): Reviews {
  try {
    const data: unknown = raw ? JSON.parse(raw) : {}
    if (typeof data !== 'object' || data === null || Array.isArray(data)) return {}
    return Object.fromEntries(Object.entries(data).filter(([, card]) => isValidCard(card)))
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

/** The reviews after rating a card; does not store them. */
export function rateCard(reviews: Reviews, cardId: string, grade: Grade, now: Date): Reviews {
  const { card } = scheduler.next(reviews[cardId] ?? createEmptyCard(now), now, grade)
  return { ...reviews, [cardId]: card }
}

/** When a card would next be due for each grade, so the rating buttons can show the wait before one is chosen. */
export function previewIntervals(reviews: Reviews, cardId: string, now: Date): Record<Grade, Date> {
  const outcomes = scheduler.repeat(reviews[cardId] ?? createEmptyCard(now), now)
  return {
    [Rating.Again]: outcomes[Rating.Again].card.due,
    [Rating.Hard]: outcomes[Rating.Hard].card.due,
    [Rating.Good]: outcomes[Rating.Good].card.due,
    [Rating.Easy]: outcomes[Rating.Easy].card.due,
  }
}

function reviewsOf(topic: string, reviews: Reviews) {
  return Object.entries(reviews).filter(([id]) => id.startsWith(`${topic}/`))
}

/**
 * Cards due now and cards never seen, for one topic's deck of `cardCount` cards. Ids of cards since removed are clamped away.
 * Counts assume card ids never change once published (templates/README.md, Flashcards).
 */
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
