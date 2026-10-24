---
title: "What is an execution context, and what does the call stack hold?"
status: draft
difficulty: medium
frequency: 4
core: true
tags: [execution-context, call-stack, environment-records, realm, generators]
related:
  - javascript/scope-and-execution-contexts/lexical-scope-chain
  - javascript/scope-and-execution-contexts/environment-records
  - javascript/scope-and-execution-contexts/stack-overflow-tail-calls
  - javascript/async-and-the-event-loop/event-loop
verified: 2026-10
perishable:
  - Error Stack Accessor proposal at Stage 3, not yet in ECMA-262
sources:
  - https://tc39.es/ecma262/#sec-execution-contexts
  - https://tc39.es/ecma262/#sec-prepareforordinarycall
  - https://tc39.es/ecma262/#sec-globaldeclarationinstantiation
  - https://tc39.es/ecma262/#sec-generatorresume
  - https://tc39.es/ecma262/#sec-initializehostdefinedrealm
  - https://tc39.es/ecma262/#sec-jobs
  - https://github.com/tc39/proposal-error-stack-accessor
  - https://v8.dev/docs/stack-trace-api
  - https://developer.mozilla.org/en-US/docs/Glossary/Call_stack
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Too_much_recursion
tldr: >
  An execution context is the spec's record of one piece of running code: which function, which
  realm, which script or module, and two Environment Records (LexicalEnvironment and
  VariableEnvironment) used to resolve names. Calls push a context and returns pop it; the
  running context is always on top. Generators and async functions suspend theirs.
---

## Answer

An **execution context** is a specification device that tracks the evaluation of one chunk of code: a script, a module, `eval` code, or a function call. At any moment an agent has at most one **running execution context**, the top of the **execution context stack** (what developers call the *call stack*).

Every context carries:

- **Function**: the function object being run (`null` for a script or module).
- **Realm**: the realm whose intrinsics (`Array`, `Object`, …) and global the code uses.
- **ScriptOrModule**: where the code came from.
- **LexicalEnvironment**: the Environment Record used to resolve identifiers. It changes as the code enters and leaves blocks.
- **VariableEnvironment**: the record that holds `var` declarations; blocks never swap it.
- Plus *code evaluation state*, enough to suspend and resume the code.

**Lifecycle.** A function call creates a context (`PrepareForOrdinaryCall`): a new Function Environment Record whose outer link is the function's `[[Environment]]`, then the context is pushed and becomes the running one. Declarations are instantiated, the body runs, and on return the context is popped, making the caller's context current again. A script or module gets its context first, and the stack is empty when the event loop is idle, which is why timer and promise callbacks start on a fresh stack.

**Not LIFO everywhere.** Generator and async function contexts are suspended and resumed later, so the spec says transitions are "usually" last-in-first-out.

Two caveats worth saying aloud. Contexts are purely a specification mechanism: engines use real stack frames, registers, and heap-allocated environments however they like. And the call stack (who called whom) is different from the scope chain (where code was written).

## Example

```js
// `stack` is non-standard; this parses V8's format (Node.js 24)
const frames = () =>
  new Error().stack
    .split('\n')
    .slice(2) // drop the "Error" line and this helper's own frame
    .map((line) => line.trim().split(' ')[1])
    .slice(0, 3);

function a() { return b(); }
function b() { return c(); }
function c() { return frames(); }

console.log(a().join(' <- ')); // → c <- b <- a
```

## Pitfalls

- Saying each function "has" one context. Each *call* creates a new one, so recursion creates many.
- Mixing up the stack and the heap. Contexts are popped on return, but the Environment Records they referenced survive if a closure captured them.
- Describing the stack as engine-visible truth. Stack traces are a host feature (ECMA-262 has never defined `stack`; the Error Stack Accessor proposal is at Stage 3), and engines cap them: V8 keeps 10 frames by default.
- Thinking `await` blocks the stack. The function's context is suspended and removed; other code runs; the continuation resumes later on an almost empty stack.

## Follow-ups

**Q:** What is the "global execution context"?
**A:** The context created to evaluate a script, whose environments are the realm's Global Environment Record. A module gets its own context with a Module Environment Record. Each script or module evaluation is a separate context, pushed when it starts.

**Q:** What is the difference between LexicalEnvironment and VariableEnvironment?
**A:** `var` bindings go in the VariableEnvironment, which blocks never swap. LexicalEnvironment is what lookups start from, and it is swapped for a new block-level record when execution enters a block.

**Q:** What happens to the stack when an exception is thrown?
**A:** Contexts are popped one by one while the throw completion propagates, until a `try`/`catch` handles it. If none does, the stack unwinds to the host.

## Deep dive

### How it works

At startup the host runs `InitializeHostDefinedRealm`, which creates a realm and an initial context with no function. Each script then runs in a new context whose `LexicalEnvironment` and `VariableEnvironment` are the realm's global environment, after `GlobalDeclarationInstantiation` has created its bindings.

A call to `f()` does roughly this:

1. `PrepareForOrdinaryCall` makes a context for `f`, copying the function's realm and script, and sets both environment fields to a new Function Environment Record.
2. The caller's context is suspended, and the new one is pushed.
3. `FunctionDeclarationInstantiation` binds parameters and hoists declarations.
4. The body is evaluated; a block statement temporarily replaces `LexicalEnvironment` with a new inner record and restores it on exit.
5. On completion, the context is popped and the result goes to the caller.

The example's V8 stack trace mirrors the push order: `c` is the innermost frame shown, and each caller waits below it.

### Edge cases

Generators keep their context alive between calls. `gen.next()` pushes the saved context back and pauses it again at the next `yield`. While it is paused, it is not on the stack, but its locals live on:

```js
function* gen() {
  const reply = yield 1;
  console.log(reply);
}
const it = gen();
it.next(); // runs to the first yield, then the context is suspended
it.next('resumed'); // → resumed
```

Async functions work the same way: `await` suspends the context, and a promise job later resumes it from the job queue. After the first `await`, the original caller is no longer below it. A stack trace taken there shows only the resumed function, plus the `async` frames V8 adds for `await` locations.

Stack depth is limited by the host. Exceeding it throws a `RangeError` in V8 and JavaScriptCore and an `InternalError` in SpiderMonkey. Neither type nor size is defined by the spec; see the stack overflow question.

### Real-world scenario

Reading a stack trace is reading the execution context stack from top (where the error was created) down to the entry point. For production errors in async code this is why traces are often shorter than the logical call chain: the awaiting caller is not on the stack when the continuation runs. Debuggers like Chrome DevTools reconstruct "async stack traces" from promise bookkeeping, not from the real stack.

## Exercises

### Order of events

```js
function inner() {
  console.log('inner');
}
function outer() {
  console.log('outer start');
  inner();
  console.log('outer end');
}
outer();
console.log('after');
```

**Answer:** `outer start`, `inner`, `outer end`, `after`. `outer` is pushed, runs until it calls `inner`, which is pushed on top and popped before `outer` resumes. Then `outer` pops and the top-level code continues.

### Two calls, one function

```js
function counter() {
  let count = 0;
  return () => ++count;
}
const a = counter();
const b = counter();
a();
console.log(a(), b());
```

**Answer:** `2 1`. Each call to `counter` creates its own execution context and its own Function Environment Record. The contexts are popped when `counter` returns, but each returned arrow keeps its record alive, so `a` and `b` have separate `count` bindings.
