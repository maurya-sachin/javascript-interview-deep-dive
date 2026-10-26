# 07 — Responsive design

> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

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

- Intrinsic layout vs breakpoints; mobile-first; where to put breakpoints → —
- Media queries: range syntax, `width` vs `device-width`, `hover`/`pointer`, `prefers-*` features → —
- Container queries: `container-type`, size containment, container units, style queries → —
- Relative units: `em`, `rem`, `%`, `ch`, `lh`; what each resolves against → —
- Viewport units: `vh` vs `svh`/`lvh`/`dvh`, mobile browser chrome → —
- `min()`, `max()`, `clamp()`; fluid type and zoom (WCAG resize text) → —

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
<!-- generated:questions:end -->

## Sources

- [Media Queries Level 5](https://www.w3.org/TR/mediaqueries-5/)
- [CSS Containment Level 3](https://www.w3.org/TR/css-contain-3/)
- [CSS Values and Units Level 4](https://www.w3.org/TR/css-values-4/)
