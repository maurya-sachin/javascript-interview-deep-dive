---
title: "What does `requestIdleCallback` guarantee, and when does it never run?"
status: draft
difficulty: medium
frequency: 2
core: false
tags: [request-idle-callback, idle-deadline, event-loop, background-work, scheduling]
related:
  - browser/html-event-loop/rendering-steps
  - browser/html-event-loop/task-priority-and-scheduler
  - browser/html-event-loop/timer-accuracy
  - browser/workers/web-workers
verified: 2026-10
perishable:
  - Safari has it only in Technology Preview, behind a flag
  - Hidden-page idle callbacks ran 20/s in Chrome 156, 1/s in Firefox
  - Firefox 159 idle deadlines stayed under 9 ms in headless tests
sources:
  - https://www.w3.org/TR/requestidlecallback/#dom-window-requestidlecallback
  - https://www.w3.org/TR/requestidlecallback/#dom-idledeadline-timeremaining
  - https://www.w3.org/TR/requestidlecallback/#dom-idledeadline-didtimeout
  - https://www.w3.org/TR/requestidlecallback/#dfn-start-an-idle-period
  - https://www.w3.org/TR/requestidlecallback/#dfn-invoke-idle-callback-timeout-algorithm
  - https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model
  - https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback#browser_compatibility
tldr: >
  It guarantees almost nothing: the callback runs in an idle period if one ever comes, with a deadline
  of at most 50 ms that `timeRemaining()` reports. A page that always has tasks queued never gets one,
  so without the `timeout` option the callback may never run. Chrome and Firefox support it; Safari
  doesn't yet.
---

## Answer

`requestIdleCallback(callback, { timeout })` asks the browser to run `callback` when its event loop is idle, and returns a handle for `cancelIdleCallback()`.

**When it runs.** The HTML event loop starts an *idle period* only when no task is runnable. Its deadline is the earliest of:

- 50 ms after the idle period started, so input arriving mid-callback can still be handled within 100 ms;
- the next timer's due time;
- the next expected frame, when animation frame callbacks or other rendering updates are pending.

Callbacks registered before the period started then run in order, each as its own task, until the deadline passes. One registered during the period waits for the next period, so a callback can safely re-register itself.

**The `IdleDeadline` argument.** `timeRemaining()` returns the milliseconds left, never negative; check it between small units of work. `didTimeout` is `true` when the callback ran because its `timeout` expired.

**What it doesn't guarantee:**

- **That it runs.** A page that always has a task queued may never be idle; the spec accepts postponing callbacks "for a potentially unbounded amount of time". The `timeout` option bounds that: once it expires, a task runs the callback with `didTimeout` `true` and `timeRemaining()` `0`.
- **How often.** Browsers may throttle idle periods for hidden pages; the spec suggests one every 10 seconds.
- **A long budget.** In three headless runs, Chrome 156 gave 50 ms on an idle page and about 16 ms with an animation running; Firefox 159 never gave more than 8.6 ms.

Use it for work that can wait: analytics, prefetching, cache warming. Avoid DOM changes in it: their style and layout cost is hard to predict. Safari has `requestIdleCallback` only in Technology Preview behind a flag, so feature-detect and fall back to `setTimeout`.

## Example

```js
const log = [];
const start = performance.now();
requestIdleCallback((deadline) => {
  log.push(`plain: didTimeout=${deadline.didTimeout}, after busy=${performance.now() - start >= 500}`);
});
requestIdleCallback((deadline) => {
  log.push(`timeout: didTimeout=${deadline.didTimeout}, timeRemaining=${deadline.timeRemaining()}`);
}, { timeout: 100 });

// Keep a task queued at all times for 500 ms.
const channel = new MessageChannel();
channel.port1.onmessage = () => {
  if (performance.now() - start < 500) channel.port2.postMessage(null);
};
channel.port2.postMessage(null);
setTimeout(() => console.log(log.join('; ')), 1000);
// → timeout: didTimeout=true, timeRemaining=0; plain: didTimeout=false, after busy=true
```

The callback with `timeout` was forced to run while the page was busy, with no time budget; the plain one waited until the message tasks stopped. Chrome 156 and Firefox 159 printed this in three runs each.

## Pitfalls

- Relying on idle callbacks for work that must happen, such as saving data before the user leaves. Without `timeout` they may never run; flush on `visibilitychange` instead.
- Ignoring `timeRemaining()` and running a 200 ms job in one callback. The deadline is advisory, so the job blocks input exactly like any other long task; split it and re-register.
- Writing to the DOM in an idle callback. The style and layout it triggers can overrun the deadline; prepare the change there and apply it in a `requestAnimationFrame` callback.
- Treating a `timeout` callback like an idle one. With `didTimeout` `true`, `timeRemaining()` is 0: do the minimum and re-register the rest.

## Follow-ups

**Q:** Do idle callbacks run in a hidden tab?
**A:** Less often. With a headless page hidden behind another tab, Chrome 156 ran a self-re-registering callback about 20 times a second and Firefox 159 about once a second.

**Q:** How does it compare with `scheduler.postTask(fn, { priority: 'background' })`?
**A:** `postTask` gives a promise, abort signals and priority changes, and doesn't wait for an idle period, but gives no deadline. It's unavailable in Safari too.

**Q:** Is a heavy computation a good fit?
**A:** Only if it can be cut into small slices. A computation that can't be split belongs in a worker, which leaves the main thread free.

## Exercises

### What order?

```js
const log = [];
requestIdleCallback((deadline) => log.push(`idle (${deadline.timeRemaining() <= 20})`));
setTimeout(() => log.push('timeout 20'), 20);
setTimeout(() => log.push('timeout 0'));
Promise.resolve().then(() => log.push('microtask'));
setTimeout(() => console.log(log.join(', ')), 300);
```

**Answer:** `microtask, timeout 0, idle (true), timeout 20`. The idle period starts only once no task is runnable, so the 0 ms timer goes first. Its deadline is capped by the pending 20 ms timer, so `timeRemaining()` is at most 20. Chrome 156 and Firefox 159 printed this in five runs each.
