---
title: "Why is `Date` hard to use correctly?"
status: draft
difficulty: easy
frequency: 3
core: false
tags: [date, time-value, utc, parsing, time-zones, mutation]
related:
  - javascript/dates-temporal-intl/temporal-types
  - javascript/dates-temporal-intl/time-zones
  - javascript/numbers-and-bigint/parsing-numbers
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-time-values-and-time-range
  - https://tc39.es/ecma262/#sec-date-time-string-format
  - https://tc39.es/ecma262/#sec-date.parse
  - https://tc39.es/ecma262/#sec-date-constructor
  - https://tc39.es/ecma262/#sec-utc-t
  - https://tc39.es/ecma262/#sec-date.prototype.toisostring
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset
tldr: >
  A `Date` is one number, milliseconds since the 1970 UTC epoch, with no time zone of its own. The getters, the
  constructor and string parsing all silently apply the host's local zone. Months are 0-based, setters mutate,
  date-only strings parse as UTC but date-time strings as local, and non-ISO strings are implementation-defined.
---

## Answer

A `Date` wraps a single **time value**: an integer number of milliseconds since 1970-01-01T00:00:00Z, within ±8.64 × 10^15 (about ±273,790 years), or `NaN` for an invalid date. It stores an instant, not a calendar date, and not a time zone. Almost every pitfall comes from the API mixing that instant with the *host's* local zone and with calendar fields.

- **Hidden local time.** `getHours()`, `toString()` and `new Date(y, m, d)` use the host's time zone; `getUTCHours()`, `toISOString()` and `Date.UTC` do not. The same code gives different results on a laptop and on a UTC server.
- **Inconsistent parsing.** The ES format `YYYY-MM-DDTHH:mm:ss.sssZ` is the only one the spec defines. With no offset, a *date-only* string (`'2026-03-08'`) is read as UTC and a *date-time* string (`'2026-03-08T00:00'`) as local time. Any other string (`'March 8, 2026'`, `'2026/03/08'`, `'2026-03-08 10:00'`) is **implementation-defined**.
- **0-based months, 1-based days.** `new Date(2026, 1, 31)` is not an error. Out-of-range fields roll over into the next month. Two-digit years `0`–`99` map to 1900–1999.
- **Mutable.** Setters change the object in place, so `const end = start; end.setMonth(…)` also changes `start`. Date arithmetic means copying with `new Date(date)` and then mutating.
- **Silent invalidity.** Bad input gives an "Invalid Date" with time value `NaN`. Only `toISOString()` throws a `RangeError`; comparisons and getters return `NaN` or `false`. Check `Number.isNaN(d.getTime())`.
- **No zones, no calendars, no durations.** There is no way to hold "9:00 in Tokyo" or "March 8, no time". The only calendar is the proleptic Gregorian one, and "add one month" is hand-written arithmetic.

Use `Date` for instants and `Date.now()`. For wall-clock or calendar values, use Temporal ([`temporal-types`](020-temporal-types.md)).

## Example

```js
process.env.TZ = 'America/New_York';

// 1. Date-only strings are UTC, date-time strings are local
const dateOnly = new Date('2026-03-08');
const dateTime = new Date('2026-03-08T00:00');
console.log(dateOnly.toISOString(), dateTime.toISOString());
// → 2026-03-08T00:00:00.000Z 2026-03-08T05:00:00.000Z
console.log(dateOnly.getDate(), dateTime.getDate());
// → 7 8

// 2. Months are 0-based; out-of-range fields roll over
console.log(new Date(2026, 1, 31).toDateString());
// → Tue Mar 03 2026

// 3. Setters mutate, and assignment copies the reference
const start = new Date(Date.UTC(2026, 0, 31));
const end = start;
end.setUTCMonth(1);
console.log(start.toISOString());
// → 2026-03-03T00:00:00.000Z

// 4. Invalid dates do not throw until you serialize them
const invalid = new Date('2026-13-01');
console.log(invalid.getTime(), String(invalid));
// → NaN Invalid Date
try { invalid.toISOString(); } catch (e) { console.log(e.name); }
// → RangeError
```

## Pitfalls

- Treating `new Date('2026-03-08')` as local midnight. It is UTC midnight, so in any zone behind UTC `getDate()` returns the *previous* day. Add `T00:00` to get local midnight, or keep the whole pipeline in UTC.
- Relying on `new Date(string)` for non-ISO input. Browsers and Node can disagree, and a string that works in V8 may be `NaN` elsewhere. Parse with a format you control, or pass numeric fields.
- Adding months or days with setters on a shared object: `d.setMonth(d.getMonth() + 1)` on Jan 31 gives Mar 3 (2026), and it mutates the caller's date.
- Using `getTimezoneOffset()` as a zone. It returns minutes with the **opposite sign** of the usual `+05:30` (UTC−5 gives `300`) and describes only that one instant's offset, not the zone or its rules.

## Follow-ups

**Q:** What does `Date()` without `new` return?
**A:** A string for the current time (spec: `ToDateString(now)`), not a `Date`. The argument list is ignored.

**Q:** How does `JSON.stringify` treat a `Date`?
**A:** It calls `toJSON()`, which returns `toISOString()` (or `null` for an invalid date). `JSON.parse` does not reverse it: you get a string back and must rebuild the `Date`.

**Q:** Why can the same local time map to two instants, or none?
**A:** DST transitions repeat or skip local clock times. For a repeated time the spec's local-to-UTC conversion picks the earlier instant. For a skipped time it shifts forward by the gap. See [`time-zones`](040-time-zones.md).

## Exercises

### Which day is it?

```js
process.env.TZ = 'America/Los_Angeles';
const d = new Date('2026-07-04');
console.log(d.getDate(), d.getUTCDate());
```

**Answer:** `3 4`. Date-only strings are UTC midnight, which is 17:00 on July 3 in Los Angeles (UTC−7 in July), so the local getter reports 3 and the UTC getter reports 4.
