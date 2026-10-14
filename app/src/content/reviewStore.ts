// Flashcard review history kept in this browser's localStorage (there are no accounts).

import { useSyncExternalStore } from 'react'
import type { Grade } from 'ts-fsrs'
import { parseReviews, rateCard, type Reviews } from './review.ts'

const STORAGE_KEY = 'flashcard-reviews'
const listeners = new Set<() => void>()
const NO_REVIEWS: Reviews = Object.freeze({})
let cached: Reviews | undefined

export function loadReviews(): Reviews {
  try {
    return parseReviews(localStorage.getItem(STORAGE_KEY))
  } catch {
    return {}
  }
}

/** Stores the review history and reports whether it was stored; if not (storage blocked or full), the session still works but progress won't survive a reload. */
export function saveReviews(reviews: Reviews): boolean {
  cached = reviews
  let stored = true
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews))
  } catch {
    stored = false
  }
  listeners.forEach((listener) => listener())
  return stored
}

function snapshot(): Reviews {
  cached ??= loadReviews()
  return cached
}

/** Another tab changed (or cleared) the stored value: drop the cache so the next snapshot re-reads it. */
function handleStorage(event: StorageEvent): void {
  if (event.key !== null && event.key !== STORAGE_KEY) return
  cached = undefined
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) window.addEventListener('storage', handleStorage)
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) window.removeEventListener('storage', handleStorage)
  }
}

/** The review history, kept current as ratings and imports are saved; empty while rendering on the server. */
export function useReviews(): Reviews {
  return useSyncExternalStore(subscribe, snapshot, () => NO_REVIEWS)
}

/** Records a rating, stores it, and returns the updated reviews. */
export function recordRating(reviews: Reviews, cardId: string, grade: Grade, now: Date): Reviews {
  const updated = rateCard(reviews, cardId, grade, now)
  saveReviews(updated)
  return updated
}
