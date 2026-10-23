---
title: "What do `as`, `!`, and `!:` actually do, and when are they safe?"
status: draft
difficulty: easy
frequency: 4
core: false
tags: [type-assertions, non-null-assertion, definite-assignment, as, strictpropertyinitialization]
related:
  - typescript/inference-and-narrowing/custom-type-guards
  - typescript/inference-and-narrowing/satisfies-operator
  - typescript/type-system-basics/any-unknown-never
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions
  - https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#non-null-assertion-operator-postfix-
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-7.html#definite-assignment-assertions
  - https://www.typescriptlang.org/tsconfig/#strictPropertyInitialization
tldr: >
  All three are compile-time claims the compiler trusts and erases: `x as T` overrides a type
  (only between overlapping types), `x!` removes `null` and `undefined`, and `let x!: T` /
  `prop!: T` says it will be assigned before use. None adds a runtime check. They are safe only
  when something the compiler can't see guarantees them.
---

## Answer

All three are **assertions**: you tell the compiler something it cannot verify, and it believes you. They are removed from the emitted JavaScript. Nothing is checked at runtime, so a wrong assertion becomes a runtime error somewhere else.

- **`value as T`** (or `<T>value`, not allowed in `.tsx`): treats `value` as `T`. TypeScript only allows it when the types sufficiently overlap (the handbook: a more or less specific version of the type), so `"hello" as number` is rejected (TS2352). To bypass, go through `unknown` or `any`: `x as unknown as T`, the *double assertion*. That deliberately gives up all checking.
- **`value!`** (non-null assertion): removes `null` and `undefined` from the type. It only changes the type, so `maybe!.length` throws if `maybe` is `undefined`.
- **`let x!: T` / `prop!: T`** (definite assignment assertion, TS 2.7): suppresses "used before being assigned" (TS2454) or, on a class field, `strictPropertyInitialization` (TS2564). The 2.7 release notes call it the dual of `!`: one postfixes declarations, the other expressions.

**When they are safe:**

- `as` that **widens** (`dog as Animal`) is always safe. `as` that **narrows** is a claim. It is reasonable right after a check the compiler can't model, for example a DOM lookup in a page you control, or data you have already validated.
- `!` is safe when an invariant guarantees presence: a map entry just inserted, a ref set in a lifecycle hook, test code.
- `!:` is reasonable for fields initialized by a framework (dependency injection, a lifecycle method) after the constructor.

**Prefer** an alternative when one exists: a type guard or assertion function (the claim gets checked), `?.`/`??` or an early `throw` instead of `!`, `satisfies` instead of `as` for object literals, and `unknown` plus narrowing for external data.

## Example

```ts
// TypeScript 7.0.2 and 6.0.3, --strict; runs on Node 24 (type stripping)
const raw: unknown = JSON.parse('{"port":"8080"}');
const config = raw as { port: number }; // compiles: nothing is checked at runtime
try {
  config.port.toFixed(0);
} catch (error) {
  console.log((error as Error).constructor.name); // → TypeError
}

const bad = "hello" as number;
// Error TS2352: Conversion of type 'string' to type 'number' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
const forced = "hello" as unknown as number; // OK: double assertion, now unchecked

const found = ["a"].find((item) => item === "b"); // string | undefined
function readLength(): number {
  return found!.length; // OK: `!` removes undefined from the type only
}
try {
  readLength();
} catch (error) {
  console.log((error as Error).constructor.name); // → TypeError
}

let early: number;
function setEarly() { early = 1; }
setEarly();
console.log(early);
// Error TS2454: Variable 'early' is used before being assigned.
let late!: number; // definite assignment assertion: the compiler stops checking
console.log(late); // → undefined
```

## Pitfalls

- Using `as` on parsed or fetched data (`JSON.parse(...) as Config`). It compiles with any input, as the example's `port: "8080"` shows. Validate, or use a guard.
- Silencing a real "possibly undefined" with `!` instead of handling it. `!` is not a null check; it is the absence of one.
- Assuming `as` checks completeness. `{ a: 1 } as { a: number; b: string }` compiles (checked on 7.0.2 and 6.0.3), because the target is a subtype of the source.
- Adding `!:` to hide a field that really is optional. Declare `prop?: T` or `prop: T | undefined` so callers must handle absence.

## Follow-ups

**Q:** What is the difference between `x as T` and `x satisfies T`?
**A:** `as` changes the type to `T` (when types overlap). `satisfies` checks the value is assignable to `T` and keeps its own type. Prefer `satisfies` when you only want validation.

**Q:** Does `prop!: string` change the emitted JavaScript?
**A:** The `!` itself is erased, but the field declaration is not. With `target: es2022`, TS 7.0.2 and 6.0.3 emitted `b;` for `class A { b!: string }`, which defines the field as `undefined`. `declare b: string` emitted no field, and so did `useDefineForClassFields: false` (both checked on 7.0.2 and 6.0.3).
