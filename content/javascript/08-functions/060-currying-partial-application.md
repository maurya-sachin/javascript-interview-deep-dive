---
title: "What are currying and partial application?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [functions, currying, partial-application, higher-order-functions, arity]
related:
  - javascript/functions/higher-order-functions
  - javascript/functions/compose-and-pipe
  - javascript/functions/default-and-rest-parameters
  - javascript/closures/what-is-a-closure
  - javascript/this/call-apply-bind
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-function.prototype.bind
  - https://tc39.es/ecma262/#sec-static-semantics-expectedargumentcount
  - https://tc39.es/ecma262/#sec-math.max
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/length
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters
tldr: >
  Partial application fixes some arguments of a function now and returns a function taking the rest
  (`fn.bind(null, a)` does it natively). Currying turns an n-ary function into a chain of
  functions that collect arguments until `fn.length` of them have arrived. Both rely on
  closures; currying also relies on `length`, which ignores default and rest parameters.
---

## Answer

**Partial application** fixes some of a function's arguments and returns a new function that takes the remaining ones: `partial(volume, 2)` is a function of `(w, h)`. The built-in way is `fn.bind(thisArg, ...preset)`, which also lets you fix `this`.

**Currying** transforms a function of several arguments into a sequence of functions that each take some arguments, running the original once enough have been supplied: `curry(f)(a)(b)(c)` is equivalent to `f(a, b, c)`. Strictly, a curried function takes one argument at a time; the JavaScript version below also lets you pass several at once.

Difference: partial application is a one-step operation that you apply to an existing function with specific values. Currying is a reshaping of the function itself, so every partial application is available afterwards.

How the implementation works: each call collects its arguments in a closure. If `args.length >= fn.length`, call the original with them; otherwise return a function that continues collecting. `fn.length` is the arity.

Caveat: `length` counts only the parameters before the first default or rest parameter. A curried function with defaults or `...rest` fires too early, or never waits. Accept an explicit arity for such functions.

Use cases: configuring a general function into specialised ones (`const getUserById = fetchById(api)`), building point-free pipelines with `map`/`filter`, and composing (see compose and pipe).

## Example

```js
function partial(fn, ...preset) {
  return (...rest) => fn(...preset, ...rest);
}

function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn.apply(this, args);
    return (...more) => curried.apply(this, [...args, ...more]);
  };
}

const volume = (l, w, h) => l * w * h;

const curriedVolume = curry(volume);
console.log(curriedVolume(2)(3)(4)); // → 24
console.log(curriedVolume(2, 3)(4)); // → 24
console.log(curriedVolume(2)(3, 4)); // → 24

const withLength2 = partial(volume, 2); // fixes l = 2
console.log(withLength2(3, 4)); // → 24

// Currying relies on fn.length, so defaults and rest parameters hide arguments:
const greet = (greeting, name = 'you') => `${greeting}, ${name}`;
console.log(greet.length, curry(greet)('hi')); // → 1 hi, you
console.log(curry((...nums) => nums.length)(1, 2, 3)); // → 3
```

## Pitfalls

- Trusting `fn.length`. Defaults and rest parameters are not counted, and wrappers (a decorator written with `...args`) report `0`. Pass the arity explicitly where it matters.
- Mixing up the two terms. `bind(null, a)` is partial application; calling a curried function with fewer arguments returns another function that waits for more.
- Currying variadic functions such as `Math.max`. There is no fixed arity to wait for, and `Math.max.length` is `2`, so `curry` fires after two arguments.
- Forgetting `this`. The wrapper above forwards `this` with `apply`; a bare `(...args) => fn(...args)` loses the receiver for methods.

## Follow-ups

**Q:** What does `bind` do to `length`?
**A:** The spec sets the bound function's `length` to the target's `length` minus the number of preset arguments, floored at 0. So `add3.bind(null, 1).length` is `2`.

**Q:** Why does argument order matter?
**A:** Partial application and currying fix arguments from the left. Put the "configuration" arguments first and the data last (`filterBy(predicate)(items)`) so the partially applied function is reusable.

**Q:** Can a curried function be called with extra arguments?
**A:** In this implementation, yes: once `args.length >= fn.length` all of them are passed to `fn`, and a function that ignores extras ignores them. A strictly unary curry would not allow it.

## Exercises

### Curry a variadic function

`sum` takes any number of numbers, so `sum.length` is `0`. This `curry` takes an explicit `arity`. What do the calls print?

```js
function curry(fn, arity = fn.length) {
  return function curried(...args) {
    if (args.length >= arity) return fn.apply(this, args);
    return (...more) => curried.apply(this, [...args, ...more]);
  };
}

const sum = (...nums) => nums.reduce((total, n) => total + n, 0);
console.log(curry(sum, 3)(1)(2)(3)); // → 6
console.log(curry(sum, 3)(1, 2)(3, 4)); // → 10
```

**Answer:** `6` then `10`. The `arity` parameter (defaulting to `fn.length`) replaces the reliance on declared parameters. The second call collects `[1, 2]`, is still below 3, then receives `[3, 4]` and calls `sum(1, 2, 3, 4)`.

### Predict the output

```js
const add3 = (a, b, c) => a + b + c;
const bound = add3.bind(null, 1);
console.log(bound.length, bound(2, 3, 99));
```

**Answer:** `2 6`. `length` is `3 - 1`, and the extra argument `99` is ignored by `add3`.
