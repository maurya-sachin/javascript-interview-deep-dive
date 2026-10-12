---
title: "How does `super` work?"
status: draft
difficulty: hard
frequency: 2
core: false
tags: [class, super, home-object, derived-constructor, new-target, inheritance]
related:
  - javascript/classes/classes-vs-prototypes
  - javascript/classes/fields-vs-methods
  - javascript/classes/extending-built-ins
  - javascript/this/this-binding-rules
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-super-keyword-runtime-semantics-evaluation
  - https://tc39.es/ecma262/#sec-getsuperbase
  - https://tc39.es/ecma262/#sec-getsuperconstructor
  - https://tc39.es/ecma262/#sec-makesuperpropertyreference
  - https://tc39.es/ecma262/#sec-bindthisvalue
  - https://tc39.es/ecma262/#sec-function-environment-records-getthisbinding
  - https://tc39.es/ecma262/#sec-makemethod
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/super
tldr: >
  `super(...)` constructs the parent with the current `new.target`, binds the result as `this`,
  then runs the class's fields. `super.x` looks `x` up on `HomeObject.[[GetPrototypeOf]]()` but
  calls it with the current `this`. The home object is fixed when the method is defined, so
  extracting a method doesn't change what `super` means.
---

## Answer

`super` has two unrelated forms.

**`super(...args)`** is valid only in a derived constructor. It:

1. takes the active constructor's `[[GetPrototypeOf]]()` as the parent (so it follows `extends` even if you later change it),
2. calls `Construct(parent, args, newTarget)`, which passes the *original* `new.target` down so the object ends up with the right prototype,
3. binds the result as `this` (`BindThisValue`), and
4. initialises this class's private methods and fields.

Until that happens, `this` is uninitialised, and reading it throws a `ReferenceError`. Calling `super()` twice also throws a `ReferenceError`. A derived constructor that finishes without calling `super()` and without returning an object throws too. If you omit the constructor, the default one forwards all arguments to `super`.

**`super.x` / `super[x]`** is valid in any method, including object-literal methods and static methods. The spec resolves it by taking the method's `[[HomeObject]]` (the object the method was defined on: `Class.prototype`, the class itself for statics, or the literal) and doing `HomeObject.[[GetPrototypeOf]]()` to find the base. The lookup starts there, but getters and methods run with the **current `this`** as receiver. That is what makes `super.describe()` see the instance's data. `super.x = v` sets on `this`, using the parent's setter if one exists.

Two implications. `super` is not a lookup of "the parent class": it's "the prototype of my home object", resolved at call time. And it's tied to where the method was *written*, not how it's called: extracting `const { greet } = obj` keeps its `super`. Arrow functions inherit `super` and `this` from the enclosing method; plain `function` expressions can't use `super` at all (a `SyntaxError`).

## Example

```js
class Shape {
  constructor(name) { this.name = name; }
  describe() { return `shape ${this.name}`; }
  static create(...args) { return new this(...args); }
}
class Circle extends Shape {
  constructor(r) {
    // console.log(this) here would throw ReferenceError: this is not initialised yet
    super('circle');          // Construct(Shape, args, new.target) → binds this
    this.r = r;
  }
  describe() { return `${super.describe()} r=${this.r}`; } // super.x: lookup starts at Shape.prototype, this stays the instance
  static create(r) { return super.create(r); }              // in statics, super is Shape itself
}
console.log(Circle.create(2).describe()); // → shape circle r=2

const base = { greet() { return `hi from base, this.id=${this.id}`; } };
const child = { id: 7, greet() { return super.greet(); } }; // HomeObject is `child`
Object.setPrototypeOf(child, base);
console.log(child.greet()); // → hi from base, this.id=7

const { greet } = child;     // extracting the method keeps its HomeObject
console.log(greet.call({ id: 9 })); // → hi from base, this.id=9
Object.setPrototypeOf(child, { greet() { return 'swapped'; } });
console.log(child.greet()); // → swapped (super base is looked up at call time)
```

## Pitfalls

- Touching `this` before `super()` in a derived constructor. That is a `ReferenceError`, not `undefined`.
- Reading a parent *field* through `super.x`. It's `undefined`, since fields are own properties of instances, not members of the parent prototype.
- Expecting `super.x = v` to write to the parent prototype. It defines or sets on `this`.
- Moving a method between objects and expecting `super` to follow. Its home object stays where it was defined.

## Follow-ups

**Q:** Why is `super()` needed at all in a derived class?
**A:** The derived constructor doesn't allocate the object; the base constructor does, using `new.target.prototype`. That's what lets subclasses of built-ins such as `Array` and `Error` get their internal slots.

**Q:** What does `class A extends null` do?
**A:** `A.prototype` has no prototype, so there is no `Object.prototype`. `new A()` with the default constructor throws a `TypeError`, because its parent, `Function.prototype`, isn't a constructor. To use it you write a constructor that returns an object, such as `Object.create(new.target.prototype)`.

**Q:** Can an instance field initialiser use `super`?
**A:** Yes: `super.method()` works because the initialiser's home object is the prototype. But it only sees prototype members, not parent fields.

## Exercises

### Predict the output

```js
class A {}
class B extends A { constructor() { } }
try { new B(); } catch (e) { console.log(e.name); }

class P {
  set x(v) { console.log('P setter', this instanceof S); }
}
class S extends P {
  m() { super.x = 5; return Object.hasOwn(this, 'x'); }
}
console.log(new S().m());

class Q { }
class R extends Q {
  m() { super.y = 5; return Object.hasOwn(this, 'y'); }
}
console.log(new R().m());
```

**Answer:** `ReferenceError`; then `P setter true` and `false`; then `true`. The `B` constructor never binds `this`. The first `super.x = 5` finds a setter on the parent prototype and runs it with `this` as receiver, so nothing is defined on the instance. In `R` there is no setter, so the assignment creates an own property on `this`.
