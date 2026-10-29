---
title: "How do floats and `clear` work, and where are they still the right tool?"
status: draft
difficulty: easy
frequency: 2
core: false
tags: [float, clear, clearance, shape-outside, text-wrap, block-formatting-context]
related:
  - html-and-css/box-model-and-formatting/block-formatting-context
  - html-and-css/box-model-and-formatting/margin-collapsing
  - html-and-css/box-model-and-formatting/display-outer-and-inner
  - html-and-css/flexbox-and-grid/flexbox-vs-grid
verified: 2026-10
perishable:
  - "`float: inline-start` shipped in Chrome 118, Firefox 55, Safari 15"
  - "`initial-letter`: Chrome 110, prefixed in Safari, not Firefox"
sources:
  - https://www.w3.org/TR/CSS2/visuren.html#floats
  - https://www.w3.org/TR/CSS2/visuren.html#float-rules
  - https://www.w3.org/TR/CSS2/visuren.html#flow-control
  - https://www.w3.org/TR/CSS2/visuren.html#clearance
  - https://www.w3.org/TR/CSS2/visudet.html#float-width
  - https://www.w3.org/TR/css-shapes-1/#shape-outside-property
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/float#browser_compatibility
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/initial-letter#browser_compatibility
tldr: >
  A float is taken out of flow and pushed to the left or right edge of its containing block; later
  line boxes shorten to wrap around it, but block boxes don't move. `clear` pushes a block below
  earlier floats. Floats are no longer a layout tool, but they're still how text wraps around
  images, especially with `shape-outside`.
---

## Answer

`float: left` or `right` (or the logical `inline-start` and `inline-end`) takes a box out of normal flow and shifts it to that edge of its containing block, as high as it can go without overlapping earlier floats. The float becomes a block box (its `display` is blockified) and, without an explicit width, is shrink-to-fit: as wide as its content needs.

Content after the float reacts in two different ways:

- **Line boxes shorten.** Text in following blocks flows beside the float, then back to full width below it.
- **Block boxes don't move.** A paragraph after the float starts at the container's edge, *underneath* the float; only its text is pushed aside. Its background and border run behind the float. A block that establishes a BFC is the exception: it narrows to sit beside the float.

Floats stack along their side. When the next float doesn't fit in the remaining width, it moves down to the first place it fits.

**`clear: left | right | both`** (or `inline-start`, `inline-end`) on a block says "start below earlier floats on that side". The browser adds **clearance** above the block's top margin, enough to put its border edge below the float. The margin is absorbed into that space rather than added to it.

Two related problems: a parent doesn't grow to contain its floats unless it's a BFC root (fix with `display: flow-root`), and floats have no effect on flex or grid items.

Where floats still belong: wrapping text around an image, a pull quote, or a figure in an article, the one thing flex and grid can't do. `shape-outside` lets the text follow a circle, polygon or image alpha instead of the rectangle. For page layout, columns and sidebars, use flex or grid.

## Example

```html
<style>
  .wrap { width: 300px; font: 16px/20px monospace; }
  .pic { float: left; width: 100px; height: 100px; }
  p { margin: 0; }
  .after { clear: left; margin-top: 20px; height: 10px; }
</style>
<div class="wrap">
  <div class="pic"></div>
  <p>Text wraps beside the float.</p>
  <div class="after"></div>
</div>
<script>
  const wrap = document.querySelector(".wrap");
  const p = document.querySelector("p");
  const after = document.querySelector(".after");
  const text = document.createRange();
  text.selectNodeContents(p);
  const x = (box) => box.getBoundingClientRect().left - wrap.getBoundingClientRect().left;
  const y = (box) => box.getBoundingClientRect().top - wrap.getBoundingClientRect().top;
  console.log(x(p), p.offsetWidth, x(text)); // the block vs its text
  console.log(y(after), wrap.offsetHeight);
  // → 0 300 100
  // → 100 110
</script>
```

The `<p>` box starts at `0` and is the full `300px`; only its text starts at `100`. The cleared block lands at `100`, not `120`: its `20px` margin sits inside the clearance. Chrome 155 and Firefox 158 agreed.

## Pitfalls

- Expecting `margin-top` on a cleared block to add space below the float. It's swallowed by clearance; a `20px` margin had no effect and a `120px` one gave `120`. Put the spacing on the float's `margin-bottom` instead.
- Giving a paragraph next to a float a background and being surprised it runs under the float. Make the paragraph `display: flow-root` so it narrows instead.
- Floating flex or grid items. `float` doesn't apply to them; it's silently ignored.
- Using floats for equal-height columns. Floats have no notion of a row; use grid.

## Follow-ups

**Q:** What does `shape-outside` change?
**A:** The float's exclusion area. `shape-outside: circle(50%)` on a `100px` float made the first `20px` line start at `90px` instead of `100px`, following the curve. It affects only wrapping, not painting; add a matching `clip-path` or `border-radius` to make the visuals match.

**Q:** Why use `float: inline-start` instead of `left`?
**A:** It follows the writing direction: in a `direction: rtl` container it floated to the right edge in both browsers. Shipped in Chrome 118, Firefox 55 and Safari 15.

**Q:** Is floating still how you make a drop cap?
**A:** It was. `initial-letter` sizes and sinks the first letter properly and is supported in Chrome 110 and, prefixed, in Safari; Firefox doesn't support it, so a floated `::first-letter` remains the fallback.

## Exercises

### Where does the third float go?

```html
<style>
  .wrap { width: 300px; }
  .f { float: left; height: 50px; }
</style>
<div class="wrap">
  <div class="f" style="width: 100px"></div>
  <div class="f" style="width: 150px"></div>
  <div class="f" style="width: 100px"></div>
</div>
```

**Answer:** Below the first one: left `0`, top `50px`. The first two use `250px`, the third needs `100px`, so it can't fit beside them and moves down to the first place it fits, against the left edge. Chrome 155 and Firefox 158 agreed.
