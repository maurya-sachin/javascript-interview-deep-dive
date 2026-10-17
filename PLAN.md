# PLAN

Open work and settled rules only. Keep it lean: see `CLAUDE.md` → Plan hygiene.

## Now
- Branch `dev` (cut from `main`; merge back with a merge commit → Vercel production); tag `v1-archive` = v1, tag `archive/improvements` = unmerged v1 audit fixes; repo-local email `sachinmaurya1710@gmail.com`
- Next: Phase 5 — maintainer reviews drafts and marks them `published`; production shows only published questions and their cards. JavaScript (150 q, 762 cards) + TypeScript (47 q, 504 cards) are `draft`.
- Review flags: JS ch 01–08, 10–14 Node-only/spec-less claims; 18–22 browser claims checked in Chrome 155 (Firefox/Safari versions are MDN data only); 26 V8 natives on Node 24.19 only; TS cards for ch 02–04 skip most Deep dive edge cases
- Designer: redraw the wordmark (draft lettering)
- Open: chapter order for the 26 README-only topics

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
- R8 Flashcards are separate: `content/flashcards/<topic>.yaml`. A production build ships a card only when its `question` is published.
- R9 npm; scripts run on Node 24 native TypeScript.
- R10 Per-question progress: README status lines + `npm run content:status` (in `app/`) — never this file.
- R11 Coverage lives in READMEs: each chapter sub-topic points to its questions or ends `→ —` (gap); topic READMEs list areas with no chapter under **Not yet mapped**. New content goes through `templates/README.md` → Adding content.
- R12 One topic per subject, grouped into tracks; each topic README has a `> **Track:**` line directly above its status line. A topic with no chapters keeps its planned structure in **Not yet mapped**.
  - Frontend: `javascript typescript html-and-css browser accessibility react nextjs react-native state-and-data-fetching`
  - Backend: `nodejs http-and-apis backend-patterns databases caching messaging-and-jobs authentication`
  - Infrastructure and delivery: `git ci-cd containers-and-kubernetes cloud-and-iac networking observability`
  - Engineering practice: `testing web-performance web-security tooling system-design data-structures-and-algorithms`
- R13 Brand: **isobath, by Sachin Maurya**, "engineering interviews, in depth". Wordmark = "isobath" with a contour ring as its "o"; the favicon is that ring (draft lettering; a human designer redraws the final); topic covers are generated from slug + data (`app/src/lib/contours.ts`); depth scale = `--depth-1..4`. Type: Geist, Geist Mono, Newsreader (SIL OFL); accent #2F4FD8 / #9DAEF7; prose column 720px. Originals only.
- R14 Hosting: Vercel, host `learn.sachinmaurya.com`, production from `main`. Project root = repo root (Vercel's Root Directory can't reach `../content`); `vercel.json` builds `app/`, sets `cleanUrls` (prerendered `<path>.html`), rewrites unknown paths to `/app-shell.html` and redirects `/portfolio` to the portfolio. v1 stays on `gh-pages` until v2 has published content.
- R15 Data: `manifest.json` + `topics/<slug>/{index,search,flashcards}.json`; a topic's shard loads on demand, never one big file.
- R16 Licence: code MIT (`LICENSE`); questions and flashcards in `content/` CC BY-NC-SA 4.0 (`content/LICENSE`).
- R17 Paths: `content/paths/<role>.yaml` (ordered `<topic>` or `<topic>/<chapter>` entries with a one-line `why`, unique `order`, optional `start` question), validated by `content:check`; format in `templates/README.md` → Paths.
- R18 Progress backup: JSON `isobath-progress` v1; import merges and never carries HTML; max 20 new flashcards per session.
- R19 Prerender: every content page ships as `dist/<path>.html` and hydrates; no module touches `window`/`document`/`localStorage` at import time; browser-only state renders neutral on the server; unknown paths fall back to `app-shell.html`.
- R20 Freshness: stale = verified 12+ months before the build month; labels Draft/Reviewed/Legacy come from `status` and `legacy`; `Covers` is authored in topic READMEs directly above Track; the changelog lists published questions only.

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
  paths/<role>.yaml
app/            scripts/ (new · sync · check · status · build · prerender) · src/ · public/data/ (generated, gitignored)
docs/superpowers/specs/   redesign design + mockups
```

## Phases

### 5 — Review and publish
- [ ] Per question: maintainer review → `published`; update README status lines

### 7 — Next topics
- [ ] Per topic: chapters + stubs from its **Not yet mapped** list, then content

## Parked (don't start without maintainer)
Supabase sync/votes · in-browser AI (WebLLM + retrieval; no paid APIs, no fine-tuning) · PWA offline · runnable challenges (Sandpack)
