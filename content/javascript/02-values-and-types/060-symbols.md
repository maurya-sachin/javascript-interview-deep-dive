---
title: "What are Symbols for?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [symbols, property-keys, well-known-symbols, symbol-registry]
related:
  - javascript/values-and-types/language-types
  - javascript/values-and-types/type-checking
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-ecmascript-language-types-symbol-type
  - https://tc39.es/ecma262/#sec-symbol-description
  - https://tc39.es/ecma262/#sec-symbol.for
  - https://tc39.es/ecma262/#sec-symbol.prototype.description
  - https://tc39.es/ecma262/#sec-symbol-constructor
  - https://tc39.es/ecma262/#sec-symbol.keyfor
  - https://tc39.es/ecma262/#sec-well-known-symbols
  - https://tc39.es/ecma262/#sec-tostring
  - https://tc39.es/ecma262/#sec-object.keys
  - https://tc39.es/ecma262/#sec-enumerate-object-properties
  - https://tc39.es/ecma262/#sec-json.stringify
  - https://tc39.es/ecma262/#sec-reflect.ownkeys
  - https://tc39.es/ecma262/#sec-object.getownpropertysymbols
  - https://tc39.es/ecma262/#sec-copydataproperties
  - https://tc39.es/ecma262/#sec-object.prototype.tostring
  - https://tc39.es/ecma262/#sec-private-names
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Data_structures
tldr: >
  A Symbol is a unique, immutable primitive used as a property key. Every `Symbol()` call returns a
  new value, so symbol keys never collide with string keys or with other code's symbols. They're
  skipped by `Object.keys`, `for…in` and `JSON.stringify`, but are not private. `Symbol.for(key)`
  shares symbols through a global registry, and well-known symbols hook into language protocols.
---

## Answer

A Symbol is a primitive whose only job is to be a **unique property key**. The spec: "Each Symbol is unique and immutable", and the Symbol type is the set of non-String values that can be used as property keys. `Symbol('id') === Symbol('id')` is `false`: the description is just a label, held in an immutable `[[Description]]` slot and readable via `symbol.description`.

What that buys you:

- **Collision-free keys.** A library can add a property to an object it doesn't own without risking a clash with existing string keys or another library's symbols.
- **Hidden from the usual enumeration.** Symbol-keyed properties don't appear in `Object.keys`, `for…in` or `JSON.stringify`. They're found with `Object.getOwnPropertySymbols` or `Reflect.ownKeys`. This is **not privacy**: anyone with the object can list them. Use `#private` fields for real encapsulation.
- **Language protocols.** Well-known symbols such as `Symbol.iterator`, `Symbol.hasInstance`, `Symbol.toPrimitive` and `Symbol.toStringTag` are keys the engine looks up to customise `for…of`, `instanceof`, type conversion and `Object.prototype.toString`.

**Global registry.** `Symbol(desc)` is always a new symbol. `Symbol.for(key)` looks up `key` in a registry shared across the agent's realms and returns the existing symbol, creating one if none exists; `Symbol.keyFor(symbol)` goes the other way and returns `undefined` for a symbol that isn't registered. Use it only when separate pieces of code genuinely need the same symbol.

**Rules.** Call `Symbol()` without `new`; `new Symbol()` throws a `TypeError`. A symbol won't implicitly convert to a string (`` `${sym}` `` throws); use `String(sym)` or `sym.description`.

## Example

```js
const id = Symbol('id');
console.log(id === Symbol('id'), id.description, String(id)); // → false id Symbol(id)

const user = { name: 'Ada', [id]: 1 };
console.log(Object.keys(user), JSON.stringify(user)); // → [ 'name' ] {"name":"Ada"}
console.log(Object.getOwnPropertySymbols(user), Reflect.ownKeys(user));
// → [ Symbol(id) ] [ 'name', Symbol(id) ]
console.log({ ...user }[id]); // → 1

console.log(Symbol.for('app.id') === Symbol.for('app.id'), Symbol.keyFor(id)); // → true undefined

class Temperature {
  get [Symbol.toStringTag]() {
    return 'Temperature';
  }
}
console.log(String(new Temperature())); // → [object Temperature]

try {
  `${id}`;
} catch (error) {
  console.log(error.name); // → TypeError
}
```

## Pitfalls

- Calling symbol keys "private". They're only unlisted by default; `Object.getOwnPropertySymbols` and `Reflect.ownKeys` reveal them.
- `new Symbol()`. It throws a `TypeError` (V8 words it "Symbol is not a constructor").
- Expecting `JSON.stringify` or `for…in` to include symbol keys. They're skipped, so symbol data silently disappears when you serialise.
- Using `Symbol.for` for ordinary uniqueness. Registry symbols are shared, so two unrelated modules choosing the same key get the same symbol.

## Follow-ups

**Q:** Do spread and `Object.assign` copy symbol keys?
**A:** Yes. Both copy own enumerable properties including symbol-keyed ones (`{ ...user }[id]` is `1` in the example), while `Object.keys` and `JSON.stringify` skip them.

**Q:** What is `Symbol.iterator`?
**A:** A well-known symbol. `for…of` and spread look up that key on a value; an object with a method under it is iterable.
