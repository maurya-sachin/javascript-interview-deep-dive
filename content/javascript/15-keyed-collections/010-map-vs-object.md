---
title: "When do you use a `Map` instead of an object?"
status: draft
difficulty: easy
frequency: 4
core: false
tags: [map, object, dictionary, same-value-zero, key-order]
related:
  - javascript/objects-and-properties/property-keys-and-order
  - javascript/prototypes/object-create-null
  - javascript/coercion-and-equality/equality-algorithms
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-map-objects
  - https://tc39.es/ecma262/#sec-map.prototype.set
  - https://tc39.es/ecma262/#sec-canonicalizekeyedcollectionkey
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
tldr: >
  Use a `Map` when the data is a dictionary: keys of any type (compared with SameValueZero), keys that are
  unknown or user-supplied, frequent adds and removes, a real `size`, and insertion-order iteration. Use an
  object for fixed, known fields (records) and anything that must be JSON-serialised as is.
---

## Answer

Use an **object for records** (a fixed, known set of named fields) and a **`Map` for dictionaries** (a growing set of keys that you look up, add and remove).

What a `Map` gives you that an object does not:

- **Any key type.** An object key is a string or symbol, so `obj[user]` stores under `"[object Object]"`. A `Map` keeps the object itself as the key.
- **SameValueZero equality.** `NaN` is a usable key, and `-0` is normalised to `+0` on insertion. Objects are compared by identity, so two equal-looking literals are different keys.
- **No inherited keys.** `{}` already "has" `toString` and `constructor`, and a user-supplied key like `__proto__` is a hazard. A `Map` only contains what you `set`.
- **Insertion order only.** An object lists integer-like keys first in ascending order, then strings in creation order. A `Map` iterates strictly in insertion order.
- **A direct `size`**, and it is directly iterable (`for (const [k, v] of map)`), with no `Object.keys` step.
- **Add/remove performance.** The spec only requires sublinear average access for both; MDN states that `Map` is optimised for frequent additions and removals. Measure before treating that as a reason on its own.

What an object gives you: literal syntax, dot access, destructuring, native `JSON.stringify`/`parse`, and spread. `JSON.stringify(map)` gives `{}`, so convert with `[...map]` or `Object.fromEntries`.

Setting `map.foo = 1` adds an ordinary property to the `Map` object, not an entry. Always use `set`, `get`, `has` and `delete`.

## Example

```js
const user = { id: 1 };
const roles = new Map([[user, 'admin'], [NaN, 'not a number'], [0, 'zero']]);
console.log(roles.get(user));      // → admin
console.log(roles.get(NaN));       // → not a number
console.log(roles.get(-0));        // → zero
console.log(roles.get({ id: 1 })); // → undefined
console.log(roles.size);           // → 3

const obj = {};
obj[user] = 'admin';
obj[{ id: 2 }] = 'guest';          // same key as above: "[object Object]"
console.log(Object.keys(obj));     // → [ '[object Object]' ]

const scores = new Map().set('b', 2).set('a', 1).set('10', 3);
console.log([...scores.keys()]);                // → [ 'b', 'a', '10' ]
console.log(Object.keys({ b: 2, a: 1, 10: 3 })); // → [ '10', 'b', 'a' ]

console.log('toString' in {});          // → true
console.log(new Map().has('toString')); // → false

const copy = new Map(Object.entries({ a: 1, b: 2 }));
console.log(Object.fromEntries(copy));            // → { a: 1, b: 2 }
console.log(JSON.stringify(copy));                // → {}
console.log(JSON.stringify([...copy]));           // → [["a",1],["b",2]]
```

## Pitfalls

- Using `map.key = value` or `map[key]`. It silently creates a property, so `size` stays `0` and `has` is `false`.
- Expecting object keys to match by value. A `Map` key that is an object matches only the same reference, so `get({ id: 1 })` misses.
- Passing a `Map` to `JSON.stringify` and getting `{}`. Serialise entries explicitly, and rebuild with `new Map(entries)`.
- Using a plain `{}` as a lookup table for arbitrary strings. Keys such as `"constructor"` or `"__proto__"` collide with inherited members; use a `Map` (or `Object.create(null)`).

## Follow-ups

**Q:** How are `Map` keys compared?
**A:** With SameValueZero: like `===` except that `NaN` equals `NaN`. In `set`/`get`, `-0` is first turned into `+0` (`CanonicalizeKeyedCollectionKey`), so `0` and `-0` are one key.

**Q:** When is an object still the better choice?
**A:** For a fixed shape you read by name (`user.name`), for JSON round trips, and where destructuring or spread is wanted.
**Q:** Does `Map` iterate in insertion order even after an update?
**A:** Updating an existing key keeps its position. Deleting and re-adding it moves it to the end, because the spec appends a new entry.

## Exercises

### Predict the output

```js
const m = new Map([[1, 'a']]);
m.set('1', 'b').set(1, 'c');
const o = { 1: 'a' };
o['1'] = 'b';
console.log(m.size, [...m.values()], Object.keys(o).length);
```

**Answer:** `2 [ 'c', 'b' ] 1`. The `Map` keeps number `1` and string `'1'` as different keys, and the second `set(1, …)` updates the first entry in place. The object converts both keys to the string `"1"`, so there is one property.
