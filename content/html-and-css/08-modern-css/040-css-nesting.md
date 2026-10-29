---
title: "How does native CSS nesting work, and how does it differ from Sass?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [css-nesting, nesting-selector, is, specificity, sass]
related:
  - html-and-css/the-cascade/specificity
  - html-and-css/the-cascade/cascade-sort-order
  - html-and-css/modern-css/scope-at-rule
  - html-and-css/modern-css/has-selector
verified: 2026-10
perishable:
  - "Nesting without & before type selectors: Chrome 120, Safari 17.2"
  - "Nested declarations rule: Chrome 130, Firefox 132, Safari 18.2"
sources:
  - https://drafts.csswg.org/css-nesting-1/#syntax
  - https://drafts.csswg.org/css-nesting-1/#conditionals
  - https://drafts.csswg.org/css-nesting-1/#mixing
  - https://drafts.csswg.org/css-nesting-1/#nest-selector
  - https://drafts.csswg.org/css-nesting-1/#nested-declarations
  - https://drafts.csswg.org/css-nesting-1/#changes
  - https://www.w3.org/TR/selectors-4/#matches
  - https://sass-lang.com/documentation/style-rules/parent-selector/#adding-suffixes
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/Nesting_selector#browser_compatibility
tldr: >
  Style rules can contain style rules and conditional at-rules. A nested selector is relative to
  the parent, and `&` stands for the parent's elements as if written `:is(parent)`. So `&` takes the
  parent list's highest specificity, can't glue strings like Sass's `&__el`, and can't represent
  pseudo-elements. Declarations after nested rules keep their order.
---

## Answer

Native nesting lets a style rule hold other style rules and group rules (`@media`, `@supports`, `@container`, `@layer`, `@scope`):

```css
.card {
  padding: 1rem;
  > h2 { margin: 0; }       /* .card > h2 */
  p { color: gray; }        /* .card p */
  &:hover { outline: 1px solid; }
  .theme-dark & { color: white; }
  @media (width > 40rem) { padding: 2rem; }
}
```

A nested selector is **relative**: without `&` it means "descendant of the parent", and it may start with a combinator. `&` places the parent anywhere in the selector. Starting with a type selector (`p`) works since Chrome 120, Firefox 117 and Safari 17.2.

`&` isn't text substitution. It represents **the elements the parent rule matches**, as if written `:is(<parent selector>)`. Sass concatenates strings at build time instead, which gives three differences:

1. **Specificity.** `:is()` takes its most specific argument. In `#nav, .menu { & a {} }`, the nested rule is (1, 0, 1) even for `.menu a`; Sass emits `#nav a, .menu a`, each with its own specificity.
2. **No suffixes.** Sass's `&__title` builds `.card__title`. In CSS, `&-bar` is invalid and the nested rule is dropped.
3. **Matching.** `.a .b { .c & {} }` is `.c :is(.a .b)`: it matches a `.b` with `.a` and `.c` ancestors in either order. Sass writes `.c .a .b`, which requires that order.

`&` also can't represent pseudo-elements, the same restriction as `:is()`.

**Declarations after nested rules** keep their place, wrapped in a nested declarations rule (Chrome 130, Firefox 132, Safari 18.2); earlier versions moved them to the top. The CSSOM keeps the structure: a nested `p` is a child rule with `selectorText` `& p`.

## Example

```html
<style>
  #nav, .menu {
    & a { color: red; }
  }
  .menu .link { color: green; }

  .a .b {
    .c & { color: blue; }
  }
</style>
<ul class="menu"><li><a class="link" href="#">Link</a></li></ul>
<div class="a"><div class="c"><p class="b">Text</p></div></div>
<script>
  console.log(getComputedStyle(document.querySelector(".link")).color);
  // → rgb(255, 0, 0)
  console.log(getComputedStyle(document.querySelector(".b")).color);
  // → rgb(0, 0, 255)
</script>
```

Chrome 156 and Firefox 159 agreed. Compiled by Sass 1.107, the same source gives `#nav a, .menu a` and `.c .a .b`: the link would be green, since `.menu .link` (0, 2, 0) beats `.menu a` (0, 1, 1), and the paragraph wouldn't be blue.

## Pitfalls

- Porting BEM-style `&__element` and `&--modifier` rules from Sass. CSS drops them without an error; write the full class.
- An ID anywhere in the parent's selector list raising every nested rule to ID specificity.
- Expecting `.foo::before { &:hover {} }` to mean `.foo::before:hover`, as in Sass. `&` can't represent the pseudo-element, so the nested rule matches nothing.
- Nesting deep to mirror the DOM. Each level adds specificity and coupling; nesting doesn't scope anything, which is what `@scope` is for.

## Follow-ups

**Q:** What does `&` mean outside any style rule?
**A:** The same as `:scope`, which in a document stylesheet is the root element: a top-level `& { --top: yes; }` applied to `<html>`.

**Q:** Why define `&` as `:is()` instead of expanding selectors like Sass?
**A:** Expansion multiplies: three levels of three-item lists give 27 selectors. `:is()` keeps one selector, and the spec notes that a single specificity per selector keeps matching fast.

**Q:** Can an at-rule nested in a style rule hold bare declarations?
**A:** Yes. `.box { display: block; @media (width > 100px) { display: flex; } }` worked; the CSSOM showed the inner `display` in a `CSSNestedDeclarations` rule inside the `CSSMediaRule`.

## Exercises

### What colour is the article?

```css
article {
  color: green;
  & { color: blue; }
  color: red;
}
```

**Answer:** Red, `rgb(255, 0, 0)`. `color: red` comes after the nested rule, so it's wrapped in a nested declarations rule that keeps its place; all three have specificity (0, 0, 1), and the last wins. Before the nested declarations change it was hoisted into the first block, and blue won. Chrome 156 and Firefox 159 agreed.
