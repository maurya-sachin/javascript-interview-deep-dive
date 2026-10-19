---
title: "What can be a property key, and in what order are keys listed?"
status: draft
difficulty: medium
frequency: 2
core: false
tags: [objects, property-keys, symbols, property-order]
related:
  - javascript/values-and-types/symbols
  - javascript/keyed-collections/map-vs-object
  - javascript/objects-and-properties/enumerating-properties
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-object-type
  - https://tc39.es/ecma262/#sec-topropertykey
  - https://tc39.es/ecma262/#sec-ordinaryownpropertykeys
  - https://tc39.es/ecma262/#array-index
  - https://tc39.es/ecma262/#sec-object.keys
  - https://tc39.es/ecma262/#sec-enumerate-object-properties
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects#objects_and_properties
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
tldr: >
  A property key is a String or a Symbol, nothing else. Any other value is converted with
  `ToPropertyKey`, so `obj[1]` and `obj['1']` are the same property and `obj[{}]` is
  `'[object Object]'`. Own keys are listed array indices ascending, then other strings in
  creation order, then symbols in creation order.
---

## Answer

**What can be a key.** The spec defines a property key as a String or a Symbol. Every other value used in `obj[expr]` or as a computed key goes through `ToPropertyKey`: `ToPrimitive` with string preference, then `ToString` unless the result is a Symbol. So:

- Numbers become strings: `obj[1]`, `obj['1']` and `obj[1.0]` are one property; `-0` becomes `'0'`.
- Objects become whatever their `toString` returns, usually `'[object Object]'`, so two different object keys collide.
- A Symbol is kept as is, and is unique. `Symbol('a') !== Symbol('a')`. `Symbol.for('a')` is shared through the global registry.
- Symbol keys are skipped by `for…in`, `Object.keys`, `Object.entries` and `JSON.stringify`; `Object.getOwnPropertySymbols` and `Reflect.ownKeys` see them.

**Order.** `OrdinaryOwnPropertyKeys` lists an ordinary object's own keys in three groups:

1. Array indices (canonical numeric strings from `'0'` to `'4294967294'`) in ascending numeric order.
2. Other strings in the order the properties were created.
3. Symbols in the order they were created.

`Reflect.ownKeys`, `Object.keys`, `Object.values`, `Object.entries`, `Object.assign`, spread and `JSON.stringify` all follow it, because they all start from `[[OwnPropertyKeys]]`. `'01'`, `'-1'` and `'1.5'` are not array indices, so they sort by creation. Deleting and re-adding a string or symbol key moves it to the end of its group; an array index goes back to its numeric place.

When you need arbitrary keys of any type, or insertion order that ignores integer-looking keys, use a `Map`.

## Example

```js
const id = Symbol('id');
const user = { name: 'Ada', 2: 'b', [id]: 7, age: 36, 1: 'a', '01': 'c' };
user.role = 'admin';

console.log(Reflect.ownKeys(user)); // → [ '1', '2', 'name', 'age', '01', 'role', Symbol(id) ]
console.log(Object.keys(user)); // → [ '1', '2', 'name', 'age', '01', 'role' ]
console.log(JSON.stringify(user)); // → {"1":"a","2":"b","name":"Ada","age":36,"01":"c","role":"admin"}

const bag = {};
bag[1] = 'number';
bag['1'] = 'string';
bag[{}] = 'object';
console.log(bag); // → { '1': 'string', '[object Object]': 'object' }
```

## Pitfalls

- Using an object as a key and expecting identity. All plain objects stringify to `'[object Object]'` and overwrite each other; use a `Map` or `WeakMap`.
- Relying on insertion order for integer-like keys such as IDs. `{ b: 1, 10: 1, 9: 1 }` lists `'9'`, `'10'`, then `'b'`.
- Expecting symbols to be hidden. They are skipped by the common enumeration helpers but are not private; `Reflect.ownKeys` and `Object.getOwnPropertySymbols` list them.
- Assuming a literal `{ __proto__: x }` creates a key. It sets the prototype; `{ ['__proto__']: x }` and `JSON.parse('{"__proto__":1}')` create an own property.

## Follow-ups

**Q:** Is the order guaranteed for `for…in` too?
**A:** Mostly. `EnumerateObjectProperties` must match `CreateForInIterator` (own string keys in this order, then the prototype chain) unless the chain holds a Proxy, TypedArray, module namespace or host object, or mid-loop a prototype changes, a property is deleted or enumerability changes, or a prototype gains a property.

**Q:** What about `4294967295` and larger integers?
**A:** Array indices stop at `2**32 - 2`. In Node 24, `Object.keys({ 4294967295: 1, z: 1, 5: 1 })` gives `['5', '4294967295', 'z']`: the larger number is an ordinary string and sorts by creation.

**Q:** Does a `Map` have these rules?
**A:** No. A `Map` keeps pure insertion order and uses SameValueZero, so `1` and `'1'` are different keys and any value can be a key.

## Exercises

### Predict the key list

```js
const o = { b: 1, 3: 1, a: 1, 1: 1 };
delete o.b;
o.b = 1;
console.log(Object.keys(o).join());
```

**Answer:** `1,3,a,b`. Indices come first in ascending order. `b` was deleted and re-added, so it moves after `a`.
