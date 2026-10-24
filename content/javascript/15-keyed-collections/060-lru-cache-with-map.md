---
title: "Implement an LRU cache with `Map`."
status: draft
difficulty: medium
frequency: 5
core: true
tags: [map, lru-cache, insertion-order, caching, data-structures]
related:
  - javascript/keyed-collections/map-vs-object
  - javascript/keyed-collections/weakmap-weakset
  - javascript/keyed-collections/map-upsert
  - javascript/closures/memoization
verified: 2026-10
perishable:
  - V8 Map iteration skips deleted-entry holes one by one
  - Node 24 eviction timings for the Map-based LRU
sources:
  - https://tc39.es/ecma262/#sec-map-objects
  - https://tc39.es/ecma262/#sec-map.prototype.set
  - https://tc39.es/ecma262/#sec-map.prototype.delete
  - https://tc39.es/ecma262/#sec-map.prototype.keys
  - https://tc39.es/ecma262/#sec-createmapiterator
  - https://chromium.googlesource.com/v8/v8.git/+/main/src/objects/ordered-hash-table.h
  - https://chromium.googlesource.com/v8/v8.git/+/main/src/objects/ordered-hash-table.cc
  - https://chromium.googlesource.com/v8/v8.git/+/main/src/builtins/builtins-collections-gen.cc
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
tldr: >
  A `Map` iterates keys in insertion order, so it is a recency list: the first key is the least
  recently used. On every hit, `delete` the key and `set` it again to move it to the end; on
  insert, evict `map.keys().next().value` when `size` exceeds capacity. `set` on an existing key
  keeps its position, which is why the `delete` is required.
---

## Answer

An LRU (least recently used) cache holds at most `capacity` entries and, when full, evicts the one that was read or written longest ago. The classic design pairs a hash map (fast lookup) with a doubly linked list (fast reordering). In JavaScript, one `Map` gives you both, because the spec defines its iteration order: entries come out in the order their keys were first inserted.

So keep the `Map` ordered from least to most recently used:

- **`get(key)`:** if the key is present, `delete` it and `set` it again, which moves it to the end, then return the value.
- **`set(key, value)`:** `delete` the key (harmless if absent), `set` it, and if `size` now exceeds capacity, delete the first key: `map.keys().next().value`.

The `delete` before `set` is the detail interviewers look for. `Map.prototype.set` on an existing key updates the value *in place*; only a key that isn't present is appended. Without the `delete`, updating a key would leave it at its old position and it could be evicted next.

On complexity, be precise. The spec doesn't promise O(1): it requires *sublinear* average access time. In V8, `get`, `set` and `delete` are hash-table operations, constant on average. Eviction is the weak spot: deleted entries stay as holes until the table is rebuilt, and `keys().next()` steps over the holes at the front one by one, so in Node 24 its cost grows with the keys evicted since the last rebuild. For a guaranteed O(1) answer, build the textbook hash map plus doubly linked list (see the deep dive).

Use `has` rather than checking `get(key) === undefined`, so a cached `undefined` still counts as a hit.

## Example

```js
class LRUCache {
  #capacity;
  #entries = new Map(); // iteration order: least → most recently used
  constructor(capacity) {
    if (!Number.isInteger(capacity) || capacity < 1) throw new RangeError('capacity must be ≥ 1');
    this.#capacity = capacity;
  }
  get(key) {
    if (!this.#entries.has(key)) return undefined;
    const value = this.#entries.get(key);
    this.#entries.delete(key); // re-insert: moves the key to the end
    this.#entries.set(key, value);
    return value;
  }
  set(key, value) {
    this.#entries.delete(key);
    this.#entries.set(key, value);
    if (this.#entries.size > this.#capacity) {
      this.#entries.delete(this.#entries.keys().next().value); // first key = least recent
    }
    return this;
  }
}

const cache = new LRUCache(2).set('a', 1).set('b', 2);
cache.get('a'); // 'a' becomes most recent
cache.set('c', 3); // over capacity: evicts 'b'
console.log(cache.get('b'), cache.get('a'), cache.get('c')); // → undefined 1 3
```

