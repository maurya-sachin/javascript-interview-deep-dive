# Home and role paths Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the to-do-list home page with the approved layout: tagline, a "What are you preparing as?" role chooser that leads to ordered cross-topic paths, a strata hero figure, "Start here", "Available now", and a roadmap of planned topics. Add path pages, a paths index and a roadmap page.

**Architecture:** Paths are data: `content/paths/<role>.yaml`, validated by `content:check` and resolved at build time into the manifest (R3: counts and readiness are derived, never typed). Pure helpers (`resolveRolePaths`, `describePath`, `readingHours`, contour label anchors) carry the logic and the tests; pages stay thin.

**Tech Stack:** zod + yaml (already used for flashcards), `node:test`, React 19, react-router 8.4, Tailwind 4.

**Spec:** `docs/superpowers/specs/2026-10-14-isobath-redesign-design.md` → §4 Home and paths. Layout reference: `docs/superpowers/specs/mockups/page-layouts.html` (screen 1).

## Global Constraints
- Path files: `content/paths/<role>.yaml`; the filename is the slug. Validated by `content:check`: every entry resolves, no duplicates within a path.
- A path entry is `<topic>` or `<topic>/<chapter>`. Planned topics have no chapters, so they can only be referenced by topic; they render as roadmap steps, never dead links.
- Reading effort = 5 minutes per question (the "full answer" length the site already promises in `DepthLadder`), shown as "about N hours".
- Home copy: tagline "Engineering interviews, in depth."; role question "What are you preparing as?".
- Reserved URL segments: topic folders may not be named `paths`, `practice`, `flashcards` or `roadmap`.
- Header gains **Paths** and **Roadmap** links now that those pages exist (hidden below `md`; the home page links to both). Practice is added by step 5.
- No new dependencies. Never bulk-read `content/`, `app/public/data/`, `app/dist/`. Branch `v2`, one concern per commit.

## Review Focus
- A path that names a missing topic, missing chapter, duplicate entry, or reuses another path's `order` fails `content:check` with a message naming the file and entry.
- A production build (no drafts) still renders a sensible home: Start here hidden when its question has no page; Available now rows still show; no dead links.
- A path with only planned topics (Infrastructure and DevOps today) renders as a roadmap, with 0 hours and no "Continue".
- `/paths/nope` shows not found; `/paths`, `/roadmap`, `/paths/frontend` work; a topic can't shadow them (reserved-slug check).
- Hero figure labels stay inside the figure at 390px and don't overlap each other.
- Old saved progress (no `lastTitleHtml`) still loads; progress along a path counts only question ids under that step's topic/chapter prefix.

## Rulings made while planning
- "Start here" is a per-path optional `start:` question id; the home page shows the first path (by `order`) that defines one. Explicit and validated, instead of a guess from folder order.
- Lifecycle labels (Draft/Reviewed/Legacy) belong to step 7; step 4 shows counts, not status pills.
- The five roles and their order: Frontend engineer, Backend engineer, Full-stack engineer, Infrastructure and DevOps, Any engineer.

---

## File structure

| File | Responsibility |
|---|---|
| `content/paths/*.yaml` | Create: five role paths |
| `app/scripts/lib/rolepaths.ts` | Create: loader, `validateRolePaths`, `resolveRolePaths` |
| `app/scripts/lib/rolepaths.test.ts` | Create: tests |
| `app/scripts/lib/content.ts`, `check.ts`, `build.ts` | Modify: load, validate, emit paths |
| `app/src/content/types.ts` | Modify: `PathStep`, `RolePath`, `StartQuestion`; manifest gains `paths` |
| `app/src/lib/paths.ts` (+ test), `app/src/lib/effort.ts` (+ test) | Create: `describePath`, `stepProgress`, `readingHours` |
| `app/src/lib/contours.ts` (+ test) | Modify: `ringAtLevel`, `furthestPoint` |
| `app/src/components/{RoleList,StrataFigure,Roadmap}.tsx` | Create |
| `app/src/pages/{HomePage,PathPage,PathsPage,RoadmapPage}.tsx` | Rewrite / create |
| `app/src/routes.tsx`, `app/src/components/Layout.tsx`, `app/src/lib/repo.ts` | Modify |
| `templates/README.md` | Modify: document paths |

---

### Task 1: Path data, validation and tests

**Files:**
- Create: `content/paths/{frontend,backend,full-stack,infrastructure-and-devops,any-engineer}.yaml`, `app/scripts/lib/rolepaths.ts`, `app/scripts/lib/rolepaths.test.ts`
- Modify: `app/scripts/lib/content.ts`, `app/scripts/lib/check.ts`, `app/src/content/types.ts`, `templates/README.md`

**Interfaces:**
- Produces (`rolepaths.ts`):
  ```ts
  export interface RolePathSource { slug: string; file: string; title: string; summary: string; order: number; start?: string; steps: { ref: string; why: string }[] }
  export interface TopicLike { slug: string; title: string; chapters: { slug: string; title: string; questions: unknown[] }[] }
  export async function loadRolePaths(problems: Problem[]): Promise<RolePathSource[]>
  export function validateRolePaths(paths: RolePathSource[], topics: TopicLike[], questionIds: ReadonlySet<string>): Problem[]
  export function resolveRolePaths(paths: RolePathSource[], topics: TopicLike[]): ResolvedPath[]   // ResolvedPath = RolePath without `start`'s rendered fields
  ```
  `Content` gains `paths: RolePathSource[]`.
- Produces (`types.ts`): `PathStep`, `StartQuestion`, `RolePath` (below).

- [ ] **Step 1: Types** — in `app/src/content/types.ts` add after `ContentManifest`'s dependencies (and add `paths: RolePath[]` to `ContentManifest`):
```ts
/** One entry of a role path, resolved against the content. */
export interface PathStep {
  topic: string
  topicTitle: string
  /** Set when the entry names a chapter. */
  chapter: string | null
  chapterTitle: string | null
  /** One line on why this step is on the path. */
  why: string
  /** Whether there is content to read: the topic has chapters. Planned topics are roadmap steps. */
  ready: boolean
  /** Questions in the chapter, or in the topic when no chapter is named. */
  questionCount: number
}

/** The question a path suggests opening first. */
export interface StartQuestion {
  id: string
  titleHtml: string
  tldrHtml: string
}

/** An ordered, cross-topic route for one kind of engineer; built from `content/paths/<slug>.yaml`. */
export interface RolePath {
  slug: string
  title: string
  summary: string
  start: StartQuestion | null
  steps: PathStep[]
}
```

