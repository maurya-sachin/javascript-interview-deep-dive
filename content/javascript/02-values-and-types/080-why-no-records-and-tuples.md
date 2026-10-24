---
title: "Why doesn't JavaScript have immutable records and tuples?"
status: draft
difficulty: medium
frequency: 1
core: false
tags: [records-and-tuples, composites, immutability, equality, tc39]
related:
  - javascript/values-and-types/language-types
  - javascript/coercion-and-equality/equality-algorithms
  - javascript/objects-and-properties/freeze-seal-preventextensions
  - javascript/functional-programming/immutable-updates
  - javascript/how-javascript-runs/tc39-process
verified: 2026-10
perishable:
  - Composites is at Stage 2
  - Composites draft interns values so === compares contents
sources:
  - https://github.com/tc39/proposals/blob/main/inactive-proposals.md
  - https://github.com/tc39/proposal-record-tuple
  - https://github.com/tc39/notes/blob/HEAD/meetings/2025-02/february-19.md#records-and-tuples-future-directions
  - https://github.com/tc39/notes/blob/HEAD/meetings/2025-04/april-14.md#withdrawing-records--tuples
  - https://github.com/tc39/proposals/blob/main/README.md
  - https://github.com/tc39/proposal-composites
  - https://tc39.es/ecma262/#sec-ecmascript-language-types
  - https://tc39.es/ecma262/#sec-samevaluezero
  - https://tc39.es/ecma262/#sec-object.freeze
tldr: >
  The Records & Tuples proposal (`#{ x: 1 }`, `#[1, 2]`) would have added deeply immutable
  compound primitives compared by content with `===`. It stalled at Stage 2 because the
  committee wouldn't add new primitive types or overload `===`, and was withdrawn in April 2025.
  Its successor, Composites, uses frozen objects with structural equality as `Map`/`Set` keys.
---

## Answer

Records & Tuples (R&T) was a TC39 proposal for two new value types:

- a **Record**, `#{ x: 1, y: 2 }`, like an object, and
- a **Tuple**, `#[1, 2, 3]`, like an array.

They were to be **primitives**: `typeof` would report `"record"` and `"tuple"`, they could contain only primitives and other records and tuples (an object inside threw a `TypeError`), so they were deeply immutable, and `===` compared them **by content**. `#{ a: 1 } === #{ a: 1 }` would be `true`, so they'd work directly as `Map` keys.

It reached Stage 2 and then stalled. Ashley Claymore's February 2025 summary to TC39 records the constraints it hit: any design must not add new primitives, and there was no appetite to overload `===` with content comparison. The same talk relayed a committee view that values which look like objects and arrays but aren't objects would confuse JavaScript users. At the April 2025 plenary the committee agreed to withdraw it; TC39's inactive-proposals list now says *Subsumed by Composites*.

**Composites** is the successor, at Stage 2 as of October 2026. It keeps the main use case, compound keys, but within those constraints: a composite is an ordinary **frozen object**, it can hold any value (so it's only shallowly immutable), and equal composites are treated as the same key by `Map` and `Set`. The current draft does this by interning, so equal composites are literally the same object; the README warns the design will change.

Until then, the language has only objects compared by identity. You build immutability from `Object.freeze` (shallow), TypeScript's `readonly` (compile time only), or libraries, and you build compound keys by hand.

## Example

```js
const a = Object.freeze({ x: 1, y: 4 });
const b = Object.freeze({ x: 1, y: 4 });

console.log(a === b); // → false
console.log(new Set([a, b]).size); // → 2

// Today's workaround: derive a primitive key yourself.
const key = ({ x, y }) => `${x},${y}`;
const itemAt = new Map([[key(a), 'book']]);
console.log(itemAt.get(key(b))); // → book

// JSON.stringify is a fragile key: property order changes the string.
console.log(JSON.stringify({ x: 1, y: 4 }) === JSON.stringify({ y: 4, x: 1 })); // → false

// The withdrawn syntax never shipped.
try {
  eval('#{ x: 1 }');
} catch (error) {
  console.log(error.name); // → SyntaxError
}
```

## Pitfalls

- Thinking `Object.freeze` gives value semantics. A frozen object is still compared by identity, and freezing is shallow.
- Describing Records & Tuples as coming soon. It's withdrawn; its syntax is a SyntaxError in every engine.
- Assuming Composites will be R&T with a new name. They're objects, not primitives, `typeof` stays `"object"`, and contents aren't deeply immutable.
- Using `JSON.stringify` as a compound key. Key order changes the string, `undefined` and functions are dropped, and `BigInt` throws.

## Follow-ups

**Q:** Why not just make `===` compare frozen objects deeply?
**A:** It would change what `===` means for existing code, cost time proportional to the structure's size, and need rules for cycles, getters, and proxies. Composites sidestep this: equality is decided once, at creation.

**Q:** Is TypeScript's `Record<K, V>` related?
**A:** No. It's a compile-time utility type for an object whose keys are `K` and values `V`. Because of that precedent, the Composites champion told TC39 that "Record" is the one name it shouldn't use.

**Q:** What should you use for value-like data today?
**A:** Plain objects, frozen if you want mutation to fail, with structural comparison written for the shape you have. For `Map`/`Set` keys, derive a primitive key (a string or number) from the fields that define identity.

## Exercises

### Predict the output

```js
const k1 = JSON.stringify({ id: 1, note: undefined });
const k2 = JSON.stringify({ id: 1 });
console.log(k1 === k2, new Set([[1, 2], [1, 2]]).size);
```

**Answer:** `true 2`. `JSON.stringify` omits properties whose value is `undefined`, so two different objects produce the same key `{"id":1}`. The two arrays are separate objects, and `Set` compares objects by identity (SameValueZero), so both stay in the set.
