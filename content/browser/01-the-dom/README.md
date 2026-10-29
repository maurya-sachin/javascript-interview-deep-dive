# 01 — The DOM

> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

The document as a tree of objects: node types, live and static collections, attributes versus properties, and inserting, moving, querying and serialising nodes.

## Learning goals

After this chapter you can:

- Explain how nodes, elements and the document relate
- Predict when a collection updates itself and when it is a snapshot
- Tell a content attribute from the property that reflects it
- Insert and move nodes without needless work, and choose between `innerHTML`, `textContent` and `setHTML()`

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Trees, node types, `Node` vs `Element` vs `HTMLElement`, the `document` → —
- Live `HTMLCollection` vs static `NodeList` from `querySelectorAll()`; live `childNodes` → —
- Content attributes vs IDL properties; reflection; `value` vs `defaultValue`; resolved `href` → —
- Inserting, moving and removing nodes: `append()`, `before()`, `replaceChildren()`, `DocumentFragment`, `moveBefore()` → —
- `innerHTML`, `textContent`, `innerText` and `setHTML()`; when inserted scripts run → —
- Querying and traversal: `querySelector()`, `closest()`, `matches()`, `TreeWalker` → —

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
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
