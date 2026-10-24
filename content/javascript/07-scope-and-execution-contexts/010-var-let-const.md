---
title: "What's the difference between `var`, `let`, and `const`?"
status: draft
difficulty: easy
frequency: 5
core: true
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
  - https://tc39.es/ecma262/#sec-functiondeclarationinstantiation
  - https://tc39.es/ecma262/#sec-globaldeclarationinstantiation
  - https://nodejs.org/docs/latest-v24.x/api/vm.html
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
  console.log(typeof fromLet); // → undefined
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
  console.log(error.name); // → SyntaxError
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

## Deep dive

### How it works

The four differences in the Answer come from *which Environment Record holds the binding* and *when it is initialized*.

In a function, `FunctionDeclarationInstantiation` puts `var` names (and parameters) in the function's `VariableEnvironment`, initialized to `undefined`. `let`/`const` names go in a lexical environment and stay uninitialized until their declaration runs. Blocks create their own Declarative Environment Record on entry (`BlockDeclarationInstantiation`); a `switch` creates one for the whole `CaseBlock`.

At the top level of a classic script, the Global Environment Record is two records in one: an Object Environment Record backed by the global object, and a Declarative Environment Record. `var` and function declarations go to the object side (so they become non-configurable global properties); `let`, `const` and `class` go to the declarative side (so they don't). Node's `vm` module runs code as a classic script, which makes this observable:

```js
import vm from 'node:vm';

const context = vm.createContext({});
vm.runInContext('var fromVar = 1; let fromLet = 2; const fromConst = 3;', context);

console.log(Object.keys(context)); // → [ 'fromVar' ]
console.log(vm.runInContext('fromLet + fromConst', context)); // → 5

try {
  vm.runInContext('var fromLet = 9;', context);
} catch (error) {
  console.log(error.name); // → SyntaxError
}
vm.runInContext('var fromVar = 10;', context); // var may be redeclared
console.log(context.fromVar); // → 10
```

Lexical bindings are still reachable by name from later scripts, which is why `fromLet + fromConst` works. They just aren't properties.

### Edge cases

- **Parameter expressions split the scope.** When a parameter list contains expressions (defaults), the spec creates a separate environment for the function body's `var`s, so a closure in the parameter list doesn't see body declarations. Without parameter expressions there is one environment.
- **`switch` is one block.** All `case` clauses share a single lexical scope, so a `let` in one clause is in the TDZ, not out of scope, in another.
- **`const` binds per iteration only where the loop creates one.** `for (const x of list)` creates a fresh binding each pass. `for (const i = 0; i < 2; i++)` throws a `TypeError` at the increment.
- **`var` conflicts with a lexical name too.** `let x` and `var x` in the same scope are an early `SyntaxError`; across two scripts the same conflict is a run-time `SyntaxError` (see below).

```js
var x = 'outer';
function run(getX = () => x) {
  var x = 'inner';
  return [x, getX()];
}
console.log(run()); // → [ 'inner', 'outer' ]

function pick(kind) {
  switch (kind) {
    case 'a':
      let value = 'A';
      return value;
    case 'b':
      try {
        return value; // same block scope as the `let` in case 'a'
      } catch (error) {
        return error.name;
      }
  }
}
console.log(pick('b')); // → ReferenceError

try {
  for (const j = 0; j < 2; j++) {}
} catch (error) {
  console.log(error.name); // → TypeError
}
```

In `run`, `getX` reads the outer `x` because the parameter-list closure can't see the body's `var x`.

### Real-world scenario

Classic `<script>` tags share one global declarative record. If a third-party snippet and your bundle both declare `const config`, the second script fails at `GlobalDeclarationInstantiation`, a runtime `SyntaxError` rather than an early error, because the conflict spans two scripts. The spec says that when this check fails, no bindings are instantiated for the failing script, and its code doesn't run. With `var` for both names, nothing would have thrown and the later script would silently overwrite the earlier value.

```js
import vm from 'node:vm';

const page = vm.createContext({});
vm.runInContext('const config = { source: "snippet" };', page);

try {
  vm.runInContext('var startedApp = true; const config = { source: "app" };', page);
} catch (error) {
  console.log(error.name); // → SyntaxError
}
console.log(page.startedApp, vm.runInContext('config.source', page)); // → undefined snippet
```

Module code has its own top-level scope, so this mostly affects inline and legacy classic scripts. The fix is to load them as modules or wrap each in an IIFE, not to switch to `var`.

### Trade-offs

`const` by default communicates "this binding never changes", which removes a class of reassignment bugs from review; `let` marks the variables that do change, which makes the changing state easy to spot. `var` offers nothing that block scoping doesn't, apart from deliberately creating global properties in classic scripts. Linters enforce this (`no-var`, `prefer-const`), and converting old code from `var` to `let` can change behaviour wherever a variable is read before its declaration, used outside its block, or captured in a loop, so convert in small, tested steps.

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
