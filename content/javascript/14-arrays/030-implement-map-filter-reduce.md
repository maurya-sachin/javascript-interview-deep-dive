---
title: "Implement `map`, `filter`, and `reduce`."
status: draft
difficulty: medium
frequency: 5
core: true
tags: [array, map, filter, reduce, polyfill, callback, higher-order-function]
related:
  - javascript/arrays/sparse-arrays
  - javascript/arrays/mutating-vs-copying-methods
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-array.prototype.map
  - https://tc39.es/ecma262/#sec-array.prototype.filter
  - https://tc39.es/ecma262/#sec-array.prototype.reduce
  - https://tc39.es/ecma262/#sec-arrayspeciescreate
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce
tldr: >
  Each is a loop that calls `callback(element, index, array)`. `map` pushes the result, `filter`
  pushes the element when the result is truthy, `reduce` threads an accumulator. Native versions
  also skip holes, honour `thisArg`, use `Symbol.species`, and `reduce` throws on an empty array
  without an initial value.
---

## Answer

All three are loops over indices that call `callback(element, index, array)`:

- **`map`** returns a new array of the callback results, same length.
- **`filter`** returns a new array of the original elements for which the callback result is truthy.
- **`reduce`** passes `(accumulator, element, index, array)` and returns the final accumulator. With no initial value, the first element becomes the accumulator and the loop starts at index 1.

The implementation below is deliberately small. It is **not** a full polyfill. Compared with the spec, it skips:

- **Holes.** The spec checks `HasProperty` and skips missing indices. Mine calls the callback with `undefined`.
- **`thisArg`.** `map` and `filter` accept a second argument that becomes `this` in the callback. `reduce` has none.
- **Species.** `map` and `filter` build their result with `ArraySpeciesCreate`, so subclasses get their own type back. Mine always returns a plain `Array`.
- **Generic `this`.** The spec works on any array-like via `ToObject` and `LengthOfArrayLike`. Mine requires an array.
- **Mutation during iteration.** The spec fixes the range at the start and re-checks each index with `HasProperty`. Mine snapshots `length` but reads removed indices as `undefined`.

What it does keep: the `TypeError` for a non-callable callback, and the `TypeError` for `reduce` on an empty array without an initial value. `reduce` takes the initial value as a rest parameter and checks its length, because `reduce(fn, undefined)` is a legitimate initial value and `initialValue === undefined` cannot tell the two apart.

`forEach` is the same loop without a result. It cannot be stopped early (use `for...of`, `some` or `every`), and it ignores the promises returned by `async` callbacks.

To install one as a method, define it on `Array.prototype` with `Object.defineProperty`; plain assignment would be enumerable and show up in `for...in`.

## Example

```js
function assertCallable(callback) {
  if (typeof callback !== 'function') throw new TypeError(`${callback} is not a function`);
}
function map(array, callback) {
  assertCallable(callback);
  const result = [];
  for (let i = 0, { length } = array; i < length; i++) result.push(callback(array[i], i, array));
  return result;
}
function filter(array, callback) {
  assertCallable(callback);
  const result = [];
  for (let i = 0, { length } = array; i < length; i++) {
    if (callback(array[i], i, array)) result.push(array[i]);
  }
  return result;
}
function reduce(array, callback, ...initial) {
  assertCallable(callback);
  const hasInitial = initial.length > 0;
  if (!hasInitial && array.length === 0) throw new TypeError('Reduce of empty array with no initial value');
  let accumulator = hasInitial ? initial[0] : array[0];
  for (let i = hasInitial ? 0 : 1, { length } = array; i < length; i++) {
    accumulator = callback(accumulator, array[i], i, array);
  }
  return accumulator;
}
console.log(map([1, 2, 3], (n) => n * 2), filter([1, 2, 3, 4], (n) => n % 2 === 0), reduce([1, 2, 3], (a, b) => a + b));
// → [ 2, 4, 6 ] [ 2, 4 ] 6
```

## Pitfalls

- `['1', '2', '3'].map(parseInt)` returns `[1, NaN, NaN]`. `map` passes the index as the second argument, which `parseInt` reads as the radix.
- `reduce` without an initial value on an empty array throws. Always pass one unless emptiness is impossible.
- Using `map` for side effects, or `reduce` where a loop is clearer. A `reduce` that spreads the accumulator on every step (`{ ...acc, [k]: v }`) is O(n²).
- Forgetting `return` in an arrow body with braces, so `map` produces `[undefined, ...]`.

## Follow-ups

**Q:** What does native `map` do on `[1, , 3]`?
**A:** It skips the hole and leaves a hole at the same index in the result: `[2, <1 empty item>, 6]`. My `map` returns `[2, NaN, 6]`.

**Q:** Why does the callback get `index` and `array`?
**A:** So it can look at neighbours or the whole array without a closure. It is also why passing a function with optional extra parameters, like `parseInt`, goes wrong.

**Q:** Can `filter` be written with `reduce`?
**A:** Yes: `reduce((out, x) => (pred(x) ? [...out, x] : out), [])`. Pushing onto `out` is O(n); the spread version is O(n²).

## Deep dive

### How it works

The native `map` does this, in order: `ToObject(this)`, read `length` once with `LengthOfArrayLike`, check the callback is callable, create the result with `ArraySpeciesCreate(O, length)`, then for each `k < length`: test `HasProperty(O, k)`, and only if it is present, `Get` the value, `Call(callback, thisArg, « value, k, O »)`, and store it with `CreateDataPropertyOrThrow`. `reduce` is the same loop, except that with no initial value it first scans forward for the first *present* index (and throws a `TypeError` if there is none), and it calls the callback with `undefined` as `this`.

