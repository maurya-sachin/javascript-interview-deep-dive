/** A question title with inline code; the HTML comes from content:build, which drops raw HTML from sources. */
export function QuestionTitle({ html }: { html: string }) {
  return <span className="[&_code]:font-mono [&_code]:text-[0.9em]" dangerouslySetInnerHTML={{ __html: html }} />
}