- [ ] **Step 2: Failing tests** — `app/scripts/lib/rolepaths.test.ts`:
```ts
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
```

- [ ] **Step 3: Run, expect failure** — `npm test` (in `app/`). Expected: FAIL, `Cannot find module '.../rolepaths.ts'`.

- [ ] **Step 4: Implement** — `app/scripts/lib/rolepaths.ts`:
```ts
// Role paths: content/paths/<role>.yaml, per `templates/README.md` → Paths.

import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { parse as parseYaml } from 'yaml'
import { z } from 'zod'
import type { PathStep, RolePath } from '../../src/content/types.ts'
import { countWords } from './frontmatter.ts'
import { contentDir, repoRelative, type Problem } from './paths.ts'

const pathsDir = path.join(contentDir, 'paths')
const KEBAB = '[a-z0-9]+(?:-[a-z0-9]+)*'

const wordLimit = (limit: number) => (text: string) => countWords(text) <= limit

const stepSchema = z.strictObject({
  ref: z.string().regex(new RegExp(`^${KEBAB}(?:/${KEBAB})?$`), 'must be `<topic>` or `<topic>/<chapter>`'),
  why: z.string().min(1).refine(wordLimit(25), 'must be 25 words or fewer'),
})

const pathSchema = z.strictObject({
  title: z.string().min(1),
  summary: z.string().min(1).refine(wordLimit(30), 'must be 30 words or fewer'),
  order: z.number().int().positive(),
  start: z.string().min(1).optional(),
  steps: z.array(stepSchema).min(1),
})

export interface RolePathSource extends z.infer<typeof pathSchema> {
  slug: string
  file: string
}

/** The parts of a topic the path rules need; both the content loader's `Topic` and the app's summary fit. */
export interface TopicLike {
  slug: string
  title: string
  chapters: { slug: string; title: string; questions: unknown[] }[]
}

/** A resolved path before its start question is rendered (the build adds that). */
export type ResolvedPath = Omit<RolePath, 'start'> & { startId: string | null }

export async function loadRolePaths(problems: Problem[]): Promise<RolePathSource[]> {
  let names: string[]
  try {
    names = (await readdir(pathsDir)).filter((name) => !name.startsWith('.')).sort()
  } catch {
    return [] // no paths yet
  }

  const paths: RolePathSource[] = []
  for (const name of names) {
    const file = path.join(pathsDir, name)
    if (!name.endsWith('.yaml')) {
      problems.push({ file: repoRelative(file), message: 'path files must be `<role>.yaml`' })
      continue
    }
    const parsed = await parsePath(file, problems)
    if (parsed) paths.push({ ...parsed, slug: name.slice(0, -'.yaml'.length), file: repoRelative(file) })
  }
  return paths
}

async function parsePath(file: string, problems: Problem[]) {
  let data: unknown
  try {
    data = parseYaml(await readFile(file, 'utf8'))
  } catch (error) {
    problems.push({ file: repoRelative(file), message: `not valid YAML: ${(error as Error).message}` })
    return undefined
  }
  const result = pathSchema.safeParse(data)
  if (result.success) return result.data
  for (const issue of result.error.issues) {
    problems.push({ file: repoRelative(file), message: `${issue.path.join('.') || 'file'}: ${issue.message}` })
  }
  return undefined
}

/** Every entry names an existing topic (and chapter), appears once, and `start` is a real question. */
export function validateRolePaths(paths: RolePathSource[], topics: TopicLike[], questionIds: ReadonlySet<string>): Problem[] {
  const problems: Problem[] = []
  const owners = new Map<number, string>()
  for (const rolePath of paths) {
    const { file } = rolePath
    const owner = owners.get(rolePath.order)
    if (owner !== undefined) problems.push({ file, message: `order ${rolePath.order} is already used by \`${owner}\`` })
    else owners.set(rolePath.order, rolePath.slug)

    if (rolePath.start !== undefined && !questionIds.has(rolePath.start)) problems.push({ file, message: `start: unknown question \`${rolePath.start}\`` })

    const seen = new Set<string>()
    for (const { ref } of rolePath.steps) {
      if (seen.has(ref)) problems.push({ file, message: `entry \`${ref}\` appears twice` })
      seen.add(ref)
      const [topicSlug, chapterSlug] = ref.split('/')
      const topic = topics.find((candidate) => candidate.slug === topicSlug)
      if (!topic) problems.push({ file, message: `unknown topic \`${topicSlug}\` in entry \`${ref}\`` })
      else if (chapterSlug !== undefined && !topic.chapters.some((chapter) => chapter.slug === chapterSlug)) {
        problems.push({ file, message: `unknown chapter \`${ref}\`` })
      }
    }
  }
  return problems
}

