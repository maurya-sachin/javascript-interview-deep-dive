---
title: "`Object.freeze` vs `seal` vs `preventExtensions`?"
status: draft
difficulty: easy
frequency: 4
core: false
tags: [objects, freeze, seal, prevent-extensions, immutability]
related:
  - javascript/objects-and-properties/property-descriptors
  - javascript/objects-and-properties/shallow-vs-deep-copy
  - javascript/how-javascript-runs/strict-mode
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-setintegritylevel
  - https://tc39.es/ecma262/#sec-testintegritylevel
  - https://tc39.es/ecma262/#sec-object.freeze
  - https://tc39.es/ecma262/#sec-object.seal
  - https://tc39.es/ecma262/#sec-object.preventextensions
  - https://tc39.es/ecma262/#sec-typedarray-defineownproperty
  - https://tc39.es/ecma262/#sec-array.prototype.push
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/seal
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/preventExtensions
tldr: >
  They are three increasing integrity levels. `preventExtensions` blocks adding properties.
  `seal` also makes every property non-configurable (no delete, no redefine). `freeze` also
  makes data properties read-only. All three are shallow, and violations throw in strict code
  but fail silently in sloppy code.
---

## Answer

| Level | Add | Delete | Change value | Redefine attributes |
|---|---|---|---|---|
| `Object.preventExtensions(o)` | no | yes | yes | yes |
| `Object.seal(o)` | no | no | yes | only `writable` → `false` |
| `Object.freeze(o)` | no | no | no | no |

Each level includes the one before it:

- **`preventExtensions`** sets the object's `[[Extensible]]` to `false`. Existing properties are untouched; the prototype can't be replaced either.
- **`seal`** does that, then defines every own property (strings and symbols) as `configurable: false`.
- **`freeze`** does that, then also sets `writable: false` on every own **data** property. Accessor properties keep working: the getter and setter still run, and only the property's configuration is locked.

`Object.isExtensible`, `isSealed` and `isFrozen` test the levels. An empty non-extensible object counts as both sealed and frozen.

**Shallow.** Only the object's own properties change. Nested objects, arrays inside it, and the internal data of a `Map`, `Set` or `Date` stay mutable. Typed arrays with elements can't be frozen at all (`TypeError`).

**Irreversible.** There is no unfreeze; you copy instead.

**Failure mode.** A rejected operation throws a `TypeError` in strict code (modules and classes) and silently does nothing in sloppy code. `Object.freeze` itself returns its argument, and primitives are returned unchanged.

Use `freeze` for constant tables and config; use `seal` for a fixed shape whose values still change; use `preventExtensions` rarely.

## Example

```js
const levels = { preventExtensions: Object.preventExtensions, seal: Object.seal, freeze: Object.freeze };
const attempts = {
  add: (o) => { o.extra = 1; },
  change: (o) => { o.a = 2; },
  delete: (o) => { delete o.a; },
  nested: (o) => { o.inner.n = 2; },
};

for (const [level, apply] of Object.entries(levels)) {
  const result = {};
  for (const [name, attempt] of Object.entries(attempts)) {
    const o = apply({ a: 1, inner: { n: 1 } }); // fresh object per attempt
    try {
      attempt(o);
      result[name] = 'ok';
    } catch {
      result[name] = 'TypeError';
    }
  }
  console.log(level, JSON.stringify(result));
}
// → preventExtensions {"add":"TypeError","change":"ok","delete":"ok","nested":"ok"}
// → seal {"add":"TypeError","change":"ok","delete":"TypeError","nested":"ok"}
// → freeze {"add":"TypeError","change":"TypeError","delete":"TypeError","nested":"ok"}
```

## Pitfalls

- Assuming `freeze` is deep. `config.db.host = 'b'` still works on a frozen `config`.
- Relying on it in sloppy code, where writes are silently dropped and the bug goes unnoticed.
- Freezing a `Map` or `Set` and expecting it to be read-only. `set`, `add` and `delete` work on internal slots, not properties.
- Expecting a frozen object's accessors to be inert. A frozen accessor property still runs its getter and setter; only its configuration is locked.

## Follow-ups

**Q:** Does a frozen object's prototype chain freeze too?
**A:** No. Only the object itself is locked, and its `[[Prototype]]` can't be replaced because it's non-extensible. Properties on the prototype object can still change, and inherited ones are read through as usual.

**Q:** `Object.freeze` or `const`?
**A:** Different layers. `const` stops re-binding the variable; `freeze` stops changing the object's properties. Use both for a true constant object.

**Q:** What happens when you `push` onto a frozen array?
**A:** It throws a `TypeError`: `push` writes with `Set(O, P, V, true)`, which throws on failure even in sloppy code (Node 24's message: "Cannot add property 2, object is not extensible"). A plain `arr[2] = 3` would be silent there.

## Exercises

### Write `deepFreeze`

```js
function deepFreeze(value) {
  if (typeof value !== 'object' || value === null || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const key of Reflect.ownKeys(value)) deepFreeze(value[key]);
  return value;
}
const config = deepFreeze({ db: { host: 'a' }, list: [{ id: 1 }] });
try {
  config.list[0].id = 2;
} catch (error) {
  console.log(error.name); // → TypeError
}
```

**Answer:** Freeze first, then recurse, so a cycle stops at the `isFrozen` check. Reading `value[key]` runs getters, and `Map`/`Set` contents stay mutable, so deep freezing suits plain data only.
