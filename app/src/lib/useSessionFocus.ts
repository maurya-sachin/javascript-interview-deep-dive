import { useEffect, useRef } from 'react'

/**
 * Keeps keyboard and screen-reader focus on the session content. Attach `promptRef` to the card or question,
 * `answerRef` to the revealed answer, and `doneRef` to the heading of the end-of-session summary (all need
 * `tabIndex={-1}`). Focus moves to the answer on reveal, back to the prompt when `step` advances, and to the
 * summary when the session `finished`. It never moves on the first render, unless `focusOnStart` is set
 * (for a round the learner just chose to begin).
 */
export function useSessionFocus<Prompt extends HTMLElement, Answer extends HTMLElement>(step: number, revealed: boolean, finished: boolean, focusOnStart = false) {
  const promptRef = useRef<Prompt>(null)
  const answerRef = useRef<Answer>(null)
  const doneRef = useRef<HTMLHeadingElement>(null)
  const lastMoment = useRef({ step, revealed, finished })

  useEffect(() => {
    if (focusOnStart) promptRef.current?.focus()
  }, [focusOnStart])

  useEffect(() => {
    const last = lastMoment.current
    if (last.step === step && last.revealed === revealed && last.finished === finished) return
    lastMoment.current = { step, revealed, finished }
    if (finished) doneRef.current?.focus()
    else if (revealed) answerRef.current?.focus()
    else promptRef.current?.focus()
  }, [step, revealed, finished])

  return { promptRef, answerRef, doneRef }
}