/** Resolves valid paths (run `validateRolePaths` first) against the content, sorted by `order`. */
export function resolveRolePaths(paths: RolePathSource[], topics: TopicLike[]): ResolvedPath[] {
  return [...paths]
    .sort((a, b) => a.order - b.order)
    .map(({ slug, title, summary, start, steps }) => ({
      slug,
      title,
      summary,
      startId: start ?? null,
      steps: steps.map(({ ref, why }): PathStep => {
        const [topicSlug, chapterSlug] = ref.split('/')
        const topic = topics.find((candidate) => candidate.slug === topicSlug)!
        const chapter = chapterSlug === undefined ? null : topic.chapters.find((candidate) => candidate.slug === chapterSlug)!
        const questionCount = (chapter ? [chapter] : topic.chapters).reduce((sum, entry) => sum + entry.questions.length, 0)
        return {
          topic: topic.slug,
          topicTitle: topic.title,
          chapter: chapter?.slug ?? null,
          chapterTitle: chapter?.title ?? null,
          why,
          ready: topic.chapters.length > 0,
          questionCount,
        }
      }),
    }))
}
```

- [ ] **Step 5: Run tests** — `npm test && npx tsc -b && npm run lint`. Expected: pass. (The type `RolePath` is added in Step 1; `tsc` will fail before it exists.)

- [ ] **Step 6: Wire into the loader and the checks**
  - `content.ts`: `import { loadRolePaths, type RolePathSource } from './rolepaths.ts'`; add `paths: RolePathSource[]` to `Content`; `NON_TOPIC_DIRS = new Set(['flashcards', 'paths'])`; return `{ topics, decks: await loadDecks(problems), paths: await loadRolePaths(problems), problems }`.
  - `check.ts`: in `collectProblems` add to the spread: `...checkRolePaths(content)` with
    ```ts
    /** Topic folders can't take names the app uses for other routes. */
    const RESERVED_TOPIC_SLUGS = ['paths', 'practice', 'flashcards', 'roadmap']

    function checkRolePaths({ topics, paths }: Content): Problem[] {
      const questionIds = new Set(topics.flatMap((topic) => topic.chapters.flatMap((chapter) => chapter.questions.map((question) => question.id))))
      const reserved = topics
        .filter((topic) => RESERVED_TOPIC_SLUGS.includes(topic.slug))
        .map((topic): Problem => ({ file: repoRelative(topic.dir), message: `\`${topic.slug}\` is a reserved route name; pick another folder name` }))
      return [...reserved, ...validateRolePaths(paths, topics, questionIds)]
    }
    ```
    importing `validateRolePaths` from `./rolepaths.ts`.

- [ ] **Step 7: The five paths** — create these files (slug = filename; `order` sets the home order):

`content/paths/frontend.yaml`
```yaml
title: Frontend engineer
summary: The language first, then the browser and frameworks, then performance, security and design.
order: 1
start: javascript/how-javascript-runs/ecmascript-engine-host
steps:
  - ref: javascript
    why: Every frontend interview starts at the language.
  - ref: typescript
    why: Typed JavaScript is the default in most teams.
  - ref: html-and-css
    why: Layout and semantics come up before any framework does.
  - ref: browser
    why: Rendering, events and storage explain most real bugs.
  - ref: accessibility
    why: Expected of senior frontend work.
  - ref: react
    why: The most-asked framework.
  - ref: state-and-data-fetching
    why: Where most frontend complexity lives.
  - ref: nextjs
    why: Server rendering and routing in practice.
  - ref: web-performance
    why: Measuring and fixing slow pages.
  - ref: web-security
    why: XSS, CSP and the browser's trust model.
  - ref: testing
    why: What to test and how.
  - ref: system-design
    why: Frontend design rounds at senior level.
```

`content/paths/backend.yaml`
```yaml
title: Backend engineer
summary: The language under Node.js, then HTTP, data, and the patterns that keep services reliable.
order: 2
steps:
  - ref: javascript
    why: The language under Node.js.
  - ref: nodejs
    why: The runtime, its event loop and its modules.
  - ref: http-and-apis
    why: Every service speaks HTTP.
  - ref: databases
    why: Modelling, queries and transactions.
  - ref: caching
    why: Speed and its consistency costs.
  - ref: backend-patterns
    why: Structuring services that last.
  - ref: messaging-and-jobs
    why: Work that should not block a request.
  - ref: authentication
    why: Sessions, tokens and getting them right.
  - ref: observability
    why: Knowing what production is doing.
  - ref: web-security
    why: Attacks a backend must expect.
  - ref: testing
    why: Confidence without slow suites.
  - ref: system-design
    why: The senior backend round.
```

`content/paths/full-stack.yaml`
```yaml
title: Full-stack engineer
summary: The language first, then both sides of the wire, then the questions that span them.
order: 3
steps:
  - ref: javascript
    why: One language across the stack.
  - ref: typescript
    why: Shared types between client and server.
  - ref: html-and-css
    why: The client's foundation.
  - ref: react
    why: The most common client framework.
  - ref: nodejs
    why: The most common server runtime for JavaScript teams.
  - ref: http-and-apis
    why: The contract between the two sides.
  - ref: databases
    why: Where the data lives.
  - ref: authentication
    why: Crosses client and server.
  - ref: nextjs
    why: Where the two sides meet in one framework.
  - ref: web-security
    why: Attacks on both sides.
  - ref: testing
    why: Tests at each layer.
  - ref: system-design
    why: End-to-end design rounds.
```

`content/paths/infrastructure-and-devops.yaml`
```yaml
title: Infrastructure and DevOps
summary: Version control and networks first, then containers, delivery pipelines and the cloud.
order: 4
steps:
  - ref: git
    why: The base of every delivery pipeline.
  - ref: networking
    why: DNS, TCP and TLS explain most outages.
  - ref: containers-and-kubernetes
    why: How software is packaged and run.
  - ref: ci-cd
    why: Getting changes to production safely.
  - ref: cloud-and-iac
    why: Infrastructure as reviewed code.
  - ref: observability
    why: Metrics, logs and traces.
  - ref: web-security
    why: Securing what you deploy.
  - ref: system-design
    why: Designing for failure.
```

`content/paths/any-engineer.yaml`
```yaml
title: Any engineer
summary: The topics asked of every software engineer, whatever the stack.
order: 5
steps:
  - ref: data-structures-and-algorithms
    why: The shared vocabulary of coding rounds.
  - ref: git
    why: Daily tooling every team assumes.
  - ref: networking
    why: What happens between two machines.
  - ref: http-and-apis
    why: How services talk.
  - ref: databases
    why: Storing and querying data.
  - ref: testing
    why: Shipping with confidence.
  - ref: web-security
    why: Common attacks and defences.
  - ref: system-design
    why: Putting the pieces together.
