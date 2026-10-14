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

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Replaces the stored reading progress, e.g. after an import, and updates every reader. */
export function replaceProgress(next: Progress) {
  cached = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cached))
  } catch {
    // Storage is blocked or full: progress lasts for this session only.
  }
  listeners.forEach((listener) => listener())
}

/** Records that a question was opened. */
export function markRead(id: string, titleHtml: string) {
  const { read } = snapshot()
  replaceProgress({ read: read.includes(id) ? read : [...read, id], last: id, lastTitleHtml: titleHtml })
}

export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY)
}
