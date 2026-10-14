import assert from 'node:assert/strict'
import { test } from 'node:test'
import { summarizeChanges, parseGitLog, type ChangelogQuestion } from './changelog.ts'

const RS = '\x1e'
const US = '\x1f'
const record = (hash: string, date: string, files: string[]) => `${RS}${hash}${US}${date}\n\n${files.join('\n')}\n`

const question = (topic: string, id: string, title = id): [string, ChangelogQuestion] => [
  `content/${id}.md`,
  { id, title, topic, topicTitle: topic.toUpperCase() },
]
const known = new Map([
  question('js', 'js/a/010-x'),
  question('js', 'js/a/020-y'),
  question('ts', 'ts/a/010-z'),
])

test('parses the committer date and the changed files of each commit', () => {
  const commits = parseGitLog(record('a1', '2026-10-02', ['content/js/a/010-x.md', 'content/js/README.md']) + record('b2', '2026-10-01', ['content/ts/README.md']))
  assert.deepEqual(commits, [
    { date: '2026-10-02', files: ['content/js/a/010-x.md', 'content/js/README.md'] },
    { date: '2026-10-01', files: ['content/ts/README.md'] },
  ])
})

test('empty output gives no commits', () => {
  assert.deepEqual(parseGitLog(''), [])
})

test('drops files that are not published questions', () => {
  const changes = summarizeChanges([{ date: '2026-10-02', files: ['content/js/README.md', 'content/flashcards/js.yaml', 'content/js/a/999-gone.md', 'content/js/a/010-x.md'] }], known)
  assert.deepEqual(changes.days, [{ date: '2026-10-02', topics: [{ slug: 'js', title: 'JS', questions: [{ id: 'js/a/010-x', title: 'js/a/010-x' }] }] }])
})

test('a day with no question changes is left out', () => {
  assert.deepEqual(summarizeChanges([{ date: '2026-10-02', files: ['content/js/README.md'] }], known), { complete: true, days: [] })
})

test('lists a question once per day and topic, even when several commits touch it', () => {
  const changes = summarizeChanges(
    [
      { date: '2026-10-02', files: ['content/js/a/010-x.md'] },
      { date: '2026-10-02', files: ['content/js/a/010-x.md', 'content/js/a/020-y.md'] },
    ],
    known,
  )
  assert.deepEqual(changes.days[0].topics[0].questions.map((q) => q.id), ['js/a/010-x', 'js/a/020-y'])
})

test('groups by day then topic, newest day first', () => {
  const changes = summarizeChanges(
    [
      { date: '2026-10-01', files: ['content/js/a/010-x.md'] },
      { date: '2026-10-03', files: ['content/ts/a/010-z.md', 'content/js/a/020-y.md'] },
      { date: '2026-10-02', files: ['content/ts/a/010-z.md'] },
    ],
    known,
  )
  assert.deepEqual(changes.days.map((day) => day.date), ['2026-10-03', '2026-10-02', '2026-10-01'])
  assert.deepEqual(changes.days[0].topics.map((topic) => topic.slug), ['ts', 'js'])
})

test('keeps the newest days and reports incomplete past the cap', () => {
  const commits = ['2026-10-03', '2026-10-02', '2026-10-01'].map((date) => ({ date, files: ['content/js/a/010-x.md'] }))
  const changes = summarizeChanges(commits, known, 2)
  assert.deepEqual(changes.days.map((day) => day.date), ['2026-10-03', '2026-10-02'])
  assert.equal(changes.complete, false)
  assert.equal(summarizeChanges(commits, known, 3).complete, true)
})
