# 02 — Events

> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

How the DOM delivers events: the dispatch path and its phases, delegation, default actions, listener options, custom events, timing relative to microtasks, and choosing input events.

## Learning goals

After this chapter you can:

- Trace an event through capture, target and bubble phases
- Write delegated handlers and know which events defeat them
- Cancel a default action without stopping propagation, and the reverse
- Explain why a dispatched event and a user click run microtasks at different points

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Dispatch path, capture/target/bubble, `eventPhase`, `composedPath()` → —
- Event delegation; events that don't bubble (`focus` vs `focusin`); `closest()` on the target → —
- `preventDefault()`, `stopPropagation()`, `stopImmediatePropagation()`; cancelable events, `defaultPrevented` → —
- Listener options `once`, `passive`, `capture`, `signal`; `on*` handler properties vs `addEventListener()` → —
- `CustomEvent` and `detail`, extending `EventTarget`, `isTrusted` → —
- Synchronous `dispatchEvent()` vs user-generated events; microtask checkpoints between listeners → —
- Input events: pointer vs mouse vs touch, `key` vs `code`, `beforeinput`/`input`, composition → —

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
<!-- generated:questions:end -->

## Sources

- [DOM — Events](https://dom.spec.whatwg.org/#events)
- [DOM — Dispatching events](https://dom.spec.whatwg.org/#dispatching-events)
- [DOM — `addEventListener()`](https://dom.spec.whatwg.org/#dom-eventtarget-addeventlistener)
- [DOM — Interface `CustomEvent`](https://dom.spec.whatwg.org/#interface-customevent)
- [Pointer Events](https://w3c.github.io/pointerevents/)
- [UI Events](https://w3c.github.io/uievents/)
- [Input Events](https://w3c.github.io/input-events/)
