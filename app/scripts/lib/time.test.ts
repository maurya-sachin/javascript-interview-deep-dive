import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatUntil } from '../../src/lib/time.ts'

const now = new Date('2026-10-14T12:00:00Z')
const later = (ms: number) => new Date(now.getTime() + ms)

test('formats the time until a date in the largest whole unit', () => {
  assert.equal(formatUntil(later(2 * 86_400_000), now), 'in 2 days')
  assert.equal(formatUntil(later(86_400_000), now), 'tomorrow')
  assert.equal(formatUntil(later(3 * 3_600_000), now), 'in 3 hours')
  assert.equal(formatUntil(later(90_000), now), 'in 2 minutes')
})

test('anything under a minute away, or already past, is now', () => {
  assert.equal(formatUntil(later(10_000), now), 'now')
  assert.equal(formatUntil(later(-5 * 60_000), now), 'now')
})
