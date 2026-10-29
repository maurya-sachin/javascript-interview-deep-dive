---
title: "How do custom properties work — cascade, inheritance, fallbacks, and invalid values?"
status: draft
difficulty: medium
frequency: 5
core: true
tags: [custom-properties, var, cascade, inheritance, invalid-at-computed-value-time]
related:
  - html-and-css/the-cascade/cascade-sort-order
  - html-and-css/the-cascade/inheritance-and-global-keywords
  - html-and-css/the-cascade/value-stages
  - html-and-css/modern-css/registered-properties
  - html-and-css/responsive-design/container-queries
verified: 2026-10
sources:
  - https://www.w3.org/TR/css-variables-1/#defining-variables
  - https://www.w3.org/TR/css-variables-1/#guaranteed-invalid
  - https://www.w3.org/TR/css-variables-1/#cycles
  - https://www.w3.org/TR/css-variables-1/#using-variables
  - https://www.w3.org/TR/css-variables-1/#invalid-variables
  - https://www.w3.org/TR/css-variables-1/#invalid-at-computed-value-time
tldr: >
  A custom property (`--name`) is a real property: it cascades, inherits by default, and holds an
  unparsed token list. `var()` substitutes it at computed-value time. The fallback is used only when
  the property is missing or invalid, not when its value is wrong for the target. A wrong value
  makes that declaration act as `unset`, not as the earlier declaration.
---

## Answer

A custom property is any property whose name starts with `--`. It goes through the cascade like `color` does: specificity, layers and source order pick one value per element. Unregistered, it **inherits by default**, so setting `--accent` on a card reaches every descendant. Names are case-sensitive: `--accent` and `--Accent` are two properties.

Its value is just a **token list**. CSS doesn't check it when parsing, because it doesn't know what it will be used for. `--accent: 20px` is valid.

`var(--accent, red)` substitutes that value at **computed-value time**:

- If the custom property has its initial value, the **guaranteed-invalid value** (never set, set to `initial`, or part of a cycle), the fallback is used. With no fallback, the declaration is invalid.
- Otherwise its value is substituted, **even if the result is invalid** for the property using it. The fallback is not a type check.

If the substituted declaration doesn't match the property's grammar, it is **invalid at computed-value time**. By then the cascade has already chosen this declaration and thrown the others away, so the browser can't go back to an earlier valid one. The property behaves as `unset`: inherited properties take the parent's value, others their initial value.

That's the difference from a plain typo. `color: 20px` is dropped at parse time, and an earlier `color` declaration still applies. `color: var(--accent)` with `--accent: 20px` is kept, wins the cascade, and then fails, so the text inherits its colour instead.

One more consequence of computing early: `var()` inside a custom property is resolved **on the element that declares it**, and the result is what inherits. Derived variables on `:root` don't react to overrides further down.

## Example

```html
<style>
  .card { color: blue; --accent: 20px; }
  .fallback-skipped { color: var(--accent, red); }
  .earlier-discarded { color: green; color: var(--accent); }
  .undefined { color: var(--missing, red); }
  .not-inherited { background-color: var(--accent); }
</style>
<div class="card">
  <p class="fallback-skipped">1</p>
  <p class="earlier-discarded">2</p>
  <p class="undefined">3</p>
  <p class="not-inherited">4</p>
</div>
<script>
  const style = (name) => getComputedStyle(document.querySelector(`.${name}`));
  console.log(style("fallback-skipped").color);
  // → rgb(0, 0, 255)
  console.log(style("earlier-discarded").color);
  // → rgb(0, 0, 255)
  console.log(style("undefined").color);
  // → rgb(255, 0, 0)
  console.log(style("not-inherited").backgroundColor);
  // → rgba(0, 0, 0, 0)
</script>
```

Chrome 156 and Firefox 159 agreed. The first two inherit the card's blue; `green` and `red` are never used. `background-color` doesn't inherit, so it falls to its initial `transparent`.

## Pitfalls

- Expecting `var(--x, fallback)` to catch a value of the wrong type. It only catches a missing or invalid `--x`; use `@property` for type checking.
- Writing a fallback declaration before a `var()` one (`color: green; color: var(--x)`). It protects against browsers that can't parse `var()`, not against a bad value.
- Defining `--space: calc(var(--base) * 2)` on `:root` and overriding `--base` on a component. `--space` was already computed at the root; the component inherits `16px`.
- Gluing units to a variable: `var(--gap)px` gives two tokens (`20` and `px`), and the declaration fails. Use `calc(var(--gap) * 1px)`.

## Follow-ups

**Q:** How do you reset a custom property so its fallbacks apply again?
**A:** `--accent: initial`. That sets the guaranteed-invalid value, so `var(--accent, red)` gave red. `--accent: ;` is different: it's a valid empty value, so `color: var(--accent, red)` substituted nothing and inherited blue.

