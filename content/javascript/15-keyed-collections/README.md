# 15 — Keyed collections

> **Status:** 🔴 planned · **Published:** 0/6 · **Last verified:** —

`Map`, `Set`, and their weak variants, plus grouping and upsert helpers.

## Learning goals

After this chapter you can:

- Choose between `Map` and a plain object
- Use the ES2025 set methods
- Explain what weak collections allow and why they can't be iterated
- Group and upsert data without hand-rolled loops

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- `Map` vs object: key types, ordering, `size`, inherited keys, performance → 010
- SameValueZero key equality → 010
- `Set` and the ES2025 methods (`union`, `intersection`, `difference`, `isSubsetOf`, …) → 020
- `WeakMap`/`WeakSet`: weak keys, non-iterability, private data and caches → 030
- Symbols as `WeakMap` keys → 030
- `Object.groupBy`, `Map.groupBy` → 040
- `getOrInsert`, `getOrInsertComputed` → 050
- Implementing an LRU cache with `Map` → 060

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [When do you use a `Map` instead of an object?](010-map-vs-object.md) | easy | 🟡 draft |
| 020 | [What can a `Set` do in ES2025?](020-set-methods.md) | easy | 🟡 draft |
| 030 | [What are `WeakMap` and `WeakSet` for, and why can't you iterate them?](030-weakmap-weakset.md) | medium | 🟡 draft |
| 040 | [How do `Object.groupBy` and `Map.groupBy` work?](040-groupby.md) | easy | 🟡 draft |
| 050 | [What does `Map.prototype.getOrInsert` solve?](050-map-upsert.md) | easy | 🟡 draft |
| 060 | [Implement an LRU cache with `Map`.](060-lru-cache-with-map.md) | medium | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- **Spec:** [Map objects](https://tc39.es/ecma262/#sec-map-objects) · [Set objects](https://tc39.es/ecma262/#sec-set-objects) · [WeakMap objects](https://tc39.es/ecma262/#sec-weakmap-objects) · [Object.groupBy](https://tc39.es/ecma262/#sec-object.groupby) · [Map.prototype.getOrInsert](https://tc39.es/ecma262/#sec-map.prototype.getorinsert)
- **MDN:** [Keyed collections](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Keyed_collections) · [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) · [Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set) · [WeakMap](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)
