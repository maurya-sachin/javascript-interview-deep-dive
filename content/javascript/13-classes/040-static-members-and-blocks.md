---
title: "What are static members and static initialization blocks?"
status: draft
difficulty: easy
frequency: 2
core: false
tags: [class, static, static-block, class-fields, initialization]
related:
  - javascript/classes/fields-vs-methods
  - javascript/classes/private-fields
  - javascript/classes/super-keyword
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-runtime-semantics-classdefinitionevaluation
  - https://tc39.es/ecma262/#sec-runtime-semantics-classstaticblockdefinitionevaluation
  - https://tc39.es/ecma262/#sec-definefield
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/static
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Static_initialization_blocks
tldr: >
  `static` members belong to the constructor function, not to instances, and subclasses inherit
  them through the constructor's `[[Prototype]]`. A `static { }` block is class-level setup code
  that runs once, in order with static fields, with `this` as the class, its own `var` scope,
  and access to private names.
---

## Answer

A `static` method, accessor, or field is defined on the **constructor function itself**. Instances never get it, and it's called as `Class.method()`. `this` inside a static method is whatever it was called on, normally the class.

Subclasses inherit statics because `class B extends A` sets `B.[[Prototype]]` to `A`, so `B.method` is found through the chain and `super.method()` works inside static methods.

Static fields are initialised during class evaluation with define semantics, after all methods exist, with `this` bound to the class. A **static initialization block** (`static { ... }`) is a body of statements evaluated at the same stage:

- Static fields and blocks run **once, in source order**, interleaved. A later one sees what an earlier one set.
- `this` is the class. `super.x` reads the parent's static.
- The block has its own **function-like scope**: `var` and `let` inside are local to it.
- It can read **private names** (`#x`) declared in the class, which is how a class can export access to its private state to a sibling function in the surrounding scope.
- `await`, `arguments`, and `return` are syntax errors.
- It is evaluated synchronously during the class definition itself. An error thrown there propagates out of the class definition.

Use blocks when field initialisers can't express the setup: `try/catch` around parsing, setting several statics from one computation, or wiring private-state access. For a single value, a plain `static x = ...` is enough.

## Example

```js
const order = [];
class Registry {
  static #byName = new Map();
  static defaults = (order.push('field 1'), { retries: 3 });
  static {
    order.push('block 1');
    try {
      this.limit = JSON.parse('{"limit": 10}').limit;
    } catch {
      this.limit = 5;
    }
  }
  static other = (order.push('field 2'), this.limit * 2);
  static {
    order.push('block 2');
  }
  static register(name, value) { Registry.#byName.set(name, value); return this; }
  static get size() { return Registry.#byName.size; }
}
console.log(order); // → [ 'field 1', 'block 1', 'field 2', 'block 2' ]
console.log(Registry.limit, Registry.other); // → 10 20
console.log(Registry.register('a', 1).size); // → 1
console.log(Object.keys(new Registry()), Object.keys(Registry)); // → [] [ 'defaults', 'limit', 'other' ]

class Sub extends Registry {}
console.log(Object.getPrototypeOf(Sub) === Registry, Sub.size); // → true 1

class Counter { static count = 0; static inc() { return ++this.count; } }
class SubCounter extends Counter {}
console.log(SubCounter.inc(), Counter.count, Object.hasOwn(SubCounter, 'count')); // → 1 0 true
```

## Pitfalls

- Mutating an inherited static through `this`. `SubCounter.inc()` does `++this.count`, which reads the parent's `count` and then creates an **own** `count` on the subclass, leaving the parent at `0`. Reference the class by name if you want one shared value.
- Static private members aren't inherited. `this.#items` in a static method called on a subclass throws a `TypeError`, since the subclass doesn't have that private element. Name the class (`Store.#items`) instead.
- Assuming a static field is reachable from instances (`obj.count`). Use `obj.constructor.count` or the class name.
- Expecting statics to be copied. A subclass shares the parent's by lookup, not by copy.

## Follow-ups

**Q:** What is `this` in a static field initialiser?
**A:** The class itself, so `static other = this.value + 'c'` reads an earlier static. An arrow function in a static field also closes over that `this`.

**Q:** Can a class have several static blocks?
**A:** Yes. They run in order alongside static fields, each with its own scope.

## Exercises

### Predict the output

```js
class Flag {
  static value = 'a';
  static { this.value += 'b'; }
  static other = this.value + 'c';
}
console.log(Flag.other);

let read;
class Vault {
  #secret = 7;
  static { read = (v) => v.#secret; }
}
console.log(read(new Vault()));
```

**Answer:** `abc`, then `7`. Static elements run in source order with `this` as the class. The block is inside the class body, so the arrow function it creates can name `#secret` and still works after the class is defined.
