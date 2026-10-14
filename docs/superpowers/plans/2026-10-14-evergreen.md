# Evergreen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make freshness visible and maintainable: what each topic covers, when it was last verified, which questions are stale (verified 12+ months ago), honest lifecycle labels (Draft · Reviewed · Legacy), perishable facts a review pass can find, and a generated `/changelog`.

**Architecture:** Freshness is computed at build time from frontmatter (`verified`, `status`, new optional `legacy`, `perishable`) and topic READMEs (new optional `> **Covers:**` line), so prerendered HTML and the hydrated app agree. Pure helpers carry the date logic and git-log parsing, with tests. The changelog is generated from `git log -- content/` at build; if history is incomplete (shallow clone) the page says so and links to GitHub.

**Spec:** `docs/superpowers/specs/2026-10-14-isobath-redesign-design.md` → §7.

## Global Constraints
- R3: nothing derivable is hand-written. `Covers` is authored (it is a claim), everything else is derived.
- "Last verified" for a topic = the **oldest** `verified` among its readable questions (matches the README status-line rule in `templates/README.md`, which uses published questions).
- Stale = `verified` month is 12 or more months before the build month. Computed at build (`content:build` takes the date from `new Date()`; tests pass a fixed date).
- Lifecycle labels: `draft` → **Draft**, `published` → **Reviewed**, any written question with `legacy` → **Legacy** (shown with its reason). Planned questions keep "Coming soon".
- Never invent coverage claims: `Covers` for JavaScript and TypeScript is copied from each README's own `## Scope` → **In** line (shortened, same facts). If a README names no versions, leave `Covers` out.
- Copy rules: sentence case, no arrows, no ALL CAPS labels. Colours: reuse tokens; any new warning colour must keep 4.5:1 text contrast in both themes.
- Prerender safety (R19): no browser APIs at import or first render.
- Branch `v2`; one concern per commit; full gate including `npm run build`.

## Review Focus
- A question verified exactly 12 months before the build month is stale; 11 months is not; a malformed date never reaches the app (content:check rejects it).
- A topic with no readable questions shows no "Last verified" and no stale count.
- `legacy` and `perishable` are rejected on planned questions and validated for length.
- The changelog page works with full history, a shallow clone and no `.git` at all (build never fails because of git).
- Changelog text from commit subjects is escaped (rendered as text, never HTML).

---

### Task 1: Frontmatter and README fields, freshness helpers (tested)

**Files:** `app/scripts/lib/frontmatter.ts`, `app/scripts/lib/content.ts` (README parsing), `app/scripts/build.ts`, `app/src/content/types.ts`, `app/src/content/stats.ts`, create `app/src/content/freshness.ts`, tests `app/scripts/lib/freshness.test.ts`, update fixtures in existing tests, `templates/README.md`.

