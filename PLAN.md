# PLAN

Open work and settled rules only. Keep it lean: see `CLAUDE.md` → Plan hygiene.

## Now
- Branch `v2` merged to `main` by PR; tag `v1-archive` = v1; commits use repo-local email `sachinmaurya1710@gmail.com`
- Doing: JavaScript (150 q, 762 cards) and TypeScript (47 q) all `draft`, awaiting maintainer review before `published`; UI redesigned (depth gauge, tracks)
- Review flags: Node-only/spec-less claims JS ch 01–08, 10–14; 17 050 `Promise.try` spec≠Node 24; 18–22 browser/CSP/MDN not run; 23 Temporal polyfill-run; 26 V8 natives on Node 24.19 only; TS examples run on TS 7.0.2 and 5.9.3
- Open: confirm `learn.sachinmaurya.com` resolves (CNAME added, SSL issuing); other 26 topics are README-only; next topic's chapters need an order from the maintainer
- Portfolio (`../sachin`): revamp done on `revamp/portfolio-2026` (16 commits, verify + e2e green, unpushed); next: maintainer review + TODOs, PR → `develop` → `main`, then delete `develop`; Vercel: make www primary and 308 the apex to it, delete `NEXT_PUBLIC_SITE_URL`

## Goal
JavaScript in depth, as interview Q&A — language → spec/engine → runtimes (browser, Node) → ecosystem.
Not introductory. Useful for frontend, backend, and full-stack.
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
- R13 Design (approved mock: https://claude.ai/artifact/7A7y5YfbMWKjJiCFAbCVQv): Geist + Geist Mono; zinc neutrals; accent `#2F4FD8` light / `#9DAEF7` dark; TL;DR tint `#EEF1FD` / `#171C33`; code GitHub light/dark with `// →` output highlighted; 720px prose column.
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

### 5 — JavaScript content · Opus (first chapter sets the bar; try Sonnet on the next and compare)
- [ ] Per question, top to bottom: research → write → `content:check` → maintainer review → `published`; update README status lines

### 6 — Go live · Sonnet
- [ ] Merge `v2` → `main`

### 7 — Next topics (order confirmed after Phase 5)
- [ ] Per topic: chapters + stubs from its **Not yet mapped** list, then content

## Parked (don't start without maintainer)
Supabase sync/votes · in-browser AI (WebLLM + retrieval; no paid APIs, no fine-tuning) · PWA offline · runnable challenges (Sandpack)
