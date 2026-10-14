import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { TopicSummary } from '../../src/content/types.ts'
import { toOverview } from './shards.ts'

const topic: TopicSummary = {
  slug: 'javascript',
  title: 'JavaScript',
  track: 'Frontend',
  summaryHtml: 'The language.',
  flashcardCount: 2,
  chapters: [
    {
      number: '01',
      slug: 'c',
      title: 'C',
      summaryHtml: '',
      questions: [{ id: 'javascript/c/q', number: '010', title: 'Q', titleHtml: 'Q', status: 'draft', difficulty: 'easy', frequency: 3, core: true, hasPage: true }],
    },
  ],
}

test('keeps the topic fields and drops the chapter list in favour of counts', () => {
  const overview = toOverview(topic)
  assert.equal('chapters' in overview, false)
  assert.equal(overview.slug, 'javascript')
  assert.equal(overview.flashcardCount, 2)
  assert.equal(overview.chapterCount, 1)
  assert.equal(overview.stats.total, 1)
  assert.equal(overview.stats.core, 1)
})

test('a topic with no chapters has zero counts', () => {
  const overview = toOverview({ ...topic, chapters: [], flashcardCount: 0 })
  assert.equal(overview.chapterCount, 0)
  assert.equal(overview.stats.total, 0)
})
