# Practice and flashcards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A practice hub (`/practice`) that lists what can be practised and how many flashcards are due, a per-topic chapter picker (`/practice/:topic`), keyboard-driven sessions with a progress bar and an end summary, and a JSON export/import of the learner's progress.

**Architecture:** Pure, tested modules carry the logic: deck status and next-due time (`src/content/review.ts`), relative time (`src/lib/time.ts`), backup create/parse/merge (`src/lib/backup.ts`). One small hook (`useShortcuts`) wires keys. Hub due counts come from the stored review history plus the manifest's `flashcardCount`, so the hub fetches no deck files.

**Tech Stack:** React 19, react-router 8.4, ts-fsrs 5.4.2 (`CardInput` has `due: DateInput` and `last_review?: DateInput | null` — checked in `node_modules/ts-fsrs/dist/index.d.ts`), `Intl.RelativeTimeFormat`, `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-14-isobath-redesign-design.md` → §5.

## Global Constraints
- No gamification: no streaks, scores or nags. Counts are informational.
- Progress stays in localStorage (`questions-read`, `flashcard-reviews`); export/import is the only backup.
- **Never trust HTML from an imported file.** `lastTitleHtml` is rendered as HTML on the home page, so imports never carry it (it is rebuilt the next time a question is opened).
- Imported card ids must match `<topic>/<card>` kebab-case; anything else rejects the file (this also blocks `__proto__`-style keys).
- Keyboard shortcuts never fire while typing in a field, inside a dialog (⌘K), or with a modifier key held.
- Modules imported by `node:test` use relative `.ts` imports (see `.claude/notes/style.md`).
- Reuse `Button`, `PageShell`, `NotFound`; no new dependencies. Branch `v2`; one concern per commit; run the full gate before calling a task done.

## Review Focus
- Rapid key presses (rating twice before re-render; holding a key) never rate a card twice or skip one.
- Import of: a non-JSON file, another app's JSON, a file with `__proto__` or malformed ids, a file whose `lastTitleHtml` contains `<img onerror>` — each is rejected or neutralised with a clear message, and current progress is untouched on rejection.
- Merge keeps the most recent review per card and never loses current progress.
- Hub counts with stale review ids (cards since removed) never go negative or exceed the deck size.
- A production build (no drafts) shows an honest empty practice hub, not broken links.
- Sessions at 390px: buttons reachable, no horizontal scroll; shortcut hints hidden on touch-only widths are fine but buttons must still work.

## Rulings made while planning
- One hub at `/practice` with two sections (Questions, Flashcards) plus a "Your progress" backup section, instead of separate `/practice` and `/flashcards` hubs: one place to start practising, one header link. `/flashcards/:topic` sessions are unchanged.
- Practice self-grading ("Got it" / "Missed it") stays per-session and unsaved, as today.
- Progress bar = done ÷ (done + remaining), filled with the depth gradient (`from-depth-1 to-depth-4`): the session goes "deeper" as it progresses.

---

## File structure

| File | Responsibility |
|---|---|
| `app/src/content/review.ts` | Modify: `saveReviews`, `deckStatus`, `nextDue` |
| `app/src/lib/time.ts` | Create: `formatUntil` |
| `app/src/lib/backup.ts` | Create: `createBackup`, `parseBackup`, `mergeBackup` |
| `app/src/lib/progress.ts` | Modify: `replaceProgress` |
| `app/scripts/lib/{review,time,backup}.test.ts` | Create: tests |
| `app/src/lib/useShortcuts.ts` | Create: keyboard hook |
| `app/src/components/{SessionProgress,Kbd,ProgressBackup}.tsx` | Create |
| `app/src/pages/{PracticeHubPage,PracticeTopicPage}.tsx` | Create |
| `app/src/pages/{PracticePage,FlashcardsPage}.tsx` | Modify: shortcuts, progress, summary, crumbs |
| `app/src/routes.tsx`, `app/src/components/Layout.tsx` | Modify: routes, header link |

---

### Task 1: Review status, relative time, backup (pure, tested)

**Files:** Create `app/src/lib/time.ts`, `app/src/lib/backup.ts`, `app/scripts/lib/{review,time,backup}.test.ts`; modify `app/src/content/review.ts`, `app/src/lib/progress.ts`.

