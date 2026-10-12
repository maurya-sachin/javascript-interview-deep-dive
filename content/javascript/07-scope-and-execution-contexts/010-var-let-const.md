---
title: "What's the difference between `var`, `let`, and `const`?"
status: draft
difficulty: easy
frequency: 5
core: false
tags: [scope, var, let, const, declarations]
related:
  - javascript/scope-and-execution-contexts/hoisting
  - javascript/scope-and-execution-contexts/temporal-dead-zone
  - javascript/scope-and-execution-contexts/global-object-globalthis
  - javascript/closures/closures-in-loops
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-let-and-const-declarations
  - https://tc39.es/ecma262/#sec-variable-statement
  - https://tc39.es/ecma262/#sec-blockdeclarationinstantiation
  - https://tc39.es/ecma262/#sec-declarative-environment-records-setmutablebinding-n-v-s
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/var
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const
tldr: >
  `var` is function-scoped, can be redeclared, and starts as `undefined`. `let` and `const` are
  block-scoped, can't be redeclared in the same scope, and can't be read before their declaration
  runs (TDZ). `const` also forbids reassigning the binding, but the value it holds stays mutable.
---

## Answer

The three keywords differ in four ways.

| | `var` | `let` | `const` |
|---|---|---|---|
| Scope | Function (or script/module) | Block | Block |
| Before its declaration runs | `undefined` | `ReferenceError` (TDZ) | `ReferenceError` (TDZ) |
| Redeclare in the same scope | Allowed | `SyntaxError` | `SyntaxError` |
| Reassign | Allowed | Allowed | `TypeError` |

**Scope.** A `var` ignores blocks (`if`, `for`, `{}`) and belongs to the nearest enclosing function, or the script or module. `let` and `const` belong to the nearest block, which gets its own Declarative Environment Record each time it runs.

**Before the declaration.** All three bindings are created when the scope is entered (see hoisting). A `var` is initialized to `undefined` straight away. `let` and `const` stay uninitialized until the declaration is evaluated; reading them earlier throws.

**`const` is a binding rule, not immutability.** `const` makes the *binding* immutable: assigning to it throws a `TypeError`. The value is untouched, so a `const` object or array can still be mutated. Use `Object.freeze` for shallow immutability of the value.

**Global side effect.** In a classic script, a top-level `var` or function declaration also becomes a property of the global object. `let`, `const`, and `class` don't. Module code has no such link.

Default to `const`, use `let` when you reassign, and avoid `var` in new code.

## Example

```js
function scopes() {
  if (true) {
    var fromVar = 'var';
    let fromLet = 'let';
  }
  console.log(fromVar); // → var
  console.log(typeof fromLet); // → undefined (out of scope)
}
scopes();

const settings = { theme: 'dark' };
settings.theme = 'light'; // fine: the object is mutable
console.log(settings.theme); // → light

try {
  settings = {};
} catch (error) {
  console.log(error.name); // → TypeError
}

try {
  new Function('let x; let x;');
} catch (error) {
  console.log(error.name); // → SyntaxError (redeclaration is an early error)
}
```

## Pitfalls

- Saying "`const` makes the value constant". It fixes the binding only; `const list = []; list.push(1)` is fine.
- Saying "`let` and `const` aren't hoisted". They are: the binding exists from the start of the block, which is why they can *shadow* an outer variable and throw in the TDZ instead of reading it.
- Assuming `let` in a `for` head behaves like any other block-scoped `let`. The spec makes a fresh copy per iteration; that is what fixes the closure-in-loop bug.
- Expecting `var x` in a module to create `globalThis.x`. It doesn't; only classic scripts do.

## Follow-ups

**Q:** Does `let x;` initialize `x` to `undefined`?
**A:** Yes, when the declaration is evaluated. A `let` with no initializer is initialized to `undefined` at that point; before it, the binding is in the TDZ. `const` requires an initializer.

**Q:** Why can't I redeclare `let` but can redeclare `var`?
**A:** Duplicate lexical names (`let`/`const`/`class`) are early errors, so the code never runs. Duplicate `var` names just refer to one binding.

**Q:** Is `var` ever the right choice?
**A:** Rarely. It matters when reading old code and in sloppy-mode scripts that rely on global properties. In new modules, `let` and `const` cover every case with tighter scope.

## Exercises

### Predict the output

```js
const fns = [];
for (var i = 0; i < 2; i++) {
  let j = i;
  fns.push(() => [i, j]);
}
console.log(fns.map((fn) => fn()));
```

**Answer:** `[ [ 2, 0 ], [ 2, 1 ] ]`. `i` is one function-scoped binding that ends at `2`. `j` is a new block-scoped binding in each iteration, so each arrow keeps its own `j`.

### Is it frozen?

```js
const config = Object.freeze({ nested: { debug: false } });
config.nested.debug = true;
console.log(config.nested.debug);
try {
  config.mode = 'prod';
} catch (error) {
  console.log(error.name);
}
```

**Answer:** It prints `true`, then `TypeError`. `Object.freeze` is shallow: the nested object is still mutable. Adding a property to the frozen object throws because module code is strict; in sloppy mode the write would fail silently.
