# PLAN

Open work and settled rules only. Keep it lean: see `CLAUDE.md` → Plan hygiene.

## Now
- Branch `v2` (merged to `main` by PR #1); tag `v1-archive` = v1; repo-local email `sachinmaurya1710@gmail.com`
- Doing: UI first, content after. Spec `docs/superpowers/specs/2026-10-14-isobath-redesign-design.md` (layouts: `specs/mockups/page-layouts.html`). Rollout step 1 (data shards) built and reviewed on `v2`; **next: step 2, brand — write its plan first** (first confirm whether step 3 needs chapter lists in the manifest); steps 3–7 get a plan each, written just before they start
- Content: JavaScript (150 q, 762 cards) + TypeScript (47 q) are `draft`, awaiting maintainer review
- Review flags: JS ch 01–08, 10–14 Node-only/spec-less claims; 17 050 `Promise.try`; 18–22 browser/CSP/MDN not run; 23 polyfill-run; 26 V8 natives on Node 24.19 only
- Open: confirm `learn.sachinmaurya.com` resolves; 26 topics are README-only (chapter order from maintainer); TypeScript flashcards not written

## Goal
Interview Q&A for any software engineer — language → spec/engine → runtimes → frontend, backend, infrastructure, practice. Not introductory.
Each question: interview answer first, then mechanism, edge cases, exercises. A topic reads in order like a book.
Non-goals: backend service, accounts, paid AI.

## Rules (settled — change only on maintainer request)
- R1 Content lives in the repo; contributions via PR. The app is client-only and reads generated JSON.
- R2 One `.md` per question: frontmatter (meta + `tldr`) + fixed `##` sections. Path = id + order: `content/<topic>/<NN-chapter>/<NNN-slug>.md`, numbered in steps of 10.
- R3 Never hand-write derivable data (id, topic, chapter, counts) — generate it.
- R4 Every topic and chapter folder has a README: scope, sub-topics, sources, question list, status line. Questions exist as `status: planned` stubs before writing.
- R5 Order: templates → structure → app → content. The JavaScript language track is finished first.
- R6 Research before writing. Primary sources (ECMAScript spec, TC39, MDN, engine blogs, official docs) go in `sources`. Coverage is checked against YDKJS / javascript.info / spec tables of contents — titles only, never copy text.
- R7 App is self-contained in `app/`: Vite, React 19, TypeScript, Tailwind 4, shadcn/ui, React Router; Markdown + Shiki compiled at build. Design direction approved before building.
- R8 Flashcards are separate: `content/flashcards/<topic>.yaml`.
- R9 npm; scripts run on Node 24 native TypeScript.
- R10 Per-question progress: README status lines + `npm run content:status` (in `app/`) — never this file.
- R11 Coverage lives in READMEs: each chapter sub-topic points to its questions or ends `→ —` (gap); topic READMEs list areas with no chapter under **Not yet mapped**. New content goes through `templates/README.md` → Adding content.
- R12 One topic per subject, grouped into tracks; each topic README has a `> **Track:**` line directly above its status line. A topic with no chapters keeps its planned structure in **Not yet mapped**.
  - Frontend: `javascript typescript html-and-css browser accessibility react nextjs react-native state-and-data-fetching`
  - Backend: `nodejs http-and-apis backend-patterns databases caching messaging-and-jobs authentication`
  - Infrastructure and delivery: `git ci-cd containers-and-kubernetes cloud-and-iac networking observability`
  - Engineering practice: `testing web-performance web-security tooling system-design data-structures-and-algorithms`
- R13 Brand: **isobath, by Sachin Maurya** — tagline "engineering interviews, in depth"; mark = nested irregular contour lines (a human designer redraws the final); calm editorial + depth-strata motif; originals only. Type: Geist, Geist Mono, Newsreader (SIL OFL); accent `#2F4FD8` / `#9DAEF7`; prose column 720px. Final spec supersedes this once approved.
- R15 Data: `manifest.json` + `topics/<slug>/{index,search,flashcards}.json`; a topic's shard loads on demand, never one big file.
- R14 Hosting (final): Vercel. Project root = repo root (Vercel's Root Directory can't reach `../content`); `vercel.json` builds `app/`. v1 stays on `gh-pages` until v2 has published content; the github.io URL keeps serving v1 until Pages is disabled or redirected. Maintainer connects the repo and pushes. Host: `learn.sachinmaurya.com`; `/portfolio` redirects to the portfolio via `vercel.json`.

## Content contract
See `templates/README.md`. Write content with the `write-question` skill.

## Layout
```
README.md · PLAN.md · CLAUDE.md · LICENSE
templates/      README (writing guide) · topic-README.md · chapter-README.md · question.md
content/
  <topic>/README.md
  <topic>/<NN-chapter>/README.md
  <topic>/<NN-chapter>/<NNN-slug>.md
  flashcards/<topic>.yaml
app/            scripts/ (new · check · status · build) · src/ · public/data/ (generated, gitignored)
```

## Phases

### 5 — Review and publish
- [ ] Per question: maintainer review → `published`; update README status lines

### 6 — Redesign (isobath)
- [ ] Spec → plan → build, in the order the spec sets

### 7 — Next topics
- [ ] Per topic: chapters + stubs from its **Not yet mapped** list, then content; plus TypeScript flashcards

## Parked (don't start without maintainer)
Supabase sync/votes · in-browser AI (WebLLM + retrieval; no paid APIs, no fine-tuning) · PWA offline · runnable challenges (Sandpack)
