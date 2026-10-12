---
title: "Implement `compose` and `pipe`."
status: draft
difficulty: medium
frequency: 3
core: false
tags: [functions, composition, pipe, compose, reduce, higher-order-functions]
related:
  - javascript/functions/higher-order-functions
  - javascript/functions/currying-partial-application
  - javascript/arrays/implement-map-filter-reduce
verified: 2026-10
sources:
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduceRight
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions
tldr: >
  `pipe(f, g, h)(x)` is `h(g(f(x)))`: a left-to-right chain, built with `reduce`. `compose(f, g, h)(x)`
  is `f(g(h(x)))`: the same chain right to left, built with `reduceRight`. Each step takes one value
  and returns one value, so adapt multi-argument functions by currying or partial application.
---

## Answer

**Function composition** builds a new function from existing ones, feeding each result into the next. Two conventions:

- `pipe(f, g, h)(x)` runs `f`, then `g`, then `h`: `h(g(f(x)))`. Reads in execution order.
- `compose(f, g, h)(x)` runs `h` first: `f(g(h(x)))`. Mirrors mathematical notation.

Implementation: the returned function takes the input and folds the list of functions over it. `pipe` uses `reduce`, `compose` uses `reduceRight`; the accumulator is the value flowing through the chain, and the initial value is the input. Passing the input as the initial value also makes the empty case the identity function, with no special code.

Contract: every function except the first should take one argument and return one value. For anything else, adapt with currying or partial application (`add(1)` instead of `add`). Only the input value is forwarded: a second argument to the composed function is dropped.

Variants: if the first function must accept several arguments, take `(...args)` and call `first(...args)` before reducing (that fails for an empty list, so decide how to handle it). For async steps, chain with promises, as `pipeAsync` below.

## Example

```js
// pipe runs left to right; compose is the same chain read right to left.
const pipe = (...fns) => (input) => fns.reduce((value, fn) => fn(value), input);
const compose = (...fns) => (input) => fns.reduceRight((value, fn) => fn(value), input);

const trim = (s) => s.trim();
const words = (s) => s.split(/\s+/);
const count = (list) => list.length;

const wordCount = pipe(trim, words, count);
console.log(wordCount('  to be or not  ')); // → 4
console.log(compose(count, words, trim)('  to be or not  ')); // → 4

// With no functions both are the identity.
console.log(pipe()(42)); // → 42

// Each step takes one argument and returns one value. Curry to adapt multi-argument functions:
const add = (a) => (b) => a + b;
const double = (n) => n * 2;
console.log(pipe(add(1), double)(4)); // → 10
console.log(compose(add(1), double)(4)); // → 9

// Async steps: await each result.
const pipeAsync = (...fns) => (input) =>
  fns.reduce((promise, fn) => promise.then(fn), Promise.resolve(input));
pipeAsync(trim, async (s) => s.toUpperCase())(' hi ').then(console.log); // → HI
```

## Pitfalls

- Mixing up the direction. `compose(a, b)` runs `b` first. If your team's code reads left to right, use `pipe`.
- Putting a multi-argument or optional-parameter function in the chain. Only one value is passed through, so `pipe(parseInt)('10', 2)` drops the radix and uses the default.
- Passing a non-function. Nothing is checked when you build the pipeline; the `TypeError` appears when it runs.
- Mixing sync and async steps in plain `pipe`. A promise from one step is passed to the next as a value; use a promise chain (`pipeAsync`) or `await` each step.

## Follow-ups

**Q:** Why use `reduce` rather than a loop?
**A:** The value-threading is exactly a fold, so `reduce` states the intent and has no mutable variable. A `for` loop over the functions is equally correct, and some find it clearer.

**Q:** Where is composition used in practice?
**A:** Middleware chains, selector and data-transformation pipelines, and higher-order components. Each is a function from one value to another, composed in order.

**Q:** How do you debug a long pipeline?
**A:** Insert a tap step that logs and returns its input: `const trace = (label) => (v) => (console.log(label, v), v)`.

## Exercises

### Predict the output

```js
const pipe = (...fns) => (input) => fns.reduce((value, fn) => fn(value), input);
const compose = (...fns) => (input) => fns.reduceRight((value, fn) => fn(value), input);

const exclaim = (s) => s + '!';
const firstTwo = (s) => s.slice(0, 2);

console.log(pipe(firstTwo, exclaim)('hello'));
console.log(compose(firstTwo, exclaim)('hello'));
console.log(pipe()('same'));
```

**Answer:** `he!`, then `he`, then `same`. `pipe` slices first, then appends `!`. `compose(firstTwo, exclaim)` runs `exclaim` first (`hello!`), then slices to `he`, dropping the `!`. An empty chain returns its input.
