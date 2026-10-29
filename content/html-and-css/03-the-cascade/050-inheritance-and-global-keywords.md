---
title: "Which properties inherit, and what do `inherit`, `initial`, `unset`, `revert`, and `revert-layer` do?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [inheritance, inherit, initial, unset, revert, revert-layer, all, defaulting]
related:
  - html-and-css/the-cascade/value-stages
  - html-and-css/the-cascade/cascade-layers
  - html-and-css/the-cascade/cascade-sort-order
  - html-and-css/modern-css/custom-properties
verified: 2026-10
perishable:
  - revert-rule is in the css-cascade-5 editor's draft only
  - revert-rule shipped in Chrome 148, Firefox 150, Safari 27
sources:
  - https://www.w3.org/TR/css-cascade-5/#defaulting-keywords
  - https://www.w3.org/TR/css-cascade-5/#initial-values
  - https://www.w3.org/TR/css-cascade-5/#inheriting
  - https://www.w3.org/TR/css-cascade-5/#valdef-all-initial
  - https://www.w3.org/TR/css-cascade-5/#valdef-all-inherit
  - https://www.w3.org/TR/css-cascade-5/#valdef-all-unset
  - https://www.w3.org/TR/css-cascade-5/#valdef-all-revert
  - https://www.w3.org/TR/css-cascade-5/#valdef-all-revert-layer
  - https://www.w3.org/TR/css-cascade-5/#all-shorthand
  - https://drafts.csswg.org/css-cascade-5/#revert-rule-keyword
  - https://www.w3.org/TR/css-color-4/#the-color-property
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/revert-rule#browser_compatibility
tldr: >
  Each property's definition says whether it inherits: text properties like `color`, `font` and
  `line-height` do; box properties like `margin`, `border` and `display` don't. With no declaration,
  inherited properties take the parent's computed value and others their initial value. `inherit`
  and `initial` force one of those, `unset` picks the natural one, `revert` and `revert-layer` roll
  the cascade back.
---

## Answer

When the cascade finds no declaration for a property, **defaulting** supplies one. Every property's definition table has an "Inherited" line:

- **Inherited properties** take the **parent's computed value**. They're mostly about text: `color`, `font-*`, `line-height`, `letter-spacing`, `text-align`, `white-space`, `visibility`, `cursor`, `list-style`. Custom properties inherit too.
- **Everything else** takes its **initial value** from the definition table: `margin`, `padding`, `border`, `background`, `display`, `width`, `position`, `overflow`.

The root element has no parent, so it gets initial values. Inheritance follows the flattened tree: a slotted element inherits from its `<slot>`, not its light-DOM parent.

The CSS-wide keywords work on every property, and in `all`:

- **`inherit`**: use the parent's computed value, even for a property that doesn't normally inherit (`border: inherit`).
- **`initial`**: the property's initial value from the spec. It is **not** the browser's default for that element: `display: initial` on a `<div>` gives `inline`.
- **`unset`**: `inherit` for inherited properties, `initial` for the rest. It's what the property would do with no declaration.
- **`revert`**: roll back to the previous **origin**. In author CSS that means "as if no author rule set this", so it falls back to user styles and then the UA style sheet: `display: revert` on a `<div>` gives `block`.
- **`revert-layer`**: roll back to the previous **cascade layer**, as if this layer had no rule for the property. With no lower layer in the origin, it acts like `revert`.

`all` resets every property except `direction` and `unicode-bidi`, and doesn't touch custom properties. `all: revert` gives back the browser's styling; `all: unset` strips it.

Inheritance passes the **computed** value, which is why `line-height: 1.5` and `line-height: 150%` behave differently: the number is inherited as a number, the percentage as the parent's resolved length.

## Example

```html
<style>
  .parent { display: flow-root; color: rgb(10, 20, 30); }
  div { display: flex; }
  #a { display: initial; } /* the spec's initial value */
  #b { display: unset; }   /* display doesn't inherit → initial */
  #c { display: revert; }  /* no author rules → UA's block */
  #d { display: inherit; } /* parent's computed value */
  #e { color: initial; }   /* initial is CanvasText */
  #f { color: unset; }     /* color inherits → inherit */
</style>
<div class="parent">
  <div id="a"></div><div id="b"></div><div id="c"></div>
  <div id="d"></div><div id="e"></div><div id="f"></div>
</div>
<script>
  for (const id of ["a", "b", "c", "d"]) console.log(getComputedStyle(document.getElementById(id)).display);
  // → inline
  // → inline
  // → block
  // → flow-root
  console.log(getComputedStyle(e).color); // → rgb(0, 0, 0)
  console.log(getComputedStyle(f).color); // → rgb(10, 20, 30)
</script>
```

Chrome 155 and Firefox 158 agreed. Only `revert` gives the `<div>` its usual `block`, because that comes from the UA style sheet, not the property's definition.

## Pitfalls

- Using `initial` to mean "the browser default". It means the spec's initial value; reach for `revert` to get the UA's styling back.
- Inheriting a percentage `line-height`. A `10px` parent with `line-height: 150%` gave a `20px` child `15px`; with `1.5` the child got `30px`, in both browsers.
- Expecting form controls to inherit fonts. The UA style sheet sets their `font`, so a `<button>` stayed `13.3333px` inside a `20px` body until `font: inherit`.
- Using `all: unset` on a `<button>` and losing more than intended: `display` became `inline`, the border `none`, and `font-size` inherited `20px`.

## Follow-ups

**Q:** What does `revert-layer` do in unlayered CSS?
**A:** Unlayered styles are the implicit last layer, so it rolls back to the named layers. An unlayered `a.x { color: revert-layer }` gave green from `@layer base { a { color: green } }` in both browsers.

**Q:** What's `revert-rule`?
**A:** A newer keyword in the css-cascade-5 editor's draft: it rolls back to what would apply if *this rule* didn't exist, typically with `if()`. Shipped in Chrome 148, Firefox 150 and Safari 27. `a.x { color: revert-rule }` fell back to the previous `a.x` rule in both browsers.

**Q:** Does `inherit` copy the parent's declared value?
**A:** No, its computed value. A parent's `2em` or `150%` is already a length when the child inherits it, so the child doesn't re-resolve it against its own font size.

## Exercises

### What colour are the links?

```html
<style>
  @layer base, components;
  @layer base { a { color: green; } }
  @layer components {
    .card a { color: revert-layer; }
    .card a.cta { color: revert; }
  }
</style>
<div class="card">
  <a href="#" id="one">One</a>
  <a href="#" id="two" class="cta">Two</a>
</div>
```

**Answer:** `#one` is `rgb(0, 128, 0)`: `revert-layer` falls back to the `base` layer. `#two` is `rgb(0, 0, 238)`: `revert` ignores every author layer and falls back to the UA's link colour. Chrome 155 and Firefox 158 agreed.
