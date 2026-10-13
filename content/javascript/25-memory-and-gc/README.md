# 25 — Memory and garbage collection

> **Status:** 🔴 planned · **Published:** 0/4 · **Last verified:** —

Reachability-based garbage collection, how leaks happen and how to find them, and how V8's collector works.

## Learning goals

After this chapter you can:

- Explain reachability and mark-and-sweep
- Find a memory leak with heap snapshots
- Explain why `WeakRef` and finalizers are non-deterministic
- Describe V8's generational collector

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Reachability, roots, mark-and-sweep; why not reference counting → 010
- Leak sources: globals, closures, timers, listeners, detached DOM, unbounded caches → 020
- Heap snapshots and allocation timelines → 020
- `WeakRef`, `FinalizationRegistry`, non-determinism → 030
- Young and old generations, scavenger, mark-compact, concurrent marking (Orinoco) → 040
- Heap limits (`--max-old-space-size`) → 020

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [How does garbage collection work in JavaScript?](010-garbage-collection.md) | medium | 🟡 draft |
| 020 | [What causes memory leaks, and how do you find them?](020-memory-leaks.md) | medium | 🟡 draft |
| 030 | [What are `WeakRef` and `FinalizationRegistry`, and why use them rarely?](030-weakref-finalizationregistry.md) | hard | 🟡 draft |
| 040 | [How does V8's generational GC work?](040-v8-generational-gc.md) | hard | 🟡 draft |
<!-- generated:questions:end -->

## Sources

- **Spec:** [Managing memory](https://tc39.es/ecma262/#sec-managing-memory) · [WeakRef objects](https://tc39.es/ecma262/#sec-weak-ref-objects) · [FinalizationRegistry objects](https://tc39.es/ecma262/#sec-finalization-registry-objects)
- **V8:** [Trash talk: the Orinoco garbage collector](https://v8.dev/blog/trash-talk)
- **Chrome:** [Fix memory problems](https://developer.chrome.com/docs/devtools/memory-problems)
- **MDN:** [Memory management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management) · [WeakRef](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef) · [FinalizationRegistry](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry)
