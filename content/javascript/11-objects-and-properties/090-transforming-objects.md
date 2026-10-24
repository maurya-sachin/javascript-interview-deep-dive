---
title: "How do you map or filter an object's properties?"
status: draft
difficulty: easy
frequency: 3
core: false
tags: [objects, object-entries, object-fromentries, transformation, immutability]
related:
  - javascript/objects-and-properties/enumerating-properties
  - javascript/objects-and-properties/shallow-vs-deep-copy
  - javascript/objects-and-properties/property-keys-and-order
  - javascript/keyed-collections/groupby
  - javascript/keyed-collections/map-vs-object
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-object.entries
  - https://tc39.es/ecma262/#sec-enumerableownproperties
  - https://tc39.es/ecma262/#sec-object.fromentries
  - https://tc39.es/ecma262/#sec-createdatapropertyorthrow
  - https://github.com/tc39/proposals/blob/main/finished-proposals.md
tldr: >
  Convert to entries, use array methods, convert back:
  `Object.fromEntries(Object.entries(obj).map(...))`. `entries` returns own enumerable string-keyed
  properties, calling getters; `fromEntries` (ES2019) builds a plain object from any iterable of
  `[key, value]` pairs. Symbol keys, non-enumerable properties, accessors and the prototype don't
  survive the round trip.
---

## Answer

Objects have no `map` or `filter`, so the idiom is a round trip through arrays: `Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, fn(value)]))`.

`Object.entries` (ES2017) returns `[key, value]` arrays for the object's **own, enumerable, string-keyed** properties, in property order (integer-like keys ascending, then other strings in creation order). Its value comes from `Get`, so getters run. Between the two calls you have an array, so `map` changes values or keys, `filter` drops entries, and `sort` reorders them (though integer-like keys always come first again in the result).

`Object.fromEntries` (ES2019) takes **any iterable** of pairs — an array, a `Map`, a generator — and for each one runs `ToPropertyKey` on the key and `CreateDataPropertyOrThrow` on a new plain object. Later duplicates overwrite earlier ones. Because it defines properties rather than assigning them, a `'__proto__'` key becomes an ordinary own property instead of changing the prototype.

What the round trip drops: Symbol keys, non-enumerable properties, accessor-ness (a getter's current value is copied as data), property attributes, and the prototype — a class instance comes back as a plain object. It's also shallow: nested objects are shared.

Alternatives have trade-offs. A `for…in` loop with `Object.hasOwn` avoids the intermediate arrays but is more code. `reduce` with `{ ...acc, [key]: value }` looks neat but copies the accumulator on every step, which is O(n²) for n keys; mutate one accumulator instead if you use `reduce`. For keys that aren't strings, or frequent additions and removals, convert to a `Map`: `new Map(Object.entries(obj))`.

## Example

```js
const prices = { apple: 1.2, bread: 2.5, caviar: 90 };

const mapValues = (obj, fn) =>
  Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, fn(value, key)]));
const pickBy = (obj, test) =>
  Object.fromEntries(Object.entries(obj).filter(([key, value]) => test(value, key)));

console.log(mapValues(prices, (p) => p * 2)); // → { apple: 2.4, bread: 5, caviar: 180 }
console.log(pickBy(prices, (p) => p < 10));   // → { apple: 1.2, bread: 2.5 }

// What doesn't survive the round trip
let reads = 0;
const source = { name: 'Ada', get age() { reads++; return 36; }, [Symbol('id')]: 7 };
Object.defineProperty(source, 'secret', { value: 'x', enumerable: false });
const copy = Object.fromEntries(Object.entries(source));
console.log(copy, reads); // → { name: 'Ada', age: 36 } 1
console.log(Object.getOwnPropertyDescriptor(copy, 'age').get); // → undefined

// Any iterable of pairs works, and keys are defined, not assigned
console.log(Object.fromEntries(new Map([['a', 1], ['b', 2]]))); // → { a: 1, b: 2 }
const parsed = Object.fromEntries([['__proto__', { admin: true }]]);
console.log(Object.hasOwn(parsed, '__proto__'), parsed.admin); // → true undefined
```

## Pitfalls

- Expecting Symbol keys or non-enumerable properties to carry over. Use `Reflect.ownKeys` with `Object.getOwnPropertyDescriptor` if you need them.
- Transforming a class instance and expecting its methods back. The result is a plain object with `Object.prototype`.
- Building objects with `reduce` and spread in a loop over many keys. Each step copies everything so far.
- Sorting entries and expecting integer-like keys to follow that order. Property order puts them first, ascending, whatever order you insert them.

## Follow-ups

**Q:** How do you swap keys and values?
**A:** `Object.fromEntries(Object.entries(obj).map(([k, v]) => [v, k]))`. Values become keys through `ToPropertyKey`, so they're stringified, and duplicate values collapse: the last key wins. Use a `Map` if values aren't unique strings.

**Q:** How do you group entries instead of mapping them?
**A:** Use `Object.groupBy(items, callback)` or `Map.groupBy`. `Object.groupBy` returns a null-prototype object of arrays, which you can then transform with the same entries round trip.

**Q:** Does `Object.entries` see properties added by a getter during iteration?
**A:** No. It takes the own key list first. For each string key it re-checks the property's descriptor before reading, so a property deleted or made non-enumerable by an earlier getter is skipped, but keys added during the walk aren't seen.

## Exercises

### Predict the output

```js
const roles = { ada: 1, grace: 2, alan: 1 };
console.log(Object.fromEntries(Object.entries(roles).map(([name, id]) => [id, name])));
```

**Answer:** `{ '1': 'alan', '2': 'grace' }`. The ids become string keys, and `ada` and `alan` share key `'1'`, so the later entry, `alan`, overwrites `ada`. Integer-like keys are listed in ascending order.
