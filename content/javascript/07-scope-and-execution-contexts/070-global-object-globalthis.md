---
title: "What is the global object, and how does `globalThis` relate to global variables?"
status: draft
difficulty: medium
frequency: 2
core: false
tags: [global-object, globalthis, scope, var, let, scripts, modules]
related:
  - javascript/scope-and-execution-contexts/var-let-const
  - javascript/scope-and-execution-contexts/environment-records
  - javascript/how-javascript-runs/scripts-vs-modules
  - javascript/scope-and-execution-contexts/realms
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-global-environment-records
  - https://tc39.es/ecma262/#sec-globaldeclarationinstantiation
  - https://tc39.es/ecma262/#sec-hasrestrictedglobalproperty
  - https://tc39.es/ecma262/#sec-createglobalvarbinding
  - https://tc39.es/ecma262/#sec-globalthis
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis
  - https://nodejs.org/api/vm.html
tldr: >
  The global object holds the built-ins (`Array`, `Math`, …) and, in classic scripts, the
  top-level `var` and function declarations. `globalThis` is the standard way to reach it in any
  host. Top-level `let`, `const`, and `class` are global bindings but not properties, and module
  top-level declarations are neither.
---

## Answer

The **global object** is an ordinary object created per realm that supplies the global scope with its built-in bindings (`Array`, `Math`, `undefined`, …) and any properties added later. **`globalThis`** is a property of it that points back to the global `this` value. Hosts used to name it differently (`window` and `self` in browsers, `global` in Node); `globalThis` works in all of them.

Which top-level declarations end up on it depends on the declaration and the kind of code. The spec's Global Environment Record has two halves: an Object record backed by the global object, and a Declarative record.

| Declaration | In a classic script | In a module |
|---|---|---|
| `var`, function declaration | Global object property (non-configurable) | Module scope only |
| `let`, `const`, `class` | Declarative record: a global binding, no property | Module scope only |
| Assignment to an undeclared name (sloppy) | Creates a configurable property | `ReferenceError` (strict) |

A script's `var` and function names live in the Object half, so `globalThis.name` and bare `name` are the same binding. `let`/`const`/`class` live in the Declarative half, which is searched first, so they can shadow a global property (but not a non-configurable one: `let undefined` is a `SyntaxError`). Two scripts that both declare the same top-level `let` collide with a `SyntaxError`, because the Declarative record is shared across all scripts in the realm.

Module code has its own Module Environment Record under the global one, so it sees globals but declares nothing in them. Node's CommonJS files are wrapped in a function, so `var` there isn't global either.

Use `globalThis` for feature detection (`typeof globalThis.fetch`) and polyfills. Avoid creating globals; they're shared mutable state.

## Example

```js
import vm from 'node:vm';

// node:vm evaluates source as a classic script in a fresh global environment.
const context = vm.createContext({});
vm.runInContext(
  'var fromVar = 1; function fromFn() {} let fromLet = 2; const fromConst = 3; implicit = 4;',
  context,
);

console.log(Object.keys(context).sort()); // → [ 'fromFn', 'fromVar', 'implicit' ]
console.log(vm.runInContext('fromLet + fromConst', context)); // → 5 (global bindings, no properties)

var inModule = 1; // this file is a module, so this is module-scoped
console.log('inModule' in globalThis); // → false
```

## Pitfalls

- Expecting `var x` to create `globalThis.x` in modules, bundles, or Node files. Only a classic `<script>` (or the REPL-like script context above) does.
- Saying `let` and `const` aren't global. They are global *bindings*; they are just not properties of the global object.
- Reading top-level `this` as the global object. It is `undefined` in modules and `module.exports` in a Node CommonJS file; only a classic script's top level has `this === globalThis`.
- Treating `window` as the global object in a browser. `globalThis` there is a `WindowProxy` that wraps the real global, so identity checks across frames can surprise you.

## Follow-ups

**Q:** Why was `globalThis` added?
**A:** There was no portable way to reach the global object. `window` fails in workers and Node, `global` fails in browsers, and `this` at the top of a function is `undefined` in strict mode. `globalThis` is the same everywhere.

**Q:** Can `globalThis` differ from the global object?
**A:** In principle, yes; hosts may supply any object as the global `this`. In browsers it is the `WindowProxy`. In Node it is the same object as `global`.

**Q:** Is it safe to delete a global?
**A:** Only properties created as configurable. Script `var` and function declarations are non-configurable, so `delete` fails; implicit globals made by sloppy assignment are configurable and can be deleted.

## Exercises

### Script or module?

```js
var a = 1;
let b = 2;
console.log(globalThis.a, globalThis.b);
```

**Answer:** In this file, an ES module, it prints `undefined undefined`: neither is a global declaration. As a classic `<script>` it would print `1 undefined`, because the `var` is a global-object property and the `let` is not.

### What is `this`?

```js
function strictThis() {
  return this;
}
const sloppyThis = new Function('return this'); // Function bodies are sloppy mode
console.log(strictThis(), sloppyThis() === globalThis);
```

**Answer:** `undefined true`. A plain call in strict code (the module) leaves `this` as `undefined`. A sloppy-mode function receiving `undefined` replaces it with the global `this` value.
