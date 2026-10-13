// Which questions the learner has opened, kept in this browser's localStorage (there are no accounts).

import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'questions-read'
const listeners = new Set<() => void>()

/** The last question opened, so the home page can offer to continue. */
export interface Progress {
  read: readonly string[]
  last: string | null
}

const EMPTY: Progress = { read: [], last: null }
let cached: Progress | undefined

function load(): Progress {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (typeof data === 'object' && data !== null && Array.isArray((data as Progress).read)) {
      const { read, last } = data as Progress
      return { read: read.filter((id): id is string => typeof id === 'string'), last: typeof last === 'string' ? last : null }
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

/** Records that a question was opened. */
export function markRead(id: string) {
  const { read } = snapshot()
  cached = { read: read.includes(id) ? read : [...read, id], last: id }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cached))
  } catch {
    // Storage is blocked or full: progress lasts for this session only.
  }
  listeners.forEach((listener) => listener())
}

export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY)
}
