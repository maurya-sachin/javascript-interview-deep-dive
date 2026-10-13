---
title: "How do you write a user-defined type guard or assertion function?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [type-guards, type-predicates, assertion-functions, inferred-type-predicates, narrowing]
related:
  - typescript/inference-and-narrowing/control-flow-narrowing
  - typescript/type-system-basics/any-unknown-never
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#assertion-functions
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html#inferred-type-predicates
tldr: >
  A type guard returns `param is T`: when it returns true the argument is `T`, when false it
  is not. An assertion function returns `asserts param is T` (or `asserts condition`) and throws
  instead of returning false. TypeScript trusts both; it never checks that the body matches the
  claim. Since 5.5 simple guards are inferred.
---

## Answer

Built-in checks (`typeof`, `in`, `instanceof`) can't express "this object matches my interface". A **user-defined type guard** can. Give a function the return type `paramName is Type`, a **type predicate**. When a call returns `true`, TypeScript narrows the argument to `Type` in the true branch, and removes `Type` from it in the false branch.

An **assertion function** (TS 3.7) narrows by throwing instead of returning false. There are two signatures:

- `asserts value is T`: after the call returns, `value` is `T`.
- `asserts condition`: after the call returns, the argument expression is truthy (Node's `assert` is typed this way).

Rules and traps:

- **The body is not checked.** The handbook says explicit predicates are "no safer than a type assertion". A predicate that returns `true` for the wrong values silently corrupts every call site.
- **If-and-only-if.** Returning `false` means the value is *not* `T`. `s is string` implemented as `!!s` is wrong: `""` is a string that returns `false`.
- The predicate type must be assignable to the parameter type: `n: number` with `n is string` is error TS2677.
- **Assertion calls need an explicit annotation.** The call target must be declared with an explicit type, so a bare `const assertStr = (v: unknown): asserts v is string => {...}` fails at the call site with TS2775. Use a function declaration, or annotate the const.
- **Inferred predicates (TS 5.5).** A function with no return annotation, one `return`, no parameter mutation, and a boolean expression tied to a refinement infers `x is T`. `[1, undefined, 3].filter(n => n !== undefined)` becomes `number[]`.

For untrusted `unknown` data, write the guard once at the boundary.

## Example

```ts
// TypeScript 7.0.2 and 5.9.3, --strict; runs on Node 24 (type stripping)
interface User { id: number; name: string }

function isUser(value: unknown): value is User {
  return (
    typeof value === "object" && value !== null &&
    "id" in value && typeof value.id === "number" &&
    "name" in value && typeof value.name === "string"
  );
}

function assertDefined<T>(value: T | null | undefined): asserts value is T {
  if (value == null) throw new Error("expected a value");
}

const rows: unknown[] = [{ id: 1, name: "Ada" }, null, { id: "2" }];
const users = rows.filter(isUser); // User[]
console.log(users.length); // → 1

const ada = users.find((user) => user.id === 1); // User | undefined
ada.name;
// Error TS18048: 'ada' is possibly 'undefined'.
assertDefined(ada);
console.log(ada.name); // → Ada

const present = [1, undefined, 3].filter((n) => n !== undefined); // number[] on 5.5+
console.log(present); // → [ 1, 3 ]
```

## Pitfalls

- Writing a predicate that does less than it claims. With `isNonEmpty(s): s is string { return !!s; }`, calling it with `""` returns `false`, so the compiler types the else branch as `undefined` (it accepted `const rest: undefined = s` on 7.0.2 and 5.9.3), yet the value there is `""` and `typeof rest` prints `string`.
- Using `x => !!x` to filter `(number | undefined)[]`. No predicate is inferred, because `0` returns `false` and is still a `number`; the result stays `(number | undefined)[]` (checked on 7.0.2, 5.9.3). Use `x !== undefined`, which also keeps the zeros.
- Assuming an assertion function "just works" when assigned to an unannotated `const`: TS2775 at each call.
- Upgrading across 5.5 with `const nums = [1, null].filter(x => x !== null)`. `nums` becomes `number[]`, so `nums.push(null)` now errors; annotate the variable if you meant the wider type (from the 5.5 release notes).

## Follow-ups

**Q:** When would you choose an assertion function over a guard?
**A:** When failing is the only sensible outcome: validating input at the top of a function, or in tests. A guard fits branching code, where both outcomes are handled.

**Q:** Do predicates work with `Array.prototype.filter`?
**A:** Yes. `filter` has an overload taking a predicate, so `rows.filter(isUser)` returns `User[]`. Before 5.5 an inline arrow needed an explicit `(x): x is T` annotation.
