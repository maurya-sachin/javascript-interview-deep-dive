# 10 — Web Components

> **Status:** 🔴 planned · **Published:** 0/5 · **Last verified:** —

The platform's component model: custom elements and their lifecycle, shadow DOM encapsulation, templates and slots, declarative shadow DOM, and custom elements that join forms.

## Learning goals

After this chapter you can:

- Define a custom element and handle upgrades
- Say what shadow DOM encapsulates and what still crosses the boundary
- Compose content into a component with slots
- Server-render a component with declarative shadow DOM

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Custom elements: `customElements.define()`, lifecycle callbacks, upgrades, autonomous vs customized built-ins → 010
- Shadow DOM: style encapsulation, what inherits in, `:host`, `::part()`, event retargeting → 020
- `<template>` and `<slot>`: inert content, slot assignment, `slotchange` → 030
- Declarative shadow DOM: `shadowrootmode`, server rendering → 040
- Form-associated custom elements: `ElementInternals`, `formAssociated` → 050

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [How do custom elements work, including their lifecycle and upgrades?](010-custom-elements.md) | medium | 🟡 draft |
| 020 | [What does shadow DOM encapsulate, and what crosses the boundary?](020-shadow-dom-encapsulation.md) | medium | 🟡 draft |
| 030 | [How do `<template>` and `<slot>` work?](030-templates-and-slots.md) | medium | 🟡 draft |
| 040 | [What is declarative shadow DOM, and why does it matter for server rendering?](040-declarative-shadow-dom.md) | medium | 🟡 draft |
| 050 | [How can a custom element take part in a form?](050-form-associated-elements.md) | hard | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- [HTML — Custom elements](https://html.spec.whatwg.org/multipage/custom-elements.html)
- [DOM — Shadow trees](https://dom.spec.whatwg.org/#shadow-trees)
- [HTML — The `template` element](https://html.spec.whatwg.org/multipage/scripting.html#the-template-element)
- [HTML — The `slot` element](https://html.spec.whatwg.org/multipage/scripting.html#the-slot-element)
- [HTML — `ElementInternals`](https://html.spec.whatwg.org/multipage/custom-elements.html#the-elementinternals-interface)
