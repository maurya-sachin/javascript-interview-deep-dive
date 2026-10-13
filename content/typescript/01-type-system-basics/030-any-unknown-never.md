---
title: "What is the difference between `any`, `unknown`, and `never`?"
status: draft
difficulty: medium
frequency: 5
core: true
tags: [any, unknown, never, top-type, bottom-type, exhaustiveness, narrowing]
related:
  - typescript/type-system-basics/structural-typing
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#any
  - https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown
  - https://www.typescriptlang.org/docs/handbook/2/narrowing.html#the-never-type
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-0.html
  - https://www.typescriptlang.org/tsconfig/#noImplicitAny
  - https://www.typescriptlang.org/tsconfig/#useUnknownInCatchVariables
tldr: >
  `any` turns type checking off and is assignable to and from almost everything. `unknown` is
  the safe top type: anything goes in, nothing comes out until you narrow. `never` is the
  bottom type: no value exists, so it is assignable to everything and nothing (but `never`) is
  assignable to it, which powers exhaustiveness checks.
---

## Answer

Think of a type as a set of values.

- **`unknown`** is the set of all values, the **top type**. Anything is assignable to it, but a value of type `unknown` can't be used (property access, call, arithmetic) or assigned to anything except `unknown` and `any` until you narrow it with `typeof`, `instanceof`, a type guard, or an assertion. Use it for data whose shape you don't control: parsed JSON and `catch` variables.
- **`any`** is an opt-out from type checking, not a set. Anything is assignable to it, it is assignable to everything except `never`, and every operation on it is allowed. The handbook says it assumes you know the environment better than TypeScript. It spreads: a value derived from `any` is usually `any`. Legitimate uses are migrations and genuinely untyped boundaries.
- **`never`** is the empty set, the **bottom type**: no value exists. It is assignable to every type; nothing but `never` is assignable to it, not even `any`. It appears as the return type of functions that never return normally, when narrowing eliminates every union member, and from impossible intersections.

How they combine:

- `unknown | T` is `unknown`; `unknown & T` is `T`.
- `T | never` is `T`; `T & never` is `never`.
- `any` absorbs: `any | T` and `any & T` are `any`.

**Rules of thumb:** prefer `unknown` over `any` for untrusted input and narrow at the boundary; use `never` in a `default` branch to make adding a union member a compile error; treat every `any` as a hole where compiler help ends. `noImplicitAny` stops silent `any`s; `useUnknownInCatchVariables` (part of `strict`) makes `catch (e)` give `unknown`.

## Example

```ts
// TypeScript 7.0.2, --strict
declare const loose: any;
declare const safe: unknown;

loose.anything.goes(); // OK: checking is off
const n: number = loose; // OK: any is assignable to everything except never
safe.toFixed();
// Error TS18046: 'safe' is of type 'unknown'.
const m: number = safe;
// Error TS2322: Type 'unknown' is not assignable to type 'number'.
if (typeof safe === "number") safe.toFixed(); // OK: narrowed to number
const impossible: never = loose;
// Error TS2322: Type 'any' is not assignable to type 'never'.

type Shape =
  | { kind: "circle"; r: number }
  | { kind: "square"; s: number }
  | { kind: "tri"; b: number };
function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle": return Math.PI * shape.r ** 2;
    case "square": return shape.s ** 2;
    default: {
      const unreachable: never = shape;
      // Error TS2322: Type '{ kind: "tri"; b: number; }' is not assignable to type 'never'.
      return unreachable;
    }
  }
}
```

## Pitfalls

- Using `any` "just for now." It disables checking for everything it touches, including values derived from it, and nothing flags it later. `JSON.parse` and `Response.json()` return `any`; assigning that to a typed variable is an unchecked cast.
- Assuming a null check makes `unknown` usable. Both `x !== null && x !== undefined` and `if (x)` narrow it only to `{}`, which still isn't assignable to `number`; you need `typeof` or a guard.
- Reaching for `as T` on an `unknown` instead of narrowing. It compiles and carries no runtime guarantee.
- Believing a function that throws is always `never`. Only an arrow/function *expression* with no return paths infers `never`; a function *declaration* that throws is inferred `void` (checked on 7.0.2). Annotate `: never` when it matters.

## Follow-ups

**Q:** Why isn't `any` assignable to `never`?
**A:** `never` means no value can exist there. `any` could be anything, so letting it through would make `never` unsound. The compiler reports `Type 'any' is not assignable to type 'never'`.

**Q:** How is `unknown` different from `{}` or `object`?
**A:** `{}` excludes `null` and `undefined`; `object` excludes primitives too. `unknown` includes everything. A narrowing check that rules out `null` and `undefined` takes `unknown` to `{}`.

## Deep dive

### How it works

The three form the extremes of assignability. `unknown` sits above every type (TS 3.0 release notes: anything is assignable to it; it's assignable only to `unknown` and `any`). `never` sits below every type (handbook: assignable to every type; nothing is assignable to it except `never`). `any` is deliberately outside the lattice: it is allowed in both directions, except into `never`.

Narrowing is how `unknown` becomes useful. `typeof x === "string"` narrows to `string`; `x instanceof Error` to `Error`; a user-defined guard (`x is Foo`) to `Foo`. The `never` type arises from narrowing too: when every constituent of a union has been ruled out, what's left is `never`. That is why assigning the leftover to a `never` variable proves exhaustiveness, and why adding a member to the union breaks the build at that line.

### Edge cases

- **Absorption.** `type T1 = unknown | string` is `unknown`; `type T3 = unknown & string` is `string`, so `const t: T3 = 1` fails with `Type 'number' is not assignable to type 'string'`; `any & string` is `any`, so `1` is accepted. All verified on 7.0.2.
- **Inferred return type.** `export function declared() { throw ... }` is emitted as `(): void`, but `export const expr = () => { throw ... }` as `() => never`. A call to a function with an explicit `: never` return type ends control flow, so `function g(n: number): number { if (n > 0) return n; fail("neg"); }` compiles. The same with an unannotated `const fail = () => { throw ... }` fails with `TS2366: Function lacks ending return statement and return type does not include 'undefined'`.
- **`catch`.** Under `strict`, `catch (e)` gives `unknown`: `e.message` fails with `'e' is of type 'unknown'`. Turn the flag off and it's `any`.
- **Implicit `any`.** An unannotated parameter with no contextual type is `any` unless `noImplicitAny` reports it (`Parameter 's' implicitly has an 'any' type`, per the TSConfig reference).

### Real-world scenario

Reading a config file. `JSON.parse` returns `any`; accept it as `unknown` immediately and narrow before use, so one validation point guards every later access:

```ts
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readPort(raw: unknown): number {
  if (!isRecord(raw) || typeof raw.port !== "number") {
    throw new TypeError("config.port must be a number");
  }
  return raw.port;
}

console.log(readPort(JSON.parse('{"port":8080}'))); // → 8080
try {
  readPort(JSON.parse('{"port":"80"}'));
} catch (error) {
  console.log(error instanceof Error ? error.message : error); // → config.port must be a number
}
```

Type-checked with `--strict` and run on Node 24.19 (`node file.mts`), the output is as shown. For larger shapes, a schema validator replaces the hand-written guard; the principle (parse into `unknown`, validate once, then trust) stays the same.

### Trade-offs

`any` costs nothing to write and defeats the compiler downstream; `unknown` costs a guard at the boundary and keeps every later use checked. Use `any` when a precise type is impractical and the blast radius is local (migrating a file, a test double), and comment why. The `never` default branch costs one line and turns "forgot a case" from a runtime bug into a compile error, but it only works if the switch subject is a union that narrows by that check.
