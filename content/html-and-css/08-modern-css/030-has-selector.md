---
title: "What does `:has()` make possible, and what are its limits?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [has, relational-selector, parent-selector, selectors, specificity]
related:
  - html-and-css/the-cascade/specificity
  - html-and-css/modern-css/css-nesting
  - html-and-css/modern-css/feature-queries
verified: 2026-10
perishable:
  - ":has(): Chrome 105, Firefox 121, Safari 15.4"
sources:
  - https://www.w3.org/TR/selectors-4/#relational
  - https://www.w3.org/TR/selectors-4/#relative
  - https://www.w3.org/TR/selectors-4/#specificity-rules
  - https://www.w3.org/TR/selectors-4/#forgiving-selector
  - https://www.w3.org/TR/selectors-4/#changes
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:has#browser_compatibility
tldr: >
  `:has()` matches an element if a relative selector, anchored at it, matches something: a
  descendant (`.card:has(img)`), a child (`:has(> img)`) or a later sibling (`h2:has(+ p)`). That
  gives parent and previous-sibling selection. It can't contain `:has()` or pseudo-elements, its
  argument list is unforgiving, and it takes its most specific argument's specificity.
---

## Answer

Selectors used to look only down and forward: the subject of `.card img` is the image. `:has()` lets the subject depend on what's **around** it. Its argument is a **relative selector**, which starts with an implied or explicit combinator, anchored at the element being tested:

- `.card:has(img)`: a card containing an image anywhere (descendant).
- `.card:has(> img)`: a card with an image child.
- `h2:has(+ p)`: a heading immediately followed by a paragraph, which is **previous-sibling** selection.
- `h2:has(~ .note)`: a heading with any later sibling `.note`.

It works with state, so styles can react to the inside of a component with no JavaScript: `form:has(:invalid)`, `label:has(+ input:invalid)`, `html:has(#dark:checked)`. Quantity queries become simple too: `ul:has(> li:nth-child(4))` matches lists with four or more items.

Limits, all in Selectors 4:

- **No nesting:** `:has()` isn't valid inside `:has()`, even wrapped in `:is()` or `:not()`.
- **No pseudo-elements** inside it, and it can't follow one (`::before:has(a)` is invalid).
- **Unforgiving list:** one unknown selector in `:has(.a, :foo)` makes the whole selector invalid, so the rule is dropped. It was forgiving until a 2022 spec change.
- **Specificity** is that of its most specific argument, like `:is()`: `div:has(#target)` is (1, 0, 1) and beat `div.k.l`.

Order with `:not()` matters: `section:not(:has(h2))` is a section with no `h2`; `section:has(:not(h2))` is a section with any non-`h2` descendant.

`:has()` also works in JavaScript (`querySelectorAll`, `matches`). How engines keep it fast is a browser-internals topic.

Support: Chrome 105, Firefox 121, Safari 15.4.

## Example

```html
<style>
  .card:has(> img) { display: grid; }
  label:has(+ input:invalid) { color: red; }
  ul:has(> li:nth-child(4)) { columns: 2; }
</style>
<div class="card" id="with-image"><img alt=""><p>Text</p></div>
<div class="card" id="text-only"><p>Text</p></div>
<label for="email">Email</label>
<input id="email" type="email" required>
<ul id="short"><li>1</li><li>2</li><li>3</li></ul>
<ul id="long"><li>1</li><li>2</li><li>3</li><li>4</li></ul>
<script>
  const style = (id) => getComputedStyle(document.getElementById(id));
  console.log(style("with-image").display, style("text-only").display);
  // → grid block
  console.log(getComputedStyle(document.querySelector("label")).color);
  // → rgb(255, 0, 0)
  document.getElementById("email").value = "a@b.co";
  console.log(getComputedStyle(document.querySelector("label")).color);
  // → rgb(0, 0, 0)
  console.log(style("short").columnCount, style("long").columnCount);
  // → auto 2
</script>
```

Chrome 156 and Firefox 159 agreed. The label sits **before** the input yet reacts to its validity, and updates as soon as the value changes.

## Pitfalls

- Adding a fallback selector to the list: `:has(.a, :new-thing)` drops the whole rule in browsers that don't know `:new-thing`. Use separate rules, or wrap the arguments in `:is()`, which is forgiving.
- Forgetting the specificity: an ID inside `:has()` counts as an ID, so `:has(#x)` can override component styles unexpectedly. Wrap it in `:where()` to make it zero.
- Writing `.card:has(img)` when you mean a direct child; nested cards make an outer card match too. Use `:has(> img)`.

## Follow-ups

**Q:** How do you test for `:has()` support?
**A:** `@supports selector(:has(a))` in CSS or `CSS.supports("selector(:has(a))")` in JavaScript. Both browsers returned `false` for `selector(:has(:has(a)))`, so the same check catches invalid uses.

**Q:** Can `:has()` appear inside `:is()`?
**A:** Yes: `selector(:is(:has(a)))` was supported. But `:has(:is(:has(a)))` and `:has(:not(:has(a)))` were not, because the inner `:has()` is still inside `:has()`.

**Q:** What does `document.querySelector(":has(:has(a))")` do?
**A:** It throws a `SyntaxError`, like any invalid selector passed to the selectors API.

## Exercises

### Which sections get a yellow background?

```html
<style>
  section:not(:has(h2)) { outline: 1px solid red; }
  section:has(:not(h2)) { background: yellow; }
</style>
<section id="a"><h2>Title</h2><p>Body</p></section>
<section id="b"><h2>Title only</h2></section>
```

**Answer:** Only `#a`: it has a descendant that isn't an `h2` (the `p`). `#b` contains only an `h2`. Neither gets the red outline, since both contain an `h2`. Chrome 156 and Firefox 159 agreed.
