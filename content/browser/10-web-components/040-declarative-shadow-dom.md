---
title: "What is declarative shadow DOM, and why does it matter for server rendering?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [web-components, declarative-shadow-dom, shadowrootmode, ssr, hydration]
related:
  - browser/web-components/shadow-dom-encapsulation
  - browser/web-components/templates-and-slots
  - browser/web-components/custom-elements
  - browser/the-dom/innerhtml-textcontent-innertext
verified: 2026-10
perishable:
  - "shadowrootmode: Chrome 111+, Firefox 123+, Safari 16.4+"
  - "setHTMLUnsafe(): Chrome 124+, Firefox 123+, Safari 26+"
sources:
  - https://html.spec.whatwg.org/multipage/scripting.html#attr-template-shadowrootmode
  - https://html.spec.whatwg.org/multipage/parsing.html#parsing-main-inhead
  - https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#fragment-parser-mode
  - https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-element-sethtmlunsafe
  - https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-parsehtmlunsafe
  - https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-element-gethtml
  - https://html.spec.whatwg.org/multipage/custom-elements.html#dom-elementinternals-shadowroot
  - https://dom.spec.whatwg.org/#concept-attach-a-shadow-root
  - https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/template#browser_compatibility
tldr: >
  `<template shadowrootmode="open">` inside an element makes the HTML parser attach a shadow root
  to that element and parse the template's content into it. Components render with their
  encapsulated markup and styles before any JavaScript loads; scripts later attach behaviour to the
  existing root. Only the document parser and `setHTMLUnsafe()`/`parseHTMLUnsafe()` do this, not
  `innerHTML`.
---

## Answer

Shadow roots used to exist only through `attachShadow()`, so a component had no shadow content until its JavaScript ran: server-rendered HTML couldn't contain it, and the first paint showed nothing or unstyled light DOM.

Declarative shadow DOM puts the shadow root in the markup:

```html
<user-card>
  <template shadowrootmode="open">
    <style>h2 { margin: 0; }</style>
    <h2><slot name="name"></slot></h2>
  </template>
  <span slot="name">Ada</span>
</user-card>
```

When the parser meets the `<template shadowrootmode>` start tag, it attaches a shadow root (`open` or `closed`) to the parent element and parses the template's content straight into it. No `<template>` remains in the DOM. Optional attributes map to `attachShadow()` options: `shadowrootdelegatesfocus`, `shadowrootclonable`, `shadowrootserializable`.

**Why it matters for server rendering:**

- The component's markup and scoped styles paint with the HTML, with no JavaScript, and stream in as they arrive.
- **Hydration** becomes attaching behaviour: when the definition loads, the upgraded element finds its root in `this.shadowRoot` (or, for a closed root, `this.attachInternals().shadowRoot`) and adds listeners instead of re-rendering.
- Serialization is symmetric: `element.getHTML({ serializableShadowRoots: true })` emits `<template shadowrootmode>` for roots marked serializable, so a server-side DOM can produce it.

**Where it applies.** The document parser, `Element.setHTMLUnsafe()` and `Document.parseHTMLUnsafe()` attach declarative roots. `innerHTML`, `insertAdjacentHTML()` and `DOMParser` don't: the `<template>` stays an ordinary template. MDN's data lists `shadowrootmode` in Chrome 111, Firefox 123 and Safari 16.4.

Calling `attachShadow()` with the same mode on a host that has a declarative root returns that root, but empties it first.

## Example

```html
<like-button>
  <template shadowrootmode="open">
    <button><slot></slot> <span>3</span></button>
  </template>
  Likes
</like-button>
<script type="module">
  const host = document.querySelector('like-button');
  console.log(host.shadowRoot.innerHTML.trim(), host.querySelector('template'));
  // → <button><slot></slot> <span>3</span></button> null
  customElements.define('like-button', class extends HTMLElement {
    constructor() {
      super();
      const root = this.shadowRoot ?? this.attachShadow({ mode: 'open' }); // keep the server's root
      const count = root.querySelector('span');
      root.querySelector('button').onclick = () => { count.textContent = Number(count.textContent) + 1; };
    }
  });
  host.shadowRoot.querySelector('button').click();
  console.log(host.shadowRoot.querySelector('span').textContent);
  // → 4
  const markup = '<div><template shadowrootmode="open">Hi</template></div>';
  const viaInnerHTML = document.createElement('div');
  viaInnerHTML.innerHTML = markup;
  const viaSetHTMLUnsafe = document.createElement('div');
  viaSetHTMLUnsafe.setHTMLUnsafe(markup);
  console.log(viaInnerHTML.firstChild.shadowRoot, viaSetHTMLUnsafe.firstChild.shadowRoot.innerHTML);
  // → null Hi
</script>
```

Chrome 156 and Firefox 159 logged the same; Chrome also warned in the console that `innerHTML` doesn't parse declarative shadow roots.

## Pitfalls

- Calling `this.attachShadow()` unconditionally while hydrating. On a declarative root it removes the server-rendered children (and a different mode throws `NotSupportedError`); check `this.shadowRoot` or `internals.shadowRoot` first.
- Defining the element before the parser reaches it. The constructor then runs before the `<template>` child is parsed, so no root exists yet; if it calls `attachShadow()`, the template that follows stays an ordinary `<template>`. Define components from a module script or after the markup.
- Inserting server-rendered fragments with `innerHTML` or `fetch()` + `DOMParser`. The templates stay inert; use `setHTMLUnsafe()` for trusted markup. `setHTML()`'s default sanitizer removed the template entirely in Chrome 156 and Firefox 159.
- Expecting `getHTML({ serializableShadowRoots: true })` to include every root. Only roots created with `shadowrootserializable` (or `serializable: true`) are emitted; pass specific roots with `getHTML({ shadowRoots: [root] })`.

## Follow-ups

**Q:** What happens with two `<template shadowrootmode>` children?
**A:** The first attaches the root. The host is then already a shadow host, so the second is inserted as an ordinary `<template>`; Chrome 156 logs "A second declarative shadow root cannot be created on a host."

**Q:** Does every instance repeat its styles?
**A:** Yes, each declarative root carries its own `<style>` or `<link rel="stylesheet">`, so server output grows with every instance. After hydration, components can switch to one shared sheet through `adoptedStyleSheets`.

**Q:** Does `cloneNode()` copy a declarative shadow root?
**A:** Only with `shadowrootclonable`. In Chrome 156 and Firefox 159 a clone of a host without it had `shadowRoot` `null`.

**Q:** Can a top-level `<template shadowrootmode>` attach a root to the element you call `setHTMLUnsafe()` on?
**A:** No. The parser uses the template's parent, never the context element, so `div.setHTMLUnsafe('<template shadowrootmode="open">…')` leaves a plain `<template>` child.
