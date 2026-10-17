import assert from 'node:assert/strict'
import { test } from 'node:test'
import { filterOutline } from '../../src/content/outline.ts'
import type { ChapterSummary, QuestionSummary } from '../../src/content/types.ts'

function question(id: string, title: string): QuestionSummary {
  return { id, number: '010', title, titleHtml: title, status: 'draft', difficulty: 'easy', frequency: 3, core: false, hasPage: true, verified: '2026-10', stale: false, legacy: null }
}

const chapters: ChapterSummary[] = [
  { number: '01', slug: 'engine', title: 'How JavaScript runs', titleHtml: 'How JavaScript runs', summaryHtml: '', summaryText: '', questions: [question('js/engine/a', 'What is an engine?'), question('js/engine/b', 'What is a host?')] },
  { number: '02', slug: 'types', title: 'Values and types', titleHtml: 'Values and types', summaryHtml: '', summaryText: '', questions: [question('js/types/a', 'What is typeof null?')] },
]
const none = { query: '', unreadOnly: false }

test('no filter returns every chapter unchanged', () => {
  assert.deepEqual(filterOutline(chapters, [], none), chapters)
})

test('a query keeps only matching questions, case-insensitively, and drops empty chapters', () => {
  const result = filterOutline(chapters, [], { ...none, query: 'ENGINE' })
  assert.deepEqual(result.map((chapter) => chapter.slug), ['engine'])
  assert.deepEqual(result[0].questions.map((q) => q.id), ['js/engine/a'])
})

test('a matching chapter title keeps all of its questions', () => {
  const result = filterOutline(chapters, [], { ...none, query: 'values' })
  assert.deepEqual(result.map((chapter) => chapter.slug), ['types'])
  assert.equal(result[0].questions.length, 1)
  const whole = filterOutline(chapters, [], { ...none, query: 'how javascript' })
  assert.equal(whole[0].questions.length, 2)
})

test('unreadOnly hides read questions and chapters left empty', () => {
  const result = filterOutline(chapters, ['js/engine/a', 'js/types/a'], { ...none, unreadOnly: true })
  assert.deepEqual(result.map((chapter) => chapter.slug), ['engine'])
  assert.deepEqual(result[0].questions.map((q) => q.id), ['js/engine/b'])
})

test('regex characters in the query match literally', () => {
  assert.deepEqual(filterOutline(chapters, [], { ...none, query: '(' }), [])
  assert.deepEqual(filterOutline(chapters, [], { ...none, query: '.*' }), [])
  assert.equal(filterOutline(chapters, [], { ...none, query: 'typeof null?' }).length, 1)
})

test('a whitespace-only query is no filter', () => {
  assert.deepEqual(filterOutline(chapters, [], { ...none, query: '   ' }), chapters)
})
