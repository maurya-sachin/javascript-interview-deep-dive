---
title: "What does `postMessage()` copy, what can it transfer, and what can't it send?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [postmessage, structured-clone, transferable, arraybuffer, datacloneerror, workers]
related:
  - browser/workers/web-workers
  - javascript/objects-and-properties/shallow-vs-deep-copy
  - javascript/json-and-binary-data/sharedarraybuffer-atomics
  - browser/network-apis/streaming-bodies
  - browser/workers/cross-tab-communication
verified: 2026-10
perishable:
  - "Transferable ReadableStream: Chrome 87, Firefox 103, Safari 27"
  - "Error cause survives cloning in Chrome 156, Firefox 159 (unspecified)"
sources:
  - https://html.spec.whatwg.org/multipage/structured-data.html#safe-passing-of-structured-data
  - https://html.spec.whatwg.org/multipage/structured-data.html#structuredserializeinternal
  - https://html.spec.whatwg.org/multipage/structured-data.html#transferable-objects
  - https://html.spec.whatwg.org/multipage/structured-data.html#structuredserializewithtransfer
  - https://html.spec.whatwg.org/multipage/structured-data.html#dom-structuredclone
  - https://html.spec.whatwg.org/multipage/web-messaging.html#message-port-post-message-steps
  - https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream#browser_compatibility
tldr: >
  `postMessage()` copies data with the structured clone algorithm: plain objects, arrays, primitives
  except symbols, `Date`, `RegExp`, `Map`, `Set`, typed arrays, `Blob`, `Error`, and cycles. Classes
  arrive as plain objects. Functions, DOM nodes and symbols throw `DataCloneError`. Objects in the
  transfer list move instead: the sender's `ArrayBuffer` is detached and reads as length 0.
---

## Answer

`postMessage(message, transfer)` serializes `message` on the sending side and deserializes a fresh copy on the receiving side. The algorithm is *structured clone* (the HTML Standard's `StructuredSerializeWithTransfer`); `structuredClone()` exposes the same one.

**What it copies:** primitives except `Symbol` (including `BigInt`, `NaN`, `-0`), plain objects and arrays, `Date`, `RegExp`, `Map`, `Set`, `ArrayBuffer` and typed arrays, boxed primitives, `Blob`, `File`, `ImageData`, and `Error` objects. It keeps cycles and shared references: an array referenced twice arrives as one array referenced twice.

**What it loses:** an object is copied as its own enumerable string-keyed properties, so a class instance arrives as a plain `Object`. Methods and prototype getters are gone; an own getter is called and its value copied; symbol keys and non-enumerable properties are dropped. An `Error` keeps its type only for the built-in names (`TypeError`, `RangeError`…); a subclass arrives as `Error`, without extra properties.

**What throws:** functions (including methods on a plain object), `Symbol` values, DOM nodes, `WeakMap`, promises and proxies throw a `DataCloneError` `DOMException` from `postMessage()` itself, and nothing is sent.

**Transfer:** objects in the second argument move instead of being copied. Copying a 64 MiB `ArrayBuffer` blocked the sender for 5.9–10.2 ms in Chrome 156 (15 runs); transferring it took under 0.2 ms. The cost is that the sender's buffer is *detached*: `byteLength` becomes 0 and views over it become empty. Transferable types include `ArrayBuffer`, `MessagePort`, `ReadableStream`, `ImageBitmap` and `OffscreenCanvas`. A `MessagePort` or stream must be transferred; putting one in the message without the transfer list throws.

To share memory rather than copy or move it, use `SharedArrayBuffer`.

## Example

```js
const worker = new Worker('echo-worker.js'); // onmessage = (e) => postMessage(e.data);
class Point { x = 1; get double() { return this.x * 2; } }
const err = new RangeError('too big');
err.code = 42;
const buffer = new ArrayBuffer(1024);

worker.onmessage = ({ data }) => {
  console.log(data.when instanceof Date, data.tags.has('a'), data.buffer.byteLength);
  // → true true 1024
  console.log(data.point instanceof Point, data.point.x, 'double' in data.point);
  // → false 1 false
  console.log(data.err instanceof RangeError, data.err.message, 'code' in data.err);
  // → true too big false
};

worker.postMessage({ when: new Date(0), tags: new Set(['a']), point: new Point(), err, buffer }, [buffer]);
console.log(buffer.byteLength);
// → 0

try {
  worker.postMessage({ onDone() {} });
} catch (e) {
  console.log(e.name);
  // → DataCloneError
}
```

The two synchronous lines print first. Same output in Chrome 156 and Firefox 159.

## Pitfalls

- Expecting a class instance to come back with its methods. Send plain data and rebuild the instance on the other side, for example `Object.assign(new Point(), data)`.
- Using a buffer after transferring it. Views over a detached buffer report length 0, reads give `undefined` and writes are ignored without an error.
- Cloning large buffers on every message. The copy runs on the sending thread; transfer them, or keep the data in the worker.
- Assuming the transfer list only affects what's in the message. Every listed buffer is detached, even one the message never references.

## Follow-ups

**Q:** What happens to an `Error`'s stack and `cause`?
**A:** The spec carries `name`, `message` and an implementation-defined stack. In Chrome 156 and Firefox 159 the clone also kept `cause`, which the spec leaves to user agents; extra own properties such as `code` were dropped.

**Q:** Can you transfer a typed array?
**A:** Not the view: listing a `Uint8Array` throws `DataCloneError`. List its `.buffer`; the receiver gets a new view over the moved memory, and every view over it in the sender drops to length 0.

**Q:** What if deserializing fails on the receiving side?
**A:** The receiver gets a `messageerror` event instead of `message`. The sender isn't told, since serializing already succeeded.

**Q:** What's `RegExp`'s `lastIndex` after cloning?
**A:** 0. The algorithm copies only the pattern and flags.

## Exercises

### Which buffers are detached?

```js
const worker = new Worker('echo-worker.js');
const a = new ArrayBuffer(8);
const b = new ArrayBuffer(8);
worker.postMessage({ a }, [a, b]);
console.log(a.byteLength, b.byteLength);
```

**Answer:** `0 0`. Both buffers are in the transfer list, so both are detached, though the message only refers to `a`. Chrome 156 and Firefox 159 agree.
