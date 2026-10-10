// content:new — creates a `planned` question stub and re-syncs README tables.
// Usage: npm run content:new -- <topic>/<chapter> <slug> "<title>" --difficulty <easy|medium|hard> --frequency <1-5> [--core] [--number NNN]

import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { loadContent, QUESTION_FILE, repoRelative } from './lib/content.ts'
import { frontmatterSchema } from './lib/frontmatter.ts'
import { writeStaleReadmes } from './lib/readme.ts'

const USAGE =
  'Usage: npm run content:new -- <topic>/<chapter> <slug> "<title>" --difficulty <easy|medium|hard> --frequency <1-5> [--core] [--number NNN]'

function fail(message: string): never {
  console.error(`✖ ${message}`)
  process.exit(1)
}

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    difficulty: { type: 'string' },
    frequency: { type: 'string' },
    core: { type: 'boolean', default: false },
    number: { type: 'string' },
  },
})

if (positionals.length !== 3) fail(USAGE)
const [chapterPath, slug, title] = positionals

const [topicSlug, chapterSlug] = chapterPath.split('/')
const { topics, problems } = await loadContent()
if (problems.length > 0) fail(`${problems.length} problem(s) in content/ — run npm run content:check first`)

const topic = topics.find((candidate) => candidate.slug === topicSlug)
if (!topic) fail(`no topic \`${topicSlug}\` — topics: ${topics.map((t) => t.slug).join(', ')}`)
const chapter = topic.chapters.find((candidate) => candidate.slug === chapterSlug)
if (!chapter) fail(`no chapter \`${chapterSlug}\` in ${topicSlug} — chapters: ${topic.chapters.map((c) => c.slug).join(', ')}`)

// Next free step of 10 unless a number between neighbours (e.g. 015) is given.
const lastNumber = Math.max(0, ...chapter.questions.map((question) => Number(question.number)))
const number = values.number ?? String(Math.floor(lastNumber / 10) * 10 + 10).padStart(3, '0')
const fileName = `${number}-${slug}.md`

if (!QUESTION_FILE.test(fileName)) fail(`\`${fileName}\` must be \`NNN-kebab-slug.md\``)
if (chapter.questions.some((question) => question.number === number)) fail(`number ${number} is taken`)
if (chapter.questions.some((question) => question.slug === slug)) fail(`slug \`${slug}\` is taken`)

const meta = frontmatterSchema.safeParse({
  title,
  status: 'planned',
  difficulty: values.difficulty,
  frequency: Number(values.frequency),
  core: values.core,
})
if (!meta.success) fail(meta.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '))

const { difficulty, frequency, core } = meta.data
const file = path.join(chapter.dir, fileName)
// JSON strings are valid YAML double-quoted scalars, so titles with `:` or quotes stay safe.
const frontmatter = [
  '---',
  `title: ${JSON.stringify(meta.data.title)}`,
  'status: planned',
  `difficulty: ${difficulty}`,
  `frequency: ${frequency}`,
  `core: ${core}`,
  '---',
  '',
].join('\n')
await writeFile(file, frontmatter, { flag: 'wx' })
console.log(`created ${repoRelative(file)}`)

for (const readme of await writeStaleReadmes((await loadContent()).topics)) console.log(`updated ${repoRelative(readme)}`)
console.log(`Next: point a sub-topic in ${repoRelative(chapter.readmeFile)} at ${number} — content:check fails until you do.`)
