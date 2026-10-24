---
title: "How do decorator metadata and `accessor` fields work, and what did `emitDecoratorMetadata` give DI frameworks?"
status: draft
difficulty: hard
frequency: 2
core: false
tags: [decorators, decorator-metadata, symbol-metadata, auto-accessors, emitdecoratormetadata, dependency-injection]
related:
  - typescript/classes-enums-runtime-output/decorators
  - typescript/classes-enums-runtime-output/class-field-semantics
  - typescript/modules-and-declaration-files/import-type-isolated-modules
  - typescript/classes-enums-runtime-output/erasable-syntax-only
verified: 2026-10
perishable:
  - "Decorators and decorator metadata listed at Stage 2.7 (checked 2026-10)"
  - "Node 24 lacks Symbol.metadata, decorators and the accessor keyword"
sources:
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html#decorator-metadata
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#auto-accessors-in-classes
  - https://www.typescriptlang.org/docs/handbook/decorators.html#metadata
  - https://www.typescriptlang.org/tsconfig/#emitDecoratorMetadata
  - https://github.com/tc39/proposal-decorator-metadata
  - https://github.com/tc39/proposal-decorators
  - https://github.com/tc39/proposals
tldr: >
  Standard decorators share one `context.metadata` object per class, published as
  `Class[Symbol.metadata]` and prototype-linked to the parent's. `accessor x` makes a getter/setter
  pair over private storage, so a decorator can intercept reads and writes. `emitDecoratorMetadata`
  is legacy-only: it records erased types as `design:paramtypes`, which DI containers use to pick
  constructor arguments.
---

## Answer

**Decorator metadata (TS 5.2).** Every standard decorator on a class and its members receives the same `context.metadata` object. After the class is defined it is stored on `Class[Symbol.metadata]`. For a subclass, the object's prototype is the parent's metadata, so reads fall back to the parent while writes stay local. This replaces the `reflect-metadata` global registry with plain objects: a `@column` field decorator records names, and an ORM reads `Model[Symbol.metadata].columns` later. The `tc39/proposals` list puts it at Stage 2.7 while its README says Stage 3 (fetched 2026-10).

Runtime: Node 24.19 has no `Symbol.metadata`, and TypeScript's helper then passes `undefined`, so `context.metadata.x` throws a TypeError. Polyfill before any decorated class is evaluated. Types: `lib` must include `esnext` or `esnext.decorators`; without it `context.metadata` is typed `DecoratorMetadataObject | undefined` (TS18048).

**`accessor` fields (TS 4.9).** `accessor status = "new"` turns into a `get`/`set` pair on the prototype over a private `#status_accessor_storage` field. Field decorators only see the initial value (their `value` is `undefined`); an accessor decorator gets `{ get, set }` and returns any of `{ get, set, init }`, so it can observe or validate every write: signals, change tracking, validation. Node 24.19 cannot parse `accessor` either (SyntaxError), so TypeScript lowers it below `--target esnext`.

**`emitDecoratorMetadata` (legacy).** With `experimentalDecorators` (TS5052 without it), `tsc` adds `__metadata("design:paramtypes", [...])` to decorated classes, plus `design:type` and `design:returntype` on members. These are runtime constructor references for erased types, so a container reading them through `reflect-metadata` knows which classes to `new` for a constructor. Interfaces, unions and type aliases become `Object`, so those dependencies need explicit tokens. Standard decorators do not support it. TypeScript 7.0.2 still accepts both legacy flags, with emit identical to 6.0.3.

## Example

