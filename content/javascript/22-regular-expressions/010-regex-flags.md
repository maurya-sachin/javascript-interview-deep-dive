---
title: "What do the regex flags do?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [regexp, flags, lastindex, unicode, sticky, unicode-sets, modifiers]
related:
  - javascript/strings-and-unicode/utf16-string-length
  - javascript/strings-and-unicode/graphemes-and-code-points
  - javascript/regular-expressions/regex-methods
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-regexpbuiltinexec
  - https://tc39.es/ecma262/#sec-get-regexp.prototype.flags
  - https://tc39.es/ecma262/#sec-patterns
  - https://github.com/tc39/proposal-regexp-v-flag
  - https://github.com/tc39/proposal-regexp-modifiers
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions/Cheatsheet
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/lastIndex
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/unicodeSets
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Modifier
  - https://v8.dev/features/regexp-v-flag
tldr: >
  `g` and `y` make a regex stateful through `lastIndex`; `i`, `m`, `s` change what matches; `u` and `v` switch to
  code-point matching (`v` adds set notation and string properties, and cannot combine with `u`); `d` adds match
  offsets. `(?i:…)` modifiers scope `i`, `m`, `s` to part of a pattern.
---

## Answer

Eight flags, readable back as `re.flags` in the alphabetical order `dgimsuvy`.

| Flag | Property | Effect |
|---|---|---|
| `g` | `global` | find all matches; `exec` and `test` start at `lastIndex` and update it |
| `y` | `sticky` | match only at exactly `lastIndex` (no scanning forward); also updates it |
| `i` | `ignoreCase` | case-insensitive comparison |
| `m` | `multiline` | `^` and `$` also match at line breaks |
| `s` | `dotAll` | `.` also matches line terminators |
| `u` | `unicode` | match by code point; enables `\u{…}`, `\p{…}`, stricter syntax |
| `v` | `unicodeSets` | superset of `u`: set operations, `\q{…}`, properties of strings |
| `d` | `hasIndices` | adds `indices` (start and end offsets) to match results |

Three things interviewers look for:

- **`g` and `y` make the regex object stateful.** `lastIndex` is an own data property that `exec` and `test` read and write. A failed match resets it to `0`, so reusing one `/…/g` object across inputs gives alternating results. Without `g` or `y`, `lastIndex` is ignored and never updated.
- **`u` and `v` change the unit of matching** from UTF-16 code unit to code point, so `.` matches an astral character as one unit. `v` is the successor of `u`: it adds set subtraction `--`, intersection `&&`, nested classes, and `\q{abc}` string literals, plus properties of strings such as `\p{RGI_Emoji}`. `u` and `v` together is a `SyntaxError`. Prefer `v` in new code.
- **Inline modifiers** `(?i:…)`, `(?-i:…)` apply `i`, `m` or `s` only inside the group (ES2025). Other flags cannot be toggled.

## Example

```js
// g: shared state across calls
const seen = /b/g;
console.log(['ab', 'ab'].map((s) => seen.test(s)), seen.lastIndex);
// → [ true, false ] 0

// y: anchored at lastIndex, the basis of tokenizers
const tok = /\d+/y;
tok.lastIndex = 2;
console.log(tok.exec('a 42')?.[0], tok.lastIndex, tok.exec('a 42'));
// → 42 4 null

// d: where did the group match?
const m = /(?<year>\d{4})/d.exec('on 2026-10');
console.log(m.indices.groups.year);
// → [ 3, 7 ]

// u: code points; v: set notation
console.log('😀'.match(/./)[0].length, '😀'.match(/./u)[0].length);
// → 1 2
console.log(/^[\p{L}--[a-z]]$/v.test('a'), /^[\p{L}--[a-z]]$/v.test('Z'));
// → false true

// inline modifier: ignore case only inside the group
console.log(/(?i:ab)c/.test('ABc'), /(?i:ab)c/.test('ABC'));
// → true false
```

## Pitfalls

- Reusing a `g` or `y` regex with `test` or `exec` across different strings. `lastIndex` carries over, so a correct pattern returns `false` on the second input. Create the regex per use, reset `lastIndex = 0`, or drop `g` when you only need a boolean.
- Expecting `y` to scan ahead like `g`. With `y`, a miss at `lastIndex` fails immediately and resets `lastIndex` to `0`.
- Using `.` and `[^x]` on text with emoji or other astral characters without `u` or `v`. They match half a surrogate pair, and `i` uses simpler case folding without `u`: `/\u212a/i.test('k')` is `false`, `/\u212a/iu.test('k')` is `true`.
- Combining `u` and `v`. It throws at construction. Also, `v` rejects some patterns `u` accepts (for example unescaped `(`, `)`, `[`, `{`, `}`, `/`, `-`, `|` inside a class), so migration needs a pass over every character class.

## Follow-ups

**Q:** Does `m` change `.`?
**A:** No. `m` changes only `^` and `$`; `s` changes only `.`. Without `m`, `^` matches only at the start of input. Without `s`, `.` fails on `\n`, `\r`, `\u2028` and `\u2029`.

**Q:** What does `d` cost, and when do you need it?
**A:** It adds an `indices` array (and `indices.groups`) to every match result, which is extra work and allocation, so enable it only when you need group positions (highlighting, source maps). Without it, only the whole match has an `index`.

**Q:** Is `y` the same as starting the pattern with `^`?
**A:** No. `^` anchors to the start of input (or of a line with `m`). `y` anchors at `lastIndex`, which moves, so you can lex a string token by token.

## Exercises

### Alternating results

```js
const re = /o/g;
console.log(['foo', 'bar o', 'o'].map((s) => re.test(s)));
```

**Answer:** `[ true, true, false ]`. The first test matches at index 1 and sets `lastIndex` to 2. The second starts at 2 and finds the `o` at index 4, setting `lastIndex` to 5. The third string has length 1, so `lastIndex` 5 is past the end: it fails and resets `lastIndex` to `0`.
