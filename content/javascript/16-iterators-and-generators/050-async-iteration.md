---
title: "How do async iterators and `for await…of` work?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [async-iterator, async-generator, for-await, symbol-asynciterator, streams, async-from-sync-iterator]
related:
  - javascript/iterators-and-generators/iteration-protocols
  - javascript/iterators-and-generators/generators
  - javascript/async-and-the-event-loop/async-await-mechanics
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-asynciterator-interface
  - https://tc39.es/ecma262/#sec-getiterator
  - https://tc39.es/ecma262/#sec-createasyncfromsynciterator
  - https://tc39.es/ecma262/#sec-asynciteratorclose
  - https://tc39.es/ecma262/#sec-asyncgenerator-objects
  - https://tc39.es/ecma262/#sec-runtime-semantics-forinofbodyevaluation
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of
  - https://nodejs.org/docs/latest-v24.x/api/stream.html
tldr: >
  An async iterable has `[Symbol.asyncIterator]()` returning an async iterator whose `next()` returns a
  promise of `{ value, done }`. `for await…of` awaits each result before the next pull, falls back to sync
  iterables (awaiting each value), and awaits `return()` on early exit. `async function*` builds async
  iterators and queues overlapping `next()` calls.
---

## Answer

The async protocols mirror the sync ones with promises.

- **Async iterable:** has a `[Symbol.asyncIterator]()` method.
- **Async iterator:** has `next()` (and optionally `return()` and `throw()`) that returns a promise for `{ value, done }`.

`for await (const x of source)` works like this (spec: `GetIterator` with kind `async`, plus the shared loop body):

1. Look up `source[Symbol.asyncIterator]`. If it is missing, fall back to `source[Symbol.iterator]` and wrap the sync iterator in an `AsyncFromSyncIterator`, which awaits each value. That is why `for await (const v of arrayOfPromises)` yields resolved values.
2. Call `next()` and await the result, then read `done` and `value`.
3. Run the body. Only then ask for the next one. Iterations are strictly sequential, so a slow body delays the next pull, which is natural backpressure.
4. On `break`, `return` or a throw, call `return()` and await it (`AsyncIteratorClose`). A rejection from `next()` ends the loop with that error and does not call `return()`.

It is only allowed where `await` is: async functions and module top level.

`async function*` is the easy way to write an async iterator. `await` and `yield` both work in the body. `yield` awaits its operand, and `return` does too. The generator object queues requests, so calling `next()` three times without waiting returns three promises that settle in order, and the body runs one step at a time.

Typical sources are paged APIs, `ReadableStream`, Node `Readable` streams, `readline`, and `events.on`. By default, leaving a Node `Readable` loop early destroys the stream (`destroyOnReturn: false` changes that).

Async iteration is not parallelism. For concurrency, start the work first and await the results (`Promise.all`).

## Example

```js
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function* pages() {
  try {
    for (let page = 1; page <= 3; page++) {
      await sleep(10); // stands in for a network request
      yield [`item ${page}a`, `item ${page}b`];
    }
  } finally {
    console.log('connection closed');
  }
}

for await (const items of pages()) {
  console.log(items);
  if (items[0] === 'item 2a') break;
}
// → [ 'item 1a', 'item 1b' ]
// → [ 'item 2a', 'item 2b' ]
// → connection closed

for await (const value of [sleep(10).then(() => 'slow'), 'plain']) {
  console.log(value); // → slow
}                     // → plain
```

## Pitfalls

- Using `for…of` on an async iterable. It throws a `TypeError` because there is no `[Symbol.iterator]`. Use `for await`.
- Putting `await` in the loop body and expecting parallel work. Each iteration waits for the body before the next `next()`. Collect promises and use `Promise.all` if you want concurrency.
- Forgetting cleanup. A `break` calls `return()`; an async generator without `try…finally` will not release anything on its own, and a hand-written async iterator without `return()` is never told.
- Handing `for await` a sync iterable of promises and assuming all of them are watched. They are awaited one at a time, so a promise that rejects while an earlier one is pending has no handler until the loop reaches it. In Node 24 that unhandled rejection terminates the process before the loop can catch it.

## Follow-ups

**Q:** What happens if I call `next()` twice without awaiting an async generator?
**A:** Both calls are queued as requests. The first resumes the body; the second waits for the first to finish. The promises settle in call order.

**Q:** What does the sync-iterator fallback do with a rejected promise?
**A:** The returned promise rejects with that reason. The wrapper then calls `return()` on the underlying sync iterator, so a sync generator's `finally` runs (this ran in Node 24).

**Q:** Can I use it without `async function*`?
**A:** Yes. Implement `[Symbol.asyncIterator]() { return { next: async () => … } }`, with an optional async `return()`. An async generator is the same contract with less code.

## Exercises

### Order of events

```js
const sleep = (ms, value) => new Promise((resolve) => setTimeout(resolve, ms, value));

async function* slow() {
  console.log('start');
  await sleep(20);
  yield 1;
  console.log('resumed');
  yield 2;
}

const it = slow();
const calls = [it.next(), it.next(), it.next()];
console.log('called three times');
console.log(await Promise.all(calls));
```

**Answer:** `start`, `called three times`, `resumed`, then `[ { value: 1, done: false }, { value: 2, done: false }, { value: undefined, done: true } ]`. The first `next()` runs the body up to the first `await` synchronously, which prints `start`. The other two calls are queued. They resolve in order as the generator yields, and the third completes it.
