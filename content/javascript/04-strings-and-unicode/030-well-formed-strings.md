---
title: "What are lone surrogates, and what do `isWellFormed` and `toWellFormed` fix?"
status: draft
difficulty: hard
frequency: 1
core: false
tags: [string, unicode, surrogate, lone-surrogate, is-well-formed, to-well-formed]
related:
  - javascript/strings-and-unicode/utf16-string-length
  - javascript/strings-and-unicode/graphemes-and-code-points
verified: 2026-10
perishable:
  - Browser availability of isWellFormed and toWellFormed, per MDN.
sources:
  - https://tc39.es/ecma262/#sec-ecmascript-language-types-string-type
  - https://tc39.es/ecma262/#sec-string.prototype.iswellformed
  - https://tc39.es/ecma262/#sec-string.prototype.towellformed
  - https://tc39.es/ecma262/#sec-isstringwellformedunicode
  - https://tc39.es/ecma262/#sec-encode
  - https://tc39.es/ecma262/#sec-quotejsonstring
  - https://github.com/tc39/proposals/blob/main/finished-proposals.md
  - https://encoding.spec.whatwg.org/#textencoder
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/isWellFormed
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/toWellFormed
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
tldr: >
  A lone surrogate is a leading (`0xD800–0xDBFF`) or trailing (`0xDC00–0xDFFF`) code unit with no partner.
  JavaScript strings may contain them, but they are not valid Unicode text and make APIs such as
  `encodeURIComponent` throw. `isWellFormed()` detects them; `toWellFormed()` returns a copy with each
  one replaced by U+FFFD.
---

## Answer

A JavaScript string is any sequence of 16-bit values. The spec places no restriction on them, so a string can hold a **lone surrogate**: a leading surrogate (`0xD800–0xDBFF`) not followed by a trailing surrogate, or a trailing surrogate (`0xDC00–0xDFFF`) not preceded by a leading one. Such a string is **ill-formed** UTF-16 and does not represent valid Unicode text.

They usually come from code that treats strings as units: `slice` or `substring` cutting a pair in half, `split("")` followed by manipulation, or a truncating `charAt` loop.

Two methods, added in ES2024, handle them (per MDN, available across browsers since October 2023):

- `str.isWellFormed()` returns `false` if the string contains any lone surrogate.
- `str.toWellFormed()` returns a new string with every lone surrogate replaced by U+FFFD (`�`). It returns a copy even when nothing needed fixing.

Why it matters: APIs that need valid Unicode reject ill-formed input. `encodeURI` and `encodeURIComponent` throw a `URIError`. UTF-8 has no representation for a lone surrogate, so `TextEncoder` (a host API, defined by the WHATWG Encoding Standard) substitutes U+FFFD. Since ES2019, `JSON.stringify` escapes lone surrogates (`"\ud800"`) so its output stays valid.

Use `isWellFormed()` to validate or reject input, and `toWellFormed()` to sanitize it before passing it to such APIs. The fix is lossy: the original surrogate value is gone. Better still, avoid creating them: iterate by code point or grapheme instead of slicing by unit.

## Example

```js
const cut = "a😀".slice(0, 2); // keeps only the leading surrogate
console.log(cut.length, cut.isWellFormed()); // → 2 false

try {
  encodeURIComponent(cut);
} catch (error) {
  console.log(error.name); // → URIError
}

const fixed = cut.toWellFormed();
console.log(fixed === "a�", fixed.length); // → true 2
console.log(encodeURIComponent(fixed)); // → a%EF%BF%BD

console.log("\uDE04\uD83D".isWellFormed()); // → false
console.log("😄".isWellFormed()); // → true
```

## Pitfalls

- Believing a pair in the wrong order is valid. A trailing surrogate followed by a leading one is two lone surrogates.
- Expecting `toWellFormed()` to repair the text. It substitutes U+FFFD, so the data is lost; it does not rejoin broken pairs.
- Calling it on every string "just in case" and hiding the real bug (slicing by code unit) that produced the broken value.
- Assuming every consumer throws. `JSON.stringify` escapes it and `TextEncoder` silently substitutes U+FFFD, so a lone surrogate can pass through unnoticed, and in the encoded bytes the data has changed.

## Follow-ups

**Q:** Does `toWellFormed()` mutate the string?
**A:** No. Strings are immutable. It returns a new string, which is a copy even for well-formed input.

**Q:** What does `JSON.stringify` do with a lone surrogate?
**A:** Since ES2019 (well-formed `JSON.stringify`) it writes it as an escape such as `"\ud800"` instead of the raw unit, so the output is valid Unicode. `JSON.parse` reads the escape back as the same lone surrogate.

**Q:** Does `[...str]` drop or fix lone surrogates?
**A:** Neither. The string iterator yields a lone surrogate as its own one-unit string, which stays ill-formed.

## Exercises

### Which are well-formed?

```js
const samples = ["ab", "\uD83D", "😀", "\uDE00\uD83D", "\uD83Dx"];
console.log(samples.map((s) => s.isWellFormed()));
```

**Answer:** `[ true, false, true, false, false ]`. Plain text and a proper leading-then-trailing pair pass. A leading surrogate followed by `x` is still lone.

### Sanitize before encoding

```js
const input = "q=\uDC00";
console.log(encodeURIComponent(input.toWellFormed()));
```

**Answer:** `q%3D%EF%BF%BD`. The lone trailing surrogate becomes U+FFFD, which percent-encodes as `%EF%BF%BD`; `=` encodes as `%3D`.
