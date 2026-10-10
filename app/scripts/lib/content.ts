// Loads the content/ tree into topics → chapters → questions.
// Everything derivable (ids, numbers, titles of folders) comes from paths, never from file contents (R3).

import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { parse as parseYaml } from 'yaml'
import { loadDecks, type Deck } from './flashcards.ts'
import { frontmatterSchema, type Frontmatter } from './frontmatter.ts'
import { contentDir, repoRelative, type Problem } from './paths.ts'

export interface SubTopic {
  text: string
  /** Question numbers (`010`); empty for a known gap (`→ —`). */
  refs: string[]
  line: number
}

export interface Question {
  id: string
  number: string
  slug: string
  file: string
  /** `null` when the frontmatter failed validation; the failure is in `Content.problems`. */
  meta: Frontmatter | null
  body: string
  /** Line in the file where `body` starts, for problem reports. */
  bodyLine: number
}

export interface Chapter {
  number: string
  slug: string
  title: string
  dir: string
  readmeFile: string
  readme: string
  subTopics: SubTopic[]
  questions: Question[]
}

export interface Topic {
  slug: string
  title: string
  dir: string
  readmeFile: string
  readme: string
  chapters: Chapter[]
}

export interface Content {
  topics: Topic[]
  decks: Deck[]
  problems: Problem[]
}

const KEBAB = '[a-z0-9]+(?:-[a-z0-9]+)*'
const TOPIC_DIR = new RegExp(`^${KEBAB}$`)
const CHAPTER_DIR = new RegExp(`^(\\d{2})-(${KEBAB})$`)
export const QUESTION_FILE = new RegExp(`^(\\d{3})-(${KEBAB})\\.md$`)
const FRONTMATTER = /^---\n([\s\S]*?)\n---\n?/
const SUB_TOPIC = /^- (.+) → (.+)$/
const GAP = '—'

/** Folders under content/ that hold something other than a topic. */
const NON_TOPIC_DIRS = new Set(['flashcards'])

export async function loadContent(): Promise<Content> {
  const problems: Problem[] = []
  const topics: Topic[] = []

  for (const name of await listDirs(contentDir)) {
    if (NON_TOPIC_DIRS.has(name)) continue
    const dir = path.join(contentDir, name)
    if (!TOPIC_DIR.test(name)) {
      problems.push({ file: repoRelative(dir), message: 'topic folder must be kebab-case' })
      continue
    }
    topics.push(await loadTopic(name, dir, problems))
  }

  return { topics, decks: await loadDecks(problems), problems }
}

async function loadTopic(slug: string, dir: string, problems: Problem[]): Promise<Topic> {
  const readmeFile = path.join(dir, 'README.md')
  const readme = await readText(readmeFile, problems)
  const chapters: Chapter[] = []

  for (const name of await listDirs(dir)) {
    const match = CHAPTER_DIR.exec(name)
    if (!match) {
      problems.push({ file: repoRelative(path.join(dir, name)), message: 'chapter folder must be `NN-kebab-slug`' })
      continue
    }
    const [, number, chapterSlug] = match
    chapters.push(await loadChapter(slug, number, chapterSlug, path.join(dir, name), problems))
  }

  requireGenerated(readme, readmeFile, 'chapters', problems)
  return { slug, title: readHeading(readme, readmeFile, problems), dir, readmeFile, readme, chapters }
}

async function loadChapter(
  topic: string,
  number: string,
  slug: string,
  dir: string,
  problems: Problem[],
): Promise<Chapter> {
  const readmeFile = path.join(dir, 'README.md')
  const readme = await readText(readmeFile, problems)
  const heading = readHeading(readme, readmeFile, problems)
  requireGenerated(readme, readmeFile, 'questions', problems)

  // Chapter headings are `NN — Title`; the number must match the folder.
  const [headingNumber, title = heading] = heading.split(' — ', 2)
  if (headingNumber !== number) {
    problems.push({ file: repoRelative(readmeFile), line: 1, message: `heading must start with \`${number} — \`` })
  }

  const questions: Question[] = []
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    // Skip the README and dotfiles such as macOS's .DS_Store.
    if (!entry.isFile() || entry.name === 'README.md' || entry.name.startsWith('.')) continue
    const file = path.join(dir, entry.name)
    const match = QUESTION_FILE.exec(entry.name)
    if (!match) {
      problems.push({ file: repoRelative(file), message: 'question file must be `NNN-kebab-slug.md`' })
      continue
    }
    const [, questionNumber, questionSlug] = match
    questions.push(await loadQuestion(`${topic}/${slug}/${questionSlug}`, questionNumber, questionSlug, file, problems))
  }

  return {
    number,
    slug,
    title,
    dir,
    readmeFile,
    readme,
    subTopics: parseSubTopics(readme, readmeFile, problems),
    questions,
  }
}

