---
title: "What are property descriptors?"
status: draft
difficulty: medium
frequency: 3
core: true
tags: [objects, property-descriptors, defineproperty, writable, enumerable, configurable]
related:
  - javascript/objects-and-properties/property-keys-and-order
  - javascript/objects-and-properties/freeze-seal-preventextensions
  - javascript/objects-and-properties/getters-and-setters
  - javascript/objects-and-properties/enumerating-properties
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-property-attributes
  - https://tc39.es/ecma262/#sec-object.defineproperty
  - https://tc39.es/ecma262/#sec-topropertydescriptor
  - https://tc39.es/ecma262/#sec-validateandapplypropertydescriptor
  - https://tc39.es/ecma262/#sec-ordinarysetwithowndescriptor
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertyDescriptors
tldr: >
  Every own property carries attributes. A data property has `value` and `writable`; an
  accessor has `get` and `set`. Both have `enumerable` and `configurable`. Properties made
  by assignment or literals default all flags to `true`; `Object.defineProperty` defaults
  missing flags to `false`. A non-configurable property can't be deleted or have its shape
  changed.
---

## Answer

A **property descriptor** is the record of a property's attributes. There are two kinds, and a descriptor can't mix them:

| Kind | Fields |
|---|---|
| Data property | `value`, `writable` |
| Accessor property | `get`, `set` |
| Both kinds | `enumerable`, `configurable` |

- `writable: false` makes assignment fail (a silent no-op in sloppy mode, a `TypeError` in strict and module code).
- `enumerable: false` hides the key from `for…in`, `Object.keys`, `Object.entries`, spread, `Object.assign` and `JSON.stringify`. It still shows up in `Object.getOwnPropertyNames`.
- `configurable: false` forbids `delete` and most redefinition (see the deep dive).

**Defaults differ by how the property is created.** Literals, assignment and `class` fields give `{ writable: true, enumerable: true, configurable: true }`. `Object.defineProperty` creates a missing property with every omitted flag `false`, and `value` or `get`/`set` set to `undefined`. When the property already exists, omitted fields are left as they are.

**The API:**

- `Object.defineProperty(obj, key, descriptor)` and `Object.defineProperties(obj, descriptors)` create or change properties.
- `Object.getOwnPropertyDescriptor(obj, key)` and `Object.getOwnPropertyDescriptors(obj)` read them. Both return fresh plain objects, not live views.

Built-ins use attributes heavily: array `length` is non-enumerable and non-configurable, and class methods are non-enumerable. Integrity levels (`freeze`, `seal`) are bulk descriptor changes.

## Example

```js
const point = { x: 1 };
Object.defineProperty(point, 'y', { value: 2 });

console.log(Object.getOwnPropertyDescriptor(point, 'x'));
// → { value: 1, writable: true, enumerable: true, configurable: true }
console.log(Object.getOwnPropertyDescriptor(point, 'y'));
// → { value: 2, writable: false, enumerable: false, configurable: false }

try {
  // Module code is strict: a failed assignment throws.
  point.y = 99;
} catch (error) {
  console.log(error.name); // → TypeError
}
console.log(Object.keys(point), point.y); // → [ 'x' ] 2
console.log(JSON.stringify(point)); // → {"x":1}

try {
  Object.defineProperty(point, 'y', { enumerable: true });
} catch (error) {
  console.log(error.message); // → Cannot redefine property: y
}
```

## Pitfalls

- Forgetting the `defineProperty` defaults. `defineProperty(o, 'k', { value: 1 })` creates a read-only, hidden, permanent property, unlike `o.k = 1`.
- Expecting `writable: false` to fail loudly everywhere. Sloppy-mode code ignores the assignment silently.
- Mixing `get`/`set` with `value`/`writable` in one descriptor. That throws a `TypeError`.
- Copying with spread or `Object.assign` and expecting attributes to survive. They create plain data properties, so getters run once and flags reset.

## Follow-ups

**Q:** What does `Object.defineProperty(o, 'k', {})` do?
**A:** On a missing key it creates `k` as `undefined`, non-writable, non-enumerable, non-configurable. On an existing key it changes nothing.

