// Theme preference: light, dark, or follow the OS ("system"). The initial class is set by the
// inline script in index.html before first paint; this module keeps it in sync afterwards.

import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme'
const systemDark = window.matchMedia('(prefers-color-scheme: dark)')
const listeners = new Set<() => void>()

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : 'system'
  } catch {
    return 'system' // storage can be blocked (private mode, disabled cookies)
  }
}

let current = readStoredTheme()

function applyTheme(): void {
  const dark = current === 'dark' || (current === 'system' && systemDark.matches)
  document.documentElement.classList.toggle('dark', dark)
}

export function setTheme(theme: Theme): void {
  current = theme
  try {
    if (theme === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // The choice still applies for this visit.
  }
  applyTheme()
  listeners.forEach((listener) => listener())
}

systemDark.addEventListener('change', applyTheme)

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, () => current)
}
