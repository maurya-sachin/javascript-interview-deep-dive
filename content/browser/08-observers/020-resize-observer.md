---
title: "What does `ResizeObserver` report, and what is the loop error?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [resize-observer, layout, box-model, resize-loop-error]
related:
  - browser/observers/intersection-observer
  - browser/observers/observer-timing
  - browser/html-event-loop/rendering-steps
  - browser/rendering-pipeline/forced-synchronous-layout
  - html-and-css/responsive-design/container-queries
verified: 2026-10
perishable:
  - "devicePixelContentBoxSize: Chrome 84, Firefox 108, not Safari"
  - "Chrome 156 doesn't print the loop error to the console"
  - "Loop ErrorEvent: Chrome 156 cancelable, Firefox 159 not"
sources:
  - https://drafts.csswg.org/resize-observer/#resize-observer-interface
  - https://drafts.csswg.org/resize-observer/#resize-observer-entry-interface
  - https://drafts.csswg.org/resize-observer/#resize-observation-interface
  - https://drafts.csswg.org/resize-observer/#gather-active-resize-observations-at-depth
  - https://drafts.csswg.org/resize-observer/#broadcast-active-resize-observations
  - https://drafts.csswg.org/resize-observer/#deliver-resize-loop-error-notification
  - https://drafts.csswg.org/resize-observer/#calculate-depth-for-node
  - https://html.spec.whatwg.org/multipage/webappapis.html#update-the-rendering
  - https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserverEntry/devicePixelContentBoxSize#browser_compatibility
tldr: >
  `ResizeObserver` calls you after layout whenever an observed element's box size changes, starting
  with its initial size. Entries carry `contentBoxSize`, `borderBoxSize` and
  `devicePixelContentBoxSize` arrays. A callback that resizes what it observes can only re-run for
  deeper elements in that frame; the rest wait a frame and the browser reports "ResizeObserver
  loop completed with undelivered notifications."
---

## Answer

`ResizeObserver` is the per-element counterpart of `window`'s `resize` event. `observer.observe(el, { box })` watches one box of the element: `'content-box'` (the default), `'border-box'` or `'device-pixel-content-box'`. When that box's size differs from the last size reported, the element gets an entry. The first check always differs, so every `observe()` produces an initial entry, even for a `display: none` element (0 × 0).

Each `ResizeObserverEntry` has:

- **`contentBoxSize`, `borderBoxSize`, `devicePixelContentBoxSize`**: frozen arrays of `{ inlineSize, blockSize }`, logical sizes that follow `writing-mode`. They're arrays so that fragmented elements (multi-column) can someday report each fragment; today they hold one item.
- **`contentRect`**: the legacy physical rectangle, kept for compatibility.

The callbacks run inside the browser's rendering update, after style and layout and before paint, so reading sizes there is cheap and changes made there show in the same frame.

Only layout size counts. `transform` never triggers a callback, and changing padding doesn't trigger a `content-box` observation.

**The loop error.** Resizing elements inside the callback forces another layout, and the browser loops: it recomputes layout and delivers again, but only to observations of elements deeper in the tree than the shallowest one just delivered. Anything at the same depth or shallower is skipped for this frame, delivered in the next one, and the browser reports an `ErrorEvent` at `window` with the message "ResizeObserver loop completed with undelivered notifications." It isn't thrown, so `try`/`catch` can't see it, but `window.onerror` and error-monitoring tools do.

The depth rule guarantees the loop ends. The fix is to not resize what you observe from its own callback, or to make the change converge. When the reaction is pure styling, CSS container queries do it without script.

## Example

```js
const box = document.createElement('div');
box.style.cssText = 'width: 200px; padding: 10px; border: 5px solid';
document.body.append(box);
addEventListener('error', (event) => console.log(event.message));

let runs = 0;
const observer = new ResizeObserver(([entry]) => {
  const [content] = entry.contentBoxSize; // arrays: one item per fragment
  const [border] = entry.borderBoxSize;
  console.log(`content ${content.inlineSize}, border ${border.inlineSize}`);
  if (++runs < 3) box.style.width = `${content.inlineSize + 50}px`; // resizes what it observes
});
observer.observe(box); // default box: 'content-box'

setTimeout(() => {
  box.style.transform = 'scale(2)'; // no callback: transforms don't change layout size
  box.style.padding = '20px'; // no callback: the content box didn't change
}, 500);
// → content 200, border 230
// → ResizeObserver loop completed with undelivered notifications.
// → content 250, border 280
// → ResizeObserver loop completed with undelivered notifications.
// → content 300, border 330
```

Same output in Chrome 156 and Firefox 159, three runs each. Each resize lands one frame later, after an error.

## Pitfalls

- Silencing the error with `requestAnimationFrame`. Deferring the resize to the next frame does stop the message (verified in both browsers), but a callback that keeps resizing its own target still runs every frame.
- Expecting entries only on real changes after `observe()`. The initial entry arrives even for hidden elements, often with zeros.
- Reading `contentRect` and assuming it follows the observed box. It's always the content box, physical width and height, whatever `box` you chose; for a `vertical-rl` element `contentBoxSize[0].inlineSize` is its height.
- Using `ResizeObserver` for layout CSS can express. Toggling classes by a container's width is what container queries are for.

## Follow-ups

**Q:** What does the loop `ErrorEvent` look like?
**A:** In both browsers: message as above, `lineno` 0, no `error` object. Chrome 156 sets `filename` to the page URL and makes it cancelable; Firefox 159 leaves `filename` empty and it isn't cancelable. Chrome doesn't print it to the console at all.

**Q:** Why `device-pixel-content-box`?
**A:** For pixel-exact canvas sizing: it reports the content box in whole device pixels as the browser actually snapped it, which multiplying by `devicePixelRatio` can't reproduce. A 100.6 px-wide canvas reported 101 at DPR 1. Chrome 84 and Firefox 108 support it; Safari doesn't.

**Q:** Does removing an observed element produce an entry?
**A:** Yes. Its size becomes 0 × 0, which differs from the last report. `display: none` does the same: in both browsers the box reported `0` after being hidden.

## Exercises

### Deeper is fine

```js
document.body.innerHTML = '<div id="outer" style="height: 100px"><div id="inner"></div></div>';
addEventListener('error', (event) => console.log(event.message));

const observer = new ResizeObserver((entries) => {
  console.log(entries.map((e) => `${e.target.id} ${e.contentRect.height}`).join(', '));
  inner.style.height = '50px';
});
observer.observe(outer);
observer.observe(inner);
```

**Answer:** `outer 100, inner 0`, then `inner 50`, with no error. `inner` is deeper than `outer`, the shallowest element delivered, so its change is delivered again in the same frame. Remove `style="height: 100px"` and `outer` grows with its child: the output becomes `outer 0, inner 0`, `inner 50`, the loop error, then `outer 50` a frame later. Same in Chrome 156 and Firefox 159.
