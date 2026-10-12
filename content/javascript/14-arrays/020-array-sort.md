---
title: "How does `Array.prototype.sort` work?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [array, sort, comparator, stable-sort, locale-compare]
related:
  - javascript/arrays/mutating-vs-copying-methods
  - javascript/arrays/sparse-arrays
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-array.prototype.sort
  - https://tc39.es/ecma262/#sec-sortindexedproperties
  - https://tc39.es/ecma262/#sec-comparearrayelements
  - https://tc39.es/ecma262/#sec-array.prototype.tosorted
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
  - https://v8.dev/features/stable-sort
tldr: >
  `sort` sorts in place and returns the same array. Without a comparator it compares elements as
  strings (UTF-16 code units), so `[10, 9, 1].sort()` gives `[1, 10, 9]`. A comparator returns
  negative, zero or positive. Since ES2019 the sort must be stable. `undefined` goes last, then holes.
---

## Answer

`sort` reorders the array **in place** and returns the same array. For a copy, use `toSorted`.

**Default order.** With no comparator, every element is converted with `ToString` and the strings are compared by UTF-16 code units. That is why numbers sort as text (`[10, 9, 1, 100]` becomes `[1, 10, 100, 9]`) and why `'B'` sorts before `'a'`.

**Comparator.** `(a, b) => number` returns a negative number to put `a` first, a positive number to put `b` first, and `0` to treat them as equal. For numbers, `a - b` ascending and `b - a` descending is the usual idiom (safe for finite numbers). The spec converts the result with `ToNumber`, and treats `NaN` as `0`. Returning a boolean (`a > b`) is wrong: `false` and `true` become `0` and `1`, and a comparator must be able to say "less than". The result depends on the algorithm, so it's implementation-defined.

**Stability.** Since ES2019 the spec requires a stable sort: items the comparator calls equal keep their original relative order. That is what makes "sort by last name, then by country" work with two passes.

**Consistent comparator.** If the comparator is not consistent (same answer for the same pair, transitive, symmetric), the resulting order is implementation-defined. A random comparator like `() => Math.random() - 0.5` is therefore not a correct shuffle.

**`undefined` and holes.** `undefined` values are never passed to the comparator. They are moved to the end, followed by holes (the spec collects only existing indices, sorts them, writes them back and deletes the remaining indices). `toSorted` instead reads holes as `undefined`.

**Text.** Use `a.localeCompare(b)` or an `Intl.Collator` for human-language order; code-unit order puts `'é'` after `'z'`.

The algorithm is implementation-defined: the spec fixes the result, not the order of comparator calls.

## Example

```js
console.log([10, 9, 1, 100].sort());                // → [ 1, 10, 100, 9 ]
console.log([10, 9, 1, 100].sort((a, b) => a - b)); // → [ 1, 9, 10, 100 ]

const people = [
  { name: 'Ana', age: 30 }, { name: 'Bo', age: 25 },
  { name: 'Cy', age: 30 }, { name: 'Di', age: 25 },
];
const byAge = people.toSorted((a, b) => a.age - b.age);
console.log(byAge.map((p) => p.name).join()); // → Bo,Di,Ana,Cy  (equal ages keep input order)

console.log(['b', undefined, 'a', , 'c'].sort());
// → [ 'a', 'b', 'c', undefined, <1 empty item> ]

console.log(['é', 'z', 'a'].sort());                             // → [ 'a', 'z', 'é' ]
console.log(['é', 'z', 'a'].sort((a, b) => a.localeCompare(b))); // → [ 'a', 'é', 'z' ]

// Boolean comparator: result is implementation-defined; in Node 24 (V8) it sorts nothing
console.log([3, 1, 2].sort((a, b) => a > b)); // → [ 3, 1, 2 ]
```

## Pitfalls

- Calling `sort()` on numbers without a comparator.
- Returning a boolean from the comparator. It looks right on a few inputs in some engines and breaks in others.
- Using `a - b` where the values can be `NaN` or `Infinity`. `Infinity - Infinity` is `NaN`, which is treated as equal. For strings use `localeCompare` or explicit `<` / `>` checks.
- Sorting a shared array in place (`props.items.sort(...)`) when the data belongs to someone else. Use `toSorted`.

## Follow-ups

**Q:** Why did older code add an index tiebreaker to get a stable sort?
**A:** Before ES2019 the spec did not require stability, and some engines used an unstable sort for larger arrays (Chrome 70 shipped a stable sort, and V8 uses TimSort). Today equal keys keep their order, so a single sort with a tie-breaker comparator is enough.

**Q:** How do you sort by an expensive derived key?
**A:** Compute the key once per element (map to `{ key, value }` pairs), sort the pairs, then map back. A comparator that recomputes the key runs O(n log n) times.

**Q:** Does `sort` work on array-likes?
**A:** Yes. It is generic: `Array.prototype.sort.call({ 0: 'b', 1: 'a', length: 2 })` sorts the object in place and returns it.

## Exercises

### Predict the output

```js
const items = [
  { id: 1, tag: 'b' }, { id: 2, tag: 'a' },
  { id: 3, tag: 'b' }, { id: 4, tag: 'a' },
];
items.sort((x, y) => (x.tag < y.tag ? -1 : x.tag > y.tag ? 1 : 0));
console.log(items.map((i) => i.id).join());
console.log([5, 25, 100, 1].sort().join());
```

**Answer:** `2,4,1,3` and `1,100,25,5`. The first sort compares tags only, and stability keeps `2` before `4` and `1` before `3`. The second has no comparator, so the numbers compare as strings: `'1' < '100' < '25' < '5'`.
