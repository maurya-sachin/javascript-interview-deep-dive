---
title: "How do `clamp()`, `min()`, and `max()` make sizes fluid, and what's the zoom catch?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [clamp, min, max, fluid-typography, zoom, wcag, accessibility]
related:
  - html-and-css/responsive-design/viewport-units
  - html-and-css/responsive-design/relative-units
  - html-and-css/responsive-design/intrinsic-responsive-layout
  - html-and-css/responsive-design/container-queries
verified: 2026-10
sources:
  - https://www.w3.org/TR/css-values-4/#comp-func
  - https://www.w3.org/TR/css-values-4/#funcdef-clamp
  - https://www.w3.org/TR/css-values-4/#viewport-relative-lengths
  - https://www.w3.org/TR/css-values-4/#rem
  - https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html
  - https://www.w3.org/WAI/WCAG22/Techniques/failures/F94
tldr: >
  `min()` returns its smallest argument, `max()` its largest, and `clamp(MIN, VAL, MAX)` is
  `max(MIN, min(VAL, MAX))`, with MIN winning a conflict. A `vw` preferred value makes a size scale
  with the viewport between bounds. The catch: page zoom shrinks the viewport in CSS pixels, so a
  pure-`vw` size never grows. Mix `rem` into the preferred value.
---

## Answer

The comparison functions take full math expressions with mixed units:

- **`min(a, b, …)`** is the smallest value, so it sets a *maximum*: `width: min(100%, 60rem)` is full width until 60rem, replacing `width` + `max-width`.
- **`max(a, b, …)`** is the largest, so it sets a *minimum*: `padding: max(1rem, 3vw)`.
- **`clamp(MIN, VAL, MAX)`** is exactly `max(MIN, min(VAL, MAX))`: the preferred value, held between the bounds. If `MIN` is greater than `MAX`, `MIN` wins.

Fluid typography uses a viewport-relative preferred value: `font-size: clamp(1rem, 1rem + 1vw, 3rem)` grows smoothly with the window instead of jumping at breakpoints. Container units (`cqi`) do the same per component.

**The zoom catch.** Browser zoom enlarges CSS pixels, so a zoomed window has *fewer* CSS pixels across. A `vw` value shrinks in CSS pixels by exactly as much as zoom enlarges each pixel; on screen it stays the same size. A heading at `2.5vw` stayed 30 device pixels at (emulated) 100%, 200% and 300% zoom, and ignored the user's default font size too. WCAG 2.2 SC 1.4.4 requires text to be resizable to 200%; failure F94 is text sized mainly with viewport units.

The fix is to give `rem` part of the preferred value, because only the `rem` part scales. At zoom `z`, rendered size is `z × rem part + vw part`, so it doubles once `(z − 2) × rem part ≥ vw part`. Keep the `vw` coefficient small and the bounds in `rem`: bounds scale fully with zoom and with the default font size. WCAG's Understanding document allows reaching 200% at a higher zoom level: its example halves the font size at 400% zoom and still counts the text as twice as large.

## Example

```html
<style>
  .vw-only { font-size: 2.5vw; }
  .fluid { font-size: clamp(1rem, 1rem + 1vw, 3rem); }
</style>
<p class="vw-only">Heading</p>
<p class="fluid">Heading</p>
<script>
  // Rendered size in device pixels = CSS px × devicePixelRatio
  const rendered = (selector) =>
    parseFloat(getComputedStyle(document.querySelector(selector)).fontSize) * devicePixelRatio;
  console.log(innerWidth, devicePixelRatio, rendered(".vw-only"), rendered(".fluid"));
  // → 1200 1 30 28
  // → 600 2 30 44
  // → 400 3 30 60
  // → 1200 1 30 44
</script>
```

A 1200 px window at 100%, 200% and 300% zoom, emulated as a viewport of 1200 ÷ zoom CSS px at that device pixel ratio; the last line is 100% zoom with the browser's default font size at 32 px. Chrome 156 and Firefox 159 agreed. The `vw` heading never changed; the `rem` + `vw` heading reached 2× (56 px) only at 300%.

## Pitfalls

- Using `min()` for a minimum. `min(1rem, 2vw)` is never *more* than `1rem`; the minimum needs `max()`.
- Writing the bounds backwards. `clamp(3rem, 2.5vw, 1rem)` computed `48px` everywhere: MIN beats MAX.
- Putting only `vw` in the preferred value. In a 1280 px window, `clamp(1rem, 2.5vw, 3rem)` rendered 32 device px at both 100% and 200% zoom; it grows only once zoom pushes it onto the `1rem` floor.
- Bounds in `px`. They don't follow the user's default font size; `rem` bounds do.

## Follow-ups

**Q:** How do you derive the preferred value for "16 px at 320 px wide, 32 px at 1280 px"?
**A:** Slope = (32 − 16) ÷ (1280 − 320) = 1/60 per px, i.e. `1.6667vw`. Intercept = 16 − 320 ÷ 60 ≈ 10.67 px = `0.6667rem`. Result: `clamp(1rem, 0.6667rem + 1.6667vw, 2rem)`.

**Q:** Do you need `calc()` inside `clamp()`?
**A:** No. Each argument is already a calculation, so `clamp(1rem, 1rem + 1vw, 3rem)` is valid as written.

**Q:** Isn't 1.4.4 about text-only zoom?
**A:** No. It only requires resizing to 200% without assistive technology; the Understanding document lists page zoom, text-only resizing and a configured text size as ways user agents do it. F94 says viewport-unit text defeats most of them.

## Exercises

### Size at 800 px

```html
<style>h1 { font-size: clamp(1rem, 0.6667rem + 1.6667vw, 2rem); }</style>
<h1>Title</h1>
```

**Answer:** About 24 px: 10.67 + 0.016667 × 800 = 24. Firefox 159 printed `24px`; Chrome 156 printed `24.0008px` from the rounded coefficients. At 320 px it's 16 px, and from 1280 px up it stays `32px`.