## Pitfalls

- Calling `set` without `delete` on an existing key. The value changes but the position doesn't, so a just-written key can be evicted.
- Evicting with `[...map.keys()][0]`. It copies every key on each insert, which turns an O(1) step into O(n); take the first value from the iterator instead.
- Claiming the `Map` version is O(1) per operation. The spec requires only sublinear average access, and in V8 the first-key lookup used for eviction slows down as holes pile up at the front.
- Reaching for a `WeakMap`. It can't be iterated and has no `size`, so it can't know which entry is oldest or when the cache is full.

## Follow-ups

**Q:** How would you add a `peek` that doesn't count as a use?
**A:** Return `this.#entries.get(key)` without the `delete`/`set` pair. Recency changes only on purpose, so monitoring or debugging reads don't keep entries alive.

**Q:** How would you add expiry (TTL)?
**A:** Store `{ value, expiresAt }` and treat an expired entry as a miss in `get`, deleting it there. Eviction by recency stays the same; expired entries are cleaned up lazily, or by a periodic sweep from the front of the `Map`.

**Q:** Is `map.keys().next().value` safe on an empty map?
**A:** It returns `undefined` with `done: true`. The example only calls it when `size` exceeds capacity, so the map is never empty there.

## Deep dive

### How it works

The spec models a `Map` as a list of records, `[[MapData]]`. Four algorithm details make the LRU work:

1. **`Map.prototype.set`** walks the list; if a live entry has the same key (SameValueZero, after `CanonicalizeKeyedCollectionKey` turns `-0` into `+0`), it overwrites `[[Value]]` and returns. Only otherwise does it *append* a new record.
2. **`Map.prototype.delete`** doesn't remove the record. It sets the entry's key and value to the spec value *empty*, a tombstone. A note says implementations may physically remove it instead.
3. **`CreateMapIterator`** walks the list from index 0 and skips empty entries, so the first value it yields is the oldest live key.
4. **Sublinear access.** The section intro says the list is only a description of observable behaviour and that real implementations must give sublinear average access time.

So "delete then set" really is "move to the end", and "first iterated key" really is "least recently used":

```js
const m = new Map([['a', 1], ['b', 2]]);
m.set('a', 10);
console.log([...m.keys()]); // → [ 'a', 'b' ]
m.delete('a');
m.set('a', 10);
console.log([...m.keys()]); // → [ 'b', 'a' ]
```

**In V8** (from its source, not the spec), `Map` and `Set` use `OrderedHashTable`, based on the "deterministic hash table" design: hash buckets point into a data table where entries sit in insertion order. A new entry is written at the end of the data table; a deleted entry leaves a hole and increments a deleted-element count. When the data table is full, V8 rehashes into a new table, at the same capacity if at least half the slots are holes, otherwise doubled. An LRU's churn fills the table with holes that a rehash eventually clears.

The cost shows up in eviction. V8's iterator builtin (`NextSkipHashTableHoles`) starts at slot 0 and steps over every hole, and an LRU deletes its oldest key on every eviction, so holes pile up exactly at the front. Measured on Node 24.19 (V8 13.6) with a 20,000-entry `Map`, `keys().next()` took about 90 ns; after the first 10,000 keys were deleted, about 7 µs. An eviction-heavy benchmark of the example's class went from about 0.5 µs per `set` at capacity 1,000 to about 8.5 µs at 10,000, while the linked-list version below stayed near 0.1 µs. These numbers are one machine's, but the trend follows from the source.

### Edge cases

