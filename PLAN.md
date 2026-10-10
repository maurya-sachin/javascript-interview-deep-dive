# PLAN

Open work and settled rules only. Keep it lean: see `CLAUDE.md` → Plan hygiene.

## Now
- Branch `v2`; tag `v1-archive` = old `main` (local, not pushed)
- Doing: Phase 1 — set commit email, then commit clean slate
- Next: Phase 2 — templates
- Open: commit email ❓ · new repo name ❓

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
Moves to `templates/README.md` in Phase 2; then replace this section with a link.

| Part | Limit |
|---|---|
| frontmatter `tldr` | ≤ 60 words — the 30-second answer |
| `## Answer` | ≤ 300 words |
| `## Example` | 1 code block, ≤ 30 lines |
| `## Pitfalls` | 1–4 bullets |
| `## Follow-ups` | 0–4 Q/A pairs, answers ≤ 50 words |
| `## Deep dive` | ≤ 1,500 words, ≤ 5 code blocks; `###` from: How it works · Edge cases · Real-world scenario · Trade-offs. Required when `core: true` |
| `## Exercises` | 1–3 items, each with `**Answer:**` |

- Frontmatter: `title`, `difficulty`, `frequency` (1–5), `core`, `tags`, `related`, `status` (planned → draft → published), `verified` (YYYY-MM), `sources`.
- Title phrased as an interviewer asks it. Current stable behaviour; legacy gets one sentence labelled *Legacy*.
- One concept per question; link `related` instead of re-explaining. No emoji headings or filler.
- Examples in JavaScript; TypeScript only in TypeScript topics.
- Done = passes `content:check` + facts match `sources` + maintainer reviewed.

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

### 1 — Clean slate
- [ ] Set repo-local `user.email` to one linked to the maintainer's GitHub account (heatmap)
- [ ] Commit the 359 staged deletions; commit plan docs
- [ ] Rename the GitHub repo (maintainer picks name; `gh repo rename`, ask first); update titles in README / CLAUDE.md

### 2 — Templates
- [ ] Root `README.md`: what this is, status, link to the v1 site meanwhile
- [ ] `templates/README.md` (content contract + how to contribute), `topic-README.md`, `chapter-README.md`, `question.md` — status line at top, `❓` for unknowns
- [ ] `.claude/skills/write-question/SKILL.md`: research → write → verify; points to `templates/`

### 3 — JavaScript structure
- [ ] Research the syllabus as of 2026-10: ECMAScript 2025 + 2026, finished TC39 proposals, MDN; coverage check per R6
- [ ] `content/javascript/`: README, chapter folders + READMEs, question stubs
- [ ] Checkpoint: maintainer approves the map
- [ ] Other tracks: top-level folder + README (scope, structure TODO)

### 4 — App (`app/`)
- [ ] Design direction + question-page mock, maintainer approves
- [ ] Scaffold per R7; ESLint
- [ ] Scripts: `content:build`, `content:check`, `content:status`, `content:new`
- [ ] Navigation topic → chapter → question, previous/next; planned questions shown as "coming soon"
- [ ] Question page: TL;DR → Answer → Deep dive → Exercises
- [ ] ⌘K search (MiniSearch), practice mode, flashcards (`ts-fsrs`), light/dark/system theme
- [ ] "Suggest a fix" (pre-filled issue form) + "Edit on GitHub" per question
- [ ] Decide v2 preview hosting while v1 stays live

### 5 — JavaScript content
- [ ] Per question, top to bottom: research → write → `content:check` → maintainer review → `published`; update README status lines
- [ ] JavaScript flashcards

### 6 — Go live
- [ ] GitHub Actions: PR → typecheck, lint, `content:check`, build; `main` → deploy
- [ ] Issue forms (new question, correction, outdated, bug) + PR template
- [ ] Merge `v2` → `main`

### 7 — Next tracks (order confirmed after Phase 5)
- [ ] TypeScript · Browser runtime (DOM, Web APIs) · Node.js runtime
- [ ] Applied: frontend (React, Next.js, HTML/CSS, accessibility, performance) · backend (Node APIs, security) · shared (testing, tooling)

## Parked (don't start without maintainer)
Supabase sync/votes · in-browser AI (WebLLM + retrieval; no paid APIs, no fine-tuning) · PWA offline · runnable challenges (Sandpack)
