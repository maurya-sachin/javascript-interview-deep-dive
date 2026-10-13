---
title: 'What causes "Maximum call stack size exceeded", and do tail calls help?'
status: draft
difficulty: medium
frequency: 2
core: false
tags: [call-stack, recursion, stack-overflow, tail-calls, ptc, trampoline]
related:
  - javascript/scope-and-execution-contexts/execution-context-call-stack
  - javascript/scope-and-execution-contexts/lexical-scope-chain
  - javascript/functions/higher-order-functions
  - javascript/async-and-the-event-loop/event-loop
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-tail-position-calls
  - https://tc39.es/ecma262/#sec-preparefortailcall
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Too_much_recursion
  - https://webkit.org/blog/6240/ecmascript-6-proper-tail-calls-in-webkit/
  - https://github.com/tc39/proposal-ptc-syntax
  - https://github.com/v8/v8/blob/main/src/flags/flag-definitions.h
tldr: >
  Each call pushes an execution context, and the host gives the stack a fixed size. Recursion with
  no base case, or too deep for that limit, throws a RangeError. The spec requires proper tail
  calls in strict code to reuse the frame, but only JavaScriptCore implements them; V8 doesn't, so
  use a loop, an explicit stack, or a trampoline.
---

## Answer

Every function call pushes an execution context onto the call stack, and the stack is a fixed-size region of memory chosen by the host. If calls nest deeper than it allows (endless recursion, or legitimate recursion over a big input), the engine throws: `RangeError: Maximum call stack size exceeded` in V8 and JavaScriptCore, `InternalError: too much recursion` in Firefox. The depth is engine-, platform-, and frame-size-dependent; the spec defines neither the limit nor the error type. A trivial function reaches about ten thousand frames in Node 24, and it can be changed with `--stack-size`, which is a workaround rather than a fix.

**Proper tail calls.** ES2015 specifies that a call in *tail position* (a `return f(x)` whose result is returned as is) in strict code must not grow the stack: `PrepareForTailCall` discards the current execution context before the call. That would make deep tail recursion run in constant stack space.

**But in practice, no.** Only JavaScriptCore (Safari) implements it. V8 doesn't (a tail-recursive loop overflows in Node, and V8's flag list has no tail-call option), and no other major engine ships it either. The TC39 follow-up that would make it an explicit opt-in (`return continue f(x)`, "syntactic tail calls") has been inactive since 2016. So you can't rely on tail-call elimination in portable JavaScript, and code that needs deep recursion should avoid depending on it.

What to do instead:

- **Iterate.** Turn the recursion into a loop.
- **Use an explicit stack** (an array) for trees and graphs.
- **Trampoline:** return a thunk instead of calling, and let a loop run the thunks.
- **Break the stack with the event loop** for long async work, since each task starts on an empty stack.

## Example

```js
const sumTo = (n) => (n === 0 ? 0 : n + sumTo(n - 1)); // work after the call: not a tail call

try {
  sumTo(1_000_000);
} catch (error) {
  console.log(error instanceof RangeError); // → true
}

function sumToLoop(n) {
  let total = 0;
  for (let i = 1; i <= n; i++) total += i;
  return total;
}
console.log(sumToLoop(1_000_000)); // → 500000500000
```

## Pitfalls

- Assuming the accumulator version (`sum(n - 1, acc + n)`) is safe. It is in tail position and would be flat on Safari, but it overflows in Node and Chrome.
- Treating the limit as a fixed number. It depends on frame size, engine, and flags, so "about N frames" is never portable.
- Catching the `RangeError` and continuing. State may be half-updated, and handling the error needs stack space the program no longer has.
- Writing the "tail call" wrong. `return 1 + f(n - 1)`, `return await f()`, and a call inside `try` aren't in tail position; the caller still has work to do after the call returns.

## Follow-ups

**Q:** Where exactly is tail position?
**A:** In strict code, the call is the value of a `return`, a concise arrow body, a branch of `?:`, or the right operand of `&&`, `||`, or `??`. It can't be in a `try` block, a generator, or an async function, and nothing may remain to do with the result.

**Q:** Why didn't other engines follow?
**A:** The syntactic-tail-calls proposal records that many implementers were skeptical (debugging, since frames vanish from traces, and performance) and that the feature was standardized in ES2015 without implementer buy-in. Its explicit opt-in redesign has not advanced.

**Q:** Does async recursion overflow the stack?
**A:** Not by depth alone. After each `await` the continuation runs from the job queue on an almost empty stack. Synchronous recursion inside each step still counts.

## Exercises

### Trampoline

Make `sumAcc` safe for `1_000_000` without relying on tail calls.

```js
const trampoline =
  (fn) =>
  (...args) => {
    let result = fn(...args);
    while (typeof result === 'function') result = result();
    return result;
  };

const sumAcc = (n, acc = 0) => (n === 0 ? acc : () => sumAcc(n - 1, acc + n));

console.log(trampoline(sumAcc)(1_000_000));
```

**Answer:** It prints `500000500000`. `sumAcc` returns a thunk instead of calling itself, so each step returns before the next starts, and the `while` loop drives it. The stack never grows. This only works if the real result is not itself a function.

### Which of these is a tail call?

```js
'use strict';
const a = (n) => b(n);
const b = (n) => 1 + c(n);
const c = (n) => (n > 0 ? c(n - 1) : 0);
const d = (n) => {
  try {
    return c(n);
  } catch {
    return -1;
  }
};
console.log(a(3), b(3), c(3), d(3));
```

**Answer:** The calls `b(n)` in `a` and `c(n - 1)` in `c` are in tail position. `c(n)` in `b` is not (the `1 +` is pending), and neither is the one in `d` (it's inside `try`). The output is `1 1 0 0`, and it is the same on every engine; only the stack usage differs.
