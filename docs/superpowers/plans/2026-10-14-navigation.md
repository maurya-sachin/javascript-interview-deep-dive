# Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the site navigable at 28+ topics: a topic switcher in the header, a topic page with a filterable collapsible outline beside a summary rail, and a question page that puts the question before the chapter list on small screens.

**Architecture:** The switcher reads the manifest (no chapter lists needed there, so the manifest stays as built in step 1). The topic outline reads the topic shard already loaded by the `:topic` route; its filtering is a pure function with tests. The question page swaps its flex-wrap trick for explicit breakpoints.

**Tech Stack:** React 19, react-router 8.4, Tailwind 4, cmdk (existing `CommandDialog`), `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-14-isobath-redesign-design.md` → §3 Navigation. Layout reference: `docs/superpowers/specs/mockups/page-layouts.html` (screens 2 and 3).

## Global Constraints
- Header links to Paths, Practice and Roadmap are **not** added here: they arrive with steps 4 and 5, when their pages exist. No dead links.
- Reuse the existing UI primitives (`Button`, `Input`, `Command*`); no new dependencies.
- Plain text for filtering comes from `QuestionSummary.title` / `ChapterSummary.title`, never from HTML fields.
- Mobile first: no horizontal page scroll at 390px; keyboard focus visible; reduced motion untouched (no new animation).
- Never bulk-read `content/`, `app/public/data/`, `app/dist/`.
- Branch `v2`; one concern per commit.

## Review Focus
- The topic switcher works from the keyboard (open, type, arrows, Enter, Escape) and picking a planned topic lands on its "planned" page.
- A filter query with regex characters (`(`, `[`, `.*`) matches literally and never throws.
- A filter with no matches shows an explicit empty state with a way to clear it, not a blank outline.
- Planned topics (no chapters) show no filter and no empty outline.
- Question page at 390, 1024 and 1440px: title first on mobile with chapters collapsed; chapters left at 1024; three columns at 1440; no horizontal scroll; a "coming soon" question still lays out.
- Filter text does not leak from one topic to another when navigating between topics.

## Rulings made while planning
- The manifest does **not** need chapter lists: the switcher needs only topic titles/tracks/counts, and the outline and question pages already get chapters from the topic shard.
- The search scope toggle ("This topic / All") is deferred: with two topics it saves nothing. Revisit when about ten topics have content.
- On the question page the "Chapters" disclosure sits right after the title (not after the TL;DR as in the mockup) so it is one element for both the content and coming-soon cases.
- The topic cover shows from `lg` up, in the rail; below `lg` it is hidden.

---

## File structure

| File | Responsibility |
|---|---|
| `app/src/content/outline.ts` | Create: pure `filterOutline` |
| `app/scripts/lib/outline.test.ts` | Create: tests |
| `app/src/components/TopicSwitcher.tsx` | Create: header topic menu |
| `app/src/components/Layout.tsx` | Modify: mount the switcher |
| `app/src/pages/TopicPage.tsx` | Modify: rail + filterable outline |
| `app/src/pages/QuestionPage.tsx` | Modify: breakpoints, mobile disclosure |

---

### Task 1: Topic switcher in the header

**Files:**
- Create: `app/src/components/TopicSwitcher.tsx`
- Modify: `app/src/components/Layout.tsx`

**Interfaces:**
- Consumes: `useManifest()` (`@/content/index-data`), `groupByTrack(topics: TopicOverview[])` (`@/lib/tracks`), `CommandDialog`, `Command`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem` (`@/components/ui/command`).
- Produces: `<TopicSwitcher />` (no props).

- [ ] **Step 1: Check the icon exists** — Run (in `app/`): `grep -c "LayoutGrid" node_modules/lucide-react/dist/lucide-react.d.ts`. Expected: a number above 0.

- [ ] **Step 2: Component**
```tsx
import { LayoutGrid } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { useManifest } from '@/content/index-data'
import { groupByTrack } from '@/lib/tracks'

