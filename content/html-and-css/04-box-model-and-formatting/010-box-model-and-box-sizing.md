---
title: "Explain the CSS box model and what `box-sizing: border-box` changes."
status: draft
difficulty: easy
frequency: 5
core: true
tags: [box-model, box-sizing, border-box, content-box, padding, margin]
related:
  - html-and-css/box-model-and-formatting/margin-collapsing
  - html-and-css/box-model-and-formatting/display-outer-and-inner
  - html-and-css/box-model-and-formatting/intrinsic-sizing
  - html-and-css/the-cascade/value-stages
  - html-and-css/the-cascade/inheritance-and-global-keywords
  - html-and-css/flexbox-and-grid/flex-sizing-algorithm
verified: 2026-10
sources:
  - https://www.w3.org/TR/css-box-4/#box-model
  - https://www.w3.org/TR/css-box-4/#margin-physical
  - https://www.w3.org/TR/css-box-4/#padding-physical
  - https://www.w3.org/TR/css-sizing-3/#box-sizing
  - https://www.w3.org/TR/css-sizing-4/#aspect-ratio
  - https://www.w3.org/TR/CSS2/visudet.html#blockwidth
  - https://www.w3.org/TR/CSS2/visudet.html#inline-non-replaced
tldr: >
  Every box has four nested areas: content, padding, border and margin. With the default
  `box-sizing: content-box`, `width` and `height` size only the content, so padding and border are
  added on top. `border-box` makes them size the border box instead, so padding and border eat into
  the content. Margins sit outside in both cases.
---

## Answer

CSS lays out every element as a box made of four nested areas, each bounded by an edge:

- **Content**: text, child boxes, or an image. Its edge is what `width` and `height` size by default.
- **Padding**: space between content and border. It shows the background.
- **Border**: drawn around the padding. The background paints under it too, by default.
- **Margin**: transparent space outside the border, separating the box from its neighbours. It can be negative, and vertical margins between blocks can collapse.

`box-sizing` decides which edge the sizing properties measure:

- **`content-box`** (the initial value): `width: 200px` is the content. Add `20px` padding and a `5px` border and the box takes `250px`.
- **`border-box`**: `width: 200px` is the border box. Padding and border fit inside, and the content gets what's left: `150px`.

It changes the meaning of `width`, `height`, `min-*`, `max-*` and `flex-basis`, never the margin. It doesn't change `auto` widths either: a block with `width: auto` fills its container the same way under both values.

Teams set `border-box` globally because it matches how designs are specified ("this card is 300px wide") and because `width: 100%` plus padding stops overflowing the parent. Percentages are the main reason: with `content-box`, `width: 50%` and `padding: 20px` can't be combined without `calc()`.

Two details interviewers like. The content box can't go negative: with `border-box`, if padding and border exceed the `width`, the content floors at `0` and the box grows. And `getComputedStyle()` reports `width` for the box `box-sizing` names, so under `border-box` it includes the padding and border.

## Example

```html
<style>
  div { width: 200px; height: 100px; padding: 20px; border: 5px solid; margin: 10px; }
  .content { box-sizing: content-box; } /* the initial value */
  .border  { box-sizing: border-box; }
  .tiny    { box-sizing: border-box; width: 20px; height: 20px; }
</style>
<div class="content"></div>
<div class="border"></div>
<div class="tiny"></div>
<script>
  for (const el of document.querySelectorAll("div")) {
    console.log(el.className, el.offsetWidth, el.clientWidth, getComputedStyle(el).width);
  }
  // → content 250 240 200px
  // → border 200 190 200px
  // → tiny 50 40 50px
</script>
```

`offsetWidth` is the border box, `clientWidth` the padding box. The `.tiny` box asks for `20px` but needs `50px` of padding and border, so its content floors at `0` and the box grows to `50px`. Chrome 155 and Firefox 158 agreed.

## Pitfalls

- Counting the margin inside `border-box`. It sizes the border box; margins are always added outside.
- Expecting `width` and `height` to work on a `<span>`. They don't apply to inline non-replaced boxes, and vertical padding on one paints but doesn't push lines apart.
- Assuming form controls follow your page default. Chrome 155 and Firefox 158's UA styles give `<button>`, `<select>` and checkboxes `border-box`, but text `<input>` and `<textarea>` `content-box`.
- Reading `padding-top: 10%` as a share of the parent's height. Vertical padding and margin percentages resolve against the containing block's *inline* size: its width in horizontal writing.

