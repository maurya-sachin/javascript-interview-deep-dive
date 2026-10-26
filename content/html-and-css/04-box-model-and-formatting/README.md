# 04 — Box model and formatting contexts

> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

How CSS turns elements into boxes and lays them out in normal flow: the box model, display types, block and inline formatting, margin collapsing, overflow, floats, and intrinsic sizes.

## Learning goals

After this chapter you can:

- Compute an element's rendered size under both `box-sizing` values
- Say what creates a block formatting context and what that changes
- Predict when vertical margins collapse and stop it deliberately
- Explain line boxes, `line-height`, and `vertical-align`
- Use `min-content`, `max-content`, and `fit-content` on purpose

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Content, padding, border, and margin boxes; `box-sizing` → —
- `display` outer and inner types, multi-keyword syntax, `display: contents`, `flow-root` → —
- Block formatting contexts: what establishes one, float containment → —
- Margin collapsing: adjacent siblings, parent and child, empty blocks, what prevents it → —
- Inline formatting: line boxes, `line-height`, `vertical-align`, the gap under images → —
- `overflow`, scroll containers, `overflow: clip` vs `hidden` → —
- Floats and `clear` → —
- Intrinsic sizing: `min-content`, `max-content`, `fit-content`, `aspect-ratio` → —

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
<!-- generated:questions:end -->

## Sources

- [CSS Box Model Level 4](https://www.w3.org/TR/css-box-4/)
- [CSS Display Level 3](https://www.w3.org/TR/css-display-3/)
- [CSS 2.2 — Block formatting contexts](https://www.w3.org/TR/CSS2/visuren.html#block-formatting)
- [CSS 2.2 — Collapsing margins](https://www.w3.org/TR/CSS2/box.html#collapsing-margins)
- [CSS 2.2 — Line height calculations](https://www.w3.org/TR/CSS2/visudet.html#line-height)
- [CSS Overflow Level 3](https://www.w3.org/TR/css-overflow-3/)
- [CSS Box Sizing Level 3](https://www.w3.org/TR/css-sizing-3/)
