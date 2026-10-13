---
title: "What are hidden classes and inline caches?"
status: draft
difficulty: hard
frequency: 3
core: true
tags: [v8, hidden-classes, maps, shapes, inline-caches, monomorphic, megamorphic, performance]
related:
  - javascript/inside-the-engine/v8-pipeline
  - javascript/inside-the-engine/deoptimization
  - javascript/inside-the-engine/elements-kinds
verified: 2026-10
sources:
  - https://v8.dev/blog/fast-properties
  - https://v8.dev/docs/hidden-classes
  - https://v8.dev/blog/system-analyzer
  - https://v8.dev/blog/wasm-speculative-optimizations
  - https://nodejs.org/docs/latest/api/cli.html
tldr: >
  V8-specific, not ECMAScript. V8 gives objects a hidden class (a Map) describing their property names and
  layout; adding a property moves the object to a new Map along a transition tree. An inline cache at each
  property access remembers the Maps it has seen, so a lookup becomes a Map check plus a fixed-offset load.
  Consistent shapes keep it fast.
---

## Answer

Everything here is **V8 behaviour**, not part of the language. Other engines have the same idea under other names ("shapes", "structures"). Observed on Node 24.19 (V8 13.6).

**Hidden class (Map).** Per V8's blog, objects with the same structure, meaning the same properties in the same order, have the same hidden class. The Map records property names and where each lives, so the object itself stores only values. Every named property you add moves the object to another Map, and V8 links these Maps in a **transition tree**. Two objects built through the same sequence of additions end up sharing a Map.

**Property storage.** Properties live either **in-object** (the fastest), in a separate properties array indexed through the Map's descriptor array, or in a dictionary ("slow" mode). Inline caches do not work with dictionary properties. Indexed properties are stored apart, in the elements store ([elements kinds](040-elements-kinds.md)).

**Inline cache (IC).** Each property access site (`o.x`) has a slot in the function's feedback vector. The IC remembers which Maps it has seen there and, for each, where `x` lives. The next access checks the object's Map against the cached one and loads from a known offset, skipping a general lookup. Optimizing tiers read the same feedback and compile that check straight into machine code.

**States.** An IC starts uninitialised. One Map seen is **monomorphic**, a few are **polymorphic** (extra checks), and too many are **megamorphic**. The Wasm speculative-optimization post puts the limit at four targets for call feedback. For property loads I observed the same cut-off below.

**What to do.** Initialise all properties in the constructor, in the same order, and avoid `delete`.

## Example

```js
// shapes.mjs. Run: node --allow-natives-syntax shapes.mjs (Node 24.19, V8 13.6).
// %HaveSameMap and %HasFastProperties are debug-only natives, not public API.
const p1 = { x: 1, y: 2 };
const p2 = { x: 3, y: 4 };
const p3 = { y: 2, x: 1 };
console.log(%HaveSameMap(p1, p2)); // → true
console.log(%HaveSameMap(p1, p3)); // → false

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}
console.log(%HaveSameMap(new Point(1, 2), new Point(3, 4))); // → true

const p4 = { x: 1, y: 2 };
delete p4.x;
console.log(%HaveSameMap(p1, p4), %HasFastProperties(p4)); // → false false
```

Property order matters (`p1` vs `p3`), and `delete` moved `p4` to dictionary mode (`%HasFastProperties` is `false`), so it no longer shares a Map with `p1`.

## Pitfalls

- Saying "same properties means same Map". The blog's rule is simplified: same properties, same order, and the same creation route. In my runs `{ x: 1, y: 2 }` and an object built as `{}` then `o.x = 1; o.y = 2` had different Maps (see Edge cases).
- Adding properties conditionally or in varying order, which creates several Maps for what you think of as one type and turns every access site polymorphic.
- Using `delete` on hot objects. In the example it sent the object to dictionary mode. Assign `undefined` or `null`, or build a new object, when you need a property to go away.
- Reading IC states or Maps as a public API. `%`-natives and `%DebugPrint` layouts are debugging aids that change between V8 versions.

## Follow-ups

**Q:** Why is a megamorphic access slow?
**A:** One cache entry can no longer describe it, so V8 falls back to a more general lookup, and optimized code cannot assume a shape. The exact fallback path is internal to V8 and I have not verified it.

**Q:** Does this apply to `Map` and `Object.create(null)` dictionaries?
**A:** A real dictionary-mode object gets no fast-property inline caching, per the blog. For key/value tables with changing keys, use `Map`.

