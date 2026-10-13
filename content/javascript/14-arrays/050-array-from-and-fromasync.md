---
title: "Array-likes vs iterables: how do `Array.from` and `Array.fromAsync` work?"
status: draft
difficulty: medium
frequency: 2
core: false
tags: [array, array-from, array-from-async, array-like, iterable, async-iterable]
related:
  - javascript/arrays/sparse-arrays
  - javascript/arrays/implement-map-filter-reduce
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-array.from
  - https://tc39.es/ecma262/#sec-array.fromasync
  - https://tc39.es/ecma262/#sec-array.of
  - https://tc39.es/ecma262/#sec-lengthofarraylike
  - https://github.com/tc39/proposal-array-from-async
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fromAsync
tldr: >
  An iterable has a `Symbol.iterator` method; an array-like just has `length` and indexed
  properties. `Array.from` prefers the iterator and falls back to `length`, and its optional mapper
  gets `(value, index)`. `Array.fromAsync` returns a promise and awaits items one at a time. It
  accepts async iterables, then sync iterables, then array-likes.
---

## Answer

An **iterable** implements `[Symbol.iterator]()` (strings, `Set`, `Map`, generators, `arguments`). An **array-like** is any object with a `length` and indexed properties (`{ length: 2, 0: 'a', 1: 'b' }`). Only iterables work with spread and `for...of`; `[...{ length: 2 }]` throws a `TypeError`.

**`Array.from(items, mapper?, thisArg?)`**:

1. Throws if `mapper` is given and not callable.
2. If `items` has a `Symbol.iterator` method, steps the iterator and collects the values.
3. Otherwise treats `items` as an array-like: reads `length`, then `items[0..length-1]`. Missing indices become `undefined` (no holes).
4. The mapper receives `(value, index)` only and runs as the values are produced, so there is no intermediate array.

`items` of `null` or `undefined` throw a `TypeError`; numbers and booleans give `[]`. If `this` is a constructor, it is used to build the result (so subclasses work). `Array.of(...items)` is the sibling that builds from arguments: `Array.of(7)` is `[7]`, while `Array(7)` is seven holes.

`Array.from({ length: n }, fn)` is the idiomatic way to build `n` real elements. `new Array(n)` creates holes, which `map` and `forEach` skip.

**`Array.fromAsync(items, mapper?, thisArg?)`** returns a `Promise` of an array. It checks `Symbol.asyncIterator` first, then `Symbol.iterator`, then falls back to an array-like. It processes **one item at a time**: it requests the next item, awaits it, and only then asks for the following one. The mapper's result is awaited, so an `async` mapper works. For sync iterables and array-likes each element is awaited too. It does not run work in parallel: for that, start the promises first and use `Promise.all`.

Availability: Node 24.19 has it. MDN marks it Baseline "Widely available" (since January 2024), and the proposal is Stage 4. Check your target runtimes for older environments.

## Example

```js
const sleep = (ms, value) => new Promise((resolve) => setTimeout(resolve, ms, value));

console.log(Array.from('héy'));                          // → [ 'h', 'é', 'y' ]
console.log(Array.from(new Set([1, 1, 2])));             // → [ 1, 2 ]
console.log(Array.from({ length: 3, 0: 'a', 2: 'c' }));  // → [ 'a', undefined, 'c' ]
console.log(Array.from({ length: 3 }, (_, i) => i * 2)); // → [ 0, 2, 4 ]
console.log(Array.of(7), Array(3));                      // → [ 7 ] [ <3 empty items> ]

async function* ticks() {
  for (let i = 1; i <= 3; i++) {
    await sleep(50);
    yield i;
  }
}
const timed = async (label, promise) => {
  const start = performance.now();
  const result = await promise;
  console.log(label, result, Math.round((performance.now() - start) / 50) * 50, 'ms');
};

await timed('async generator', Array.fromAsync(ticks()));
// → async generator [ 1, 2, 3 ] 150 ms
const tasks = [1, 2, 3].map((n) => () => sleep(50, n));
await timed('fromAsync', Array.fromAsync(tasks, (task) => task()));
// → fromAsync [ 1, 2, 3 ] 150 ms
await timed('Promise.all', Promise.all(tasks.map((task) => task())));
// → Promise.all [ 1, 2, 3 ] 50 ms
```

## Pitfalls

- Spreading an array-like. `[...arrayLike]` needs an iterator; `Array.from(arrayLike)` doesn't.
- `new Array(n).map(fn)` skipping every slot. Use `Array.from({ length: n }, fn)`.
- Expecting `Array.fromAsync` to be concurrent. It waits for each item before requesting the next, so a mapper that starts slow work runs it in sequence. Use `Promise.all` for parallel work.
- Passing `Array.from(x, parseInt)`-style functions with extra parameters. The mapper gets `(value, index)`.

## Follow-ups

**Q:** Why prefer `Array.from(iterable)` over `[...iterable]`?
**A:** For iterables they give the same array, so it is a style choice. `Array.from` also accepts array-likes and a mapper, and can be called on a subclass.

**Q:** What happens if `Array.fromAsync` input rejects?
**A:** The returned promise rejects with that error and the remaining items are not processed.

**Q:** Is the result of `Array.from` a deep copy?
**A:** No: it is a shallow copy of the element values.

## Exercises

### Predict the output

```js
console.log(Array.from({ length: 2, 0: 'a', 1: 'b' }, (v, i) => v + i));
console.log(Array.from(new Map([['k', 1]])));
console.log(await Array.fromAsync([Promise.resolve(1), 2], (n) => n * 2));
```

**Answer:** `[ 'a0', 'b1' ]`, `[ [ 'k', 1 ] ]`, `[ 2, 4 ]`. The first uses the array-like path with the index passed to the mapper. A `Map` iterates `[key, value]` pairs. In `fromAsync`, each element of a sync iterable is awaited before the mapper runs, so the mapper sees `1`, not a promise.
