---
title: "What does `JSON.stringify` drop or change?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [json, stringify, tojson, replacer, bigint, cycles, serialization]
related:
  - javascript/json-and-binary-data/json-parse-reviver
  - javascript/dates-temporal-intl/date-pitfalls
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-json.stringify
  - https://tc39.es/ecma262/#sec-serializejsonproperty
  - https://tc39.es/ecma262/#sec-quotejsonstring
  - https://tc39.es/ecma262/#sec-date.prototype.tojson
  - https://github.com/tc39/proposal-well-formed-stringify
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt#use_within_json
tldr: >
  `JSON.stringify` keeps only what JSON can express. Object properties holding `undefined`, functions, or symbols are
  dropped, and array slots with them become `null`. `NaN` and `Infinity` become `null`. `Map`, `Set`, and class
  getters lose their data. BigInt and cycles throw `TypeError`. `toJSON`, then the replacer, can change any value.
---

## Answer

`JSON.stringify(value, replacer, space)` walks the value and, for each property, runs one fixed pipeline (the spec's `SerializeJSONProperty`):

1. If the value is an object or a BigInt, call its `toJSON(key)` method if it has one. `Date.prototype.toJSON` is why dates become ISO strings.
2. If a replacer *function* was given, call it with `this` set to the holder object, passing `(key, value)`.
3. Unwrap `Number`, `String`, `Boolean`, and `BigInt` wrapper objects to their primitives.
4. Serialize by type.

What survives step 4:

| Value | In an object | In an array | At top level |
|---|---|---|---|
| `undefined`, function, symbol | property omitted | `null` | returns `undefined` (not a string) |
| `NaN`, `Infinity`, `-Infinity` | `null` | `null` | `"null"` |
| `-0` | `0` | `0` | `"0"` |
| BigInt | throws `TypeError` | throws | throws |
| Cycle | throws `TypeError` | throws | throws |

Only an object's **own enumerable string-keyed** properties are written (integer keys first, then insertion order). Symbol keys, inherited properties, non-enumerable properties, and `#private` fields are skipped. `Map`, `Set`, `RegExp`, and `Error` have no such properties, so they come out as `{}`. Prototype getters are not written.

The **replacer** can be a function (called for every key, root first with key `""`) or an array of strings and numbers that acts as an allow-list for object keys. An array replacer does not filter array elements, and applies at every depth. Returning `undefined` from the function drops the property.

**`space`** (a number, capped at 10, or a string truncated to its first 10 characters) turns on indentation.

Strings are escaped per `QuoteJSONString`. Since the well-formed `JSON.stringify` change (ES2019), a lone surrogate is written as an escape like `\ud800` instead of a broken character.

## Example

```js
const user = {
  name: 'Ada',
  nickname: undefined,
  greet() {},
  id: Symbol('id'),
  score: NaN,
  tags: [undefined, () => {}, 'ok'],
  joined: new Date(Date.UTC(2026, 0, 15)),
  roles: new Set(['admin']),
};
console.log(JSON.stringify(user));
// → {"name":"Ada","score":null,"tags":[null,null,"ok"],"joined":"2026-01-15T00:00:00.000Z","roles":{}}

console.log(JSON.stringify(undefined), JSON.stringify(() => {}));
// → undefined undefined

try { JSON.stringify({ count: 10n }); } catch (e) { console.log(e.name); }
// → TypeError

const calls = [];
JSON.stringify(
  { at: { toJSON(key) { calls.push(`toJSON(${key})`); return 'T'; } } },
  (key, value) => { calls.push(`replacer(${key || 'root'})`); return value; },
);
console.log(calls.join(' '));
// → replacer(root) toJSON(at) replacer(at)
```

## Pitfalls

- Round-tripping through `JSON.parse(JSON.stringify(x))` to deep-clone. It drops `undefined`, functions, and symbols, turns `Date` into strings, `Map` and `Set` into `{}`, `NaN` into `null`, and throws on BigInt and cycles. Use `structuredClone` when you need a real copy.
- Expecting a string back. `JSON.stringify(undefined)`, a function, or a symbol returns `undefined`, so `JSON.parse(JSON.stringify(x))` can throw on a value that looked harmless.
- Stringifying BigInt without a plan. The spec defines no default, and many consumers read JSON numbers as doubles, so a bare large number could lose precision. Choose a format: send a string, or define `BigInt.prototype.toJSON` (a global change) or a replacer.
- Using a `WeakSet` replacer to "fix" cycles. It also hides shared, non-cyclic references (the second occurrence becomes `[Circular]`), because it records every object ever seen, not just the current path.

## Follow-ups

**Q:** What is the difference between `toJSON` and the replacer?
**A:** `toJSON` is a method on the value, called first, and decides how that value serializes everywhere. The replacer is supplied by the caller and sees the result of `toJSON`. Use `toJSON` for a type's canonical form, a replacer for one call's policy.

**Q:** How do you serialize a `Map` or a BigInt?
**A:** Convert in a replacer: `v instanceof Map ? Object.fromEntries(v) : typeof v === 'bigint' ? v.toString() : v`. The reverse needs a reviver or a schema, because JSON does not record the original type.

**Q:** Why does `JSON.stringify` throw on cycles but not on a shared reference?
**A:** The spec keeps a stack of objects currently being serialized. An object already on that stack is a cycle and throws. Finishing an object pops it, so the same object appearing twice in siblings serializes twice.

**Q:** What does an invalid `Date` produce?
**A:** `Date.prototype.toJSON` returns `null` when the time value is not finite, so `JSON.stringify({ d: new Date(NaN) })` is `{"d":null}`. `toISOString()` would throw `RangeError` instead.

## Exercises

### What is printed?

```js
console.log(JSON.stringify({ a: 1, b: { a: 2, c: 3 }, c: 4 }, ['a', 'b']));
console.log(JSON.stringify([{ a: 1, b: 2 }], ['a']));
console.log(JSON.stringify({ b: 2, 1: 'x', a: 1 }));
```

**Answer:** `{"a":1,"b":{"a":2}}`, then `[{"a":1}]`, then `{"1":"x","b":2,"a":1}`. The array replacer is an allow-list applied at every depth, and is ignored for array elements. Integer-like keys come first, then string keys in insertion order.

### Will this throw?

```js
const shared = { x: 1 };
console.log(JSON.stringify({ p: shared, q: shared }));
const cyc = { child: {} };
cyc.child.parent = cyc;
JSON.stringify(cyc);
```

**Answer:** The first call prints `{"p":{"x":1},"q":{"x":1}}`: a shared reference is not a cycle, because `shared` is off the stack by the time `q` is visited. The second throws `TypeError` (`Converting circular structure to JSON` in V8), because `cyc` is still being serialized when `parent` points back to it.
