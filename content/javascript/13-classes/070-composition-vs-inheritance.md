---
title: "Composition vs inheritance — when do mixins make sense?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [composition, inheritance, mixins, class, design]
related:
  - javascript/classes/classes-vs-prototypes
  - javascript/classes/super-keyword
  - javascript/classes/extending-built-ins
  - javascript/prototypes/prototype-chain
verified: 2026-10
sources:
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/extends
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes
  - https://tc39.es/ecma262/#sec-super-keyword-runtime-semantics-evaluation
  - https://tc39.es/ecma262/#sec-makemethod
tldr: >
  Default to composition: hold collaborators and expose only the API you want. Use `extends` only
  for a true is-a relationship with a base designed for it. Use a mixin, a function that takes a
  class and returns a subclass of it, only for a small, self-contained capability that unrelated
  classes share. Don't copy methods with `Object.assign`.
---

## Answer

**Inheritance** couples a subclass to its parent's whole public surface and to its internals: later changes to the parent can break the child, and the child inherits methods that make no sense for it. **Composition** keeps the dependency narrow: a class holds another object (ideally behind a private field), delegates to it, and exposes only what it chooses. It's also easier to change at runtime and to test with a fake.

My recommendation:

1. **Default to composition** (has-a). Pass dependencies into the constructor.
2. **Use `extends` when** the child really is a substitutable kind of the parent, the hierarchy is shallow, and the parent was written to be extended. `Error` subclasses and framework base classes are the usual cases.
3. **Use a mixin only when** several unrelated classes need the same small capability, and it adds methods without needing much of the host. Prefer a plain helper function or a composed collaborator when that works.

JavaScript has single inheritance, so sharing behaviour across hierarchies is what mixins are for. The pattern that works with classes is the **subclass factory**: `const M = (Base) => class extends Base { ... }`. It keeps the prototype chain linear, `super` works, and fields and private names behave normally. Apply it as `class User extends Serializable(Entity)`.

Costs to know: each application creates a **new class**, so `instanceof Serializable` is unreliable. Names collide silently (the outermost wins) and mixins stack in an order that matters. They also depend on host members, which TypeScript or documentation must spell out. A stack of three or four mixins is a design smell: switch to composition.

## Example

```js
// Composition: a Stack HAS an array and exposes only stack operations.
class Stack {
  #items = [];
  push(item) { this.#items.push(item); }
  pop() { return this.#items.pop(); }
  get size() { return this.#items.length; }
}
class LeakyStack extends Array {} // IS-A array: every Array method leaks into its API
console.log(typeof new Stack().shift, typeof new LeakyStack().shift); // → undefined function

// Mixin: a function from a class to a subclass, for one reusable capability.
const Serializable = (Base) =>
  class Serializable extends Base {
    serialize() { return JSON.stringify(this); }
  };

class Entity {
  constructor(id) { this.id = id; }
}
class User extends Serializable(Entity) {
  constructor(id, name) { super(id); this.name = name; }
}

const user = new User(1, 'Ada');
console.log(user.serialize()); // → {"id":1,"name":"Ada"}
const chain = [];
for (let c = User; c !== Function.prototype; c = Object.getPrototypeOf(c)) chain.push(c.name);
console.log(chain, user instanceof Entity); // → [ 'User', 'Serializable', 'Entity' ] true
```

## Pitfalls

- Inheriting to reuse code rather than to model is-a. `LeakyStack extends Array` exposes `shift` and `splice` and can no longer promise stack behaviour.
- Mixing in with `Object.assign(Target.prototype, mixin)`. It copies only own enumerable properties, invokes getters instead of copying them, and a method that uses `super` keeps its original home object, so `super` still points at the source object's prototype, not the target's.
- Testing mixins with `instanceof`. Each call to the factory returns a distinct class, so use a marker method or a `Symbol.hasInstance` check, or avoid needing the test.
- Mixins that assume host members (`this.id`) without saying so. The failure only shows at runtime on the first call.

## Follow-ups

**Q:** What does "favour composition over inheritance" mean in practice?
**A:** Build objects from collaborators (`this.#storage`, `this.#logger`) and delegate, rather than extending a class just to reuse its methods. Subclass when substitutability is real.

**Q:** Why not copy methods onto the prototype?
**A:** Because copying is a snapshot: later changes to the source don't propagate, the chain is lost, and `super` doesn't rebind. A subclass factory keeps a live chain.

## Exercises

### Predict the output

```js
const base = { hello() { return 'base'; } };
const mixin = { hello() { return 'mixin>' + super.hello(); } };
Object.setPrototypeOf(mixin, base);
class T { hello() { return 'T'; } }
Object.assign(T.prototype, mixin);
console.log(new T().hello());

const Ser = (B) => class extends B {};
const a = Ser(Object);
const b = Ser(Object);
console.log(new a() instanceof b, a === b);
```

**Answer:** `mixin>base`; then `false false`. The copied method's `super` is bound to `mixin`'s prototype (`base`), not to `T`. Each `Ser` call evaluates the class expression again, so `a` and `b` are different classes.