**Q:** Does a read-only property on the prototype stop assignment on the child?
**A:** Yes. `[[Set]]` finds the inherited non-writable data property and fails instead of creating an own property. Use `defineProperty` on the child to shadow it.

**Q:** How do you copy an object with its getters and attributes intact?
**A:** `Object.defineProperties({}, Object.getOwnPropertyDescriptors(src))`. Add `Object.create(Object.getPrototypeOf(src), …)` to keep the prototype.

## Deep dive

### How it works

The spec stores attributes as internal slots on each property: `[[Value]]` and `[[Writable]]` for data properties, `[[Get]]` and `[[Set]]` for accessors, plus `[[Enumerable]]` and `[[Configurable]]` for both. A *Property Descriptor* is the specification type that carries a subset of those fields, and `Object.defineProperty` turns your plain object into one with `ToPropertyDescriptor`.

`ToPropertyDescriptor` reads each field with `HasProperty` then `Get`, so **inherited fields count**. It throws a `TypeError` if `get` or `set` is neither callable nor `undefined`, or if a getter or setter is combined with `value` or `writable`. Then `[[DefineOwnProperty]]` runs `ValidateAndApplyPropertyDescriptor` against the property's current descriptor:

- If the property doesn't exist: reject when the object isn't extensible; otherwise create it, filling absent fields with the defaults (`undefined` and `false`).
- If it exists and is configurable: apply any change, even turning a data property into an accessor.
- If it exists and is **non-configurable**: reject `configurable: true`, any change of `enumerable`, and any switch between data and accessor. For an accessor, `get` and `set` must be the same functions. For a data property that isn't writable, reject `writable: true` and any `value` that isn't `SameValue` to the current one. A writable data property may still change its `value` and may go from `writable: true` to `false`, but never back.

Assignment uses the same data. `OrdinarySetWithOwnDescriptor` returns `false` when the found data property is non-writable, and the caller throws in strict code. It also looks at the *prototype chain* first, which is why an inherited read-only property blocks the write instead of being shadowed.

### Edge cases

```js
const o = {};
Object.defineProperty(o, 'v', { value: 1, writable: true });
o.v = 2; // allowed: still writable
Object.defineProperty(o, 'v', { writable: false }); // allowed: true → false
console.log(Object.getOwnPropertyDescriptor(o, 'v'));
// → { value: 2, writable: false, enumerable: false, configurable: false }

for (const attrs of [{ writable: true }, { value: 3 }, { value: 2 }]) {
  try {
    Object.defineProperty(o, 'v', attrs);
    console.log('ok', Object.keys(attrs));
  } catch {
    console.log('rejected', Object.keys(attrs));
  }
}
// → rejected [ 'writable' ]
// → rejected [ 'value' ]
// → ok [ 'value' ]

const inheritedFields = Object.create({ writable: true });
inheritedFields.value = 1;
const t = Object.defineProperty({}, 'p', inheritedFields);
console.log(Object.getOwnPropertyDescriptor(t, 'p'));
// → { value: 1, writable: true, enumerable: false, configurable: false }
```

Re-defining a non-configurable property with the same value is a successful no-op, which is why `{ value: 2 }` passes. The last case shows `writable: true` coming from the descriptor object's prototype. Pass literal descriptors, not objects with a prototype chain.

### Real-world scenario

Library code uses descriptors to make internals harder to touch. A module can expose a version constant that can't be overwritten or listed, and a `class` is already doing this for its methods:

```js
const api = { fetchUser() {} };
Object.defineProperty(api, 'VERSION', { value: '2.1.0', enumerable: true });
console.log(Object.entries(api).length); // → 2
console.log(Object.getOwnPropertyDescriptor(api, 'VERSION').writable); // → false

class Account {
  deposit() {}
}
console.log(Object.keys(Account.prototype)); // → []
```

The next two questions build on this: `Object.freeze` applies descriptor changes to every property, and getters/setters are the accessor half of the table above.

### Trade-offs

Non-configurable properties are a one-way door: nothing, including your own code, can undo them, which makes tests and monkey-patching harder. Prefer `writable: false` with `configurable: true` when you want to forbid accidental writes but keep the option to redefine.
