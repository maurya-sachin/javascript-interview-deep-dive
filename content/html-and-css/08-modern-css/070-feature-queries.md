---
title: "How do you ship new CSS safely — forgiving parsing and `@supports`?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [supports, feature-queries, progressive-enhancement, error-recovery, forgiving-selectors]
related:
  - html-and-css/modern-css/has-selector
  - html-and-css/modern-css/custom-properties
  - html-and-css/modern-css/registered-properties
  - html-and-css/the-cascade/cascade-sort-order
verified: 2026-10
perishable:
  - "@supports at-rule(): Chrome 148, Firefox 157, not Safari"
  - "selector(): Chrome 83, Firefox 69, Safari 14.1"
sources:
  - https://www.w3.org/TR/css-syntax-3/#error-handling
  - https://www.w3.org/TR/css-syntax-3/#style-rules
  - https://www.w3.org/TR/selectors-4/#invalid
  - https://www.w3.org/TR/selectors-4/#forgiving-selector
  - https://www.w3.org/TR/selectors-4/#unknown--webkit--pseudo-elements
  - https://www.w3.org/TR/css-conditional-3/#at-supports
  - https://www.w3.org/TR/css-conditional-3/#support-definition
  - https://www.w3.org/TR/css-conditional-4/#at-supports-ext
  - https://www.w3.org/TR/css-conditional-4/#support-definition-ext
  - https://drafts.csswg.org/css-conditional-5/#typedef-supports-at-rule-fn
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@supports#browser_compatibility
tldr: >
  Browsers skip CSS they can't parse at the smallest unit: a declaration, a style rule, or an
  at-rule block. So a fallback declaration before a new one works, but one unknown selector drops
  the whole rule unless it sits in a forgiving `:is()`. `@supports` tests whether a declaration,
  selector or at-rule parses; unknown syntax counts as false.
---

## Answer

CSS is designed so new syntax degrades instead of breaking the page. Error recovery (CSS Syntax 3) throws away the smallest piece it can:

- **A declaration** with an unknown property or value is dropped, up to the next `;`. Earlier declarations in the block still apply, so writing the fallback first works: `width: 100px; width: stretch;`.
- **A style rule** is dropped whole if its selector list is invalid. One unknown pseudo-class in `.a, .b:new-state` drops `.a` too. `:is()` and `:where()` take a **forgiving** list, so `:is(.a, .b:new-state)` keeps `.a`. `:has()` doesn't.
- **An at-rule** the browser doesn't know is skipped with its whole block.

When a change needs several declarations to move together, or the fallback would conflict with the new value, use a **feature query**:

```css
@supports (width: stretch) or (width: -webkit-fill-available) { … }
@supports selector(:has(a)) { … }
```

`@supports` tests whether the browser **accepts** a declaration as it would in a style rule. `selector()` (Conditional 4) tests a selector; newer functions test fonts (`font-tech()`, `font-format()`) and at-rules (`at-rule(@scope)`, Chrome 148 and Firefox 157 only). `and`, `or` and `not` need parentheses, and `and` and `or` can't be mixed without them; an invalid condition drops the whole `@supports` rule. JavaScript has `CSS.supports()`.

Three gotchas:

- **Unknown syntax is false, not invalid.** `@supports not (wobble(3))` is true, so a `not` query matches in browsers that don't understand what it tests.
- **Parsing isn't working.** A buggy or partial implementation still passes, and `(color: var(--x))` is always true because `var()` defers checking.
- **`selector()` is strict.** `selector(:is(:new-state))` is false even though a rule using it would be kept.

The pattern: write the baseline unconditionally, then layer the enhancement with fallback declarations, forgiving selectors, or `@supports`.

## Example

```html
<style>
  .box { width: 100px; width: wobble(3); }
  .a, .b:new-state { color: red; }
  :is(.c, .d:new-state) { color: red; }
  @supports selector(:has(a)) { .e { color: green; } }
  @supports not (wobble(3)) { .f { color: green; } }
</style>
<div class="box"></div>
<p class="a">a</p><p class="c">c</p><p class="e">e</p><p class="f">f</p>
<script>
  const style = (name) => getComputedStyle(document.querySelector(`.${name}`));
  console.log(style("box").width);
  // → 100px
  console.log(style("a").color);
  // → rgb(0, 0, 0)
  console.log(style("c").color);
  // → rgb(255, 0, 0)
  console.log(style("e").color);
  // → rgb(0, 128, 0)
  console.log(style("f").color);
  // → rgb(0, 128, 0)
  console.log(CSS.supports("selector(:is(:new-state))"));
  // → false
</script>
```

Chrome 156 and Firefox 159 agreed on every value. They differed in the CSSOM: Chrome stored the forgiving rule's `selectorText` as `:is(.c)`, while Firefox kept `:is(.c, .d:new-state)`.

## Pitfalls

- Adding a new pseudo-class to an existing selector list. The whole rule disappears in browsers that don't know it; give it its own rule or wrap the list in `:is()`.
- Using `@supports not (new-syntax)` as "old browsers only". Browsers that predate `@supports` itself skip the block, and ones that can't parse the test treat it as false, so `not` makes it true.
- Trusting `@supports (--x: value)` to test a registered type. Custom properties accept almost anything at parse time, so it's true for any value.
- Writing `selector(.a, .b)`. `selector()` takes one complex selector; a list returned `false`.

## Follow-ups

**Q:** Why doesn't an unknown selector just match nothing while the rest of the list applies?
**A:** Selectors 4 keeps the legacy rule: a selector list with an invalid selector is invalid. Forgiving parsing was added only to `:is()` and `:where()`, so wrapping a list in `:is()` opts into it.

**Q:** What happens to unknown `::-webkit-` pseudo-elements?
**A:** For compatibility they're valid but match nothing, so `.d, .e::-webkit-made-up` kept the rule and styled `.d`. `selector(::-webkit-made-up)` still returned `false`.

**Q:** Does an unknown at-rule nested in a style rule break the rule?
**A:** No. In `.g { color: red; @frobnicate { … } background-color: … }` only the at-rule was dropped; both declarations applied.

## Exercises

### Which paragraphs turn green?

```html
<style>
  @supports (display: grid) and (not (display: wobble)) { .x { color: green; } }
  @supports display: grid { .y { color: green; } }
  @supports (display: grid) and (display: flex) or (display: block) { .z { color: green; } }
</style>
<p class="x">x</p><p class="y">y</p><p class="z">z</p>
```

**Answer:** Only `.x`. The second condition lacks parentheses and the third mixes `and` with `or` without grouping; both are invalid, so each `@supports` rule is dropped with its contents (`cssRules.length` was `1`). Chrome 156 and Firefox 159 agreed.
