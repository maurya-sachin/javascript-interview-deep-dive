# 14 — Arrays

> **Status:** 🔴 planned · **Published:** 0/8 · **Last verified:** —

Array semantics and methods — mutating vs copying, sorting, holes, searching — and the polyfills interviewers ask for.

## Learning goals

After this chapter you can:

- Say which array methods mutate and use their copying versions
- Sort correctly with a comparator and explain stability
- Implement `map`, `filter`, `reduce`, and `flatten`
- Explain how holes differ from `undefined`

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Mutating methods vs `toSorted`, `toReversed`, `toSpliced`, `with` → 010
- `sort`: default string comparison, comparators, stability → 020
- `map`, `filter`, `reduce`, `forEach` semantics and polyfills → 030
- Arrays as exotic objects; `length`; holes vs `undefined` → 040
- Array-likes vs iterables; `Array.from`, `Array.of`, `Array.fromAsync` → 050
- `includes` (SameValueZero) vs `indexOf`; `find`, `findLast`, `findIndex`, `at` → 060
- `flat`, `flatMap`; implementing `flatten` → 070
- `Array(n)` vs `Array.from({ length: n })` → 040, 050
- `some`, `every`, `fill`, `copyWithin` → 080

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [Which array methods mutate, and what are their copying versions?](010-mutating-vs-copying-methods.md) | easy | 🟡 draft |
| 020 | [How does `Array.prototype.sort` work?](020-array-sort.md) | medium | 🟡 draft |
| 030 | [Implement `map`, `filter`, and `reduce`.](030-implement-map-filter-reduce.md) | medium | 🟡 draft |
| 040 | [What are sparse arrays and holes?](040-sparse-arrays.md) | medium | 🟡 draft |
| 050 | [Array-likes vs iterables: how do `Array.from` and `Array.fromAsync` work?](050-array-from-and-fromasync.md) | medium | 🟡 draft |
| 060 | [`includes` vs `indexOf` vs `find` vs `findLast` vs `at`?](060-searching-arrays.md) | easy | 🟡 draft |
| 070 | [How do `flat` and `flatMap` work?](070-flat-and-flatmap.md) | medium | 🟡 draft |
| 080 | [Why does `[].every(fn)` return `true`, and what does `fill` do with an object?](080-some-every-fill-copywithin.md) | easy | 🟡 draft |
<!-- generated:questions:end -->

## Sources

- **Spec:** [Array objects](https://tc39.es/ecma262/#sec-array-objects) · [Array exotic objects](https://tc39.es/ecma262/#sec-array-exotic-objects) · [Array.prototype.sort](https://tc39.es/ecma262/#sec-array.prototype.sort) · [Array.fromAsync](https://tc39.es/ecma262/#sec-array.fromasync)
- **MDN:** [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) · [sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) · [Array.fromAsync](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fromAsync)
