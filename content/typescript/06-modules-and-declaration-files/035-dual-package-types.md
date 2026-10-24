---
title: "How do you ship types for a package that publishes both ESM and CommonJS?"
status: draft
difficulty: hard
frequency: 3
core: false
tags: [dual-package, package-exports, conditional-exports, d-mts, d-cts, masquerading-types, library-publishing]
related:
  - typescript/modules-and-declaration-files/module-resolution
  - typescript/modules-and-declaration-files/esm-cjs-interop
  - typescript/modules-and-declaration-files/declaration-files
  - typescript/modules-and-declaration-files/declaration-authoring-patterns
  - typescript/tsconfig-and-strictness/skiplibcheck-declaration-sourcemaps
verified: 2026-10
perishable:
  - "require(esm) unflagged in Node 22.12 / 20.19, stable in 24.15"
sources:
  - https://www.typescriptlang.org/docs/handbook/modules/reference.html#packagejson-exports
  - https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html
  - https://www.typescriptlang.org/docs/handbook/modules/theory.html
  - https://nodejs.org/docs/latest-v24.x/api/packages.html#conditional-exports
  - https://nodejs.org/docs/latest-v24.x/api/packages.html#community-conditions-definitions
  - https://nodejs.org/docs/latest-v24.x/api/modules.html#loading-ecmascript-modules-using-require
tldr: >
  Each declaration file describes one JavaScript file and has its own module format. So a dual
  package needs two sets of types: `.d.mts` for the ESM build and `.d.cts` for the CommonJS build
  (or `.d.ts` under a `package.json` with the right `"type"`), each reached through its `import` or
  `require` condition. One shared `.d.ts` makes one side's types lie.
---

## Answer

The rule from the TypeScript handbook: **every declaration file represents exactly one JavaScript file**, and its module format must match that file. `tsc` decides a declaration file's format the same way Node decides a JavaScript file's: `.d.mts` is ESM, `.d.cts` is CommonJS, and `.d.ts` follows the nearest `package.json` `"type"`.

A dual package ships `index.mjs` for `import` and `index.cjs` for `require`. The types must split the same way:

- **Per-condition types.** Nest `types` inside each branch: `"import": { "types": "./index.d.mts", "default": "./index.mjs" }` and the same for `require` with `.d.cts`. `types` goes first in each object; Node's docs say so and conditions match in key order.
- **Or let extension substitution do it.** For a target `./index.mjs`, `tsc` looks for `index.mts`, then `index.d.mts`, so files sitting next to each other need no `types` key. The same works with two `dist/` folders whose own `package.json` sets `"type"`.

The common bug is **one `.d.ts` for both builds**. Without `"type": "module"` it is read as CommonJS, so an ESM consumer's default import gets `module.exports` and the types claim the function sits on `.default`. That is *masquerading as CJS*. With `"type": "module"` the opposite (*masquerading as ESM*) misleads `require` users.

To produce the files, compile twice (one output per format), because a single `tsc` run emits one format per file. The handbook warns that any dual-emit setup checks only one output, so test both builds before publishing. arethetypeswrong (`npx @arethetypeswrong/cli`) is a tool that reports these mismatches per resolution mode.

Since `require()` can load synchronous ES modules (unflagged in Node 22.12 and 20.19), shipping ESM only is often the simpler answer.

## Example

```ts
// node_modules/greet-broken: no "type" field, one shared index.d.ts
//   "exports": { ".": { "types": "./index.d.ts", "import": "./index.mjs", "require": "./index.cjs" } }
//   index.d.ts: export default function greet(name: string): string;
// node_modules/greet-fixed: same .mjs/.cjs, types split per condition
//   "exports": { ".": {
//     "import":  { "types": "./dist/index.d.mts", "default": "./dist/index.mjs" },
//     "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" } } }

// src/esm.ts (consumer package.json has "type": "module"); tsc --strict --module nodenext
import broken from "greet-broken";
import fixed from "greet-fixed";
console.log(fixed("a"));
// → hi a (esm)
console.log(broken("a"));
// Error TS2349: This expression is not callable.
//   Type 'typeof import(".../greet-broken/index")' has no call signatures.

console.log(broken.default("a")); // the "fix" users write: type-checks, then Node 24.19.0 throws
// → TypeError: broken.default is not a function
```

Same errors on `tsc` 6.0.3 and 7.0.2. The error is false: Node loads `index.mjs`, whose default export is the function.

## Pitfalls

- Copying one `.d.ts` to both formats and calling it done. The format comes from the extension or `"type"`, not the contents, so the copy must be named `.d.mts`/`.d.cts` or sit under the right `package.json`.
- Putting `types` last. Node's docs say it "should always be included first". In my 6.0.3 trace, `tsc` matched `import`, found no `index.d.mts`, then fell through to the later `types` key and used the CommonJS-format `.d.ts`. That works only by accident.
- Testing only with `module: nodenext`. A masquerading-as-ESM package type-checks there (6.0.3 and 7.0.2 allow `require` of ESM), but under `node16` the same `.cts` import is error TS1479.
- Forgetting the dual package hazard that Node's docs warn about. Both builds can load in one process: on Node 24.19.0, `import` and `require` of `greet-fixed` gave two different functions (`===` was `false`), so `instanceof` and singletons can break.

## Follow-ups

**Q:** Why not one `tsc` run that emits both formats?
**A:** A compilation maps each input to one output with one format. The handbook says dual emit leaves at least one output unchecked, so either run two builds or use a tool that does and test both.

**Q:** What does `require()` of an ESM package return in Node 24?
**A:** The module namespace object; a default export appears as `.default` with `__esModule: true`. An ESM file can export a binding named `"module.exports"` to make `require()` return it directly.
