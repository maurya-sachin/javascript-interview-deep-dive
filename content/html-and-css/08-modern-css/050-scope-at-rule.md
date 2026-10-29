---
title: "What does `@scope` do, and how is scoping proximity different from specificity?"
status: draft
difficulty: hard
frequency: 3
core: false
tags: [scope, scoping-proximity, donut-scope, cascade, specificity]
related:
  - html-and-css/the-cascade/cascade-sort-order
  - html-and-css/the-cascade/specificity
  - html-and-css/the-cascade/cascade-layers
  - html-and-css/modern-css/css-nesting
verified: 2026-10
perishable:
  - "Scope proximity is in the css-cascade-6 editor's draft"
  - "@scope: Chrome 118, Safari 17.4, Firefox 146"
sources:
  - https://drafts.csswg.org/css-cascade-6/#scoped-styles
  - https://drafts.csswg.org/css-cascade-6/#scope-effects
  - https://drafts.csswg.org/css-cascade-6/#scoped-rules
  - https://drafts.csswg.org/css-cascade-6/#scope-limits
  - https://drafts.csswg.org/css-cascade-6/#cascade-proximity
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@scope#browser_compatibility
tldr: >
  `@scope (.card) to (.slot) { … }` limits rules to elements inside a `.card` but not inside its
  `.slot`: a "donut". Inner selectors don't gain the root's specificity. In the cascade, scope
  proximity (fewest hops from root to element) is compared after specificity and before source
  order, so the nearest theme wins ties without any selector tricks.
---

## Answer

`@scope` limits a block of style rules to a subtree:

```css
@scope (.card) to (.slot) {
  p { color: red; }
}
```

- The **scoping root** is each element matching `.card`. Rules match only elements that are the root or its descendants.
- The optional **scoping limit** (`to (.slot)`) cuts holes: a `.slot` inside the card and everything in it are out of scope. That's the "donut", which lets a component style itself without reaching into content slotted into it.
- Inner selectors are **relative to the root**: `p` means `:scope p`. Only the subject must be in scope; `.page :scope p` can still look outside.
- The root's selector adds **no specificity**: `@scope (#hero) { em {} }` is (0, 0, 1) and lost to `div em`. Use `:scope` (0, 1, 0) or `&` (zero, it's `:where(:scope)`) to target the root itself.
- `@scope { … }` with no prelude inside a `<style>` element scopes to that element's parent.

**Scope proximity** is a new cascade step. Between two declarations from rules with different scoping roots, the one whose root is **fewer generational or sibling hops** from the element wins. Unscoped rules count as infinitely far. The step comes **after** specificity and **before** order of appearance:

- Specificity still wins: `@scope (.c2) { p {} }` lost to an unscoped `p.n`.
- With equal specificity, a scoped `p` beat a later unscoped `p`, and the nearer of two theme roots beat the later one.

The draft's own §3.5.1 prose says proximity applies "regardless of specificity", but its cascade criteria list puts it after specificity, and Chrome 156 and Firefox 159 follow the list.

`@scope` isn't encapsulation: outside rules still match inside, and inheritance is unaffected; isolation is Shadow DOM's job.

Support: Chrome 118, Safari 17.4, Firefox 146.

## Example

```html
<style>
  @scope (.light) { a { color: black; } }
  @scope (.dark) { a { color: white; } }
  .light-plain a { color: black; }
  .dark-plain a { color: white; }
  @scope (.card) to (.slot) {
    p { color: red; }
  }
</style>
<div class="dark"><div class="light"><a id="scoped">Link</a></div></div>
<div class="dark-plain"><div class="light-plain"><a id="plain">Link</a></div></div>
<div class="card">
  <p id="card-text">Card</p>
  <div class="slot"><p id="slot-text">Slotted</p></div>
</div>
<script>
  const color = (id) => getComputedStyle(document.getElementById(id)).color;
  console.log(color("scoped"));
  // → rgb(0, 0, 0)
  console.log(color("plain"));
  // → rgb(255, 255, 255)
  console.log(color("card-text"), color("slot-text"));
  // → rgb(255, 0, 0) rgb(0, 0, 0)
</script>
```

Chrome 156 and Firefox 159 agreed. Without `@scope`, `.dark-plain a` wins only because it comes later; with it, the nearer `.light` root wins wherever the rules sit.

## Pitfalls

- Expecting proximity to beat specificity. A more specific rule from a farther root, or with no root, still wins.
- Expecting the root selector's specificity to carry over, as `&` does in nesting. `@scope (#hero) { img {} }` is just (0, 0, 1).
- Forgetting the limit element is excluded too: with `to (.slot)`, a `.slot { }` rule inside the scope doesn't match the slot itself.
- Treating `@scope` as isolation. A global `p { }` with higher specificity, or an inherited `color`, still reaches inside.

## Follow-ups

**Q:** How does `@scope` compare with BEM or CSS Modules?
**A:** Those make every selector unique by name. `@scope` needs a class only on the root and limits, keeps short inner selectors at low specificity, and adds proximity, which naming conventions can't express.

**Q:** Where does proximity sit relative to cascade layers?
**A:** Layers come before specificity, which comes before proximity. A scoped rule in an earlier layer loses to any unlayered rule, however near its root.

**Q:** What does the CSSOM expose?
**A:** A `CSSScopeRule` with `start` and `end`: `@scope (.card) to (.slot)` gave `.card` and `.slot`.

## Exercises

### Which colour does the card get?

```html
<style>
  @scope (.card) { :scope { color: red; } }
  @scope (.card) { & { color: green; } }
  .card { color: blue; }
</style>
<div class="card">Text</div>
```

**Answer:** Red. `:scope` has specificity (0, 1, 0), tying with `.card`; the scoped rule's root is 0 hops away while the unscoped rule is infinitely far, so proximity decides before source order. `&` is `:where(:scope)`, specificity zero, so it loses to `.card` outright. Chrome 156 and Firefox 159 agreed.
