---
title: "What are persistent data structures, and how does structural sharing make them cheap?"
status: draft
difficulty: hard
frequency: 2
core: false
tags: [persistent-data-structures, structural-sharing, path-copying, hamt, immutable-js]
related:
  - javascript/functional-programming/immutable-updates
  - javascript/values-and-types/why-no-records-and-tuples
  - javascript/objects-and-properties/freeze-seal-preventextensions
verified: 2026-10
perishable:
  - Immutable.js 5 uses 32-way nodes (SHIFT = 5)
sources:
  - https://lampwww.epfl.ch/papers/idealhashtrees.pdf
  - https://github.com/immutable-js/immutable-js/blob/main/README.md
  - https://immutable-js.com/
  - https://tc39.es/ecma262/#sec-object.freeze
tldr: >
  A persistent data structure keeps every old version valid: an update returns a new version
  instead of changing the old one. It stays cheap through structural sharing: the new version
  copies only the nodes on the path to the change and points at the rest. With 32-way trees, an
  update to a million entries copies about four small nodes.
---

## Answer

"Persistent" here means *every version survives*, not "saved to disk". `set`, `push` and `delete` return a new version, and anyone holding the old one still sees it unchanged. You get undo, time travel and safe sharing between readers for free.

Copying the whole collection on every update would make that useless at scale, so persistent structures rely on **structural sharing**. Data is stored as a tree of small, never-mutated nodes. An update uses **path copying**: it copies only the nodes from the root to the changed leaf and reuses every other node. The cost is the tree's depth times the node width, not the collection size.

The width is what makes it fast. Bagwell's *Ideal Hash Trees* (2001) describes the **hash array mapped trie (HAMT)**: hash the key, use 5 bits of the hash per level to pick one of 32 branches, and store only present branches in a compact array indexed by a 32-bit bitmap and a population count. The paper presents it as a fast, compact hash table; persistent libraries combine that layout with path copying. With 32-way nodes, a million entries fit in four levels (32⁴ = 1,048,576), so an update copies about four nodes.

JavaScript has no built-in persistent collections; the Records & Tuples proposal was withdrawn. Libraries fill the gap: Immutable.js's README says its `Map` and `List` use structural sharing via hash map tries and vector tries.

When it pays off: large collections, frequent updates, and old versions that stay alive. For small state, spread-based copying is simpler and faster to read. That's a judgement call, so measure.

## Example

```js
// A persistent singly linked list: nodes are never changed after creation.
const cons = (head, tail) => Object.freeze({ head, tail });

function toArray(list) {
  const out = [];
  for (let node = list; node !== null; node = node.tail) out.push(node.head);
  return out;
}

// Path copying: copy the nodes up to index i, share everything after it.
function setAt(list, i, value) {
  if (list === null) throw new RangeError('index out of range');
  if (i === 0) return cons(value, list.tail);
  return cons(list.head, setAt(list.tail, i - 1, value));
}

const base = cons(2, cons(3, null));
const a = cons(1, base); // 1 → 2 → 3
const b = cons(9, base); // 9 → 2 → 3
console.log(toArray(a), toArray(b)); // → [ 1, 2, 3 ] [ 9, 2, 3 ]
console.log(a.tail === b.tail); // → true

const c = setAt(a, 1, 20);
console.log(toArray(c), toArray(a)); // → [ 1, 20, 3 ] [ 1, 2, 3 ]
console.log(c.tail.tail === a.tail.tail); // → true
```

## Pitfalls

- Calling spread-and-freeze "persistent" and stopping there. Old versions survive, but each node is a flat copy, so updating one slot of an n-element array still costs O(n). Persistent structures bound the node size.
- Comparing library collections with `===`. Two separately built Immutable.js maps with the same content are different objects; its docs say to use `Immutable.is()` or `.equals()` for value equality.
- Converting back and forth with plain objects (`toJS()`, `fromJS()`) on every render. Each conversion walks the whole structure and throws away the sharing you paid for.
- Assuming reads are free. Every lookup walks several levels of pointers, so reads are slower than on a flat array or object.

## Follow-ups

**Q:** Why 32-way nodes?
**A:** It keeps trees shallow (log₃₂ n levels) and one bitmap fits a 32-bit word, which is what Bagwell's paper optimises for. Wider nodes mean fewer levels but more slots to copy per update. In Immutable.js 5's source, `SHIFT = 5`, so nodes are 32 wide.

**Q:** Does a no-op update allocate?
**A:** In Immutable.js, no: its README says it avoids creating new objects when the value doesn't change, and `map.set('a', 1)` on a map where `a` is already `1` returns the same reference. Your own path-copying code should do the same check to keep identity stable.

**Q:** Why doesn't JavaScript have these built in?
**A:** Records & Tuples would have added deeply immutable, content-compared primitives, but it stalled at Stage 2 and was withdrawn in 2025. Its successor, Composites, targets structural equality for keys, not persistent collections.

## Deep dive

### How it works

A vector trie (the "list" shape) finds element *i* by slicing its index into 5-bit chunks, most significant first; each chunk picks a child at one level. Updating element *i* copies exactly the nodes this walk visits:

```js
const BITS = 5;
const MASK = 0b11111; // 31: five bits pick one of 32 children

const index = 1000; // in a two-level trie
console.log((index >>> BITS) & MASK, index & MASK); // → 31 8
```

A HAMT (the "map" shape) does the same with bits of the key's hash, but most nodes are sparse. Instead of 32 slots, a node holds a bitmap of which slots exist and a packed array of only those children. A child's position in the array is the number of set bits below its slot:

```js
const popcount = (n) => {
  let count = 0;
  for (; n !== 0; n &= n - 1) count++;
  return count;
};

const bitmap = 0b1010_0110; // children exist in slots 1, 2, 5 and 7
const slot = 5; // the 5 bits of the hash at this level
const present = ((bitmap >>> slot) & 1) === 1;
const position = popcount(bitmap & ((1 << slot) - 1)); // set bits below slot 5
console.log(present, position); // → true 2
```

Bagwell's paper uses a hardware population-count instruction (CTPOP) where one exists. Inserting into a persistent HAMT copies the node where the key lands, with one more entry and one more bit set, then copies each parent on the path so it points at the new child.

### Trade-offs

Persistent structures trade read speed and interoperability for cheap versioning. They win for undo stacks, large editor documents, and state that many readers hold at different versions. They lose when data is small, mostly read, or constantly crosses into code that expects plain arrays and objects, such as JSON, most UI libraries, and `structuredClone`.

## Exercises

### Predict the output

```js
// cons and setAt as in the Example
const v1 = cons('a', cons('b', cons('c', null)));
const v2 = setAt(v1, 2, 'C');
const v3 = setAt(v1, 0, 'A');
console.log(v2.tail === v1.tail, v3.tail === v1.tail, v2.head === v1.head);
```

**Answer:** `false true true`. Changing index 2 copies every node on the path (indexes 0, 1 and 2), so `v2.tail` is a new node. Changing index 0 copies only the first node and shares the whole tail. `v2.head` is the string `'a'`, copied by value into the new first node, so the heads compare equal even though the nodes differ.
