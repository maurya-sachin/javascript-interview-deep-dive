---
title: "What is the difference between `target`, `lib`, and `module`?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [target, lib, module, downleveling, polyfills, tsconfig]
related:
  - typescript/modules-and-declaration-files/module-resolution
  - typescript/modules-and-declaration-files/esm-cjs-interop
  - typescript/tsconfig-and-strictness/strict-mode-flags
verified: 2026-10
sources:
  - https://www.typescriptlang.org/tsconfig/#target
  - https://www.typescriptlang.org/tsconfig/#lib
  - https://www.typescriptlang.org/tsconfig/#module
  - https://www.typescriptlang.org/tsconfig/#useDefineForClassFields
  - https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html
  - https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
  - https://github.com/microsoft/TypeScript/pull/63067
tldr: >
  `target` is the JavaScript syntax level `tsc` emits (newer syntax is downleveled). `lib` is which
  built-in API types exist (types only, no code). `module` is the import/export format emitted. None
  of them add polyfills, so `lib` must match what your runtime really has.
---

## Answer

Three independent settings, each answering a different question.

- **`target`**: which JavaScript **syntax** may appear in the output. Newer syntax is rewritten (`??`, `**`, optional chaining, class fields) and anything the target already supports is left alone. It also sets the default `lib` and the default for `useDefineForClassFields` (on from ES2022).
- **`lib`**: which **built-in declarations** the type checker knows about: `Array.prototype.at`, `Object.hasOwn`, `Promise`, and the `dom` types. It produces no output at all. Setting `lib` **replaces** the default list, so `"lib": ["es2022"]` also drops `dom`.
- **`module`**: which **module format** the emitted `import`/`export` takes (`commonjs`, `esnext`, `preserve`, `nodenext`). It also steers module resolution defaults. It has no say over syntax such as `??`.

**`tsc` never polyfills.** Syntax is transformed; APIs are not. `[1].at(0)` is emitted unchanged even for `target: es2015`. If `lib` says an API exists but the runtime lacks it, you get a runtime `TypeError`, not a compile error. So set `lib` to what your real runtime provides (or what your polyfills add), and `target` to the oldest syntax that runtime can parse.

Defaults, by version: in 5.9 `target` defaulted to ES5 and `module` to CommonJS. TS 6.0 changed these to a floating latest target (`es2025` on 6.0 and 7.0) and `module: esnext`. `target: es5` is deprecated in 6.0 and an error in 7.0.

Practical picks: Node runs the output, so `module: nodenext` and a `target` matching the Node version. A bundler consumes it, so `module: preserve`, `noEmit`, and a `target` as modern as the bundler's input. Community baselines live in `tsconfig/bases`.

## Example

```ts
// a.ts, TypeScript 7.0.2 (b.ts exports `helper`)
import { helper } from "./b";
export const last = [1, 2, 3].at(-1) ?? helper;
export const cube = last ** 3;
export const has = Object.hasOwn({ a: 1 }, "a");

// tsc --target es2015 --lib es2015 --module esnext
// Error TS2550: Property 'at' does not exist on type 'number[]'. Do you need to change your target library? Try changing the 'lib' compiler option to 'es2022' or later.
// Error TS2550: Property 'hasOwn' does not exist on type 'ObjectConstructor'. ...
// → export const last = (_a = [1, 2, 3].at(-1)) !== null && _a !== void 0 ? _a : helper;
// → export const cube = Math.pow(last, 3);
// → export const has = Object.hasOwn({ a: 1 }, "a");

// tsc --target es2022 --module commonjs --moduleResolution bundler
// → const b_1 = require("./b");
// → exports.last = [1, 2, 3].at(-1) ?? b_1.helper;
// → exports.cube = exports.last ** 3;
```

The first compile also wrote the JavaScript above (errors do not stop emit unless `noEmitOnError` is set). `??` and `**` were rewritten for ES2015, while `.at` and `Object.hasOwn` were left as written, whatever `lib` said.

## Pitfalls

- Treating `target` as a polyfill switch. Lowering it never adds missing APIs; only syntax changes.
- Setting `lib: ["es2022"]` and then using `document` or `window`. `dom` is no longer included (TS2584, checked on 7.0.2 and 5.9.3).
- Assuming `module` and `target` move together. On 7.0.2 and 6.0.3, `--module nodenext` still compiled `using` declarations down; on 5.9.3 it left them as written. The TSConfig reference still says nodenext "implies the floating `--target esnext`", so ❓ the page is out of date for 6.0+.
- Upgrading from 5.x with no `target` or `module` in the config. The same file compiled to CommonJS on 5.9.3 and to ES module output on 6.0.3 and 7.0.2.

## Follow-ups

**Q:** Which `lib` file does the default load?
**A:** `--listFiles` showed `lib.d.ts` (ES5 plus `dom`) on 5.9.3 and `lib.es2025.full.d.ts` on 6.0.3 and 7.0.2. With `--target es2022` on 7.0.2 it was `lib.es2022.full.d.ts`.

**Q:** Does `target` change class field emit?
**A:** Yes. For `class Counter { count = 0 }` the `es2015` target emitted a constructor assignment and `es2022` emitted a `count = 0;` field (7.0.2), following `useDefineForClassFields`.

**Q:** Can I still use `target: es5`?
**A:** On 6.0.3 it is `TS5107` (deprecated); on 7.0.2 it is `TS5108` (removed). The 6.0 notes suggest an external compiler for ES5 output.
