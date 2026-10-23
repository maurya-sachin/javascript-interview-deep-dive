---
title: "How does TypeScript infer types, and when should you annotate explicitly?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [inference, contextual-typing, best-common-type, widening, annotations, noimplicitany]
related:
  - typescript/type-system-basics/literal-types-as-const
  - typescript/type-system-basics/function-types-overloads
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/type-inference.html
  - https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-inference
  - https://www.typescriptlang.org/tsconfig/#noImplicitAny
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html#isolated-declarations
tldr: >
  TypeScript infers types from initializers, defaults and return statements, and from
  location (contextual typing) for callbacks. Mutable positions widen literals (`let`, object
  properties become `string`); `const` keeps them. Annotate where inference has no source: empty
  collections, unannotated parameters, and exported API boundaries.
---

## Answer

Inference gives a type to anything without an annotation. The handbook lists where it happens: variable and member initializers, parameter defaults, and function return types. It runs in two directions.

- **Bottom-up.** The type comes from the expression. `let n = 3` is `number`; `const c = 3` is the literal `3`. For `[0, 1, null]` the checker takes the candidate types and picks the one compatible with the others, or falls back to a union: `(number | null)[]`. It does not invent a shared supertype, so `[new Rhino(), new Elephant()]` is an array of the union, not `Animal[]`.
- **Top-down (contextual typing).** The type comes from the position. The parameter of a callback passed to `[1, 2, 3].map(...)` is `number` because `map` declares it. The contextual type also keeps literals alive, so `draw({ kind: "circle" })` checks when `draw` expects `"circle"`.

**Widening** is the rule that surprises people. A mutable location (`let`, an object property) could be reassigned, so a literal initializer widens to its base type: `{ kind: "circle" }` stored in a variable has `kind: string`, and passing that variable to `draw` fails. A `const` binding keeps the literal; `as const` freezes a whole object literal.

**Where to annotate:**

- Exported functions and public APIs: annotate the return type so a change in the body can't silently change the contract (and `isolatedDeclarations`, TS 5.5, requires it).
- Unannotated parameters with no contextual type: they are `any`, which `noImplicitAny` (part of `strict`) reports.
- Empty collections and `new Map()` with no arguments: there is nothing to infer from, so you get `any`-flavored types.
- When you want a wider type than the initializer gives (`const xs: Animal[] = [...]`).

Elsewhere, leave annotations off. Local variables and callbacks read better, and stay correct under refactoring, when inferred.

## Example

```ts
// TypeScript 7.0.2 and 6.0.3, --strict
declare function draw(shape: { kind: "circle"; r: number }): void;

const circle = { kind: "circle", r: 1 };
draw(circle);
// Error TS2345: Argument of type '{ kind: string; r: number; }' is not assignable to parameter of type '{ kind: "circle"; r: number; }'.
draw({ kind: "circle", r: 1 }); // OK: the parameter type is the context
draw({ kind: "circle", r: 1 } as const); // OK: literal types are kept

const doubled = [1, 2, 3].map((x) => x * 2); // x: number, doubled: number[]
const echo = function (value) { return value; };
// Error TS7006: Parameter 'value' implicitly has an 'any' type.

const ids = [];
ids.push(1);
const first: string = ids[0];
// Error TS2322: Type 'number' is not assignable to type 'string'.
const cache = new Map();
const hit: string = cache.get("a"); // OK: cache is Map<any, any>
const typed = new Map<string, number>();
const miss: string = typed.get("a");
// Error TS2322: Type 'number | undefined' is not assignable to type 'string'.
```

## Pitfalls

- Assuming `const x = { kind: "a" }` keeps `"a"`. `const` freezes the binding, not the properties, so `kind` is `string` (see the example). Use `as const`, an annotation, or `satisfies`.
- Expecting `[new Rhino(), new Elephant()]` to be `Animal[]`. It is the union of the two; the handbook's fix is an explicit `Animal[]`. (The union's member order in messages differs between 6.0.3 and 7.0.2; don't depend on it.)
- Relying on `new Map()` with no type arguments. The result is `Map<any, any>`, and everything read from it is unchecked (`new Set()` gives `Set<unknown>`: safe, but unusable until typed).
- Letting inferred return types define a public API. A body edit changes the signature for every caller, and the diff doesn't show it.

## Follow-ups

**Q:** What is an "evolving" array?
**A:** With `noImplicitAny`, `const ids = []` has no fixed element type yet; each `push` widens it. After `ids.push(1)`, `ids[0]` is `number`, as the example shows. Reading it before any push, or from a nested function, reports TS7034/TS7005 (7.0.2).

**Q:** Does a contextual type override an annotation?
**A:** No. An explicit annotation on a parameter wins over the contextual type. The handbook's own example annotates a handler parameter as `any` to silence an error that the contextual type would have raised.
