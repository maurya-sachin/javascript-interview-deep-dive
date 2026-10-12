---
title: "Implement `map`, `filter`, and `reduce`."
status: draft
difficulty: medium
frequency: 5
core: false
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

## Exercises

### Predict the output

```js
console.log([1, , 3].map((n) => n * 2));
console.log([1, 2, 3].reduce((a, b) => a + b, undefined));
try { [].reduce((a, b) => a + b); } catch (e) { console.log(e.message); }
```

**Answer:** `[ 2, <1 empty item>, 6 ]`; `NaN`; then `Reduce of empty array with no initial value` (V8's message; the spec only requires a `TypeError`). In the second line `undefined` is a real initial value, so the first call is `undefined + 1`.
