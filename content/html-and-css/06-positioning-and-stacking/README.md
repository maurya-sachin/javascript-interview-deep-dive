# 06 — Positioning and stacking

> **Status:** 🔴 planned · **Published:** 0/6 · **Last verified:** —

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

- `static`, `relative`, `absolute`, `fixed`, `sticky`; containing blocks; inset properties → 010
- Sticky positioning: the scrollport, sticky constraints, why it fails inside `overflow` ancestors → 020
- Stacking contexts: what creates one, painting order, `z-index` scope, `isolation` → 030
- Properties that make an element a containing block for fixed descendants: `transform`, `filter`, `contain`, `will-change` → 040
- The top layer: entering and leaving it, `::backdrop`, `overlay` → 050
- Anchor positioning: `anchor-name`, `position-anchor`, `anchor()`, `position-area`, `position-try` → 060

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [How do `position` values differ, and what is each one's containing block?](010-position-and-containing-block.md) | medium | 🟡 draft |
| 020 | [How does `position: sticky` work, and why does it sometimes not stick?](020-sticky-positioning.md) | medium | 🟡 draft |
| 030 | [What is a stacking context, and why doesn't `z-index: 9999` always win?](030-stacking-contexts.md) | hard | 🟡 draft |
| 040 | [Why does a `transform` on an ancestor break `position: fixed`?](040-transform-breaks-fixed.md) | medium | 🟡 draft |
| 050 | [What is the top layer, and how do dialogs and popovers escape `z-index` and `overflow`?](050-top-layer.md) | medium | 🔴 planned |
| 060 | [How does CSS anchor positioning work?](060-anchor-positioning.md) | hard | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- [CSS Positioned Layout Level 3](https://www.w3.org/TR/css-position-3/)
- [CSS 2.2 — Elaborate description of stacking contexts](https://www.w3.org/TR/CSS2/zindex.html)
- [CSS Transforms Level 1](https://www.w3.org/TR/css-transforms-1/)
- [CSS Anchor Positioning](https://www.w3.org/TR/css-anchor-position-1/)
