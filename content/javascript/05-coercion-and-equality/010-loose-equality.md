---
title: "How does `==` decide whether two values are equal?"
status: draft
difficulty: medium
frequency: 5
core: true
tags: [equality, coercion, loose-equality, is-loosely-equal, to-primitive]
related:
  - javascript/coercion-and-equality/truthy-falsy
  - javascript/coercion-and-equality/object-to-primitive
  - javascript/coercion-and-equality/equality-algorithms
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-islooselyequal
  - https://tc39.es/ecma262/#sec-isstrictlyequal
  - https://tc39.es/ecma262/#sec-tonumber
  - https://tc39.es/ecma262/#sec-toprimitive
  - https://tc39.es/ecma262/#sec-stringtonumber
  - https://tc39.es/ecma262/#sec-stringtobigint
  - https://tc39.es/ecma262/#sec-IsHTMLDDA-internal-slot
  - https://tc39.es/ecma262/#sec-date.prototype-%symbol.toprimitive%
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Equality_comparisons_and_sameness
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Equality
tldr: >
  `x == y` runs IsLooselyEqual. Same type: it behaves like `===`. `null` and `undefined` equal each other
  and nothing else. Otherwise it converts one side step by step: String to Number, Boolean to Number,
  Object to primitive via `ToPrimitive`. Different types that match no rule are `false`. Boolean-to-Number
  and object-to-primitive explain most surprises.
---

## Answer

`==` evaluates the spec operation **IsLooselyEqual(x, y)**, which tries rules in order and stops at the first that applies:

1. **Same type** → compare as `===` does (so `NaN == NaN` is `false`).
2. **`null` and `undefined`** are equal to each other, and to nothing else.
3. **Number and String** → convert the string with `ToNumber`, then compare again.
4. **BigInt and String** → parse the string as a BigInt (`StringToBigInt`); if it is not a valid integer string, the result is `false`.
5. **Boolean on either side** → convert it to a Number (`true` → `1`, `false` → `0`), then compare again.
6. **Object vs String, Number, BigInt or Symbol** → convert the object with `ToPrimitive` (no hint, so `valueOf` first for ordinary objects), then compare again.
7. **BigInt and Number** → equal if they represent the same mathematical value.
8. **Anything else** → `false`.

Each conversion step returns to the top of the algorithm, so one comparison can convert several times: `"1" == true` becomes `"1" == 1`, then `1 == 1`.

Notable consequences: `null == 0` is `false` (no rule converts `null`, so it falls through to rule 8), `NaN` is never equal to anything, and two objects compare by identity because they have the same type. Not transitive: `"0" == 0` and `0 == ""` are `true`, but `"0" == ""` is `false` (same type, so strict string comparison).

Default to `===`. The widely accepted exception is `x == null`, which tests for `null` or `undefined` in one check.

## Example

```js
console.log("1" == 1); // → true
console.log(true == 1); // → true
// "1" == true → "1" == 1 → 1 == 1
console.log("1" == true); // → true
// "true" == true → "true" == 1 → NaN == 1
console.log("true" == true); // → false
console.log(null == 0); // → false
console.log(null == undefined); // → true
console.log(NaN == NaN); // → false
// [1] → "1" → 1
console.log([1] == 1); // → true
// false → 0 first, then [] → "" → 0
console.log([] == false); // → true
// ![] is false, so this is [] == false
console.log([] == ![]); // → true
console.log(1n == "1"); // → true
console.log("0" == ""); // → false
```

## Pitfalls

- Thinking `==` compares by "truthiness". `"true" == true` is `false` because `true` becomes `1` and `"true"` becomes `NaN`; truthiness is never consulted.
- Expecting `null == 0` or `undefined == 0` to be `true`. Only `null` and `undefined` equal each other.
- Assuming `==` is transitive. `"0" == 0`, `0 == ""`, but `"0" != ""`.
- Forgetting the object rule: `[] == ""`, `[0] == false`, and `({}) == "[object Object]"` are all `true` through `ToPrimitive`.

