---
title: "How do you schedule work by priority with `scheduler.postTask()` and `scheduler.yield()`?"
status: draft
difficulty: hard
frequency: 3
core: false
tags: [scheduler, posttask, yield, task-priority, taskcontroller, long-tasks, event-loop]
related:
  - browser/html-event-loop/rendering-steps
  - browser/html-event-loop/timer-accuracy
  - browser/html-event-loop/request-idle-callback
  - javascript/async-and-the-event-loop/event-loop
  - browser/workers/web-workers
verified: 2026-10
perishable:
  - Supported in Chrome 94, Firefox 142; not in Safari
  - "`scheduler.yield()` shipped in Chrome 129 and Firefox 142"
  - Chrome and Firefox order scheduler tasks against timers differently
sources:
  - https://wicg.github.io/scheduling-apis/#sec-scheduler
  - https://wicg.github.io/scheduling-apis/#dom-scheduler-posttask
  - https://wicg.github.io/scheduling-apis/#dom-scheduler-yield
  - https://wicg.github.io/scheduling-apis/#schedule-a-yield-continuation
  - https://wicg.github.io/scheduling-apis/#scheduler-task-queue-effective-priority
  - https://wicg.github.io/scheduling-apis/#sec-patches-html-event-loop-processing
  - https://wicg.github.io/scheduling-apis/#sec-controlling-tasks
  - https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model
  - https://developer.chrome.com/blog/use-scheduler-yield
  - https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/postTask#browser_compatibility
  - https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield#browser_compatibility
tldr: >
  `scheduler.postTask(fn, { priority })` queues a task at `user-blocking`, `user-visible` (default) or
  `background` priority and returns a promise for its result. `await scheduler.yield()` ends the current
  task so input and rendering can run, then resumes ahead of other tasks of the same priority. A
  `TaskController` changes priority or aborts. Chrome and Firefox support it; Safari doesn't.
---

## Answer

The HTML event loop runs one task at a time and lets the browser choose which queue to serve, but a page had no way to say which of *its* tasks matter more. The Prioritized Task Scheduling API adds that.

**`scheduler.postTask(callback, options)`** queues a task and returns a promise for the callback's return value (rejected if it throws or is aborted). Options:

- `priority`: `"user-blocking"` (work the user is waiting on), `"user-visible"` (the default) or `"background"` (logging, prefetching).
- `signal`: an `AbortSignal` to cancel, or a `TaskSignal` from a `TaskController`, whose `setPriority()` moves pending tasks to a new priority and fires `prioritychange`.
- `delay`: milliseconds to wait before queueing.

Among scheduler tasks, the highest priority runs first and ties go to the oldest. How they interleave with timers, messages, input and rendering is up to the browser; the spec suggests running `background` only when nothing else is waiting.

**`await scheduler.yield()`** splits a long task. The rest of the function becomes a *continuation* task, so input handling and rendering get a turn first. Unlike `setTimeout(fn, 0)`, the continuation:

- runs one step above tasks of the same priority, so work queued meanwhile doesn't jump ahead;
- inherits the priority and abort signal of the `postTask()` task it came from (`user-visible` otherwise);
- isn't a timer, so no nesting clamp or hidden-page timer throttling (a `delay` option is a timer, though).

Before this API, libraries yielded with a `MessageChannel` message: no clamp, but no priority either, so the continuation waits its turn like any other task.

Support: Chrome 94 and Firefox 142 (`yield()` since Chrome 129); Safari has neither. Feature-detect with `'scheduler' in globalThis` and fall back to `setTimeout`. Work that is CPU-bound rather than input-bound belongs in a worker instead.

## Example

```js
const log = [];
scheduler.postTask(() => log.push('background'), { priority: 'background' });
scheduler.postTask(() => log.push('user-visible'));
scheduler.postTask(() => log.push('user-blocking'), { priority: 'user-blocking' });

scheduler.postTask(async () => {
  log.push('job part 1');
  scheduler.postTask(() => log.push('other task'));
  await scheduler.yield();
  log.push('job part 2');
});

setTimeout(() => console.log(log.join(', ')), 100);
// → user-blocking, user-visible, job part 1, job part 2, other task, background
```

`other task` was queued before the yield, at the same priority, yet `job part 2` ran first. Chrome 156 and Firefox 159 printed this in three runs each.

## Pitfalls

- Yielding with `await Promise.resolve()` or `queueMicrotask()`. Microtasks run before rendering and input, so nothing is yielded.
- Assuming `setTimeout(fn, 0)` is a cheap yield. A loop of 100 awaited `setTimeout(0)` yields took 394–428 ms in Chrome 156 and Firefox 159 (three runs each) because of the nesting clamp; `scheduler.yield()` and `MessageChannel` took 0–3 ms.
- Expecting the same order against other task sources everywhere. With a 0 ms timer, a message and three `postTask()` priorities queued together, Chrome 156 ran the timer and message before `user-visible`; Firefox 159 ran the timer last.
- Aborting a task's own signal from inside its callback. The task's promise is still pending at that point, so it rejects with an `AbortError` even though the callback ran.

## Follow-ups

**Q:** What priority does `scheduler.yield()` use inside a `requestIdleCallback` callback?
**A:** `background`. The scheduling spec patches idle callbacks to run with a fixed `background` priority, and the continuation inherits it.

**Q:** Does the inherited priority survive other `await`s before the yield?
**A:** Yes. The spec stores the scheduling state with promise jobs, so a `yield()` after an awaited timer or `fetch()` inside a `background` task still yielded at `background` priority in Chrome 156 and Firefox 159.

**Q:** Does yielding slow down in a background tab?
**A:** Not like timers. In a headless page hidden behind another tab, 100 chained `scheduler.yield()` calls took 3–5 ms, while just 10 chained `setTimeout(0)` calls took 3.7 s in Chrome 156 and 9 s in Firefox 159.

**Q:** When should a long job yield?
**A:** Often enough that no chunk blocks input for long, for example after each batch or whenever `performance.now()` shows several milliseconds since the last yield. Long tasks delay the next frame and the response to input.

## Exercises

### What order?

```js
const log = [];
const controller = new TaskController({ priority: 'background' });
scheduler.postTask(() => log.push('A'), { signal: controller.signal });
scheduler.postTask(() => log.push('B'));
scheduler.postTask(() => controller.abort(), { priority: 'user-blocking' });
scheduler.postTask(() => log.push('C'), { signal: controller.signal })
  .catch((error) => log.push(`C: ${error.name}`));
controller.setPriority('user-blocking');
setTimeout(() => console.log(log.join(', ')), 100);
```

**Answer:** `A, C: AbortError, B`. `setPriority()` lifts `A` and `C` to `user-blocking`. Among the three `user-blocking` tasks the oldest runs first: `A`, then the abort, which rejects `C` before it runs. `B` (`user-visible`) comes last. Chrome 156 and Firefox 159 agreed.
