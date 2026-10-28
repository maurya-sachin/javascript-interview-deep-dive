---
title: "How do you build a responsive layout, and how much should depend on breakpoints?"
status: draft
difficulty: medium
frequency: 4
core: true
tags: [responsive-design, intrinsic-layout, breakpoints, mobile-first, flexbox, grid]
related:
  - html-and-css/responsive-design/media-queries
  - html-and-css/responsive-design/container-queries
  - html-and-css/responsive-design/fluid-sizing-clamp
  - html-and-css/flexbox-and-grid/flex-sizing-algorithm
  - html-and-css/flexbox-and-grid/grid-track-sizing
  - html-and-css/flexbox-and-grid/automatic-minimum-size
  - html-and-css/documents-and-semantics/head-metadata
verified: 2026-10
sources:
  - https://www.w3.org/TR/css-flexbox-1/#flex-wrap-property
  - https://www.w3.org/TR/css-grid-1/#auto-repeat
  - https://www.w3.org/TR/css-values-4/#comp-func
  - https://www.w3.org/TR/mediaqueries-5/#units
  - https://www.w3.org/TR/mediaqueries-5/#width
  - https://www.w3.org/TR/css-contain-3/#container-queries
  - https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
tldr: >
  Start intrinsic: flex wrapping, grid `auto-fit` with `minmax()`, `min()`/`clamp()` and `ch`-capped
  widths adapt to whatever space exists, so most of a layout needs no breakpoints. Add a media query
  only where the design must change structure, at the width where the content breaks, written
  mobile-first. Components that sit in different slots use container queries instead.
---

## Answer

A responsive layout adapts to the space it's given. There are two ways to get there: **intrinsic layout**, where the layout algorithms respond to available space by themselves, and **conditional rules** (media and container queries) that switch styles at a threshold. Lead with the first.

Intrinsic techniques:

- **Flex wrapping.** `flex-wrap: wrap` plus a `flex-basis` puts items side by side when they fit and stacks them when they don't.
- **Grid auto-repeat.** `repeat(auto-fit, minmax(min(12rem, 100%), 1fr))` makes as many columns as fit. The `min()` stops the minimum overflowing a container narrower than `12rem`.
- **Fluid values.** `width: min(100%, 70ch)` caps line length; `clamp()` scales type and spacing between bounds.
- **No fixed widths** on boxes that hold content.

Breakpoints are for structural changes no algorithm can infer: navigation collapsing into a menu button, a table turning into cards. Rules for them:

- **Content decides, not devices.** Widen the window until the design looks wrong; that's the breakpoint. Device widths change every year.
- **Mobile-first.** The base styles are the narrow layout and `@media (width >= 48em)` adds to them, so wide screens get extra rules rather than undoing them. The narrow layout matters on desktop too: WCAG 1.4.10 Reflow wants content usable at 320 CSS px wide, which is a 1280 px window at 400% zoom.
- **`em` breakpoints.** In a media query, `em` is relative to the initial `font-size`, the user's default, so someone with larger text gets the narrower layout sooner. The page's `html { font-size }` doesn't affect it.
- **Components use container queries.** A card in a sidebar and in the main column sees the same viewport but different space.

## Example

```html
<style>
  body { margin: 0; }
  .page { display: flex; flex-wrap: wrap; gap: 1rem; }
  .sidebar { flex: 1 1 15rem; }
  .main { flex: 999 1 0; min-inline-size: 60%; }
  .cards {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(min(12rem, 100%), 1fr));
  }
</style>
<div class="page">
  <nav class="sidebar">Nav</nav>
  <main class="main">
    <div class="cards"><p>1</p><p>2</p><p>3</p><p>4</p></div>
  </main>
</div>
<script>
  const cards = [...document.querySelectorAll(".cards p")];
  const columns = cards.filter((card) => card.offsetTop === cards[0].offsetTop).length;
  const nav = document.querySelector(".sidebar").getBoundingClientRect();
  const main = document.querySelector(".main").getBoundingClientRect();
  console.log(innerWidth, main.top > nav.top ? "stacked" : "side by side", columns);
  // → 320 stacked 1
  // → 600 stacked 2
  // → 1024 side by side 3
  // → 1440 side by side 4
</script>
```

