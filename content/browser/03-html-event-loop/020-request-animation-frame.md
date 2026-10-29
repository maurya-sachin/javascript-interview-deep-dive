---
title: "How does `requestAnimationFrame` work, and when do its callbacks run?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [request-animation-frame, animation, event-loop, rendering, frames, background-tabs]
related:
  - browser/html-event-loop/rendering-steps
  - browser/html-event-loop/timer-accuracy
  - browser/rendering-pipeline/forced-synchronous-layout
  - html-and-css/typography-colour-motion/keyframe-animations
  - javascript/async-and-the-event-loop/task-microtask-ordering
verified: 2026-10
perishable:
  - Chrome 156 ran no callbacks in a hidden page
  - Firefox 159 ran hidden-page callbacks about every 1–2 seconds
  - Firefox 159 timestamps sometimes ahead of performance.now()
sources:
  - https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#animation-frames
  - https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#run-the-animation-frame-callbacks
  - https://html.spec.whatwg.org/multipage/webappapis.html#update-the-rendering
  - https://html.spec.whatwg.org/multipage/webappapis.html#rendering-opportunity
  - https://developer.mozilla.org/en-US/docs/Web/API/DedicatedWorkerGlobalScope/requestAnimationFrame#browser_compatibility
tldr: >
  `requestAnimationFrame(cb)` registers a one-shot callback for the next frame. The browser runs all
  registered callbacks in the next "update the rendering", after scroll and resize events and before
  style, layout and paint, passing each the same frame timestamp. Callbacks requested during that run
  wait for the following frame. Hidden pages get few or no frames.
---

## Answer

`requestAnimationFrame(callback)` adds the callback to the document's map of animation frame callbacks and returns a handle for `cancelAnimationFrame()`. It doesn't schedule a task. The callbacks run as one step of **update the rendering**, the work the browser does at each rendering opportunity:

- **After** resize and scroll events, media query changes and CSS animation events.
- **Before** style recalculation, layout and paint, so DOM writes made in a callback appear in that same frame.

Rules that follow from the spec's algorithm:

- **One shot.** Each call registers one callback for one frame. An animation loop calls `requestAnimationFrame` again from inside its callback.
- **Snapshot per frame.** The browser takes the list of handles before running them. A callback requested during the run waits for the next frame; one cancelled during the run doesn't run.
- **One timestamp per frame.** Every callback receives the same `DOMHighResTimeStamp`, the time of the frame's rendering opportunity on the `performance.now()` clock, not the time it was called.
- **Microtasks between callbacks.** Each callback is invoked from an empty stack, so its promise reactions run before the next callback. A callback that throws is reported, and the rest still run.
- **Frame rate, not a fixed rate.** Callbacks run as often as the browser renders: about every 16.7 ms at 60 Hz, possibly faster on high-refresh displays, slower when the page can't keep up.

**Hidden documents** are skipped by update the rendering, so the spec runs no callbacks for them. With a headless page behind another tab (`visibilityState` `"hidden"`), Chrome 156 ran none in 6 seconds; Firefox 159 still ran one every 1–2 seconds.

Use `requestAnimationFrame` for script-driven visual updates: canvas drawing, positions computed from input, batched DOM writes. For declarative motion, CSS animations and transitions need no per-frame script at all.

## Example

```js
const log = [];
let firstTime;
requestAnimationFrame((time) => {
  firstTime = time;
  log.push('A');
  queueMicrotask(() => log.push('microtask'));
  requestAnimationFrame((later) => {
    log.push(`C (next frame: ${later > time})`);
    console.log(log.join(', '));
  });
});
requestAnimationFrame((time) => {
  log.push(`B (same time: ${time === firstTime})`);
});
// → A, microtask, B (same time: true), C (next frame: true)
```

Chrome 156 and Firefox 159 printed this in three runs each. `C`, requested while frame callbacks were running, waits for the next frame.

## Pitfalls

- Moving an object a fixed distance per callback. Speed then depends on the display's refresh rate; scale movement by the time since the previous frame's timestamp.
- Assuming the timestamp is never later than `performance.now()`. In headless Firefox 159 it was ahead by up to 0.7 ms in 49 of 120 frames; Chrome 156 never was.
- Using `requestAnimationFrame` to keep time or poll in the background. Hidden pages get few or no frames; use timers or events for non-visual work.
- Reading layout and then writing styles in one callback for many elements. Each read after a write forces a synchronous layout; read everything first, then write.

## Follow-ups

**Q:** How do you run code right after the next frame is painted?
**A:** Queue a task from a `requestAnimationFrame` callback, such as `setTimeout(fn, 0)`. That task can only start after the rendering task, paint included, has finished.

**Q:** Why not animate with `setInterval(fn, 16)`?
**A:** Timers aren't aligned with rendering opportunities. Some frames get two updates and some none, so motion stutters, and the timer keeps running in hidden pages where nothing is drawn.

**Q:** Does `requestAnimationFrame` exist in workers?
**A:** Yes, in dedicated workers, for drawing to an `OffscreenCanvas`: Chrome 69, Firefox 99 and Safari 16.4.

**Q:** Does a pending callback cost anything when nothing changes?
**A:** Yes. A document with animation frame callbacks is never dropped as "unnecessary rendering", so an idle animation loop keeps the browser rendering every frame.

## Exercises

### Which callbacks run?

```js
const log = [];
const a = requestAnimationFrame(() => log.push('A'));
requestAnimationFrame(() => {
  log.push('B');
  cancelAnimationFrame(c);
  requestAnimationFrame(() => console.log(log.join(', ')));
});
const c = requestAnimationFrame(() => log.push('C'));
requestAnimationFrame(() => log.push('D'));
cancelAnimationFrame(a);
```

**Answer:** `B, D`. `A` is cancelled before the frame. `C` is still in the frame's snapshot of handles, but the algorithm skips any handle no longer in the map, so cancelling it from `B` works. Chrome 156 and Firefox 159 agreed.
