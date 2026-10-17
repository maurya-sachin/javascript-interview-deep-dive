import { useEffect, useEffectEvent } from 'react'

const TEXT_FIELDS_AND_DIALOGS = 'input, textarea, select, [contenteditable="true"], [role="dialog"]'
const ACTIVATABLE = 'a[href], button, summary, [role="button"], [role="link"]'

/**
 * Runs `handlers[event.key]` on keydown (`' '` for Space). Ignored while typing in a field, inside a dialog,
 * with a modifier held, or when the key auto-repeats, so a held key never acts twice.
 * Enter and Space keep their native meaning on links and buttons, so keyboard users can still activate them.
 */
export function useShortcuts(handlers: Record<string, () => void>) {
  // An Effect Event always reads the handlers of the latest render, without re-subscribing the listener.
  const handlerFor = useEffectEvent((key: string) => handlers[key])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return
      const target = event.target instanceof Element ? event.target : null
      if (target?.closest(TEXT_FIELDS_AND_DIALOGS)) return
      if ((event.key === 'Enter' || event.key === ' ') && target?.closest(ACTIVATABLE)) return
      const handler = handlerFor(event.key)
      if (!handler) return
      event.preventDefault() // stops Space scrolling the page
      handler()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
