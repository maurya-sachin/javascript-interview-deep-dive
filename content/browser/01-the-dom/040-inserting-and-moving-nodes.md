---
title: "How do you insert, move, and remove nodes efficiently?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [dom, append, documentfragment, replacechildren, movebefore, mutation]
related:
  - browser/the-dom/dom-tree-and-node-types
  - browser/the-dom/innerhtml-textcontent-innertext
  - browser/rendering-pipeline/forced-synchronous-layout
  - browser/observers/mutation-observer
verified: 2026-10
perishable:
  - moveBefore() shipped in Chrome 133 and Firefox 144; not in Safari
sources:
  - https://dom.spec.whatwg.org/#mutation-algorithms
  - https://dom.spec.whatwg.org/#concept-node-insert
  - https://dom.spec.whatwg.org/#concept-node-adopt
  - https://dom.spec.whatwg.org/#convert-nodes-into-a-node
  - https://dom.spec.whatwg.org/#dom-parentnode-append
  - https://dom.spec.whatwg.org/#dom-parentnode-replacechildren
  - https://dom.spec.whatwg.org/#dom-childnode-before
  - https://dom.spec.whatwg.org/#interface-documentfragment
  - https://dom.spec.whatwg.org/#dom-parentnode-movebefore
  - https://dom.spec.whatwg.org/#concept-node-move-ext
  - https://developer.mozilla.org/en-US/docs/Web/API/Element/moveBefore#browser_compatibility
tldr: >
  `append()`, `prepend()`, `before()`, `after()` and `replaceWith()` take nodes and strings (as
  text, never parsed) and insert them in one operation. A node has one parent, so inserting it
  elsewhere moves it. Build off-tree or in a `DocumentFragment`, then insert once.
  `replaceChildren()` swaps all children. `moveBefore()` moves without resetting iframes or focus.
---

## Answer

**Inserting.** The modern methods are `parent.append()` and `prepend()`, and on the node itself `before()`, `after()` and `replaceWith()`. Each takes any number of nodes *and strings*; strings become `Text` nodes, so they're never parsed as HTML. With several arguments the DOM Standard first collects them into a `DocumentFragment`, so the insert happens once. The older `appendChild()` and `insertBefore()` take one node and return it.

**Moving.** A node can have only one parent. Inserting a node that's already in the tree first removes it from its old position: there's no copy unless you `cloneNode(true)`.

**Removing.** `node.remove()`, or `parent.replaceChildren()` with no arguments to empty a parent. `replaceChildren(...nodes)` replaces every child in one step, which makes it the clean way to re-render a list.

**Fragments.** A `DocumentFragment` is a parentless container. Inserting it moves its *children* and leaves the fragment empty, so you can build many nodes off-tree and insert once.

**Why batching matters.** Each insertion runs the insertion steps: mutation records, custom element callbacks, and side effects such as scripts running or iframes loading. Layout is computed lazily, so a loop of insertions isn't re-laid out per node unless you read geometry (`offsetHeight`) between writes, which forces synchronous layout. Build first, insert once, read afterwards.

**`moveBefore(node, child)`** is an atomic move. `insertBefore()` on a connected node is a remove plus an insert, so an iframe reloads, a focused element loses focus, and running CSS animations restart. `moveBefore()` runs separate *moving steps* that keep that state. It throws `HierarchyRequestError` when the node and the new parent don't share a root (for example, a node not yet in the document) or the node isn't an element or character data, so fall back to `insertBefore()` there. It shipped in Chrome 133 and Firefox 144; Safari doesn't have it.

## Example

```js
// <div id="a"><iframe srcdoc="<p>hi"></iframe><input id="field"></div>
// <div id="b"></div>   — runs after the page's load event
const later = () => new Promise((r) => setTimeout(r, 300));
const a = document.getElementById('a');
const b = document.getElementById('b');
const frame = a.querySelector('iframe');
const field = document.getElementById('field');
let loads = 0;
frame.addEventListener('load', () => loads++);
field.focus();

b.moveBefore(frame, null); // atomic move: state kept
b.moveBefore(field, null);
await later();
console.log(loads, document.activeElement === field);
// → 0 true

a.insertBefore(frame, null); // remove, then insert: state reset
a.insertBefore(field, null);
await later();
console.log(loads, document.activeElement.nodeName);
// → 1 BODY

const frag = document.createDocumentFragment();
frag.append('x', document.createElement('i'));
b.replaceChildren(frag, '<b>');
console.log(frag.childNodes.length, b.innerHTML);
// → 0 x<i></i>&lt;b&gt;
```

Chrome 156 and Firefox 159 printed the same.

## Pitfalls

- Expecting `append(existingNode)` to copy it. It moves; clone first if you need two.
- Passing an HTML string to `append()`. It inserts literal text; markup needs a parser API.
- Interleaving inserts with layout reads in a loop. Each read after a write forces layout; batch writes, then read.
- Calling `moveBefore()` unconditionally. It throws for nodes from another root or a detached tree, and doesn't exist in Safari; feature-detect and fall back to `insertBefore()`.

## Follow-ups

**Q:** Is `el.innerHTML = ''` or `replaceChildren()` better for clearing?
**A:** `replaceChildren()` says what it means and involves no parser. Both remove all children in one operation.

**Q:** What does a `MutationObserver` see for `append(a, b, c)`?
**A:** One `childList` record with three added nodes, because the nodes are first collected into a fragment and inserted together.

## Exercises

### What does this print?

```js
// <ul id="list"><li>1</li><li>2</li><li>3</li></ul>
const list = document.getElementById('list');
const [one, two, three] = list.children;
list.append(one);
list.prepend(three);
console.log(list.children.length, list.textContent);
```

**Answer:** `3 321`. Appending `one` moves it to the end (`2 3 1`); prepending `three` moves it to the front (`3 2 1`). No nodes are created. Chrome 156 and Firefox 159 agreed.