- **Stored `undefined`.** `get` returns `undefined` for both a miss and a cached `undefined`; callers who need the distinction need a `has` method on the cache, or a sentinel.
- **Key equality is SameValueZero.** `NaN` works as a key and `-0`/`+0` are one key. Objects compare by identity, so two equal-looking argument arrays are two keys; that's the same keying problem memoization has.
- **Capacity validation.** A capacity of 0 or `NaN` would make `set` evict immediately or never; throwing a `RangeError` in the constructor is clearer than either.
- **Iterating while mutating.** Map iterators are live: a key moved to the end during a `for...of` over the `Map` is visited again, so "touch every entry" in a loop never ends. Snapshot with `[...map.keys()]` first.

### Real-world scenario

A memoized function with unbounded storage leaks: every distinct argument stays forever. Bounding it with an LRU keeps the hot results and drops the rest, which suits lookups with a skewed access pattern (recently used keys are likely to be reused): parsed templates, compiled regexes, resolved module paths, formatted dates. Swap the memo `Map` for an `LRUCache` with the same `get`/`set`/`has` surface and the memoizer doesn't change.

When the interviewer asks for guaranteed O(1), says "don't rely on `Map` ordering", or the cache is large and eviction-heavy, write the textbook version. The `Map` is only an index; order lives in a doubly linked list with sentinel nodes, so every operation is a constant number of pointer updates:

```js
class LinkedLRU {
  #capacity;
  #index = new Map(); // key → node: lookup only, never order
  #head = {}; // sentinel before the least recent node
  #tail = {}; // sentinel after the most recent node
  constructor(capacity) {
    this.#capacity = capacity;
    this.#head.next = this.#tail;
    this.#tail.prev = this.#head;
  }
  #unlink(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }
  #append(node) {
    node.prev = this.#tail.prev;
    node.next = this.#tail;
    node.prev.next = node;
    this.#tail.prev = node;
  }
  get(key) {
    const node = this.#index.get(key);
    if (!node) return undefined;
    this.#unlink(node);
    this.#append(node);
    return node.value;
  }
  set(key, value) {
    const existing = this.#index.get(key);
    if (existing) this.#unlink(existing);
    const node = { key, value };
    this.#index.set(key, node);
    this.#append(node);
    if (this.#index.size > this.#capacity) {
      const oldest = this.#head.next;
      this.#unlink(oldest);
      this.#index.delete(oldest.key);
    }
    return this;
  }
}
```

### Trade-offs

The `Map` version is about 20 lines and hard to get wrong; it leans on spec-defined ordering and on the engine's hash table. A `get` costs up to four hash operations (`has`, `get`, `delete`, `set`); drop the `has` when `undefined` is never a valid value. It's a fine answer for small caches. The linked-list version costs one node object per entry and more code, but its constant-time bound doesn't depend on how the engine treats deleted entries, and it ports to any language. Both are single-threaded structures with no notion of entry size; caches that bound memory rather than count, or need TTLs and statistics, usually come from a maintained library.

## Exercises

### Predict the output

Using the `LRUCache` class from the example:

```js
const cache = new LRUCache(3);
cache.set('a', 1).set('b', 2).set('c', 3);
cache.set('a', 10);
cache.get('b');
cache.set('d', 4);
console.log(cache.get('c'), cache.get('a'), cache.get('b'), cache.get('d'));
```

**Answer:** `undefined 10 2 4`. Order after the three inserts is a, b, c. Updating `a` moves it to the end (b, c, a), reading `b` gives c, a, b, and inserting `d` evicts `c`, the least recently used.

### Find the bug

```js
const entries = new Map();
function put(key, value) {
  entries.set(key, value);
  if (entries.size > 2) entries.delete(entries.keys().next().value);
}
put('a', 1);
put('b', 2);
put('a', 3);
put('c', 4);
console.log([...entries]);
```

**Answer:** `[ [ 'b', 2 ], [ 'c', 4 ] ]`. `put('a', 3)` updated `a` in place without moving it, so `a` was still first and got evicted, although it was the most recently written key. Add `entries.delete(key)` before `entries.set(key, value)`.
