---
title: "What are generics, and how do `extends` constraints work?"
status: draft
difficulty: medium
frequency: 5
core: true
tags: [generics, type-parameters, constraints, extends, defaults, keyof]
related:
  - typescript/inference-and-narrowing/how-inference-works
  - typescript/type-system-basics/structural-typing
  - typescript/generics/generic-inference
  - typescript/generics/keyof-typeof-indexed-access
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/2/generics.html
  - https://www.typescriptlang.org/docs/handbook/2/keyof-types.html
  - https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html
tldr: >
  A generic is a function, interface, class or type alias with type parameters, so one definition
  works over many types while keeping the relationship between input and output types.
  `T extends X` constrains what callers may pass and lets the body use `X`'s members. Defaults
  (`<T = unknown>`) make type arguments optional. Constraints are checked at the call site.
---

## Answer

A generic declares **type parameters** (`<T>`) that callers fill in, usually by inference. It exists to keep a relationship between types that `any` or a union would throw away: `identity<T>(x: T): T` says the result has the same type as the argument.

Generics apply to functions, interfaces, type aliases and classes. Per the handbook, classes are generic only over their **instance** side: `static` members cannot use the class's type parameter.

**Constraints.** Inside a body, an unconstrained `T` is opaque, so you can only do things valid for every type. `T extends HasLength` says "any type assignable to `HasLength`", and the body may use `.length`. `extends` here means *assignable to*, not inheritance. A constraint does two things:

- It restricts the call: arguments that do not satisfy it are errors at the call site.
- It gives the body something to work with: `T` is treated as its constraint for property access.

The result is still `T`, not the constraint. `longest("ab", "c")` returns `"ab" | "c"`, not `HasLength`. That is the reason to write `<T extends X>(a: T): T` rather than `(a: X): X`.

A constraint can refer to another type parameter. The classic form is `K extends keyof T`, which lets `pick(obj, "name")` accept only real keys and return `T[K]`.

**Defaults.** `<T = unknown>` makes the argument optional when it cannot be inferred or written. Required parameters cannot follow optional ones (error TS2706).

**Where it bites.** The constraint is a lower bound for the body but a caller can pick any subtype. In `function f<T extends string>(): T { return "x"; }`, `"x"` is not assignable to `T`, because `T` could be `"y"`. Reach for generics only when a type parameter appears at least twice (relates inputs to outputs); a parameter used once is usually just its constraint.

## Example

```ts
// TypeScript 7.0.2 and 5.9.3, --strict
interface HasLength { length: number }

function longest<T extends HasLength>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}
const nums = longest([1, 2], [3]); // number[]
const str = longest("ab", "c"); // "ab" | "c", not HasLength
longest(10, 20);
// Error TS2345: Argument of type 'number' is not assignable to parameter of type 'HasLength'.

function weak<T>(value: T) {
  return value.length;
  // Error TS2339: Property 'length' does not exist on type 'T'.
}

function pick<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
pick({ id: 1, name: "Ada" }, "name"); // string
pick({ id: 1 }, "age");
// Error TS2345: Argument of type '"age"' is not assignable to parameter of type '"id"'.

interface Result<TData = unknown, TError = Error> { data?: TData; error?: TError }
const loose: Result = {}; // TData = unknown
const typed: Result<string> = { data: "ok" }; // TError still defaults to Error
```

## Pitfalls

- Confusing a constraint with a parameter type. `(a: HasLength): HasLength` forgets the caller's type; `<T extends HasLength>(a: T): T` keeps it.
- Returning a fresh value typed as `T`. `function f<T extends string>(): T { return "x"; }` fails with TS2322 (`'string' is assignable to the constraint of type 'T', but 'T' could be instantiated with a different subtype of constraint 'string'`, checked on 7.0.2 and 5.9.3). The caller chooses `T`; the body cannot.
- Type parameters used once (`function f<T>(x: T): void`). They relate nothing; use the constraint or `unknown`.
- Assuming `extends` is inheritance. It is a structural assignability check, so object literals with extra properties and primitives like `string` can satisfy `{ length: number }`.

## Follow-ups

**Q:** When do I write the type argument explicitly?
**A:** When inference has no source (`new Map<string, number>()`, `useState<User | null>(null)`) or infers something too narrow or wide. Otherwise let it infer: TypeScript has no partial explicit inference, so supplying one argument means supplying all that lack defaults.

**Q:** Are generics kept at runtime?
**A:** No. Type parameters and arguments are erased on emit; there is no `T` to inspect or `new T()`.

## Deep dive

### How it works

At a call, the checker collects **inference candidates** for each type parameter from the arguments (details in the inference question), then checks the result against the constraint. If the best candidate violates the constraint, inference falls back to the constraint itself and the argument check then reports the error. That is why `longest(10, 20)` complains about `HasLength` and not about `T`.

Inside the body, `T` is a distinct opaque type whose **base constraint** is `HasLength` (`unknown` when none is written). Property access resolves through the base constraint (`a.length` works), but assignability to `T` does not: only values already typed `T` are assignable to it, which is the root of the `return "x"` error above. `T extends string` can be instantiated as the literal `"y"`, so a fresh `"x"` might be wrong.

A constraint can mention its own parameter (`T extends Comparable<T>`) and a later parameter can use an earlier one (`K extends keyof T`); defaults can too (`<A, B = A[]>`). All three compile on 7.0.2 and 5.9.3.

### Edge cases

- `T extends object` rejects primitives: `merge(1, {})` with `<A extends object, B extends object>` reports `number` is not assignable to `object` (checked on both versions).
- A string-like constraint keeps literal types in inferred results (`T` became `"ab" | "c"` above) instead of widening to `string`.
- Union order in printed errors can differ between compiler versions: `keyof { id; name }` printed as `"id" | "name"` on 7.0.2 and `"name" | "id"` on 5.9.3 in the same program. Do not depend on it.
- `class Box<T> { static make(x: T) }` is an error: static members cannot reference the class type parameter (error TS2302, checked on both versions).

### Trade-offs

Every extra type parameter is another thing callers see in error messages and hover text. Prefer the fewest parameters that express the relationships, put constraints on the parameter instead of on the argument type when the return type depends on it, and reach for overloads or conditional types only when a single generic signature cannot express the contract.

## Exercises

### Return the property type

Write `getValue` so that `getValue({ a: 1, b: "x" }, "b")` is typed `string` and an unknown key is rejected.

```ts
declare function getValue(obj: unknown, key: string): unknown;
```

**Answer:** `function getValue<T, K extends keyof T>(obj: T, key: K): T[K] { return obj[key]; }`. `K` is tied to `T`'s keys and the result is the indexed access `T[K]`.
