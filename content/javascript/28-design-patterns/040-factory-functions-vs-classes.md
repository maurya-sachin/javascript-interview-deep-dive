---
title: "Factory functions vs classes: when do you pick which?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [factory-functions, classes, private-fields, closures, this]
related:
  - javascript/classes/composition-vs-inheritance
  - javascript/prototypes/delegation-vs-constructors
  - javascript/classes/private-fields
  - javascript/closures/private-state
  - javascript/this/lost-this-callbacks
  - javascript/prototypes/instanceof
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-ordinaryfunctioncreate
  - https://tc39.es/ecma262/#sec-runtime-semantics-instantiatearrowfunctionexpression
  - https://tc39.es/ecma262/#sec-runtime-semantics-classdefinitionevaluation
  - https://tc39.es/ecma262/#sec-privateget
  - https://tc39.es/ecma262/#sec-privateelementfind
  - https://tc39.es/ecma262/#sec-ecmascript-function-objects-call-thisargument-argumentslist
  - https://tc39.es/ecma262/#sec-instanceofoperator
  - https://chromium.googlesource.com/v8/v8.git/+/main/docs/runtime/function-architecture.md
tldr: >
  A factory returns an object whose methods close over local variables: private by scope, no
  `this` to lose, free to return any shape, but every instance gets its own method functions and
  there's no `instanceof`. A class shares methods on one prototype, has `#private` fields,
  `instanceof` and `extends`. Many instances or a type hierarchy: class. Callbacks and composition: factory.
---

## Answer

Both build objects with private state and behaviour; they differ in where the methods live and how they find their state.

**Factory function.** A plain function that returns an object. State is a local variable, and methods are closures over the call's environment.

- Privacy is scope: nothing outside can reach the locals.
- Methods don't use `this`, so they survive being passed as callbacks or destructured.
- The function can return a cached object, a different implementation, or a composition of smaller objects, and callers don't need `new`.
- Cost: each call creates new function objects for every method, and there's no type to check with `instanceof`.

**Class.** Methods are defined once on `Class.prototype` and shared by every instance; state lives in fields.

- `#private` fields are enforced by the language: access on an object without the field throws a `TypeError`, and `#x in obj` is a brand check.
- `instanceof`, `extends`, `super` and `static` come built in.
- Methods read state through `this`, so a detached method loses it. Calling a class without `new` throws.

**How to choose** (a judgement call; both are fine in modern code):

- Many instances, a real is-a hierarchy, `instanceof` checks, or an API built around subclassing (custom elements extend `HTMLElement`): **class**.
- A few long-lived objects, methods handed out as callbacks, composition of capabilities, or construction logic you want to hide: **factory**.

Two corrections people miss: arrow-function class fields bring back per-instance functions, and `#private` is class-scoped, not instance-scoped, so one instance's methods can read another instance's `#x`, which closures can't do.

## Example

```js
function createCounter() {
  let count = 0; // private: lives in this call's environment
  return {
    increment: () => ++count,
    get value() { return count; },
  };
}

class Counter {
  #count = 0; // private: a Private Name scoped to the class body
  increment() { return ++this.#count; }
  get value() { return this.#count; }
}

const [f1, f2] = [createCounter(), createCounter()];
const [c1, c2] = [new Counter(), new Counter()];
// Factory: new functions per instance. Class: one shared prototype method.
console.log(f1.increment === f2.increment, c1.increment === c2.increment); // → false true

const { increment: detachedFactory } = f1;
const { increment: detachedMethod } = c1;
detachedFactory(); // fine: no `this` involved
try { detachedMethod(); } catch (error) { console.log(error.name); } // → TypeError

console.log(f1.value, f1 instanceof Object, c1 instanceof Counter); // → 1 true true
try { Counter(); } catch (error) { console.log(error.name); } // → TypeError
```

## Pitfalls

- Mixing styles: a factory whose methods use `this`. You get per-instance functions *and* lost-`this` bugs.
- Wrapping a class instance with `#private` fields in a `Proxy`. Methods run with the proxy as `this`, the proxy has no private elements, and the access throws a `TypeError`.
- Converting every handler to an arrow-function class field "to bind `this`". Each instance then gets its own function, which is the factory's memory cost without its other benefits. Bind only the methods you pass around.
- Claiming the memory difference always matters. It scales with instances × methods; for a handful of long-lived objects it's noise. Measure before choosing on memory alone.

## Follow-ups

**Q:** What exactly costs memory in a factory?
**A:** Each evaluation of a function expression creates a new function object (`OrdinaryFunctionCreate`): n instances with m methods means n × m functions. In V8, closures from the same source share compiled code through a `SharedFunctionInfo`; each closure is a `JSFunction` object referencing its context, not a copy of the code.

**Q:** Can a factory support `instanceof`?
**A:** Only if instances inherit from a shared prototype that some function's `prototype` points to, or that function defines `Symbol.hasInstance`. At that point you've rebuilt a class: the delegation style with `Object.create` gets you shared methods but still no `instanceof` or `#private`.

**Q:** Closure privacy or `#private`: which is stronger?
**A:** Both are unreachable from outside, and neither shows up through reflection or proxies. The difference is scope: closure state belongs to one call, while `#x` belongs to the class body, so methods can read `other.#x` for equality or merging, and `#x in obj` checks the brand.

## Exercises

### Predict the output

```js
class Counter {
  #count = 0;
  increment() { return ++this.#count; }
}
const watched = new Proxy(new Counter(), {});
try { watched.increment(); } catch (error) { console.log(error.name); }

function createCounter() {
  let count = 0;
  return { increment: () => ++count };
}
console.log(new Proxy(createCounter(), {}).increment());
```

**Answer:** `TypeError`, then `1`. Calling through the proxy sets `this` to the proxy, and `PrivateElementFind` finds no `#count` on it. The factory's arrow function never looks at `this`; it reads `count` from its closure, so the proxy is irrelevant.

### Predict the output

```js
class Button {
  onClick = () => this.label;
  render() { return this.label; }
  label = 'Save';
}
const a = new Button();
const b = new Button();
console.log(a.onClick === b.onClick, a.render === b.render, Object.hasOwn(a, 'onClick'));
```

**Answer:** `false true true`. A field initializer runs once per instance, so every `Button` gets its own `onClick` arrow as an own property. `render` is defined once on `Button.prototype` and shared.
