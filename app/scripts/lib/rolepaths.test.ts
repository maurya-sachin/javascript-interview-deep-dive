import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolveRolePaths, validateRolePaths, type RolePathSource, type TopicLike } from './rolepaths.ts'

const topics: TopicLike[] = [
  { slug: 'javascript', title: 'JavaScript', chapters: [{ slug: 'engine', title: 'How JavaScript runs', questions: [1, 2, 3] }, { slug: 'types', title: 'Types', questions: [1] }] },
  { slug: 'react', title: 'React', chapters: [] },
]
const questionIds = new Set(['javascript/engine/a'])

function path(overrides: Partial<RolePathSource> = {}): RolePathSource {
  return {
    slug: 'frontend',
    file: 'content/paths/frontend.yaml',
    title: 'Frontend engineer',
    summary: 'Language first.',
    order: 1,
    steps: [{ ref: 'javascript', why: 'The language.' }, { ref: 'react', why: 'The framework.' }],
    ...overrides,
  }
}

test('a valid path has no problems', () => {
  assert.deepEqual(validateRolePaths([path({ start: 'javascript/engine/a' })], topics, questionIds), [])
})

test('reports an unknown topic, an unknown chapter, a duplicate entry and an unknown start question', () => {
  const problems = validateRolePaths(
    [path({ start: 'javascript/engine/zzz', steps: [{ ref: 'nope', why: 'x' }, { ref: 'javascript/missing', why: 'x' }, { ref: 'javascript', why: 'x' }, { ref: 'javascript', why: 'y' }] })],
    topics,
    questionIds,
  )
  const messages = problems.map((problem) => problem.message).join('\n')
  assert.match(messages, /unknown topic `nope`/)
  assert.match(messages, /unknown chapter `javascript\/missing`/)
  assert.match(messages, /`javascript` appears twice/)
  assert.match(messages, /start: unknown question `javascript\/engine\/zzz`/)
  assert.ok(problems.every((problem) => problem.file === 'content/paths/frontend.yaml'))
})

test('two paths may not share an order', () => {
  const problems = validateRolePaths([path(), path({ slug: 'backend', file: 'content/paths/backend.yaml' })], topics, questionIds)
  assert.match(problems.map((problem) => problem.message).join('\n'), /order 1 is already used by `frontend`/)
})

test('resolves readiness, titles and question counts, sorted by order', () => {
  const resolved = resolveRolePaths(
    [path({ slug: 'second', order: 2 }), path({ steps: [{ ref: 'javascript/engine', why: 'a' }, { ref: 'javascript', why: 'b' }, { ref: 'react', why: 'c' }] })],
    topics,
  )
  assert.deepEqual(resolved.map((entry) => entry.slug), ['frontend', 'second'])
  const [chapterStep, topicStep, plannedStep] = resolved[0].steps
  assert.deepEqual(chapterStep, { topic: 'javascript', topicTitle: 'JavaScript', chapter: 'engine', chapterTitle: 'How JavaScript runs', why: 'a', ready: true, questionCount: 3 })
  assert.equal(topicStep.chapter, null)
  assert.equal(topicStep.questionCount, 4)
  assert.deepEqual([plannedStep.ready, plannedStep.questionCount], [false, 0])
})
