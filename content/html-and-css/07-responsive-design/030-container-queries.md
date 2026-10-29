---
title: "What are container queries, and how do you establish a container?"
status: draft
difficulty: medium
frequency: 4
core: true
tags: [container-queries, container-type, containment, container-units, style-queries]
related:
  - html-and-css/responsive-design/intrinsic-responsive-layout
  - html-and-css/responsive-design/media-queries
  - html-and-css/responsive-design/viewport-units
  - html-and-css/box-model-and-formatting/intrinsic-sizing
  - html-and-css/modern-css/custom-properties
verified: 2026-10
perishable:
  - "Style queries match custom properties only in Chrome and Firefox"
  - "Scroll-state queries: Chrome 133+, not Firefox or Safari"
sources:
  - https://drafts.csswg.org/css-conditional-5/#container-queries
  - https://drafts.csswg.org/css-conditional-5/#container-type
  - https://drafts.csswg.org/css-conditional-5/#container-name
  - https://drafts.csswg.org/css-conditional-5/#container-rule
  - https://drafts.csswg.org/css-conditional-5/#size-container
  - https://drafts.csswg.org/css-conditional-5/#style-container
  - https://drafts.csswg.org/css-conditional-5/#container-lengths
  - https://www.w3.org/TR/css-contain-3/#containment-inline-size
  - https://www.w3.org/TR/css-contain-3/#container-type
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@container#browser_compatibility
tldr: >
  Container queries style an element by the size of an ancestor instead of the viewport. Mark the
  ancestor with `container-type: inline-size` (optionally named), then write `@container (width >= 400px)`.
  The type applies inline-size containment, so the container can't size from its content's width.
  Elements query their nearest eligible ancestor, never themselves; `cq*` units measure it.
---

## Answer

A media query asks about the viewport; a **container query** asks about an ancestor element. That lets a component adapt to the slot it's placed in: the same card can be stacked in a 300 px sidebar and horizontal in a 600 px column.

Two steps:

1. **Make a query container.** `container-type: inline-size` allows queries on its inline size (width in horizontal writing); `size` allows both axes. `container-name` names it; the shorthand is `container: card-slot / inline-size`.
2. **Query it.** `@container card-slot (width >= 400px) { … }` styles *descendants*. The name is optional; without one, the query uses the nearest ancestor container that supports the features it tests.

The catch is **containment**. A query that could change its container's size would loop: the width triggers a style, the style changes the width. So `container-type: inline-size` applies inline-size containment (plus style containment): the container's inline-axis intrinsic size is computed **as if it had no content**. It must get its width from outside, like a block in normal flow or a grid track. As a shrink-to-fit box, such as an inline-block, a float or a flex item with `flex-basis: auto`, it collapses to `0`.

Other parts:

- **Container units:** `cqw`, `cqh`, `cqi`, `cqb`, `cqmin`, `cqmax` are 1% of the nearest suitable container. With none, they fall back to the small viewport units.
- **Style queries:** `@container style(--variant: compact)` tests a computed value. Every element is a style container by default.
- An element **never queries itself**, so it can't restyle its own container size from its query.

Support: size queries since Chrome 105, Firefox 110, Safari 16.

## Example

```html
<style>
  body { margin: 0; }
  .slot { container: card-slot / inline-size; }
  .card { display: grid; gap: 1rem; }
  @container card-slot (width >= 400px) {
    .card { grid-template-columns: 8rem 1fr; }
  }
  .card h2 { margin: 0; font-size: clamp(1rem, 0.5rem + 3cqi, 2rem); }
</style>
<aside class="slot" style="width: 300px">
  <article class="card"><div class="thumb"></div><h2>Title</h2></article>
</aside>
<main class="slot" style="width: 600px">
  <article class="card"><div class="thumb"></div><h2>Title</h2></article>
</main>
<script>
  for (const card of document.querySelectorAll(".card")) {
    const columns = getComputedStyle(card).gridTemplateColumns;
    const titleSize = getComputedStyle(card.querySelector("h2")).fontSize;
    console.log(card.parentElement.localName, columns, titleSize);
    // → aside 300px 17px
    // → main 128px 456px 26px
  }
</script>
```

Chrome 156 and Firefox 159 agreed, and the result was the same in 320 px and 1000 px viewports. Same markup, two layouts, chosen by the slot.

## Pitfalls

- Putting `container-type: inline-size` on a shrink-to-fit box. An inline-block and a flex item, each holding a line of text, were both `0` px wide.
- Using `container-type: size` without setting a height. The container's block size ignores its content too; it measured `0` px tall.
- Writing `@container` rules for the element that has `container-type`. They query its ancestors; with none, the rule silently doesn't apply.
- Relying on an unnamed query in nested containers. It picks the nearest one, which may be an inner wrapper you didn't mean.

