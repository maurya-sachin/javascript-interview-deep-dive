---
title: "Why does a method lose `this` when passed as a callback?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [this, callbacks, references, bind, event-handlers, timers]
related:
  - javascript/this/this-binding-rules
  - javascript/this/arrow-functions-this
  - javascript/this/call-apply-bind
  - javascript/closures/what-is-a-closure
verified: 2026-10
perishable:
  - Node.js timer callbacks receive the `Timeout` object as `this` (undocumented)
sources:
  - https://tc39.es/ecma262/#sec-evaluatecall
  - https://tc39.es/ecma262/#sec-function-calls-runtime-semantics-evaluation
  - https://tc39.es/ecma262/#sec-comma-operator-runtime-semantics-evaluation
  - https://tc39.es/ecma262/#sec-grouping-operator-runtime-semantics-evaluation
  - https://tc39.es/ecma262/#sec-ordinarycallbindthis
  - https://dom.spec.whatwg.org/#concept-event-listener-inner-invoke
  - https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timer-initialisation-steps
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this
tldr: >
  `obj.method` evaluates to a Reference Record whose base is `obj`; only a call made
  directly on that reference passes `obj` as `this`. Passing `obj.method` as a callback
  hands over just the function value, so whoever calls it supplies the `this`, usually
  none. Fix it with an arrow wrapper, `bind`, a class-field arrow, or a `thisArg`.
---

## Answer

A method has no link to its object. `this` comes from the **Reference Record** produced by the expression left of the call parentheses. `counter.increment` evaluates to a reference with base `counter` and name `"increment"`. If the call is made on that reference, `EvaluateCall` takes `counter` as `this`.

As soon as you read the function into a value, `GetValue` discards the reference: `const callback = counter.increment` stores, and `setTimeout(counter.increment, 0)` passes, just a function value.

The code that eventually calls it (`setTimeout`, `forEach`, a promise job, your own `run(cb)`) calls a plain function value, so there is no receiver. The callee gets `undefined` in strict code, so `this.count` throws; in sloppy code it gets `globalThis`, so you silently read or write globals, which is worse.

Fixes, in order of preference:

1. **Arrow wrapper:** `run(() => counter.increment())`. The call still has `counter.` in front of it.
2. **`bind`:** `run(counter.increment.bind(counter))`. A fixed receiver, and the right choice when you must pass a function and reuse it.
3. **Class-field arrow:** `increment = () => { ... }` makes a per-instance function whose `this` is the instance.
4. **`thisArg` parameter:** `array.map(fn, thisArg)` and similar built-ins accept one.

Related: `(0, obj.fn)()`, `(obj.fn || 0)()` and `(obj.fn = obj.fn)()` also lose `this`. Each applies `GetValue`, so the call is on a value, not a reference. Plain parentheses, `(obj.fn)()`, keep the reference.

## Example

```js
// Module code (strict mode).
const counter = {
  count: 0,
  increment() {
    this.count += 1;
    return this.count;
  },
};
const run = (callback) => callback(); // calls with no receiver

console.log(counter.increment()); // → 1
try {
  run(counter.increment);
} catch (error) {
  console.log(error.name); // → TypeError
}
console.log(run(() => counter.increment())); // → 2
console.log(run(counter.increment.bind(counter))); // → 3
console.log([1].map(counter.increment, counter)); // → [ 4 ]
```

## Pitfalls

- Believing that `obj.method` carries `obj` along. Only a call made on the reference does; destructuring (`const { method } = obj`) loses it too.
- Fixing it with `const self = this` in new code. Arrows and `bind` express the intent directly, and `self` is only a closure over `this` the old way.
- Calling `bind` inside a render or hot path and creating a new function every time. That also breaks reference equality for `removeEventListener` and memoised props. Bind once, store the result.
- Relying on sloppy mode: the call "works" because `this` is `globalThis`, and the bug shows up as wrong global state, not an exception.

## Follow-ups

**Q:** What is `this` in a DOM event listener?
**A:** Host-defined, not language semantics. The DOM spec calls the listener with the event's `currentTarget` as the callback `this` value, so a regular function sees the element it was registered on. An arrow ignores that and keeps its lexical `this`.

**Q:** And inside a `setTimeout` callback?
**A:** Also host-defined. The HTML standard calls the handler with the window (or the worker global) as `this`. In Node.js 24 a regular function callback sees the `Timeout` object; that is observed behaviour, not stated in the Node docs.

**Q:** Does `bind` or an arrow wrapper keep working with `removeEventListener`?
**A:** Only if you keep the same function object. `el.removeEventListener('click', fn.bind(x))` creates a new function and removes nothing; store the bound function once and pass that to both calls.

## Exercises

### Which calls lose `this`?

```js
const obj = { f() { return this; } };
console.log((obj.f)() === obj);
console.log((0, obj.f)());
console.log((obj.f = obj.f)());
const { f } = obj;
console.log(f());
```

**Answer:** `true`, `undefined`, `undefined`, `undefined` in module code. Only the parenthesised property reference survives; the comma and assignment expressions return plain values, and destructuring copies just the function.