## Follow-ups

**Q:** Why is `x == null` acceptable when `==` is otherwise avoided?
**A:** Rules 1 and 2 of the algorithm mean only `null` and `undefined` satisfy it. It reads as "is nullish" and has no coercion surprises. (Legacy: `document.all` also matches, via Annex B `[[IsHTMLDDA]]`.)

**Q:** Does `==` ever throw?
**A:** Yes: converting an object calls `ToPrimitive`, which can run user code or throw a `TypeError`. Symbols are never converted to Numbers by `==`, so `Symbol() == 1` is `false`, not an error.

**Q:** Does `1n == 1` mean BigInt and Number are the same type?
**A:** No. Rule 7 compares their mathematical values. `1n === 1` is `false` because the types differ.

## Deep dive

### How it works

The spec steps (ECMA-262, IsLooselyEqual), condensed:

```
1. If SameType(x, y): return IsStrictlyEqual(x, y).
2. null/undefined in either order: return true.
   (Annex B, browsers: [[IsHTMLDDA]] object vs null/undefined: true.)
3. Number vs String: compare x with ToNumber(y) (or the mirror).
4. BigInt vs String: n = StringToBigInt(string); undefined → false; else compare.
5. Boolean x: compare ToNumber(x) with y. Boolean y: likewise.
6. String/Number/BigInt/Symbol vs Object: compare with ToPrimitive(object).
7. BigInt vs finite Number: equal iff mathematical values are equal.
8. Return false.
```

Two properties follow. First, **Boolean conversion happens before object conversion**: in `[] == false`, `false` becomes `0` first, and only then is `[]` converted (`[]` → `""` → `0`). Second, `ToPrimitive` here is called with **no hint**, so it behaves like the number hint unless the object defines `Symbol.toPrimitive` (`Date` treats no hint as string; see the object-to-primitive question).

### Edge cases

`Number` strings follow `StringToNumber`: surrounding whitespace is ignored, an empty or whitespace-only string is `0`, and `"0x10"` is `16`, but `"1_0"` and `"10n"` are `NaN`.

```js
console.log(" 12\n" == 12); // → true
console.log("" == 0); // → true
console.log("0x10" == 16); // → true
console.log("1_0" == 10); // → false
console.log(2n == "2"); // → true
console.log(2n == "2.5"); // → false
console.log(Symbol.iterator == Symbol.iterator); // → true
console.log(Object("a") == "a"); // → true
console.log(Object("a") == Object("a")); // → false
```

Large values: a BigInt and a Number compare by exact mathematical value, so `2n ** 53n + 1n == 2 ** 53` is `false` even though `Number(2n ** 53n + 1n) === 2 ** 53`. `NaN` and the infinities are never equal to any BigInt.

### Real-world scenario

Form values and query parameters arrive as strings, so `req.query.page == 1` "works" until `page` is `" "` (whitespace → `0`) or `"0x1"` (→ `1`). Parse deliberately instead:

```js
const raw = "0x1";
console.log(raw == 1); // → true
const page = Number.parseInt(raw, 10);
console.log(page, page === 1); // → 0 false
```

### Trade-offs

`==` saves a cast when one operand's type is known, but readers must run the eight rules in their head. `===` is a single, local rule, and linters (`eqeqeq`, usually with a `null: "ignore"` option) enforce it. Use `==` only for the `x == null` idiom.

## Exercises

### Predict each result

```js
console.log([0] == false, "" == [], null == false, undefined == null, "b" + "a" + +"a" == "baNaN");
```

**Answer:** `true true false true true`. `[0]` → `"0"` → `0`, equal to `false` → `0`. `""` and `[]` → `""`. `null == false` becomes `null == 0`, which hits no rule and is `false`. The last: `"b" + "a" + NaN` is `"baNaN"`, same string.

### Non-transitivity

```js
const a = "0", b = 0, c = "";
console.log(a == b, b == c, a == c);
```

**Answer:** `true true false`. The first two convert the string to `0`; the third compares two strings, which differ.