**Q:** Can `var()` be used in a media query or a selector?
**A:** No, only in property values. `@media (width > var(--bp))` was kept in the stylesheet but never matched in Chrome 156 or Firefox 159. Container style queries can test a custom property's value instead.

**Q:** Do custom properties animate?
**A:** Unregistered ones are discrete: a `@keyframes` animation from `--v: a` to `--v: b` read `a` at 499 ms of 1 s and `b` at 500 ms. Registering a type with `@property` makes them interpolate.

## Deep dive

### How it works

The spec defines one property, `--*`: value `<declaration-value>?` (almost any tokens), initial value the guaranteed-invalid value, inherited, computed value "specified value with variables substituted". Each step explains a behaviour:

1. **Parse time.** The declaration is kept as tokens; only unmatched closing brackets, top-level semicolons and a few bad tokens are rejected. A declaration that uses `var()` is also kept without checking, since its final value is unknown.
2. **Cascade.** Each `--*` name is its own property, so the usual sort order decides which declaration wins on each element, `!important` included. The `!important` belongs to the custom property's own cascade; it is not carried into the value.
3. **Computed value of the custom property.** Any `var()` inside it is replaced now, on this element. The result is what children inherit.
4. **Computed value of the using property.** `var()` is replaced by the custom property's computed value, or by the fallback if that is guaranteed-invalid. Only now is the result parsed against the property's grammar. If it fails, the property computes as if it were `unset`.

Substitution is at the **token** level, not text: you can't build a single token, such as `20px`, from two parts.

```html
<style>
  :root { --base: 8px; --space: calc(var(--base) * 2); }
  .dense { --base: 4px; padding: var(--space); }
  .fixed { --base: 4px; --space: calc(var(--base) * 2); padding: var(--space); }
  .x { --gap: 20; margin-top: var(--gap)px; }
  .y { --gap: 20; margin-top: calc(var(--gap) * 1px); }
</style>
<div class="dense">a</div><div class="fixed">b</div>
<p class="x">x</p><p class="y">y</p>
<script>
  const style = (name) => getComputedStyle(document.querySelector(`.${name}`));
  console.log(style("dense").paddingTop);
  // → 16px
  console.log(style("fixed").paddingTop);
  // → 8px
  console.log(style("x").marginTop);
  // → 0px
  console.log(style("y").marginTop);
  // → 20px
</script>
```

`.dense` inherits `--space` already resolved at `:root`: its `getPropertyValue("--space")` returned `calc(8px * 2)`. Redeclaring `--space` where `--base` changes, as `.fixed` does, recomputes it.

### Edge cases

- **Cycles.** `--one: var(--two); --two: var(--one);` on one element makes both guaranteed-invalid, so `width: var(--one, 7px)` used `7px`. There's no way to read the parent's value of the same name: `--x: var(--x)` is a cycle of one, so with `--x: 5px` on the parent, the child's `width: var(--x, 7px)` was `7px`.
- **Empty values.** `--a: ;` is a valid empty value, and `var(--a,)` has a valid empty fallback.
- **CSS-wide keywords.** A custom property can't hold `initial` as a value; `--x: initial` resets the custom property itself. A fallback can: `color: var(--missing, initial)` behaves as `color: initial`.
- **Shorthands.** `margin: var(--m, 4px)` with `--m: 1px 2px` set inline computed to `1px 2px`; one variable can fill several longhands.
- **Whitespace.** Leading and trailing whitespace is trimmed: `--x:   red  ;` read back as `"red"` in both browsers.

### Real-world scenario

A design system exposes tokens on `:root` and lets components override them:

```css
:root { --radius: 8px; --surface: white; }
.button { border-radius: var(--radius); background: var(--surface); }
.toolbar { --radius: 4px; } /* every button inside gets 4px */
```

JavaScript can drive styles the same way: `el.style.setProperty("--x", "9px")` changed the computed `margin` of an element using `var(--x)` immediately, with no class juggling. For values derived from other tokens, declare the derivation where overrides happen (on the component, or on `*` when it must follow every element), not only on `:root`.

### Trade-offs

- **No types.** Errors surface as `unset` at computed-value time, far from the token that caused them. `@property` adds a syntax and a guaranteed initial value.
- **Discrete animation** until registered.
- **Global reach.** A token set on `:root` is visible to every element; `@property` with `inherits: false` keeps one local.
- **Values only.** Not usable in selectors, property names, or media query conditions.

## Exercises

### What margin does the paragraph get?

```html
<style>
  p { margin-top: 10px; --gap: 20; margin-top: var(--gap)px; }
</style>
<p>Text</p>
```

**Answer:** `0px`. The second declaration wins the cascade, so the first is discarded. After substitution it is `20 px` (a number and an identifier), invalid for `margin-top`, so it acts as `unset`: `margin-top` doesn't inherit, so it takes its initial `0`. Chrome 156 and Firefox 159 agreed.
