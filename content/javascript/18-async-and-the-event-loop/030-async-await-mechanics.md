---
title: "How does `async`/`await` work under the hood?"
status: draft
difficulty: hard
frequency: 4
core: true
tags: [async-function, await, promise-job, microtask, asyncfunctionstart, return-await, thenable]
related:
  - javascript/promises/what-is-a-promise
  - javascript/promises/promise-chaining
  - javascript/async-and-the-event-loop/task-microtask-ordering
  - javascript/async-and-the-event-loop/sequential-vs-parallel-await
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-async-function-definitions
  - https://tc39.es/ecma262/#sec-runtime-semantics-evaluateasyncfunctionbody
  - https://tc39.es/ecma262/#sec-asyncblockstart
  - https://tc39.es/ecma262/#await
  - https://tc39.es/ecma262/#sec-runsuspendedcontext
  - https://tc39.es/ecma262/#sec-promise-resolve
  - https://tc39.es/ecma262/#sec-performpromisethen
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await
tldr: >
  Calling an `async` function creates a promise, runs the body synchronously up to the first `await`, and
  returns the promise. `await v` converts `v` to a promise, attaches reactions that resume the function, and
  suspends it. Resumption runs as a promise job (a microtask). A `return` resolves the function's promise; a
  `throw` rejects it.
---

## Answer

An `async` function is a function whose body can suspend, with a promise as its result.

**On call**, the engine creates a new promise (via `NewPromiseCapability`), binds the arguments, and runs the body right away, on the caller's stack. The body is synchronous up to the first `await`. The call then returns the promise. Argument errors, such as a throwing default value, reject that promise instead of throwing.

**`await value`** does three things:

1. Converts `value` with `PromiseResolve(%Promise%, value)`. A native promise is used as is; anything else, including a thenable, is wrapped in a new promise.
2. Attaches a fulfilled reaction and a rejected reaction (`PerformPromiseThen`) that resume the function.
3. Suspends the function and returns control to the caller, or to whatever called the job.

When the promise settles, a promise job resumes the function with the value, or throws the reason at the `await` point, so `try`/`catch` works. The job runs as a microtask, so even `await 1` always yields at least one tick.

**On finish**, `return x` calls the promise's `resolve` with `x`, and an uncaught `throw` rejects it. Because `return` goes through `resolve`, returning a promise makes the function's promise adopt it, which costs extra ticks.

You can think of it as a generator driven by promises: `await` is `yield` plus an automatic `next()` when the promise settles. The spec does not define it that way, but it behaves the same.

## Example

```js
async function f() {
  console.log('f start');
  await null;
  console.log('f after await');
  return 'done';
}

console.log('before call');
const result = f();
console.log('after call', result);
result.then((value) => console.log('result', value));
Promise.resolve().then(() => console.log('other 1')).then(() => console.log('other 2'));
// → before call
// → f start
// → after call Promise { <pending> }
// → f after await
// → other 1
// → result done
// → other 2
```

## Pitfalls

- Thinking `async` makes code run on another thread. The body runs on the caller's stack until the first `await`. Only the code after an `await` is deferred, and it runs on the same thread.
- Writing `return promise` inside `try`/`catch` and expecting the `catch` to run. Without `await`, the function returns before the promise settles, so its rejection bypasses your `catch`. Use `return await promise` when the surrounding `try` should handle the error.
- Forgetting that `await` yields even for non-promises. Code after `await 1` never runs in the same tick, so the caller always sees a state from before the rest of the function.

## Follow-ups

**Q:** What does an `async` function return if it returns a non-promise?
**A:** A promise fulfilled with that value. Every call returns a new promise; `async` functions never return a promise they were given, because `return` runs through `resolve` on the function's own promise.

**Q:** What happens when you `await` a rejected promise?
**A:** The function resumes by throwing the rejection reason at the `await` expression. Uncaught, it rejects the function's promise.

**Q:** Is `await` allowed at top level?
**A:** In ES modules, yes. The module body then behaves as an async function that the module loader waits on. In scripts, no.

## Deep dive

### How it works

`EvaluateAsyncFunctionBody` does the following:

1. Create a promise capability with `NewPromiseCapability(%Promise%)`.
2. Run `FunctionDeclarationInstantiation`, which binds parameters and evaluates defaults. If this throws, call the capability's reject function with the error. This is why bad arguments reject instead of throwing.
3. Otherwise call `AsyncFunctionStart`, which runs the body.
4. Return the capability's promise.

`AsyncBlockStart` is what `AsyncFunctionStart` uses. It runs the body in the async function's own execution context, using `RunSuspendedContext`. When the body completes without suspending, the closure calls the capability's `resolve` with the return value (or `undefined`), or `reject` with the thrown value. Then control goes back to the caller context. That means the body, up to its first `await`, ran inside the call, synchronously.

