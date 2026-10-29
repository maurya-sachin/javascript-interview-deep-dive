---
title: "How is specificity calculated, including `:is()`, `:where()`, and `:not()`?"
status: draft
difficulty: medium
frequency: 5
core: true
tags: [specificity, selectors, is, where, not, has, cascade]
related:
  - html-and-css/the-cascade/cascade-sort-order
  - html-and-css/the-cascade/cascade-layers
  - html-and-css/modern-css/has-selector
  - html-and-css/modern-css/css-nesting
verified: 2026-10
perishable:
  - Chrome 155 clamps each specificity component at 255
  - Firefox 158 clamps each specificity component at 1023
sources:
  - https://www.w3.org/TR/selectors-4/#specificity-rules
  - https://www.w3.org/TR/selectors-4/#matches
  - https://www.w3.org/TR/selectors-4/#zero-matches
  - https://www.w3.org/TR/selectors-4/#negation
  - https://www.w3.org/TR/selectors-4/#relational
  - https://www.w3.org/TR/css-style-attr/#interpret
  - https://www.w3.org/TR/css-cascade-5/#cascade-sort
tldr: >
  Specificity is a triple (A, B, C): A counts IDs; B counts classes, attribute selectors and
  pseudo-classes; C counts type selectors and pseudo-elements. Compare A first, then B, then C;
  `*` and combinators add nothing. `:is()`, `:not()` and `:has()` take their most specific argument,
  `:where()` is always zero, and inline styles don't use specificity at all.
---

## Answer

Specificity is how the cascade ranks two declarations that tie on origin, context, inline attachment and layer. Selectors Level 4 computes it as a triple:

- **A**: ID selectors (`#nav`).
- **B**: class selectors (`.btn`), attribute selectors (`[type=text]`) and pseudo-classes (`:hover`).
- **C**: type selectors (`a`) and pseudo-elements (`::before`).

The universal selector `*` and combinators (` `, `>`, `+`, `~`) count nothing. Compare A first; only on a tie compare B, then C. So `#a` (1,0,0) beats `.a.b.c.d.e.f.g.h.i.j.k` (0,11,0): there is no carrying from B into A. Repeating a selector counts again, so `.btn.btn` is (0,2,0).

The functional pseudo-classes are special:

- **`:is()`, `:not()` and `:has()`** take the specificity of the **most specific** selector in their argument, whichever one matched. `:is(#nav, .menu) a` is (1,0,1) even on an element that only matches through `.menu`.
- **`:where()`** is always (0,0,0), whatever it contains. That makes it the tool for overridable defaults.
- **`:nth-child(An+B of S)`** counts as one pseudo-class plus the most specific selector in `S`.

A selector list on a rule is different: `#x, p` gives each element the specificity of the most specific selector *that matched it*, so a `<p>` gets (0,0,1).

The `style` attribute isn't compared by specificity. The 2013 CSS Style Attributes spec phrased it as "higher than any selector"; Cascade Level 5 makes it a separate cascade step, element-attached styles, decided before layers and specificity.

Specificity only breaks ties. A declaration in a later layer, an `!important` one, or one in a different origin wins without specificity being looked at.

## Example

```html
<style>
  :is(#nav, .menu) a { color: red; }     /* (1,0,1) */
  .menu .link { color: green; }          /* (0,2,0): loses */

  :where(#side, .list) a { color: red; } /* (0,0,1) */
  .list .link { color: green; }          /* (0,2,0): wins */
</style>
<ul class="menu"><li><a href="#" class="link" id="one">One</a></li></ul>
<ul class="list"><li><a href="#" class="link" id="two">Two</a></li></ul>
<script>
  console.log(getComputedStyle(one).color); // → rgb(255, 0, 0)
  console.log(getComputedStyle(two).color); // → rgb(0, 128, 0)
</script>
```

Chrome 155 and Firefox 158 agreed. Neither list has `#nav` or `#side`; only the `:is()` one still carries the ID's weight.

## Pitfalls

- Thinking `:is()` counts only the argument that matched. It always takes the most specific one, so a stray ID inside `:is()` raises the weight of every match.
- Forgetting that `:not(.a)` counts: `p:not(.a)` is (0,1,1), not (0,0,1). Only `:where()` is free.
- Adding up specificity as a decimal number. Eleven classes never beat one ID; the components are compared one at a time.
- Reaching for more specificity to beat a library. If the library's rule sits in a lower `@layer`, layer order decides first; if it uses `!important`, specificity is never reached.

