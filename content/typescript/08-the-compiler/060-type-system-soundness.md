---
title: "Is TypeScript's type system sound? Where does it not catch errors?"
status: draft
difficulty: hard
frequency: 3
core: false
tags: [soundness, any, type-assertions, array-covariance, method-bivariance, index-signatures, nouncheckedindexedaccess]
related:
  - typescript/type-system-basics/any-unknown-never
  - typescript/generics/variance
  - typescript/inference-and-narrowing/assertions-and-non-null
  - typescript/tsconfig-and-strictness/strict-mode-flags
  - typescript/the-compiler/type-erasure
verified: 2026-10
sources:
  - https://github.com/microsoft/TypeScript/wiki/TypeScript-Design-Goals
  - https://www.typescriptlang.org/docs/handbook/type-compatibility.html
  - https://github.com/microsoft/TypeScript/wiki/FAQ
  - https://github.com/microsoft/TypeScript/issues/9998
  - https://www.typescriptlang.org/tsconfig/#noUncheckedIndexedAccess
  - https://www.typescriptlang.org/tsconfig/#strictFunctionTypes
tldr: >
  No, by design: "apply a sound or provably correct type system" is a listed non-goal. Known
  holes include `any`, assertions, array covariance, method parameter bivariance, index signatures
  that omit `undefined`, and narrowings kept across function calls. Each compiled under `strict`
  and crashed at runtime; some have opt-in flags.
---

## Answer

No. The TypeScript Design Goals list "apply a sound or provably correct type system" as a **non-goal**: the aim is "a balance between correctness and productivity". The Handbook's compatibility page says the same, calling out places where the system allows operations it cannot prove safe, and explains the motivating cases.

The holes I would name, each of which compiled under `strict` and then failed at runtime:

- **`any`** switches checking off for a value, and anything assigns to or from it. `unknown` is the safe top type.
- **Type assertions** (`as`, `!`) are claims the compiler trusts. They are erased and never checked.
- **Array covariance.** `Dog[]` is assignable to `Animal[]`, so you can push a `Cat` through the wider alias. The same applies to mutable object properties.
- **Method parameter bivariance.** `strictFunctionTypes` checks function-typed properties contravariantly but not method declarations; the FAQ calls this "working as intended" because making methods strict breaks idiomatic patterns, including array covariance.
- **Index signatures and array indexing** type `obj[key]` as the value type without `undefined`. `noUncheckedIndexedAccess` adds it.
- **Narrowing across calls.** After `if (o.v !== null)`, a function call that nulls `o.v` does not undo the narrowing (the last case in my run: `Cannot read properties of null (reading 'length')`). Issue #9998 weighs assuming calls do nothing against assuming they reset every narrowing, and finds wrong results either way on real code.
- **Boundaries.** `JSON.parse`, third-party `any` and wrong `.d.ts` files inject unchecked data (see the type-erasure question).

Practical stance: treat TypeScript as a strong bug-catcher, not a proof. Close the cheap holes with `strict`, `noUncheckedIndexedAccess`, `unknown` over `any`, `readonly` arrays/parameters, function-typed properties for callbacks, and runtime validation at boundaries.

## Example

```ts
// TypeScript 7.0.2 and 5.9.3, strict: true. Both compiled with exit 0. Run on Node 24.19.0.
class Animal { name = "animal"; }
class Dog extends Animal { bark() { return "woof"; } }
class Cat extends Animal {}

const dogs: Dog[] = [new Dog()];
const animals: Animal[] = dogs;           // array covariance: allowed
animals.push(new Cat());                  // allowed: a Cat now sits in a Dog[]

const counts: Record<string, number> = {};
const n: number = counts.nope;            // index signature: no undefined in the type

interface Handler { onEvent(e: Animal): void }
const handler: Handler = { onEvent(e: Dog) { e.bark(); } }; // method bivariance

const forced = "text" as unknown as number; // assertion

const tryIt = (f: () => unknown) => {
  try { f(); } catch (e) { console.log((e as Error).message); }
};
tryIt(() => dogs[1]!.bark());          // → dogs[1].bark is not a function
tryIt(() => n.toFixed(1));             // → Cannot read properties of undefined (reading 'toFixed')
tryIt(() => handler.onEvent(new Cat())); // → e.bark is not a function
tryIt(() => forced.toFixed(1));        // → forced.toFixed is not a function
```

## Pitfalls

- Believing `strict` means sound. It closes some holes (`strictFunctionTypes`, `strictNullChecks`) and leaves the rest open; every line above passed it.
- Expecting `readonly` to protect an object from aliasing. On 7.0.2, `const wide: { id: string | number } = exact;` compiled when `exact` was `{ readonly id: string }`, and `wide.id = 42` was accepted. It is a compile-time marker on one view of the object.
- Switching a method to a property and assuming the callback type is now safe everywhere. It is checked contravariantly: `onEvent: (e: Animal) => void` assigned `(e: Dog) => void` gave `TS2322` on 7.0.2. But it does not fix covariance of the arrays or objects passed through it.
- Relying on `noUncheckedIndexedAccess` as a full fix. With it, line `const n: number = counts.nope` became `TS2322: Type 'number | undefined' is not assignable to type 'number'`, but the FAQ calls it a "big hammer" that cannot detect provably in-bounds access.

## Follow-ups

**Q:** Which of these can a flag fix?
**A:** `noUncheckedIndexedAccess` for index access; function-typed properties (under `strictFunctionTypes`) for callbacks; `readonly Animal[]` for array aliasing, since `ro.push(new Cat())` gave TS2339 on 7.0.2. None exists for `any` or assertions; lint rules cover those.

**Q:** Is unsoundness a bug to be fixed in a future version?
**A:** For these cases the maintainers treat it as a design trade-off. The FAQ lists method bivariance as working as intended, and its entry explains why a strict-methods flag is not tractable.

## Exercises

### Spot the hole

```ts
function first(xs: string[]): string {
  return xs[0];
}
console.log(first([]).toUpperCase());
```

Does this compile under `strict`, and what is the one-flag fix?

**Answer:** It compiles (the index type is `string`) and throws a `TypeError` at runtime. With `noUncheckedIndexedAccess`, `return xs[0]` is `TS2322: Type 'string | undefined' is not assignable to type 'string'`, forcing a handled `undefined`. Compiled with exit 0 on 7.0.2 and threw `TypeError: Cannot read properties of undefined (reading 'toUpperCase')` on Node 24.19.0; the flag produced the `TS2322` quoted above.
