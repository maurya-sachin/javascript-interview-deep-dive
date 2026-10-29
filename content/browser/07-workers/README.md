# 07 — Workers

> **Status:** 🔴 planned · **Published:** 0/5 · **Last verified:** —

Running script off the main thread: dedicated workers, what `postMessage` can send, the service worker lifecycle and fetch interception, and talking between tabs.

## Learning goals

After this chapter you can:

- Move work to a worker and say what it can't touch
- Send data to a worker by copy or by transfer
- Ship a service worker update without breaking open tabs
- Pick a caching strategy for a service worker

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Dedicated workers: scope, what they can access, module workers, start-up cost → 010
- `postMessage()`: structured clone, transferable objects, what can't be cloned → 020
- Service worker lifecycle: register, install, waiting, activate, `skipWaiting()`, `clients.claim()`, updates → 030
- Fetch interception, the Cache API, caching strategies, navigation preload → 040
- Cross-tab communication: `BroadcastChannel`, `SharedWorker`, Web Locks → 050

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [What are Web Workers, and what can't they do?](010-web-workers.md) | medium | 🔴 planned |
| 020 | [What does `postMessage()` copy, what can it transfer, and what can't it send?](020-structured-clone-and-transfer.md) | medium | 🔴 planned |
| 030 | [How does the service worker lifecycle work, and how do updates reach users?](030-service-worker-lifecycle.md) | hard | 🔴 planned |
| 040 | [How does a service worker intercept requests, and which caching strategies are common?](040-service-worker-caching.md) | medium | 🔴 planned |
| 050 | [How do tabs of the same site talk to each other?](050-cross-tab-communication.md) | medium | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- [HTML — Workers](https://html.spec.whatwg.org/multipage/workers.html)
- [HTML — Structured clone](https://html.spec.whatwg.org/multipage/structured-data.html#structured-clone)
- [HTML — Web messaging](https://html.spec.whatwg.org/multipage/web-messaging.html)
- [Service Workers](https://w3c.github.io/ServiceWorker/)
