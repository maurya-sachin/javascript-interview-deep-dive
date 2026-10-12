---
title: "How do you create custom errors?"
status: draft
difficulty: easy
frequency: 4
core: false
tags: [error, extends, cause, aggregate-error, error-iserror, stack, capture-stack-trace]
related:
  - javascript/errors-and-cleanup/try-catch-finally
  - javascript/promises/promise-combinators
  - javascript/classes/classes-vs-prototypes
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-error-objects
  - https://tc39.es/ecma262/#sec-error-constructor
  - https://tc39.es/ecma262/#sec-aggregate-error-objects
  - https://tc39.es/ecma262/#sec-error.iserror
  - https://github.com/tc39/proposal-error-stack-accessor
  - https://github.com/tc39/proposal-error-capturestacktrace
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/captureStackTrace
  - https://v8.dev/docs/stack-trace-api
  - https://html.spec.whatwg.org/multipage/structured-data.html#structuredserializeinternal
tldr: >
  Extend `Error`, call `super(message, options)`, and set a `name`. Pass `{ cause }` to chain the lower-level
  error instead of losing it. `instanceof` checks the class, `Error.isError` checks for a real error object
  across realms, and `AggregateError` holds several errors at once. `stack` is not in the spec yet.
---

## Answer

Create a custom error by extending `Error`:

- **Call `super(message, options)`.** The `Error` constructor creates the object with the error internal slot and a non-enumerable `message`. Subclass constructors must call it.
- **Set a `name`.** `Error.prototype.name` is `"Error"`, so a subclass without its own `name` still prints as `Error: ...`. Its constructor name is not used.
- **Chain with `cause`.** `new Error(message, { cause })` installs a non-enumerable `cause` property. Use it when you catch a low-level error and throw a higher-level one, so the original is not lost.
- **Add data as fields.** A `status`, `code`, or `retryable` flag lets callers branch without parsing the message. Prefer a stable `code` over message text.
- **Check with `instanceof`.** `error instanceof HttpError` works for your classes. `Error.isError(value)` is the reliable check for "is this a real error object", including errors from another realm (an iframe or `vm` context), where `instanceof Error` is `false`. It does not look at the prototype chain, so `Object.create(Error.prototype)` is not an error.
- **`AggregateError`** wraps several errors in an `errors` array. `Promise.any` rejects with one when every input rejects.
- **`stack`.** Engines provide a string `stack`, but the format is not specified. It is being standardized as an accessor (a Stage 3 proposal).

Throw `Error` objects, not strings: they carry a stack and work with `cause` and `instanceof`.

## Example

```js
class HttpError extends Error {
  name = 'HttpError';
  constructor(status, message, options) {
    super(message, options);
    this.status = status;
  }
}

function parseBody(text) {
  try {
    return JSON.parse(text);
  } catch (cause) {
    throw new HttpError(502, 'Bad upstream response', { cause });
  }
}

try {
  parseBody('{');
} catch (error) {
  console.log(error instanceof HttpError, error instanceof Error);
  // → true true
  console.log(String(error));
  // → HttpError: Bad upstream response
  console.log(error.status, error.cause.name);
  // → 502 SyntaxError
  console.log(Object.keys(error));
  // → [ 'name', 'status' ]
}
```

## Pitfalls

- Forgetting the name. `class A extends Error {}` gives `new A('hi').name === 'Error'`, so logs show `Error: hi` and you cannot tell it from other errors.
- Setting `name` with a field or `this.name = ...` creates an own enumerable property, as the last line of the example shows. It then appears in `Object.keys` and in `JSON.stringify` output. That is often fine, but it is not the same as the built-in errors.
- Losing the original error by throwing a new one without `cause`. Also avoid parsing `message` or `stack`: neither is a stable interface.
- Using `instanceof` across realms or duplicated package copies. A class loaded twice produces two different constructors. Match on a `code` field when errors cross those boundaries.

## Follow-ups

**Q:** Does `{ cause: undefined }` create a `cause` property?
**A:** Yes. The constructor checks that the options object *has* a `cause` property, not that its value is defined. `new Error('x')` has no `cause`; `new Error('x', { cause: undefined })` has one set to `undefined`.

**Q:** Does a custom error survive `structuredClone` or `postMessage`?
**A:** Only partly. The HTML spec serializes `name` (changed to `"Error"` unless it is a built-in error name), `message`, and the stack. Your subclass and its extra fields are lost.

