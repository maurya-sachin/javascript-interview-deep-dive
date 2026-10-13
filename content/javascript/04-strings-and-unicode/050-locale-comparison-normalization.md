---
title: "How do you compare strings correctly across languages?"
status: draft
difficulty: medium
frequency: 2
core: false
tags: [string, locale, intl-collator, localecompare, normalize, nfc, nfd, sorting]
related:
  - javascript/strings-and-unicode/graphemes-and-code-points
  - javascript/strings-and-unicode/utf16-string-length
verified: 2026-10
sources:
  - https://tc39.es/ecma402/#sec-intl.collator.prototype.compare
  - https://tc39.es/ecma402/#sec-collator-comparestrings
  - https://tc39.es/ecma262/#sec-string.prototype.normalize
  - https://tc39.es/ecma262/#sec-string.prototype.localecompare
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize
tldr: >
  `===` and the default `sort()` compare UTF-16 code units, so `"é"` can differ from `"é"` and `"Z"`
  sorts before `"a"`. For user-facing order use `Intl.Collator` (or `localeCompare`) with the user's
  locale; create one collator and reuse it. For exact-equality of canonically equivalent text, compare
  `normalize()`d strings.
---

## Answer

Two separate problems hide behind "comparing strings".

**Order.** `<`, `===` and `Array.prototype.sort()` without a comparator compare code units numerically. That puts every uppercase ASCII letter before every lowercase one and accented letters after `z`, which is wrong for people. Language-aware order comes from `Intl.Collator` (ECMA-402). `a.localeCompare(b, locale, options)` is the one-off form. Pass the collator's `compare` straight to `sort`, because ECMA-402 defines it as a getter returning a function already bound to the collator.

Locale changes the answer: German sorts `ä` with `a`, Swedish sorts it after `z`. Options tune what counts as different:

- `sensitivity`: `"base"` (only base letters differ), `"accent"`, `"case"`, `"variant"` (all differences matter).
- `numeric: true`: compares digit runs as numbers, so `file2` comes before `file10`.
- `caseFirst`: `"upper"` or `"lower"`.

Create the collator once and reuse it. MDN recommends this over `localeCompare` when comparing many strings.

**Equality.** One visible character can have several code point sequences. `"é"` is U+00E9 or `e` + U+0301. They render the same but `===` is `false`. `normalize()` rewrites a string into a Unicode normalization form: NFC (composed, the default), NFD (decomposed), and the compatibility forms NFKC and NFKD, which also fold things like the `ﬁ` ligature into `fi`. Normalize both sides to the same form before an exact comparison, or before storing keys such as usernames. An invalid form name throws a `RangeError`.

`Intl.Collator` is required to treat canonically equivalent strings as equal, so it also handles the `é` case without manual normalization.

Results depend on the engine's locale data (ICU in V8 and Node), so don't hard-code sort order assumptions beyond what the locale defines.

## Example

Output is from Node 24.19 (ICU 78.3).

```js
const words = ["z", "ä", "a", "Z", "A", "e"];
console.log([...words].sort()); // → [ 'A', 'Z', 'a', 'e', 'z', 'ä' ]
console.log([...words].sort(new Intl.Collator("de").compare)); // → [ 'a', 'A', 'ä', 'e', 'z', 'Z' ]
console.log([...words].sort(new Intl.Collator("sv").compare)); // → [ 'a', 'A', 'e', 'z', 'Z', 'ä' ]

const composed = "é";
const decomposed = "é";
console.log(composed === decomposed); // → false
console.log(composed.normalize() === decomposed.normalize()); // → true
console.log(new Intl.Collator().compare(composed, decomposed)); // → 0

const files = ["file10", "file2", "File1"];
console.log(files.sort(new Intl.Collator("en", { numeric: true }).compare)); // → [ 'File1', 'file2', 'file10' ]

const base = new Intl.Collator("en", { sensitivity: "base" });
console.log(base.compare("resume", "RESUMÉ")); // → 0
```

## Pitfalls

- Sorting user-visible lists with plain `.sort()`. It orders by code unit, so `"Z" < "a"` and `"ä"` lands after `"z"`.
- Reading the result of `compare` as exactly `-1`, `0`, `1`. Only the sign is specified; MDN warns engines return varying values.
- Calling `localeCompare` with a locale and options inside a sort over a large array instead of reusing a collator.
- Using NFKC/NFKD to "normalize" text you intend to keep. Compatibility forms are lossy (`①` becomes `1`); use NFC for storage and equality, and compatibility forms for search keys.

## Follow-ups

**Q:** What does `sensitivity: "base"` ignore?
**A:** Case and accents: `a`, `A` and `á` compare as equal, which suits search. `"accent"` ignores only case; `"case"` ignores only accents.

**Q:** Should you rely on `localeCompare` returning the same order everywhere?
**A:** No. The spec says the comparison is implementation-defined and locale-sensitive. Pass an explicit locale for stable behaviour across users, and do not assume order between different engines or ICU versions.

## Exercises

### Same text, different bytes

```js
const a = "Amélie";
const b = "Amélie";
console.log(a === b, a.normalize("NFD") === b.normalize("NFD"), a.length, b.length);
```

**Answer:** `false true 6 7`. The strings differ in code units until normalized; `b` has an extra combining mark.

### Accent-sensitive compare

```js
const collator = new Intl.Collator("en", { sensitivity: "accent" });
console.log(collator.compare("a", "A"), collator.compare("a", "á"));
```

**Answer:** `0 -1`. With `"accent"` sensitivity, case is ignored but accents still count. The second value is negative; only its sign is guaranteed.
