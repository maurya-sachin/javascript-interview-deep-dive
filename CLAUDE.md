# Frontend-Master-Prep-Series

Interview-prep content library (~1.9M words of markdown) + a small Vite/React flashcard web app deployed to GitHub Pages.

## Orientation — read this, don't re-explore

- **`INDEX.md`** is the always-current content inventory (files + Q&A counts per topic). Regenerate with `node scripts/generate-index.mjs` after adding/removing content. Never hand-edit it.
- **19 topic folders** `01-javascript` … `19-flashcards`, numbered by subject. Content files use the scheme `<subtopic>-<NN><letter>-<name>.md` (e.g. `scope-01b-closure.md`). Each topic folder has a `README.md` index.
- `18-coding-challenges/` holds problem files (not Q&A format); `19-flashcards/` holds deck files.
- `src/` is the web app (React 18 + Vite + Tailwind, 5 pages: Home, Browse, Flashcards, Challenges, Stats). It reads content via `manifest.json` at the repo root.
- `resources/` = study plans; `docs/superpowers/specs/` = design docs for ongoing improvement work.

## Q&A house style

```
# Topic Title
## Question N: <full question>
### Question
### Answer
### Code Example
```

Difficulty markers 🟢 🟡 🔴 are used in READMEs/tables.

## Commands

- `node scripts/generate-index.mjs` — regenerate INDEX.md
- `node scripts/check-links.mjs` — verify all relative md links + manifest.json paths (must exit 0 before committing)
- `npm run build` — tsc + vite build (regression check; content changes can break the app via manifest)
- `npm run deploy` — build + gh-pages publish (only on explicit owner request)

## Conventions

- Work on branch `improvements`; never push without the owner's explicit approval.
- Commit author email: `sachinmaurya1710@gmail.com` (repo-local config, already set). Plain conventional commit messages — no AI attribution or Co-Authored-By trailers.
- Token discipline: bulk reading/auditing of content files goes to subagents; use the scripts above instead of exploring the tree.
