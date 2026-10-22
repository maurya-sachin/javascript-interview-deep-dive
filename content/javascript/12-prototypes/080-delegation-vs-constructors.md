---
title: "What is delegation-style object linking, and how does it compare with constructors and classes?"
status: draft
difficulty: medium
frequency: 2
core: false
tags: [prototypes, delegation, object-create, classes, constructors, oloo]
related:
  - javascript/prototypes/prototype-chain
  - javascript/prototypes/new-operator
  - javascript/prototypes/instanceof
  - javascript/classes/classes-vs-prototypes
  - javascript/classes/super-keyword
  - javascript/classes/composition-vs-inheritance
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-object.create
  - https://tc39.es/ecma262/#sec-ordinaryhasinstance
  - https://tc39.es/ecma262/#sec-instanceofoperator
  - https://tc39.es/ecma262/#sec-object.prototype.isprototypeof
  - https://tc39.es/ecma262/#sec-makemethod
  - https://tc39.es/ecma262/#sec-ordinarycreatefromconstructor
tldr: >
  Delegation style skips constructor functions: behaviour lives on plain objects, and new objects
  link to them with `Object.create` and set themselves up with an `init` method. It builds the same
  `[[Prototype]]` chain a class does, without `new` or `.prototype`. You lose `instanceof`, private
  `#fields` and non-enumerable methods; classes give those for free.
---

## Answer

JavaScript inheritance is always the same mechanism: an object's `[[Prototype]]` link, followed on property lookup. Constructors and classes reach it indirectly — `new F()` runs `OrdinaryCreateFromConstructor`, which creates an object linked to `F.prototype`. Delegation style reaches it directly: behaviour objects are plain objects, and you link to them with `Object.create(proto)` or `{ __proto__: proto }`. Kyle Simpson's *You Don't Know JS* calls this "OLOO", objects linked to other objects.

A delegation-style "type" is just an object with methods. Instead of a constructor, it has an ordinary `init` method that sets fields and returns `this`, so creation reads `Object.create(Square).init(3)`. A "subtype" is an object whose prototype is the parent object, and concise methods get a `[[HomeObject]]`, so `super.init()` works in them.

How it compares with classes:

- **Same chain, fewer moving parts.** There's no `.prototype` property, no `constructor` back-link to keep right, and no "forgot `new`" bug.
- **Type checks change.** `instanceof` needs a callable right-hand side with a `prototype` (`OrdinaryHasInstance`), so `x instanceof Square` throws a TypeError when `Square` is a plain object. Use `Square.isPrototypeOf(x)` instead. `x.constructor` is just the inherited `Object`.
- **Methods are enumerable.** Object-literal methods show up in `for…in` on every instance; class methods don't.
- **Class-only features.** Private `#fields` exist only in `class` bodies, and subclassing built-ins like `Array` or `Error` with their internal slots needs a constructor call (`class … extends` and `new`, or `Reflect.construct`).
- **Familiarity.** Most codebases, frameworks and tools expect classes, so delegation style is a team decision, not a free upgrade.

In practice: classes for most modelled types, delegation when you want behaviour shared among a few objects without ceremony, and composition (objects holding collaborators) when inheritance isn't really the relationship.

## Example

```js
const Shape = {
  init(name) { this.name = name; return this; },
  describe() { return `${this.name} with area ${this.area()}`; },
};
const Square = {
  __proto__: Shape,
  init(side) { super.init('square'); this.side = side; return this; },
  area() { return this.side ** 2; },
};
const sq = Object.create(Square).init(3);
console.log(sq.describe()); // → square with area 9
console.log(Square.isPrototypeOf(sq), Shape.isPrototypeOf(sq)); // → true true
try { sq instanceof Square; } catch (e) { console.log(e.name); } // → TypeError

class ShapeC {
  constructor(name) { this.name = name; }
  describe() { return `${this.name} with area ${this.area()}`; }
}
class SquareC extends ShapeC {
  constructor(side) { super('square'); this.side = side; }
  area() { return this.side ** 2; }
}
const sq2 = new SquareC(3);
console.log(sq2.describe(), sq2 instanceof ShapeC); // → square with area 9 true

const inherited = (obj) => { const keys = []; for (const k in obj) keys.push(k); return keys; };
console.log(inherited(sq), inherited(sq2)); // → [ 'name', 'side', 'init', 'area', 'describe' ] [ 'name', 'side' ]
```

## Pitfalls

- Using `instanceof` with a delegation prototype. It throws because the right side isn't callable; use `isPrototypeOf`.
- Iterating instances with `for…in`. Inherited methods from literal prototypes are enumerable; use `Object.keys` or define methods non-enumerable.
- Copying a method to another object and expecting `super` to follow the new owner. `[[HomeObject]]` is fixed where the method was written.
- Treating delegation as a performance trick. Both styles produce ordinary objects with prototype links; choose on clarity and features.

## Follow-ups

**Q:** How do you get private state with delegation style?
**A:** Not with `#fields`, which only exist inside `class` bodies. Use a closure in a factory function or a module-level `WeakMap` keyed by the instance. Both keep the data unreachable from outside without needing `new`.

**Q:** Is `Object.create(proto)` the same as `new`?
**A:** It does the linking step only: a new ordinary object whose `[[Prototype]]` is `proto`. `new` also runs the constructor with `this` bound, handles the return-override rule and, for derived classes, lets the base constructor create the object.

**Q:** Can the two styles interoperate?
**A:** Yes, because both are just prototype chains. `Object.create(SomeClass.prototype)` makes an object that passes `instanceof SomeClass` without running the constructor — which also means its fields and private names are never initialised.

## Exercises

### Predict the output

```js
const Animal = { speak() { return `${this.sound}!`; } };
const dog = Object.create(Animal);
dog.sound = 'woof';
console.log(dog.speak(), Animal.isPrototypeOf(dog), dog.constructor === Object, Object.keys(dog));
```

**Answer:** `woof! true true [ 'sound' ]`. `speak` is found on `Animal` through the chain and runs with `this` = `dog`. `constructor` isn't on `dog` or `Animal`, so lookup reaches `Object.prototype.constructor`, which is `Object`. `Object.keys` lists only own enumerable keys.
