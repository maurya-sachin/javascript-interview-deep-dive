import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/** False during prerender and hydration, true afterwards: gate browser-only state on it so the server HTML matches the first client render. */
export function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false)
}
