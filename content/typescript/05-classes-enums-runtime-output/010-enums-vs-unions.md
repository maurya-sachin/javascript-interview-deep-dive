---
title: "Should you use enums or union types?"
status: draft
difficulty: medium
frequency: 5
core: true
tags: [enum, const-enum, union-types, as-const, runtime-output]
related:
  - typescript/type-system-basics/literal-types-as-const
  - typescript/generics/keyof-typeof-indexed-access
  - typescript/classes-enums-runtime-output/erasable-syntax-only
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/enums.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html
  - https://www.typescriptlang.org/tsconfig/#preserveConstEnums
  - https://www.typescriptlang.org/tsconfig/#isolatedModules
  - https://github.com/microsoft/TypeScript/pull/50528
tldr: >
  An `enum` emits a real JavaScript object (numeric ones add a reverse mapping) and rejects plain
  literals like `"RED"`. A string-literal union emits nothing and accepts plain strings. Default to
  a union or an `as const` object; keep enums for numeric flags or existing code.
---

## Answer

An `enum` is not a type-level extension of JavaScript (the Handbook says so): it declares both a **type** and a runtime **object**.

- **Numeric enum** emits `E[E["A"] = 0] = "A"`, an object with a forward map and a **reverse mapping** (`E[0] === "A"`). That is why `Object.keys` on it returns both names and numbers. **String enums** emit only the forward map.
- **Enum types are not their literals.** Since 5.0 every enum is a union of its member types and an out-of-domain literal is an error, and a string enum rejects the matching plain string: `const c: Color = "RED"` fails. Any plain `number` is still assignable to a numeric enum.
- **`const enum`** is erased and its members are inlined at use sites. The Handbook warns this breaks across packages (ambient const enums) and `isolatedModules` rejects ambient ones.
- **Union of literals** (`type Status = "active" | "banned"`) emits nothing, accepts plain strings, and narrows and exhausts well. If you also need the values at runtime, use an `as const` object plus `typeof Obj[keyof typeof Obj]`.

My default: a string union, or an `as const` object when I need to iterate or reference the values. The Handbook itself presents the `as const` object as often sufficient, since it stays plain JavaScript. I reach for an enum for numeric bit flags with computed members, or when the codebase already uses them. If the project sets `erasableSyntaxOnly` (for Node type stripping) enums are not allowed at all.

Tradeoff: an enum gives a nominal-ish, namespaced type and autocompletion on `Role.Admin`; a union gives interop (JSON, plain strings, other packages) without conversion.

## Example

```ts
// TypeScript 7.0.2 and 5.9.3, --strict
enum Role { Admin, User }
enum Color { Red = "RED" }
const Status = { Active: "active", Banned: "banned" } as const;
type Status = (typeof Status)[keyof typeof Status]; // "active" | "banned"

function setStatus(s: Status) { console.log(s); }
setStatus(Status.Active);
setStatus("banned"); // OK: a plain literal is a valid Status
setStatus("gone");
// Error TS2345: Argument of type '"gone"' is not assignable to parameter of type 'Status'.

const r: Role = 5;
// Error TS2322: Type '5' is not assignable to type 'Role'.
const c: Color = "RED";
// Error TS2322: Type '"RED"' is not assignable to type 'Color'.
const n: number = Role.User;
const ok: Role = n; // OK: any `number` is assignable to a numeric enum

console.log(Object.keys(Role), Object.values(Status));
// → [ '0', '1', 'Admin', 'User' ] [ 'active', 'banned' ]
```

## Pitfalls

- Passing a string literal to a string-enum parameter. It fails (`Type '"RED"' is not assignable to type 'Color'`), so values from JSON or an API need a cast or a validator.
- Iterating a numeric enum with `Object.keys`/`Object.values` and getting the reverse-mapping entries too (`[ '0', '1', 'Admin', 'User' ]`). String enums and `as const` objects do not have this.
- Treating numeric enums as closed. Literals outside the domain are an error (5.0+), but `const ok: Role = n` with a `number` compiles, so an arbitrary value can still reach a `Role`.
- Using `const enum` in a published library. Consumers inline your values at their compile time and can disagree with the runtime version; `isolatedModules` also rejects ambient ones (TS2748).

