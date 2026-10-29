---
title: "How do `position` values differ, and what is each one's containing block?"
status: draft
difficulty: medium
frequency: 5
core: true
tags: [position, containing-block, absolute, fixed, relative, inset]
related:
  - html-and-css/positioning-and-stacking/sticky-positioning
  - html-and-css/positioning-and-stacking/stacking-contexts
  - html-and-css/positioning-and-stacking/transform-breaks-fixed
  - html-and-css/positioning-and-stacking/anchor-positioning
  - html-and-css/box-model-and-formatting/overflow-and-scroll-containers
verified: 2026-10
sources:
  - https://www.w3.org/TR/css-position-3/#position-property
  - https://www.w3.org/TR/css-position-3/#def-cb
  - https://www.w3.org/TR/css-position-3/#relpos-insets
  - https://www.w3.org/TR/css-position-3/#resolving-insets
  - https://www.w3.org/TR/css-position-3/#abspos-layout
  - https://www.w3.org/TR/css-position-3/#abspos-margins
  - https://www.w3.org/TR/CSS2/visudet.html#containing-block-details
tldr: >
  `static` and `relative` stay in flow; `relative` only shifts the painted box. `absolute` leaves
  flow and is placed against the padding box of the nearest positioned (or transformed, filtered,
  contained) ancestor, else the initial containing block. `fixed` uses the viewport unless such an
  ancestor intervenes. `sticky` is relative, nudged to stay inside its scrollport.
---

## Answer

The **containing block** is the rectangle a box's insets (`top`, `right`, `bottom`, `left`, `inset`) and percentages resolve against. Each `position` value picks a scheme and with it a containing block:

- **`static`** (initial): normal flow. Insets don't apply. Its containing block comes from its formatting context, usually the content box of the nearest block container.
- **`relative`**: laid out exactly as static, then shifted visually by the insets. The space it left behind stays reserved; siblings don't move.
- **`absolute`**: taken out of flow, so it no longer affects siblings or its parent's size. Its containing block is the **padding box** of the nearest ancestor that establishes an absolute positioning containing block: any `position` other than `static`, plus a few non-position properties such as `transform`, `filter` and `contain: layout`/`paint`. With no such ancestor it's the **initial containing block**: a viewport-sized rectangle at the top of the document that scrolls with it.
- **`fixed`**: like absolute, but the containing block is the viewport, so it doesn't move when the page scrolls. The non-position properties above (not `position: relative`) still capture it.
- **`sticky`**: in flow like relative, but its offset is adjusted while scrolling to keep it inside the nearest scrollport, within its own containing block.

Every value except `static` makes the element a containing block for absolute descendants, which is why `position: relative` with no insets is the usual "anchor" for a child overlay.

For absolute and fixed boxes, the insets shrink the containing block into an *inset-modified containing block*. An axis with both insets `auto` keeps the box at its **static position**, where it would have been in flow. Absolute and fixed also blockify the box (`display: inline` computes to `block`) and force `float` to `none`.

## Example

```html
<style>
  body { margin: 0; height: 2000px; }
  div { height: 20px; }
  .card { position: relative; margin: 50px; border: 10px solid; padding: 20px; width: 200px; height: 100px; }
  .shifted { position: relative; top: 30px; }
  .card > .abs { position: absolute; top: 0; left: 0; width: 50%; }
  .icb { position: absolute; bottom: 0; width: 10px; }
  .fixed { position: fixed; bottom: 0; width: 10px; }
</style>
<div class="card">
  <div class="shifted"></div>
  <div class="next"></div>
  <div class="abs"></div>
</div>
<div class="icb"></div>
<div class="fixed"></div>
<script>
  scrollTo(0, 100);
  for (const el of document.querySelectorAll(".card > *, .icb, .fixed")) {
    const { left, top, width } = el.getBoundingClientRect();
    console.log(el.className, left, top + scrollY, width);
  }
  // → shifted 80 110 200
  // → next 80 100 200
  // → abs 60 60 120
  // → icb 0 748 10
  // → fixed 0 848 10
</script>
```

Chrome 155 and Firefox 158 at 1024×768. `.next` starts at `100`, as if `.shifted` hadn't moved. `.abs` sits on the card's padding edge and `50%` is half its padding box (240px). `.icb` ends at the bottom of the *first* screen (page y `768`); `.fixed` follows the scrolled viewport (`100 + 748`).

## Pitfalls

- Expecting `bottom: 0` with no positioned ancestor to reach the bottom of the page. The initial containing block is viewport-sized, so the box ended at `768` on a 2000px page.
- Measuring an absolute child from the parent's content box. Insets start at the padding edge, and percentages use the padding box.
- Forgetting the in-between properties: a `transform` or `filter` on any ancestor captures both absolute and fixed children before an outer `position: relative` does.
- Giving `top: 50%` to a relative box whose parent has `height: auto`. In Chrome 155 and Firefox 158 it moved by `0`; with `height: 200px` on the parent it moved by `100`.

