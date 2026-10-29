---
title: "How does flexbox size items — `flex-grow`, `flex-shrink`, and `flex-basis`?"
status: draft
difficulty: hard
frequency: 5
core: true
tags: [flexbox, flex-grow, flex-shrink, flex-basis, flex-shorthand, free-space]
related:
  - html-and-css/flexbox-and-grid/flexbox-vs-grid
  - html-and-css/flexbox-and-grid/automatic-minimum-size
  - html-and-css/flexbox-and-grid/box-alignment
  - html-and-css/box-model-and-formatting/box-model-and-box-sizing
  - html-and-css/box-model-and-formatting/intrinsic-sizing
verified: 2026-10
sources:
  - https://www.w3.org/TR/css-flexbox-1/#line-sizing
  - https://www.w3.org/TR/css-flexbox-1/#resolve-flexible-lengths
  - https://www.w3.org/TR/css-flexbox-1/#flex-property
  - https://www.w3.org/TR/css-flexbox-1/#flex-common
  - https://www.w3.org/TR/css-flexbox-1/#flex-basis-property
tldr: >
  Each item starts at its flex base size, from `flex-basis` (`auto` means its width, then its
  content). The container subtracts those sizes from its own: leftover space is shared by
  `flex-grow`; overflow is removed by `flex-shrink` × base size, so big items shrink more. Items
  hitting `min`/`max` are frozen and the rest redistributed.
---

## Answer

Flexbox sizes items on each line in three steps.

1. **Flex base size.** Taken from `flex-basis`. A length or percentage is used as is. `auto` means "use `width`" (or `height` in a column), and if that is `auto` too, `content`: roughly the max-content size. Clamping that by `min-width`/`max-width` gives the **hypothetical main size**.
2. **Free space.** The container's inner size minus the items' outer hypothetical sizes. Positive means the grow factors apply; negative means the shrink factors do.
3. **Distribute.**
   - **Growing:** each item gets free space × its `flex-grow` ÷ the sum of `flex-grow`.
   - **Shrinking:** each `flex-shrink` is first multiplied by the item's inner flex base size. With equal `flex-shrink`, a `300px` item gives up three times as much as a `100px` one, so small items don't collapse first.
   - Results are clamped by min and max sizes, including the automatic minimum `min-width: auto`. Clamped items are frozen at that size and the others share what's left again, until every item is frozen.

The `flex` shorthand sets all three:

| Value | Expands to | Behaviour |
|---|---|---|
| (initial) | `0 1 auto` | Content-sized; shrinks, never grows |
| `flex: auto` | `1 1 auto` | Starts from content and shares the extra space, so sizes differ by content |
| `flex: 1` | `1 1 0%` | Starts from zero, so all the space is shared by ratio: equal factors, equal widths |
| `flex: none` | `0 0 auto` | Rigid |

The spec says an omitted basis is `0`; Chrome 155 and Firefox 158 both compute `flex: 1` to `1 1 0%`.

Grow factors that add up to less than 1 take only that share of the free space: two items with `flex-grow: 0.25` leave half of it unused.

## Example

```html
<style>
  .row { display: flex; height: 10px; }
  i { display: block; height: 10px; }
</style>
<div class="row" style="width: 600px">
  <div style="flex: 1 1 100px"></div><div style="flex: 2 1 200px"></div>
</div>
<div class="row" style="width: 300px">
  <div style="flex: 1 1 100px"></div><div style="flex: 1 1 300px"></div>
</div>
<div class="row" style="width: 400px">
  <div style="flex: auto"><i style="width: 50px"></i></div>
  <div style="flex: auto"><i style="width: 150px"></i></div>
</div>
<div class="row" style="width: 400px">
  <div style="flex: 1"><i style="width: 50px"></i></div>
  <div style="flex: 1"><i style="width: 150px"></i></div>
</div>
<script>
  for (const row of document.querySelectorAll(".row")) {
    console.log([...row.children].map((el) => el.getBoundingClientRect().width).join(" "));
  }
  // → 200 400
  // → 75 225
  // → 150 250
  // → 200 200
</script>
```

Row 1: `300px` free, split 1 : 2. Row 2: `100px` too much; scaled factors `100` and `300` take `25` and `75`. Row 3: `200px` free on top of the content sizes, split equally. Row 4: bases are `0`, so `400` splits equally. Chrome 155 and Firefox 158 agreed.

## Pitfalls

- Expecting equal `flex-shrink` to mean equal shrinking. The overflow is shared by `flex-shrink` × base size, as in row 2.
- Using `flex: 1` for equal columns and getting unequal ones. The automatic minimum stops an item at its min-content width; add `min-width: 0`.
- Writing `flex: 1 0` and expecting a zero basis. A unitless zero after one factor is the shrink factor: it computes to `1 0 0%`, so the item no longer shrinks.
- Setting `width` and expecting it to win. A non-`auto` `flex-basis` replaces `width`: `width: 300px; flex-basis: 100px` is `100px` wide. `min-width` and `max-width` still clamp.

