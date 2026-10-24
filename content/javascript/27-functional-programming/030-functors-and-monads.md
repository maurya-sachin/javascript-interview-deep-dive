---
title: "Is a Promise a monad? `map`, `flatMap` and `then` in functional terms"
status: draft
difficulty: hard
frequency: 2
core: false
tags: [functors, monads, flatmap, promises, thenables, fantasy-land]
related:
  - javascript/arrays/flat-and-flatmap
  - javascript/promises/promise-chaining
  - javascript/promises/what-is-a-promise
  - javascript/functions/compose-and-pipe
  - javascript/modules/dynamic-import
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-array.prototype.map
  - https://tc39.es/ecma262/#sec-array.prototype.flatmap
  - https://tc39.es/ecma262/#sec-flattenintoarray
  - https://tc39.es/ecma262/#sec-isarray
  - https://tc39.es/ecma262/#sec-isconcatspreadable
  - https://tc39.es/ecma262/#sec-promise.prototype.then
  - https://tc39.es/ecma262/#sec-promise-resolve-functions
  - https://tc39.es/ecma262/#sec-newpromiseresolvethenablejob
  - https://tc39.es/ecma262/#sec-promise-resolve
  - https://github.com/fantasyland/fantasy-land
  - https://promisesaplus.com/
tldr: >
  Not a lawful one. Arrays are: `map` is the functor operation and `flatMap` the monadic bind,
  flattening exactly one level of what the function returns. `then` acts as both `map` and
  `flatMap`, chosen at run time, and the resolve step unwraps any thenable recursively, so a
  Promise of a Promise can't exist and the laws fail for thenable values.
---

## Answer

The vocabulary comes from the Fantasy Land specification, a community spec (not part of ECMAScript) that names the algebra and its laws.

- A **functor** is a container with `map` that obeys two laws: mapping the identity function changes nothing, and `m.map(x => f(g(x)))` equals `m.map(g).map(f)`.
- A **monad** adds `of` (wrap a value) and `chain` (map with a function that returns a wrapped value, then remove one layer). It obeys left identity (`of(a).chain(f)` equals `f(a)`), right identity (`m.chain(of)` equals `m`) and associativity.

**Arrays fit.** `map` is the functor operation; `x => [x]` is `of`; `flatMap` is `chain`. In the spec, `flatMap` calls `FlattenIntoArray` with depth 1: each result that passes `IsArray` is spread one level, and anything else is appended as a value. Nested arrays inside a result stay nested, which is exactly what the laws need.

**Promises nearly fit.** `Promise.resolve` is `of`, and `then` plays both roles: if the callback returns a plain value, `then` behaves like `map`; if it returns a promise, like `chain`. The break is in the promise resolve function. It reads `.then` from *any* object it's resolved with and, if it's callable, adopts that thenable's eventual value, recursively. So a promise can never be fulfilled with a thenable, a Promise of a Promise can't exist, and the functor and monad laws fail whenever a value happens to be thenable.

So in an interview: "Monad-like, not a lawful monad." For everyday code the auto-flattening is a convenience, and the laws do hold for values that aren't thenables. It matters when you write generic code over "any container", or when your own objects happen to have a `then` method.

## Example

```js
// Functor composition law: p.then(x => f(g(x))) should equal p.then(g).then(f)
const g = (x) => ({ then: (resolve) => resolve(x * 10) }); // returns a thenable
const f = (v) => typeof v;

const p = Promise.resolve(1);
const composed = await p.then((x) => f(g(x)));
const stepwise = await p.then(g).then(f);
console.log(composed, stepwise); // → object number

// Monad left identity: of(a).chain(h) should equal h(a)
const inner = Promise.resolve('x');
const h = (v) => Promise.resolve(v === inner);
console.log(await Promise.resolve(inner).then(h), await h(inner)); // → false true

// Arrays keep the same law: flatMap flattens only what k returns, one level
const k = (v) => [v, v];
console.log([[1]].flatMap(k), k([1])); // → [ [ 1 ], [ 1 ] ] [ [ 1 ], [ 1 ] ]
```

