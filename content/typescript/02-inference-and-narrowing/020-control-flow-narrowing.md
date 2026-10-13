---
title: "How does narrowing work, and what built-in checks narrow a type?"
status: draft
difficulty: medium
frequency: 5
core: true
tags: [narrowing, control-flow-analysis, type-guards, typeof, instanceof, in-operator, truthiness]
related:
  - typescript/type-system-basics/any-unknown-never
  - typescript/inference-and-narrowing/how-inference-works
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/2/narrowing.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-4.html#control-flow-analysis-of-aliased-conditions-and-discriminants
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#unlisted-property-narrowing-with-the-in-operator
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-3.html#switch-true-narrowing
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-4.html#preserved-narrowing-in-closures-following-last-assignments
  - https://github.com/microsoft/TypeScript/blob/v5.9.3/src/compiler/checker.ts
tldr: >
  Narrowing refines a variable's declared type to something more specific at each point in the
  code. The compiler follows the control-flow graph and applies `typeof`, truthiness, equality,
  `in`, `instanceof`, and assignment checks. It forgets a narrowing when it can't prove the value
  is unchanged, notably inside callbacks that run after a later assignment.
---

## Answer

**Narrowing** is how TypeScript refines a value from its declared type to a more specific type at a given point. The handbook calls the process *control flow analysis*: the compiler walks the possible execution paths, and at each use of a variable it asks which checks and assignments must have happened on the way there.

The built-in narrowing forms:

- **`typeof x === "string"`** narrows to the primitive. `typeof x === "object"` also leaves `null` in the type, because `typeof null` is `"object"`.
- **Truthiness** (`if (x)`, `&&`, `!x`) removes `null`, `undefined`, and, for primitives, falsy values. In the false branch a `string` is still `string` (it could be `""`).
- **Equality** (`===`, `!==`, `==`, `!=`, `switch`) narrows to the compared literal, or to the types two operands share. `x != null` removes both `null` and `undefined`.
- **`in`**: `"swim" in animal` keeps union members that have (or may have) that property in the true branch.
- **`instanceof`**: narrows to the class instance type.
- **Assignment**: assigning to a variable whose declared type is a union narrows it to what was assigned.
- **User-defined guards and discriminant checks**: covered in the next questions.

Narrowing is always relative to the **declared type**: assignments are checked against it, and the narrowed type only applies until control flow can change the value.

**What breaks it:** a callback that may run later, if the variable is reassigned after the narrowing (or inside any nested function); narrowed *properties* inside callbacks, even if nothing reassigns them; and, silently in the other direction, function calls, which do **not** invalidate a narrowed property, so the compiler can be wrong.

## Example

```ts
// TypeScript 7.0.2 and 5.9.3, --strict; runs on Node 24 (type stripping)
function describe(value: string | number | Date | string[] | null): string {
  if (value === null) return "null"; // equality removes null
  if (typeof value === "number") return value.toFixed(1); // typeof
  if (value instanceof Date) return value.toISOString().slice(0, 10); // instanceof
  if (Array.isArray(value)) return value.join("+"); // value: string[]
  return value.toUpperCase(); // value: string, the only member left
}

console.log(describe(null), describe(3), describe(new Date(0)), describe(["a", "b"]), describe("hi"));
// → null 3.0 1970-01-01 a+b HI

function retryLater(options: { retries?: number }) {
  if (options.retries === undefined) return;
  options.retries.toFixed(); // OK: narrowed
  return () => options.retries.toFixed();
  // Error TS18048: 'options.retries' is possibly 'undefined'.
}
```

## Pitfalls

