---
title: "Why is `eval` dangerous, and what's the difference between direct and indirect eval?"
status: draft
difficulty: medium
frequency: 2
core: false
tags: [eval, new-function, direct-eval, indirect-eval, csp, unsafe-eval, security, scope]
related:
  - javascript/scope-and-execution-contexts/lexical-scope-chain
  - javascript/scope-and-execution-contexts/environment-records
  - javascript/scope-and-execution-contexts/global-object-globalthis
  - javascript/scope-and-execution-contexts/realms
verified: 2026-10
perishable:
  - ShadowRealm at Stage 2.7, flag-only in Node.js 24
sources:
  - https://tc39.es/ecma262/#sec-eval-x
  - https://tc39.es/ecma262/#sec-performeval
  - https://tc39.es/ecma262/#sec-function-calls-runtime-semantics-evaluation
  - https://tc39.es/ecma262/#sec-createdynamicfunction
  - https://tc39.es/ecma262/#sec-hostensurecancompilestrings
  - https://w3c.github.io/webappsec-csp/#can-compile-strings
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src
tldr: >
  A call is a direct eval only when it is literally `eval(...)` and the callee is the real `%eval%`. It runs in the
  caller's scope and inherits strictness. Any other call (`(0, eval)(…)`, `eval?.(…)`, an alias) is indirect and runs
  globally, as does `new Function`. All turn strings into code: an injection risk that CSP blocks without `'unsafe-eval'`.
---

## Answer

`eval(source)` parses a string as a script and runs it (a non-string argument is returned as is).

**Direct vs indirect** is decided by call syntax. A call is a **direct eval** if the callee is the plain identifier `eval` and its value is the real `%eval%`. Everything else is indirect.

| | Direct `eval(code)` | Indirect `(0, eval)(code)`, `eval?.(code)`, `const e = eval; e(code)` |
|---|---|---|
| Scope | The caller's lexical and variable environments, so it sees local variables | The global environment |
| `this` | The caller's `this` | Global `this` |
| Strictness | Inherits the caller's strict mode | Strict only if the code says `"use strict"` |
| Sloppy `var` / function declarations | Added to the caller's variable environment | Become global variables |

`let`, `const` and `class` inside eval code are always local to that eval. Strict eval code also gets its own variable environment.

`new Function(args, body)` compiles in the **global** scope, like an indirect eval. It can't see locals, and its body is sloppy unless it starts with `"use strict"`, even when the caller is a module.

**Why it is dangerous:**

- **Injection.** The string runs with the page's or process's full privileges. Any user-controlled part is arbitrary code execution (XSS in a browser).
- **Optimisation.** A direct eval can read and create any local, so scopes around it can't be treated as fixed; MDN notes minifiers give up on them.
- **Policy.** A CSP with `script-src` blocks `eval`, `new Function` and string timers unless `'unsafe-eval'` is set.

Prefer `JSON.parse` for data, bracket access for dynamic keys, and callbacks or `Function` with explicit allow-listed inputs for dynamic behaviour. If you must, prefer an indirect eval of `"use strict"` code: it can't read or create your locals.

## Example

CommonJS, sloppy mode (a module is always strict, so `eval('var …')` would stay local):

```js
globalThis.x = 'global';
function demo() {
  const x = 'local';
  console.log(eval('x'));
  console.log((0, eval)('x'));
  console.log(eval?.('x'));
  console.log(new Function('return x')());
  eval('var leaked = 1');
  console.log(typeof leaked);
  (0, eval)('var viaIndirect = 2');
  console.log(typeof viaIndirect, globalThis.viaIndirect);
}
demo();
// → local
// → global
// → global
// → global
// → number
// → number 2
```

Only the first call sees `x = 'local'`. The `var` from the direct eval became a local of `demo`; the one from the indirect eval became a property of `globalThis`.

## Pitfalls

- Thinking `eval?.()` or `(0, eval)()` is "the same, just written differently". The syntax decides: a property reference, a comma expression, a variable alias, or optional call all make it indirect and change the scope.
- Using `eval` to parse JSON or an object literal. `eval('{a:1}')` returns `1` (a block with a label), so people add parentheses, and the result then accepts any expression. Use `JSON.parse`.
- Assuming `new Function` is safe because it can't see locals. It still runs arbitrary code with global access, and a strict CSP blocks it as well.
- Relying on direct eval inside strict code to create variables. They don't leak out, so `eval('var a = 1'); a` throws `ReferenceError`.

## Follow-ups

**Q:** What does `eval` return?
**A:** The completion value of the last statement that produced a value, or `undefined`. For example `eval('1; 2; if (true) { 3 }')` is `3`.

**Q:** Is `new Function` the same as indirect eval?
**A:** Close. Both compile in the global scope. `new Function` builds a function from parameter and body strings and doesn't run anything until called, and it always creates a sloppy function unless the body opts in to strict mode.

