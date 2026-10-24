---
title: "What is the `arguments` object, and why avoid it?"
status: draft
difficulty: easy
frequency: 2
core: false
tags: [functions, arguments, rest-parameters, strict-mode]
related:
  - javascript/functions/default-and-rest-parameters
  - javascript/functions/function-forms
  - javascript/operators-and-syntax/spread-vs-rest
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-arguments-exotic-objects
  - https://tc39.es/ecma262/#sec-createunmappedargumentsobject
  - https://tc39.es/ecma262/#sec-createmappedargumentsobject
  - https://tc39.es/ecma262/#sec-functiondeclarationinstantiation
  - https://tc39.es/ecma262/#sec-arguments-exotic-objects-defineownproperty-p-desc
  - https://nodejs.org/docs/latest-v24.x/api/modules.html#the-module-wrapper
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters
tldr: >
  `arguments` is an array-like object holding every argument passed to a non-arrow function:
  `length`, indexed properties, and `Symbol.iterator`, but not `Array.prototype`. In sloppy
  functions with a simple parameter list it is "mapped": indices alias the named parameters.
  Otherwise it is a plain snapshot. Prefer rest parameters.
---

## Answer

`arguments` is created for every call of a non-arrow function (unless a parameter is named `arguments`, or, with no parameter expressions, a body-level function or `let`/`const` is). It holds the arguments **as passed**, regardless of how many parameters are declared.

- **Array-like, not an array.** It has `length`, index keys, and `Symbol.iterator` (the same function as `Array.prototype.values`), so spread and `Array.from` work. It inherits from `Object.prototype`, so `map`, `slice`, and friends are missing, and `Array.isArray` is `false`.
- **Mapped vs unmapped.** In a *sloppy* function whose parameter list is simple (no defaults, rest, or destructuring), `arguments[i]` is aliased to the `i`-th named parameter, in both directions, but only for indices below the number of arguments actually passed. In strict code or with a non-simple list it is a plain copy with no link.
- **`callee`.** Sloppy mapped objects expose the running function as `arguments.callee`. In unmapped objects it is a poison-pill accessor that throws `TypeError`.
- **Arrows have none.** Inside an arrow, `arguments` resolves to the enclosing function's.

Why avoid it: it isn't an array, the aliasing is surprising and only exists in legacy sloppy code, it hides a function's real signature, and rest parameters (`...args`) give a real array with explicit names. Reach for `arguments` only when you must read legacy code.

## Example

```js
// CommonJS (sloppy) so `arguments` is mapped; ES modules are strict.
function mapped(a, b) {
  arguments[0] = 'changed'; // writes through to `a`
  b = 'B';
  return [a, arguments[1]];
}
console.log(mapped('x', 'y')); // → [ 'changed', 'B' ]
console.log(mapped('x')); // → [ 'changed', undefined ]

function strictOne(a) {
  'use strict';
  arguments[0] = 'changed';
  return a;
}
console.log(strictOne('x')); // → x

function shape() {
  return [Array.isArray(arguments), arguments.length, [...arguments]];
}
console.log(shape(1, 2)); // → [ false, 2, [ 1, 2 ] ]

const sum = (...nums) => nums.reduce((total, n) => total + n, 0);
console.log(sum(1, 2, 3)); // → 6
```

## Pitfalls

- Relying on parameter aliasing. Add a default value, a rest parameter, or `'use strict'` (or just use a module or class body) and the link vanishes silently.
- Calling array methods on it directly (`arguments.map(...)` throws). Spread it first: `[...arguments]`.
- Using `arguments` in an arrow and expecting its own call's arguments. It reads the outer function's. At the top of a Node.js CommonJS module it is the module wrapper's arguments, not an error.
- Leaving `arguments.callee` in code that may become strict. It throws there.

## Follow-ups

**Q:** How does the mapping get broken?
**A:** Deleting an index, or redefining it as an accessor or as non-writable with `Object.defineProperty`, removes the alias for that index. Redefining only its `value` keeps the alias. Parameters past the passed count were never mapped.

**Q:** How do you write a variadic function today?
**A:** `function f(first, ...rest)`. `rest` is a real array, is named in the signature, and works in arrows. To forward everything unchanged: `(...args) => g(...args)`.

## Exercises

### Predict the output

Run as CommonJS (sloppy mode).

```js
function f(a, b) {
  a = 'A';
  arguments[1] = 'B';
  return [arguments[0], b, arguments.length];
}
console.log(f('x'));
```

**Answer:** `[ 'A', undefined, 1 ]`. `a` was passed, so it is aliased and `arguments[0]` sees `'A'`. `b` wasn't passed, so index `1` was never mapped: writing `arguments[1]` creates a property without touching `b`, and `length` stays `1`.

### Predict the output

```js
function g(a = 0) {
  arguments[0] = 'changed';
  return a;
}
console.log(g('x'));
```

**Answer:** `x`. A default makes the parameter list non-simple, so `arguments` is unmapped, even in sloppy mode.
