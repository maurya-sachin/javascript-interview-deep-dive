---
title: "Which values are falsy?"
status: draft
difficulty: easy
frequency: 5
core: false
tags: [coercion, truthy, falsy, to-boolean, logical-operators]
related:
  - javascript/coercion-and-equality/loose-equality
  - javascript/values-and-types/language-types
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-toboolean
  - https://tc39.es/ecma262/#sec-IsHTMLDDA-internal-slot
  - https://developer.mozilla.org/en-US/docs/Glossary/Falsy
  - https://developer.mozilla.org/en-US/docs/Glossary/Truthy
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing
tldr: >
  Eight values are falsy: `false`, `0`, `-0`, `0n`, `""`, `null`, `undefined`, and `NaN`. Browsers add one
  more, the legacy `document.all` object. Everything else is truthy, including `"0"`, `"false"`, `[]`, `{}`
  and `new Boolean(false)`. `if`, `!`, `&&`, `||`, `?:` and `while` all use the `ToBoolean` conversion.
---

## Answer

`ToBoolean` returns `false` for exactly these values:

- `false`
- `0` and `-0` (Number zero, either sign)
- `0n` (BigInt zero)
- `""` (the empty string)
- `null`
- `undefined`
- `NaN`

Every other value is truthy. In browsers there is one extra falsy *object*, `document.all`, kept for legacy compatibility through the Annex B `[[IsHTMLDDA]]` internal slot; it is not part of the core language and you will never create one.

The conversion happens implicitly in `if`, `while`, `for` conditions, `!`, `?:`, and as the test inside `&&`, `||`, and `!!`. Note that `&&` and `||` return one of their *operands*, not a Boolean. `Boolean(x)` and `!!x` convert explicitly.

Falsy is not the same as loosely equal to `false`. `ToBoolean` is a simple lookup; `==` goes through `IsLooselyEqual`. That is why `null` is falsy but `null == false` is `false`, and why `"0"` is truthy but `"0" == false` is `true`.

All objects are truthy, including `[]`, `{}`, and wrapper objects such as `new Boolean(false)`, since `ToBoolean` does not call `valueOf`.

Use `??` or an explicit check when a legitimate value may be falsy (`0`, `""`): `count || 10` replaces `0`, while `count ?? 10` replaces only `null` and `undefined`.

## Example

```js
const values = [false, 0, -0, 0n, "", null, undefined, NaN, "0", "false", [], {}, " ", -1, Infinity];
console.log(values.filter((v) => !v).length); // → 8
console.log(values.filter(Boolean).length); // → 7

console.log(Boolean(new Boolean(false))); // → true
console.log(null == false, "0" == false); // → false true

const retries = 0;
console.log(retries || 3); // → 3
console.log(retries ?? 3); // → 0
```

## Pitfalls

- Using `||` for defaults when `0`, `""`, or `false` is valid input. Use `??`.
- Treating `[]` and `{}` as falsy. Both are truthy; check `.length` or `Object.keys(...).length`.
- Assuming `new Boolean(false)` is falsy. It is an object, so it is truthy.
- Assuming a falsy value is `== false`. `null == false` and `NaN == false` are `false`, while the truthy `"0" == false` is `true`.

## Follow-ups

**Q:** Is `NaN` falsy, and what does `NaN || "x"` return?
**A:** `NaN` is falsy, so `NaN || "x"` returns `"x"`. `||` returns its right operand when the left is falsy.

**Q:** What is `document.all`?
**A:** A legacy browser collection. The spec allows hosts to give an object an `[[IsHTMLDDA]]` slot, which makes it falsy, `typeof` `"undefined"`, and loosely equal to `null`. Only `document.all` has it.

**Q:** Does `Boolean("false")` return `false`?
**A:** No. A non-empty string is truthy, regardless of its content.

## Exercises

### Count the truthy values

```js
console.log([0, "0", [], {}, NaN, "", " ", null, 0n, 1n].filter(Boolean).length);
```

**Answer:** `5`: `"0"`, `[]`, `{}`, `" "`, and `1n`. The other five (`0`, `NaN`, `""`, `null`, `0n`) are falsy.

### What does each expression return?

```js
console.log(0 || null, 0 ?? null, "" && "x", "a" && "b");
```

**Answer:** `null 0  b`; the third result is the empty string. `||` moves past falsy `0` and returns `null`. `??` keeps `0` (not nullish). `&&` stops at the falsy `""`. `"a" && "b"` returns the last operand, `"b"`.
