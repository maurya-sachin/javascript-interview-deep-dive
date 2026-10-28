---
title: "When do you reach for flexbox, and when for grid?"
status: draft
difficulty: easy
frequency: 5
core: true
tags: [flexbox, grid, layout, flex-wrap, one-dimensional, two-dimensional]
related:
  - html-and-css/flexbox-and-grid/flex-sizing-algorithm
  - html-and-css/flexbox-and-grid/grid-track-sizing
  - html-and-css/flexbox-and-grid/grid-placement
  - html-and-css/flexbox-and-grid/box-alignment
  - html-and-css/flexbox-and-grid/subgrid
  - html-and-css/box-model-and-formatting/display-outer-and-inner
  - html-and-css/responsive-design/intrinsic-responsive-layout
verified: 2026-10
sources:
  - https://www.w3.org/TR/css-grid-2/#intro
  - https://www.w3.org/TR/css-grid-2/#layout-algorithm
  - https://www.w3.org/TR/css-grid-2/#order-accessibility
  - https://www.w3.org/TR/css-flexbox-1/#flex-lines
  - https://www.w3.org/TR/css-flexbox-1/#layout-algorithm
  - https://www.w3.org/TR/css-flexbox-1/#auto-margins
tldr: >
  Flexbox is one-dimensional: items flow along one axis, sized from their content, and each wrapped
  line is sized on its own. Grid is two-dimensional: the container defines rows and columns that
  every item shares, so items line up both ways. Use flexbox for a row of things, grid when wrapped
  rows must line up.
---

## Answer

**Flexbox is one-dimensional.** Items flow along a main axis. Each item starts from its flex basis, usually its content size, and the container hands out the leftover or missing space. With `flex-wrap: wrap` items break into lines, but the spec lays out each line independently: flexing and `justify-content` only see the items on that line. Nothing lines the second row up with the first. Sizing works from the content out.

**Grid is two-dimensional.** The container defines column and row tracks, and each item is placed into one or more cells. A column is shared by every item in it, so items align across rows and columns, can span tracks and can overlap. Structure comes from the container: layout in. Tracks can still follow content (`auto`, `max-content`, `fit-content()`), but sized across every item in the track.

The grid spec's own summary: grid enforces two-dimensional alignment and works top-down; flexbox distributes space within one axis and works bottom-up.

How I choose:

- **A row or column of things sized by their content**: a nav bar, a toolbar, an icon next to a label, a wrapping tag list. Flexbox.
- **Things that must align in both directions**: page layout, card galleries, a form with a label column, dashboards. Grid.
- **The test question:** "When this wraps, should the second row line up with the first?" If yes, grid.

They nest freely: a grid page whose header is a flex row, or grid cards that are column flex containers inside. Both use the same Box Alignment properties (`justify-content`, `align-items`, `gap`), so the alignment vocabulary carries over.

Both also allow visual order to differ from source order (`order`, grid placement). The spec warns this doesn't change reading or tab order; keep the DOM order meaningful (an accessibility topic).

## Example

```html
<style>
  .flex { display: flex; flex-wrap: wrap; width: 330px; }
  .flex > div { flex: 1 1 100px; height: 20px; }
  .grid {
    display: grid; width: 330px;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
  .grid > div { height: 20px; }
</style>
<div class="flex"><div></div><div></div><div></div><div></div><div></div></div>
<div class="grid"><div></div><div></div><div></div><div></div><div></div></div>
<script>
  for (const box of document.querySelectorAll(".flex, .grid")) {
    const widths = [...box.children].map((el) => el.getBoundingClientRect().width);
    console.log(box.className, widths.join(" "));
  }
  // → flex 110 110 110 165 165
  // → grid 110 110 110 110 110
</script>
```

Five items, at least `100px` each, in `330px`. Flexbox's second line flexes on its own, so its two items grow to `165px`. Grid's columns are shared, so the second row keeps `110px` cells. Chrome 155 and Firefox 158 agreed.

## Pitfalls

- Building a card gallery with `flex-wrap`. The last row's items grow wider than the rest, or with fixed widths and `justify-content: space-between` they land at the far edges with a hole between. Grid keeps the columns.
- Assuming grid can't size from content. `grid-template-columns: max-content 1fr` gives a label column as wide as the widest label.
- Mixing percentage widths with `gap` in flexbox: three `33.333%` items with `gap: 15px` in `330px` need `360px`, so the third wraps. In grid, `fr` tracks share the space left after gaps.
- Rearranging with `order` or grid placement and forgetting that keyboard and screen-reader order still follow the DOM.

## Follow-ups

**Q:** Can flexbox make a two-dimensional layout?
**A:** Only by nesting rows of flex containers, and then columns line up only if you fix every item's width yourself. Each row is an independent formatting context, so a wider item in one row can't widen the matching item in another.