**Q:** What is `Error.captureStackTrace`?
**A:** A non-standard function that creates a `stack` property on any object. Its second argument hides frames above a given function. V8 created it; MDN lists Firefox and Safari support too. It is a Stage 2 proposal.

## Deep dive

### How it works

The `Error` constructor works the same with or without `new`. It does three things: create the object from `NewTarget`'s prototype with an `[[ErrorData]]` slot, define `message` as a non-enumerable own property only when a message is given, and run `InstallErrorCause`, which defines `cause` (also non-enumerable) only if the options argument is an object that has a `"cause"` property.

Because `NewTarget` is used, `class HttpError extends Error` gets `HttpError.prototype` as its prototype, and `instanceof HttpError` works. The `[[ErrorData]]` slot is what `Error.isError` and `Object.prototype.toString` look at:

```js
const fake = Object.create(Error.prototype);
console.log(fake instanceof Error, Error.isError(fake));
// → true false
console.log(Object.prototype.toString.call(new Error('x')));
// → [object Error]
```

`Error.prototype.toString` builds the `name: message` text from the `name` and `message` properties. If `name` is empty it returns the message, and if `message` is empty it returns the name.

The spec defines no `stack`. Every major engine adds one, with a different format. V8 collects 10 frames by default (`Error.stackTraceLimit`) when the error is created. The Error Stack Accessor proposal (Stage 3 in the TC39 proposals list) would standardize only that the `stack` property exists as an accessor on `Error.prototype`, not the format.

### Edge cases

`AggregateError(errors, message, options)` takes an iterable of errors first and stores them as an `errors` array. `Promise.any` uses it:

```js
try {
  await Promise.any([Promise.reject(new Error('a')), Promise.reject(new TypeError('b'))]);
} catch (error) {
  console.log(error.constructor.name, error.errors.map(String));
}
// → AggregateError [ 'Error: a', 'TypeError: b' ]
```

The native error types are `TypeError`, `RangeError`, `ReferenceError`, `SyntaxError`, `URIError`, and `EvalError` (kept for compatibility, unused by the spec). They are subclasses of `Error` with their own `name`. Extend one of them only when callers are meant to treat your error as that kind, for example a `RangeError` for out-of-range input.

### Real-world scenario

A repository layer catches a driver error and throws a domain error with the driver error as `cause`. The top-level logger then walks the chain:

```js
function describeChain(error) {
  const lines = [];
  for (let e = error; Error.isError(e); e = e.cause) lines.push(`${e.name}: ${e.message}`);
  return lines;
}
const root = new TypeError('socket closed');
const top = new Error('load profile failed', {
  cause: new Error('fetch failed', { cause: root }),
});
console.log(describeChain(top));
// → [
// →   'Error: load profile failed',
// →   'Error: fetch failed',
// →   'TypeError: socket closed'
// → ]
```

The loop stops at the first non-error `cause`, which also guards against a `cause` that is a string or `undefined`. Node's `util.inspect` (and so `console.log`) prints `cause` as `[cause]` under the error.

### Trade-offs

A class hierarchy (`NotFoundError`, `ValidationError`, ...) makes `instanceof` branching easy, but it is fragile when the same module is bundled twice or errors cross `postMessage`. A single class with a string `code` (`error.code === 'ENOENT'`, like Node's own errors) survives both. Pick one convention for the codebase. Keep the hierarchy shallow either way.

## Exercises

### Which name is printed

```js
class A extends Error {}
class B extends Error {
  constructor(message) {
    super(message);
    this.name = 'B';
  }
}
console.log(String(new A('x')), '|', String(new B('x')));
```

**Answer:** `Error: x | B: x` (run in Node 24). `A` inherits `Error.prototype.name`, which is `"Error"`. `B` sets its own `name`.

### Is it an error

```js
import vm from 'node:vm';
const foreign = vm.runInNewContext('new Error("other realm")');
const fake = Object.create(Error.prototype);
console.log(foreign instanceof Error, Error.isError(foreign));
console.log(fake instanceof Error, Error.isError(fake));
```

**Answer:** `false true`, then `true false` (run in Node 24). The foreign error has a different realm's `Error.prototype`, so `instanceof` fails, but it has `[[ErrorData]]`. `fake` has the right prototype but no slot.

### Is `cause` always there

```js
const a = new Error('a');
const b = new Error('b', { cause: undefined });
console.log('cause' in a, 'cause' in b);
```

**Answer:** `false true` (run in Node 24). The option is installed when the options object has a `cause` property, whatever its value.