**Interfaces (produces):**
```ts
// review.ts (add; keep loadReviews, dueQueue, rateCard)
export function saveReviews(reviews: Reviews): void
export function deckStatus(topic: string, cardCount: number, reviews: Reviews, now: Date): { due: number; unseen: number }
export function nextDue(topic: string, reviews: Reviews, now: Date): Date | null
// time.ts
export function formatUntil(date: Date, now: Date): string
// backup.ts
export const BACKUP_FORMAT = 'isobath-progress'
export interface Backup { format: typeof BACKUP_FORMAT; version: 1; exportedAt: string; progress: { read: string[]; last: string | null }; reviews: Reviews }
export function createBackup(progress: Progress, reviews: Reviews, now: Date): Backup
export function parseBackup(text: string): Backup            // throws Error with a reader-facing message
export function mergeBackup(current: { progress: Progress; reviews: Reviews }, incoming: Backup): { progress: Progress; reviews: Reviews }
// progress.ts (add)
export function replaceProgress(next: Progress): void
```
`review.ts` imports `./types.ts` with a relative `.ts` path (it already does: `from './types.ts'`). `backup.ts` and `time.ts` use relative type imports: `import type { Progress } from './progress.ts'`, `import type { Reviews } from '../content/review.ts'`.

- [ ] **Step 1: Failing tests**

`app/scripts/lib/time.test.ts`:
```ts
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatUntil } from '../../src/lib/time.ts'

const now = new Date('2026-10-14T12:00:00Z')
const later = (ms: number) => new Date(now.getTime() + ms)

test('formats the time until a date in the largest whole unit', () => {
  assert.equal(formatUntil(later(2 * 86_400_000), now), 'in 2 days')
  assert.equal(formatUntil(later(86_400_000), now), 'tomorrow')
  assert.equal(formatUntil(later(3 * 3_600_000), now), 'in 3 hours')
  assert.equal(formatUntil(later(90_000), now), 'in 2 minutes')
})

test('anything under a minute away, or already past, is now', () => {
  assert.equal(formatUntil(later(10_000), now), 'now')
  assert.equal(formatUntil(later(-5 * 60_000), now), 'now')
})
```

`app/scripts/lib/review.test.ts`:
```ts
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { deckStatus, nextDue, type Reviews } from '../../src/content/review.ts'

const now = new Date('2026-10-14T12:00:00Z')
const card = (due: string) => ({ due, stability: 1, difficulty: 5, elapsed_days: 0, scheduled_days: 1, learning_steps: 0, reps: 1, lapses: 0 })

const reviews = {
  'javascript/a': card('2026-10-13T00:00:00Z'), // overdue
  'javascript/b': card('2026-10-20T00:00:00Z'), // future
  'javascript/c': card('2026-10-14T18:00:00Z'), // future, sooner
  'typescript/x': card('2026-10-01T00:00:00Z'),
} as unknown as Reviews

test('deck status counts due and unseen cards for one topic only', () => {
  assert.deepEqual(deckStatus('javascript', 10, reviews, now), { due: 1, unseen: 7 })
  assert.deepEqual(deckStatus('typescript', 1, reviews, now), { due: 1, unseen: 0 })
  assert.deepEqual(deckStatus('react', 0, reviews, now), { due: 0, unseen: 0 })
})

test('stale review ids never push counts negative or past the deck size', () => {
  assert.deepEqual(deckStatus('javascript', 2, reviews, now), { due: 1, unseen: 0 })
  assert.deepEqual(deckStatus('typescript', 0, reviews, now), { due: 0, unseen: 0 })
})

test('next due is the soonest future review in the topic', () => {
  assert.deepEqual(nextDue('javascript', reviews, now), new Date('2026-10-14T18:00:00Z'))
  assert.equal(nextDue('typescript', reviews, now), null)
  assert.equal(nextDue('react', reviews, now), null)
})
```

