---
title: "How do grid tracks size — `fr`, `minmax()`, and `auto-fill` vs `auto-fit`?"
status: draft
difficulty: medium
frequency: 4
core: true
tags: [grid, fr, minmax, repeat, auto-fill, auto-fit, track-sizing, fit-content]
related:
  - html-and-css/flexbox-and-grid/flexbox-vs-grid
  - html-and-css/flexbox-and-grid/automatic-minimum-size
  - html-and-css/flexbox-and-grid/grid-placement
  - html-and-css/flexbox-and-grid/box-alignment
  - html-and-css/box-model-and-formatting/intrinsic-sizing
  - html-and-css/responsive-design/intrinsic-responsive-layout
verified: 2026-10
sources:
  - https://www.w3.org/TR/css-grid-2/#track-sizes
  - https://www.w3.org/TR/css-grid-2/#fr-unit
  - https://www.w3.org/TR/css-grid-2/#auto-repeat
  - https://www.w3.org/TR/css-grid-2/#resolved-track-list
  - https://www.w3.org/TR/css-grid-2/#algo-track-sizing
  - https://www.w3.org/TR/css-grid-2/#algo-init
  - https://www.w3.org/TR/css-grid-2/#algo-content
  - https://www.w3.org/TR/css-grid-2/#algo-grow-tracks
  - https://www.w3.org/TR/css-grid-2/#algo-flex-tracks
  - https://www.w3.org/TR/css-grid-2/#algo-find-fr-size
  - https://www.w3.org/TR/css-grid-2/#algo-stretch
tldr: >
  `fr` takes a share of the space left after fixed and content-sized tracks and gaps. A bare `1fr` is
  `minmax(auto, 1fr)`, so content can widen it; `minmax(0, 1fr)` can't be widened. `repeat(auto-fill, …)`
  creates as many tracks as fit; `auto-fit` then collapses the empty ones, so they differ only
  when there are fewer items than tracks.
---

## Answer

Each track has a minimum and a maximum sizing function. Three kinds:

- **Fixed**: a length or percentage.
- **Intrinsic**: `min-content`, `max-content`, `auto`, `fit-content(limit)`. Sized from the items in the track.
- **Flexible**: `fr`. A share of the **leftover space**: what remains after the other tracks and the gaps are sized. `100px 1fr 2fr` in `400px` gives `100 100 200`.

**`minmax(min, max)`** gives a range. A bare `1fr` means `minmax(auto, 1fr)`: its minimum is `auto`, which takes the items' content-based minimum. So `1fr 1fr` isn't guaranteed equal; a wide child forces its column open. `minmax(0, 1fr)` is.

**`auto`** as a whole track is `minmax(auto, auto)`: at least the content minimum, up to max-content, and when `justify-content` is `normal` or `stretch`, `auto` tracks share any space left at the end.

**`repeat(n, …)`** repeats a track list. With **`auto-fill`** instead of `n`, the browser creates as many tracks as fit in the container, gaps included, measuring each by its fixed max, or else its fixed min: `minmax(100px, 1fr)` counts as `100px`. **`auto-fit`** does the same, then collapses repeated tracks that no item occupies to `0`, gutters included, so the `fr` tracks with items absorb the space. With enough items to fill every track, the two are identical.

The **track sizing algorithm** runs per axis (columns first, then rows) in five steps: initialise each track's base size and growth limit, resolve intrinsic sizes from the items, grow tracks to their limits with free space, expand `fr` tracks, then stretch `auto` tracks.

`getComputedStyle(grid).gridTemplateColumns` returns the **used** track sizes, which makes all of this easy to inspect.

## Example

```html
<style>
  .grid { display: grid; width: 400px; }
  .wide { width: 300px; height: 10px; }
</style>
<div class="grid" style="grid-template-columns: 100px 1fr 2fr"></div>
<div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(100px, 1fr))">
  <div></div><div></div>
</div>
<div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(100px, 1fr))">
  <div></div><div></div>
</div>
<div class="grid" style="grid-template-columns: 1fr 1fr">
  <div><div class="wide"></div></div><div></div>
</div>
<div class="grid" style="grid-template-columns: minmax(0, 1fr) 1fr">
  <div><div class="wide"></div></div><div></div>
</div>
<script>
  for (const grid of document.querySelectorAll(".grid")) {
    console.log(getComputedStyle(grid).gridTemplateColumns);
  }
  // → 100px 100px 200px
  // → 100px 100px 100px 100px
  // → 200px 200px 0px 0px
  // → 300px 100px
  // → 200px 200px
</script>
```

Two items in both repeat grids: `auto-fill` keeps four `100px` tracks, `auto-fit` collapses the two empty ones and the `fr`s take the rest. A `300px` child widens a `1fr` track; `minmax(0, 1fr)` holds and the child overflows. Chrome 155 and Firefox 158 agreed.

## Pitfalls

- Using `1fr 1fr` for equal columns. A long word, `<pre>` or image widens its column; write `repeat(2, minmax(0, 1fr))`.
- Mixing percentages and `gap`. `50% 50%` with `gap: 20px` adds up to `420px` in a `400px` grid; `1fr 1fr` gave `190px` each.
- Expecting `auto-fill` and `auto-fit` to differ with a full row. With five items and four tracks, both gave four `100px` tracks.
- Treating `fit-content(150px)` as a hard cap. Its minimum is still `auto`, so a `300px` child made the track `300px` wide.

