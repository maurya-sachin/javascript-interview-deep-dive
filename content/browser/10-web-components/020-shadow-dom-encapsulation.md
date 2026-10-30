---
title: "What does shadow DOM encapsulate, and what crosses the boundary?"
status: draft
difficulty: medium
frequency: 4
core: true
tags: [web-components, shadow-dom, encapsulation, host, part, retargeting]
related:
  - browser/web-components/custom-elements
  - browser/web-components/templates-and-slots
  - browser/events/event-dispatch-phases
  - browser/events/custom-events
  - browser/the-dom/querying-and-traversal
  - html-and-css/the-cascade/inheritance-and-global-keywords
  - html-and-css/the-cascade/cascade-sort-order
  - html-and-css/modern-css/custom-properties
verified: 2026-10
perishable:
  - ":host-context() works only in Chromium; Firefox 159 rejects it"
sources:
  - https://dom.spec.whatwg.org/#shadow-trees
  - https://dom.spec.whatwg.org/#dom-element-attachshadow
  - https://dom.spec.whatwg.org/#valid-shadow-host-name
  - https://dom.spec.whatwg.org/#retarget
  - https://dom.spec.whatwg.org/#dom-event-composed
  - https://drafts.csswg.org/css-shadow-1/#host-selector
  - https://drafts.csswg.org/css-shadow-1/#part
  - https://drafts.csswg.org/css-cascade-5/#cascade-context
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:host-context#browser_compatibility
tldr: >
  A shadow root is a separate node tree attached to a host. Outside selectors and
  `querySelector()` don't reach into it, its styles don't leak out, and its ids are its own. What
  crosses: inherited properties and custom properties flow in, `::part()` styles exposed elements,
  page rules on the host beat `:host`, and composed events leave it retargeted to the host.
---

## Answer

`element.attachShadow({ mode: 'open' })` gives the element (the *host*) a shadow root: a separate node tree that's rendered in place of the host's children. Only custom elements and a short list of built-ins (`div`, `span`, `p`, `section`, `article`, headings and a few more) can host one; `<input>` or `<img>` throw `NotSupportedError`.

**Encapsulated:**

- **DOM.** `document.querySelector()` and `closest()` stop at the boundary, and ids are scoped per tree, so `getElementById()` and `<label for>` can't reach inside.
- **Selectors, both ways.** A page rule `p { … }` doesn't match a `<p>` in the shadow tree, and the component's `p { … }` doesn't match the page's.

**Crosses the boundary:**

- **Inheritance.** The shadow tree inherits from the host, so `color`, `font` and other inherited properties flow in. So do custom properties, which is why `--accent` variables are the usual theming API.
- **The host itself.** Inside, `:host` and `:host(.compact)` style the host; outside rules on the host win over `:host` unless `:host` uses `!important`.
- **Parts.** Elements marked `part="title"` can be styled from outside with `x-card::part(title)`.
- **Slotted content.** Light-DOM children placed with `<slot>` keep the page's styles; inside, `::slotted()` adds to them.
- **Events.** Events created with `composed: true` (most UI events, such as `click`, `input` and `focus`) leave the shadow tree. Listeners outside see `event.target` *retargeted* to the host. Events without `composed`, including your own `CustomEvent`s by default, stop at the shadow root.

`mode: 'closed'` only makes `host.shadowRoot` return `null`; the code that called `attachShadow()` still has the root. It's not a security boundary: same-page scripts can patch `attachShadow` and capture it.

## Example

```html
<style>
  body { color: rgb(0, 128, 0); --accent: rgb(255, 0, 0); }
  p { border: 2px solid; }
  x-card { padding: 3px; }
  x-card::part(title) { letter-spacing: 2px; }
</style>
<x-card></x-card>
<script>
  const host = document.querySelector('x-card');
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
    <style>:host { display: block; padding: 10px; } p { background: var(--accent); }</style>
    <p part="title">Title</p>`;
  const p = root.querySelector('p');
  const style = getComputedStyle(p);
  console.log(style.color, style.backgroundColor); // inherited; custom property
  // → rgb(0, 128, 0) rgb(255, 0, 0)
  console.log(style.borderTopWidth, style.letterSpacing); // page `p` rule doesn't match; ::part does
  // → 0px 2px
  console.log(getComputedStyle(host).paddingTop); // the page's rule beats :host
  // → 3px
  console.log(document.querySelector('x-card p'));
  // → null
  document.addEventListener('click', (e) => console.log(e.target === host, e.composedPath()[0] === p));
  p.click();
  // → true true
