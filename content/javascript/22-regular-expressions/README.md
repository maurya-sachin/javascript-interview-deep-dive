# 22 — Regular expressions

> **Status:** 🔴 planned · **Published:** 0/4 · **Last verified:** —

Regex flags, groups and lookarounds, performance traps, and the APIs that use patterns.

## Learning goals

After this chapter you can:

- Explain what each flag changes, including `v` and inline modifiers
- Use named groups and lookbehind
- Recognize patterns prone to catastrophic backtracking
- Pick the right method for matching and replacing

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Flags `d g i m s u v y`; `lastIndex` statefulness → 010
- Inline modifiers `(?i:…)` → 010
- `v` flag set notation; Unicode property escapes `\p{…}` → 010
- Capturing, named, and duplicate named groups; backreferences → 020
- Lookahead and lookbehind → 020
- Backtracking, ReDoS, safer patterns → 030
- `exec`, `test`, `match`, `matchAll`, `replace`/`replaceAll` with functions, `split` → 040
- `RegExp.escape` → 040
- Legacy RegExp static properties (Stage 3) → —

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [What do the regex flags do?](010-regex-flags.md) | medium | 🔴 planned |
| 020 | [How do named groups and lookbehind work?](020-named-groups-lookbehind.md) | medium | 🔴 planned |
| 030 | [What is catastrophic backtracking?](030-catastrophic-backtracking.md) | hard | 🔴 planned |
| 040 | [`match` vs `matchAll` vs `exec` vs `replace` — and `RegExp.escape`?](040-regex-methods.md) | medium | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- **Spec:** [RegExp objects](https://tc39.es/ecma262/#sec-regexp-regular-expression-objects) · [Pattern semantics](https://tc39.es/ecma262/#sec-pattern-semantics) · [RegExp.escape](https://tc39.es/ecma262/#sec-regexp.escape)
- **MDN:** [Regular expressions guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions) · [RegExp](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp) · [RegExp.escape](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/escape)
