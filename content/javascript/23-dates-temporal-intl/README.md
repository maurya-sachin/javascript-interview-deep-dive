# 23 — Dates, Temporal, and Intl

> **Status:** 🔴 planned · **Published:** 0/4 · **Last verified:** —

Why `Date` is error-prone, how Temporal replaces it, and locale-aware formatting with `Intl`.

## Learning goals

After this chapter you can:

- List the classic `Date` pitfalls
- Pick the right Temporal type for a problem
- Format dates, numbers, and plurals per locale
- Store and display times correctly across time zones

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- `Date` as a millisecond timestamp; local vs UTC methods; mutation; 0-based months; parsing → 010
- Temporal: `Instant`, `ZonedDateTime`, `PlainDate`/`PlainTime`/`PlainDateTime`, `Duration`, `Now` → 020
- Immutable arithmetic and calendars in Temporal → 020
- `Intl.DateTimeFormat`, `NumberFormat`, `PluralRules`, `RelativeTimeFormat`, `ListFormat` → 030
- Time zones, offsets, DST; storing instants vs wall-clock times → 040
- `Intl.DisplayNames`, `Intl.DurationFormat` → 030

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [Why is `Date` hard to use correctly?](010-date-pitfalls.md) | easy | 🟡 draft |
| 020 | [What is Temporal, and which type do you use when?](020-temporal-types.md) | medium | 🟡 draft |
| 030 | [How do you format dates, numbers, and plurals per locale with `Intl`?](030-intl-formatting.md) | medium | 🟡 draft |
| 040 | [How do you handle time zones correctly?](040-time-zones.md) | medium | 🟡 draft |
<!-- generated:questions:end -->

## Sources

- **Spec:** [Date objects](https://tc39.es/ecma262/#sec-date-objects) · [Temporal](https://tc39.es/proposal-temporal/) · [ECMA-402 (Intl)](https://tc39.es/ecma402/)
- **MDN:** [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) · [Temporal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal) · [Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)

## Open questions

- [ ] Re-check Temporal support (Safari, Node builds) and re-run polyfill outputs natively when available
