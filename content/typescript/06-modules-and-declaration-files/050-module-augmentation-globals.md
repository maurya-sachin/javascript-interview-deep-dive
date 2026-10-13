---
title: "How do you augment a module or add a global type?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [module-augmentation, declare-global, declare-module, ambient-declarations, triple-slash-directives, declaration-merging]
related:
  - typescript/modules-and-declaration-files/declaration-files
  - typescript/classes-enums-runtime-output/declaration-merging-namespaces
  - typescript/modules-and-declaration-files/module-resolution
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/declaration-merging.html
  - https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html
  - https://www.typescriptlang.org/docs/handbook/declaration-files/templates/global-modifying-module-d-ts.html
  - https://www.typescriptlang.org/tsconfig/#moduleDetection
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html
tldr: >
  Inside a file that is a module, `declare module "x" { interface ... }` merges new members into an
  existing module's types, and `declare global { ... }` adds to the global scope. Both are type-only;
  you still supply the runtime code. A file without `import`/`export` is a script, whose top-level
  declarations are already global.
---

## Answer

TypeScript lets you add to types you do not own with **declaration merging**. There are three situations, and the first rule is whether the file is a *module* (has a top-level `import` or `export`) or a *script*.

- **Module augmentation.** In a module file, `declare module "./observable" { interface Observable<T> { map(...): ... } }`. The name resolves like an import specifier, and the block merges into the original declarations as if written there. Use interfaces and namespaces; for third-party types, this is how you add a property to, say, a request type. Default exports cannot be augmented, only named ones (Handbook).
- **Global augmentation.** In a module file, `declare global { interface Window { appVersion: string } }`. Typical uses: `Window`, and `NodeJS.ProcessEnv` for typed `process.env`.
- **Ambient script declarations.** In a `.d.ts` with no top-level `import`/`export`, every top-level declaration is global (`interface Window {...}`, `declare const BUILD_ID: string`). The same file can hold `declare module "name" {...}` to declare a package that has no types (see the declaration-files question).

**Augmentations only change types.** You must still write the implementation (`Observable.prototype.map = ...`), and the augmenting file has to be part of the program. If no file in the compilation includes it, the types do not exist.

**Triple-slash directives** are comments at the top of a file: `/// <reference types="node" />` pulls in an `@types` package, `/// <reference path="./x.d.ts" />` adds a file, `/// <reference lib="es2015" />` adds a built-in lib. Prefer imports or `tsconfig` `include`/`types`. Since TS 5.5 they are not emitted into outputs unless marked `preserve="true"`.

## Example

```ts
// src/map.ts  (TypeScript 7.0.2 and 5.9.3, strict, --module esnext)
import { Observable } from "./observable";
declare module "./observable" {
  interface Observable<T> { map<U>(f: (x: T) => U): Observable<U>; }
}
Observable.prototype.map = function (f) { return new Observable(f(this.value)); };

// src/use.ts, compiled WITHOUT map.ts in the program:
const s = new Observable(1).map((x) => x.toFixed(1));
// Error TS2339: Property 'map' does not exist on type 'Observable<number>'.
// With map.ts included (for example `import "./map"` in use.ts) it compiles.

// src/env.ts: a module (export {}), so declare global is allowed
declare global { namespace NodeJS { interface ProcessEnv { API_URL: string } } }
export {};
// Without export {}: Error TS2669: Augmentations for the global scope can only be directly nested in external modules or ambient module declarations.
```

The `TS2669` line was checked with `--module esnext` on both versions; the other results are from the same two versions.

## Pitfalls

- Forgetting that the augmenting file is a module only if it has `import`/`export`. Put `export {}` at the end, or `declare global` fails with TS2669.
- Typing a runtime value that does not exist. `declare module "./observable" { export const extra: number }` type-checked on both versions, and importing `extra` then threw `SyntaxError: ... does not provide an export named 'extra'` on Node 24.19.0. The Handbook lists "no new top-level declarations" as a limitation, but I did not see `tsc` enforce it.
- Misspelling the module name. An unresolvable specifier is TS2664 ("Invalid module name in augmentation, module './does-not-exist' cannot be found"), and an untyped package reports TS2665.
- Using `/// <reference path>` in new code. It couples files by path; it only counts at the top of the file, after comments.

## Follow-ups

**Q:** Where should a global augmentation file live?
**A:** In a file your `tsconfig` `include` covers, so it is always part of the program. A script `.d.ts` also works, but adding an `import` turns it into a module: `interface Window { viaModule: number }` then stopped being global (TS2551 on both versions).

**Q:** Does `preserve="true"` matter for apps?
**A:** Rarely. It affects declaration output for libraries: on 5.9.3 and 7.0.2 a `/// <reference types="mocha" preserve="true" />` was kept in the generated `.d.ts`, while `/// <reference types="node" />` was dropped.
