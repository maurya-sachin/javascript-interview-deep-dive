---
title: "How do errors propagate through promises, and what is an unhandled rejection?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [promise, catch, finally, rejection, unhandled-rejection, unhandledrejection, node, error-handling]
related:
  - javascript/promises/promise-chaining
  - javascript/promises/promise-combinators
  - javascript/async-and-the-event-loop/async-await-mechanics
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-promise.prototype.catch
  - https://tc39.es/ecma262/#sec-promise.prototype.finally
  - https://tc39.es/ecma262/#sec-rejectpromise
  - https://tc39.es/ecma262/#sec-host-promise-rejection-tracker
  - https://html.spec.whatwg.org/multipage/webappapis.html#unhandled-promise-rejections
  - https://html.spec.whatwg.org/multipage/webappapis.html#the-hostpromiserejectiontracker-implementation
  - https://html.spec.whatwg.org/multipage/webappapis.html#perform-a-microtask-checkpoint
  - https://nodejs.org/docs/latest-v24.x/api/process.html#event-unhandledrejection
  - https://nodejs.org/docs/latest-v24.x/api/process.html#event-rejectionhandled
  - https://nodejs.org/docs/latest-v24.x/api/cli.html#--unhandled-rejectionsmode
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/finally
  - https://developer.mozilla.org/en-US/docs/Web/API/Window/unhandledrejection_event
tldr: >
  A rejection travels down the chain, skipping fulfillment handlers, until a rejection handler takes it.
  `catch` returns a promise that fulfills with the handler's result, so it recovers unless it rethrows.
  `finally` runs without arguments and passes the outcome through. A rejection with no handler once
  microtasks drain is unhandled: browsers fire `unhandledrejection`, Node throws by default.
---

## Answer

A promise is rejected by `reject(reason)`, by a throw inside the executor or a `then` handler, or by `Promise.reject`. A rejection moves down the chain: each `then` with no `onRejected` passes it on unchanged, until a rejection handler runs.

- **`catch(f)`** is `then(undefined, f)`. It returns a promise that fulfills with whatever `f` returns, so the chain recovers. To keep failing, throw again.
- **`then(a, b)`** does not protect `a`: if `a` throws, `b` is skipped. A `catch` after the `then` sees both.
- **`finally(f)`** runs on either outcome, with no arguments. Its return value is ignored and the original value or reason passes through. But if `f` throws or returns a rejected promise, that rejection replaces the outcome.
- **`try`/`catch`** only catches rejections around an `await`. A throw in a `setTimeout` or event callback cannot reject a promise; wrap that callback in `new Promise` and call `reject`.

**Unhandled rejection.** A promise that is rejected with no handler attached by the time the host checks. The spec only defines a hook, `HostPromiseRejectionTracker`, called with `"reject"` for a rejection without handlers and with `"handle"` when a handler is added to an already rejected promise. Hosts decide what to do:

- **Browsers** (HTML spec): after the microtask queue drains, fire a cancelable `unhandledrejection` event on the global with `promise` and `reason`. `preventDefault()` suppresses the console report. A handler attached later fires `rejectionhandled`.
- **Node:** emits `process.on('unhandledRejection', (reason, promise))`, and `rejectionHandled` for late handlers. If you have no listener, the default mode `throw` raises it as an uncaught exception, so the process exits with code 1 (default since Node 15).

Treat it as a bug: end every chain with a `catch`, an `await` inside `try`, or return it to a caller that handles it.

## Example

```js
const fail = () => Promise.reject(new Error('boom'));

await fail()
  .then(() => console.log('skipped'))
  .catch((error) => {
    console.log('caught', error.message);
    return 'recovered';
  })
  .finally(() => console.log('finally runs'))
  .then((value) => console.log('then', value));
// → caught boom
// → finally runs
// → then recovered

await Promise.resolve('value')
  .finally(() => {
    throw new Error('from finally');
  })
  .catch((error) => console.log(error.message));
// → from finally
```

## Pitfalls

- Forgetting to return or await a promise inside a handler. A rejection from it has no path to your `catch` and becomes unhandled.
- Expecting `try { promise } catch {}` to catch a rejection without `await`. The `try` block finishes first and the rejection arrives later.
- Using `.then(ok, fail)` and expecting `fail` to cover `ok`. It covers only the earlier promise.
- Attaching the handler too late. In Node, a handler added in a `setTimeout` or `setImmediate` misses the check and the process dies (or `unhandledRejection` fires) before it is added.

## Follow-ups

