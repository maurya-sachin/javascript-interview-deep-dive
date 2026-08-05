# Repo Overhaul Design — 2026-08-05

Goal: thoroughly improve this interview-prep repo (content + docs + web app) with minimal token overhead for future AI-assisted sessions. No external indexing tools — orientation comes from an auto-loaded CLAUDE.md and a script-generated INDEX.md.

## Phases

**1. Hygiene & docs (this phase)**
- Delete `README-OLD.md`; merge `QUICK-START.md` into `GETTING-STARTED.md` (keep `ROADMAP.md` for future plans).
- `scripts/generate-index.mjs`: walks topic folders, counts files and `## Question N:` headings, emits `INDEX.md`. Re-run any time; never hand-edit INDEX.md.
- Fix README's drifted counts/tables from the generated inventory.
- Script-check relative links in all md files and `manifest.json` entries against the real tree; fix breakage.
- Add `CLAUDE.md`: compact repo map, Q&A house style, commands, conventions.

**2. Content quality audit**
- One subagent per topic folder (parallel), auditing for technical errors, outdated info (React 19 / Next 15 / modern TS & CSS era), style drift vs house format. Fix wrong > outdated > cosmetic.

**3. Fill gaps**
- Bring "expanding" topics (security, system-design, browser, networking, pwa, tooling, i18n, seo) toward parity; create `16-architecture` content. Subagents draft, main session reviews for consistency.

**4. Web app**
- Dependency updates (Vite, React, Tailwind as sensible); generate `manifest.json` from the tree at build time instead of hand-maintaining; UX features (search, filtering, progress) scoped when reached.

## Conventions
- Branch `improvements`; one commit per phase minimum; no push without owner approval.
- Every phase ends with `npm run build` green and the link checker clean.
- Q&A house style: `# Topic Title` → `## Question N: <question>` → `### Question` / `### Answer` / `### Code Example` subsections.

## Verification
Build passing, link check clean, INDEX.md counts match README claims.
