---
title: "What is the DOM, and how do nodes, elements, and the document relate?"
status: draft
difficulty: easy
frequency: 4
core: false
tags: [dom, node, element, node-types, document, tree]
related:
  - browser/the-dom/live-vs-static-collections
  - browser/the-dom/querying-and-traversal
  - html-and-css/documents-and-semantics/content-model-and-parser-repair
  - browser/web-components/shadow-dom-encapsulation
verified: 2026-10
sources:
  - https://dom.spec.whatwg.org/#trees
  - https://dom.spec.whatwg.org/#concept-node-tree
  - https://dom.spec.whatwg.org/#interface-node
  - https://dom.spec.whatwg.org/#dom-node-nodetype
  - https://dom.spec.whatwg.org/#dom-node-parentelement
  - https://dom.spec.whatwg.org/#interface-element
  - https://html.spec.whatwg.org/multipage/dom.html#elements-in-the-dom
tldr: >
  The DOM is the document as a tree of objects. Every object in it is a `Node`: the `Document` at
  the root, a doctype, elements, text, comments. `Element` is the node type for tags, and
  `HTMLElement` the base for HTML tags specifically, so `<p>` is `HTMLParagraphElement →
  HTMLElement → Element → Node`. Text between tags is its own node.
---

## Answer

The DOM (Document Object Model) is the in-memory tree the browser builds from HTML, plus the API scripts use to read and change it. The WHATWG DOM Standard defines the tree and its generic interfaces; the HTML Standard defines the HTML element classes on top.

**Node** is the base interface for everything in the tree. Every node has a primary type, reported by `nodeType`:

- `Document` (9): the root, exposed as `document`.
- `DocumentType` (10): the `<!doctype html>`.
- `Element` (1): a tag.
- `Text` (3) and `Comment` (8), both `CharacterData`: leaves that hold a string.
- `DocumentFragment` (11): a parentless container for building subtrees. A shadow root is one too.
- `Attr` (2) is a `Node` for historical reasons, but it never has a parent: attributes hang off their element, not the tree.

The standard constrains the shape. A document has at most one doctype and one element child, `<html>`, which is `document.documentElement`. Elements contain elements and character data.

**Element vs HTMLElement.** `Element` holds what every markup element shares: attributes, `id`, `classList`, selectors. `HTMLElement` adds HTML-only features such as `hidden`, `title` and `click()`, and each tag gets a subclass: `<p>` is `HTMLParagraphElement`. SVG elements are `Element`s but not `HTMLElement`s. An unrecognised name such as `<foo>` becomes `HTMLUnknownElement`; a valid custom element name such as `<x-foo>` gets plain `HTMLElement`, so a later upgrade only extends the chain.

**Node vs element APIs.** Node-level APIs (`childNodes`, `firstChild`, `parentNode`) include text and comments; element-level ones (`children`, `firstElementChild`, `parentElement`) skip them. That's why whitespace between tags shows up as `#text` nodes in `childNodes` but not in `children`.

## Example

```js
// <!doctype html> … <p id="note">Hi <b>there</b><!-- todo --></p>
const p = document.getElementById('note');

console.log([...p.childNodes].map((n) => `${n.nodeType} ${n.nodeName}`).join(', '));
// → 3 #text, 1 B, 8 #comment
console.log(p.childNodes.length, p.children.length);
// → 3 1

const chain = [];
for (let o = Object.getPrototypeOf(p); o; o = Object.getPrototypeOf(o)) chain.push(o.constructor.name);
console.log(chain.join(' > '));
// → HTMLParagraphElement > HTMLElement > Element > Node > EventTarget > Object

console.log([...document.childNodes].map((n) => n.nodeName).join(', '));
// → html, HTML
console.log(document.documentElement.parentNode === document);
// → true
console.log(String(document.documentElement.parentElement));
// → null

const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
console.log(svg instanceof Element, svg instanceof HTMLElement);
// → true false
```

Chrome 156 and Firefox 159 printed the same. The first `html` is the doctype's `nodeName`.

## Pitfalls

- Assuming `firstChild` is the first tag. With indented markup it is usually a whitespace `#text` node; use `firstElementChild`.
- Treating `parentNode` and `parentElement` as the same. They differ at the top: `<html>`'s `parentNode` is the document, its `parentElement` is `null`.
- Checking `instanceof HTMLElement` to mean "is an element". It is `false` for SVG and MathML elements; use `instanceof Element` or `nodeType === Node.ELEMENT_NODE`.
- Expecting attributes in `childNodes`. `Attr` nodes are never children; read them with `getAttribute()` or `attributes`.

## Follow-ups

**Q:** Is the DOM the same as the HTML source?
**A:** No. The parser repairs markup (closing a `<p>` before a `<div>`, adding `<head>` and `<body>`), and scripts change the tree afterwards. DevTools' Elements panel shows the DOM, not the source.

**Q:** What are `nodeName` and `tagName` for an HTML element?
**A:** Both are the qualified name, uppercased for HTML elements in an HTML document: `"P"`. `localName` stays lowercase: `"p"`.

## Exercises

### What do these print?

```js
// <ul id="list">
//   <li>One</li>
// </ul>
const ul = document.getElementById('list');
console.log(ul.firstChild.nodeName, ul.firstElementChild.nodeName);
console.log(document.createElement('foo').constructor.name);
console.log(document.createElement('x-foo').constructor.name);
```

**Answer:** `#text LI`, then `HTMLUnknownElement`, then `HTMLElement`. The first child is the newline-and-indent text before `<li>`. `foo` is not a known element or a valid custom element name; `x-foo` is a valid custom element name, so it gets `HTMLElement`. Chrome 156 and Firefox 159 agreed.
