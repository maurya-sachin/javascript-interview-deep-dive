// Counts over chapters, shared by the app and by content:build (which writes them into the manifest).

import { oldestMonth } from './freshness.ts'
import type { ChapterSummary, Difficulty, TopicStats } from './types.ts'

/** Totals for a set of chapters: what is readable now, and the difficulty mix of everything planned. */
export function chapterStats(chapters: ChapterSummary[]): TopicStats {
  const questions = chapters.flatMap((chapter) => chapter.questions)
  const withDifficulty = (level: Difficulty) => questions.filter((question) => question.difficulty === level).length
  const readable = questions.filter((question) => question.hasPage)
  return {
    total: questions.length,
    readable: readable.length,
    core: questions.filter((question) => question.core).length,
    byDifficulty: { easy: withDifficulty('easy'), medium: withDifficulty('medium'), hard: withDifficulty('hard') },
    lastVerified: oldestMonth(readable.flatMap((question) => (question.verified === null ? [] : [question.verified]))),
    stale: readable.filter((question) => question.stale).length,
    reviewed: readable.filter((question) => question.status === 'published').length,
    drafted: questions.filter((question) => question.status === 'draft').length,
  }
}
