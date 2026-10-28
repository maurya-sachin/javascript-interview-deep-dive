---
title: "How does `position: sticky` work, and why does it sometimes not stick?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [position, sticky, scroll-container, overflow, scrollport]
related:
  - html-and-css/positioning-and-stacking/position-and-containing-block
  - html-and-css/positioning-and-stacking/stacking-contexts
  - html-and-css/box-model-and-formatting/overflow-and-scroll-containers
verified: 2026-10
sources:
  - https://www.w3.org/TR/css-position-3/#position-property
  - https://www.w3.org/TR/css-position-3/#stickypos-insets
  - https://www.w3.org/TR/css-position-3/#stacking
  - https://www.w3.org/TR/css-overflow-3/#overflow-control
  - https://www.w3.org/TR/css-overflow-3/#valdef-overflow-clip
tldr: >
  A sticky box is laid out in flow, then shifted while scrolling so it stays inside the nearest
  scroll container's scrollport, inset by its `top`/`bottom`/`left`/`right`, but never past its
  own containing block. It fails to stick when no inset is set, its parent leaves no room, or an
  ancestor with `overflow: hidden` becomes the scrollport.
---

## Answer

`position: sticky` is relative positioning with an offset the browser recomputes as you scroll:

1. The box is laid out in normal flow and keeps its space, like `relative`.
2. The browser finds the **nearest ancestor scroll container**. Its scrollport (the visible area), shrunk by the box's non-`auto` insets, is the **sticky view rectangle**. `top: 0` means "the top edge of that scrollport".
3. Whenever the box would cross an edge of that rectangle on a side with a non-`auto` inset, it's shifted back inside it.
4. The shift stops when the box reaches the edge of its **containing block**, usually its parent. That's why a section heading scrolls away with the end of its section.

So debugging a sticky element that doesn't stick is checking those three inputs:

- **No inset.** With `top`, `bottom`, `left` and `right` all `auto`, there's no edge to stick to; it behaves like `relative`.
- **The wrong scroll container.** Any ancestor with `overflow` other than `visible` or `clip` is a scroll container, even `overflow: hidden`, which never scrolls. The sticky box sticks to that ancestor, which moves along with the page, so it looks dead. Setting only `overflow-x: hidden` also counts, because `overflow-y: visible` then computes to `auto`.
- **No room to move.** If the containing block is barely taller than the sticky box, there's nowhere to slide. A sidebar stretched to the full height of a flex or grid row is the classic case.

Two more behaviours worth naming: multiple sticky boxes in one container are offset independently, so they can overlap; and a sticky box always forms a stacking context, even with `z-index: auto`.

## Example

```html
<style>
  .scroller { height: 200px; overflow: auto; }
  section { height: 300px; }
  h2 { position: sticky; top: 0; height: 40px; margin: 0; }
</style>
<div class="scroller" id="plain">
  <section><h2></h2></section>
  <section></section>
</div>
<div class="scroller" id="wrapped">
  <div style="overflow: hidden">
    <section><h2></h2></section>
    <section></section>
  </div>
</div>
<script>
  for (const scroller of document.querySelectorAll(".scroller")) {
    const heading = scroller.querySelector("h2");
    const offsets = [100, 280].map((y) => {
      scroller.scrollTop = y;
      return heading.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
    });
    console.log(scroller.id, offsets.join(" "));
  }
  // → plain 0 -20
  // → wrapped -100 -280
</script>
```

Chrome 155 and Firefox 158 agreed. In `plain`, the heading is pinned at `0` after 100px of scrolling, then pushed out at `-20` because only 20px of its section is left. In `wrapped`, the `overflow: hidden` div is the nearest scroll container; it never scrolls, so the heading moves exactly with the content.

## Pitfalls

- Hiding horizontal overflow on a page wrapper. With `overflow-x: hidden` on it, its `overflow-y` computed to `auto` and a `top: 0` header sat at `-500` after scrolling 500px; with `overflow-x: clip` it stayed at `0`.
- Stretching the sticky element. A `top: 0` sidebar in a flex row was as tall as the 600px row and scrolled away (`-100` at 100px of scroll); `align-self: start` kept it at `0`.
- Wrapping the sticky element in a tight parent. A heading whose section was only its own height never stayed put.
- Expecting `top: 0` to stick to the window when an ancestor scrolls. It sticks to the nearest scroll container, whichever that is.

## Follow-ups

**Q:** How do you fix a sticky element under an `overflow: hidden` ancestor?
**A:** Use `overflow: clip` if the ancestor only needs clipping: it clips without becoming a scroll container. Otherwise move the sticky element outside that ancestor, or make that ancestor the intended scroller with a real height.

**Q:** What does `bottom: 0` do on a sticky element?
**A:** It keeps the box from going below the scrollport's bottom edge. A footer laid out 500px down a 200px scroller sat at `170` (200 − 30px height) until its natural position scrolled into view.

**Q:** Can a sticky box be offset upwards when it only has `top` set?
**A:** No. With `top` set and `bottom: auto`, the sticky offset only pushes it down from its in-flow position. When its containing block's end edge arrives, that offset shrinks back toward zero, so the box leaves with its section.

## Exercises

### What does each scroll position print?

```html
<style>
  .scroller { height: 200px; overflow: auto; }
  section { height: 300px; }
  h2 { position: sticky; top: 10px; height: 40px; margin: 0; }
</style>
<div class="scroller"><section><h2></h2></section><section></section></div>
<script>
  const scroller = document.querySelector(".scroller");
  const heading = document.querySelector("h2");
  for (const y of [0, 50, 270]) {
    scroller.scrollTop = y;
    console.log(y, heading.getBoundingClientRect().top - scroller.getBoundingClientRect().top);
  }
</script>
```

**Answer:** `0 10`, `50 10`, `270 -10`. At scroll 0 the heading's natural position (`0`) is already above the inset edge, so it's pushed down to `10`. At 270 its section ends at `30` in the scrollport, and the heading's bottom can't pass it.
