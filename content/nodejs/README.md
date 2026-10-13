# Node.js runtime

> **Track:** Backend
> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

What Node.js adds around the language: libuv, its event-loop phases, the module systems, streams, and the process model.
Backend and full-stack interviews probe this layer to see whether you know what actually blocks, what runs when, and why.

## Scope

- **In:** Node's architecture (V8 + libuv), event-loop phases and `process.nextTick`, CommonJS internals and ESM interop, core modules (`fs`, `stream`, `buffer`, `events`, `child_process`, `worker_threads`), processes and signals, diagnostics.
- **Out:** the language → [JavaScript](../javascript/) · building HTTP services → [Backend patterns](../backend-patterns/) · npm and package managers → [Tooling](../tooling/) · the built-in test runner → [Testing](../testing/).

## Prerequisites

[JavaScript](../javascript/) — especially modules and the event loop chapter.

## Chapters

<!-- generated:chapters:start -->
| # | Chapter | Status |
|---|---|---|
<!-- generated:chapters:end -->

## Not yet mapped

Areas this topic owns that have no chapter yet. Move an item into a chapter's sub-topics when the chapter exists.

- Architecture: V8, libuv, the thread pool, which work is offloaded and which blocks
- Event loop: phases, `process.nextTick` vs microtasks, `setImmediate` vs `setTimeout`
- Modules: CommonJS wrapper and cache, resolution algorithm, ESM loader, `require(esm)`, `package.json` `exports`
- Streams: readable, writable, transform, backpressure, `pipeline`, web streams interop
- Buffers and binary data in Node
- `EventEmitter` and error-handling conventions
- File system: sync vs callback vs promise APIs, file handles, watching
- Concurrency: child processes, `worker_threads`, `cluster`
- Process: `process` object, signals, exit codes, graceful shutdown, environment
- Diagnostics: inspector, heap snapshots, CPU profiles, `AsyncLocalStorage`
- Running TypeScript natively (type stripping)

## Sources

- [Node.js API docs](https://nodejs.org/docs/latest/api/)
- [Node.js Learn](https://nodejs.org/en/learn) — official guides, including the event loop
- [libuv docs](https://docs.libuv.org/)
- [nodejs/node](https://github.com/nodejs/node) — source and issues, for confirming edge cases
