---
title: "When do you use `abstract` classes versus `implements` an interface?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [abstract-classes, implements, interfaces, inheritance, template-method]
related:
  - typescript/classes-enums-runtime-output/class-members-access
  - typescript/type-system-basics/type-vs-interface
  - typescript/the-compiler/type-erasure
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/2/classes.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-2.html
tldr: >
  An interface is a type-only contract that `implements` merely checks and that emits nothing. An
  `abstract` class is a real runtime base class that can share implementation and state, but
  cannot be instantiated. Use `implements` for pure contracts (several allowed), `abstract` when
  subclasses share code or an invariant-enforcing template method.
---

## Answer

Both describe "what a subclass must provide", but only one exists at runtime.

- **`implements Interface`** is a compile-time check that the class is assignable to the interface. It adds no members, infers no parameter types (`log(msg)` is still an implicit `any`), and emits nothing: the interface and the `implements` clause are erased. A class can implement several. You cannot `instanceof` an interface.
- **`abstract class`** is emitted as an ordinary JavaScript class. `abstract` members have no body and emit nothing. It can hold constructor logic, fields, and concrete methods that call abstract ones (the **template method** pattern). The checker stops `new` on it (TS2511) and requires concrete subclasses to implement every abstract member (TS2515). A class can `extends` only one base.
- **`instanceof`** works with an abstract class, so it can serve as a runtime type check. A class that merely `implements` the same shape is not an instance.

Rule of thumb: start with an interface; reach for an `abstract` class when subclasses genuinely share implementation, or when the base needs to enforce an order of steps. Composition is often better than either.

**Passing an abstract class as a value.** Since 4.2 the type `abstract new (...args) => T` accepts abstract and concrete classes. A plain `new () => T` parameter rejects `typeof Shape` ("Cannot assign an abstract constructor type to a non-abstract constructor type") because the callee could `new` it.

**`implements` a class** treats that class as an interface, including its private members, so it fails if the class has any (TS2720). Use `extends`.

All of this is type-level. The emitted JavaScript has no guard, so a cast defeats it (see Pitfalls).

## Example

```ts
// TypeScript 7.0.2 and 5.9.3, --strict
interface Named { name: string }

abstract class Shape implements Named {
  constructor(readonly name: string) {}
  abstract area(): number; // no body, nothing emitted
  describe() { return `${this.name}: ${this.area()}`; } // template method
}
class Square extends Shape {
  constructor(private side: number) { super("square"); }
  area() { return this.side ** 2; }
}
class Incomplete extends Shape {}
// Error TS2515: Non-abstract class 'Incomplete' does not implement inherited abstract member area from class 'Shape'.
new Shape("x");
// Error TS2511: Cannot create an instance of an abstract class.

function build(ctor: new (side: number) => Shape) { return new ctor(1); }
build(Shape);
// Error TS2345: Argument of type 'typeof Shape' is not assignable to parameter of type 'new (side: number) => Shape'.
function check(ctor: abstract new (...args: never[]) => Shape) { return ctor.name; }
console.log(check(Shape), new Square(3).describe(), new Square(3) instanceof Shape);
// → Shape square: 9 true

class Weak implements Named { constructor(public name: string) {} }
console.log(new Weak("w") instanceof Shape);
// → false
```

## Pitfalls

- Thinking `abstract` is enforced at runtime. I cast it away (`Shape as unknown as new () => Shape`), called `new` and `describe()`, and got `this.area is not a function`. Anything reaching your class through `any`, a cast, or plain JavaScript is unchecked.
- Assuming `implements` types the members. With `class Bad implements Logger { log(msg) {} }` the parameter is an implicit `any` (TS7006); the clause only checks assignability afterwards.
- Using `implements` on a class that has `private` or `#` members. `class Impl implements Base` fails with TS2720 ("Did you mean to extend 'Base'"), because private members can only come from the declaration itself.
- Defaulting to inheritance. A deep abstract hierarchy couples subclasses to the base's internals; an interface plus a small helper or composed object usually does the same job.

## Follow-ups

**Q:** Can an abstract class implement an interface without defining its members?
**A:** Only by redeclaring them as `abstract`. `abstract class A implements Named {}` is TS2420 on both versions; `abstract name: string; abstract greet(): string;` passes and pushes the work to the concrete subclass.

**Q:** Can a class both `extends` and `implements`?
**A:** Yes: `class C extends Base implements A, B`. `extends` brings runtime code; `implements` only adds compile-time checks.
