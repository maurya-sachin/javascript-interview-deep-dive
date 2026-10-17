import assert from 'node:assert/strict'
import { test } from 'node:test'
import { contourRings, furthestPoint, ringAtLevel, ringPath } from '../../src/lib/contours.ts'

const SEEDS = Array.from({ length: 120 }, (_, index) => `topic-${index}`)

test('the same seed always draws the same map', () => {
  assert.deepEqual(contourRings({ seed: 'javascript', levels: 6 }), contourRings({ seed: 'javascript', levels: 6 }))
})

test('different seeds draw different maps', () => {
  assert.notDeepEqual(contourRings({ seed: 'javascript', levels: 6 }), contourRings({ seed: 'typescript', levels: 6 }))
})

test('every level has a closed ring strictly inside the frame, for any seed and level count', () => {
  for (const seed of SEEDS) {
    for (const levels of [1, 3, 6, 9, 30]) {
      const rings = contourRings({ seed, levels })
      for (let level = 0; level < levels; level++) {
        assert.ok(rings.some((ring) => ring.level === level), `${seed}: level ${level} of ${levels} has no ring`)
      }
      for (const { points } of rings) {
        assert.ok(points.length >= 3, `${seed}: ring with ${points.length} points`)
        for (const [x, y] of points) assert.ok(x > 0 && x < 100 && y > 0 && y < 100, `${seed}: point (${x}, ${y}) outside the frame`)
      }
    }
  }
})

test('steepness changes the map', () => {
  assert.notDeepEqual(contourRings({ seed: 'javascript', levels: 6, steepness: 0 }), contourRings({ seed: 'javascript', levels: 6, steepness: 1 }))
})

test('size scales the coordinates', () => {
  const [ring] = contourRings({ seed: 'javascript', levels: 3, size: 200 })
  assert.ok(ring.points.some(([x, y]) => x > 100 || y > 100))
})

test('ringPath closes the path and rounds to one decimal', () => {
  assert.equal(ringPath([[1, 2], [3.456, 4], [5, 6.04]]), 'M1.0 2.0L3.5 4.0L5.0 6.0Z')
})

test('ringAtLevel returns the ring with the most points at that level', () => {
  const rings = contourRings({ seed: 'javascript', levels: 6 })
  const ring = ringAtLevel(rings, 2)
  assert.ok(ring)
  assert.ok(rings.filter((candidate) => candidate.level === 2).every((candidate) => candidate.points.length <= ring.points.length))
  assert.equal(ringAtLevel(rings, 99), undefined)
})

test('furthestPoint picks the point furthest in a direction (angle 0 is right, y grows downward)', () => {
  const square: [number, number][] = [[0, 0], [10, 0], [10, 10], [0, 10]]
  assert.equal(furthestPoint(square, 0)[0], 10)
  assert.equal(furthestPoint(square, Math.PI)[0], 0)
  assert.equal(furthestPoint(square, Math.PI / 2)[1], 10)
  assert.equal(furthestPoint(square, -Math.PI / 2)[1], 0)
})
