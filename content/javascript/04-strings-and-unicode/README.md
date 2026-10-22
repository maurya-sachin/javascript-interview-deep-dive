# 04 — Strings and Unicode

> **Status:** 🔴 planned · **Published:** 0/7 · **Last verified:** —

Strings as UTF-16 code units, what that means for length and iteration, and template literals.

## Learning goals

After this chapter you can:

- Explain why string length and indexing count UTF-16 code units
- Iterate and truncate text without splitting characters
- Write a tag function and explain what it receives
- Compare and sort strings for real users

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Strings as immutable sequences of UTF-16 code units → 010
- Code units vs code points vs grapheme clusters; `codePointAt`, string iteration → 010, 020
- `Intl.Segmenter` → 020
- Surrogate pairs, lone surrogates, `isWellFormed`/`toWellFormed` → 030
- Template literals, tag functions, `String.raw`, cooked vs raw strings → 040
- `localeCompare`, `Intl.Collator`, `normalize` (NFC/NFD) → 050
- Everyday string methods (`slice` vs `substring`, `padStart`, `replaceAll`, `at`) → 060
- String concatenation cost and ropes in V8 → 070

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [Why is `"😀".length` 2?](010-utf16-string-length.md) | medium | 🟡 draft |
| 020 | [How do you iterate over the characters a user sees?](020-graphemes-and-code-points.md) | medium | 🟡 draft |
| 030 | [What are lone surrogates, and what do `isWellFormed` and `toWellFormed` fix?](030-well-formed-strings.md) | hard | 🟡 draft |
| 040 | [How do tagged template literals work?](040-tagged-templates.md) | medium | 🟡 draft |
| 050 | [How do you compare strings correctly across languages?](050-locale-comparison-normalization.md) | medium | 🟡 draft |
| 060 | [`slice` vs `substring` vs `at`: which string methods accept negative indices, and why?](060-everyday-string-methods.md) | easy | 🔴 planned |
| 070 | [Is building a string with `+=` in a loop slow?](070-string-concatenation-ropes.md) | medium | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- **Spec:** [String type](https://tc39.es/ecma262/#sec-ecmascript-language-types-string-type) · [String objects](https://tc39.es/ecma262/#sec-string-objects) · [Tagged templates](https://tc39.es/ecma262/#sec-tagged-templates)
- **MDN:** [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) · [Template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) · [Intl.Segmenter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter)
