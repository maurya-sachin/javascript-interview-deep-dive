---
title: "Which values are falsy?"
status: draft
difficulty: easy
frequency: 5
core: true
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
  - https://tc39.es/ecma262/#sec-assignment-operators
  - https://react.dev/learn/conditional-rendering
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

## Deep dive

### How it works

`ToBoolean` is a pure lookup on the value's type. It never calls `valueOf`, `toString` or `Symbol.toPrimitive`, and it never touches an object's properties, so it cannot run user code. That is why every object is truthy, including a `Proxy` (no trap fires) and a wrapper such as `Object(0n)` or `Object("")`:

```js
let calls = 0;
const spy = {
  valueOf() { calls++; return 0; },
  toString() { calls++; return ''; },
  [Symbol.toPrimitive]() { calls++; return 0; },
};
const proxy = new Proxy({}, { get() { calls++; return 0; } });

console.log(Boolean(spy), !!proxy, Boolean(Object(0n)), Boolean(Object('')), calls); // → true true true true 0
console.log(spy == 0, calls); // → true 1
```

The second line shows the contrast: `==` goes through `ToPrimitive`, which does call user code.

The operators then differ in what they do with the result:

- `if`, `while`, `for`, `?:` and `!` use the `ToBoolean` result directly.
- `a && b` and `a || b` evaluate `a`, compute `ToBoolean` only to *decide*, and then return the original operand value, never the Boolean. That is why `0 || null` is `null`.
- `a ?? b` skips `ToBoolean` entirely and checks only for `undefined` or `null`.

In V8 (observed with `node --print-bytecode` on Node 24.19, not a language guarantee), an `if (x)` test compiles to a single `JumpIfToBooleanFalse` bytecode, so the conversion is a dedicated instruction rather than a call to anything you could observe.

### Edge cases

- **Logical assignment short-circuits the write.** For `a ||= b` and `a &&= b` the spec evaluates `ToBoolean` on the current value and returns early without `PutValue` when the left side already decides the result. So a setter is not invoked when no assignment happens. `??=` follows the same shape with a nullish test.
- **`-0` and `0n` are falsy, `-1n` and `"0"` are not.** The rule is per value, not "looks like zero".
- **`== true` is not the same as truthy.** `ToBoolean` is applied by `if (x)`, but `x == true` converts `true` to `1` first, so `2 == true` is `false` even though `2` is truthy.

```js
const log = [];
const target = {
  _n: 0,
  get n() { return this._n; },
  set n(value) { log.push(value); this._n = value; },
};

target.n ||= 5; // 0 is falsy → assigns
target.n ||= 9; // 5 is truthy → setter not called
target.n &&= 7; // 5 is truthy → assigns
console.log(target.n, log); // → 7 [ 5, 7 ]

let retries = 0;
retries ??= 4; // 0 is not nullish → unchanged
console.log(retries); // → 0
```

### Real-world scenario

Truthiness checks fail at boundaries where the data is a *string* or a *number that can legitimately be 0*:

- **Environment variables and query strings are strings.** `FEATURE_X=false` gives the string `"false"`, which is truthy, so `if (process.env.FEATURE_X)` enables the feature. Parse explicitly.
- **React renders `0`.** React's docs warn against `messageCount && <p>…</p>`: when `messageCount` is `0`, the expression evaluates to `0`, and React renders it. Compare explicitly (`messageCount > 0 && …`) or use a ternary.

```js
const rawFlag = process.env.FEATURE_X; // run with FEATURE_X=false
console.log(Boolean(rawFlag), rawFlag === 'true'); // → true false

const parseFlag = (value) => value === 'true' || value === '1';
console.log(parseFlag('false'), parseFlag('1'), parseFlag(undefined)); // → false true false
```

### Trade-offs

Truthiness checks are short and idiomatic for "is there anything here" on values whose type you control, such as an optional object or a non-empty string. They hide intent when the type can include `0`, `""`, `NaN` or `false` as valid data. Prefer `??` when only `null`/`undefined` means missing, and an explicit comparison (`> 0`, `=== ''`, `Number.isNaN`) when a specific falsy value matters. Lint rules that forbid truthiness checks on non-Boolean values (for example TypeScript-aware ones) trade brevity for catching exactly these bugs; adopting one is a team call.

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
