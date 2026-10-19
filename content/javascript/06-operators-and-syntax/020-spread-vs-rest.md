---
title: "What's the difference between spread and rest?"
status: draft
difficulty: easy
frequency: 4
core: false
tags: [spread, rest, destructuring, iterables, copy-data-properties]
related:
  - javascript/operators-and-syntax/destructuring
  - javascript/functions/default-and-rest-parameters
  - javascript/objects-and-properties/shallow-vs-deep-copy
  - javascript/iterators-and-generators/iteration-protocols
verified: 2026-10
perishable:
  - V8 spread-argument limit in Node 24
sources:
  - https://tc39.es/ecma262/#sec-copydataproperties
  - https://tc39.es/ecma262/#sec-runtime-semantics-argumentlistevaluation
  - https://tc39.es/ecma262/#sec-destructuring-binding-patterns-runtime-semantics-restbindinginitialization
  - https://tc39.es/ecma262/#sec-function-definitions-static-semantics-expectedargumentcount
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters
tldr: >
  Same `...` token, opposite jobs. Spread expands a value into elements: iterables in calls
  and array literals, own enumerable properties in object literals. Rest collects what is left
  into a new array (parameters, array patterns) or object (object patterns), and must come last.
  Spread is shallow, and array/call spread needs an iterable.
---

## Answer

Where `...` appears decides which one it is.

**Spread** is an expression: it *expands* something into individual items.

- In a call or `new`, or inside an array literal, it iterates its operand with the iteration protocol: `f(...args)`, `[...a, ...b]`. The operand must be iterable (arrays, strings, `Set`, `Map`, generators); a plain object throws `TypeError`.
- In an object literal, `{ ...src }` performs `CopyDataProperties`: it reads `src`'s **own enumerable** properties (string and symbol keys), using `Get`, so getters run and the copy gets plain data properties. Inherited and non-enumerable properties are skipped, `null` and `undefined` are ignored, and a string spreads as index keys. Later keys overwrite earlier ones, so `{ ...defaults, ...overrides }` lets `overrides` win.

**Rest** is a binding: it *collects* the remainder into a new value.

- In a parameter list, `(first, ...others)` gives a real array of the extra arguments. It replaces `arguments`, works in arrow functions, and is not counted in `fn.length`.
- In an array pattern, `[head, ...tail]` drains the iterator into an array.
- In an object pattern, `{ a, ...others }` copies every own enumerable property except the listed ones into a new plain object.

A rest element must be last and appear once (`SyntaxError` otherwise), and it takes no default.

**Both are shallow**: nested objects are copied by reference. Spread is a *copy*, not a clone, and it doesn't preserve the prototype, descriptors, or non-enumerable properties.

## Example

```js
const sum = (...nums) => nums.reduce((a, b) => a + b, 0); // rest: collect
const args = [1, 2, 3]; // spread: expanded into the call below
console.log(sum(...args, 4)); // → 10
console.log([...'hi', ...new Set([1, 1, 2])]); // → [ 'h', 'i', 1, 2 ]

const base = { a: 1, b: 2 };
const merged = { ...base, b: 3, c: 4 }; // later keys win
console.log(merged); // → { a: 1, b: 3, c: 4 }

const { a, ...restProps } = merged; // rest: everything but `a`
console.log(a, restProps); // → 1 { b: 3, c: 4 }
const [head, ...tail] = [1, 2, 3];
console.log(head, tail); // → 1 [ 2, 3 ]

const nested = { inner: { n: 1 } };
const copy = { ...nested };
copy.inner.n = 2; // shared reference
console.log(nested.inner.n); // → 2
```

## Pitfalls

- Treating spread as a deep copy. Only the top level is new; nested objects and arrays are shared.
- Spreading a plain object into an array or a call: `[...{ a: 1 }]` throws `TypeError` because objects aren't iterable. Only the object-literal form accepts any object.
- Expecting class instances to survive: `{ ...new A() }` is a plain object holding the own enumerable fields — no prototype, no methods, and accessors become their current values.
- Spreading a huge array into a call (`Math.max(...big)`). Each element becomes an argument, and the spec sets no limit, so engines cap it differently (MDN's `apply` page says the result is unspecified). In Node 24 (V8) the cap follows stack size: 120,000 elements worked and 125,000 threw `RangeError` here. Use a loop or `reduce`.

## Follow-ups

**Q:** What's the difference between `{ ...a }` and `Object.assign({}, a)`?
**A:** Spread defines new properties on the new object (`CreateDataPropertyOrThrow`), so setters on the target can't intercept. `Object.assign` does `Set`, which calls setters, including inherited ones, on its target.

**Q:** How do you omit a property immutably?
**A:** Rest in a pattern: `const { password, ...safe } = user`. `safe` is a new object without `password`.

**Q:** Is `[...arr]` the same as `arr.slice()`?
**A:** For dense arrays, yes: both are shallow copies. Spread uses the iterator, so it turns holes into `undefined`; `slice` keeps them as holes.

## Exercises

### Predict the output

```js
const defaults = { theme: 'light', size: 'm' };
const user = { size: undefined, theme: 'dark' };
console.log({ ...defaults, ...user });
```

**Answer:** `{ theme: 'dark', size: undefined }`. Spread copies `size: undefined` as a real own property, and it overwrites `'m'`. Spread doesn't skip `undefined`; filter it out first if you want a default to survive.

### Fix the bug

```js
const state = { user: { name: 'Ada' }, count: 0 };
const next = { ...state, count: 1 };
next.user.name = 'Grace';
console.log(state.user.name);
```

**Answer:** It prints `Grace`: `next.user` and `state.user` are the same object. Copy the level you change: `{ ...state, user: { ...state.user, name: 'Grace' }, count: 1 }`.