## Follow-ups

**Q:** Does the `*` in `* > p` add anything?
**A:** No. The universal selector and all combinators are ignored, so `* > p` and `p` are both (0,0,1), and the later rule wins a tie.

**Q:** What's the specificity of `:has(.k, #nope)` when only `.k` matches?
**A:** (1,0,0), from `#nope`. In both browsers it beat a later (0,2,1) rule on the same element.

**Q:** How do pseudo-elements count?
**A:** Like type selectors, in C: `a::before` is (0,0,2). Legacy single-colon forms such as `:before` count the same way.

## Deep dive

### How it works

Selectors Level 4, section 15, defines specificity per selector, per element. Count A, B and C over the simple selectors, ignoring `*`. Comparison is lexicographic: larger A wins; then larger B; then larger C; if all three tie, the specificities are equal and the cascade falls through to scope proximity and then order of appearance.

The cascade (Cascade Level 5, "Specificity" step) gives every declaration the specificity of the style rule it appears in. With a selector list, `h1, .title, #main { … }`, each element gets the highest specificity among the list's selectors that match it. That's the one place where *matching* matters.

Inside `:is()`, `:not()` and `:has()`, matching doesn't matter. The pseudo-class is replaced by the most specific complex selector in its argument list. The spec's examples:

```css
:is(em, #foo)            /* (1,0,0) on <em>, <p id=foo> or <em id=foo> */
.qux:where(em, #foo#bar) /* (0,1,0): only .qux counts */
:nth-child(even of li, .item) /* (0,2,0): one pseudo-class + .item */
:not(em, strong#foo)     /* (1,0,1) on any element */
.foo :is(.bar, #baz)     /* (1,1,0) */
```

`:has()` follows the same rule as `:is()` and `:not()`: its relative selectors count, so `li:has(> a.active)` is (0,1,2).

### Edge cases

**Large counts.** The spec lets engines limit A, B and C but requires clamping, not overflow. Probing with long chains of `.q`:

- Chrome 155 treated 256 classes and 255 classes as equal (the later rule won), so it clamps at 255.
- Firefox 158 let 1023 classes beat 1022 but treated 1024 and 1023 as equal, so it clamps at 1023.
- In both, one ID beat 1024 classes: the clamp stays within its component.

```html
<style>
  #big { color: green; }
  .q.q.q.q /* …repeated 1024 times */ { color: red; }
</style>
<p id="big" class="q">Still green</p>
```

**Selector lists vs `:is()`.** `#nope, x-a { … }` gives an `<x-a>` (0,0,1), and `.s1` beat it. Rewrite it as `:is(#nope, x-a)` and it's (1,0,0).

**Equal-looking specificities.** `.x.x` and `.x.y` are both (0,2,0); the later rule won in both browsers, as did `x-a:nth-child(1 of .z)` against `x-a.z.z2`, both (0,2,1).

**Nesting.** A nested rule's `&` has its own specificity rules; see the CSS nesting question.

### Real-world scenario

A design system ships component styles wrapped in `:where()`: `:where(.btn) { padding: 8px 16px; }`. Every app selector, even a bare `button`, outranks it, so consumers override without `!important` or doubled classes. The opposite mistake is common in reset styles: `:is(h1, h2, #content h3)` gives every heading (1,0,1), and later utility classes stop working.

Within one layer, a specificity budget keeps CSS predictable: single classes for components, `:where()` for defaults, IDs only as fragment targets. Conflicts between groups of styles are better handled with `@layer` than with selector weight.

### Trade-offs

`:is()` shortens long selector lists but inherits its heaviest argument's weight; `:where()` is weightless but can't be used to win a conflict. Doubling a class (`.btn.btn`) is a legal, explicit way to add weight, but it hides intent; a layer says the same thing more clearly. IDs in selectors give (1,0,0) and are hard to override without another ID, which is why most style guides avoid them.

## Exercises

### Compute the specificity

```css
#nav li:not(.active, #x) > a::before { content: "→"; }
```

**Answer:** (2,0,3). A: `#nav` plus `#x`, because `:not()` takes its most specific argument. B: none, since `:not()` is replaced by `#x` rather than counting as a pseudo-class. C: `li`, `a` and `::before`. In Chrome 155 and Firefox 158 it tied with `#nav #z li a::before` (the later rule won in either order) and beat `#nav #z a::before`.