## Follow-ups

**Q:** What does `const enum` emit?
**A:** No enum object by default: `Level.High` becomes `2 /* Level.High */` (checked). `preserveConstEnums` keeps the object too. With `isolatedModules` on (TS 7.0.2) an own `export const enum` was emitted as a normal object and the use site was not inlined.

**Q:** Why is `keyof typeof Role` a string union?
**A:** `Role` the value is an object, so `typeof Role` has keys `Admin` and `User`; `keyof Role` (the enum type) is the keys of `number` (checked: `"toFixed"` is accepted). `const bad: keyof typeof Role = 0` errors.

## Deep dive

### How it works

A numeric enum compiles to an immediately invoked function that fills an object. Both emitted forms below come from `tsc` 7.0.2 (`--target es2022`):

```js
var Role;
(function (Role) {
    Role[Role["Admin"] = 0] = "Admin";
    Role[Role["User"] = 1] = "User";
})(Role || (Role = {}));
var Color;
(function (Color) {
    Color["Red"] = "RED";
})(Color || (Color = {}));
```

The assignment `Role["Admin"] = 0` evaluates to `0`, which is then used as the key for the reverse entry. The `Role || (Role = {})` argument is what lets two declarations of the same enum merge. String members get no reverse entry because two names could share a value.

At the type level, PR 50528 (released in TS 5.0) unified the old numeric and literal enum kinds: an enum is always a union of its member types, members with constant values get literal types, and computed members get a unique type each. It changed only type checking, so emit is unchanged.

### Edge cases

- **Constant versus computed members.** `1 << 2` is a constant enum expression; `"123".length` is computed. The Handbook lists the allowed operators.
- **`const enum` emit.** `const lvl = Level.High` emitted `const lvl = 2 /* Level.High */;` and no `Level` object (checked, 7.0.2). `preserveConstEnums` defaults to true under `isolatedModules` (TSConfig reference). That matches what I saw on 7.0.2 and 5.9.3: an own `export const enum Own` was emitted as an object and the use site stayed `Own.B`.
- **Ambient const enums with `isolatedModules`.** `declare const enum Ext { A = 1 }` used as `Ext.A` gives `TS2748: Cannot access ambient const enums when 'isolatedModules' is enabled` on both versions.
- **Exhaustiveness** works for unions and for enums as unions. In my check, `const x: never = s` after a switch that missed `"banned"` printed `Type '"banned"' is not assignable to type 'never'`.

### Trade-offs

| | `enum` | string union | `as const` object |
|---|---|---|---|
| Runtime code | object (and reverse map if numeric) | none | plain object |
| Accepts plain literals | no (string enums) | yes | yes (via derived union) |
| Iterate values | awkward for numeric | needs a separate list | `Object.values` |
| Allowed with `erasableSyntaxOnly` | no | yes | yes |

The `as const` form costs one extra line to derive the type, and it matches what JavaScript will always run. Choose an enum when the team has a convention for it and nobody crosses a JSON boundary with the values; otherwise the other two avoid emitted code, interop friction, and the `erasableSyntaxOnly` restriction.

## Exercises

### Derive the type

Given the object below, define `Direction` as the union of its values.

```ts
const Dir = { Up: "UP", Down: "DOWN" } as const;
type Direction = unknown;
```

**Answer:** `type Direction = (typeof Dir)[keyof typeof Dir];` gives `"UP" | "DOWN"`. Without `as const` the properties widen to `string`, so the union would just be `string` (checked: assigning `3` errors with `Type 'number' is not assignable to type 'string'`, i.e. the derived type is `string`).
