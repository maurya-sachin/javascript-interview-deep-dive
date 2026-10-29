---
title: "What are logical properties, and why use `margin-inline` over `margin-left`?"
status: draft
difficulty: easy
frequency: 3
core: false
tags: [logical-properties, writing-modes, rtl, inline-axis, block-axis]
related:
  - html-and-css/the-cascade/cascade-sort-order
  - html-and-css/box-model-and-formatting/box-model-and-box-sizing
verified: 2026-10
perishable:
  - "margin-inline: Chrome 87, Firefox 66, Safari 14.1"
  - "Shorthand logical keyword: no browser supports it"
sources:
  - https://www.w3.org/TR/css-logical-1/#intro
  - https://www.w3.org/TR/css-logical-1/#box
  - https://www.w3.org/TR/css-logical-1/#logical-property-group
  - https://www.w3.org/TR/css-logical-1/#margin-properties
  - https://www.w3.org/TR/css-logical-1/#logical-shorthand-keyword
  - https://www.w3.org/TR/css-writing-modes-4/#abstract-axes
  - https://www.w3.org/TR/css-writing-modes-4/#logical-directions
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/margin-inline#browser_compatibility
tldr: >
  Logical properties name sides by text flow instead of the screen: `inline` is the direction text
  runs in a line, `block` the direction lines stack. `margin-inline-start` is the left margin in
  English, the right in Arabic, the top in vertical Japanese. Components then flip with `dir` and
  `writing-mode` without overrides.
---

## Answer

Physical properties (`margin-left`, `top`, `width`) are tied to the screen. Logical properties are tied to the **writing mode** and **direction** of the element:

- The **inline axis** is the direction text runs within a line; the **block axis** is the direction lines and blocks stack.
- Each axis has a **start** and an **end**.

| Logical | `ltr`, horizontal | `rtl`, horizontal | `vertical-rl` |
|---|---|---|---|
| `margin-inline-start` | left | right | top |
| `margin-block-start` | top | top | right |
| `inline-size` | width | width | height |

The families cover margins, padding, borders and border radii (`border-start-end-radius`), insets (`inset-inline-start`), sizes (`inline-size`, `max-block-size`), plus values such as `text-align: start` and `float: inline-start`. Two-value shorthands set start then end: `padding-inline: 4px 12px`.

Why prefer them: a sidebar icon with `margin-inline-end` and a quote with `border-inline-start` are correct when the page is translated into Arabic or Hebrew (`dir="rtl"`), with no `[dir=rtl]` overrides. Most UI spacing is about reading order, not screen sides, and logical properties say that. Keep physical properties where the screen really matters, such as a drop shadow's offset. Full support for vertical and mixed scripts needs more than this; logical properties are the base.

How they cascade: a logical property and the physical one it maps to form a **pair that cascades together**. In `margin-inline-start: 1px; margin-left: 2px;` in `ltr`, the later declaration wins and the left margin is `2px`. Each element maps using its **own** writing mode and direction.

The four-value shorthands (`margin`, `padding`) stay physical. A `logical` keyword (`margin: logical 1px 2px`) is in the draft, marked as almost certain to change, and no browser supports it.

Support: the `-inline`/`-block` shorthands since Chrome 87, Firefox 66, Safari 14.1.

## Example

```html
<style>
  p {
    margin: 0;
    margin-inline-start: 8px;
    border-inline-start: 3px solid;
    inline-size: 100px;
  }
  .vertical { writing-mode: vertical-rl; }
</style>
<p id="ltr">Text</p>
<p id="rtl" dir="rtl">Text</p>
<p id="vertical" class="vertical">Text</p>
<script>
  for (const id of ["ltr", "rtl", "vertical"]) {
    const s = getComputedStyle(document.getElementById(id));
    console.log(id, "|", s.margin, "|", s.borderWidth, "|", s.inlineSize);
  }
  // → ltr | 0px 0px 0px 8px | 0px 0px 0px 3px | 100px
  // → rtl | 0px 8px 0px 0px | 0px 3px 0px 0px | 100px
  // → vertical | 8px 0px 0px | 3px 0px 0px | 100px
</script>
```

Chrome 156 and Firefox 159 agreed. The shorthands read top, right, bottom, left: one rule puts the gap and border on the left, the right, then the top.

## Pitfalls

- Mixing a logical and a physical property for the same side and expecting both to apply. They are one pair; the later or more specific declaration wins.
- Assuming `margin: 0 1rem 0 2rem` follows direction. Four-value shorthands are physical.
- Setting `dir="rtl"` on a child and expecting it to inherit a parent's logical value by side. The spec says `margin-inline-start: inherit` takes the parent's `margin-inline-start`; Chrome 156 and Firefox 159 took the parent's physical side instead (`margin-right`, `0px`), not its `20px` start margin.
- Converting everything blindly. Shadows, transforms and `background-position` have no logical form here; they stay physical.

## Follow-ups

**Q:** What do `getComputedStyle().marginLeft` and `marginInlineStart` return?
**A:** The same value when they map to the same side. In an `rtl` element with `margin-inline-start: 8px`, `marginRight` and `marginInlineStart` were both `8px`.

**Q:** Is `left`/`right` in `float` and `text-align` covered?
**A:** Yes: `text-align: start | end` and `float: inline-start | inline-end`. `float: inline-start` shipped in Chrome 118, Firefox 55 and Safari 15.

**Q:** Which writing mode does `inline-size` use for a child of a vertical parent?
**A:** Its own. Each element maps logical properties with its own computed `writing-mode` and `direction`, so a horizontal child inside a vertical parent maps `inline-size` to width.

## Exercises

### Which margin does the paragraph get?

```html
<style>
  p { margin-inline-start: 1px; margin-left: 2px; margin-inline-end: 3px; }
</style>
<p dir="rtl">Text</p>
```

**Answer:** Left `3px`, right `1px`. In `rtl`, `margin-inline-end` pairs with `margin-left` and comes later, so it wins the left side; `margin-inline-start` is the right side. In `ltr` the result was left `2px`, right `3px`. Chrome 156 and Firefox 159 agreed.