## Pitfalls

- Expecting `flatMap` to flatten deeply. It removes exactly one level; use `flat(Infinity)` for that.
- Expecting `flatMap` to spread array-likes. `FlattenIntoArray` checks `IsArray`, so only real arrays (and proxies of arrays) are spread. `concat` checks `IsConcatSpreadable`, which also honours `Symbol.isConcatSpreadable`, so the two disagree on such objects.
- Returning an object with a `then` method from a `then` callback, an `async` function or a dynamic `import()` module. It gets called and unwrapped instead of passed through.
- Saying "Promises are monads" as settled fact. They're monad-like; which differences matter is a judgement call, but the law violations are real.

## Follow-ups

**Q:** Which laws does `then` keep?
**A:** For values that aren't thenables, it settles to the values the laws predict: `p.then(x => x)` settles like `p`, and chains associate. It always returns a new promise, so "equal" means equal settled outcome, not the same object. Settling also takes extra microtask ticks when a callback returns a promise.

**Q:** Why does `flatMap` double as a filter?
**A:** Because non-array results are appended as values and an empty array contributes nothing: `[1, 2, 3, 4].flatMap(n => n % 2 ? [] : [n * 10])` gives `[20, 40]`. That's `chain` with an empty result, a map and a filter in one pass.

**Q:** Why can't you have a `Promise<Promise<T>>`?
**A:** `Promise.resolve(p)` returns `p` itself when it's already a promise from the same constructor, and the resolve function adopts any thenable it's given, so the outer promise takes on the inner one's state. Nesting collapses at every step.

## Deep dive

### How it works

`then` runs `PerformPromiseThen`, which registers reaction records. When the promise settles, a reaction job calls your callback and passes its result to the derived promise's resolve function, created by `CreateResolvingFunctions`. That function decides between `map` and `chain` by inspection:

1. If the result is the derived promise itself, reject with a `TypeError`.
2. If it isn't an object, fulfil with it (the `map` case).
3. Otherwise `Get(resolution, "then")`. If that throws, reject; if it isn't callable, fulfil with the object.
4. If it is callable, queue a `NewPromiseResolveThenableJob`, which calls that `then` with a fresh pair of resolving functions. Whatever the thenable resolves with goes through the same steps again (the `chain` case, applied recursively).

Step 4 is duck typing: any object with a callable `then` is treated as a promise, which is the interoperability rule inherited from Promises/A+. It's also why a module namespace with a `then` export is unwrapped by dynamic `import()`:

```js
// thenable-module.mjs
//   export const name = 'config';
//   export function then(resolve) { resolve('not the namespace'); }
const ns = await import('./thenable-module.mjs');
console.log(ns); // → not the namespace
```

A lawful alternative keeps `map` and `chain` as separate methods and never inspects the values it carries, so a value can't change which one runs.

## Exercises

### Predict the output

```js
const thenable = { then(resolve) { resolve('unwrapped'); } };
const a = await Promise.resolve(1).then(() => thenable);
const b = [1].map(() => thenable);
const c = [1].flatMap(() => [thenable]);
console.log(a, b[0] === thenable, c[0] === thenable);
```

**Answer:** `unwrapped true true`. The promise resolve function finds a callable `then` and adopts the thenable's value. Arrays never inspect their elements: `map` stores the object as is, and `flatMap` spreads the returned array one level, leaving the object inside untouched.

### Predict the output

```js
const nested = [[1, [2]], [3], 4];
console.log(nested.flatMap((x) => x));
```

**Answer:** `[ 1, [ 2 ], 3, 4 ]`. Each result is flattened one level: `[1, [2]]` contributes `1` and `[2]`, `[3]` contributes `3`, and `4` isn't an array, so it's appended as a value.
