---
title: "How do `data-*`, `hidden`, and other global and boolean attributes behave?"
status: draft
difficulty: easy
frequency: 2
core: false
tags: [global-attributes, data-attributes, dataset, hidden, until-found, boolean-attributes]
related:
  - html-and-css/forms-dialog-popover/details-and-summary
  - html-and-css/forms-dialog-popover/popover-attribute
  - html-and-css/documents-and-semantics/semantic-elements
verified: 2026-10
perishable:
  - hidden=until-found support checked in Chrome 155 and Firefox 158
sources:
  - https://html.spec.whatwg.org/multipage/dom.html#global-attributes
  - https://html.spec.whatwg.org/multipage/dom.html#embedding-custom-non-visible-data-with-the-data-*-attributes
  - https://html.spec.whatwg.org/multipage/dom.html#dom-dataset
  - https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#boolean-attributes
  - https://html.spec.whatwg.org/multipage/interaction.html#the-hidden-attribute
  - https://html.spec.whatwg.org/multipage/interaction.html#ancestor-revealing-algorithm
  - https://html.spec.whatwg.org/multipage/rendering.html#hidden-elements
tldr: >
  Global attributes (`id`, `class`, `lang`, `title`, `hidden`, `tabindex`, `data-*`…) work on every
  element. A boolean attribute is true when present, whatever its value, so `disabled="false"`
  disables. `hidden` is a UA `display: none` that author CSS can override; `hidden="until-found"`
  stays searchable. `data-*` values are strings exposed through camel-cased `dataset` keys.
---

## Answer

**Global attributes** are allowed on every HTML element: `accesskey`, `autofocus`, `contenteditable`, `dir`, `draggable`, `hidden`, `inert`, `lang`, `nonce`, `popover`, `spellcheck`, `style`, `tabindex`, `title`, `translate` and more, plus `id`, `class` and `slot` from DOM, event handler attributes, and any `data-*` attribute.

**Boolean attributes** (`disabled`, `checked`, `required`, `inert`, `open`…) are true when present and false when absent. The value doesn't matter: `disabled="false"` still disables. A valid value is the empty string or the attribute's own name. To turn one off, remove it (`removeAttribute`, or set the IDL property to `false`). Don't confuse them with **enumerated** attributes like `contenteditable`, `spellcheck` and `draggable`, where `"false"` is a real keyword.

**`hidden`** is now enumerated: `hidden`, `""` or any invalid value means *Hidden*, and `until-found` means *Hidden Until Found*. Hidden content isn't rendered, and the standard implements that through the UA stylesheet, `[hidden]:not([hidden=until-found i]) { display: none }`. Any author `display` rule beats a UA rule, so `.row { display: flex }` makes a hidden row visible again. `until-found` uses `content-visibility: hidden` instead, so find-in-page and fragment navigation can reach the content: the browser fires `beforematch` and removes the attribute before scrolling to it.

**`data-*`** attributes hold private data for the page's own scripts. Names must have something after `data-`, and the parser lowercases attribute names, so `data-userId` becomes `data-userid`. `element.dataset` maps `data-product-id` to `dataset.productId`; values are always strings, writing `dataset.orderCount = 3` creates `data-order-count="3"`, and `delete` removes the attribute. They are not for metadata meant for other software; that's what microdata or a standard attribute is for.

## Example

```html
<!DOCTYPE html>
<style>.row { display: flex; }</style>
<input id="age" disabled="false">
<div id="panel" class="row" hidden>Still visible</div>
<button id="buy" data-product-id="7" data-userId="9">Buy</button>
<script>
  const age = document.getElementById("age");
  const panel = document.getElementById("panel");
  const buy = document.getElementById("buy");

  console.log(age.disabled); // → true
  console.log(panel.hidden, getComputedStyle(panel).display); // → true flex

  console.log(buy.dataset.productId, typeof buy.dataset.productId); // → 7 string
  console.log(buy.dataset.userid); // → 9
  buy.dataset.orderCount = 3;
  console.log(buy.getAttribute("data-order-count")); // → 3

  age.disabled = false;
  console.log(age.hasAttribute("disabled")); // → false
  panel.setAttribute("hidden", false);
  console.log(panel.getAttribute("hidden"), panel.hidden); // → false true
</script>
```

Chrome 155 and Firefox 158 printed the same.

## Pitfalls

- Writing `disabled="false"` in a template or calling `setAttribute("hidden", false)`. Any value counts as present; set the IDL property or remove the attribute.
- Giving a `hidden` element a class with `display: flex`. Add `[hidden] { display: none !important; }` to your base styles, or never set `display` on elements you toggle with `hidden`.
- Reading `data-*` values as numbers or booleans. `dataset.productId` was the string `"7"`; parse it.
- Using camelCase in the attribute name. `data-userId` is stored as `data-userid`, so the key is `dataset.userid`, not `dataset.userId`.

## Follow-ups

**Q:** `hidden` or `display: none`?
**A:** `hidden` says the content isn't relevant right now and works without your CSS loaded; a class with `display: none` is purely presentational. In Chrome 155 both, and `until-found` content too, were absent from the accessibility tree. Use `hidden="until-found"` for collapsed sections people should still find with Ctrl+F.

**Q:** Should I style with `[data-state="open"]` selectors?
**A:** It's a fine pattern for state your script owns, since the selector and the `dataset` value stay in one place. Prefer a native attribute or pseudo-class (`[open]`, `:checked`, `:disabled`) when one exists.

## Exercises

### What does this log?

```html
<div id="faq" hidden="until-found">
  <h2 id="refunds">Refunds</h2>
</div>
<script>
  const faq = document.getElementById("faq");
  faq.addEventListener("beforematch", () => console.log("beforematch"));
  console.log(getComputedStyle(faq).contentVisibility);
  location.hash = "#refunds";
  requestAnimationFrame(() => console.log(faq.hasAttribute("hidden")));
</script>
```

**Answer:** `hidden`, then `beforematch`, then `false`. `until-found` hides with `content-visibility: hidden`; navigating to a fragment inside it runs the ancestor revealing algorithm, which fires `beforematch` and removes the `hidden` attribute. Chrome 155 and Firefox 158 printed the same.
