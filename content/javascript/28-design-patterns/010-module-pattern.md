---
title: "What is the module pattern, and what did ES modules take over from it?"
status: draft
difficulty: easy
frequency: 3
core: false
tags: [module-pattern, iife, revealing-module, es-modules, closures]
related:
  - javascript/functions/iife
  - javascript/closures/private-state
  - javascript/modules/es-module-loading
  - javascript/how-javascript-runs/scripts-vs-modules
  - javascript/design-patterns/singleton
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-module-environment-records
  - https://tc39.es/ecma262/#sec-createimportbinding
  - https://tc39.es/ecma262/#sec-module-namespace-exotic-objects
  - https://tc39.es/ecma262/#sec-HostLoadImportedModule
  - https://html.spec.whatwg.org/multipage/webappapis.html#module-map
  - https://nodejs.org/api/esm.html#urls
  - https://esbuild.github.io/api/#format-iife
tldr: >
  The module pattern wraps code in an IIFE so its variables live in that call's scope, and
  returns closures as the public API; the revealing variant defines everything
  privately and returns references to it. ES modules took over the job: a module scope per file,
  `export` as the API, live read-only imports, and one evaluation per module record.
---

## Answer

Before ES2015, every classic script shared one global scope, so any top-level `var` or function could collide with another file's. The **module pattern** fixed that with a closure: wrap the file in an IIFE, keep state and helpers as locals of that call, and return an object whose methods close over them. Nothing outside can reach the locals; the returned object is the whole API. Dependencies came in as IIFE arguments, such as `(function ($) { … })(jQuery)`.

The **revealing module** variant writes every function as a private local and ends with `return { add, increment }`, so the API is listed in one place.

ES modules took over each piece:

- **Scope.** Every module gets its own Module Environment Record. Top-level declarations are not global properties, so no wrapper is needed.
- **API.** `export` replaces the returned object. An import is an immutable indirect binding (`CreateImportBinding`): importers see the exporter's current value and can't assign to it.
- **Run once.** A host gives back the same Module Record for the same request, and the record is evaluated once. In practice that means once per resolved URL per realm (browser window or worker, Node.js process), which is the IIFE's "single instance" behaviour.
- **Dependencies.** Static `import` declarations replace IIFE parameters, so tools can see the graph before running it.
- **Strictness.** Module code is always strict.

The IIFE pattern survives where there are no modules: classic `<script>` tags, and bundler output (esbuild's `iife` format exists to keep bundle variables out of the global scope). If you need many instances, you want a factory function, not a module.

## Example

```js
// Revealing module pattern: the IIFE runs once; its locals stay private.
const counter = (function () {
  let count = 0; // reachable only through the closures below

  function add(n) {
    count += n;
    return count;
  }
  function increment() {
    return add(1); // calls the private add, not counter.add
  }

  return { add, increment, read: () => count };
})();

counter.increment();
counter.add(5);
console.log(counter.read(), typeof count); // → 6 undefined

// Patching the public object doesn't reach internal calls.
counter.add = () => 'patched';
console.log(counter.increment()); // → 7
```

## Pitfalls

- Returning a primitive in the API object (`return { count }`). That copies the value once; later changes are invisible. Use a getter or function, or an ES module `export`, which stays live.
- Expecting to override a revealing module's methods. Internal code calls the private functions, so replacing a public property changes only external callers.
- Treating "private" as testable. Locals and unexported bindings can only be exercised through the public API; design that API with tests in mind.
- Assuming an ES module runs once globally. It runs once per Module Record: a different resolved URL (even a different query string in Node.js) or a different realm gives a second copy.

## Follow-ups

**Q:** What is `import * as ns` in these terms?
**A:** A module namespace exotic object: its properties reflect the module's exports live, it has a `null` prototype, and it's sealed. Assigning to a property or adding one throws a `TypeError` in module code. It's the closest built-in equivalent of the module pattern's returned object.

**Q:** Is an unexported module variable truly private?
**A:** From other modules, yes: there's no import or reflection API that reaches a binding the module didn't export. Code in the same module can use it freely, and debuggers can inspect it, as with closures.

**Q:** Why did the pattern pass dependencies as IIFE arguments?
**A:** To make dependencies explicit and local: the body refers to a parameter instead of a global looked up at call time. Static `import` declarations do the same, but the host loads and links them before any code runs.

## Exercises

### Predict the output

```js
// counter.mjs
let count = 0;
export function increment() {
  count += 1;
}
export { count };

// main.mjs
import { count, increment } from './counter.mjs';
import * as again from './counter.mjs';
increment();
increment();
console.log(count, again.count);
try {
  count = 10;
} catch (error) {
  console.log(error.name);
}
```

**Answer:** `2 2`, then `TypeError`. Both imports resolve to the same Module Record, evaluated once, and both read the live `count` binding. The import is an immutable binding, so assigning to it throws at run time.

### Predict the output

```js
const makeCounter = function () {
  let count = 0;
  return { increment: () => ++count };
};
const a = makeCounter();
const b = makeCounter();
const single = (function () {
  let count = 0;
  return { increment: () => ++count };
})();
a.increment();
a.increment();
b.increment();
single.increment();
console.log(a.increment(), b.increment(), single.increment());
```

**Answer:** `3 2 2`. Each call to `makeCounter` creates a new environment, so `a` and `b` count separately. The IIFE is the same function body called exactly once: one environment, one instance.
