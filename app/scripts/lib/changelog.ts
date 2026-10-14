// The changelog lists the published questions that changed, taken from `git log` over content/ at build time.

import { execFileSync } from 'node:child_process'
import type { Changelog, ChangelogDay } from '../../src/content/types.ts'
import { repoRoot } from './paths.ts'

/** The newest days kept; the page links to the repository history for the rest. */
const MAX_DAYS = 200

// `%cd` is the committer date: it follows the commit onto `main` when a PR is merged, `%ad` would not.
const GIT_LOG_ARGS = ['log', '--date=short', '--format=%x1e%H%x1f%cd', '--name-only', '--', 'content/']

const RECORD_SEPARATOR = '\x1e'
const FIELD_SEPARATOR = '\x1f'

/** One commit that touched content/, with the repository-relative paths it changed. */
export interface Commit {
  /** `YYYY-MM-DD`. */
  date: string
  files: string[]
}

/** What the changelog needs to know about a question; keyed by its repository-relative file path. */
export interface ChangelogQuestion {
  id: string
  title: string
  topic: string
  topicTitle: string
}

function parseRecord(record: string): Commit {
  const [header, ...files] = record.split('\n')
  const [, date] = header.split(FIELD_SEPARATOR)
  return { date, files: files.filter((file) => file !== '') }
}

/** Parses the output of `git log` run with `GIT_LOG_ARGS`, newest first as git prints it. */
export function parseGitLog(output: string): Commit[] {
  return output
    .split(RECORD_SEPARATOR)
    .filter((record) => record.trim() !== '')
    .map(parseRecord)
}

/**
 * Turns commits (newest first) into one row per day per topic listing the questions that changed.
 * Files that are not a question with a page in this build (READMEs, flashcards, paths, deleted files) are dropped.
 */
export function summarizeChanges(commits: Commit[], questionsByPath: Map<string, ChangelogQuestion>, maxDays = MAX_DAYS): Changelog {
  // Insertion order follows the commits, so days and topics stay newest first.
  type TopicRow = { topic: ChangelogQuestion; questions: Map<string, string> }
  const days = new Map<string, Map<string, TopicRow>>()
  for (const { date, files } of commits) {
    for (const file of files) {
      const question = questionsByPath.get(file)
      if (!question) continue
      const topics = days.get(date) ?? new Map<string, TopicRow>()
      const row = topics.get(question.topic) ?? { topic: question, questions: new Map() }
      row.questions.set(question.id, question.title)
      topics.set(question.topic, row)
      days.set(date, topics)
    }
  }

  const all: ChangelogDay[] = [...days]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, topics]) => ({
      date,
      topics: [...topics.values()].map(({ topic, questions }) => ({
        slug: topic.topic,
        title: topic.topicTitle,
        questions: [...questions].map(([id, title]) => ({ id, title })),
      })),
    }))
  return { complete: all.length <= maxDays, days: all.slice(0, maxDays) }
}

function git(...args: string[]): string {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 60_000,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  })
}

const isShallow = () => git('rev-parse', '--is-shallow-repository').trim() === 'true'

/** CI hosts (Vercel sets CI=1) clone shallowly; a local build never touches `.git`. */
function deepenCiClone(): void {
  if (!process.env.CI || !isShallow()) return
  try {
    git('fetch', '--unshallow', '--quiet')
  } catch (error) {
    console.warn(`⚠ changelog: could not fetch full history (${(error as Error).message.split('\n')[0]})`)
  }
}

/** Reads the changelog from git history. Git problems never fail the build: they give an incomplete, empty changelog. */
export function readChangelog(questionsByPath: Map<string, ChangelogQuestion>): Changelog {
  try {
    deepenCiClone()
    const changelog = summarizeChanges(parseGitLog(git(...GIT_LOG_ARGS)), questionsByPath)
    return { ...changelog, complete: changelog.complete && !isShallow() }
  } catch (error) {
    console.warn(`⚠ changelog: git history unavailable (${(error as Error).message.split('\n')[0]})`)
    return { complete: false, days: [] }
  }
}
