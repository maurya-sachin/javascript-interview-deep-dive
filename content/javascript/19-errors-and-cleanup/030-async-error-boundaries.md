---
title: "Why doesn't `try`/`catch` catch errors in a callback?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [try-catch, callbacks, error-first, promises, async-await, uncaught-exception, event-emitter]
related:
  - javascript/promises/promise-error-handling
  - javascript/async-and-the-event-loop/sequential-vs-parallel-await
  - javascript/async-and-the-event-loop/event-loop
  - javascript/async-and-the-event-loop/async-await-mechanics
  - javascript/errors-and-cleanup/try-catch-finally
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-try-statement
  - https://tc39.es/ecma262/#sec-promise-executor
  - https://tc39.es/ecma262/#sec-newpromisereactionjob
  - https://tc39.es/ecma262/#sec-asyncblockstart
  - https://nodejs.org/docs/latest-v24.x/api/errors.html#error-propagation-and-interception
  - https://nodejs.org/docs/latest-v24.x/api/events.html#error-events
  - https://nodejs.org/docs/latest-v24.x/api/util.html#utilpromisifyoriginal
tldr: >
  `try`/`catch` only handles throws while its block is still running. A callback runs later from the event
  loop, after the `try` has exited, so nothing catches its throw. Report errors through the API instead: an
  error-first callback argument, a rejected promise, or an `'error'` event. `await` turns a rejection back
  into a throw inside the `try`.
---

## Answer

A `try` statement evaluates its block and handles a throw from that evaluation. Code in a callback does not run during that evaluation. `setTimeout(fn)`, an event listener, or an I/O callback only *registers* `fn`. The `try` block finishes normally, and later the event loop calls `fn` on an empty call stack with no `try` around it.

So a throw inside `fn` is an uncaught exception: the browser reports it to the global `error` event (not run here), and Node.js prints it and exits with code 1.

The error has to travel through a channel that outlives the call:

- **Error-first callbacks** (Node.js style): call `callback(error)` or `callback(null, value)`. The caller checks the first argument. Never throw out of an asynchronous callback API.
- **Promises:** a throw in the `new Promise` executor, in a `.then` handler, or in an `async` function body turns into a **rejection** of the returned promise. Handle it with `.catch` or with `await` inside `try`.
- **Events:** Node.js `EventEmitter` emits `'error'`. If there is no `'error'` listener, `emit` throws the error.

`await` is what brings the error back to `try`/`catch`: awaiting a rejected promise throws the reason at the `await`, inside the surrounding `try`. Without `await`, the promise is just a value and the `try` is already finished. `return promise` in an `async` function is the same trap, so use `return await promise` inside `try` when `catch` or `finally` must see the result.

## Example

```js
function parseAsync(text, callback) {
  setTimeout(() => {
    let value;
    try {
      value = JSON.parse(text);
    } catch (error) {
      callback(error);
      return;
    }
    callback(null, value);
  }, 0);
}

const parse = (text) =>
  new Promise((resolve, reject) => {
    parseAsync(text, (error, value) => (error ? reject(error) : resolve(value)));
  });

try {
  await parse('{');
} catch (error) {
  console.log('caught', error.name);
}
// → caught SyntaxError
```

## Pitfalls

- Wrapping `setTimeout`, `addEventListener`, or `fetch(...).then(...)` in `try`. The block ends before the callback runs.
- Writing `try { callback(null, JSON.parse(text)); } catch (e) { callback(e); }`. If the consumer's `callback` throws, the `catch` calls it a second time. Only guard the code that can fail, and call `callback` outside the `try`.
- Calling an `async` function without `await` or `.catch` inside `try`. The function's rejection is not an exception in your call stack, and it ends up as an unhandled rejection.
- `array.forEach(async (x) => ...)` inside `try`. `forEach` ignores the returned promises, so rejections escape (see the sequential vs parallel `await` question). An `EventEmitter` that emits `'error'` with no listener throws the same way.

## Follow-ups

**Q:** Why does `new Promise(() => { throw ... })` not crash, when `setTimeout(() => { throw ... })` does?
**A:** The `Promise` constructor calls the executor inside a spec-level `try` and, on a throw, calls `reject` with it. A timer callback has no such wrapper. A throw after `resolve` was already called is ignored.

