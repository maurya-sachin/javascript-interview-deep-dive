// Counts over chapters, shared by the app and by content:build (which writes them into the manifest).

import type { ChapterSummary, Difficulty, TopicStats } from './types.ts'

/** Totals for a set of chapters: what is readable now, and the difficulty mix of everything planned. */
export function chapterStats(chapters: ChapterSummary[]): TopicStats {
  const questions = chapters.flatMap((chapter) => chapter.questions)
  const withDifficulty = (level: Difficulty) => questions.filter((question) => question.difficulty === level).length
  return {
    total: questions.length,
    readable: questions.filter((question) => question.hasPage).length,
    core: questions.filter((question) => question.core).length,
    byDifficulty: { easy: withDifficulty('easy'), medium: withDifficulty('medium'), hard: withDifficulty('hard') },
  }
}
