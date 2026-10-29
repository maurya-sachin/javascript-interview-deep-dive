---
title: "How are inline boxes laid out — line boxes, `line-height`, and `vertical-align`?"
status: draft
difficulty: hard
frequency: 3
core: false
tags: [inline-formatting-context, line-box, line-height, vertical-align, strut, baseline, text-box-trim]
related:
  - html-and-css/box-model-and-formatting/display-outer-and-inner
  - html-and-css/box-model-and-formatting/box-model-and-box-sizing
  - html-and-css/box-model-and-formatting/block-formatting-context
  - html-and-css/the-cascade/inheritance-and-global-keywords
  - html-and-css/documents-and-semantics/doctype-and-rendering-modes
verified: 2026-10
perishable:
  - "`text-box` shipped in Chrome 133, Firefox 154, Safari 18.2"
sources:
  - https://www.w3.org/TR/CSS2/visuren.html#inline-formatting
  - https://www.w3.org/TR/CSS2/visudet.html#line-height
  - https://www.w3.org/TR/CSS2/visudet.html#leading
  - https://www.w3.org/TR/CSS2/visudet.html#propdef-line-height
  - https://www.w3.org/TR/CSS2/visudet.html#propdef-vertical-align
  - https://www.w3.org/TR/css-inline-3/#text-box-trim
  - https://quirks.spec.whatwg.org/#the-blocks-ignore-line-height-quirk
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-box#browser_compatibility
tldr: >
  Inline content flows into line boxes. Each inline box is exactly its `line-height` tall (text plus
  half-leading above and below); images and inline-blocks count their margin box. `vertical-align`
  positions each box, by default on the parent's baseline, and the line box stretches to fit them
  all, including an invisible strut. That strut causes the gap under images.
---

## Answer

A block container whose children are inline-level establishes an **inline formatting context**. Its content is broken into **line boxes**, stacked one per line. Each line box is as tall as needed to hold everything on it, computed like this:

1. **Give every inline-level box a height.** A text inline box is exactly its `line-height`: the font's ascent plus descent (its *content area*), with the difference split as **half-leading** above and below. Replaced elements (`<img>`, `<canvas>`) and inline-blocks use their **margin box**.
2. **Align them with `vertical-align`.** The default, `baseline`, lines a box's baseline up with its parent's. `middle`, `text-top`, `sub` or a length shift it relative to the parent; `top` and `bottom` align to the line box itself.
3. **Measure.** The line box runs from the highest box top to the lowest box bottom.

Every line also starts with a **strut**: an invisible, zero-width inline box with the block's own font and `line-height`. So a line is never shorter than the block's `line-height`, and the baseline always sits where the block's text would sit.

That explains the classic **gap under images**. An `<img>` is inline and sits on the baseline. The strut reserves room for descenders below the baseline, so the block ends a few pixels below the image. The fixes all take the image off the baseline or remove the strut's descent: `display: block`, `vertical-align: top | middle | bottom`, or `line-height: 0` on the parent.

Two more consequences. Vertical padding and borders on an inline `<span>` paint but don't affect the line box. And `vertical-align` only applies to inline-level boxes and table cells: it can't centre a block.

## Example

```html
<!DOCTYPE html>
<style>
  body { font: 16px/20px monospace; }
  canvas { width: 50px; height: 100px; }
</style>
<div id="a"><canvas></canvas></div>
<div id="b"><canvas style="vertical-align: top"></canvas></div>
<div id="c"><canvas style="display: block"></canvas></div>
<p id="d">x <span style="font-size: 32px">X</span></p>
<p id="e" style="line-height: 1.25">x <span style="font-size: 32px">X</span></p>
<script>
  for (const el of [a, b, c, d, e]) console.log(el.id, el.offsetHeight);
  // → a 105
  // → b 100
  // → c 100
  // → d 26
  // → e 40
</script>
```

Chrome 155 and Firefox 158 on macOS printed the same; `105` and `26` depend on the monospace font's ascent and descent. In `#d` every box is `20px` tall, but the big `X`'s baseline sits lower in its box, so the boxes stagger and the line grows. With a unitless `line-height`, the span's box becomes `40px`.

## Pitfalls

- Testing without `<!DOCTYPE html>`. In quirks and limited-quirks mode the strut isn't created, so the same `#a` measured `100`: the gap only shows up in standards mode.
- Setting `font-size: 0` to kill the gap while `line-height` is a length. The strut keeps its `20px` height, centred on the baseline, so the block grew to `110px`.
- Using `line-height: 20px` (a length) on a container with mixed font sizes. Children inherit `20px` regardless of their size; a unitless number scales with each element's font.
- Putting `vertical-align: middle` on a block to centre its content. It applies only to inline-level boxes and table cells; a table cell's content moved down, a `<div>`'s didn't.

## Follow-ups

**Q:** Where is an inline-block's baseline?
**A:** On its last line box, unless it has no in-flow lines or `overflow` other than `visible`: then it's the bottom margin edge. A two-line inline-block made a `40px` line; with `overflow: hidden` the line grew to `45px`, its bottom now on the baseline.

**Q:** How do you trim the space above capitals and below the baseline?
**A:** `text-box: trim-both cap alphabetic` (CSS Inline 3; Chrome 133, Firefox 154, Safari 18.2) trims the first and last line to the cap height and baseline. A `16px/20px` monospace paragraph went from `20px` to `12px` tall in both browsers.

**Q:** What does `vertical-align: middle` actually align?
**A:** The box's midpoint with the parent's baseline plus half the parent's x-height: the middle of lowercase letters, not the middle of the line box. That's why icons next to text often look a pixel or two off.

## Exercises

### How tall is each `<div>`?

```html
<!DOCTYPE html>
<style>
  canvas { width: 50px; height: 100px; }
  #a { line-height: 0; }
  #b { font-size: 0; line-height: 20px; }
  #c { font-size: 0; line-height: 1.25; }
</style>
<div id="a"><canvas></canvas></div>
<div id="b"><canvas></canvas></div>
<div id="c"><canvas></canvas></div>
```

**Answer:** `#a` is `100`: the strut has zero height. `#b` is `110`: a zero-size font has no ascent or descent, so the strut is all half-leading, `10px` above and `10px` below the baseline, and the canvas sits on that baseline. `#c` is `100`: `1.25 × 0` is `0`. Chrome 155 and Firefox 158 agreed.
