---
title: "What's the difference between `vh`, `svh`, `lvh`, and `dvh`?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [viewport-units, svh, lvh, dvh, mobile, scrollbars]
related:
  - html-and-css/responsive-design/relative-units
  - html-and-css/responsive-design/fluid-sizing-clamp
  - html-and-css/responsive-design/container-queries
  - html-and-css/documents-and-semantics/head-metadata
verified: 2026-10
sources:
  - https://www.w3.org/TR/css-values-4/#viewport-relative-lengths
  - https://www.w3.org/TR/css-values-4/#large-viewport-size
  - https://www.w3.org/TR/css-values-4/#small-viewport-size
  - https://www.w3.org/TR/css-values-4/#dynamic-viewport-size
  - https://www.w3.org/TR/css-values-4/#default-viewport-percentage-units
  - https://www.w3.org/TR/mediaqueries-5/#width
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length#browser_compatibility
tldr: >
  All are 1% of the viewport height, measured differently on mobile, where browser toolbars expand
  and retract. `svh` assumes the toolbars are shown (smallest), `lvh` assumes they're hidden
  (largest), and `dvh` tracks the current state. Plain `vh` equals `lvh`, so `100vh` content can sit
  behind the toolbar. On desktop all four are equal.
---

## Answer

Viewport-percentage units are 1% of the initial containing block, which on screen is the viewport. Mobile browsers complicate that: the address bar and toolbar **retract** as you scroll down and **expand** when you scroll back. CSS Values 4 defines three viewport sizes for this:

- **Large viewport** (`lvh`, `lvw`, …): sized as if every retractable UI is *retracted*. Fixed, so it never causes relayout, but content can be hidden behind the toolbar when it's showing.
- **Small viewport** (`svh`, …): sized as if the UI is *expanded*. Fixed too; `100svh` always fits, but leaves a gap once the toolbar hides.
- **Dynamic viewport** (`dvh`, …): the current size, between the two. Exact, but it changes while the user scrolls, which can resize content mid-scroll and costs layout work. Browsers may hold the value during the toolbar animation instead of updating every frame.

The original **`vh`/`vw`** (now the "default" units) are defined as the **large** viewport. That's why `height: 100vh` heroes on phones had their bottom covered by the toolbar.

Each comes in `w`, `h`, `i` (inline axis), `b` (block axis), `min` and `max` variants: `svi`, `dvmax`, and so on. The new prefixes shipped in Chrome 108, Firefox 101 and Safari 15.4.

What doesn't count:

- **On-screen keyboards** usually overlay the page and change none of these units.
- **Scrollbars:** viewport units are sized as if there were no scrollbar, unless the root's `overflow` (for example `overflow: scroll`) or `scrollbar-gutter` reserves space unconditionally.

Rule of thumb: `min-height: 100svh` for a hero that must fit on load, `100dvh` for a full-screen app shell where tracking the toolbar matters, `lvh` for backgrounds that should never show a gap.

## Example

```html
<style>
  body { margin: 0; }
  .hero { min-height: 100svh; }
  .app-shell { height: 100dvh; }
  .backdrop { height: 100lvh; }
  .legacy { height: 100vh; }
  .square { width: 50vmin; height: 50vmin; }
</style>
<section class="hero"></section>
<div class="app-shell"></div>
<div class="backdrop"></div>
<div class="legacy"></div>
<div class="square"></div>
<script>
  const height = (selector) => document.querySelector(selector).offsetHeight;
  console.log(innerWidth, innerHeight);
  // → 1000 700
  console.log(height(".hero"), height(".app-shell"), height(".backdrop"), height(".legacy"));
  // → 700 700 700 700
  console.log(document.querySelector(".square").offsetWidth);
  // → 350
</script>
```

Desktop Chrome 156 and Firefox 159 agreed: a desktop window has no retractable UI, so small, large and dynamic are the same 700 px. On a phone with its toolbar showing, `.hero` would be shorter than `.backdrop` by the toolbar's height. That case needs a real mobile browser; headless desktop emulation doesn't model the toolbar.

## Pitfalls

- Using `height: 100vh` for a mobile full-screen layout. `vh` is the large viewport, so the bottom sits under the expanded toolbar.
- Using `100dvh` everywhere. It resizes content while the user scrolls; reserve it for layouts that must track the visible area.
- Setting `width: 100vw` on a full-bleed section. With classic scrollbars, Firefox 159 made the box 1000 px in a window whose content area was 985 px, adding a horizontal scrollbar. `width: 100%` doesn't.
- Sizing text in `vw` alone. It ignores the user's default font size and doesn't grow with page zoom; combine it with `rem` in `clamp()`.

## Follow-ups

**Q:** If the spec says `overflow: scroll` on the root shrinks `vw`, does `html { overflow-y: scroll }` fix the `100vw` overflow?
**A:** Not in Firefox 159: with classic scrollbars and that rule, `100vw` was still 1000 px against a 985 px content width. Headless Chrome uses overlay scrollbars, so it couldn't be checked there.

**Q:** Why are the default units the large viewport rather than the dynamic one?
**A:** Stability. Large and small sizes change only when the viewport itself resizes, so content sized with them never relayouts during scrolling. Large also guarantees `100vh` fills the screen once the toolbar hides.

**Q:** What's `vmin` for?
**A:** The smaller of `vw` and `vh`: something that must fit both ways regardless of orientation. In a 1000 × 700 viewport, `50vmin` was `350px`.
