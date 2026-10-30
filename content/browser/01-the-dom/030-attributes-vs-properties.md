---
title: "What's the difference between an attribute and a property?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [dom, attributes, properties, reflection, form-controls, href]
related:
  - html-and-css/documents-and-semantics/global-attributes
  - browser/the-dom/dom-tree-and-node-types
  - browser/web-components/custom-elements
verified: 2026-10
sources:
  - https://dom.spec.whatwg.org/#concept-attribute
  - https://dom.spec.whatwg.org/#dom-element-setattribute
  - https://html.spec.whatwg.org/multipage/common-dom-interfaces.html#reflecting-content-attributes-in-idl-attributes
  - https://html.spec.whatwg.org/multipage/input.html#attr-input-value
  - https://html.spec.whatwg.org/multipage/input.html#dom-input-value-value
  - https://html.spec.whatwg.org/multipage/input.html#concept-input-checked-dirty-flag
  - https://html.spec.whatwg.org/multipage/links.html#dom-hyperlink-href
tldr: >
  An attribute is a name–string pair stored on the element, from markup or `setAttribute()`. A
  property is a JavaScript accessor on the element object. Most properties *reflect* an attribute
  and convert it: `href` returns the resolved URL, `disabled` a boolean. Form state breaks the
  mirror: `value` and `checked` are current state; their attributes are only defaults.
---

## Answer

The HTML Standard has two words for this. A **content attribute** is what you write in markup: a name and a string value stored on the element, read with `getAttribute()` and written with `setAttribute()`. An **IDL attribute** is a property defined on the element's interface, such as `input.maxLength`, implemented as a getter and setter.

Most IDL attributes **reflect** a content attribute: the getter reads the attribute and converts it, the setter writes a string back. The conversion depends on the property's type:

- **String**: returned as is; a missing attribute reads as `""`, not `null`.
- **URL** (`a.href`, `img.src`): parsed against the document's base URL and returned absolute.
- **Boolean** (`disabled`, `hidden`): `true` when the attribute is present at all. Setting `true` writes `""`; `false` removes it.
- **Number** (`maxLength`, `tabIndex`): parsed; an invalid or missing value returns a default (`-1` for `maxLength`).
- **Enumerated, limited to known values** (`input.type`): an unknown keyword returns the default state's keyword.

Some names differ because they clash with JavaScript: `class` is `className`, `for` is `htmlFor`. A made-up attribute such as `foo` gets no property at all.

**Form controls break the mirror.** For `<input>`, the `value` attribute is only the *default value*, reflected by `defaultValue`. The `value` property is the *current value*. Once the user edits the field or a script sets `value`, the control's dirty value flag is set and later attribute changes no longer reach it. `checked` and `defaultChecked` work the same way with a dirty checkedness flag. That's why form reset (back to the attributes) is possible, and why `setAttribute('value', …)` often seems to do nothing.

Rule of thumb: use properties for state and typed values; use attributes for what's serialised, for CSS attribute selectors, and for names with no property.

## Example

```js
// <base href="https://example.com/app/">
// <input id="name" value="Ada" maxlength="oops">
// <a id="link" href="../docs?q=1">Docs</a>
// …then the user types " L" at the end of the field.
const input = document.getElementById('name');
console.log(input.value, '|', input.getAttribute('value'), '|', input.defaultValue);
// → Ada L | Ada | Ada
input.setAttribute('value', 'Grace');
console.log(input.value, '|', input.defaultValue);
// → Ada L | Grace
console.log(input.maxLength);
// → -1
input.disabled = true;
console.log(JSON.stringify(input.getAttribute('disabled')));
// → ""

const link = document.getElementById('link');
console.log(link.getAttribute('href'));
// → ../docs?q=1
console.log(link.href);
// → https://example.com/docs?q=1
link.setAttribute('foo', 'bar');
console.log(String(link.foo));
// → undefined
```

Chrome 156 and Firefox 159 printed the same; the typing was done with Puppeteer key presses in both.

## Pitfalls

- Writing `el.setAttribute('disabled', 'false')` to enable a control. Any value means present, so it stays disabled; use `el.disabled = false` or `removeAttribute()`.
- Reading `getAttribute('value')` to get what the user typed. It returns the default; read the `value` property.
- Comparing `a.href` with the authored path. The property is the resolved absolute URL; use `getAttribute('href')` for the raw string.
- Expecting `el.foo = 'x'` to create an attribute. Expando properties never reach the markup; use `setAttribute()` or `dataset`.

## Follow-ups

**Q:** Are attribute names case-sensitive?
**A:** Not on HTML elements in an HTML document: `setAttribute()` lowercases the name, so `setAttribute('VALUE', 'x')` creates `value`. On SVG elements and in XML documents names keep their case.

**Q:** Does setting a reflected property change the attribute?
**A:** Yes. `link.id = 'x'` runs the setter, which writes the content attribute, so `getAttribute('id')` returns `'x'`. Only properties that hold state, like `value` and `checked`, are decoupled from their attribute.

## Exercises

### What does this print?

```js
// <input id="agree" type="checkbox" checked>
const box = document.getElementById('agree');
box.checked = false;
console.log(box.hasAttribute('checked'), box.defaultChecked);
box.removeAttribute('checked');
box.setAttribute('checked', '');
console.log(box.checked);
```

**Answer:** `true true`, then `false`. Setting `checked` changes only the current state and sets the dirty checkedness flag, so the attribute and `defaultChecked` stay `true`, and later attribute changes no longer move the box. Chrome 156 and Firefox 159 agreed.
