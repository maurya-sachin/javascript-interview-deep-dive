// Theme preference: light, dark, or follow the OS ("system"). The initial class is set by the
// inline script in index.html before first paint; this module keeps it in sync afterwards.

import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme'
const listeners = new Set<() => void>()
let current: Theme | undefined

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : 'system'
  } catch {
    return 'system' // storage can be blocked (private mode, disabled cookies)
  }
}

function systemDark(): MediaQueryList {
  return window.matchMedia('(prefers-color-scheme: dark)')
}

function snapshot(): Theme {
  current ??= readStoredTheme()
  return current
}

function applyTheme(): void {
  const theme = snapshot()
  document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && systemDark().matches))
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

function subscribe(listener: () => void): () => void {
  // Following the OS only matters once something is rendered that reads the theme.
  if (listeners.size === 0) systemDark().addEventListener('change', applyTheme)
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) systemDark().removeEventListener('change', applyTheme)
  }
}

/** The stored preference; `'system'` while rendering on the server. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, snapshot, () => 'system')
}
