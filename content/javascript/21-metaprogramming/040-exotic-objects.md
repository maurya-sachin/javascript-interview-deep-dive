---
title: "What is an exotic object?"
status: draft
difficulty: hard
frequency: 1
core: false
tags: [exotic-objects, internal-methods, array, arguments, typed-array, module-namespace, bound-function, proxy]
related:
  - javascript/metaprogramming/proxy-traps-invariants
  - javascript/arrays/sparse-arrays
  - javascript/functions/arguments-object
  - javascript/this/call-apply-bind
  - javascript/modules/es-module-loading
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots
  - https://tc39.es/ecma262/#sec-built-in-exotic-object-internal-methods-and-slots
  - https://tc39.es/ecma262/#sec-array-exotic-objects
  - https://tc39.es/ecma262/#sec-arguments-exotic-objects
  - https://tc39.es/ecma262/#sec-string-exotic-objects
  - https://tc39.es/ecma262/#sec-typedarray-exotic-objects
  - https://tc39.es/ecma262/#sec-module-namespace-exotic-objects
  - https://tc39.es/ecma262/#sec-bound-function-exotic-objects
  - https://tc39.es/ecma262/#sec-immutable-prototype-exotic-objects
tldr: >
  An ordinary object uses the spec's default definitions of the essential internal methods (`[[Get]]`,
  `[[DefineOwnProperty]]`, …). An exotic object replaces at least one. Arrays keep `length` in sync, String objects
  and TypedArrays expose virtual indexed properties, module namespaces are live read-only views, bound functions
  forward calls, and proxies run user code.
---

## Answer

Every object has **essential internal methods** (`[[Get]]`, `[[Set]]`, `[[GetOwnProperty]]`, `[[DefineOwnProperty]]`, `[[Delete]]`, `[[OwnPropertyKeys]]`, and so on). An **ordinary object** uses the spec's default definitions of all of them (plus the default or function-specific `[[Call]]`/`[[Construct]]`). An **exotic object** is any object that isn't ordinary, so at least one internal method behaves differently. The spec recognises a kind by its internal methods: code that imitates an array without those methods isn't an Array exotic object.

| Kind | What's different |
|---|---|
| Array | `[[DefineOwnProperty]]` keeps `length` in sync: writing index `i >= length` sets `length` to `i + 1`, and lowering `length` deletes elements |
| Arguments (mapped) | In sloppy functions with simple parameters, indices alias the parameter bindings |
| String object | Read-only virtual properties for each UTF-16 code unit and `length` |
| TypedArray | Canonical numeric keys are element accesses; out-of-range indices are never stored, and the prototype chain isn't consulted |
| Module namespace | Live, non-extensible, `null`-prototype view of a module's exports; writes fail |
| Bound function | `[[Call]]`/`[[Construct]]` forward to the target with a fixed `this` and leading arguments |
| Immutable prototype | `Object.prototype`: `[[SetPrototypeOf]]` only accepts its current value |
| Proxy | Essential methods call handler traps (see the Proxy question) |

Exotic behaviour is why some things can't be rebuilt in userland: you can't make a plain object whose `length` updates itself, or a function that is both a bound function and behaves as one. It is also why Proxy invariants exist: a proxy must not misreport what these objects guarantee.

## Example

```js
const arr = [1, 2, 3];
arr[5] = 'x';
console.log(arr.length);
// → 6
arr.length = 1;
console.log(arr, 2 in arr);
// → [ 1 ] false
const plain = {};
plain[5] = 'x';
console.log(plain.length);
// → undefined

const bytes = new Uint8Array(2);
bytes[5] = 1;
bytes.name = 'n';
console.log(bytes, 5 in bytes, Reflect.set(bytes, 5, 1));
// → Uint8Array(2) [ 0, 0, name: 'n' ] false true

const str = new String('hey');
console.log(Object.getOwnPropertyDescriptor(str, '1'));
// → { value: 'e', writable: false, enumerable: true, configurable: false }
```

## Pitfalls

- Treating `length` as a normal property. Setting a non-integer or negative `length` throws `RangeError`, and a non-writable `length` makes `push` throw.
- Expecting a TypedArray write out of range to fail loudly. `bytes[5] = 1` is silently ignored, and `Reflect.set` reports `true`. Only integer-valued canonical numeric keys are special: `bytes.name` is an ordinary property.
- Relying on `arguments` aliasing. It exists only in sloppy-mode functions with simple parameters, so adding a default value or `'use strict'` removes it.
- Assigning to a namespace import (`ns.count = 5`) and expecting a silent no-op. Module code is strict, so it throws `TypeError`.

## Follow-ups

**Q:** Is a function an exotic object?
**A:** An ordinary function is not. Its `[[Call]]` is a function-specific one the definition of "ordinary" allows. A bound function, which forwards to a target, is exotic.

**Q:** Why can't you put a new property on a module namespace?
**A:** It is non-extensible and its string keys exactly mirror the exports, so `defineProperty` of a new key returns `false`.

**Q:** Is `Array.isArray` true for a Proxy of an array?
**A:** Yes. `IsArray` looks through the proxy to the target, even though the proxy itself is a Proxy exotic object.

## Deep dive

### How it works

