---
title: "Which array methods mutate, and what are their copying versions?"
status: draft
difficulty: easy
frequency: 4
core: false
tags: [array, mutation, immutability, to-sorted, to-reversed, to-spliced, with]
related:
  - javascript/arrays/array-sort
  - javascript/arrays/sparse-arrays
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-array.prototype.tosorted
  - https://tc39.es/ecma262/#sec-array.prototype.toreversed
  - https://tc39.es/ecma262/#sec-array.prototype.tospliced
  - https://tc39.es/ecma262/#sec-array.prototype.with
  - https://tc39.es/ecma262/#sec-arraycreate
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
tldr: >
  `push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse`, `fill` and `copyWithin` change the
  array they are called on. `toSorted`, `toReversed`, `toSpliced` and `with` (ES2023) return a
  new array instead. Everything is a shallow copy, and the copies turn holes into `undefined`.
---

## Answer

The **mutating** methods change `this` in place: `push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse`, `fill` and `copyWithin`. Most return something other than the array (`push` returns the new length, `splice` returns the removed items), but `sort`, `reverse`, `fill` and `copyWithin` return the same array, which makes it easy to forget they mutated it.

ES2023 added four **copying** counterparts:

| Mutating | Copying |
|---|---|
| `reverse()` | `toReversed()` |
| `sort(cmp)` | `toSorted(cmp)` |
| `splice(start, n, ...items)` | `toSpliced(start, n, ...items)` |
| `arr[i] = v` | `with(i, v)` |

For the rest, MDN's suggested replacements are `slice` (for `pop` and `shift`) and `concat` (for `push`), or copy first and then mutate: `[...arr].fill(0)`.

Details worth knowing:

- Copies are **shallow**: the new array holds the same object references.
- The new methods never touch `this`, so they work on frozen arrays. `sort()` on a frozen array throws a `TypeError`.
- They always build a plain `Array` (spec: `ArrayCreate`), ignoring `constructor` and `Symbol.species`, unlike `slice`, `map` or `filter`.
- They read every index with `Get`, so holes come out as `undefined`. The older `reverse` and `splice` preserve holes.
- `with` accepts negative indices, but throws a `RangeError` when the index is out of bounds, unlike `arr[10] = v`, which extends the array.

Why it matters: React state, Redux reducers and `useMemo` inputs depend on reference equality, so `state.sort()` followed by `setState(state)` does not re-render and corrupts the previous state.

## Example

```js
const original = Object.freeze([3, 1, 2]);

console.log(original.toSorted((a, b) => a - b)); // → [ 1, 2, 3 ]
console.log(original.toReversed());              // → [ 2, 1, 3 ]
console.log(original.with(0, 99));               // → [ 99, 1, 2 ]
console.log(original.toSpliced(1, 1, 'a', 'b')); // → [ 3, 'a', 'b', 2 ]
console.log(original);                           // → [ 3, 1, 2 ]

try { original.sort(); } catch (e) { console.log(e.name); } // → TypeError

console.log([1, 2, 3].with(-1, 0)); // → [ 1, 2, 0 ]
try { [1, 2, 3].with(3, 0); } catch (e) { console.log(e.name); } // → RangeError

const sparse = [1, , 3];
console.log(sparse.toReversed()); // → [ 3, undefined, 1 ]
console.log(sparse.reverse());    // → [ 3, <1 empty item>, 1 ]

const a = [1, 2, 3];
console.log(a.sort() === a, a.toSorted() === a); // → true false
```

## Pitfalls

- Treating `sort()`, `reverse()` and `fill()` as if they returned a copy. `const sorted = arr.sort()` aliases `arr`.
- Calling it a deep copy. `toSorted()` and `with()` share the element objects, so mutating `copy[0].x` changes the original too.
- Assuming a subclass survives: `MyArray.from(...).toSorted()` is a plain `Array`, while `slice()` is a `MyArray`.
- Expecting `toSpliced()` with no arguments to remove everything. With no `start` it removes nothing and returns a copy. `toSpliced(1)` drops index 1 to the end, matching `splice(1)`.

## Follow-ups

**Q:** What is the cost of the copying versions?
**A:** O(n) time and memory for every call, even `with`. Mutating `push` and `pop` touch only the end of the array. In a hot loop, copy once and mutate the copy.

**Q:** Can I use these in older environments?
**A:** They are ES2023. Check your support targets, or copy first with `[...arr]` or `slice()` and then call the mutating method.

## Exercises

### Which lines change `nums`?

```js
const nums = [3, 1, 2];
const a = nums.toSorted();
const b = nums.slice().reverse();
const c = nums.reverse();
console.log(a, b, c === nums, nums);
```

**Answer:** `[ 1, 2, 3 ] [ 2, 1, 3 ] true [ 2, 1, 3 ]`. `toSorted()` returns a sorted copy (default sort is by string, which happens to match here). `slice().reverse()` reverses a copy taken before `nums` changes. `nums.reverse()` mutates `nums` and returns the same array, so `c === nums`.
