---
title: "`Number()` vs `parseInt()` vs unary `+` — how do they differ?"
status: draft
difficulty: easy
frequency: 4
core: false
tags: [number, parseint, parsefloat, type-coercion, parsing]
related:
  - javascript/numbers-and-bigint/nan-negative-zero-infinity
  - javascript/numbers-and-bigint/safe-integers-bigint
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-tonumber
  - https://tc39.es/ecma262/#sec-stringtonumber
  - https://tc39.es/ecma262/#sec-number-constructor
  - https://tc39.es/ecma262/#sec-unary-plus-operator
  - https://tc39.es/ecma262/#sec-parseint-string-radix
  - https://tc39.es/ecma262/#sec-parsefloat-string
  - https://tc39.es/ecma262/#sec-array.prototype.map
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseFloat
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Unary_plus
tldr: >
  `Number(x)` and `+x` convert the whole value strictly, so any junk gives `NaN` (and `''` gives `0`).
  `parseInt(s, radix)` and `parseFloat(s)` read a numeric prefix and ignore the rest, so `'42px'` gives
  `42`. Always pass a radix to `parseInt`. For user input, `Number()` plus a `Number.isFinite` check is the safest default.
---

## Answer

Two families, with different philosophies:

**Conversion: `Number(x)` and unary `+x`.** Both apply the language's `ToNumber` conversion to the *whole* value, so they behave the same on strings (MDN: unary plus uses the same steps as number coercion). The string must be entirely a valid numeric literal, apart from surrounding whitespace.

- `Number('42px')` is `NaN`. Any trailing junk makes it fail.
- `Number('')` and `Number('   ')` are `0`, not `NaN`. This is the classic trap with empty form fields.
- Decimal, exponent and `0x`/`0b`/`0o` prefixed forms work: `Number('0x1f')` is `31`. Numeric separators don't: `Number('1_000')` is `NaN`.
- Non-strings convert too: `null` → `0`, `undefined` → `NaN`, `true` → `1`, `[]` → `0`.
- Difference: `Number(1n)` returns `1`, while `+1n` throws `TypeError`.

**Parsing: `parseInt(string, radix)` and `parseFloat(string)`.** Both coerce the argument to a string, skip leading whitespace, and read the longest valid prefix. Anything after it is ignored; if there is no valid prefix the result is `NaN`.

- `parseInt('42px', 10)` is `42`; `parseInt('')` is `NaN`.
- `parseInt` returns integers only (`'3.9'` → `3`) and takes a radix from 2 to 36. Without a radix, `0x` means hexadecimal and everything else decimal. Always pass one: `parseInt(s, 10)`.
- `parseFloat` handles decimals and exponents, accepts `'Infinity'`, and doesn't understand hex: `parseFloat('0x10')` is `0`.

Rule of thumb: use `Number()` when the whole input must be a number (forms, query params, config). Use `parseInt`/`parseFloat` only when you expect trailing units such as `'12px'`. Neither validates for you: check with `Number.isNaN`, or `Number.isFinite` to reject infinities too.

## Example

```js
console.log(Number('42px'), parseInt('42px', 10), parseFloat('42.5px')); // → NaN 42 42.5
console.log(Number(''), parseInt('', 10), +'  7 '); // → 0 NaN 7
console.log(Number('0x1f'), parseInt('0x1f'), parseInt('1f', 16)); // → 31 31 31
console.log(Number('1e3'), parseInt('1e3', 10), parseFloat('1e3')); // → 1000 1 1000
console.log(Number('1_000'), parseInt('1_000', 10)); // → NaN 1
console.log(Number(null), Number(undefined), Number([]), Number([5])); // → 0 NaN 0 5

console.log(['1', '2', '3'].map(parseInt)); // → [ 1, NaN, NaN ]
console.log(['1', '2', '3'].map(Number)); // → [ 1, 2, 3 ]

console.log(parseInt(0.0000005), parseInt(1e21)); // → 5 1
console.log(Number(1n)); // → 1
```

## Pitfalls

- `['1', '2', '3'].map(parseInt)` gives `[1, NaN, NaN]`. `map` passes the index as the second argument, and `parseInt` reads it as the radix (`parseInt('2', 1)` is `NaN`). Use `map(Number)` or `map((s) => parseInt(s, 10))`.
- Treating `Number('')` as invalid. It is `0`, so an empty input silently becomes zero. Check for empty or whitespace-only strings first.
- Passing a Number to `parseInt`. It is converted to a string first, so `parseInt(0.0000005)` reads `'5e-7'` and returns `5`. Use `Math.trunc` for numbers.
- Assuming `parseInt` is safe for big integers. `parseInt('9007199254740993')` returns a `Number` and rounds to `9007199254740992`; use `BigInt('9007199254740993')`.

## Follow-ups

**Q:** Is unary `+` faster or better than `Number()`?
**A:** They convert the same way for the cases here. `Number(x)` states the intent and also accepts BigInt, so prefer it in application code; `+x` is a terse equivalent.

**Q:** What does `parseInt(null, 36)` return?
**A:** `1112745`. The argument is stringified to `'null'`, which is a valid base-36 number. It is the same coercion that makes `parseInt(0.0000005)` surprising.

## Exercises

### Predict the output

```js
console.log(Number('  12  '), Number('12 3'), parseInt('12 3', 10), parseFloat('.5'));
```

**Answer:** `12 NaN 12 0.5`. `Number` trims surrounding whitespace but rejects the inner space; the parsers stop at the first invalid character.

### Write a strict parser

```js
const parseQuantity = (raw) => {
  const trimmed = raw.trim();
  const value = Number(trimmed);
  return trimmed !== '' && Number.isFinite(value) ? value : null;
};
console.log(parseQuantity('12'), parseQuantity(''), parseQuantity('12px'), parseQuantity('1e400'));
```

**Answer:** `12 null null null`. The empty check avoids the `''` → `0` trap, `Number` rejects `'12px'`, and `isFinite` rejects `'1e400'`, which overflows to `Infinity`.
