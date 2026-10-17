import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { TopicOverview } from '../../src/content/types.ts'
import { chapterReadCount, topicBranches } from '../../src/lib/diagram.ts'

const topic = {
  slug: 'js',
  chapters: [
    { number: '01', slug: 'engine', titleHtml: 'Engine', questionCount: 2 },
    { number: '02', slug: 'types', titleHtml: '<code>typeof</code>', questionCount: 3 },
    { number: '03', slug: 'empty', titleHtml: 'Empty', questionCount: 0 },
  ],
  plannedAreasHtml: ['Regex'],
} as TopicOverview

test('read count stays within the chapter and ignores look-alike prefixes', () => {
  const read = ['js/engine/a', 'js/engine/b', 'js/engine/gone', 'js/engines/x']
  assert.equal(chapterReadCount('js', topic.chapters[0], read), 2)
})

test('chapters carry progress; planned areas follow, with no page', () => {
  const branches = topicBranches(topic, ['js/engine/a', 'js/engine/b', 'js/types/a'])
  assert.deepEqual(
    branches.map(({ key, state, to }) => [key, state, to]),
    [
      ['engine', 'done', '/js/engine'],
      ['types', 'started', '/js/types'],
      ['empty', 'unread', '/js/empty'],
      ['planned-0', 'planned', null],
    ],
  )
})
