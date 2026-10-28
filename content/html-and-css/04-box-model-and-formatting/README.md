# 04 — Box model and formatting contexts

> **Status:** 🔴 planned · **Published:** 0/8 · **Last verified:** —

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

- Content, padding, border, and margin boxes; `box-sizing` → 010
- `display` outer and inner types, multi-keyword syntax, `display: contents`, `flow-root` → 020
- Block formatting contexts: what establishes one, float containment → 030
- Margin collapsing: adjacent siblings, parent and child, empty blocks, what prevents it → 040
- Inline formatting: line boxes, `line-height`, `vertical-align`, the gap under images → 050
- `overflow`, scroll containers, `overflow: clip` vs `hidden` → 060
- Floats and `clear` → 070
- Intrinsic sizing: `min-content`, `max-content`, `fit-content`, `aspect-ratio` → 080

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [Explain the CSS box model and what `box-sizing: border-box` changes.](010-box-model-and-box-sizing.md) | easy | 🟡 draft |
| 020 | [What does `display` actually set — outer and inner display types?](020-display-outer-and-inner.md) | medium | 🟡 draft |
| 030 | [What is a block formatting context, and what creates one?](030-block-formatting-context.md) | medium | 🟡 draft |
| 040 | [When do vertical margins collapse, and how do you stop it?](040-margin-collapsing.md) | medium | 🟡 draft |
| 050 | [How are inline boxes laid out — line boxes, `line-height`, and `vertical-align`?](050-line-boxes-and-vertical-align.md) | hard | 🟡 draft |
| 060 | [What does `overflow` do, and how is `overflow: clip` different from `hidden`?](060-overflow-and-scroll-containers.md) | medium | 🔴 planned |
| 070 | [How do floats and `clear` work, and where are they still the right tool?](070-floats-and-clear.md) | easy | 🔴 planned |
| 080 | [What are `min-content`, `max-content`, and `fit-content`?](080-intrinsic-sizing.md) | medium | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- [CSS Box Model Level 4](https://www.w3.org/TR/css-box-4/)
- [CSS Display Level 3](https://www.w3.org/TR/css-display-3/)
- [CSS 2.2 — Block formatting contexts](https://www.w3.org/TR/CSS2/visuren.html#block-formatting)
- [CSS 2.2 — Collapsing margins](https://www.w3.org/TR/CSS2/box.html#collapsing-margins)
- [CSS 2.2 — Line height calculations](https://www.w3.org/TR/CSS2/visudet.html#line-height)
- [CSS Overflow Level 3](https://www.w3.org/TR/css-overflow-3/)
- [CSS Box Sizing Level 3](https://www.w3.org/TR/css-sizing-3/)
