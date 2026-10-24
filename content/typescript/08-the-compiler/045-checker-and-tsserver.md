---
title: "How does the checker relate and cache types, and how do editors talk to `tsserver`?"
status: draft
difficulty: hard
frequency: 2
core: false
tags: [checker, assignability, comparability, type-identity, interning, tsserver, lsp, language-service]
related:
  - typescript/the-compiler/compiler-pipeline
  - typescript/the-compiler/native-compiler-port
  - typescript/the-compiler/compiler-api-migration
  - typescript/type-system-basics/structural-typing
  - typescript/generics/variance
  - typescript/generics/generic-inference
verified: 2026-10
perishable:
  - "Union order: 6.0.3 by type id, 7.0.2 by content"
  - "TS 7 language server: LSP via tsc --lsp --stdio"
sources:
  - https://github.com/microsoft/TypeScript/blob/v6.0.3/src/compiler/checker.ts
  - https://github.com/microsoft/typescript-go/blob/main/internal/checker/relater.go
  - https://github.com/microsoft/TypeScript/wiki/Architectural-Overview
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html
  - https://github.com/microsoft/TypeScript/wiki/Standalone-Server-%28tsserver%29
  - https://github.com/microsoft/TypeScript/blob/v6.0.3/src/server/protocol.ts
  - https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
  - https://github.com/microsoft/typescript-go/blob/main/internal/lsp/server.go
  - https://github.com/microsoft/TypeScript/issues/63800
tldr: >
  In tsc's checker each relation (assignable, comparable, identity, subtype) is one algorithm plus
  a cache keyed by the two type ids. It compares structurally after cheap checks, assumes "maybe"
  on recursion, and compares generics by variance. Types are interned, so equal types are often
  one object. Editors talk to `tsserver`'s own JSON protocol; TS 7's server speaks LSP.
---

## Answer

What follows is implementation, not spec: tsc 6.0.3's `checker.ts`, whose design the Go port's `relater.go` keeps.

**Relations.** Each relation has its own result map. `assignableRelation` serves assignments and arguments. `comparableRelation` serves type assertions and `===`/`switch` overlap checks, and is looser: roughly, either side may be assignable to the other. `identityRelation` serves redeclared `var`s, and subtype relations serve union reduction. `isTypeRelatedTo` tries cheap paths first: the same object, simple flag rules (anything to `unknown`), then the cache, keyed `"sourceId,targetId"`. Only then does it compare members, signatures and index signatures structurally, storing Succeeded or Failed.

**Recursion and generics.** A pair being compared sits on a "maybe" stack; meeting it again returns Maybe, so recursive types terminate. Depth limits stop expanding types (TS2321, excessive stack depth). Two instantiations of one generic compare type arguments by its variance, measured once per type.

**Interning.** One literal type exists per value. Unions are deduplicated, sorted by type id and cached by member list; `Array<string>` comes from a per-generic instantiation map. Equal types are therefore often one object and hit the first fast path. Ids follow creation order, so 6.0 output can depend on checking order; 7.0, with parallel checkers, sorts by content.

**Inference** walks source and target together, collecting candidates per type parameter with priorities, and defers context-sensitive arguments (unannotated callbacks) to a second pass.

**Editors.** On 6.0, VS Code spawns `tsserver`: JSON requests on stdin (`seq`, `type`, `command`, `arguments`), `Content-Length`-framed responses and events such as `semanticDiag`, 1-based `line`/`offset`. TypeScript 7's server (`tsc --lsp --stdio`) speaks the Language Server Protocol instead: JSON-RPC, an `initialize` capability handshake, `textDocument/hover`, pulled diagnostics, 0-based positions, several threads.

## Example

```ts
interface Point { x: number; y: number }
class Vec { constructor(public x: number, public y: number) {} }

// assignable: structural, so a Vec is a Point
const p: Point = new Vec(1, 2);

// comparable: an assertion needs either side assignable to the other
const wide = { x: 1 } as Point; // OK: Point is assignable to { x: number }
const worse = "1" as number;
// Error: TS2352: Conversion of type 'string' to type 'number' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.

// comparable: === needs possible overlap
declare const dir: "up" | "down";
if (dir === "left") {}
// 7.0.2 Error: TS2367: This comparison appears to be unintentional because the types '"down" | "up"' and '"left"' have no overlap.
// 6.0.3 Error: TS2367: This comparison appears to be unintentional because the types '"up" | "down"' and '"left"' have no overlap.

// identity: a redeclared var must have an identical type
var id: { a: string };
var id: { a: string | undefined };
// Error: TS2403: Subsequent variable declarations must have the same type.  Variable 'id' must be of type '{ a: string; }', but here has type '{ a: string | undefined; }'.
export {};
```

## Pitfalls

- Reading `as` as "assignable". Assertions use comparability, so `{ x: 1 } as Point` compiles although `{ x: 1 }` is not a `Point`; only types with no overlap (TS2352) need `as unknown as`.
- Snapshot-testing union order in errors or `.d.ts` output. 6.0.3 prints members in type-id order, 7.0.2 in content order; 6.0.3 with `--stableTypeOrdering` prints `"down" | "up"` like 7.0.2.
- Mixing coordinates. `tsserver` takes 1-based `line`/`offset` (`quickinfo` on `point` was line 1, offset 7); LSP takes 0-based `line`/`character` (the same hover was line 0, character 6).
- Expecting a 6.0 `tsserver` plugin to load into TypeScript 7's server. The Go server cannot load third-party code; those tools need the new API (see the migration question).

## Follow-ups

**Q:** Why key the cache by ids rather than by structure?
**A:** Hashing structure costs about as much as comparing it. Ids are numbers fixed at creation, and because literals, unions and instantiations are interned, the same pair of objects recurs constantly, for example every call passing `string[]` where `readonly string[]` is expected.

**Q:** How does `--checkers 4` on 7.0 affect this?
**A:** In the Go port the relation maps are fields of each `Checker`, so each checker builds its own caches and ids. The 6.0 notes explain the consequence: creation order, and so ids, became non-deterministic, which is why 7.0 sorts types by content.

**Q:** How does an editor get diagnostics from `tsserver`?
**A:** Usually with `geterr`: 6.0.3 checked the file in the background and pushed `syntaxDiag`, `semanticDiag` and `suggestionDiag` events, then `requestCompleted`. `semanticDiagnosticsSync` returns them in the response. Over LSP, 7.0.2 advertises `diagnosticProvider` and the client pulls with `textDocument/diagnostic`.

## Exercises

### Same object or not?

```ts
// ident.ts, loaded with ts.createProgram on 6.0.3; t.x = checker.getTypeAtLocation(<name x>)
let a: string[] = [];
let b: Array<string> = [];
let c: "x" | "y" = "x";
let d: "y" | "x" = "y";
let e: { n: number } = { n: 1 };
let f: { n: number } = { n: 2 };
// console.log(t.a === t.b, t.c === t.d, t.e === t.f, checker.isTypeAssignableTo(t.e, t.f))
```

**Answer:** `true true false true`. `string[]` and `Array<string>` are one cached instantiation; both unions sort to the same member list and hit the union cache; each object literal type is a new anonymous type, so `e` and `f` are related structurally, not by identity.
