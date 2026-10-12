---
title: "What can a `Set` do in ES2025?"
status: draft
difficulty: easy
frequency: 2
core: false
tags: [set, set-methods, union, intersection, difference, set-like, es2025]
related:
  - javascript/keyed-collections/map-vs-object
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-set-objects
  - https://tc39.es/ecma262/#sec-getsetrecord
  - https://tc39.es/ecma262/#sec-set.prototype.union
  - https://tc39.es/ecma262/#sec-set.prototype.intersection
  - https://tc39.es/ecma262/#sec-set.prototype.difference
  - https://tc39.es/ecma262/#sec-set.prototype.symmetricdifference
  - https://tc39.es/ecma262/#sec-set.prototype.issubsetof
  - https://tc39.es/ecma262/#sec-set.prototype.issupersetof
  - https://tc39.es/ecma262/#sec-set.prototype.isdisjointfrom
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/union
tldr: >
  ES2025 adds seven `Set.prototype` methods: `union`, `intersection`, `difference`, `symmetricDifference`
  (each returns a new `Set`) and `isSubsetOf`, `isSupersetOf`, `isDisjointFrom` (booleans). They never
  mutate, accept any set-like object (`size`, `has`, `keys`) rather than only a `Set`, and reject arrays.
---

## Answer

A `Set` holds unique values, compared with SameValueZero (the same rule as `Map` keys). Before ES2025 you wrote set algebra by hand with `filter` and spread. `Set.prototype` now has seven methods:

| Method | Result |
|---|---|
| `a.union(b)` | new `Set` of everything in `a` or `b` |
| `a.intersection(b)` | new `Set` of what is in both |
| `a.difference(b)` | new `Set` of `a` without `b`'s members |
| `a.symmetricDifference(b)` | new `Set` of what is in exactly one of them |
| `a.isSubsetOf(b)` | `true` if every member of `a` is in `b` |
| `a.isSupersetOf(b)` | `true` if every member of `b` is in `a` |
| `a.isDisjointFrom(b)` | `true` if they share no member |

Properties worth stating in an interview:

- **Non-mutating.** The four algebra methods return a fresh, plain `Set` (never a subclass instance); `a` is unchanged.
- **The argument is "set-like", not a `Set`.** The spec's `GetSetRecord` reads `size`, `has` and `keys` from it. A `Map` qualifies (its keys are used); an array does not, because it has no `size`, so you get a `TypeError`. Wrap it: `new Set(array)`.
- **Validation.** `size` must convert to a number that is not `NaN` (else `TypeError`) and not negative (else `RangeError`); `has` and `keys` must be callable.
- **Ordering.** `union` puts `a`'s members first, then `b`'s new ones. `intersection` iterates whichever side is smaller (compared by `size`), so the result follows `b`'s order when `b` is smaller than `a`.

Support: Baseline since June 2024 per MDN, and available in Node 24 (run below).

## Example

```js
const a = new Set([1, 2, 3, 4]);
const b = new Set([3, 4, 5]);
console.log(a.union(b));               // → Set(5) { 1, 2, 3, 4, 5 }
console.log(a.intersection(b));        // → Set(2) { 3, 4 }
console.log(a.difference(b));          // → Set(2) { 1, 2 }
console.log(a.symmetricDifference(b)); // → Set(3) { 1, 2, 5 }
console.log(new Set([3]).isSubsetOf(a));        // → true
console.log(a.isSupersetOf(new Set([1, 9])));   // → false
console.log(a.isDisjointFrom(new Set([7, 8]))); // → true
console.log(a.size);                   // → 4

console.log(a.union(new Map([[9, 'x']]))); // → Set(5) { 1, 2, 3, 4, 9 }
const evens = { size: 2, has: (n) => n % 2 === 0, keys: () => [2, 4][Symbol.iterator]() };
console.log(a.intersection(evens));    // → Set(2) { 2, 4 }

try { a.union([5]); } catch (error) { console.log(error.name); } // → TypeError
console.log(a.intersection(new Set([4, 3]))); // → Set(2) { 4, 3 }
```

## Pitfalls

- Passing an array. `a.union([5])` throws a `TypeError`; use `a.union(new Set([5]))`.
- Expecting mutation. These methods return a new `Set`; to update in place, reassign or loop with `add`/`delete`.
- Using them on engines without support. Guard with `typeof Set.prototype.union === 'function'` or polyfill, because older engines lack them.
- Comparing sets with `===`. Two sets with equal contents are different objects; check `a.size === b.size && a.isSubsetOf(b)`.

## Follow-ups

**Q:** How did you intersect two sets before this?
**A:** `new Set([...a].filter((x) => b.has(x)))`. That allocates an intermediate array and is no longer needed on current engines.

**Q:** Why do the methods take set-likes instead of requiring a `Set`?
**A:** So a `Map`, or your own class with `size`, `has` and `keys`, can take part. The spec reads only those three members through `GetSetRecord`.

**Q:** What happens to `NaN` and `-0`?
**A:** SameValueZero: `NaN` equals `NaN`, and `-0` is stored as `0`. `new Set([1, NaN]).union(new Set([NaN, -0, 0]))` is `Set(3) { 1, NaN, 0 }`.

## Exercises

### Predict the output

```js
const a = new Set([1, 2, 3]);
const b = new Set([2, 3, 4]);
console.log([...a.symmetricDifference(b)]);
console.log(a.isSubsetOf(a), a.isDisjointFrom(new Set()));
```

**Answer:** `[ 1, 4 ]`, then `true true`. A set is a subset of itself, and the empty set shares no members with anything.
