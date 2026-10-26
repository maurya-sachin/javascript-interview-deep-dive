---
title: "How does the cascade decide which declaration wins?"
status: draft
difficulty: medium
frequency: 5
core: true
tags: [cascade, origin, important, cascade-layers, specificity, style-attribute, scope]
related:
  - html-and-css/the-cascade/specificity
  - html-and-css/the-cascade/cascade-layers
  - html-and-css/the-cascade/important-reverses-order
  - html-and-css/the-cascade/value-stages
  - html-and-css/modern-css/scope-at-rule
verified: 2026-10
perishable:
  - Scope proximity is in the css-cascade-6 editor's draft
  - "@scope shipped in Chrome 118, Safari 17.4, Firefox 146"
sources:
  - https://www.w3.org/TR/css-cascade-5/#filtering
  - https://www.w3.org/TR/css-cascade-5/#cascade-sort
  - https://www.w3.org/TR/css-cascade-5/#cascading-origins
  - https://www.w3.org/TR/css-cascade-5/#preshint
  - https://www.w3.org/TR/css-cascade-5/#cascaded
  - https://drafts.csswg.org/css-cascade-6/#cascade-sort
  - https://drafts.csswg.org/css-cascade-6/#cascade-proximity
  - https://www.w3.org/TR/selectors-4/#specificity-rules
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@scope#browser_compatibility
tldr: >
  For each property on each element, the cascade sorts every matching declaration by a fixed list of
  criteria: origin and importance, shadow-tree context, inline `style`, cascade layer, specificity,
  scope proximity, then order of appearance. The first criterion that differs decides; later ones
  only break ties. Specificity therefore never beats a layer, and source order is the last resort.
---

## Answer

The cascade runs per property, per element. It collects every declaration that applies (from style sheets that apply, inside true conditions, with a matching selector, and syntactically valid; invalid ones are dropped before the cascade sees them), sorts them, and the first one becomes the **cascaded value**. The sort criteria, in descending priority, are:

1. **Origin and importance.** From strongest: transitions, important user-agent, important user, important author, animations, normal author, normal user, normal user-agent.
2. **Context.** Between a shadow tree and the tree around it, the outer context wins for normal declarations and the inner one wins for `!important`.
3. **Element-attached styles.** A `style` attribute beats any selector-based declaration of the same importance.
4. **Layers.** Normal declarations in a later `@layer` win; unlayered styles form an implicit last layer, so they beat every named layer. For `!important`, the order flips.
5. **Specificity.** The (A, B, C) count of the rule's selector.
6. **Scope proximity.** Between `@scope` rules with different roots, the one whose root is fewer hops from the element wins. This step is in the Level 6 draft.
7. **Order of appearance.** The last declaration in document order wins.

The point interviewers want: a criterion matters only when every earlier one ties. Specificity is compared only between declarations from the same origin, context, attachment and layer. That's why an ID selector in `@layer base` loses to a bare `h1` outside any layer, and why `style="…"` beats any normal rule, whatever its specificity.

The cascade also works on longhands. `margin: 0` is `margin-top`, `margin-right` and so on, and each longhand cascades on its own with its rule's specificity.

When no declaration applies, there is no cascaded value. Defaulting then fills in an inherited or initial value.

## Example

```html
<style>
  @layer base {
    #title { color: red; }   /* ID, but inside a layer */
  }
  h1.title { color: green; } /* unlayered, (0,1,1) */
  .title { color: orange; }  /* later, but (0,1,0) */
  #note { color: red; }      /* (1,0,0) */
</style>
<h1 id="title" class="title">Title</h1>
<p id="note" style="color: green">Note</p>
<script>
  console.log(getComputedStyle(title).color); // → rgb(0, 128, 0)
  console.log(getComputedStyle(note).color);  // → rgb(0, 128, 0)
</script>
```

Chrome 155 and Firefox 158 agreed. `#title` loses at the layer step; `.title` loses at specificity; `#note` loses to the `style` attribute before specificity is compared.

## Pitfalls

- Treating specificity as the whole cascade. Origin, context, inline style and layers are all decided first.
- Expecting `!important` to "add specificity". It moves the declaration to a different origin band, where layer order is reversed.
- Assuming a later shorthand resets an earlier longhand. `.m { margin: 0 }` lost to an earlier `#m { margin-top: 10px }` in both browsers: `margin-top` stayed `10px`, because the ID rule is more specific.
- Thinking a typo "falls through" to the next value in the same rule. `color: bluish` is invalid, dropped at parse time, and the next-best declaration from any rule wins.

## Follow-ups

**Q:** Where do presentational attributes like `<font color>` fit?
**A:** HTML hints enter a special author presentational hint origin between the user and author origins. Any author rule beats them: `* { color: blue }` overrode `<font color="red">` in Chrome 155 and Firefox 158.

