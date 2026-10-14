// Narrowing a topic's chapters for the outline filter on the topic page.

import type { ChapterSummary } from './types.ts'

export interface OutlineFilter {
  query: string
  unreadOnly: boolean
}

/**
 * Chapters narrowed to matching questions. A chapter whose title matches keeps all its questions
 * (still subject to `unreadOnly`). Chapters left with no questions are dropped. Order is kept.
 */
export function filterOutline(chapters: ChapterSummary[], read: readonly string[], { query, unreadOnly }: OutlineFilter): ChapterSummary[] {
  const needle = query.trim().toLowerCase()
  return chapters.flatMap((chapter) => {
    const chapterMatches = needle === '' || chapter.title.toLowerCase().includes(needle)
    const questions = chapter.questions.filter(
      (question) => (chapterMatches || question.title.toLowerCase().includes(needle)) && !(unreadOnly && read.includes(question.id)),
    )
    return questions.length > 0 ? [{ ...chapter, questions }] : []
  })
}
