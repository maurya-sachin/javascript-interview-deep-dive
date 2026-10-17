import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Reviews } from '../../src/content/review.ts'
import { fsrs, Rating } from 'ts-fsrs'
import { createBackup, mergeBackup, parseBackup } from '../../src/lib/backup.ts'
import type { Progress } from '../../src/lib/progressTypes.ts'

const now = new Date('2026-10-14T12:00:00Z')
const card = (due: string, lastReview: string | null) =>
  ({ due, state: 2, last_review: lastReview, stability: 1, difficulty: 5, elapsed_days: 0, scheduled_days: 1, learning_steps: 0, reps: 1, lapses: 0 }) as unknown as Reviews[string]
const progress: Progress = { read: ['javascript/a/b'], last: 'javascript/a/b', lastTitleHtml: '<code>x</code>' }
const reviews: Reviews = { 'javascript/one': card('2026-10-20T00:00:00Z', '2026-10-10T00:00:00Z') }

test('a backup survives a round trip, with only the read questions', () => {
  const parsed = parseBackup(JSON.stringify(createBackup(progress, reviews, now)))
  assert.deepEqual(parsed.progress, { read: ['javascript/a/b'] })
  assert.deepEqual(parsed.reviews, JSON.parse(JSON.stringify(reviews)))
  assert.equal(parsed.exportedAt, now.toISOString())
})

test('rejects files that are not isobath progress, with a reader-facing message', () => {
  assert.throws(() => parseBackup('not json'), /not valid JSON/)
  assert.throws(() => parseBackup('{"hello":1}'), /not an isobath progress file/)
  const valid = createBackup(progress, reviews, now)
  assert.throws(() => parseBackup(JSON.stringify({ ...valid, version: 2 })), /not an isobath progress file/)
  assert.throws(() => parseBackup(JSON.stringify({ ...valid, progress: { read: [1] } })), /reading progress is damaged/)
  assert.throws(() => parseBackup(JSON.stringify({ ...valid, reviews: { 'javascript/one': { due: true } } })), /flashcard history is damaged/)
  assert.throws(() => parseBackup(JSON.stringify({ ...valid, reviews: { 'Not An Id': card('2026-10-20T00:00:00Z', null) } })), /flashcard history is damaged/)
  for (const damaged of [{ ...card('2026-10-20T00:00:00Z', null), state: undefined }, { ...card('2026-10-20T00:00:00Z', null), state: 7 }, { ...card('2026-10-20T00:00:00Z', null), stability: Number.NaN }, card('garbage', null), card('2026-10-20T00:00:00Z', 'garbage')]) {
    assert.throws(() => parseBackup(JSON.stringify({ ...valid, reviews: { 'javascript/one': damaged } })), /flashcard history is damaged/)
  }
  assert.throws(() => parseBackup('{"format":"isobath-progress","version":1,"progress":{"read":[]},"reviews":{"__proto__":{"due":"2026-10-20"}}}'), /flashcard history is damaged/)
})

test('never imports HTML, whatever the file says', () => {
  const hostile = { ...createBackup(progress, reviews, now), progress: { read: [], last: 'x/y/z', lastTitleHtml: '<img src=x onerror=alert(1)>' } }
  const parsed = parseBackup(JSON.stringify(hostile))
  assert.equal('lastTitleHtml' in parsed.progress, false)
})

test('merge unions reading progress and never takes the last question from a file', () => {
  const incoming = parseBackup(JSON.stringify(createBackup({ read: ['javascript/c/d', 'javascript/a/b'], last: 'javascript/c/d', lastTitleHtml: null }, {}, now)))
  const merged = mergeBackup({ progress, reviews }, incoming)
  assert.deepEqual(merged.progress, { read: ['javascript/a/b', 'javascript/c/d'], last: 'javascript/a/b', lastTitleHtml: '<code>x</code>' })
  const fresh = mergeBackup({ progress: { read: [], last: null, lastTitleHtml: null }, reviews: {} }, incoming)
  assert.deepEqual(fresh.progress, { read: ['javascript/c/d', 'javascript/a/b'], last: null, lastTitleHtml: null })
})

test('merge keeps the most recently reviewed copy of each card and adds new ones', () => {
  const incoming = parseBackup(
    JSON.stringify(
      createBackup(progress, { 'javascript/one': card('2026-11-01T00:00:00Z', '2026-10-12T00:00:00Z'), 'javascript/two': card('2026-10-15T00:00:00Z', null) }, now),
    ),
  )
  const older = parseBackup(JSON.stringify(createBackup(progress, { 'javascript/one': card('2026-10-15T00:00:00Z', '2026-10-01T00:00:00Z') }, now)))
  const merged = mergeBackup({ progress, reviews }, incoming)
  assert.equal(String(merged.reviews['javascript/one'].due), '2026-11-01T00:00:00Z')
  assert.ok('javascript/two' in merged.reviews)
  assert.equal(String(mergeBackup({ progress, reviews }, older).reviews['javascript/one'].due), '2026-10-20T00:00:00Z')
})

test('a parsed card can be rated', () => {
  const parsed = parseBackup(JSON.stringify(createBackup(progress, reviews, now)))
  assert.doesNotThrow(() => fsrs().next(parsed.reviews['javascript/one'], new Date(), Rating.Good))
})