## Follow-ups

**Q:** Why does `position: absolute; inset: 0; margin: auto; width: 40px; height: 40px` centre the box?
**A:** With no `auto` insets, the remaining space in the inset-modified containing block is split between the `auto` margins in each axis. In a 300×300 parent the box landed at `130, 130`.

**Q:** Does an absolutely positioned child affect its parent's height?
**A:** No. It's out of flow, so a parent containing only absolute children has zero content height unless it sets one.

**Q:** What sizes an absolute box with `width: auto`?
**A:** With both horizontal insets set (and `justify-self: normal`), it stretches to fill the inset-modified containing block. If either inset is `auto`, it shrinks to fit its content.

## Deep dive

### How it works

Every box's position resolves against its containing block, so layout is really a walk up a chain of them.

For in-flow boxes (`static`, `relative`, `sticky`), the formatting context defines it: in block layout, the content box of the nearest block container. That's why a static child's `width: 50%` means half the parent's content width.

For `absolute`, the browser walks up the ancestors and stops at the first one that **establishes an absolute positioning containing block**. Any `position` other than `static` does; so do `transform`, `translate`/`rotate`/`scale`, `perspective`, `filter`, `backdrop-filter`, `contain: layout` or `paint`, `content-visibility: auto`, and `will-change` naming one of those properties. Both test browsers agreed on every one of these. If none is found, the containing block is the initial containing block, which CSS 2 defines as having the viewport's dimensions and being anchored at the canvas origin.

For `fixed`, the same walk skips `position` and stops only at the non-position properties; failing that, the containing block is the layout viewport. Question 040 covers why that matters.

Then the absolute layout model runs:

1. The insets carve the **inset-modified containing block** out of the containing block. One `auto` inset becomes `0`; two `auto` insets in an axis put the box at its static position.
2. `width`/`height` resolve: `auto` stretches when neither inset nor margin in that axis is `auto`, and otherwise shrinks to fit content. Percentages still use the original containing block.
3. `auto` margins split whatever space is left. They can go negative, unlike in flow.
4. The margin box is aligned inside that rectangle (`align-self`/`justify-self` apply here).

When the containing block is a grid container, `grid-row`/`grid-column` on the absolute child can narrow the containing block to a grid area.

### Edge cases

`overflow` clips an absolute box only if the clipping element is its containing block or an ancestor of it. A `position: absolute` menu inside a non-positioned `overflow: hidden` wrapper, with its containing block outside the wrapper, still received `elementFromPoint` hits 60px below the wrapper's bottom edge. With `position: relative` on the wrapper, the part of the menu past that edge stopped receiving hits.

If the nearest positioned ancestor is an **inline** box, the containing block is built from its first and last fragments' content edges, not a padding box. The spec still marks the multi-line case as an open issue.

`transform: none` and `filter: none` don't establish anything; only real values do. `opacity`, `isolation`, `mix-blend-mode`, `clip-path`, `overflow` and `z-index` create other effects but are **not** containing blocks. In Chrome 155 and Firefox 158, `container-type: inline-size` and `size` weren't either.

### Real-world scenario

A card has `position: relative; overflow: hidden; border-radius: 12px` so images respect the rounded corners, and a dropdown inside it is `position: absolute; top: 100%`. The menu gets cut off at the card's edge, because the card is both its containing block and its clipper. Moving `position: relative` to a wrapper outside the card keeps the menu positioned yet unclipped. For a menu that must escape every ancestor, the popover top layer plus anchor positioning (questions 050 and 060) removes the dependency on the tree entirely.

### Trade-offs

`position: relative; top: 4px` and `transform: translateY(4px)` both nudge without disturbing siblings. Relative positioning's only side effect is becoming a containing block for absolute descendants; `transform` animates cheaply but also creates a stacking context and captures fixed descendants.

Absolute positioning removes the box from layout, so the parent can't grow to fit it. Overlapping in-flow boxes (a caption on an image) is often better done by placing both in the same grid area, which overlaps them while still sizing the parent.

## Exercises

### Where does `.d` land?

```html
<style>
  body { margin: 0; }
  .a { margin: 20px; padding: 10px; }
  .b { position: relative; margin: 30px; border: 5px solid; }
  .c { transform: translateX(0); margin: 40px; }
  .d { position: absolute; top: 0; left: 0; }
</style>
<div class="a"><div class="b"><div class="c"><span class="d">x</span></div></div></div>
<script>
  const d = document.querySelector(".d");
  const box = d.getBoundingClientRect();
  console.log(box.left, box.top, getComputedStyle(d).display);
</script>
```

**Answer:** `105 105 block`. The transformed `.c` is the nearest containing block, not the positioned `.b`: 20 + 10 + 30 + 5 + 40 in each axis. Absolute positioning blockified the `<span>`.
