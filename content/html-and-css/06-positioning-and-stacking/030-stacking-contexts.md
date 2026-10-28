---
title: "What is a stacking context, and why doesn't `z-index: 9999` always win?"
status: draft
difficulty: hard
frequency: 5
core: true
tags: [z-index, stacking-context, painting-order, isolation, opacity, transform]
related:
  - html-and-css/positioning-and-stacking/position-and-containing-block
  - html-and-css/positioning-and-stacking/transform-breaks-fixed
  - html-and-css/positioning-and-stacking/top-layer
  - html-and-css/positioning-and-stacking/sticky-positioning
verified: 2026-10
sources:
  - https://www.w3.org/TR/CSS2/visuren.html#z-index
  - https://www.w3.org/TR/CSS2/zindex.html#painting-order
  - https://www.w3.org/TR/css-position-3/#stacking
  - https://www.w3.org/TR/css-color-4/#transparency
  - https://www.w3.org/TR/css-transforms-1/#transform-rendering
  - https://www.w3.org/TR/filter-effects-1/#FilterProperty
  - https://www.w3.org/TR/compositing-1/#isolation
  - https://www.w3.org/TR/compositing-1/#mix-blend-mode
  - https://www.w3.org/TR/css-masking-1/#the-clip-path
  - https://www.w3.org/TR/css-contain-2/#containment-paint
  - https://www.w3.org/TR/css-will-change-1/#will-change
  - https://www.w3.org/TR/css-flexbox-1/#painting
tldr: >
  A stacking context is a group painted as one unit: its descendants' `z-index` values are
  compared only with each other, and the whole group takes a single slot in its parent context.
  So `z-index: 9999` inside a context sitting at level 1 still loses to a sibling at level 2.
  Opacity, transforms, filters and positioned `z-index` all create one.
---

## Answer

`z-index` isn't a global ranking. It orders boxes **within one stacking context**, and a stacking context is painted atomically: everything inside it is finished before anything outside it at a higher level is painted.

So the comparison that decides overlap is between the two elements' ancestors that are siblings in the **same** stacking context. If a modal with `z-index: 9999` lives inside a card that forms a stacking context at level `0`, and a toast at `z-index: 2` is a sibling of that card, the toast is above the whole card, modal included. The 9999 only competes with the card's other descendants.

What creates one:

- The root element.
- A positioned box (`relative`/`absolute`) with `z-index` other than `auto`; a flex or grid item with `z-index` other than `auto`, even unpositioned.
- `position: fixed` or `sticky`, always.
- `opacity` below 1; `transform` (and `translate`, `rotate`, `scale`, `perspective`, `transform-style: preserve-3d`) other than `none`; `filter`, `backdrop-filter`, `clip-path`, `mask` other than `none`; `mix-blend-mode` other than `normal`.
- `isolation: isolate`; `contain: layout` or `paint`; `will-change` naming any of those properties.

`z-index` itself only applies to positioned boxes and to flex and grid items; on a static block it computes but does nothing.

To fix a losing overlay, **raise the stacking context, not the child**: give the ancestor that forms the context a higher `z-index`, remove the property that created the context, or move the overlay out of it. Dialogs and popovers solve this structurally with the top layer.

`isolation: isolate` is the deliberate tool: it creates a context with no other side effect, so a component's internal `z-index` values can't leak out and fight the page.

## Example

```html
<style>
  .stage { position: relative; height: 100px; }
  .card { height: 100px; }
  .layer { position: absolute; inset: 0; }
  .modal { z-index: 9999; }
  .toast { z-index: 2; }
  .lifted { transform: translateY(0); }
</style>
<div class="stage">
  <div class="card"><div class="layer modal" id="modal-a"></div></div>
  <div class="layer toast" id="toast-a"></div>
</div>
<div class="stage">
  <div class="card lifted"><div class="layer modal" id="modal-b"></div></div>
  <div class="layer toast" id="toast-b"></div>
</div>
<script>
  for (const stage of document.querySelectorAll(".stage")) {
    const { left, top } = stage.getBoundingClientRect();
    console.log(document.elementFromPoint(left + 10, top + 10).id);
  }
  // → modal-a
  // → toast-b
</script>
```

`elementFromPoint` hit-tests in paint order. In the first stage the plain card creates no context, so `9999` competes with `2` and wins. An identity `transform` on the second card makes it a stacking context at level `0`, and the toast's `2` beats the entire card. Chrome 155 and Firefox 158 agreed.

## Pitfalls

- Raising the child's number. Once the ancestor's context is lower, no child value can escape it; only the ancestor's level matters.
- Forgetting the invisible creators: `opacity: 0.99`, `transform: translateY(0)` (often added to promote a layer), `filter: blur(0)` and `will-change: opacity` all created a context in both test browsers; `opacity: 1` did not.
- Setting `z-index` on a static block element. It computed to `9999` but stacked nothing; on a flex or grid item the same value does stack.
- Confusing `z-index: auto` with `0`. A `position: relative` parent with `auto` let a child's `z-index: 10` beat an outside `1`; with `z-index: 0`, the child was trapped and lost.

## Follow-ups

