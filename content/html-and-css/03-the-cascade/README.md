# 03 — The cascade

> **Status:** 🔴 planned · **Published:** 0/6 · **Last verified:** —

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

- Cascade sort order: origin and importance, context, element-attached styles, layers, specificity, scope proximity, order of appearance → 010
- Specificity: the (A, B, C) triple, `:is()`/`:not()`/`:has()` vs `:where()`, inline styles → 020
- `@layer`: declaring order, anonymous and nested layers, unlayered styles, `@import layer()` → 030
- `!important`: reversed origin and layer order, transitions and animations in the cascade → 040
- Inheritance; `inherit`, `initial`, `unset`, `revert`, `revert-layer` → 050
- Value stages: declared, cascaded, specified, computed, used, actual; resolved values from `getComputedStyle()` → 060

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [How does the cascade decide which declaration wins?](010-cascade-sort-order.md) | medium | 🟡 draft |
| 020 | [How is specificity calculated, including `:is()`, `:where()`, and `:not()`?](020-specificity.md) | medium | 🟡 draft |
| 030 | [What are cascade layers, and how do they change what overrides what?](030-cascade-layers.md) | medium | 🟡 draft |
| 040 | [What does `!important` really do, and why does it reverse origin and layer order?](040-important-reverses-order.md) | hard | 🟡 draft |
| 050 | [Which properties inherit, and what do `inherit`, `initial`, `unset`, `revert`, and `revert-layer` do?](050-inheritance-and-global-keywords.md) | medium | 🟡 draft |
| 060 | [What are specified, computed, used, and resolved values?](060-value-stages.md) | hard | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- [CSS Cascading and Inheritance Level 5](https://www.w3.org/TR/css-cascade-5/)
- [Selectors Level 4 — Specificity](https://www.w3.org/TR/selectors-4/#specificity-rules)
