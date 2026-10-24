---
title: "What is a discriminated union, and how do you check it exhaustively?"
status: draft
difficulty: medium
frequency: 5
core: true
tags: [discriminated-unions, tagged-unions, exhaustiveness, never, narrowing, switch]
related:
  - typescript/inference-and-narrowing/control-flow-narrowing
  - typescript/type-system-basics/any-unknown-never
  - typescript/type-system-basics/literal-types-as-const
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions
  - https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-6.html#control-flow-analysis-for-destructured-discriminated-unions
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator
tldr: >
  A discriminated union is a union whose members share a property with a distinct literal type
  (the tag, often `kind`). Checking the tag narrows the whole object to one member. For
  exhaustiveness, assign the leftover value in a `default` branch to `never`: adding a member
  then turns the unhandled case into a compile error.
---

## Answer

A **discriminated union** (tagged union) is a union type where every member has a common property, the **discriminant**, whose type is a distinct literal type: `{ kind: "circle"; radius: number } | { kind: "square"; side: number }`.

Checking the discriminant (`shape.kind === "circle"`, a `switch` on it, or `in` for a property only one member has) narrows the entire object to the matching member, so `shape.radius` is allowed only in that branch.

Why this beats one object with optional fields: with `{ kind: "circle" | "square"; radius?: number; side?: number }` the compiler can't connect `kind` to which field exists, so you reach for `!` (handbook). A union encodes the relationship in the type, so the check proves the field is there.

**Exhaustiveness.** After every member is handled, the leftover type is `never`. Use that:

- **`default` with a `never` check**: pass the value to `assertNever(value: never)` or write `value satisfies never` (TS 4.9). If a member is unhandled, it is not assignable to `never` and you get an error pointing at the missing case. The helper also throws at runtime if bad data slips through.
- **No `default`, annotated return type**: if the switch isn't exhaustive, TypeScript reports that the function lacks an ending return (TS2366). Cheap, but it only works for functions that return.

Requirements: the tag must be a literal (or unit) type. `kind: string` doesn't discriminate. The tag should be a literal in every member, and checks must be on that property (or a `const` destructured from it, 4.6+).

Typical uses are Redux actions, async state (`idle | loading | success | error`), result types (`{ ok: true; value } | { ok: false; error }`), and messages over a network.

## Example

```ts
// TypeScript 7.0.2 and 6.0.3, --strict
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number }
  | { kind: "triangle"; base: number; height: number };

function assertNever(value: never): never {
  throw new Error(`Unhandled variant: ${JSON.stringify(value)}`);
}

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2; // shape: { kind: "circle"; ... }
    case "square":
      return shape.side ** 2;
    default:
      return assertNever(shape);
      // Error TS2345: Argument of type '{ kind: "triangle"; base: number; height: number; }'
      // is not assignable to parameter of type 'never'.
  }
}
```

## Pitfalls

- Using a `string`-typed tag. `{ kind: string }` members don't narrow each other; `shape.radius` fails with TS2339 (see Deep dive). Declare the tag as a literal, or use `as const` when building objects.
- Having a `default` that returns a fallback value silently. It hides new members: no error, and wrong runtime behavior. Make `default` the `never` check.
- Treating compile-time exhaustiveness as runtime safety. Data from `JSON.parse` or a server can carry a tag the type doesn't know, and the `never` branch only throws if you wrote it to.
- Modelling "variants" as optional fields plus `!`. It compiles and fails when a field is actually absent.

## Follow-ups

**Q:** Does destructuring the tag break narrowing?
**A:** Not since 4.6: `const { kind } = shape; if (kind === "circle")` narrows `shape` (checked on 7.0.2 and 6.0.3). It works for `const` destructuring and parameters never assigned to. A `...rest` object does not narrow in the same way.

**Q:** Can `in` replace a tag?
**A:** Yes when a property exists on only one member: `"radius" in shape` narrowed to the circle member (7.0.2). It breaks once two members share the key, and a tag is clearer.

## Deep dive

### How it works

