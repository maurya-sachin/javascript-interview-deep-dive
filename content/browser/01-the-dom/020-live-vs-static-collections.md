---
title: "What's the difference between a live `HTMLCollection` and a static `NodeList`?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [dom, htmlcollection, nodelist, live-collection, queryselectorall, childnodes]
related:
  - browser/the-dom/dom-tree-and-node-types
  - browser/the-dom/querying-and-traversal
  - browser/observers/mutation-observer
verified: 2026-10
sources:
  - https://dom.spec.whatwg.org/#concept-collection
  - https://dom.spec.whatwg.org/#interface-nodelist
  - https://dom.spec.whatwg.org/#interface-htmlcollection
  - https://dom.spec.whatwg.org/#dom-parentnode-queryselectorall
  - https://dom.spec.whatwg.org/#dom-node-childnodes
  - https://dom.spec.whatwg.org/#dom-element-getelementsbyclassname
  - https://html.spec.whatwg.org/multipage/dom.html#dom-document-getelementsbyname
  - https://webidl.spec.whatwg.org/#js-iterable
tldr: >
  A live collection is a view of the tree: every read reflects the current DOM. A static one is a
  snapshot taken when it was created. `HTMLCollection` (`children`, `getElementsByClassName()`) is
  always live; `NodeList` can be either: `childNodes` is live, `querySelectorAll()` is static. Live
  views shift under you when you mutate while looping over them.
---

## Answer

The DOM Standard defines a *collection* as a list of nodes with a root and a filter, and says a collection is **live** unless stated otherwise. A live collection doesn't store its members: `length` and indexing answer from the tree as it is now. A **static** collection is a snapshot of the matches at creation time; later changes don't touch it.

Which one you get depends on the method, not the type:

| Returns | Type | Live? |
|---|---|---|
| `children`, `getElementsByTagName()`, `getElementsByClassName()`, `document.forms`, `table.rows` | `HTMLCollection` | live |
| `childNodes` | `NodeList` | live |
| `document.getElementsByName()` | `NodeList` | live |
| `querySelectorAll()` | `NodeList` | **static** |

The interfaces differ too. `HTMLCollection` holds only elements and adds `namedItem()` (lookup by `id` or `name`); the standard calls it "a historical artifact". `NodeList` can hold any node and has `forEach()`, `keys()`, `values()` and `entries()`. Both have `length` and indexing, and Web IDL gives every interface with an indexed getter a `Symbol.iterator`, so `for…of`, spread and `Array.from()` work on both; only `NodeList` has `forEach()`.

Identity follows from liveness. `children` and `childNodes` return the same object every time; `getElementsBy*()` may return the same object for the same argument; `querySelectorAll()` always builds a new list.

Liveness bites when you change the tree while iterating it. Removing a class from each element of `getElementsByClassName()` in an index loop shifts the remaining items down and skips every other one. Inserting matching elements during `for…of` over a live collection can loop forever. Copy first (`[...live]`), use `querySelectorAll()`, or iterate backwards.

## Example

```js
// <ul id="list"><li class="todo">a</li><li class="todo">b</li><li class="todo">c</li></ul>
const list = document.getElementById('list');
const live = list.getElementsByClassName('todo'); // HTMLCollection, live
const snapshot = list.querySelectorAll('.todo');  // NodeList, static
const kids = list.childNodes;                     // NodeList, live

for (let i = 0; i < live.length; i++) live[i].classList.remove('todo');
console.log(live.length, live[0].textContent);
// → 1 b
console.log(snapshot.length);
// → 3

list.append(document.createElement('li'), 'text');
console.log(kids.length, list.children.length, snapshot.length);
// → 5 4 3

console.log(typeof live.forEach, typeof snapshot.forEach);
// → undefined function
```

Chrome 156 and Firefox 159 printed the same. `b` survives because removing `a` shifted it to index 0 after the loop had passed it.

## Pitfalls

- Assuming every `NodeList` is static. `childNodes` and `getElementsByName()` are live; only `querySelectorAll()` gives a snapshot.
- Mutating a live collection's members in a forward loop. Matches drop out and indexes shift, so items get skipped.
- Calling `forEach()` or `map()` on an `HTMLCollection`. It has neither; spread it or use `Array.from()`.
- Caching `querySelectorAll()` results and expecting new elements to appear. Query again, or keep a live collection when that's what you need.

## Follow-ups

**Q:** How do you get notified when a collection's contents change?
**A:** You don't: a live collection has no events. It only answers correctly when read. To react to tree changes, use a `MutationObserver`.

**Q:** Why doesn't `HTMLCollection` get `forEach()`?
**A:** Its IDL has no `iterable<>` declaration, which is what generates `forEach()`. The standard discourages new APIs from returning `HTMLCollection` at all, recommending plain sequences (arrays) instead.

## Exercises

### How many times does this loop run?

```js
// <p>1</p><p>2</p>
const ps = document.getElementsByTagName('p');
for (const p of ps) p.after(document.createElement('p'));
```

**Answer:** It never stops. Each new `<p>` lands right after the current one, so the live collection always has a next item. Capped at 1,000 iterations, `ps.length` was `1002` in Chrome 156 and Firefox 159. With `querySelectorAll('p')` the loop runs twice.
