---
title: "What are literal types, and what does `as const` do?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [literal-types, widening, const-assertions, as-const, unique-symbol]
related:
  - typescript/type-system-basics/any-unknown-never
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-7.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html
tldr: >
  A literal type is a type with exactly one value, like "GET" or 42. Inference keeps the literal
  for `const` bindings but widens it to `string`/`number` where the value could change (`let`,
  object properties). `as const` suppresses widening and makes object and array literals
  readonly, with no runtime effect.
---

## Answer

A **literal type** has exactly one value: `"GET"`, `42`, `true`. On their own they are rarely useful; in a union (`"GET" | "POST"`) they model a closed set of options the compiler can check.

**Widening.** When TypeScript infers a type from a literal, it decides whether the binding could later hold a different value:

- `const method = "GET"` has type `"GET"`: it can never change.
- `let method = "GET"` has type `string`: it can be reassigned, so the literal is widened.
- Properties of an object literal are mutable, so `{ method: "GET" }` has `method: string`. This is the classic bug: passing `req.method` to a parameter typed `"GET" | "POST"` fails.

**`as const`** (a *const assertion*, TS 3.4) asks for the narrowest type: literals are not widened, object literal properties become `readonly`, and array literals become `readonly` tuples. It applies only directly to literal expressions (or enum members), and it only affects types: it emits no code and doesn't freeze anything, and nested values you reference from outside can still be mutated.

**Common uses:**

- Keeping a config object's literal values.
- Deriving a union from a list: `(typeof dirs)[number]` gives `"up" | "down"`.
- An enum-like object whose values form a union.

**Related tools:**

- `satisfies` (TS 4.9) checks a value against a type without widening it; `as const satisfies T` combines both.
- `<const T>` type parameters (TS 5.0) infer literal types for arguments written inline.
- `unique symbol` (TS 2.7): the type of a `const` symbol, distinct from `symbol` and from every other unique symbol.

## Example

```ts
// TypeScript 7.0.2, --strict
type Method = "GET" | "POST";
declare function request(url: string, method: Method): void;

const a = "GET"; // type "GET"
let b = "GET"; // type string: b can change, so the literal widens
request("/x", a); // OK
request("/x", b);
// Error TS2345: Argument of type 'string' is not assignable to parameter of type 'Method'.

const req = { url: "/x", method: "GET" }; // { url: string; method: string }
request(req.url, req.method);
// Error TS2345: Argument of type 'string' is not assignable to parameter of type 'Method'.

const frozen = { url: "/x", method: "GET" } as const;
// { readonly url: "/x"; readonly method: "GET" }
request(frozen.url, frozen.method); // OK
frozen.method = "POST";
// Error TS2540: Cannot assign to 'method' because it is a read-only property.

const dirs = ["up", "down"] as const; // readonly ["up", "down"]
type Dir = (typeof dirs)[number]; // "up" | "down"
dirs.push("left");
// Error TS2339: Property 'push' does not exist on type 'readonly ["up", "down"]'.
```

## Pitfalls

- Thinking `as const` makes data immutable at runtime. It is erased, and `Object.isFrozen` on the result is `false`. Use `Object.freeze` if you need that, and it is shallow.
- Applying `as const` to an expression: `(Math.random() ? "a" : "b") as const` fails with `TS1355: A 'const' assertion can only be applied to references to enum members, or string, number, boolean, array, or object literals.`
- Passing a `readonly` tuple to a function that takes `string[]`. TypeScript reports `TS4104: The type 'readonly ["up", "down"]' is 'readonly' and cannot be assigned to the mutable type 'string[]'`; type the parameter `readonly string[]`.
- Using `as "GET"` on a single property as a fix everywhere. It works, but it is an assertion: if the value isn't `"GET"`, nothing complains.

## Follow-ups

**Q:** What is the difference between `as const` and `satisfies`?
**A:** `satisfies T` checks the value against `T` and keeps its inferred type; it doesn't add `readonly` or stop widening. `as const` changes the inferred type to the narrowest one. `{ a: 1 } as const satisfies Record<string, number>` gives `{ readonly a: 1 }` and also validates it.

**Q:** How do you get literals from a generic function without `as const` at the call site?
**A:** A `const` type parameter (TS 5.0): `function f<const T>(x: T)`. It only affects literals written inline in the call, and with a mutable constraint like `string[]` it won't infer a readonly tuple.
