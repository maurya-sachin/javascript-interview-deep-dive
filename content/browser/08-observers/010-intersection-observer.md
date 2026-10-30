---
title: "How does `IntersectionObserver` work, and why use it over scroll listeners?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [intersection-observer, lazy-loading, visibility, root-margin, threshold]
related:
  - browser/rendering-pipeline/forced-synchronous-layout
  - browser/observers/observer-timing
  - browser/html-event-loop/rendering-steps
  - browser/observers/resize-observer
verified: 2026-10
perishable:
  - "Chrome 156, Firefox 159: isIntersecting false below the lowest threshold"
  - "scrollMargin: Chrome 120, Firefox 141, Safari 26"
  - "trackVisibility and delay: Chrome 74 only"
  - "Chrome 156 throws NotSupportedError for trackVisibility with delay < 100"
sources:
  - https://w3c.github.io/IntersectionObserver/#intersection-observer-interface
  - https://w3c.github.io/IntersectionObserver/#intersectionobserver-root-intersection-rectangle
  - https://w3c.github.io/IntersectionObserver/#observe-a-target-element
  - https://w3c.github.io/IntersectionObserver/#run-the-update-intersection-observations-steps
  - https://w3c.github.io/IntersectionObserver/#notify-intersection-observers
  - https://w3c.github.io/IntersectionObserver/#dom-intersectionobserverinit-scrollmargin
  - https://w3c.github.io/IntersectionObserver/#initialize-a-new-intersectionobserver
  - https://html.spec.whatwg.org/multipage/urls-and-fetching.html#lazy-load-intersection-observer
  - https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver#browser_compatibility
  - https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/scrollMargin#browser_compatibility
  - https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/trackVisibility#browser_compatibility
tldr: >
  `IntersectionObserver` reports when an element's overlap with the viewport or a scrolling
  ancestor crosses a threshold. The browser measures after its own layout, once per frame, and
  calls you only on changes, so there's no scroll handler and no forced layout. `rootMargin` grows
  the root's box to start early. Every observed target gets one initial entry.
---

## Answer

A scroll listener that checks visibility runs on every scroll event and measures the element itself, usually with `getBoundingClientRect()`, which can force a synchronous layout. `IntersectionObserver` hands that job to the browser. You create it with a callback and options, then `observe()` each target:

- **`root`**: the box targets are tested against. `null` (the default) means the top-level viewport; otherwise an element or document that contains the targets.
- **`rootMargin`**: CSS-margin-style offsets that grow or shrink the root's box. `'0px 0px 300px 0px'` treats anything within 300 px below the viewport as intersecting.
- **`threshold`**: one ratio or a list, as fractions of the target's area. The default `0` means any overlap, even edges touching.

In each rendering update, after layout, the browser computes every target's intersection. It queues an entry only when the target moved into a different threshold band or flipped `isIntersecting`, then calls the callback in a later task with all of that observer's queued entries. An entry has `isIntersecting`, `intersectionRatio`, `intersectionRect`, `boundingClientRect`, `rootBounds`, `target` and `time`.

Every `observe()` gives one initial entry, even for an element far off-screen (`isIntersecting: false`), so the starting state goes through the same code as later changes.

With 20 real wheel steps of 60 px past a target, the page got 20 `scroll` events and 1 observer callback, in Chrome 156 and Firefox 159, three runs each.

Typical uses: lazy loading, infinite-scroll sentinels, viewability analytics, pausing off-screen video or animation. Native `loading="lazy"` is itself specified as an `IntersectionObserver` the browser owns; use the attribute for plain images and iframes, and the API when you need a callback. Call `unobserve(target)` once a one-shot target is handled and `disconnect()` to stop everything.

## Example

```html
<style>body { margin: 0; } img { display: block; width: 300px; height: 300px; }</style>
<main id="feed"></main>
<script type="module">
  for (let i = 0; i < 10; i++) {
    feed.insertAdjacentHTML('beforeend', `<img data-src="photo-${i}.jpg" alt="">`);
  }

  const observer = new IntersectionObserver((entries) => {
    const loaded = [];
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.src = entry.target.dataset.src;
      observer.unobserve(entry.target); // load once, then stop watching
      loaded.push(entry.target.dataset.src);
    }
    console.log(`${entries.length} entries, loaded: ${loaded.join(' ')}`);
  }, { rootMargin: '0px 0px 300px 0px' }); // start 300px before an image scrolls in

  document.querySelectorAll('img[data-src]').forEach((img) => observer.observe(img));
  setTimeout(() => scrollTo(0, 1000), 500);
  // → 10 entries, loaded: photo-0.jpg photo-1.jpg photo-2.jpg photo-3.jpg
  // → 3 entries, loaded: photo-4.jpg photo-5.jpg photo-6.jpg
</script>
```

