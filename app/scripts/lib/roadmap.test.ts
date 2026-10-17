import assert from 'node:assert/strict'
import { test } from 'node:test'
import { orderTrack, topicState } from '../../src/content/roadmap.ts'
import type { PathStep, RolePath, TopicOverview } from '../../src/content/types.ts'

function topic(slug: string, overrides: { chapterCount?: number; readable?: number } = {}): TopicOverview {
  return {
    slug,
    title: slug.toUpperCase(),
    track: 'Languages',
    covers: null,
    summaryHtml: '',
    summaryText: '',
    flashcardCount: 0,
    chapterCount: overrides.chapterCount ?? 0,
    stats: { total: 0, readable: overrides.readable ?? 0, core: 0, byDifficulty: { easy: 0, medium: 0, hard: 0 }, lastVerified: null, stale: 0, reviewed: 0 },
  }
}
const step = (slug: string): PathStep => ({ topic: slug, topicTitle: slug, chapter: null, chapterTitle: null, why: '', ready: true, questionCount: 1 })
const path = (slug: string, slugs: string[]): RolePath => ({ slug, title: slug, summary: '', start: null, steps: slugs.map(step) })
const slugs = (topics: TopicOverview[]) => topics.map((t) => t.slug)

test('topic state follows readable questions, then chapters', () => {
  assert.equal(topicState(topic('a', { chapterCount: 2, readable: 3 })), 'written')
  assert.equal(topicState(topic('a', { chapterCount: 2 })), 'in-progress')
  assert.equal(topicState(topic('a')), 'planned')
})

test('orders topics by the path that covers most of them, then alphabetically', () => {
  const topics = [topic('c'), topic('a'), topic('d'), topic('b')]
  const paths = [path('short', ['b', 'x']), path('long', ['d', 'x', 'b', 'c'])]
  assert.deepEqual(slugs(orderTrack(topics, paths)), ['d', 'b', 'c', 'a'])
})

test('a tie goes to the earlier path', () => {
  const topics = [topic('a'), topic('b')]
  assert.deepEqual(slugs(orderTrack(topics, [path('first', ['b']), path('second', ['a'])])), ['b', 'a'])
})

test('topics on no path sort by title; empty input stays empty', () => {
  assert.deepEqual(slugs(orderTrack([topic('z'), topic('m')], [path('p', ['q'])])), ['m', 'z'])
  assert.deepEqual(orderTrack([], [path('p', ['a'])]), [])
  assert.deepEqual(slugs(orderTrack([topic('b'), topic('a')], [])), ['a', 'b'])
})
