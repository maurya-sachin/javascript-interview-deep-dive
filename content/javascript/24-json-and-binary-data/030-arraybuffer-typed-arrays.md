---
title: "What are `ArrayBuffer`, typed arrays, and `DataView`?"
status: draft
difficulty: medium
frequency: 2
core: false
tags: [arraybuffer, typed-arrays, dataview, endianness, binary, views]
related:
  - javascript/json-and-binary-data/modern-binary-data
  - javascript/json-and-binary-data/sharedarraybuffer-atomics
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-arraybuffer-objects
  - https://tc39.es/ecma262/#sec-typedarray-objects
  - https://tc39.es/ecma262/#sec-dataview-objects
  - https://tc39.es/ecma262/#sec-getviewvalue
  - https://tc39.es/ecma262/#sec-getvaluefrombuffer
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Typed_arrays
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView
tldr: >
  An `ArrayBuffer` is a fixed block of raw bytes with no way to read it. You read and write through a view: a typed
  array (`Uint8Array`, `Float32Array`, ...) that reinterprets the bytes as one element type in platform byte order,
  or a `DataView` that reads any type at any byte offset with explicit endianness. Views share memory, they don't copy.
---

## Answer

Three pieces, with separate jobs:

- **`ArrayBuffer`** owns a contiguous block of bytes, zero-filled, with a `byteLength`. It has no indexing; `slice()` copies a range into a new buffer.
- **Typed arrays** (`Int8Array`, `Uint8Array`, `Uint8ClampedArray`, `Int16Array`, `Uint16Array`, `Int32Array`, `Uint32Array`, `Float32Array`, `Float64Array`, `BigInt64Array`, `BigUint64Array`) are array-like **views** over a buffer. Each has an element type, `BYTES_PER_ELEMENT`, a `byteOffset`, and a `length`. `new Uint8Array(buffer)` shares the memory, `new Uint8Array([1, 2])` or `new Uint8Array(4)` allocates a fresh buffer.
- **`DataView`** is a view with no fixed element type. `getUint16(byteOffset, littleEndian)`, `setFloat32(...)` and similar read or write at any byte offset, **unaligned**, with the byte order you pass.

Behaviours interviewers probe:

- **Views alias.** Writing through one view is visible through all others on the same buffer. `subarray()` returns a new view on the same buffer; `slice()` copies.
- **Endianness.** A typed array stores multi-byte elements in the host's byte order (implementation-defined in the spec; most current hardware is little-endian). `DataView` defaults to **big-endian** (network order) unless `littleEndian` is `true`. Use `DataView` for file and network formats.
- **Alignment.** A typed array's `byteOffset` must be a multiple of its element size, and the buffer length must be a multiple of the element size if you don't pass a length, or it throws `RangeError`. `DataView` has no such limit.
- **Element conversion.** Writing wraps modulo 2ⁿ for integers (`Uint8Array` `255 + 1` is `0`), saturates for `Uint8ClampedArray`, and rounds to nearest `Float32` for floats. Writes never throw: an index outside `length` is silently ignored, and reads give `undefined`.
- **BigInt arrays** only accept BigInt values.
- **Typed arrays aren't `Array`s.** `Array.isArray` is `false`, they have fixed length, and they lack `push` and `pop`, but they share most iteration methods. Their `sort()` is numeric by default, unlike `Array.prototype.sort`.

## Example

```js
const buf = new ArrayBuffer(8);
const bytes = new Uint8Array(buf);
const words = new Uint16Array(buf); // second view over the same 8 bytes

words[0] = 0x0102;
console.log(bytes[0], bytes[1]);
// → 2 1   (little-endian host; a big-endian host would print 1 2)

const view = new DataView(buf);
view.setUint16(2, 0x0102); // DataView is big-endian unless told otherwise
console.log(bytes[2], bytes[3]);
// → 1 2
view.setUint16(4, 0x0102, true);
console.log(bytes[4], bytes[5]);
// → 2 1
console.log(view.getUint16(2), view.getUint16(2, true));
// → 258 513

const copy = bytes.slice(0, 2);
const alias = bytes.subarray(0, 2);
bytes[0] = 99;
console.log(copy[0], alias[0]);
// → 2 99
```

Run on arm64 macOS with Node 24.19.0, which is little-endian.

## Pitfalls

- Assuming the host byte order when reading a file or socket. Reading a big-endian field with `new Uint16Array(buffer)` gives swapped values on little-endian hosts. Read with `DataView` and an explicit `littleEndian`.
- Treating `slice` and `subarray` as the same. `subarray` shares memory, so a later write changes both, while `slice` copies. Also, `subarray(1).buffer` is still the whole original buffer, so `.buffer` on a sub-view is not "just my bytes". Use `byteOffset` and `byteLength`.
- Expecting overflow errors. `new Uint8Array([256.9, -1])` is `[0, 255]`: the value is truncated, then wrapped. Use `Uint8ClampedArray` when you want saturation (canvas pixel data).
- Passing an unaligned offset or odd length. `new Uint16Array(buffer, 1)` throws `RangeError`; a `DataView` at offset 1 doesn't.

## Follow-ups

**Q:** How do you detect the machine's endianness?
**A:** Write a known multi-byte value and read the first byte: `new Uint8Array(new Uint16Array([1]).buffer)[0] === 1` is true on little-endian hosts. It was `true` on the arm64 machine used for this chapter.

**Q:** `length` or `byteLength`?
**A:** `length` counts elements, `byteLength` counts bytes. For `Uint32Array(4)`, `length` is 4 and `byteLength` is 16. A `DataView` has only `byteLength` and `byteOffset`.

**Q:** How do you turn a string into bytes?
**A:** `new TextEncoder().encode('é€')` returns a `Uint8Array` of UTF-8 bytes (`[195, 169, 226, 130, 172]`), and `new TextDecoder().decode(bytes)` reverses it. Never use `String.fromCharCode` over bytes for text outside ASCII.

**Q:** What does reading past the end do?
**A:** A typed array index out of range gives `undefined`. `DataView` getters and setters throw `RangeError` when the read would exceed the view, for example `getUint32(4)` on a 6-byte view.

## Exercises

### What is printed?

```js
const bytes = new Uint8Array([0x12, 0x34, 0x56, 0x78]);
const view = new DataView(bytes.buffer);
console.log(view.getUint16(0).toString(16));
console.log(view.getUint16(0, true).toString(16));
console.log(view.getUint32(0, true).toString(16));
```

**Answer:** `1234`, then `3412`, then `78563412`. `DataView` reads big-endian by default, so the first two bytes `12 34` form `0x1234`. With `littleEndian: true` the first byte is least significant, so `34 12` reads as `0x3412` and all four bytes read reversed.

### Copy or alias?

```js
const a = new Uint8Array([1, 2, 3, 4]);
const b = a.subarray(1, 3);
const c = a.slice(1, 3);
b[0] = 9;
c[1] = 8;
console.log(a, b.byteOffset, c.byteOffset);
```

**Answer:** `Uint8Array(4) [ 1, 9, 3, 4 ] 1 0`. `b` is a view at byte offset 1, so its write lands in `a`. `c` is a copy in its own buffer at offset 0, so its write doesn't touch `a`.
