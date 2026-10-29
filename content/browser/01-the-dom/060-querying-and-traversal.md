---
title: "How do `querySelector()`, `closest()`, `matches()`, and `TreeWalker` find nodes?"
status: draft
difficulty: easy
frequency: 3
core: false
tags: [dom, queryselector, closest, matches, treewalker, selectors]
related:
  - browser/the-dom/dom-tree-and-node-types
  - browser/the-dom/live-vs-static-collections
  - browser/events/event-delegation
  - browser/web-components/shadow-dom-encapsulation
verified: 2026-10
sources:
  - https://dom.spec.whatwg.org/#dom-parentnode-queryselector
  - https://dom.spec.whatwg.org/#dom-parentnode-queryselectorall
  - https://dom.spec.whatwg.org/#scope-match-a-selectors-string
  - https://dom.spec.whatwg.org/#dom-element-closest
  - https://dom.spec.whatwg.org/#dom-element-matches
  - https://dom.spec.whatwg.org/#traversal
  - https://dom.spec.whatwg.org/#interface-treewalker
  - https://dom.spec.whatwg.org/#dom-nodefilter-filter_reject
  - https://dom.spec.whatwg.org/#interface-nonelementparentnode
  - https://drafts.csswg.org/cssom/#dom-css-escape
tldr: >
  `querySelector()` returns the first matching descendant, `closest()` the nearest matching
  inclusive ancestor, and `matches()` a boolean for the element itself. Selectors are matched
  against the whole tree, so `el.querySelector('div p')` can use ancestors outside `el`; `:scope`
  anchors them. `TreeWalker` visits any node type, filtered per node or per subtree.
---

## Answer

All three selector methods parse a CSS selector and throw a `SyntaxError` `DOMException` if it's invalid.

- **`querySelector(sel)`** returns the first matching *descendant* in tree order, or `null`. `querySelectorAll(sel)` returns all of them as a static `NodeList`.
- **`closest(sel)`** walks up: the element itself first, then each ancestor, and returns the first that matches, or `null`.
- **`matches(sel)`** returns whether this element matches. (`webkitMatchesSelector()` is a legacy alias.)

The trap is scope. `el.querySelector('section p')` matches the selector against the *whole tree* and only requires the result to be inside `el`; the `section` can be outside it. To anchor the selector at `el`, start with `:scope`: `el.querySelector(':scope > p')`. In `closest()` and `matches()`, `:scope` is the element itself.

Selectors stop at shadow roots: they match within one tree, so `document.querySelector()` doesn't find nodes inside a component's shadow root, and `closest()` doesn't climb out of one.

`closest()` with `matches()` is the core of event delegation: one listener on a container, then `event.target.closest('.del')` to find the control that was clicked.

**`TreeWalker`** (`document.createTreeWalker(root, whatToShow, filter)`) visits *nodes*, not just elements. `whatToShow` picks node types (`NodeFilter.SHOW_TEXT`, `SHOW_COMMENT`, `SHOW_ELEMENT`…), and the optional filter returns:

- `FILTER_ACCEPT`: visit the node.
- `FILTER_SKIP`: skip the node but still visit its children.
- `FILTER_REJECT`: skip the node *and its subtree*.

You step with `nextNode()`, `parentNode()`, `firstChild()` and friends; `currentNode` is the position, and it starts at `root`, which `nextNode()` never returns. The walker follows the tree as it is when you step, so it handles mutations during the walk. Use it for things selectors can't express: collecting text nodes for highlighting, finding comments, or pruning whole subtrees. `NodeIterator` is the flat variant; for it, `FILTER_REJECT` acts like `FILTER_SKIP`.

## Example

```js
// <section class="card">
//   <div id="panel">
//     <p>Read <a href="/a">this</a> <!-- note --></p>
//     <ul><li><button class="del">x</button></li></ul>
//   </div>
// </section>
const panel = document.getElementById('panel');
console.log(panel.querySelector('section p').nodeName);
// → P
console.log(String(panel.querySelector(':scope section p')));
// → null

const btn = panel.querySelector('.del');
console.log(btn.closest('li').nodeName, btn.closest('.card').nodeName, btn.closest('button') === btn);
// → LI SECTION true
console.log(btn.matches('.card .del'));
// → true

const walker = document.createTreeWalker(panel, NodeFilter.SHOW_TEXT, (node) =>
  node.data.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP);
const texts = [];
while (walker.nextNode()) texts.push(walker.currentNode.data);
console.log(JSON.stringify(texts));
// → ["Read ","this","x"]
```

Chrome 156 and Firefox 159 printed the same. The first query matches although `<section>` is outside `panel`; the walker skipped whitespace-only text nodes and never visits the comment.

## Pitfalls

- Writing `el.querySelector('div span')` and assuming `div` must be inside `el`. Ancestors outside `el` count; prefix `:scope`.
- Forgetting that `closest()` includes the element itself. `btn.closest('button')` returns `btn`.
- Interpolating user input into a selector. A stray `"` or `#1` throws `SyntaxError`; escape it with `CSS.escape()`.
- Using `FILTER_REJECT` in a `NodeIterator` to prune a subtree. Only `TreeWalker` treats reject as "skip children too".

## Follow-ups

**Q:** `getElementById()` or `querySelector('#id')`?
**A:** Both return the first element with that ID in tree order. `getElementById()` takes the raw ID, so IDs such as `1a` need no escaping; `querySelector()` needs `#\31 a` (from `CSS.escape('1a')`). `getElementById()` exists only on `Document` and `DocumentFragment`.

**Q:** Can a selector match a pseudo-element?
**A:** No. `panel.querySelector('p::before')` returns `null` in Chrome 156 and Firefox 159 rather than throwing: pseudo-elements aren't nodes.

## Exercises

### What do the two calls print?

```js
// <div id="panel"><p>Read <a href="/a">this</a></p><ul><li><button>x</button></li></ul></div>
const panel = document.getElementById('panel');
const names = (filter) => {
  const walker = document.createTreeWalker(panel, NodeFilter.SHOW_ELEMENT, filter);
  const out = [];
  while (walker.nextNode()) out.push(walker.currentNode.nodeName);
  return out.join();
};
console.log(names((n) => (n.nodeName === 'UL' ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT)));
console.log(names((n) => (n.nodeName === 'UL' ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT)));
```

**Answer:** `P,A`, then `P,A,LI,BUTTON`. Rejecting the `<ul>` prunes its subtree; skipping it hides only the `<ul>` itself. Neither includes `DIV`, because the walker starts at the root. Chrome 156 and Firefox 159 agreed.
