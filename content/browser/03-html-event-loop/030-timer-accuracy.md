---
title: "Why doesn't `setTimeout(fn, 0)` run after 0 ms?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [settimeout, setinterval, timers, throttling, background-tabs, event-loop]
related:
  - javascript/async-and-the-event-loop/task-microtask-ordering
  - javascript/async-and-the-event-loop/event-loop
  - javascript/closures/debounce-throttle-once
  - browser/html-event-loop/rendering-steps
  - browser/html-event-loop/request-animation-frame
  - browser/html-event-loop/task-priority-and-scheduler
verified: 2026-10
perishable:
  - Chrome's intensive throttling of chained timers in hidden pages
  - Hidden-page timers ran once per second in Chrome 156, Firefox 159
  - setInterval catch-up differs between Chrome 156 and Firefox 159
sources:
  - https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timers
  - https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timer-initialisation-steps
  - https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#run-steps-after-a-timeout
  - https://html.spec.whatwg.org/multipage/webappapis.html#windoworworkerglobalscope-mixin
  - https://webidl.spec.whatwg.org/#abstract-opdef-converttoint
  - https://developer.chrome.com/blog/timer-throttling-in-chrome-88
tldr: >
  The delay is a minimum, not a schedule. When it expires the timer only queues a task, which waits
  for the running task, its microtasks, other tasks and rendering. Nested timers are clamped to 4 ms,
  hidden pages are throttled to about once per second, and delays above 2³¹−1 ms wrap around and
  fire at once.
---

## Answer

A timer never runs code at a time; it queues a task. The HTML Standard's *run steps after a timeout* waits at least the delay, optionally longer, and then queues the callback on the timer task source. The callback still has to wait for:

- **The running task and its microtasks.** A 10 ms timer set before 200 ms of synchronous work runs after 200 ms.
- **Other queued tasks and rendering.** The browser chooses which task queue to serve next, and timers aren't top priority.
- **The nesting clamp.** After five nested levels, delays under 4 ms become 4 ms (see the JavaScript async chapter).
- **Power-saving padding.** The spec lets browsers wait "a further implementation-defined length of time". With a headless page hidden behind another tab, Chrome 156 and Firefox 159 both ran a 100 ms interval once per second. Chrome goes further: after a page has been hidden for 5 minutes, chained timers wake at most once a minute (*intensive throttling*, since Chrome 88).

Two more traps:

- **The delay is a Web IDL `long`.** Values are converted modulo 2³², so anything above 2,147,483,647 ms (about 24.8 days) wraps around, usually to a negative number, which is treated as 0. A 30-day timeout fires immediately; `Infinity` becomes 0 too.
- **`setInterval` doesn't catch up.** If the main thread is blocked through several periods, the callback runs once when it's free, not once per missed period. The spec re-arms the interval after each callback, but neither engine follows that exactly: a 50 ms callback on a 100 ms interval still started every 100 ms in Chrome 156 and Firefox 159.

So use timers for "not before", never for "exactly at". For visual updates use `requestAnimationFrame`; for yielding, `scheduler.yield()`.

## Example

```js
const busy = (ms) => { const end = performance.now() + ms; while (performance.now() < end) {} };
const start = performance.now();
setTimeout(() => console.log('30 days'), 30 * 24 * 60 * 60 * 1000);
setTimeout(() => {
  console.log(`ran after 200 ms or more: ${performance.now() - start >= 200}`);
}, 10);
busy(200);
// → 30 days
// → ran after 200 ms or more: true
```

The 30-day delay wraps to a negative number and fires first; the 10 ms timer waits for the busy task. Chrome 156 and Firefox 159 printed the same in three runs each.

## Pitfalls

- Building a clock or countdown by counting `setInterval` ticks. Ticks are late, skipped while the thread is busy, and throttled in hidden pages; derive time from `performance.now()` or `Date.now()`.
- Scheduling far-future work with one timer. Past about 24.8 days the delay wraps around; store the target time and re-check with shorter timers.
- Assuming a background tab keeps polling at your interval. Hidden pages get once-per-second wake-ups, and Chrome cuts chained timers to once a minute after 5 minutes.
- Using `setTimeout(fn, 0)` to yield inside a long job. Each yield queues behind every other task and hits the 4 ms clamp once nested; `scheduler.yield()` avoids both.

## Follow-ups

**Q:** What happens to a 100 ms interval blocked for 1,050 ms?
**A:** It runs once, about 1,050 ms in. Chrome 156 then went back to its original 100 ms grid (next run at 1,201 ms); Firefox 159 re-based on the late run (1,250 ms). Neither replayed the missed runs.

**Q:** Do timers count time while a page is in the back/forward cache?
**A:** No. On a `Window`, the spec waits until the document has been fully active for the delay, so time spent in the bfcache doesn't count.

**Q:** Is `setTimeout(fn, 0)` ever 0 ms?
**A:** For an un-nested call it can be: from a message task, Chrome 156 measured 0 ms at its 0.1 ms clock resolution, and Firefox 159 0–2 ms at 1 ms resolution, over five runs each.

**Q:** Which hidden pages does Chrome throttle less?
**A:** Its post spares pages that played sound in the last 30 seconds from any background throttling, and pages with live WebRTC connections from intensive throttling, so media and call apps keep working.

## Exercises

### How many times has the interval run?

```js
const busy = (ms) => { const end = performance.now() + ms; while (performance.now() < end) {} };
let runs = 0;
const id = setInterval(() => runs++, 100);
busy(1000);
setTimeout(() => {
  console.log(runs);
  clearInterval(id);
}, 50);
```

**Answer:** `1`. Ten periods passed while the thread was busy, but the interval runs once when it's free, at about 1,000 ms; its next run is due near 1,100 ms, after the 50 ms timeout fires at about 1,050 ms. Chrome 156 and Firefox 159 printed `1` in three runs each.
