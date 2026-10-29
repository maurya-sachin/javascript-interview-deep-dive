---
title: "What do `oklch()` and wide-gamut colour spaces give you over `rgb()` and `hsl()`?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [color, oklch, display-p3, gamut-mapping, color-spaces]
related:
  - html-and-css/typography-colour-motion/color-mix-and-relative-colour
  - html-and-css/typography-colour-motion/dark-mode-color-scheme
  - html-and-css/responsive-design/media-queries
verified: 2026-10
perishable:
  - "Browsers clip out-of-gamut colours per channel instead of CSS gamut mapping"
sources:
  - https://www.w3.org/TR/css-color-4/#ok-lab
  - https://www.w3.org/TR/css-color-4/#specifying-oklab-oklch
  - https://www.w3.org/TR/css-color-4/#predefined-display-p3
  - https://www.w3.org/TR/css-color-4/#gamut-mapping-intro
  - https://www.w3.org/TR/css-color-4/#css-gamut-mapping
  - https://www.w3.org/TR/css-color-4/#resolving-oklab-oklch-values
  - https://www.w3.org/TR/mediaqueries-4/#color-gamut
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/oklch#browser_compatibility
tldr: >
  `hsl()` is sRGB with friendlier knobs, but its lightness isn't perceptual: yellow and blue at
  `50%` look nothing alike. `oklch()` uses Oklab's perceptual lightness, chroma and hue, so equal
  `L` looks equally light and you can pick a hue without changing it. It also reaches colours
  outside sRGB, like Display P3's; screens that can't show them gamut-map them.
---

## Answer

`rgb()`, hex and `hsl()` all describe **sRGB**, the gamut of the old web. `hsl()` only reshapes the RGB cube into hue, saturation and lightness; its lightness is arithmetic, not perceptual. `hsl(60 100% 50%)` (yellow) and `hsl(240 100% 50%)` (blue) share `50%` but have Oklab lightness 0.97 and 0.45.

CSS Color 4 adds colour spaces built for people and for modern screens:

- **`oklch(L C H)`** is the polar form of **Oklab**, a space fitted to how people judge colour differences. `L` (0–1 or 0–100%) is perceived lightness, `C` is chroma (0 is grey; in practice it stays under 0.5), `H` is hue in degrees. Change `H` at fixed `L` and `C` and you get a new hue at the same visual weight, which is why design systems build palettes and state ramps in it.
- **Wide gamuts.** `color(display-p3 1 0 0)` names a red more saturated than any sRGB colour, visible on a P3 screen. `oklch()` isn't tied to any gamut, so one notation covers sRGB, P3 and beyond.

The catch is **gamut mapping**. An `oklch()` value can be outside what the screen shows. The value is kept as written through computed value (`getComputedStyle` returns `oklch(0.7 0.4 30)` unchanged); only painting must bring it into range. Color 4 describes reducing chroma at constant lightness and hue. Chrome 156 and Firefox 159 clipped each channel instead when painting to sRGB, so very different out-of-gamut colours can land on the same pixel.

In practice: write colours in `oklch()`, keep chroma within the target gamut for important colours, and gate vivid P3 values with `@media (color-gamut: p3)`. `oklch()` shipped in Chrome 111, Firefox 113 and Safari 15.4.

## Example

```html
<p id="probe"></p>
<script>
  const probe = document.getElementById("probe");
  const computed = (color) => {
    probe.style.color = color;
    return getComputedStyle(probe).color;
  };
  const lightness = (color) =>
    Number(computed(`oklch(from ${color} l c h)`).split(/[( ]/)[1]).toFixed(2);
  console.log(lightness("hsl(60 100% 50%)"), lightness("hsl(240 100% 50%)"));
  // → 0.97 0.45
  console.log(computed("oklch(70% 0.4 30)"));
  // → oklch(0.7 0.4 30)
  const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const painted = (color) => {
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    return context.getImageData(0, 0, 1, 1).data.join();
  };
  console.log(painted("oklch(70% 0.4 30)"), painted("oklch(62.8% 0.2577 29.23)"));
  // → 255,0,0,255 255,0,0,255
  console.log(painted("oklch(70% 0.1 30)"));
  // → 213,134,121,255
</script>
```

Chrome 156 and Firefox 159 agreed. `oklch(from …)` (relative colour syntax) converts a colour into OkLCh. The first painted colour is far outside sRGB and clipped to the same pure red as `oklch(62.8% 0.2577 29.23)`, sRGB red itself.

## Pitfalls

- Treating HSL lightness as contrast. Same `L%` in `hsl()` gives text that passes on one hue and fails on another; compare `oklch()` `L` instead, then check real contrast.
- Pushing chroma past the gamut and expecting the browser to pick a nice nearby colour. Today's clipping can shift hue and lightness; keep chroma in range or test on both kinds of screen.
- Reading `getComputedStyle` as the displayed colour. It returns the unmapped value: `rgb(from oklch(70% 0.4 30) r g b)` computed to `color(srgb 1.3196 -0.449799 -0.310059)` in Chrome 156.
- Shipping `oklch()` without a fallback for browsers older than Chrome 111 or Firefox 113. Declare a hex value first; the `oklch()` line overrides it where supported.

## Follow-ups

**Q:** Why is the hue `30` red in `oklch()` but orange in `hsl()`?
**A:** Hue angles aren't shared between spaces. HSL's 0° is sRGB red; OkLCh's 0° points along Oklab's positive `a` axis (purplish red), and sRGB red sits near 29°.

**Q:** What happens to `oklch()` values out of range on the lightness axis?
**A:** `L` is clamped to 0–1 when parsed (`oklch(150% 0.1 30)` computed to `oklch(1 0.1 30)`) and negative chroma to 0. Hue wraps: `390deg` computed to `30`.

**Q:** How do you detect a wide-gamut screen?
**A:** `@media (color-gamut: p3)` or `matchMedia("(color-gamut: p3)")`. Headless Chrome 156 and Firefox 159 matched `srgb` but not `p3`.