async function loadQuestion(
  id: string,
  number: string,
  slug: string,
  file: string,
  problems: Problem[],
): Promise<Question> {
  const text = await readText(file, problems)
  const match = FRONTMATTER.exec(text)
  if (!match) problems.push({ file: repoRelative(file), line: 1, message: 'missing `---` frontmatter block' })
  const header = match?.[0] ?? ''

  return {
    id,
    number,
    slug,
    file,
    meta: match ? parseFrontmatter(match[1], file, problems) : null,
    body: text.slice(header.length),
    bodyLine: header.split('\n').length,
  }
}

function parseFrontmatter(yaml: string, file: string, problems: Problem[]): Frontmatter | null {
  let data: unknown
  try {
    data = parseYaml(yaml)
  } catch (error) {
    problems.push({ file: repoRelative(file), message: `frontmatter is not valid YAML: ${(error as Error).message}` })
    return null
  }

  const result = frontmatterSchema.safeParse(data)
  if (result.success) return result.data
  for (const issue of result.error.issues) {
    const field = issue.path.join('.') || 'frontmatter'
    problems.push({ file: repoRelative(file), message: `${field}: ${issue.message}` })
  }
  return null
}

/** Reads the `## Sub-topics` list: `- Concept → 010, 030` or `- Concept → —`. */
function parseSubTopics(readme: string, file: string, problems: Problem[]): SubTopic[] {
  const subTopics: SubTopic[] = []
  if (readme === '') return subTopics // a missing README is already reported
  const lines = readme.split('\n')
  const start = lines.indexOf('## Sub-topics')
  if (start === -1) {
    problems.push({ file: repoRelative(file), message: 'missing `## Sub-topics` section' })
    return subTopics
  }

  for (let index = start + 1; index < lines.length && !lines[index].startsWith('## '); index++) {
    const line = lines[index]
    if (!line.startsWith('- ')) continue
    const match = SUB_TOPIC.exec(line)
    if (!match) {
      problems.push({ file: repoRelative(file), line: index + 1, message: 'sub-topic must end with `→ NNN, NNN` or `→ —`' })
      continue
    }
    const [, text, target] = match
    const refs = target === GAP ? [] : target.split(',').map((ref) => ref.trim())
    const badRef = refs.find((ref) => !/^\d{3}$/.test(ref))
    if (badRef !== undefined) {
      problems.push({ file: repoRelative(file), line: index + 1, message: `\`${badRef}\` is not a question number` })
      continue
    }
    subTopics.push({ text, refs, line: index + 1 })
  }

  return subTopics
}

/** The parts `content:sync` rewrites must exist, or a stale README would pass unnoticed. */
function requireGenerated(readme: string, file: string, block: string, problems: Problem[]): void {
  if (readme === '') return // a missing README is already reported
  if (!/^> \*\*Status:\*\*/m.test(readme)) {
    problems.push({ file: repoRelative(file), message: 'missing `> **Status:**` line' })
  }
  for (const marker of [`<!-- generated:${block}:start -->`, `<!-- generated:${block}:end -->`]) {
    if (!readme.includes(marker)) problems.push({ file: repoRelative(file), message: `missing \`${marker}\`` })
  }
}

function readHeading(readme: string, file: string, problems: Problem[]): string {
  if (readme === '') return '' // a missing README is already reported
  const firstLine = readme.split('\n', 1)[0]
  if (!firstLine.startsWith('# ')) {
    problems.push({ file: repoRelative(file), line: 1, message: 'first line must be a `# ` heading' })
    return ''
  }
  return firstLine.slice(2).trim()
}

async function readText(file: string, problems: Problem[]): Promise<string> {
  try {
    return await readFile(file, 'utf8')
  } catch {
    problems.push({ file: repoRelative(file), message: 'file is missing' })
    return ''
  }
}

async function listDirs(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
}
