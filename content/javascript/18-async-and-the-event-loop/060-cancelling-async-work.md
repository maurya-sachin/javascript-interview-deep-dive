---
title: "How do you cancel async work?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [abortcontroller, abortsignal, cancellation, timeout, fetch, abort-reason, throwifaborted]
related:
  - javascript/promises/promise-combinators
  - javascript/async-and-the-event-loop/sequential-vs-parallel-await
  - javascript/async-and-the-event-loop/concurrency-limit-retry
verified: 2026-10
sources:
  - https://dom.spec.whatwg.org/#interface-abortcontroller
  - https://dom.spec.whatwg.org/#interface-AbortSignal
  - https://developer.mozilla.org/en-US/docs/Web/API/AbortController
  - https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal
  - https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static
  - https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static
  - https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/throwIfAborted
  - https://nodejs.org/docs/latest-v24.x/api/globals.html#class-abortsignal
tldr: >
  A promise cannot be cancelled. Cancellation is a separate signal you pass in. Create an `AbortController`,
  give `controller.signal` to the work, and call `controller.abort(reason)`. The work must listen for the
  signal, stop, and reject with `signal.reason`. `AbortSignal.timeout(ms)` aborts on a timer and
  `AbortSignal.any([...])` combines signals.
---

## Answer

Promises have no cancel method. A promise only reports an outcome, so you cancel the **work**, with a signal that the work agrees to watch.

- **`AbortController`** owns the switch. `controller.signal` is an `AbortSignal` you hand out. `controller.abort(reason)` sets `signal.aborted` to `true`, stores `signal.reason`, and fires an `abort` event once. `abort()` with no reason uses an `AbortError` `DOMException`.
- **APIs that accept `{ signal }`** do the rest. `fetch` rejects with `signal.reason`, and Node's `timers/promises`, `events.once` and streams accept signals too.
- **Your own functions** must cooperate. Check `signal.throwIfAborted()` at the start and between steps, add an `abort` listener to stop timers or requests, reject with `signal.reason`, and remove the listener when done.
- **`AbortSignal.timeout(ms)`** returns a signal that aborts after `ms` with a `TimeoutError`. It is the clean replacement for `Promise.race` with a timer, because it cancels the work.
- **`AbortSignal.any([a, b])`** returns a signal that aborts when any input aborts, with that input's reason. Use it to combine a user cancel with a timeout. Both static methods exist in Node 24; browsers support them in current versions (check MDN's compatibility table for older ones).
- **Aborting is cooperative.** If the work ignores the signal, it keeps running. Abort only changes work that is built to listen.

## Example

```js
function sleep(ms, { signal } = {}) {
  return new Promise((resolve, reject) => {
    signal?.throwIfAborted();
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(signal.reason);
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

const controller = new AbortController();
setTimeout(() => controller.abort(), 20);
try {
  await sleep(1000, { signal: controller.signal });
} catch (error) {
  console.log(error.name, '|', error.message, '|', controller.signal.aborted);
}
// → AbortError | This operation was aborted | true
```

## Pitfalls

- Using `Promise.race([work, timeout])` and calling it cancellation. The loser keeps running. Pass `AbortSignal.timeout(ms)` to the work.
- Catching every error and treating it as a failure. An abort rejects too. Check `error.name === 'AbortError'` (or `'TimeoutError'`) and handle it as an expected outcome, not an incident.
- Reusing an aborted controller. A signal aborts once and stays aborted. Create a new `AbortController` for the next operation, such as for each search keystroke.
- Leaving an `abort` listener on a long-lived signal. Pass `{ once: true }` and remove the listener when the work finishes, or the listener stays registered for as long as the signal lives.

## Follow-ups

**Q:** What does `fetch` do when aborted?
**A:** It rejects with the signal's reason, and the browser or Node.js drops the request. In Node 24 against a local server, an `AbortSignal.timeout(50)` signal rejected with a `TimeoutError`, and a manual `abort()` rejected with an `AbortError`.

**Q:** What is the difference between `signal.throwIfAborted()` and checking `signal.aborted`?
**A:** `throwIfAborted()` throws `signal.reason` if the signal is aborted and does nothing otherwise. It is the one-line guard for the top of a function or loop body. Checking `aborted` lets you choose a different exit.

**Q:** How do you cancel on timeout or on user action, whichever comes first?
**A:** `AbortSignal.any([userController.signal, AbortSignal.timeout(5000)])`. The combined signal's `reason` tells you which one fired.

## Exercises

### Which reason wins

```js
const user = new AbortController();
const signal = AbortSignal.any([user.signal, AbortSignal.timeout(5000)]);
user.abort(new Error('cancelled by user'));
console.log(signal.aborted, signal.reason.message);
```

**Answer:** `true cancelled by user`. `any` aborts as soon as one source aborts, with that source's reason. The 5-second timer is never the cause. A signal that is already aborted when passed to `any` makes the result aborted at once too.

### Guard a loop

```js
async function processAll(items, { signal }) {
  const done = [];
  for (const item of items) {
    signal.throwIfAborted();
    await new Promise((resolve) => setTimeout(resolve, 10));
    done.push(item);
  }
  return done;
}
const controller = new AbortController();
setTimeout(() => controller.abort(), 25);
console.log(await processAll([1, 2, 3, 4, 5], { signal: controller.signal }).catch((e) => e.name));
```

**Answer:** `AbortError`. The signal aborts at about 25 ms, while the third item is being processed. The next `throwIfAborted()` throws and the function rejects. How many items finish first depends on timing, but the rejection does not.
