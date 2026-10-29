---
title: "What does `@property` add over a plain custom property?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [at-property, custom-properties, houdini, animation, registerproperty]
related:
  - html-and-css/modern-css/custom-properties
  - html-and-css/the-cascade/value-stages
  - html-and-css/typography-colour-motion/transitions-and-discrete-properties
  - html-and-css/typography-colour-motion/keyframe-animations
verified: 2026-10
perishable:
  - "@property: Chrome 85, Firefox 128, Safari 16.4"
  - "Editor's draft dropped the typed var() fallback rule"
sources:
  - https://www.w3.org/TR/css-properties-values-api-1/#at-property-rule
  - https://www.w3.org/TR/css-properties-values-api-1/#initial-value-descriptor
  - https://www.w3.org/TR/css-properties-values-api-1/#computationally-independent
  - https://www.w3.org/TR/css-properties-values-api-1/#parsing-custom-properties
  - https://www.w3.org/TR/css-properties-values-api-1/#calculation-of-computed-values
  - https://www.w3.org/TR/css-properties-values-api-1/#animation-behavior-of-custom-properties
  - https://www.w3.org/TR/css-properties-values-api-1/#conditional-rules
  - https://www.w3.org/TR/css-properties-values-api-1/#shadow-dom
  - https://drafts.css-houdini.org/css-properties-values-api-1/#substitution
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@property#browser_compatibility
tldr: >
  `@property` registers a custom property with a `syntax`, an `inherits` flag and an
  `initial-value`. The type lets it interpolate in transitions and animations, computes it to a
  canonical value like `80px`, and makes a wrong-typed value fall back to the property's own
  inherited or initial value. `inherits: false` stops it reaching descendants.
---

## Answer

A plain custom property is an untyped token list that inherits everywhere and starts as the guaranteed-invalid value. `@property` turns it into something close to a built-in property:

```css
@property --angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}
```

What that buys:

- **Animation.** Transitions and keyframes interpolate it by its type. Unregistered, `--angle` from `0deg` to `360deg` is discrete; registered, it passes through `90deg`. That's how you animate a gradient angle or a colour stop, which can't be animated directly.
- **A computed type.** `--x: 8em` with `font-size: 10px` computes to `80px`, so children inherit a length, not tokens to re-resolve.
- **A real initial value.** The property is never guaranteed-invalid, so a `var()` fallback never applies: with `initial-value: 4px` and nothing set, `var(--size, 99px)` gave `4px`.
- **Control of inheritance.** With `inherits: false`, a value set on a parent doesn't reach its children; they get the initial value.
- **Type checking, late.** The syntax is checked at computed-value time, not parse time: a wrong value still wins the cascade, then makes the custom property itself act as `unset`. Its inherited or initial value is substituted, so the property using it gets a valid value.

The rule is strict. `syntax` and `inherits` are required; `initial-value` is required unless the syntax is `"*"`, and it must be **computationally independent**: `1em` or `var(--x)` are rejected. An invalid rule is dropped whole, and the property stays unregistered.

Registrations are document-global, even from a shadow tree. The last `@property` wins; `CSS.registerProperty()` beats both. Support: Chrome 85, Firefox 128, Safari 16.4.

## Example

```html
<style>
  @property --angle {
    syntax: "<angle>";
    inherits: false;
    initial-value: 0deg;
  }
  @keyframes spin {
    to { --angle: 360deg; --plain: 360deg; }
  }
  .ring {
    --plain: 0deg;
    background: conic-gradient(from var(--angle), red, blue);
    animation: spin 1s linear paused;
  }
</style>
<div class="ring"></div>
<script>
  const ring = document.querySelector(".ring");
  const [spin] = ring.getAnimations();
  spin.currentTime = 250;
  const style = getComputedStyle(ring);
  console.log(style.getPropertyValue("--angle"));
  // → 90deg
  console.log(style.getPropertyValue("--plain"));
  // → 0deg
  console.log(style.backgroundImage);
  // → conic-gradient(from 90deg, rgb(255, 0, 0), rgb(0, 0, 255))
</script>
```

Chrome 156 and Firefox 159 agreed. A quarter of the way through, the registered angle is a quarter turn; the unregistered one hasn't moved and jumps to `360deg` at the halfway point.

## Pitfalls

- Using a relative `initial-value` like `1em`. The rule is invalid, the property stays unregistered, and nothing reports it. Both browsers left it out of `cssRules` entirely.
- Expecting `var(--x, fallback)` to work for a registered property. It always has a value, so the fallback never applies.
- Expecting a wrong-typed declaration to be skipped in favour of an earlier one. `--size: 10px; --size: red;` with `<length>` and `initial-value: 4px` gave `4px`, not `10px`.
- Registering with `inherits: false` and setting the value on a wrapper. Children see the initial value; set it on the element that uses it.

## Follow-ups

**Q:** Does `@supports (--size: red)` fail when `--size` is registered as `<length>`?
**A:** No. Custom properties accept nearly any value at parse time, registered or not, so `CSS.supports("--size: red")` returned `true`.

**Q:** What happens with `transition: --w 1s` on an unregistered `--w`?
**A:** No transition is created; the value switches at once. Registered as `<length>`, the same change produced one `CSSTransition`, at `50px` halfway from `0px` to `100px`.

**Q:** What does `CSS.registerProperty()` do with a name already registered by it?
**A:** It throws `InvalidModificationError`. A relative `initialValue` throws `SyntaxError`.

**Q:** Must a `var()` fallback match the registered syntax?
**A:** The 2024 Working Draft said yes, even when unused; the editor's draft dropped that rule. Chrome 156 and Firefox 159 follow the draft: `width: var(--size, red)` with `--size: 10px` gave `10px`.

## Exercises

### Which colour does the paragraph get?

```html
<style>
  @property --c { syntax: "<color>"; inherits: true; initial-value: black; }
  .box { color: blue; }
  .box p { --c: 12px; color: var(--c); }
</style>
<div class="box"><p>Text</p></div>
```

**Answer:** Black, `rgb(0, 0, 0)`. `12px` fails the `<color>` syntax, so `--c` acts as `unset`: it inherits, and no ancestor sets it, so it takes `initial-value: black`. Unregistered, `color` itself would fail and inherit blue. Chrome 156 and Firefox 159 agreed.
