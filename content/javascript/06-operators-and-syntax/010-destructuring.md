---
title: "How does destructuring work, and where does it throw?"
status: draft
difficulty: easy
frequency: 4
core: false
tags: [destructuring, defaults, iterators, patterns]
related:
  - javascript/operators-and-syntax/spread-vs-rest
  - javascript/values-and-types/null-vs-undefined
  - javascript/functions/default-and-rest-parameters
  - javascript/iterators-and-generators/iteration-protocols
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-destructuring-assignment
  - https://tc39.es/ecma262/#sec-destructuring-binding-patterns
  - https://tc39.es/ecma262/#sec-runtime-semantics-bindinginitialization
  - https://tc39.es/ecma262/#sec-runtime-semantics-keyedbindinginitialization
  - https://tc39.es/ecma262/#sec-copydataproperties
  - https://tc39.es/ecma262/#sec-expression-statement
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring
tldr: >
  Destructuring unpacks properties (object pattern) or iterated values (array pattern) into
  bindings. A default applies only when the value is `undefined` — not `null`, `0`, or `''`.
  An object pattern throws `TypeError` on `null`/`undefined`; an array pattern throws on anything
  not iterable. Nested patterns throw when an intermediate value is missing.
---

## Answer

Destructuring is a pattern on the left of a declaration, assignment, parameter, or `for…of` head that pulls values out of the right-hand side.

- **Object patterns** `{ a, b: renamed, c = 1, ...rest }` read properties by key (`GetV`, so inherited properties and getters count, and primitives are boxed: `const { length } = 'abc'` works). `b: renamed` binds `renamed`, not `b`. `...rest` copies the remaining own enumerable properties into a new plain object.
- **Array patterns** `[x, , z, ...tail]` use the iteration protocol, not indexes. They work on any iterable (strings, `Set`, generators), a hole skips one value, and `...tail` collects the rest into a real array.
- **Defaults** `= expr` run only when the value is exactly `undefined`. `null`, `0`, `''`, and `false` are kept. The default expression is evaluated lazily, left to right, and may use earlier bindings.
- **Nesting** combines them: `{ user: { address: { city } } }`. Only `city` is bound; `user` and `address` are not.

**Where it throws:**

- Object pattern on `null` or `undefined` — `RequireObjectCoercible` fails with `TypeError`. This includes the empty pattern `const {} = null`.
- Array pattern on a non-iterable (`{}`, a number, `null`) — `TypeError` from `GetIterator` (V8 words it `{} is not iterable`).
- A nested pattern whose parent value is `undefined`: `const { a: { b } } = {}` reads `b` from `undefined` and throws. Give the parent a default: `{ a: { b } = {} }`.
- A default that reads a binding declared later in the same pattern hits the temporal dead zone (`ReferenceError`).

For assignment (no `const`/`let`), an `ExpressionStatement` can't start with `{` (it would parse as a block), so wrap it: `({ x } = obj);`.

## Example

```js
const response = {
  user: { name: 'Ada', address: { city: 'London' } },
  tags: ['a', 'b', 'c'],
  nothing: null,
  extra: 1,
};

const {
  user: { name: userName, address: { city, zip = 'n/a' } },
  tags: [firstTag, , thirdTag],
  nothing = 'default',
  missing = 'default',
  ...others
} = response;

console.log(userName, city, zip); // → Ada London n/a
console.log(firstTag, thirdTag); // → a c
console.log(nothing, missing); // → null default
console.log(others); // → { extra: 1 }
console.log(typeof user); // → undefined
```

## Pitfalls

- Expecting `null` to trigger a default. `const { x = 1 } = { x: null }` gives `null`; only `undefined` (or a missing key) does.
- Destructuring a nested value that may be absent without a fallback: `const { data: { items } } = response` throws if `data` is missing. Use `{ data: { items } = {} }`, but note that this still throws if `data` is `null`.
- Defaulting a whole parameter, not its fields: `function f({ a })` throws when called as `f()`. Write `function f({ a } = {})` — and `f(null)` still throws.
- Reading `user` after `{ user: { name } }` — it isn't bound. Only the leaf identifiers are.

## Follow-ups

**Q:** How do you swap two variables without a temporary?
**A:** `[a, b] = [b, a]`. The right side builds a new array first, then the array pattern assigns from its iterator.

**Q:** Does destructuring an array always read the whole iterable?
**A:** No. The pattern pulls only as many values as it has elements, then calls `return()` on the iterator if it isn't finished. A rest element drains it. That matters for generators with `finally` blocks.

**Q:** Is destructuring a copy?
**A:** Shallow. Each binding gets the value that was there — a primitive or an object reference. Nested objects are shared, not cloned.

## Exercises

### Predict the output

```js
const { a = 1, b = 2, c = a + b } = { a: undefined, b: null };
console.log(a, b, c);
```

**Answer:** `1 null 1`. `a` is `undefined`, so its default `1` is used. `b` is `null`, which is not `undefined`, so it stays `null`. `c` is missing, so its default runs with the bindings already made: `1 + null` is `1`, because `null` becomes `0` in addition.

### Fix the crash

```js
function render({ title, meta: { author } }) {
  return `${title} by ${author}`;
}
console.log(render({ title: 'T' }));
```

**Answer:** It throws a `TypeError` because `meta` is `undefined` and the nested pattern can't read `author` from it. Default the nested level: `{ title, meta: { author } = {} }`. Adding `author = 'unknown'` as well gives a readable fallback: `T by unknown`.
