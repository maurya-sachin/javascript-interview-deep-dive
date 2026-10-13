---
title: "ES modules vs CommonJS — what differs and how do they interoperate?"
status: draft
difficulty: medium
frequency: 5
core: true
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
  - https://tc39.es/ecma262/#sec-source-text-module-record-initialize-environment
  - https://nodejs.org/docs/latest-v24.x/api/esm.html#json-modules
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

## Deep dive

### How it works

The two systems differ in *when* names are connected to values.

An ES module goes through separate phases. After loading the graph, the `Link` phase runs `InitializeEnvironment` for each module. It creates the module's environment and, for every import, calls `CreateImportBinding`, which makes an *indirect binding*: a name in the importer that points at a binding in the exporter's environment. If an imported name doesn't resolve, linking throws a `SyntaxError` before any module code runs. The `Evaluate` phase then runs module bodies in dependency order. `var` and function declarations are initialized during linking; `let`, `const` and `class` exist but stay uninitialized until their line runs.

A CommonJS module has no link phase. `require` runs the file's wrapper function on first use, takes whatever is in `module.exports` when it returns, caches it in `require.cache`, and hands every caller that same object. Reading `exports.count` later reads a property on that object, and a primitive copied into it (`count`) was copied at that moment.

```js
// counter.mjs
export let count = 0;
export function increment() { count++; }

// counter.cjs
let count = 0;
module.exports = { count, increment() { count++; }, getCount: () => count };

// live.mjs
import { count, increment } from './counter.mjs';
import cjs from './counter.cjs';

increment();
console.log(count); // → 1
try {
  count = 5;
} catch (error) {
  console.log(error.name); // → TypeError
}

cjs.increment();
console.log(cjs.count, cjs.getCount()); // → 0 1
```

The ESM import saw the update because it is an alias for the exporter's `count`; assigning to it throws because import bindings are read-only. The CommonJS object has `count: 0` forever, because the property was set once.

### Edge cases

- **Circular imports differ in what you see.** In CommonJS, a cycle returns the *partially filled* `exports` object of the module still running. In ESM, the bindings exist but may be uninitialized: reading a `const` early throws `ReferenceError`, while a function declaration works, since it was initialized at link time.
- **Caches differ.** CommonJS exposes `require.cache`, so `delete require.cache[path]` forces a reload. ESM has no equivalent: a module instance is keyed by its resolved URL and lives for the process. A different query string is a different URL, so `import('./state.mjs?v=2')` loads a second instance and the original stays cached.
- **A missing export is a link error in ESM** (`SyntaxError`, nothing runs), but just `undefined` in CommonJS.

```js
// a.cjs (run: node a.cjs)
exports.early = 'a-early';
const b = require('./b.cjs');
exports.late = 'a-late';
console.log('a sees b:', b.fromB);

// b.cjs
const a = require('./a.cjs');
console.log('b sees a:', Object.keys(a));
module.exports = { fromB: true };
// → b sees a: [ 'early' ]
// → a sees b: true
```

```js
// ca.mjs (run: node ca.mjs)
import { fromB } from './cb.mjs';
export const fromA = 'a';
console.log('a sees', fromB);

// cb.mjs
import { fromA } from './ca.mjs';
export const fromB = 'b';
try {
  console.log(fromA);
} catch (error) {
  console.log('b:', error.name);
}
// → b: ReferenceError
// → a sees b
```

```js
// bust.mjs
const a = await import('./state.mjs');
const b = await import('./state.mjs');
const c = await import('./state.mjs?v=2');
console.log(a === b, a.instance === c.instance); // → true false
```

### Real-world scenario

A typical CommonJS-to-ESM migration breaks in a few predictable places, and each follows from the model above:

- **`__dirname` and `require` don't exist.** Use `import.meta.dirname` / `import.meta.filename` (or `new URL(…, import.meta.url)`), and `createRequire` when you really need `require`.
- **JSON can't be `require`d.** Node.js requires an import attribute: `import data from './data.json' with { type: 'json' }`. Without `with { type: 'json' }`, Node throws `ERR_IMPORT_ATTRIBUTE_MISSING`. JSON modules only expose a default export.
- **Singletons with `delete require.cache` hacks** (test isolation, hot reload) need a different approach, such as the query-string trick above, which leaves the original cached, or a fresh process or worker.

```js
// migrated.mjs
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import data from './data.json' with { type: 'json' };

console.log(typeof __dirname, typeof require); // → undefined undefined
console.log(data.name); // → demo
console.log(readFileSync(join(import.meta.dirname, 'data.json'), 'utf8').trim()); // → { "name": "demo" }
```

Do the migration one package or directory at a time, and re-run the tests between steps. The `require(esm)` support in Node.js 24 lets CommonJS code consume ESM dependencies during that period, as long as no module in the graph uses top-level `await`.

### Trade-offs

ESM gives static analysis (tree shaking, early errors for bad imports), live bindings, and top-level `await`, in exchange for asynchronous loading, a strict no-reload cache, and extra care around cycles. CommonJS is simpler to hack on dynamically (conditional `require`, cache clearing, mutable `module.exports`) and is still what a large amount of existing Node.js code is written in. For new code, ESM is the standard; the practical constraint is your dependency graph. For libraries, ship ESM (or ESM plus a thin CommonJS entry that reuses it) and keep state in one place to avoid the dual package hazard.

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
