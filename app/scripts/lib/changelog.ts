// The changelog is `git log` over content/, parsed at build time.

import { execFileSync } from 'node:child_process'
import type { Changelog, ChangelogEntry } from '../../src/content/types.ts'
import { repoRoot } from './paths.ts'

/** The newest entries kept; the page links to the repository history for the rest. */
export const MAX_ENTRIES = 300

const GIT_LOG_ARGS = ['log', '--date=short', '--format=%x1e%H%x1f%ad%x1f%s', '--name-only', '--', 'content/']

const RECORD_SEPARATOR = '\x1e'
const FIELD_SEPARATOR = '\x1f'
const CONVENTIONAL_PREFIX = /^\w+(\([^)]*\))?!?: /

/** Folders under content/ that hold something other than a topic. */
const FLASHCARDS = 'flashcards'
const PATHS = 'paths'

/** The topic a changed file belongs to, or `null` for files that belong to none. */
function topicOf(file: string): string | null {
  const [root, folder, name] = file.split('/')
  if (root !== 'content' || name === undefined) return null // `content/` itself, or a file directly in it
  if (folder === PATHS) return null
  if (folder === FLASHCARDS) return name.replace(/\.[^.]+$/, '')
  return folder
}

function parseRecord(record: string): ChangelogEntry {
  const [header, ...files] = record.split('\n')
  const [hash, date, subject] = header.split(FIELD_SEPARATOR)
  const topics = new Set(files.map(topicOf).filter((topic) => topic !== null))
  return { hash, date, subject: subject.replace(CONVENTIONAL_PREFIX, ''), topics: [...topics].sort() }
}

/** Parses the output of `git log` run with `GIT_LOG_ARGS`, newest first as git prints it. */
export function parseGitLog(output: string): ChangelogEntry[] {
  return output
    .split(RECORD_SEPARATOR)
    .filter((record) => record.trim() !== '')
    .map(parseRecord)
}

function git(...args: string[]): string {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] })
}

const isShallow = () => git('rev-parse', '--is-shallow-repository').trim() === 'true'

/** Reads the changelog from git history. Git problems never fail the build: they give an incomplete, empty changelog. */
export function readChangelog(): Changelog {
  try {
    if (isShallow()) {
      try {
        git('fetch', '--unshallow', '--quiet')
      } catch (error) {
        console.warn(`⚠ changelog: could not fetch full history (${(error as Error).message.split('\n')[0]})`)
      }
    }
    const entries = parseGitLog(git(...GIT_LOG_ARGS))
    return { complete: !isShallow() && entries.length <= MAX_ENTRIES, entries: entries.slice(0, MAX_ENTRIES) }
  } catch (error) {
    console.warn(`⚠ changelog: git history unavailable (${(error as Error).message.split('\n')[0]})`)
    return { complete: false, entries: [] }
  }
}
