---
title: "How do media queries work, including range syntax and `prefers-*` features?"
status: draft
difficulty: easy
frequency: 4
core: false
tags: [media-queries, range-syntax, breakpoints, hover, pointer, prefers-reduced-motion]
related:
  - html-and-css/responsive-design/intrinsic-responsive-layout
  - html-and-css/responsive-design/container-queries
  - html-and-css/responsive-design/relative-units
  - html-and-css/typography-colour-motion/dark-mode-color-scheme
  - html-and-css/documents-and-semantics/head-metadata
verified: 2026-10
sources:
  - https://www.w3.org/TR/mediaqueries-5/#mq-prefix
  - https://www.w3.org/TR/mediaqueries-5/#media-types
  - https://www.w3.org/TR/mediaqueries-5/#mq-range-context
  - https://www.w3.org/TR/mediaqueries-5/#mq-min-max
  - https://www.w3.org/TR/mediaqueries-5/#evaluating
  - https://www.w3.org/TR/mediaqueries-5/#error-handling
  - https://www.w3.org/TR/mediaqueries-5/#units
  - https://www.w3.org/TR/mediaqueries-5/#width
  - https://www.w3.org/TR/mediaqueries-5/#hover
  - https://www.w3.org/TR/mediaqueries-5/#any-input
  - https://www.w3.org/TR/mediaqueries-5/#mf-user-preferences
  - https://www.w3.org/TR/mediaqueries-5/#mf-deprecated
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media#browser_compatibility
tldr: >
  A media query tests the environment: an optional media type (`screen`, `print`) plus features in
  parentheses joined by `and`, `or` and `not`; commas separate alternatives. Range syntax
  (`400px <= width < 768px`) replaces inclusive `min-`/`max-` prefixes. `width` is the viewport,
  `hover`/`pointer` the primary input, `prefers-*` user settings. Unknown features evaluate to
  false, even under `not`.
---

## Answer

A media query is a condition on the environment the document renders in, such as `screen and (width >= 48em) and (hover: hover)`. It appears in `@media`, `<link media>`, `<source media>` and `matchMedia()`.

- **Media types:** `all`, `screen`, `print`. The others (`tv`, `handheld`) are deprecated and never match.
- **Features** sit in parentheses and combine with `and`, `or` and `not`. A comma-separated list matches if any query matches.
- A leading **`not`** negates the whole query, type included: `not screen and (color)` means "not (a colour screen)". **`only`** exists to hide a query from pre-media-query browsers and does nothing today.

**Range syntax** (Media Queries 4) compares with `<`, `<=`, `>`, `>=` and can bound both sides: `(400px <= width < 768px)`. The old `min-width`/`max-width` prefixes mean `>=` and `<=`, so both ends are inclusive. It's supported since Chrome 104, Firefox 102 and Safari 16.4.

Key features:

- **`width`/`height`**: the viewport, including any scrollbar. `device-width` (the screen) is deprecated.
- **`orientation`**, **`aspect-ratio`**, **`resolution`**.
- **`hover`** and **`pointer`** (`none`/`coarse`/`fine`) describe the *primary* input; **`any-hover`**/**`any-pointer`** match if *any* input qualifies.
- **User preferences:** `prefers-reduced-motion`, `prefers-color-scheme`, `prefers-contrast`, `forced-colors`.

Relative units use initial values: `em` is the user's default font size, ignoring page styles.

In JavaScript, `matchMedia(query)` returns a `MediaQueryList` with `.matches` and a `change` event, so scripts react to the same conditions as CSS.

## Example

```js
// A 600 × 800 px viewport with a mouse
const test = (query) => matchMedia(query).matches;

test("(min-width: 600px)");
// → true
test("(width > 600px)");
// → false
test("(400px <= width <= 700px)");
// → true
test("screen and (orientation: portrait)");
// → true
test("print, (width >= 600px)");
// → true
test("not screen and (width > 600px)");
// → true
test("(hover: hover) and (pointer: fine)");
// → true
test("(width >= 37.5em)");
// → true
test("(colour: red)");
// → false
test("not (colour: red)");
// → false
```

Chrome 156 and Firefox 158 agreed. `colour` isn't a feature, so it evaluates to *unknown*, and negating unknown is still unknown, which counts as false.

## Pitfalls

- Pairing `max-width: 767px` with `min-width: 768px`. The spec warns that fractional viewport widths (zoom, non-integer pixel ratios) fall between them and neither applies; `width < 768px` / `width >= 768px` leaves no gap.
- Using `hover: hover` to detect "desktop". It describes only the primary input: the spec says a touchscreen device with an optional mouse should match `hover: none`. Use `any-hover` if any hover-capable input will do.
- Expecting `html { font-size: 62.5% }` to change `em` or `rem` breakpoints. Media queries resolve them against the initial font size.
- Writing a typo'd or unsupported feature inside `not (…)` as a fallback. It doesn't flip to true; the whole query is false.

## Follow-ups

**Q:** How do you react to a preference change in JavaScript?
**A:** Listen for `change` on the `MediaQueryList`. In Chrome 156, emulating `prefers-reduced-motion: reduce` fired `change` with `matches: true`, and a `@media` rule setting `transition-duration: 0s` applied at the same time.

**Q:** What does `prefers-reduced-motion: reduce` require of you?
**A:** That the user asked the system to minimise non-essential motion, so remove or replace motion-based animation that can cause discomfort or distraction. The media query only reports the setting; which animations to change is an accessibility decision.

**Q:** Why prefer `width` to `device-width`?
**A:** `device-width` is the screen's size, not the space the document has. It ignores window size and split screens, and the spec deprecates it.

## Exercises

### Negation and unknown features

```js
// A 600 px wide viewport
matchMedia("not screen and (width < 600px)").matches;
matchMedia("(min-orientation: portrait)").matches;
matchMedia("not (min-orientation: portrait)").matches;
```

**Answer:** `true`, `false`, `false`. `not` negates the whole query, and `screen and (width < 600px)` is false. `orientation` is discrete and takes no `min-` prefix, so `min-orientation` is an unknown feature: unknown is false, and so is its negation. Chrome 156 and Firefox 158 agreed.
