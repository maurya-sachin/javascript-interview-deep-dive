---
title: "How do `flat` and `flatMap` work?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [array, flat, flat-map, flatten, recursion, is-array]
related:
  - javascript/arrays/sparse-arrays
  - javascript/arrays/implement-map-filter-reduce
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-array.prototype.flat
  - https://tc39.es/ecma262/#sec-array.prototype.flatmap
  - https://tc39.es/ecma262/#sec-flattenintoarray
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap
tldr: >
  `flat(depth = 1)` copies the array, replacing each nested array with its elements down to
  `depth` levels (`Infinity` flattens fully). `flatMap(fn)` is `map(fn).flat(1)` in one pass, and
  is the idiom for map-and-filter or one-to-many. Both only flatten real arrays and skip holes.
---

## Answer

**`flat(depth = 1)`** returns a new array in which every element that is an array (`IsArray`) is replaced by its elements, recursively, up to `depth` levels. The default is `1`, so `[1, [2, [3]]].flat()` is `[1, 2, [3]]`. `flat(Infinity)` flattens everything; a depth below `1` just copies. The depth goes through `ToIntegerOrInfinity`, so `'1'` works and `NaN` is `0`.

**`flatMap(fn, thisArg?)`** calls `fn(element, index, array)` on each element and flattens the results exactly **one** level. It is equivalent to `map(fn).flat(1)` but builds only one array. Use it when each input produces zero, one or many outputs:

- return `[]` to drop an element (a combined map and filter),
- return `[a, b]` to emit several,
- return a non-array to emit one.

To flatten deeper, call `flat` after `map`.

Details from the spec's `FlattenIntoArray`:

- Only values for which `Array.isArray` is true are flattened. Array-likes, `Set`s, strings and typed arrays stay as single elements.
- Holes in the source and in nested arrays are skipped (a `HasProperty` check), so `flat` also removes them.
- The result is created with `ArraySpeciesCreate`, so subclasses are preserved.
- Neither mutates the original, and the copy is shallow.

**Implementing `flatten`.** An interviewer wants recursion with a depth counter (below), `reduce` with `concat`, or an iterative stack for very deep input. The recursive version is limited by call-stack depth.

## Example

```js
const nested = [1, [2, [3, [4]]]];
console.log(nested.flat());         // → [ 1, 2, [ 3, [ 4 ] ] ]
console.log(nested.flat(Infinity)); // → [ 1, 2, 3, 4 ]
console.log([1, , [2, , 3]].flat()); // → [ 1, 2, 3 ]

console.log([1, 2, 3].flatMap((n) => [n, n * 10]));             // → [ 1, 10, 2, 20, 3, 30 ]
console.log([1, 2, 3, 4].flatMap((n) => (n % 2 === 0 ? [n] : []))); // → [ 2, 4 ]
console.log([1, 2].flatMap((n) => [[n]]));                      // → [ [ 1 ], [ 2 ] ]
console.log([new Set([1])].flat());                             // → [ Set(1) { 1 } ]

function flatten(array, depth = 1) {
  const result = [];
  function walk(items, remainingDepth) {
    items.forEach((item) => { // forEach skips holes, like the spec
      if (Array.isArray(item) && remainingDepth > 0) walk(item, remainingDepth - 1);
      else result.push(item);
    });
  }
  walk(array, depth);
  return result;
}
console.log(flatten(nested, Infinity));  // → [ 1, 2, 3, 4 ]
console.log(flatten([1, , [2]]));        // → [ 1, 2 ]
```

## Pitfalls

- Expecting `flatMap` to flatten more than one level. `[1].flatMap(() => [[2]])` gives `[[2]]`.
- Expecting `flat` to unwrap array-likes or iterables. Only `Array.isArray` values are flattened.
- Forgetting that `flat` drops holes. It is a way to compact a sparse array, but it can silently change the length.
- Using `reduce((acc, x) => acc.concat(x))` or spread on every step for a large input. It copies the accumulator each time (O(n²)).

## Follow-ups

**Q:** `flatMap` or `map` + `filter`?
**A:** `flatMap` does both in one pass and one allocation, but `map(...).filter(Boolean)` is often clearer. Pick by readability unless profiling says otherwise.

**Q:** Is there a nesting limit?
**A:** The spec has none beyond the 2⁵³−1 element limit, but implementations recurse. In Node 24, `flat(Infinity)` on a 20,000-deep nest threw a `RangeError` (observed, not spec behaviour). An explicit stack avoids that.

**Q:** What did people use before `flat`?
**A:** `[].concat(...arrays)` for one level, and recursion with `reduce` for deeper nests.

## Exercises

### Predict the output

```js
console.log([[1, [2]], [3]].flat().length);
console.log(['a-b', 'c'].flatMap((s) => s.split('-')));
console.log([1, 2, 3].flatMap((n) => (n === 2 ? [] : n)));
```

**Answer:** `3`, `[ 'a', 'b', 'c' ]`, `[ 1, 3 ]`. The first `flat()` gives `[1, [2], 3]`, which has three elements because it only goes one level. The second splits each string and merges the pieces. The third returns a non-array (kept as one element) or an empty array (dropped).