## Follow-ups

**Q:** How many tracks does `repeat(auto-fill, 150px)` make with `gap: 10px` in `400px`?
**A:** The largest count that doesn't overflow, gaps included: two (`310px`); three would need `470px`. If none fit, it's one. Without a definite size, maximum or minimum on the container, the list repeats once.

**Q:** What do `0.25fr 0.25fr` do in `400px`?
**A:** Factors summing below 1 take only that fraction: each got `100px`, leaving `200px` empty. The spec defines it so a track's share shrinks smoothly to nothing as its factor approaches `0`.

**Q:** How is `auto` different from `1fr`?
**A:** `auto` tracks start from their content and share only the remaining space: with `50px` and `100px` items in `400px`, `auto auto` gave `175 225`. `fr` tracks share the leftover space by factor from a zero base, so content only matters through the minimum.

## Deep dive

### How it works

The algorithm gives every track a **base size** (it only grows) and a **growth limit** (where it wants to stop).

1. **Initialise.** A fixed minimum becomes the base size; an intrinsic or flexible minimum starts at `0`. A fixed maximum becomes the growth limit; intrinsic and flexible maximums start at infinity. Gutters count as fixed empty tracks.
2. **Resolve intrinsic sizes.** Items spanning one track raise its base size to their minimum contribution and its growth limit to their max-content contribution, as the track's functions allow. Then items spanning 2, 3, … content-sized tracks, in that order. Items crossing an `fr` track come last and put their space only into the flexible tracks.
3. **Maximize.** If the free space is positive, it's shared equally among base sizes until each reaches its growth limit.
4. **Expand flexible tracks.** Find the size of `1fr`: leftover space (space minus the non-flexible base sizes) ÷ the sum of flex factors (floored at 1). If some `fr` track's base size is already bigger than its share, treat that track as fixed and start over.
5. **Stretch `auto` tracks** with any remaining space, when the content-distribution property is `normal` or `stretch`.

Step 4's restart in practice:

```html
<div class="grid" style="display: grid; width: 400px; grid-template-columns: 1fr 1fr 1fr">
  <div><div style="width: 300px; height: 10px"></div></div><div></div><div></div>
</div>
<script>
  console.log(getComputedStyle(document.querySelector(".grid")).gridTemplateColumns);
  // → 300px 50px 50px
</script>
```

The hypothetical `1fr` is `400 / 3 ≈ 133`, but the first track's base size is already `300` from step 2. It becomes inflexible and the restart splits the remaining `100px` across two factors. Chrome 155 and Firefox 158 agreed.

### Edge cases

- **Fractional sums.** The sum of factors is floored at 1 when finding the `fr` size, which is why `0.25fr 0.25fr` leaves space unused.
- **`fit-content(limit)`** is roughly `minmax(auto, max-content)` capped at `limit`, but the spec notes the limit doesn't clamp the automatic minimum, so wide content still opens it.
- **Tracks that overflow** the container because of fixed sizes or content minimums aren't shrunk; the algorithm has no shrink step like flexbox's, so the grid overflows its container.
- **Indefinite container sizes.** In an auto-height grid, the `fr` size is chosen so every flexible track fits its content at its ratio: `1fr 2fr` rows holding `50px` and `20px` items came out `50px 100px`. A `1fr` row only fills spare space when the container has a height or `min-height`.

### Real-world scenario

An app shell: the footer sits at the bottom, the main column never lets wide content break the layout.

```css
.shell {
  display: grid;
  min-height: 100dvh;
  grid-template-rows: auto 1fr auto;            /* header, main, footer */
  grid-template-columns: 240px minmax(0, 1fr);  /* nav, content */
}
```

With `min-height: 600px` in place of `100dvh`, a `50px` header and a `30px` footer, the rows were `50px 520px 30px`. A `600px` `<pre>` in the content column left the columns at `240px 160px` and overflowed inside its cell instead of widening the page. Both measured in Chrome 155 and Firefox 158. A gallery that changes column count without media queries combines `auto-fill` with `minmax(min(100%, 240px), 1fr)`; that's the responsive-layout topic.

### Trade-offs

- **`fr` vs `%`**: `fr` shares space after gaps, percentages ignore them. Prefer `fr` unless a track must match a fraction of the container exactly.
- **`1fr` vs `minmax(0, 1fr)`**: the first protects content from overflowing but lets one item unbalance the columns; the second keeps columns equal and needs `overflow` handling inside cells.
- **`auto-fill` vs `auto-fit`**: `auto-fill` keeps cell size consistent when there are few items (a sparse row stays aligned with full rows elsewhere); `auto-fit` stretches the few items to fill the row.

## Exercises

### What are the used track sizes?

```html
<div style="display: grid; width: 400px; grid-template-columns: 100px auto">
  <div></div><div style="width: 50px"></div>
</div>
<div style="display: grid; width: 400px; grid-template-columns: 100px auto; justify-content: start">
  <div></div><div style="width: 50px"></div>
</div>
```

**Answer:** `100px 300px`, then `100px 50px`. The `auto` track's growth limit is its `50px` max-content size, but with `justify-content: normal` the last step stretches `auto` tracks into the remaining space. `justify-content: start` turns that step off, so the track stays at its content size. Chrome 155 and Firefox 158 agreed.
