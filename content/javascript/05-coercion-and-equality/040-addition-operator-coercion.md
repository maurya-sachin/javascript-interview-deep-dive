---
title: "Why does `[] + {}` give `\"[object Object]\"`?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [coercion, addition, plus-operator, string-concatenation, to-primitive]
related:
  - javascript/coercion-and-equality/object-to-primitive
  - javascript/coercion-and-equality/loose-equality
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-addition-operator-plus
  - https://tc39.es/ecma262/#sec-applystringornumericbinaryoperator
  - https://tc39.es/ecma262/#sec-toprimitive
  - https://tc39.es/ecma262/#sec-tonumeric
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Addition
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/block
tldr: >
  Binary `+` converts both operands with `ToPrimitive` (default hint). If either result is a string, it
  converts the other with `ToString` and concatenates; otherwise it converts both with `ToNumeric` and adds.
  `[]` becomes `""` and `{}` becomes `"[object Object]"`, so the concatenation is `"[object Object]"`.
  Mixing BigInt and Number throws.
---

## Answer

Binary `+` follows one rule, from the spec's `ApplyStringOrNumericBinaryOperator`:

1. Convert both operands with `ToPrimitive` (no hint, so `valueOf` then `toString` for ordinary objects; `Date` uses string).
2. If **either** primitive is a String, convert the other with `ToString` and **concatenate**.
3. Otherwise convert both with `ToNumeric` (Number or BigInt) and **add**. If one is a BigInt and the other a Number, throw a `TypeError`.

For `[] + {}`: `[]` calls `valueOf` (returns the array itself, not a primitive), then `toString`, which joins no elements and gives `""`. `{}` gives `"[object Object]"` the same way. One side is a string, so the result is `"" + "[object Object]"`.

The rule explains the common cases: `1 + "2"` is `"12"`, `1 + 2 + "3"` is `"33"` (left to right), `"3" + 1 + 2` is `"312"`, `true + 1` is `2`, `null + 1` is `1`, and `undefined + 1` is `NaN`.

Only `+` concatenates. `-`, `*`, `/` and the others always convert to numbers, so `"5" - 2` is `3`. The unary `+x` is also numeric: it is the idiomatic short form of `Number(x)`.

`{} + []` printed in a console often shows `0`. That is a parsing artifact: at the start of a statement, `{}` is parsed as an empty block, leaving the expression `+[]`, which is `0`. In expression position (such as an argument, `console.log({} + [])`) it is `"[object Object]"` again.

## Example

```js
console.log([] + {}); // → [object Object]
console.log({} + []); // → [object Object]
console.log([] + [] === ""); // → true
console.log([1, 2] + [3]); // → 1,23

console.log(1 + "2", "3" + 1 + 2, 1 + 2 + "3"); // → 12 312 33
console.log(true + 1, null + 1, undefined + 1); // → 2 1 NaN
console.log("5" - 2, +"5" + 2, "5" * "2"); // → 3 7 10

try {
  console.log(1n + 1);
} catch (error) {
  console.log(error.name); // → TypeError
}
console.log(1n + "1", `${1n}` + 1n); // → 11 11
```

## Pitfalls

- Reading `{} + []` as `0` from a console. That is a block statement followed by `+[]`; as an expression it is `"[object Object]"`.
- Summing user input without parsing. `"10" + 5` is `"105"`; `Number(input) + 5` or `+input + 5` is numeric.
- Assuming evaluation groups strings first. `+` is left associative: `1 + 2 + "3"` adds before concatenating.
- Mixing BigInt and Number. `1n + 1` throws; convert explicitly with `BigInt(1)` or `Number(1n)`.

## Follow-ups

**Q:** Why does `[] + {}` differ from `[] - {}`?
**A:** `-` has no string branch. It converts both operands with `ToNumeric`: `[]` → `""` → `0`, `{}` → `"[object Object]"` → `NaN`, so the result is `NaN`.

**Q:** What does `new Date() + 1` return?
**A:** A string. `Date` treats the default hint as `"string"`, so the date's text is concatenated with `"1"`.

**Q:** How do you avoid concatenation surprises in your own code?
**A:** Use template literals for strings and convert numeric input at the boundary with `Number()` or `parseInt`, then add. Do not rely on `+` to pick the type.

## Exercises

### Left to right

```js
console.log(1 + 2 + "3", "1" + 2 + 3, 1 + +"2", "1" - -"1");
```

**Answer:** `33 123 3 2`. The first two follow left-to-right grouping. `+"2"` is the number `2`. `"1" - -"1"` is `1 - -1`, which is `2`.

### Predict the types

```js
console.log(typeof ([] + 1), typeof (null + 1), [2] * [3]);
```

**Answer:** `string number 6`. `[] + 1` is `"1"` (the array becomes `""`). `null + 1` is the number `1`. `[2] * [3]` converts each array to a string, then to a number: `2 * 3`.
