# isobath (Deep Dive)

Interview questions for any software engineer, from language to spec/engine to infrastructure — not introductory.
One Markdown file per question in `content/`; the client-only app in `app/` reads generated JSON.

## Every session
1. Read `PLAN.md` → **Now**. Its rules are settled.
2. Work one phase task or one chapter. Design work follows `docs/superpowers/specs/` once approved; no product code before that.
3. Before ending, apply Plan hygiene.

## Plan hygiene (tracker)
- `PLAN.md` holds only open work and rules that still guide work.
- Task finished → delete its line (git history keeps it). Phase finished → delete its section.
- Rule no longer guiding anything → delete it. New settled decision → add one short rule line.
- Rewrite **Now** (branch, doing, next, open questions) in ≤ 5 lines.
- No narration, session logs, rationale paragraphs, or dates a task doesn't need.
- Per-question progress lives in README status lines and `content:status`, never in `PLAN.md`.
- Same applies to `.claude/notes/style.md`: remove anything outdated.

## Token rules
- Never bulk-read `content/`, `app/public/data/`, or `app/dist/`. Find through READMEs, script output, or a title grep; open one file.
- v1 lives only on tag `v1-archive` (built site on `gh-pages`) — never read it or reuse its text.
- Batch writing through one subagent per chapter, run serially; it returns ≤ 5 lines. Verify each hand-back (`git status`, `git log`, `content:check`) before the next.
- Validate with `content:check` (in `app/`); don't re-read files you just wrote.

## Working rules
- Branch `v2`. Commit after every finished task — small, one concern (deletion, docs, dependency, feature, one question or chapter). Conventional messages (`feat:`, `docs:`, `content:`, `chore:`). No big catch-all commits.
- GitHub's heatmap only counts commits on `main`: merge `v2` by PR with a merge commit — never squash. v1 is served from `gh-pages`, unaffected.
- Push, deploy, DNS and `published` need the maintainer's OK (an explicit instruction counts).
- Content follows `templates/README.md`; write it with the `write-question` skill.
