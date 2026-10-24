---
title: "Should you extend native prototypes?"
status: draft
difficulty: medium
frequency: 2
core: false
tags: [monkey-patching, polyfill, web-compatibility, smooshgate, for-in]
related:
  - javascript/prototypes/prototype-chain
  - javascript/objects-and-properties/property-descriptors
  - javascript/objects-and-properties/enumerating-properties
  - javascript/classes/extending-built-ins
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-ecmascript-standard-built-in-objects
  - https://developer.chrome.com/blog/smooshgate
  - https://github.com/tc39/proposal-flatMap
  - https://github.com/tc39/proposal-Array.prototype.includes
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
tldr: >
  Not in application or library code. A property you add to `Array.prototype` or
  `Object.prototype` is shared by all code, shows up in `for...in` if added by assignment, and
  can collide with a future standard method. The web has already renamed `flatten` to `flat` and
  `contains` to `includes` because of this. Polyfills are the exception: feature-test, match the
  spec, define non-enumerable.
---

## Answer

**Monkey-patching a built-in prototype** (`Array.prototype.last = ...`) changes every array in the program, including ones created by other libraries. Don't do it in application or library code:

1. **Enumerability.** Plain assignment creates an *enumerable* property, so `for...in` over any array (or object, if you patched `Object.prototype`) now yields your key. Built-in methods are non-enumerable.
2. **Collisions.** Two libraries adding the same name overwrite each other, and the name may later be standardised with different semantics.
3. **Web compatibility pressure.** Existing sites constrain what the language can do. TC39 wanted `Array.prototype.contains` but renamed it `includes` (2014) because the name wasn't web-compatible. The proposed `flatten` shipped in Firefox Nightly and broke sites using **MooTools**, which defined its own enumerable `flatten` and copied every key of `Array.prototype` onto its `Elements` with `for...in`. Once the native, non-enumerable `flatten` existed, assigning to it didn't make it enumerable, so the copy skipped it. The method was renamed `flat` (the "SmooshGate" episode).
4. **Hidden coupling.** Behaviour depends on which scripts loaded first, and code that iterates with `for...in` breaks without any visible change in that code.

Alternatives: a standalone function (`last(array)`), a wrapper or subclass you own, or a module-local helper.

**The exception is a polyfill**: code that adds a standardised feature missing from old runtimes. A safe one feature-tests first (`if (!Array.prototype.at)`), follows the spec's behaviour, and defines the property with `Object.defineProperty` so it is non-enumerable like the built-ins. Prefer an existing, maintained polyfill over writing your own.

## Example

```js
const keysIn = (object) => { const keys = []; for (const key in object) keys.push(key); return keys; };
Array.prototype.flatten = function () { // assignment: enumerable
  return this.reduce((all, item) => all.concat(item), []);
};
const items = ['a', 'b'];
console.log(keysIn(items)); // → [ '0', '1', 'flatten' ]
delete Array.prototype.flatten;

// Overwriting a built-in by assignment keeps its attributes: still non-enumerable.
const nativeAt = Array.prototype.at;
Array.prototype.at = function () { return 'patched'; };
console.log(Object.getOwnPropertyDescriptor(Array.prototype, 'at').enumerable); // → false
Array.prototype.at = nativeAt;

// A polyfill-style definition: feature test, then a non-enumerable property.
if (!Object.hasOwn(Array.prototype, 'last')) {
  Object.defineProperty(Array.prototype, 'last', {
    value() { return this[this.length - 1]; },
    writable: true,
    configurable: true, // enumerable defaults to false, like built-in methods
  });
}
console.log([1, 2, 3].last()); // → 3
console.log(keysIn(items)); // → [ '0', '1' ]
```

## Pitfalls

- Adding to `Object.prototype`. Every object, including every dictionary and options bag, inherits the key; `for...in` and `in` checks see it everywhere.
- Fixing the enumerability issue with `defineProperty` and assuming it's safe. It stops `for...in` leaks, but the name can still collide with a future built-in or another library.
- Writing a polyfill that differs from the spec (argument handling, holes, return values). Code that later runs on a runtime with the native version then behaves differently.
- Patching built-ins in a shared environment such as a browser extension, test runner or micro-frontend host: your change affects code you don't own.

## Follow-ups

**Q:** What went wrong with `Array.prototype.flatten`?
**A:** MooTools' own `flatten` was enumerable, and it copied every enumerable `Array.prototype` key to `Elements` with `for...in`. A native `flatten` is non-enumerable, so that copy skipped it and broke. Making the native one enumerable would add a `for...in` iteration to every array, so it became `flat`.

**Q:** How do you add a method to a built-in safely, if you must?
**A:** Feature-test, then `Object.defineProperty` with `enumerable: false`. Match the specification's name and behaviour, ideally by using a vetted polyfill. For your own helpers, use a plain function instead of a prototype method.

**Q:** Is extending your own classes' prototypes the same problem?
**A:** No. Code you own can't surprise you the same way. The issue is shared, global objects with many authors.

## Exercises

### Predict the output

```js
Object.prototype.debug = true;
const options = { retries: 3 };
const keys = [];
for (const key in options) keys.push(key);
console.log(keys, Object.keys(options), 'debug' in options);
delete Object.prototype.debug;
```

**Answer:** `[ 'retries', 'debug' ] [ 'retries' ] true`. `for...in` walks enumerable properties along the whole chain, while `Object.keys` lists only own ones. The `in` operator finds the inherited property as well.
