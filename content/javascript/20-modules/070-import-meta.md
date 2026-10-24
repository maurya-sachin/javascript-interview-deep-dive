---
title: "What is `import.meta`?"
status: draft
difficulty: easy
frequency: 2
core: false
tags: [import-meta, esm, url, dirname, filename, resolve, node]
related:
  - javascript/modules/es-module-loading
  - javascript/modules/esm-vs-commonjs
  - javascript/modules/dynamic-import
verified: 2026-10
perishable:
  - import.meta.main at Stability 1.0, early development, in Node.js 24
sources:
  - https://tc39.es/ecma262/#sec-meta-properties
  - https://tc39.es/ecma262/#sec-hostgetimportmetaproperties
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import.meta
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import.meta/resolve
  - https://nodejs.org/docs/latest-v24.x/api/esm.html#importmeta
tldr: >
  `import.meta` is a per-module object, created by the host the first time it's read, holding metadata about
  that module. ECMAScript defines none of its properties. Browsers and Node.js provide `url` and `resolve()`, and
  Node.js adds `filename` and `dirname`. It only exists in modules, and replaces `__filename` and `__dirname`.
---

## Answer

`import.meta` is a meta property: syntax, not a variable lookup, and it is a `SyntaxError` outside a module (in a `.cjs` file, Node.js 24 reports `Cannot use 'import.meta' outside a module`). Each module has its own object: the engine creates a null-prototype object the first time the module reads it, asks the host to fill in properties, caches it, and returns the same object on every later read. It is extensible, so you can add properties.

The language specifies no properties. By convention, hosts provide:

- **`import.meta.url`**: the module's absolute URL. In browsers it is the script's URL (for an inline module, the document's URL); in Node.js it is a `file:` URL.
- **`import.meta.resolve(specifier)`**: resolves a specifier the way `import` would, relative to this module, and returns a URL string. It does not load anything and, in Node.js, returns a string synchronously.
- **`import.meta.filename`** and **`import.meta.dirname`** (Node.js only): the absolute path of the file (symlinks resolved) and its directory, available for `file:` modules. They replace CommonJS `__filename` and `__dirname`.
- **`import.meta.main`** (Node.js): `true` in the entry module, the counterpart to `require.main === module`. Node.js documents it as Stability 1.0, early development.

The common job is finding files next to the module. Relative paths in `fs` calls resolve against the working directory, not the module, so build the location from `import.meta.url` or `dirname`.

## Example

```js
import { readFileSync } from 'node:fs';
import { dirname } from 'node:path';

console.log(import.meta.url.startsWith('file:///'));
console.log(import.meta.dirname === dirname(import.meta.filename));
const data = JSON.parse(readFileSync(new URL('./data.json', import.meta.url), 'utf8'));
console.log(data);
console.log(import.meta.resolve('./data.json') === new URL('./data.json', import.meta.url).href);
// → true
// → true
// → { k: 1 }
// → true
```

`data.json` contains `{ "k": 1 }`.

## Pitfalls

- Using `__dirname` or `__filename` in an ES module. They don't exist.
- Treating `import.meta.url` as a path. It is a URL string, so pass it to `new URL(...)` or `fileURLToPath`, and don't concatenate path strings onto it.
- Relying on `dirname`/`filename` in code that also runs in browsers. They are Node.js-only conventions, and Node.js defines them only for `file:` modules.
- Assuming one `import.meta` for the app. Each module gets its own object, so `import.meta.url` always names the file it is written in.

## Follow-ups

**Q:** How is `import.meta.resolve` different from `import()`?
**A:** It only computes the URL that `import()` would use, synchronously, and loads nothing. A specifier that can't be resolved may throw (Node.js: `ERR_MODULE_NOT_FOUND` for a missing package), but a missing file at a valid path does not.

**Q:** Where do the properties come from?
**A:** The host. The spec calls `HostGetImportMetaProperties` to get key/value pairs and `HostFinalizeImportMeta` for any final adjustments; the default implementation adds nothing.

**Q:** What replaces `require.resolve` and `__dirname` in ESM?
**A:** `import.meta.resolve()` and `import.meta.dirname` (or `new URL('.', import.meta.url)`).

## Exercises

### Same object or not

```js
// shared.mjs
export const meta = import.meta;
// main.mjs
import { meta } from './shared.mjs';
console.log(meta === import.meta, meta.url.endsWith('shared.mjs'), Object.getPrototypeOf(meta));
```

**Answer:** `false true null` (run in Node.js 24). Every module has its own `import.meta`; `shared.mjs` exported its own, whose `url` names `shared.mjs`. The prototype is `null`, per the spec's `OrdinaryObjectCreate(null)`.
