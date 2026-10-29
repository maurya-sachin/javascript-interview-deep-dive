---
title: "How do you place items on a grid — lines, named areas, and auto-placement?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [grid, grid-placement, grid-template-areas, named-lines, auto-placement, grid-auto-flow, implicit-grid]
related:
  - html-and-css/flexbox-and-grid/flexbox-vs-grid
  - html-and-css/flexbox-and-grid/grid-track-sizing
  - html-and-css/flexbox-and-grid/subgrid
verified: 2026-10
sources:
  - https://www.w3.org/TR/css-grid-2/#line-placement
  - https://www.w3.org/TR/css-grid-2/#grid-template-areas-property
  - https://www.w3.org/TR/css-grid-2/#implicit-named-lines
  - https://www.w3.org/TR/css-grid-2/#implicit-named-areas
  - https://www.w3.org/TR/css-grid-2/#implicit-grids
  - https://www.w3.org/TR/css-grid-2/#grid-auto-flow-property
  - https://www.w3.org/TR/css-grid-2/#auto-placement-algo
  - https://www.w3.org/TR/css-grid-2/#z-order
  - https://www.w3.org/TR/css-grid-2/#order-accessibility
tldr: >
  Place an item by grid lines (`grid-column: 1 / 3`, `span 2`, negative numbers from the explicit
  grid's end), by line names, or by a named area from `grid-template-areas`. Items without a
  position are auto-placed after the explicitly placed ones, filling rows in order and creating
  implicit tracks as needed; `dense` backfills holes.
---

## Answer

Grid lines are numbered from 1 at the start edge. Negative numbers count back from the end of the **explicit** grid, so `-1` is its last line. Four properties (`grid-row-start`, `grid-column-end`, …) and the shorthands `grid-row`, `grid-column` and `grid-area` say where an item starts and ends:

- **Lines:** `grid-column: 2 / 4`, or `1 / -1` for the full explicit width.
- **Spans:** `grid-column: span 2` (start wherever auto-placement puts it), or `2 / span 2`.
- **Named lines:** `grid-template-columns: [content-start] 1fr [content-end]` lets you write `grid-column: content-start / content-end`. A `foo-start`/`foo-end` pair also creates an implicit area, so `grid-column: content` works.
- **Named areas:** `grid-template-areas` draws the layout as strings; each name must form one rectangle, and `.` marks an empty cell. Each area creates `name-start` and `name-end` lines, and `grid-area: main` places an item there.

Items placed outside the explicit grid create **implicit tracks**, sized by `grid-auto-rows` / `grid-auto-columns` (`auto` by default).

**Auto-placement** handles everything else. The algorithm first places items with a definite position, then items locked to a row, then the rest in order-modified document order. With the default `grid-auto-flow: row`, a cursor moves across each row and down, adding rows as needed; `column` fills columns instead. The default is **sparse**: the cursor never moves backwards, so items keep their order and holes can remain. **`dense`** restarts the search from the top for each item and fills holes with later, smaller items.

Visual placement never changes reading or tab order. The spec requires the DOM order to stay the logical one, so use `dense` or reordering placement only where order doesn't carry meaning (more in accessibility).

Items can overlap when placed in the same cells; later items in order-modified DOM order paint on top, and `z-index` works without `position`.

## Example

```html
<style>
  .page {
    display: grid; width: 300px;
    grid-template-columns: 100px 200px;
    grid-template-rows: 20px 50px;
    grid-template-areas:
      "head head"
      "nav  main";
    grid-auto-rows: 10px;
  }
  header { grid-area: head; }
  nav { grid-area: nav; }
  main { grid-area: main; }
  .wide { grid-column: 1 / -1; }
</style>
<div class="page">
  <header></header><footer></footer><nav></nav><main></main><aside class="wide"></aside>
</div>
<script>
  const page = document.querySelector(".page").getBoundingClientRect();
  for (const el of document.querySelectorAll(".page > *")) {
    const r = el.getBoundingClientRect();
    console.log(el.localName, r.left - page.left, r.top - page.top, r.width, r.height);
  }
  // → header 0 0 300 20
  // → footer 0 70 100 10
  // → nav 0 20 100 50
  // → main 100 20 200 50
  // → aside 0 80 300 10
</script>
```

The areas fill the explicit grid first, so the unplaced `<footer>`, though second in the DOM, lands in a new implicit `10px` row. The `<aside>` spans both columns and goes below it. Chrome 155 and Firefox 158 agreed.

## Pitfalls

- Expecting `grid-column: 1 / -1` to span implicit columns too. `-1` is the end of the explicit grid: with two explicit `100px` columns and an item forced into column 3, a `1 / -1` item was still `200px` wide.
- Drawing a non-rectangular area (`"a a" "a b"`). The whole `grid-template-areas` declaration is invalid and computes to `none`.
- Forgetting that explicitly placed items go first. An unplaced item early in the DOM can end up last on screen.
- Using `dense` on a list whose order matters, such as search results: it fills holes with later items and the visual order no longer matches the reading order.

## Follow-ups

**Q:** What's in an area's implicit line names?
**A:** For an area `main`, both its row and column start lines get the name `main-start` and both end lines `main-end`. They don't appear in `grid-template-columns`, but placement can use them: `grid-column: main-start / main-end`.

**Q:** How do you make a full-bleed row inside a centred content column?
**A:** Name the lines: `[full-start] 1fr [content-start] 200px [content-end] 1fr [full-end]`. Children get `grid-column: content`; a full-bleed child gets `grid-column: full`. In `400px` they measured `200px` at `100` and `400px` at `0`.

**Q:** What does `grid-auto-flow: column` change?
**A:** The cursor fills each column top to bottom and adds columns: three items in a two-row grid with `grid-auto-columns: 50px` landed at `(0,0)`, `(0,20)` and `(50,0)`.

## Exercises

### Where does C go?

```html
<style>
  .g { display: grid; grid-template-columns: repeat(3, 100px); grid-auto-rows: 20px; }
  .two { grid-column: span 2; }
</style>
<div class="g"><div class="two">A</div><div class="two">B</div><div>C</div></div>
<div class="g" style="grid-auto-flow: dense"><div class="two">A</div><div class="two">B</div><div>C</div></div>
```

**Answer:** In the first grid, row 2, column 3 (`200,20`). A takes columns 1–2 of row 1; B doesn't fit in the one free cell, so the cursor moves to row 2; sparse placement never goes back, so C follows B. In the dense grid, C fills the hole at row 1, column 3 (`200,0`). Chrome 155 and Firefox 158 agreed.