## Follow-ups

**Q:** Why can't the browser just measure the container like a media query measures the viewport?
**A:** The viewport's size doesn't depend on the page, but a box's size depends on its content. Containment cuts that dependency in the queried axis, so applying query results can't change the size that was queried.

**Q:** What does `10cqi` mean with no container?
**A:** 10% of the small viewport width. In a 1000 px desktop viewport with no container, `width: 10cqi` computed to `100px`; inside a 300 px container it was `30px`.

**Q:** Do container queries replace media queries?
**A:** No. Page-level layout, user preferences (`prefers-*`), input type (`hover`, `pointer`) and print styles are about the environment, not an element.

## Deep dive

### How it works

`container-type` does two things. It **marks the element** as a container for size queries, and it **applies containment**: `inline-size` adds style and inline-size containment, `size` adds style and full size containment, and both make the box an independent formatting context. Contain 3, the Candidate Recommendation, also applied layout containment; the current draft of CSS Conditional 5, where container queries now live, dropped it. Chrome 156 and Firefox 159 follow the draft: `fixed` and `absolute` children of a container still positioned against the viewport. Inline-size containment means the box's inline-axis intrinsic sizes are computed as if it were empty, while its block size still grows with content. A normal block's width comes from its containing block, so it rarely notices. Boxes that size from their content, like inline-blocks, floats, absolutely positioned boxes with `width: auto`, and flex items with `flex-basis: auto`, all lose that content.

For each element, the browser picks the **query container** from its ancestors: those that are valid for every feature in the condition (`width` needs `inline-size` or `size`; `height` needs `size`), filtered by name if one is given, nearest first. If none qualifies, the query is *unknown* and its rules don't apply. Several queries can be nested to ask about different containers at once:

```css
@container page (width > 60rem) {
  @container (width < 20rem) {
    .card { flex-direction: column; }
  }
}
```

Container units are evaluated per axis the same way: `cqi` uses the nearest container that accepts inline-size queries, `cqb` the nearest one for block size. They can come from *different* containers. With no eligible container, they use the small viewport size, so `cqi` behaves like `svw` in horizontal writing.

### Edge cases

- **Nearest wins.** With an 800 px container named `page` and an unnamed 300 px container inside it, `@container (width > 500px)` didn't match a paragraph inside both; `@container page (width > 500px)` did.
- **Self-queries don't exist.** A rule `@container (width > 0px) { .self { color: red } }` on an element that is itself the only container left its colour unchanged.
- **Style queries on standard properties.** The spec allows `style(display: flex)`, but in Chrome 156 and Firefox 159 it didn't match a `display: flex` parent, while `style(--variant: compact)` did. Custom-property style queries shipped in Chrome 111, Firefox 151 and Safari 18.
- **Pseudo-elements** query their originating element's ancestors and can't be containers.

### Real-world scenario

A design system ships a `<product-card>` used in a 4-column grid, a carousel, and a checkout sidebar. With media queries, each placement needs page-specific overrides. Instead:

```css
.card-slot { container: card / inline-size; }
@container card (width >= 28rem) {
  .product-card { grid-template-columns: 10rem 1fr; }
}
@container card (width < 16rem) {
  .product-card .price-note { display: none; }
}
.product-card h3 { font-size: clamp(1rem, 0.75rem + 2cqi, 1.5rem); }
```

Each page wraps cards in `.card-slot` (or puts it on grid items, which get their width from the track), and the card adapts wherever it lands. Variants like `compact` can be a custom property queried with `style(--card-variant: compact)` instead of a modifier class passed through every layer.

### Trade-offs

- **Wrapper elements.** The container can't be the element being restyled, so components often need an extra wrapper, or the slot itself becomes the container.
- **Containment side effects.** No shrink-to-fit width; `size` containers need explicit heights. The container is also an independent formatting context, so it contains its floats.
- **Debuggability.** Which ancestor answered a query isn't visible in the CSS; naming containers makes it explicit.
- **Units.** `cqi` scales with the slot, which suits components; for text, combine it with `rem` in `clamp()` so user font settings still apply.
- **Newer features.** Scroll-state queries (`container-type: scroll-state`) are supported in Chrome since 133, not in Firefox or Safari.

## Exercises

### Which container answers?

```html
<style>
  .outer { container-type: inline-size; width: 800px; }
  .inner { container-type: inline-size; width: 300px; }
  @container (width > 500px) { .label { color: green; } }
</style>
<div class="outer"><div class="inner"><p class="label">Hi</p></div></div>
```

**Answer:** The label isn't green. The unnamed query uses the nearest container, `.inner`, which is 300 px wide. Naming the outer one (`container: page / inline-size`) and writing `@container page (width > 500px)` makes it green. Chrome 156 and Firefox 159 agreed.