**Q:** Does `overflow: hidden` create a stacking context?
**A:** No. It clips and creates a scroll container and a block formatting context, but in both test browsers a child's `z-index: 10` still escaped it. `contain: paint` does both clip and create a context.

**Q:** Do container queries' `container-type` values create one?
**A:** No. `size` and `inline-size` apply size and style containment, not layout or paint containment; in Chrome 155 and Firefox 158 a child's `z-index` escaped them.

**Q:** How does a dialog opened with `showModal()` beat every `z-index`?
**A:** It's rendered in the top layer, painted after the whole document in its own ordering, so no `z-index` in the page can compete.

## Deep dive

### How it works

CSS 2's Appendix E defines how a stacking context paints its own subtree, bottom to top:

1. The context element's own background and border (the root's background covers the canvas).
2. Child stacking contexts with **negative** `z-index`, most negative first, then tree order.
3. In-flow, non-positioned block descendants: backgrounds and borders.
4. Non-positioned floats.
5. In-flow inline content: text, inline boxes, replaced elements.
6. Positioned descendants with `z-index: auto` or `0`, and other stacking contexts at level `0` (an `opacity` or `transform` context counts as `0`), in **tree order**.
7. Child stacking contexts with **positive** `z-index`, lowest first, then tree order.

Each child stacking context is painted atomically at its slot by running the same seven steps on its own subtree. That recursion is the whole story: a descendant's `z-index` can only reorder it among steps of its nearest ancestor context.

Step 6 also explains `auto` vs `0`. A positioned box with `z-index: auto` is painted *as if* it were a context, but its positioned descendants and child contexts are hoisted into the parent context and compete there. With `z-index: 0` it's a real context and keeps them.

Every creator in the Answer comes from the spec that defines the property: CSS Color for `opacity`, Transforms for the transform family, Filter Effects for `filter` and `backdrop-filter`, Masking for `clip-path` and `mask`, Compositing for `mix-blend-mode` and `isolation`, Containment for `contain`, Flexbox and Grid for item `z-index`, and Will Change for the hint. They create a context because the effect has to be applied to the subtree as one flattened image: you can't blur or fade half of an interleaved stack.

### Edge cases

A negative `z-index` child goes behind its parent's background only if the parent is **not** a stacking context:

```html
<style>
  .parent { position: relative; width: 100px; height: 100px; background: white; }
  .child { position: absolute; inset: 0; z-index: -1; }
</style>
<div class="parent" id="p1"><div class="child" id="c1"></div></div>
<div class="parent" id="p2" style="z-index: 0"><div class="child" id="c2"></div></div>
<div class="parent" id="p3" style="isolation: isolate"><div class="child" id="c3"></div></div>
<script>
  for (const parent of document.querySelectorAll(".parent")) {
    const { left, top } = parent.getBoundingClientRect();
    console.log(parent.id, document.elementFromPoint(left + 10, top + 10).id);
  }
  // → p1 p1
  // → p2 c2
  // → p3 c3
</script>
```

In `p1`, the child joins the root context at step 2, below `p1`'s step-3 background. In `p2` and `p3`, the parent's background is step 1 of its own context, and the child's step 2 lands above it.

`will-change` creates the context even before the property changes: `will-change: opacity` at `opacity: 1` does it, by design, so the start of an animation doesn't reorder the page.

Hit testing follows paint order, so a transparent stacking context on top swallows clicks. `pointer-events: none` on it lets them through without changing what's painted.

### Real-world scenario

A site header is `position: sticky; z-index: 10`, and its account menu has `z-index: 1000`. A chat widget added later sits at the body level with `z-index: 50`. The menu now opens *under* the chat widget. Inside the header, `1000` is meaningless outside the header's context; the real comparison is header `10` vs widget `50`.

The fixes, best first:

- Render the menu as a `popover` so it enters the top layer and stops depending on any ancestor's context.
- Define page-level layers once (`--z-header`, `--z-overlay`, `--z-toast`) and apply them only to the elements that form contexts at the root.
- Put `isolation: isolate` on self-contained components (cards, carousels) so their internal `z-index` values can't collide with page-level layers.

### Trade-offs

A global `z-index` scale works only if each value sits on an element that's a child of the root context; once a value lands inside a nested context it's silently local. `isolation: isolate` keeps contexts intentional but also makes the element a group for blending, so a `mix-blend-mode` child inside it no longer blends with the page behind.

Creating contexts through `transform` or `will-change` to promote GPU layers changes stacking and containing blocks as a side effect; compositing layers are a separate browser concern from stacking contexts.

## Exercises

### Which element wins?

```html
<style>
  .a { position: relative; z-index: 1; }
  .b { position: absolute; z-index: 100; inset: 0; }
  .c { position: relative; z-index: 2; margin-top: -50px; height: 50px; }
</style>
<div class="a" style="height: 50px"><div class="b" id="b"></div></div>
<div class="c" id="c"></div>
<script>
  const box = document.getElementById("c").getBoundingClientRect();
  console.log(document.elementFromPoint(box.left + 10, box.top + 10).id);
</script>
```

**Answer:** `c`. `.a` forms a context at level 1, so `.b`'s `100` only counts inside `.a`; `.c` at level 2 paints above all of `.a`.