**Q:** Does `catch` stop the chain?
**A:** No. It returns a fulfilled promise (unless the handler throws), so the next `then` runs with the handler's return value, usually `undefined`.

**Q:** Why does `finally` not receive the value?
**A:** It is for cleanup that does not depend on the outcome, so it gets no arguments and cannot replace the result by returning a value. It can only change the outcome by throwing or returning a rejected promise.

**Q:** Which rejections are *not* unhandled?
**A:** One with a handler attached by the time the host checks. Every promise a combinator receives gets a handler from it, so a second rejection after `Promise.all` has already rejected is not reported.

## Deep dive

### How it works

`RejectPromise` sets the state, then checks `[[PromiseIsHandled]]`. If it is false, it calls `HostPromiseRejectionTracker(promise, "reject")`. `PerformPromiseThen` sets `[[PromiseIsHandled]]` to true, and if the promise was already rejected and still unhandled, first calls the tracker with `"handle"`. The spec says only that the tracker "allows host environments to track promise rejections", so the reporting below is host behaviour, not language behaviour.

HTML's implementation: on `"reject"`, append the promise to the global's *about-to-be-notified rejected promises list*. At the end of a microtask checkpoint, after the microtask queue has drained, it queues a task that fires `unhandledrejection` for each listed promise that is still unhandled, and remembers those promises in an *outstanding rejected promises* set. On `"handle"`: if the promise is still on the about-to-be-notified list, remove it and stop (the handler came in time, so no event). If it was already reported, queue a task that fires `rejectionhandled`.

The consequence: a handler attached anywhere in the same microtask checkpoint is in time, even several chained microtasks later. A handler attached from a timer is not.

Node differs in detail but follows the same idea. Its docs say the event is emitted when a promise is rejected and no handler is attached within a turn of the event loop. Checked on Node 24.19:

```js
process.on('unhandledRejection', (reason) => console.log('unhandled', reason.message));
const a = Promise.reject(new Error('a'));
Promise.resolve().then(() => {}).then(() => a.catch(() => console.log('a handled')));
const b = Promise.reject(new Error('b'));
process.nextTick(() => b.catch(() => console.log('b handled')));
const c = Promise.reject(new Error('c'));
setImmediate(() => c.catch(() => console.log('c handled late')));
// → a handled
// → b handled
// → unhandled c
// → c handled late
```

A handler attached from a microtask or `process.nextTick` is in time. One from `setImmediate` is late: `unhandledRejection` fires first, and then `rejectionHandled`.

### Edge cases

`--unhandled-rejections=mode` changes Node's default. From the CLI docs: `throw` (default) emits `unhandledRejection` and, with no listener, raises an uncaught exception; `strict` raises an uncaught exception first and emits `unhandledRejection` only if that exception is handled; `warn` always warns and never exits; `warn-with-error-code` emits the event, otherwise warns and sets exit code 1; `none` silences everything. A rejection during the static loading of the entry ES module always raises an uncaught exception.

A listener changes the exit code. With `process.on('unhandledRejection', …)` set, the process continues and exits 0 unless something else fails, so a log-only listener can hide real failures. This is why a listener is for logging or flushing, followed by a deliberate exit.

```js
process.on('unhandledRejection', (reason) => {
  console.error('fatal:', reason.message);
  process.exitCode = 1;
});
Promise.reject(new Error('lost'));
// → fatal: lost
```

### Real-world scenario

In a browser app, a global `unhandledrejection` listener is the last line for error reporting. Call `event.preventDefault()` to avoid a duplicate console message once you have reported it:

```js
window.addEventListener('unhandledrejection', (event) => {
  reportError(event.reason);
  event.preventDefault();
});
```

This snippet needs a browser (`window`, `reportError`), so it was not run in Node. Prefer fixing the missing handler; use the global listener for monitoring.

## Exercises

### What survives

```js
const result = await Promise.reject(new Error('a'))
  .catch(() => 'recovered')
  .finally(() => 'ignored')
  .then((value) => value.toUpperCase());
console.log(result);
```

**Answer:** `RECOVERED`. `catch` turns the rejection into a fulfillment with `'recovered'`. `finally` ignores its own return value and passes `'recovered'` along, so the last `then` uppercases it.

### Does anything escape

```js
process.on('unhandledRejection', () => console.log('unhandled'));
const p = Promise.reject(new Error('x'));
setTimeout(() => p.catch(() => console.log('late')), 0);
```

**Answer:** `unhandled`, then `late`. Node checks after the microtasks and `nextTick` queue drain, and the `setTimeout` callback runs after that. With the listener present the process stays alive, so the timer still fires.
