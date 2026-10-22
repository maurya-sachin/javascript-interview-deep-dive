---
title: "Where do a function's `name` and `length` come from?"
status: draft
difficulty: medium
frequency: 2
core: false
tags: [functions, function-name, function-length, name-inference, parameters]
related:
  - javascript/functions/function-forms
  - javascript/functions/default-and-rest-parameters
  - javascript/functions/currying-partial-application
  - javascript/this/call-apply-bind
  - javascript/this/implement-bind
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-setfunctionname
  - https://tc39.es/ecma262/#sec-setfunctionlength
  - https://tc39.es/ecma262/#sec-runtime-semantics-namedevaluation
  - https://tc39.es/ecma262/#sec-isanonymousfunctiondefinition
  - https://tc39.es/ecma262/#sec-assignment-operators-runtime-semantics-evaluation
  - https://tc39.es/ecma262/#sec-static-semantics-expectedargumentcount
  - https://tc39.es/ecma262/#sec-function-instances-name
  - https://tc39.es/ecma262/#sec-function-instances-length
  - https://chromium.googlesource.com/v8/v8/+/main/src/parsing/func-name-inferrer.h
tldr: >
  Both are own, non-writable, configurable data properties set when the function is created.
  `name` is the declared name, or a name the spec infers from the binding or property key an
  anonymous function is assigned to (NamedEvaluation). `length` is the number of parameters before
  the first default or rest parameter (ExpectedArgumentCount). Neither affects how calls work.
---

## Answer

Every function gets two own properties at creation, through `SetFunctionName` and `SetFunctionLength`. Both are `{ writable: false, enumerable: false, configurable: true }`, so assignment fails (a TypeError in strict code) but `Object.defineProperty` can replace them.

**`name`.** A declaration or named expression uses its own identifier. An anonymous function or class gets a name only when the spec runs **NamedEvaluation** on it, which happens when `IsAnonymousFunctionDefinition` is true (a function or class with no own name, parentheses allowed) in these positions:

- an initializer of a plain identifier: `const f = () => {}`, `let g = function () {}`, a parameter or destructuring default;
- assignment to a plain identifier, including `||=`, `&&=`, `??=`;
- an object-literal property or class field: the property key, so `{ run: () => {} }` gives `'run'`;
- `export default function () {}`, which gives `'default'`.

Assigning to a member — `obj.run = function () {}` — is **not** one of them, so `name` is `''`. Other forms add a prefix or wrapper: getters and setters get `'get x'`/`'set x'`, Symbol keys become `'[description]'`, private methods `'#x'`, bound functions `'bound f'`, and `new Function` gives `'anonymous'`.

**`length`.** For ordinary functions it's `ExpectedArgumentCount`: the number of formal parameters to the left of the first one with a default or the rest parameter. A destructuring pattern counts as one parameter. Built-ins have a `length` fixed by their spec entry: `Math.max.length` is `2`, `Array.prototype.push.length` is `1`.

Neither property changes behaviour — you can call any function with any number of arguments. Code reads them for debugging and stack traces (`name`) and for arity-based helpers like auto-currying (`length`). Both are fragile there: minifiers may rename functions, and adding a default parameter silently lowers `length`.

## Example

```js
const arrow = () => {};
const wrapped = (() => {});    // parentheses still count as anonymous
const lost = (0, () => {});    // a comma expression isn't a function definition
const obj = { run() {}, get size() { return 1; }, [Symbol('tag')]() {} };
obj.later = function () {};    // member assignment: no NamedEvaluation

console.log(arrow.name, wrapped.name, JSON.stringify(lost.name)); // → arrow wrapped ""
console.log(obj.run.name, Object.getOwnPropertyDescriptor(obj, 'size').get.name); // → run get size
console.log(obj[Object.getOwnPropertySymbols(obj)[0]].name); // → [tag]
console.log(JSON.stringify(obj.later.name), arrow.bind(null).name); // → "" bound arrow

const lengths = [
  function (a, b, c) {},
  function (a, b = 1, c) {},   // stops at the first default
  (a, ...rest) => {},          // rest never counts
  ({ x, y }, [z]) => {},       // each pattern is one parameter
];
console.log(lengths.map((f) => f.length)); // → [ 3, 1, 1, 2 ]
console.log(Math.max.length, parseInt.length); // → 2 2

const f = function () {};
try { f.name = 'renamed'; } catch (e) { console.log(e.name); } // → TypeError
Object.defineProperty(f, 'name', { value: 'renamed' });
console.log(f.name); // → renamed
```

## Pitfalls

- Expecting `obj.method = function () {}` to be named `'method'`. Only identifier targets, initializers and literal keys trigger name inference.
- Using `fn.length` to decide how many arguments to pass. Defaults, rest parameters and `arguments`-based functions all report fewer than they accept.
- Branching on `fn.name` or `constructor.name` in production code. Minified builds may rename it, and a class can override it with a `static name` member.
- Trying to set `name` with assignment. It's non-writable; use `Object.defineProperty`.

## Follow-ups

**Q:** Why does the stack trace show `api.load` when `api.load.name` is `''`?
**A:** Stack traces are a host and engine feature, not `name`. V8's parser runs its own name inference over assignments, declarations and object literals for anonymous functions, and uses that inferred name in traces. The spec-visible `name` stays `''`.

**Q:** What do bound functions report?
**A:** `'bound '` plus the target's name, and the target's `length` minus the bound arguments, never below zero. The details, including non-String names, are in the `bind` question.

**Q:** Can a class's `name` differ from its binding?
**A:** Yes. `class A { static name = 'X' }` defines a static field after `SetFunctionName` has run, so `A.name` is `'X'`. A named class expression also keeps its own name: `const B = class Inner {}` gives `B.name === 'Inner'`.

## Exercises

### Predict the output

```js
let handler;
handler ??= () => {};
const { onError = function () {} } = {};
const api = {};
api.onLoad = () => {};
console.log(handler.name, onError.name, JSON.stringify(api.onLoad.name));
```

**Answer:** `handler onError ""`. `??=` with an identifier target and a destructuring default with an identifier binding both run NamedEvaluation. The member assignment `api.onLoad = …` doesn't, so that arrow's `name` stays the empty string.

### Predict the output

```js
const fns = [(a, b) => {}, (a = 0, b) => {}, (...args) => {}, function (a, [b, c], d = 1) {}];
console.log(fns.map((f) => f.length));
```

**Answer:** `[ 2, 0, 0, 2 ]`. Counting stops at the first parameter with a default or at the rest parameter, and the array pattern `[b, c]` is one parameter.
