/** Inline HTML (titles, TL;DR, follow-ups) compiled by content:build, which drops raw HTML from sources. */
export function InlineHtml({ html, className }: { html: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
