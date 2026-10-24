---
title: "What is a realm, and why does `instanceof Array` fail across iframes?"
status: draft
difficulty: hard
frequency: 1
core: false
tags: [realms, intrinsics, instanceof, iframe, vm, array-isarray]
related:
  - javascript/scope-and-execution-contexts/global-object-globalthis
  - javascript/scope-and-execution-contexts/execution-context-call-stack
  - javascript/scope-and-execution-contexts/environment-records
  - javascript/prototypes/instanceof
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-code-realms
  - https://tc39.es/ecma262/#sec-createintrinsics
  - https://tc39.es/ecma262/#sec-well-known-symbols
  - https://tc39.es/ecma262/#sec-isarray
  - https://tc39.es/ecma262/#sec-getprototypefromconstructor
  - https://tc39.es/ecma262/#sec-error.iserror
  - https://tc39.es/ecma262/#sec-object.prototype.tostring
  - https://tc39.es/ecma262/#sec-arrayspeciescreate
  - https://html.spec.whatwg.org/multipage/webappapis.html
  - https://nodejs.org/api/vm.html
  - https://chromium.googlesource.com/v8/v8.git/+/main/docs/runtime/scopes-and-scope-infos.md
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/isError
tldr: >
  A realm is one complete set of built-ins (its own `Array`, `Object`, `Error`, …) plus a global
  environment. An iframe or a `node:vm` context is a new realm, so its `Array` is a different
  function with a different `prototype`. `instanceof` compares prototype identity, so it fails
  across realms; `Array.isArray` checks the object's internal kind instead.
---

## Answer

A **realm** (a Realm Record in the spec) bundles a set of **intrinsic objects**, a global object and Global Environment Record, and the code loaded into them. Intrinsics are the built-ins the engine creates for you: `%Array%`, `%Array.prototype%`, `%Object%`, `%Error%`, and so on. `CreateIntrinsics` builds a brand-new set for each realm.

Where realms come from:

- A **same-origin `<iframe>`** (or a popup) gets its own realm, so `iframe.contentWindow.Array` is a different function from your `Array`.
- Node's **`vm` contexts** are separate V8 contexts, and each V8 native context is its own realm.
- Workers and the main thread have separate realms, but they can't share objects directly anyway.

Why `instanceof` breaks: `x instanceof Array` checks whether `Array.prototype` is in `x`'s prototype chain. An array made in another realm inherits from *that* realm's `Array.prototype`, which is a different object. So `foreignArray instanceof Array` is `false`, even though it is a real array. The same applies to `Object`, `Function`, `Error`, `Date`, `Map`, and the rest.

Robust checks that don't depend on identity:

- **`Array.isArray(x)`** looks at the object's exotic internal kind (`IsArray`), so it works across realms.
- **`Error.isError(x)`** does the same for errors (a newer API; check support).
- **`Object.prototype.toString.call(x)`** derives built-in tags from internal slots, but `Symbol.toStringTag` overrides them, so it is spoofable.
- **Duck typing** (`typeof x.then === 'function'`) for promises and iterables.

Some things are shared across realms. Well-known symbols (`Symbol.iterator`) and registered symbols (`Symbol.for('k')`) are the same in every realm, and primitives have no realm at all.

## Example

```js
import vm from 'node:vm';

// A vm context is a separate realm with its own Array, Object, Error, ...
const foreign = vm.runInNewContext('[1, 2]');

console.log(foreign instanceof Array); // → false
console.log(Array.isArray(foreign)); // → true
console.log(Object.prototype.toString.call(foreign)); // → [object Array]
console.log(foreign.constructor === Array); // → false
console.log(vm.runInNewContext('Symbol.iterator') === Symbol.iterator); // → true
```

## Pitfalls

- Using `instanceof` for built-in type checks on values that might come from a frame, a `vm` context, or a library loaded in another realm. Use `Array.isArray` and `Error.isError`, or duck typing.
- Assuming a thrown error is `instanceof Error`. An error thrown from code in another realm isn't, though its `name` and `message` still work.
- Believing realm boundaries are security boundaries. A `vm` context shares the process and its objects can reach back into yours; Node's docs say not to use it as a sandbox for untrusted code.
- Mixing realms in `class extends`. A class extending a foreign `Array` creates objects whose prototype chain contains only the foreign `Array.prototype`.

## Follow-ups

**Q:** Why does `Array.isArray` work across realms?
**A:** `IsArray` tests whether the object is an Array exotic object, an internal property that doesn't depend on which prototype it has. For a Proxy it checks the target.

**Q:** Does `[].concat(foreignArray)` flatten it?
**A:** Yes. `concat` decides whether to spread an argument using `IsArray`, not `instanceof`, so foreign arrays are spread like local ones.

**Q:** In which realm do values returned by built-ins live?
**A:** In the realm of the function that creates them, not the caller's. A foreign `map` returns a foreign array. `structuredClone` returned an object of the current realm in Node 24.

## Exercises

### Which check passes?

```js
import vm from 'node:vm';

const foreignError = vm.runInNewContext('new RangeError("boom")');
console.log(
  foreignError instanceof Error,
  foreignError.name,
  Error.isError(foreignError),
);
```

**Answer:** `false RangeError true`. The error's prototype chain ends at the other realm's `Error.prototype`, so `instanceof Error` fails. `name` is inherited data and still reads `RangeError`, and `Error.isError` checks for the internal error slot, so it passes.

### Catching across realms

```js
import vm from 'node:vm';

try {
  vm.runInNewContext('null.x');
} catch (error) {
  console.log(error instanceof TypeError, error.name);
}
```

**Answer:** `false TypeError`. The engine creates the `TypeError` in the realm of the code that failed, which is the vm context. A `catch` block that filters on `instanceof TypeError` therefore misses it; compare `error.name` or use `Error.isError` for a first check.
