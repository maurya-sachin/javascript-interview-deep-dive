import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readingHours } from '../../src/lib/effort.ts'
import { describePath, readyQuestionCount, stepKey, stepLabel, stepPath, stepProgress, stepState } from '../../src/lib/paths.ts'
import type { PathStep, RolePath } from '../../src/content/types.ts'

function step(overrides: Partial<PathStep>): PathStep {
  return { topic: 'javascript', topicTitle: 'JavaScript', chapter: null, chapterTitle: null, why: 'x', ready: true, started: true, questionCount: 10, ...overrides }
}
const path = (steps: PathStep[]): RolePath => ({ slug: 'p', title: 'P', summary: 's', start: null, steps })

const planned = (overrides: Partial<PathStep>) => step({ ready: false, started: false, ...overrides })

test('describes ready, in-progress and planned topics', () => {
  assert.equal(describePath(path([step({}), step({ topic: 'typescript', topicTitle: 'TypeScript' }), planned({ topic: 'react', topicTitle: 'React' })])), 'JavaScript and TypeScript are ready; 1 more planned')
  assert.equal(describePath(path([step({})])), 'JavaScript is ready')
  assert.equal(describePath(path([step({}), step({ topic: 'b', topicTitle: 'B' }), step({ topic: 'c', topicTitle: 'C' })])), 'JavaScript, B and C are ready')
  assert.equal(describePath(path([step({ ready: false }), step({ topic: 'typescript', topicTitle: 'TypeScript', ready: false }), planned({ topic: 'react' })])), 'JavaScript and TypeScript in progress; 1 more planned')
  assert.equal(describePath(path([step({}), step({ topic: 'typescript', topicTitle: 'TypeScript', ready: false })])), 'JavaScript is ready; TypeScript in progress')
  assert.equal(describePath(path([planned({}), planned({ topic: 'x' })])), 'Planned: nothing written yet')
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

test('a step is done only when every question in it is read', () => {
  const read = ['javascript/a', 'javascript/b']
  assert.equal(stepState(step({ questionCount: 2 }), read), 'done')
  assert.equal(stepState(step({ questionCount: 3 }), read), 'written')
  assert.equal(stepState(step({ ready: false, started: false, questionCount: 0 }), read), 'planned')
  assert.equal(stepState(step({ questionCount: 2 }), []), 'written')
})

test('a started step that is not yet readable is in progress', () => {
  assert.equal(stepState(step({ ready: false, started: true, questionCount: 0 }), []), 'in-progress')
  assert.equal(stepState(step({ ready: false, started: false, questionCount: 0 }), []), 'planned')
})

test('a step is keyed and labelled by its topic and chapter', () => {
  assert.equal(stepKey(step({})), 'javascript/')
  assert.equal(stepKey(step({ chapter: 'engine' })), 'javascript/engine')
  assert.equal(stepLabel(step({})), 'JavaScript')
  assert.equal(stepLabel(step({ chapter: 'engine', chapterTitle: 'How it runs' })), 'JavaScript: How it runs')
})

test('only ready steps count towards a path total', () => {
  assert.equal(readyQuestionCount(path([step({}), step({ questionCount: 5 }), step({ ready: false, questionCount: 0 })])), 15)
  assert.equal(readyQuestionCount(path([step({ ready: false, questionCount: 0 })])), 0)
})
