# PLAN

Open work and settled rules only. Keep it lean: see `CLAUDE.md` → Plan hygiene.

## Now
- Branch `v2`; tag `v1-archive` = v1 (local, not pushed)
- Commits: repo-local email `sachinmaurya1710@gmail.com` (set)
- Doing: Phase 5 — first JavaScript chapter (maintainer picks which; first chapter sets the bar)
- Open: Phase 4 UI tested only with throwaway fixtures; in-content question links use `href="/<id>"` + click handling (middle-click wrong under a subpath host)
- Swap to v2 (R14): maintainer pushes `v2`→`main` and switches Settings → Pages → Source to GitHub Actions

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
- R12 One topic per subject: `javascript typescript browser nodejs html-and-css react nextjs accessibility web-performance web-security backend testing tooling`. A topic with no chapters keeps its planned structure in **Not yet mapped**.
- R13 Design (approved mock: https://claude.ai/artifact/7A7y5YfbMWKjJiCFAbCVQv): Geist + Geist Mono; zinc neutrals; accent `#2F4FD8` light / `#9DAEF7` dark; TL;DR tint `#EEF1FD` / `#171C33`; code GitHub light/dark with `// →` output highlighted; 720px prose column.
- R14 Hosting: GitHub Pages replaces v1, deployed by `.github/workflows/deploy.yml` (Pages source = GitHub Actions; leaves the old `gh-pages` branch untouched as v1's backup). Swap only once v2 has published content, on maintainer's go; maintainer pushes.

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
- [ ] JavaScript flashcards

### 6 — Go live · Sonnet
- [ ] GitHub Actions: PR → typecheck, lint, `content:check`, build (deploy workflow exists)
- [ ] Issue forms (new question, correction, outdated, bug) + PR template
- [ ] Merge `v2` → `main`

### 7 — Next topics (order confirmed after Phase 5)
- [ ] Per topic: chapters + stubs from its **Not yet mapped** list, then content

## Parked (don't start without maintainer)
Supabase sync/votes · in-browser AI (WebLLM + retrieval; no paid APIs, no fine-tuning) · PWA offline · runnable challenges (Sandpack)
