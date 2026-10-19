---
title: "How do you iterate over the characters a user sees?"
status: draft
difficulty: medium
frequency: 2
core: false
tags: [string, unicode, grapheme-cluster, code-point, intl-segmenter, iteration]
related:
  - javascript/strings-and-unicode/utf16-string-length
  - javascript/strings-and-unicode/well-formed-strings
verified: 2026-10
perishable:
  - Example output is from Node 24.19, ICU 78.3, Unicode 17.0.
  - Grapheme boundaries for new emoji vary by engine and Unicode version.
sources:
  - https://tc39.es/ecma262/#sec-string.prototype-%symbol.iterator%
  - https://tc39.es/ecma402/#sec-intl.segmenter.prototype.segment
  - https://tc39.es/ecma402/#sec-intl-segmenter-constructor
  - https://tc39.es/ecma402/#sec-%segmentsprototype%.containing
  - https://tc39.es/ecma402/#sec-createsegmentdataobject
  - https://nodejs.org/docs/latest-v24.x/api/intl.html
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/codePointAt
  - https://www.unicode.org/reports/tr29/
tldr: >
  `for...of` and spread walk code points, which fixes surrogate pairs but still splits what users see as
  one character: a flag, a family emoji, or `e` plus a combining accent. To iterate user-perceived
  characters (grapheme clusters), use `new Intl.Segmenter(locale, { granularity: "grapheme" })`.
---

## Answer

There are three levels, and each needs a different tool:

| Level | Example | How to iterate |
|---|---|---|
| UTF-16 code unit | `0xD83D` | index loop, `split("")` |
| Code point | U+1F600 | `for...of`, spread, `Array.from`, `codePointAt` |
| Grapheme cluster | `👨‍👩‍👧` (5 code points) | `Intl.Segmenter` |

The string iterator in ECMA-262 yields one code point at a time, so surrogate pairs stay together. That is enough for a plain emoji such as `😀`.

It is not enough for everything a user sees as one character. Unicode UAX #29 defines **grapheme clusters** as user-perceived characters. Examples that are several code points:

- `e` + U+0301 (combining acute accent), which renders as `é`.
- A flag such as `🇮🇳`: two regional-indicator code points.
- A family emoji `👨‍👩‍👧`: three emoji joined by zero-width joiners (U+200D).
- An emoji with a skin-tone modifier, `👍🏽`.

`Intl.Segmenter` (ECMA-402) segments text for you; the spec leaves the exact boundary rules to the implementation, and engines follow UAX #29. Create it with `granularity: "grapheme"`, call `segment(text)`, and iterate: each item is `{ segment, index, input }`, where `index` is the UTF-16 offset. Use it for truncation, caret movement, character counters, and reversing text. The default granularity is `"grapheme"`. `"word"` adds `isWordLike`, and `"sentence"` splits sentences.

Boundaries come from the engine's Unicode data (V8 and Node.js use ICU), so results can change when Unicode or the engine updates. Don't persist counts as exact data.

## Example

Output below is from Node 24.19 (ICU 78.3, Unicode 17.0).

```js
const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
const graphemes = (text) => Array.from(segmenter.segment(text), (part) => part.segment);

for (const text of ["😀", "é", "🇮🇳", "👨‍👩‍👧"]) {
  console.log(text.length, [...text].length, graphemes(text).length);
}
// → 2 1 1
// → 2 2 1
// → 4 2 1
// → 8 5 1

const text = "Hi 👨‍👩‍👧 there";
console.log([...text].slice(0, 5).join("")); // → Hi 👨‍ (family cut apart)
console.log(graphemes(text).slice(0, 5).join("")); // → Hi 👨‍👩‍👧 
console.log(graphemes(text).reverse().join("")); // → ereht 👨‍👩‍👧 iH
```

## Pitfalls

- Treating `[...s].length` as "characters". It counts code points; a family emoji is 5, a flag is 2, a decomposed `é` is 2.
- Truncating with `slice` or a code point array can leave a half-built emoji (a man followed by a dangling joiner) or a base letter without its accent.
- Building a `new Intl.Segmenter` inside a loop. Construct once and reuse it.
- Assuming grapheme counting is locale-free arithmetic. It uses Unicode data that is updated over time, so two engines (or versions) can disagree on newer emoji.

## Follow-ups

**Q:** What does `segmenter.segment(text)` return?
**A:** A lazy, iterable `Segments` object, not an array. Iterate it with `for...of` or `Array.from`. It also has `containing(index)` to find the segment at a UTF-16 index.

**Q:** How do you split text into words?
**A:** Use `granularity: "word"`. Each segment has `isWordLike`, which is typically `true` for words and numbers and `false` for spaces and punctuation; the spec leaves the exact rule to the implementation. It also handles languages written without spaces, which `split(" ")` cannot.

## Exercises

### Count what the user sees

```js
const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
const name = "Zoé 🇫🇷";
console.log(name.length, [...name].length, [...segmenter.segment(name)].length);
```

**Answer:** `9 7 5`. Units: `Z`, `o`, `e`, the accent, a space and the flag's 4 units make 9. Code points: the flag is 2, so 7. Graphemes: `Z`, `o`, `é`, space and `🇫🇷` make 5.

### Find the segment at an index

```js
const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
console.log(segmenter.segment("a😀").containing(2));
```

**Answer:** `{ segment: '😀', index: 1, input: 'a😀' }`. Index 2 is the trailing surrogate of the emoji, so `containing` returns the whole segment, which starts at index 1.
