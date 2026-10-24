---
title: "What are sparse arrays and holes?"
status: draft
difficulty: medium
frequency: 2
core: false
tags: [array, sparse-array, holes, length, array-exotic-object, has-property]
related:
  - javascript/arrays/mutating-vs-copying-methods
  - javascript/arrays/implement-map-filter-reduce
  - javascript/arrays/array-from-and-fromasync
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-array-exotic-objects
  - https://tc39.es/ecma262/#sec-array-exotic-objects-defineownproperty-p-desc
  - https://tc39.es/ecma262/#sec-arraysetlength
  - https://tc39.es/ecma262/#array-index
  - https://tc39.es/ecma262/#sec-array.prototype.foreach
  - https://tc39.es/ecma262/#sec-array.prototype.includes
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Indexed_collections#sparse_arrays
  - https://v8.dev/blog/elements-kinds
tldr: >
  An array is an exotic object whose elements are ordinary properties named by array indices, and
  `length` is kept above the highest index. A hole is an index with no property at all, which is
  different from an own property holding `undefined`. `forEach`, `map`, `filter` and `reduce` skip
  holes; `includes`, `find`, `join`, spread, `for...of` and `Array.from` read them as `undefined`.
---

## Answer

An Array is an **exotic object**: its `[[DefineOwnProperty]]` treats array-index keys (integers from 0 to 2³²−2) specially. Elements are ordinary properties, and the non-configurable `length` property is always greater than the highest index. Two rules follow:

- Setting an index at or beyond `length` raises `length` to `index + 1`.
- Setting `length` lower **deletes** the elements at or above it. Raising it creates no properties.

A **hole** (empty slot) is an index below `length` with no own property. It comes from `[1, , 3]`, `new Array(3)`, `arr[5] = x` past the end, `delete arr[i]`, and raising `length`. `[1, undefined, 3]` is different: `1 in arr` is `true` there and `false` for a hole.

Methods differ in how they treat holes:

- **Skip them (`HasProperty` check):** `forEach`, `map` (the hole is kept in the result), `filter`, `reduce`, `some`, `every`, `indexOf`, `lastIndexOf`, `flat`, `sort` (moves holes to the end), `Object.keys`, `for...in`.
- **Read as `undefined` (`Get` only):** `includes`, `find`, `findIndex`, `findLast`, `join` (empty string), spread, `for...of`, `Array.from`, `entries`/`keys`/`values`, and the new copying methods such as `toSorted`.

Because the check is `HasProperty`, a hole is visible if the prototype chain has that index, which only matters if someone assigned `Array.prototype[1]`.

`JSON.stringify` writes holes as `null`.

Engine note (V8, not spec): arrays with holes are tracked as "holey" and stay that way, so their operations need extra checks. For performance, build arrays with literals or `push` rather than `new Array(n)`.

## Example

```js
const holes = [1, , 3];
const undef = [1, undefined, 3];
console.log(1 in holes, 1 in undef);                // → false true
console.log(Object.keys(holes));                    // → [ '0', '2' ]
console.log(holes.map((x) => x * 2));               // → [ 2, <1 empty item>, 6 ]
console.log(holes.filter(() => true));              // → [ 1, 3 ]
console.log(holes.includes(undefined), holes.indexOf(undefined)); // → true -1
console.log([...holes]);                            // → [ 1, undefined, 3 ]
console.log(holes.join('-'));                       // → 1--3

const a = [1, 2, 3, 4];
a.length = 2;
console.log(a);                                     // → [ 1, 2 ]
a.length = 4;
console.log(a);                                     // → [ 1, 2, <2 empty items> ]

const b = [];
b[5] = 'x';
console.log(b.length);                              // → 6
console.log(new Array(3).map((_, i) => i));         // → [ <3 empty items> ]
console.log(Array.from({ length: 3 }, (_, i) => i)); // → [ 0, 1, 2 ]
```

## Pitfalls

- `new Array(3).map(...)` or `.forEach(...)` does nothing, because every index is a hole. Use `Array.from({ length: 3 }, fn)` or `new Array(3).fill().map(fn)`.
- `new Array(n)` with a single number creates length `n`, while `new Array('3')` or `Array(2, 3)` creates elements. A negative or non-integer length throws a `RangeError`.
- Assuming `length` counts elements. It is highest index plus one, so `b[1e6] = 1` gives `length` 1000001 with one element.
- Using `x[i] === undefined` to detect a hole. It can't tell a hole from a stored `undefined`; use `i in arr` or `Object.hasOwn(arr, i)`.

## Follow-ups

**Q:** Is `arr[2**32 - 1] = x` an element?
**A:** No. 2³²−1 is not an array index, so it becomes an ordinary property and `length` doesn't change. The largest index is 2³²−2, giving a maximum `length` of 2³²−1.

**Q:** Why does `delete arr[i]` leave `length` unchanged?
**A:** `delete` removes the property only. `length` is adjusted only when a property is added at or above it, or when you assign it. Use `splice` to remove an element and shift the rest.

**Q:** How do I turn holes into `undefined`?
**A:** Spread, `Array.from(arr)` or `toSorted()`/`toReversed()` read every index; `arr.fill(undefined)` overwrites everything.

## Exercises

### Predict the output

```js
const arr = [, 'a', , 'b'];
console.log(arr.length, Object.keys(arr).length);
console.log(arr.findIndex((x) => x === undefined), arr.indexOf(undefined));
arr.length = 1;
console.log(arr);
```

**Answer:** `4 2`, then `0 -1`, then `[ <1 empty item> ]`. Two own properties exist (`'1'` and `'3'`). `findIndex` visits every index and finds the hole at 0, while `indexOf` skips holes. Setting `length = 1` deletes indices 1 and 3, leaving only the hole at 0.
