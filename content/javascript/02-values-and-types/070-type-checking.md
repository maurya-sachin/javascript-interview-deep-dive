---
title: "How do you reliably check a value's type?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [typeof, instanceof, array-isarray, tostringtag, error-iserror, realms]
related:
  - javascript/values-and-types/language-types
  - javascript/values-and-types/typeof-null
  - javascript/values-and-types/symbols
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-typeof-operator
  - https://tc39.es/ecma262/#sec-isarray
  - https://tc39.es/ecma262/#sec-instanceofoperator
  - https://tc39.es/ecma262/#sec-object.prototype.tostring
  - https://tc39.es/ecma262/#sec-error.iserror
  - https://tc39.es/ecma262/#sec-array.isarray
  - https://tc39.es/ecma262/#sec-ordinaryhasinstance
  - https://tc39.es/ecma262/#sec-number.isnan
  - https://tc39.es/ecma262/#sec-isnan-number
  - https://tc39.es/ecma262/#sec-code-realms
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/toString
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/isError
  - https://nodejs.org/docs/latest/api/vm.html
tldr: >
  No single check works. Use `typeof` for primitives and functions, `=== null` for null,
  `Array.isArray` for arrays, `Error.isError` for errors, and `instanceof` for your own classes
  within one realm. `Object.prototype.toString.call(v)` reads built-in tags like `[object Date]`,
  but programs can fake it with `Symbol.toStringTag`.
---

## Answer

Pick the check by what you're asking:

| Question | Check |
|---|---|
| Is it a string, number, boolean, bigint, symbol, or `undefined`? | `typeof value === '…'` |
| Is it a function? | `typeof value === 'function'` |
| Is it `null`? | `value === null` (`typeof null` is `"object"`) |
| Is it an array? | `Array.isArray(value)` |
| Is it an error? | `Error.isError(value)` where available |
| Is it an instance of my class? | `value instanceof MyClass` |
| Is it `NaN`? | `Number.isNaN(value)` (not the global `isNaN`, which coerces) |
| Which built-in kind is it? | `Object.prototype.toString.call(value)` |

Why the simple tools fail:

- **`typeof`** knows eight results only. Arrays, dates, regexes and `null` are all `"object"`.
- **`instanceof`** checks whether `Constructor.prototype` is on the value's prototype chain (or calls `Constructor[Symbol.hasInstance]`). It's false for primitives (`'s' instanceof String` is `false`), true for any object that merely inherits from the prototype, and breaks across **realms** (iframes, `vm` contexts), because each realm has its own `Array` and `Error`.
- **`Array.isArray`** and **`Error.isError`** are *branded* checks: they look at internal slots (an Array exotic object; `[[ErrorData]]`), not the prototype chain. They work across realms and aren't fooled by `{ __proto__: Array.prototype }`. `Array.isArray` also sees through a `Proxy` to its target. `Error.isError` is newer and MDN lists it as not Baseline, so feature-detect it or use a polyfill.
- **`Object.prototype.toString.call(v)`** returns `[object Tag]`: `Null` and `Undefined` for those values; otherwise the value of the object's `Symbol.toStringTag` property if that's a string, else a built-in tag (`Array`, `Arguments`, `Function`, `Error`, `Boolean`, `Number`, `String`, `Date`, `RegExp`) or `Object`. The spec says this isn't a reliable test for other objects, since programs can set `Symbol.toStringTag` themselves.

## Example

```js
const tagOf = (value) => Object.prototype.toString.call(value).slice(8, -1);
console.log(tagOf(null), tagOf([]), tagOf(new Date()), tagOf(new Map()), tagOf(1));
// → Null Array Date Map Number

const fakeArray = { __proto__: Array.prototype };
console.log(Array.isArray(fakeArray), fakeArray instanceof Array); // → false true

const fakeError = { __proto__: Error.prototype };
console.log(Error.isError(new TypeError('x')), Error.isError(fakeError)); // → true false

class Money {
  get [Symbol.toStringTag]() {
    return 'Money';
  }
}
console.log(tagOf(new Money())); // → Money (the tag is a program-controlled label)

const vm = await import('node:vm');
const foreign = vm.runInNewContext('[]'); // an array from another realm
console.log(foreign instanceof Array, Array.isArray(foreign)); // → false true

console.log('s' instanceof String, Number.isNaN('x'), isNaN('x')); // → false false true
```

## Pitfalls

- `typeof x === 'object'` as an "is it an object" test. It's `true` for `null`, so guard with `x !== null`, and it's `false` for functions.
- `x instanceof Array` or `x instanceof Error` in code that may receive values from another realm (iframes, Node's `vm`). Use `Array.isArray` and `Error.isError`.
- Trusting `Object.prototype.toString` for your own types. Any class can define `Symbol.toStringTag` to return what it likes.
- Using `isNaN(x)` to detect NaN. The global function coerces first, so `isNaN('x')` is `true`; `Number.isNaN` does not coerce.

## Follow-ups

**Q:** How do I check for a plain object (`{}`)?
**A:** There's no built-in. A common check is `value !== null && typeof value === 'object'` followed by comparing `Object.getPrototypeOf(value)` with `Object.prototype` or `null`. Decide whether class instances should count, then write that rule down.

**Q:** Can `instanceof` be customised?
**A:** Yes. If the right-hand side has a `Symbol.hasInstance` method, `instanceof` calls it and uses its result; `1 instanceof A` can return `true` if `A[Symbol.hasInstance]` says so.

## Exercises

### Predict the output

```js
const arrayLike = { __proto__: Array.prototype, length: 0 };
const tag = Object.prototype.toString.call(arrayLike);
console.log(Array.isArray(arrayLike), arrayLike instanceof Array, tag);
```

**Answer:** `false true [object Object]`. The object inherits from `Array.prototype` (so `instanceof` passes) but isn't an Array exotic object (so `Array.isArray` is `false`) and has no array slot (so the built-in tag is `Object`).
