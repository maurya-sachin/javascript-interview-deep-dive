---
title: "`Promise.all` vs `allSettled` vs `race` vs `any`?"
status: draft
difficulty: easy
frequency: 5
core: false
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