`app/scripts/lib/backup.test.ts`:
```ts
import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Reviews } from '../../src/content/review.ts'
import { createBackup, mergeBackup, parseBackup } from '../../src/lib/backup.ts'
import type { Progress } from '../../src/lib/progress.ts'

const now = new Date('2026-10-14T12:00:00Z')
const card = (due: string, lastReview: string | null) =>
  ({ due, last_review: lastReview, stability: 1, difficulty: 5, elapsed_days: 0, scheduled_days: 1, learning_steps: 0, reps: 1, lapses: 0 }) as unknown as Reviews[string]
const progress: Progress = { read: ['javascript/a/b'], last: 'javascript/a/b', lastTitleHtml: '<code>x</code>' }
const reviews: Reviews = { 'javascript/one': card('2026-10-20T00:00:00Z', '2026-10-10T00:00:00Z') }

test('a backup survives a round trip, without the title HTML', () => {
  const parsed = parseBackup(JSON.stringify(createBackup(progress, reviews, now)))
  assert.deepEqual(parsed.progress, { read: ['javascript/a/b'], last: 'javascript/a/b' })
  assert.deepEqual(parsed.reviews, JSON.parse(JSON.stringify(reviews)))
  assert.equal(parsed.exportedAt, now.toISOString())
})

test('rejects files that are not isobath progress, with a reader-facing message', () => {
  assert.throws(() => parseBackup('not json'), /not valid JSON/)
  assert.throws(() => parseBackup('{"hello":1}'), /not an isobath progress file/)
  const valid = createBackup(progress, reviews, now)
  assert.throws(() => parseBackup(JSON.stringify({ ...valid, version: 2 })), /not an isobath progress file/)
  assert.throws(() => parseBackup(JSON.stringify({ ...valid, progress: { read: [1] } })), /reading progress is damaged/)
  assert.throws(() => parseBackup(JSON.stringify({ ...valid, reviews: { 'javascript/one': { due: true } } })), /flashcard history is damaged/)
  assert.throws(() => parseBackup(JSON.stringify({ ...valid, reviews: { 'Not An Id': card('2026-10-20T00:00:00Z', null) } })), /flashcard history is damaged/)
  assert.throws(() => parseBackup('{"format":"isobath-progress","version":1,"progress":{"read":[]},"reviews":{"__proto__":{"due":"2026-10-20"}}}'), /flashcard history is damaged/)
})

test('never imports HTML, whatever the file says', () => {
  const hostile = { ...createBackup(progress, reviews, now), progress: { read: [], last: 'x/y/z', lastTitleHtml: '<img src=x onerror=alert(1)>' } }
  const parsed = parseBackup(JSON.stringify(hostile))
  assert.equal('lastTitleHtml' in parsed.progress, false)
})

test('merge unions reading progress and keeps the current last question', () => {
  const incoming = parseBackup(JSON.stringify(createBackup({ read: ['javascript/c/d', 'javascript/a/b'], last: 'javascript/c/d', lastTitleHtml: null }, {}, now)))
  const merged = mergeBackup({ progress, reviews }, incoming)
  assert.deepEqual(merged.progress, { read: ['javascript/a/b', 'javascript/c/d'], last: 'javascript/a/b', lastTitleHtml: '<code>x</code>' })
  const fresh = mergeBackup({ progress: { read: [], last: null, lastTitleHtml: null }, reviews: {} }, incoming)
  assert.deepEqual(fresh.progress, { read: ['javascript/c/d', 'javascript/a/b'], last: 'javascript/c/d', lastTitleHtml: null })
})

test('merge keeps the most recently reviewed copy of each card and adds new ones', () => {
  const incoming = parseBackup(
    JSON.stringify(
      createBackup(progress, { 'javascript/one': card('2026-11-01T00:00:00Z', '2026-10-12T00:00:00Z'), 'javascript/two': card('2026-10-15T00:00:00Z', null) }, now),
    ),
  )
  const older = parseBackup(JSON.stringify(createBackup(progress, { 'javascript/one': card('2026-10-15T00:00:00Z', '2026-10-01T00:00:00Z') }, now)))
  const merged = mergeBackup({ progress, reviews }, incoming)
  assert.equal(String(merged.reviews['javascript/one'].due), '2026-11-01T00:00:00Z')
  assert.ok('javascript/two' in merged.reviews)
  assert.equal(String(mergeBackup({ progress, reviews }, older).reviews['javascript/one'].due), '2026-10-20T00:00:00Z')
})
```

- [ ] **Step 2: Run, expect failure** — `npm test` (in `app/`). Expected: FAIL (missing modules/exports).

- [ ] **Step 3: Implement**

`app/src/lib/time.ts`:
```ts
// Human-readable time until a date, for "next card due" messages.

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
]
const format = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

/** "in 3 hours", "tomorrow"; "now" for anything under a minute away or already past. */
export function formatUntil(date: Date, now: Date): string {
  const remaining = date.getTime() - now.getTime()
  for (const [unit, size] of UNITS) {
    if (remaining >= size) return format.format(Math.round(remaining / size), unit)
  }
  return 'now'
}
```

