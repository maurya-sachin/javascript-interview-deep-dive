---
title: "What's the difference between `null` and `undefined`?"
status: draft
difficulty: easy
frequency: 5
core: false
tags: ["null", undefined, void, nullish, missing-values]
related:
  - javascript/values-and-types/language-types
  - javascript/values-and-types/typeof-null
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-ecmascript-language-types
  - https://tc39.es/ecma262/#sec-void-operator
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/null
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Data_structures
tldr: >
  Both are primitives with exactly one value. `undefined` is what the language gives you when
  something has no value yet: unassigned variables, missing arguments, absent properties, no
  `return`. `null` is a value you assign to say "intentionally nothing". They are `==` but not `===`,
  and they convert differently to numbers.
---

## Answer

Both are primitive types with exactly one value, and both are *nullish*. The difference is who produces them.

- **`undefined`** is produced by the language to mean "no value here": a declared but unassigned variable, a missing function argument, a property that doesn't exist, a function with no `return`. MDN frames it as absence of a *value*.
- **`null`** is something a programmer assigns to mean "intentionally empty". MDN frames it as absence of an *object*. The language itself yields it rarely; the end of the prototype chain is the main case.

How they differ in code:

- `typeof undefined` is `"undefined"`; `typeof null` is `"object"` (a historical quirk).
- `null == undefined` is `true`; `null === undefined` is `false`.
- As numbers, `Number(null)` is `0` and `Number(undefined)` is `NaN`.
- `JSON.stringify` keeps `null` but drops an `undefined` object property and turns an `undefined` array element into `null`.
- Default parameters apply only to `undefined`: `greet(null)` keeps `null`. `??` and `?.` treat both as nullish.

**Missing vs. present-but-undefined.** `obj.key === undefined` can't tell a missing property from one explicitly set to `undefined`. Use `'key' in obj` or `Object.hasOwn(obj, 'key')`.

**`void`.** `void expr` evaluates `expr` and returns `undefined`. `void 0` is an expression that always yields `undefined`. Common uses (per MDN) are discarding a return value, as in `() => void doSomething()`, and forcing a function expression to parse as an expression in `void function () {}()`.

## Example

```js
let declared;
const obj = { present: undefined, nothing: null };

console.log(declared, obj.missing, (() => {})()); // → undefined undefined undefined
console.log('present' in obj, 'missing' in obj); // → true false

console.log(null == undefined, null === undefined); // → true false
console.log(Number(null), Number(undefined)); // → 0 NaN
console.log(JSON.stringify({ a: undefined, b: null, c: [undefined] })); // → {"b":null,"c":[null]}

const greet = (name = 'guest') => name;
console.log(greet(undefined), greet(null)); // → guest null
console.log(null ?? 'fallback', 0 ?? 'fallback'); // → fallback 0
```

## Pitfalls

- Using `== null` without knowing it also matches `undefined`. That's often intended (it's the compact nullish check), but write a comment saying so.
- Assuming a default parameter replaces `null`. It doesn't; only `undefined` triggers it.
- Using `value || fallback` for nullish checks: it also replaces `0`, `''` and `false`. Use `??`.
- Reading `typeof x === 'undefined'` as "x doesn't exist". It's also true for a declared variable holding `undefined`.

## Follow-ups

**Q:** Which should my API return for "no result"?
**A:** Pick one and document it. MDN's guidance is that callers should usually accept both. Returning `undefined` matches what built-ins like `Array.prototype.find` do.

**Q:** Can `undefined` be overwritten?
**A:** The global `undefined` property is non-writable and non-configurable, so global assignment can't change it. A local variable named `undefined` is legal and shadows it, which is why you shouldn't write one.
