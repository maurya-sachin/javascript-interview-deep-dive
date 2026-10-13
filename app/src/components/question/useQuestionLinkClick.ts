import type { MouseEvent } from 'react'
import { useNavigate } from 'react-router'

/**
 * Click handler for compiled content: links to other questions (marked `data-question-link` by content:build)
 * navigate inside the app instead of reloading. Modified clicks keep the browser's default (new tab, etc.).
 */
export function useQuestionLinkClick() {
  const navigate = useNavigate()
  return (event: MouseEvent<HTMLElement>) => {
    const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
    if (event.defaultPrevented || event.button !== 0 || modified) return
    if (!(event.target instanceof Element)) return
    const link = event.target.closest('a[data-question-link]')
    const href = link?.getAttribute('href')
    if (!href) return
    event.preventDefault()
    void navigate(href)
  }
}