- `typeof x === "object"` on `T | null`. `null` survives (the handbook's `printAll` example); add `x !== null` or a truthiness check.
- Truthiness on primitives. `if (s)` drops `""` and `if (n)` drops `0`. After `if (s) {} else { ... }` the else branch is `string | undefined`, not `undefined` (checked on 7.0.2). Compare with `!== undefined` when `0` or `""` are valid.
- Expecting a narrowing to survive in a callback. Property narrowing (`options.retries`) is dropped in closures; for variables it survives only if the closure is created after the last assignment (5.4+).
- Trusting narrowing across function calls. `reset(c)` can clear `c.retries`, and the compiler still believes it is a number (Deep dive).

## Follow-ups

**Q:** Why does `"name" in obj` on `obj: object` now let you read `obj.name`?
**A:** Since 4.9, `in` on a type that doesn't list the property intersects it with `Record<"name", unknown>`. On 7.0.2 and 5.9.3, `object` narrows to `object & Record<"name", unknown>`; you still have to narrow `name` itself.

**Q:** Does narrowing change the runtime?
**A:** No. Types are erased; narrowing only changes what the checker accepts. A runtime check must exist in the code for the narrowing to be true.

## Deep dive

### How it works

The binder builds a **flow graph**: nodes for assignments, conditions (`if`, `&&`, `switch` clauses), calls that may not return, and labels where branches merge. When the checker meets a reference such as `value` or `options.retries`, `getFlowTypeOfReference` in `checker.ts` starts at that reference's flow node and walks backward. At a condition node it applies the matching narrowing (`narrowTypeByTypeof` and friends) to the type from earlier on that path; at an assignment node it computes the assigned type; at a merge it unions the types from every incoming path; at a call to a function returning `never` the path is unreachable. (Read from the v5.9.3 source. TypeScript 7.0 is a native rewrite; I observed identical results on every example here, but did not read its source: ❓ for internals.)

A few consequences follow from that design.

**Only "references" are narrowed:** identifiers, `this`, and chains of property or element accesses with the same shape (`a.b.c`). Assigning to any prefix (`a` or `a.b`) resets the narrowing for the chain.

**Assignment narrows only union declared types.** The checker's assignment handling filters the declared type by the assigned type only when the declared type is a union. That is why `unknown` doesn't narrow on assignment:

```ts
let w: string | number = "a";
w.toUpperCase(); // OK: narrowed to string by the assignment
w = 1;
w.toFixed(); // OK: now number

let u: unknown = "a";
u.toUpperCase();
// Error TS18046: 'u' is of type 'unknown'.

type Config = { retries?: number };
function reset(c: Config) { c.retries = undefined; }
function run(c: Config) {
  if (c.retries !== undefined) {
    reset(c);
    return c.retries.toFixed(); // compiles; throws at runtime
  }
}
```

**Loops and joins.** At a loop head the checker unions the type from before the loop with the type at the end of each iteration, so `while (typeof x === "string") x = x.length;` leaves `x` as `number` afterwards (checked on 7.0.2 and 5.9.3).

### Edge cases

Closures and aliased conditions are the cases people trip on. Version notes are from the 4.4 and 5.4 release notes; I re-ran them on 7.0.2, 5.9.3 and 5.3.

```ts
function lastAssignment(url: string | URL, names: string[]) {
  if (typeof url === "string") url = new URL(url);
  return names.map((name) => url.searchParams.set("name", name));
  // OK on 5.4+. On 5.3: Error TS2339: Property 'searchParams' does not exist on type 'string | URL'.
}

function laterAssignment(url: string | URL) {
  if (typeof url === "string") url = new URL(url);
  const read = () => url.href;
  // Error TS2339: Property 'href' does not exist on type 'string | URL'.
  url = "https://example.com";
  return read;
}

function aliased(value: unknown) {
  const isText = typeof value === "string";
  if (isText) return value.toUpperCase(); // OK on 4.4+: const alias of a guard
}
```

- **Last-assignment rule (5.4).** For parameters and `let` variables, a closure created after the last assignment keeps the narrowing. An assignment anywhere in a nested function, or after the closure is created, disables it. The checker records each variable's last assignment position (`isPastLastAssignment`) for this.
- **Aliased conditions (4.4).** Narrowing flows through a `const` that holds a guard, a `readonly` property, or an unmodified parameter. The same works for destructured discriminants: `const { kind } = shape; if (kind === "circle")` narrows `shape` per the release notes.
- **`switch (true)` (5.3).** Each `case` expression acts as a condition. On 5.3, 5.9.3 and 7.0.2 `case typeof x === "string":` narrows `x` to `string`.
- **Properties are narrowed too, and are unsound.** Narrowing `options.retries` survives calls such as `reset(options)` because tracking every possible write is infeasible. Property narrowing does not survive an assignment to `options` itself, and it is dropped inside closures.

### Real-world scenario

Validating parsed JSON at a boundary. Everything flows from `unknown`, and each check removes possibilities until the property you want has a usable type:

```ts
function readName(input: unknown): string {
  if (typeof input !== "object" || input === null) {
    throw new TypeError("expected an object");
  }
  if (!("name" in input) || typeof input.name !== "string") {
    throw new TypeError("expected a string name");
  }
  return input.name.trim();
}

console.log(readName(JSON.parse('{"name":" Ada "}'))); // → Ada
try {
  readName(JSON.parse('{"name":42}'));
} catch (error) {
  console.log((error as Error).message); // → expected a string name
}
```

Verified on 7.0.2 and 5.9.3, output from Node 24. The `in` check relies on 4.9+ behavior, and `input` must first be narrowed to `object` (the `null` check matters: `typeof null === "object"`). When the shape is bigger than a field or two, switch to a type guard or a schema validator; chained narrowing does not scale.

### Trade-offs

Built-in narrowing costs nothing at runtime and reads like plain JavaScript, which is why it is the default tool. Its limits are static: it can't see mutation through calls, can't cross closures that may run late, and can't narrow on conditions the compiler doesn't recognise (a helper returning `boolean`). For those, copy the value into a `const` first (`const retries = options.retries`), or write a type predicate and accept that it is a promise you must keep.
