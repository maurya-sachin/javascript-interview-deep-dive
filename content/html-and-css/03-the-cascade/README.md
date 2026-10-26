# 03 — The cascade

> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

How CSS decides which declaration applies: the cascade's sort order, specificity, layers, `!important`, inheritance, and the stages a value passes through.

## Learning goals

After this chapter you can:

- List the cascade's criteria in order and resolve a conflict with them
- Calculate specificity, including `:is()`, `:where()`, `:not()`, and `:has()`
- Organise a stylesheet with `@layer` and predict how layers override
- Explain why `!important` reverses origin and layer order
- Tell specified, computed, used, and resolved values apart

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Cascade sort order: origin and importance, context, element-attached styles, layers, specificity, scope proximity, order of appearance → —
- Specificity: the (A, B, C) triple, `:is()`/`:not()`/`:has()` vs `:where()`, inline styles → —
- `@layer`: declaring order, anonymous and nested layers, unlayered styles, `@import layer()` → —
- `!important`: reversed origin and layer order, transitions and animations in the cascade → —
- Inheritance; `inherit`, `initial`, `unset`, `revert`, `revert-layer` → —
- Value stages: declared, cascaded, specified, computed, used, actual; resolved values from `getComputedStyle()` → —

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
<!-- generated:questions:end -->

## Sources

- [CSS Cascading and Inheritance Level 5](https://www.w3.org/TR/css-cascade-5/)
- [Selectors Level 4 — Specificity](https://www.w3.org/TR/selectors-4/#specificity-rules)