**Q:** Do classes avoid the problem?
**A:** Only if every instance runs the same assignments in the same order. A class whose constructor adds a property under a condition gives two Maps.

## Deep dive

### How it works

Start from an empty literal and add properties:

```js
// transitions.mjs. Run: node --allow-natives-syntax transitions.mjs
const o = {};
o.x = 1;
o.y = 2;
%DebugPrint(o);
```

Trimmed output on Node 24.19:

```text
 - map: 0x… <Map[56](HOLEY_ELEMENTS)> [FastProperties]
 - instance size: 56
 - inobject properties: 4
 - unused property fields: 2
 - back pointer: 0x… <Map[56](HOLEY_ELEMENTS)>
 - instance descriptors (own) #2: 0x… <DescriptorArray[2]>
```

Read it as the blog describes: the Map has a **back pointer** to the Map before the last transition, which is how the transition chain `{}` to `{x}` to `{x, y}` is linked. Its descriptor array holds two entries, `x` and `y`. `[FastProperties]` means not dictionary mode. The object has room for four in-object properties and uses two (`unused property fields: 2`). I did not read V8's source for the slack-sizing policy.

Two takeaways. The Map, not the object, holds the names. And a different route to the same keys can land on a different Map.

### Edge cases

Whether two objects share a Map depends on the route that built them, not only on their final keys:

```js
// routes.mjs. Run: node --allow-natives-syntax routes.mjs
const literal = { x: 1, y: 2 };
const built = {};
built.x = 1;
built.y = 2;
const built2 = {};
built2.x = 1;
built2.y = 2;
console.log(%HaveSameMap(built, built2)); // → true
console.log(%HaveSameMap(literal, built)); // → false
```

`%DebugPrint` showed why in this build: the literal's Map had `instance size: 40` with `inobject properties: 2`, while the incrementally built object's Map had `instance size: 56` with `inobject properties: 4`. I conclude the difference comes from how many in-object slots were allocated for each creation route. V8's blog does not describe this. Treat it as a sign that "the same keys" is a weaker promise than "the same construction code".

Other transitions out of the fast path: `delete` of a property other than the most recently added one switched to dictionary mode in my run (`properties` became a `NameDictionary`, with no in-object properties). The blog's explanation is the cost of keeping descriptor arrays and Maps up to date for objects that get many additions and deletions.

### Real-world scenario

A constructor that adds a field conditionally splits one class into two shapes. This pattern is the case study in V8's own Indicium post, where the fix was to always initialise the property.

```js
// vec.mjs. Run: node --allow-natives-syntax --no-lazy-feedback-allocation vec.mjs
class Vec {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    if (x < 0) this.isNegative = true; // sometimes adds a field
  }
}
function readX(v) {
  return v.x;
}
console.log(%HaveSameMap(new Vec(1, 2), new Vec(-1, 2))); // → false
readX(new Vec(1, 2));
readX(new Vec(-1, 2));
%DebugPrint(readX); // → slot #0 LoadProperty POLYMORPHIC
```

Replacing the `if` with `this.isNegative = x < 0;` made `%HaveSameMap` return `true` in my run. Any code reading `v.x` now sees one Map instead of two.

How many Maps tip an IC over? With `--no-lazy-feedback-allocation` I called `function getX(o) { return o.x; }` with objects of 1, 2, 3, 4 and 5 distinct shapes and printed the slot after each call:

```text
1 shape  → LoadProperty MONOMORPHIC
2-4      → LoadProperty POLYMORPHIC
5        → LoadProperty MEGAMORPHIC
```

That matches the "up to four" wording in the Wasm post, but for property loads it is my observation on this V8 only.

### Trade-offs

The design buys speed for monomorphic code: a Map check and a load at a fixed offset. In return it penalises code that is "dynamic" in practice: many shapes, varying property order, `delete`. Writing JavaScript that keeps a few stable shapes is not a language rule, it is a bet that the optimizer's assumptions hold. Do it where a profile says a hot path is polymorphic, not everywhere.

## Exercises

### Same Map or not?

```js
// same-map.mjs. Run: node --allow-natives-syntax same-map.mjs
class A {
  constructor(flag) {
    this.a = 1;
    if (flag) this.b = 2;
    this.c = 3;
  }
}
console.log(%HaveSameMap(new A(true), new A(true)));
console.log(%HaveSameMap(new A(true), new A(false)));
```

**Answer:** `true`, then `false`. Two `true` calls follow the same assignment sequence (`a`, `b`, `c`), so they share a Map. Skipping `b` gives a different sequence. Observed on Node 24.19.
