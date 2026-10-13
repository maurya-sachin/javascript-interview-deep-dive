---
name: write-question
description: Research and write one question file in content/ (planned → draft) following templates/README.md. Use for any content-writing task in this repo — a single question or a chapter batch.
---

# Write a question

The contract is `templates/README.md`. Read it once per session; don't restate it here.

## Inputs to read (and nothing else)
- `templates/README.md`
- The chapter `README.md` (scope, sub-topics, sources, question list)
- The target question file (a `planned` stub)
- Only the `tldr` of questions listed in `related` — never whole neighbouring files

## Steps
1. **Research.** Find primary sources (spec section, MDN page, TC39 proposal, engine/runtime docs) with WebSearch/WebFetch. Fetch the specific section, not whole sites. Note each URL used.
2. **Write** the sections in contract order, within the limits. Interview answer first; mechanism in `## Deep dive` (required when `core: true`).
3. **Run the code.** Save every example and exercise to the scratchpad and run it for real: `node` for JavaScript, `tsc --strict` (note the version) for TypeScript, the actual tool for configs and commands. Fix the text until output matches every `// →` comment and `**Answer:**`.
4. **Self-check** against the limits: word counts per section (`wc -w`), required sections present, no extra `##` headings. Run `npm run content:sync` then `npm run content:check` in `app/` before every commit; it must pass.
5. **Set** `status: draft`, `verified: YYYY-MM`, and `sources`.
6. **Update** the chapter README question row and status line.
7. **Commit** one question per commit: `content(<topic>/<chapter>): <slug>`.

## Batch mode (a whole chapter)
One subagent per chapter, run serially (they share README sync and `PLAN.md`). It does steps 1–7 per question top to bottom, commits after each question, stages only its own chapter's paths, and returns ≤ 5 lines with an "unverified" list. The main session verifies each hand-back (`git status`, `git log`, `content:check`, count of `status: draft`) before starting the next chapter.

## Never
- Read v1 content (`main` / tag `v1-archive`) or copy text from books/courses.
- State something engine-specific as if it were spec behaviour.
- Set `status: published` — only the maintainer does that after review.
