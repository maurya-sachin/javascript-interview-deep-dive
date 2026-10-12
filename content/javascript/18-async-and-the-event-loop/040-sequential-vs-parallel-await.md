---
title: "Sequential vs parallel `await` — and `await` inside loops?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [await, promise-all, for-of, foreach, for-await, concurrency, unhandled-rejection]
related:
  - javascript/promises/promise-combinators
  - javascript/async-and-the-event-loop/async-await-mechanics
  - javascript/async-and-the-event-loop/concurrency-limit-retry
  - javascript/iterators-and-generators/async-iteration
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#await
  - https://tc39.es/ecma262/#sec-promise.all
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
  - https://nodejs.org/docs/latest-v24.x/api/cli.html#--unhandled-rejectionsmode
tldr: >
  Work is parallel when the promises are created before you wait, not when you use `Promise.all`. `await`
  inside a `for...of` loop starts each operation after the previous one finishes, so total time is the sum.
  `Promise.all(items.map(fn))` starts them all and takes the longest. `forEach` ignores the promises its
  callback returns, so it does not wait.
---

## Answer

An `await` pauses the current function until a promise settles. Whether operations overlap depends on **when each promise is created**, because a promise represents work that has already started.

- **Sequential.** `for (const x of xs) await work(x)` calls `work` for the next item only after the previous one has finished. Total time is the sum. Use it when each step needs the previous result, or when order and rate matter.
- **Parallel.** `await Promise.all(xs.map(work))` calls `work` for every item first, which starts all operations, then waits for all of them. Total time is roughly the slowest one. The results keep input order.
- **Also parallel.** Create the promises first, then await them one by one: `const a = f(); const b = g(); await a; await b;`. The combinator is only a convenient way to wait. The danger is below.
- **`forEach` does not wait.** It calls the callback and ignores the returned promise. Code after `forEach` runs before the async callbacks finish, and errors in them become unhandled rejections.
- **`for await (const x of source)`** waits for each item in turn. Use it for async iterables, such as streams and paginated sources. If the source is a sync iterable of promises, it awaits each one in order, but the promises already run.
- **Unbounded parallelism is not free.** `Promise.all(10_000_items.map(fn))` starts everything at once. Limit concurrency instead (see the task runner question).

Pick by dependency: dependent steps are sequential, independent steps are parallel.

## Example

```js
const delay = (ms, value) => new Promise((resolve) => setTimeout(resolve, ms, value));
const timed = async (label, fn) => {
  const start = performance.now();
  const result = await fn();
  const elapsed = Math.round((performance.now() - start) / 100) * 100;
  console.log(label, JSON.stringify(result), `~${elapsed} ms`);
};
const ids = [1, 2, 3];
const fetchUser = (id) => delay(100, `user${id}`);

await timed('sequential', async () => {
  const users = [];
  for (const id of ids) users.push(await fetchUser(id));
  return users;
});
await timed('parallel  ', () => Promise.all(ids.map(fetchUser)));
// → sequential ["user1","user2","user3"] ~300 ms
// → parallel   ["user1","user2","user3"] ~100 ms
```

## Pitfalls

- Awaiting in a loop when the iterations are independent. It is correct but slow, and a frequent review comment.
- Using `async` callbacks with `forEach`. The loop finishes immediately, so the code after it sees unfinished work. Use `for...of` to run in order or `Promise.all(xs.map(...))` to run in parallel.
- Creating promises early and awaiting them late. A promise that rejects before you reach its `await` is unhandled until then. In Node.js the default mode raises an unhandled rejection as an uncaught exception, which can crash the process. Attach handlers right away, or use `Promise.all`/`allSettled`.
- Assuming `Promise.all` cancels the other work when one fails. It only stops waiting. See the cancellation question.

## Follow-ups

**Q:** Does `Promise.all(xs.map(async (x) => ...))` run in parallel?
**A:** Yes. `map` calls each async callback synchronously up to its first `await`, which starts all the work. `all` then waits for the returned promises.

**Q:** How do you process in parallel but stop at the first failure?
**A:** `Promise.all` rejects at the first rejection, but the other work keeps running. To also stop starting more work, use a pool with a stop flag, as in the task runner question, and pass an `AbortSignal` to the work you can cancel.

**Q:** Sequential or parallel for database writes that depend on order?
**A:** Sequential. Parallel calls can finish in any order, and the server may handle them in any order too. Parallel `await` only guarantees the order of the result array, not of the effects.

## Exercises

### Does `forEach` wait

```js
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
[1, 2, 3].forEach(async (id) => {
  await delay(10);
  console.log('done', id);
});
console.log('after forEach');
```

**Answer:** `after forEach`, then `done 1`, `done 2`, `done 3` (run in Node 24). `forEach` ignores the returned promises, so it returns at once. The three timers run side by side.

### Parallel without `Promise.all`

```js
const delay = (ms, value) => new Promise((resolve) => setTimeout(resolve, ms, value));
const start = performance.now();
const a = delay(100, 'a');
const b = delay(100, 'b');
const results = [await a, await b];
console.log(results, `~${Math.round((performance.now() - start) / 100) * 100} ms`);
```

**Answer:** `[ 'a', 'b' ] ~100 ms`. Both timers start before the first `await`, so the waits overlap. Moving `delay(100, 'b')` after `await a` would make it about 200 ms.

### The early rejection

```js
const delay = (ms, value) => new Promise((resolve) => setTimeout(resolve, ms, value));
const slow = delay(50, 'slow');
const fast = Promise.reject(new Error('fast failure'));
try {
  console.log(await slow);
  console.log(await fast);
} catch (error) {
  console.log('caught', error.message);
}
```

**Answer:** In Node 24 the process crashes with `Error: fast failure` before `slow` is logged. `fast` rejects while nothing is handling it. By default Node.js raises an unhandled rejection as an uncaught exception (`--unhandled-rejections=throw`), and nothing has handled `fast` yet. Awaiting `fast` first, or using `Promise.all([slow, fast])`, attaches a handler in time.
