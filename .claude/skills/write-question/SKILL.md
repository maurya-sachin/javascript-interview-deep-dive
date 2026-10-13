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
3. **Run the code.** Save every example and exercise to the scratchpad and run it with `node`. Fix the text until output matches every `// →` comment and `**Answer:**`.
4. **Self-check** against the limits: word counts per section (`wc -w`), required sections present, no extra `##` headings. Use `npm run content:check` in `app/` once it exists.
5. **Set** `status: draft`, `verified: YYYY-MM`, and `sources`.
6. **Update** the chapter README question row and status line.
7. **Commit** one question per commit: `content(<topic>/<chapter>): <slug>`.

## Batch mode (a whole chapter)
Run steps 1–6 per question through a subagent, top to bottom in file order. Each subagent returns ≤ 5 lines: file, sources count, word counts, anything uncertain (marked ❓). Commit after each question.

## Never
- Read v1 content (`main` / tag `v1-archive`) or copy text from books/courses.
- State something engine-specific as if it were spec behaviour.
- Set `status: published` — only the maintainer does that after review.
