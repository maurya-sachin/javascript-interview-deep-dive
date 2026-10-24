---
title: "What do `using` and `await using` do?"
status: draft
difficulty: medium
frequency: 1
core: true
tags: [using, await-using, symbol-dispose, symbol-asyncdispose, disposable-stack, suppressed-error, resource-management]
related:
  - javascript/errors-and-cleanup/try-catch-finally
  - javascript/errors-and-cleanup/custom-errors
  - javascript/values-and-types/symbols
  - javascript/scope-and-execution-contexts/var-let-const
verified: 2026-10
perishable:
  - Expected in ES2027 (TC39 finished proposals)
  - Safari support listed as preview only in MDN compat data
sources:
  - https://github.com/tc39/proposal-explicit-resource-management
  - https://github.com/tc39/proposals/blob/main/finished-proposals.md
  - https://tc39.es/ecma262/#sec-resource-management
  - https://tc39.es/ecma262/#sec-let-and-const-declarations
  - https://tc39.es/ecma262/#sec-disposeresources
  - https://tc39.es/ecma262/#sec-disposablestack-objects
  - https://tc39.es/ecma262/#sec-suppressederror-objects
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/using
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Resource_management
  - https://github.com/mdn/browser-compat-data/blob/main/javascript/statements.json
  - https://nodejs.org/docs/latest-v24.x/api/fs.html#filehandlesymbolasyncdispose
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry
tldr: >
  `using x = resource` calls `x[Symbol.dispose]()` when the enclosing block exits, however it exits;
  `await using` awaits `x[Symbol.asyncDispose]()`. Resources are disposed in reverse order. If disposal throws
  while another error is pending, both are kept in a `SuppressedError`. `DisposableStack` handles dynamic
  or non-disposable resources. The feature is Stage 4 and ships in Node 24+, not Node 22.
---

## Answer

`using` is a block-scoped declaration that ties cleanup to scope, like `with` in Python or C#'s `using`.

- **`using x = value;`** disposes `x` when the enclosing block, function, or module finishes, by calling `x[Symbol.dispose]()`. This also happens on `return`, `break`, and `throw`.
- **`await using x = value;`** calls `x[Symbol.asyncDispose]()` and awaits it. It is only allowed where `await` is (async functions and module top level). If an object has only `Symbol.dispose`, it is used instead.
- **Reverse order.** Resources are disposed last declared first, like a stack, so a resource can depend on earlier ones.
- **`null` and `undefined` are allowed** and skipped, which makes optional resources easy. Any other non-object throws a `TypeError` at the declaration, as does an object without the method.
- **The binding is constant.** You cannot reassign it.
- **Errors are not lost.** If a disposer throws while an error is already pending, the new error is thrown as a `SuppressedError`: its `error` is the new one and its `suppressed` is the earlier one.
- **`DisposableStack` / `AsyncDisposableStack`** collect cleanups at runtime: `use(resource)`, `adopt(value, fn)` for things without a dispose method, `defer(fn)`, `move()` to transfer ownership, and `dispose()`. Use them when the number of resources is dynamic, such as in a constructor.

**Availability.** It is a Stage 4 TC39 proposal, expected in ES2027. Per MDN's compatibility data, Chrome 134 and Firefox 141 support the syntax and built-ins, and Safari lists it as preview only. In Node.js, the syntax and `DisposableStack` work in Node 24 and 26, not in Node 22, where `using` is a `SyntaxError`. Check your runtime and your build tool before relying on it.

## Example

```js
const open = (name) => {
  console.log('open', name);
  return { name, [Symbol.dispose]() { console.log('close', name); } };
};

function work() {
  using first = open('first');
  using second = open('second');
  console.log('working');
  throw new Error('failed');
}

try {
  work();
} catch (error) {
  console.log('caught', error.message);
}
// → open first
// → open second
// → working
// → close second
// → close first
// → caught failed
```

Needs `using` syntax: run in Node 24+, Chrome 134+, or Firefox 141+.

## Pitfalls

- Assuming it works everywhere, or using it at the top level of a classic script (it is for blocks, function bodies, and modules). Node 22 and older browsers throw a `SyntaxError` for the whole file, so a guard cannot be written in the same file. Check your support matrix and build tooling first.
- Using `using` on a value that has no `Symbol.dispose`, such as a plain `fetch` response or an object you forgot to wrap. It throws a `TypeError` at the declaration. Wrap with `DisposableStack.adopt` or `defer`.
- Expecting `using` to free memory. It runs your cleanup code at a known point. It does not make the garbage collector run.
- Disposing twice or throwing from a disposer. Make `[Symbol.dispose]()` idempotent and avoid throwing, because a throw during disposal replaces or wraps the pending error.

## Follow-ups

**Q:** Why was `try`/`finally` not enough?
**A:** It works, but nesting grows with each resource, cleanup order is manual, and a throw in `finally` replaces the original error. `using` fixes order and keeps both errors.

**Q:** Is the dispose method looked up at exit or at declaration?
**A:** At declaration. Replacing `resource[Symbol.dispose]` afterwards does not change what runs, as the `Disposable` is captured when the `using` initializer is evaluated.

**Q:** Can `using` appear in a `for` loop?
**A:** Yes: `for (using item of items)` disposes each item at the end of its iteration.

