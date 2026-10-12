---
title: "Predict the order: `setTimeout` vs promises vs `queueMicrotask`."
status: draft
difficulty: medium
frequency: 5
core: false
tags: [microtask, task, settimeout, queuemicrotask, promise, nexttick, timer-clamping, starvation]
related:
  - javascript/async-and-the-event-loop/event-loop
  - javascript/promises/promise-chaining
  - javascript/async-and-the-event-loop/async-await-mechanics
verified: 2026-10
sources:
  - https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model
  - https://html.spec.whatwg.org/multipage/webappapis.html#perform-a-microtask-checkpoint
  - https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timer-initialisation-steps
  - https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#microtask-queuing
  - https://tc39.es/ecma262/#sec-newpromisereactionjob
  - https://tc39.es/ecma262/#sec-newpromiseresolvethenablejob
  - https://nodejs.org/docs/latest-v24.x/api/process.html#when-to-use-queuemicrotask-vs-processnexttick
  - https://nodejs.org/docs/latest-v24.x/api/timers.html#settimeoutcallback-delay-args
  - https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide
tldr: >
  Run all synchronous code, then every microtask (promise reactions, `queueMicrotask`), including
  microtasks queued along the way, and only then the next task such as a timer. Timers never run
  early, and delays are clamped (1 ms in Node.js, 4 ms for deeply nested timers in browsers). In Node.js,
  `process.nextTick` callbacks have their own queue, drained before promise jobs in CommonJS.
---

## Answer

Work through the code in this order:

1. **Synchronous code.** The whole script is one task. It runs to the end first.
2. **Microtasks.** When the stack is empty, the microtask queue runs until it is empty. It holds promise reaction jobs and `queueMicrotask` callbacks, in the order they were queued. A microtask queued by a microtask joins the same drain.
3. **The next task.** Only then does the loop pick another task, such as a timer callback. Each task is followed by its own microtask drain.

Details that decide trick questions:

- **A `.then` handler is queued when its promise settles.** On a settled promise, `then` queues the job at once. A chain `a.then(f).then(g)` queues `g` only after `f` has run, so two chains advance one step per round, interleaved.
- **Returning a promise from a handler is slower than returning a value.** Adopting a promise needs a job to call its `then`, and a further job for the reaction: two extra ticks for a native promise.
- **Timer delays are minimums, and they are clamped.** The HTML Standard raises a timeout below 4 ms to 4 ms once the timer nesting level is over 5, which covers chained `setTimeout` calls and `setInterval`. Node.js sets a delay below 1 ms to 1 ms, so `setTimeout(f, 0)` and `setTimeout(f, 1)` are the same delay and run in call order.
- **Node.js adds `process.nextTick`.** Its queue is drained before the microtask queue in CommonJS. In an ES module, promise jobs run first, because the module already runs inside a microtask drain.
- **Errors differ.** A throw inside a promise handler rejects the derived promise. A throw inside a `queueMicrotask` callback is reported as an uncaught exception, as HTML invokes the callback with "report".

## Example

```js
console.log('1 script start');

setTimeout(() => console.log('6 timeout'), 0);

queueMicrotask(() => console.log('3 queueMicrotask'));

Promise.resolve()
  .then(() => {
    console.log('4 then 1');
    setTimeout(() => console.log('7 timeout from then'), 0);
  })
  .then(() => console.log('5 then 2'));

console.log('2 script end');
// → 1 script start
// → 2 script end
// → 3 queueMicrotask
// → 4 then 1
// → 5 then 2
// → 6 timeout
// → 7 timeout from then
```

## Pitfalls

- Believing `setTimeout(fn, 0)` runs before a resolved promise because it was written first. Order of writing does not matter across queues: all microtasks run before any timer.
- Writing a recursive `queueMicrotask` or promise loop that never ends. Timers, I/O and rendering never get a turn, because the drain only stops when the queue is empty. Use a timer or other task when you need to give the loop room.
- Relying on exact tick counts. They follow from spec steps, and a spec edit or a different promise implementation can change them. Rely on the guarantees (a chain runs in order, handlers run asynchronously), not on counting.
- Mixing up `process.nextTick` with `setImmediate`. `nextTick` runs right after the current operation, before promise jobs in CommonJS. `setImmediate` runs in the check phase of a later loop iteration. Node.js now documents `nextTick` as legacy and recommends `queueMicrotask`.

## Follow-ups

**Q:** `queueMicrotask(f)` or `Promise.resolve().then(f)`?
**A:** Prefer `queueMicrotask`. It states the intent, allocates no promise, and an error in `f` surfaces as an uncaught exception rather than an unhandled rejection of a promise nobody holds.

**Q:** Does `await` always take one tick?
**A:** Awaiting a native promise takes one tick after it settles. Awaiting a thenable takes more, because a job calls its `then` first. See the async/await question.

**Q:** Why does Node.js log `timeout 0` and `timeout 1` in call order?
**A:** Node treats a delay below 1 ms as 1 ms. Both timers have the same delay, so they fire in the order they were created.

## Exercises

### Count the ticks

```js
const p = Promise.resolve();
p.then(() => Promise.resolve('x')).then(() => console.log('returned a promise'));
p.then(() => 1)
  .then(() => console.log('tick 1'))
  .then(() => console.log('tick 2'))
  .then(() => console.log('tick 3'));
```

**Answer:** `tick 1`, `tick 2`, `returned a promise`, `tick 3` (run in Node 24). Returning a promise from the first handler makes its derived promise adopt it. That needs a job to call `then`, and another to deliver the result, so the first chain's last step lands two ticks later than a plain value would.

### Which error is which

```js
process.on('uncaughtException', (e) => console.log('uncaughtException:', e.message));
process.on('unhandledRejection', (e) => console.log('unhandledRejection:', e.message));
queueMicrotask(() => { throw new Error('from queueMicrotask'); });
Promise.resolve().then(() => { throw new Error('from then'); });
```

**Answer:** Both are reported, by different events: `uncaughtException: from queueMicrotask` and `unhandledRejection: from then` (run in Node 24). The first callback has no promise to carry the error. The second throw rejects the promise returned by `then`, and nobody handles it.
