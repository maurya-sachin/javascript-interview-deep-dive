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
One Opus subagent per chapter (R21), run serially (they share README sync and `PLAN.md`). It does steps 1–7 per question top to bottom, commits after each question, stages only its own chapter's paths, and returns ≤ 5 lines with an "unverified" list. The main session verifies each hand-back (`git status`, `git log`, `content:check`, count of `status: draft`) before starting the next chapter.

Flashcards run the same loop, one subagent per group of chapters: cards come only from the written questions (every section, Deep dive included), one card per distinct fact, appended to `content/flashcards/<topic>.yaml`, one commit per chapter. Recount cards with `grep` rather than trusting the reported totals.

## Audit mode (re-checking written questions)
Opus only (R21), one subagent per 2–3 chapters, serially; the main session verifies each hand-back and spot-checks its sharpest corrections by running them or reading the source.

Per question: re-run every example in Node 24; every `// →` and `**Answer:**` matches real output exactly, with no notes inside `// →` lines (print `error.name`, not engine messages). Check every claim against a source actually fetched: ECMA-262/402 algorithm steps for language behaviour (with a `#sec-…` anchor in `sources` that really exists), TC39's finished-proposals list for stage and edition year, nodejs.org / v8.dev / HTML for host and engine behaviour, which the text must label as such ("In V8…", "Node.js 24 prints…"). MDN for compat only. Soften unconfirmable claims; when primary sources disagree, say so; add `perishable` for stale-prone facts; fix internal slips (step numbers, follow-ups contradicting the Answer). Minimal edits, word limits respected, one question per commit.

A question needing no change gets no commit (no empty commits). After a topic's audit, sync its flashcards: an Opus agent reads each changed question's diff since the audit began and fixes or deletes the cards that contradict it, one commit per chapter. Cards copy pre-audit errors.

Errors past audits caught, so look for them: stale process documents trusted over the published record, wrong proposal stages, overstated attributions, spec algorithms misread (`??`, primitive writes, `==` rules, for-in order), and source anchors that don't exist.

## Never
- Read v1 content (tag `v1-archive`) or copy text from books/courses.
- State something engine-specific as if it were spec behaviour.
- Set `status: published` — only the maintainer does that after review.
