---
title: "How do `<template>` and `<slot>` work?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [web-components, template, slot, slotchange, shadow-dom]
related:
  - browser/web-components/shadow-dom-encapsulation
  - browser/web-components/declarative-shadow-dom
  - browser/the-dom/dom-tree-and-node-types
  - browser/observers/mutation-observer
verified: 2026-10
sources:
  - https://html.spec.whatwg.org/multipage/scripting.html#the-template-element
  - https://html.spec.whatwg.org/multipage/scripting.html#template-contents
  - https://html.spec.whatwg.org/multipage/scripting.html#the-slot-element
  - https://html.spec.whatwg.org/multipage/scripting.html#dom-slot-assign
  - https://dom.spec.whatwg.org/#find-slotables
  - https://dom.spec.whatwg.org/#find-flattened-slotables
  - https://dom.spec.whatwg.org/#signal-a-slot-change
  - https://dom.spec.whatwg.org/#notify-mutation-observers
  - https://drafts.csswg.org/css-shadow-1/#slotted-pseudo
tldr: >
  `<template>` content is parsed into an inert `DocumentFragment` (`template.content`): not rendered,
  no scripts or images, until you clone it into the page. `<slot>` is a placeholder in a shadow tree
  where the host's children render: `slot="name"` children go to the named slot, everything else to
  the default slot. Unmatched children aren't rendered; `slotchange` reports reassignment.
---

## Answer

**`<template>`** holds markup that isn't part of the page. The parser puts its children into `template.content`, a `DocumentFragment` owned by a separate *inert* document with no browsing context: nothing renders, `<script>`s don't run, images don't load, custom elements aren't upgraded, and `document.querySelector()` doesn't see it. You stamp copies with `template.content.cloneNode(true)` or `document.importNode(template.content, true)`; each copy becomes live when inserted, so its scripts and images run per copy. Parsing once and cloning many times is the point.

**`<slot>`** lives in a shadow tree and marks where the host's own children (its *light DOM*) are rendered:

- A child with `slot="title"` goes to the first `<slot name="title">`.
- Every other child, including text and whitespace text nodes, goes to the *default slot*, the first `<slot>` without a name.
- Only direct children of the host are slotted; a `slot` attribute deeper down is ignored.
- A child that matches no slot isn't rendered, though it stays in the DOM.
- A slot's own children are *fallback content*, rendered only when nothing is assigned to it.

Slotted nodes aren't moved: they stay in the light DOM, so page styles and queries still apply to them. Inside, `::slotted(<compound>)` styles them, but only top-level slotted elements, and outer page rules win over it. Events from slotted nodes travel through the slot, then up the shadow tree to the host.

From script, `slot.assignedNodes()` (all nodes) and `slot.assignedElements()` (elements only) list the assignment, `{ flatten: true }` resolves nested slots and fallback, and `node.assignedSlot` goes the other way. The `slotchange` event fires on a slot when its assigned nodes change, in a microtask; it bubbles but isn't composed. With `attachShadow({ slotAssignment: 'manual' })`, the component chooses instead: `slot.assign(node1, node2)`.

## Example

```html
<template id="card-tpl">
  <h2><slot name="title">Untitled</slot></h2>
  <slot>No content</slot>
</template>
<x-card><span slot="title">Hi</span>Text <p>More</p><em slot="note">Lost</em></x-card>
<x-card><span slot="title">Hi</span></x-card>
<script>
  for (const host of document.querySelectorAll('x-card')) {
    const root = host.attachShadow({ mode: 'open' });
    root.append(document.getElementById('card-tpl').content.cloneNode(true));
    root.addEventListener('slotchange', (e) => console.log('slotchange', e.target.name || 'default'));
  }
  const [full, short] = document.querySelectorAll('x-card');
  const [title, body] = full.shadowRoot.querySelectorAll('slot');
  console.log(title.assignedElements().map((el) => el.localName).join());
  // → span
  console.log(body.assignedNodes().map((node) => node.nodeName).join());
  // → #text,P
  console.log(body.assignedElements().map((el) => el.localName).join());
  // → p
  console.log(full.querySelector('em').assignedSlot, full.querySelector('em').checkVisibility());
  // → null false
  const shortBody = short.shadowRoot.querySelectorAll('slot')[1];
  console.log(shortBody.assignedNodes().length, shortBody.assignedNodes({ flatten: true })[0].data);
  // → 0 No content
  // Then, in a microtask:
  // → slotchange title
  // → slotchange default
  // → slotchange title
</script>
```

Chrome 156 and Firefox 159 logged the same. The `<em>` names a slot that doesn't exist, so it isn't rendered.

## Pitfalls

- Expecting fallback content when the host's markup is indented. `<x-card>⏎  <span slot="title">…</span>⏎</x-card>` assigns two whitespace text nodes to the default slot, so its fallback doesn't render.
- Expecting `::slotted(p)` to beat the page's `p` rules or reach descendants. Slotted elements belong to the outer tree, whose normal styles win; `::slotted(p span)` is invalid.
- Expecting `slotchange` when slotted content changes. It fires only when the *set* of assigned nodes changes; editing an assigned node's text or children needs a `MutationObserver`.
- Treating a template as harmless storage for untrusted markup. Its scripts and `onerror` handlers run as soon as a clone is inserted.

## Follow-ups

**Q:** When exactly does `slotchange` fire?
**A:** Assignment changes queue the mutation-observer microtask; in it, `MutationObserver` callbacks run first, then `slotchange` fires once per changed slot. Two `append()` calls in one task produce one `slotchange`. Chrome 156 and Firefox 159 followed that order.

**Q:** `cloneNode()` or `importNode()` for template content?
**A:** `cloneNode(true)` keeps the copy in the inert template document until it's inserted, so custom elements in it upgrade then. `document.importNode(content, true)` creates the copy in the page's document, so defined custom elements are upgraded immediately.

**Q:** What does manual slot assignment change?
**A:** The `slot` attribute is ignored; only nodes passed to `slot.assign()` are slotted, in the order given, and only while they're children of the host. Assigning another node doesn't throw, it just isn't slotted.

## Exercises

### Does the fallback render?

```html
<x-greet>
  <b slot="name">Ada</b>
</x-greet>
<!-- x-greet's shadow root: <slot name="name"></slot> <slot>Hello</slot> -->
```

**Answer:** No. The two whitespace text nodes around `<b>` are assigned to the default slot (`assignedNodes().length` is 2), so "Hello" isn't rendered; remove the whitespace or give the default slot something real.
