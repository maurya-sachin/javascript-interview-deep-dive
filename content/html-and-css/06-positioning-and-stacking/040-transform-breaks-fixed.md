---
title: "Why does a `transform` on an ancestor break `position: fixed`?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [position, fixed, transform, filter, containment, containing-block]
related:
  - html-and-css/positioning-and-stacking/position-and-containing-block
  - html-and-css/positioning-and-stacking/stacking-contexts
  - html-and-css/positioning-and-stacking/top-layer
verified: 2026-10
sources:
  - https://www.w3.org/TR/css-position-3/#def-cb
  - https://www.w3.org/TR/css-transforms-1/#containing-block-for-all-descendants
  - https://www.w3.org/TR/css-transforms-2/#individual-transforms
  - https://www.w3.org/TR/css-transforms-2/#perspective-property
  - https://www.w3.org/TR/filter-effects-1/#FilterProperty
  - https://drafts.csswg.org/filter-effects-2/#BackdropFilterProperty
  - https://www.w3.org/TR/css-contain-2/#containment-layout
  - https://www.w3.org/TR/css-contain-2/#containment-paint
  - https://www.w3.org/TR/css-contain-2/#content-visibility
  - https://www.w3.org/TR/css-will-change-1/#will-change
  - https://www.w3.org/TR/css-conditional-5/#container-type
  - https://drafts.csswg.org/css-position-4/#top-styling
tldr: >
  Any `transform` other than `none` makes the element the containing block for all its
  descendants, fixed ones included. A `position: fixed` child is then placed against that
  element's padding box and scrolls with it instead of the viewport. `filter`,
  `backdrop-filter`, `perspective`, `contain: layout`/`paint` and matching `will-change`
  do the same.
---

## Answer

A `position: fixed` box normally uses the viewport as its containing block. CSS Positioned Layout lets an ancestor take that role by establishing a **fixed positioning containing block**, and CSS Transforms says any `transform` other than `none` does exactly that: the element becomes the containing block for *all* descendants, absolute and fixed alike, using its padding box.

So the "fixed" header is now positioned against the transformed ancestor. It scrolls with that ancestor, `width: 100%` means the ancestor's width, and since a transform also creates a stacking context, its `z-index` is trapped there and its ancestors' `overflow` can clip it.

The same happens with:

- `translate`, `rotate`, `scale` (any value but `none`, even `translate: 0`), `perspective`, `transform-style: preserve-3d`
- `filter` and `backdrop-filter` other than `none`, except on the root element
- `contain: layout`, `paint`, `strict` or `content`, and `content-visibility: auto`, which turns on layout and paint containment
- `will-change` naming any property above, even before it changes

Not on the list: `opacity`, `isolation`, `mix-blend-mode`, `clip-path`, `overflow`, `z-index`, and `container-type` (it applies size and style containment, not layout).

The spec states the rule without a rationale, but one way to see it: a transform maps its whole subtree into a new local coordinate system. A descendant drawn in that system can't also stay pinned to the untransformed viewport, so the transformed element becomes its reference.

Fixes: move the fixed element out of the transformed subtree (a portal to `<body>`), remove the transform once an animation finishes (`transform: none` releases it), or render it in the top layer as a popover or modal dialog, whose containing block is the viewport regardless of ancestors.

## Example

```html
<style>
  body { margin: 0; }
  .app { margin-top: 100px; width: 600px; height: 2000px; }
  .animated { transform: translateY(0); }
  .bar { position: fixed; top: 0; left: 0; width: 100%; height: 20px; }
</style>
<div class="bar" id="outside"></div>
<div class="app animated">
  <div class="bar" id="inside"></div>
</div>
<script>
  scrollTo(0, 500);
  for (const bar of document.querySelectorAll(".bar")) {
    const { top, width } = bar.getBoundingClientRect();
    console.log(bar.id, top, width);
  }
  // → outside 0 800
  // → inside -400 600
</script>
```

Chrome 156 and Firefox 158 with an 800px-wide viewport. The bar inside the identity transform sits at the top of `.app` (page y 100, scrolled 500) and takes `.app`'s 600px width as its `100%`.

## Pitfalls

- Leaving an animation's end state on the element. `transform: translateY(0)` from an entrance animation looks like a no-op but still captures fixed descendants; `transform: none` doesn't.
- Adding `will-change: transform` to a page wrapper "for performance". It captures every fixed descendant in the app.
- Applying `filter` to a wrapper for dark mode or a blur effect. On `<html>` itself it didn't capture (the spec exempts the root); on any other element it did.
- Assuming `transform` on `<html>` is exempt too. It isn't: a fixed box under a transformed root scrolled away (`-500` after scrolling 500px).

## Follow-ups

**Q:** Does a popover or modal `<dialog>` inside a transformed ancestor have the same problem?
**A:** No. Top-layer elements are rendered as siblings of the root, and a fixed one's containing block is the viewport. A `popover="manual"` inside a transformed, `overflow: hidden` wrapper stayed at `0` after scrolling; a plain fixed sibling went to `-400`.

**Q:** Does this affect anything besides fixed boxes?
**A:** Yes. The transformed element is also the containing block for absolute descendants (before any outer positioned ancestor), and the spec includes `background-attachment: fixed` backgrounds inside it.

**Q:** Why does `perspective` do it when it doesn't move anything?
**A:** The Transforms 2 spec defines it that way and notes in an issue that it probably doesn't need to, but web compatibility may prevent changing it.

## Exercises

### Which fixed boxes stay at the top of the viewport?

```html
<style>
  body { margin: 0; }
  .wrap { margin: 100px 0; height: 50px; }
  .fixed { position: fixed; top: 0; }
</style>
<div class="wrap" style="opacity: 0.5"><span class="fixed"></span></div>
<div class="wrap" style="filter: grayscale(1)"><span class="fixed"></span></div>
<div class="wrap" style="will-change: opacity"><span class="fixed"></span></div>
<div class="wrap" style="container-type: inline-size"><span class="fixed"></span></div>
<div class="wrap" style="contain: paint"><span class="fixed"></span></div>
<script>
  for (const el of document.querySelectorAll(".fixed")) {
    console.log(el.parentElement.style.cssText, el.getBoundingClientRect().top);
  }
</script>
```

**Answer:** `opacity: 0.5; 0`, `filter: grayscale(1); 250`, `will-change: opacity; 0`, `container-type: inline-size; 0`, `contain: paint; 700`. Only `filter` and `contain: paint` establish a containing block; the others create a stacking context at most. The wrappers sit at 100, 250, 400, 550 and 700 because their vertical margins collapse.
