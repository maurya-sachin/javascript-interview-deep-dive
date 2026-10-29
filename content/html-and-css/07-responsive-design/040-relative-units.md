---
title: "What are `em`, `rem`, `%`, and `ch` relative to, and when do you use each?"
status: draft
difficulty: easy
frequency: 4
core: false
tags: [units, em, rem, percentages, ch, lh, font-size]
related:
  - html-and-css/responsive-design/media-queries
  - html-and-css/responsive-design/viewport-units
  - html-and-css/responsive-design/fluid-sizing-clamp
  - html-and-css/box-model-and-formatting/box-model-and-box-sizing
verified: 2026-10
sources:
  - https://www.w3.org/TR/css-values-4/#font-relative-lengths
  - https://www.w3.org/TR/css-values-4/#em
  - https://www.w3.org/TR/css-values-4/#rem
  - https://www.w3.org/TR/css-values-4/#ch
  - https://www.w3.org/TR/css-values-4/#lh
  - https://www.w3.org/TR/css-values-4/#percentages
  - https://www.w3.org/TR/css-box-4/#padding-physical
  - https://www.w3.org/TR/css-box-4/#margin-physical
  - https://www.w3.org/TR/CSS22/visudet.html#propdef-height
  - https://www.w3.org/TR/CSS22/visudet.html#propdef-line-height
  - https://www.w3.org/TR/css-fonts-4/#font-size-prop
tldr: >
  `em` is the element's own computed `font-size`, except in `font-size` itself, where it's the
  parent's, so it compounds when nested. `rem` is the root element's `font-size`. `%` depends on the
  property: width, margins and all padding use the containing block's width; `font-size` the parent's.
  `ch` is the width of "0" in the current font.
---

## Answer

Each resolves against a different reference:

- **`em`**: the computed `font-size` of the element it's used on. Inside `font-size` (and other `font-*` properties), it uses the parent's font size, so `font-size: 1.2em` multiplies at every level of nesting.
- **`rem`**: the root element's computed `font-size`. On the root itself it uses the initial value, which is the user's default font size (16 px unless they changed it).
- **`%`**: each property defines its own reference. `width`, all four margins and all four paddings use the containing block's **width** (inline size), even `padding-top`. `height` uses the containing block's height, but only if that's definite; otherwise it behaves as `auto`. `font-size` uses the parent's font size; `line-height` the element's own.
- **`ch`**: the advance width of the "0" glyph in the element's font (or `0.5em` if it can't be measured). It approximates a character count, exact only in monospace fonts.
- **`lh`** / **`rlh`**: the computed `line-height` of the element or root, for vertical rhythm.

Choosing:

- **`rem`** for type scale and layout spacing. It follows the user's default font size, which `px` ignores.
- **`em`** for things that should grow with *local* text: button padding, icon size, gap next to a label.
- **`%`** (or `fr`, flex) for sizes relative to the container.
- **`ch`** for line length (`max-width: 65ch`) and inputs sized to their content (`width: 6ch`).

In media queries, `em` and `rem` use the initial font size instead, since no element is involved.

## Example

```html
<style>
  .parent { font-size: 20px; width: 400px; }
  .child {
    font-size: 1.5em;
    padding: 1em;
    padding-top: 10%;
    margin-top: 1rem;
    width: 50%;
    line-height: 1.5;
    height: 2lh;
  }
  .nested { font-size: 1.5em; }
</style>
<div class="parent">
  <div class="child" id="child">
    <div class="nested" id="one"><div class="nested" id="two"></div></div>
  </div>
</div>
<script>
  const style = (id) => getComputedStyle(document.getElementById(id));
  const c = style("child");
  console.log(c.fontSize, c.paddingLeft, c.paddingTop, c.marginTop, c.width, c.height);
  // → 30px 30px 40px 16px 200px 90px
  console.log(style("one").fontSize, style("two").fontSize);
  // → 45px 67.5px
</script>
```

Chrome 156 and Firefox 159 agreed. `1.5em` in `font-size` used the parent's 20 px, but `1em` of padding used the child's own 30 px. `padding-top: 10%` is 10% of the 400 px containing block's *width*; `2lh` is two 45 px lines.

## Pitfalls

- Nesting `em` font sizes. Each level multiplies the last; `rem` doesn't compound.
- Setting `line-height: 150%`. It computes to a length and children inherit that length: a 40 px child of a 10 px parent got a `15px` line height. A unitless `1.5` gave `60px`.
- Writing `html { font-size: 10px }`. With the browser's default font size set to 24 px, the root stayed `10px`; `62.5%` gave `15px`, keeping the user's choice.
- Expecting `height: 50%` to work inside a parent with `height: auto`. The containing block's height isn't definite, so it behaves as `auto`.

## Follow-ups

**Q:** Doesn't page zoom make `px` and `rem` equivalent?
**A:** For zoom, yes: it scales every CSS pixel. The difference is the browser's default font size setting, which changes `rem` and `em` but not `px`. Some users set that instead of zooming.

**Q:** Is `60ch` sixty characters?
**A:** Only in a monospace font. It's sixty "0" glyphs; proportional text fits more narrow letters and fewer wide ones. As a target line length it's close enough, and it scales with the font.

**Q:** What is `em` inside `line-height`?
**A:** The element's own font size, like everywhere except font properties. Only `lh` and `rlh` switch to the parent's values when used in `line-height`.

## Exercises

### Nested list items

```html
<style>li { font-size: 0.8em; }</style>
<ul><li>One<ul><li>Two<ul><li id="deep">Three</li></ul></li></ul></li></ul>
```

**Answer:** The third-level item is about 8.2 px: 16 × 0.8 × 0.8 × 0.8. Chrome 156 printed `8.192px` and Firefox 159 `8.18333px`. With `0.8rem` both printed `12.8px` at every level.
