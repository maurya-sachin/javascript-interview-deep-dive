import { InlineHtml } from './question/InlineHtml'

/** A question title with inline code. */
export function QuestionTitle({ html }: { html: string }) {
  return <InlineHtml html={html} className="[&_code]:font-mono [&_code]:text-[0.9em]" />
}
