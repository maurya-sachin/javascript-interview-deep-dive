// Every rule content:check enforces, shared with content:build so nothing invalid ships.

import type { Content } from './content.ts'
import { targetMarkdownFile, visitLinks } from './links.ts'
import { repoRelative, type Problem } from './paths.ts'
import { validateRolePaths } from './rolepaths.ts'
import { parseMarkdown } from './markdown.ts'
import { staleReadmes } from './readme.ts'
import { checkBody } from './sections.ts'

function questionIdsOf(topics: Content['topics']): Set<string> {
  return new Set(topics.flatMap((topic) => topic.chapters.flatMap((chapter) => chapter.questions.map((question) => question.id))))
}

/** Problems that need more than one file to see. */
function checkReferences({ topics }: Content): Problem[] {
  const problems: Problem[] = []
  const ids = questionIdsOf(topics)

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

/** Relative `.md` links in written questions must point at question files that exist. */
function checkQuestionLinks({ topics }: Content): Problem[] {
  const problems: Problem[] = []
  const questions = topics.flatMap((topic) => topic.chapters.flatMap((chapter) => chapter.questions))
  const questionFiles = new Set(questions.map((question) => question.file))

  for (const question of questions) {
    if (!question.meta || question.meta.status === 'planned') continue
    visitLinks(parseMarkdown(question.body), (link) => {
      const target = targetMarkdownFile(question.file, link.url)
      if (target !== null && !questionFiles.has(target)) {
        problems.push({ file: repoRelative(question.file), message: `link \`${link.url}\` is not an existing question file` })
      }
    })
  }
  return problems
}

/** Each deck belongs to an existing topic, has unique card ids, and links only to real questions. */
function checkDecks({ topics, decks }: Content): Problem[] {
  const problems: Problem[] = []
  const topicSlugs = new Set(topics.map((topic) => topic.slug))
  const questionIds = questionIdsOf(topics)

  for (const deck of decks) {
    const file = repoRelative(deck.file)
    if (!topicSlugs.has(deck.topic)) problems.push({ file, message: `no topic folder \`${deck.topic}\` for this deck` })
    const seen = new Set<string>()
    for (const card of deck.cards) {
      if (seen.has(card.id)) problems.push({ file, message: `card id \`${card.id}\` is used twice` })
      seen.add(card.id)
      if (card.question !== undefined && !questionIds.has(card.question)) {
        problems.push({ file, message: `card \`${card.id}\`: unknown question \`${card.question}\`` })
      }
    }
  }
  return problems
}

/** Topic folders can't take names the app uses for other routes (`paths/` and `flashcards/` are already content folders). */
const RESERVED_TOPIC_SLUGS = ['practice', 'roadmap', 'changelog']

/** Topic names that clash with app routes, and role paths that don't resolve. */
function checkRolePaths({ topics, paths }: Content): Problem[] {
  const questionIds = questionIdsOf(topics)
  const reserved = topics
    .filter((topic) => RESERVED_TOPIC_SLUGS.includes(topic.slug))
    .map((topic): Problem => ({ file: repoRelative(topic.dir), message: `\`${topic.slug}\` is a reserved route name; pick another folder name` }))
  return [...reserved, ...validateRolePaths(paths, topics, questionIds)]
}

export function collectProblems(content: Content): Problem[] {
  const questions = content.topics.flatMap((topic) => topic.chapters.flatMap((chapter) => chapter.questions))
  const problems = [...content.problems, ...questions.flatMap(checkBody), ...checkReferences(content), ...checkQuestionLinks(content), ...checkDecks(content), ...checkRolePaths(content)]
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