## Follow-ups

**Q:** Why use `box-sizing: inherit` in the reset instead of setting `border-box` on `*`?
**A:** `html { box-sizing: border-box }` with `*, *::before, *::after { box-sizing: inherit }` lets a component opt its whole subtree back into `content-box` by setting it once on its root. With `*` set directly, every descendant needs its own override.

**Q:** What do `offsetWidth`, `clientWidth` and `getBoundingClientRect().width` measure?
**A:** `offsetWidth` is the border-box width, rounded to an integer. `clientWidth` is the padding box minus any scrollbar. `getBoundingClientRect()` gives fractional border-box size after transforms, so a `scale(2)` doubles it but not `offsetWidth`.

**Q:** Does `box-sizing` affect `aspect-ratio`?
**A:** Yes. With an explicit ratio, the ratio applies to the box `box-sizing` names. A `200px` wide `aspect-ratio: 2` box with `20px` padding was `200×100` under `border-box` and `240×140` under `content-box`.

## Deep dive

### How it works

For a block in normal flow, CSS 2.2 §10.3.3 sets one constraint along the inline axis: the left margin, border and padding, plus `width`, plus the right padding, border and margin, must equal the containing block's width.

`width: auto` is solved from that equation, so an auto-width block fills its container whatever `box-sizing` says. When `width` is a length or percentage, `box-sizing` only decides how it maps to the term in the equation. Under `border-box`, the content width is `specified − padding − border`, floored at `0`. Over-constrained cases (fixed width, fixed margins) are resolved by ignoring the end-side margin: `margin-right` in left-to-right text. Two `auto` margins split the remaining space, which is why `margin: 0 auto` centres a fixed-width block.

The block axis is different: `height: auto` comes from the content, not from the container, so `box-sizing` matters there only when you set a height.

### Edge cases

- **The floor at zero.** The spec floors the content size at `0`, so `border-box` can't shrink a box below its padding plus border. That's the `.tiny` case above.
- **Inline boxes.** For an inline non-replaced box, CSS 2.2 §10.6.1 says vertical padding, border and margin start at the content area and have nothing to do with `line-height`. They paint, may overlap neighbouring lines, and don't change the line box height. A `<span>` with `10px` padding and a `5px` border inside a `20px` line left the line at `20px` in both browsers.
- **What `getComputedStyle()` reports.** `width` is resolved as the used value for the box `box-sizing` names. A `content-box` block with `width: auto` reported its content width (`276px` in a `300px` parent with `24px` of horizontal padding and border), not `300px`. For an inline `<span>` where `width` doesn't apply, both browsers returned the specified `500px`.
- **Percentages.** All four padding and margin percentages resolve against the containing block's inline size. That's why `padding-top: 56.25%` made 16:9 boxes before `aspect-ratio` existed.

### Real-world scenario

Two floated columns are `width: 30%` and `width: 70%`, each with `padding: 24px`. Under `content-box` they add up to `100% + 96px`, and the main column dropped below the sidebar in both browsers. Teams used to fix it with `calc(30% - 48px)`, which breaks whenever the padding changes. Under `border-box` the percentages just add up. That's the main reason almost every reset starts with:

```css
html { box-sizing: border-box; }
*, *::before, *::after { box-sizing: inherit; }
```

### Trade-offs

`border-box` makes widths predictable from the outside, which is what layout code needs. `content-box` is still right when the content size is the contract: a `<textarea>` sized in `ch`, or a box whose padding is decorative and should grow it. Since `box-sizing` doesn't inherit by default, the `inherit` reset is a deliberate choice: it gives a third-party widget one switch to restore `content-box` for its subtree. Flex and grid often make the question moot: `flex: 1` and `fr` tracks size from the container, and `box-sizing` matters only for the parts you set explicitly.

## Exercises

### What are the widths?

```html
<style>
  .parent { width: 300px; }
  .child { width: 100%; padding: 0 10px; border: 2px solid; }
  #b { box-sizing: border-box; }
  #d { width: auto; }
</style>
<div class="parent">
  <div class="child" id="a"></div>
  <div class="child" id="b"></div>
  <div class="child" id="d"></div>
</div>
```

**Answer:** `#a` is `324px` wide (`offsetWidth`): its `300px` content plus `24px` of padding and border overflows the parent. `#b` is `300px`, with a `276px` content box. `#d` is also `300px`: an `auto` width fills the container under either `box-sizing`. Chrome 155 and Firefox 158 agreed.
