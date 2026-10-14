import assert from 'node:assert/strict'
import { test } from 'node:test'
import { chapterStats } from '../../src/content/stats.ts'
import type { ChapterSummary, QuestionSummary } from '../../src/content/types.ts'

function question(overrides: Partial<QuestionSummary>): QuestionSummary {
  return { id: 't/c/q', number: '010', title: 'Q', titleHtml: 'Q', status: 'draft', difficulty: 'easy', frequency: 3, core: false, hasPage: true, ...overrides }
}

function chapter(questions: QuestionSummary[]): ChapterSummary {
  return { number: '01', slug: 'c', title: 'C', summaryHtml: '', questions }
}

test('counts total, readable, core and the difficulty mix across chapters', () => {
  const stats = chapterStats([
    chapter([question({ difficulty: 'easy', core: true }), question({ difficulty: 'hard', hasPage: false })]),
    chapter([question({ difficulty: 'medium' })]),
  ])
  assert.deepEqual(stats, { total: 3, readable: 2, core: 1, byDifficulty: { easy: 1, medium: 1, hard: 1 } })
})

test('no chapters gives zeros', () => {
  assert.deepEqual(chapterStats([]), { total: 0, readable: 0, core: 0, byDifficulty: { easy: 0, medium: 0, hard: 0 } })
})