</script>
```

Chrome 156 and Firefox 159 logged the same.

## Pitfalls

- Expecting page CSS (resets, utility classes, a design system's global sheet) to style the component's internals. Only inherited properties, custom properties and `::part()` get in.
- Listening on the page for events that aren't composed. A `new CustomEvent('change', { bubbles: true })` dispatched inside never leaves, and neither does a native `change` from an inner `<input>` (`composed` is `false` in Chrome 156 and Firefox 159). Re-dispatch on the host.
- Writing `:host { display: block }` and wondering why a page rule wins. Normal outer declarations beat `:host` regardless of specificity; that's the cascade's context step, not a bug.
- Treating `mode: 'closed'` as privacy or security. It hides `shadowRoot` and some `composedPath()` entries, nothing more, and makes testing harder.

## Follow-ups

**Q:** How does a component stop the page's inherited styles getting in?
**A:** `:host { all: initial; }` resets every property on the host, including inherited ones, so its tree starts from initial values. Custom properties are unaffected by `all`, so theming still works.

**Q:** Where does focus go when an element inside a shadow root is focused?
**A:** `document.activeElement` is the host (retargeted); `shadowRoot.activeElement` is the inner element. `:focus` matches both the inner element and the host, and `:focus-within` matches ancestors outside.

**Q:** Can `::part()` reach nested elements?
**A:** Only exposed ones. `x-card::part(title) span` is an invalid selector, and a part of a nested component must be forwarded with `exportparts` to be styleable from outside. Pseudo-classes like `::part(title):hover` and pseudo-elements like `::part(title)::before` are allowed.

## Deep dive

### How it works

A shadow root is a `DocumentFragment` whose *host* is an element. The document tree and each shadow tree are separate node trees; the browser renders the *flat tree*, in which the host's shadow tree replaces its children and each `<slot>` is replaced by the light-DOM nodes assigned to it. Selectors match within one tree, which is why encapsulation holds both ways, while inheritance follows the flat tree: a shadow tree's top-level elements inherit from the host, and slotted elements inherit from their slot.

**Cascade.** CSS Cascade 5 adds *context* as a sort criterion, after origin and importance and before inline styles, layers and specificity. For normal declarations the outer tree wins; for `!important` the inner tree wins. So a component's `:host { padding: 10px }` is a default the page can override with `x-card { padding: 3px }`, while `:host { padding: 10px !important }` beats even a page rule marked `!important`. Chrome 156 and Firefox 159 resolved both cases that way.

**Shadow selectors:**

- `:host` matches the host from inside its shadow tree, `:host(.compact)` only when the host matches `.compact`.
- `:host-context(.dark)` matches when the host or any shadow-including ancestor matches. Only Chromium supports it: Firefox 159 rejects it as invalid, and MDN's data lists no Safari support. Use a custom property or a host attribute instead.
- `::slotted(<compound>)` matches top-level slotted elements only (see templates and slots).
- `::part(name)` matches elements with that `part` from outside, can be followed by state pseudo-classes and pseudo-elements, but not by combinators.

**Events.** Dispatch builds the event path with each target's *get the parent*: a shadow root's parent is its host unless the event isn't composed and the root is where the event started. So non-composed events end at the shadow root. For each listener, the browser *retargets* `event.target` against the listener's tree: it walks up from the real target, replacing it with the host of each shadow root the listener can't see into.

```js
// <x-box> with a shadow root containing <button id="b">
const button = root.getElementById('b');
document.addEventListener('ping', (e) => console.log('document', e.target.localName));
root.addEventListener('ping', (e) => console.log('root', e.target.id));
button.dispatchEvent(new CustomEvent('ping', { bubbles: true }));
// → root b
button.dispatchEvent(new CustomEvent('ping', { bubbles: true, composed: true }));
// → root b
// → document x-box
```

`focus` and `blur` are composed but don't bubble: a capturing listener on `document` sees `focus` with `target` the host, and a listener on the host runs because the retargeted event is at its target there. `focusin` and `focusout` are composed and bubble.

### Edge cases

- **Closed roots in `composedPath()`.** For a listener outside, nodes inside a closed shadow root are left out: the path starts at the host. With an open root the path starts at the inner node.
- **One root per element.** Calling `attachShadow()` again throws `NotSupportedError`, except on a declarative shadow root of the same mode (see declarative shadow DOM).
- **IDs and ARIA.** Id references (`for`, `aria-labelledby`, `aria-describedby`) don't cross the boundary in either direction, which is an accessibility problem for form controls inside components.
- **Shared styles.** `root.adoptedStyleSheets = [sheet]` with a constructed `CSSStyleSheet` shares one parsed sheet across every instance instead of a `<style>` per shadow root.

### Real-world scenario

A design system ships `<ds-button>` used by apps with their own CSS. The app's resets can't break the button's internals, but the app still needs theming. The component exposes custom properties (`--ds-button-bg`) for colours and spacing, `part="label"` for the rare structural override, and documents both as its public styling API. Anything else is internal and can change without breaking consumers.

### Trade-offs

- **Isolation vs reuse.** Utility CSS and global typography don't apply inside, so components either duplicate them, adopt shared sheets, or rely on inherited properties.
- **Open vs closed.** Open roots let tests, devtools extensions and integrations inspect the component; closed roots buy little. Most libraries use `open`.
- **Shadow DOM vs light DOM.** Some components skip shadow DOM to keep page styles and id references working, accepting that their markup is unprotected.
