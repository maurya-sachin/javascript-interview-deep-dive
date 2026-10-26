# 08 — Modern CSS

> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

Features that changed how CSS is written: custom properties and `@property`, `:has()`, nesting, `@scope`, logical properties, and shipping new CSS safely with feature queries.

## Learning goals

After this chapter you can:

- Explain how custom properties cascade, inherit, and fail at computed-value time
- Register a custom property to animate it or type-check it
- Select a parent or earlier sibling with `:has()`
- Write nested CSS and say where it differs from Sass
- Scope styles with `@scope` and explain scoping proximity

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Custom properties: cascade and inheritance, `var()` fallbacks, invalid at computed-value time → —
- `@property`: `syntax`, `inherits`, `initial-value`; animating registered properties → —
- `:has()`: relational selection, specificity, limits (no nesting `:has()`, no pseudo-elements) → —
- CSS nesting: `&`, relaxed parsing, specificity via `:is()`, differences from Sass → —
- `@scope`: scope roots and limits, donut scope, scoping proximity in the cascade → —
- Logical properties and values: `inline`/`block` axes, writing modes → —
- Progressive enhancement: forgiving parsing of unknown CSS, `@supports`, `selector()` → —

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
<!-- generated:questions:end -->

## Sources

- [CSS Custom Properties Level 1](https://www.w3.org/TR/css-variables-1/)
- [CSS Properties and Values API Level 1](https://www.w3.org/TR/css-properties-values-api-1/)
- [Selectors Level 4 — Relational pseudo-class](https://www.w3.org/TR/selectors-4/#relational)
- [CSS Nesting](https://www.w3.org/TR/css-nesting-1/)
- [CSS Cascading and Inheritance Level 6 — Scoping](https://drafts.csswg.org/css-cascade-6/#scoped-styles)
- [CSS Logical Properties and Values Level 1](https://www.w3.org/TR/css-logical-1/)
- [CSS Conditional Rules Level 3](https://www.w3.org/TR/css-conditional-3/)