- [ ] **Frontmatter:** in `whenWritten` add `legacy: z.string().min(1).refine((text) => countWords(text) <= 30, 'must be 30 words or fewer').optional()` and `perishable: z.array(z.string().min(1).refine((text) => countWords(text) <= 12, 'must be 12 words or fewer')).optional()`. (Planned questions are `strictObject` without them, so they're rejected there.)
- [ ] **`freshness.ts`** (pure, relative imports):
```ts
// When facts were last checked, and when that counts as stale. Dates are `YYYY-MM` months.

/** Questions verified this many months ago or more are flagged for re-checking. */
export const STALE_AFTER_MONTHS = 12

function monthIndex(month: string): number {
  const [year, monthOfYear] = month.split('-').map(Number)
  return year * 12 + (monthOfYear - 1)
}

/** The build month as `YYYY-MM` (UTC). */
export function monthOf(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

export function isStale(verified: string, today: Date): boolean {
  return monthIndex(monthOf(today)) - monthIndex(verified) >= STALE_AFTER_MONTHS
}

/** The oldest of some `YYYY-MM` months, or `null` for none (string order is month order). */
export function oldestMonth(months: string[]): string | null {
  return months.length === 0 ? null : months.reduce((oldest, month) => (month < oldest ? month : oldest))
}

/** "October 2026" for display. */
export function formatMonth(month: string): string {
  const [year, monthOfYear] = month.split('-').map(Number)
  return new Date(Date.UTC(year, monthOfYear - 1, 1)).toLocaleDateString('en', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}
```
Tests: `isStale('2025-10', 2026-10-14)` true, `('2025-11', …)` false, `('2026-10', …)` false, year boundary (`'2025-12'` vs 2026-12-01 true); `oldestMonth` (empty → null; picks oldest); `monthOf`; `formatMonth('2026-10') === 'October 2026'`.
- [ ] **Types and build:** `QuestionSummary` gains `verified: string | null` (null when planned), `stale: boolean`, `legacy: string | null`. `QuestionPage` gains `stale: boolean`, `legacy: string | null`. `TopicSummary` gains `covers: string | null` (from a `> **Covers:** …` README line, parsed like `trackOf`). `TopicStats` (and so `chapterStats`) gains `lastVerified: string | null` (oldest `verified` among readable questions) and `stale: number` (readable questions that are stale) and `reviewed: number` (readable questions with status `published`). `build.ts` computes `stale` with `isStale(meta.verified, BUILD_DATE)` where `const BUILD_DATE = new Date()` once. Update test fixtures that build these types; add `chapterStats` test cases for the new fields.
- [ ] **content:check:** a `> **Covers:**` line, when present, must be non-empty and sit directly above or below `> **Track:**` (keep it simple: just non-empty). Add to the README template docs.
- [ ] **Docs:** `templates/README.md`: document `legacy`, `perishable` (frontmatter table rows) and the optional `> **Covers:**` README line (topic README section), and the stale rule.
- [ ] Gate; commit `feat(content): add legacy, perishable and covers fields with freshness helpers`.

### Task 2: Show freshness and lifecycle in the app

**Files:** `MetaRow.tsx`, `QuestionPage.tsx`, `TopicPage.tsx`, `content/javascript/README.md`, `content/typescript/README.md`.

- [ ] **Question page:** `MetaRow` receives `status`, `verified`, `stale`, `legacy`. Show a lifecycle label first: "Draft" (muted outline pill), "Reviewed" (link-coloured outline pill), or "Legacy" (amber pill, with the reason shown below the meta row as "Legacy: <reason>"). Replace `Verified 2026-10` with `Verified October 2026` (`formatMonth`); when `stale`, append "· may be out of date" in an amber text colour that meets 4.5:1 in both themes (check numerically; e.g. `text-amber-800 dark:text-amber-300`), and add `title`-free plain text (no tooltip-only info).
- [ ] **Topic page rail facts:** add `Covers <covers>` when present; `Last verified <formatMonth(stats.lastVerified)>` when present; `<stats.stale> need re-checking` when > 0; `<stats.reviewed> reviewed of <stats.readable>` replacing nothing else. Keep the existing stats.
- [ ] **Topic outline:** a question with `legacy` shows a small "Legacy" label after its title; stale questions show "may be out of date" in the same amber.
- [ ] **Covers lines:** add `> **Covers:** …` under the Track line of `content/javascript/README.md` and `content/typescript/README.md`, copied in substance from each README's `## Scope` → **In** bullet (versions and engines only, ≤ 15 words). If TypeScript's Scope names no version, do not add one and note it in the report. Run `npm run content:sync` if READMEs have generated parts that need refreshing, then `content:check`. Commit content separately: `content: declare what JavaScript and TypeScript cover`.
- [ ] Gate (`npm run build` too); commit `feat(app): show lifecycle labels, verification dates and stale warnings`.

### Task 3: content:status --stale

**Files:** `app/scripts/status.ts`.
- [ ] `npm run content:status -- --stale` lists every written question that is stale or has `perishable` notes: `id  verified  [stale]  perishable notes…`, oldest first, then a one-line count. Plain `content:status` unchanged. Document in `templates/README.md` (Question lifecycle / review section). Commit `feat(content): list stale and perishable questions in content:status`.

### Task 4: Generated changelog

**Files:** create `app/scripts/lib/changelog.ts` (+ test), modify `build.ts`, `types.ts`, `index-data.ts`, create `src/pages/ChangelogPage.tsx`, modify `routes.tsx`, `Layout.tsx` (footer link), `scripts/prerender.ts` (add `/changelog`).
- [ ] **`changelog.ts`:** `parseGitLog(output: string): ChangelogEntry[]` parsing `git log --date=short --format=%x1e%H%x1f%ad%x1f%s --name-only -- content/` (record separator `\x1e`, field separator `\x1f`, then file names one per line). `ChangelogEntry = { hash: string; date: string; subject: string; topics: string[] }`: `subject` with a leading conventional prefix (`content(scope): `, `content: `, `docs: `…) removed; `topics` = sorted unique first path segments under `content/` that are topic folders (exclude `flashcards`, `paths`; a flashcards file `content/flashcards/<topic>.yaml` counts as `<topic>`; `content/paths/*` files add no topic). Tests with a hand-written log string covering: prefix stripping, multiple files, flashcards mapping, a commit touching only README, unicode subject.
- [ ] **build.ts:** run git with `execFileSync('git', [...], { cwd: repoRoot })` (no shell). Before that, if `git rev-parse --is-shallow-repository` prints `true`, try `git fetch --unshallow --quiet` once (catch failure). Write `public/data/changelog.json`: `{ complete: boolean, entries: ChangelogEntry[] }` with the newest 300 entries; `complete` is false when the repo is still shallow, git is missing, or entries were cut at 300. Never fail the build for git problems (log a warning).
- [ ] **Page `/changelog`:** loader fetches `changelog.json`; groups entries by month (`formatMonth(date.slice(0, 7))`); each entry shows date, subject (as text), topic links. If `!complete`, a line: "Older changes are in the repository history." linking to `${REPO_URL}/commits/main/content`. Title "Changelog · isobath"; add to prerender URL list with description "What changed in the questions, and when." Footer gains a "Changelog" link.
- [ ] Gate (`npm run build`); commit `feat(app): add a changelog generated from content history`.

### Task 5: Docs
- [ ] Spec §7 "As built"; `PLAN.md` Now: redesign steps 1–7 done, next: maintainer review/publish content (Phase 5) and Phase 7 topics; rule `R20 Freshness: stale = verified 12+ months before the build month; lifecycle Draft/Reviewed/Legacy from status and legacy; Covers is authored in topic READMEs.`; delete this plan; commit `docs: evergreen step done`.
