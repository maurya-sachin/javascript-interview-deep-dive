# 06 — Positioning and stacking

> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

Taking boxes out of flow and painting them in the right order: positioning schemes and containing blocks, sticky positioning, stacking contexts, the top layer, and anchor positioning.

## Learning goals

After this chapter you can:

- Find the containing block of any positioned element
- Debug a `position: sticky` element that doesn't stick
- Explain what creates a stacking context and why a high `z-index` can lose
- Say how the top layer lets dialogs and popovers escape stacking and clipping
- Position an element relative to another with anchor positioning

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- `static`, `relative`, `absolute`, `fixed`, `sticky`; containing blocks; inset properties → —
- Sticky positioning: the scrollport, sticky constraints, why it fails inside `overflow` ancestors → —
- Stacking contexts: what creates one, painting order, `z-index` scope, `isolation` → —
- Properties that make an element a containing block for fixed descendants: `transform`, `filter`, `contain`, `will-change` → —
- The top layer: entering and leaving it, `::backdrop`, `overlay` → —
- Anchor positioning: `anchor-name`, `position-anchor`, `anchor()`, `position-area`, `position-try` → —

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
<!-- generated:questions:end -->

## Sources

- [CSS Positioned Layout Level 3](https://www.w3.org/TR/css-position-3/)
- [CSS 2.2 — Elaborate description of stacking contexts](https://www.w3.org/TR/CSS2/zindex.html)
- [CSS Transforms Level 1](https://www.w3.org/TR/css-transforms-1/)
- [CSS Anchor Positioning](https://www.w3.org/TR/css-anchor-position-1/)