**Q:** How do you pin a card's button to the bottom when the cards are in a grid row?
**A:** Grid stretches every card to the row height. Make each card a column flex container and give the button `margin-top: auto`; the auto margin absorbs the card's spare height.

**Q:** What if a nested element must line up with the outer grid's tracks?
**A:** Use `subgrid`: the nested grid adopts the parent's tracks in that axis instead of defining its own.

## Deep dive

### How it works

The flex algorithm (Flexbox §9) works per item, then per line: find each item's flex base size, collect items into lines by those sizes, then resolve flexible lengths and alignment line by line. An item only ever competes with its neighbours on the same line.

The grid algorithm (Grid §12) places every item first, then runs the track sizing algorithm for columns and then rows. Every item in a column contributes to that column's size, so content in row 3 can widen a column for rows 1 and 2. That shared sizing is the two-dimensional part.

The difference is easiest to see with a label beside a field:

```html
<style>
  .row { display: flex; width: 300px; }
  .row > .field { flex: 1; }
  .form { display: grid; grid-template-columns: max-content 1fr; width: 300px; }
  .field { height: 20px; }
  i { display: block; height: 20px; }
</style>
<div class="row"><label><i style="width: 40px"></i></label><div class="field"></div></div>
<div class="row"><label><i style="width: 80px"></i></label><div class="field"></div></div>
<div class="form">
  <label><i style="width: 40px"></i></label><div class="field"></div>
  <label><i style="width: 80px"></i></label><div class="field"></div>
</div>
<script>
  for (const f of document.querySelectorAll(".field")) {
    const offset = f.getBoundingClientRect().left - f.parentElement.getBoundingClientRect().left;
    console.log(f.parentElement.className, offset, f.getBoundingClientRect().width);
  }
  // → row 40 260
  // → row 80 220
  // → form 80 220
  // → form 80 220
</script>
```

Each flex row sizes its label from its own content, so the fields start at `40` and `80`. Grid's `max-content` column is as wide as the widest label in it, so both fields start at `80`. Chrome 155 and Firefox 158 agreed.

### Edge cases

- **The last row.** A wrapping flex line has no knowledge of the line above, so with `flex-grow` its items are wider, and with `space-between` they spread to the edges (see the exercise). Grid with `repeat(auto-fill, …)` keeps empty cells instead.
- **Column flex wrapping** needs a definite or maximum height; otherwise the line is as tall as its content and never wraps.
- **One-dimensional grid** is fine: `grid-auto-flow: column` puts each item in a new column. Prefer flexbox when the items should share leftover space by content size rather than by track.

### Real-world scenario

A product listing: grid places the cards, flexbox lays out each card.

```html
<style>
  .cards { display: grid; width: 330px; gap: 15px; grid-template-columns: repeat(2, 1fr); }
  .card { display: flex; flex-direction: column; }
  .card > p { margin: 0; }
  .card > button { margin-top: auto; height: 30px; padding: 0; border: 0; }
</style>
<div class="cards">
  <article class="card"><p style="height: 40px"></p><button></button></article>
  <article class="card"><p style="height: 100px"></p><button></button></article>
</div>
<script>
  for (const button of document.querySelectorAll(".card > button")) {
    const card = button.parentElement;
    console.log(card.offsetHeight, card.offsetWidth, button.offsetTop - card.offsetTop);
  }
  // → 130 158 100
  // → 130 158 100
</script>
```

Grid stretches both cards to the row's `130px` and makes the columns `158px` each, `(330 − 15) / 2` rounded by `offsetWidth`. Inside the short card, the button's `margin-top: auto` takes the spare `60px`, so both buttons sit `100px` down. Chrome 155 and Firefox 158 agreed.

### Trade-offs

- **Flexbox** needs no up-front structure: add or remove items and the line rebalances. That suits content of unknown size and count. The cost is that alignment only holds within one line.
- **Grid** needs track definitions, but in return gives you alignment across rows, placement by line or area name, spanning and overlap without positioning. Responsive grids that change column count without breakpoints belong to the responsive-layout topic.
- **Nesting** costs alignment. A flex row inside a grid cell can't align its children to the outer grid's tracks; `subgrid` exists for that.

## Exercises

### Where does each item start?

```html
<style>
  .list {
    display: flex; flex-wrap: wrap; justify-content: space-between;
    width: 330px;
  }
  .list > div { flex: 0 0 100px; height: 20px; }
</style>
<div class="list"><div></div><div></div><div></div><div></div><div></div></div>
```

**Answer:** Left offsets `0 115 230 0 230`. The first line spreads its `30px` of spare space between three items; the second line has two items and `130px` spare, so `space-between` puts them at the two edges. Chrome 155 and Firefox 158 agreed.