## Deep dive

### How it works

A block that contains a `using` declaration keeps a list of **DisposableResource Records**, each with the value, the kind (`sync-dispose` or `async-dispose`), and the dispose method. The method is read when the declaration runs, through `GetDisposeMethod`: for `await using` it prefers `Symbol.asyncDispose` and falls back to `Symbol.dispose`, wrapping it so a sync throw becomes a rejection.

When the block's statements finish, `Block` evaluation passes the block's completion and the list to `DisposeResources`. That operation walks the list in reverse and calls each method with the resource as `this`. Each call can end the block with a new completion:

- If the disposer returns normally, the earlier completion stands.
- If it throws and the current outcome is normal, the throw becomes the outcome.
- If it throws and the outcome is already a throw, the spec creates a `SuppressedError` with `error` = the new error and `suppressed` = the old one, and that becomes the outcome.

The spec creates this `SuppressedError` without a message, so any default message text is engine-specific. Nesting happens naturally: with two failing disposers and a failing body, the body error is suppressed by the second disposer's error, which is then suppressed by the first's:

```js
const failing = (n) => ({ [Symbol.dispose]() { throw new Error(`dispose ${n}`); } });
try {
  using r1 = failing(1);
  using r2 = failing(2);
  throw new Error('body');
} catch (error) {
  console.log(error.name, error.error.message);
  // → SuppressedError dispose 1
  console.log(error.suppressed.error.message, error.suppressed.suppressed.message);
  // → dispose 2 body
}
```

### Edge cases

`await using` awaits each async disposer before starting the next. Even a `null` value costs one `await` at block exit. A resource that has only `Symbol.dispose` is also accepted: the engine wraps its method so a sync throw becomes a rejection.

```js
const asyncResource = (name) => ({
  async [Symbol.asyncDispose]() {
    await null;
    console.log('async close', name);
  },
});
async function f() {
  await using a = asyncResource('a');
  await using b = asyncResource('b');
  console.log('body');
}
await f();
// → body
// → async close b
// → async close a
```

The disposal list is per block, so a `using` inside a loop body runs at the end of each iteration. `for (using x of xs)` is the same idea. Node.js already implements the protocol on its own objects: `fs.promises` `FileHandle` has `Symbol.asyncDispose` (it calls `close()`), so `await using file = await fs.open(path)` works in Node 24.

### Real-world scenario

A constructor acquires two resources. If the second step throws, the first must be released, but if everything works, ownership moves to the new object. A `DisposableStack` expresses both:

```js
class Connection {
  #cleanup;
  constructor(failAfterSocket) {
    using stack = new DisposableStack();
    stack.use(open('socket'));
    if (failAfterSocket) throw new Error('handshake failed');
    stack.use(open('session'));
    this.#cleanup = stack.move(); // keeps the resources alive past this block
  }
  [Symbol.dispose]() {
    this.#cleanup.dispose();
  }
}
try {
  new Connection(true);
} catch (error) {
  console.log(error.message);
}
// → open socket
// → close socket
// → handshake failed
{
  using connection = new Connection(false);
  console.log('connected');
}
// → open socket
// → open session
// → connected
// → close session
// → close socket
```

(`open` is the helper from the main example.) `move()` returns a new stack holding the resources and marks the old one disposed, so the `using stack` at the end of the constructor has nothing left to dispose.

### Trade-offs

Compared to `try`/`finally`, `using` is flatter, orders cleanup for you, and keeps both errors. The cost is availability: tooling that does not know the syntax cannot parse the file, so check your bundler, linter, and runtimes before adopting it. The `Symbol.dispose` and `DisposableStack` APIs can be used earlier than the syntax, with `try`/`finally` calling `stack.dispose()`. Where you only need one cleanup in one function, plain `try`/`finally` is still fine.

Disposal is explicit and scope-based. It does not replace garbage collection, and `FinalizationRegistry` is not a substitute, because whether and when its callbacks run is up to the engine.

## Exercises

### Disposal order

```js
const log = (name) => ({ [Symbol.dispose]() { console.log('dispose', name); } });
{
  using a = log('a');
  using b = log('b');
  console.log('end of block');
}
```

**Answer:** `end of block`, `dispose b`, `dispose a` (run in Node 24). Resources are disposed in reverse declaration order, after the block's code finishes.

### Which error wins

```js
const failing = { [Symbol.dispose]() { throw new Error('dispose failed'); } };
try {
  using resource = failing;
  throw new Error('body failed');
} catch (error) {
  console.log(error.name, '|', error.error.message, '|', error.suppressed.message);
}
```

**Answer:** `SuppressedError | dispose failed | body failed` (run in Node 24). The disposer's error is the primary `error`, and the earlier body error is kept in `suppressed`.

### What happens to `null`

```js
{
  using nothing = null;
  console.log('ok');
}
try {
  new Function('{ using notDisposable = {}; }')();
} catch (error) {
  console.log(error.name);
}
```

**Answer:** `ok`, then `TypeError` (run in Node 24). `null` and `undefined` are accepted and ignored. An object without `Symbol.dispose` throws a `TypeError` at the declaration, not at the end of the block. `new Function` is used here so a parse failure in an older runtime would stay a catchable `SyntaxError` instead of breaking the file.
