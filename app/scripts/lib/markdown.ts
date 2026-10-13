// Markdown → HTML for content:build. Raw HTML in Markdown is dropped (remark-rehype's default),
// so contributed content can't inject markup into the app.

import rehypeShiki from '@shikijs/rehype'
import type { Root as HastRoot } from 'hast'
import type { Root as MdastRoot } from 'mdast'
import { toHtml } from 'hast-util-to-html'
import { toString } from 'mdast-util-to-string'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import type { ShikiTransformer } from 'shiki'
import { unified } from 'unified'
import { questionAt, targetMarkdownFile, visitLinks } from './links.ts'

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

/** Parses Markdown to mdast without rendering; for checks that read the structure. */
export function parseMarkdown(markdown: string): MdastRoot {
  return blockProcessor.parse(markdown)
}

const inlineProcessor = unified().use(remarkParse).use(remarkRehype)

/**
 * Points relative links to other questions at their app route (`/<topic>/<chapter>/<slug>`) and marks them
 * so the app navigates without a page load. Links that aren't questions are left alone; content:check flags them.
 */
function rewriteQuestionLinks(tree: MdastRoot, sourceFile: string): void {
  visitLinks(tree, (link) => {
    const file = targetMarkdownFile(sourceFile, link.url)
    const question = file && questionAt(file)
    if (!question) return
    const fragment = link.url.includes('#') ? `#${link.url.split('#')[1]}` : ''
    link.url = `/${question.id}${fragment}`
    link.data = { ...link.data, hProperties: { 'data-question-link': '' } }
  })
}

/** `sourceFile` is the Markdown file the text came from; give it so relative question links resolve. */
export async function renderBlock(markdown: string, sourceFile?: string): Promise<string> {
  const tree = blockProcessor.parse(markdown)
  if (sourceFile) rewriteQuestionLinks(tree, sourceFile)
  return String(blockProcessor.stringify(await blockProcessor.run(tree)))
}

/** One line of Markdown (a title, a TL;DR) as phrasing HTML without a wrapping `<p>`, plus its plain text. */
export async function renderInline(markdown: string, sourceFile?: string): Promise<{ text: string; html: string }> {
  const mdast = inlineProcessor.parse(markdown)
  if (sourceFile) rewriteQuestionLinks(mdast, sourceFile)
  const hast: HastRoot = await inlineProcessor.run(mdast)
  const children = hast.children.flatMap((node) => (node.type === 'element' && node.tagName === 'p' ? node.children : [node]))
  return { text: toString(mdast), html: toHtml(children) }
}
