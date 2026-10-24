---
title: "`includes` vs `indexOf` vs `find` vs `findLast` vs `at`?"
status: draft
difficulty: easy
frequency: 3
core: false
tags: [array, includes, index-of, find, find-last, at, same-value-zero]
related:
  - javascript/arrays/sparse-arrays
  - javascript/arrays/implement-map-filter-reduce
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-array.prototype.includes
  - https://tc39.es/ecma262/#sec-array.prototype.indexof
  - https://tc39.es/ecma262/#sec-array.prototype.findlast
  - https://tc39.es/ecma262/#sec-findviapredicate
  - https://tc39.es/ecma262/#sec-array.prototype.at
  - https://github.com/tc39/proposals/blob/main/finished-proposals.md
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/at
tldr: >
  Use `includes` for a yes/no check by value (SameValueZero, so it finds `NaN`), `indexOf` for the
  position by value (strict equality, no `NaN`), `find`/`findIndex` and `findLast`/`findLastIndex`
  when a predicate decides, and `at(-1)` for relative indexing. `at` and `find*` return
  `undefined` when nothing matches; `indexOf` and `findIndex` return `-1`.
---

## Answer

Two questions decide the method: *do I match by value or by a predicate*, and *do I want a boolean, the item, or the index*.

| Method | Matches by | Returns | No match |
|---|---|---|---|
| `includes(x, from?)` | SameValueZero | `boolean` | `false` |
| `indexOf(x, from?)` / `lastIndexOf` | strict equality (`===`) | index | `-1` |
| `find(fn)` / `findLast(fn)` | predicate | element | `undefined` |
| `findIndex(fn)` / `findLastIndex(fn)` | predicate | index | `-1` |
| `at(i)` | position | element | `undefined` |

**`includes` vs `indexOf`.** SameValueZero treats `NaN` as equal to itself (and `0` as equal to `-0`), so `[NaN].includes(NaN)` is `true` while `[NaN].indexOf(NaN)` is `-1`. `indexOf` also skips holes (it checks `HasProperty`), while `includes` reads them as `undefined`. Neither does deep comparison: objects match by reference, so use `find`/`some` with a predicate.

**`find` family.** The predicate receives `(element, index, array)`, and iteration stops at the first truthy result. `findLast` and `findLastIndex` (ES2023) scan from the end, which avoids `arr.slice().reverse().find(...)`. `find` returns `undefined` for no match, which is ambiguous if the array can hold `undefined`, so use `findIndex` there. All of them visit holes as `undefined`.

**`at`.** `at(i)` accepts negative integers, counting from the end: `arr.at(-1)` is the last item, where `arr[-1]` is just a property lookup of `"-1"` and gives `undefined`. The index is truncated to an integer (`NaN` becomes `0`), and out-of-range returns `undefined`. It's generic, so it works on strings too.

`includes` and `indexOf` take a `fromIndex`; a negative one counts from the end.

For "is there any/all": `some` and `every` return booleans and stop early.

## Example

```js
console.log([NaN].includes(NaN), [NaN].indexOf(NaN));    // → true -1
console.log([1, , 3].includes(undefined), [1, , 3].indexOf(undefined)); // → true -1
console.log([{ id: 1 }].includes({ id: 1 }));            // → false

const users = [{ id: 1, ok: false }, { id: 2, ok: true }, { id: 3, ok: true }];
console.log(users.find((u) => u.ok).id);                 // → 2
console.log(users.findLast((u) => u.ok).id);             // → 3
console.log(users.findIndex((u) => u.id === 9));         // → -1
console.log(users.findLastIndex((u) => u.ok));           // → 2

const xs = [10, 20, 30];
console.log(xs.at(-1), xs.at(0), xs.at(3), xs[-1]);      // → 30 10 undefined undefined
console.log(xs.at(1.9), xs.at(NaN));                     // → 20 10
console.log([undefined].find(() => true), [undefined].findIndex(() => true)); // → undefined 0

console.log([1, 2, 3, 2].includes(2, 2));                // → true
console.log([1, 2, 3, 2].indexOf(2, -2), [1, 2, 3, 2].lastIndexOf(2, -2)); // → 3 1
```

## Pitfalls

- `arr.indexOf(x) !== -1` for a membership test. It misses `NaN`; `includes` reads better and is correct.
- Searching for an object literal. `includes({ id: 1 })` creates a new object, so it's never found.
- Using `find` and then testing the result for truthiness. A found `0`, `''` or `false` looks like a miss; check the index, or use `some` when you only need a boolean.
- Writing `arr[-1]` like Python. It reads the property `"-1"` and gives `undefined`; use `arr.at(-1)`.

## Follow-ups

**Q:** Is `includes` faster than `indexOf`?
**A:** Both are linear scans. For repeated lookups on large data, build a `Set` once and call `has`.

**Q:** What does `lastIndexOf` do with `fromIndex`?
**A:** It searches backwards starting at `fromIndex`, with a negative value counting from the end, so `[1, 2, 3, 2].lastIndexOf(2, -2)` is `1`.

**Q:** Can `at` be used on a string?
**A:** `'abc'.at(-1)` is `'c'`, because `String.prototype.at` exists too. `Array.prototype.at` is also generic, so `.call('abc', -1)` works.

## Exercises

### Predict the output

```js
const list = [0, NaN, '', null];
console.log(list.find((x) => !x), list.findLast((x) => !x));
console.log(list.indexOf(NaN), list.includes(NaN), list.at(-5));
```

**Answer:** `0 null`, then `-1 true undefined`. Every element is falsy, so `find` returns the first (`0`) and `findLast` the last (`null`). `indexOf(NaN)` uses `===` and fails; `includes` uses SameValueZero and succeeds. `-5` is before the start of a four-element array, so `at` returns `undefined`.
