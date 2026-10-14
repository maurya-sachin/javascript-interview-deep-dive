// Export and import of the learner's progress (reading and flashcards), the only backup there is: no accounts.

import type { Reviews } from '../content/review.ts'
import type { Progress } from './progress.ts'

export const BACKUP_FORMAT = 'isobath-progress'
const CARD_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*$/

export interface Backup {
  format: typeof BACKUP_FORMAT
  version: 1
  exportedAt: string
  /** No title HTML: it is rebuilt from the site's own data, never taken from a file. */
  progress: { read: string[]; last: string | null }
  reviews: Reviews
}

export function createBackup(progress: Progress, reviews: Reviews, now: Date): Backup {
  return { format: BACKUP_FORMAT, version: 1, exportedAt: now.toISOString(), progress: { read: [...progress.read], last: progress.last }, reviews }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Reads an exported file. Throws with a message for the reader when it isn't a valid isobath backup. */
export function parseBackup(text: string): Backup {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('This file is not valid JSON.')
  }
  if (!isRecord(data) || data.format !== BACKUP_FORMAT || data.version !== 1) throw new Error('This is not an isobath progress file.')

  const { progress, reviews } = data
  if (!isRecord(progress) || !Array.isArray(progress.read) || !progress.read.every((id) => typeof id === 'string')) {
    throw new Error("The file's reading progress is damaged.")
  }
  const reviewsValid =
    isRecord(reviews) &&
    Object.entries(reviews).every(([id, card]) => CARD_ID.test(id) && isRecord(card) && (typeof card.due === 'string' || typeof card.due === 'number'))
  if (!reviewsValid) throw new Error("The file's flashcard history is damaged.")

  return {
    format: BACKUP_FORMAT,
    version: 1,
    exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : '',
    progress: { read: progress.read, last: typeof progress.last === 'string' ? progress.last : null },
    reviews: reviews as Reviews,
  }
}

function reviewedAt(card: Reviews[string]): number {
  return card.last_review == null ? 0 : new Date(card.last_review).getTime() || 0
}

/** Combines an import with what this browser has: read questions are unioned, and each card keeps its most recent review. */
export function mergeBackup(current: { progress: Progress; reviews: Reviews }, incoming: Backup): { progress: Progress; reviews: Reviews } {
  const read = [...new Set([...current.progress.read, ...incoming.progress.read])]
  const keepCurrentLast = current.progress.last !== null
  const progress: Progress = {
    read,
    last: keepCurrentLast ? current.progress.last : incoming.progress.last,
    lastTitleHtml: keepCurrentLast ? current.progress.lastTitleHtml : null,
  }

  const merged = new Map(Object.entries(current.reviews))
  for (const [id, card] of Object.entries(incoming.reviews)) {
    const existing = merged.get(id)
    if (!existing || reviewedAt(card) > reviewedAt(existing)) merged.set(id, card)
  }
  return { progress, reviews: Object.fromEntries(merged) }
}
