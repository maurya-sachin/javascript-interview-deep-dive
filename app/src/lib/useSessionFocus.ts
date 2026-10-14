import { useEffect, useRef } from 'react'

/**
 * Keeps keyboard and screen-reader focus on the session content. Attach `promptRef` to the card or question,
 * `answerRef` to the revealed answer (both need `tabIndex={-1}`). Focus moves to the answer on reveal and back
 * to the prompt when `step` advances; it never moves on the first render.
 */
export function useSessionFocus<Prompt extends HTMLElement, Answer extends HTMLElement>(step: number, revealed: boolean) {
  const promptRef = useRef<Prompt>(null)
  const answerRef = useRef<Answer>(null)
  const lastMoment = useRef({ step, revealed })

  useEffect(() => {
    const last = lastMoment.current
    if (last.step === step && last.revealed === revealed) return
    lastMoment.current = { step, revealed }
    if (revealed) answerRef.current?.focus()
    else promptRef.current?.focus()
  }, [step, revealed])

  return { promptRef, answerRef }
}
