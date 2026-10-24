---
title: "What does TypeScript erase at compile time, and what does that mean for runtime checks?"
status: draft
difficulty: medium
frequency: 5
core: true
tags: [type-erasure, runtime-validation, zod, type-guards, assertions, tsc]
related:
  - typescript/inference-and-narrowing/custom-type-guards
  - typescript/inference-and-narrowing/assertions-and-non-null
  - typescript/classes-enums-runtime-output/erasable-syntax-only
  - typescript/the-compiler/checking-vs-emitting
  - typescript/the-compiler/node-type-stripping
verified: 2026-10
sources:
  - https://github.com/microsoft/TypeScript/wiki/TypeScript-Design-Goals
  - https://www.typescriptlang.org/docs/handbook/2/everyday-types.html
  - https://www.typescriptlang.org/docs/handbook/2/narrowing.html
  - https://www.typescriptlang.org/docs/handbook/2/functions.html
  - https://nodejs.org/docs/latest-v24.x/api/typescript.html
  - https://zod.dev/basics
tldr: >
  The compiler checks types, then deletes them: annotations, interfaces, type aliases, generics,
  `as`, `satisfies` and `!` leave no trace in the JavaScript. So types cannot be used as values
  (`x instanceof User` is an error) and nothing validates data at runtime. Data from outside
  (JSON, network, storage) needs a runtime check such as a schema library or a guard.
---

## Answer

TypeScript's types exist only during checking. When `tsc` emits JavaScript it removes every construct that exists purely for the type system:

- annotations and return types, `interface` and `type` declarations, generics and their arguments;
- `as`, `satisfies`, `!` and overload signatures;
- `declare` statements, `abstract` and `private`/`readonly`/`override` modifiers, `import type`/`export type`.

Erasure is a stated design goal: the Design Goals page lists "impose no runtime overhead" and "use a consistent, fully erasable, structural type system", and lists "add or rely on run-time type information" as a non-goal.

Consequences I would name in an interview:

1. **A type is not a value.** `x instanceof User`, `typeof User` in a value position, or `v === Id` for an interface or alias is error TS2693. There is nothing at runtime to refer to.
2. **Types do not validate.** `JSON.parse(text) as User` compiles to `JSON.parse(text)`. If the payload has `id: "7"`, the code runs with a string where the type says `number`, and fails later, away from the cause.
3. **Overloads and generics do not change runtime behavior.** There is one JavaScript function, so you cannot dispatch on a type parameter.

So the type system describes data you already trust, and anything that crosses a trust boundary (network, `JSON.parse`, `localStorage`, `process.env`, user input) must be checked with runtime code. Two options: a **schema library** (Zod and similar), where one definition gives both a validator and, through inference, the static type; or a **user-defined type guard** you write yourself. A guard is a promise, not a check: TypeScript believes the `v is User` return type without looking at the body.

A few constructs are *not* erased because they need generated code (enums, namespaces with values, parameter properties). That is the subject of `erasableSyntaxOnly`.

## Example

```ts
// TypeScript 7.0.2 (6.0.3 emitted the same JS), Node 24.19.0, zod 4.6.7
import { z } from "zod";

interface User {
  id: number;
  name: string;
}
const UserSchema = z.object({ id: z.number(), name: z.string() });

const input: unknown = JSON.parse('{"id":"7","name":"Ada"}');

const cast = input as User; // compiles; the assertion is erased
console.log(typeof cast.id); // → string

console.log(UserSchema.safeParse(input).success); // → false

if (input instanceof User) {
  // Error TS2693: 'User' only refers to a type, but is being used as a value here.
}
```

`tsc` still wrote `out/example.js` despite the error, and running it printed `string`, `false`, then `ReferenceError: User is not defined` at the `instanceof` line: the identifier `User` does not exist in the output.

## Pitfalls

- Reading `as User` as a conversion or a check. It changes only what the compiler believes; the object is untouched. With `{"id":"7"}` the `.toFixed(2)` call failed with `TypeError: user.id.toFixed is not a function` at runtime on Node 24.19.0.
- Writing a guard like `(v: unknown): v is User => true`. `tsc` accepted it, and `input.name.toUpperCase()` on the parsed value `42` threw `TypeError: Cannot read properties of undefined (reading 'toUpperCase')`.
- Assuming `private` hides a field at runtime. `private tag: string = "s"` was emitted as the public class field `tag = "s"`; a `#tag` field was not part of the logged object `K { t2: 2 }`, so use `#` for runtime privacy.
- Hoping errors block output. `noEmitOnError` defaults to `false`, so a file with type errors still produced JavaScript.