## Follow-ups

**Q:** Why is `flex-shrink` multiplied by the base size?
**A:** The spec's note: so negative space is shared in proportion to how much each item can shrink, and a small item doesn't reach zero before a large one has visibly shrunk. `flex-grow` is not scaled.

**Q:** What does a percentage `flex-basis` resolve against?
**A:** The flex container's inner main size. If that size is indefinite, the used basis is `content`. A `flex-basis: 50%` item in a `600px` row was `300px` wide.

**Q:** Does padding count in the shrink ratio?
**A:** No: the factor is scaled by the *inner* (content-box) base size. In a `300px` row, a `100px`-basis item with `100px` of left padding next to a `200px` item ended at `166.67px` and `133.33px` outer widths (shrinking `33.33` and `66.67`).

## Deep dive

### How it works

§9.7 "Resolving Flexible Lengths" runs once per flex line:

1. **Pick the factor.** Sum the outer hypothetical main sizes. Below the container's inner size, use `flex-grow`; otherwise `flex-shrink`.
2. **Freeze inflexible items** at their hypothetical size: any item whose factor is `0`, and, when growing, any item already clamped by its max size (base > hypothetical), or, when shrinking, any clamped by its min size.
3. **Initial free space** = container inner size − (frozen items' outer target sizes + other items' outer base sizes).
4. **Loop** while unfrozen items remain:
   - Remaining free space is computed the same way. If the unfrozen items' factors sum to less than 1, use initial free space × that sum when that is smaller in magnitude.
   - Distribute it: by `flex-grow` ratio, or by scaled `flex-shrink` ratio, starting each item from its base size.
   - Clamp each unfrozen item by its min and max sizes (and floor its content box at zero). Record whether each clamp was a min or a max violation.
   - Sum the violations (clamped − unclamped). Zero: freeze everything. Positive: freeze the min violators. Negative: freeze the max violators. Then repeat.
5. Each item's used size is its target size.

A shrink case with a min violation:

```html
<div class="row" style="display: flex; width: 300px">
  <div style="flex: 1 1 200px; min-width: 180px"></div>
  <div style="flex: 1 1 200px"></div>
</div>
<script>
  const [a, b] = document.querySelectorAll(".row > div");
  console.log(a.getBoundingClientRect().width, b.getBoundingClientRect().width);
  // → 180 120
</script>
```

Pass 1: `100px` too much, equal scaled factors, so both target `150`. A is clamped up to `180`, a positive violation, so A freezes. Pass 2: `300 − 180 − 200 = −80` goes entirely to B: `120`. Chrome 155 and Firefox 158 agreed.

### Edge cases

- **Partial fill.** With `flex-grow: 0.25` on both items of a `400px` row and basis `0`, each got `100px`; the spec intends this so that growth fades smoothly to zero as the factor approaches `0`.
- **Base size ignores min and max.** Clamping happens for the hypothetical size and after distribution, never to the base size. That's why a max-clamped item is frozen in step 2.
- **`box-sizing: border-box` with padding.** `flex-basis` then sizes the border box, so an item with basis `0` and `20px` of padding has a negative inner base size; the spec allows this and floors it later.
- **Percentage bases in an auto-height column container** fall back to `content`, because the container's height is indefinite. With `overflow: hidden` (so no automatic minimum), a `flex-basis: 50%` item with `30px` of content was `30px` tall; a `0px` basis item was `0`.

### Real-world scenario

A fixed sidebar and a fluid main area:

```css
.layout { display: flex; }
.sidebar { flex: 0 0 240px; } /* rigid */
.main { flex: 1; min-width: 0; } /* takes the rest, may shrink below its content */
```

In an `800px` container the main area was `560px` in both browsers. With a `1000px`-wide child and no `min-width: 0`, `.main` stayed `1000px` wide and the row overflowed the container; with it, `.main` kept `560px` and the child overflowed inside it, where `overflow: auto` can scroll it.

### Trade-offs

- **`flex: 1` vs `flex: auto`.** `flex: 1` ignores content when sharing space: good for equal tabs or columns. `flex: auto` keeps content proportions and only shares the extra: good for buttons whose labels differ.
- **`flex-basis` vs `width`.** Prefer `flex-basis` (through the shorthand) on items; the spec recommends the shorthand because it resets unspecified parts to useful values. Use `width` when the item may stop being a flex item.
- **Grow vs alignment.** If items shouldn't stretch, leave `flex-grow: 0` and use `justify-content` or auto margins to place the spare space instead.

## Exercises

### How wide is each item?

```html
<div style="display: flex; width: 500px">
  <div style="flex: 1"></div>
  <div style="flex: 1"></div>
  <div style="flex: 1; max-width: 100px"></div>
</div>
```

**Answer:** `200`, `200`, `100`. Pass 1 gives each `166.67`; the third is clamped down to `100`, a max violation, so it freezes. Pass 2 splits the remaining `400px` between the first two. Chrome 155 and Firefox 158 agreed.
