---
title: "When do vertical margins collapse, and how do you stop it?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [margin-collapsing, margins, block-formatting-context, flow-root, margin-trim]
related:
  - html-and-css/box-model-and-formatting/block-formatting-context
  - html-and-css/box-model-and-formatting/box-model-and-box-sizing
  - html-and-css/box-model-and-formatting/floats-and-clear
  - html-and-css/flexbox-and-grid/flexbox-vs-grid
verified: 2026-10
perishable:
  - "`margin-trim` shipped in Chrome 155 and Safari 16.4, not Firefox"
sources:
  - https://www.w3.org/TR/CSS2/box.html#collapsing-margins
  - https://www.w3.org/TR/css-box-4/#margins
  - https://www.w3.org/TR/css-box-4/#margin-trim-block
  - https://www.w3.org/TR/css-display-3/#independent-formatting-context
  - https://www.w3.org/TR/css-flexbox-1/#item-margins
  - https://www.w3.org/TR/css-grid-2/#item-margins
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/margin-trim#browser_compatibility
tldr: >
  Block-axis margins collapse when they touch with nothing in between: adjacent siblings, a parent
  and its first or last child, and the top and bottom of an empty block. The result is the largest
  positive margin plus the most negative one. Padding, a border, a BFC, clearance, or flex or grid
  layout stops it.
---

## Answer

Margins **collapse** when two or more block-axis margins are **adjoining**: both belong to in-flow block-level boxes in the same block formatting context, and no line box, padding, border or clearance separates them. They then combine into one margin. Horizontal margins never collapse (in vertical writing modes the block axis is horizontal, so those do).

Three situations make margins adjoin:

1. **Adjacent siblings.** One block's `margin-bottom` and the next one's `margin-top`.
2. **Parent and first or last child.** A child's `margin-top` collapses with its parent's when the parent has no top padding or border. The bottom case also needs the parent's height to be `auto`. This is the surprise one: the child's margin appears *outside* the parent, pushing the parent down.
3. **An empty block.** With no content, padding, border or height, its own top and bottom margins collapse together, and can collapse with its neighbours through it.

The arithmetic: take the largest positive margin and add the most negative one. `30px` and `20px` give `30px`; `30px` and `-10px` give `20px`; `-30px` and `-10px` give `-30px`.

To stop it, separate the margins or change the layout:

- `padding` or `border` on the parent (even `1px`);
- make the parent a BFC root: `display: flow-root`. A BFC's children never collapse with it;
- use flex or grid. Their items never collapse with each other or with the container, so `gap` or margins add up;
- `clear`, or inline content (text, `<br>`) between the margins.

Floats, absolutely positioned boxes and inline-blocks never collapse their margins at all. And the root element's margins don't collapse.

## Example

```html
<style>
  div { height: 10px; }
  #a { margin-bottom: 30px; }
  #b { margin-top: 20px; margin-bottom: 30px; }
  #c { margin-top: -10px; }
  #wrap, #bfc { height: auto; }
  .kid { margin-top: 20px; }
  #bfc { display: flow-root; }
</style>
<div id="a"></div>
<div id="b"></div>
<div id="c"></div>
<div id="wrap"><div class="kid"></div></div>
<div id="bfc"><div class="kid"></div></div>
<script>
  const box = (el) => el.getBoundingClientRect();
  const gap = (x, y) => box(y).top - box(x).bottom;
  console.log(gap(a, b), gap(b, c)); // siblings
  console.log(gap(c, wrap), box(wrap.firstChild).top - box(wrap).top);
  console.log(box(bfc.firstChild).top - box(bfc).top);
  // → 30 20
  // → 20 0
  // → 20
</script>
```

`#wrap`'s child margin leaked out: the parent moved down `20px` and the child sits at its top edge. `flow-root` keeps it inside. Chrome 155 and Firefox 158 agreed.

## Pitfalls

- Adding `margin-top` to a heading inside a card and watching the *card* move down. Its margin collapsed through the card's top edge; give the card padding or `display: flow-root`.
- Expecting margins to collapse in a flex column. A `30px` bottom and `20px` top margin gave a `50px` gap; the same in a grid.
- Assuming `min-height` blocks bottom collapsing. CSS 2.2 says it does whenever it's non-zero, but Chrome 155 and Firefox 158 still collapsed a child's `20px` bottom margin through a parent with `min-height: 5px` and `10px` of content. Only a `min-height` that changed the height stopped it.
- Adding margins to both sides of a list item and expecting double spacing. Siblings get the larger of the two, not the sum.

## Follow-ups

**Q:** Do the margins of a `display: flow-root` box itself collapse?
**A:** Yes, with its siblings and its own parent, because the box still takes part in the outer BFC. It only stops its *children's* margins from collapsing with its own.

**Q:** What's `margin-trim`?
**A:** A Box 4 property that drops children's margins where they meet the container's edge. `margin-trim: block` on a block container trimmed the first child's top and last child's bottom margin in Chrome 155 (shipped there and in Safari 16.4); Firefox 158 doesn't support it.

**Q:** Why do people say "margins only in one direction"?
**A:** If every block sets only `margin-block-end` (or uses `gap` in flex and grid), there's never a pair to collapse and the spacing is predictable. Collapsing becomes something you never have to reason about.

## Exercises

### What's the gap between `#a` and `#b`?

```html
<style>
  .box { height: 10px; }
  #a { margin-bottom: 10px; }
  #empty { margin: 20px 0 30px; }
  #b { margin-top: -15px; }
</style>
<div class="box" id="a"></div>
<div id="empty"></div>
<div class="box" id="b"></div>
```

**Answer:** `15px`. The empty `<div>` has no height, padding, border or content, so its margins collapse through it, and all four margins adjoin: the largest positive is `30px`, the most negative `-15px`. Inside a flex column the same markup gave `45px`, the plain sum. Chrome 155 and Firefox 158 agreed.
