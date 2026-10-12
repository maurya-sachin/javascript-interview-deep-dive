---
title: "Why is `\"😀\".length` 2?"
status: draft
difficulty: medium
frequency: 3
core: true
tags: [string, utf-16, unicode, code-unit, code-point, surrogate-pair]
related:
  - javascript/strings-and-unicode/graphemes-and-code-points
  - javascript/strings-and-unicode/well-formed-strings
  - javascript/values-and-types/language-types
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-ecmascript-language-types-string-type
  - https://tc39.es/ecma262/#sec-string.prototype-%symbol.iterator%
  - https://tc39.es/ecma262/#sec-properties-of-string-instances-length
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/codePointAt
tldr: >
  A JavaScript string is a sequence of 16-bit UTF-16 code units, and `length` counts those units, not
  characters. "😀" is code point U+1F600, outside the 16-bit range, so it is stored as a surrogate pair
  (two units) and `length` is 2. Indexing and most methods work on units; the string iterator and
  `codePointAt` work on code points.
---

## Answer

Per ECMA-262, the String type is an ordered sequence of 16-bit unsigned integer elements, and operations that interpret the text treat each element as a **UTF-16 code unit**. `length` is the number of elements, not the number of characters a reader sees.

Unicode code points run from U+0000 to U+10FFFF. Code points up to U+FFFF fit in one code unit. Larger ones, such as the emoji U+1F600, are split into two code units: a **leading (high) surrogate** in `0xD800–0xDBFF` and a **trailing (low) surrogate** in `0xDC00–0xDFFF`. Together they form a **surrogate pair**. So `"😀".length` is `2`: its units are `0xD83D` and `0xDE00`.

What counts units and what counts code points:

- **Units:** `length`, `s[i]`, `at`, `charAt`, `charCodeAt`, `slice`, `substring`, `split("")`, `indexOf` positions.
- **Code points:** the string iterator (`for...of`, spread, `Array.from`) and `codePointAt`. Build one with `String.fromCodePoint` or `"\u{1F600}"`.

Two consequences follow. Slicing or indexing can cut a pair in half and leave a lone surrogate. And a code point is still not always what a user calls a character: `"é"` written as `e` plus a combining accent is two code points. That is the next question.

Strings are immutable: `s[0] = "x"` throws a `TypeError` in strict mode (modules) and is silently ignored in sloppy mode.

## Example

```js
const s = "😀";
console.log(s.length); // → 2
console.log(s.charCodeAt(0).toString(16), s.charCodeAt(1).toString(16)); // → d83d de00
console.log(s.codePointAt(0).toString(16)); // → 1f600
console.log(s.split("").length, [...s].length); // → 2 1

const text = "a😀b";
console.log(text.length, [...text].length); // → 4 3
console.log(text.slice(0, 2).isWellFormed()); // → false (cut the pair in half)
console.log(text.slice(0, 3)); // → a😀
```

## Pitfalls

- Using `s.length` for a character limit or a counter. It over-counts every emoji and every character above U+FFFF.
- `s.split("").reverse().join("")` and `s.slice(0, n)` break surrogate pairs; the result contains lone surrogates that render as `�` or get replaced when encoded.
- `s.codePointAt(i)` with `i` pointing at the trailing surrogate returns that lone unit, not the full code point. It reads from the index you give it.
- Assuming `length` equals byte size. UTF-8 size is different: `new TextEncoder().encode("😀").length` is `4`.

## Follow-ups

**Q:** Does `s[0] = "x"` change a string?
**A:** No. Strings are immutable. In strict mode (modules) the assignment throws a `TypeError`; in sloppy mode it is silently ignored. Methods like `slice` return new strings.

**Q:** How do you count code points?
**A:** `[...s].length` or `Array.from(s).length`. Both use the string iterator. That counts code points, not user-perceived characters.

## Deep dive

### How it works

The spec stores strings as elements and states that it "does not restrict the value of or relationships between these code units". Any 16-bit value is allowed, including surrogates in the wrong order. Only operations that interpret contents as code points need rules. They treat a leading surrogate followed by a trailing surrogate as a pair with the code point `(lead - 0xD800) × 0x400 + (trail - 0xDC00) + 0x10000`. A surrogate that is not part of a pair is read as a code point with the same numeric value.

```js
const lead = 0xd83d;
const trail = 0xde00;
console.log(((lead - 0xd800) * 0x400 + (trail - 0xdc00) + 0x10000).toString(16)); // → 1f600
console.log(String.fromCharCode(lead, trail) === "😀"); // → true
console.log(String.fromCodePoint(0x1f600) === "😀"); // → true
```

The iterator (`String.prototype[Symbol.iterator]`) walks the string with the same pair rule and yields the one- or two-unit substring at each step. That is why `for...of` yields `"😀"` once while an index loop visits two units.

### Edge cases

`codePointAt` reads from the given unit. A lone surrogate comes back as its own value, and the iterator yields a lone surrogate as a one-unit string.

```js
const s = "a😀";
console.log(s.codePointAt(1).toString(16)); // → 1f600
console.log(s.codePointAt(2).toString(16)); // → de00
console.log([..."\ud83d"].length); // → 1
```

`length` is bounded by `2 ** 53 - 1` elements by the spec, though engines impose much smaller limits.

Unit counts also differ from "what you see" even for BMP text. `"é".length` is `1` when precomposed (U+00E9) but `2` when written as `e` plus U+0301. The grapheme question is covered in the next question.

### Trade-offs

Unit-based strings make `length` and indexing by unit need no decoding. The cost is that code that needs code points or graphemes must iterate. Slicing by index is cheap and unsafe near non-BMP text. Prefer iteration (or `Intl.Segmenter`) when text comes from users, and use `length` only when you really want units, such as for buffer sizes in UTF-16 APIs.

## Exercises

### Count and slice

```js
const s = "Hi😀!";
console.log(s.length, [...s].length);
console.log(s.slice(0, 3).isWellFormed(), s.slice(0, 4));
```

**Answer:** `5 4`, then `false Hi😀`. `slice(0, 3)` keeps `H`, `i` and only the leading surrogate. `slice(0, 4)` takes both units of the pair.

### Which index?

```js
const s = "x😀y";
console.log(s.indexOf("y"), [...s].indexOf("y"));
```

**Answer:** `3 2`. `indexOf` returns a unit index; spreading first gives a code point index.
