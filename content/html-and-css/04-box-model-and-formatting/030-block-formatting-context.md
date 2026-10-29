---
title: "What is a block formatting context, and what creates one?"
status: draft
difficulty: medium
frequency: 4
core: true
tags: [block-formatting-context, bfc, flow-root, floats, margin-collapsing, overflow]
related:
  - html-and-css/box-model-and-formatting/margin-collapsing
  - html-and-css/box-model-and-formatting/floats-and-clear
  - html-and-css/box-model-and-formatting/overflow-and-scroll-containers
  - html-and-css/box-model-and-formatting/display-outer-and-inner
  - html-and-css/responsive-design/container-queries
verified: 2026-10
perishable:
  - "`align-content` on blocks shipped in Chrome 123, Firefox 125, Safari 17.4"
sources:
  - https://www.w3.org/TR/CSS2/visuren.html#block-formatting
  - https://www.w3.org/TR/CSS2/visuren.html#bfc-next-to-float
  - https://www.w3.org/TR/CSS2/visudet.html#root-height
  - https://www.w3.org/TR/css-display-3/#independent-formatting-context
  - https://www.w3.org/TR/css-display-3/#block-formatting-context-root
  - https://www.w3.org/TR/css-display-3/#valdef-display-flow-root
  - https://www.w3.org/TR/css-overflow-3/#valdef-overflow-clip
  - https://www.w3.org/TR/css-contain-2/#containment-layout
  - https://www.w3.org/TR/css-multicol-1/#the-multi-column-model
  - https://www.w3.org/TR/css-align-3/#distribution-block
  - https://www.w3.org/TR/css-conditional-5/#propdef-container-type
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/align-content#browser_compatibility
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/display#browser_compatibility
tldr: >
  A block formatting context is an independent region where block boxes stack and floats live. Its
  root contains its floats, keeps outside floats from overlapping it, and stops its children's
  margins collapsing through it. `display: flow-root` creates one cleanly; so do
  floats, absolute positioning, inline-blocks, table cells, flex and grid items, and `overflow`
  other than `visible` or `clip`.
---

## Answer

A **block formatting context** (BFC) is the layout environment for normal flow: block boxes stack one after another in the block direction, vertical margins between them collapse, and floats are positioned and wrapped around. The box that starts a new one is a **BFC root**, and it isolates what's inside from what's outside, in three ways:

1. **It contains its floats.** An `auto` height grows to the bottom of its floating descendants, so a card with only a floated image doesn't collapse to `0`.
2. **It doesn't overlap outside floats.** Its border box sits beside a float in the same context and narrows to fit, instead of running underneath it.
3. **Margins don't collapse across its edge.** A first child's `margin-top` stays inside the root instead of leaking out through it.

What creates one:

- the root element;
- `display: flow-root`: the purpose-built switch, with no other effect;
- floats and absolutely or fixed positioned boxes;
- inline-blocks, table cells and captions, and `display: table`;
- `overflow` other than `visible` or `clip`, since it makes a scroll container;
- flex and grid items, which always establish an independent formatting context;
- multi-column containers and `column-span: all`;
- `contain: layout`, `paint`, `content` or `strict`, and `container-type: size` or `inline-size`;
- `align-content` other than `normal` on a block container.

Things that **don't**: `position: relative`, `transform`, `opacity`, `z-index`, `isolation` (those affect stacking, not layout), `overflow: clip`, and padding or borders, which stop margin collapsing but don't contain floats.

The classic interview answer is "use `overflow: hidden` to clear floats". It works, but it also clips shadows and focus rings and creates a scroll container. `display: flow-root` is the modern answer.

## Example

```html
<style>
  section { width: 300px; }
  .float { float: left; width: 100px; height: 80px; }
  .kid { margin-top: 20px; height: 10px; }
  .bfc { display: flow-root; }
</style>
<section id="a"><div class="float"></div></section>
<section id="b" class="bfc"><div class="float"></div></section>
<section id="c"><div class="kid"></div></section>
<section id="d" class="bfc"><div class="kid"></div></section>
<section><div class="float"></div><div id="e" class="bfc"></div></section>
<script>
  const y = (el) => el.getBoundingClientRect().top;
  console.log(a.offsetHeight, b.offsetHeight); // floats contained?
  console.log(y(c.firstChild) - y(c), y(d.firstChild) - y(d)); // margin inside?
  console.log(e.offsetWidth); // beside the float, or under it?
  // → 0 80
  // → 0 20
  // → 200
</script>
```

All three effects in one page: `#b` grows to its float, `#d` keeps its child's margin inside, and `#e` narrows to the `200px` beside the float. Chrome 155 and Firefox 158 agreed.

## Pitfalls

