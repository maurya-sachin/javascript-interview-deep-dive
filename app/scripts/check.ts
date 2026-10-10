// content:check — validates content/ against `templates/README.md`. Exits 1 on any problem.

import { loadContent, repoRelative, type Content, type Problem } from './lib/content.ts'
import { staleReadmes } from './lib/readme.ts'
import { checkBody } from './lib/sections.ts'

/** Problems that need more than one file to see. */
function checkReferences({ topics }: Content): Problem[] {
  const problems: Problem[] = []
  const ids = new Set(topics.flatMap((topic) => topic.chapters.flatMap((chapter) => chapter.questions.map((q) => q.id))))

  for (const chapter of topics.flatMap((topic) => topic.chapters)) {
    const readme = repoRelative(chapter.readmeFile)
    const numbers = new Set<string>()
    for (const question of chapter.questions) {
      if (numbers.has(question.number)) {
        problems.push({ file: repoRelative(question.file), message: `number ${question.number} is used twice in this chapter` })
      }
      numbers.add(question.number)
    }

    const covered = new Set<string>()
    for (const subTopic of chapter.subTopics) {
      for (const ref of subTopic.refs) {
        covered.add(ref)
        if (!numbers.has(ref)) {
          problems.push({ file: readme, line: subTopic.line, message: `sub-topic points to missing question ${ref}` })
        }
      }
    }
    for (const question of chapter.questions) {
      if (!covered.has(question.number)) {
        problems.push({ file: readme, message: `question ${question.number} is not listed under any sub-topic` })
      }
    }

    for (const question of chapter.questions) {
      if (!question.meta || question.meta.status === 'planned') continue
      for (const id of question.meta.related) {
        if (!ids.has(id)) problems.push({ file: repoRelative(question.file), message: `related: unknown id \`${id}\`` })
      }
    }
  }

  return problems
}

const content = await loadContent()
const questions = content.topics.flatMap((topic) => topic.chapters.flatMap((chapter) => chapter.questions))
const problems = [
  ...content.problems,
  ...questions.flatMap(checkBody),
  ...checkReferences(content),
]
// README tables can only be rendered from valid content, so staleness is checked last.
if (problems.length === 0) {
  for (const { file } of staleReadmes(content.topics)) {
    problems.push({ file: repoRelative(file), message: 'generated parts are out of date — run `npm run content:sync`' })
  }
}

for (const { file, line, message } of problems) {
  console.error(`${file}${line ? `:${line}` : ''}  ${message}`)
}

const chapterCount = content.topics.reduce((sum, topic) => sum + topic.chapters.length, 0)
const summary = `${content.topics.length} topics, ${chapterCount} chapters, ${questions.length} questions`
if (problems.length > 0) {
  console.error(`\n✖ ${problems.length} problem(s) in ${summary}`)
  process.exitCode = 1
} else {
  console.log(`✔ ${summary} — no problems`)
}
