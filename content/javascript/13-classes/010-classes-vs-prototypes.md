---
title: "Are classes just syntactic sugar over prototypes?"
status: draft
difficulty: medium
frequency: 4
core: true
tags: [class, constructor, prototype, syntactic-sugar, temporal-dead-zone, strict-mode]
related:
  - javascript/prototypes/prototype-chain
  - javascript/prototypes/new-operator
  - javascript/scope-and-execution-contexts/temporal-dead-zone
  - javascript/classes/private-fields
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-class-definitions
  - https://tc39.es/ecma262/#sec-runtime-semantics-classdefinitionevaluation
  - https://tc39.es/ecma262/#sec-ecmascript-function-objects-call-thisargument-argumentslist
  - https://tc39.es/ecma262/#sec-ecmascript-function-objects-construct-argumentslist-newtarget
  - https://tc39.es/ecma262/#sec-strict-mode-code
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes
tldr: >
  Partly. A class still builds a constructor function, a `prototype` object and a chain, and
  methods live on the prototype. But it adds things a plain function can't copy: the constructor
  throws without `new`, methods are non-enumerable and non-constructible, the body is strict,
  the name is in a TDZ, and derived constructors and private names have no ES5 equivalent.
---

## Answer

"Sugar" is half right. `class` runs on the same machinery as constructor functions. `typeof` a class is `"function"`, `Point.prototype.constructor === Point`, instance methods are properties of `Point.prototype`, and `extends` wires the same `[[Prototype]]` chain. If you only wanted shared methods, a class and a function plus assignments to `prototype` give the same lookup behaviour.

It is not pure sugar, because the spec's `ClassDefinitionEvaluation` creates a function with extra rules:

- **Must be constructed.** Calling a class constructor without `new` throws a `TypeError`: the function has `[[IsClassConstructor]]`, which `[[Call]]` checks.
- **Methods are non-enumerable** and are not constructors, so `for...in` and `Object.keys` don't see them and `new obj.method()` throws.
- **`Point.prototype` is non-writable** on the class constructor.
- **Everything inside is strict mode**, without a directive.
- **The binding is in a TDZ** like `let`, and inside the class body there's a second, immutable binding of the name.
- **Derived constructors** have no `this` until `super()` returns, and `super()` is what creates the object. The base constructor allocates it, which is how `class X extends Array` can get exotic-array behaviour.
- **Private names** (`#x`) have no function-and-prototype equivalent: a private name isn't a property or a symbol. Fields can only be approximated by defining properties in the constructor.

Interview answer: classes are built on prototypes, but they are a distinct construct with stricter semantics, so "sugar" undersells them. The mental model for lookup is still the prototype chain.

## Example

```js
class Point {
  constructor(x) { this.x = x; }
  norm() { return Math.abs(this.x); }
}
function Legacy(x) { this.x = x; }
Legacy.prototype.norm = function () { return Math.abs(this.x); };

console.log(Object.keys(Point.prototype), Object.keys(Legacy.prototype)); // → [] [ 'norm' ]
console.log(Object.getOwnPropertyDescriptor(Point, 'prototype').writable); // → false
console.log(Object.getOwnPropertyDescriptor(Legacy, 'prototype').writable); // → true

try { Point(1); } catch (e) { console.log(e.name); } // → TypeError
try { new Point.prototype.norm(); } catch (e) { console.log(e.name); } // → TypeError

try { new Later(); } catch (e) { console.log(e.name); } // → ReferenceError
class Later {}

class Counter {
  static reset() { Counter = null; } // inner binding is immutable
}
try { Counter.reset(); } catch (e) { console.log(e.name); } // → TypeError
```

## Pitfalls

- Saying "classes are just sugar" and stopping there. The follow-up is always "then why does `Point()` throw?"
- Assuming a class declaration is hoisted like a function declaration. It's hoisted like `let`: using it before the line throws a `ReferenceError`.
- Reading `this` in a derived constructor before `super()`. It throws a `ReferenceError`.
- Expecting class methods to appear in `Object.keys` or `for...in`, or to be usable with `new`.

## Follow-ups

**Q:** Where do class methods live?
**A:** On `Class.prototype`, as writable, configurable, non-enumerable properties. Static methods live on the constructor itself. Fields live on each instance, which is covered in the fields-vs-methods question.