```ts
// TypeScript 7.0.2 and 6.0.3, --strict --target es2022 --lib esnext; Node 24.19
(Symbol as { metadata?: symbol }).metadata ??= Symbol("Symbol.metadata"); // Node 24 has none

// Field decorator: records column names on the class's metadata object
function column(_: undefined, ctx: ClassFieldDecoratorContext) {
  const inherited = (ctx.metadata.columns ?? []) as string[]; // may be the parent's array
  if (!Object.hasOwn(ctx.metadata, "columns")) ctx.metadata.columns = [...inherited];
  (ctx.metadata.columns as string[]).push(String(ctx.name));
}

// Accessor decorator: wraps the generated get/set pair, which a field decorator cannot
function observed<This, V>(
  target: ClassAccessorDecoratorTarget<This, V>,
  ctx: ClassAccessorDecoratorContext<This, V>,
): ClassAccessorDecoratorResult<This, V> {
  return { set(v) { console.log(`${String(ctx.name)} ←`, v); target.set.call(this, v); } };
}

class Row { @column id = 0; }
class UserRow extends Row {
  @column name = "";
  @observed accessor status = "new";
}

const row = new UserRow();
row.status = "active"; // → status ← active
console.log(Row[Symbol.metadata]!.columns, UserRow[Symbol.metadata]!.columns);
// → [ 'id' ] [ 'id', 'name' ]
console.log(Object.getPrototypeOf(UserRow[Symbol.metadata]) === Row[Symbol.metadata]); // → true
console.log(Object.keys(row)); // → [ 'id', 'name' ]
```

## Pitfalls

- Mutating inherited metadata. `ctx.metadata.list ??= []` in a subclass finds the parent's array through the prototype and pushes into it, so the parent's metadata changes too. Copy before writing (see the exercise).
- Copying the 5.2 release notes' polyfill verbatim. `Symbol.metadata ??= Symbol("Symbol.metadata")` is TS2540 ("Cannot assign to 'metadata' because it is a read-only property") under `lib` esnext on both versions; cast `Symbol` first, as above.
- Plain imports of types under `isolatedModules`. With `emitDecoratorMetadata`, an interface brought in by a normal `import { Clock }` and used in a decorated constructor is TS1272 ("must be imported with 'import type' or a namespace import"): per-file emit can't tell whether `Clock` is a value it should reference. Use `import type`.
- Expecting `emitDecoratorMetadata` with standard decorators, or real types for interfaces. Neither exists: the flag is legacy-only, and `Clock` (an interface) or `string | number` is emitted as `Object`.

## Follow-ups

**Q:** What exactly does `emitDecoratorMetadata` emit for a constructor?
**A:** For `constructor(logger: Logger, clock: Clock, id: string | number, n: number)` on an `@Injectable()` class, 6.0.3 and 7.0.2 both emitted `__metadata("design:paramtypes", [Logger, Object, Object, Number])` inside `__decorate`. The helper calls `Reflect.metadata` only if a polyfill defined it.

**Q:** Why do field decorators need `accessor` to intercept writes?
**A:** A standard field is defined on the instance as a data property (`[[Define]]`), so there is no setter to wrap; a field decorator can only replace the initial value. `accessor` puts a real getter/setter on the prototype that the decorator replaces.

**Q:** Do `accessor` fields show up in `Object.keys`?
**A:** No. The value lives in a private `#…_accessor_storage` field and the getter/setter sit on the prototype, so `Object.keys(row)` above lists only `id` and `name`, and `JSON.stringify` skips `status` as well.

## Exercises

### What does this print?

```ts
(Symbol as { metadata?: symbol }).metadata ??= Symbol("Symbol.metadata");
function required(_: undefined, ctx: ClassFieldDecoratorContext) {
  ((ctx.metadata.required ??= []) as string[]).push(String(ctx.name));
}
class User { @required name = ""; }
class Admin extends User { @required role = ""; }
console.log(User[Symbol.metadata]!.required);
```

**Answer:** `[ 'name', 'role' ]`. While decorating `Admin`, `ctx.metadata.required` reads through the prototype and finds `User`'s array, so `??=` assigns nothing and `push` modifies the parent's list. Copy into an own property first.

### What happens without the polyfill?

```ts
// Same file, first line removed, compiled with --target es2022 and run on Node 24.19
```

**Answer:** `TypeError: Cannot read properties of undefined (reading 'required')` while the class is being defined. The emitted helper creates a metadata object only when `Symbol.metadata` exists; otherwise `context.metadata` is `undefined`, although `lib` esnext types it as always present.
