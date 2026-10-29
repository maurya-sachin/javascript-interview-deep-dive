---
title: "What does `overflow` do, and how is `overflow: clip` different from `hidden`?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [overflow, overflow-clip, scroll-container, overflow-clip-margin, scrollable-overflow]
related:
  - html-and-css/box-model-and-formatting/block-formatting-context
  - html-and-css/positioning-and-stacking/sticky-positioning
  - html-and-css/positioning-and-stacking/top-layer
  - html-and-css/typography-colour-motion/text-truncation-and-wrapping
verified: 2026-10
perishable:
  - "`overflow: clip` shipped in Chrome 90, Firefox 81, Safari 16"
  - "`overflow-clip-margin`: Chrome partial, Firefox 102, no Safari"
sources:
  - https://www.w3.org/TR/css-overflow-3/#overflow-control
  - https://www.w3.org/TR/css-overflow-3/#valdef-overflow-hidden
  - https://www.w3.org/TR/css-overflow-3/#valdef-overflow-clip
  - https://www.w3.org/TR/css-overflow-3/#scroll-container
  - https://www.w3.org/TR/css-overflow-3/#scrollable
  - https://www.w3.org/TR/css-overflow-3/#overflow-clip-margin
  - https://www.w3.org/TR/css-overflow-3/#overflow-propagation
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow#browser_compatibility
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow-clip-margin#browser_compatibility
tldr: >
  `overflow` decides what happens to content past a box's padding edge. `visible` lets it spill;
  `hidden`, `scroll` and `auto` clip it and make the box a scroll container, which can still be
  scrolled from script and creates a new formatting context. `clip` only paints the clipping: no
  scrolling of any kind, no scroll container, no BFC.
---

## Answer

Content overflows when it extends past the box's padding edge: a long word, a fixed-height card, a wide table. `overflow` (shorthand for `overflow-x` and `overflow-y`) picks the handling:

- **`visible`** (initial): overflow paints outside the box. Not a scroll container.
- **`hidden`**: clips to the padding box with no scrollbars or user scrolling, but the box is still a **scroll container**. Script can scroll it (`scrollTop`, `scrollIntoView()`), and so can focusing an element inside it.
- **`scroll`**: clips and always shows a scrolling mechanism.
- **`auto`**: like `scroll` when there's overflow, like `hidden` otherwise. Usually what you want.
- **`clip`**: clips to the overflow clip edge and forbids scrolling through *any* mechanism. It is **not** a scroll container.

Being a scroll container has side effects, and they're the point of the `hidden` vs `clip` question:

- It establishes a new block formatting context (contains floats, stops margin collapsing). `clip` doesn't.
- It becomes the scrollport for `position: sticky` descendants, so a sticky header inside an `overflow: hidden` wrapper sticks to the wrapper, not the page. With `clip` it still sticks to the viewport.
- It can be scrolled by focus and by `scrollIntoView()`, which makes `hidden` carousels jump.

So `overflow: clip` is the "just cut it off visually" value; `hidden` is "a scroller without a scrollbar".

Two mixing rules. If one axis is scrollable, `visible` in the other axis computes to `auto` and `clip` to `hidden`: `overflow-x: hidden` alone gives you `overflow-y: auto`. `overflow-x: clip` leaves `overflow-y: visible`, which is the reliable way to clip one axis only.

And `overflow` set on `<html>`, or on `<body>` when `<html>` is `visible`, goes to the viewport instead of the element.

## Example

```html
<style>
  .box { width: 100px; height: 100px; }
  .big { width: 300px; height: 300px; }
  .hidden { overflow: hidden; }
  .clip { overflow: clip; }
  .x-hidden { overflow-x: hidden; }
  .x-clip { overflow-x: clip; }
</style>
<div class="box hidden"><div class="big"></div></div>
<div class="box clip"><div class="big"></div></div>
<div class="box x-hidden"></div>
<div class="box x-clip"></div>
<script>
  const [hidden, clip, xHidden, xClip] = document.querySelectorAll(".box");
  hidden.scrollTop = 50;
  clip.scrollTop = 50;
  console.log(hidden.scrollTop, clip.scrollTop);
  console.log(getComputedStyle(xHidden).overflowY, getComputedStyle(xClip).overflowY);
  // → 50 0
  // → auto visible
</script>
```

The `hidden` box scrolled from script; the `clip` box ignored it. Clipping one axis with `hidden` silently made the other axis `auto`. Chrome 155 and Firefox 158 agreed.

## Pitfalls

- Adding `overflow-x: hidden` to stop horizontal scroll and breaking `position: sticky` inside it. The element became a scroll container; a sticky child scrolled away at `-400px` while the same child under `overflow-x: clip` stayed at `0`.
- Expecting `overflow: hidden` to stop all scrolling. Focusing the third button in a `200px` "carousel" scrolled it in both browsers; with `clip`, `scrollLeft` stayed `0`.
- Using `overflow: hidden` to clear floats and clipping focus rings and shadows as a side effect. Use `display: flow-root` for containment.
- Expecting `overflow` to clip an absolutely positioned child whose containing block is outside the box. Clipping applies only to descendants whose containing block is the box or inside it.

## Follow-ups

**Q:** What does `overflow-clip-margin` do?
**A:** It pushes the clip edge out from the box, e.g. `overflow: clip; overflow-clip-margin: 20px` lets content paint `20px` past the padding box, so shadows survive. It has no effect on `hidden`. Firefox 102 supports it; Chrome's support is partial (both axes must be `clip`).

**Q:** Does a scroll container's padding count at the end of its scrollable area?
**A:** Yes in both browsers: a `100px` box with `20px` bottom padding around a `300px` child with a `50px` bottom margin had `scrollHeight` `370`, in block, flex and inline-axis cases. Overflow 3 lets UAs include those margins.

**Q:** Does `overflow: hidden` on `<body>` clip the body?
**A:** Not while `<html>` is `visible`: the value propagates to the viewport and the body's used value becomes `visible`. Overflow 3 also notes that on the root it may not clip everything outside the initial containing block when that's smaller than the viewport, which can happen on mobile.

## Exercises

### Which track moves when the third button is focused?

```html
<style>
  .track { width: 200px; height: 50px; white-space: nowrap; }
  .track button { width: 200px; height: 50px; }
  #a { overflow: hidden; }
  #b { overflow: clip; }
</style>
<div class="track" id="a"><button>1</button><button>2</button><button id="a3">3</button></div>
<div class="track" id="b"><button>1</button><button>2</button><button id="b3">3</button></div>
<script>a3.focus(); b3.focus();</script>
```

**Answer:** Only `#a`. Focusing `#a3` scrolled `#a` (its `scrollLeft` became greater than `0`), because `hidden` is still a scroll container. `#b` is not a scroll container, so `#b3` stays clipped out of view and `scrollLeft` stays `0`: a keyboard user focuses a button they can't see. Chrome 155 and Firefox 158 agreed.
