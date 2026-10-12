---
title: "What does `Map.prototype.getOrInsert` solve?"
status: draft
difficulty: easy
frequency: 1
core: false
tags: [map, weakmap, upsert, get-or-insert, get-or-insert-computed, default-value]
related:
  - javascript/keyed-collections/map-vs-object
  - javascript/keyed-collections/groupby
verified: 2026-10
sources:
  - https://github.com/tc39/proposal-upsert
  - https://tc39.es/ecma262/#sec-map.prototype.getorinsert
  - https://tc39.es/ecma262/#sec-map.prototype.getorinsertcomputed
  - https://tc39.es/ecma262/#sec-weakmap.prototype.getorinsert
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/getOrInsert
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/getOrInsertComputed
tldr: >
  `map.getOrInsert(key, value)` returns the existing value, or inserts `value` and returns it, replacing
  the `has` / `get` / `set` dance and its repeated lookups. `getOrInsertComputed(key, callback)` calls
  `callback(key)` only when the key is missing, for expensive or fresh defaults like `[]`. Both exist on
  `WeakMap`. Node 24 lacks them, so keep a fallback.
---

## Answer

The recurring pattern "read a key, create a default if missing, then use it" takes three calls and looks the key up up to three times:

```js
if (!map.has(key)) map.set(key, []);
map.get(key).push(value);
```

The "upsert" methods do it in one call that returns the value:

- **`map.getOrInsert(key, value)`** returns the existing value if the key is present; otherwise it stores `value` and returns it.
- **`map.getOrInsertComputed(key, callback)`** does the same but calls `callback(key)` only when the key is missing and stores the result. Use it when the default is a fresh object (`[]`, `new Set()`) or costly to build.

The distinction matters because arguments are evaluated first. `map.getOrInsert(key, [])` allocates a new array on every call, even when the key exists and the array is thrown away; `getOrInsertComputed(key, () => [])` allocates only on a miss.

Details from the spec:

- Keys are compared like `Map.prototype.set` does, with `-0` canonicalised to `+0`.
- `getOrInsertComputed` throws a `TypeError` if `callback` is not callable. If `callback` itself adds that key to the map, the spec's re-check overwrites the entry with the callback's return value.
- `WeakMap` has both methods, with the same `CanBeHeldWeakly` key rule as `set`.

**Availability (checked, not assumed).** The TC39 upsert proposal is at Stage 4, and `getOrInsert` / `getOrInsertComputed` are in the living ECMAScript specification. MDN lists them as Baseline 2026 (newly available since February 2026). In this repo's runs, Node 24.19 does **not** have them (`typeof` is `undefined`) and Node 26.7 does. So feature-detect, or use a small helper for older runtimes, as below. Which numbered ECMAScript edition first includes them is ❓ not verified here.

## Example

```js
// Native where available (it was in Node 26.7), the same logic over has/get/set otherwise.
const getOrInsertComputed = (map, key, callback) => {
  if (typeof map.getOrInsertComputed === 'function') return map.getOrInsertComputed(key, callback);
  if (map.has(key)) return map.get(key);
  const value = callback(key);
  map.set(key, value);
  return value;
};

const groups = new Map();
for (const word of ['apple', 'avocado', 'banana']) {
  getOrInsertComputed(groups, word[0], () => []).push(word);
}
console.log(groups);
// → Map(2) { 'a' => [ 'apple', 'avocado' ], 'b' => [ 'banana' ] }

let created = 0;
const makeList = (key) => { created++; return [key]; };
getOrInsertComputed(groups, 'a', makeList); // key exists: callback not called
getOrInsertComputed(groups, 'c', makeList); // key missing: called once
console.log(created); // → 1
```

## Pitfalls

- Calling `getOrInsert(key, expensive())`. The argument runs every time; use `getOrInsertComputed(key, expensive)`.
- Shipping `map.getOrInsert` unguarded. It throws `TypeError: map.getOrInsert is not a function` on Node 24 and older browsers.
- Expecting `getOrInsert` to update an existing value. It never overwrites a present key; use `set` for that.
- Using `getOrInsert(key, value)` with a stored `undefined` expecting a replacement. A key that is present with value `undefined` counts as present and returns `undefined`.

## Follow-ups

**Q:** Why not `map.get(key) ?? map.set(key, d).get(key)`?
**A:** It treats a stored `null` or `undefined` as missing, so it overwrites them. `has` or the upsert methods check for key presence, which is what you mean.

**Q:** Does the callback receive the key?
**A:** Yes: `callback(key)`. It is called with `undefined` as `this`.

**Q:** What replaces `Object.groupBy`-style grouping loops?
**A:** `Map.groupBy` when you only need grouping. Use `getOrInsertComputed` when you build groups incrementally, such as across several passes.

## Exercises

### Predict the output

```js
const map = new Map([['a', 1]]);
let calls = 0;
const makeDefault = () => { calls++; return 0; };
// Node 26+, or after adding a fallback:
map.getOrInsert('a', makeDefault());
map.getOrInsertComputed('a', makeDefault);
map.getOrInsertComputed('b', makeDefault);
console.log(calls, map.get('b'));
```

**Answer:** `2 0`. The first line calls `makeDefault()` while building the argument (call 1) even though `'a'` exists. The second finds `'a'` and skips the callback. The third inserts `'b'` and calls the callback once more (call 2).