**Q:** Can you write `class Foo extends Bar` in ES5?
**A:** Only approximately. `Object.create` and `Parent.call(this)` rebuild the chain and the initialisation, but you lose the enforced `new`, the non-enumerable methods, private names, and the parent allocating `this`, so subclassing `Array` or `Error` falls short. `Reflect.construct` (ES2015, not ES5) is needed for that.

## Deep dive

### How it works

`ClassDefinitionEvaluation` does the following, in order:

1. Creates a new declarative environment (`classEnv`) holding an **immutable** binding of the class name, and a new `PrivateEnvironment` with one fresh **Private Name** for every `#name` in the body.
2. Evaluates `extends`, if any. `protoParent` is `superclass.prototype` and `ctorParent` is the superclass itself. With no `extends` they're `Object.prototype` and `Function.prototype`. `extends null` gives `protoParent = null`. A non-constructor, or one whose `prototype` is neither an object nor `null`, throws a `TypeError`.
3. Creates `proto` with `OrdinaryObjectCreate(protoParent)`.
4. Builds the constructor function from your `constructor` method and marks it as a class constructor (with no `constructor`, it makes a default built-in function that itself throws without `new`), and sets its own `[[Prototype]]` to `ctorParent`. That second link is why static members are inherited.
5. Defines `constructor` on `proto` as non-enumerable via `DefineMethodProperty`.
6. Walks the elements: instance methods go on `proto`, static methods on the constructor, instance fields are collected into the constructor's `[[Fields]]`, and private methods go in `[[PrivateMethods]]`.
7. Initialises the inner class binding, installs static private methods, then runs static fields and static blocks in order.

Note step 7: the inner binding is initialised before static fields run, so a static initializer can refer to the class by name. The outer declaration binding is initialised only after the whole class has been evaluated.

```js
class Config {
  static defaults = { retries: 3 };
  static current = Config.defaults; // inner binding already initialised
}
console.log(Config.current.retries); // → 3
```

### Edge cases

`[[Call]]` on an ECMAScript function begins by checking `[[IsClassConstructor]]` and throwing a `TypeError` if it's set. That check runs before `this` is bound or any body code executes. This is why `Point.call(obj)` fails too, so the ES5 pattern `Parent.call(this, ...)` cannot be used with class parents.

`[[Construct]]` branches on `[[ConstructorKind]]`:

- **`base`**: it creates `this` with `OrdinaryCreateFromConstructor(newTarget, "%Object.prototype%")`, runs `InitializeInstanceElements` (private methods, then fields) and only then your body.
- **`derived`**: it creates nothing. `this` stays uninitialized until `super(...)` calls `Construct(parent, args, newTarget)` and binds the result. A second `super()` throws because `BindThisValue` refuses to rebind.

A derived constructor may return an object, which replaces `this`; returning anything else but `undefined` throws a `TypeError`. A base constructor ignores non-object returns.

Methods defined by class syntax (or object shorthand) have no `[[Construct]]` and no own `prototype`, so `new instance.method()` throws.

```js
class Base { ready = true; }
class Child extends Base {
  constructor() {
    try { this.x = 1; } catch (e) { console.log(e.name); } // → ReferenceError
    super();
    console.log(this.ready); // → true
  }
}
new Child();
```

### Trade-offs

Use the model "classes are a stricter surface over prototypes". For reasoning about lookup, `instanceof`, or `Object.getPrototypeOf`, think prototypes. For reasoning about construction, calling, `this` and privacy, think class semantics. Transpiling to ES5 can only approximate these rules with helpers, which is why compiled output has historically differed from native in edge cases (for example fields using assignment instead of definition).

## Exercises

### Predict the output

```js
class A { static name2 = A.name; }
console.log(A.name2);

const B = class Inner { who() { return Inner.name; } };
console.log(new B().who(), typeof Inner);

class C { m() {} }
console.log(Object.keys(C.prototype).length, C.prototype.hasOwnProperty('m'));
```

**Answer:** `A`; then `Inner undefined`; then `0 true`. The static initializer sees the initialised inner binding. A named class expression's name is bound only inside the class, so `typeof Inner` outside is `"undefined"` (no `ReferenceError`, because `typeof` on an unresolvable reference is safe). `m` is an own, non-enumerable property of `C.prototype`.
