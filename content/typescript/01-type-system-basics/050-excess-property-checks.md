---
title: "Why does TypeScript report an error on an object literal but not on a variable with the same shape?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [excess-property-checks, fresh-object-literals, weak-types, optional-properties, readonly, index-signatures, exactoptionalpropertytypes]
related:
  - typescript/type-system-basics/structural-typing
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/2/objects.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-4.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-4.html
  - https://www.typescriptlang.org/tsconfig/#exactOptionalPropertyTypes
  - https://www.typescriptlang.org/tsconfig/#noUncheckedIndexedAccess
tldr: >
  Assignability allows extra properties, so a variable with extra members is accepted. But an
  object literal written directly at the assignment is "fresh", and TypeScript checks it for
  properties the target doesn't declare, because there it is almost certainly a typo. Freshness
  is lost once the literal is stored in a variable.
---

## Answer

TypeScript is structural, so a value with extra properties is assignable to a type that needs fewer. That would hide typos in options objects, so the handbook describes an extra rule: **excess property checking**. Object literals get special treatment when assigned to a variable or passed as an argument: if the literal has any property the target type doesn't have, it's an error.

The check applies only to a **fresh** object literal, the expression written at that spot. Storing it in a variable first, spreading it, or asserting it to a type removes freshness, and only ordinary structural assignability applies.

Two related rules to know:

- **Weak types** (TS 2.4). A type whose properties are all optional rejects anything that shares no properties with it, even from a variable. `{ colour: "red" }` has nothing in common with `{ color?: string; width?: number }`, so this is an error without a literal at all.
- **Where the check does not apply.** Spread members aren't checked, and a union target without a discriminant rejects only properties that no member declares. With a discriminant, TypeScript picks the matching member and checks against it.

**Fixing it:** correct the typo; if the extra property is legitimate, add it to the type, or add an index signature (`[key: string]: unknown`). The handbook says if you're hitting this on option bags, revise the declarations instead of silencing the check. An `as Options` assertion bypasses it but also hides real mistakes.

**Neighbouring object-type features:** `?` makes a property optional (`T | undefined` when read); `readonly` blocks assignment at compile time only; an index signature declares a value type for unknown keys. `exactOptionalPropertyTypes` (TS 4.4, not in `strict`) distinguishes an absent property from one set to `undefined`.

## Example

```ts
// TypeScript 7.0.2, --strict
interface Options { color?: string; width?: number }
declare function paint(options: Options): void;

paint({ colour: "red", width: 1 });
// Error TS2561: Object literal may only specify known properties, but 'colour' does not exist in type 'Options'. Did you mean to write 'color'?

const opts = { colour: "red", width: 1 };
paint(opts); // OK: not fresh, and it shares `width` with Options

const typo = { colour: "red" };
paint(typo);
// Error TS2559: Type '{ colour: string; }' has no properties in common with type 'Options'.

paint({ colour: "red", width: 1 } as Options); // OK: assertion bypasses the check

type Shape = { kind: "a"; a: number } | { kind: "b"; b: number };
const shape: Shape = { kind: "a", a: 1, b: 2 };
// Error TS2353: Object literal may only specify known properties, and 'b' does not exist in type '{ kind: "a"; a: number; }'.
```

## Pitfalls

- Assuming the check runs on every assignment. It runs only on fresh literals, so extracting the literal to a `const` makes the same typo compile (unless the weak-type rule fires).
- Silencing it with `as T` or `[key: string]: any` and losing typo detection for the whole type. Fix the type or the typo instead.
- Expecting excess property checks on spread results. `const o: Options = { width: 1, ...{ colour: "x" } }` compiles, because the spread's members aren't checked.
- Thinking `readonly` freezes values. The handbook says it doesn't change runtime behaviour, and it doesn't make nested contents immutable.

## Follow-ups

**Q:** What does `exactOptionalPropertyTypes` change?
**A:** Without it, `theme?: "dark"` also accepts an explicit `undefined`. With it, that assignment fails (`TS2412` for a property write, `TS2375` for a whole object). The distinction matters at runtime: `{ ...{ theme: "dark" }, ...{ theme: undefined } }` yields `{ theme: undefined }` (Node 24.19).

**Q:** What does `noUncheckedIndexedAccess` add for index signatures?
**A:** Reading an undeclared key through an index signature gives `T | undefined` instead of `T`. Without it, `d.nope` on `{ [k: string]: number }` is typed `number` even if absent. It is not part of `strict`.
