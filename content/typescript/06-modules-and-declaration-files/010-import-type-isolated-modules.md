---
title: "What do `import type`, `isolatedModules`, and `verbatimModuleSyntax` do?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [import-type, isolatedmodules, verbatimmodulesyntax, import-elision, type-only-imports]
related:
  - typescript/the-compiler/type-erasure
  - typescript/classes-enums-runtime-output/erasable-syntax-only
  - typescript/classes-enums-runtime-output/enums-vs-unions
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-5.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html
  - https://www.typescriptlang.org/tsconfig/#verbatimModuleSyntax
  - https://www.typescriptlang.org/tsconfig/#isolatedModules
  - https://github.com/microsoft/TypeScript/pull/52203
tldr: >
  `import type` and `export type` are always erased. `isolatedModules` mostly adds errors for code a
  one-file-at-a-time transpiler could not compile correctly; its one emit change is that const enums stop being inlined. `verbatimModuleSyntax`
  (TS 5.0) turns off import elision: imports without `type` stay, `type` ones go, and it errors if
  you get the distinction wrong.
---

## Answer

By default `tsc` performs **import elision**: it drops an import (or a named binding) it sees is never used as a value. That works because `tsc` has the whole program and knows whether `User` is an interface or a class. A single-file transpiler (Babel, `ts.transpileModule`, esbuild-style tools) cannot see the other file. The three features exist for that gap.

- **`import type` / `export type`** (TS 3.8). The declaration is usable only in type positions and is erased completely. Using it as a value is an error (TS1361), so `class X extends Imported` fails if you imported with `import type`. The inline form `import { type A, b }` (TS 4.5) marks single names.
- **`isolatedModules`**. A checking flag. It reports code that cannot be compiled from one file alone, for example re-exporting a type without `export type` (TS1205). The docs say it does not change emit, yet it implies `preserveConstEnums` and `tsc` stops inlining const enum values (checked on both versions). It does not turn off elision.
- **`verbatimModuleSyntax`** (TS 5.0). Removes the guesswork: an import or export without `type` is kept; anything with `type` is dropped. If you import a type without `type`, you get TS1484. It replaces `importsNotUsedAsValues` and `preserveValueImports`, both now removed.

Consequences of verbatim emit:

- `import { type A } from "./m"` becomes `import {} from "./m"`, which keeps the **side effects** of `./m`. Use `import type { A }` to drop the module entirely.
- It forbids ESM syntax in a file that compiles to CommonJS (TS1295, or TS1287 for `export const`); use `import x = require()` and `export =` there.

Recommendation: enable `verbatimModuleSyntax` in new projects (`tsc --init` on 6.0 and 7.0 already does alongside `isolatedModules`); your emit then matches what Node, Babel, or a bundler will do with the source.

## Example

```ts
// TypeScript 7.0.2 and 6.0.3, --module esnext --verbatimModuleSyntax
// a.ts
console.log("a.ts loaded");
export interface User { name: string }
export class Api {}

// b.ts
import { User } from "./a.js";
// Error TS1484: 'User' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.
import type { Api } from "./a.js";
class Bad extends Api {}
// Error TS1361: 'Api' cannot be used as a value because it was imported using 'import type'.

// c.ts
import { type User } from "./a.js";
export const u: User = { name: "Ada" };
// c.js with verbatimModuleSyntax: import {} from "./a.js";  (a.ts's code runs: "a.ts loaded")
// c.js without it:                (no import; "a.ts loaded" never prints)
```

Output was checked with `tsc` on both versions, and `c.js` was run on Node 24.19.0: it printed `a.ts loaded` with the flag, and nothing without it.

## Pitfalls

- Believing `isolatedModules` turns off elision. It mostly adds errors. The one that bites is re-exporting a type: `export { User }` fails with TS1205 until you write `export type { User }` (checked on both versions).
- Treating `import { type A } from "x"` as a full removal. Under `verbatimModuleSyntax` it leaves `import {} from "x"`; use `import type` to delete it.
- Combining default and named in one type-only import: `import type D, { N } from "m"` is TS1363. Split it into two statements.
- Turning on `verbatimModuleSyntax` in a CommonJS-output project and being surprised: top-level `export` of values is TS1287 there (checked on both versions).

## Follow-ups

**Q:** Why did `importsNotUsedAsValues` and `preserveValueImports` go away?
**A:** The TS 5.0 notes call them deprecated in favour of `verbatimModuleSyntax`. On 6.0.3 they report TS5102 "has been removed", except `importsNotUsedAsValues: "remove"` (the old default), which is accepted silently; TS 7.0.2 reports them as unknown options (TS5023).
