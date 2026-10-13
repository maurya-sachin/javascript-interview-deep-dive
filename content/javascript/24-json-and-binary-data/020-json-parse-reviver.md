---
title: "How do `JSON.parse` revivers work, and what does source text access add?"
status: draft
difficulty: medium
frequency: 1
core: false
tags: [json, parse, reviver, rawjson, source-text, bigint, precision]
related:
  - javascript/json-and-binary-data/json-stringify-edge-cases
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-json.parse
  - https://tc39.es/ecma262/#sec-internalizejsonproperty
  - https://tc39.es/ecma262/#sec-json.rawjson
  - https://tc39.es/ecma262/#sec-json.israwjson
  - https://github.com/tc39/proposal-json-parse-with-source
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/rawJSON
tldr: >
  A reviver is called once per value, children before parents, with the root last under key `""`. Returning
  `undefined` deletes the property. Numbers are already doubles by then, so big integers are lossy. The third
  argument `context.source` gives a primitive's original text, and `JSON.rawJSON` writes such text back out. Both are
  stage 4 and ship in Node 22 and 24.
---

## Answer

`JSON.parse(text, reviver)` first parses the whole text into plain values, then walks the result bottom-up and calls `reviver.call(holder, key, value, context)` for every value:

- **Order:** post-order. An object's properties are revived before the object itself, and the root comes last with key `""`. In `{"a":{"b":1},"c":[2,3]}` the keys arrive as `b a 0 1 c ""`.
- **`this`** is the object holding the value; `key` is its property name (array indexes are strings).
- **Return value:** whatever you return replaces the value. Returning `undefined` deletes the property (an array element becomes a hole).

Typical uses are turning date strings into `Date` objects, or dropping fields. A reviver cannot know the original type, so you decide by key or by shape.

**The precision problem.** By the time the reviver sees a number, the parser has already converted it to a double. `12345678901234567890` becomes `12345678901234567000` and `1.10` becomes `1.1`.

**Source text access** (stage 4 in November 2025, listed for ES2026) fixes that with a third argument. For a **primitive** value (string, number, boolean, `null`) that is still unmodified, `context.source` is the exact text from the input, for example `"12345678901234567890"` or `"1E2"`. For objects and arrays there is no `source`, and `context` is `{}`. It is also absent if an earlier reviver call replaced that value.

The matching write side is **`JSON.rawJSON(text)`**. It returns a frozen, null-prototype object that `JSON.stringify` emits verbatim, so a BigInt can leave as a JSON number. `JSON.isRawJSON(x)` tests for it. `rawJSON` accepts only the text of a primitive: no objects or arrays, and no leading or trailing whitespace. Invalid text throws `SyntaxError`.

Availability: both ship in Node 22 and 24 (V8 11.4+, Chrome 114), Firefox 135, and Safari 18.4. Guard with `typeof JSON.rawJSON === 'function'` if you target older engines.

## Example

```js
const text = '{"id":12345678901234567890,"price":1.10,"name":"Ada"}';

console.log(JSON.parse(text).id);
// → 12345678901234567000

const order = JSON.parse(text, (key, value, { source }) =>
  key === 'id' ? BigInt(source) : value,
);
console.log(order.id);
// → 12345678901234567890n

// Writing it back: BigInt has no default JSON form, rawJSON supplies one
const body = JSON.stringify(order, (key, value) =>
  typeof value === 'bigint' ? JSON.rawJSON(String(value)) : value,
);
console.log(body);
// → {"id":12345678901234567890,"price":1.1,"name":"Ada"}

console.log(JSON.isRawJSON(JSON.rawJSON('1')), JSON.isRawJSON({ rawJSON: '1' }));
// → true false
```

## Pitfalls

- Doing `BigInt(value)` inside the reviver. `value` is already rounded, so the digits are wrong. Use `context.source`.
- Assuming `source` always exists. It is missing for objects and arrays, and for any value that an earlier reviver call changed (for example by assigning to a sibling through `this`). Check `source !== undefined`.
- Forgetting that the root is revived too. A reviver that returns `undefined` for keys it does not handle makes `JSON.parse` itself return `undefined`, because the last call (key `""`) supplies the result.
- Treating `rawJSON` as a general escape hatch. It does not validate that the consumer can read the number, and `price: 1.10` still comes back as `1.1` in the example above because only `id` was re-wrapped.

## Follow-ups

**Q:** Why can't a reviver restore a `Date` or a `Map` on its own?
**A:** JSON has no type tags, so the reviver sees only strings, numbers, and structure. You need a convention (a key name, a `{ "$type": "date" }` wrapper) or a schema to know what to rebuild.

**Q:** Does the reviver run on a text that fails to parse?
**A:** No. `JSON.parse` validates the whole text first and throws `SyntaxError` before any reviver call. Revival is a second pass over the finished value.

**Q:** How do you keep a number's exact text when round-tripping?
**A:** Revive numbers with `JSON.rawJSON(source)` and stringify the result: `1.10` and `12345678901234567890` are written back unchanged. The values in memory are then raw wrappers, not numbers.

**Q:** What if two keys are duplicated, like `{"a":1,"a":2}`?
**A:** The last one wins and `JSON.parse` does not report the duplicate. The reviver sees only `a: 2`.

## Exercises

### What does the reviver see?

```js
const seen = [];
JSON.parse('{"a":{"b":1},"c":[2,3]}', (key, value) => {
  seen.push(key === '' ? 'root' : key);
  return value;
});
console.log(seen.join(' '));
```

**Answer:** `b a 0 1 c root`. Revival is post-order: the inner `b` before `a`, the array elements `0` and `1` before `c`, and the root last.

### Which sources are present?

```js
JSON.parse('{"n":1E2,"s":"x","o":{}}', (key, value, context) => {
  if (key !== '') console.log(key, 'source' in context ? context.source : '(none)');
  return value;
});
```

**Answer:** `n 1E2`, then `s "x"` (the text includes the quotes), then `o (none)`. Source text is the raw input slice for primitives, so `1E2` is kept rather than `100`, and objects have no `source`.
