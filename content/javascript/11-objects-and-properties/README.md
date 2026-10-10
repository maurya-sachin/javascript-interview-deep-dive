# 11 — Objects and properties

> **Status:** 🔴 planned · **Published:** 0/7 · **Last verified:** —

The property model — keys, attributes, accessors, integrity levels — and copying and comparing objects.

## Learning goals

After this chapter you can:

- Explain data vs accessor properties and their attributes
- Choose the right integrity level for an object
- Copy objects without shared-reference bugs
- Implement deep clone and deep equal with cycle handling

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- String and Symbol keys, key coercion, integer-index ordering → 010
- Data vs accessor properties; `writable`, `enumerable`, `configurable` → 020
- `Object.defineProperty`, `Object.getOwnPropertyDescriptors` → 020
- Integrity levels: `preventExtensions`, `seal`, `freeze`; freezing is shallow → 030
- Getters and setters in object literals → 040
- `for…in`, `Object.keys`/`values`/`entries`, `Object.hasOwn`, `Reflect.ownKeys` → 050
- Spread vs `Object.assign` (setters, own enumerable only); `structuredClone` limits → 060
- Deep clone and deep equal implementations; cycles → 060, 070
- Computed keys, shorthand properties, method syntax → —
- `Object.fromEntries` and transforming objects → —

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [What can be a property key, and in what order are keys listed?](010-property-keys-and-order.md) | medium | 🔴 planned |
| 020 | [What are property descriptors?](020-property-descriptors.md) | medium | 🔴 planned |
| 030 | [`Object.freeze` vs `seal` vs `preventExtensions`?](030-freeze-seal-preventextensions.md) | easy | 🔴 planned |
| 040 | [How do getters and setters work?](040-getters-and-setters.md) | easy | 🔴 planned |
| 050 | [How do you list an object's properties?](050-enumerating-properties.md) | easy | 🔴 planned |
| 060 | [Shallow vs deep copy — spread, `Object.assign`, or `structuredClone`?](060-shallow-vs-deep-copy.md) | medium | 🔴 planned |
| 070 | [How do you compare two objects for equality?](070-deep-equality.md) | medium | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- **Spec:** [Object type and property attributes](https://tc39.es/ecma262/#sec-object-type) · [OrdinaryOwnPropertyKeys](https://tc39.es/ecma262/#sec-ordinaryownpropertykeys) · [Object.defineProperty](https://tc39.es/ecma262/#sec-object.defineproperty) · [Object.freeze](https://tc39.es/ecma262/#sec-object.freeze)
- **MDN:** [Working with objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects) · [Object.defineProperty](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty) · [Object.freeze](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze) · [structuredClone](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone)
