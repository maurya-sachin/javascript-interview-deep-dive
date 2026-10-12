---
title: "Why does `typeof null` return `\"object\"`?"
status: draft
difficulty: easy
frequency: 4
core: false
tags: [typeof, "null", history, web-compatibility]
related:
  - javascript/values-and-types/language-types
  - javascript/values-and-types/null-vs-undefined
  - javascript/values-and-types/type-checking
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-typeof-operator
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/null
tldr: >
  It's a bug from the first JavaScript implementation, frozen into the language. Per MDN, values
  carried a type tag, objects had tag 0, and `null` was the NULL pointer, so it read as an object.
  A fix (`typeof null === "null"`) was proposed and rejected, so the spec now hard-codes `"object"`.
  `null` is a primitive: check it with `=== null`.
---

## Answer

`typeof null` is `"object"` because of a historical mistake that was never fixed. MDN's account of the first JavaScript implementation: values were a type tag plus a value, the tag for objects was `0`, and `null` was the NULL pointer (`0x00` on most platforms), so `null` carried the object tag. A change to make `typeof null === "null"` was proposed for ECMAScript as an opt-in, but was rejected.

Today it is simply specified behaviour. The `typeof` algorithm tests `undefined` first, then explicitly says "if value is null, return `"object"`", and only afterwards looks at strings, symbols, booleans, numbers and BigInts.

`null` is still a **primitive**: the Null type has exactly one value. It doesn't behave like an object. Reading a property throws a `TypeError`, `null instanceof Object` is `false`, and it has no wrapper.

Consequences for real code:

- `typeof value === 'object'` is `true` for `null`, arrays, dates and plain objects alike. To test for "a non-null object", write `value !== null && typeof value === 'object'`.
- To test for `null` itself, use `value === null`. Don't use `typeof`.
- `null` as the end of the prototype chain is the one place the language itself produces it: `Object.getPrototypeOf(Object.prototype)` is `null`.

## Example

```js
console.log(typeof null, typeof undefined, typeof {}, typeof []);
// → object undefined object object

console.log(null instanceof Object, null === null); // → false true

try {
  null.x;
} catch (error) {
  console.log(error.name); // → TypeError
}

const isObjectLike = (value) => value !== null && typeof value === 'object';
console.log(isObjectLike(null), isObjectLike({}), isObjectLike(() => {}));
// → false true false

console.log(Object.getPrototypeOf(Object.prototype)); // → null
```

## Pitfalls

- Explaining it as "`null` is an object". It's a primitive; only the `typeof` result is historical.
- Guarding with `typeof x === 'object'` and then reading `x.prop`. `null` passes the guard and throws.
- Forgetting that `typeof` of a function is `"function"`, so `isObjectLike` above is `false` for functions. Add `|| typeof value === 'function'` if you need them.
- Expecting `typeof` of an undeclared variable to throw. It returns `"undefined"`, but a `let` or `const` still in its temporal dead zone throws a `ReferenceError`.

## Follow-ups

**Q:** Why can't the engines just fix it?
**A:** The opt-in fix that would have made `typeof null` return `"null"` was proposed and rejected (per MDN), so the spec states the `"object"` result explicitly.

**Q:** Is there any other value with a surprising `typeof`?
**A:** `document.all` in browsers: `typeof document.all` is `"undefined"` even though it's an object. MDN calls this a willful violation of the standard for web compatibility; the spec allows it through the `[[IsHTMLDDA]]` internal slot.
