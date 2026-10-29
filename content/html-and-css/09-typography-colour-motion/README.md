# 09 — Typography, colour, and motion

> **Status:** 🔴 planned · **Published:** 0/7 · **Last verified:** —

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

- Font matching: `font-family` fallback, `@font-face` descriptors, synthesis, variable fonts → 010
- Text overflow and wrapping: `text-overflow`, `line-clamp`, `overflow-wrap`, `text-wrap: balance`/`pretty` → 020
- Colour spaces: sRGB vs Display P3, `oklch()` and perceptual uniformity, gamut mapping → 030
- `color-mix()` and relative colour syntax → 040
- Dark themes: `color-scheme`, `light-dark()`, system colours → 050
- Transitions: what can interpolate, `transition-behavior: allow-discrete`, `@starting-style` → 060
- Keyframe animations: fill modes, iteration, composition, animation events → 070

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [How does the browser pick a font face, and when does it synthesise bold or italic?](010-font-matching.md) | medium | 🟡 draft |
| 020 | [How do you truncate text with an ellipsis on one line or several?](020-text-truncation-and-wrapping.md) | easy | 🟡 draft |
| 030 | [What do `oklch()` and wide-gamut colour spaces give you over `rgb()` and `hsl()`?](030-oklch-and-wide-gamut.md) | medium | 🟡 draft |
| 040 | [How do `color-mix()` and relative colour syntax work?](040-color-mix-and-relative-colour.md) | medium | 🟡 draft |
| 050 | [How do `color-scheme` and `light-dark()` support dark mode?](050-dark-mode-color-scheme.md) | medium | 🟡 draft |
| 060 | [How do CSS transitions work, and how do you transition `display` or an element's entry?](060-transitions-and-discrete-properties.md) | medium | 🟡 draft |
| 070 | [How do `@keyframes` animations differ from transitions?](070-keyframe-animations.md) | medium | 🔴 planned |
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