Two details do most of the work:

- `length` is read **once**. Elements appended during iteration are never visited. Elements removed during iteration are skipped, because `HasProperty` is checked at each index.
- `HasProperty` walks the prototype chain, so the check is `i in array`, not `array[i] !== undefined`. That distinguishes a hole from an element that is `undefined`.

A version that follows those two rules is only a few lines longer than the one in the Example, and you can check it against the native methods:

```js
function map(array, callback, thisArg) {
  if (typeof callback !== 'function') throw new TypeError(`${callback} is not a function`);
  const { length } = array; // read once: the range is fixed up front
  const result = new Array(length);
  for (let i = 0; i < length; i++) {
    if (i in array) result[i] = callback.call(thisArg, array[i], i, array); // skip holes
  }
  return result;
}

function reduce(array, callback, ...initial) {
  if (typeof callback !== 'function') throw new TypeError(`${callback} is not a function`);
  const { length } = array;
  let i = 0;
  let accumulator;
  if (initial.length > 0) {
    [accumulator] = initial;
  } else {
    while (i < length && !(i in array)) i++; // first *present* element
    if (i === length) throw new TypeError('Reduce of empty array with no initial value');
    accumulator = array[i++];
  }
  for (; i < length; i++) {
    if (i in array) accumulator = callback(accumulator, array[i], i, array);
  }
  return accumulator;
}

const sparse = [, 1, , 3];
console.log(map(sparse, (n) => n * 2), sparse.map((n) => n * 2));
// → [ <1 empty item>, 2, <1 empty item>, 6 ] [ <1 empty item>, 2, <1 empty item>, 6 ]
console.log(reduce(sparse, (a, b) => a + b), sparse.reduce((a, b) => a + b)); // → 4 4

const shrink = (array) => (n) => (array.pop(), n);
const mine = [1, 2, 3, 4];
const native = [1, 2, 3, 4];
console.log(map(mine, shrink(mine)), native.map(shrink(native)));
// → [ 1, 2, <2 empty items> ] [ 1, 2, <2 empty items> ]

const grow = (array) => (n) => (array.push(n), n);
const growing = [1, 2, 3];
console.log(growing.map(grow(growing)), growing.length); // → [ 1, 2, 3 ] 6
```

This version still isn't a full polyfill: it has no `ToObject` for array-likes and no `ArraySpeciesCreate`. It does show why the callback in the shrinking case is called twice, not four times: after two iterations the remaining indices no longer exist.

### Edge cases

- **Species.** `ArraySpeciesCreate` reads `constructor`, then `constructor[Symbol.species]`, and constructs with the length. A subclass therefore gets its own type back, and `static get [Symbol.species]() { return Array; }` opts out. `filter` creates its result with length `0`, `map` with the source length.
- **Callbacks are called with `thisArg`, except in `reduce`.** `reduce` passes `undefined`, so a non-arrow callback sees `this` as `undefined` (strict) or `globalThis` (sloppy).
- **A callback that returns a Promise.** Neither method awaits it; the Promise is the value.

```js
class Stack extends Array {}
const mapped = Stack.from([1, 2, 3]).map((n) => n);
console.log(mapped instanceof Stack, mapped.constructor.name); // → true Stack

class Plain extends Array {
  static get [Symbol.species]() { return Array; }
}
console.log(Plain.from([1]).map((n) => n).constructor.name); // → Array

const ids = [1, 2, 3];
const promises = ids.map(async (id) => id * 2);
console.log(promises); // → [ Promise { 2 }, Promise { 4 }, Promise { 6 } ]
console.log(ids.filter(async (id) => id > 5)); // → [ 1, 2, 3 ]
console.log(await Promise.all(promises)); // → [ 2, 4, 6 ]
```

### Real-world scenario

The bug that reaches production most often is an `async` callback. `ids.map(async …)` is fine as long as you `await Promise.all(…)` the result, but `ids.filter(async …)` keeps *everything*, because every Promise is an object and objects are truthy, so the filter condition never excludes anything. The same applies to `some`, `every` and `find`. Resolve first, then filter on the resolved values:

```js
const results = await Promise.all(ids.map(async (id) => ({ id, ok: id > 1 })));
const accepted = results.filter((result) => result.ok).map((result) => result.id);
console.log(accepted); // → [ 2, 3 ]
```

If the work has to run one item at a time, a `for…of` loop with `await` is clearer than a `reduce` that chains promises through the accumulator.

### Trade-offs

Writing these by hand is an interview exercise; in production code use the built-ins. They are specified and handle holes, species and array-likes. A hand-written version is justified only when you need behaviour the built-ins can't give, such as early exit (`for…of`, `some`, `every`), async iteration, or a single pass that does `map` and `filter` together (one `reduce` or loop instead of two intermediate arrays). That last choice is about the allocation of the intermediate array; for typical sizes, readability should decide.

## Exercises

### Predict the output

```js
console.log([1, , 3].map((n) => n * 2));
console.log([1, 2, 3].reduce((a, b) => a + b, undefined));
try { [].reduce((a, b) => a + b); } catch (e) { console.log(e.name); }
```

**Answer:** `[ 2, <1 empty item>, 6 ]`; `NaN`; then `TypeError` (reduce of an empty array with no initial value). In the second line `undefined` is a real initial value, so the first call is `undefined + 1`.
