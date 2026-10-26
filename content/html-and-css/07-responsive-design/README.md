# 07 — Responsive design

> **Status:** 🔴 planned · **Published:** 0/6 · **Last verified:** —

Layouts that adapt to their space: intrinsic layout first, then media queries, container queries, relative and viewport units, and fluid sizing with comparison functions.

## Learning goals

After this chapter you can:

- Build a layout that adapts with as few breakpoints as possible
- Write media queries with range syntax and user-preference features
- Set up a query container and style a component by its own width
- Choose between `rem`, `em`, `%`, `ch`, and the viewport units
- Write fluid sizes with `clamp()` that still respect user zoom

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Intrinsic layout vs breakpoints; mobile-first; where to put breakpoints → 010
- Media queries: range syntax, `width` vs `device-width`, `hover`/`pointer`, `prefers-*` features → 020
- Container queries: `container-type`, size containment, container units, style queries → 030
- Relative units: `em`, `rem`, `%`, `ch`, `lh`; what each resolves against → 040
- Viewport units: `vh` vs `svh`/`lvh`/`dvh`, mobile browser chrome → 050
- `min()`, `max()`, `clamp()`; fluid type and zoom (WCAG resize text) → 060

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [How do you build a responsive layout, and how much should depend on breakpoints?](010-intrinsic-responsive-layout.md) | medium | 🔴 planned |
| 020 | [How do media queries work, including range syntax and `prefers-*` features?](020-media-queries.md) | easy | 🔴 planned |
| 030 | [What are container queries, and how do you establish a container?](030-container-queries.md) | medium | 🔴 planned |
| 040 | [What are `em`, `rem`, `%`, and `ch` relative to, and when do you use each?](040-relative-units.md) | easy | 🔴 planned |
| 050 | [What's the difference between `vh`, `svh`, `lvh`, and `dvh`?](050-viewport-units.md) | medium | 🔴 planned |
| 060 | [How do `clamp()`, `min()`, and `max()` make sizes fluid, and what's the zoom catch?](060-fluid-sizing-clamp.md) | medium | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- [Media Queries Level 5](https://www.w3.org/TR/mediaqueries-5/)
- [CSS Containment Level 3](https://www.w3.org/TR/css-contain-3/)
- [CSS Values and Units Level 4](https://www.w3.org/TR/css-values-4/)
