---
title: "How do custom elements work, including their lifecycle and upgrades?"
status: draft
difficulty: medium
frequency: 4
core: true
tags: [web-components, custom-elements, lifecycle-callbacks, upgrades, customized-built-ins]
related:
  - browser/the-dom/attributes-vs-properties
  - browser/observers/mutation-observer
  - browser/web-components/shadow-dom-encapsulation
  - browser/web-components/form-associated-elements
verified: 2026-10
perishable:
  - "moveBefore() and connectedMoveCallback: Chrome 133+, Firefox 144+, not Safari"
  - Customized built-in elements not supported in Safari
  - "Scoped registries: Chrome 146+, Firefox 159+, Safari 26+"
sources:
  - https://html.spec.whatwg.org/multipage/custom-elements.html#custom-element-conformance
  - https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name
  - https://html.spec.whatwg.org/multipage/custom-elements.html#dom-customelementregistry-define
  - https://html.spec.whatwg.org/multipage/custom-elements.html#dom-customelementregistry-upgrade
  - https://html.spec.whatwg.org/multipage/custom-elements.html#concept-upgrade-an-element
  - https://html.spec.whatwg.org/multipage/custom-elements.html#custom-element-reactions
  - https://html.spec.whatwg.org/multipage/custom-elements.html#preserving-custom-element-state-when-moved
  - https://dom.spec.whatwg.org/#concept-create-element
  - https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/define#browser_compatibility
  - https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/CustomElementRegistry#browser_compatibility
tldr: >
  A class extending `HTMLElement`, registered with `customElements.define('my-name', Class)`; the
  name needs a hyphen. The browser calls `connectedCallback`, `disconnectedCallback`,
  `adoptedCallback` and `attributeChangedCallback` (only for `observedAttributes`). Elements parsed
  before `define()` stay plain `HTMLElement`s until `define()` upgrades them, running the
  constructor on an element that already has attributes and children.
---

## Answer

A custom element is a class that extends `HTMLElement`, registered under a name: `customElements.define('star-rating', StarRating)`. The name must start with a lowercase ASCII letter, contain a hyphen and no uppercase letters, and can't be a reserved SVG/MathML name like `font-face`; otherwise `define()` throws `SyntaxError`. Defining a name or a class twice throws `NotSupportedError`.

The browser calls methods on the class, read once at `define()` time:

- **`constructor`**: `super()` first. Set up state, listeners, maybe a shadow root. Don't add attributes or children, and don't read them: with `createElement()` there are none yet.
- **`connectedCallback`**: on every insertion into a document. It can run many times, and during parsing it can run before the element's children exist.
- **`disconnectedCallback`**: on removal; undo what `connectedCallback` set up.
- **`attributeChangedCallback(name, old, new)`**: only for names in `static observedAttributes`, including the initial attributes, which arrive before `connectedCallback`.
- **`adoptedCallback`**: moved into another document.
- **`connectedMoveCallback`**: if present, a `moveBefore()` calls it instead of disconnect plus connect.

These are *custom element reactions*: they run just before the triggering DOM call returns, not batched in a microtask like `MutationObserver`.

**Upgrades.** A `<star-rating>` parsed before its definition exists is a plain `HTMLElement` matching `:not(:defined)`. `define()` upgrades every such element in the document, in tree order: it runs the constructor on the existing element, then `attributeChangedCallback` for its attributes, then `connectedCallback`. `customElements.whenDefined(name)` resolves then; `customElements.upgrade(root)` upgrades a detached subtree.

**Autonomous vs customized built-in.** `<star-rating>` is autonomous. A customized built-in extends a specific element (`class extends HTMLButtonElement`, `define(…, { extends: 'button' })`, used as `<button is="fancy-button">`), keeping its native behaviour. Safari doesn't support them, so in practice components are autonomous.

## Example

```js
// The page body contains <star-rating value="3"></star-rating>; this script runs after it.
class StarRating extends HTMLElement {
  static observedAttributes = ['value'];
  constructor() {
    super(); // must come first; don't add attributes or children here
    console.log('constructor', this.getAttribute('value'));
  }
  attributeChangedCallback(name, oldValue, newValue) {
    console.log('attributeChanged', name, oldValue, newValue);
  }
  connectedCallback() { console.log('connected', this.isConnected); }
  disconnectedCallback() { console.log('disconnected'); }
  get value() { return Number(this.getAttribute('value')); }
  set value(v) { this.setAttribute('value', v); } // reflect to the attribute
}

const el = document.querySelector('star-rating');
console.log(el instanceof StarRating, el.matches(':defined'));
// → false false
customElements.define('star-rating', StarRating); // upgrades el now
// → constructor 3
// → attributeChanged value null 3
// → connected true
el.value = 4;
// → attributeChanged value 3 4
document.body.append(el); // a move: removal, then insertion
// → disconnected
// → connected true
```

Chrome 156 and Firefox 159 logged the same. In the constructor `getAttribute('value')` is `'3'` only because this is an upgrade; `document.createElement('star-rating')` logs `constructor null`.

## Pitfalls

- Setting attributes or children in the constructor. `createElement()` and the parser don't throw: they report a `NotSupportedError` and give you an `HTMLUnknownElement` instead of your element.
- Forgetting `observedAttributes`: `attributeChangedCallback` never runs for an unlisted attribute.
- Treating `connectedCallback` as one-time setup. Every move runs it again (after `disconnectedCallback`), so guard one-time work and make cleanup symmetric.
- Assigning a property before the element is upgraded. The value lands as an own property that hides the class's setter, which then never runs.

