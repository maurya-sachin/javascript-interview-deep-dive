# 10 — Web Components

> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

The platform's component model: custom elements and their lifecycle, shadow DOM encapsulation, templates and slots, declarative shadow DOM, and custom elements that join forms.

## Learning goals

After this chapter you can:

- Define a custom element and handle upgrades
- Say what shadow DOM encapsulates and what still crosses the boundary
- Compose content into a component with slots
- Server-render a component with declarative shadow DOM

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Custom elements: `customElements.define()`, lifecycle callbacks, upgrades, autonomous vs customized built-ins → —
- Shadow DOM: style encapsulation, what inherits in, `:host`, `::part()`, event retargeting → —
- `<template>` and `<slot>`: inert content, slot assignment, `slotchange` → —
- Declarative shadow DOM: `shadowrootmode`, server rendering → —
- Form-associated custom elements: `ElementInternals`, `formAssociated` → —

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
<!-- generated:questions:end -->

## Sources

- [HTML — Custom elements](https://html.spec.whatwg.org/multipage/custom-elements.html)
- [DOM — Shadow trees](https://dom.spec.whatwg.org/#shadow-trees)
- [HTML — The `template` element](https://html.spec.whatwg.org/multipage/scripting.html#the-template-element)
- [HTML — The `slot` element](https://html.spec.whatwg.org/multipage/scripting.html#the-slot-element)
- [HTML — `ElementInternals`](https://html.spec.whatwg.org/multipage/custom-elements.html#the-elementinternals-interface)
