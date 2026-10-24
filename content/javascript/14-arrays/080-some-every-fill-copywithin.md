---
title: "Why does `[].every(fn)` return `true`, and what does `fill` do with an object?"
status: draft
difficulty: easy
frequency: 3
core: false
tags: [arrays, some, every, fill, copywithin, short-circuit]
related:
  - javascript/arrays/mutating-vs-copying-methods
  - javascript/arrays/sparse-arrays
  - javascript/arrays/searching-arrays
  - javascript/arrays/array-from-and-fromasync
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-array.prototype.every
  - https://tc39.es/ecma262/#sec-array.prototype.some
  - https://tc39.es/ecma262/#sec-array.prototype.fill
  - https://tc39.es/ecma262/#sec-array.prototype.copywithin
  - https://tc39.es/ecma262/#sec-toclampedindex
  - https://tc39.es/ecma262/#sec-%typedarray%.prototype.fill
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fill
tldr: >
  `every` is "for all" and `some` is "there exists": both stop at the first deciding element, so on
  `[]` `every` returns `true` and `some` returns `false` without calling the callback.
  `fill` writes the same value into every slot, so filling with an object shares one reference
  everywhere. `copyWithin` copies a range inside the same array, overlap-safe, never changing `length`.
---

## Answer

**`some` and `every`** are the two quantifiers. `every` loops from index 0 and returns `false` at the first element whose callback result is falsy (`ToBoolean`); if it reaches the end, it returns `true`. `some` mirrors it: `true` at the first truthy result, `false` otherwise. The spec notes call them the "for all" and "exists" quantifiers.

So the empty-array result isn't a special case. With `length` 0 the loop never runs and each method returns its default: `every` → `true` (no counterexample), `some` → `false` (no witness). This is vacuous truth, and it keeps `!arr.some(p)` equal to `arr.every(x => !p(x))` for every array, empty included.

Three details:

- **Short-circuit.** They stop at the deciding element, unlike `filter(...).length`.
- **Holes are skipped.** Each index is checked with `HasProperty` first, so missing elements are never passed to the callback.
- **The range is fixed up front.** `length` is read once; elements pushed during the loop aren't visited.

**`fill(value, start, end)`** assigns the *same* `value` to every index in the range, then returns the array it mutated. With a primitive that's harmless. With an object, every slot holds a reference to one object, so `new Array(3).fill([])` is three views of one array. Create a fresh object per slot with `Array.from({ length: 3 }, () => [])`. `fill` doesn't check `HasProperty`, so unlike `some`/`every`, it fills holes.

**`copyWithin(target, start, end)`** copies the elements in `[start, end)` to positions starting at `target`, inside the same array. It never grows the array: copying stops at `length`. When the ranges overlap and the target is after the source, the spec copies backwards, like C's `memmove`, so the source isn't overwritten before it's read.

All of them read negative indices relative to `length` and clamp out-of-range ones (`ToClampedIndex`), and all are generic: they work on any array-like object.

## Example

```js
console.log([].every((x) => x > 0)); // → true
console.log([].some((x) => x > 0)); // → false

const seen = [];
[1, , 3, -4, 5].every((x) => (seen.push(x), x > 0));
console.log(seen); // → [ 1, 3, -4 ]

const grid = new Array(3).fill([]);
grid[0].push('x');
console.log(grid); // → [ [ 'x' ], [ 'x' ], [ 'x' ] ]
console.log(grid[0] === grid[2]); // → true

const rows = Array.from({ length: 3 }, () => []);
rows[0].push('x');
console.log(rows); // → [ [ 'x' ], [], [] ]

console.log([1, 2, 3, 4, 5].fill(0, -2)); // → [ 1, 2, 3, 0, 0 ]
console.log([1, 2, 3, 4, 5].copyWithin(1, 0, 3)); // → [ 1, 1, 2, 3, 5 ]
```

## Pitfalls

- Treating `[].every(...)` as a bug and guarding validation with it. An empty list passes every `every` check, so test `arr.length > 0` separately when "at least one" is required.
- Building a 2-D grid with `Array(n).fill(Array(m).fill(0))`. Every row is the same array; use `Array.from({ length: n }, () => Array(m).fill(0))`.
- Forgetting that `fill` and `copyWithin` mutate and return the same array, not a copy. Neither has a copying twin; copy first (`[...arr].fill(0)`).
- Expecting `copyWithin` to insert. It overwrites in place and never changes `length`.

## Follow-ups

**Q:** Does `fill` on a typed array behave the same way?
**A:** Almost. `%TypedArray%.prototype.fill` converts `value` once with `ToNumber` (or `ToBigInt`) before the loop, then stores it with the element type's conversion, so `new Uint8Array(4).fill(300)` holds `44` in each slot. There are no holes or shared references, since elements are numbers.

**Q:** What happens to holes inside a `copyWithin` source range?
**A:** They're copied as holes. When the source index has no property, the spec runs `DeletePropertyOrThrow` on the target index, so `[1, , 3, 4].copyWithin(2, 0)` yields `[1, <hole>, 1, <hole>]`.

**Q:** Why is the callback result not required to be a boolean?
**A:** Both methods apply `ToBoolean` to it, so any truthy or falsy value works. `[1, 2].some((x) => x - 1)` is `true` because `1` is truthy.

## Exercises

### Predict the output

```js
const matrix = Array(2).fill(Array(2).fill(0));
matrix[0][1] = 7;
console.log(matrix);
console.log([[], [0]].every((row) => row.every((n) => n === 0)));
```

**Answer:** `[ [ 0, 7 ], [ 0, 7 ] ]` then `true`. The outer `fill` stores one inner array twice, so the write shows in both rows. The empty row passes its inner `every` vacuously, and `[0]` passes for real.

### Predict the output

```js
const log = [10, 20, 30, 40, 50];
log.copyWithin(0, 2);
console.log(log, log.length);
```

**Answer:** `[ 30, 40, 50, 40, 50 ] 5`. Indices 2–4 are copied to 0–2; the last two slots keep their old values, and `length` stays 5.
