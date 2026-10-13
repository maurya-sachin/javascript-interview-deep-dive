---
title: "How is the value of `this` determined?"
status: draft
difficulty: medium
frequency: 5
core: true
tags: [this, call-site, strict-mode, new, classes]
related:
  - javascript/functions/function-forms
  - javascript/closures/what-is-a-closure
  - javascript/this/arrow-functions-this
  - javascript/this/call-apply-bind
  - javascript/this/lost-this-callbacks
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-evaluatecall
  - https://tc39.es/ecma262/#sec-ordinarycallbindthis
  - https://tc39.es/ecma262/#sec-resolvethisbinding
  - https://tc39.es/ecma262/#sec-getthisenvironment
  - https://tc39.es/ecma262/#sec-ecmascript-function-objects-call-thisargument-argumentslist
  - https://tc39.es/ecma262/#sec-ecmascript-function-objects-construct-argumentslist-newtarget
  - https://tc39.es/ecma262/#sec-module-environment-records-getthisbinding
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this
tldr: >
  For a non-arrow function, `this` is set by how it is called, not where it is defined.
  Precedence: `new` (a fresh object), then a bound function's fixed `this`, then
  `call`/`apply`, then `obj.method()` (the object), then the default, which is
  `undefined` in strict code and `globalThis` in sloppy code. Arrow functions skip all of this.
---

## Answer

For any function except an arrow function, `this` is decided **at the call site**, by what is to the left of the call parentheses. Check in this order:

1. **`new`**: `this` is a newly created object whose prototype comes from `new.target.prototype`.
2. **Bound function**: a function made by `bind` ignores any `this` you pass later; it always calls its target with the bound value.
3. **Explicit**: `fn.call(x)` / `fn.apply(x)` passes `x` as `this`.
4. **Implicit**: `obj.method()` or `obj[key]()` passes `obj`.
5. **Default**: a plain `fn()` passes `undefined`. In strict code that is the `this` value. In sloppy code `undefined`/`null` become `globalThis`, and primitives are wrapped in objects.

Three more rules:

- **Arrow functions** have no `this` of their own. They read the one from the enclosing function or scope, at the point where the arrow was created, so none of the rules above can change it.
- **Strict mode is a property of the function** being called, not of the caller. Class bodies and modules are always strict.
- **Top level:** in a module `this` is `undefined`. In a classic script it is `globalThis`. In a Node CommonJS file it is `module.exports`.

What matters is the *call expression*, not the function. The same function gives different results depending on how it is called, and extracting a method (`const f = obj.method; f()`) removes the `obj.` that supplied `this`.

## Example

```js
// Module code (strict mode).
function whoAmI() {
  return this;
}
const user = { name: 'Ada', whoAmI };
const other = { name: 'Grace' };

console.log(user.whoAmI() === user); // → true   implicit
console.log(whoAmI()); // → undefined   default (strict)
console.log(whoAmI.call(other) === other); // → true   explicit
const detached = user.whoAmI;
console.log(detached()); // → undefined   the `user.` is gone
console.log((0, user.whoAmI)()); // → undefined   comma applies GetValue
console.log(new whoAmI() instanceof whoAmI); // → true   `new`
console.log(whoAmI.bind(user).call(other) === user); // → true   bound beats call
console.log(new (whoAmI.bind(user))() === user); // → false   `new` beats bound
```

## Pitfalls

- Reading `this` as "the object the function belongs to". A function belongs to nothing; `this` is whatever the call passes. Getters follow the same rule: `this` is the object the property was accessed on, not the one that defines it.
- Assuming a callback keeps its `this`. `setTimeout(obj.method)` hands over the bare function, so the call has no `obj.` and falls to the default rule.
- Using an arrow function as an object method. Its `this` is the enclosing scope's, so it is `undefined` in a module, not the object.
- Judging strictness by the caller. The called function's own mode decides whether `undefined` becomes `globalThis`, so a sloppy function called from a module still sees `globalThis`.

## Follow-ups

**Q:** Why does `(0, obj.fn)()` lose `this` but `(obj.fn)()` keeps it?
**A:** Parentheses return the Reference Record unchanged, so the call still sees the property reference. The comma operator runs `GetValue` on its left and right operands, producing a plain function value with no base object.

**Q:** What is `this` inside a callback passed to `array.map(fn)`?
**A:** `undefined` (strict) or `globalThis` (sloppy), because the built-in calls `fn` without a receiver. `map`, `forEach`, `filter` and friends accept an optional second argument, `thisArg`, which they pass as `this`.

**Q:** Why can you not read `this` before `super()` in a derived constructor?
**A:** A derived constructor's `this` binding starts uninitialised; only `super()` creates the object and binds it. Reading `this` earlier throws a `ReferenceError`.

## Deep dive

### How it works

