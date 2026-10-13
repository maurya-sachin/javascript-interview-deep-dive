---
title: "How does dynamic `import()` work?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [dynamic-import, import, lazy-loading, code-splitting, promise, namespace-object]
related:
  - javascript/modules/es-module-loading
  - javascript/modules/esm-vs-commonjs
  - javascript/modules/import-attributes-json-modules
  - javascript/promises/what-is-a-promise
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-import-calls
  - https://tc39.es/ecma262/#sec-HostLoadImportedModule
  - https://html.spec.whatwg.org/multipage/webappapis.html#hostloadimportedmodule
  - https://nodejs.org/docs/latest-v24.x/api/esm.html#import-expressions
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import
tldr: >
  `import(specifier)` is a syntax form (not a function) that loads, links, and evaluates a module at run time and
  returns a promise for its namespace object. The specifier can be computed, it works in scripts and CommonJS, and
  the module is evaluated once and then cached. Failures reject the promise instead of throwing.
---

## Answer

`import(specifier)` is an expression that returns a promise. It does the same three phases as a static import (load the graph, link, evaluate), but only when the expression runs, and it fulfills with the module's **namespace object**. Default exports are on `.default`.

How it differs from static `import`:

- **Run time, not link time.** The specifier is any expression converted with `ToString`, so it can be computed or conditional. A static `import` is hoisted and runs before the module body.
- **Available everywhere.** It works in classic scripts, CommonJS, and ES modules. In CommonJS it is the supported way to load an ES module that uses top-level `await`.
- **Asynchronous.** The promise settles after the fetch, link, and evaluation, even if the module is already cached.
- **Cached.** The same resolved module gives the same namespace object and is evaluated once. Two calls share one load.
- **Errors reject.** A missing file, a link error (`SyntaxError` for a missing export), an evaluation error, or an unsupported option all reject the promise. Evaluation errors are remembered, so a second `import()` of the same module rejects with the same error.

It is syntax, not a function: `import.call(...)` and `const f = import` are `SyntaxError`s, and there is no `import` binding to override.

Relative specifiers resolve against the module that contains the `import()` call, not the working directory. The second argument is an options object (`{ with: { type: 'json' } }`) for import attributes.

The main use is lazy loading: defer a heavy module until a feature is used, and let bundlers turn each `import()` into a separately downloaded chunk (covered in the tooling topic).

## Example

```js
console.log('start');
const button = { onclick: null };
button.onclick = async () => {
  const { default: run } = await import('./heavy.mjs');
  console.log(run());
};
console.log('before click');
await button.onclick();
await button.onclick();
// → start
// → before click
// → heavy evaluated
// → ran
// → ran
```

`heavy.mjs` logs `heavy evaluated` and exports a default function that returns `'ran'`. The module body ran on the first call only.

## Pitfalls

- Forgetting that the result is the namespace. `const run = await import('./x.mjs')` gives an object; use `.default` or destructure.
- Wrapping `import()` in `try`/`catch` but not using `await`. The promise rejects later, outside the `try`.
- Expecting `import()` of a CommonJS file to expose live named exports. You get `default` plus whatever Node.js detects (see the ESM vs CommonJS question).
- Writing ``import(`./${name}`)`` with user-controlled input. The specifier decides which code runs. Allow-list the names.

## Follow-ups

**Q:** Does `import()` run the module again on every call?
**A:** No. The host keys loaded modules by resolved URL (and module type), so the body runs once and later calls get the same namespace object.

**Q:** Is `import()` a function?
**A:** No. It looks like a call but is its own syntax (`ImportCall`), so it can't be passed around, `call`ed, or reassigned.

**Q:** How do you load several modules at once?
**A:** `Promise.all([import('./a.mjs'), import('./b.mjs')])`. Use `allSettled` to keep going when one fails.

## Deep dive

### How it works

The spec's `EvaluateImportCall` runs these steps in order:

1. Take the *referrer*: the active script or module, or the current realm if there is none (for example an inline `onclick="import('./x.mjs')"` handler in HTML).
2. Evaluate the specifier and options.
3. Create a promise capability.
4. `ToString` the specifier. If that throws, reject.
5. Read `options.with`, which must be an object whose values are strings, and reject with `TypeError` if not. Reject with `TypeError` if the host does not support a given attribute key.
6. Call the host hook `HostLoadImportedModule` with the referrer and a module request `{ specifier, attributes }`.

Once the host delivers a Module Record, `ContinueDynamicImport` calls `LoadRequestedModules` to fetch the rest of the graph, then `Link()`, then `Evaluate()`. It resolves the promise with `GetModuleNamespace(module)` only after evaluation (including any top-level `await`) fulfills. Any step's failure rejects the same promise.

Because the checks in steps 4 and 5 produce rejections, not exceptions, bad arguments never throw synchronously:

```js
const p = import(Symbol('x'));
const q = import('./heavy.mjs', 'oops');
console.log(p instanceof Promise, q instanceof Promise);
await Promise.allSettled([p, q]).then((r) => console.log(r.map((x) => x.reason.name)));
// → true true
// → [ 'TypeError', 'TypeError' ]
```

### Edge cases

An evaluation error is stored on the module record, so every later import of it, static or dynamic, gets the same error and the body does not re-run.

The ordering is a promise's: the code after `import()` continues first.

### Real-world scenario

Route-level code splitting is the common use: `const Page = lazy(() => import('./Page.js'))`. Bundlers treat a static-string `import()` as a chunk boundary (tooling topic). Browsers fetch the module over the network (subject to caching and CORS), which belongs to the browser runtime topic.

### Trade-offs

Dynamic import adds a network or disk round trip and an extra async step at the point of use, and the code can't be analyzed as precisely as static imports. Use it for code that is large and not needed at startup. Keep it out of code that always runs, where a static import is simpler and starts earlier.

## Exercises

### Log order

```js
console.log(1);
import('./heavy.mjs').then(() => console.log(3));
console.log(2);
```

**Answer:** `1`, `2`, then `heavy evaluated` (from `heavy.mjs`), then `3` (run in Node.js 24). The call returns a promise immediately; the module is loaded and evaluated later, and `.then` runs after that.

### Partial failure

```js
const results = await Promise.allSettled([import('./nope.mjs'), import('./heavy.mjs')]);
console.log(results.map((r) => r.status));
```

**Answer:** `[ 'rejected', 'fulfilled' ]` (preceded by `heavy evaluated`). A missing file rejects only its own promise (`ERR_MODULE_NOT_FOUND` in Node.js).
