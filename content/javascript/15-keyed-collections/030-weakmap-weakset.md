---
title: "What are `WeakMap` and `WeakSet` for, and why can't you iterate them?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [weakmap, weakset, weak-references, garbage-collection, can-be-held-weakly, private-data, cache]
related:
  - javascript/keyed-collections/map-vs-object
  - javascript/memory-and-gc/garbage-collection
  - javascript/memory-and-gc/weakref-finalizationregistry
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-weakmap-objects
  - https://tc39.es/ecma262/#sec-canbeheldweakly
  - https://tc39.es/ecma262/#sec-weakmap.prototype.set
  - https://tc39.es/ecma262/#sec-weakref-processing-model
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap
tldr: >
  `WeakMap` and `WeakSet` hold their keys (members) weakly, so being in one never keeps an object alive.
  Keys must be objects or non-registered symbols. They have no `size`, iteration or `clear`, because
  garbage collection timing is unobservable by design. Use them to attach data to objects you do not own,
  memoise per object, or mark objects as seen, without leaking.
---

## Answer

A `Map` or `Set` holds its keys strongly: while the collection is reachable, every key stays reachable. `WeakMap` and `WeakSet` do not count as a reason to keep a key alive. If nothing else references the key object, the engine is allowed to drop the entry. The spec's goal is to let you associate state with an object "in a manner that does not leak memory".

**What can be a key.** `CanBeHeldWeakly` accepts objects and symbols that are not in the global registry (`Symbol.for`). Strings, numbers and other primitives throw a `TypeError` on `set`/`add`; `get`, `has` and `delete` simply return `undefined`/`false` for them.

**Why you cannot iterate.** The spec lets an engine remove entries some time after a key becomes unreachable. If you could list keys, or read `size`, the answer would depend on when garbage collection ran, which is non-deterministic. So the API only allows operations where you already hold the key: `get`, `set`, `has`, `delete` on `WeakMap`, and `add`, `has`, `delete` on `WeakSet`. There is no `size`, `keys`, `forEach`, iterator or `clear`.

**What you can't rely on.** The spec promises nothing about when, or whether, an unreachable entry disappears. Never write code that observes or depends on collection. For observing collection at all, see `WeakRef` and `FinalizationRegistry` in the memory-and-gc chapter.

**Typical uses:**

- **Per-object metadata** for objects you don't own, such as DOM nodes or third-party instances, without adding properties to them.
- **Memoisation keyed by an object**, where the cache must not outlive its inputs.
- **"Seen" marks** with `WeakSet`, such as visited nodes in a graph walk.
- **Private data** before `#private` fields; fields are usually simpler now.

Values are held strongly only as long as their key is alive, so a value that references its own key does not keep it alive.

## Example

```js
const meta = new WeakMap();
const node = { id: 1 };
meta.set(node, { visits: 0 });
meta.get(node).visits++;
console.log(meta.get(node));      // → { visits: 1 }
console.log(meta.has({ id: 1 })); // → false (different object)

try { meta.set('key', 1); } catch (error) { console.log(error.name); }
// → TypeError
try { meta.set(Symbol.for('app'), 1); } catch (error) { console.log(error.name); }
// → TypeError (registered symbols are not allowed)
const token = Symbol('token');
meta.set(token, 'ok');
console.log(meta.get(token));     // → ok
console.log(meta.get('key'));     // → undefined
console.log(typeof meta.size, typeof meta.keys, typeof meta[Symbol.iterator]);
// → undefined undefined undefined

const cache = new WeakMap();
function area(shape) {
  if (!cache.has(shape)) cache.set(shape, shape.w * shape.h);
  return cache.get(shape);
}
console.log(area({ w: 2, h: 3 })); // → 6
```

## Pitfalls

- Using a `WeakMap` with string or number keys. They throw on `set`, and a cache keyed by a primitive needs a `Map`.
- Expecting to count or list entries, or to see an entry vanish. Neither `size` nor timing is available, and the spec guarantees no collection.
- Using a `Map` as a per-object cache. Its strong reference keeps every key (and value) alive until you delete it, which is a classic leak.
- Treating a `WeakMap` as encryption-grade privacy. It hides data from code that lacks the `WeakMap`, but whoever can read the map can read everything in it.

## Follow-ups

**Q:** Can a `WeakMap` value keep its key alive?
**A:** Not by itself. The value is only reachable through the key, so the spec's liveness rule says a non-live key does not make its value live. Reaching the value some other way is different.

**Q:** Why are registered symbols rejected?
**A:** `Symbol.for('x')` can be recreated from the string at any time, so it has no identity that could be unreachable. `CanBeHeldWeakly` excludes it. Symbols from `Symbol('x')` and well-known symbols are accepted.

**Q:** `WeakMap` or `#private` fields?
**A:** Private fields for your own classes. `WeakMap` when the data lives outside the object's class, such as metadata on objects you didn't create.

## Exercises

### Predict the output

```js
const ws = new WeakSet();
const a = {};
ws.add(a);
console.log(ws.has(a), ws.has({}), ws.delete(a), ws.has(a));
try { ws.add('x'); } catch (error) { console.log(error.constructor === TypeError); }
```

**Answer:** `true false true false`, then `true`. Membership is by identity, so a new `{}` is not found; `delete` returns `true` once, and strings cannot be added.
