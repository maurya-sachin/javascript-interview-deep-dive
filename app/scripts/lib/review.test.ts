import assert from 'node:assert/strict'
import { test } from 'node:test'
import { deckStatus, dueQueue, NEW_CARDS_PER_SESSION, nextDue, type Reviews } from '../../src/content/review.ts'

const now = new Date('2026-10-14T12:00:00Z')
const card = (due: string) => ({ due, stability: 1, difficulty: 5, elapsed_days: 0, scheduled_days: 1, learning_steps: 0, reps: 1, lapses: 0 })

const reviews = {
  'javascript/a': card('2026-10-13T00:00:00Z'), // overdue
  'javascript/b': card('2026-10-20T00:00:00Z'), // future
  'javascript/c': card('2026-10-14T18:00:00Z'), // future, sooner
  'typescript/x': card('2026-10-01T00:00:00Z'),
} as unknown as Reviews

test('deck status counts due and unseen cards for one topic only', () => {
  assert.deepEqual(deckStatus('javascript', 10, reviews, now), { due: 1, unseen: 7 })
  assert.deepEqual(deckStatus('typescript', 1, reviews, now), { due: 1, unseen: 0 })
  assert.deepEqual(deckStatus('react', 0, reviews, now), { due: 0, unseen: 0 })
})

test('stale review ids never push counts negative or past the deck size', () => {
  assert.deepEqual(deckStatus('javascript', 2, reviews, now), { due: 1, unseen: 0 })
  assert.deepEqual(deckStatus('typescript', 0, reviews, now), { due: 0, unseen: 0 })
})

test('next due is the soonest future review in the topic', () => {
  assert.deepEqual(nextDue('javascript', reviews, now), new Date('2026-10-14T18:00:00Z'))
  assert.equal(nextDue('typescript', reviews, now), null)
  assert.equal(nextDue('react', reviews, now), null)
})

test('a session takes every overdue card, oldest first, then at most 20 new ones', () => {
  const cards = ['a', 'b', 'c', ...Array.from({ length: 30 }, (_, index) => `new-${index}`)].map((id) => ({
    id: `javascript/${id}`, topic: 'javascript', frontHtml: '', backHtml: '', question: null,
  }))
  const queue = dueQueue(cards, reviews, now).map((card) => card.id)
  assert.equal(NEW_CARDS_PER_SESSION, 20)
  assert.deepEqual(queue.slice(0, 1), ['javascript/a'])
  assert.equal(queue.length, 1 + NEW_CARDS_PER_SESSION)
  assert.ok(!queue.includes('javascript/b') && !queue.includes('javascript/c'))
})
