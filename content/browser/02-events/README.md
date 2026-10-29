# 02 — Events

> **Status:** 🔴 planned · **Published:** 0/7 · **Last verified:** —

How the DOM delivers events: the dispatch path and its phases, delegation, default actions, listener options, custom events, timing relative to microtasks, and choosing input events.

## Learning goals

After this chapter you can:

- Trace an event through capture, target and bubble phases
- Write delegated handlers and know which events defeat them
- Cancel a default action without stopping propagation, and the reverse
- Explain why a dispatched event and a user click run microtasks at different points

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Dispatch path, capture/target/bubble, `eventPhase`, `composedPath()` → 010
- Event delegation; events that don't bubble (`focus` vs `focusin`); `closest()` on the target → 020
- `preventDefault()`, `stopPropagation()`, `stopImmediatePropagation()`; cancelable events, `defaultPrevented` → 030
- Listener options `once`, `passive`, `capture`, `signal`; `on*` handler properties vs `addEventListener()` → 040
- `CustomEvent` and `detail`, extending `EventTarget`, `isTrusted` → 050
- Synchronous `dispatchEvent()` vs user-generated events; microtask checkpoints between listeners → 060
- Input events: pointer vs mouse vs touch, `key` vs `code`, `beforeinput`/`input`, composition → 070

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [How does event dispatch work — capture, target, and bubble?](010-event-dispatch-phases.md) | medium | 🟡 draft |
| 020 | [What is event delegation, and when does it break?](020-event-delegation.md) | medium | 🟡 draft |
| 030 | [What's the difference between `preventDefault()`, `stopPropagation()`, and `stopImmediatePropagation()`?](030-default-actions-and-propagation.md) | easy | 🟡 draft |
| 040 | [What do the `once`, `passive`, `capture`, and `signal` listener options do?](040-listener-options.md) | medium | 🔴 planned |
| 050 | [How do you create and dispatch custom events, and what does `isTrusted` mean?](050-custom-events.md) | medium | 🔴 planned |
| 060 | [Is `dispatchEvent()` synchronous, and why do microtasks run differently for a real click?](060-dispatch-and-microtasks.md) | hard | 🔴 planned |
| 070 | [Which input events should you listen to — pointer, mouse, touch, keyboard, or `input`?](070-input-events.md) | medium | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- [DOM — Events](https://dom.spec.whatwg.org/#events)
- [DOM — Dispatching events](https://dom.spec.whatwg.org/#dispatching-events)
- [DOM — `addEventListener()`](https://dom.spec.whatwg.org/#dom-eventtarget-addeventlistener)
- [DOM — Interface `CustomEvent`](https://dom.spec.whatwg.org/#interface-customevent)
- [Pointer Events](https://w3c.github.io/pointerevents/)
- [UI Events](https://w3c.github.io/uievents/)
- [Input Events](https://w3c.github.io/input-events/)