`app/src/content/review.ts` — extract the write in `rateCard` into `saveReviews`, and add:
```ts
/** Stores the review history; if storage is blocked or full, the session still works but progress won't survive a reload. */
export function saveReviews(reviews: Reviews): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews))
  } catch {
    // See above: nothing else to do without storage.
  }
}

function reviewsOf(topic: string, reviews: Reviews) {
  return Object.entries(reviews).filter(([id]) => id.startsWith(`${topic}/`))
}

/** Cards due now and cards never seen, for one topic's deck of `cardCount` cards. Ids of cards since removed are clamped away. */
export function deckStatus(topic: string, cardCount: number, reviews: Reviews, now: Date): { due: number; unseen: number } {
  const seen = reviewsOf(topic, reviews)
  const due = seen.filter(([, card]) => new Date(card.due) <= now).length
  return { due: Math.min(due, cardCount), unseen: Math.max(cardCount - seen.length, 0) }
}

/** When the soonest not-yet-due card in a topic comes due; `null` if none is scheduled. */
export function nextDue(topic: string, reviews: Reviews, now: Date): Date | null {
  const upcoming = reviewsOf(topic, reviews)
    .map(([, card]) => new Date(card.due))
    .filter((due) => due > now)
  return upcoming.length === 0 ? null : new Date(Math.min(...upcoming.map((due) => due.getTime())))
}
```
and make `rateCard` call `saveReviews(updated)` instead of its own `try { localStorage.setItem… }`.

`app/src/lib/progress.ts` — add (and make `markRead` use it for its write and notify):
```ts
/** Replaces the stored reading progress, e.g. after an import, and updates every reader. */
export function replaceProgress(next: Progress) {
  cached = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cached))
  } catch {
    // Storage is blocked or full: progress lasts for this session only.
  }
  listeners.forEach((listener) => listener())
}

/** Records that a question was opened. */
export function markRead(id: string, titleHtml: string) {
  const { read } = snapshot()
  replaceProgress({ read: read.includes(id) ? read : [...read, id], last: id, lastTitleHtml: titleHtml })
}
```

`app/src/lib/backup.ts`:
```ts
// Export and import of the learner's progress (reading and flashcards), the only backup there is: no accounts.

import type { Reviews } from '../content/review.ts'
import type { Progress } from './progress.ts'

export const BACKUP_FORMAT = 'isobath-progress'
const CARD_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*$/

export interface Backup {
  format: typeof BACKUP_FORMAT
  version: 1
  exportedAt: string
  /** No title HTML: it is rebuilt from the site's own data, never taken from a file. */
  progress: { read: string[]; last: string | null }
  reviews: Reviews
}

export function createBackup(progress: Progress, reviews: Reviews, now: Date): Backup {
  return { format: BACKUP_FORMAT, version: 1, exportedAt: now.toISOString(), progress: { read: [...progress.read], last: progress.last }, reviews }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Reads an exported file. Throws with a message for the reader when it isn't a valid isobath backup. */
export function parseBackup(text: string): Backup {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('This file is not valid JSON.')
  }
  if (!isRecord(data) || data.format !== BACKUP_FORMAT || data.version !== 1) throw new Error('This is not an isobath progress file.')

  const { progress, reviews } = data
  if (!isRecord(progress) || !Array.isArray(progress.read) || !progress.read.every((id) => typeof id === 'string')) {
    throw new Error("The file's reading progress is damaged.")
  }
  const reviewsValid =
    isRecord(reviews) &&
    Object.entries(reviews).every(([id, card]) => CARD_ID.test(id) && isRecord(card) && (typeof card.due === 'string' || typeof card.due === 'number'))
  if (!reviewsValid) throw new Error("The file's flashcard history is damaged.")

  return {
    format: BACKUP_FORMAT,
    version: 1,
    exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : '',
    progress: { read: progress.read as string[], last: typeof progress.last === 'string' ? progress.last : null },
    reviews: reviews as Reviews,
  }
}

function reviewedAt(card: Reviews[string]): number {
  return card.last_review == null ? 0 : new Date(card.last_review).getTime() || 0
}

/** Combines an import with what this browser has: read questions are unioned, and each card keeps its most recent review. */
export function mergeBackup(current: { progress: Progress; reviews: Reviews }, incoming: Backup): { progress: Progress; reviews: Reviews } {
  const read = [...new Set([...current.progress.read, ...incoming.progress.read])]
  const keepCurrentLast = current.progress.last !== null
  const progress: Progress = {
    read,
    last: keepCurrentLast ? current.progress.last : incoming.progress.last,
    lastTitleHtml: keepCurrentLast ? current.progress.lastTitleHtml : null,
  }

  const merged = new Map(Object.entries(current.reviews))
  for (const [id, card] of Object.entries(incoming.reviews)) {
    const existing = merged.get(id)
    if (!existing || reviewedAt(card) > reviewedAt(existing)) merged.set(id, card)
  }
  return { progress, reviews: Object.fromEntries(merged) }
}
```

