---
title: "How do `Object.groupBy` and `Map.groupBy` work?"
status: draft
difficulty: easy
frequency: 2
core: false
tags: [group-by, object, map, grouping, reduce, null-prototype]
related:
  - javascript/keyed-collections/map-vs-object
  - javascript/prototypes/object-create-null
  - javascript/arrays/implement-map-filter-reduce
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-object.groupby
  - https://tc39.es/ecma262/#sec-map.groupby
  - https://tc39.es/ecma262/#sec-groupby
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy
tldr: >
  `groupBy(items, callback)` walks any iterable, calls `callback(value, index)` for each element, and
  collects the elements into arrays under the returned key. `Object.groupBy` coerces keys to property keys
  and returns a null-prototype object; `Map.groupBy` keeps keys as they are (SameValueZero) and returns a
  `Map`. Both keep encounter order within a group.
---

## Answer

Both are static methods that replace the hand-written `reduce` grouping loop:

```js
Object.groupBy(items, (item, index) => key)
Map.groupBy(items, (item, index) => key)
```

The shared `GroupBy` operation in the spec: it requires `items` to be iterable (`GetIterator`), requires `callback` to be callable (`TypeError` otherwise), and calls the callback once per element in order with `(value, index)`. Elements go into an array per key, in encounter order. If the callback throws, the iterator is closed.

They differ only in how the key is treated:

| | `Object.groupBy` | `Map.groupBy` |
|---|---|---|
| Key handling | `ToPropertyKey` (string or symbol) | kept as is; SameValueZero, `-0` becomes `0` |
| Result | object with a `null` prototype | `Map` |
| Group order | integer-like keys ascending, then creation order | strictly first-seen order |

Choose by the key. Use `Object.groupBy` when keys are strings or symbols and you want property access or JSON (`byType.fruit`). Use `Map.groupBy` when keys are numbers you care about as numbers, objects, `NaN`, or you need first-seen order and a `size`.

The null prototype means `'toString' in result` is `false`, so a group named `constructor` or `__proto__` is safe, but `result.hasOwnProperty` does not exist; use `Object.hasOwn(result, key)`.

The arrays hold the original element references, not copies. The methods do not mutate the input, and they are for synchronous iterables only.

Support: `Object.groupBy` and `Map.groupBy` are Baseline widely available since September 2026 (newly available since March 2024), per MDN; the examples below ran in Node 24.

## Example

```js
const items = [
  { name: 'asparagus', type: 'veg', qty: 5 },
  { name: 'banana', type: 'fruit', qty: 0 },
  { name: 'cherry', type: 'fruit', qty: 12 },
];

const byType = Object.groupBy(items, (item) => item.type);
console.log(Object.getPrototypeOf(byType)); // → null
console.log(Object.keys(byType));           // → [ 'veg', 'fruit' ]
console.log(byType.fruit[0] === items[1]);  // → true

const byStock = Map.groupBy(items, (item) => (item.qty > 5 ? 'ok' : 'restock'));
console.log([...byStock.keys()]);           // → [ 'restock', 'ok' ]
console.log(byStock.get('ok').length);      // → 1

console.log(Object.groupBy([1.5, 2.5, 1.2], Math.floor));
// → [Object: null prototype] { '1': [ 1.5, 1.2 ], '2': [ 2.5 ] }
console.log(Map.groupBy([1, 2], () => NaN));
// → Map(1) { NaN => [ 1, 2 ] }
console.log(Object.groupBy('abca', (char) => char));
// → [Object: null prototype] { a: [ 'a', 'a' ], b: [ 'b' ], c: [ 'c' ] }
```

## Pitfalls

- Using `Object.groupBy` with object keys. They are coerced with `ToPropertyKey`, so every object becomes `"[object Object]"` (unless it defines `toString`) and groups merge. Use `Map.groupBy`.
- Calling `result.hasOwnProperty(...)` or `result.toString()` on the result. It has no prototype, so both throw a `TypeError`.
- Forgetting that integer-like keys sort first. `Object.keys(Object.groupBy(['b', '10', '2'], (x) => x))` is `['2', '10', 'b']`, not first-seen order.
- Passing a non-iterable (a plain object, `null`). It throws a `TypeError`; use `Object.values` or `Object.entries` first.

## Follow-ups

**Q:** What did you write before `groupBy`?
**A:** A `reduce` (or loop) that created the group array when missing, with `acc[key] ??= []`, and pushed. The same create-if-missing step on a `Map` is what `getOrInsert` simplifies.

**Q:** Is the callback's second argument the index in the source?
**A:** It is a running counter `k` over the iteration, `0, 1, 2…`, so for a `Set` or string it counts elements, and sparse array holes count as `undefined` elements.

**Q:** How do I count items per group instead?
**A:** Group, then map the sizes: `Object.entries(groups).map(([key, list]) => [key, list.length])`.

## Exercises

### Predict the output

```js
const groups = Object.groupBy([1, 2, 3, 4, 5], (n) => (n % 2 ? 'odd' : 'even'));
console.log(Object.keys(groups), groups.odd.length);
console.log(Map.groupBy([0, -0, NaN], (n) => n).size);
```

**Answer:** `[ 'odd', 'even' ] 3`, then `2`. Keys appear in first-seen order because they are not integer-like. In the `Map`, `0` and `-0` share one key and `NaN` is another.
