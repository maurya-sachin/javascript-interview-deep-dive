import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { TopicSummary } from '../../src/content/types.ts'
import { toOverview } from './shards.ts'

const topic: TopicSummary = {
  slug: 'javascript',
  title: 'JavaScript',
  track: 'Frontend',
  covers: null,
  summaryHtml: 'The language.',
  summaryText: 'The language.',
  plannedAreasHtml: ['Semantic HTML'],
  flashcardCount: 2,
  chapters: [
    {
      number: '01',
      slug: 'c',
      title: 'C',
      summaryHtml: '',
      summaryText: '',
      questions: [{ id: 'javascript/c/q', number: '010', title: 'Q', titleHtml: 'Q', status: 'draft', difficulty: 'easy', frequency: 3, core: true, hasPage: true, verified: '2026-10', stale: false, legacy: null }],
    },
  ],
}

test('keeps the topic fields and lists chapters without their questions', () => {
  const overview = toOverview(topic)
  assert.equal(overview.chapters.some((chapter) => 'questions' in chapter), false)
  assert.equal(overview.slug, 'javascript')
  assert.equal(overview.flashcardCount, 2)
  assert.equal(overview.chapterCount, 1)
  assert.deepEqual(overview.chapters, [{ number: '01', slug: 'c', title: 'C', questionCount: 1 }])
  assert.deepEqual(overview.plannedAreasHtml, ['Semantic HTML'])
  assert.equal(overview.stats.total, 1)
  assert.equal(overview.stats.core, 1)
})

test('a topic with no chapters has zero counts', () => {
  const overview = toOverview({ ...topic, chapters: [], flashcardCount: 0 })
  assert.equal(overview.chapterCount, 0)
  assert.equal(overview.stats.total, 0)
})
