---
title: "What does `satisfies` do, and how is it different from a type annotation?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [satisfies, type-annotation, type-assertion, contextual-typing, inference]
related:
  - typescript/inference-and-narrowing/how-inference-works
  - typescript/inference-and-narrowing/assertions-and-non-null
  - typescript/type-system-basics/excess-property-checks
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator
  - https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions
tldr: >
  `expr satisfies T` (TS 4.9) checks that the expression is assignable to `T`, including excess
  property checks, without changing its type. An annotation checks and then replaces the type
  with `T`; `as T` overrides it without a full check. Use `satisfies` to validate a config
  object while keeping its precise inferred shape.
---

## Answer

Three ways to relate a value to a type, three different results:

- **Annotation** (`const x: T = expr`): checks `expr` against `T`, then the variable's type **is `T`**. Specific information is lost. Properties typed `string | RGB` stay `string | RGB`.
- **`as T`**: asserts. The compiler only requires that the types sufficiently overlap, and then treats the value as `T`. It does not do an assignability check, so missing properties pass. Nothing is checked at runtime.
- **`expr satisfies T`** (TS 4.9): checks `expr` against `T` the way an annotation does (including excess-property errors), and the expression keeps its own inferred type.

`satisfies` also uses `T` as a **contextual type**. That is why callback parameters get types (`click(e) {}` against `{ click: (e: MouseEvent) => number }` has `e: MouseEvent`) and why array literals can become tuples when `T` expects one. If `T` expects a literal type, the literal is kept.

When to use it: configuration objects, route tables, theme tokens, lookup maps. You want typos and wrong value shapes caught, and you want `config.green.toUpperCase()` to work because `green` is known to be a string. Typical forms are `{...} satisfies Record<Keys, Value>` and `[...] as const satisfies readonly X[]`.

When not to: when you want the variable to be the wider type (use an annotation, for example so later assignments of other members are allowed), or when the value comes from outside the compiler's knowledge (`JSON.parse` result: narrow or validate it, don't assert it).

`satisfies` is erased at compile time, like annotations and assertions. It needs TS 4.9 or later.

## Example

```ts
// TypeScript 7.0.2 and 6.0.3, --strict
type Colors = "red" | "green" | "blue";
type RGB = [red: number, green: number, blue: number];

const annotated: Record<Colors, string | RGB> = {
  red: [255, 0, 0], green: "#00ff00", blue: [0, 0, 255],
};
annotated.green.toUpperCase();
// Error TS2339: Property 'toUpperCase' does not exist on type 'string | RGB'.
//   Property 'toUpperCase' does not exist on type 'RGB'.

const typo = {
  red: [255, 0, 0], green: "#00ff00", bleu: [0, 0, 255],
} satisfies Record<Colors, string | RGB>;
// Error TS2353: Object literal may only specify known properties, and 'bleu' does not exist in type 'Record<Colors, string | RGB>'.

const palette = {
  red: [255, 0, 0], green: "#00ff00", blue: [0, 0, 255],
} satisfies Record<Colors, string | RGB>;
palette.green.toUpperCase(); // OK: green is still a string
palette.red.at(0); // OK: red is a tuple, not string | RGB

const asserted = { red: [255, 0, 0] } as Record<Colors, string | RGB>;
// OK: `as` accepts the missing keys. It checks overlap, not completeness.
const wrong = { red: 1 } as Record<Colors, string | RGB>;
// Error TS2352: Conversion of type '{ red: number; }' to type 'Record<Colors, string | RGB>' may be a mistake
// because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
```

## Pitfalls

- Reading `satisfies` as a conversion. It never changes the type: `const xs = [] satisfies string[]` is `never[]`, not `string[]` (checked on 7.0.2 and 6.0.3). Annotate when you need the declared type.
- Expecting literals to be preserved always. They are kept when `T` has a literal type at that position (`{ kind: "a" } satisfies { kind: "a" | "b" }` gives `kind: "a"`), but against `Record<string, string>` the property is `string` (both checked).
- Using `as` for config objects. It accepts missing keys, and extra keys when none is missing; only a typo that drops one key and adds another (`bleu` for `blue`) trips TS2352. `satisfies` rejects all three.
- Treating it as validation. It is compile-time only; external data still needs a runtime check.

## Follow-ups

**Q:** Can `satisfies` replace `as const`?
**A:** No, they do different jobs. `as const` makes the value readonly with literal types; `satisfies` checks it. Combine them: `[1, 2] as const satisfies readonly number[]` is typed `readonly [1, 2]` (checked on 7.0.2).

**Q:** Why not just annotate and narrow later?
**A:** The annotation discards per-property types for the whole variable lifetime, so every use site must re-narrow (`typeof x.green === "string"`). `satisfies` keeps the types and moves the check to the declaration.