Same output in Chrome 156 and Firefox 159 with a 1024×768 viewport. The first callback holds all ten initial entries. The second holds three: images 7–9 are still outside the margin, so nothing changed for them, and 0–3 are no longer observed.

## Pitfalls

- Treating every entry as "became visible". The initial entry and exit entries arrive too; check `isIntersecting`.
- Reading `isIntersecting` with thresholds above 0. The spec says it's true for any overlap, but in Chrome 156 and Firefox 159 it stays `false` until the ratio reaches the lowest threshold: with `threshold: [0.5]`, a target 1% in view logged `false`. Compare `intersectionRatio` with your threshold instead.
- Expecting `rootMargin` to work in a cross-origin iframe. With the implicit root, the spec ignores `rootMargin` for cross-origin targets and gives them `rootBounds: null`; both browsers did exactly that.
- Expecting `rootMargin` to reach past a nested scroller. It grows only the root's box; a target clipped by an inner `overflow: auto` container stays clipped. `scrollMargin` grows every scrollport on the way (Chrome 120, Firefox 141, Safari 26).

## Follow-ups

**Q:** What if the target isn't inside `root`?
**A:** No error. The spec skips the geometry, so the entry says `isIntersecting: false`, ratio 0, and an all-zero `boundingClientRect`. Both browsers reported exactly that.

**Q:** Can it tell whether an element is actually seen, not covered or faded out?
**A:** IntersectionObserver v2: `trackVisibility: true` with `delay` adds `isVisible`, which is false when the target is covered, transformed, filtered or not fully opaque. Only Chrome ships it (since 74). The spec raises `delay` to 100; Chrome 156 throws `NotSupportedError` instead when it's below 100.

**Q:** When does the callback run relative to scrolling and paint?
**A:** Intersections are computed in the rendering update after layout; the callback runs in a separate task queued from there, so it's never synchronous with the scroll. See the timing question.

## Deep dive

### How it works

`observe()` stores a registration on the target with `previousThresholdIndex` set to -1 and `previousIsIntersecting` set to `false`. In each rendering update the *update intersection observations steps* run for every observer, in `observe()` order for its targets:

1. Compute the target's bounding box and clip it by every scrolling ancestor up to the root, then by the root intersection rectangle (the root's box plus `rootMargin`).
2. `isIntersecting` is true if the boxes overlap or touch; `intersectionRatio` is intersection area over target area (1 or 0 for a zero-area target).
3. `thresholdIndex` is the index of the first threshold greater than the ratio.
4. If `thresholdIndex` or `isIntersecting` differs from the stored values, queue an entry and store the new ones.

Because the stored index starts at -1, the first computation always differs, which is where the initial entry comes from. Queuing an entry queues one *notify intersection observers* task per document, which invokes each observer's callback with its whole queue.

### Edge cases

Measured in Chrome 156 and Firefox 159 (both agreed):

| Target | Options | `isIntersecting`, ratio |
|---|---|---|
| Top edge exactly at the viewport bottom | default | `true`, 0 |
| Same | `threshold: [0.25, 0.5, 1]` | `false`, 0 |
| Half below the fold | default | `true`, 0.5 |
| Zero-height, on screen | default | `true`, 1 |
| 50 px below an inner scroller's visible area | `rootMargin: '100px'` | `false` |
| Same | `scrollMargin: '100px'` | `true` |

`threshold` values outside 0–1 throw a `RangeError`; an invalid `rootMargin` throws a `SyntaxError`. The `rootMargin` getter returns the normalised four-value form: `'0px 0px 0px 0px'` by default.

## Exercises

### Touching the edge

```js
const el = document.createElement('div');
el.style.cssText = `position: absolute; top: ${innerHeight}px; width: 100px; height: 100px`;
document.body.append(el);

new IntersectionObserver(([entry]) => {
  console.log(entry.isIntersecting, entry.intersectionRatio);
}).observe(el);
```

**Answer:** `true 0`. The element's top edge touches the viewport's bottom edge, and an edge-adjacent target counts as intersecting with zero area. Same in Chrome 156 and Firefox 159.
