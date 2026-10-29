---
title: "Which DOM reads force a synchronous layout, and why?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [forced-synchronous-layout, layout-thrashing, reflow, cssom-view, getcomputedstyle, performance]
related:
  - browser/rendering-pipeline/pixel-pipeline
  - browser/html-event-loop/rendering-steps
  - browser/html-event-loop/request-animation-frame
  - browser/the-dom/innerhtml-textcontent-innertext
  - browser/observers/resize-observer
verified: 2026-10
perishable:
  - Layout and style counts measured in Chrome 156
  - forcedStyleAndLayoutDuration is Chrome-only (123+)
sources:
  - https://drafts.csswg.org/cssom-view/#dom-htmlelement-offsetwidth
  - https://drafts.csswg.org/cssom-view/#dom-element-getboundingclientrect
  - https://drafts.csswg.org/cssom-view/#dom-element-scrolltop
  - https://drafts.csswg.org/cssom-view/#dom-document-elementfrompoint
  - https://drafts.csswg.org/cssom/#dom-window-getcomputedstyle
  - https://drafts.csswg.org/cssom/#resolved-value
  - https://html.spec.whatwg.org/multipage/dom.html#the-innertext-idl-attribute
  - https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing#avoid_forced_synchronous_layouts
  - https://chromedevtools.github.io/devtools-protocol/tot/Performance/
  - https://developer.mozilla.org/en-US/docs/Web/API/PerformanceScriptTiming/forcedStyleAndLayoutDuration#browser_compatibility
tldr: >
  Browsers defer style and layout until a frame needs them. Geometry getters (`offsetWidth`,
  `clientHeight`, `scrollTop`, `getBoundingClientRect()`, `innerText`, layout-dependent
  `getComputedStyle()` values) must reflect the current DOM, so reading one after a write runs
  style and layout synchronously. Alternating writes and reads in a loop repeats that every
  iteration: layout thrashing. Batch reads before writes.
---

## Answer

Browsers compute style and layout lazily. A DOM or style write only marks part of the tree dirty, and the work normally runs once, in the next frame's rendering update. But geometry APIs are defined in terms of boxes: CSSOM View's `offsetWidth` returns the width of the border boxes of the element's fragments. To answer correctly after a write, the browser has to run style and layout right then, synchronously, in the middle of your script. That's a *forced synchronous layout* (also called forced reflow). No spec uses the term; it's the cost of lazy layout showing through.

Reads that need current layout:

- `offsetTop`/`Left`/`Width`/`Height`/`Parent`, `clientWidth`/`Height`/`Top`/`Left`
- `scrollTop`, `scrollLeft`, `scrollWidth`, `scrollHeight`; calls like `scrollTo()` and `scrollIntoView()`
- `getBoundingClientRect()`, `getClientRects()`, `document.elementFromPoint()`
- `innerText`, which returns text as rendered
- `getComputedStyle()` values that resolve to used values, such as `width` and `height`

Each of these forced a layout in Chrome 156 when read right after a width change.

`getComputedStyle(el)` itself returns a live object and computes nothing. Reading `color` from it needs style only; reading `width` needs layout. `textContent` and attributes need neither.

One forced layout is cheap when nothing is dirty. The problem is *layout thrashing*: writes and reads alternating in a loop, so every read pays for a full layout. Fixes:

- Batch: do every read, then every write.
- Read at the start of a `requestAnimationFrame` callback, before writing.
- Let `ResizeObserver` deliver sizes after the browser's own layout instead of reading them in a loop.

## Example

```js
// #list holds 1,000 <div style="width: 100px"> items
const items = [...document.getElementById('list').children];

function interleaved() { // read, write, read, write…
  for (const item of items) {
    item.style.width = `${item.offsetWidth + 1}px`;
  }
}

function batched() { // every read, then every write
  const widths = items.map((item) => item.offsetWidth);
  items.forEach((item, i) => {
    item.style.width = `${widths[i] + 1}px`;
  });
}

interleaved(); items[0].offsetWidth;
// → style +1000, layout +1000
batched(); items[0].offsetWidth;
// → style +1, layout +1
```

Counts are the change in `RecalcStyleCount` and `LayoutCount` from the Chrome DevTools Protocol's `Performance.getMetrics` around each line: Chrome 156 only, identical in three runs. The same work took 140–157 ms interleaved and 1.7–2.3 ms batched in Chrome 156, and 35–40 ms against 2–3 ms in Firefox 159 (15 measurements per browser, 3 page loads).

## Pitfalls

- Reading a size inside the loop that changes sizes, as in the example. Each iteration invalidates what the next one reads.
- Hiding a read in a helper: a utility that measures (`isVisible()`, `innerText`) called between writes thrashes just the same.
- Assuming `requestAnimationFrame` prevents forced layout. Writing and then reading inside the callback still forces it; order matters, not timing.
- Believing `getComputedStyle()` is the expensive call. The cost comes when a property is read, and only layout-dependent properties force layout.

## Follow-ups

**Q:** Why doesn't the browser keep layout up to date after every write?
**A:** Most writes come in groups. Laying out after each would repeat work that the next write throws away; deferring it lets ten writes cost one layout at the next frame.

**Q:** Does a forced layout also paint?
**A:** No. It runs style and layout so the value is correct; paint and compositing still wait for the frame's rendering update.

**Q:** How do you find forced layouts?
**A:** In the lab, Chrome DevTools' Performance panel has a Forced Reflow insight. In the field, Long Animation Frames script attribution reports `forcedStyleAndLayoutDuration`, in Chrome 123+ only.

## Deep dive

### Edge cases

Which reads flush what, in Chrome 156. Each line was measured on its own, right after a change to `box.style.width`, with counts from `Performance.getMetrics` as above:

```js
getComputedStyle(box);
// → style +0, layout +0
getComputedStyle(box).color;
// → style +1, layout +0
getComputedStyle(box).width;
// → style +1, layout +1
box.offsetWidth; box.offsetHeight; box.getBoundingClientRect();
// → style +1, layout +1
box.textContent;
// → style +0, layout +0
```

- **Several reads, one layout.** Consecutive reads with no write between them share one layout; only the first pays.
- **Used values the engine can shortcut.** `getComputedStyle(box).width` forced layout even though `width` was set to `100px`, while `marginLeft` (a fixed `0px`) needed style only. Which values Chrome can answer without layout is an engine detail, not something to rely on.
- **Non-geometry globals.** Reading `innerWidth` forced nothing in Chrome 156.
- **Skipped subtrees.** Reading geometry inside `content-visibility: hidden` content forces its style and layout on demand, defeating the skip.
