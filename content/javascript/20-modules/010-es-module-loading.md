---
title: "How do ES modules load?"
status: draft
difficulty: hard
frequency: 4
core: true
tags: [esm, import, export, live-bindings, module-record, namespace-object, linking, evaluation]
related:
  - javascript/scope-and-execution-contexts/environment-records
  - javascript/scope-and-execution-contexts/temporal-dead-zone
  - javascript/modules/esm-vs-commonjs
  - javascript/modules/circular-imports
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-cyclic-module-records
  - https://tc39.es/ecma262/#sec-source-text-module-records
  - https://tc39.es/ecma262/#sec-module-environment-records
  - https://tc39.es/ecma262/#sec-module-namespace-exotic-objects
  - https://tc39.es/ecma262/#sec-HostLoadImportedModule
  - https://html.spec.whatwg.org/multipage/webappapis.html#fetch-the-descendants-of-and-link-a-module-script
  - https://html.spec.whatwg.org/multipage/scripting.html#prepare-the-script-element
  - https://nodejs.org/docs/latest-v24.x/api/esm.html
tldr: >
  A module graph loads in three phases before and during execution: construct (parse every module and fetch
  its imports, without running anything), link (create each module's environment and bind imports to the
  exporting module's variables), then evaluate (run each body once, dependencies first). Imports are
  read-only live bindings, not copies.
---

## Answer

`import` and `export` declarations are static: they sit at the top level, take string-literal specifiers, and the engine can read them without running code. That lets the host process a whole module graph in phases:

1. **Construct (load).** Parse the entry module into a Module Record, read its requested specifiers, and ask the host to locate and fetch each one, recursively. Nothing executes. A syntax error anywhere fails the whole graph. Each URL becomes one record, held in a per-realm cache (the browser's "module map"), so a module is loaded once however many files import it.
2. **Link (instantiate).** For each module, create a Module Environment Record. Imports become immutable *indirect bindings*: a name that points at a binding in the exporting module's environment. Function declarations are initialized now; `let`, `const`, and `class` bindings exist but are uninitialized (their TDZ), and `var` bindings are `undefined`. A missing or ambiguous export is a `SyntaxError` here, before any module body has run.
3. **Evaluate.** Run module bodies depth-first, dependencies before dependents, siblings in import order, each body once.

The result is live bindings. `import { count }` does not copy the value. Reading `count` reads the exporter's variable at that moment, so later changes show up. The importer can't assign to it (`TypeError`), and only the exporting module can change it. `import * as ns` gives a module namespace object: a null-prototype, non-extensible view with one live property per export.

Import declarations are hoisted: they are processed at link time, so a dependency evaluates before the importer's first statement, wherever the `import` is written.

## Example

```js
// counter.mjs
console.log('counter evaluated');
export let count = 0;
export function inc() {
  count++;
}

// main.mjs
console.log('main body starts');
import { count, inc } from './counter.mjs';

console.log(count);
inc();
console.log(count);
try {
  count = 10;
} catch (error) {
  console.log(error.name);
}
// → counter evaluated
// → main body starts
// → 0
// → 1
// → TypeError
```

## Pitfalls

- Treating `import` like `require`: the dependency runs before the importing file's first line, even when the `import` appears below other code. For conditional or lazy loading, use `import()`.
- Expecting `export default count` to be live. `export default <expression>` stores the expression's value once. `export { count as default }` is a live binding.
- Mutating an import from the importing side (`count = 10` or `ns.count = 10`). Both throw `TypeError`. Export a function that changes the variable instead.
- Spreading a namespace (`{ ...ns }`) to get a snapshot, then expecting updates. The copy holds plain data properties.

## Follow-ups

**Q:** Why can a module fail with `SyntaxError` before logging anything?
**A:** Resolving `import { nope }` happens during link, before evaluation. A missing export, or a name exported by two `export *` sources, is reported there, so no module body in the graph runs.

**Q:** What does importing the same module from two files do?
**A:** Both get the same Module Record, hence the same bindings and one evaluation. The host keys its cache by resolved URL, plus the module type for JSON.

**Q:** Can a module reach a binding in a dependency that has not run yet?
**A:** Only in a cycle. Reading an uninitialized `let`, `const`, or `class` throws `ReferenceError`; a function declaration already works. See the circular imports question.

## Deep dive

### How it works

ECMA-262 models a module as a Source Text Module Record, a kind of Cyclic Module Record, with a `[[Status]]` that moves `new`, `unlinked`, `linking`, `linked`, `evaluating`, (`evaluating-async`), `evaluated`. Three methods drive it, and the host (browser, Node.js) decides how to fetch.

**Loading.** `LoadRequestedModules` walks `[[RequestedModules]]` and calls the host hook `HostLoadImportedModule` for every specifier not yet loaded. The host fetches, parses, and answers asynchronously. A module that is already in the visited list isn't followed again, which is what ends a cycle. When the count of pending requests reaches zero, every record moves to `unlinked`. HTML's "fetch the descendants of and link a module script" is exactly this: `LoadRequestedModules`, then `Link()`.

**Linking.** `Link` runs `InnerModuleLinking`, a depth-first traversal that tracks strongly connected components so a cycle links as a unit. For each module, `InitializeEnvironment` does the following:

- Check that every indirect export resolves.
- Create the Module Environment Record.
- For each import, call `ResolveExport` on the exporter, then `CreateImportBinding`. This is the live link: a binding that stores the target module and name, not a value. A star import instead binds the namespace object.
- Declare the module's own `var` (initialized to `undefined`), `let`/`const`/`class` (uninitialized), and function declarations (instantiated immediately).

`GetBindingValue` on an indirect binding goes to the target module's environment, and throws `ReferenceError` if that environment doesn't exist yet or the target binding is uninitialized.

**Evaluation.** `Evaluate` runs `InnerModuleEvaluation`, again depth-first: mark the module `evaluating`, recurse into each requested module in order, then run the module's own body (`ExecuteModule`). A module already `evaluating` is skipped, so a cycle does not recurse forever. Because each module runs once, after its dependencies, the order is a post-order walk. If `root` imports `c` and then `a`, `a` imports `b`, and `b` imports `c`, the bodies run `c`, `b`, `a`, `root` (verified in Node.js 24).

A failed evaluation is stored in the record: later imports of that module rethrow the same error rather than re-running it.

### Edge cases

Link-time failures stop everything before output. Given `bad.mjs` containing `console.log('bad body'); import { nope } from './counter.mjs';`, Node.js prints only `SyntaxError: The requested module './counter.mjs' does not provide an export named 'nope'`, and `bad body` never appears.

The namespace object is a module namespace exotic object. Its `[[Get]]` reads the live binding, `[[Set]]` returns `false` (strict-mode assignment throws), `[[GetPrototypeOf]]` returns `null`, and it is non-extensible. Properties report `{ writable: true, enumerable: true, configurable: false }`, sorted by code unit order, plus `Symbol.toStringTag` of `"Module"`:

```js
import * as ns from './counter.mjs';
console.log(Object.getPrototypeOf(ns), Object.isExtensible(ns), ns[Symbol.toStringTag]);
console.log(Object.getOwnPropertyDescriptor(ns, 'count'));
// → null false Module
// → { value: 1, writable: true, enumerable: true, configurable: false }
```

The `value: 1` is the state after the example's single `inc()` call. Writes fail even though the descriptor says `writable: true`; the descriptor is a reflection of the live value, not a promise that `[[Set]]` works.

`export * from` skips `default`, and a name provided by two star exports is ambiguous. `import * as hub` just omits it, but `import { x }` is a link-time `SyntaxError` ("contains conflicting star exports"). An explicit local export wins over a star export.

### Real-world scenario

In a browser, `<script type="module">` runs the construct and link phases without blocking the parser and evaluates after the document has been parsed, like `defer`. The `async` attribute makes it evaluate as soon as the graph is ready. Fetching, the module map, import maps, and CORS belong to the browser runtime topic. Bundlers read the same static structure to build the graph at build time and remove unused exports.

### Trade-offs

Static structure buys early errors, whole-graph analysis (tree shaking, parallel fetch), and live bindings that make cycles workable. The cost is that `import` can't depend on runtime values: no `import` inside `if`, no computed specifier. `import()` is the escape hatch, at the price of an asynchronous result.
