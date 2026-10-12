---
title: "ES modules vs CommonJS — what differs and how do they interoperate?"
status: draft
difficulty: medium
frequency: 5
core: false
tags: [esm, commonjs, require, interop, require-esm, dual-package, node]
related:
  - javascript/modules/es-module-loading
  - javascript/modules/circular-imports
  - javascript/modules/dynamic-import
  - javascript/modules/top-level-await
verified: 2026-10
sources:
  - https://nodejs.org/docs/latest-v24.x/api/esm.html#interoperability-with-commonjs
  - https://nodejs.org/docs/latest-v24.x/api/esm.html#differences-between-es-modules-and-commonjs
  - https://nodejs.org/docs/latest-v24.x/api/modules.html#loading-ecmascript-modules-using-require
  - https://nodejs.org/docs/latest-v24.x/api/packages.html#determining-module-system
  - https://nodejs.org/docs/latest-v24.x/api/packages.html#conditional-exports
  - https://tc39.es/ecma262/#sec-cyclic-module-records
tldr: >
  CommonJS runs a file synchronously on `require()` and hands back a plain `module.exports` object, so it is a
  value copy and can be dynamic. ES modules are statically linked, asynchronous-capable, strict, and expose live
  bindings. In Node.js, `import` of CommonJS gives `module.exports` as the default export, and `require()` of
  ESM returns the namespace object unless the graph has top-level `await`.
---

## Answer

**CommonJS** is Node.js's original module system (a library convention, not part of ECMAScript). `require('x')` resolves the path, runs the file synchronously the first time, caches `module.exports`, and returns it. Because `require` is an ordinary function call, it can sit in an `if` or take a computed string. Each file is wrapped in a function that supplies `require`, `module`, `exports`, `__filename`, and `__dirname`, and top-level `this` is `module.exports`.

**ES modules** are part of the language. `import`/`export` are static, so the whole graph is loaded and linked before anything runs. Modules are always strict, top-level `this` is `undefined`, `await` is allowed at top level, and imports are live read-only bindings rather than copies. There is no `require`, `module`, or `__dirname`; use `import.meta`.

How Node.js decides which one a file is: `.mjs` is ESM, `.cjs` is CommonJS, and `.js` follows the nearest `package.json` `"type"`. Without a `type`, Node.js tries CommonJS first and retries as ESM if it hits ESM syntax.

**Interop:**

- `import` of a CommonJS file: `module.exports` is the `default` export. Node.js also guesses named exports by statically scanning the source, and those are snapshots, not live bindings. If the scan can't see a name, use the default import.
- `require()` of an ES module: supported in Node.js 24 as long as the module graph has no top-level `await`. It returns the namespace object, with `default` as a property. With top-level `await` it throws `ERR_REQUIRE_ASYNC_MODULE`. A module can export `"module.exports"` to control what `require` returns.
- `import()` works from both and always returns a promise.

## Example

```js
// lib.cjs
exports.greet = (name) => `hi ${name}`;
exports.version = '1.0';

// double.mjs
export default function double(x) {
  return x * 2;
}
export const answer = 42;

// main.mjs: ESM importing CommonJS
import lib, { greet } from './lib.cjs';
console.log(lib.version, greet('Ada'));
// → 1.0 hi Ada

// main.cjs: CommonJS requiring ESM
const ns = require('./double.mjs');
console.log(ns.answer, ns.default(21));
// → 42 42
```

## Pitfalls

- Assuming `import { name } from './x.cjs'` always works. Named-export detection is a best-effort syntax scan; with `module.exports = makeApi()` it fails with `SyntaxError: Named export 'name' not found`. Use `import x from './x.cjs'` and read `x.name`.
- Expecting live bindings across the boundary. A CommonJS `exports.count = count` stores the value at that moment, and the detected named import is a snapshot too.
- Shipping a package with both an ESM and a CommonJS build and letting the two be loaded together. They are two separate module instances with separate state (the dual package hazard).
- Using `__dirname`, `require`, or `module` in `.mjs`. They are `undefined`, and `require` throws `ReferenceError` (create one with `module.createRequire`).

## Follow-ups

**Q:** Can CommonJS `require` an ES module in Node.js 24?
**A:** Yes, when the graph is synchronous. A top-level `await` anywhere in it throws `ERR_REQUIRE_ASYNC_MODULE`; use `import()` instead. The feature stopped being experimental in v24.15.0.

**Q:** How does a package serve both `import` and `require`?
**A:** `package.json` `"exports"` conditions: `{ "import": "./index.mjs", "require": "./index.cjs" }`. Keep state in one build to avoid the dual package hazard.

**Q:** Why are file extensions required in ESM imports in Node.js?
**A:** ESM resolution follows URL rules and doesn't probe extensions or `index` files. Write `./lib.js`.

## Exercises

### Which one is the same object

```js
// dual/node_modules/pkg/package.json:
// { "name": "pkg", "exports": { "import": "./index.mjs", "require": "./index.cjs" } }
// index.mjs: export const state = { copy: 'esm' };
// index.cjs: exports.state = { copy: 'cjs' };
import { createRequire } from 'node:module';
import { state as fromImport } from 'pkg';

const { state: fromRequire } = createRequire(import.meta.url)('pkg');
console.log(fromImport.copy, fromRequire.copy, fromImport === fromRequire);
```

**Answer:** `esm cjs false` (run in Node.js 24). The `"exports"` map sends `import` and `require` to different files, so the package is loaded twice with two separate `state` objects. This is the dual package hazard. To avoid it, keep stateful code in one build that both entry points load, so there is one instance.
