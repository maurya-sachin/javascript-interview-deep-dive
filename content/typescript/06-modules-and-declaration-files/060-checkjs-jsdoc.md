---
title: "How can you type-check JavaScript with TypeScript?"
status: draft
difficulty: easy
frequency: 2
core: false
tags: [checkjs, allowjs, jsdoc, ts-check, declaration-emit, javascript]
related:
  - typescript/modules-and-declaration-files/declaration-files
  - typescript/modules-and-declaration-files/import-type-isolated-modules
  - typescript/the-compiler/checking-vs-emitting
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/intro-to-js-ts.html
  - https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html
  - https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html
  - https://www.typescriptlang.org/tsconfig/#checkJs
  - https://www.typescriptlang.org/tsconfig/#allowJs
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html
  - https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
tldr: >
  Add `// @ts-check` to a `.js` file, or set `checkJs` (which implies `allowJs`) in `tsconfig`, and `tsc`
  checks the file using types from JSDoc comments (`@param`, `@type`, `@typedef`). Nothing is
  compiled away: the file stays plain JavaScript. TS 7.0 reworked JS support and rejects some old
  JSDoc forms.
---

## Answer

`tsc` can type-check JavaScript because it understands **JSDoc comments** as type annotations. You opt in at one of three levels:

- **Per file:** put `// @ts-check` on the first line. Other `.js` files in the project stay unchecked.
- **Whole project:** set `checkJs` (report errors in `.js` files). It defaults `allowJs` (include `.js` files in the program) to `true`, so one flag is enough. Per the docs, `checkJs` is the same as adding `// @ts-check` to every JavaScript file.
- **Opt out:** `// @ts-nocheck` skips a file; `// @ts-ignore` and `// @ts-expect-error` silence the next line, and the latter errors when the line is no longer wrong (TS2578).

**Annotating.** `@param {string} name`, `@param {number} [times]` for optional, `@returns {string}`, `@type {Foo}`, `@typedef`, `@template T` for generics, `@satisfies`, and casts such as `/** @type {number} */ (x)`. Types from another file come in through `@import {Pet} from "./types"` (TS 5.5) or `import("./types").Pet`. These tags exist only for the checker; they are not imported at runtime.

**Why do it.** It adds checking and editor help to a JavaScript codebase without a build step, which fits gradual migration or small scripts. JSDoc types also feed declaration generation: with `allowJs`, `declaration`, and `emitDeclarationOnly`, `tsc` produced `shout(name: string, times?: number): string` from the comments below.

**Differences from `.ts`.** Unannotated parameters are `any` unless `noImplicitAny` is on, and function parameters are optional unless JSDoc says otherwise (Handbook).

**Version note (TS 7).** The 7.0 announcement says JavaScript support was reworked to match `.ts` analysis: `@enum`, `@class` constructors, a bare `?` type, and Closure-style `function(string): void` are no longer recognised.

## Example

```js
// src/ex.js  (TypeScript 7.0.2 and 6.0.3: tsc --allowJs --noEmit)
// @ts-check
/** @typedef {{ id: number, tags?: string[] }} Item */

/**
 * @param {string} name
 * @param {number} [times]
 * @returns {string}
 */
export function shout(name, times = 1) {
  return name.toUpperCase().repeat(times);
}
/** @param {Item} item */
export const label = (item) => `#${item.id}`;

shout(42);
// Error TS2345: Argument of type 'number' is not assignable to parameter of type 'string'.
label({ id: "7" });
// Error TS2322: Type 'string' is not assignable to type 'number'.
```

Run unchanged on Node 24.19.0, the same file throws `TypeError: name.toUpperCase is not a function` at `shout(42)`: the comments are checked at build time and ignored at runtime.

## Pitfalls

- Setting only `allowJs` and expecting errors. It adds `.js` files to the program but reports nothing in them; `checkJs` does, and turns `allowJs` on by itself (checked on both versions).
- Expecting `// @ts-check` in one file to check the others. With only `allowJs`, only the file with the comment reported an error in my run (both versions).
- Assuming `@ts-expect-error` is a harmless ignore. It reports TS2578 when the next line is fine, so stale suppressions surface.
- Carrying old JSDoc forward to TS 7. The same project that was clean on 6.0.3 reported four errors on 7.0.2 for `@enum` (TS2749), a `{?}` type (TS1110), and `function(string): void` (TS1005 plus an implicit-`any` TS7006 on the callback).

## Follow-ups

**Q:** Does `noImplicitAny` apply to JavaScript?
**A:** Yes under `checkJs`. `function add(a, b)` reported TS7006 under `--strict` on both versions. With no `strict` setting it is still an error on both, because `strict` defaults to `true` since 6.0 (6.0 release notes); `--strict false` made it clean.

**Q:** Where does the type information for a plain-JS library come from?
**A:** Usually a `.d.ts` (see the declaration-files question). `maxNodeModuleJsDepth` can make `tsc` infer types from JavaScript inside `node_modules`, but the docs advise leaving it at `0`.
