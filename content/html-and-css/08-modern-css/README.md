# 08 — Modern CSS

> **Status:** 🔴 planned · **Published:** 0/7 · **Last verified:** —

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

- Custom properties: cascade and inheritance, `var()` fallbacks, invalid at computed-value time → 010
- `@property`: `syntax`, `inherits`, `initial-value`; animating registered properties → 020
- `:has()`: relational selection, specificity, limits (no nesting `:has()`, no pseudo-elements) → 030
- CSS nesting: `&`, relaxed parsing, specificity via `:is()`, differences from Sass → 040
- `@scope`: scope roots and limits, donut scope, scoping proximity in the cascade → 050
- Logical properties and values: `inline`/`block` axes, writing modes → 060
- Progressive enhancement: forgiving parsing of unknown CSS, `@supports`, `selector()` → 070

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [How do custom properties work — cascade, inheritance, fallbacks, and invalid values?](010-custom-properties.md) | medium | 🟡 draft |
| 020 | [What does `@property` add over a plain custom property?](020-registered-properties.md) | medium | 🟡 draft |
| 030 | [What does `:has()` make possible, and what are its limits?](030-has-selector.md) | medium | 🟡 draft |
| 040 | [How does native CSS nesting work, and how does it differ from Sass?](040-css-nesting.md) | medium | 🟡 draft |
| 050 | [What does `@scope` do, and how is scoping proximity different from specificity?](050-scope-at-rule.md) | hard | 🟡 draft |
| 060 | [What are logical properties, and why use `margin-inline` over `margin-left`?](060-logical-properties.md) | easy | 🔴 planned |
| 070 | [How do you ship new CSS safely — forgiving parsing and `@supports`?](070-feature-queries.md) | medium | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- [CSS Custom Properties Level 1](https://www.w3.org/TR/css-variables-1/)
- [CSS Properties and Values API Level 1](https://www.w3.org/TR/css-properties-values-api-1/)
- [Selectors Level 4 — Relational pseudo-class](https://www.w3.org/TR/selectors-4/#relational)
- [CSS Nesting](https://www.w3.org/TR/css-nesting-1/)
- [CSS Cascading and Inheritance Level 6 — Scoping](https://drafts.csswg.org/css-cascade-6/#scoped-styles)
- [CSS Logical Properties and Values Level 1](https://www.w3.org/TR/css-logical-1/)
- [CSS Conditional Rules Level 3](https://www.w3.org/TR/css-conditional-3/)
