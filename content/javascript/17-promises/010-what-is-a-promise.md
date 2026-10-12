---
title: "What is a Promise?"
status: draft
difficulty: easy
frequency: 5
core: true
tags: [promise, pending, fulfilled, rejected, settled, resolved, thenable, microtask]
related:
  - javascript/promises/promise-chaining
  - javascript/promises/promise-error-handling
  - javascript/async-and-the-event-loop/task-microtask-ordering
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-promise-objects
  - https://tc39.es/ecma262/#sec-createresolvingfunctions
  - https://tc39.es/ecma262/#sec-promise-executor
  - https://tc39.es/ecma262/#sec-promise.prototype.then
  - https://tc39.es/ecma262/#sec-newpromisereactionjob
  - https://tc39.es/ecma262/#sec-newpromiseresolvethenablejob
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises
tldr: >
  A promise is an object standing in for a value that is not available yet. It starts pending and settles
  once, to fulfilled (with a value) or rejected (with a reason). Handlers attached with `then` always run
  later, as microtasks. "Resolved" is not "settled": resolving with another promise locks it in while it
  is still pending.
---

## Answer

A promise is an object that stands in for the eventual result of an operation. It is in one of three states:

- **pending:** no result yet.
- **fulfilled:** finished with a value.
- **rejected:** failed with a reason.

Fulfilled and rejected together are **settled**. A promise settles at most once, and its value or reason never changes afterwards.

`new Promise(executor)` calls the executor **synchronously** with two functions, `resolve` and `reject`. If the executor throws, the promise is rejected with that error. Only the first call to `resolve` or `reject` counts; every later call is ignored.

**Resolved** and **settled** are different things. `resolve(x)` fulfills the promise with `x` unless `x` is a thenable (an object whose `then` is a function). Then the promise adopts the thenable's outcome: it is *resolved* (locked in, no further `resolve` or `reject` can change it) but still *pending* until the thenable settles. Resolving a promise with itself rejects it with a `TypeError`.

You consume the result with `then(onFulfilled, onRejected)`, `catch`, or `finally`. Each returns a new promise (see chaining). Handlers are never called synchronously: once the promise is settled, each handler runs as a separate **microtask**, so it runs after the current synchronous code finishes but before the next macrotask (timers, I/O, rendering). This makes the timing the same whether the promise was already settled or not.

Promises are eager: the work starts when the promise is created, not when you call `then`. They are not cancellable, and they carry exactly one result.

## Example

```js
const never = new Promise(() => {});
const locked = new Promise((resolve) => resolve(never));
console.log(locked); // → Promise { <pending> }
// `locked` is resolved (locked in to `never`) but not settled.

const p = new Promise((resolve, reject) => {
  console.log('executor');
  resolve('first');
  resolve('ignored');
  reject(new Error('ignored'));
});
p.then((value) => console.log('then:', value));
console.log('sync end');
// → executor
// → sync end
// → then: first
```

## Pitfalls

- Assuming `resolve(value)` always fulfills. Passing a promise or thenable makes the outer promise follow it, so it may reject or stay pending forever.
- Treating the executor as asynchronous. It runs before `new Promise` returns, so synchronous work inside it blocks, and code after `resolve()` still executes.
- Expecting `then` callbacks to run at once on a settled promise. They always wait for a microtask, so code after `.then(...)` runs first.
- Thinking a promise can be cancelled or settled twice. The first `resolve`/`reject` wins and later calls (and errors thrown after it) are swallowed.

## Follow-ups

**Q:** What is the difference between "resolved" and "settled"?
**A:** Settled means fulfilled or rejected. Resolved means the promise's fate is fixed: it is settled, or it has been locked in to follow another promise or thenable. A resolved promise can still be pending.

**Q:** What happens if the executor throws after `resolve` was called?
**A:** Nothing visible. The constructor calls `reject` with the error, but the resolving functions share an already-resolved flag, so the call is ignored. The promise keeps the first outcome.

**Q:** Does `Promise.resolve(x)` always create a new promise?
**A:** No. If `x` is a native promise whose `constructor` is the same as the receiver, it returns `x` itself. A thenable or plain value gets wrapped in a new promise.

