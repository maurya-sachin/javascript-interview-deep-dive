import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseGitLog } from './changelog.ts'

const RS = '\x1e'
const US = '\x1f'
const record = (hash: string, date: string, subject: string, files: string[]) => `${RS}${hash}${US}${date}${US}${subject}\n\n${files.join('\n')}\n`

test('strips a leading conventional prefix, with or without a scope', () => {
  const log = record('a1', '2026-10-02', 'content(javascript): add closures', ['content/javascript/09-closures/010-x.md']) + record('b2', '2026-10-01', 'docs: fix typo', ['content/javascript/README.md'])
  assert.deepEqual(
    parseGitLog(log).map((entry) => entry.subject),
    ['add closures', 'fix typo'],
  )
})

test('keeps a subject that has no conventional prefix', () => {
  const [entry] = parseGitLog(record('a1', '2026-10-02', 'Merge pull request #4 from v2', ['content/git/README.md']))
  assert.equal(entry.subject, 'Merge pull request #4 from v2')
})

test('reads hash and date, and lists each topic once, sorted', () => {
  const [entry] = parseGitLog(
    record('abc123', '2026-10-02', 'content: batch', ['content/typescript/01-a/010-x.md', 'content/javascript/01-a/010-y.md', 'content/typescript/01-a/020-z.md']),
  )
  assert.equal(entry.hash, 'abc123')
  assert.equal(entry.date, '2026-10-02')
  assert.deepEqual(entry.topics, ['javascript', 'typescript'])
})

test('maps a flashcard deck to its topic and ignores role paths', () => {
  const [entry] = parseGitLog(record('a1', '2026-10-02', 'content: cards and paths', ['content/flashcards/react.yaml', 'content/paths/frontend.yaml']))
  assert.deepEqual(entry.topics, ['react'])
})

test('a commit that touches only a topic README still names the topic', () => {
  const [entry] = parseGitLog(record('a1', '2026-10-02', 'docs: refresh status', ['content/nodejs/README.md']))
  assert.deepEqual(entry.topics, ['nodejs'])
})

test('a commit that touches only role paths has no topics', () => {
  const [entry] = parseGitLog(record('a1', '2026-10-02', 'content: reorder path', ['content/paths/frontend.yaml']))
  assert.deepEqual(entry.topics, [])
})

test('keeps unicode in subjects', () => {
  const [entry] = parseGitLog(record('a1', '2026-10-02', 'content: explain “null” vs undefined — ✓', ['content/javascript/README.md']))
  assert.equal(entry.subject, 'explain “null” vs undefined — ✓')
})

test('empty output gives no entries', () => {
  assert.deepEqual(parseGitLog(''), [])
})
