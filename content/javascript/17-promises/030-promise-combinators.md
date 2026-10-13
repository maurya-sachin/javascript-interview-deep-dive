---
title: "`Promise.all` vs `allSettled` vs `race` vs `any`?"
status: draft
difficulty: easy
frequency: 5
core: true
tags: [promise-all, promise-allsettled, promise-race, promise-any, aggregate-error, concurrency]
related:
  - javascript/promises/what-is-a-promise
  - javascript/promises/promise-error-handling
  - javascript/promises/implement-promise-all
  - javascript/async-and-the-event-loop/sequential-vs-parallel-await
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-promise.all
  - https://tc39.es/ecma262/#sec-performpromiseall
  - https://tc39.es/ecma262/#sec-promise.allsettled
  - https://tc39.es/ecma262/#sec-promise.any
  - https://tc39.es/ecma262/#sec-performpromiseany
  - https://tc39.es/ecma262/#sec-promise.race
  - https://tc39.es/ecma262/#sec-getpromiseresolve
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/any
tldr: >
  All four take an iterable and return one promise. `all` fulfills with every value, in input order, or
  rejects with the first rejection. `allSettled` never rejects and reports each outcome. `race` copies the
  first promise to settle, either way. `any` copies the first to fulfill, or rejects with an
  `AggregateError` if all reject.
---

## Answer

Each combinator runs all inputs at once. They do not start the work; the promises are already running. They only decide how to combine the outcomes.

| Method | Fulfills when | Fulfills with | Rejects when |
|---|---|---|---|
| `Promise.all` | all fulfill | array of values, in input order | the first rejection, with that reason |
| `Promise.allSettled` | all settle | array of `{ status, value }` or `{ status, reason }` | never (only on bad input) |
| `Promise.race` | the first to settle fulfills | that value | the first to settle rejects |
| `Promise.any` | the first fulfills | that value | all reject, with an `AggregateError` |

Notes that interviewers probe:

- **Input.** Any iterable. Each element goes through `Promise.resolve`, so plain values and thenables work. A non-iterable returns a rejected promise rather than throwing.
- **Order.** `all`, `allSettled` and the `errors` of `AggregateError` follow input order, not completion order.
- **Fail-fast.** `all` and `race` settle early. The other promises keep running, because nothing can cancel them. Their later rejections are handled by the combinator, so they do not become unhandled rejections.
- **Empty iterable.** `all([])` and `allSettled([])` fulfill with `[]`. `any([])` rejects with an `AggregateError` with an empty `errors` array. `race([])` stays pending forever.
- **Choosing.** `all` when you need every result. `allSettled` when failures are expected and you want a report. `race` for timeouts. `any` for the fastest successful source, such as mirrored endpoints.

## Example

```js
const task = (ms, value, fail) =>
  new Promise((resolve, reject) => setTimeout(fail ? reject : resolve, ms, value));
const jobs = () => [task(30, 'A'), task(10, 'B', true), task(20, 'C')];
const show = (label, promise) =>
  promise.then(
    (value) => console.log(label, 'fulfilled', JSON.stringify(value)),
    (reason) => console.log(label, 'rejected', reason),
  );

await show('all', Promise.all(jobs()));
await show('allSettled', Promise.allSettled(jobs()));
await show('race', Promise.race(jobs()));
await show('any', Promise.any(jobs()));
// → all rejected B
// → allSettled fulfilled [{"status":"fulfilled","value":"A"},{"status":"rejected","reason":"B"},{"status":"fulfilled","value":"C"}]
// → race rejected B
// → any fulfilled "C"
```

## Pitfalls

- Expecting `Promise.all` to cancel the rest after one rejection. They keep running; only your waiting stops. Use `AbortController` to cancel real work.
- Using `Promise.race` for a timeout and leaving the timer or request alive. The loser is ignored, not stopped, so clear the timer or abort the request yourself.
- Building the input array with a synchronous throw, as in `Promise.all(items.map(fn))` where `fn` throws. The throw happens in `map`, before `all` runs, so it escapes as a normal exception rather than a rejection.
- Mixing up `race` and `any`. `race` takes the first *settled* promise, including a rejection. `any` ignores rejections until none are left.

## Follow-ups

**Q:** What is in an `AggregateError`?
**A:** `Promise.any` rejects with `AggregateError`, whose `errors` array holds each rejection reason in input order. Its message is `All promises were rejected`.

**Q:** Which method gives results for both successes and failures?
**A:** `Promise.allSettled`. Each entry has `status` (`'fulfilled'` or `'rejected'`) plus `value` or `reason`. It rejects only if the argument is not iterable.

**Q:** Does the combinator call `Promise.resolve` for every element?
**A:** Yes. The spec reads `Promise.resolve` once with `GetPromiseResolve`, then calls it for each element. Subclasses and overrides therefore affect all of them.

## Deep dive

### How it works

`Promise.all` is a small state machine built from three pieces: the result promise's `resolve`/`reject` functions, a `values` list, and a counter. For each element, `PerformPromiseAll`:

1. Appends a placeholder (`undefined`) to `values` so the element's slot is fixed by its position.
2. Calls the `Promise.resolve` it read once up front (`GetPromiseResolve`) to turn the element into a promise.
3. Creates an `onFulfilled` function that remembers its own `[[Index]]` and has an `[[AlreadyCalled]]` flag. When called, it stores `values[index]`, decrements the counter, and resolves the result with the array when the counter reaches `0`.
4. Increments the counter and calls `nextPromise.then(onFulfilled, resultCapability.[[Reject]])`.

