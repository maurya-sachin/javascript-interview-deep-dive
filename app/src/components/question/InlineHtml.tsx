import { useQuestionLinkClick } from './useQuestionLinkClick'

/** Inline HTML (titles, TL;DR, follow-ups) compiled by content:build, which drops raw HTML from sources. */
export function InlineHtml({ html, className }: { html: string; className?: string }) {
  const onClick = useQuestionLinkClick()
  return <span className={className} onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />
}
