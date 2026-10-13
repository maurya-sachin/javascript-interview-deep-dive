import { useQuestionLinkClick } from './useQuestionLinkClick'

/** Renders HTML compiled by content:build, which drops raw HTML from Markdown sources. */
export function Html({ html }: { html: string }) {
  const onClick = useQuestionLinkClick()
  return <div className="content" onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />
}
