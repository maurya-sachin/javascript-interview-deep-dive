---
title: "Implement `Promise.all`."
status: draft
difficulty: medium
frequency: 5
core: false
tags: [promise-all, implementation, polyfill, concurrency, iterable, interview-coding]
related:
  - javascript/promises/promise-combinators
  - javascript/promises/what-is-a-promise
  - javascript/promises/implement-a-promise
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-promise.all
  - https://tc39.es/ecma262/#sec-performpromiseall
  - https://tc39.es/ecma262/#sec-promise-resolve
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
tldr: >
  Return a new promise. Loop over the iterable, wrap each item with `Promise.resolve`, and store its value
  at its own index, not in completion order. Count pending items and resolve with the array when the count
  reaches zero. Reject on the first rejection, and resolve right away for empty input.
---

## Answer

The contract to meet:

1. Accept any **iterable**, not only arrays. Items can be promises, thenables or plain values.
2. Return a promise that **fulfills with an array of values in input order**, regardless of completion order.
3. **Reject with the first rejection** reason.
4. Fulfill with `[]` for an empty input.
5. A non-iterable or a throwing iterator makes the returned promise reject. It must not throw synchronously.

The approach:

- Create the result with `new Promise`. Its executor already turns a synchronous throw, such as `for…of` on a non-iterable, into a rejection.
- Loop with `for…of`, remember each item's `index`, and wrap the item with `Promise.resolve(item)` so plain values and thenables work.
- Attach `then(onValue, reject)`. `onValue` stores the value at its own index. `reject` is the outer `reject`, so the first rejection wins and later calls are ignored.
- Keep a `pending` counter, incremented per item and decremented per fulfillment. Resolve when it hits zero. After the loop, if `pending` is still zero the input was empty, so resolve now.

Why not `push`? Values arrive in completion order. Writing to `results[index]` keeps input order. Why not `results.length === total`? An iterable has no length, and a sparse array's length can be reached early, so count completions instead.

What this skips compared to the spec: it always uses the global `Promise` (the real method uses its `this` as the constructor, so subclasses work), and it calls `Promise.resolve` directly rather than looking it up once.

## Example

```js
function promiseAll(iterable) {
  return new Promise((resolve, reject) => {
    const results = [];
    let pending = 0;
    let index = 0;
    for (const item of iterable) {
      const position = index++;
      pending++;
      Promise.resolve(item).then((value) => {
        results[position] = value;
        if (--pending === 0) resolve(results);
      }, reject);
    }
    if (pending === 0) resolve(results);
  });
}

const wait = (ms, value, fail) =>
  new Promise((resolve, reject) => setTimeout(fail ? reject : resolve, ms, value));

console.log(await promiseAll([wait(30, 'slow'), wait(10, 'fast'), 3]));
// → [ 'slow', 'fast', 3 ]
console.log(await promiseAll([]));
// → []
console.log(await promiseAll([wait(20, 'late'), wait(10, 'boom', true)]).catch((e) => e));
// → boom
console.log(await promiseAll(5).catch((e) => e.constructor.name));
// → TypeError
```

## Pitfalls

- Using `results.push(value)`. The array ends up in completion order, not input order.
- Forgetting the empty-input case. With no items there is no callback to resolve the promise, so it stays pending forever.
- Calling `item.then` directly. Plain values have no `then`. Wrap with `Promise.resolve`.
- Awaiting inside the loop (`for (const p of promises) results.push(await p)`). That is sequential, and a later rejection that happens first is only noticed when the loop reaches it.

## Follow-ups

**Q:** How would `Promise.race` look?
**A:** Loop over the items and attach the outer `resolve` and `reject` to each `Promise.resolve(item).then(...)`. The first to settle wins. No counter is needed, but empty input stays pending.

**Q:** How would `Promise.allSettled` look?
**A:** Map each item to a promise that always fulfills with a `{ status, value }` or `{ status, reason }` object, then pass those to `promiseAll`. Because they never reject, the result never rejects.

**Q:** Does the real spec do anything the simple version does not?
**A:** It starts the counter at 1 and decrements after the loop, which protects against a custom `then` calling back synchronously. It also closes the iterator if an error occurs mid-loop. `for…of` already does that on a throw.

## Deep dive

### Edge cases

Compared with the native method (in Node 24), the implementation gives the same result for strings, `Set`s, generators, holes, thenables, rejections, non-iterables and `undefined`.

```js
function* lazy() {
  yield wait(5, 'a');
  yield 'b';
}
console.log(await promiseAll('ab'));                     // → [ 'a', 'b' ]
console.log(await promiseAll(new Set([1, wait(5, 2)]))); // → [ 1, 2 ]
console.log(await promiseAll(lazy()));                   // → [ 'a', 'b' ]
console.log(await promiseAll([, 1]));                    // → [ undefined, 1 ]
```

(This reuses `promiseAll` and `wait` from the example above.) A hole in a sparse array is visited by the array iterator as `undefined`, which is the same thing the native method does.

Once the outer promise has rejected, later rejections reach the same `reject`, which does nothing. They still count as handled, because `then` was called on those promises with a rejection handler, so there is no unhandled rejection. If you had only attached the fulfillment handler, a second rejection would crash a Node process by default.

### Real-world scenario

The usual interview follow-up is to limit concurrency, because `promiseAll(urls.map(fetch))` starts everything at once. That is a different tool: a worker pool that takes tasks (functions, not promises) a few at a time. See the concurrency-limit question in the async chapter.

### Trade-offs

The version here favours readability. The spec version has more moving parts to support subclasses (`this` as constructor), user-replaced `Promise.resolve`, and misbehaving thenables. For application code, use the native method; write your own only when asked, or when you need a variant (limits, timeouts, partial results).

## Exercises

### Find the bug

```js
const wait = (ms, value) => new Promise((resolve) => setTimeout(resolve, ms, value));

function buggyAll(promises) {
  return new Promise((resolve, reject) => {
    const results = [];
    for (const promise of promises) {
      promise.then((value) => {
        results.push(value);
        if (results.length === promises.length) resolve(results);
      }, reject);
    }
  });
}

console.log(await buggyAll([wait(20, 'slow'), wait(10, 'fast')]));
```

**Answer:** It prints `[ 'fast', 'slow' ]`: the array is in completion order, and it also fails for iterables without `length` and for plain values. Fix it by storing at an index and counting completions, as in the example.

### Build `allSettled`

```js
// promiseAll is the function from the example above.
const allSettled = (iterable) =>
  promiseAll(
    Array.from(iterable, (item) =>
      Promise.resolve(item).then(
        (value) => ({ status: 'fulfilled', value }),
        (reason) => ({ status: 'rejected', reason }),
      ),
    ),
  );

console.log(JSON.stringify(await allSettled([1, Promise.reject('no')])));
```

**Answer:** `[{"status":"fulfilled","value":1},{"status":"rejected","reason":"no"}]`. Each promise is converted so that it always fulfills, so `promiseAll` never takes its rejection path. `Array.from` accepts any iterable and runs the mapper in input order.
