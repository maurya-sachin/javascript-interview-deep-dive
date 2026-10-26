# 09 — Typography, colour, and motion

> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

The finishing layer: how fonts are matched, how text wraps and truncates, modern colour spaces and dark mode, and CSS transitions and animations.

## Learning goals

After this chapter you can:

- Explain how the browser picks a font face and when it synthesises one
- Truncate text on one line or several, and balance headings
- Choose `oklch()` over `hsl()` and mix colours with `color-mix()`
- Support light and dark themes with `color-scheme` and `light-dark()`
- Choose between a transition and a keyframe animation, including for `display`

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Font matching: `font-family` fallback, `@font-face` descriptors, synthesis, variable fonts → —
- Text overflow and wrapping: `text-overflow`, `line-clamp`, `overflow-wrap`, `text-wrap: balance`/`pretty` → —
- Colour spaces: sRGB vs Display P3, `oklch()` and perceptual uniformity, gamut mapping → —
- `color-mix()` and relative colour syntax → —
- Dark themes: `color-scheme`, `light-dark()`, system colours → —
- Transitions: what can interpolate, `transition-behavior: allow-discrete`, `@starting-style` → —
- Keyframe animations: fill modes, iteration, composition, animation events → —

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
<!-- generated:questions:end -->

## Sources

- [CSS Fonts Level 4](https://www.w3.org/TR/css-fonts-4/)
- [CSS Text Level 4](https://www.w3.org/TR/css-text-4/)
- [CSS Overflow Level 4](https://www.w3.org/TR/css-overflow-4/)
- [CSS Color Level 4](https://www.w3.org/TR/css-color-4/)
- [CSS Color Level 5](https://www.w3.org/TR/css-color-5/)
- [CSS Color Adjustment Level 1](https://www.w3.org/TR/css-color-adjust-1/)
- [CSS Transitions Level 1](https://www.w3.org/TR/css-transitions-1/)
- [CSS Animations Level 1](https://www.w3.org/TR/css-animations-1/)
