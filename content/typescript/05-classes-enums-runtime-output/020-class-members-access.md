---
title: "How do TypeScript classes differ from JavaScript classes: modifiers, parameter properties, `#private`?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [classes, access-modifiers, parameter-properties, private-fields, override, mixins]
related:
  - typescript/classes-enums-runtime-output/abstract-classes-implements
  - typescript/classes-enums-runtime-output/erasable-syntax-only
  - typescript/type-system-basics/structural-typing
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/2/classes.html
  - https://www.typescriptlang.org/docs/handbook/mixins.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-3.html
  - https://www.typescriptlang.org/tsconfig/#useDefineForClassFields
  - https://www.typescriptlang.org/tsconfig/#noImplicitOverride
tldr: >
  TypeScript adds `public`, `protected`, `private`, `readonly`, `override`, and parameter
  properties to JavaScript classes. All are erased or compiled away, so `private` is only a
  compile-time check ("soft private"); `#field` is the real ECMAScript private that survives to
  runtime. Parameter properties are the one modifier that also emits assignments.
---

## Answer

Classes themselves are JavaScript (fields, `#private`, `static` blocks). TypeScript layers type-time features on top:

- **`public` / `protected` / `private`** are checked only at compile time. `private` is "soft": bracket access `a["secret"]` is allowed by the checker, and at runtime the property is an ordinary own property (visible in `Object.keys` and `JSON.stringify`). `protected` means "this class and subclasses". Both still allow cross-instance access (`other.secret` inside the class).
- **`#name`** is ECMAScript's hard private field. It is enforced at runtime (a syntax error outside the class), is invisible to `Object.keys`, and TypeScript emits it as-is for ES2022+, or as a `WeakMap` for older targets.
- **`readonly`** is compile-time only; assignment outside the constructor is TS2540.
- **Parameter properties** (`constructor(public id: string)`) declare a field and assign it. This is one of the few class features that emits code.
- **`override`** (TS 4.3) asserts the base class has that member; `noImplicitOverride` makes it mandatory.

Two compatibility rules matter: classes with `private` or `#` members are compared **nominally for those members**. Two unrelated classes with an identically named private member are not assignable to each other, and a class with a private member is not assignable to an object type with the same public-looking property.

Choose `#` when privacy must hold at runtime (libraries, secrets in objects that get serialised or inspected). Choose `private` when you want test access or have to support targets where `WeakMap` emit is unwanted. With `erasableSyntaxOnly`, parameter properties are rejected.

## Example

```ts
// TypeScript 7.0.2 and 5.9.3, --strict --noImplicitOverride
class Account {
  #pin = 1234; // hard private: ECMAScript private field
  private secret = "s3"; // soft private: erased after type checking
  constructor(public readonly id: string, protected balance: number) {}
  checkPin(p: number) { return p === this.#pin; }
}
class Savings extends Account {
  show() { return this.balance; } // OK: protected is visible in subclasses
  checkPin(p: number) { return super.checkPin(p); }
  // Error TS4114: This member must have an 'override' modifier because it overrides a member in the base class 'Account'.
}
const a = new Account("a1", 10);
a.id = "x";
// Error TS2540: Cannot assign to 'id' because it is a read-only property.
a.balance;
// Error TS2445: Property 'balance' is protected and only accessible within class 'Account' and its subclasses.
a.secret;
// Error TS2341: Property 'secret' is private and only accessible within class 'Account'.
a.#pin;
// Error TS18013: Property '#pin' is not accessible outside class 'Account' because it has a private identifier.
console.log(a["secret"], Object.keys(a)); // bracket access skips the check
// → s3 [ 'id', 'balance', 'secret' ]
```

## Pitfalls

- Thinking `private` protects data. It does not exist at runtime, and `a["secret"]` passes the checker too. Use `#` for real privacy.
- Using a parameter property in a field initializer with `target` ES2022+. `class A { constructor(public x: number) {} y = this.x * 2; }` errors (TS2729) on 7.0.2 and 5.9.3, and `new A(2).y` printed `NaN` when compiled for ES2022 but `4` for ES2021, because `useDefineForClassFields` is true from ES2022 and fields initialise before the constructor body.
- Forgetting that `protected` members widen to `public` in a subclass that redeclares them without a modifier (Handbook, "Exposure of protected members").
- Mixing up `override` errors: TS4114 (missing `override`) only appears with `noImplicitOverride`; a wrong `override` on a non-existent base member is TS4113 regardless.

## Follow-ups

**Q:** Do `private` members affect assignability?
**A:** Yes. Checked on both versions: `Q` to `P` fails with "Types have separate declarations of a private property 'v'", and `#v` gives a similar error. A structural `{ v: number }` target also rejects a class with `private v`.

**Q:** How do you do mixins?
**A:** A function that takes a constructor type and returns a class expression extending it, e.g. `Timestamped(User)`. Checked: instances have both `name` and `createdAt`. Mixins cannot declare `private`/`protected` members (Handbook); use `#` fields.