```

- [ ] **Step 8: Validate and document** — Run (in `app/`): `npm run content:check`. Expected: `✔ … no problems`. Add a `## Paths` section to `templates/README.md` after `## Flashcards`: file location and shape (the YAML above with each field explained: `title`, `summary` ≤ 30 words, `order` unique, optional `start` question id, `steps[].ref` = `<topic>` or `<topic>/<chapter>`, `why` ≤ 25 words), that planned topics may be referenced by topic only, and that `content:check` validates them.

- [ ] **Step 9: Commit**
```bash
git add content/paths app/scripts app/src/content/types.ts templates/README.md
git commit -m "feat(content): add role paths with validation"
```

---

### Task 2: Build emits paths into the manifest

**Files:**
- Modify: `app/scripts/build.ts`

**Interfaces:**
- Consumes: `resolveRolePaths` (Task 1); `ContentManifest`, `RolePath`, `StartQuestion`.
- Produces: `manifest.paths: RolePath[]` (sorted by `order`, `start` rendered or `null`).

- [ ] **Step 1: Imports** — add `StartQuestion`, `RolePath` to the `../src/content/types.ts` import and `import { resolveRolePaths } from './lib/rolepaths.ts'`.

- [ ] **Step 2: Resolve and render the start question** — before the manifest is written:
```ts
/** The start question rendered for the home page, or `null` when it has no page in this build. */
async function startQuestion(id: string | null): Promise<StartQuestion | null> {
  const question = questions.find((candidate) => candidate.id === id)
  if (!question) return null
  const meta = metaOf(question)
  if (!hasPage(meta)) return null
  return { id: question.id, titleHtml: (await renderInline(meta.title)).html, tldrHtml: (await renderInline(meta.tldr)).html }
}

const paths: RolePath[] = await Promise.all(
  resolveRolePaths(content.paths, content.topics).map(async ({ startId, ...rolePath }) => ({ ...rolePath, start: await startQuestion(startId) })),
)
```
and change the manifest to `const manifest: ContentManifest = { topics: topics.map(toOverview), paths }`.

- [ ] **Step 3: Verify** — Run: `npm run content:build -- --drafts && node -e "const m=require('./public/data/manifest.json'); console.log(m.paths.map(p=>p.slug+':'+p.steps.length+':'+p.steps.filter(s=>s.ready).length+':'+(p.start?'start':'-')).join(' '))"`. Expected: `frontend:12:2:start backend:12:1:- full-stack:12:2:- infrastructure-and-devops:8:0:- any-engineer:8:0:-`. Then `npm run content:build` (no drafts): `start` is `-` for frontend (no page in a production build); `npx tsc -b && npm run lint && npm test`.

- [ ] **Step 4: Commit**
```bash
git add app/scripts/build.ts
git commit -m "feat(app): build role paths into the manifest"
```

---

### Task 3: Pure helpers (describePath, stepProgress, readingHours, contour anchors)

**Files:**
- Create: `app/src/lib/paths.ts`, `app/scripts/lib/paths.test.ts`, `app/src/lib/effort.ts`
- Modify: `app/src/lib/contours.ts`, `app/scripts/lib/contours.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // paths.ts
  export function describePath(path: RolePath): string
  export function stepPath(step: PathStep): string
  export function stepProgress(step: PathStep, read: readonly string[]): { read: number; total: number }
  // effort.ts
  export const MINUTES_PER_QUESTION = 5
  export function readingHours(questionCount: number): number
  // contours.ts
  export function ringAtLevel(rings: Ring[], level: number): Ring | undefined
  export function furthestPoint(points: readonly Point[], angle: number): Point
  ```

- [ ] **Step 1: Failing tests** — `app/scripts/lib/paths.test.ts`:
```ts
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readingHours } from '../../src/lib/effort.ts'
import { describePath, stepPath, stepProgress } from '../../src/lib/paths.ts'
import type { PathStep, RolePath } from '../../src/content/types.ts'

function step(overrides: Partial<PathStep>): PathStep {
  return { topic: 'javascript', topicTitle: 'JavaScript', chapter: null, chapterTitle: null, why: 'x', ready: true, questionCount: 10, ...overrides }
}
const path = (steps: PathStep[]): RolePath => ({ slug: 'p', title: 'P', summary: 's', start: null, steps })

test('describes ready and planned topics', () => {
  assert.equal(describePath(path([step({}), step({ topic: 'typescript', topicTitle: 'TypeScript' }), step({ topic: 'react', topicTitle: 'React', ready: false })])), 'JavaScript and TypeScript are ready; 1 more planned')
  assert.equal(describePath(path([step({})])), 'JavaScript is ready')
  assert.equal(describePath(path([step({ ready: false }), step({ topic: 'x', ready: false })])), 'Roadmap only: nothing written yet')
  assert.equal(describePath(path([step({}), step({ topic: 'b', topicTitle: 'B' }), step({ topic: 'c', topicTitle: 'C' })])), 'JavaScript, B and C are ready')
})

test('step paths point at the chapter when one is named', () => {
  assert.equal(stepPath(step({})), '/javascript')
  assert.equal(stepPath(step({ chapter: 'engine' })), '/javascript/engine')
})

test('progress counts read ids under the step prefix only', () => {
  const read = ['javascript/engine/a', 'javascript/types/b', 'javascriptx/c/d', 'typescript/e/f']
  assert.deepEqual(stepProgress(step({}), read), { read: 2, total: 10 })
  assert.deepEqual(stepProgress(step({ chapter: 'engine' }), read), { read: 1, total: 10 })
  assert.deepEqual(stepProgress(step({ questionCount: 1 }), read), { read: 1, total: 1 })
})

test('reading effort is 5 minutes a question, rounded to whole hours, at least one', () => {
  assert.equal(readingHours(150), 13)
  assert.equal(readingHours(12), 1)
  assert.equal(readingHours(1), 1)
  assert.equal(readingHours(0), 0)
})
```
Add to `contours.test.ts` (and import `ringAtLevel`, `furthestPoint`):
```ts
test('ringAtLevel returns the ring with the most points at that level', () => {
  const rings = contourRings({ seed: 'javascript', levels: 6 })
  const ring = ringAtLevel(rings, 2)
  assert.ok(ring)
  assert.ok(rings.filter((candidate) => candidate.level === 2).every((candidate) => candidate.points.length <= ring.points.length))
  assert.equal(ringAtLevel(rings, 99), undefined)
})

test('furthestPoint picks the point furthest in a direction (angle 0 is right, y grows downward)', () => {
  const square: [number, number][] = [[0, 0], [10, 0], [10, 10], [0, 10]]
  assert.equal(furthestPoint(square, 0)[0], 10)
  assert.equal(furthestPoint(square, Math.PI)[0], 0)
  assert.equal(furthestPoint(square, Math.PI / 2)[1], 10)
  assert.equal(furthestPoint(square, -Math.PI / 2)[1], 0)
})
```

