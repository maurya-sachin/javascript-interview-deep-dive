---
title: "What are higher-order functions?"
status: draft
difficulty: easy
frequency: 4
core: false
tags: [functions, higher-order-functions, callbacks, first-class-functions]
related:
  - javascript/closures/what-is-a-closure
  - javascript/closures/debounce-throttle-once
  - javascript/functions/currying-partial-application
  - javascript/functions/compose-and-pipe
  - javascript/this/call-apply-bind
  - javascript/arrays/implement-map-filter-reduce
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-ecmascript-function-objects
  - https://developer.mozilla.org/en-US/docs/Glossary/First-class_Function
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
tldr: >
  A higher-order function takes a function as an argument, returns a function, or both. It works
  because functions are first-class: ordinary objects that can be stored, passed, and returned.
  `map`, `filter`, `reduce`, `setTimeout`, and wrappers like `debounce` are all examples.
  Returned functions rely on closures to keep their configuration.
---

## Answer

A **higher-order function** (HOF) is a function that accepts a function, returns a function, or does both. JavaScript allows this because functions are **first-class**: in the spec they are objects (`typeof` gives `"function"`, and they have `[[Call]]`), so they can be assigned to variables, passed as arguments, and returned like any value.

Two shapes cover almost everything:

- **Takes a function** (a *callback*). `Array.prototype.map/filter/reduce/sort`, `setTimeout`, `addEventListener`, `Promise.prototype.then`. The HOF decides *when and with what* to call your function; you decide *what* it does.
- **Returns a function** (a *function factory* or *decorator*). `debounce(fn)`, `once(fn)`, `fn.bind(...)`, `compose(f, g)`. The returned function remembers its inputs through a closure.

Why they matter: they separate the iteration or control-flow policy from the per-item logic, and they let you add behaviour (logging, caching, retries) around a function without editing it.

When writing a wrapper, forward everything: arguments (`...args`), the return value, and `this` (`fn.apply(this, args)`). Know what the HOF passes to your callback: `map` calls it with `(element, index, array)`, which is why passing a function that takes extra optional parameters can misbehave.

## Example

```js
// Takes a function: map calls `fn` with (element, index, array).
const lengths = ['a', 'bb', 'ccc'].map((s) => s.length);
console.log(lengths); // → [ 1, 2, 3 ]

// Returns a function: `withLogging` wraps any function without changing its contract.
function withLogging(fn) {
  return function (...args) {
    console.log(`${fn.name}(${args.join(', ')})`);
    return fn.apply(this, args); // forward arguments and `this`
  };
}

function add(a, b) {
  return a + b;
}
const loggedAdd = withLogging(add);
console.log(loggedAdd(2, 3)); // → add(2, 3)
                              // → 5

// The classic trap: map passes (value, index, array), parseInt reads (string, radix).
console.log(['10', '10', '10'].map(parseInt)); // → [ 10, NaN, 2 ]
console.log(['10', '10', '10'].map((s) => parseInt(s, 10))); // → [ 10, 10, 10 ]
```

## Pitfalls

- Passing a function directly when it takes more parameters than the HOF intends to supply. `['10','10','10'].map(parseInt)` hands `index` to `parseInt` as the radix. Wrap it or use a single-purpose function.
- Dropping `this` or the return value in a wrapper. A wrapper written as an arrow `(...args) => fn(...args)` loses the receiver, and one that forgets `return` makes every call give `undefined`.
- Passing a method detached from its object (`items.forEach(obj.method)`). The callback is called without a receiver; use an arrow or `bind`.
- Assuming the wrapper looks like the original. A wrapper built with `...args` has its own `name` (often `''`) and a `length` of `0`, which matters to anything that inspects them, such as arity-based currying.

## Follow-ups

**Q:** Is a callback the same as a higher-order function?
**A:** No. A callback is the function you *pass in*; the HOF is the function that *receives* it. A function can be both, for example one that accepts a callback and returns a wrapped version.

**Q:** Are all callbacks asynchronous?
**A:** No. The callbacks of `map`, `filter`, and `sort` run synchronously before the method returns. Callbacks to `setTimeout` or `then` run later.

**Q:** Can a HOF be pure?
**A:** Yes, if it only calls its callback and returns a result. Purity then depends on the callback too, so `map` with a side-effecting callback is not pure.

## Exercises

### Predict the output

```js
const wrap = (fn) => (...args) => fn(...args);
const user = { name: 'Ada', greet() { return `hi ${this.name}`; } };
try {
  console.log(wrap(user.greet)());
} catch (e) {
  console.log(e.name);
}
```

**Answer:** `TypeError`. The wrapper calls `fn(...args)` with no receiver, and this is module (strict) code, so `this` is `undefined` and `this.name` throws. A wrapper written as `function (...args) { return fn.apply(this, args); }` and called as a method (`user.greet = wrap(user.greet); user.greet()`) forwards the receiver.

### Implement

Write `unary(fn)` that returns a function calling `fn` with only its first argument, so `['10', '10', '10'].map(unary(parseInt))` gives `[10, 10, 10]`.

```js
const unary = (fn) => (first) => fn(first);
console.log(['10', '10', '10'].map(unary(parseInt))); // → [ 10, 10, 10 ]
```

**Answer:** The wrapper ignores the extra `(index, array)` arguments `map` supplies, so `parseInt` falls back to its default radix handling. It is a HOF that both takes and returns a function.