- [ ] **Step 4: Run** — `npm test && npx tsc -b && npm run lint`. Expected: all pass (existing 30 + new).

- [ ] **Step 5: Commit** — `git add app && git commit -m "feat(app): add deck status, relative time and progress backup helpers"`

---

### Task 2: Keyboard hook, progress bar, key hint

**Files:** Create `app/src/lib/useShortcuts.ts`, `app/src/components/SessionProgress.tsx`, `app/src/components/Kbd.tsx`.

- [ ] **Step 1: `useShortcuts.ts`**
```ts
import { useEffect, useLayoutEffect, useRef } from 'react'

/**
 * Runs `handlers[event.key]` on keydown (`' '` for Space). Ignored while typing in a field, inside a dialog,
 * with a modifier held, or when the key auto-repeats, so a held key never acts twice.
 */
export function useShortcuts(handlers: Record<string, () => void>) {
  const latest = useRef(handlers)
  // Layout effect: the next key press must see this render's handlers, never the previous card's.
  useLayoutEffect(() => {
    latest.current = handlers
  })

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return
      if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return
      const handler = latest.current[event.key]
      if (!handler) return
      event.preventDefault() // stops Space scrolling the page or also clicking a focused button
      handler()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
```

- [ ] **Step 2: `SessionProgress.tsx`**
```tsx
/** How far through a session the reader is, filled down the depth scale. */
export function SessionProgress({ done, total, label }: { done: number; total: number; label: string }) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} className="h-1.5 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-linear-to-r from-depth-1 to-depth-4 transition-[width] motion-reduce:transition-none" style={{ width: `${percent}%` }} />
    </div>
  )
}
```

- [ ] **Step 3: `Kbd.tsx`**
```tsx
/** A keyboard key hint shown inside a button; hidden on small screens where there is usually no keyboard. */
export function Kbd({ children }: { children: string }) {
  return <kbd className="ml-1.5 hidden rounded border px-1 font-mono text-[0.7rem] text-muted-foreground sm:inline">{children}</kbd>
}
```

- [ ] **Step 4: Verify and commit** — `npx tsc -b && npm run lint`; `git add app/src && git commit -m "feat(app): add a keyboard-shortcut hook, session progress bar and key hints"`

---

### Task 3: Sessions — shortcuts, progress, flashcard summary

**Files:** Modify `app/src/pages/PracticePage.tsx`, `app/src/pages/FlashcardsPage.tsx`.

- [ ] **Step 1: Practice session** — in `PracticePage.tsx`'s `Session`:
  - Register shortcuts: `useShortcuts(revealed ? { '1': () => record(false), '2': () => record(true) } : { ' ': () => setRevealed(true), Enter: () => setRevealed(true) })`. The hook must be called before the early `return <Summary …/>`: move the summary check below it and pass `{}` when the session is over (`position >= questions.length`).
  - Guard double-records: `record` must ignore calls when `position >= questions.length` (a fast second key press before re-render).
  - Replace the `{position + 1} / {questions.length}` line with `<SessionProgress done={position} total={questions.length} label="Questions answered" />` followed by the same counter text (keep `aria-live`).
  - Button labels get hints: `Reveal answer<Kbd>Space</Kbd>`, `Missed it<Kbd>1</Kbd>`, `Got it<Kbd>2</Kbd>`.
  - `Full question →` link text becomes `Read the full question` (no arrow glyph, per the site copy rules).
  - Breadcrumbs in `PracticePage`: `[{ label: 'Practice', to: '/practice' }, { label: topic.title, to: `/practice/${topic.slug}` }, { label: chapter.title, to: `/${topic.slug}/${chapter.slug}` }]`.