The counter **starts at 1**, not 0, and is decremented once after the iterator is exhausted. The spec's note explains why: it guarantees the result is resolved only once, even if an input's `then` calls back before the loop has finished. It also makes `all([])` fulfill with `[]`, since the only decrement is the final one.

Three consequences are observable:

- The input is consumed **synchronously and completely** when `all` is called. A generator runs to the end immediately; there is no concurrency limit.
- `then` is looked up with `Invoke`, so an overridden `then` on an input promise is called with two functions.
- Rejection goes straight to the result's `reject`. The first one wins; later calls are no-ops because a promise settles once. The other inputs still have a reaction attached, which is why their late rejections count as handled.

```js
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const tracked = Promise.resolve('x');
tracked.then = function (onFulfilled, onRejected) {
  console.log('then called with', [typeof onFulfilled, typeof onRejected]); // → then called with [ 'function', 'function' ]
  return Promise.prototype.then.call(this, onFulfilled, onRejected);
};
console.log(await Promise.all([tracked])); // → [ 'x' ]

function* tasks() {
  for (const name of ['a', 'b', 'c']) {
    console.log('starting', name);
    yield wait(5).then(() => name);
  }
}
const all = Promise.all(tasks());
console.log('after Promise.all call');
// → starting a
// → starting b
// → starting c
// → after Promise.all call
console.log(await all); // → [ 'a', 'b', 'c' ]
```

`allSettled` and `any` have the same shape. `allSettled` builds a `{ status, … }` record in both its fulfil and reject callbacks and counts both. `any` swaps the roles: it collects reasons into `errors` and rejects with an `AggregateError` when the counter reaches `0`, while the first fulfilment resolves the result immediately. `race` has no counter at all: it attaches the result's `resolve` and `reject` to every input, and the first input to settle wins.

### Edge cases

- **Errors during iteration close the iterator.** If reading the iterable or calling `Promise.resolve` throws partway through, the result rejects with that error and the iterator is closed. Elements already started keep running.
- **Late rejections are handled.** After `all` rejects, a later rejection from another input doesn't raise `unhandledRejection`, because each input has a reaction attached.
- **The combinators are generic over `this`.** They use `this` as the constructor, so they work on Promise subclasses. Called with a non-constructor (`Promise.all.call({}, [])`), they throw a `TypeError` instead of returning a rejected promise.

```js
process.on('unhandledRejection', (reason) => console.log('unhandled:', reason));
const fail = (ms, reason) => new Promise((_, reject) => setTimeout(reject, ms, reason));

try {
  await Promise.all([fail(5, 'first'), fail(15, 'second')]);
} catch (reason) {
  console.log('caught:', reason); // → caught: first
}
await new Promise((resolve) => setTimeout(resolve, 50));
console.log('done'); // → done
```

### Real-world scenario

A timeout built on `race` has to deal with the loser, since nothing cancels it. The shape that works is: create an `AbortController`, give its signal to the real work, race the work against a timeout promise, and clear the timer whichever side wins. The order inside the timer callback also matters: rejecting the timeout promise *before* calling `abort()` makes the timeout reason win, because `abort()` synchronously rejects the work with the abort reason and `race` takes whichever settles first.

```js
function withTimeout(start, ms) {
  const controller = new AbortController();
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`timed out after ${ms} ms`)); // settle first so this reason wins the race
      controller.abort();
    }, ms);
  });
  return Promise.race([start(controller.signal), timeout]).finally(() => clearTimeout(timer));
}

const work = (ms) => (signal) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms, `finished in ${ms} ms`);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });

console.log(await withTimeout(work(10), 50)); // → finished in 10 ms
await withTimeout(work(100), 20).catch((error) => console.log(error.message)); // → timed out after 20 ms
```

### Trade-offs

- **`all` vs `allSettled`.** `all` gives the fastest failure but discards the other outcomes. `allSettled` waits for the slowest input and always gives you everything, which suits batch jobs and reporting, but you must inspect each entry.
- **No built-in concurrency limit.** Because all inputs start immediately, `Promise.all(urls.map(fetch))` over thousands of items opens them all at once. Limit concurrency yourself (a worker-pool loop or a small queue) and use `all` over the batches.
- **`any` and `race` leave work running.** They return as soon as there is a winner. Pair them with an `AbortSignal` when the extra work costs bandwidth or money.

## Exercises

### Who wins the race

```js
console.log(await Promise.race([Promise.resolve('first'), 'plain']));
console.log(await Promise.race(['plain', Promise.resolve('first')]));
```

**Answer:** `first`, then `plain`. Each element is wrapped with `Promise.resolve`, and `then` is attached in input order. Every element here is already fulfilled, so the first one attached queues its reaction first and wins.

### Empty inputs

```js
console.log(await Promise.all([]));
console.log(await Promise.any([]).catch((error) => [error.name, error.errors]));
```

**Answer:** `[]`, then `[ 'AggregateError', [] ]`. With nothing to wait for, `all` fulfills with an empty array, but `any` has no fulfilment to wait for and rejects.
