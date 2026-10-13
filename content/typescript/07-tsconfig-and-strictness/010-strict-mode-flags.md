---
title: "What does `strict` enable, and why is `strictNullChecks` the important one?"
status: draft
difficulty: medium
frequency: 5
core: true
tags: [strict, strictnullchecks, noimplicitany, strictfunctiontypes, tsconfig]
related:
  - typescript/type-system-basics/any-unknown-never
  - typescript/inference-and-narrowing/control-flow-narrowing
  - typescript/generics/variance
  - typescript/tsconfig-and-strictness/flags-beyond-strict
verified: 2026-10
sources:
  - https://www.typescriptlang.org/tsconfig/#strict
  - https://www.typescriptlang.org/tsconfig/#strictNullChecks
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-0.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-6.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-7.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-2.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-4.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-6.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html
  - https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
tldr: >
  `strict` is an umbrella for nine checks: `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`,
  `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitThis`, `useUnknownInCatchVariables`,
  `strictBuiltinIteratorReturn` and `alwaysStrict`. `strictNullChecks` matters most because it makes
  `null` and `undefined` separate types. It is on by default since TS 6.0.
---

## Answer

`strict` turns on a family of checks at once, and you can switch any member off individually. Per the TSConfig reference it covers:

- **`strictNullChecks`**: `null` and `undefined` stop being members of every type. They get their own types, so `string` no longer accepts them.
- **`noImplicitAny`**: an untyped parameter or binding that cannot be inferred is an error instead of silently `any`.
- **`strictFunctionTypes`**: function parameters are compared contravariantly. It applies to function-typed properties, not to method syntax.
- **`strictBindCallApply`**: `call`, `bind` and `apply` check their arguments against the target function.
- **`strictPropertyInitialization`**: a class property must be assigned in the constructor or be typed to allow `undefined`. It requires `strictNullChecks`.
- **`noImplicitThis`**, **`useUnknownInCatchVariables`** (catch variable is `unknown`), **`strictBuiltinIteratorReturn`** (built-in iterators return `undefined`, not `any`) and **`alwaysStrict`** (parse as ES strict mode and emit `"use strict"`).

`strictNullChecks` is the important one because it removes the most common runtime crash class: "cannot read properties of undefined". Without it, `array.find(...)` is typed as returning the element, `Map#get` returns the value, and optional fields look always present, so the compiler certifies code that throws. With it, every place a value might be absent is visible in the type and you must narrow before use. The other flags tighten how types relate; this one changes what the types mean.

**Version note.** Before TS 6.0, `strict` defaulted to `false`. TS 6.0 made it `true` by default and TS 7.0 kept that, so a tsconfig without `strict` is now strict. The reference also warns that future versions may add checks under `strict`, so upgrades can surface new errors.

For a new project I leave `strict` on. For a legacy codebase I enable the flags one at a time, `strictNullChecks` and `noImplicitAny` first, rather than flipping everything in one commit.

## Example

```ts
// TypeScript 7.0.2 and 6.0.3, no "strict" key in tsconfig (5.9.3 needs "strict": true)
const users = [{ name: "Oby", age: 12 }];
const found = users.find((u) => u.name === "Heera");
console.log(found.age);
// Error TS18048: 'found' is possibly 'undefined'.
if (found) console.log(found.age); // OK: narrowed to the object

function legacy(s) { return s.length; }
// Error TS7006: Parameter 's' implicitly has an 'any' type.

class Account { email: string; }
// Error TS2564: Property 'email' has no initializer and is not definitely assigned in the constructor.

try { JSON.parse("{"); } catch (e) { console.log(e.message); }
// Error TS18046: 'e' is of type 'unknown'.
```

With `"strict": false`, the same file compiled without errors, and running the emitted `found.age` line threw `TypeError: Cannot read properties of undefined (reading 'age')` on Node 24.19.0.

## Pitfalls

- Assuming a missing `strict` means "off". On 5.9.3 the file above compiled with no errors, on 6.0.3 and 7.0.2 it printed all four. Pin `"strict": true` or `false` explicitly in shared base configs.
- Expecting `strictFunctionTypes` to cover methods. `{ func(x: string | number): void }` still accepted `(x: string) => void`; the same shape written as a property `func: (x: string | number) => void` was an error (TS2322).
- Turning on `strictPropertyInitialization` alone. With `strictNullChecks` off, `tsc` reports `TS5052: Option 'strictPropertyInitialization' cannot be specified without specifying option 'strictNullChecks'.`
- Silencing null errors with `!` everywhere. It restores the unchecked behavior one expression at a time and hides the real "can this be absent?" decision.