- [ ] **Step 2: Run, expect failure** — `npm test`. Expected: FAIL (missing modules / exports).

- [ ] **Step 3: Implement**

`app/src/lib/effort.ts`:
```ts
// Reading effort shown on paths, from the length the site promises for a full answer.

export const MINUTES_PER_QUESTION = 5

/** Whole hours to read `questionCount` questions; at least one hour for any non-empty set. */
export function readingHours(questionCount: number): number {
  if (questionCount === 0) return 0
  return Math.max(1, Math.round((questionCount * MINUTES_PER_QUESTION) / 60))
}
```

`app/src/lib/paths.ts`:
```ts
// Helpers for showing role paths: summaries, links and progress along them.

import type { PathStep, RolePath } from '@/content/types'

function joinNames(names: string[]): string {
  return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
}

/** One line for the role chooser: what is ready on this path and how much is still planned. */
export function describePath({ steps }: RolePath): string {
  const ready = steps.filter((step) => step.ready)
  if (ready.length === 0) return 'Roadmap only: nothing written yet'
  const planned = steps.length - ready.length
  const names = [...new Set(ready.map((step) => step.topicTitle))]
  const sentence = `${joinNames(names)} ${names.length === 1 ? 'is' : 'are'} ready`
  return planned > 0 ? `${sentence}; ${planned} more planned` : sentence
}

export function stepPath({ topic, chapter }: PathStep): string {
  return chapter ? `/${topic}/${chapter}` : `/${topic}`
}

/** Questions read under this step, out of the step's total. Ids are `<topic>/<chapter>/<question>`. */
export function stepProgress({ topic, chapter, questionCount }: PathStep, read: readonly string[]): { read: number; total: number } {
  const prefix = chapter ? `${topic}/${chapter}/` : `${topic}/`
  // Ids of renamed or removed questions can linger in saved progress; never report more read than exist.
  return { read: Math.min(read.filter((id) => id.startsWith(prefix)).length, questionCount), total: questionCount }
}
```

Append to `app/src/lib/contours.ts`:
```ts
/** The ring with the most points at a level (a level can have several rings); `undefined` when the level has none. */
export function ringAtLevel(rings: Ring[], level: number): Ring | undefined {
  return rings.filter((ring) => ring.level === level).reduce<Ring | undefined>((best, ring) => (!best || ring.points.length > best.points.length ? ring : best), undefined)
}

/** The point furthest in a direction: `angle` 0 is right and grows clockwise on screen (y grows downward). */
export function furthestPoint(points: readonly Point[], angle: number): Point {
  const reach = ([x, y]: Point) => x * Math.cos(angle) + y * Math.sin(angle)
  return points.reduce((best, point) => (reach(point) > reach(best) ? point : best))
}
```

- [ ] **Step 4: Run** — `npm test && npx tsc -b && npm run lint`. Expected: all pass.

- [ ] **Step 5: Commit**
```bash
git add app
git commit -m "feat(app): add path, effort and contour-anchor helpers"
```

---

### Task 4: Home page

**Files:**
- Create: `app/src/components/RoleList.tsx`, `app/src/components/StrataFigure.tsx`, `app/src/components/Roadmap.tsx`
- Modify: `app/src/pages/HomePage.tsx` (rewrite), `app/src/lib/repo.ts`

**Interfaces:**
- Consumes: `useManifest`, `describePath`, `contourRings`/`ringPath`/`ringAtLevel`/`furthestPoint`, `groupByTrack`, `TopicCover`, `DifficultyMix`.
- Produces: `<RoleList paths />`, `<Roadmap topics />`, `<StrataFigure />`; `CONTRIBUTE_URL` in `repo.ts`.

- [ ] **Step 1: `repo.ts`** — add `export const CONTRIBUTE_URL = `${REPO_URL}/blob/${DEFAULT_BRANCH}/templates/README.md``.

- [ ] **Step 2: `RoleList.tsx`**
```tsx
import { Link } from 'react-router'
import type { RolePath } from '@/content/types'
import { describePath } from '@/lib/paths'

/** The role chooser: one row per path. */
export function RoleList({ paths }: { paths: RolePath[] }) {
  return (
    <ul className="border-b">
      {paths.map((path) => (
        <li key={path.slug} className="border-t">
          <Link to={`/paths/${path.slug}`} className="group grid grid-cols-[1fr_auto] items-baseline gap-4 py-4 hover:bg-linear-to-r hover:from-muted hover:to-transparent">
            <span>
              <span className="block font-serif text-[1.375rem] leading-tight font-medium">{path.title}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{describePath(path)}</span>
            </span>
            <span className="text-sm text-link opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100">Open path</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 3: `Roadmap.tsx`** (all topics by track; written topics first, planned ones plain)
```tsx
import { Link } from 'react-router'
import type { TopicOverview } from '@/content/types'
import { CONTRIBUTE_URL } from '@/lib/repo'
import { groupByTrack } from '@/lib/tracks'