- Reaching for `overflow: clip` to contain floats. Unlike `hidden`, it doesn't create a BFC; pair it with `display: flow-root` if you want both.
- Expecting `overflow: hidden` on `<body>` to contain floats. When `<html>` is `overflow: visible`, the body's value propagates to the viewport and the body itself stays non-BFC: its height was `0` around a `100px` float in both browsers.
- Thinking a BFC root's *own* margins stop collapsing. They still collapse with its siblings: a `20px` and a `flow-root` `30px` margin left a `30px` gap.
- Assuming `position: relative` or `z-index` create a BFC. They create containing blocks or stacking contexts, a different mechanism.

## Follow-ups

**Q:** What's an independent formatting context, and how does it relate to a BFC?
**A:** CSS Display 3's general term: a box whose contents are laid out isolated from outside floats and margins. A block container that establishes one establishes a new BFC. Flex and grid containers establish independent flex and grid contexts instead.

**Q:** Why does a block next to a float overlap it, but a BFC root doesn't?
**A:** In a BFC, every block's border edge touches the containing block's edge; only its *line boxes* shorten around floats. CSS 2.2 §9.5 requires a BFC root's border box not to overlap floats in the same context, so the whole box narrows.

**Q:** Does a flex container create a BFC?
**A:** No: it creates a flex formatting context for its items, and each item establishes its own independent context. A `float` on a flex item is ignored, so a flex container around a `100px` "float" is `100px` tall.

## Deep dive

### How it works

A BFC root lays out its in-flow block children top to bottom, collapsing adjacent vertical margins between them, while floats are taken out of flow and placed against the root's edges. Lines in later blocks shorten to wrap around those floats, but the blocks themselves keep their full width. That's normal flow.

The isolation comes from three rules. CSS 2.2 §10.6.7 says a BFC root with `height: auto` includes the bottom margin edge of floats whose bottom is below its content: that's float containment. §9.5 says a BFC root's border box (along with tables and block-level replaced elements) must not overlap the margin box of floats in the *same* BFC: that's float avoidance. And margins collapse only between boxes in the same context, so the root's padding edge is a wall for its children's margins.

CSS Display 3 generalises this as an **independent formatting context**: whatever kind it is, the outside can affect the box only through its own size. A block container that establishes one is said to have a used inner display of `flow-root`.

### Edge cases

- **`overflow: clip` vs `hidden`.** Overflow 3 says `clip` doesn't cause a new formatting context, because it isn't a scroll container. That makes it the right choice for clipping without layout changes.
- **The viewport propagation.** `overflow` on the root, or on `<body>` when the root is `visible`, is applied to the viewport instead. A propagated body value doesn't make the body a BFC.
- **Blockified inline-blocks.** A floated `inline-block` computes to `block`, losing `flow-root`, but the float still makes it a BFC root, so nothing changes in layout.
- **`contain: size` isn't on the list.** Size containment alone didn't stop a child's margin escaping in either browser; layout and paint containment do.
- **`align-content`.** CSS Align 3 says any value other than `normal` on a block container forces an independent formatting context, which is why `align-content: center` on a `<div>` (Chrome 123, Firefox 125, Safari 17.4) also contains floats.

### Real-world scenario

A media object: a floated avatar beside a text column. Without a BFC, the column's background and border run underneath the avatar while only its lines wrap, and long text wraps back under the image. Making the column `display: flow-root` turns it into a clean column next to the float. On the parent, `flow-root` contains the float so the next card starts below it. Two declarations, no clearfix pseudo-element:

```css
.media { display: flow-root; }
.media > img { float: left; margin-right: 1rem; }
.media > .body { display: flow-root; }
```

Today most of these layouts use flex or grid, but floats remain for text wrapping around images, where the BFC rules still apply.

### Trade-offs

Every trigger other than `flow-root` brings baggage: `overflow` clips and creates a scroll container, floats and absolute positioning take the box out of flow, `inline-block` puts it on a line with a baseline gap, `contain` changes painting and sizing assumptions. `flow-root` has shipped since Chrome 58, Firefox 53 and Safari 13, so the old clearfix hack (`::after { content: ""; display: table; clear: both }`) is only needed for browsers before those versions. The cost of a BFC itself is small, but the isolation is real: a child can no longer push its margin outside, which sometimes is exactly the collapse a design relied on.

## Exercises

### How tall is each wrapper?

```html
<style>
  .float { float: left; width: 50px; height: 100px; }
  #a { overflow: clip; }
  #b { overflow: hidden; }
  #c { padding: 1px; }
  #d { display: flex; }
</style>
<div id="a"><div class="float"></div></div>
<div id="b"><div class="float"></div></div>
<div id="c"><div class="float"></div></div>
<div id="d"><div class="float"></div></div>
```

**Answer:** `#a` is `0`: `overflow: clip` doesn't create a BFC. `#b` is `100`: `hidden` does. `#c` is `2`: padding blocks margin collapsing but doesn't contain floats. `#d` is `100`, but not because of a BFC: inside a flex container `float` has no effect, so the child is an ordinary flex item. Chrome 155 and Firefox 158 agreed.