## Follow-ups

**Q:** How do you avoid a flash of unstyled custom elements?
**A:** Style `star-rating:not(:defined)` (hide it or reserve its size) until the upgrade, or await `customElements.whenDefined('star-rating')` before revealing a container.

**Q:** When is `adoptedCallback` called?
**A:** When the element moves into another document, such as an iframe's or one from `document.implementation.createHTMLDocument()`. Chrome 156 and Firefox 159 called `disconnectedCallback`, `adoptedCallback(oldDocument, newDocument)`, then `connectedCallback`.

**Q:** Why do customized built-ins exist if autonomous elements work everywhere?
**A:** A `<button is="…">` keeps the button's focus, keyboard, form and accessibility behaviour for free, and degrades to a working button without JavaScript. An autonomous element must rebuild all of that, accessibility semantics included.

## Deep dive

### How it works

`define()` validates the name, then reads `prototype.connectedCallback`, `disconnectedCallback`, `connectedMoveCallback`, `adoptedCallback` and `attributeChangedCallback` once, plus the static `observedAttributes`, `formAssociated` and `disabledFeatures`. Methods added to the prototype later are never called; Chrome 156 and Firefox 159 both ignored a `connectedCallback` assigned after `define()`.

Callbacks don't run at arbitrary times. Each DOM method marked `[CEReactions]` (`setAttribute`, `append`, `innerHTML`…) pushes an element queue; the reactions it causes are queued there and invoked when the method returns. So `el.value = 5; console.log('after')` logs `attributeChanged` before `after`, while a `MutationObserver` on the same attribute reports later, in a microtask.

An element's *custom element state* is `"undefined"` before its definition exists, `"custom"` after a successful construction, and `"failed"` if construction threw; `:defined` matches every built-in element and every `"custom"` one. Upgrading an element queues an `attributeChangedCallback` for each observed attribute already present and a `connectedCallback` if it's in a document, then runs the constructor, so the queued callbacks run after it. `super()` returns the existing element instead of creating one.

Creation takes one of two paths:

- **Synchronous construction**: `createElement()` and the main-document parser call `new Class()` directly, then check the result. Any attribute, child, parent, wrong document or wrong local name fails the check with `NotSupportedError`. Neither path throws to its caller: the exception is reported and the element becomes an `HTMLUnknownElement` in the `"failed"` state.
- **Upgrade**: `innerHTML`, `insertAdjacentHTML()`, cloning and `define()` create the element first and construct it later, without those checks. That's why the same bad constructor works with `insertAdjacentHTML()` and fails with `createElement()`, which is a good reason to follow the rule rather than test your way around it.

### Edge cases

Properties set before the upgrade are the most common bug. A framework or script that does `el.user = data` while the element is still a plain `HTMLElement` creates an own data property. After the upgrade, that property shadows the class's accessor:

```js
const card = document.querySelector('user-card'); // not defined yet
card.user = 'Ada';

class UserCard extends HTMLElement {
  #user = null;
  get user() { return this.#user; }
  set user(value) { this.#user = value; /* render */ }
  connectedCallback() {
    console.log(Object.hasOwn(this, 'user'));
    // → true
    if (Object.hasOwn(this, 'user')) {
      const value = this.user;
      delete this.user; // remove the own property
      this.user = value; // now the setter runs
    }
  }
}
customElements.define('user-card', UserCard);
```

Without the fix the setter never runs, so nothing renders, yet `card.user` still returns `'Ada'`, which makes the bug hard to see.

Other cases:

- **Parsing order.** If the definition exists before the parser reaches `<early-el><span>…</span></early-el>`, the parser constructs it, applies attributes (firing `attributeChangedCallback`) and inserts it, so `connectedCallback` runs with zero children. Read children lazily, watch `slotchange`, or define the element after the markup.
- **Moves.** `parent.append(el)` on a connected element is a removal plus an insertion: `disconnectedCallback`, then `connectedCallback`. With `parent.moveBefore(el, null)` and a `connectedMoveCallback` method, only that method runs, so state like observers and focus survives. `moveBefore()` and the callback exist in Chrome 133+ and Firefox 144+, not Safari.
- **Stale callbacks.** The spec warns that a `connectedCallback` queued before the element was removed still runs, with `isConnected` already `false`. Check `isConnected` before doing connected-only work.

### Real-world scenario

A design system ships `<ui-tooltip>` and its pages render on the server. The bundle loads late, so for a moment every tooltip is an undefined element. Style `ui-tooltip:not(:defined)` to avoid a layout jump, accept configuration both as attributes (`observedAttributes`, reflected through getters and setters) and as properties for rich data, upgrade properties assigned early as shown above, and set up and tear down listeners on `document` in `connectedCallback`/`disconnectedCallback` so moving a tooltip doesn't leak handlers.

### Trade-offs

- **One global registry.** Two libraries defining `ui-button` collide: the second `define()` throws. Scoped registries (`new CustomElementRegistry()`, passed to `attachShadow({ customElementRegistry })`) let each shadow root use its own definitions; MDN's data lists them in Chrome 146, Firefox 159 and Safari 26, and both harness browsers resolved a scoped definition while the global registry stayed empty.
- **Customized built-ins.** The best fit for extending native controls, but Safari doesn't implement them, so there you need a polyfill or an autonomous element wrapping the native one.
- **Attributes vs properties.** Attributes are strings that work in HTML and server rendering; properties carry objects. Most components reflect primitive state to attributes and keep complex data as properties only.