The spec defines a default for each internal method (`OrdinaryGet`, `OrdinaryDefineOwnProperty`, and so on). An exotic object's creation operation (`ArrayCreate`, `StringCreate`, `TypedArrayCreate`, `ModuleNamespaceCreate`, `BoundFunctionCreate`, `ProxyCreate`) installs its own versions for the methods it changes, and the rest stay ordinary.

**Array.** `[[DefineOwnProperty]]` special-cases the key `"length"` (via `ArraySetLength`, which converts with `ToUint32` and throws `RangeError` if the number isn't a valid length) and array indices (canonical integer strings below 2^32 − 1). Defining index `i` at or past `length` also defines `length` as `i + 1`, and fails if `length` is non-writable. Shrinking `length` deletes elements from the end, stopping at a non-configurable one. Only those keys are special, which is why `arr['02']` and `arr['-1']` don't change `length`.

**String objects** (not primitives) get `[[GetOwnProperty]]`, `[[DefineOwnProperty]]` and `[[OwnPropertyKeys]]` overrides: index keys below the string length and `"length"` appear as own, read-only, enumerable (for indices) properties. In strict code `str[0] = 'H'` throws `TypeError`. For primitive strings, `'hey'[0]` works through `ToObject` and the same exotic behaviour.

**TypedArray.** Eight internal methods are overridden. A key that is a *canonical numeric string* (the result of `ToString` of a Number, including `"-0"` and `"1.5"`) is never looked up as an ordinary property: if it isn't a valid in-bounds integer index, `[[Get]]` returns `undefined`, `[[HasProperty]]` returns `false`, `[[Set]]` does nothing, and the prototype chain is skipped. After `Object.prototype[7] = 'proto'`, `new Uint8Array(2)[7]` is `undefined` but `[][7]` is `'proto'` in Node.js 24. `Object.freeze` on a non-empty typed array throws `TypeError`, because the elements are always writable.

**Module namespace.** `import * as ns` yields an object with null prototype, `Symbol.toStringTag` `"Module"`, string keys sorted by code unit order, each key `{ writable: true, enumerable: true, configurable: false }`, and no extensibility. Reads are live: `[[Get]]` resolves the binding at access time, so it sees later changes and throws `ReferenceError` for a binding still in its temporal dead zone. `[[Set]]` always returns `false`, and `[[Delete]]` of an export returns `false` too.

```js
// ns.mjs — a module that imports its own namespace
import * as ns from './ns.mjs';
export let count = 0;
export function inc() {
  count++;
}
console.log(Object.prototype.toString.call(ns), Object.getPrototypeOf(ns), Object.isExtensible(ns));
// → [object Module] null false
inc();
console.log(ns.count, Reflect.set(ns, 'count', 5), Reflect.defineProperty(ns, 'extra', { value: 1 }));
// → 1 false false
try {
  ns.count = 5;
} catch (e) {
  console.log(e.constructor.name);
}
// → TypeError
```

**Bound function.** `BoundFunctionCreate` stores `[[BoundTargetFunction]]`, `[[BoundThis]]` and `[[BoundArguments]]`. `[[Call]]` ignores the caller's `this` and prepends the stored arguments. `[[Construct]]` ignores `[[BoundThis]]`, and if `new.target` is the bound function, substitutes the target:

```js
class User { constructor(name) { this.name = name; } }
const BoundUser = User.bind(null, 'Ada');
const u = new BoundUser();
console.log(u instanceof User, u instanceof BoundUser, u.name);
// → true true Ada
```

A bound function has no `prototype` property, and `instanceof` with a bound function on the right goes to the target. Its `name` is `"bound " + name`.

**Arguments (mapped).** `CreateMappedArgumentsObject` is used only for sloppy functions with simple parameter lists. Its `[[ParameterMap]]` aliases index properties to parameter bindings, so in CommonJS `function f(a) { arguments[0] = 'changed'; return a; }` returns `'changed'`. With `'use strict'` or a default value it returns the original argument.

**Immutable prototype.** `Object.prototype` is exotic only here: `Object.setPrototypeOf(Object.prototype, {})` throws `TypeError`, and `Reflect.setPrototypeOf(Object.prototype, null)` returns `true` because the value is unchanged.

### Edge cases

`Object.prototype.toString` reads internal slots and `Symbol.toStringTag`, not behaviour: an array, a proxy of an array and an arguments object print `[object Array]`, `[object Array]` and `[object Arguments]`. A proxy has none of the target's slots, but `IsArray` looks through to the target, and `typeof` follows whether the proxy has `[[Call]]`.

### Trade-offs

Knowing the exotic kinds explains surprising behaviours (sparse array length, silent typed-array writes, live read-only namespaces, `arguments` aliasing) and what a Proxy can and can't fake. In application code, rely on the documented APIs rather than internal-method details, and don't use `arguments` aliasing or sparse arrays on purpose.

## Exercises

### Which `length`?

```js
const a = [1, 2, 3];
a['2'] = 'x';
a['02'] = 'y';
a['-1'] = 'z';
console.log(a.length, Object.keys(a));
```

**Answer:** `3 [ '0', '1', '2', '02', '-1' ]`. Only canonical array indices below 2^32 − 1 affect `length`; `'02'` and `'-1'` are ordinary string keys.

### Does the prototype win?

```js
Object.prototype[7] = 'proto';
console.log(new Uint8Array(2)[7], [][7]);
delete Object.prototype[7];
```

**Answer:** `undefined proto`. TypedArrays never consult the prototype chain for numeric keys; an ordinary array does.
