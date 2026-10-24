---
title: "`slice` vs `substring` vs `at`: which string methods accept negative indices, and why?"
status: draft
difficulty: easy
frequency: 4
core: false
tags: [strings, slice, substring, at, padstart, replaceall]
related:
  - javascript/strings-and-unicode/utf16-string-length
  - javascript/strings-and-unicode/graphemes-and-code-points
  - javascript/how-javascript-runs/annex-b-legacy-features
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-string.prototype.slice
  - https://tc39.es/ecma262/#sec-string.prototype.substring
  - https://tc39.es/ecma262/#sec-string.prototype.at
  - https://tc39.es/ecma262/#sec-string.prototype.substr
  - https://tc39.es/ecma262/#sec-toclampedindex
  - https://tc39.es/ecma262/#sec-toabsoluteindex
  - https://tc39.es/ecma262/#sec-string.prototype.padstart
  - https://tc39.es/ecma262/#sec-string.prototype.replaceall
  - https://github.com/tc39/proposal-relative-indexing-method
  - https://github.com/tc39/proposals/blob/main/finished-proposals.md
tldr: >
  `slice` and `at` count negative indices from the end (`length + index`); `substring` turns
  negatives and `NaN` into `0` and swaps its arguments if start > end. `at` exists because
  `str[-1]` is just a property lookup for the key `"-1"`. All of them index UTF-16 code units, and
  none of them changes the original string.
---

## Answer

The difference is what each method does with a negative or out-of-order argument.

- **`slice(start, end)`** treats a negative index as `length + index`, then clamps to `[0, length]` (the spec's `ToClampedIndex`). If `start ≥ end` the result is `""`. So `'JavaScript'.slice(-6)` is `"Script"`.
- **`substring(start, end)`** clamps each argument to `[0, length]` first, so negatives and `NaN` become `0`. Then it **swaps** them if `start > end`. So `'JavaScript'.substring(-6)` is the whole string, and `substring(4, 1)` is the same as `substring(1, 4)`.
- **`at(index)`** (ES2022) returns one code unit, counting negative indices from the end, and `undefined` when out of range. Compare `charAt`, which returns `""` out of range and doesn't accept negatives.
- **`substr(start, length)`** accepts a negative start, but it's an Annex B legacy method; use `slice`.

Why `at` was needed: `str[-1]` can't mean "last character". Bracket access is property lookup on any object, so `-1` becomes the key `"-1"`, which strings don't have. The relative-indexing proposal added `at` to strings, arrays and typed arrays instead.

The other everyday methods follow the same habits:

- **`padStart(targetLength, padString)`** / **`padEnd`** (ES2017) repeat and truncate `padString` (default a space) to reach `targetLength`; a string already that long comes back unchanged. `'7'.padStart(3, '0')` is `"007"`.
- **`replaceAll(search, replacement)`** (ES2021) replaces every occurrence of a string without needing a regex. With a regex, it must have the `g` flag, or it throws a `TypeError`.

Two facts apply to all of them: strings are immutable, so each returns a new string; and indices count **UTF-16 code units**, so `slice` and `at` can split an emoji's surrogate pair.

## Example

```js
const s = 'JavaScript';

console.log(s.slice(-6), s.substring(-6)); // → Script JavaScript
console.log(s.slice(4, 1) === '', s.substring(4, 1)); // → true ava
console.log(s.slice(-6, -3)); // → Scr

console.log(s.at(-1), s[-1], s.at(99)); // → t undefined undefined
console.log(s.charAt(-1) === ''); // → true

console.log('7'.padStart(3, '0'), 'ab'.padEnd(5, '12')); // → 007 ab121
console.log('a-b-c'.replace('-', '+'), 'a-b-c'.replaceAll('-', '+')); // → a+b-c a+b+c

try {
  'a-b'.replaceAll(/-/, '+');
} catch (error) {
  console.log(error.name); // → TypeError
}

// at(0) is only the first half of the emoji's surrogate pair
console.log('😀x'.at(0) === '\uD83D'); // → true
```

## Pitfalls

- Porting `slice(-n)` to `substring(-n)`. The negative becomes `0` and you silently get the whole string.
- Relying on `substring`'s swap. `substring(end, start)` "works", which hides a bug that `slice` would surface as `""`.
- Expecting `at(-1)` to return the last *character*. It returns the last code unit, so a trailing emoji gives a lone surrogate; use `[...str].at(-1)` for code points, or `Intl.Segmenter` for graphemes.
- Using `replaceAll` with a replacement string containing `$`. Patterns like `$&` still apply: `'$1.00'.replaceAll('.', '$&$&')` gives `"$1..00"`. Pass a function to insert text literally.

## Follow-ups

**Q:** Do `indexOf`, `includes` or `startsWith` accept a negative position?
**A:** They accept it but don't count from the end: the position is clamped to `0`, so the search starts at the beginning. Among string methods, `slice`, `at` and Annex B's `substr` are the ones that count negatives from the end.

**Q:** What do these methods do with fractional or non-numeric indices?
**A:** They go through `ToIntegerOrInfinity`: fractions truncate toward zero and `NaN` becomes `0`. So `s.slice(2.9, 5.1)` is `s.slice(2, 5)`, and `s.at(NaN)` is the first code unit.

**Q:** Why does `'x'.replaceAll('', '-')` return `"-x-"`?
**A:** An empty search string matches at every position, including both ends. The spec advances by at least one code unit after each match so the loop terminates.

## Exercises

### Predict the output

```js
const path = 'reports/2026/q3.csv';
console.log(path.slice(path.lastIndexOf('/') + 1), path.substring(-4), path.slice(-4));
```

**Answer:** `q3.csv reports/2026/q3.csv .csv`. `lastIndexOf('/')` is 12, so `slice(13)` is the file name. `substring(-4)` clamps `-4` to `0` and returns the whole path, while `slice(-4)` counts four code units from the end.