`Await(value)` does the following:

1. Remember the async context.
2. `promise = ? PromiseResolve(%Promise%, value)`. If `value` is already a native promise with the same constructor, this is the same object.
3. Create `onFulfilled` and `onRejected` closures. Each one calls `RunSuspendedContext(asyncContext, completion)` and ignores the result. `onFulfilled` resumes with a normal completion of the value; `onRejected` resumes with a throw completion of the reason.
4. `PerformPromiseThen(promise, onFulfilled, onRejected)`, and then return to the caller context.

`PerformPromiseThen` enqueues a reaction job right away if the promise is already settled. Otherwise the job is enqueued when it settles. In both cases the resumption goes through `HostEnqueuePromiseJob`, which is the microtask queue in browsers and Node.js.

A teaching model: a driver that resumes a generator whenever the yielded promise settles. It reproduces the logic of steps 3 and 4 above, but it is not how engines implement it.

```js
function run(generatorFunction, ...args) {
  return new Promise((resolve, reject) => {
    const generator = generatorFunction(...args);
    function step(method, input) {
      let result;
      try {
        result = generator[method](input);
      } catch (error) {
        reject(error);
        return;
      }
      if (result.done) {
        resolve(result.value);
        return;
      }
      Promise.resolve(result.value).then(
        (value) => step('next', value),
        (reason) => step('throw', reason),
      );
    }
    step('next');
  });
}

run(function* (n) {
  const a = yield Promise.resolve(n);
  try {
    yield Promise.reject(new Error('nope'));
  } catch (error) {
    console.log('caught', error.message);
  }
  return a * 3;
}, 21).then(console.log);
// → caught nope
// → 63
```

### Edge cases

Returning a promise costs extra ticks, because `return` runs the function's `resolve` function, which sees a thenable and schedules `NewPromiseResolveThenableJob`. `return await` does not use that path, but it pays a different cost. Run the following in Node 24:

```js
async function returnsPlain() { return 1; }
async function returnsPromise() { return Promise.resolve(1); }
async function returnsAwaited() { return await Promise.resolve(1); }

returnsPlain().then(() => console.log('plain'));
returnsPromise().then(() => console.log('return promise'));
returnsAwaited().then(() => console.log('return await'));
let chain = Promise.resolve();
for (let i = 1; i <= 4; i++) chain = chain.then(() => console.log('tick', i));
// → plain
// → tick 1
// → return await
// → tick 2
// → return promise
// → tick 3
// → tick 4
```

Do not use these counts to choose between forms. Choose by behaviour. The behavioural difference is error handling:

```js
async function withReturn() {
  try { return Promise.reject(new Error('x')); } catch { return 'caught'; }
}
async function withAwait() {
  try { return await Promise.reject(new Error('x')); } catch { return 'caught'; }
}
console.log(await withReturn().catch((error) => 'not caught: ' + error.message));
console.log(await withAwait());
// → not caught: x
// → caught
```

Awaiting a thenable is slower than awaiting a native promise. `PromiseResolve` wraps the thenable in a new promise, which calls `thenable.then` from a job. The `then` method is not called synchronously:

```js
const thenable = { then(resolve) { console.log('then called'); resolve('v'); } };
async function g() { console.log('awaiting'); const v = await thenable; console.log('got', v); }
g();
Promise.resolve().then(() => console.log('tick 1')).then(() => console.log('tick 2'));
// → awaiting
// → then called
// → tick 1
// → got v
// → tick 2
```

### Trade-offs

`async`/`await` gives straight-line code, `try`/`catch`/`finally`, and loops over asynchronous steps, at the cost of one promise per call and at least one microtask hop per `await`. For hot paths that run millions of times, a function that might finish synchronously should not be `async`. Each `await` is also a point where other code can run, so state read before an `await` may be stale after it. Do not assume atomicity across an `await`.

## Exercises

### Order of logs

```js
async function a() { console.log('a1'); await b(); console.log('a2'); }
async function b() { console.log('b'); }
a();
Promise.resolve().then(() => console.log('p'));
console.log('sync');
```

**Answer:** `a1`, `b`, `sync`, `a2`, `p`. `a()` and `b()` run synchronously until `await`. `b()` returns an already-fulfilled promise, so the continuation of `a` is queued before the `then` callback `p`. Run in Node 24.

### Does the catch run

```js
async function load() {
  try {
    return fetchData();
  } catch {
    return 'fallback';
  }
}
const fetchData = async () => { throw new Error('network'); };
console.log(await load().catch((error) => error.message));
```

**Answer:** `network`. `return fetchData()` returns the rejected promise without awaiting it, so the `try` block has already exited. Change it to `return await fetchData()` and the result is `fallback`.
