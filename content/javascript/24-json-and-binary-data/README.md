# 24 — JSON and binary data

> **Status:** 🔴 planned · **Published:** 0/6 · **Last verified:** —

JSON serialization edge cases, and raw memory: `ArrayBuffer`, typed arrays, and shared memory.

## Learning goals

After this chapter you can:

- Predict what `JSON.stringify` keeps, drops, or throws on
- Parse JSON losslessly with revivers and source text
- Read and write binary data with typed arrays and `DataView`
- Explain when `SharedArrayBuffer` and `Atomics` are needed

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- `JSON.stringify`: dropped values, `toJSON`, replacer, `space`, cycles, BigInt → 010
- `JSON.parse` revivers; `context.source`, `JSON.rawJSON`, `JSON.isRawJSON` → 020
- `ArrayBuffer`, typed array views, `DataView`, endianness → 030
- Resizable buffers, `transfer`, detached buffers → 040
- `Uint8Array` base64 and hex (`toBase64`, `fromBase64`, `toHex`, `fromHex`) → 040
- `Float16Array`, `Math.f16round` → 040
- `SharedArrayBuffer`, cross-origin isolation, `Atomics` (`wait`, `waitAsync`, `notify`, `pause`) → 050
- The memory model and data races → 060

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [What does `JSON.stringify` drop or change?](010-json-stringify-edge-cases.md) | medium | 🟡 draft |
| 020 | [How do `JSON.parse` revivers work, and what does source text access add?](020-json-parse-reviver.md) | medium | 🟡 draft |
| 030 | [What are `ArrayBuffer`, typed arrays, and `DataView`?](030-arraybuffer-typed-arrays.md) | medium | 🟡 draft |
| 040 | [What's new in binary data?](040-modern-binary-data.md) | medium | 🟡 draft |
| 050 | [What are `SharedArrayBuffer` and `Atomics` for?](050-sharedarraybuffer-atomics.md) | hard | 🟡 draft |
| 060 | [What does JavaScript's memory model guarantee when threads race on shared memory?](060-memory-model-data-races.md) | hard | 🟡 draft |
<!-- generated:questions:end -->

## Sources

- **Spec:** [JSON object](https://tc39.es/ecma262/#sec-json-object) · [ArrayBuffer objects](https://tc39.es/ecma262/#sec-arraybuffer-objects) · [Uint8Array objects](https://tc39.es/ecma262/#sec-uint8array) · [Atomics](https://tc39.es/ecma262/#sec-atomics-object)
- **MDN:** [JSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON) · [Typed arrays guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Typed_arrays) · [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) · [SharedArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer)
