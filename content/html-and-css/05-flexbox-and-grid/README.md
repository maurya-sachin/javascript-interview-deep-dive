# 05 — Flexbox and grid

> **Status:** 🔴 planned · **Published:** 0/7 · **Last verified:** —

The two layout modes most interviews probe: how flexbox distributes space along a line, how grid sizes tracks and places items, and the alignment model they share.

## Learning goals

After this chapter you can:

- Choose flexbox or grid for a layout and defend the choice
- Work out flex item sizes from `flex-grow`, `flex-shrink`, and `flex-basis`
- Fix a flex or grid item that won't shrink below its content
- Size grid tracks with `fr`, `minmax()`, and `repeat()`
- Align items and content on both axes in either layout

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- One-dimensional vs two-dimensional layout; content-out vs layout-in → 010
- The flex sizing algorithm: `flex-basis`, free space, `flex-grow`, scaled `flex-shrink`, the `flex` shorthand → 020
- Automatic minimum size (`min-width: auto`) in flex and grid items → 030
- Box alignment: `justify-*`, `align-*`, `place-*`, `gap`, auto margins → 040
- Grid track sizing: `fr`, `minmax()`, `repeat()`, `auto-fill` vs `auto-fit` → 050
- Grid placement: line numbers, named lines and areas, auto-placement, `dense` → 060
- `subgrid` → 070

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [When do you reach for flexbox, and when for grid?](010-flexbox-vs-grid.md) | easy | 🟡 draft |
| 020 | [How does flexbox size items — `flex-grow`, `flex-shrink`, and `flex-basis`?](020-flex-sizing-algorithm.md) | hard | 🟡 draft |
| 030 | [Why won't a flex or grid item shrink below its content, and what does `min-width: 0` fix?](030-automatic-minimum-size.md) | medium | 🟡 draft |
| 040 | [How do `justify-*`, `align-*`, and `place-*` work in flexbox and grid?](040-box-alignment.md) | medium | 🟡 draft |
| 050 | [How do grid tracks size — `fr`, `minmax()`, and `auto-fill` vs `auto-fit`?](050-grid-track-sizing.md) | medium | 🟡 draft |
| 060 | [How do you place items on a grid — lines, named areas, and auto-placement?](060-grid-placement.md) | medium | 🟡 draft |
| 070 | [What problem does `subgrid` solve?](070-subgrid.md) | medium | 🟡 draft |
<!-- generated:questions:end -->

## Sources

- [CSS Flexible Box Layout Level 1](https://www.w3.org/TR/css-flexbox-1/)
- [CSS Grid Layout Level 2](https://www.w3.org/TR/css-grid-2/)
- [CSS Box Alignment Level 3](https://www.w3.org/TR/css-align-3/)
