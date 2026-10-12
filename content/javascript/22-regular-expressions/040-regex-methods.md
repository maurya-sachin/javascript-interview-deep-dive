---
title: "`match` vs `matchAll` vs `exec` vs `replace` — and `RegExp.escape`?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [regexp, match, matchall, exec, replace, replaceall, split, regexp-escape]
related:
  - javascript/regular-expressions/regex-flags
  - javascript/regular-expressions/named-groups-lookbehind
  - javascript/metaprogramming/well-known-symbols
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-regexpbuiltinexec
  - https://tc39.es/ecma262/#sec-regexp.prototype-%symbol.match%
  - https://tc39.es/ecma262/#sec-regexp-prototype-%symbol.matchall%
  - https://tc39.es/ecma262/#sec-regexp.prototype-%symbol.replace%
  - https://tc39.es/ecma262/#sec-regexp.escape
  - https://github.com/tc39/proposal-regex-escaping
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/matchAll
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replaceAll
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/split
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/escape
tldr: >
  `exec` returns one detailed match and advances `lastIndex` under `g` or `y`. `match` returns that detailed match
  without `g` and only the strings with `g`. `matchAll` (needs `g`) iterates detailed matches. `replace` and
  `replaceAll` substitute using a string or a function. `RegExp.escape` (ES2025) makes user text safe to embed in a
  pattern.
---

## Answer

All of them end up in `RegExpBuiltinExec`; they differ in what they return and who drives the loop.

| Need | Use | Returns |
|---|---|---|
| Does it match? | `re.test(s)` | boolean (stateful under `g`/`y`) |
| First match with groups and index | `s.match(re)` without `g`, or `re.exec(s)` | match array (`index`, `input`, `groups`) or `null` |
| All matched strings, nothing else | `s.match(re)` with `g` | array of strings, or `null` |
| All matches with groups and index | `s.matchAll(re)` (`g` required) | iterator of match arrays |
| Replace | `s.replace(re, str \| fn)` | new string; with a string pattern or no `g`, only the first match |
| Replace every match | `s.replaceAll(re \| str, str \| fn)` | new string; a regex must have `g` |
| Split on a pattern | `s.split(re)` | array; captured groups are spliced into the result |

- `exec` is the primitive. With `g` or `y` it starts at `lastIndex` and updates it, so you drive the loop (`while ((m = re.exec(s)))`). `matchAll` is that loop done for you, on a **clone** of the regex, so your regex's `lastIndex` is untouched.
- `replace` callbacks receive `(match, ...captures, offset, string, groups)`; `groups` is only passed when the pattern has named groups. In replacement strings, `$1`, `$<name>`, `$&`, `` $` ``, `$'` and `$$` are special.
- Whether a **string** argument is a pattern depends on the method. `match`, `matchAll` and `search` convert a string to a regex. `replace`, `replaceAll`, `split`, `includes` and `indexOf` treat it literally.
- **`RegExp.escape(string)`** (ES2025) returns the string with every character that is special in a pattern escaped, so `new RegExp(RegExp.escape(input), 'g')` matches `input` literally. Node.js 24, Chrome 136, Firefox 134 and Safari 18.2 have it; older code used `s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`.

## Example

```js
const log = 'GET /a 200\nPOST /b 500';
const line = /(?<verb>[A-Z]+) (?<path>\S+) (?<status>\d{3})/g;

console.log(log.match(line));
// → [ 'GET /a 200', 'POST /b 500' ]

console.log([...log.matchAll(line)].map((m) => `${m.groups.path}@${m.index}`));
// → [ '/a@0', '/b@11' ]

console.log(log.replace(line, (...args) => {
  const { verb, status } = args.at(-1);
  return `${status} ${verb}`;
}));
// → 200 GET
// → 500 POST

// RegExp.escape: user text as a literal, including regex metacharacters
const term = 'c++';
const literal = new RegExp(`(?<!\\w)${RegExp.escape(term)}(?!\\w)`, 'g');
console.log('I like c++ and c'.replaceAll(literal, '<$&>'));
// → I like <c++> and c
console.log(RegExp.escape('a.b'));
// → \x61\.b
```

## Pitfalls

- Using `match` with `g` when you need positions or groups. It returns only the matched strings; use `matchAll`.
- Escaping for the wrong method. `'a.b.c'.replaceAll(RegExp.escape('.'), '/')` changes nothing, because `replaceAll` with a string searches for the literal text `\.`. Escape only when you build a `RegExp`, or when a string goes to `match`, `matchAll` or `search`. Also, `RegExp.escape` output is for matching: a leading digit or letter becomes `\x31`, `\x61` and spaces become `\x20`. That is valid, not a bug.
- Writing a manual `exec` loop for a pattern that can match the empty string, such as `/x*/g`. `exec` does not advance `lastIndex` on an empty match, so the loop never ends. `matchAll`, `match` and `replace` advance for you.
- Interpolating user data into a replacement string. `'x'.replace('x', userText)` expands `$&` and `$1` inside `userText`. Pass a function (`() => userText`) to use the text verbatim.

## Follow-ups

**Q:** Why does `matchAll` throw without `g`?
**A:** The spec checks the flags and throws `TypeError` for a non-global regex, because iterating all matches without `g` would be ambiguous. `replaceAll` does the same. `match` and `replace` do not throw; they just stop at the first match.

**Q:** What does `split` do with a capturing group?
**A:** The captured text is included in the output: `'a1b2'.split(/(\d)/)` is `['a', '1', 'b', '2', '']`. A `limit` argument caps the array length after that.

**Q:** Does `RegExp.escape` make a string safe inside a character class?
**A:** Yes. It escapes syntax characters, `-`, `,` and whitespace as `\x..` or backslash escapes, and the result is valid under `u` and `v` too. I checked `[${RegExp.escape('a-b')}]` with the `v` flag.

## Exercises

### Which loop terminates?

```js
const re = /x*/g;
console.log('abc'.match(re).length, 'abc'.replace(re, '-'), [...'abc'.matchAll(re)].length);
```

**Answer:** `4 -a-b-c- 4`. `x*` matches the empty string at positions 0, 1, 2 and 3. The built-in methods advance one position after each empty match, so they end. A hand-written `while (re.exec('abc'))` loop would stay at `lastIndex` 0 forever.