The spec has no variable called `this`. The keyword evaluates to `ResolveThisBinding()`, which calls `GetThisEnvironment()`: starting from the running execution context's lexical environment, it walks the `[[OuterEnv]]` chain until an Environment Record answers `true` to `HasThisBinding()`. A Function Environment Record answers `false` only when its `[[ThisBindingStatus]]` is `lexical`, which is how arrow functions "inherit" `this`: they are skipped. A Module Environment Record's `GetThisBinding` returns `undefined`; a Global Environment Record returns its `[[GlobalThisValue]]`.

For a normal function call the value is chosen in two steps.

1. **The call expression.** `EvaluateCall` receives the reference produced by the part left of the parentheses. If it is a property reference (`obj.m`, `obj[k]`), `thisValue` is the base object. If it is a plain identifier reference, `thisValue` is `undefined`, except inside a sloppy `with` block, where the object environment's `WithBaseObject()` supplies it. If the callee was not a reference at all (the result of a call, a comma expression, a `||`), `thisValue` is `undefined`.
2. **The callee's `[[Call]]`.** `OrdinaryCallBindThis` reads `[[ThisMode]]`, fixed when the function was created. `lexical`: do nothing. `strict`: bind `thisArg` as given. Otherwise (`global`): `undefined`/`null` become the callee realm's global `this` value, and anything else goes through `ToObject`.

`new` takes another path: `[[Construct]]` of a base function creates the object with `OrdinaryCreateFromConstructor(newTarget, "%Object.prototype%")` and binds it with the same `OrdinaryCallBindThis`. If the body returns an object, that object wins; otherwise the new object is the result.

The five rules in the answer are therefore one mechanism. `new` and bound functions override because they replace the `thisArg` before the callee sees it. `call`/`apply` pass `thisArg` directly. The reference rules produce `thisArg` when none is passed.

### Edge cases

Sloppy versus strict, and the top level, run as CommonJS here because modules are always strict:

```js
// Run as CommonJS: node example.cjs
function sloppy() { return this; }
function strict() { 'use strict'; return this; }

console.log(sloppy() === globalThis); // → true
console.log(strict()); // → undefined
console.log(typeof sloppy.call(5)); // → object
console.log(typeof strict.call(5)); // → number
console.log(this === module.exports); // → true
```

`sloppy.call(5)` boxes the primitive; `strict.call(5)` leaves it alone. Node wraps a CommonJS file in a function, so top-level `this` is `module.exports`, not `globalThis`. An ES module's top level is `undefined`.

Classes are always strict, so extracting a method gives `undefined`. A derived constructor's binding starts uninitialised:

```js
class Animal {
  static create() { return this; }
  speak() { return this; }
}
class Dog extends Animal {
  constructor() {
    try {
      this.legs = 4;
    } catch (error) {
      console.log(error.name); // → ReferenceError
    }
    super();
    this.legs = 4; // allowed now: super() initialised the binding
  }
}
console.log(Animal.create() === Animal); // → true
const { speak } = new Animal();
console.log(speak()); // → undefined
console.log(new Dog().legs); // → 4
```

A static method's `this` is the class because the call is `Animal.create()`; it is still the ordinary reference rule.

Accessors use the same rule, so `this` is the object the property was read from, even when the getter lives on a prototype:

```js
const counter = {
  count: 0,
  get next() {
    return ++this.count;
  },
};
const child = Object.create(counter);
console.log(child.next); // → 1
console.log(Object.hasOwn(child, 'count')); // → true   written on `child`
console.log(counter.count); // → 0
```

Other cases: a `[[Call]]` on a class constructor throws before binding anything; `thisArg` passed to a bound function or arrow is ignored (see the `call-apply-bind` and `arrow-functions-this` questions); and a direct `eval` resolves `this` through the same environment chain as the code around it.

### Trade-offs

Call-site binding lets one function serve many receivers: `Array.prototype.slice.call(arrayLike)` and prototype method sharing depend on it. The price is that `this` is a hidden argument that vanishes whenever a function is passed around without its receiver, which is the root of lost-`this` bugs. The standard remedies each change a different rule: an arrow (lexical), `bind` (fixed), or avoiding `this` in favour of explicit parameters or closures. Prefer the last where the code does not need a receiver.

## Exercises

### Predict the output

```js
const user = {
  name: 'Ada',
  regular() { return this?.name; },
  arrow: () => this?.name,
  nested() { return [1].map(function () { return this?.name; })[0]; },
};
console.log(user.regular());
console.log(user.arrow());
console.log(user.nested());
console.log((user.regular)());
console.log((user.regular = user.regular)());
console.log(user.regular.bind({ name: 'Grace' }).call({ name: 'Linus' }));
```

**Answer:** `Ada`, `undefined`, `undefined`, `Ada`, `undefined`, `Grace`. In module code the arrow's `this` is the module's `undefined`. The callback in `nested` is called with no receiver. Parentheses keep the reference, but an assignment expression returns a plain value, so `this` is lost. The bound function ignores the `call`.