Run at viewport widths 320, 600, 1024 and 1440 px; Chrome 156 and Firefox 158 agreed. Four layouts, zero media queries.

## Pitfalls

- Writing `minmax(12rem, 1fr)` without `min()`. In a 160 px container the track stayed `192px` and the grid overflowed by 32 px; `minmax(min(12rem, 100%), 1fr)` gave one `160px` track.
- Choosing breakpoints from a device list (`375px`, `768px`) instead of where the content breaks.
- Expecting `html { font-size: 62.5% }` to move `em` breakpoints. Media queries use the initial font size, so they follow the user's setting, not the page's.
- Forgetting the viewport `<meta>`. Without it, mobile browsers lay out at a desktop-sized width and no query sees the phone's real width.

## Follow-ups

**Q:** Is mobile-first about performance?
**A:** Barely; every device still downloads the whole stylesheet. The gain is in the cascade: the simplest layout is the default and wider layouts add rules, instead of desktop styles that small screens must reset.

**Q:** When do you still need a media query?
**A:** When the change isn't a size adjustment: a different navigation pattern, hiding secondary content, switching a table to a list, or responding to user preferences like `prefers-reduced-motion`.

**Q:** How do you test a responsive layout?
**A:** Drag the window through every width rather than jumping between presets, zoom a 1280 px window to 400%, and raise the browser's default font size. Each exposes breakpoints that only worked at the widths someone checked.

## Deep dive

### How it works

Intrinsic layouts respond because flex and grid size things at layout time from the space they actually have. In the example:

- **The wrap point is computed, not declared.** Flex puts items on one line while their hypothetical sizes fit. The sidebar wants `15rem` (240 px); `.main` has a `flex-basis` of `0` but a minimum of 60% of the container. Both fit when `240 + 16 + 0.6W ≤ W`, so below 640 px the main column wraps under the nav. At 639 px the run printed `stacked 3`; at 640 px, `side by side 1`.
- **Grid counts the columns.** `auto-fit` makes as many `minmax(12rem, 1fr)` tracks as fit in the main column (`n × 192 + (n − 1) × 16 ≤ width`), then collapses the empty ones. `1fr` shares out the leftover space, so columns never leave a gap at the edge.
- **`flex-grow: 999`** means once the two sit side by side, nearly all free space goes to `.main` and the sidebar stays close to `15rem`.

The 639 → 640 px result is the point: a *wider* viewport gave *fewer* columns, because the cards respond to their own slot, not to the window. A viewport query can't express that; the layout algorithms already do.

### Edge cases

`em` in media queries follows the user's default font size. With the browser's default set to 32 px instead of 16 px, a 1024 px window stopped matching `(min-width: 40em)`, since 40em had become 1280 px. `html { font-size: 10px }` changed neither result:

```js
matchMedia("(min-width: 40em)").matches;
// → true
// → false
```

The first `→` line is with a 16 px default, the second with 32 px; Chrome 156 and Firefox 158 agreed. `rem` breakpoints behave the same way, because no page style applies to a media query.

Flex and grid items have an automatic minimum width of roughly their min-content size. A long URL or a wide `<pre>` inside `.main` stops it shrinking and the page overflows; `min-width: 0` on the item fixes it.

A pair like `max-width: 767px` / `min-width: 768px` leaves a gap that fractional viewport widths (zoom, non-integer pixel ratios) fall into; range syntax (`width < 48em`, `width >= 48em`) has no gap.

### Real-world scenario

A product card appears in a three-column grid on the listing page and in a narrow "recently viewed" sidebar. With viewport breakpoints, the card picks its horizontal layout on a wide screen even inside the 280 px sidebar, because the viewport is wide. Fix it in two layers: an intrinsic grid decides how many cards fit each slot, and a container query on the card's wrapper switches the card itself between stacked and horizontal at its own width. The page then keeps one media query, for the header's navigation.

### Trade-offs

| | Intrinsic layout | Breakpoints |
|---|---|---|
| Adapts to | The element's actual space | The viewport only |
| Rules to maintain | Few | One set per range |
| Control | Approximate: column counts and the last row's layout emerge | Exact, easy to match a mockup |
| Testing | Behaviour is continuous | Discrete widths |

Most production layouts mix both: intrinsic sizing everywhere, a handful of content-driven breakpoints for structural changes, and container queries for reusable components.
