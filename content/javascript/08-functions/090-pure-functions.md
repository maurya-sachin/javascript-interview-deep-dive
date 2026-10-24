---
title: "What makes a function pure, and why does it matter?"
status: draft
difficulty: easy
frequency: 4
core: false
tags: [functions, pure-functions, side-effects, immutability, referential-transparency]
related:
  - javascript/functions/higher-order-functions
  - javascript/closures/memoization
  - javascript/functional-programming/immutable-updates
  - javascript/values-and-types/pass-by-sharing
verified: 2026-10
sources:
  - https://react.dev/learn/keeping-components-pure
  - https://tc39.es/ecma262/#sec-array.prototype.sort
  - https://tc39.es/ecma262/#sec-array.prototype.tosorted
  - https://tc39.es/ecma262/#sec-date.now
  - https://tc39.es/ecma262/#sec-math.random
  - https://github.com/tc39/proposals/blob/main/finished-proposals.md
tldr: >
  A pure function's result depends only on its arguments, and calling it changes nothing that
  existed before the call: no mutated arguments, globals, I/O, clock or randomness. So you can cache
  it, test it without setup, reorder or repeat calls safely. JavaScript can't enforce purity; it's a
  discipline, and mutating built-ins like `sort` make it easy to break.
---

## Answer

A function is pure when two things hold:

1. **Same inputs, same output.** The result depends only on the arguments — not on mutable outer variables, the clock (`Date.now()`), randomness (`Math.random()`), the DOM or the network.
2. **No side effects.** It doesn't change anything that existed before it was called: no writing to arguments or outer variables, no logging, no requests, no timers.

Mutating *local* state is fine. A function can build an array with `push` inside its own body and still be pure, because nobody else can observe it.

Why it matters:

- **Referential transparency.** A call can be replaced by its value, so results can be cached (memoization) and calls skipped, repeated or reordered without changing behaviour.
- **Testing.** Pass inputs, assert the output; no mocks or setup.
- **Change detection.** Code that compares by reference — React state, memoised selectors — relies on updates returning new objects instead of mutating old ones.
- **Re-runs.** React requires components to be pure and, in development Strict Mode, calls each component function twice to surface components that aren't.

JavaScript has no purity marker and no compiler check, and objects are passed by sharing, so any function that receives an object can mutate it. Some built-ins mutate their receiver: `sort`, `reverse`, `splice`, `fill`. ES2023 added copying versions — `toSorted`, `toReversed`, `toSpliced`, `with` — so the pure form no longer needs a manual copy.

Real programs need effects, so the goal isn't to remove them. It's to keep the core computation pure and push effects (I/O, state writes, logging) to the edges, like event handlers, where they're explicit and few.

## Example

```js
let taxRate = 0.2;

// Impure: reads a mutable outer variable and writes to its argument
function addTaxImpure(cart) {
  cart.total = cart.subtotal * (1 + taxRate);
  return cart;
}

// Pure: every input is a parameter, and it returns a new object
function addTax(cart, rate) {
  return { ...cart, total: cart.subtotal * (1 + rate) };
}

const cart = { subtotal: 100 };
console.log(addTax(cart, 0.2), cart); // → { subtotal: 100, total: 120 } { subtotal: 100 }
taxRate = 0.25;
console.log(addTaxImpure(cart).total, cart.total); // → 125 125

const scores = [3, 1, 2];
console.log(scores.toSorted((a, b) => b - a), scores); // → [ 3, 2, 1 ] [ 3, 1, 2 ]
scores.sort((a, b) => b - a); // sorts in place
console.log(scores); // → [ 3, 2, 1 ]
```

## Pitfalls

- Calling `sort`, `reverse` or `splice` on an argument inside a "pure" helper. Use `toSorted`/`toReversed`/`toSpliced`, or copy first.
- Thinking `const` or a spread makes data immutable. `const` fixes the binding, and spread copies one level, so nested objects are still shared.
- Treating a function that reads a mutable module variable as pure. Its output changes when the variable does.
- Hiding `Date.now()`, `Math.random()` or a fetch inside a calculation. Pass the time or random value in as an argument instead.

## Follow-ups

**Q:** Is `const priceOf = (item) => item.price` always pure?
**A:** Only for plain data. Property access can run a getter or a Proxy trap, so a caller can pass an object that counts reads or throws. Purity in JavaScript is a property of the function and the inputs you give it.

**Q:** Is a function that throws on bad input pure?
**A:** Usually treated as pure if it throws deterministically: the same input always throws the same way and nothing outside changes. Functional style often goes further and returns errors as values (a `Result`-style object), so the failure is part of the output.

**Q:** Is `console.log` inside a function a side effect?
**A:** Yes. It writes to an output stream. It's harmless for debugging, but a memoised or double-invoked function will log a different number of times than it's called in source.

## Exercises

### Which of these are pure?

```js
const doubled = (xs) => xs.map((x) => x * 2);
const appendZero = (xs) => { xs.push(0); return xs.length; };
const markSeen = (user) => ({ ...user, seenAt: Date.now() });
const range = (n) => { const out = []; for (let i = 0; i < n; i++) out.push(i); return out; };
```

**Answer:** `doubled` and `range` are pure. `range` mutates only its own local array. `appendZero` mutates its argument, and `markSeen` reads the clock, so the same input gives different output over time; passing the timestamp as a second parameter makes it pure.
