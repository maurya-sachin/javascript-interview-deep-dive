// content:check — validates content/ against `templates/README.md`. Exits 1 on any problem.

import { collectProblems, printProblems } from './lib/check.ts'
import { loadContent } from './lib/content.ts'

const content = await loadContent()
const problems = collectProblems(content)
printProblems(problems)

const chapters = content.topics.flatMap((topic) => topic.chapters)
const questionCount = chapters.reduce((sum, chapter) => sum + chapter.questions.length, 0)
const summary = `${content.topics.length} topics, ${chapters.length} chapters, ${questionCount} questions`
if (problems.length > 0) {
  console.error(`\n✖ ${problems.length} problem(s) in ${summary}`)
  process.exitCode = 1
} else {
  console.log(`✔ ${summary} — no problems`)
}
