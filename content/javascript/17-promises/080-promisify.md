---
title: "How do you convert a callback API to promises?"
status: draft
difficulty: easy
frequency: 3
core: false
tags: [promisify, callbacks, error-first, util-promisify, node, callback-hell, zalgo]
related:
  - javascript/promises/what-is-a-promise
  - javascript/promises/promise-chaining
  - javascript/promises/promise-error-handling
verified: 2026-10
sources:
  - https://nodejs.org/docs/latest-v24.x/api/util.html#utilpromisifyoriginal
  - https://nodejs.org/docs/latest-v24.x/api/util.html#custom-promisified-functions
  - https://nodejs.org/docs/latest-v24.x/api/util.html#utilcallbackifyoriginal
  - https://nodejs.org/docs/latest-v24.x/api/fs.html#promises-api
  - https://nodejs.org/docs/latest-v24.x/api/timers.html#timers-promises-api
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises
tldr: >
  Wrap the call in `new Promise` and pass a callback that rejects on a truthy first `error` argument and
  resolves with the value otherwise. Node's `util.promisify` does this for error-first callbacks, and
  `util.promisify.custom` covers other signatures. It cannot adapt functions that call back more than once.
---

## Answer

Callback APIs hand your function to the library. You depend on it to call you once, asynchronously, with correct arguments, and errors thrown inside your callback cannot reach any outer `try`/`catch`. Several dependent steps nest into a pyramid, with an error check at every level. A promise turns that into a value you hold: it settles once, handlers always run asynchronously, and one `catch` covers the chain.

To convert, wrap the call at the lowest level, once, and use the promise everywhere else:

1. Return `new Promise((resolve, reject) => …)`.
2. Call the original function with your arguments plus a callback.
3. In the callback, `reject(error)` when the first argument is truthy, otherwise `resolve(value)`.

That is exactly the Node convention: an **error-first** callback, `(error, value) => …`. Node ships it as `util.promisify(fn)`. Many Node APIs already have promise versions, so check first: `node:fs/promises`, `node:timers/promises`, `node:dns/promises`.

Details:

- **Other signatures** (success and failure callbacks, `setTimeout(cb, ms)` argument order, `fs.exists(path, cb)`) are not error-first. Wrap them by hand, or define `fn[util.promisify.custom]` so `promisify` returns your promise-based version. Node does this for `setTimeout` and `setImmediate`, so `promisify(setTimeout)(ms, value)` works.
- **Several result values:** a promise carries one value. Resolve with an array or object.
- **`this`:** a detached method loses its receiver. Bind it or use `.call`.
- **Callbacks that fire more than once** (event streams, `setInterval`) cannot be promises, because a promise settles once. Use events, `events.once` or async iterators.
- A synchronous throw inside the original function becomes a rejection, because it happens inside the executor.

The reverse is `util.callbackify`.

## Example

```js
function promisify(fn) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      fn.call(this, ...args, (error, value) => {
        if (error) reject(error);
        else resolve(value);
      });
    });
  };
}

function divide(a, b, callback) {
  setTimeout(() => {
    if (b === 0) callback(new Error('divide by zero'));
    else callback(null, a / b);
  }, 0);
}

const divideAsync = promisify(divide);
console.log(await divideAsync(6, 3)); // → 2
await divideAsync(1, 0).catch((error) => console.log(error.message)); // → divide by zero
```

## Pitfalls

- Promisifying a function that is not error-first. `util.promisify` still passes it an error-first callback, so a success callback called with `'value'` is treated as an error and rejects.
- Promisifying a method without its receiver: `promisify(obj.method)` calls it with `this` as `undefined`. Use `promisify(obj.method.bind(obj))` or `.call(obj)`.
- Expecting more than one result. The wrapper resolves with the first value after `error` and drops the rest, unless Node special-cases the function, as with `dns.lookup`, which resolves with `{ address, family }`.
- Wrapping a function that already returns a promise. Node's docs mark calling `util.promisify` on a function that already returns a promise as deprecated (since v20.8.0). Use the function directly.

## Follow-ups

**Q:** What does `util.promisify.custom` do?
**A:** It is a symbol (`Symbol.for('nodejs.util.promisify.custom')`). If `fn[util.promisify.custom]` is a function, `promisify(fn)` returns it instead of building a wrapper. It is used for non-standard signatures.

**Q:** Why wrap at the lowest level?
**A:** Every caller then gets the promise guarantees. A callback that is mixed in elsewhere keeps the old problems: errors in it are not caught, and the timing of the call is up to the library.

**Q:** Is a callback called synchronously a problem?
**A:** It makes ordering unpredictable (the "Zalgo" problem). Wrapping in a promise fixes it for callers, because `then` handlers always run asynchronously.

## Exercises

### The lost receiver

```js
import { promisify } from 'node:util';

class Counter {
  count = 41;
  next(callback) {
    callback(null, ++this.count);
  }
}
const counter = new Counter();
const nextAsync = promisify(counter.next);

await nextAsync().catch((error) => console.log(error.constructor.name));
console.log(await nextAsync.call(counter));
```

**Answer:** `TypeError`, then `42`. The first call runs `next` with `this` as `undefined`, so `++this.count` throws inside the executor and the promise rejects. `call(counter)` supplies the receiver.

### A success/failure callback API

```js
import { promisify } from 'node:util';

function legacy(onSuccess, onFailure) {
  setTimeout(onSuccess, 0, 'done');
}
console.log(await promisify(legacy)().catch((value) => `rejected with ${value}`));

legacy[promisify.custom] = () => new Promise((resolve, reject) => legacy(resolve, reject));
console.log(await promisify(legacy)());
```

**Answer:** `rejected with done`, then `done`. The default wrapper passes `legacy` an error-first callback as `onSuccess`, so `'done'` is read as an error. After defining `promisify.custom`, `promisify` returns your function, which maps `onSuccess` to `resolve`.
