---
title: "What are `const` type parameters and `NoInfer`?"
status: draft
difficulty: hard
frequency: 2
core: false
tags: [generics, const-type-parameters, noinfer, inference, as-const]
related:
  - typescript/generics/generic-inference
  - typescript/type-system-basics/literal-types-as-const
  - typescript/inference-and-narrowing/satisfies-operator
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-4.html
  - https://github.com/microsoft/TypeScript/pull/51865
  - https://github.com/microsoft/TypeScript/pull/56794
tldr: >
  `<const T>` (TS 5.0) makes literals written in a call infer as if `as const` was applied, so
  callers need not add it. `NoInfer<T>` (TS 5.4) marks a position that must not contribute
  inference candidates, so one argument can be the source of truth and the other is only checked
  against it.
---

## Answer

Both are tools for steering inference of a type parameter.

**`const` type parameters (TS 5.0).** By default an object or array literal argument widens (`{ role: "admin" }` infers `{ role: string }`), so API authors told callers to write `as const`. A `const` modifier on the type parameter (`function f<const T>(x: T)`) makes the literal expressions in the argument get the most precise type, like `as const`: literals, `readonly` properties, `readonly` tuples.

Rules from the PR and release notes:

- Allowed on type parameters of functions, methods and classes; an error on interfaces and type aliases (TS1277).
- It only affects literals written directly in the call. A variable argument is untouched: `names(list)` stays `string[]`.
- If the constraint is a **mutable** array type (`T extends string[]`), the readonly tuple candidate fails the constraint. The 5.0 notes say inference falls back to `string[]`, so write `readonly string[]`. Version note: in my runs 5.0.4 gave `string[]` for that mutable case but 5.9.3 and 7.0.2 gave `["a", "b"]`, so behaviour changed after 5.0; the `readonly` constraint gives the same precise result everywhere and is the portable form.

**`NoInfer<T>` (TS 5.4).** Wrapping a type in `NoInfer` blocks inference *to* that position; it is otherwise identical to `T` (the PR says the two are the same type outside inference). In `light<C extends string>(colors: C[], fallback?: C)` a stray `"blue"` becomes another candidate and widens `C`, so the call is accepted. With `fallback?: NoInfer<C>`, only `colors` supplies candidates and `"blue"` is checked against them and rejected.

The alternative before 5.4 was a second type parameter `D extends C`, which the notes call a smell: a parameter used once.

## Example

```ts
// TypeScript 7.0.2 and 5.9.3, --strict
declare function plain<T>(x: T): T;
declare function konst<const T>(x: T): T;
declare function names<const T extends readonly string[]>(xs: T): T;

const a = plain({ role: "admin", tags: ["x"] }); // { role: string; tags: string[] }
const b = konst({ role: "admin", tags: ["x"] }); // { readonly role: "admin"; readonly tags: readonly ["x"] }
const c = names(["a", "b"]); // readonly ["a", "b"]
const list = ["a", "b"];
const d = names(list); // string[]: `const` only affects literals written in the call

interface Box<const T> { value: T }
// Error TS1277: 'const' modifier can only appear on a type parameter of a function, method or class

declare function light<C extends string>(colors: C[], fallback?: C): C;
const e = light(["red", "green"], "blue"); // "red" | "green" | "blue" (member order varies by version)
declare function strictLight<C extends string>(colors: C[], fallback?: NoInfer<C>): C;
strictLight(["red", "green"], "blue");
// Error TS2345: Argument of type '"blue"' is not assignable to parameter of type '"green" | "red" | undefined'.
declare function pair<T>(a: T, b: NoInfer<T>): T;
pair("a", "b");
// Error TS2345: Argument of type '"b"' is not assignable to parameter of type '"a"'.
```

## Pitfalls

- A mutable array constraint with `const T`. `T extends string[]` loses the precision on older compilers (5.0.4 gave `string[]`); use `readonly string[]`.
- Expecting `const` to freeze existing variables. `const list = ["a", "b"]; names(list)` is `string[]`.
- Putting `NoInfer` on the position you want to infer from. It blocks candidates there; mark only the dependent positions.
- Using `NoInfer` below 5.4: on 5.3.3 it is `Cannot find name 'NoInfer'` (TS2304).

## Follow-ups

**Q:** Is `const T` the same as `T extends Readonly<...>`?
**A:** No. A constraint restricts what is accepted; `const` changes how the literal argument is typed. They are usually combined: `const T extends readonly unknown[]`.

**Q:** Does `NoInfer` change the type at runtime or in assignability?
**A:** No. It is erased and, per the PR, `T` and `NoInfer<T>` are identical outside of inference.
