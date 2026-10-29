---
title: "How do `color-mix()` and relative colour syntax work?"
status: draft
difficulty: medium
frequency: 2
core: false
tags: [color, color-mix, relative-color-syntax, oklch, design-tokens]
related:
  - html-and-css/typography-colour-motion/oklch-and-wide-gamut
  - html-and-css/modern-css/custom-properties
  - html-and-css/modern-css/registered-properties
verified: 2026-10
perishable:
  - "Relative colour syntax: Chrome 122 (oklch), Firefox 128, Safari 18"
  - "color-mix() with one or 3+ colours: Firefox 150, Safari 27, not Chrome"
sources:
  - https://www.w3.org/TR/css-color-5/#color-mix
  - https://drafts.csswg.org/css-color-5/#color-mix-percent-norm
  - https://drafts.csswg.org/css-color-5/#resolving-mix
  - https://drafts.csswg.org/css-color-5/#relative-syntax
  - https://www.w3.org/TR/css-color-4/#interpolation-space
  - https://www.w3.org/TR/css-color-4/#hue-interpolation
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/color-mix#browser_compatibility
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/oklch#browser_compatibility
tldr: >
  `color-mix(in oklab, a 30%, b)` interpolates two colours in a chosen colour space; Oklab is the
  default, and percentages that sum under 100% lower the alpha. Relative colour syntax,
  `oklch(from var(--brand) calc(l - 0.1) c h)`, converts an origin colour into a space and exposes
  its channels as numbers you can keep, swap or compute. Both resolve at computed-value time.
---

## Answer

Both functions derive colours from other colours in CSS, so one `--brand` token can produce hover, border and tint variants that follow it, even when it changes at runtime. Preprocessors can't do that because they run before `var()` exists.

**`color-mix()`** (CSS Color 5) interpolates between colours:

```css
color-mix(in oklch, var(--brand) 70%, white)
```

- **The space decides the result.** Blue and yellow mixed `in srgb` gave exact grey; `in oklch` gave a vivid teal. Without `in …` the default is Oklab, a good general choice.
- **Percentages.** One missing percentage is `100%` minus the other; both missing is 50/50. If they sum to more than 100% they're scaled down. If they sum to less, the mix is made at full strength and its alpha is multiplied by the sum: `red 20%, blue 20%` is a 50/50 purple at alpha 0.4.
- **Polar spaces** (`hsl`, `oklch`, `lch`) interpolate hue along the shorter arc unless you write `longer hue`, `increasing hue` or `decreasing hue`.

**Relative colour syntax** (also Color 5) starts any modern colour function with `from <color>`:

```css
oklch(from var(--brand) calc(l - 0.1) c h)   /* darker */
oklch(from var(--brand) l c calc(h + 180))   /* complement */
rgb(from var(--brand) r g b / 50%)           /* translucent */
```

The origin is converted into that function's space, and each channel keyword (`l`, `c`, `h`, `r`, `alpha`…) becomes a plain number: `r` is 0–255 in `rgb()`, `l` is 0–1 in `oklch()`. Any channel can be a keyword, a literal or a `calc()`.

Choose `color-mix()` to blend towards another colour (tints, overlays) and relative syntax to adjust one channel precisely (lightness steps, alpha). Both are resolved when the value computes, so `getComputedStyle` returns the final colour; a `currentColor` inside `color-mix()` stays unresolved so each element mixes with its own `color`.

## Example

```html
<p id="probe" style="--brand: oklch(60% 0.15 250)"></p>
<script>
  const probe = document.getElementById("probe");
  const computed = (color) => {
    probe.style.color = color;
    return getComputedStyle(probe).color;
  };
  console.log(computed("color-mix(in srgb, red 25%, blue)"));
  // → color(srgb 0.25 0 0.75)
  console.log(computed("color-mix(in srgb, red 20%, blue 20%)"));
  // → color(srgb 0.5 0 0.5 / 0.4)
  console.log(computed("color-mix(in srgb, blue, yellow)"));
  // → color(srgb 0.5 0.5 0.5)
  console.log(computed("color-mix(in hsl, red, blue)"));
  // → color(srgb 1 0 1)
  console.log(computed("oklch(from var(--brand) calc(l - 0.1) c h)"));
  // → oklch(0.5 0.15 250)
  console.log(computed("oklch(from var(--brand) l c calc(h + 180))"));
  // → oklch(0.6 0.15 70)
  console.log(computed("rgb(from red r g b / 50%)"));
  // → color(srgb 1 0 0 / 0.5)
</script>
```

Chrome 156 and Firefox 159 printed the same values. The `hsl` mix goes round the hue wheel to magenta; the `srgb` one averages channels to purple.

## Pitfalls

- Writing `calc(l - 10%)` in `oklch(from …)`. `l` is a number, so subtracting a percentage made the whole value invalid; use `calc(l - 0.1)`.
- Using legacy commas: `rgb(from red r, g, b)` was invalid. Relative syntax only exists in the space-separated form.
- Mixing in `srgb` and getting mud. Channel averaging passes through grey for opposite hues; mix in `oklab` or `oklch`.
- Expecting `color-mix(in srgb, red 30%, blue 30%)` to be a 50/50 opaque mix. Under 100% total lowers the alpha; give one colour no percentage instead.

## Follow-ups

**Q:** Can `color-mix()` take one colour, or three?
**A:** The current draft allows one or more. Firefox 159 accepted `color-mix(in srgb, red, blue, lime)` and computed `color(srgb 0.333333 0.333333 0.333333)`; Chrome 156 rejected it as invalid, as it did a single colour.

**Q:** What does a `color-mix()` with `currentColor` inherit?
**A:** The function, not a colour. A parent with `color: red` set a registered `<color>` property to `color-mix(in srgb, currentColor 50%, white)`; its blue child computed `color(srgb 0.5 0.5 1)`, mixed with its own blue.

**Q:** Do relative colours clamp channels into the gamut?
**A:** No. `rgb(from oklch(70% 0.4 30) r g b)` computed to `r` above 1 and negative `g` and `b`; only painting brings them into range.