## Follow-ups

**Q:** Can I get types at runtime by emitting them?
**A:** Not from `tsc` itself; the Design Goals list it as a non-goal. You define a runtime value (a schema) and derive the type from it with `z.infer`, so the two cannot drift apart.

**Q:** Why are enums an exception to erasure?
**A:** An enum is also a runtime object, so the compiler must generate code for it. Node.js 24's type stripping rejects it for that reason; see the `erasableSyntaxOnly` question.

## Deep dive

### How it works

The pipeline checks first and emits second (see the compiler-pipeline question). The emit step works on the syntax tree and drops every node that belongs to the type layer. I compared `tsc` 6.0.3 and 7.0.2 on a file containing a type alias, a generic interface, an abstract class with a `private` field, overloads, a `declare const`, `satisfies`, a non-null `!` and `export type`. Both printed identical JavaScript:

```js
class Shape {
    tag = "s";
}
function wrap(value) { return { value }; }
function pick(x) { return x; }
const cfg = { port: 80 };
const n = wrap(3).value;
export { n, cfg, pick, Shape };
```

Everything type-only is gone: the `Id` alias, `Box<T>`, the two overload signatures, `ambient`, the `import type` line and the `export type` line. The abstract method disappeared with the `abstract` modifier; the `private` field stayed as an ordinary one.

Erasure is also why Node can run `.ts` files by stripping: if deleting the type syntax leaves valid JavaScript, a tool does not need the checker to run the code.

### Edge cases

- **Type-only imports.** `import type { Buffer }` is always removed. A plain `import { Buffer }` used only as a type was removed from the 6.0.3 and 7.0.2 output too, which is why `verbatimModuleSyntax` and `isolatedModules` exist: a per-file tool cannot tell which imports are types. See the import-type question.
- **Narrowing uses real values.** `typeof x === "string"`, `instanceof Date`, `"id" in x` and `Array.isArray(x)` are real JavaScript that survives; TypeScript merely reads them as evidence. The Handbook's narrowing page calls these *type guards*. Narrowing by a checked fact is safe; narrowing by an unchecked claim (`as`, a guard that returns `true`) is not.
- **Classes are values and types.** `class User {}` creates a runtime constructor, so `instanceof User` is legal. That checks the prototype chain, not the shape, so a plain `{ id: 1 }` object fails it.
- **Overloads.** Only the implementation signature is emitted, so branching must be done with ordinary runtime checks inside it.

### Real-world scenario

A fetch wrapper typed `async function getUser(): Promise<User>` returns `res.json() as Promise<User>`. The backend ships a change where `id` becomes a string, and the frontend keeps compiling. The failure shows up three components away as `toFixed is not a function`. The fix is to validate at the boundary, once:

```ts
const UserSchema = z.object({ id: z.number(), name: z.string() });
type User = z.infer<typeof UserSchema>;

async function getUser(): Promise<User> {
  const res = await fetch("/api/user");
  return UserSchema.parse(await res.json()); // throws ZodError on a bad payload
}
```

Inside the program, everything downstream trusts `User`. The check runs at the edge, and the failure names the field.

### Trade-offs

| Approach | Static type | Runtime check | Risk |
|---|---|---|---|
| `as User` | yes | none | Silent mismatch |
| Hand-written guard | yes | what you wrote | Guard and type drift apart |
| Schema (`z.infer`) | derived from schema | full | Extra dependency, parse cost |

Per the Zod docs, `z.infer` extracts the static type from the schema, so one definition serves both jobs. Validation costs time on every call, so I put it at trust boundaries and not on each internal function call.

## Exercises

### What does this print?

```ts
interface Point { x: number }
const raw: unknown = { x: "1" };
const p = raw as Point;
console.log(p.x + 1);
```

**Answer:** `11`. The assertion is erased, so `p.x` is still the string `"1"` and `+` concatenates. Compiled with 6.0.3 and 7.0.2 and run on Node 24.19.0, it printed `11`.
