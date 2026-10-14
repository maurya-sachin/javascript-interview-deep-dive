// Which questions the learner has opened, kept in this browser's localStorage (there are no accounts).

import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'questions-read'
const listeners = new Set<() => void>()

/** The last question opened, so the home page can offer to continue. */
export interface Progress {
  read: readonly string[]
  last: string | null
  /** Title of `last`, kept so the home page can show it without loading the topic. `null` for progress saved before it existed. */
  lastTitleHtml: string | null
}

const EMPTY: Progress = { read: [], last: null, lastTitleHtml: null }
let cached: Progress | undefined

function load(): Progress {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (typeof data === 'object' && data !== null && Array.isArray((data as Progress).read)) {
      const { read, last, lastTitleHtml } = data as Progress
      return {
        read: read.filter((id): id is string => typeof id === 'string'),
        last: typeof last === 'string' ? last : null,
        lastTitleHtml: typeof lastTitleHtml === 'string' ? lastTitleHtml : null,
      }
    }
  } catch {
    // Unreadable or blocked storage counts as no history.
  }
  return EMPTY
}

function snapshot(): Progress {
  cached ??= load()
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

/**
 * Replaces the stored reading progress, e.g. after an import, and updates every reader.
 * Returns whether it was stored; if not (storage blocked or full), progress lasts for this visit only.
 */
export function replaceProgress(next: Progress): boolean {
  cached = next
  let stored = true
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cached))
  } catch {
    stored = false
  }
  listeners.forEach((listener) => listener())
  return stored
}

/** Records that a question was opened. */
export function markRead(id: string, titleHtml: string) {
  const { read } = snapshot()
  replaceProgress({ read: read.includes(id) ? read : [...read, id], last: id, lastTitleHtml: titleHtml })
}

export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY)
}