**Q:** What is the difference between `return promise` and `return await promise` in `try`?
**A:** `return promise` leaves the `try` immediately, so `catch` and `finally`-time logic do not see a later rejection. `return await promise` waits inside the `try`, so `catch` runs.

**Q:** How do you use a callback API with `await`?
**A:** Wrap it in `new Promise` as in the example, or use `util.promisify` for error-first callback functions in Node.js. Both reject with the error from the first callback argument.

## Deep dive

### How it works

The spec's try-statement rules evaluate the block, look at the resulting completion, and run `catch` if it is a throw. Evaluation of the block ends when the block's statements are done, so the `catch` clause has a fixed lifetime: the synchronous run of the block.

A callback is stored by the host (a timer, a socket, an event target). When the host fires it, the engine pushes a new execution context onto an empty stack. When that function throws, no enclosing `try` exists, so the throw completion reaches the host. The host reports it (browser: the `error` event on the global object, covered in the uncaught errors question; Node.js: the `'uncaughtException'` handling).

Promises make failure a value instead of control flow. The spec does this in three places: the `Promise` constructor catches a throw from the executor and calls `reject`. A reaction job runs a `.then` handler and, if it throws, rejects the derived promise. `AsyncBlockStart` runs an `async` function body, and a throw completion rejects the function's promise. All three convert a throw to a rejection, so errors keep flowing down the chain until a handler takes them.

```js
new Promise(() => { throw new Error('executor'); })
  .catch((error) => console.log('executor ->', error.message));
Promise.resolve()
  .then(() => { throw new Error('then'); })
  .catch((error) => console.log('then ->', error.message));
// → executor -> executor
// → then -> then
```

### Edge cases

Without `await`, the error escapes the `try` even inside an `async` function:

```js
process.on('uncaughtException', (error, origin) => console.log(error.message, origin));
try {
  setTimeout(() => {
    throw new Error('thrown in a timer');
  }, 0);
} catch {
  console.log('never runs');
}
const failLater = async () => {
  await new Promise((resolve) => setTimeout(resolve, 5));
  throw new Error('rejected later');
};
async function withoutAwait() {
  try {
    return failLater(); // returned, not awaited
  } catch {
    console.log('never runs');
  }
}
async function withAwait() {
  try {
    return await failLater();
  } catch (error) {
    console.log('caught', error.message);
  }
}
await withoutAwait().catch((error) => console.log('escaped try:', error.message));
await withAwait();
// → thrown in a timer uncaughtException
// → escaped try: rejected later
// → caught rejected later
```

Node.js documents this split: synchronous APIs throw, promise APIs reject, callback APIs pass an error as the first argument, and `EventEmitter` uses `'error'` events. Which one applies depends on the API, so read its documentation.

### Trade-offs

Callbacks need manual error plumbing at every level and are easy to call twice or never. Promises and `await` give one error path and normal `try`/`catch`, at the cost of remembering that every promise needs an owner that handles its rejection. Use `await` in application code, and keep callback-to-promise adapters at the boundary where a callback API enters your code.

## Exercises

### Does the `catch` run

```js
try {
  Promise.reject(new Error('lost'));
} catch {
  console.log('caught');
}
console.log('done');
```

**Answer:** Prints `done`, never `caught`. In Node 24 the process then exits with an unhandled rejection error for `lost`. `Promise.reject` does not throw; it returns a rejected promise that nothing handles. `await Promise.reject(...)` would throw into the `try`.

### Which one is caught

```js
const fail = async () => { throw new Error('boom'); };
async function a() { try { return fail(); } catch { return 'caught a'; } }
async function b() { try { return await fail(); } catch { return 'caught b'; } }
console.log(await a().catch(() => 'a escaped'), await b());
```

**Answer:** `a escaped caught b` (run in Node 24). `a` returns the promise without waiting, so `fail()`'s rejection settles after the `try` has exited. `b` awaits inside the `try`.

### The double callback

```js
function read(callback) {
  try {
    callback(null, 'data');
  } catch (error) {
    callback(error);
  }
}
let calls = 0;
read((error) => {
  calls++;
  if (!error) throw new Error('consumer bug');
});
console.log(calls);
```

**Answer:** `2` (run in Node 24). The consumer throws on the first call, `read` catches it and calls the callback again with that error. Keep the `try` around only the work that can fail, and call `callback` outside it.
