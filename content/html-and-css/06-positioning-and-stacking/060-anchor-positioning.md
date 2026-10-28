---
title: "How does CSS anchor positioning work?"
status: draft
difficulty: hard
frequency: 3
core: false
tags: [anchor-positioning, anchor-name, position-area, position-try, popover, tooltip]
related:
  - html-and-css/positioning-and-stacking/position-and-containing-block
  - html-and-css/positioning-and-stacking/top-layer
  - html-and-css/forms-dialog-popover/popover-attribute
verified: 2026-10
perishable:
  - "Anchor positioning in Chrome 125, Firefox 147, Safari 26"
  - "`position-anchor: normal` initial value in Chrome 151, Firefox 151, Safari 27"
  - "`anchor-scope` in Chrome 131, Firefox 147, Safari 26"
sources:
  - https://www.w3.org/TR/css-anchor-position-1/#name
  - https://www.w3.org/TR/css-anchor-position-1/#anchor-scope
  - https://www.w3.org/TR/css-anchor-position-1/#target
  - https://www.w3.org/TR/css-anchor-position-1/#position-anchor
  - https://www.w3.org/TR/css-anchor-position-1/#implicit
  - https://www.w3.org/TR/css-anchor-position-1/#position-area
  - https://www.w3.org/TR/css-anchor-position-1/#anchor-pos
  - https://www.w3.org/TR/css-anchor-position-1/#anchor-size-fn
  - https://www.w3.org/TR/css-anchor-position-1/#position-try-fallbacks
  - https://www.w3.org/TR/css-anchor-position-1/#position-visibility
  - https://html.spec.whatwg.org/multipage/popover.html#show-popover
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/anchor-name#browser_compatibility
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position-anchor#browser_compatibility
tldr: >
  An element names itself with `anchor-name: --x`; an absolutely or fixed positioned element
  picks it with `position-anchor: --x`, then places itself with `position-area` (a 3×3 grid
  around the anchor) or `anchor()` in its insets, and sizes with `anchor-size()`.
  `position-try-fallbacks` flips it when it would overflow. A popover anchors to its invoker
  automatically.
---

## Answer

Anchor positioning lets an absolutely positioned box (`absolute` or `fixed`) place and size itself against another element's box, with no JavaScript measuring.

1. **Name the anchor.** `anchor-name: --save` on the target. Names needn't be unique: the nearest ancestor wins, otherwise the last match in tree order. `anchor-scope: --save` limits a name to a subtree, so repeated components don't collide.
2. **Pick a default anchor.** `position-anchor: --save` on the positioned box. Its initial value, `normal`, uses the element's **implicit anchor** when `position-area` is set: a popover opened by a `popovertarget` button (or `showPopover({ source })`) gets that button as its implicit anchor.
3. **Place it**, two ways:
   - `position-area: top` (or `bottom right`, `left span-bottom`, …) picks cells of a 3×3 grid formed by the anchor's edges and the containing block's edges, and makes that area the containing block; `auto` insets and margins become `0`. A single `top` spans the full width and centres on the anchor.
   - `anchor()` in an inset gives a length: `top: anchor(bottom)` puts the box's top at the anchor's bottom. `anchor(--other right, 8px)` names another anchor, with a fallback length.
4. **Size it** with `anchor-size(width)` in sizing properties, margins or insets.
5. **Handle overflow.** `position-try-fallbacks: flip-block, flip-inline` or named `@position-try` rules give alternatives tried in order when the box overflows its inset-modified containing block.

By default (`position-visibility`), the box is hidden once its anchor is scrolled out of view or clipped.

The catch: an anchor must be laid out **before** the positioned box. Roughly, it must sit inside the positioned box's containing block; an anchor in a different `position: relative` card is invisible to it.

Support: Chrome 125, Firefox 147 and Safari 26; the `normal` initial value arrived in Chrome 151, Firefox 151 and Safari 27.

## Example

```html
<style>
  body { margin: 0; }
  .button { position: absolute; left: 300px; width: 100px; height: 40px; }
  #save { top: 300px; anchor-name: --save; }
  #menu { top: 10px; anchor-name: --menu; }
  .tip { position: absolute; width: 60px; height: 20px; }
  #above { position-anchor: --save; position-area: top; }
  #beside { position-anchor: --save; top: anchor(bottom); left: anchor(right); width: anchor-size(width); }
  #flipped { position-anchor: --menu; position-area: top; position-try-fallbacks: flip-block; }
</style>
<div class="button" id="save"></div>
<div class="button" id="menu"></div>
<div class="tip" id="above"></div>
<div class="tip" id="beside"></div>
<div class="tip" id="flipped"></div>
<script>
  for (const tip of document.querySelectorAll(".tip")) {
    const { left, top, width } = tip.getBoundingClientRect();
    console.log(tip.id, left, top, width);
  }
  // → above 320 280 60
  // → beside 400 340 100
  // → flipped 320 50 60
</script>
```

Chrome 156 and Firefox 158 agreed. `above` is centred over `#save` and ends at its top edge (300). `beside` starts at its bottom-right corner and copies its 100px width. `#menu` has only 10px above it, so `flipped` used `flip-block` and went below (10 + 40).

## Pitfalls

- Putting the tooltip in a different containing block. A tip inside its own `position: relative` card couldn't see an anchor in another card and sat at its static position; the same tip as a child of `<body>` anchored correctly.
- Reusing one anchor name in a list. Two rows each with `anchor-name: --row` sent both tooltips to the last row; `anchor-scope: --row` on each row fixed it.
- Expecting fallbacks without asking for them. Without `position-try-fallbacks`, the `#menu` tooltip stayed in the 10px gap above the button, overlapping it by 10px.
- Using `anchor()` outside the inset properties, where it's invalid, or on a box that isn't absolutely positioned, where it resolves to its fallback or makes the declaration invalid at computed-value time.

## Follow-ups

**Q:** How do you anchor a popover to its button without naming anything?
**A:** Give the popover `position-area: bottom` and open it with `popovertarget`. The button becomes its implicit anchor; a 60px popover under a 100px button at `600, 200` landed at `620, 240`, even with the UA's `inset: 0; margin: auto`.

**Q:** What happens if `anchor()` can't find its anchor?
**A:** It uses its fallback argument; with none, the declaration is invalid at computed-value time, so the inset becomes `auto`. `top: anchor(bottom, 7px)` with an unreachable anchor put the box 7px down.

**Q:** Why combine anchor positioning with the top layer?
**A:** The top layer escapes clipping and `z-index`, but its containing block is the viewport, so the box loses its place on the page. Anchor positioning puts it back next to its invoker.

## Exercises

### Where does each tooltip go?

```html
<style>
  body { margin: 0; }
  .card { position: relative; height: 100px; }
  .anchor { anchor-name: --a; margin-left: 200px; width: 100px; height: 40px; }
  .tip { position: absolute; position-anchor: --a; position-area: bottom; width: 60px; height: 20px; }
</style>
<div class="card"><div class="anchor"></div></div>
<div class="card"><div class="tip" id="inside-card"></div></div>
<div class="tip" id="in-body"></div>
<script>
  for (const tip of document.querySelectorAll(".tip")) {
    const { left, top } = tip.getBoundingClientRect();
    console.log(tip.id, left, top);
  }
</script>
```

**Answer:** `inside-card 0 100` and `in-body 220 40`. The first tip's containing block is the second card, which doesn't contain the anchor, so the anchor isn't acceptable and `position-area` has no effect. The second uses the initial containing block, so it centres under the anchor.
