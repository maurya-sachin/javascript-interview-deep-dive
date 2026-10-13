// content:status [topic] — progress per chapter and its known gaps (sub-topics ending `→ —`).

import { loadContent, type Chapter, type Question } from './lib/content.ts'

const published = (questions: Question[]) => questions.filter((q) => q.meta?.status === 'published').length
const gapsOf = (chapter: Chapter) => chapter.subTopics.filter((subTopic) => subTopic.refs.length === 0)

const onlyTopic = process.argv[2]
const { topics, problems } = await loadContent()
const shown = onlyTopic ? topics.filter((topic) => topic.slug === onlyTopic) : topics

if (shown.length === 0) {
  console.error(`✖ no topic \`${onlyTopic}\` — topics: ${topics.map((topic) => topic.slug).join(', ')}`)
  process.exit(1)
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