- [ ] **Step 2: Flashcard session** — rewrite `Session` in `FlashcardsPage.tsx`:
```tsx
type Counts = Record<'again' | 'hard' | 'good' | 'easy', number>
const RATINGS: { label: string; key: string; grade: Grade; count: keyof Counts }[] = [
  { label: 'Again', key: '1', grade: Rating.Again, count: 'again' },
  { label: 'Hard', key: '2', grade: Rating.Hard, count: 'hard' },
  { label: 'Good', key: '3', grade: Rating.Good, count: 'good' },
  { label: 'Easy', key: '4', grade: Rating.Easy, count: 'easy' },
]

function Session({ topic, cards }: { topic: string; cards: Flashcard[] }) {
  const [reviews, setReviews] = useState(loadReviews)
  const [queue, setQueue] = useState(() => dueQueue(cards, reviews, new Date()))
  const [revealed, setRevealed] = useState(false)
  const [counts, setCounts] = useState<Counts>({ again: 0, hard: 0, good: 0, easy: 0 })
  const rated = counts.again + counts.hard + counts.good + counts.easy
  const card = queue[0]

  function rate(grade: Grade, count: keyof Counts) {
    if (!card || !revealed) return // a second key press before re-render
    setReviews(rateCard(reviews, card.id, grade, new Date()))
    // A card you missed comes round again in this sitting.
    setQueue(grade === Rating.Again ? [...queue.slice(1), card] : queue.slice(1))
    setCounts({ ...counts, [count]: counts[count] + 1 })
    setRevealed(false)
  }

  useShortcuts(
    !card ? {} : revealed ? Object.fromEntries(RATINGS.map(({ key, grade, count }) => [key, () => rate(grade, count)])) : { ' ': () => setRevealed(true), Enter: () => setRevealed(true) },
  )

  if (!card) {
    const next = nextDue(topic, reviews, new Date())
    return (
      <>
        <h1 className="text-3xl font-bold tracking-tight">{rated === 0 ? 'Nothing is due' : 'Session done'}</h1>
        {rated > 0 && (
          <p className="mt-3 text-muted-foreground">
            You reviewed {rated} {rated === 1 ? 'card' : 'cards'}: {counts.again} again, {counts.hard} hard, {counts.good} good, {counts.easy} easy.
          </p>
        )}
        <p className="mt-3 text-muted-foreground">{next ? `The next card is due ${formatUntil(next, new Date())}.` : 'No cards are scheduled.'}</p>
        <Button asChild variant="outline" className="mt-8">
          <Link to="/practice">Back to practice</Link>
        </Button>
      </>
    )
  }

  return (
    <>
      <SessionProgress done={rated} total={rated + queue.length} label="Cards reviewed" />
      <p className="mt-2 font-mono text-sm text-muted-foreground" aria-live="polite">
        {queue.length} left
      </p>
      <p className="mt-4 text-2xl leading-snug font-semibold">
        <InlineHtml html={card.frontHtml} className={CODE_STYLE} />
      </p>
      {revealed ? (
        <>
          <p className="mt-6 rounded-xl bg-tldr px-6 py-5 text-lg leading-relaxed">
            <InlineHtml html={card.backHtml} className={CODE_STYLE} />
          </p>
          {card.question && (
            <Link to={`/${card.question}`} className="mt-4 inline-block text-link hover:text-link-hover">
              Read the full question
            </Link>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            {RATINGS.map(({ label, key, grade, count }) => (
              <Button key={label} variant="outline" onClick={() => rate(grade, count)}>
                {label}
                <Kbd>{key}</Kbd>
              </Button>
            ))}
          </div>
        </>
      ) : (
        <Button className="mt-8" onClick={() => setRevealed(true)}>
          Show answer
          <Kbd>Space</Kbd>
        </Button>
      )}
    </>
  )
}
```
  Imports: `useShortcuts`, `SessionProgress`, `Kbd`, `nextDue` (from `@/content/review`), `formatUntil` (from `@/lib/time`). `FlashcardsPage` passes `topic={topic.slug}`; breadcrumbs become `[{ label: 'Practice', to: '/practice' }, { label: topic.title, to: `/${topic.slug}` }]`.

- [ ] **Step 3: Verify** — `npx tsc -b && npm run lint && npm test`. Browser (draft build): `/flashcards/javascript`: Space reveals, 3 rates Good, the bar advances, `1` sends the card to the back; holding `3` rates once per press only; typing in ⌘K search doesn't rate; finishing a short session (use localStorage to leave 2 cards due, or rate through by pressing 4 repeatedly in a script) shows "Session done" with counts and a "next card is due …" line. `/practice/javascript/how-javascript-runs`: Space, 2, 1 work; summary appears; crumbs read Practice / JavaScript / chapter.

- [ ] **Step 4: Commit** — `git add app/src/pages && git commit -m "feat(app): keyboard shortcuts, progress and a summary in practice and flashcard sessions"`

---

### Task 4: Hub, topic picker, backup, routes, header

