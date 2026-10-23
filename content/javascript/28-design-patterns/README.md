# 28 — Design patterns

> **Status:** 🔴 planned · **Published:** 0/4 · **Last verified:** —

The classic patterns as JavaScript actually expresses them: closures and modules instead of access modifiers, functions instead of factory classes, and events instead of hand-rolled callbacks.

## Learning goals

After this chapter you can:

- Explain what the module pattern solved and what ES modules took over from it
- Implement an event emitter and tell observer apart from publish/subscribe
- Build a singleton with a module and name the cases where it breaks (duplicate bundles, realms, tests)
- Choose between a factory function and a class

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Module pattern: IIFE closures, revealing module, ES module replacement → 010
- Observer and publish/subscribe; event emitters → 020
- Singleton: module instances, duplicate copies, testing cost → 030
- Factory functions vs classes → 040

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [What is the module pattern, and what did ES modules take over from it?](010-module-pattern.md) | easy | 🟡 draft |
| 020 | [Implement an event emitter. How does observer differ from publish/subscribe?](020-observer-and-pub-sub.md) | medium | 🟡 draft |
| 030 | [How do you make a singleton in JavaScript, and when is one a mistake?](030-singleton.md) | medium | 🟡 draft |
| 040 | [Factory functions vs classes: when do you pick which?](040-factory-functions-vs-classes.md) | medium | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- **Spec:** [Modules](https://tc39.es/ecma262/#sec-modules)
- **Node.js:** [Events](https://nodejs.org/api/events.html)
- **MDN:** [EventTarget](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget) · [JavaScript modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
