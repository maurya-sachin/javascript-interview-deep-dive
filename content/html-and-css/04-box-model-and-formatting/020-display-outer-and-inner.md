---
title: "What does `display` actually set — outer and inner display types?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [display, display-outside, display-inside, flow-root, display-contents, blockification]
related:
  - html-and-css/box-model-and-formatting/block-formatting-context
  - html-and-css/box-model-and-formatting/line-boxes-and-vertical-align
  - html-and-css/box-model-and-formatting/floats-and-clear
  - html-and-css/flexbox-and-grid/flexbox-vs-grid
  - html-and-css/the-cascade/value-stages
verified: 2026-10
perishable:
  - Multi-keyword display shipped in Chrome 115, Firefox 70, Safari 15
  - "`run-in` unsupported in Chrome 155 and Firefox 158"
  - "`display: contents` button unfocusable in Chrome 155, Firefox 158"
sources:
  - https://www.w3.org/TR/css-display-3/#the-display-properties
  - https://www.w3.org/TR/css-display-3/#outer-role
  - https://www.w3.org/TR/css-display-3/#inner-model
  - https://www.w3.org/TR/css-display-3/#legacy-display
  - https://www.w3.org/TR/css-display-3/#box-generation
  - https://www.w3.org/TR/css-display-3/#transformations
  - https://www.w3.org/TR/css-display-3/#unbox-html
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/display#browser_compatibility
tldr: >
  `display` sets two things. The outer type (`block` or `inline`) says how the box takes part in
  its parent's flow. The inner type (`flow`, `flow-root`, `flex`, `grid`, `table`, `ruby`) says
  which formatting context lays out its children. `inline-flex` is `inline flex`. `none` and
  `contents` generate no box at all.
---

## Answer

CSS Display 3 splits `display` into two independent questions:

- **Outer display type**: how the element's principal box participates in its *parent's* flow layout. `block` boxes stack in the block direction and, with `width: auto`, fill the container's inline size; `inline` boxes sit on lines with text.
- **Inner display type**: which formatting context lays out its *children*: `flow` (normal block and inline layout), `flow-root` (flow, but always a new block formatting context), `flex`, `grid`, `table`, or `ruby`.

The one-word values everyone knows are shorthands for pairs. `block` is `block flow`, `inline` is `inline flow`, `flex` is `block flex`, `inline-block` is `inline flow-root`, `inline-grid` is `inline grid`. The two-keyword syntax is valid CSS (shipped in Chrome 115, Firefox 70 and Safari 15), but `getComputedStyle()` still serializes the short form.

Omit one half and it defaults: `display: flow-root` means `block flow-root`, and `display: inline` means `inline flow`. Adding `list-item` (`list-item`, `inline list-item`) also generates a `::marker` box.

Two values generate no box: `none` drops the element and its whole subtree; `contents` drops only the element's own box and puts its children in its place. Neither changes the DOM, selector matching or inheritance.

The parent can override what you wrote. **Blockification** forces the outer type to `block` for flex and grid items, floats and absolutely positioned boxes, so a `<span>` inside a flex container computes to `display: block`. That's why `width` suddenly works on it.

`display` doesn't change semantics: a `<ul>` with `display: flex` is still a list. And a replaced element's inner display is outside CSS: `display: flex` on an `<img>` doesn't lay out anything inside it.

## Example

```html
<style>
  #a { display: inline flow-root; }
  #b { display: block flex; }
  #c { display: flow list-item; }
  .row { display: flex; }
  #f { float: left; }
</style>
<div id="a"></div><div id="b"></div><div id="c"></div>
<div class="row">
  <span id="d">item</span>
  <span id="e" style="display: inline-block">item</span>
</div>
<span id="f">floated</span>
<img id="g" style="display: contents" alt="">
<script>
  for (const el of document.querySelectorAll("[id]")) {
    console.log(el.id, getComputedStyle(el).display);
  }
  // → a inline-block
  // → b flex
  // → c list-item
  // → d block
  // → e block
  // → f block
  // → g none
</script>
```

The flex items and the float are blockified; `inline-block` becomes plain `block`, not `flow-root`. On an `<img>`, `contents` computes to `none`. Chrome 155 and Firefox 158 agreed.

## Pitfalls

- Using `display: contents` on interactive elements. In Chrome 155 and Firefox 158 a `<button>` with it stayed in the accessibility tree but couldn't be focused by `focus()` or Tab.
- Expecting `display: contents` on `<img>`, `<input>`, `<select>` or `<video>` to unwrap them. The spec computes it to `none`, so the element disappears.
- Setting `display: inline` on a flex item to keep it on the line. Blockification overrides it; alignment comes from the flex container, not the item's outer type.
- Forgetting that `inline-block` is still on a line. A `50px` empty inline-block made its parent `54px` tall in Chrome 155 and `56px` in Firefox 158: it sits on the baseline, with room for descenders below.

## Follow-ups

**Q:** What's the difference between `display: block` and `display: flow-root`?
**A:** Both generate a block-level block container. `flow-root` always establishes a new block formatting context, so it contains its floats and its margins don't collapse with its children's. `block` only does that when something else (`overflow`, `float`, …) forces it.

**Q:** Why did `getComputedStyle()` print `inline-block` when I wrote `inline flow-root`?
**A:** They compute to the same value, and serialization picks the "most backwards-compatible, then shortest" form. Even `el.style.display` read back `inline-block` in both browsers, so don't feature-test the two-keyword syntax by reading it back.

**Q:** What's `run-in`?
**A:** A Display 3 outer type for a heading that merges into the start of the next block, like a run-in heading in print. Neither Chrome 155 nor Firefox 158 supports it: setting it is ignored and the `<div>` stays `block`.

**Q:** What happens to `display: table-cell` inside a grid?
**A:** Blockification turns layout-internal types into `flow`, so the item computes to `block` in both browsers. The table display only takes effect when the parent isn't a flex or grid container.

## Exercises

### What does each item compute to?

```html
<style>
  .grid { display: grid; }
  #a { display: inline-table; }
  #b { display: inline list-item; }
  #c { position: absolute; display: inline-grid; }
  #d { display: table-cell; }
</style>
<div class="grid">
  <span id="a"></span><span id="b"></span><span id="d"></span>
</div>
<span id="c"></span>
```

**Answer:** `#a` is `table`, `#b` is `list-item`, `#c` is `grid`, and `#d` is `block`. Grid items and absolutely positioned boxes are blockified: the outer type becomes `block`, the inner type stays, except a layout-internal type like `table-cell`, which becomes `flow`. Chrome 155 and Firefox 158 agreed.
