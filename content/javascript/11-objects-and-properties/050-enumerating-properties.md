---
title: "How do you list an object's properties?"
status: draft
difficulty: easy
frequency: 3
core: false
tags: [objects, for-in, object-keys, enumerable, own-properties]
related:
  - javascript/objects-and-properties/property-keys-and-order
  - javascript/objects-and-properties/property-descriptors
  - javascript/prototypes/prototype-chain
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-enumerableownproperties
  - https://tc39.es/ecma262/#sec-enumerate-object-properties
  - https://tc39.es/ecma262/#sec-object.keys
  - https://tc39.es/ecma262/#sec-object.getownpropertynames
  - https://tc39.es/ecma262/#sec-object.hasown
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Enumerability_and_ownership_of_properties
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in
tldr: >
  Two questions decide the method: own or inherited, and enumerable or not. `Object.keys`,
  `values` and `entries` return own enumerable string keys; `for…in` adds inherited enumerable
  strings; `getOwnPropertyNames` includes non-enumerable strings; `Reflect.ownKeys` returns
  every own key, symbols included. Check ownership with `Object.hasOwn`.
---

## Answer

| API | Own | Inherited | Non-enumerable | Symbols |
|---|---|---|---|---|
| `for (k in o)` | yes | yes (enumerable) | no | no |
| `Object.keys` / `values` / `entries` | yes | no | no | no |
| `Object.getOwnPropertyNames` | yes | no | yes | no |
| `Object.getOwnPropertySymbols` | yes | no | yes | symbols only |
| `Reflect.ownKeys` | yes | no | yes | yes |

All own-key variants use the order from the previous question (indices, strings, symbols), and `Object.keys`, `values` and `entries` are defined by `EnumerableOwnProperties`: take `[[OwnPropertyKeys]]`, keep the string keys whose `[[Enumerable]]` is true, and call `Get` for values.

**`for…in`** walks the prototype chain. It never repeats a name, and a name on the object **shadows** the same name higher up even when the own property is non-enumerable. Deleted properties that haven't been visited are skipped; properties added during the loop aren't guaranteed to be visited. Array keys arrive as strings, and anything added to `Array.prototype` appears.

**Ownership check.** Use `Object.hasOwn(obj, key)` rather than `obj.hasOwnProperty(key)`: it works on `Object.create(null)` objects and objects that define their own `hasOwnProperty`. `'k' in obj` also searches the prototype chain, and `propertyIsEnumerable` tests own and enumerable at once.

**Primitives.** `Object.keys('ab')` coerces with `ToObject` and returns `['0', '1']`; `null` and `undefined` throw a `TypeError`, while `for…in` over them simply does nothing.

Prefer `Object.keys`/`entries` for data, `for…of` over `Object.entries(o)` for loops, and `for…in` only when you want inherited keys.

## Example

```js
const secret = Symbol('secret');
const proto = { inherited: 1 };
const obj = Object.create(proto, {
  hidden: { value: 2, enumerable: false },
});
obj.own = 3;
obj[secret] = 4;

const forIn = [];
for (const key in obj) forIn.push(key);

console.log(forIn); // → [ 'own', 'inherited' ]
console.log(Object.keys(obj)); // → [ 'own' ]
console.log(Object.values(obj), Object.entries(obj)); // → [ 3 ] [ [ 'own', 3 ] ]
console.log(Object.getOwnPropertyNames(obj)); // → [ 'hidden', 'own' ]
console.log(Object.getOwnPropertySymbols(obj)); // → [ Symbol(secret) ]
console.log(Reflect.ownKeys(obj)); // → [ 'hidden', 'own', Symbol(secret) ]

console.log(Object.hasOwn(obj, 'inherited'), 'inherited' in obj); // → false true
console.log(Object.hasOwn(obj, 'hidden'), obj.propertyIsEnumerable('hidden')); // → true false
```

## Pitfalls

- Using `for…in` on arrays. It yields string indices, plus extra own properties and anything on `Array.prototype`; use `for…of` or `forEach`.
- Calling `obj.hasOwnProperty(key)` on user-controlled data. A key named `hasOwnProperty` or a `null`-prototype object breaks it (`TypeError`); use `Object.hasOwn`.
- Expecting `Object.keys` to include symbols or non-enumerable keys. Class methods and array `length` are non-enumerable, so they don't appear.
- Mutating while looping. Deleting is safe (the property is skipped), but whether added keys are visited is unspecified.

## Follow-ups

**Q:** Why does `for…in` skip a prototype's enumerable key when the object has a non-enumerable one of the same name?
**A:** The spec tracks visited names regardless of `[[Enumerable]]`, so an own non-enumerable property shadows the inherited one: `Object.create({ x: 1 }, { x: { value: 2 } })` yields no `x`.

**Q:** How do you get own and inherited keys together without `for…in`?
**A:** Walk `Object.getPrototypeOf` in a loop and collect `Object.keys` of each object, de-duplicating names. To match `for…in` exactly, also record non-enumerable names from `getOwnPropertyNames` so they shadow.

## Exercises

### Predict the output

```js
class Point {
  constructor() {
    this.x = 1;
  }
  move() {}
}
const p = new Point();
p.y = 2;
const keys = [];
for (const key in p) keys.push(key);
console.log(keys, Object.getOwnPropertyNames(Point.prototype));
```

**Answer:** `[ 'x', 'y' ] [ 'constructor', 'move' ]`. Class methods are non-enumerable, so `for…in` skips them. `getOwnPropertyNames` on the prototype lists them.
