import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatInterval, formatUntil } from '../../src/lib/time.ts'

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

test('formats an interval compactly, in minutes, hours, days, months or years', () => {
  assert.equal(formatInterval(later(10 * 60_000), now), '10 min')
  assert.equal(formatInterval(later(3 * 3_600_000), now), '3 h')
  assert.equal(formatInterval(later(86_400_000), now), '1 day')
  assert.equal(formatInterval(later(6 * 86_400_000), now), '6 days')
  assert.equal(formatInterval(later(90 * 86_400_000), now), '3 mo')
  assert.equal(formatInterval(later(800 * 86_400_000), now), '2 yr')
})

test('an interval is never shorter than a minute', () => {
  assert.equal(formatInterval(later(5_000), now), '1 min')
  assert.equal(formatInterval(later(-60_000), now), '1 min')
})

test('a value that rounds up to the next unit is shown in that unit', () => {
  assert.equal(formatInterval(later(59.6 * 60_000), now), '1 h')
  assert.equal(formatInterval(later(23.7 * 3_600_000), now), '1 day')
  assert.equal(formatInterval(later(29.7 * 86_400_000), now), '1 mo')
})
