// Every rule content:check enforces, shared with content:build so nothing invalid ships.

import { repoRelative, type Content, type Problem } from './content.ts'
import { staleReadmes } from './readme.ts'
import { checkBody } from './sections.ts'

/** Problems that need more than one file to see. */
function checkReferences({ topics }: Content): Problem[] {
  const problems: Problem[] = []
  const ids = new Set(topics.flatMap((topic) => topic.chapters.flatMap((chapter) => chapter.questions.map((q) => q.id))))

  for (const chapter of topics.flatMap((topic) => topic.chapters)) {
    const readme = repoRelative(chapter.readmeFile)
    const numbers = new Set<string>()
    const slugs = new Set<string>()
    for (const question of chapter.questions) {
      const file = repoRelative(question.file)
      if (numbers.has(question.number)) problems.push({ file, message: `number ${question.number} is used twice in this chapter` })
      if (slugs.has(question.slug)) problems.push({ file, message: `slug \`${question.slug}\` is used twice, so the id isn't unique` })
      numbers.add(question.number)
      slugs.add(question.slug)
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

export function collectProblems(content: Content): Problem[] {
  const questions = content.topics.flatMap((topic) => topic.chapters.flatMap((chapter) => chapter.questions))
  const problems = [...content.problems, ...questions.flatMap(checkBody), ...checkReferences(content)]
  // README tables can only be rendered from valid content, so staleness is checked last.
  if (problems.length === 0) {
    for (const { file } of staleReadmes(content.topics)) {
      problems.push({ file: repoRelative(file), message: 'generated parts are out of date — run `npm run content:sync`' })
    }
  }
  return problems
}

export function printProblems(problems: Problem[]): void {
  for (const { file, line, message } of problems) {
    console.error(`${file}${line ? `:${line}` : ''}  ${message}`)
  }
}
