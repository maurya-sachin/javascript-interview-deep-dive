# 01 — The DOM

> **Status:** 🔴 planned · **Published:** 0/6 · **Last verified:** —

The document as a tree of objects: node types, live and static collections, attributes versus properties, and inserting, moving, querying and serialising nodes.

## Learning goals

After this chapter you can:

- Explain how nodes, elements and the document relate
- Predict when a collection updates itself and when it is a snapshot
- Tell a content attribute from the property that reflects it
- Insert and move nodes without needless work, and choose between `innerHTML`, `textContent` and `setHTML()`

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Trees, node types, `Node` vs `Element` vs `HTMLElement`, the `document` → 010
- Live `HTMLCollection` vs static `NodeList` from `querySelectorAll()`; live `childNodes` → 020
- Content attributes vs IDL properties; reflection; `value` vs `defaultValue`; resolved `href` → 030
- Inserting, moving and removing nodes: `append()`, `before()`, `replaceChildren()`, `DocumentFragment`, `moveBefore()` → 040
- `innerHTML`, `textContent`, `innerText` and `setHTML()`; when inserted scripts run → 050
- Querying and traversal: `querySelector()`, `closest()`, `matches()`, `TreeWalker` → 060

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [What is the DOM, and how do nodes, elements, and the document relate?](010-dom-tree-and-node-types.md) | easy | 🟡 draft |
| 020 | [What's the difference between a live `HTMLCollection` and a static `NodeList`?](020-live-vs-static-collections.md) | medium | 🟡 draft |
| 030 | [What's the difference between an attribute and a property?](030-attributes-vs-properties.md) | medium | 🟡 draft |
| 040 | [How do you insert, move, and remove nodes efficiently?](040-inserting-and-moving-nodes.md) | medium | 🟡 draft |
| 050 | [How do `innerHTML`, `textContent`, `innerText`, and `setHTML()` differ?](050-innerhtml-textcontent-innertext.md) | medium | 🔴 planned |
| 060 | [How do `querySelector()`, `closest()`, `matches()`, and `TreeWalker` find nodes?](060-querying-and-traversal.md) | easy | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- [DOM — Trees](https://dom.spec.whatwg.org/#trees)
- [DOM — Interface `Node`](https://dom.spec.whatwg.org/#interface-node)
- [DOM — Interface `HTMLCollection`](https://dom.spec.whatwg.org/#interface-htmlcollection)
- [DOM — Interface `NodeList`](https://dom.spec.whatwg.org/#interface-nodelist)
- [DOM — Mutation algorithms](https://dom.spec.whatwg.org/#mutation-algorithms)
- [HTML — Reflecting content attributes in IDL attributes](https://html.spec.whatwg.org/multipage/common-dom-interfaces.html#reflecting-content-attributes-in-idl-attributes)
- [HTML — `innerHTML`](https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-element-innerhtml)
- [HTML — `innerText`](https://html.spec.whatwg.org/multipage/dom.html#the-innertext-idl-attribute)
- [HTML Sanitizer API](https://wicg.github.io/sanitizer-api/)
