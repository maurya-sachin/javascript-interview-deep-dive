/** Renders HTML compiled by content:build, which drops raw HTML from Markdown sources. */
export function Html({ html }: { html: string }) {
  return <div className="content" dangerouslySetInnerHTML={{ __html: html }} />
}
