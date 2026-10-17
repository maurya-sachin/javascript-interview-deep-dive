import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { ChapterSummary, QuestionSummary, TopicSummary } from '../../src/content/types.ts'
import { resolveRolePaths, validateRolePaths, type RolePathSource } from './rolepaths.ts'

function questions(readable: number, unreadable = 0): QuestionSummary[] {
  return Array.from({ length: readable + unreadable }, (_, index) => ({
    id: `q${index}`, number: '010', title: 'Q', titleHtml: 'Q', status: 'draft', difficulty: 'easy', frequency: 3, core: false, hasPage: index < readable, verified: '2026-10', stale: false, legacy: null,
  }))
}
function chapter(slug: string, title: string, list: QuestionSummary[]): ChapterSummary {
  return { number: '01', slug, title, summaryHtml: '', summaryText: '', questions: list }
}
function topic(slug: string, title: string, chapters: ChapterSummary[]): TopicSummary {
  return { slug, title, track: 'Frontend', covers: null, summaryHtml: '', summaryText: '', plannedAreasHtml: [], flashcardCount: 0, chapters }
}

const topics: TopicSummary[] = [
  topic('javascript', 'JavaScript', [chapter('engine', 'How JavaScript runs', questions(2, 1)), chapter('types', 'Types', questions(1))]),
  topic('typescript', 'TypeScript', [chapter('compiler', 'The compiler', questions(0, 4))]),
  topic('react', 'React', []),
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

test('resolves titles and counts only readable questions, sorted by order', () => {
  const resolved = resolveRolePaths(
    [path({ slug: 'second', order: 2 }), path({ steps: [{ ref: 'javascript/engine', why: 'a' }, { ref: 'typescript', why: 'b' }, { ref: 'react', why: 'c' }, { ref: 'javascript/types', why: 'd' }] })],
    topics,
  )
  assert.deepEqual(resolved.map((entry) => entry.slug), ['frontend', 'second'])
  const [chapterStep, unreadableStep, plannedStep, otherChapter] = resolved[0].steps
  assert.deepEqual(chapterStep, { topic: 'javascript', topicTitle: 'JavaScript', chapter: 'engine', chapterTitle: 'How JavaScript runs', why: 'a', ready: true, started: true, questionCount: 2 })
  assert.deepEqual([unreadableStep.ready, unreadableStep.questionCount], [false, 0])
  assert.deepEqual([plannedStep.ready, plannedStep.questionCount], [false, 0])
  assert.deepEqual([unreadableStep.started, plannedStep.started], [true, false])
  assert.equal(otherChapter.questionCount, 1)
  assert.equal(resolved[1].steps[0].questionCount, 3)
})

test('a chapter entry may not repeat a topic that is already on the path', () => {
  const problems = validateRolePaths([path({ steps: [{ ref: 'javascript', why: 'a' }, { ref: 'javascript/engine', why: 'b' }] })], topics, questionIds)
  assert.match(problems.map((problem) => problem.message).join('\n'), /`javascript\/engine` is already covered by `javascript`/)
  const reversed = validateRolePaths([path({ steps: [{ ref: 'javascript/engine', why: 'b' }, { ref: 'javascript', why: 'a' }] })], topics, questionIds)
  assert.match(reversed.map((problem) => problem.message).join('\n'), /`javascript\/engine` is already covered by `javascript`/)
})

test('the file name, which becomes the URL, must be kebab-case', () => {
  const problems = validateRolePaths([path({ slug: 'Front End', file: 'content/paths/Front End.yaml' })], topics, questionIds)
  assert.match(problems.map((problem) => problem.message).join('\n'), /file name must be kebab-case/)
})
