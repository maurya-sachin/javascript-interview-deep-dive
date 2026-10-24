---
title: "What are import attributes and JSON modules?"
status: draft
difficulty: easy
frequency: 1
core: false
tags: [import-attributes, json-modules, import, with, type-json, esm]
related:
  - javascript/modules/es-module-loading
  - javascript/modules/dynamic-import
  - javascript/modules/esm-vs-commonjs
verified: 2026-10
perishable:
  - HTML allowed module types are javascript-or-wasm, json, css, text
sources:
  - https://tc39.es/ecma262/#sec-HostLoadImportedModule
  - https://tc39.es/ecma262/#sec-import-calls
  - https://tc39.es/ecma262/#sec-withclausetoattributes
  - https://tc39.es/ecma262/#sec-parse-json-module
  - https://html.spec.whatwg.org/multipage/webappapis.html#module-type-allowed
  - https://nodejs.org/docs/latest-v24.x/api/esm.html#import-attributes
  - https://nodejs.org/docs/latest-v24.x/api/esm.html#json-modules
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import/with
tldr: >
  Import attributes add metadata to a module request: `import data from './x.json' with { type: 'json' }`, or
  `import('./x.json', { with: { type: 'json' } })`. The `type: 'json'` attribute is required for JSON modules, which
  expose the parsed JSON as the `default` export only. The older `assert` keyword has been replaced by `with`.
---

## Answer

An **import attribute** is a key-value pair attached to a module request, written after the specifier with the `with` keyword. The host (browser, Node.js) uses it to decide how to load the module. The only standard key is `type`; JSON modules, `type: 'json'`, are part of ECMAScript.

```js
import config from './config.json' with { type: 'json' };
const { default: config2 } = await import('./config.json', { with: { type: 'json' } });
```

Rules:

- **Values are string literals.** Attributes are part of the module request, next to the specifier.
- **Unsupported keys fail.** The spec makes a static `import` with an unsupported attribute a `SyntaxError` raised during loading (Node.js 24 reports `TypeError [ERR_IMPORT_ATTRIBUTE_UNSUPPORTED]`). In `import()`, the promise rejects with `TypeError`.
- **JSON needs the attribute.** The spec requires hosts to treat `type: 'json'` as "parse this as JSON", and browsers and Node.js refuse to load JSON without it, so a server can't swap data for executable code. Without it Node.js throws `ERR_IMPORT_ATTRIBUTE_MISSING`.
- **A JSON module has one export.** The parsed value is the `default` export (the spec's `ParseJSONModule` creates a module with only `default`). There are no named exports: `import { name } from './x.json'` is a `SyntaxError`.
- **One value per module.** The module is evaluated once, so every importer gets the same object, and mutations are visible to all.

History: an earlier version of the proposal used `assert { type: 'json' }` ("import assertions"). MDN now lists `assert` as non-standard, and Node.js 24 rejects it (`SyntaxError: Unexpected identifier 'assert'`).

## Example

```js
// data.json: { "name": "demo", "tags": ["a", "b"], "n": 1 }
import data from './data.json' with { type: 'json' };
import again from './data.json' with { type: 'json' };

console.log(data.name, data.tags);
data.n = 2;
console.log(again.n, data === again);
const dynamic = await import('./data.json', { with: { type: 'json' } });
console.log(Object.keys(dynamic), dynamic.default === data);
// → demo [ 'a', 'b' ]
// → 2 true
// → [ 'default' ] true
```

## Pitfalls

- Leaving out `with { type: 'json' }`. Node.js and browsers reject it by design.
- Using named imports from JSON (`import { name } from './x.json' with ...`). Only `default` exists; destructure the default.
- Mutating the imported object as if it were a private copy. It is shared by every importer.
- Writing `assert { ... }` from older tutorials.

## Follow-ups

**Q:** Why require `type: 'json'` at all, when the file ends in `.json`?
**A:** On the web the media type, not the extension, decides how a response is handled. The attribute lets the author assert the expected type, so a response that turns into JavaScript fails instead of running as code.

**Q:** What other types exist?
**A:** The HTML spec's allowed module types are JavaScript or Wasm (no `type` attribute), `json`, `css`, and `text`. ECMAScript itself mandates only `json`; support for the others depends on the host.

**Q:** Does Node.js let CommonJS `require` a JSON file?
**A:** Yes, without attributes. Node.js shares one cache entry between `require` and a JSON `import` of the same path.

## Exercises

### Which fail

```js
import a from './data.json';                                   // 1
import b from './data.json' with { type: 'json', extra: '1' }; // 2
import { name } from './data.json' with { type: 'json' };      // 3
```

**Answer:** All three fail in Node.js 24, each in a separate file. (1) `TypeError [ERR_IMPORT_ATTRIBUTE_MISSING]`: `type: json` is required. (2) `TypeError [ERR_IMPORT_ATTRIBUTE_UNSUPPORTED]`: the key `extra` is not supported. (3) `SyntaxError`: the module does not provide an export named `name`, since a JSON module has only `default`.
