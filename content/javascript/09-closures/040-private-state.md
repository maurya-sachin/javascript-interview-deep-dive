---
title: "How do closures create private state?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [closures, encapsulation, factory-functions, module-pattern]
related:
  - javascript/closures/what-is-a-closure
  - javascript/classes/private-fields
  - javascript/functions/iife
  - javascript/modules/es-module-loading
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-environment-records
  - https://tc39.es/ecma262/#sec-putvalue
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
tldr: >
  A variable declared inside a function lives in that call's Environment Record, and no
  language API can reach into an Environment Record. If the function returns closures
  that read or write the variable, those closures become its only interface — real
  privacy, not a naming convention. Each call creates fresh state; an IIFE runs once,
  giving a singleton.
---

## Answer

Privacy here comes from scope, not from objects. A `let` inside a function is a binding in that call's Environment Record. The spec makes those records impossible for a program to access or manipulate directly — there's no reflection API for them — so the only code that can touch the binding is code written inside the function. Return functions that use it, and they become the variable's entire public interface.

Two shapes:

- **Factory function.** Every call creates a new environment, so every returned object has independent state. The methods can also call private helper functions that are never returned.
- **Module pattern.** An IIFE runs the factory once and keeps the result — a singleton. In modern code an ES module does the same job: non-exported top-level bindings stay in the module's own environment, and only exports are visible to importers.

What you get compared with an object property or a `_underscore` convention:

- **Hard privacy.** `Object.keys`, `JSON.stringify`, proxies, and property access can't see the binding.
- **Controlled writes.** Validation lives in the only functions that can assign.
- **No `this`.** The methods resolve state lexically, so they can be passed around as callbacks without losing anything.

What it costs:

- **Per-instance functions.** Each call creates new function objects; class methods are shared on the prototype. For many instances, a class with `#private` fields gives the same hard privacy with shared methods.
- **Closed set of methods.** A function added later isn't lexically inside the factory, so it can't see the state.
- **References escape.** Returning the private array or object itself hands out mutable access; return copies or read-only views.

## Example

```js
function createWallet(initial = 0) {
  let balance = initial; // reachable only from the functions below
  const history = [];

  function record(type, amount) { // private helper: never returned
    history.push({ type, amount });
  }

  return {
    deposit(amount) {
      if (!(amount > 0)) throw new RangeError('amount must be positive');
      balance += amount;
      record('deposit', amount);
    },
    get balance() {
      return balance;
    },
    history: () => history.map((entry) => ({ ...entry })), // copies, not the array
  };
}

const wallet = createWallet(10);
wallet.deposit(5);
console.log(wallet.balance); // → 15
console.log(Object.keys(wallet)); // → [ 'deposit', 'balance', 'history' ]
wallet.history()[0].amount = 1e6; // edits a copy
console.log(wallet.history()); // → [ { type: 'deposit', amount: 5 } ]
console.log(createWallet().balance); // → 0
```

## Pitfalls

- Returning the private object itself (`getItems: () => items`). The binding is private; the array it points to isn't, once you hand it out.
- Bolting a method on later and expecting it to see the state. It resolves names from where it was written; in strict code, assigning to the missing name throws a `ReferenceError`.
- Mixing up properties and bindings. A property initialised from a private variable (`{ count }`) is a one-time copy; the methods and the property drift apart.
- Writing a module-pattern IIFE when you need instances. It runs once, so every consumer shares one state.

## Follow-ups

**Q:** Closures or `#private` fields — which would you use?
**A:** Both are hard privacy. `#fields` keep methods shared on the prototype, support `#x in obj` brand checks, and throw a `TypeError` on objects without the field. Closures suit function-shaped APIs, small or few instances, and callbacks that must not depend on `this`.

**Q:** Is closure privacy a security boundary?
**A:** No — it's encapsulation. Code in the same program can't read the binding, but it can replace the public methods (unless you freeze the object), and debuggers and heap snapshots show captured variables.

**Q:** What replaced the IIFE module pattern?
**A:** ES modules. Top-level bindings live in the module's environment, are private unless exported, and the module is evaluated once, so module-level state is a singleton — without the wrapper function.

## Exercises

### Predict the output

```js
function createCounter() {
  let count = 0;
  return { increment: () => ++count, value: () => count };
}
const counter = createCounter();
counter.reset = function () {
  count = 0;
};
counter.increment();
try {
  counter.reset();
} catch (error) {
  console.log(error.name);
}
console.log(counter.value());
```

**Answer:** `ReferenceError`, then `1`. `reset` was written outside `createCounter`, so its `[[Environment]]` is the module environment, which has no `count`. Assigning to an unresolvable reference throws in strict code. In a sloppy-mode script it would instead create a global `count` silently, and `value()` would still print `1`.

### Find the leak

```js
function createQueue() {
  const items = [];
  return {
    push: (item) => items.push(item),
    pending: () => items,
    size: () => items.length,
  };
}
const queue = createQueue();
queue.push('email');
queue.pending().push('sms', 'push');
console.log(queue.size());
```

**Answer:** `3`. `pending` returns the private array itself, so callers can mutate it and bypass `push`. Return a copy (`() => [...items]`) or a read-only view to keep the state private.
