// Relative `.md` links between questions: found in Markdown, resolved to question ids, checked and rewritten at build.

import path from 'node:path'
import type { Link, Nodes } from 'mdast'
import { CHAPTER_DIR, QUESTION_FILE } from './content.ts'
import { contentDir } from './paths.ts'

const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i

export function visitLinks(node: Nodes, visit: (link: Link) => void): void {
  if (node.type === 'link') visit(node)
  if ('children' in node) node.children.forEach((child) => visitLinks(child, visit))
}

export interface QuestionLink {
  id: string
  /** Absolute path of the linked question file, whether or not it exists. */
  file: string
}

/** The markdown file a link points at, or null for external links, anchors, and non-`.md` targets. */
export function targetMarkdownFile(fromFile: string, href: string): string | null {
  if (HAS_SCHEME.test(href) || href.startsWith('#') || href.startsWith('/')) return null
  const [target] = href.split('#')
  return target.endsWith('.md') ? path.resolve(path.dirname(fromFile), target) : null
}

/** The question a `.md` file is, judged by its path alone: `content/<topic>/<NN-chapter>/<NNN-slug>.md`. */
export function questionAt(file: string): QuestionLink | null {
  const parts = path.relative(contentDir, file).split(path.sep)
  if (parts.length !== 3) return null
  const [topic, chapterDir, fileName] = parts
  const chapter = CHAPTER_DIR.exec(chapterDir)
  const question = QUESTION_FILE.exec(fileName)
  return chapter && question ? { id: `${topic}/${chapter[2]}/${question[2]}`, file } : null
}
