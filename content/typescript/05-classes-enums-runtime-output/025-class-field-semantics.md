---
title: "How do `useDefineForClassFields`, `declare` fields, and `static` blocks change class fields?"
status: draft
difficulty: hard
frequency: 3
core: false
tags: [class-fields, usedefineforclassfields, declare, static-blocks, define-semantics, target]
related:
  - typescript/classes-enums-runtime-output/class-members-access
  - typescript/tsconfig-and-strictness/target-lib-module
  - typescript/classes-enums-runtime-output/decorators
  - typescript/the-compiler/node-type-stripping
verified: 2026-10
perishable:
  - "TS 6.0 default target is es2025, so define semantics by default"
sources:
  - https://www.typescriptlang.org/tsconfig/#useDefineForClassFields
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#the-usedefineforclassfields-flag-and-the-declare-property-modifier
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-0.html#properties-overriding-accessors-and-vice-versa-is-an-error
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-4.html#static-blocks-in-classes
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html#simple-default-changes
  - https://tc39.es/ecma262/#sec-definefield
  - https://tc39.es/ecma262/#sec-initializeinstanceelements
  - https://tc39.es/ecma262/#sec-runtime-semantics-classstaticblockdefinitionevaluation
  - https://github.com/tc39/proposals/blob/main/finished-proposals.md
tldr: >
  Standard class fields are defined on the instance like `Object.defineProperty`, not assigned, so a
  redeclared field resets a base value to `undefined` and a field shadows an inherited setter.
  `useDefineForClassFields` picks define (default from ES2022) or legacy assignment. `declare`
  fields are type-only and emit nothing. `static {}` blocks run once when the class is evaluated.
---

## Answer

**Define, not assign.** ES2022 class fields go through ECMA-262's `DefineField`, which calls `CreateDataPropertyOrThrow` on the instance (static fields: on the constructor). A derived class does this right after `super()` returns, a base class before its constructor body. TypeScript's original emit assigned instead (`this.x = 1` in the constructor), which runs inherited setters and skips fields without initializers.

`useDefineForClassFields` chooses. `true` keeps native fields (or emits `Object.defineProperty` below ES2022); `false` emits assignments. It defaults to `true` when `target` is ES2022 or later, and since the TS 6.0 default `target` is es2025, define semantics are the default on 6.0.3 and 7.0.2 (checked by emit). Node's type stripping keeps fields as written, so it always defines.

**What define changes.**
- A subclass that redeclares a base property, `data!: User`, now defines `data = undefined` after `super()`, wiping what the base constructor stored. TypeScript reports TS2612, only under define.
- A field over an inherited accessor creates an own data property, so the setter never runs. TS2610 (and TS2611 for the reverse) has been reported regardless of the flag since 4.0.

**`declare` fields (TS 3.7).** `declare data: User` refines a property's type with no emit and no runtime property. Use it to narrow a base property, or for a property something else creates (a base constructor, `Object.assign`). It cannot have an initializer (TS1039) or be `#private` (TS18019).

**`static` blocks (ES2022, TS 4.4).** `static { ... }` runs once during class evaluation, interleaved in source order with static field initializers, with `this` bound to the class and access to its `#private` names. Use it for multi-statement setup, `try`/`catch`, or computed tables. Below ES2022 it is emitted as an IIFE after the class.

## Example

```ts
// TypeScript 7.0.2 and 6.0.3, --strict --target es2022 (useDefineForClassFields on); Node 24.19
class Model {
  data: unknown;
  constructor(data: unknown) { this.data = data; }
}
class Broken extends Model { data!: { name: string }; }
// Error TS2612: Property 'data' will overwrite the base property in 'Model'. ...add a 'declare' modifier...
class User extends Model { declare data: { name: string }; } // narrows the type, emits nothing

console.log(new Broken({ name: "Ada" }).data); // → undefined
console.log(new User({ name: "Ada" }).data);   // → { name: 'Ada' }

class Logger { set level(v: string) { console.log("setter ran:", v); } }
class Quiet extends Logger { level = "warn"; }
// Error TS2610: 'level' is defined as an accessor in class 'Logger', but is overridden here in 'Quiet' as an instance property.
// The field is defined on the instance, so the inherited setter never runs:
console.log(Object.hasOwn(new Quiet(), "level")); // → true

class Registry {
  static #ids = new Map<string, number>();
  static { // runs once at class evaluation, in source order, and can reach #ids
    for (const [i, key] of ["a", "b"].entries()) Registry.#ids.set(key, i);
  }
  static idOf(key: string) { return Registry.#ids.get(key); }
}
console.log(Registry.idOf("b")); // → 1
```

## Pitfalls

- Treating `target` as syntax-only. The same file compiled with `--target es2021` printed `{ name: 'Ada' }` for `Broken`, ran the setter (`setter ran: warn`) and gave `false` for `hasOwn`: raising the target flips the flag and changes behaviour.
- Silencing TS2612 with `!`. Definite assignment only affects checking; under define the field is still emitted. Use `declare`.
- Setting `useDefineForClassFields: false` to make errors go away. Your `tsc` output then differs from native classes and from tools that keep fields as written, such as Node's type stripping.
- Expecting subclass fields inside a base constructor. A base constructor that calls an overridden method sees `this.label` as `undefined` in both modes, because subclass fields initialise only after `super()` returns.

## Follow-ups

**Q:** What does `useDefineForClassFields: false` emit for static fields at `--target es2022`?
**A:** On both versions, instance fields became `this.x = 1` in the constructor and `static y = 2` became `static { this.y = 2; }`: a static block that assigns rather than defines.

**Q:** Is a `declare` field visible at runtime?
**A:** No. It is erased like any annotation, so `Object.hasOwn(obj, "data")` depends only on what the constructor or other code did. It is erasable syntax, so Node's type stripping accepts it (checked on Node 24.19).

**Q:** When would you use a static block over a static field initializer?
**A:** When initialisation needs statements: loops, `try`/`catch`, several related statics computed together, or giving an outside function access to a `#private` name, since the block runs inside the class's private scope.

## Exercises

### Predict the output

```ts
// --target es2022, then --target es2021
class Base { constructor() { this.describe(); } describe() {} }
class Child extends Base {
  label = "child";
  describe() { console.log("label is", this.label); }
}
new Child();
```

**Answer:** `label is undefined` for both targets. Under either flag value, `Child`'s field is created after `Base`'s constructor finishes, and `describe` runs inside it.

### Which line errors, and why?

```ts
class A { declare x: number = 1; }
class B { declare #y: number; }
```

**Answer:** Both, on 6.0.3 and 7.0.2. `A` is TS1039 ("Initializers are not allowed in ambient contexts"), because `declare` emits nothing so there is nowhere to put `= 1`. `B` is TS18019 ("'declare' modifier cannot be used with a private identifier"): a `#` name exists only if the class really defines it.
