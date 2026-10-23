---
title: "Which flags beyond `strict` do you turn on, such as `noUncheckedIndexedAccess`?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [nouncheckedindexedaccess, exactoptionalpropertytypes, nooverride, noimplicitreturns, tsconfig]
related:
  - typescript/tsconfig-and-strictness/strict-mode-flags
  - typescript/inference-and-narrowing/control-flow-narrowing
  - typescript/classes-enums-runtime-output/class-members-access
verified: 2026-10
sources:
  - https://www.typescriptlang.org/tsconfig/#noUncheckedIndexedAccess
  - https://www.typescriptlang.org/tsconfig/#exactOptionalPropertyTypes
  - https://www.typescriptlang.org/tsconfig/#noImplicitOverride
  - https://www.typescriptlang.org/tsconfig/#noImplicitReturns
  - https://www.typescriptlang.org/tsconfig/#noPropertyAccessFromIndexSignature
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-1.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-3.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-2.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-4.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html
tldr: >
  `strict` leaves out several useful checks. I turn on `noUncheckedIndexedAccess` (index reads include
  `undefined`), `noImplicitOverride`, `noImplicitReturns` and `noFallthroughCasesInSwitch` by default,
  and add `exactOptionalPropertyTypes` when I want a missing property to differ from `undefined`.
---

## Answer

None of these are part of `strict`, and none are compiler defaults (a strict-only config accepted every violation in the example below on 6.0.3 and 7.0.2), though `tsc --init` on both writes the first two into new configs. I add them deliberately.

- **`noUncheckedIndexedAccess`** (4.1). Reading through an index signature or an array index adds `| undefined`: `nums[0]` is `number | undefined`. It is the most valuable one, because out-of-range reads are a real runtime source of `undefined` that `strictNullChecks` cannot see. Cost: you narrow or use `??` at each read. Tuple positions and `for...of` elements are unaffected; `.at()` already returns `T | undefined`.
- **`exactOptionalPropertyTypes`** (4.4). `theme?: "dark" | "light"` then means "absent or one of these", not "or `undefined`". Writing `{ theme: undefined }` is an error. Turn it on when presence matters at runtime (`in`, `Object.keys`, spread). The 4.4 notes warn of friction with existing typings; it requires `strictNullChecks`.
- **`noImplicitOverride`** (4.3). A method that overrides a base member must say `override`, so renaming a base method breaks subclasses visibly instead of silently orphaning them. `override` on a member the base lacks is an error with or without the flag.
- **`noImplicitReturns`**. Every code path must return a value when any path does.
- **`noFallthroughCasesInSwitch`**. A non-empty `case` must `break`, `return` or `throw`.
- **`noPropertyAccessFromIndexSignature`** (4.2). Index-signature keys need `obj["key"]`, which signals "might be absent". It is a style flag.

I leave `noUnusedLocals` and `noUnusedParameters` to the linter, which can auto-fix and can be set per rule.

## Example

```ts
// TypeScript 7.0.2 and 6.0.3; strict plus the four flags below
const nums = [10, 20, 30];
const first: number = nums[0];
// Error TS2322: Type 'number | undefined' is not assignable to type 'number'.
const second = nums[1] ?? 0; // OK: number

interface Opts { theme?: "dark" | "light" }
const opts: Opts = { theme: undefined };
// Error TS2375: Type '{ theme: undefined; }' is not assignable to type 'Opts' with 'exactOptionalPropertyTypes: true'. Consider adding 'undefined' to the types of the target's properties.
const empty: Opts = {};
console.log(Object.keys({ theme: undefined }), Object.keys(empty));
// → [ 'theme' ] []

class Base { setup() {} }
class Child extends Base { setup() {} }
// Error TS4114: This member must have an 'override' modifier because it overrides a member in the base class 'Base'.

function label(c: boolean): string | undefined {
  if (c) { return "yes"; }
}
// Error TS7030: Not all code paths return a value.
```

## Pitfalls

- Expecting `nums[i]` inside `for (let i = 0; i < nums.length; i++)` to be safe. It stays `number | undefined` (checked), as the 4.1 notes say. Use `for...of`, or read once into a `const` and narrow.
- Assuming narrowing works on any key. Since 5.5 `obj[key]` narrows only when both are effectively constant: with `const i = 1` (or a never-reassigned `let`), `if (nums[i] !== undefined)` narrowed `nums[i]`; with a reassigned `let` or a `for` counter it did not (6.0.3 and 7.0.2).
- Enabling `exactOptionalPropertyTypes` and then writing `Partial<Opts>` with `undefined`. `Partial<Opts>` stayed exact and rejected `{ theme: undefined }` (TS2375). Say `theme?: "dark" | undefined` where `undefined` is intended.
- Expecting `noImplicitReturns` to exempt a return type that includes `undefined`. The `label` function above still errors (TS7030); add `return undefined`.

## Follow-ups

**Q:** Does `noUncheckedIndexedAccess` affect destructuring?
**A:** Yes. `const [d0] = nums` made `d0` `number | undefined` (checked on 6.0.3 and 7.0.2). Destructuring a tuple type is not affected, since its length is known.

**Q:** Do these flags behave the same across TS 6.0 and 7.0?
**A:** For the cases in this file, identical: 6.0.3 and 7.0.2 printed the same diagnostics for the same config.
