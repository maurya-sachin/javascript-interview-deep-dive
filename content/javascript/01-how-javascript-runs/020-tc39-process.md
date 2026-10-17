---
title: "How does a feature become part of JavaScript?"
status: draft
difficulty: medium
frequency: 2
core: false
tags: [tc39, proposals, stages, test262, ecmascript]
related:
  - javascript/how-javascript-runs/ecmascript-engine-host
  - javascript/how-javascript-runs/polyfill-vs-transpiler
verified: 2026-10
sources:
  - https://tc39.es/process-document/
  - https://github.com/tc39/proposals
  - https://github.com/tc39/proposals/blob/main/finished-proposals.md
  - https://github.com/tc39/test262
  - https://tc39.es/ecma262/multipage/
  - https://github.com/tc39/ecma262/blob/main/CONTRIBUTING.md
tldr: >
  A TC39 champion advances a proposal through stages: 0 idea, 1 problem and solution shape,
  2 preferred design with draft spec text, 2.7 complete spec text awaiting tests, 3 implementation
  and feedback, 4 two shipping implementations passing test262. Stage 4 proposals go into the next
  yearly edition, branched from the spec in March.
---

## Answer

New language features are proposed to **TC39**, the Ecma International committee that maintains ECMA-262. A **champion** (a committee delegate) owns each proposal and advances it by presenting it at a TC39 meeting, where the committee reaches consensus before every stage change.

| Stage | Meaning | Entry bar |
|---|---|---|
| 0 | Ideation | None; authors assign it themselves |
| 1 | Designing a solution | Champion, written problem and solution shape, public repo |
| 2 | Refining the solution | Preferred solution chosen, draft spec text (placeholders allowed) |
| 2.7 | Testing and validation | Complete spec text, reviewers and editors signed off |
| 3 | Implementation and feedback | Sufficient testing and pre-implementation experience |
| 4 | Finished | Two compatible implementations pass [test262](https://github.com/tc39/test262), real shipping experience, editor approval |

Stage 2.7 is the newer step: the design is frozen apart from changes found through testing, and tests are written. Stage 3 is where engines implement and ship, so feedback can still change or even stall a proposal.

A Stage 4 proposal is merged into the spec draft. The **yearly edition** is branched from the draft at the March TC39 meeting; from then on only editorial changes are accepted, and the Ecma General Assembly approves it in July. Anything that reaches Stage 4 later waits for the next edition.

**When is a feature safe to use?** Stage 4 means the spec is settled and two engines already pass the tests, but your users' browsers matter more than the stage. Check actual support (MDN compatibility data, `caniuse`) and your target environments. Stage 3 is for experiments or build-time tooling that you control.

## Example

```js
// Feature-detect instead of guessing from the spec year. Results shown for Node.js 24.
const features = {
  'Object.groupBy': typeof Object.groupBy === 'function',
  'Promise.try': typeof Promise.try === 'function',
  'Set.prototype.union': typeof Set.prototype.union === 'function',
  'Math.sumPrecise': typeof Math.sumPrecise === 'function',
};

console.log(features);
// → {
// →   'Object.groupBy': true,
// →   'Promise.try': true,
// →   'Set.prototype.union': true,
// →   'Math.sumPrecise': false
// → }
```

## Pitfalls

- Treating Stage 3 as "done". Stage 3 proposals can still change in response to implementation feedback, and some are withdrawn.
- Equating a spec edition with browser support. A feature in ES2025 may still be missing in an older engine, and a Stage 3 feature may already be shipping in one.
- Forgetting that Stage 4 does not mean "available in your runtime". Node.js and each browser ship on their own schedules.
- Using Stage 1 or 2 features through a transpiler plugin in production. The syntax or semantics may change and leave you with a migration.

## Follow-ups

**Q:** What is test262?
**A:** The official ECMAScript conformance test suite, maintained by TC39. Stage 4 requires passing tests in two compatible implementations, so it is the shared definition of "works as specified".

**Q:** Where do I see what is coming next?
**A:** The `tc39/proposals` repository lists active proposals by stage and the finished ones awaiting the next edition. Stage 3 includes proposals such as Source Phase Imports and Await Dictionary at the time of writing.

**Q:** Can engines ship before Stage 4?
**A:** Yes. Stage 3 means "recommended for implementation", so engines may ship then, sometimes behind a flag. Shipping experience is itself an input to reaching Stage 4.
