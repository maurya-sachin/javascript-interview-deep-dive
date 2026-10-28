---
title: "How do `justify-*`, `align-*`, and `place-*` work in flexbox and grid?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [box-alignment, justify-content, align-items, place-items, auto-margins, gap, flexbox, grid]
related:
  - html-and-css/flexbox-and-grid/flexbox-vs-grid
  - html-and-css/flexbox-and-grid/flex-sizing-algorithm
  - html-and-css/flexbox-and-grid/grid-track-sizing
  - html-and-css/modern-css/logical-properties
verified: 2026-10
perishable:
  - "`safe` alignment: Chrome 115, Firefox 63, Safari 17.6"
sources:
  - https://www.w3.org/TR/css-align-3/#overview
  - https://www.w3.org/TR/css-align-3/#distribution-flex
  - https://www.w3.org/TR/css-align-3/#distribution-grid
  - https://www.w3.org/TR/css-align-3/#justify-flex
  - https://www.w3.org/TR/css-align-3/#place-items-property
  - https://www.w3.org/TR/css-align-3/#overflow-values
  - https://www.w3.org/TR/css-gaps-1/#gaps
  - https://www.w3.org/TR/css-flexbox-1/#auto-margins
  - https://www.w3.org/TR/css-flexbox-1/#flex-lines
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/justify-content#browser_compatibility
tldr: >
  `justify-*` aligns along the inline axis (flexbox: the main axis), `align-*` along the block
  (cross) axis. `*-content` moves the whole set of tracks or lines, `*-items` and `*-self` move
  each item within its area. Flexbox ignores `justify-items`/`justify-self`; auto margins take
  free space before `justify-content` does. `place-*` sets align, then justify.
---

## Answer

CSS Box Alignment gives both layouts one vocabulary, built from two choices.

**Which axis.** `justify-*` works on the inline axis, `align-*` on the block axis. In flexbox, `justify-*` follows the main axis and `align-*` the cross axis, so `flex-direction: column` swaps them visually.

**What moves.**

- **`*-content`** distributes space around the alignment subjects as a group: in grid, the tracks (only visible when the tracks are smaller than the container); in flexbox, `justify-content` moves the items on each line and `align-content` moves the lines. `align-content` does nothing in a single-line (`nowrap`) flex container.
- **`*-items`** on the container sets the default `*-self` for every child.
- **`*-self`** aligns one item inside its alignment container: its grid area, or for `align-self`, its flex line.

**Flexbox has no `justify-self` or `justify-items`.** There's more than one item in the main axis, so the spec makes them not apply. Use `justify-content` for the group and auto margins for individual items.

**Auto margins go first.** In flexbox, positive free space goes to `auto` margins before `justify-content` and `align-self` run, so `margin-left: auto` pushes an item, and everything after it, to the end and leaves `justify-content` nothing to distribute. In grid, `margin: auto` centres an item in its area.

**`normal`** is the initial value. It behaves as `stretch` for flex lines and for grid `auto` tracks; for grid items it stretches non-replaced boxes without a set size and start-aligns replaced ones like images.

**`place-*`** shorthands take the align value first: `place-items: end start` is `align-items: end; justify-items: start`.

**`gap`** (`row-gap`, `column-gap`) adds space between tracks or items only, never at the edges.

**`safe`** (`justify-content: safe center`) aligns as if it were `flex-start` when the item overflows, so content isn't pushed past the start edge where it can't be scrolled to.

## Example

```html
<style>
  .flex { display: flex; width: 400px; justify-content: center; }
  .flex > div, .grid > div { width: 50px; height: 20px; }
  .grid {
    display: grid; width: 400px; height: 100px;
    grid-template-columns: 100px 100px; grid-template-rows: 40px;
    justify-content: center;
    place-items: end start;
  }
</style>
<div class="flex">
  <div style="justify-self: end"></div><div></div><div style="margin-left: auto"></div>
</div>
<div class="grid">
  <div></div><div style="justify-self: end"></div>
</div>
<script>
  for (const box of document.querySelectorAll(".flex, .grid")) {
    const { left, top } = box.getBoundingClientRect();
    const pos = [...box.children].map((el) => {
      const r = el.getBoundingClientRect();
      return `${r.left - left},${r.top - top}`;
    });
    console.log(box.className, pos.join(" "));
  }
  // → flex 0,0 50,0 350,0
  // → grid 100,20 250,20
</script>
```

Flexbox: the auto margin takes all `250px` of free space, so `center` has nothing left, and `justify-self: end` is ignored. Grid: `justify-content: center` moves the `200px` of tracks to start at `100`; `place-items: end start` puts items at the bottom-left of each area, and `justify-self: end` moves the second to the right edge of its track. Chrome 155 and Firefox 158 agreed.

## Pitfalls

- Using `justify-self` or `justify-items` on flex items. They're ignored; use `margin-left: auto` (or `margin-inline-start: auto`) or `justify-content`.
- Expecting `justify-content: center` to centre an item that also has an auto margin. Auto margins consume the free space first.
- Reading `place-items: center start` as x then y. The first value is the block axis (`align-*`).
- Expecting `align-content` to move items in a `nowrap` flex container. The single line fills the container's cross size; use `align-items` or switch to `flex-wrap: wrap`.

## Follow-ups

**Q:** What does `safe` change?
**A:** A `200px` item centred in a `100px` flex container started at `-50`, half of it beyond the start edge where scrolling can't reach. With `justify-content: safe center` it started at `0`. Supported since Chrome 115, Firefox 63 and Safari 17.6.

**Q:** In grid, what's the difference between `justify-content` and `justify-items`?
**A:** `justify-content` moves the columns inside the container, when they don't fill it. `justify-items` moves each item inside its own column area. In the example, the first moved the tracks to `100`; `justify-self: end` then moved an item to `250` within its track.

**Q:** How do you centre one grid item in its cell without touching the others?
**A:** `place-self: center`, or `margin: auto`. A `50 × 20` item with `margin: auto` in a centred `100 × 40` cell landed at `175,10` in a `400px` grid, its cell's centre.

## Exercises

### Where does the item sit?

```html
<style>
  .box { display: flex; height: 100px; align-content: center; }
  .box > div { width: 50px; height: 20px; }
</style>
<div class="box"><div></div></div>
<div class="box" style="flex-wrap: wrap"><div></div></div>
```

**Answer:** At the top (`0`) in the first box, at `40` in the second. Without wrapping the container is single-line: the line is as tall as the container and `align-content` has no effect. With `flex-wrap: wrap` it's multi-line, the line is only `20px` tall, and `align-content: center` centres it. Chrome 155 and Firefox 158 agreed.
