---
title: "How do tools built on the TypeScript compiler API move to the native compiler?"
status: draft
difficulty: hard
frequency: 2
core: false
tags: [typescript-7, compiler-api, ipc, typescript-eslint, volar, content-mappers, language-service-plugins]
related:
  - typescript/the-compiler/native-compiler-port
  - typescript/the-compiler/compiler-pipeline
  - typescript/the-compiler/checker-and-tsserver
  - typescript/tsconfig-and-strictness/migrating-to-typescript-7
verified: 2026-10
perishable:
  - "7.1 API is in beta (7.1.0-beta, 20 Oct 2026)"
  - "typescript-eslint 8.72.0 peer range: typescript <6.1.0"
  - "typescript-eslint native backend is a draft PR"
  - "@vue/content-mapper at 4.0.0-alpha.0"
sources:
  - https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
  - https://devblogs.microsoft.com/typescript/announcing-typescript-7-1-beta/
  - https://github.com/microsoft/TypeScript/issues/63800
  - https://github.com/microsoft/typescript-go/pull/711
  - https://github.com/typescript-eslint/typescript-eslint/issues/10940
  - https://github.com/typescript-eslint/typescript-eslint/pull/12803
  - https://github.com/vuejs/language-tools/issues/5381
tldr: >
  TypeScript 7.0 has no stable API: its `typescript` entry exports only the version. 7.1 (beta,
  October 2026) adds a new, different API in `typescript/sync` and `typescript/async`, a client
  making IPC calls to the native process. Tools port to it; tsserver plugins become content
  mappers or API clients. Until then they run on `@typescript/typescript6`.
---

## Answer

The 6.0 API was the compiler itself: `require("typescript")` loaded it into your process, so tools held `ts.Node` and `ts.Type` objects, patched the language service (tsserver plugins) and passed custom transformers to `emit`. The Go port cannot do that. The team's API issue (#63800) says: "we can't dynamically link third-party code into the server process."

- **7.0** ships no API. On 7.0.2 the `typescript` entry exports only `version` and `versionMajorMinor`; experiments sit under `typescript/unstable/*`. API tools keep 6.0 through an npm alias, `"typescript": "npm:@typescript/typescript6"`, with 7.0 installed under another name for the CLI.
- **7.1** (beta on 20 October 2026, RC planned about a month later) ships a new, different API: `typescript/sync`, `typescript/async`, `typescript/ast`, `typescript/fs`. A JavaScript client spawns the native compiler and calls it over IPC. The API, programs and snapshots are disposable (`using`), and types and symbols are remote handles with lazy methods (`type.getSymbol()`, not `type.symbol`). Much of `Program` and `TypeChecker` is mirrored, but every call is a round trip.

Per tool:

- **typescript-eslint** (8.72.0, peer `typescript <6.1.0`) stays on 6.0. A draft PR adds `projectService: { EXPERIMENTAL_backend: 'native' }`, adapting the 7.1 API to the classic shapes; it measures up to ~1.5x slower on many files, blaming the synchronous round trips, until bulk APIs land.
- **Volar-based tooling** (Vue, Astro, Svelte, MDX) moves to **content mappers**: a package listed in tsconfig's `contentMappers` that gives TypeScript a virtual TypeScript view of, say, `.vue` files, with mappings back. Editors use it; `tsc` needs `--runExternalCode`.
- **Language-service plugins** have no in-process equivalent: rewrite one as a content mapper or as a separate server that queries TypeScript through the API.
- **Custom transformers**: 7.1.0-beta's `emit()` takes none.

## Example

```ts
// check.ts with typescript@7.1.0-beta; node check.ts (Node 24.19 strips types)
import { API } from "typescript/sync";

using api = new API(); // spawns the native compiler, closed at scope end
const program = api.createProgram(["sample.ts"], { strict: true, noEmit: true });
const checker = program.getProject().checker;

for (const d of program.getSemanticDiagnostics("sample.ts")) {
  console.log(`TS${d.code} ${d.text}`);
}
const point = checker.getTypeAtPosition("sample.ts", 6)!; // `point`
console.log(checker.typeToString(point));
console.log(checker.isTypeAssignableTo(point, checker.getNumberType()));
// sample.ts: const point = { x: 1, y: 2 }; const label: string = 42;
// → TS2322 Type 'number' is not assignable to type 'string'.
// → { x: number; y: number; }
// → false

// The 6.0 shape it replaces (in-process objects, nothing to dispose):
//   import ts from "typescript";
//   const program = ts.createProgram(["sample.ts"], { strict: true, noEmit: true });
//   const checker = program.getTypeChecker();
// On 7.0.2 and 7.1.0-beta, `import ts from "typescript"` has only version fields.
```

## Pitfalls

- Bumping `typescript` to 7.x in a repo with typed linting. npm fails with `ERESOLVE` on typescript-eslint 8.72.0's peer range; with `--force`, requiring `@typescript-eslint/typescript-estree` throws `TypeError: Cannot read properties of undefined (reading 'Cjs')` (it reads `ts.Extension.Cjs`).
- Porting call for call. Each checker call is an IPC round trip; 7.1.0-beta offers `api.batch(...)` with `.gen` request generators, so fetch in bulk where you can.
- Building on 7.0's `typescript/unstable/*`. 7.1.0-beta moved it (`typescript/unstable/sync` became `typescript/sync`) and changed shapes: 7.0.2 had `updateSnapshot`, 7.1.0-beta has `createProgram` and `createSnapshot`.
- Leaking remote state. Objects live in the native process until disposed: use `using` or call `dispose()`/`close()`.

## Follow-ups

**Q:** Is the 7.1 API final?
**A:** Not yet. It is in beta, and the post says the team is working with partner teams to make it ergonomic and fast enough for real-world use. Treat entry points and method names as subject to change until 7.1.0 ships.

**Q:** How do you run 6.0 and 7.0 in one repo?
**A:** The 7.0 announcement's recipe: `"typescript": "npm:@typescript/typescript6@^6.0.2"` for anything that resolves `typescript`, plus `"@typescript/native": "npm:typescript@^7.0.2"` for the fast CLI. The compat package also provides a `tsc6` binary; its latest version is 6.0.2.

**Q:** What happens to `vue-tsc`?
**A:** In July 2026 the Vue maintainer wrote that a Vue content mapper may let `tsc` check `.vue` files directly, and overlapping tools would then be deprecated. Meanwhile `typescript-native-bridge` runs vue-tsc's checking on tsgo, about 2.7x faster on their repo.
