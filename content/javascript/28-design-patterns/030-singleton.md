---
title: "How do you make a singleton in JavaScript, and when is one a mistake?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [singleton, es-modules, module-cache, realms, testing]
related:
  - javascript/design-patterns/module-pattern
  - javascript/modules/es-module-loading
  - javascript/modules/esm-vs-commonjs
  - javascript/scope-and-execution-contexts/realms
  - javascript/classes/static-members-and-blocks
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-HostLoadImportedModule
  - https://tc39.es/ecma262/#sec-symbol.for
  - https://tc39.es/ecma262/#sec-code-realms
  - https://html.spec.whatwg.org/multipage/webappapis.html#module-map
  - https://nodejs.org/api/modules.html#caching
  - https://nodejs.org/api/modules.html#module-caching-caveats
  - https://nodejs.org/api/esm.html#urls
  - https://docs.npmjs.com/cli/v11/commands/npm-ls
tldr: >
  Export an instance from a module: the module is evaluated once, so every importer shares it.
  But "once" means once per module record: per resolved URL or path, per realm, per worker.
  Two installed or bundled copies of a package give two instances. Singletons also hide global
  state, which makes tests leak into each other; prefer passing the instance in.
---

## Answer

The idiomatic singleton is a module export: `export const config = createConfig();`. Every importer gets the same object because a module body runs once. A class with a `static` field and a lazy getter works too, but JavaScript can't make a constructor private, so `new` still makes a second instance.

The catch is what "once" covers. ECMAScript only requires a host to return the same Module Record for the same referrer and request; hosts build on that by caching per **resolved URL or path**:

- **Node.js** caches CommonJS by resolved filename and ES modules by URL. Two copies of a package in different `node_modules` folders are two files, so two instances. A different query string is a different URL, so another instance too. A package that ships separate CommonJS and ESM files can be loaded once by `require` and once by `import`.
- **Bundles.** Two bundles (micro-frontends, a library bundled into each consumer) that each include the module each carry their own copy.
- **Realms and workers.** In HTML, each window, iframe and worker has its own module map; a Node.js worker thread loads its own copy of every module.

When copies are a real risk, libraries sometimes store the instance under a `Symbol.for` key on `globalThis`. That is shared across copies within one realm, but still not across workers.

When it's a mistake is mostly about state. A singleton is a global variable with an import statement: any module can change it, tests that touch it leak into each other, and you can't substitute a fake without module mocking. A stateless logger or one connection pool per process is a reasonable singleton; mutable app state usually isn't. My default, a judgement call: create the instance once at the entry point and pass it to whoever needs it.

## Example

```js
// registry.mjs
export const registry = new Map();

// main.mjs
import { registry } from './registry.mjs';
const again = await import('./registry.mjs');
const copy = await import('./registry.mjs?copy'); // another URL → another module record
console.log(registry === again.registry, registry === copy.registry); // → true false

class Config {
  static #instance;
  static get instance() {
    Config.#instance ??= new Config();
    return Config.#instance;
  }
  values = new Map();
}
Config.instance.values.set('theme', 'dark');
console.log(Config.instance.values.get('theme')); // → dark
console.log(new Config() === Config.instance); // → false
```

## Pitfalls

- Assuming "one per app". It's one per module record: duplicate package installs, duplicate bundles, iframes and workers each get their own, and `instanceof` checks between copies fail.
- Making the constructor return the existing instance. It confuses readers and subclasses: `new Subclass()` silently returns the base instance (see the exercise).
- Letting tests share the instance. State from one test leaks into the next unless you add a reset, which is a test-only API in production code.
- Hiding a dependency. Code that imports a singleton doesn't declare that it needs it, so you can't see or swap it at the call site.

## Follow-ups

**Q:** How do you check whether duplicates are your problem?
**A:** Run `npm ls <package>`, which shows every path to it in the dependency tree, and look for it twice in bundle analysis. Copies usually come from incompatible version ranges; deduplicating, or making it a peer dependency of your library, fixes that.

**Q:** Is `Symbol.for` on `globalThis` a cure?
**A:** It's a workaround. The global symbol registry belongs to the agent, so copies in the same thread, even across realms, get the same symbol. But `globalThis` is per realm, so an iframe still has its own slot, and a worker is another agent entirely.

**Q:** What do you do instead in tests?
**A:** Create the instance in a factory and inject it (as a parameter, constructor argument or context). Tests then build a fresh one each time. If you must keep a module-level instance, export the factory too, so tests never need the shared one.

## Exercises

### Predict the output

```js
class Store {
  static #instance;
  constructor() {
    if (Store.#instance) return Store.#instance;
    this.items = [];
    Store.#instance = this;
  }
}
class CachedStore extends Store {}
const a = new Store();
const b = new CachedStore();
console.log(a === b, b instanceof CachedStore);
```

**Answer:** `true false`. `CachedStore`'s implicit constructor calls `super()`, and the base constructor returns the existing `Store` object instead of the new one. `super()` binds that object as `this`, and the derived constructor returns it, so `b` is `a`, which was never a `CachedStore`.

### Predict the output

```js
import vm from 'node:vm';
const here = Symbol.for('app.registry');
const otherRealm = vm.createContext({});
const there = vm.runInContext("Symbol.for('app.registry')", otherRealm);
const OtherMap = vm.runInContext('Map', otherRealm);
console.log(here === there, OtherMap === Map);
```

**Answer:** `true false`. A `node:vm` context is a new realm in the same agent: it has its own built-ins, so its `Map` is a different function, but `Symbol.for` reads the agent-wide registry and returns the same symbol.