/** Every topic by track, with what is written and what is planned. */
export function Roadmap({ topics }: { topics: TopicOverview[] }) {
  const planned = topics.filter((topic) => topic.chapterCount === 0).length
  return (
    <>
      <p className="max-w-2xl text-muted-foreground">
        {planned} topics are planned and not written yet. Each has a README with its scope.{' '}
        <a href={CONTRIBUTE_URL} className="text-link hover:text-link-hover">
          Contribute a question
        </a>
      </p>
      <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {groupByTrack(topics).map((group) => (
          <section key={group.name}>
            <h3 className="text-sm font-semibold">{group.name}</h3>
            <ul className="mt-2">
              {group.topics.map((topic) => (
                <li key={topic.slug} className="border-t">
                  <Link to={`/${topic.slug}`} className="flex justify-between gap-3 py-1.5 text-sm hover:text-link">
                    <span className={topic.chapterCount === 0 ? 'text-muted-foreground' : undefined}>{topic.title}</span>
                    {topic.chapterCount === 0 && <span className="text-muted-foreground">Planned</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}
```

- [ ] **Step 4: `StrataFigure.tsx`** — the hero: contours with the four depths labelled by leader lines (fixes the mockup's floating labels):
```tsx
import { contourRings, furthestPoint, ringAtLevel, ringPath } from '@/lib/contours'
import { depthStrokeClass } from '@/lib/depth'
import { cn } from '@/lib/utils'

const LEVELS = 8
const MAP_X = 50 // the 100-unit map sits in the middle of a 200-wide figure
// Each depth is labelled from a different corner so the labels never collide.
const LABELS = [
  { name: '30-second answer', detail: 'What you say first', angle: (-3 * Math.PI) / 4, side: 'left' },
  { name: 'Full answer', detail: 'Mechanism, with an example', angle: -Math.PI / 4, side: 'right' },
  { name: 'Follow-ups', detail: 'Edge cases they push on', angle: (3 * Math.PI) / 4, side: 'left' },
  { name: 'Spec and engine', detail: 'Why it works that way', angle: Math.PI / 4, side: 'right' },
] as const

/** A contour map with the four depths of every answer labelled on it. */
export function StrataFigure({ className }: { className?: string }) {
  const rings = contourRings({ seed: 'isobath', levels: LEVELS })
  return (
    <svg viewBox="0 0 200 100" role="img" aria-label="Contour map: the four depths of every answer, from the 30-second answer down to the spec and the engine" className={cn('w-full', className)}>
      <g transform={`translate(${MAP_X} 0)`} fill="none" strokeWidth="0.7" strokeLinejoin="round">
        {rings.map((ring, index) => (
          <path key={index} d={ringPath(ring.points)} className={cn(depthStrokeClass(ring.level, LEVELS), ring.level === LEVELS - 1 && 'fill-depth-4/20')} />
        ))}
      </g>
      {LABELS.map(({ name, detail, angle, side }, depth) => {
        const ring = ringAtLevel(rings, Math.round((depth * (LEVELS - 1)) / (LABELS.length - 1)))
        if (!ring) return null
        const [x, pointY] = furthestPoint(ring.points, angle)
        // Keep both text lines inside the 100-unit-high frame.
        const y = Math.min(Math.max(pointY, 6), 94)
        const edge = side === 'left' ? 46 : 154
        return (
          <g key={name}>
            <line x1={MAP_X + x} y1={pointY} x2={edge} y2={y} className="stroke-muted-foreground/50" strokeWidth="0.3" />
            <circle cx={MAP_X + x} cy={pointY} r="0.9" className="fill-foreground" />
            <text x={side === 'left' ? edge - 2 : edge + 2} y={y - 0.8} textAnchor={side === 'left' ? 'end' : 'start'} className="fill-foreground font-serif" fontSize="4">
              {name}
            </text>
            <text x={side === 'left' ? edge - 2 : edge + 2} y={y + 3.6} textAnchor={side === 'left' ? 'end' : 'start'} className="fill-muted-foreground" fontSize="2.8">
              {detail}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
```

- [ ] **Step 5: Rewrite `HomePage.tsx`**
```tsx
import { Link } from 'react-router'
import { DifficultyMix } from '@/components/DifficultyMix'
import { PageShell } from '@/components/PageShell'
import { InlineHtml } from '@/components/question/InlineHtml'
import { QuestionTitle } from '@/components/QuestionTitle'
import { Roadmap } from '@/components/Roadmap'
import { RoleList } from '@/components/RoleList'
import { StrataFigure } from '@/components/StrataFigure'
import { TopicCover } from '@/components/TopicCover'
import { Button } from '@/components/ui/button'
import { questionPath, useManifest } from '@/content/index-data'
import type { TopicOverview } from '@/content/types'
import { useProgress } from '@/lib/progress'
import { SITE_NAME, TAGLINE } from '@/lib/site'

const INLINE_CODE = '[&_code]:font-mono [&_code]:text-[0.9em]'

export function HomePage() {
  const { topics, paths } = useManifest()
  const { last, lastTitleHtml } = useProgress()
  const available = topics.filter((topic) => topic.chapterCount > 0)
  const start = paths.find((path) => path.start)?.start ?? null
  const lastQuestion = last && lastTitleHtml ? { id: last, titleHtml: lastTitleHtml } : null

  return (
    <PageShell crumbs={[]} wide>
      <title>{`${SITE_NAME}: ${TAGLINE}`}</title>
      <section className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <h1 className="font-serif text-[2.75rem] leading-[1.05] font-medium tracking-[-0.025em] sm:text-6xl">Engineering interviews, in depth.</h1>
          <p className="mt-5 max-w-lg font-serif text-xl leading-relaxed text-muted-foreground">
            Every question opens with the answer you would give in the room, then goes down to the mechanism, the edge cases, and the spec or engine underneath.
          </p>
          <h2 className="mt-9 mb-1 text-sm font-semibold">What are you preparing as?</h2>
          <RoleList paths={paths} />
          {lastQuestion && (
            <Link to={questionPath(lastQuestion)} className="group mt-8 flex max-w-lg items-baseline gap-3 border-l-2 border-link pl-4">
              <span>
                <span className="block text-sm text-muted-foreground">Continue where you left off</span>
                <span className="block font-medium group-hover:text-link">
                  <QuestionTitle html={lastQuestion.titleHtml} />
                </span>
              </span>
            </Link>
          )}
        </div>
        <StrataFigure className="max-lg:order-first" />
      </section>

      {start && (
        <section className="mt-20 grid gap-10 border-t pt-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16" aria-labelledby="start-here">
          <div>
            <h2 id="start-here" className="font-serif text-3xl font-medium tracking-tight">
              Start here
            </h2>
            <p className="mt-2 text-muted-foreground">If you read one question first, read this one. It sets up the vocabulary the rest of the language uses.</p>
            <p className="mt-6 font-serif text-3xl leading-tight font-medium tracking-tight">
              <QuestionTitle html={start.titleHtml} />
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link to={questionPath(start)}>Read the question</Link>
            </Button>
          </div>
          <div className="rounded-r-xl border-l-4 border-link bg-tldr py-5 pr-6 pl-6 text-tldr-foreground">
            <p className="text-sm font-medium">30-second answer</p>
            <InlineHtml html={start.tldrHtml} className={`mt-2 block font-serif text-xl leading-snug text-foreground ${INLINE_CODE}`} />
          </div>
        </section>
      )}

      <section className="mt-20 border-t pt-12" aria-labelledby="available">
        <h2 id="available" className="font-serif text-3xl font-medium tracking-tight">
          Available now
        </h2>
        <p className="mt-2 text-muted-foreground">Written and researched against primary sources.</p>
        <div className="mt-8 grid gap-10 md:grid-cols-2">
          {available.map((topic) => (
            <AvailableTopic key={topic.slug} topic={topic} />
          ))}
        </div>
      </section>

      <section className="mt-20 border-t pt-12" aria-labelledby="roadmap">
        <h2 id="roadmap" className="font-serif text-3xl font-medium tracking-tight">
          Roadmap
        </h2>
        <div className="mt-2">
          <Roadmap topics={topics} />
        </div>
      </section>
    </PageShell>
  )
}

function AvailableTopic({ topic }: { topic: TopicOverview }) {
  const { stats } = topic
  return (
    <Link to={`/${topic.slug}`} className="group grid grid-cols-[7.5rem_1fr] gap-5">
      <TopicCover slug={topic.slug} chapterCount={topic.chapterCount} hardShare={stats.total === 0 ? 0 : stats.byDifficulty.hard / stats.total} className="size-30 rounded-md bg-muted" />
      <span>
        <span className="block font-serif text-2xl leading-tight font-medium group-hover:text-link">{topic.title}</span>
        <InlineHtml html={topic.summaryHtml} className={`mt-1 mb-3 line-clamp-2 block text-sm text-muted-foreground ${INLINE_CODE}`} />
        <DifficultyMix counts={stats.byDifficulty} className="max-w-64" />
        <span className="mt-2 block text-xs text-muted-foreground">
          {stats.total} questions{topic.flashcardCount > 0 && ` · ${topic.flashcardCount} flashcards`}
        </span>
      </span>
    </Link>
  )
}
```
(`size-30` = 7.5rem in Tailwind 4's 4px scale; if the class is not generated, use `size-[7.5rem]`.)

- [ ] **Step 6: Verify** — `npx tsc -b && npm run lint && npm test`. `npm run content:build -- --drafts`, `npm run dev`, Chrome at `/`: hero with tagline, five role rows (Frontend first, "JavaScript and TypeScript are ready; 10 more planned"), strata figure with four labelled leader lines inside its frame, Start here with the 30-second answer, two available topics with covers, four-column roadmap with 26 Planned. Check at 390px (narrow iframe): no horizontal scroll, figure first, labels not clipped (if clipped, shrink the label font sizes). Then `npm run content:build` (no drafts) and reload `/`: Start here is gone, nothing else breaks. Screenshot desktop (light, dark) and mobile.

- [ ] **Step 7: Commit**
```bash
git add app/src
git commit -m "feat(app): rebuild the home page around role paths"
```

---

### Task 5: Path pages, paths index, roadmap page, header links

**Files:**
- Create: `app/src/pages/PathPage.tsx`, `app/src/pages/PathsPage.tsx`, `app/src/pages/RoadmapPage.tsx`
- Modify: `app/src/routes.tsx`, `app/src/components/Layout.tsx`

**Interfaces:**
- Consumes: `RoleList`, `Roadmap`, `useManifest`, `stepPath`, `stepProgress`, `readingHours`, `describePath`.

- [ ] **Step 1: `PathsPage.tsx` and `RoadmapPage.tsx`**
```tsx
import { PageShell } from '@/components/PageShell'
import { RoleList } from '@/components/RoleList'
import { useManifest } from '@/content/index-data'
import { SITE_NAME } from '@/lib/site'

export function PathsPage() {
  const { paths } = useManifest()
  return (
    <PageShell crumbs={[]} wide>
      <title>{`Paths · ${SITE_NAME}`}</title>
      <h1 className="font-serif text-4xl font-medium tracking-tight">Paths</h1>
      <p className="mt-2 mb-8 max-w-xl text-muted-foreground">A route through the topics for the kind of engineer you are preparing to be. Pick one and work down the list.</p>
      <RoleList paths={paths} />
    </PageShell>
  )
}
```
```tsx
import { PageShell } from '@/components/PageShell'
import { Roadmap } from '@/components/Roadmap'
import { useManifest } from '@/content/index-data'
import { SITE_NAME } from '@/lib/site'

export function RoadmapPage() {
  const { topics } = useManifest()
  return (
    <PageShell crumbs={[]} wide>
      <title>{`Roadmap · ${SITE_NAME}`}</title>
      <h1 className="font-serif text-4xl font-medium tracking-tight">Roadmap</h1>
      <div className="mt-2">
        <Roadmap topics={topics} />
      </div>
    </PageShell>
  )
}
```

- [ ] **Step 2: `PathPage.tsx`**
```tsx
import { Link, useParams } from 'react-router'
import { NotFound, PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/button'
import { useManifest } from '@/content/index-data'
import { readingHours } from '@/lib/effort'
import { stepPath, stepProgress } from '@/lib/paths'
import { useProgress } from '@/lib/progress'
import { SITE_NAME } from '@/lib/site'
import { cn } from '@/lib/utils'

export function PathPage() {
  const { slug } = useParams()
  const { paths } = useManifest()
  const { read } = useProgress()
  const path = paths.find((candidate) => candidate.slug === slug)
  if (!path) return <NotFound what="Path" />

  const ready = path.steps.filter((step) => step.ready)
  const total = ready.reduce((sum, step) => sum + step.questionCount, 0)
  const done = ready.reduce((sum, step) => sum + stepProgress(step, read).read, 0)
  const next = ready.find((step) => stepProgress(step, read).read < step.questionCount)
  const hours = readingHours(total)

  return (
    <PageShell crumbs={[{ label: 'Paths', to: '/paths' }]} wide>
      <title>{`${path.title} · ${SITE_NAME}`}</title>
      <h1 className="font-serif text-4xl font-medium tracking-tight">{path.title}</h1>
      <p className="mt-3 max-w-2xl font-serif text-xl leading-relaxed text-muted-foreground">{path.summary}</p>
      <p className="mt-4 text-sm text-muted-foreground">
        {ready.length === 0
          ? 'Roadmap only: nothing written for this path yet.'
          : `${ready.length} of ${path.steps.length} topics written · ${total} questions · about ${hours} ${hours === 1 ? 'hour' : 'hours'} of reading${done > 0 ? ` · ${done} read by you` : ''}`}
      </p>
      {next && (
        <Button asChild size="lg" className="mt-5">
          <Link to={stepPath(next)}>{done > 0 ? 'Continue the path' : 'Start the path'}</Link>
        </Button>
      )}

      <ol className="mt-10 border-t">
        {path.steps.map((step, index) => {
          const progress = stepProgress(step, read)
          const label = step.chapterTitle ? `${step.topicTitle}: ${step.chapterTitle}` : step.topicTitle
          return (
            <li key={`${step.topic}/${step.chapter ?? ''}`} className="border-b">
              <Link to={stepPath(step)} className="group grid grid-cols-[2rem_1fr] gap-x-4 gap-y-1 py-4 sm:grid-cols-[2rem_1fr_12rem]">
                <span className="font-mono text-sm text-muted-foreground">{index + 1}</span>
                <span>
                  <span className={cn('block text-lg font-semibold group-hover:text-link', !step.ready && 'text-muted-foreground')}>{label}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{step.why}</span>
                </span>
                <span className="col-start-2 text-sm text-muted-foreground sm:col-start-3 sm:text-right">
                  {step.ready ? (
                    <span className={cn(progress.read > 0 && 'text-link')}>
                      {progress.read > 0 ? `${progress.read} of ${progress.total} read` : `${progress.total} questions`}
                    </span>
                  ) : (
                    'Planned'
                  )}
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </PageShell>
  )
}
```

- [ ] **Step 3: Routes** — in `routes.tsx` import the three pages and add inside the pathless boundary route's `children`, before the `:topic` route: `{ path: 'paths', element: <PathsPage /> }, { path: 'paths/:slug', element: <PathPage /> }, { path: 'roadmap', element: <RoadmapPage /> },`.

- [ ] **Step 4: Header links** — in `Layout.tsx` import `NavLink` from react-router and add, after `<TopicSwitcher />`:
```tsx
        <nav aria-label="Main" className="hidden items-center gap-1 text-sm md:flex">
          {[
            { to: '/paths', label: 'Paths' },
            { to: '/roadmap', label: 'Roadmap' },
          ].map(({ to, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `rounded-md px-2.5 py-1.5 hover:text-foreground ${isActive ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
              {label}
            </NavLink>
          ))}
        </nav>
```

- [ ] **Step 5: Verify** — `npx tsc -b && npm run lint && npm test`. In Chrome (draft build): `/paths` lists five roles; `/paths/frontend` shows "2 of 12 topics written · 197 questions · about 16 hours", a "Start the path" button to `/javascript`, twelve numbered steps (ten greyed "Planned"); read one question, reload: the button says "Continue the path" and the step shows "1 of 150 read"; `/paths/infrastructure-and-devops` shows "Roadmap only" and no button; `/paths/nope` → "Path not found"; `/roadmap` shows four columns; header shows Paths and Roadmap at 1272px and hides them at 390px; the active link is bold. Screenshot.

- [ ] **Step 6: Commit**
```bash
git add app/src
git commit -m "feat(app): add path, paths and roadmap pages with header links"
```

---

### Task 6: Docs

**Files:** Modify `docs/superpowers/specs/2026-10-14-isobath-redesign-design.md`, `PLAN.md`, `README.md` (layout block if it lists `content/` children).

- [ ] **Step 1: Spec** — in §4 note: paths live in `content/paths/<role>.yaml` with optional `start`; effort = 5 minutes per question; the home "Start here" is the first path's `start`; Paths and Roadmap appear in the header; lifecycle pills wait for step 7.
- [ ] **Step 2: PLAN.md** — **Now**: step 4 done, next step 5 (practice and flashcards hubs), write its plan first. In **Layout**, add `content/paths/<role>.yaml` under `content/`. Add rule `R17 Paths: content/paths/<role>.yaml (ordered topic or topic/chapter entries, one-line why, unique order, optional start question), validated by content:check.`
- [ ] **Step 3: Remove this plan file** and commit:
```bash
git rm docs/superpowers/plans/2026-10-14-home-and-paths.md
git add PLAN.md docs README.md
git commit -m "docs: home and paths step done; remove its finished plan"
```

---

## Self-review
- **Spec §4 coverage:** role chooser ✔ T4; start here ✔ (per-path `start`); available now before roadmap ✔; roadmap rows with status and contribute link ✔; `content/paths/<role>.yaml` validated by content:check ✔ T1; path page with progress and effort ✔ T5; planned entries as roadmap steps ✔; header Paths/Roadmap ✔. Hero labelled figure with leader lines (mockup review note) ✔ T4.
- **Placeholders:** none.
- **Type consistency:** `PathStep`, `RolePath`, `StartQuestion` (T1 types) used in `resolveRolePaths` (T1), build (T2), `paths.ts` and pages (T3–5); `describePath`, `stepPath`, `stepProgress`, `readingHours`, `ringAtLevel`, `furthestPoint` signatures match between T3 and T4/T5.
