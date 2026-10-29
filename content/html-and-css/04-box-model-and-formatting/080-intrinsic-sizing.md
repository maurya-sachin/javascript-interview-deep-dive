---
title: "What are `min-content`, `max-content`, and `fit-content`?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [intrinsic-sizing, min-content, max-content, fit-content, stretch, aspect-ratio, overflow-wrap]
related:
  - html-and-css/box-model-and-formatting/box-model-and-box-sizing
  - html-and-css/box-model-and-formatting/floats-and-clear
  - html-and-css/flexbox-and-grid/automatic-minimum-size
  - html-and-css/flexbox-and-grid/grid-track-sizing
  - html-and-css/typography-colour-motion/text-truncation-and-wrapping
verified: 2026-10
perishable:
  - "`width: stretch` in Chrome 138, Safari 27; Firefox 158 lacks it"
  - "`fit-content()` on width unsupported in Chrome 155, Firefox 158"
sources:
  - https://www.w3.org/TR/css-sizing-3/#sizing-values
  - https://www.w3.org/TR/css-sizing-3/#intrinsic-sizes
  - https://www.w3.org/TR/css-sizing-3/#fit-content-size
  - https://www.w3.org/TR/css-sizing-3/#stretch-fit-sizing
  - https://www.w3.org/TR/css-sizing-4/#aspect-ratio
  - https://www.w3.org/TR/css-sizing-4/#aspect-ratio-minimum
  - https://www.w3.org/TR/css-text-3/#overflow-wrap-property
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/width#browser_compatibility
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/aspect-ratio#browser_compatibility
tldr: >
  They size a box from its content instead of its container. `min-content` is the narrowest the box
  can be without overflowing: its longest unbreakable piece. `max-content` is its width with no
  wrapping at all. `fit-content` is `max-content`, capped by the available space and never below
  `min-content`: shrink-to-fit, like a float.
---

## Answer

Every box has two **intrinsic sizes**, measured from its content:

- **`min-content`**: the smallest size without overflow, taking every wrap opportunity. For text that's the longest word; for a row of images, the widest image.
- **`max-content`**: the size the content wants with infinite room, taking none. For a paragraph, its whole text on one line.

The keywords let you use those sizes in `width`, `height`, `min-*`, `max-*`, `flex-basis` and grid tracks:

- **`width: min-content`**: wrap as much as possible. Useful for a figure whose caption shouldn't be wider than its image.
- **`width: max-content`**: never wrap; can overflow the container.
- **`width: fit-content`**: `min(max-content, max(min-content, available space))`. Short content shrink-wraps; long content fills the container and wraps. It's how floats, inline-blocks and absolutely positioned boxes size by default, made available to any block. `width: fit-content; margin-inline: auto` centres a shrink-wrapped block.

In the block axis, these keywords equal `auto` for ordinary blocks, because height already comes from content.

**`stretch`** is the opposite: fill the containing block, margins included, the way `width: auto` does for a block. It matters for boxes that would otherwise shrink-wrap. Chrome 138 and Safari 27 support it unprefixed; Firefox 158 only accepts `-moz-available` and `-webkit-fill-available`.

**`aspect-ratio`** sets a preferred ratio so the size in one axis follows the other: `width: 320px; aspect-ratio: 16 / 9` gives a `180px` height. It's ignored when both sizes are set. For a non-replaced box that isn't a scroll container, the automatic minimum is still `min-content`, so tall content grows the box past the ratio rather than overflowing it.

What counts as a wrap opportunity decides `min-content`. `overflow-wrap: anywhere` adds opportunities that lower it; `break-word` breaks long words only at layout time and doesn't change it.

## Example

```html
<style>
  .parent { width: 120px; }
  i { display: inline-block; width: 50px; height: 10px; }
  #min { width: min-content; }
  #max { width: max-content; }
  #fit, #fit-one { width: fit-content; }
</style>
<div class="parent">
  <div id="min"><i></i><i></i><i></i></div>
  <div id="max"><i></i><i></i><i></i></div>
  <div id="fit"><i></i><i></i><i></i></div>
  <div id="fit-one"><i></i></div>
  <div id="auto"><i></i></div>
</div>
<script>
  for (const el of document.querySelectorAll(".parent > div")) {
    console.log(el.id, el.offsetWidth);
  }
  // → min 50
  // → max 150
  // → fit 120
  // → fit-one 50
  // → auto 120
</script>
```

Three `50px` inline-blocks in a `120px` container. `max-content` overflows to `150`; `fit-content` caps at `120` but shrinks to `50` around one item, while `auto` always fills. Chrome 155 and Firefox 158 agreed.

## Pitfalls

- Expecting `width: min-content` on text to wrap long URLs. The longest unbreakable string sets it; in a `120px` container, `supercalifragilistic` made the box `193px` wide in both browsers (monospace). `overflow-wrap: anywhere` shrank it to one character, `10px`; `break-word` didn't change it.
- Writing `width: fit-content(200px)`. The function form is valid only in grid track sizing in Chrome 155 and Firefox 158; on `width` it's dropped and the box stays `auto`.
- Using `width: stretch` without a fallback. Firefox 158 ignored it and a floated box collapsed to `0px`; declare `width: -moz-available` before it.
- Forgetting that flex and grid items have their own automatic minimum, `min-width: auto`, which is based on `min-content`. That's why they refuse to shrink below their longest word.

## Follow-ups

**Q:** How does a float's width relate to these keywords?
**A:** An `auto`-width float is shrink-to-fit: `min(max(min-content, available), max-content)`, the same as `fit-content`. A float with three `50px` inline-blocks in a `120px` container was `120px` wide, matching the `fit-content` block.

**Q:** Why did an `aspect-ratio` box with too much content grow instead of overflowing?
**A:** Sizing 4 gives it an automatic minimum of `min-content` in the ratio-dependent axis. Add `overflow: auto` (a scroll container doesn't get it) or `min-height: 0` to keep the ratio and let content overflow or scroll.

**Q:** What's `min-content` in the block axis?
**A:** For a normal block, the same as `auto`: its content height. A block with a `37px` child and `height: min-content` was `37px` in both browsers. The keywords are mainly useful in the inline axis, and in grid tracks.

## Exercises

### How tall is each card?

```html
<style>
  .card { width: 320px; aspect-ratio: 16 / 9; }
  .tall { height: 300px; }
  #c { min-height: 0; overflow: auto; }
  #d { height: 100px; }
</style>
<div class="card" id="a"></div>
<div class="card" id="b"><div class="tall"></div></div>
<div class="card" id="c"><div class="tall"></div></div>
<div class="card" id="d"></div>
```

**Answer:** `#a` is `180px`: the ratio sets the height from the width. `#b` is `300px`: its automatic minimum height is `min-content`, so content wins. `#c` is `180px` and scrolls, because `overflow: auto` and `min-height: 0` remove that minimum. `#d` is `100px`: with both sizes set, the ratio is ignored. Chrome 155 and Firefox 158 agreed.
