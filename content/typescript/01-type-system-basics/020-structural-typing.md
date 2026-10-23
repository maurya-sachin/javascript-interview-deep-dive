---
title: "What is structural typing, and how does it differ from nominal typing?"
status: draft
difficulty: medium
frequency: 5
core: true
tags: [structural-typing, nominal-typing, assignability, branded-types, private-members]
related:
  - typescript/type-system-basics/type-vs-interface
verified: 2026-10
perishable:
  - "Nominal types request #202 still open (checked 2026-10)"
sources:
  - https://www.typescriptlang.org/docs/handbook/type-compatibility.html
  - https://www.typescriptlang.org/docs/handbook/2/everyday-types.html
  - https://github.com/microsoft/TypeScript/wiki/FAQ
  - https://github.com/microsoft/TypeScript/issues/202
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-7.html
  - https://nodejs.org/docs/latest-v24.x/api/typescript.html
tldr: >
  TypeScript relates types by their members, not their names: a value is assignable if it has
  everything the target requires, extra members included. Nominal systems require a declared
  relationship. Simulate nominal types with private members or a phantom "brand" property,
  at the cost of a cast at the single place the brand is granted.
---

## Answer

**Structural typing:** type compatibility depends only on members. If `S` has every property `T` requires, with compatible types, `S` is assignable to `T`, whatever the two are called and whether or not either declares a relationship to the other. The handbook contrasts this with nominal typing (C#, Java), where a class must explicitly declare that it implements an interface. Two consequences:

- **Extra members are fine** when assigning a variable. A `Point3D` is usable as a `Point2D`. (Fresh object literals are checked more strictly; see excess property checks.)
- **Identical shapes are interchangeable.** `Meters` and `Feet` classes that both have `value: number` can be swapped.

This fits JavaScript, where code is written against shapes ("anything with `.length`") and rarely against class hierarchies.

**Where nominal behaviour exists anyway:** a class with a `private` or `protected` member (or `#private` field) is only compatible with types that originate from that same declaration. Enums from different declarations are incompatible. `unique symbol` types are distinct per declaration.

**Simulating nominal types** ("branding"): intersect the base type with a phantom property that exists only in the type system, and grant it in one validating function. Branded `UserId` and `OrderId` strings can't be mixed up, but cost one `as` cast in the constructor, and the brand doesn't exist at runtime.

**Soundness:** structural typing isn't sound everywhere; the handbook says the places where TypeScript permits unsound behaviour were deliberately chosen (for example parameter bivariance, covered in the function-types question).

## Example

```ts
// TypeScript 7.0.2, --strict
interface Point2D { x: number; y: number }
interface Point3D { x: number; y: number; z: number }
declare const p3: Point3D;
const p2: Point2D = p3; // OK: p3 has everything Point2D needs
const back: Point3D = p2;
// Error TS2741: Property 'z' is missing in type 'Point2D' but required in type 'Point3D'.

class Meters { value = 0 }
class Feet { value = 0 }
const m: Meters = new Feet(); // OK: same shape, different names

declare const brand: unique symbol; // type-only, emits nothing
type UserId = string & { readonly [brand]: "UserId" };
type OrderId = string & { readonly [brand]: "OrderId" };
const toUserId = (raw: string) => raw as UserId; // the one place the brand is granted
function loadUser(id: UserId) { return id; }
declare const orderId: OrderId;
loadUser(toUserId("u_1")); // OK
loadUser("u_1");
// Error TS2345: Argument of type 'string' is not assignable to parameter of type 'UserId'.
//   Type 'string' is not assignable to type '{ readonly [brand]: "UserId"; }'.
loadUser(orderId);
// Error TS2345: Argument of type 'OrderId' is not assignable to parameter of type 'UserId'.
//   Type 'OrderId' is not assignable to type '{ readonly [brand]: "UserId"; }'.
//     Types of property '[brand]' are incompatible.
//       Type '"OrderId"' is not assignable to type '"UserId"'.
```

## Pitfalls

- Saying TypeScript "has no nominal behaviour." Private/protected/`#private` members, enums, and `unique symbol` all make types incompatible despite equal shape.
- Thinking a declared name protects you. `type Meters = number` and `type Feet = number` are the same type; aliases never create a new one.
- Declaring `interface Thing {}` or `{}` as "anything with some shape." Types with no members accept almost any value (the FAQ says to avoid them); `{}` rejects only `null` and `undefined`.
- Treating a brand as validation. The `as` cast in the constructor is the only guarantee; if it isn't preceded by a runtime check, the brand is a lie.

## Follow-ups

**Q:** Why can a function with fewer parameters be assigned to a type with more?
**A:** Callers of the target type will pass the extra arguments and the function ignores them, which is safe and matches idioms like `forEach` callbacks. The reverse is an error: `Target signature provides too few arguments`.

**Q:** Will TypeScript get real nominal types?
**A:** The request (microsoft/TypeScript#202) is still open and in discussion as of this writing. Branding and private members are the workarounds.

## Deep dive

### How it works

Assignability asks whether the source type's members satisfy the target's, recursively. Names of interfaces, classes, and aliases play no part: a type alias is only a label, and the compiler compares what it expands to. For functions, the return type must be assignable, and parameters are compared by the rules in the function-types question. For generics, the handbook notes that type parameters only matter when used in a member: `Empty<number>` and `Empty<string>` with no members are mutually assignable.

Nominal-like rules are layered on specific constructs. For private and protected members the handbook says the source must contain a member that "originated from the same class". Verified with TS 7.0.2:

```ts
class SecretA { private secret = 1 }
class SecretB { private secret = 1 }
const a: SecretA = new SecretB();
// Error TS2322: Type 'SecretB' is not assignable to type 'SecretA'.
//   Types have separate declarations of a private property 'secret'.

class Hidden { #id = 1 }
class Hidden2 { #id = 1 }
const h: Hidden = new Hidden2();
// Error TS2322: Type 'Hidden2' is not assignable to type 'Hidden'.
//   Property '#id' in type 'Hidden2' refers to a different member that cannot be accessed from within type 'Hidden'.
```

### Edge cases

- **Empty and top-like types.** `interface Empty {}` accepts `42`; `{}` accepts anything except `null`/`undefined` (`Type 'null' is not assignable to type '{}'`); `object` rejects primitives (`Type 'string' is not assignable to type 'object'`). All three checked on 7.0.2.
- **Fewer parameters are assignable, more are not.** `(a: number, b: number) => number` accepts `(n: number) => n`, but not the reverse: `Target signature provides too few arguments. Expected 2 or more, but got 1.`
- **Aliases of the same type are interchangeable.** A "branded alias" needs an actual extra member; a different name is not enough.
- **The brand is erased.** After compilation there is only a string; nothing at runtime can tell a `UserId` from an `OrderId`.

### Real-world scenario

IDs and units. An API takes `userId` and `orderId`, both strings; swapping them compiles and fails in production. Brand them, and make construction the validation point:

```ts
declare const brand: unique symbol;
type Email = string & { readonly [brand]: "Email" };
function parseEmail(raw: string): Email {
  if (!raw.includes("@")) throw new RangeError(`not an email: ${raw}`);
  return raw as Email;
}
function send(to: Email) { console.log("sending to", to); }
send(parseEmail("a@b.co")); // → sending to a@b.co
send("a@b.co");
// Error TS2345: Argument of type 'string' is not assignable to parameter of type 'Email'.
//   Type 'string' is not assignable to type '{ readonly [brand]: "Email"; }'.
```

Run on Node 24.19 with its built-in type stripping (type stripping is on by default; the `send("a@b.co")` line removed): `sending to a@b.co`, and `parseEmail("nope")` throws `not an email: nope`.

### Trade-offs

Structural typing keeps typing cheap for JavaScript idioms (object literals, duck-typed callbacks, mocks) and lets unrelated code interoperate without shared base classes. The cost is accidental compatibility. Pick the cheapest tool that stops the mixing you care about: a branded primitive for IDs and units; a class with a `#private` field for objects with identity; a discriminant property (`kind: "circle"`) for unions. Avoid brands when no runtime check backs them: they then only document intent. ❓ Whether a future TypeScript version will add native nominal types is not decided.
