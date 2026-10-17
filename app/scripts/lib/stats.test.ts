import assert from 'node:assert/strict'
import { test } from 'node:test'
import { chapterStats } from '../../src/content/stats.ts'
import type { ChapterSummary, QuestionSummary } from '../../src/content/types.ts'

function question(overrides: Partial<QuestionSummary>): QuestionSummary {
  return { id: 't/c/q', number: '010', title: 'Q', titleHtml: 'Q', status: 'draft', difficulty: 'easy', frequency: 3, core: false, hasPage: true, verified: '2026-10', stale: false, legacy: null, ...overrides }
}

function chapter(questions: QuestionSummary[]): ChapterSummary {
  return { number: '01', slug: 'c', title: 'C', summaryHtml: '', summaryText: '', questions }
}

test('counts total, readable, core and the difficulty mix across chapters', () => {
  const stats = chapterStats([
    chapter([question({ difficulty: 'easy', core: true }), question({ difficulty: 'hard', hasPage: false })]),
    chapter([question({ difficulty: 'medium' })]),
  ])
  assert.deepEqual(stats, { total: 3, readable: 2, core: 1, byDifficulty: { easy: 1, medium: 1, hard: 1 }, lastVerified: '2026-10', stale: 0, reviewed: 0, drafted: 3 })
})

test('no chapters gives zeros', () => {
  assert.deepEqual(chapterStats([]), { total: 0, readable: 0, core: 0, byDifficulty: { easy: 0, medium: 0, hard: 0 }, lastVerified: null, stale: 0, reviewed: 0, drafted: 0 })
})

test('lastVerified is the oldest month among readable questions; planned ones are ignored', () => {
  const stats = chapterStats([
    chapter([
      question({ verified: '2026-05' }),
      question({ verified: '2025-09', stale: true }),
      question({ status: 'planned', hasPage: false, verified: null }),
    ]),
  ])
  assert.equal(stats.lastVerified, '2025-09')
})

test('counts stale and reviewed questions among the readable ones', () => {
  const stats = chapterStats([
    chapter([
      question({ status: 'published', stale: true }),
      question({ status: 'published' }),
      question({ status: 'draft', stale: true }),
      question({ status: 'published', stale: true, hasPage: false }),
    ]),
  ])
  assert.equal(stats.stale, 2)
  assert.equal(stats.reviewed, 2)
})

test('a topic with no readable questions has no lastVerified', () => {
  const stats = chapterStats([chapter([question({ status: 'planned', hasPage: false, verified: null })])])
  assert.equal(stats.lastVerified, null)
  assert.equal(stats.stale, 0)
})

test('drafted counts drafts whether or not this build gives them a page', () => {
  const stats = chapterStats([chapter([question({}), question({ hasPage: false }), question({ status: 'published' }), question({ status: 'planned', hasPage: false })])])
  assert.equal(stats.drafted, 2)
})
