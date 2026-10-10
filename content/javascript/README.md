# JavaScript

> **Status:** 🔴 planned · **Published:** 0/150 · **Last verified:** —

The ECMAScript language, from values and types up to modules, memory, and the V8 engine.
Frontend, backend, and full-stack interviews all test this layer — frameworks and runtimes are built on it.

## Scope

- **In:** the language as ECMA-262 defines it, through ES2026 plus the Stage 4 proposals shipping in ES2027 (Temporal, `using`, new iterator methods); the spec model behind it; `Intl` basics (ECMA-402); V8 as the reference engine.
- **Out:** DOM, events, Web APIs, and the browser rendering loop → Browser runtime track · Node.js APIs, event-loop phases, and CommonJS internals → Node.js runtime track · static types → TypeScript track · frameworks → frontend track. These tracks are planned; links follow when their folders exist.
- **Not yet Stage 4:** covered by [How does a feature become part of JavaScript?](01-how-javascript-runs/020-tc39-process.md) and listed as gaps in the chapter that will own them.

## Prerequisites

None — this is the first track. It assumes you've written some JavaScript.

## Chapters

<!-- generated:chapters:start -->
| # | Chapter | Status |
|---|---|---|
| 01 | [How JavaScript runs](01-how-javascript-runs/) | 🔴 |
| 02 | [Values and types](02-values-and-types/) | 🔴 |
| 03 | [Numbers and BigInt](03-numbers-and-bigint/) | 🔴 |
| 04 | [Strings and Unicode](04-strings-and-unicode/) | 🔴 |
| 05 | [Coercion and equality](05-coercion-and-equality/) | 🔴 |
| 06 | [Operators and syntax](06-operators-and-syntax/) | 🔴 |
| 07 | [Scope, hoisting, and execution contexts](07-scope-and-execution-contexts/) | 🔴 |
| 08 | [Functions](08-functions/) | 🔴 |
| 09 | [Closures](09-closures/) | 🔴 |
| 10 | [`this`](10-this/) | 🔴 |
| 11 | [Objects and properties](11-objects-and-properties/) | 🔴 |
| 12 | [Prototypes and inheritance](12-prototypes/) | 🔴 |
| 13 | [Classes](13-classes/) | 🔴 |
| 14 | [Arrays](14-arrays/) | 🔴 |
| 15 | [Keyed collections](15-keyed-collections/) | 🔴 |
| 16 | [Iterators and generators](16-iterators-and-generators/) | 🔴 |
| 17 | [Promises](17-promises/) | 🔴 |
| 18 | [Async functions and the event loop](18-async-and-the-event-loop/) | 🔴 |
| 19 | [Errors and cleanup](19-errors-and-cleanup/) | 🔴 |
| 20 | [Modules](20-modules/) | 🔴 |
| 21 | [Metaprogramming](21-metaprogramming/) | 🔴 |
| 22 | [Regular expressions](22-regular-expressions/) | 🔴 |
| 23 | [Dates, Temporal, and Intl](23-dates-temporal-intl/) | 🔴 |
| 24 | [JSON and binary data](24-json-and-binary-data/) | 🔴 |
| 25 | [Memory and garbage collection](25-memory-and-gc/) | 🔴 |
| 26 | [Inside the engine](26-inside-the-engine/) | 🔴 |
<!-- generated:chapters:end -->

## Not yet mapped

Areas this topic owns that have no chapter yet. Move an item into a chapter's sub-topics when the chapter exists.

- Design patterns in JavaScript (module, observer/pub-sub, singleton, factory)
- Functional programming beyond composition (immutability, persistent data structures)

## Sources

- [ECMA-262](https://tc39.es/ecma262/) — the language specification (living draft)
- [ECMA-402](https://tc39.es/ecma402/) — the Internationalization API
- [TC39 proposals](https://github.com/tc39/proposals)
- [MDN JavaScript reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference)
- [V8 blog](https://v8.dev/blog)
- [test262](https://github.com/tc39/test262) — conformance tests, for confirming edge cases
