import assert from 'node:assert/strict'
import { test } from 'node:test'
import { depthStrokeClass } from '../../src/lib/depth.ts'

test('the first level is the shallowest stop and the last level the deepest, for any level count', () => {
  for (const levels of [1, 2, 3, 4, 6, 9]) {
    assert.equal(depthStrokeClass(0, levels), levels === 1 ? 'stroke-depth-4' : 'stroke-depth-1', `first of ${levels}`)
    assert.equal(depthStrokeClass(levels - 1, levels), 'stroke-depth-4', `last of ${levels}`)
  }
})

test('levels in between move down the scale without skipping back', () => {
  const stops = Array.from({ length: 9 }, (_, level) => Number(depthStrokeClass(level, 9).at(-1)))
  assert.deepEqual(stops, [...stops].sort((a, b) => a - b))
  assert.deepEqual(depthStrokeClass(1, 3), 'stroke-depth-3')
})
