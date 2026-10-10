# PLAN

Open work and settled rules only. Keep it lean: see `CLAUDE.md` → Plan hygiene.

## Now
- Branch `v2`; tag `v1-archive` = v1 (local, not pushed)
- Commits: repo-local email `sachinmaurya1710@gmail.com` (set)
- Doing: Phase 3 — JavaScript structure

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

### 3 — JavaScript structure · Opus
- [ ] Research the syllabus as of 2026-10: ECMAScript 2025 + 2026, finished TC39 proposals, MDN; coverage check per R6
- [ ] `content/javascript/`: README, chapter folders + READMEs, question stubs
- [ ] Checkpoint: maintainer approves the map
- [ ] Other tracks: top-level folder + README (scope, structure TODO)

### 4 — App (`app/`) · Opus for design direction, Sonnet for the rest
- [ ] Design direction + question-page mock, maintainer approves
- [ ] Scaffold per R7; ESLint
- [ ] Scripts: `content:build`, `content:check`, `content:status`, `content:new`; regenerate README `<!-- generated:… -->` blocks; document commands in `templates/README.md` → Contributing
- [ ] Navigation topic → chapter → question, previous/next; planned questions shown as "coming soon"
- [ ] Question page: TL;DR → Answer → Deep dive → Exercises
- [ ] ⌘K search (MiniSearch), practice mode, flashcards (`ts-fsrs`), light/dark/system theme
- [ ] "Suggest a fix" (pre-filled issue form) + "Edit on GitHub" per question
- [ ] Decide v2 preview hosting while v1 stays live

### 5 — JavaScript content · Opus (first chapter sets the bar; try Sonnet on the next and compare)
- [ ] Per question, top to bottom: research → write → `content:check` → maintainer review → `published`; update README status lines
- [ ] JavaScript flashcards

### 6 — Go live · Sonnet
- [ ] GitHub Actions: PR → typecheck, lint, `content:check`, build; `main` → deploy
- [ ] Issue forms (new question, correction, outdated, bug) + PR template
- [ ] Merge `v2` → `main`

### 7 — Next tracks (order confirmed after Phase 5)
- [ ] TypeScript · Browser runtime (DOM, Web APIs) · Node.js runtime
- [ ] Applied: frontend (React, Next.js, HTML/CSS, accessibility, performance) · backend (Node APIs, security) · shared (testing, tooling)

## Parked (don't start without maintainer)
Supabase sync/votes · in-browser AI (WebLLM + retrieval; no paid APIs, no fine-tuning) · PWA offline · runnable challenges (Sandpack)