To narrow `shape.kind === "circle"`, the checker treats `kind` as a discriminant property of the union, then filters the members: the true branch keeps those whose `kind` can be `"circle"`, the false branch drops those whose `kind` is exactly `"circle"`. A `switch` applies the same filter per `case`. (Mechanism as described in the handbook; I did not trace the checker source for this one: ❓ for exact discriminant rules.)

Exhaustiveness is the same filtering run to completion. After `"circle"` and `"square"` are removed, only the triangle member remains in `default`; if all are removed, `shape` is `never`, and `never` is assignable to everything while only `never` is assignable to it. So the assignment either compiles (nothing left) or fails with the leftover member in the message. That `never` rule is covered in the `any`/`unknown`/`never` question.

### Edge cases

Three exhaustiveness spellings, and one case where the tag does not discriminate. Each error below was seen on 7.0.2 and 6.0.3.

```ts
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number }
  | { kind: "triangle"; base: number; height: number };

// No default: the return type does the checking.
function areaA(shape: Shape): number {
  // Error TS2366: Function lacks ending return statement and return type does not include 'undefined'.
  // (reported on the return type; the switch is not exhaustive)
  switch (shape.kind) {
    case "circle": return Math.PI * shape.radius ** 2;
    case "square": return shape.side ** 2;
  }
}

// `satisfies never` (4.9+) checks without a helper function.
function areaB(shape: Shape): number {
  switch (shape.kind) {
    case "circle": return Math.PI * shape.radius ** 2;
    case "square": return shape.side ** 2;
    default:
      shape satisfies never;
      // Error TS1360: Type '{ kind: "triangle"; base: number; height: number; }' does not satisfy the expected type 'never'.
      return 0;
  }
}

// A discriminant typed as `string` does not discriminate.
type Wide = { kind: string; radius: number } | { kind: string; side: number };
function wide(shape: Wide) {
  if (shape.kind === "circle") return shape.radius;
  // Error TS2339: Property 'radius' does not exist on type 'Wide'.
}
```

- `satisfies never` needs TS 4.9+; `assertNever` works on all versions and adds a runtime throw.
- The return-type form has a gap: it only detects a missing case when the function must return a value. A `void` function with a missing case compiles.
- Narrowing needs the property to be a *literal in the declared type*. A value that widened to `string` (for example from a `let` or an un-`as const` object) loses it. See the inference question.

### Real-world scenario

Async UI state and a reducer. Two unions, two exhaustive switches. Adding a `"cancel"` action or a `"stale"` status makes both functions fail to compile until handled, instead of breaking at runtime in one screen.

```ts
type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; items: string[] }
  | { status: "error"; message: string };

type Action =
  | { type: "fetch" }
  | { type: "resolve"; items: string[] }
  | { type: "reject"; message: string };

function assertNever(value: never): never {
  throw new Error(`Unhandled variant: ${JSON.stringify(value)}`);
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "fetch": return { status: "loading" };
    case "resolve": return { status: "success", items: action.items };
    case "reject": return { status: "error", message: action.message };
    default: return assertNever(action);
  }
}

function label(state: State): string {
  switch (state.status) {
    case "idle": return "Nothing yet";
    case "loading": return "Loading...";
    case "success": return `${state.items.length} items`;
    case "error": return `Failed: ${state.message}`;
  }
}

let state: State = { status: "idle" };
state = reducer(state, { type: "fetch" });
console.log(label(state)); // → Loading...
state = reducer(state, { type: "resolve", items: ["a", "b"] });
console.log(label(state)); // → 2 items
```

Verified on 7.0.2 and 6.0.3 and run on Node 24. `label` has no `default`: its annotated `string` return type enforces completeness through TS2366.

### Trade-offs

Discriminated unions make illegal states unrepresentable (no `success` without `items`) at the cost of more type declarations and a switch at each use site. For a handful of variants this is the right default. For many variants with shared behavior, polymorphism (classes with methods) keeps new cases in one place instead of touching every switch, at the cost of losing the compiler's exhaustiveness proof. The tag costs a few bytes at runtime, which matters only when you serialize it.
