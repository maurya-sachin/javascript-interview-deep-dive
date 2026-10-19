---
title: "`??` vs `||`, and how do optional chaining and logical assignment short-circuit?"
status: draft
difficulty: easy
frequency: 4
core: false
tags: [nullish-coalescing, optional-chaining, logical-assignment, short-circuit]
related:
  - javascript/coercion-and-equality/truthy-falsy
  - javascript/values-and-types/null-vs-undefined
  - javascript/operators-and-syntax/destructuring
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-optional-chains
  - https://tc39.es/ecma262/#sec-optional-chaining-evaluation
  - https://tc39.es/ecma262/#sec-assignment-operators-runtime-semantics-evaluation
  - https://tc39.es/ecma262/#prod-CoalesceExpression
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_OR_assignment
tldr: >
  `a || b` falls back on any falsy `a` (`0`, `''`, `false`); `a ?? b` falls back only on `null` or
  `undefined`. `?.` stops the rest of the chain and yields `undefined` when its left side is
  nullish. `||=`, `&&=`, `??=` assign only when the condition says so, skipping both the
  right-hand side and the assignment otherwise.
---

## Answer

**`??` vs `||`.** `||` returns the left operand if it is truthy, otherwise the right. `??` returns the left operand unless it is `null` or `undefined`. So `0`, `''`, `false`, and `NaN` survive `??` but not `||`. Use `??` for "was a value provided?" defaults, and `||` only when every falsy value should be replaced. Both short-circuit: the right side isn't evaluated if the left decides the result. Mixing `??` with `||` or `&&` without parentheses is a `SyntaxError`, because the grammar refuses to guess the precedence.

**Optional chaining `?.`.** In `a?.b`, `a?.[k]`, and `a?.()`, if the base is `null` or `undefined` the whole *chain* evaluates to `undefined`. Key points:

- It short-circuits everything to its right in the same chain: `a?.b.c.d()` never touches `.c` or `.d` when `a` is nullish — but `(a?.b).c` does, because the parentheses end the chain.
- It only guards the exact spot where it's written. `a?.b.c` still throws if `a` exists and `a.b` is `undefined`.
- It checks nullishness, not existence or type: `a.fn?.()` throws `TypeError` if `fn` is a non-function like `5`.
- The key expression of `?.[expr]` isn't evaluated when short-circuited, and `a.m?.()` keeps `this` as `a`.
- It can't be an assignment target (`a?.b = 1` is a `SyntaxError`), but `delete a?.b` is allowed.

**Logical assignment.** `a ||= b`, `a &&= b`, `a ??= b` mean "evaluate `a`; if the condition holds, assign". They aren't `a = a || b`: when the condition fails, **no assignment happens at all** (no setter call, no write to a frozen property), and `b` isn't evaluated. `||=` assigns if `a` is falsy, `&&=` if truthy, `??=` if nullish.

## Example

```js
const opts = { retries: 0, label: '', timeout: null };
console.log(opts.retries || 3, opts.retries ?? 3); // → 3 0
console.log(opts.timeout ?? 1000, opts.missing ?? 'x'); // → 1000 x

const user = { profile: null, greet() { return 'hi'; }, list: [1] };
console.log(user.profile?.name.first.deep); // → undefined (stops at ?.)
console.log(user.greet?.(), user.missing?.(), user.list?.[0]); // → hi undefined 1
// (user.profile?.name).first → TypeError: parentheses end the chain

let calls = 0;
const expensive = () => { calls++; return 'computed'; };
const cache = { a: 0, b: null, c: 'set', d: 1 };
cache.a ||= expensive(); // 0 is falsy → assigned
cache.b ??= expensive(); // null → assigned
cache.c &&= expensive(); // truthy → assigned
cache.d ||= expensive(); // truthy → skipped, no call
console.log(cache, calls); // → { a: 'computed', b: 'computed', c: 'computed', d: 1 } 3
```

## Pitfalls

- Using `||` for defaults when `0`, `''`, or `false` is a valid value: `const port = config.port || 3000` ignores a deliberate `0`.
- Chaining `?.` on every step "to be safe". It hides real bugs (a misspelled property returns `undefined` silently) and `a?.b?.c` is only needed where a value can truly be nullish.
- Expecting `?.` to guard a missing variable: `undeclared?.x` still throws `ReferenceError`, since the name is resolved before the check.
- Reading `x ??= y` as always assigning. It writes only when `x` is `null` or `undefined`, which matters with setters and frozen objects. The read of `x` always happens, so a getter still runs.

## Follow-ups

**Q:** Why is `a ?? b || c` a `SyntaxError`?
**A:** The spec's `CoalesceExpression` accepts only bitwise-OR-level operands; `||` and `&&` expressions aren't allowed on either side. Parenthesise: `(a ?? b) || c`.

**Q:** Does `a?.b` return `null` when `a` is `null`?
**A:** No, always `undefined`. A `null` result only comes from `a.b` actually being `null` when `a` exists.

**Q:** Why doesn't `frozen.a ||= 2` throw on a frozen object when `a` is truthy?
**A:** Because nothing is assigned. Only when the condition triggers does it perform the write, which then throws `TypeError` in strict code.

## Exercises

### Predict the output

```js
const settings = { volume: 0, theme: '', onChange: null };
settings.volume ||= 50;
settings.theme ??= 'dark';
settings.onChange?.(settings);
console.log(settings.volume, JSON.stringify(settings.theme));
```

**Answer:** `50 ""`. `0` is falsy, so `||=` replaces it. `''` is not nullish, so `??=` leaves it. `onChange` is `null`, so `?.()` skips the call and returns `undefined` without error.

### Fix the default

```js
function connect({ port, host }) {
  return `${host || 'localhost'}:${port || 3000}`;
}
console.log(connect({ port: 0, host: '' }));
```

**Answer:** It prints `localhost:3000`, discarding the `0` and `''` the caller passed. If those are meaningful, use `??`: `` `${host ?? 'localhost'}:${port ?? 3000}` `` prints `:0`. Better still, default in the pattern — `{ port = 3000, host = 'localhost' }` — which also treats only `undefined` as "not provided".
