---
title: "How do named groups and lookbehind work?"
status: draft
difficulty: medium
frequency: 2
core: false
tags: [regexp, named-groups, backreferences, lookahead, lookbehind, assertions]
related:
  - javascript/regular-expressions/regex-flags
  - javascript/regular-expressions/regex-methods
  - javascript/regular-expressions/catastrophic-backtracking
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-patterns
  - https://tc39.es/ecma262/#sec-compileassertion
  - https://tc39.es/ecma262/#sec-regexpbuiltinexec
  - https://github.com/tc39/proposal-duplicate-named-capturing-groups
  - https://github.com/tc39/proposal-regexp-lookbehind
  - https://github.com/tc39/proposal-regexp-named-groups
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Named_capturing_group
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Lookbehind_assertion
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Lookahead_assertion
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions/Groups_and_backreferences
tldr: >
  `(?<name>…)` captures into `match.groups.name`, `\k<name>` backreferences it, and `$<name>` reuses it in
  replacements. Since ES2025 the same name may appear in different alternatives. Lookahead `(?=…)`/`(?!…)` and lookbehind
  `(?<=…)`/`(?<!…)` assert without consuming; lookarounds are atomic, and lookbehind matches right to left.
---

## Answer

**Named groups.** `(?<name>…)` is a capturing group that is also numbered. The match result gets a `groups` object (null prototype) with one property per name, or `groups: undefined` when the pattern has no named group. Reference the group inside the pattern with `\k<name>`, in a replacement string with `$<name>`, and in a replacer function through its last argument (the `groups` object).

**Duplicate names (ES2025).** The same name may be used again if the two groups can never both participate in a match, which in practice means different alternatives: `/(?<y>\d{4})-\d\d|\d\d\/(?<y>\d{4})/`. `groups.y` holds whichever alternative matched. Two groups of one name in sequence is still a `SyntaxError`. Node.js 24 supports it, as do Chrome 125, Firefox 129 and Safari 17.

**Lookaround** is a zero-width assertion: it tests the text next to the current position and consumes nothing.

| Syntax | Meaning |
|---|---|
| `(?=x)` | next text matches `x` |
| `(?!x)` | next text does not match `x` |
| `(?<=x)` | preceding text matches `x` |
| `(?<!x)` | preceding text does not match `x` |

What interviewers probe:

- **Lookbehind is evaluated backwards.** The engine matches the lookbehind body right to left, so in `/(?<=(\d+)(\d+))$/` on `'1053'` the second group is greedy and takes `'053'`, leaving `'1'` for the first. JavaScript allows variable-length lookbehind, unlike some engines.
- **Lookarounds are atomic.** Once the body matches, the engine never backtracks into it, so its captures are fixed. A negative lookaround never leaves captures set.
- **Captures inside a lookahead are visible afterwards**, which is useful (and the basis of the atomic-group trick in the backtracking question).
- A backreference to a group that did not participate matches the empty string.

## Example

```js
// Named groups: pattern, replacement string, replacer function
const date = /(?<year>\d{4})-(?<month>\d{2})/;
const { groups } = date.exec('on 2026-10');
console.log(groups.year, groups.month);
// → 2026 10
console.log('2026-10'.replace(date, '$<month>/$<year>'));
// → 10/2026

// \k<name>: match a quoted string with the same quote on both sides
console.log(`say "hi" 'x'`.match(/(?<q>['"]).*?\k<q>/)[0]);
// → "hi"

// Duplicate names in different alternatives
const when = /(?<y>\d{4})-\d\d|\d\d\/(?<y>\d{4})/;
console.log(when.exec('2026-10').groups.y, when.exec('10/2026').groups.y);
// → 2026 2026

// Lookahead: thousands separators
console.log('1234567.891'.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
// → 1,234,567.891

// Lookbehind: numbers after a dollar sign, not after a euro sign
console.log('$30 and €40'.match(/(?<=\$)\d+/g), '$30 and €40'.match(/(?<!\$)\b\d+/g));
// → [ '30' ] [ '40' ]
```

## Pitfalls

- Reading `m.groups.year` without a guard. `m.groups` is `undefined` when the pattern has no named group, so this throws. A named group that did not participate is present with the value `undefined`.
- Reading a capture set inside a negative lookaround. `/(?!(a))b/.exec('b')` leaves group 1 `undefined`, because the lookaround succeeds only when its body fails.
- Numbering. Named groups still count in numeric order, so adding a named group in the middle shifts the numbers of unnamed groups after it.

## Follow-ups

**Q:** What is `$<name>` if the group does not exist?
**A:** If the pattern has at least one named group, an unknown name is replaced by an empty string. If it has none, `$<a>` is kept literally.

**Q:** Why prefer lookbehind over capturing a prefix?
**A:** The prefix stays out of the match. `match` with `g` returns only the part you want, `replace` leaves the prefix untouched, and neighbouring matches can share the same characters.

**Q:** Does a lookahead cost anything?
**A:** Its body runs at every position the engine tries it. `(?=.*\d)` at the start of an anchored pattern runs once; in an unanchored pattern it rescans the rest of the line at each start position.

## Exercises

### Atomic lookahead

```js
console.log(/(?=(a+))a*b\1/.exec('baaabac'));
```

**Answer:** `[ 'aba', 'a', index: 3, input: 'baaabac', groups: undefined ]`. At index 1 the lookahead captures `'aaa'`. Then `a*b` consumes `'aaab'` but `\1` (`'aaa'`) does not match `'ac'`. The engine cannot backtrack into the lookahead to try `'aa'` or `'a'`, so index 1 fails. At index 3 the lookahead captures `'a'`, `a*` takes it, `b` matches, `\1` matches `'a'`, giving `'aba'`.
