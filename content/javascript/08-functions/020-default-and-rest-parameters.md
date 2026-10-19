---
title: "How do default and rest parameters work?"
status: draft
difficulty: medium
frequency: 2
core: false
tags: [functions, parameters, default-parameters, rest-parameters, scope]
related:
  - javascript/functions/arguments-object
  - javascript/functions/function-forms
  - javascript/scope-and-execution-contexts/temporal-dead-zone
  - javascript/operators-and-syntax/spread-vs-rest
  - javascript/operators-and-syntax/destructuring
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-functiondeclarationinstantiation
  - https://tc39.es/ecma262/#sec-static-semantics-expectedargumentcount
  - https://tc39.es/ecma262/#sec-function-definitions-static-semantics-early-errors
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Default_parameters
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/length
tldr: >
  A default is an expression evaluated at call time, only when the argument is `undefined`, in
  left-to-right order inside its own parameter scope: it can see earlier parameters (later
  ones are in their TDZ) but not the function body's declarations. A rest parameter collects the
  remaining arguments into a real array. Both make the list "non-simple" and shorten `length`.
---

## Answer

**Defaults.** `function f(a = expr)` evaluates `expr` each time `f` is called with `a` missing or `undefined`. Not at definition time, and not for `null`, `0`, or `''`. So `list = []` gives every call a fresh array, and a default can call a function with side effects.

**Order and scope.** Parameters are initialized left to right. A default can read earlier parameters; reading a later one is a TDZ `ReferenceError`. When any parameter has an expression, `FunctionDeclarationInstantiation` gives the parameters their own Environment Record and puts body `var`s in a separate one, so closures in the parameter list can't see declarations in the body.

**Rest.** `...rest` must be last, has no default, and gets the remaining arguments as a real `Array`. It replaces most uses of `arguments`.

**Side effects on the function.**

- `length` counts only the parameters before the first default or rest parameter.
- A parameter list with defaults, rest, or destructuring is "non-simple": a `"use strict"` directive in the body becomes a `SyntaxError`, and `arguments` is the unmapped kind.

## Example

```js
let calls = 0;
const nextId = () => ++calls;

function create(id = nextId(), label = `item-${id}`, ...tags) {
  return { id, label, tags };
}

console.log(create()); // → { id: 1, label: 'item-1', tags: [] }
console.log(create(7, undefined, 'a', 'b')); // → { id: 7, label: 'item-7', tags: [ 'a', 'b' ] }
console.log(create(null).id, calls); // → null 1

try {
  ((a = b, b = 1) => {})();
} catch (e) {
  console.log(e.name); // → ReferenceError
}

const x = 'outer';
function scoped(read = () => x) {
  var x = 'body';
  return read();
}
console.log(scoped()); // → outer

console.log(((a, b = 1, c) => {}).length, ((...r) => {}).length); // → 1 0
```

## Pitfalls

- Expecting `null` to trigger a default. Only `undefined` does; `create(null)` keeps `null`.
- Reading a later parameter in a default: it is in its TDZ. Body-level `var` and function declarations aren't visible to defaults at all, so a default can't call a helper declared inside the body.
- Using `fn.length` to count expected arguments. A default or rest parameter stops the count, which breaks arity-based code like currying.
- Mutating a shared default. Because the default is re-evaluated, `= []` is safe; `= sharedArray` declared outside is not.

## Follow-ups

**Q:** Is `function f(a, b = 1, c)` legal?
**A:** Yes. `c` still has no default, so it is `undefined` when omitted, and it isn't "optional" in any special way. `length` is `1`, because counting stops at the first default.

**Q:** Why can't a function with a default have `"use strict"` in its body?
**A:** The spec makes it an early `SyntaxError` for any non-simple parameter list (V8: "Illegal 'use strict' directive in function with non-simple parameter list"). Put the directive in an enclosing function or module instead.

## Exercises

### Predict the output

```js
function f(a, read = () => a) {
  var a = 2;
  return [a, read()];
}
console.log(f(1));
```

**Answer:** `[ 2, 1 ]`. With a parameter expression, body `var`s live in a second environment. `var a` there starts with the parameter's value (`1`) and is then set to `2`; the closure `read` was created in the parameter environment and still sees the parameter `a`, which is `1`.

### Predict the output

```js
let calls = 0;
const tick = () => ++calls;
function g(n = tick()) { return n; }
g(); g(undefined); g(0); g(null);
console.log(calls);
```

**Answer:** `2`. The default runs for `g()` and `g(undefined)`, not for `0` or `null`.
