// Renders the derived parts of topic and chapter READMEs (R3): the status line and the
// `<!-- generated:… -->` tables. Everything else in a README is hand-written and left untouched.

import { writeFile } from 'node:fs/promises'
import type { Chapter, Question, Topic } from './content.ts'
import type { Status } from './frontmatter.ts'

const QUESTION_MARK: Record<Status, string> = { planned: '🔴', draft: '🟡', published: '🟢' }

interface Progress {
  published: number
  total: number
  /** Oldest `verified` among published questions: the whole set is at least this fresh. */
  lastVerified: string | undefined
}

function progressOf(questions: Question[]): Progress {
  const verified = questions
    .map((question) => question.meta)
    .filter((meta) => meta?.status === 'published')
    .map((meta) => meta.verified)
    .sort()
  return { published: verified.length, total: questions.length, lastVerified: verified[0] }
}

function progressMark({ published, total }: Progress): string {
  if (published === 0) return '🔴'
  return published === total ? '🟢' : '🟡'
}

function statusLine(progress: Progress): string {
  const label = { '🔴': 'planned', '🟡': 'in progress', '🟢': 'complete' }[progressMark(progress)]
  return `> **Status:** ${progressMark(progress)} ${label} · **Published:** ${progress.published}/${progress.total} · **Last verified:** ${progress.lastVerified ?? '—'}`
}

/** Escapes text for a Markdown table cell. */
const cell = (text: string) => text.replaceAll('|', '\\|')

function chaptersTable(topic: Topic): string[] {
  return [
    '| # | Chapter | Status |',
    '|---|---|---|',
    ...topic.chapters.map((chapter) => {
      const mark = progressMark(progressOf(chapter.questions))
      return `| ${chapter.number} | [${cell(chapter.title)}](${chapter.number}-${chapter.slug}/) | ${mark} |`
    }),
  ]
}

function questionsTable(chapter: Chapter): string[] {
  return [
    '| # | Question | Difficulty | Status |',
    '|---|---|---|---|',
    ...chapter.questions.map(({ number, slug, meta }) => {
      if (!meta) throw new Error(`${chapter.dir}/${number}-${slug}.md: render READMEs only after content:check passes`)
      const { title, difficulty, status } = meta
      return `| ${number} | [${cell(title)}](${number}-${slug}.md) | ${difficulty} | ${QUESTION_MARK[status]} ${status} |`
    }),
  ]
}

function replaceStatusLine(readme: string, line: string): string {
  return readme.replace(/^> \*\*Status:\*\*.*$/m, line)
}

function replaceBlock(readme: string, name: string, rows: string[]): string {
  const start = `<!-- generated:${name}:start -->`
  const end = `<!-- generated:${name}:end -->`
  const pattern = new RegExp(`${start}\\n[\\s\\S]*?${end}`)
  return readme.replace(pattern, () => [start, ...rows, end].join('\n'))
}

export function renderTopicReadme(topic: Topic): string {
  const questions = topic.chapters.flatMap((chapter) => chapter.questions)
  const withStatus = replaceStatusLine(topic.readme, statusLine(progressOf(questions)))
  return replaceBlock(withStatus, 'chapters', chaptersTable(topic))
}

export function renderChapterReadme(chapter: Chapter): string {
  const withStatus = replaceStatusLine(chapter.readme, statusLine(progressOf(chapter.questions)))
  return replaceBlock(withStatus, 'questions', questionsTable(chapter))
}

/** Every README whose rendered form differs from what's on disk. */
export function staleReadmes(topics: Topic[]): { file: string; text: string }[] {
  const rendered = topics.flatMap((topic) => [
    { file: topic.readmeFile, current: topic.readme, text: renderTopicReadme(topic) },
    ...topic.chapters.map((chapter) => ({
      file: chapter.readmeFile,
      current: chapter.readme,
      text: renderChapterReadme(chapter),
    })),
  ])
  return rendered.filter(({ current, text }) => current !== text)
}

/** Rewrites stale READMEs; returns the files written. */
export async function writeStaleReadmes(topics: Topic[]): Promise<string[]> {
  const stale = staleReadmes(topics)
  await Promise.all(stale.map(({ file, text }) => writeFile(file, text)))
  return stale.map(({ file }) => file)
}