/** A header menu to jump to any topic, grouped by track; planned topics are listed and marked. */
export function TopicSwitcher() {
  const navigate = useNavigate()
  const { topics } = useManifest()
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)} aria-label="Topics" className="px-2.5">
        <LayoutGrid />
        <span className="hidden sm:inline">Topics</span>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Topics" description="Jump to a topic.">
        <Command>
          <CommandInput placeholder="Find a topic…" />
          <CommandList>
            <CommandEmpty>No topic matches.</CommandEmpty>
            {groupByTrack(topics).map((group) => (
              <CommandGroup key={group.name} heading={group.name}>
                {group.topics.map((topic) => (
                  <CommandItem
                    key={topic.slug}
                    value={`${topic.title} ${topic.slug}`}
                    onSelect={() => {
                      setOpen(false)
                      void navigate(`/${topic.slug}`)
                    }}
                  >
                    {topic.title}
                    {topic.chapterCount === 0 && <span className="ml-auto text-xs text-muted-foreground">Planned</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
```

- [ ] **Step 3: Mount it** — in `Layout.tsx`, import `TopicSwitcher` from `@/components/TopicSwitcher` and place `<TopicSwitcher />` between the lockup `div` and `<div className="ml-auto …">`.

- [ ] **Step 4: Verify** — `npx tsc -b && npm run lint`. In Chrome (dev server `npm run dev`): click Topics, see four track groups with 28 topics (JavaScript and TypeScript first in Frontend, others marked Planned); type "rea" → React and React Native; Down + Enter opens it; Escape closes; at 390px the button shows only the icon and the header does not overflow. Screenshot.

- [ ] **Step 5: Commit**
```bash
git add app/src
git commit -m "feat(app): add a topic switcher to the header"
```

---

### Task 2: Filterable outline function

**Files:**
- Create: `app/src/content/outline.ts`, `app/scripts/lib/outline.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface OutlineFilter { query: string; unreadOnly: boolean }
  /** Chapters narrowed to matching questions. A chapter whose title matches keeps all its questions
   *  (still subject to `unreadOnly`). Chapters left with no questions are dropped. Order is kept. */
  export function filterOutline(chapters: ChapterSummary[], read: readonly string[], filter: OutlineFilter): ChapterSummary[]
  ```

- [ ] **Step 1: Failing tests** — `app/scripts/lib/outline.test.ts`:
```ts
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { filterOutline } from '../../src/content/outline.ts'
import type { ChapterSummary, QuestionSummary } from '../../src/content/types.ts'

function question(id: string, title: string): QuestionSummary {
  return { id, number: '010', title, titleHtml: title, status: 'draft', difficulty: 'easy', frequency: 3, core: false, hasPage: true }
}

const chapters: ChapterSummary[] = [
  { number: '01', slug: 'engine', title: 'How JavaScript runs', summaryHtml: '', questions: [question('js/engine/a', 'What is an engine?'), question('js/engine/b', 'What is a host?')] },
  { number: '02', slug: 'types', title: 'Values and types', summaryHtml: '', questions: [question('js/types/a', 'What is typeof null?')] },
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
```

- [ ] **Step 2: Run, expect failure** — `npm test`. Expected: FAIL, `Cannot find module '.../outline.ts'`.

- [ ] **Step 3: Implement** — `app/src/content/outline.ts`:
```ts
// Narrowing a topic's chapters for the outline filter on the topic page.

import type { ChapterSummary } from './types.ts'

export interface OutlineFilter {
  query: string
  unreadOnly: boolean
}

/**
 * Chapters narrowed to matching questions. A chapter whose title matches keeps all its questions
 * (still subject to `unreadOnly`). Chapters left with no questions are dropped. Order is kept.
 */
export function filterOutline(chapters: ChapterSummary[], read: readonly string[], { query, unreadOnly }: OutlineFilter): ChapterSummary[] {
  const needle = query.trim().toLowerCase()
  return chapters.flatMap((chapter) => {
    const chapterMatches = needle === '' || chapter.title.toLowerCase().includes(needle)
    const questions = chapter.questions.filter(
      (question) => (chapterMatches || question.title.toLowerCase().includes(needle)) && !(unreadOnly && read.includes(question.id)),
    )
    return questions.length > 0 ? [{ ...chapter, questions }] : []
  })
}
```

- [ ] **Step 4: Run** — `npm test && npx tsc -b && npm run lint`. Expected: all pass.

- [ ] **Step 5: Commit**
```bash
git add app/src/content/outline.ts app/scripts/lib/outline.test.ts
git commit -m "feat(app): add a pure outline filter for the topic page"
```

---

### Task 3: Topic page rail and filterable outline

**Files:**
- Modify: `app/src/pages/TopicPage.tsx` (rewrite)

**Interfaces:**
- Consumes: `filterOutline`, `OutlineFilter` (Task 2); `TopicCover` (existing); `useTopic`, `questionPath`; `chapterStats`; `Input` from `@/components/ui/input`; `useProgress`.
- Produces: the page; no new exports.

- [ ] **Step 1: Replace the file**
```tsx
import { Link } from 'react-router'
import { useState } from 'react'
import { DifficultyMix } from '@/components/DifficultyMix'
import { NotFound, PageShell } from '@/components/PageShell'
import { TopicCover } from '@/components/TopicCover'
import { InlineHtml } from '@/components/question/InlineHtml'
import { QuestionTitle } from '@/components/QuestionTitle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { questionPath, useTopic } from '@/content/index-data'
import { filterOutline } from '@/content/outline'
import { chapterStats } from '@/content/stats'
import type { TopicSummary } from '@/content/types'
import { useProgress } from '@/lib/progress'
import { cn } from '@/lib/utils'

const INLINE_CODE = '[&_code]:font-mono [&_code]:text-[0.9em]'

export function TopicPage() {
  const topic = useTopic()
  if (!topic) return <NotFound what="Topic" />
  // Keyed so the filter starts empty when moving between topics.
  return <Topic key={topic.slug} topic={topic} />
}

function Topic({ topic }: { topic: TopicSummary }) {
  const { read } = useProgress()
  const [query, setQuery] = useState('')
  const [unreadOnly, setUnreadOnly] = useState(false)

  const stats = chapterStats(topic.chapters)
  const questions = topic.chapters.flatMap((chapter) => chapter.questions)
  // Continue at the first readable question not read yet; fall back to the first readable one.
  const start = questions.find((question) => question.hasPage && !read.includes(question.id)) ?? questions.find((question) => question.hasPage)
  const readCount = questions.filter((question) => read.includes(question.id)).length
  const filtering = query.trim() !== '' || unreadOnly
  const shown = filterOutline(topic.chapters, read, { query, unreadOnly })

  return (
    <PageShell crumbs={[{ label: 'Topics', to: '/' }]} wide>
      <div className="grid gap-10 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-14">
        <header className="lg:sticky lg:top-8 lg:self-start">
          <TopicCover
            slug={topic.slug}
            chapterCount={topic.chapters.length}
            hardShare={stats.total === 0 ? 0 : stats.byDifficulty.hard / stats.total}
            className="mb-6 hidden aspect-16/10 w-full rounded-lg bg-muted lg:block"
          />
          <h1 className="text-4xl font-bold tracking-[-0.03em]">{topic.title}</h1>
          <InlineHtml html={topic.summaryHtml} className={`mt-3 block font-serif text-xl leading-relaxed text-muted-foreground ${INLINE_CODE}`} />

          {topic.chapters.length > 0 && (
            <>
              <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-2 lg:grid lg:grid-cols-2">
                <Stat value={topic.chapters.length} label="chapters" />
                <Stat value={stats.total} label="questions" />
                <Stat value={stats.core} label="core" />
                {topic.flashcardCount > 0 && <Stat value={topic.flashcardCount} label="flashcards" />}
                {readCount > 0 && <Stat value={readCount} label="read by you" />}
              </dl>
              <div className="mt-6 flex flex-wrap gap-3 lg:flex-col">
                {start && (
                  <Button asChild size="lg">
                    <Link to={questionPath(start)}>{readCount > 0 ? 'Continue reading' : 'Start reading'}</Link>
                  </Button>
                )}
                {topic.flashcardCount > 0 && (
                  <Button asChild variant="outline" size="lg">
                    <Link to={`/flashcards/${topic.slug}`}>Study {topic.flashcardCount} flashcards</Link>
                  </Button>
                )}
              </div>
            </>
          )}
        </header>

        <section aria-label="Contents">
          {topic.chapters.length === 0 ? (
            <p className="rounded-xl border border-dashed p-5 text-muted-foreground">Chapters for this topic are planned.</p>
          ) : (
            <>
              <div className="flex gap-3">
                <Input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Filter chapters and questions"
                  aria-label="Filter chapters and questions"
                  className="h-9 flex-1"
                />
                <Button variant="outline" size="lg" aria-pressed={unreadOnly} onClick={() => setUnreadOnly((value) => !value)} className={cn(unreadOnly && 'bg-tldr text-tldr-foreground')}>
                  Unread only
                </Button>
              </div>

              {shown.length === 0 ? (
                <p className="mt-6 text-muted-foreground">
                  Nothing matches.{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('')
                      setUnreadOnly(false)
                    }}
                    className="text-link hover:text-link-hover"
                  >
                    Clear the filter
                  </button>
                </p>
              ) : (
                <ol className="mt-4 border-t">
                  {shown.map((chapter) => {
                    const counts = chapterStats([chapter])
                    const chapterRead = chapter.questions.filter((question) => read.includes(question.id)).length
                    return (
                      <li key={chapter.slug} className="border-b">
                        <details open={filtering} className="group">
                          <summary className="grid cursor-pointer list-none grid-cols-[2.5rem_1fr] items-center gap-x-4 gap-y-2 py-4 sm:grid-cols-[2.5rem_1fr_11rem] [&::-webkit-details-marker]:hidden">
                            <span className="font-mono text-sm text-muted-foreground">{chapter.number}</span>
                            <span className="text-lg font-semibold group-hover:text-link">{chapter.title}</span>
                            <span className="col-start-2 flex flex-col gap-1.5 text-sm text-muted-foreground sm:col-start-3 sm:text-right">
                              <DifficultyMix counts={counts.byDifficulty} />
                              <span>
                                {counts.total} questions{chapterRead > 0 && `, ${chapterRead} read`}
                              </span>
                            </span>
                          </summary>
                          <div className="pb-4 pl-14">
                            <InlineHtml html={chapter.summaryHtml} className={`block text-sm leading-relaxed text-muted-foreground ${INLINE_CODE}`} />
                            <ul className="mt-3 flex flex-col">
                              {chapter.questions.map((question) => (
                                <li key={question.id} className="border-t border-dashed first:border-t-0">
                                  <Link to={questionPath(question)} className="flex items-baseline justify-between gap-4 py-2 hover:text-link">
                                    <QuestionTitle html={question.titleHtml} />
                                    {read.includes(question.id) && <span className="shrink-0 text-xs text-muted-foreground">read</span>}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                            <Link to={`/${topic.slug}/${chapter.slug}`} className="mt-2 inline-block text-sm text-link hover:text-link-hover">
                              Open chapter page
                            </Link>
                          </div>
                        </details>
                      </li>
                    )
                  })}
                </ol>
              )}
            </>
          )}
        </section>
      </div>
    </PageShell>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dd className="order-first text-2xl font-semibold tracking-tight tabular-nums">{value}</dd>
      <dt className="text-muted-foreground">{label}</dt>
    </div>
  )
}
```
Note: `open={filtering}` opens every shown chapter while a filter is active and closes them when it is cleared; chapters start collapsed with no filter. Before relying on `QuestionTitle`'s props, check `app/src/components/QuestionTitle.tsx` (it takes `html`, as used in `ChapterNav`).

- [ ] **Step 2: Verify** — `npx tsc -b && npm run lint && npm test`. In Chrome: `/javascript` at 1440px shows the cover, title, stats and buttons in a sticky left rail with the outline right; at 390px everything stacks with no horizontal scroll and no cover. Typing "closure" opens matching chapters and lists only matching questions; `(` and `.*` show "Nothing matches" with a working "Clear the filter"; "Unread only" toggles (`aria-pressed`); navigating to `/typescript` then back starts with an empty filter; `/react` shows the planned message and no filter. Screenshot desktop and mobile.

- [ ] **Step 3: Commit**
```bash
git add app/src/pages/TopicPage.tsx
git commit -m "feat(app): give the topic page a summary rail and a filterable outline"
```

---

### Task 4: Question page: breakpoints and mobile disclosure

**Files:**
- Modify: `app/src/pages/QuestionPage.tsx`

**Interfaces:**
- Consumes: `ChapterNav` (unchanged).

- [ ] **Step 1: Layout** — replace the opening container, the first `aside`, the `<main …>` opening tag and the closing `DepthRail` aside:

Before:
```tsx
    <div className="mx-auto flex max-w-340 flex-wrap gap-12 px-6 py-8">
      <aside className="max-w-72 min-w-56 flex-1 basis-60">
        <ChapterNav topicSlug={topic.slug} chapter={chapter} currentId={question.id} />
      </aside>

      <main className="min-w-0 max-w-180 flex-999 basis-140">
```
After:
```tsx
    <div className="mx-auto grid max-w-340 gap-12 px-6 py-8 lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,45rem)_14rem] xl:justify-center">
      <aside className="hidden lg:block">
        <ChapterNav topicSlug={topic.slug} chapter={chapter} currentId={question.id} />
      </aside>

      <main className="min-w-0">
```
and
```tsx
      {sections.length > 0 && (
        <aside className="hidden xl:block">
          <DepthRail stops={sections} />
        </aside>
      )}
```

- [ ] **Step 2: Mobile disclosure** — directly after the `<h1 …>…</h1>` of the question (before `{content === null ? …`), add:
```tsx
          <details className="mt-6 rounded-lg border lg:hidden">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
              Chapter {chapter.number}: {chapter.title}
            </summary>
            <div className="px-4 pb-4">
              <ChapterNav topicSlug={topic.slug} chapter={chapter} currentId={question.id} />
            </div>
          </details>
```

- [ ] **Step 3: Verify** — `npx tsc -b && npm run lint`. In Chrome on `/javascript/how-javascript-runs/ecmascript-engine-host` (resize with the browser tool): 390px: breadcrumbs, title, then a collapsed "Chapter 01: How JavaScript runs" row; opening it lists the questions; no horizontal scroll (`document.documentElement.scrollWidth === innerWidth`). 1024px: chapters left, question right, no depth rail. 1440px: three columns with the rail. A planned question (open a chapter page and pick one marked "Coming soon", or load one by URL) still lays out. Screenshot the three widths.

- [ ] **Step 4: Commit**
```bash
git add app/src/pages/QuestionPage.tsx
git commit -m "fix(app): put the question before the chapter list on small screens"
```

---

### Task 5: Docs

**Files:** Modify `docs/superpowers/specs/2026-10-14-isobath-redesign-design.md`, `PLAN.md`

- [ ] **Step 1: Spec** — in §3 add a line: `Header links to Paths, Practice and Roadmap are added by the steps that create those pages; the topic switcher ships first.` and in §1 under the ⌘K bullet: `The scope toggle waits until about ten topics have content (two today).` Mark in §3 that the manifest needs no chapter lists.

- [ ] **Step 2: PLAN.md** — **Now**: step 3 done; next step 4 (home + paths), write its plan first; delete the "confirm whether navigation needs chapter lists" clause.

- [ ] **Step 3: Remove this plan file** (finished plans are deleted; git keeps them) and commit:
```bash
git rm docs/superpowers/plans/2026-10-14-navigation.md
git add PLAN.md docs
git commit -m "docs: navigation step done; remove its finished plan"
```

---

## Self-review
- **Spec §3 coverage:** topic switcher ✔ T1; filterable collapsible outline ✔ T2–3; mobile question-first with chapters disclosure ✔ T4; breadcrumbs unchanged ✔; header Paths/Practice/Roadmap deferred with the reason (no dead links) ✔; "On this page" rail: the existing depth rail already serves it on `xl`, hidden below.
- **Placeholders:** none.
- **Type consistency:** `filterOutline(chapters, read, filter)` and `OutlineFilter` match between Tasks 2 and 3; `TopicSummary` prop type matches the shard type; `useManifest`/`groupByTrack` signatures match step 1.
