---
title: "How does `MutationObserver` batch changes?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [mutation-observer, dom, microtasks, mutation-records]
related:
  - browser/the-dom/attributes-vs-properties
  - browser/the-dom/inserting-and-moving-nodes
  - browser/observers/observer-timing
  - browser/web-components/custom-elements
  - javascript/async-and-the-event-loop/task-microtask-ordering
verified: 2026-10
perishable:
  - "moveBefore(): Chrome 133, Firefox 144, not Safari"
  - "Mutation events removed: Chrome 127, Firefox 140, Safari 26"
sources:
  - https://dom.spec.whatwg.org/#mutation-observers
  - https://dom.spec.whatwg.org/#queue-a-mutation-observer-compound-microtask
  - https://dom.spec.whatwg.org/#notify-mutation-observers
  - https://dom.spec.whatwg.org/#dictdef-mutationobserverinit
  - https://dom.spec.whatwg.org/#dom-mutationobserver-observe
  - https://dom.spec.whatwg.org/#dom-mutationobserver-disconnect
  - https://dom.spec.whatwg.org/#dom-mutationobserver-takerecords
  - https://dom.spec.whatwg.org/#queue-a-mutation-record
  - https://dom.spec.whatwg.org/#move
  - https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver#browser_compatibility
  - https://developer.mozilla.org/en-US/docs/Web/API/Element/moveBefore#browser_compatibility
tldr: >
  Every DOM change queues a `MutationRecord` for each interested observer, and the first one queues
  a single microtask. When the current script finishes, that microtask hands each observer all its
  records in one call, so 100 `append()` calls arrive as one callback with 100 records. Only changes
  to the DOM tree count: attributes, children, text.
---

## Answer

`new MutationObserver(callback)` then `observer.observe(node, options)`. The options choose what to record, and at least one type is required or `observe()` throws a `TypeError`:

- **`childList`**: nodes added or removed. **`attributes`**: attribute changes, optionally narrowed by `attributeFilter`. **`characterData`**: text node data.
- **`subtree`**: also watch every descendant, not just `node`.
- **`attributeOldValue`**, **`characterDataOldValue`**: put the previous value in `record.oldValue`. These and `attributeFilter` imply their type.

**Batching.** Each mutation runs *queue a mutation record*: for every observer whose options match, it appends a `MutationRecord` to that observer's record queue, then *queues a mutation observer microtask*. A per-agent flag means only the first mutation actually queues it. That microtask runs at the next microtask checkpoint, after the current script returns, and calls each observer with all of its records, in observer creation order. A loop of 100 `append()` calls therefore yields one callback with 100 records, and the callback can't run in the middle of your code.

Records describe DOM operations, not values. A property that doesn't reflect an attribute, like an input's `value` or `checked`, changes no DOM and produces nothing; setting an attribute to the value it already has still produces a record. `moveBefore()` produces two `childList` records, a removal and an insertion.

`takeRecords()` returns and empties the queue (do it before `disconnect()` if you need the pending ones); `disconnect()` stops observing and discards them.

Uses: reacting to third-party or framework-rendered DOM, editors, testing utilities, and polyfills. Custom elements that only care about their own attributes use `attributeChangedCallback`, which runs synchronously before `setAttribute()` returns. *Legacy:* mutation events (`DOMNodeInserted` and friends) fired synchronously for every change; Chrome 127, Firefox 140 and Safari 26 removed them.

## Example

```js
const list = document.createElement('ul');
const input = document.createElement('input');
document.body.append(list, input);

const observer = new MutationObserver((records) => {
  const attributes = records.filter((r) => r.type === 'attributes');
  console.log(`${records.length} records, attributes: ${attributes.map((r) => `${r.attributeName} (was ${r.oldValue})`).join(', ')}`);
});
// attributeOldValue implies attributes: true
observer.observe(document.body, { childList: true, subtree: true, attributeOldValue: true });

for (let i = 0; i < 100; i++) list.append(document.createElement('li'));
list.id = 'items'; // reflected property: sets the attribute
input.value = 'typed'; // current value, not an attribute: no record
input.setAttribute('value', 'default');
queueMicrotask(() => console.log('microtask queued after the mutations'));
console.log('sync code done');
// → sync code done
// → 102 records, attributes: id (was null), value (was null)
// → microtask queued after the mutations
```

Same output in Chrome 156 and Firefox 159. The observer's microtask was queued by the first `append()`, so it runs before the microtask queued later.

## Pitfalls

- Mutating observed nodes in the callback without a guard. Each change queues another microtask in the same checkpoint, so the callback re-enters before any timer or rendering; unbounded, it freezes the page. With a guard of five changes, all five callbacks ran before a `setTimeout(fn, 0)` in both browsers.
- Watching an element with `characterData: true` and expecting its text to be seen. The data belongs to the child `Text` node, so you need `subtree: true` too.
- Calling `disconnect()` and expecting the pending records to arrive. They're dropped; call `takeRecords()` first.
- Observing `document` with `subtree: true` and doing heavy work per record. Rendering a long list produces one record per inserted node; filter by `type` and `target` early.

## Follow-ups

**Q:** Why not a callback per mutation?
**A:** That was mutation events: synchronous, fired mid-operation, so handlers saw half-updated DOM and slowed every change. Batching into a microtask gives a consistent tree and one call per script.

**Q:** What does `el.textContent = 'flat'` record on an element with 101 children?
**A:** One `childList` record with 101 `removedNodes` and one added text node. `innerHTML` likewise gives one record for the whole replacement.

**Q:** In what order do two observers run?
**A:** Creation order, not `observe()` order: an observer created first was called first even though it called `observe()` second, in both browsers.

## Deep dive

### How it works

The flag, the set of pending observers and a creation counter live on the similar-origin window agent, so same-origin iframes share one mutation observer microtask. *Notify mutation observers* clears the flag, sorts the pending observers by creation index, and for each one takes a copy of its record queue, empties it, and invokes the callback if the copy isn't empty. Then it fires any pending `slotchange` events.

Removing a node from an observed subtree adds a *transient registered observer* to it, so changes inside the removed subtree are still reported until the next notification. Changing a removed paragraph's attribute in the same task produced an `attributes` record; doing it in a later task produced none (Chrome 156 and Firefox 159).

### Edge cases

Measured in Chrome 156 and Firefox 159 (both agreed):

| Operation | Records |
|---|---|
| `observe(node, {})` or `{ subtree: true }` alone | `TypeError` |
| `{ attributes: false, attributeOldValue: true }` | `TypeError` |
| `input.value = …`, `input.checked = true` | none |
| `el.className = 'x'` twice | two `attributes` records (old values `null`, `'x'`) |
| `el.dataset.k = '1'`, `el.style.color = 'red'` | `data-k` and `style` attribute records |
| `b.moveBefore(n, null)` with `n` in `a` | removal from `a`, insertion into `b` |
| `b.append(n)` when `n` is already `b`'s last child | removal and insertion, both on `b` |

## Exercises

### Taken, then dropped

```js
const observer = new MutationObserver((records) => console.log('callback', records.length));
observer.observe(document.body, { childList: true });

document.body.append('a');
console.log('taken', observer.takeRecords().length);
document.body.append('b');
observer.disconnect();
document.body.append('c');
```

**Answer:** Only `taken 1`. `takeRecords()` emptied the queue after `'a'`; `disconnect()` discarded the record for `'b'`; `'c'` happened after disconnecting. The microtask still ran, but an observer with no records isn't called. Same in Chrome 156 and Firefox 159.