**Files:** Create `app/src/pages/PracticeHubPage.tsx`, `app/src/pages/PracticeTopicPage.tsx`, `app/src/components/ProgressBackup.tsx`; modify `app/src/routes.tsx`, `app/src/components/Layout.tsx`.

- [ ] **Step 1: `ProgressBackup.tsx`**
```tsx
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { loadReviews, saveReviews, type Reviews } from '@/content/review'
import { createBackup, mergeBackup, parseBackup } from '@/lib/backup'
import { replaceProgress, useProgress } from '@/lib/progress'

/** Download and restore the learner's progress; this browser is the only place it is kept. */
export function ProgressBackup({ onImported }: { onImported: (reviews: Reviews) => void }) {
  const progress = useProgress()
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')

  function download() {
    const now = new Date()
    const blob = new Blob([JSON.stringify(createBackup(progress, loadReviews(), now), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `isobath-progress-${now.toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    setMessage('Progress downloaded.')
  }

  async function restore(file: File) {
    try {
      const merged = mergeBackup({ progress, reviews: loadReviews() }, parseBackup(await file.text()))
      replaceProgress(merged.progress)
      saveReviews(merged.reviews)
      onImported(merged.reviews)
      setMessage(`Progress imported: ${merged.progress.read.length} questions read, ${Object.keys(merged.reviews).length} cards reviewed.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The file could not be read.')
    }
  }

  return (
    <section aria-labelledby="your-progress" className="mt-16 border-t pt-10">
      <h2 id="your-progress" className="font-serif text-2xl font-medium tracking-tight">
        Your progress
      </h2>
      <p className="mt-2 max-w-xl text-muted-foreground">Reading progress and flashcard history live only in this browser. Download a copy to keep it, or to move it to another device; importing adds to what is here.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button variant="outline" onClick={download}>
          Download progress
        </Button>
        <Button variant="outline" onClick={() => fileInput.current?.click()}>
          Import progress
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = '' // so choosing the same file again still fires
            if (file) void restore(file)
          }}
        />
      </div>
      <p role="status" className="mt-3 text-sm text-muted-foreground">
        {message}
      </p>
    </section>
  )
}
```

- [ ] **Step 2: `PracticeHubPage.tsx`**
```tsx
import { useState } from 'react'
import { Link } from 'react-router'
import { PageShell } from '@/components/PageShell'
import { ProgressBackup } from '@/components/ProgressBackup'
import { useManifest } from '@/content/index-data'
import { deckStatus, loadReviews } from '@/content/review'
import { SITE_NAME } from '@/lib/site'

export function PracticeHubPage() {
  const { topics } = useManifest()
  const [reviews, setReviews] = useState(loadReviews)
  const practisable = topics.filter((topic) => topic.stats.readable > 0)
  const decks = topics.filter((topic) => topic.flashcardCount > 0)
  const now = new Date()

  return (
    <PageShell crumbs={[]} wide>
      <title>{`Practice · ${SITE_NAME}`}</title>
      <h1 className="font-serif text-4xl font-medium tracking-tight">Practice</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">Answer questions out loud before you reveal the answer, or review flashcards when they are due.</p>

      <section aria-labelledby="practice-questions" className="mt-10">
        <h2 id="practice-questions" className="font-serif text-2xl font-medium tracking-tight">
          Questions
        </h2>
        {practisable.length === 0 ? (
          <p className="mt-3 text-muted-foreground">
            Nothing is published to practise yet. <Link to="/roadmap" className="text-link hover:text-link-hover">See the roadmap</Link>
          </p>
        ) : (
          <ul className="mt-4 border-t">
            {practisable.map((topic) => (
              <li key={topic.slug} className="border-b">
                <Link to={`/practice/${topic.slug}`} className="flex items-baseline justify-between gap-4 py-4 hover:text-link">
                  <span className="text-lg font-semibold">{topic.title}</span>
                  <span className="text-sm text-muted-foreground">{topic.stats.readable} questions</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="flashcards" aria-labelledby="practice-flashcards" className="mt-12">
        <h2 id="practice-flashcards" className="font-serif text-2xl font-medium tracking-tight">
          Flashcards
        </h2>
        {decks.length === 0 ? (
          <p className="mt-3 text-muted-foreground">No flashcard decks yet.</p>
        ) : (
          <ul className="mt-4 border-t">
            {decks.map((topic) => {
              const { due, unseen } = deckStatus(topic.slug, topic.flashcardCount, reviews, now)
              return (
                <li key={topic.slug} className="border-b">
                  <Link to={`/flashcards/${topic.slug}`} className="flex items-baseline justify-between gap-4 py-4 hover:text-link">
                    <span className="text-lg font-semibold">{topic.title}</span>
                    <span className="text-sm text-muted-foreground">
                      {due > 0 ? `${due} due` : 'Nothing due'}
                      {unseen > 0 && `, ${unseen} new`}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <ProgressBackup onImported={setReviews} />
    </PageShell>
  )
}
```

- [ ] **Step 3: `PracticeTopicPage.tsx`**
```tsx
import { Link, useLoaderData } from 'react-router'
import { NotFound, PageShell } from '@/components/PageShell'
import type { loadTopic } from '@/content/index-data'
import { chapterStats } from '@/content/stats'
import { SITE_NAME } from '@/lib/site'

/** Pick a chapter of one topic to practise. */
export function PracticeTopicPage() {
  const topic = useLoaderData<Awaited<ReturnType<typeof loadTopic>>>()
  if (!topic) return <NotFound what="Topic" />
  const chapters = topic.chapters.map((chapter) => ({ chapter, readable: chapterStats([chapter]).readable })).filter(({ readable }) => readable > 0)

  return (
    <PageShell crumbs={[{ label: 'Practice', to: '/practice' }]} wide>
      <title>{`Practice: ${topic.title} · ${SITE_NAME}`}</title>
      <h1 className="font-serif text-4xl font-medium tracking-tight">{topic.title}</h1>
      <p className="mt-2 text-muted-foreground">Pick a chapter. Each question shows its title; say your answer, then reveal it.</p>
      {chapters.length === 0 ? (
        <p className="mt-8 text-muted-foreground">Nothing in this topic is published yet.</p>
      ) : (
        <ol className="mt-8 border-t">
          {chapters.map(({ chapter, readable }) => (
            <li key={chapter.slug} className="border-b">
              <Link to={`/practice/${topic.slug}/${chapter.slug}`} className="grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-4 py-4 hover:text-link">
                <span className="font-mono text-sm text-muted-foreground">{chapter.number}</span>
                <span className="text-lg font-semibold">{chapter.title}</span>
                <span className="text-sm text-muted-foreground">{readable} questions</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </PageShell>
  )
}
```

- [ ] **Step 4: Routes and header** — in `routes.tsx` (inside the pathless boundary, before `:topic`): `{ path: 'practice', element: <PracticeHubPage /> }, { path: 'practice/:topic', element: <PracticeTopicPage />, loader: ({ params }: LoaderFunctionArgs) => loadTopic(params.topic) },`. In `Layout.tsx` `MAIN_LINKS`: `[{ to: '/paths', label: 'Paths' }, { to: '/practice', label: 'Practice' }, { to: '/roadmap', label: 'Roadmap' }]`. Note `/practice/javascript/x` session pages keep the Practice link active (NavLink matches nested paths) — intended.

- [ ] **Step 5: Verify** — `npx tsc -b && npm run lint && npm test`; browser (draft build): `/practice` lists JavaScript and TypeScript with counts, Flashcards shows "JavaScript: N due, M new" consistent with `/flashcards/javascript`'s queue; `/practice/javascript` lists 26 chapters; `/practice/nope` → not found; Download produces a JSON file (inspect its keys: `format`, `version`, `exportedAt`, `progress` without `lastTitleHtml`, `reviews`); importing that file reports counts; importing a text file and a hostile file (`lastTitleHtml` with `<img onerror>`) shows an error or imports without HTML; the home "Continue" link after a hostile import shows no injected markup. Production build: `/practice` shows "Nothing is published to practise yet" and the JavaScript deck. Header shows Paths · Practice · Roadmap. 390px: no horizontal scroll.

- [ ] **Step 6: Commit** — `git add app/src && git commit -m "feat(app): add the practice hub, a chapter picker and progress backup"`

---

### Task 5: Docs
- [ ] Spec §5: add "As built" line (single `/practice` hub with Questions, Flashcards and Your progress; `/practice/:topic` picker; shortcuts Space/Enter reveal, 1–2 practice, 1–4 flashcards; backup format `isobath-progress` v1, merge = union + most recent review; imports never carry HTML).
- [ ] `PLAN.md` → Now: step 5 done, next step 6 (prerender), write its plan first. Add rule `R18 Progress backup: JSON format isobath-progress v1; imports merge and never carry HTML.`
- [ ] Delete this plan file; commit `docs: practice and flashcards step done`.