## Deep dive

### How it works

The spec gives every promise four internal slots: `[[PromiseState]]`, `[[PromiseResult]]`, `[[PromiseFulfillReactions]]` and `[[PromiseRejectReactions]]`, plus `[[PromiseIsHandled]]`, used for rejection tracking (see error handling).

The constructor throws a `TypeError` if called without `new` or without a callable executor. It creates the promise as pending, calls `CreateResolvingFunctions(promise)`, and then calls your executor with those two functions. A throw becomes a call to `reject`.

`CreateResolvingFunctions` creates `resolve` and `reject` that share one record, `promiseOrEmpty`. The first call to either one sets it to empty, which is why later calls do nothing. That empty record is also the exact meaning of "resolved". The steps of `resolve(resolution)` are:

1. If `resolution` is the promise itself, reject with a new `TypeError`.
2. If `resolution` is not an object, fulfill with it.
3. Read `resolution.then`. If the property access throws, reject with that error.
4. If `then` is not callable, fulfill with `resolution`.
5. Otherwise enqueue a `NewPromiseResolveThenableJob` and return. The job calls `then.call(resolution, resolveFn, rejectFn)` with a fresh pair of resolving functions for the promise, and rejects if the call throws.

`FulfillPromise` and `RejectPromise` store the result, clear both reaction lists, set the state, and call `TriggerPromiseReactions`, which enqueues one `PromiseReactionJob` per stored reaction.

`then` runs `PerformPromiseThen`. If the promise is pending, it appends a reaction record to each list. If it is already settled, it enqueues the reaction job right away. Either way the handler runs from the job queue. In browsers, HTML defines `HostEnqueuePromiseJob` to queue these jobs on the microtask queue; V8-based runtimes such as Node also run them from the microtask queue.

### Edge cases

```js
const self = new Promise((resolve) => setTimeout(() => resolve(self)));
self.catch((e) => console.log(e.constructor.name)); // → TypeError

const badGetter = Promise.resolve({
  get then() { throw new Error('boom'); },
});
badGetter.catch((e) => console.log('rejected:', e.message)); // → rejected: boom

const thenable = { then(resolve) { console.log('then called'); resolve('x'); } };
const adopted = Promise.resolve(thenable);
console.log('sync');
adopted.then(console.log);
// → sync
// → then called
// → x
```

The thenable's `then` is not called in the line that resolved the promise. A job calls it later, so adoption costs extra microtask ticks (see chaining). The `then` property is read once, at resolution time. That is also why a plain object with a `then` method is treated as a promise by accident.

`Promise.resolve(p)` returns `p` only when `p` is a native promise and `p.constructor` matches the receiver. `new Promise((r) => r(p))` always creates a new promise that follows `p`:

```js
const a = Promise.resolve(1);
console.log(Promise.resolve(a) === a);          // → true
console.log(new Promise((r) => r(a)) === a);    // → false
class MyPromise extends Promise {}
console.log(MyPromise.resolve(a) === a);        // → false
```

### Trade-offs

Always-async handlers avoid the "Zalgo" problem, where a callback is sometimes synchronous and sometimes not, so you can reason about ordering without knowing the promise's state. The cost is a microtask hop even for an already-known value.

Eagerness means a promise is a running operation, not a recipe: to retry or delay it, wrap the creation in a function. Single settlement makes a promise safe to share between many consumers, but it cannot model streams or repeated events. Use async iterators or event emitters for those.

## Exercises

### Order of output

```js
const thenable = { then(resolve) { console.log('then called'); resolve('x'); } };
const p = Promise.resolve(thenable);
console.log('sync');
p.then(console.log);
```

**Answer:** `sync`, `then called`, `x`. `Promise.resolve` queues a job to call the thenable's `then`, so `sync` prints first. The job prints `then called` and fulfills `p`, and then the handler runs.

### Which outcome wins

```js
const p = new Promise((resolve) => {
  resolve(1);
  throw new Error('late');
});
p.then(console.log, console.error);
```

**Answer:** `1`. The executor's throw calls `reject`, but `resolve(1)` already consumed the shared already-resolved record, so the rejection is ignored. The error is lost silently.
