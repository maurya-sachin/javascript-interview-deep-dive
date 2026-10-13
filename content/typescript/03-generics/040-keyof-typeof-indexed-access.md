---
title: "What do `keyof`, `typeof`, and indexed access types do?"
status: draft
difficulty: medium
frequency: 5
core: true
tags: [keyof, typeof, indexed-access, type-operators, generics]
related:
  - typescript/generics/generics-and-constraints
  - typescript/type-system-basics/literal-types-as-const
  - typescript/type-system-basics/any-unknown-never
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/2/keyof-types.html
  - https://www.typescriptlang.org/docs/handbook/2/typeof-types.html
  - https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html
tldr: >
  `keyof T` is the union of T's property names; type-position `typeof x` is the type of a value;
  `T[K]` looks up a property type, and `T[number]` gets an array's element type. Combined, they
  derive types from values (`(typeof roles)[number]`) so the value stays the single source of truth.
---

## Answer

Three type-level operators that compose:

- **`keyof T`** produces a union of the keys of `T` as literal types: `keyof { x: number; y: number }` is `"x" | "y"`. With an index signature it gives the index type: `keyof { [k: string]: boolean }` is `string | number` (JS coerces numeric keys to strings), and `keyof { [n: number]: unknown }` is `number`.
- **`typeof x`** in a *type position* takes a value (a variable, property or class) and gives its static type. It is separate from the runtime `typeof` that returns a string. It accepts only identifiers and their properties, not calls: `typeof f()` is a syntax error, so you write `ReturnType<typeof f>`.
- **`T[K]`** is an indexed access type: the type of property `K` in `T`. `K` can be a union (`Config["host" | "port"]` is `string | number`), `keyof T` (all values), or `number` for arrays and tuples (`Item[number]` is the element type). A key that does not exist is an error (TS2339), and so is a *value* used as the key.

They are for deriving types from one source of truth. The classic is an `as const` array: `(typeof roles)[number]` is the union of its elements, so adding a role updates both the runtime list and the type. Also `Obj[keyof Obj]` for "any value" and `K extends keyof T` to constrain a key parameter (see the generics question).

Remember the namespaces: `typeof` bridges value to type; nothing here runs at runtime, and a `const key = "port"` cannot be used as an index type without `typeof key`.

## Example

```ts
// TypeScript 7.0.2 and 5.9.3, --strict
const roles = ["admin", "user"] as const;
type Role = (typeof roles)[number]; // "admin" | "user" (order may vary by compiler)
const bad: Role = "guest";
// Error TS2322: Type '"guest"' is not assignable to type '"admin" | "user"'.

const config = { host: "localhost", port: 8080 };
type Config = typeof config; // { host: string; port: number }
type ConfigKey = keyof Config; // "host" | "port"
type Port = Config["port"]; // number
type Mixed = Config["host" | "port"]; // string | number
type Missing = Config["nope"];
// Error TS2339: Property 'nope' does not exist on type '{ host: string; port: number; }'.

function connect() {
  return { id: 1, close() {} };
}
type Connection = ReturnType<typeof connect>; // { id: number; close(): void }

type Dict = { [key: string]: boolean };
type DictKey = keyof Dict; // string | number
type Pair = [string, number];
type Item = Pair[number]; // string | number
type Third = Pair[2];
// Error TS2493: Tuple type 'Pair' of length '2' has no element at index '2'.

const key = "port";
type ByValue = Config[key];
// Error TS2538: Type 'key' cannot be used as an index type.
// Error TS2749: 'key' refers to a value, but is being used as a type here. Did you mean 'typeof key'?
```

## Pitfalls

- Indexing with a value. `Config[key]` fails; write `Config[typeof key]` or declare `type Key = "port"`.
- Assuming `keyof` of a union lists all keys. It lists only the keys common to every member (`keyof ({ kind: "a"; a: 1 } | { kind: "b"; b: 2 })` is `"kind"`); an intersection gives all of them. Checked on 7.0.2 and 5.9.3.
- Forgetting `as const`. Without it `typeof roles` is `string[]` and `[number]` gives `string`, not the literals.
- Treating `keyof` on class values loosely: `keyof C` is the instance keys (`"x"`); the static side needs `keyof typeof C` (`"s" | "prototype"`).

## Follow-ups

**Q:** Why is `keyof { [k: string]: boolean }` `string | number`?
**A:** JavaScript converts numeric property keys to strings, so `obj[0]` and `obj["0"]` are the same access; the handbook gives this as the reason.

**Q:** What is `keyof unknown`, and `keyof any`?
**A:** Checked on both: `keyof unknown` is `never`; `keyof any` is `string | number | symbol`.

## Deep dive

### How it works

TypeScript keeps values and types in separate namespaces. A type position cannot name a variable, so `typeof` is the explicit bridge: it queries the *declared or inferred type* of an identifier at that point. Because it asks about a name rather than evaluating code, calls are not allowed; `ReturnType<typeof connect>` asks for the function's type, then extracts the return type.

`keyof` and `T[K]` are inverses in the sense of a lookup: `keyof T` enumerates the keys, `T[keyof T]` enumerates the value types. When `K` is a union, the lookup maps over each member and unions the results. When `T` is a tuple, `Pair[number]` unions all element types while `Pair[0]` gives one; an out-of-range tuple index is a compile error (TS2493), whereas an array index (`number`) never is.

### Edge cases

- Enums: `keyof typeof E` is `"A" | "B"`; plain `keyof E` on a numeric enum is the keys of `number` (`"toFixed" | "toString" | ...`), not its member names (checked on 7.0.2).
- `keyof string` includes every `String` method name, plus `number` for index access and a `unique symbol`. It is rarely what you want.
- `keyof` of a mapped type over `string`, such as `Record<string, 1>`, printed `string` on 5.9.3 rather than `string | number`, unlike an explicit index signature (❓ the cause was not investigated; do not rely on either).
- Printed order of union members differs between compiler versions (`"admin" | "user"` on 7.0.2, `"user" | "admin"` on 5.9.3). Unions are unordered; do not depend on it.

### Real-world scenario

A permissions list:

```ts
const permissions = ["read", "write", "admin"] as const;
type Permission = (typeof permissions)[number];

function can(user: { permissions: readonly Permission[] }, p: Permission) {
  return user.permissions.includes(p);
}
```

The array is both the runtime list for validation and the source of the union, so they cannot drift apart.

### Trade-offs

Deriving types from values keeps one source of truth but couples the type to the value's literal shape (`as const` is required) and makes error messages mention the derived structure. For public APIs prefer an explicit named type and derive the runtime list from it only if you can tolerate the extra indirection.

## Exercises

### Element type

What is `Fruit`?

```ts
const fruits = ["apple", "pear"] as const;
type Fruit = (typeof fruits)[number];
```

**Answer:** `"apple" | "pear"`. Without `as const` it would be `string`.
