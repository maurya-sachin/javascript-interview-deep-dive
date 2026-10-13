---
title: "What's new in binary data?"
status: draft
difficulty: medium
frequency: 1
core: false
tags: [resizable-arraybuffer, transfer, detached, base64, hex, float16, typed-arrays]
related:
  - javascript/json-and-binary-data/arraybuffer-typed-arrays
  - javascript/json-and-binary-data/sharedarraybuffer-atomics
verified: 2026-10
sources:
  - https://github.com/tc39/proposals/blob/main/finished-proposals.md
  - https://tc39.es/ecma262/#sec-arraybuffer.prototype.resize
  - https://tc39.es/ecma262/#sec-arraybuffer.prototype.transfer
  - https://tc39.es/ecma262/#sec-uint8array.fromBase64
  - https://tc39.es/ecma262/#sec-math.f16round
  - https://github.com/mdn/browser-compat-data/tree/main/javascript/builtins
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer/resize
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer/transfer
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/toBase64
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float16Array
tldr: >
  Binary data gained five things. Resizable `ArrayBuffer` and `transfer()` (with `detached`) are in ES2024 and Node 22+.
  Copying typed array methods (`toSorted`, `with`) are ES2023. `Float16Array` and `Math.f16round` are ES2025 and need
  Node 24. `Uint8Array` base64 and hex are stage 4 but only in Node 26+, so feature-detect.
---

## Answer

| Feature | What it adds | Edition | Node 22.23 / 24.19 / 26.11 (measured) |
|---|---|---|---|
| Resizable buffers | `new ArrayBuffer(n, { maxByteLength })`, `resize()`, `resizable`, `maxByteLength` | ES2024 | yes / yes / yes |
| Transfer | `transfer()`, `transferToFixedLength()`, `detached` | ES2024 | yes / yes / yes |
| Copying methods | `toSorted`, `toReversed`, `with` on typed arrays | ES2023 | yes / yes / yes |
| Float16 | `Float16Array`, `DataView` `getFloat16`/`setFloat16`, `Math.f16round` | ES2025 | no / yes / yes |
| Base64 and hex | `toBase64`, `fromBase64`, `toHex`, `fromHex`, `setFromBase64`, `setFromHex` | stage 4 (July 2025), ES2026 | no / no / yes |

**Resizable buffers.** A buffer created with `maxByteLength` can `resize()` in place up to that cap. A **length-tracking** view (`new Uint8Array(buffer)`) follows the buffer. A view with a fixed length or offset goes **out of bounds** when the buffer shrinks below it: `length`, `byteLength`, and `byteOffset` read `0` and methods throw `TypeError`. It recovers if the buffer grows back.

**Transfer.** `buffer.transfer(newLength?)` moves the bytes into a new buffer (truncated or zero-extended) and **detaches** the original: `detached` is `true`, `byteLength` is `0`, and every view on it reports length `0`. `transfer` keeps resizability, `transferToFixedLength` drops it. It is the language-level form of what `postMessage(buf, [buf])` and `structuredClone(buf, { transfer: [buf] })` already do.

**Copying methods.** Typed arrays gained `toSorted`, `toReversed`, and `with`, which return a new typed array instead of mutating.

**Float16.** Half-precision floats (1 sign, 5 exponent, 10 fraction bits) for compact numeric storage. `Math.f16round(x)` rounds a Number to the nearest representable half, and `Float16Array` stores them. Range tops out at 65504.

**Base64 and hex.** Built-in encoders replace the `btoa(String.fromCharCode(...))` workaround, with `alphabet: 'base64url'`, `omitPadding`, and a `lastChunkHandling` option for decoding.

## Example

```js
// Node 22+ (resizable buffers, transfer)
const buffer = new ArrayBuffer(4, { maxByteLength: 16 });
const follows = new Uint8Array(buffer);       // length-tracking view
const pinned = new Uint8Array(buffer, 0, 4);  // fixed length 4

buffer.resize(8);
console.log(follows.length, pinned.length);
// → 8 4
buffer.resize(2);
console.log(follows.length, pinned.length); // pinned is now out of bounds
// → 2 0

follows[0] = 7;
const moved = buffer.transfer(4);             // detaches `buffer`, keeps it resizable
console.log(buffer.detached, buffer.byteLength, follows.length);
// → true 0 0
console.log(moved.byteLength, moved.resizable, new Uint8Array(moved)[0]);
// → 4 true 7
```

## Pitfalls

- Shipping base64 or hex methods unguarded. They are missing in Node 22 and 24, and in browsers older than Chrome 140, Firefox 133, or Safari 18.2 (per MDN). Check `typeof Uint8Array.fromBase64 === 'function'` and keep a `btoa` or `Buffer` fallback.
- Using a detached buffer. After `transfer()` or a transferable `postMessage`, `slice` and `new Uint8Array(oldBuffer)` throw `TypeError`, and old views silently read `0` length. Check `buffer.detached` when ownership is unclear.
- Caching `view.length` across a resize. A length-tracking view changes length when the buffer is resized, and a fixed view can go out of bounds. Re-read `length`, don't store it.
- Expecting `Float16Array` precision. Half floats hold about 3 decimal digits: `Math.f16round(0.1)` is `0.0999755859375`, and values above 65504 round to `Infinity`.

## Follow-ups

**Q:** Why did `transfer()` get added when `slice()` exists?
**A:** `slice` copies, which costs time and memory for large buffers. `transfer` moves ownership without keeping two copies alive, and `resize` on a resizable buffer avoids reallocation. Both exist so large binary data can be handed off safely.

**Q:** Is a transferred buffer the same object?
**A:** No. The original object stays alive but detached (`detached === true`), and a new `ArrayBuffer` holds the bytes. Any reference to the old one must be updated.

**Q:** How do I check these features in a browser?
**A:** Feature-detect the method (`'transfer' in ArrayBuffer.prototype`). Don't branch on user agent strings. MDN's compatibility tables are generated from browser-compat-data and list the first version per engine.

**Q:** What replaces `Buffer.from(x).toString('base64')` outside Node?
**A:** `bytes.toBase64()` where available, otherwise `btoa` over a binary string. `btoa` only accepts Latin-1 text, so encode text to UTF-8 bytes first.

## Exercises

### How far can a half float go?

```js
console.log(Math.f16round(65519), Math.f16round(65520), Math.f16round(1.337));
```

**Answer:** `65504 Infinity 1.3369140625` (Node 24+). 65504 is the largest finite half. 65519 rounds down to it, and 65520 is exactly halfway to the next step, which rounds to even and overflows to `Infinity`. 1.337 has only 10 fraction bits, so it becomes the nearest half, `1.3369140625`.

### Decode a base64 string

```js
// Node 26+ (guard with typeof Uint8Array.fromBase64 === 'function')
const text = '+//+SA';
console.log(Uint8Array.fromBase64(text));
try { Uint8Array.fromBase64(text, { lastChunkHandling: 'strict' }); } catch (e) { console.log(e.name); }
console.log(new Uint8Array([251, 255, 254, 72]).toBase64({ alphabet: 'base64url', omitPadding: true }));
```

**Answer:** `Uint8Array(4) [ 251, 255, 254, 72 ]`, then `SyntaxError`, then `-__-SA`. The default `lastChunkHandling: 'loose'` accepts missing padding, while `'strict'` requires it. `base64url` swaps `+` and `/` for `-` and `_`, and `omitPadding` drops the trailing `==`. Output was checked on Node 26.11.1, because Node 24.19.0 lacks these methods.
