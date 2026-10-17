import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatMonth, isStale, monthOf, oldestMonth } from '../../src/content/freshness.ts'

const today = new Date(Date.UTC(2026, 9, 14))

test('a question verified exactly 12 months before the build month is stale', () => {
  assert.equal(isStale('2025-10', today), true)
})

test('11 months, the same month and older months follow the same cut', () => {
  assert.equal(isStale('2025-11', today), false)
  assert.equal(isStale('2026-10', today), false)
  assert.equal(isStale('2024-01', today), true)
})

test('the 12-month cut holds across a year boundary', () => {
  assert.equal(isStale('2025-12', new Date(Date.UTC(2026, 11, 1))), true)
  assert.equal(isStale('2026-01', new Date(Date.UTC(2026, 11, 1))), false)
})

test('oldestMonth picks the earliest month, and null for none', () => {
  assert.equal(oldestMonth([]), null)
  assert.equal(oldestMonth(['2026-03', '2025-11', '2026-01']), '2025-11')
})

test('monthOf uses UTC and zero-pads', () => {
  assert.equal(monthOf(new Date(Date.UTC(2026, 0, 31, 23, 59))), '2026-01')
  assert.equal(monthOf(today), '2026-10')
})

test('formatMonth spells the month out', () => {
  assert.equal(formatMonth('2026-10'), 'October 2026')
  assert.equal(formatMonth('2025-01'), 'January 2025')
})
