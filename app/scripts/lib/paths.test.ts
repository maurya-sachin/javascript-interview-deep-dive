import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readingHours } from '../../src/lib/effort.ts'
import { describePath, stepPath, stepProgress } from '../../src/lib/paths.ts'
import type { PathStep, RolePath } from '../../src/content/types.ts'

function step(overrides: Partial<PathStep>): PathStep {
  return { topic: 'javascript', topicTitle: 'JavaScript', chapter: null, chapterTitle: null, why: 'x', ready: true, questionCount: 10, ...overrides }
}
const path = (steps: PathStep[]): RolePath => ({ slug: 'p', title: 'P', summary: 's', start: null, steps })

test('describes ready and planned topics', () => {
  assert.equal(describePath(path([step({}), step({ topic: 'typescript', topicTitle: 'TypeScript' }), step({ topic: 'react', topicTitle: 'React', ready: false })])), 'JavaScript and TypeScript are ready; 1 more planned')
  assert.equal(describePath(path([step({})])), 'JavaScript is ready')
  assert.equal(describePath(path([step({ ready: false }), step({ topic: 'x', ready: false })])), 'Roadmap only: nothing published yet')
  assert.equal(describePath(path([step({}), step({ topic: 'b', topicTitle: 'B' }), step({ topic: 'c', topicTitle: 'C' })])), 'JavaScript, B and C are ready')
})

test('step paths point at the chapter when one is named', () => {
  assert.equal(stepPath(step({})), '/javascript')
  assert.equal(stepPath(step({ chapter: 'engine' })), '/javascript/engine')
})

test('progress counts read ids under the step prefix only', () => {
  const read = ['javascript/engine/a', 'javascript/types/b', 'javascriptx/c/d', 'typescript/e/f']
  assert.deepEqual(stepProgress(step({}), read), { read: 2, total: 10 })
  assert.deepEqual(stepProgress(step({ chapter: 'engine' }), read), { read: 1, total: 10 })
  assert.deepEqual(stepProgress(step({ questionCount: 1 }), read), { read: 1, total: 1 })
})

test('reading effort is 5 minutes a question, rounded to whole hours, at least one', () => {
  assert.equal(readingHours(150), 13)
  assert.equal(readingHours(12), 1)
  assert.equal(readingHours(1), 1)
  assert.equal(readingHours(0), 0)
})
