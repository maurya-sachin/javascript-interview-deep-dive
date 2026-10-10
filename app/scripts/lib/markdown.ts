// Markdown → HTML for content:build. Raw HTML in Markdown is dropped (remark-rehype's default),
// so contributed content can't inject markup into the app.
// TODO: rewrite relative `.md` links between questions to app routes once routing exists (Phase 4 navigation).

import rehypeShiki from '@shikijs/rehype'
import type { Root as HastRoot } from 'hast'
import { toHtml } from 'hast-util-to-html'
import { toString } from 'mdast-util-to-string'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import type { ShikiTransformer } from 'shiki'
import { unified } from 'unified'

/** Lines like `// → 3` show a program's output; the app styles them apart from code. */
const markOutputLines: ShikiTransformer = {
  name: 'mark-output-lines',
  line(hast, line) {
    const text = this.tokens[line - 1].map((token) => token.content).join('')
    if (/^\s*\/\/ →/.test(text)) this.addClassToHast(hast, 'output')
  },
}

const blockProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeShiki, { themes: { light: 'github-light', dark: 'github-dark' }, transformers: [markOutputLines] })
  .use(rehypeStringify)

const inlineProcessor = unified().use(remarkParse).use(remarkRehype)

export async function renderBlock(markdown: string): Promise<string> {
  return String(await blockProcessor.process(markdown))
}

/** One line of Markdown (a title, a TL;DR) as phrasing HTML without a wrapping `<p>`, plus its plain text. */
export async function renderInline(markdown: string): Promise<{ text: string; html: string }> {
  const mdast = inlineProcessor.parse(markdown)
  const hast: HastRoot = await inlineProcessor.run(mdast)
  const children = hast.children.flatMap((node) => (node.type === 'element' && node.tagName === 'p' ? node.children : [node]))
  return { text: toString(mdast), html: toHtml(children) }
}
