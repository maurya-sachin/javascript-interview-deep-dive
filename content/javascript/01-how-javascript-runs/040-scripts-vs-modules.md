---
title: "What's the difference between a script and a module?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [modules, scripts, strict-mode, scope, esm]
related:
  - javascript/how-javascript-runs/strict-mode
  - javascript/how-javascript-runs/ecmascript-engine-host
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-ecmascript-language-scripts-and-modules
  - https://tc39.es/ecma262/#sec-modules
  - https://tc39.es/ecma262/#sec-module-semantics
  - https://tc39.es/ecma262/#sec-module-environment-records
  - https://tc39.es/ecma262/#sec-globaldeclarationinstantiation
  - https://tc39.es/ecma262/#sec-HostLoadImportedModule
  - https://html.spec.whatwg.org/multipage/webappapis.html#module-map
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
  - https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script
  - https://nodejs.org/docs/latest-v24.x/api/esm.html
  - https://nodejs.org/docs/latest-v24.x/api/modules.html#the-module-wrapper
tldr: >
  A script is parsed as the Script goal symbol and shares one global scope; a module is parsed as the
  Module goal. Modules have their own top-level scope, are always strict, have top-level `this` of
  undefined, can use `import`/`export` and top-level `await`, and are loaded once, asynchronously, and
  deferred in browsers.
---

## Answer

ECMAScript has two goal symbols for source text: **Script** and **Module**. The host decides which one a file is parsed as: `<script>` versus `<script type="module">` in a browser, and `.mjs` or `"type": "module"` in Node.js.

| | Script | Module |
|---|---|---|
| Top-level scope | Shared global scope: top-level `var` and functions become properties of the global object | Own module scope: nothing leaks to `globalThis` |
| Strict mode | Opt in with `'use strict'` | Always strict |
| Top-level `this` | The global object | `undefined` |
| `import` / `export` | Static syntax not allowed (dynamic `import()` is) | Allowed |
| Top-level `await` | Not allowed | Allowed |
| Evaluated | Every time it is run or included | Once per module; later imports reuse the same instance (browsers key it by URL) |
| Browser loading | Blocks parsing unless `async`/`defer` | Fetched asynchronously and deferred by default |

Modules also have **live bindings**: an import is a read-only view of the exporting module's variable, not a copy. Modules form a graph whose dependencies are resolved and evaluated before the importing module.

Node.js adds a third form that is neither: **CommonJS** (`require`) wraps a file in a function, so its top-level `var` is local and `this` is `module.exports`.

## Example

```js
// example.mjs
var legacy = 1;

console.log(this); // → undefined
console.log(globalThis.legacy); // → undefined
console.log(typeof require); // → undefined

try {
  undeclared = 1;
} catch (error) {
  console.log(error.name); // → ReferenceError
}

console.log(await Promise.resolve('top-level await')); // → top-level await
```

## Pitfalls

- Expecting a module's top-level `var` or function to appear on `window`. Share data through `export`, not the global object.
- Writing `this` at module top level and expecting the global object. It is `undefined`.
- Treating Node.js CommonJS files as scripts. They are wrapped in a function and have `module`, `exports` and `require`; ES modules have none of these.
- Assuming a module re-runs on every `import`. It runs once per resolved URL and later imports share the instance.

## Follow-ups

**Q:** Why are modules deferred in browsers?
**A:** Fetching and linking a module graph is asynchronous, so the browser treats `<script type="module">` as `defer` by default: it runs after the document is parsed, in order, without blocking parsing.

**Q:** Can a script use a module?
**A:** Yes, through dynamic `import()`, which returns a promise and is allowed in both goals. Static `import` declarations are a syntax error in a script.

**Q:** What are live bindings?
**A:** An imported name refers to the exporting module's binding, so if the exporter reassigns an exported `let`, importers see the new value. The importer cannot assign to it.
