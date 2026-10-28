---
title: "Why won't a flex or grid item shrink below its content, and what does `min-width: 0` fix?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [flexbox, grid, min-width, automatic-minimum-size, overflow, text-overflow, minmax]
related:
  - html-and-css/flexbox-and-grid/flex-sizing-algorithm
  - html-and-css/flexbox-and-grid/grid-track-sizing
  - html-and-css/box-model-and-formatting/intrinsic-sizing
  - html-and-css/box-model-and-formatting/overflow-and-scroll-containers
verified: 2026-10
sources:
  - https://www.w3.org/TR/css-flexbox-1/#min-size-auto
  - https://www.w3.org/TR/css-flexbox-1/#flex-common
  - https://www.w3.org/TR/css-grid-2/#min-size-auto
  - https://www.w3.org/TR/css-grid-2/#algo-content
tldr: >
  The initial `min-width: auto` gives flex and grid items an automatic minimum: their content-based
  minimum size, roughly min-content. Flexing never goes below it, so long words or wide children
  overflow the container. `min-width: 0` (or `min-height: 0` in a column) removes it; so does
  `overflow` other than `visible`/`clip`, or `minmax(0, 1fr)` in grid.
---

## Answer

`min-width` and `min-height` start as `auto`. On ordinary blocks that means `0`, but flex and grid items get an **automatic minimum size**: their **content-based minimum size**, essentially the min-content size (the longest word, the widest image or fixed-width child).

The layout algorithms clamp items to their minimum sizes. A `flex: 1` item therefore stops shrinking at its content's min-content width and overflows the container. Symptoms: `text-overflow: ellipsis` never appears, a long URL or `<pre>` pushes a column wider, a nested scroll panel grows instead of scrolling.

**Flexbox (§4.5)** applies it in the main axis to items that aren't scroll containers. The content-based minimum is the min-content size, capped by the item's `width` (or `height`) when that is definite, and by its max size. So a `width: 100px` item can shrink to `100px` but not further.

**Grid (§6.6)** applies it only when the item spans a track whose minimum sizing function is `auto`: `auto` tracks and `1fr`, which means `minmax(auto, 1fr)`. Fixed tracks don't enforce it.

Fixes, most targeted first:

- **`min-width: 0`** on the item (`min-height: 0` in a column) opts out explicitly.
- **`overflow: hidden | auto | scroll`**: scroll containers have a zero automatic minimum, and you probably wanted the clipping or scrolling anyway. `overflow: clip` doesn't count: it isn't a scroll container.
- **`minmax(0, 1fr)`** in grid sets the track's minimum to zero, so items in it no longer force it open.

The default exists so content doesn't overlap or spill by surprise. For main content areas, the spec suggests a deliberate font-relative minimum such as `min-width: 12em` over the content-based one.

## Example

```html
<style>
  .row { display: flex; width: 200px; }
  .row > div { flex: 1; }
  .grid { display: grid; width: 200px; grid-template-columns: 1fr 1fr; }
  .wide { width: 300px; height: 10px; }
</style>
<div class="row"><div><div class="wide"></div></div><div></div></div>
<div class="row"><div style="min-width: 0"><div class="wide"></div></div><div></div></div>
<div class="row"><div style="overflow: hidden"><div class="wide"></div></div><div></div></div>
<div class="row"><div style="overflow: clip"><div class="wide"></div></div><div></div></div>
<div class="grid"><div><div class="wide"></div></div><div></div></div>
<div class="grid" style="grid-template-columns: repeat(2, minmax(0, 1fr))">
  <div><div class="wide"></div></div><div></div>
</div>
<script>
  for (const box of document.querySelectorAll(".row, .grid")) {
    const widths = [...box.children].map((el) => el.getBoundingClientRect().width);
    console.log(box.className, widths.join(" "));
  }
  // → row 300 0
  // → row 100 100
  // → row 100 100
  // → row 300 0
  // → grid 300 0
  // → grid 100 100
</script>
```

Each first item holds a `300px` child in a `200px` container. With the automatic minimum it stays `300px` wide and its sibling gets nothing. `min-width: 0`, `overflow: hidden` and `minmax(0, 1fr)` give equal halves; `overflow: clip` doesn't. Chrome 155 and Firefox 158 agreed.

## Pitfalls

- Putting `min-width: 0` on the text element instead of the flex item. It belongs on the item, and on every nested flex item between the container and the wide content: an inner item without it stayed `300px` inside an outer item fixed at `200px`.
- Reaching for `overflow: clip` to stop overflow. It clips the paint but leaves the automatic minimum, so the layout still overflows.
- Missing it in the block axis. In nested column flex containers, a `flex: 1` middle wrapper takes its content's height, so an inner `overflow: auto` list never scrolls. In a `200px` app with a `40px` header, the wrapper grew to `500px`; with `min-height: 0` it was `160px` and the list scrolled.
- Expecting an explicit `width` to let the item shrink further. In a `50px` row, a `width: 100px` item holding a `300px` child stayed `100px`: the width caps the minimum, but it's still a minimum.

## Follow-ups

**Q:** Why does `1fr` overflow while `minmax(0, 1fr)` doesn't?
**A:** `1fr` is `minmax(auto, 1fr)`. An `auto` minimum makes the track's base size its items' minimum contributions, which include their content-based minimum. `minmax(0, 1fr)` starts the track at zero and turns the automatic minimum off for items in it.

**Q:** Why are scroll containers exempt?
**A:** Their content can be scrolled into view, so the spec gives them the usual zero automatic minimum. That's why `overflow: auto` on the item doubles as a fix.

**Q:** Why won't an image in a flex row shrink?
**A:** Its content size suggestion is its natural width. A `400px`-wide SVG in a `200px` row stayed `400px`. `min-width: 0` or `max-width: 100%` (which caps the minimum) shrank it to `200px`.

## Exercises

### How wide is each item?

```html
<style>
  .row { display: flex; width: 50px; }
  .item { width: 100px; }
  .wide { width: 300px; height: 10px; }
</style>
<div class="row"><div class="item"><div class="wide"></div></div></div>
<div class="row"><div class="item" style="min-width: 0"><div class="wide"></div></div></div>
```

**Answer:** `100px`, then `50px`. Both items want to shrink to `50px`. The first one's content-based minimum is the smaller of its min-content width (`300px`) and its specified `width` (`100px`), so it stops at `100px`. With `min-width: 0` the minimum is gone and it shrinks to fit. Chrome 155 and Firefox 158 agreed.
