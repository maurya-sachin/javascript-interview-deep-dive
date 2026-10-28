---
title: "What problem does `subgrid` solve?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [grid, subgrid, nested-grid, alignment, cards]
related:
  - html-and-css/flexbox-and-grid/flexbox-vs-grid
  - html-and-css/flexbox-and-grid/grid-track-sizing
  - html-and-css/flexbox-and-grid/grid-placement
  - html-and-css/box-model-and-formatting/display-outer-and-inner
verified: 2026-10
perishable:
  - "`subgrid` in Chrome 117, Firefox 71, Safari 16"
sources:
  - https://www.w3.org/TR/css-grid-2/#subgrids
  - https://www.w3.org/TR/css-grid-2/#subgrid-items
  - https://www.w3.org/TR/css-grid-2/#valdef-grid-template-rows-subgrid
  - https://www.w3.org/TR/css-grid-2/#subgrid-span
  - https://www.w3.org/TR/css-grid-2/#subgrid-implicit
  - https://www.w3.org/TR/css-grid-2/#subgrid-gaps
  - https://www.w3.org/TR/css-grid-2/#subgrid-line-name-inheritance
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/grid-template-columns#browser_compatibility
tldr: >
  A nested grid sizes its own tracks, so content inside sibling cards can't line up. With
  `grid-template-rows: subgrid` (or columns), a grid item that is itself a grid uses the tracks it
  spans in its parent instead, and its children help size those parent tracks. Card headers,
  bodies and footers then align across the whole row.
---

## Answer

A grid only lays out its direct children. Make a grid item a grid too and it gets an **independent** grid: its tracks are sized only from its own children. Two cards in the same parent row can't know about each other, so a short header in one card and a tall header in the next leave their bodies and footers at different heights.

`subgrid` fixes that. On a grid item, `grid-template-rows: subgrid` and/or `grid-template-columns: subgrid` mean "don't define tracks in this axis; use the ones I span in my parent":

- The subgrid's explicit tracks **are** the parent tracks it covers. It has as many as its span, so a card needs `grid-row: span 3` to get three rows.
- Its children are laid out in the parent's track sizing, so the tallest header in the row sizes the header row for every card.
- Line numbers restart at `1` inside the subgrid, and the parent's line names are inherited.
- There are **no implicit tracks** in a subgridded axis: items placed beyond its tracks are clamped into them.
- Gaps are inherited by default (`gap: normal`); a subgrid may set its own.
- The other axis stays independent unless it's subgridded too (`grid-template: subgrid / subgrid`).

Without a parent grid, or when the box must be an independent formatting context (for example under `contain: layout`), `subgrid` behaves as `none`.

Before subgrid, the workarounds were fixed heights, which break on longer content, or `display: contents` on the card, which makes its children direct grid items but removes the card's own box, so its border, background and padding disappear.

Supported since Firefox 71, Safari 16 and Chrome 117.

## Example

```html
<style>
  .cards { display: grid; grid-template-columns: 100px 100px; column-gap: 10px; }
  .card { grid-row: span 3; display: grid; }
  .sub .card { grid-template-rows: subgrid; }
  .card > * { margin: 0; }
</style>
<div class="cards">
  <article class="card"><h3 style="height: 20px"></h3><p style="height: 40px"></p><footer style="height: 10px"></footer></article>
  <article class="card"><h3 style="height: 50px"></h3><p style="height: 10px"></p><footer style="height: 10px"></footer></article>
</div>
<div class="cards sub">
  <article class="card"><h3 style="height: 20px"></h3><p style="height: 40px"></p><footer style="height: 10px"></footer></article>
  <article class="card"><h3 style="height: 50px"></h3><p style="height: 10px"></p><footer style="height: 10px"></footer></article>
</div>
<script>
  for (const card of document.querySelectorAll(".card")) {
    const top = card.getBoundingClientRect().top;
    const offsets = [...card.children].map((el) => el.getBoundingClientRect().top - top);
    console.log(card.parentElement.className, offsets.join(" "));
  }
  // → cards 0 20 60
  // → cards 0 50 60
  // → cards sub 0 50 90
  // → cards sub 0 50 90
</script>
```

Without subgrid each card sizes its own rows, so bodies start at `20` and `50`. With `grid-template-rows: subgrid`, the parent's rows become `50`, `40` and `10`, the largest header, body and footer, and both cards share them. Chrome 155 and Firefox 158 agreed.

## Pitfalls

- Forgetting the span. A subgrid with `grid-row: auto` spans one parent row, gets one track, and all three children overlapped at offset `0`.
- Expecting new rows or columns to appear. An item placed at `grid-column: 4` in a two-column subgrid was clamped into its second column.
- Adding layout containment. A card with `contain: layout` stopped being a subgrid and went back to `0 20 60`.
- Forgetting that the subgrid's padding and border count. The spec adds them as extra margin on the edge items when sizing parent tracks: a card with `padding-top: 40px` and a `20px` header made the shared first row `60px`, beating the other card's `50px` header.

## Follow-ups

**Q:** How do a subgrid's gaps relate to the parent's?
**A:** By default they match: with `row-gap: 10px` on the parent, both cards' offsets became `0 60 110`. A subgrid can set its own gap; the difference is applied as extra margin on its inner items, so its gutters centre on the parent's.

**Q:** What do line numbers and names mean inside a subgrid?
**A:** Numbers start at `1` on the subgrid's first line, as in any grid. Explicit line names from the parent carry through, and named areas from the parent's `grid-template-areas` produce `-start`/`-end` names inside the subgrid.

**Q:** Why not just use `display: contents` on the card?
**A:** It removes the card's box entirely: its children become the parent's grid items, which aligns them, but the card can no longer have a border, background, padding or its own grid. Subgrid keeps the box.
