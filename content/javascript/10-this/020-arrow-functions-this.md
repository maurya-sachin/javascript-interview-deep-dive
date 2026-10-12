---
title: "Why don't arrow functions have their own `this`?"
status: draft
difficulty: easy
frequency: 4
core: false
tags: [this, arrow-functions, lexical-this]
related:
  - javascript/this/this-binding-rules
  - javascript/this/call-apply-bind
  - javascript/this/lost-this-callbacks
  - javascript/functions/function-forms
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-ordinaryfunctioncreate
  - https://tc39.es/ecma262/#sec-newfunctionenvironment
  - https://tc39.es/ecma262/#sec-getthisenvironment
  - https://tc39.es/ecma262/#sec-function-environment-records-hasthisbinding
  - https://tc39.es/ecma262/#sec-ordinarycallbindthis
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions
tldr: >
  An arrow function is created with `[[ThisMode]]` set to lexical, so calling it never
  creates a `this` binding. When its body reads `this`, the lookup skips the arrow and
  finds the `this` of the enclosing function or module. That is why `call`, `apply`,
  `bind` and `new` can't change it.
---

## Answer

Arrow functions don't bind `this`; they borrow it. The spec marks an arrow with `[[ThisMode]]: lexical`. On a call, `OrdinaryCallBindThis` sees that mode and returns without binding anything, and the arrow's Function Environment Record is flagged `lexical`, so the `this` lookup passes over it and continues outward to the nearest scope that really has a `this` binding.

Two consequences:

- **`this` is fixed by where the arrow is written.** It is the `this` of the enclosing function *for the call that created the arrow*. Each call of the parent creates a new arrow with that call's `this`.
- **Nothing at the call site can change it.** `call`, `apply` and `bind` still run, but the `thisArg` is ignored. `new` fails outright because arrows have no `[[Construct]]` and no `prototype`.

The same lookup applies to `arguments`, `super` and `new.target`: an arrow has none of its own.

That makes arrows right for **callbacks inside a method** (`map`, promise handlers, timers) that need the method's `this`, and wrong for **methods** and **constructors**, where you want the receiver to come from the call. An arrow as an object-literal property sees the *surrounding* `this` (`undefined` in a module), not the object. A class field `handler = () => ...` is the useful exception: the initialiser runs with `this` set to the new instance, so each instance gets a function bound to itself.

## Example

```js
// Module code (strict mode).
const timer = {
  startWithFunction() {
    return [1].map(function () { return this; })[0];
  },
  startWithArrow() {
    return [1].map(() => this)[0];
  },
};
console.log(timer.startWithFunction()); // → undefined
console.log(timer.startWithArrow() === timer); // → true

const arrow = () => this; // `this` of the module
console.log(arrow.call({ a: 1 })); // → undefined

const makeArrow = function () { return () => this; };
const owner = { name: 'owner' };
const captured = makeArrow.call(owner);
console.log(captured.call({ name: 'other' }) === owner); // → true
try { new arrow(); } catch (error) { console.log(error.name); } // → TypeError
```

## Pitfalls

- Treating an arrow as "a function with `this` bound to the object". It is bound to whichever `this` the enclosing code has, which for an arrow in an object literal at module level is `undefined`, not the object.
- Expecting `bind` or `call` to retarget an arrow. They return normally and silently ignore the `thisArg`; only the other arguments are applied.
- Using a class-field arrow where you wanted a shared prototype method. The arrow is created per instance, so every instance owns a separate function and the method isn't on the prototype.
- Using `arguments` in an arrow and expecting its own. It resolves to the enclosing function's `arguments`; use rest parameters instead.

## Follow-ups

**Q:** What is `this` in an arrow at the top of a Node CommonJS file?
**A:** `module.exports`, because the file is wrapped in a function whose `this` is `module.exports`. In an ES module it is `undefined`; in a browser classic script it is `window`.

**Q:** Is an arrow's `this` a copy or a live reference?
**A:** The arrow doesn't store `this`; it resolves it through the enclosing Function Environment Record. A `this` binding can't be reassigned once set, so copy and lookup look alike, except in a derived constructor: an arrow created before `super()` throws a `ReferenceError` if called early and sees the instance if called after.

**Q:** When would you still choose a regular function?
**A:** For methods, constructors, generators, and any callback whose caller supplies `this` on purpose (such as a DOM listener that reads `this.value`).

## Exercises

### Which `this`?

```js
const counter = {
  count: 0,
  inc: () => { counter.count += 1; return this; },
  incLater() { return [1].map(() => this)[0]; },
};
console.log(counter.inc() === counter);
console.log(counter.incLater() === counter);
console.log(counter.count);
```

**Answer:** `false`, `true`, `1`. The arrow `inc` returns the module's `this` (`undefined`), though it can still update `counter.count` through the variable. The arrow inside `incLater` shares the method's `this`, which is `counter`.