## Follow-ups

**Q:** Is `alwaysStrict: false` still allowed?
**A:** No in 7.0.2: `error TS5108: Option 'alwaysStrict=false' has been removed.` The TS 6.0 notes deprecate it and say all code is assumed to be in strict mode.

**Q:** Why does `strictBuiltinIteratorReturn` matter?
**A:** `[1, 2].values().next()` narrowed by `done` has `value: undefined`, so `last.value.toFixed()` was TS18048 under the flag and compiled with it off (7.0.2). It was added in 5.6, which shows why upgrades can add errors under `strict`.

## Deep dive

### How it works

Without `strictNullChecks`, `null` and `undefined` are in the domain of every type, so `let n: number = undefined` is fine. The 2.0 notes describe the flag as a new checking mode where they are distinct types, and a type that accepts them must say so with a union: `number | undefined`.

That is why library signatures change meaning. `Array#find` is declared as returning `T | undefined`, and the TSConfig reference shows that with the flag off the `undefined` is dropped from the type system. The union is then removed by **control-flow narrowing**: `if (found)`, `found?.age`, `found ?? fallback`, an early `return`, or `typeof` checks each take `undefined` out of the union for the code that follows.

The other family members are separate checks and each was added later: `strictFunctionTypes` in 2.6, `strictPropertyInitialization` in 2.7, `strictBindCallApply` in 3.2, `useUnknownInCatchVariables` in 4.4 and `strictBuiltinIteratorReturn` in 5.6 (per their release notes). Each is "on when `strict` is on" but can be set independently.

In my run on 7.0.2, a file with seven diagnostics (null check, implicit any, property initialization, catch variable, function types, bind/call, `this`) lost the matching one when its flag alone was set to `false`, and the other six stayed. The flags are independent switches, not layers.

### Edge cases

- **Method versus property.** The reference says `strictFunctionTypes` was limited to function syntax because enabling it for methods broke many real class hierarchies, including in the DOM. Method bivariance is deliberate. See the variance question for the underlying rule.
- **Definite assignment.** `email!: string` (compiled under strict on 7.0.2) tells `strictPropertyInitialization` that something else (a decorator, a framework, an init method) assigns it. That is a promise, not a check.
- **Default flip.** `tsc --showConfig` prints only what the config sets, not defaults: for a config without `strict` it printed no `strict` key on 7.0.2, so you cannot read the effective value from it. The 6.0 and 7.0 notes list the new default; behavior is what the errors show.
- **Staying non-strict.** On 6.0 or 7.0 write `"strict": false` explicitly. Individual flags can still be turned on from there.

### Real-world scenario

A repo upgrades from 5.9 to 7.0 and its tsconfig never mentioned `strict`. Many errors appear, none from changed code. The fastest honest fix is to restore the old behavior in the base config, then ratchet:

```json
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": true,
    "useUnknownInCatchVariables": true
  }
}
```

Each flag you add is its own change with its own error list, so a bad batch is a one-line revert. Move to `"strict": true` once `strictNullChecks` is the only one left, and let the umbrella keep you current.

### Trade-offs

| | Strict on | Strict off |
|---|---|---|
| Absent values | Visible in types, must be handled | Invisible until runtime |
| Migration cost | Errors in untyped or nullable code | None |
| Upgrades | May add errors when new checks join `strict` | Stable, but misses new checks |

The cost of strictness is paid once, in annotations and narrowing. The cost of leaving it off is paid on every deploy, as production errors the compiler could have named.

## Exercises

### Which flag fired?

```ts
function greet(name: string | undefined) {
  return name.toUpperCase();
}
```

Which `strict` member reports the error, and what are two fixes that do not use `!`?

**Answer:** `strictNullChecks` (checked on 7.0.2: `TS18048: 'name' is possibly 'undefined'`). Fixes: narrow (`if (!name) return ""`) or default (`(name ?? "").toUpperCase()`).
