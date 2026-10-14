// content:status [topic] — progress per chapter and its known gaps (sub-topics ending `→ —`).
// content:status --stale [topic] — instead, the written questions to re-check: stale, or with `perishable` notes.

import { parseArgs } from 'node:util'
import { isStale } from '../src/content/freshness.ts'
import { loadContent, type Chapter, type Question } from './lib/content.ts'

const published = (questions: Question[]) => questions.filter((q) => q.meta?.status === 'published').length
const gapsOf = (chapter: Chapter) => chapter.subTopics.filter((subTopic) => subTopic.refs.length === 0)

const { values, positionals } = parseArgs({ options: { stale: { type: 'boolean', default: false } }, allowPositionals: true })
const onlyTopic = positionals[0]
const { topics, problems } = await loadContent()
const shown = onlyTopic ? topics.filter((topic) => topic.slug === onlyTopic) : topics

if (shown.length === 0) {
  console.error(`✖ no topic \`${onlyTopic}\` — topics: ${topics.map((topic) => topic.slug).join(', ')}`)
  process.exit(1)
}

/** Written questions that are stale or carry `perishable` notes, oldest `verified` first. */
function questionsToRecheck(): string[] {
  const today = new Date()
  const rows = shown
    .flatMap((topic) => topic.chapters.flatMap((chapter) => chapter.questions))
    .flatMap(({ id, meta }) => {
      if (!meta || meta.status === 'planned') return []
      const stale = isStale(meta.verified, today)
      const notes = meta.perishable ?? []
      return stale || notes.length > 0 ? [{ id, verified: meta.verified, stale, notes }] : []
    })
    .sort((a, b) => a.verified.localeCompare(b.verified) || a.id.localeCompare(b.id))
  const width = Math.max(0, ...rows.map((row) => row.id.length))
  return [
    ...rows.map(({ id, verified, stale, notes }) => [id.padEnd(width), verified, stale ? 'stale' : '     ', ...notes.map((note) => `· ${note}`)].join('  ')),
    `${rows.length} question(s) to re-check`,
  ]
}

if (values.stale) {
  console.log(questionsToRecheck().join('\n'))
  process.exit(0)
}

for (const topic of shown) {
  const questions = topic.chapters.flatMap((chapter) => chapter.questions)
  const gapCount = topic.chapters.flatMap(gapsOf).length
  const coverage = topic.chapters.length > 0 ? `${gapCount} gaps` : 'no chapters yet'
  console.log(`\n${topic.slug}  ${published(questions)}/${questions.length} published · ${coverage}`)

  for (const chapter of topic.chapters) {
    const progress = `${published(chapter.questions)}/${chapter.questions.length}`
    console.log(`  ${chapter.number} ${chapter.title.padEnd(44)} ${progress.padStart(5)}`)
    for (const gap of gapsOf(chapter)) {
      console.log(`       → — ${gap.text}`)
    }
  }
}

if (problems.length > 0) console.error(`\n⚠ ${problems.length} problem(s) — counts may be off; run npm run content:check`)
