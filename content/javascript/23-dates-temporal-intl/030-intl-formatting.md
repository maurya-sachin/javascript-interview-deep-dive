---
title: "How do you format dates, numbers, and plurals per locale with `Intl`?"
status: draft
difficulty: medium
frequency: 2
core: false
tags: [intl, ecma-402, datetimeformat, numberformat, pluralrules, relativetimeformat, listformat, locale]
related:
  - javascript/dates-temporal-intl/time-zones
  - javascript/dates-temporal-intl/temporal-types
  - javascript/strings-and-unicode/locale-comparison-normalization
verified: 2026-10
perishable:
  - Formatted strings depend on ICU 78.3 / CLDR 48.0
  - Intl.DurationFormat availability and Baseline status
sources:
  - https://tc39.es/ecma402/
  - https://github.com/tc39/ecma402/blob/main/spec/datetimeformat.html
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DisplayNames
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat
tldr: >
  `Intl` (ECMA-402) formats with locale data instead of hand-written patterns: `DateTimeFormat`, `NumberFormat`
  (currency, compact, unit), `PluralRules`, `RelativeTimeFormat` and `ListFormat`. Pass the locale and, for dates,
  an explicit `timeZone`. Construct the formatter once and reuse it. Output comes from the engine's ICU/CLDR data,
  so it varies by version.
---

## Answer

`Intl` is the built-in internationalization API (ECMA-402). Each constructor takes `(locales, options)` and returns a formatter with `format()` (and often `formatToParts()`); `toLocaleString()` and friends are shortcuts that build one internally.

| API | Job | Key options |
|---|---|---|
| `DateTimeFormat` | dates and times | `dateStyle`, `timeStyle`, or fields (`year`, `hour`, …); `timeZone`; `hourCycle`; `timeZoneName` |
| `NumberFormat` | numbers | `style: 'currency' \| 'percent' \| 'unit'`, `currency`, `unit`, `notation: 'compact'`, `maximumFractionDigits` |
| `PluralRules` | which plural *category* a number takes | `type: 'cardinal' \| 'ordinal'` |
| `RelativeTimeFormat` | "in 2 weeks", "yesterday" | `numeric: 'always' \| 'auto'`, `style` |
| `ListFormat` | "a, b, and c" | `type: 'conjunction' \| 'disjunction' \| 'unit'` |

What interviewers look for:

- **Do not hand-roll patterns.** Field order, separators, digits, currency placement and list grammar all vary by locale, and `Intl` gets them from CLDR data.
- **The time zone is separate from the locale.** `DateTimeFormat` uses the *host's* zone unless you pass an IANA `timeZone`. Formatting server-side without one gives different strings on different machines.
- **Plurals are categories, not `n === 1`.** English has `one`/`other`; Polish has `one`/`few`/`many`/`other`; Arabic has six. Select a category and map it to a message.
- **`dateStyle`/`timeStyle` cannot be mixed with field options** such as `hour`. ECMA-402 requires a `TypeError` at construction. `hour12` overrides `hourCycle`.
- **Reuse formatters.** Construction loads locale data. Build once at module level or memoize per locale and options.
- **Output is data-dependent.** The same call can differ across engines and ICU/CLDR versions, so never parse formatted strings or assert on them in cross-environment tests.

## Example

```js
// Dates: the zone is explicit, the locale decides order and wording
const when = new Date('2026-03-08T17:30:00Z');
const opts = { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'short' };
console.log(new Intl.DateTimeFormat('en-GB', opts).format(when));
// → 8 March 2026 at 23:00
console.log(new Intl.DateTimeFormat('de-DE', opts).format(when));
// → 8. März 2026 um 23:00

// Numbers: currency, compact, unit
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
console.log(usd.format(1234.5), new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(1234.5));
// → $1,234.50 1.234,50 €
console.log(new Intl.NumberFormat('en-US', { notation: 'compact' }).format(1_234_567));
// → 1.2M
console.log(new Intl.NumberFormat('en-US', { style: 'unit', unit: 'kilometer-per-hour' }).format(88));
// → 88 km/h

// Plurals: categories differ per language, so select by category
const items = new Intl.PluralRules('en-US');
const noun = { one: 'file', other: 'files' };
console.log([1, 2].map((n) => `${n} ${noun[items.select(n)]}`));
// → [ '1 file', '2 files' ]
console.log(new Intl.PluralRules('pl').select(22), new Intl.PluralRules('en', { type: 'ordinal' }).select(22));
// → few two

console.log(new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(-1, 'day'));
// → yesterday
console.log(new Intl.ListFormat('en', { type: 'disjunction' }).format(['red', 'green', 'blue']));
// → red, green, or blue
```

Run on Node 24.19.0 (ICU 78.3, CLDR 48.0); identical output on Node 22.23.2 and 26.7.0.

## Pitfalls

- Formatting an instant without `timeZone`. `new Date('2026-03-08')` is UTC midnight, and `new Intl.DateTimeFormat('en-US').format(d)` printed `3/7/2026` in New York but `3/8/2026` with `timeZone: 'UTC'`.
- Calling `toLocaleString(locale, options)` in a hot loop. For 20,000 `de-DE` currency formats, a fresh `toLocaleString` each time took about 395 ms against about 7 ms reusing one `NumberFormat` (Node 24.19, one machine; the ratio is the point).
- Treating `formatToParts` and `format` as interchangeable text. In Node 22 and 24 the literal before `PM` came back as U+202F (narrow no-break space) from `formatToParts` while `format()` printed an ASCII space; Node 26.7 returned ASCII for both. Compare parts by `type`, not by raw string.
- Assuming a currency's digits. `JPY` has zero fraction digits and `USD` two; `NumberFormat` applies them, and a missing or malformed `currency` throws (`TypeError` or `RangeError`).

## Follow-ups

**Q:** How do you get a date as parts, such as to wrap the month in a `<strong>`?
**A:** `formatToParts(date)` returns `{ type, value }` entries (`month`, `literal`, `day`, `dayPeriod`, …) in locale order. Render by `type` instead of splitting the formatted string.

**Q:** What are `Intl.DisplayNames` and `Intl.DurationFormat`?
**A:** `new Intl.DisplayNames('en', { type: 'region' }).of('IN')` gives `India` (also `language`, `currency`, `script`). `new Intl.DurationFormat('en', { style: 'long' }).format({ hours: 1, minutes: 30 })` gives `1 hour, 30 minutes`. `DurationFormat` exists on Node 24.19 and 26 but not 22.23; Baseline *newly* available since March 2025, not widely available.

**Q:** How is string sorting localized?
**A:** `Intl.Collator`, covered in [locale comparison](../04-strings-and-unicode/050-locale-comparison-normalization.md). `['ä','z','a'].sort(new Intl.Collator('de').compare)` gives `a, ä, z`.

**Q:** What does `RelativeTimeFormat` do with `numeric: 'auto'`?
**A:** It uses idioms where the locale has them: `format(-1, 'day')` gives `yesterday` instead of `1 day ago`. It formats a number and unit you supply; computing the difference is your job.

## Exercises

### Which plural form?

```js
const rules = new Intl.PluralRules('en', { type: 'ordinal' });
console.log([1, 2, 3, 4, 11, 21].map((n) => rules.select(n)).join());
```

**Answer:** `one,two,few,other,other,one`. English ordinals use `one` (1st, 21st), `two` (2nd), `few` (3rd), and `other` (4th, 11th). 11 is `other`, not `one`, because the rule excludes numbers ending in 11.
