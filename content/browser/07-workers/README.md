# 07 — Workers

> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

Running script off the main thread: dedicated workers, what `postMessage` can send, the service worker lifecycle and fetch interception, and talking between tabs.

## Learning goals

After this chapter you can:

- Move work to a worker and say what it can't touch
- Send data to a worker by copy or by transfer
- Ship a service worker update without breaking open tabs
- Pick a caching strategy for a service worker

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Dedicated workers: scope, what they can access, module workers, start-up cost → —
- `postMessage()`: structured clone, transferable objects, what can't be cloned → —
- Service worker lifecycle: register, install, waiting, activate, `skipWaiting()`, `clients.claim()`, updates → —
- Fetch interception, the Cache API, caching strategies, navigation preload → —
- Cross-tab communication: `BroadcastChannel`, `SharedWorker`, Web Locks → —

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
<!-- generated:questions:end -->

## Sources

- [HTML — Workers](https://html.spec.whatwg.org/multipage/workers.html)
- [HTML — Structured clone](https://html.spec.whatwg.org/multipage/structured-data.html#structured-clone)
- [HTML — Web messaging](https://html.spec.whatwg.org/multipage/web-messaging.html)
- [Service Workers](https://w3c.github.io/ServiceWorker/)
