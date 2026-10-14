import { useEffect, useLayoutEffect, useRef } from 'react'

/**
 * Runs `handlers[event.key]` on keydown (`' '` for Space). Ignored while typing in a field, inside a dialog,
 * with a modifier held, or when the key auto-repeats, so a held key never acts twice.
 */
export function useShortcuts(handlers: Record<string, () => void>) {
  const latest = useRef(handlers)
  // Layout effect: the next key press must see this render's handlers, never the previous card's.
  useLayoutEffect(() => {
    latest.current = handlers
  })

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return
      if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return
      const handler = latest.current[event.key]
      if (!handler) return
      event.preventDefault() // stops Space scrolling the page or also clicking a focused button
      handler()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