**Q:** Does scope proximity beat specificity?
**A:** No. In the Level 6 draft it comes after specificity. A more specific rule from a farther `@scope` root still wins; proximity only breaks specificity ties.

**Q:** How are two `<link>` style sheets ordered?
**A:** As if concatenated in linking order, with `@import`ed sheets substituted in place of their `@import` rule. Declarations in `style` attributes come after all style sheets.

## Deep dive

### How it works

CSS Cascading and Inheritance Level 5 describes value processing as a pipeline. **Filtering** finds the declarations that apply to an element: the style sheet must apply to the document, any conditional rule (`@media`, `@supports`) must be true, the selector must match, and the declaration must be syntactically valid. Those form the list of **declared values** for each property.

The **cascade** sorts that list. The spec's criteria are lexicographic, like sorting strings: compare by the first criterion; only on a tie look at the second, and so on. The output is a sorted list; its first entry is the cascaded value. Defaulting, inheritance and computation happen afterwards (see the value-stages question).

The **origin and importance** step uses this order, strongest first:

1. Transition declarations
2. Important user-agent declarations
3. Important user declarations
4. Important author declarations
5. Animation declarations
6. Normal author declarations
7. Normal user declarations
8. Normal user-agent declarations

Normal declarations go author > user > UA; important ones run the other way. Animations sit above all normal declarations but below every `!important` one, and a running transition beats everything.

**Context** handles shadow DOM: a component's normal styles are defaults the page can override; its `!important` styles are requirements the page can't. Tree contexts are ordered in shadow-including tree order.

**Element-attached styles** (the `style` attribute) win over selector-based rules of the same importance. This step comes before layers, so inline styles are not "in" any layer.

**Layers** split one origin into ordered sublayers. Unlayered declarations go into an implicit final layer, so they win over every named layer for normal declarations.

**Specificity** compares the selectors' (A, B, C) triples. Scope proximity, in the css-cascade-6 editor's draft, then compares the number of generational or sibling hops between each `@scope` root and the element; rules without a scope root count as infinitely far. Finally **order of appearance** takes the last declaration.

### Edge cases

Scope proximity runs after specificity. Here the farther scope wins because its selector is more specific:

```html
<style>
  @scope (.outer) { span.x { color: blue; } } /* (0,1,1) */
  @scope (.inner) { span { color: green; } }  /* (0,0,1), nearer */
</style>
<div class="outer"><div class="inner"><span class="x" id="s">s</span></div></div>
<script>
  console.log(getComputedStyle(s).color); // → rgb(0, 0, 255)
</script>
```

Chrome 155 and Firefox 158 agreed; with equal selectors, the nearer `.inner` root won in both, regardless of source order.

Other cases worth knowing:

- **Presentational hints.** HTML attributes such as `bgcolor` are translated to CSS in an author presentational hint origin, between user and author. They lose to any author rule, even `*`, but beat normal user styles.
- **Inline `!important` vs layered `!important`.** Element attachment is compared before layers, so `style="color: green !important"` beat an unlayered `#d { color: red !important }` in both browsers.
- **Order of appearance.** `@import`ed sheets count as if pasted in place; independently linked sheets are concatenated in link order; `style` attributes come after every style sheet, in element document order.

### Real-world scenario

A team wraps a third-party component library in `@layer vendor` and writes their own styles unlayered. Their `.button { padding: 0 }` now beats the vendor's `.lib .lib-button:not(.x)` without a specificity fight, because the layer step decides before specificity is looked at. The same team then finds that an `!important` inside the vendor layer beats their own `!important`. That's the important-layer reversal, and the fix is to drop their `!important`, not to add more.

When debugging "why doesn't my rule apply", walk the criteria in order: is the winning declaration from a transition or animation, is either one `!important`, is one inline, which layers are they in, and only then compare specificity and source order.

### Trade-offs

The fixed order gives authors coarse controls (origins, layers, inline styles) and fine ones (specificity, order). Coarse controls are predictable: a layer order declared once at the top of the CSS decides conflicts across a whole codebase. Specificity is fine-grained but couples conflict resolution to selector shape, so refactoring a selector can change which rule wins. Modern guidance is to resolve conflicts with layers and keep selectors flat, using `!important` only for values that must never be overridden.

## Exercises

### Which colour wins?

```html
<style>
  @layer a, b;
  @layer b { p { color: green; } }
  @layer a { #x.y { color: red; } }
  p { color: inherit; }
</style>
<div style="color: blue"><p id="x" class="y">?</p></div>
```

**Answer:** `rgb(0, 0, 255)`. The unlayered `p { color: inherit }` beats both layers, so the paragraph inherits blue. Without it, layer `b` (declared later) would win over `a` despite `#x.y`'s higher specificity, giving green. Chrome 155 and Firefox 158 agreed.