**Q:** Which CSP directive controls it?
**A:** `script-src` (or `default-src`) without `'unsafe-eval'`. The host then throws `EvalError` for `eval` and `Function`, silently skips string timers, and reports a violation either way. `'wasm-unsafe-eval'` permits only WebAssembly.

## Deep dive

### How it works

When a `CallExpression` is evaluated and the callee is an identifier reference named `eval` (not a property reference), the engine checks `SameValue(func, %eval%)`. If it matches, the call is direct, and the spec calls `PerformEval(arg, strictCaller, true)`. Otherwise it is an ordinary call: the `eval` function itself calls `PerformEval(x, false, false)`. That is why `o.eval(x)`, `(0, eval)(x)` and `eval?.(x)` are indirect: none is a plain identifier call. Shadowing is also covered: if `eval` is a local variable that isn't `%eval%`, the call is a normal call to that function.

`PerformEval` then:

1. Returns the argument if it isn't a string.
2. Calls the host hook `HostEnsureCanCompileStrings`. Browsers use it to apply CSP and Trusted Types; by default it does nothing.
3. For direct eval, checks context: `new.target`, `super.x` and `super()` are a `SyntaxError` unless the caller is in a function, a method or a derived constructor.
4. Parses the text as a *Script*. Parse errors throw `SyntaxError`.
5. Chooses environments. Direct: a new declarative environment inside the caller's lexical environment, with the caller's variable environment. Indirect: a new declarative environment inside the realm's global environment, with the global one as variable environment. If the eval code is strict (strict caller or its own directive), the variable environment is the new one, so `var` stays inside.
6. Runs `EvalDeclarationInstantiation`, then evaluates the body.

`CreateDynamicFunction` (behind `Function`) builds source text from the parameter and body strings, parses it, and creates the function in the realm's global environment. It calls the same host hook, with `direct` set to `false`.

### Edge cases

Strictness comes from different places in each form:

```js
function strictDemo() {
  'use strict';
  eval('var inner = 1');
  console.log(typeof inner);
  (0, eval)('var fromIndirect = 1');
  console.log(typeof fromIndirect);
}
strictDemo();
// → undefined
// → number
```

The direct eval inherits strict mode, so `inner` stays inside. The indirect eval ignores the caller's strictness and creates a global variable. In Node.js 24, a bare `eval('var v = 1')` in an ES module also leaves `v` undeclared outside, since module code is strict.

Other results, run in Node.js 24 as CommonJS: `eval('({a:1})')` is `{ a: 1 }`, `eval('{a:1}')` is `1`, `eval(42)` is `42`, `eval('let q = 1')` declares nothing outside, `(0, eval)('typeof module')` is `'undefined'` because CommonJS wrapper variables aren't global, and `new Function('return this')() === globalThis` is `true` even when called from a module.

CSP: with `script-src` and no `'unsafe-eval'`, direct eval, indirect eval and `Function()` throw `EvalError` and report a violation. String arguments to `setTimeout`/`setInterval` are blocked too, but quietly: the call returns `0`, the code never runs, and only the violation report shows it. I checked all four in Chrome 155 under `script-src 'self'`. MDN also describes a way to allow string compilation under Trusted Types: pass `TrustedScript` values created by a policy and add `'trusted-types-eval'` (not tested).

### Real-world scenario

A calculator that evaluates a user-typed formula should parse it with a small expression parser, not `eval`: `eval('1; fetch("/steal")')` is also a valid formula. The same goes for any config, template or plugin string that crosses a trust boundary. If the code is yours and static, a normal function or `import()` does the job without a string.

### Trade-offs

Direct eval is the only way to run a string in your own scope, and almost nothing needs that. `new Function` or indirect eval give a smaller, predictable scope, but still need trusted input and a CSP that allows them. A parser or a lookup table beats any of them for untrusted input. For isolation from your own globals, a separate realm is a different tool: `node:vm` contexts and iframes exist today (see the realms question), while ShadowRealm is a TC39 proposal at Stage 2.7 and is not exposed by default in Node.js 24 (`typeof ShadowRealm` is `'undefined'` unless you pass V8's experimental `--harmony-shadow-realm` flag).

## Exercises

### Which `x`?

```js
globalThis.x = 'global';
function f() {
  const x = 'local';
  const run = eval;
  return [eval('x'), run('x'), eval?.('x')];
}
console.log(f());
```

**Answer:** `[ 'local', 'global', 'global' ]`. Only the plain `eval(...)` call is direct; the alias and the optional call are indirect.

### Does it leak?

```js
function g() {
  'use strict';
  eval('var a = 1');
  return typeof a;
}
console.log(g());
```

**Answer:** `'undefined'`. The direct eval inherits strict mode, so its `var` lives in the eval's own environment.
