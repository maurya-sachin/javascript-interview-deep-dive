---
title: "What is Temporal, and which type do you use when?"
status: draft
difficulty: medium
frequency: 2
core: true
tags: [temporal, date, zoneddatetime, instant, plaindate, duration, time-zones, immutability]
related:
  - javascript/dates-temporal-intl/date-pitfalls
  - javascript/dates-temporal-intl/time-zones
  - javascript/dates-temporal-intl/intl-formatting
verified: 2026-10
perishable:
  - Temporal shipping list; Safari preview only; Node 22/24 flag-only
sources:
  - https://github.com/tc39/proposals/blob/main/finished-proposals.md
  - https://github.com/tc39/notes/blob/HEAD/meetings/2026-03/march-11.md#temporal-for-stage-4
  - https://tc39.es/proposal-temporal/docs/
  - https://tc39.es/proposal-temporal/docs/zoneddatetime.html
  - https://tc39.es/proposal-temporal/docs/duration.html
  - https://tc39.es/proposal-temporal/#sec-temporal-handledatetimevalue
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal
  - https://github.com/mdn/browser-compat-data/blob/main/javascript/builtins/Temporal.json
  - https://nodejs.org/en/blog/release/v26.0.0
  - https://github.com/nodejs/node/blob/main/BUILDING.md#building-nodejs-with-temporal-support
  - https://www.rfc-editor.org/rfc/rfc9557
tldr: >
  Temporal is the immutable, time-zone-aware replacement for `Date` (stage 4 in March 2026). Pick by what you know:
  `Instant` for an exact moment, `ZonedDateTime` for a moment in a place, `PlainDate`, `PlainTime` and
  `PlainDateTime` for wall-clock values with no zone, `PlainYearMonth` and `PlainMonthDay` for partial dates,
  `Duration` for lengths of time.
---

## Answer

Temporal is a global namespace of immutable types that fix `Date`'s problems: nanosecond precision, explicit time zones and calendars, no mutation, strict ISO 8601 / RFC 9557 parsing, and real date arithmetic. It reached **stage 4 in March 2026** (the spec edition targeted is ES2027). Shipping: Firefox 139, Chrome and Edge 144, Node.js 26, Deno 2.7, Bun 1.4; Safari is still in preview. Elsewhere use `@js-temporal/polyfill` and feature-detect `globalThis.Temporal`.

Choose the type by what information you have:

| Type | Holds | Use for |
|---|---|---|
| `Instant` | an exact moment (epoch nanoseconds), no zone | timestamps, logs, storage, ordering events |
| `ZonedDateTime` | instant + time zone + calendar | a moment *in a place*: meetings, flights, "9:00 in New York" |
| `PlainDateTime` | date and time, no zone | local wall-clock time not yet tied to a place |
| `PlainDate` | calendar date | birthdays, holidays, deadlines by day |
| `PlainTime` | clock time | alarms, opening hours |
| `PlainYearMonth` / `PlainMonthDay` | partial date | billing months, anniversaries |
| `Duration` | years … nanoseconds | an amount of time, not a position on the timeline |

Rules that make the API safe:

- Every object is **immutable**: `add`, `with`, `round` return new objects.
- **Calendar days and exact time are different units.** On a `ZonedDateTime`, `add({ days: 1 })` keeps the clock time across a DST change; `add({ hours: 24 })` adds elapsed time.
- Month-end overflow is a choice: `overflow: 'constrain'` (default) clamps, `'reject'` throws.
- Parsing is strict. `Instant.from` needs an offset or `Z`; `ZonedDateTime.from` needs a `[Zone]` annotation.
- Compare with `compare()` / `equals()`; `<` and `+` throw instead of coercing.

## Example

```js
// Same output natively in Node 26.11.1 and Chrome 155, and with @js-temporal/polyfill 0.5.1 on Node 24.19.0
import { Temporal } from '@js-temporal/polyfill';

// Instant: an exact moment, no zone, no calendar
const launch = Temporal.Instant.from('2026-03-08T12:00:00Z');
console.log(launch.toZonedDateTimeISO('Asia/Kolkata').toString());
// → 2026-03-08T17:30:00+05:30[Asia/Kolkata]

// ZonedDateTime: calendar days follow the clock, hours follow the stopwatch
// (US clocks moved forward on 2026-03-08)
const meeting = Temporal.ZonedDateTime.from('2026-03-07T09:00[America/New_York]');
console.log(meeting.add({ days: 1 }).toString());
// → 2026-03-08T09:00:00-04:00[America/New_York]
console.log(meeting.add({ hours: 24 }).toString());
// → 2026-03-08T10:00:00-04:00[America/New_York]

// PlainDate: no zone, so no DST; month overflow is explicit
const jan31 = Temporal.PlainDate.from('2026-01-31');
console.log(jan31.add({ months: 1 }).toString());
// → 2026-02-28
try { jan31.add({ months: 1 }, { overflow: 'reject' }); } catch (e) { console.log(e.name); }
// → RangeError

// Duration: a length of time, and every object is immutable
const span = jan31.until('2026-12-25', { largestUnit: 'month' });
console.log(span.toString(), jan31.with({ day: 1 }).toString(), jan31.toString());
// → P10M25D 2026-01-01 2026-01-31
```

## Pitfalls

- Using `PlainDateTime` for something that happened at a moment. It has no offset, so two systems can read it as different instants. Store an `Instant`, or a `ZonedDateTime` when the zone matters.
- Adding `{ hours: 24 }` when you mean "tomorrow at the same time", or the reverse. They differ on the two DST days of the year.
- Assuming Temporal exists. Node 22 and 24 have no `Temporal` global by default (their `--harmony-temporal` flag exposes an older, incomplete V8 implementation), and Safari has not shipped it. A polyfill adds bundle size, so feature-detect before loading it.
- Calling `Duration.total()` or `round()` in months or years without `relativeTo`. A month has no fixed length, so it throws.

## Follow-ups

**Q:** Why is there no `Temporal.Date`?
**A:** The names say what is missing: `PlainDate` has no time zone and no time; `ZonedDateTime` has both. There is no "date-time with an unknown zone" type that pretends to be a moment.

**Q:** How do you convert a `Date` to Temporal?
**A:** `date.toTemporalInstant()` (defined by the spec on `Date.prototype`), then `.toZonedDateTimeISO(zone)` for a wall-clock view. The reverse is `new Date(instant.epochMilliseconds)`, which truncates to milliseconds.

**Q:** What happened to `Temporal.TimeZone` and `Temporal.Calendar`?
**A:** They were removed from the proposal before it reached stage 4. Time zones and calendars are now plain string identifiers (`'Asia/Tokyo'`, `'hebrew'`) passed as arguments.

## Deep dive

### How it works

A type is defined by which fields it stores. `Instant` holds one BigInt of epoch nanoseconds. `PlainDate` holds an ISO year, month and day plus a calendar id; `PlainTime` holds hour to nanosecond. `ZonedDateTime` holds epoch nanoseconds, a time zone id and a calendar id, and **derives** its date and time fields from them. That is why it is the only type that can answer "what is 24 hours later" and "what is the same wall time tomorrow" differently.

`ZonedDateTime` serializes to RFC 9557: `2026-03-07T09:00:00-05:00[America/New_York]`. The offset records the moment; the bracketed id lets a reader re-apply the zone's rules later. `Duration` holds signed integer fields for each unit (all non-zero fields share one sign) and is **not** balanced on creation. Converting between calendar units and exact units needs a reference point:

```js
import { Temporal } from '@js-temporal/polyfill';

const month = Temporal.Duration.from({ months: 1 });
console.log(month.total({ unit: 'day', relativeTo: '2026-02-01' }), month.total({ unit: 'day', relativeTo: '2026-03-01' }));
// → 28 31
try { month.total({ unit: 'day' }); } catch (e) { console.log(e.name); }
// → RangeError
console.log(Temporal.Duration.from({ hours: 25 }).round({ largestUnit: 'day' }).toString());
// → P1DT1H
```

Output above matches natively in Node 26.11.1 and Chrome 155, and with the polyfill on Node 24.19.0, like every Temporal output in this question.

### Edge cases

- `Instant` rejects calendar units: `instant.add({ days: 1 })` throws a `RangeError`, because a day is not a fixed length. Use hours, or convert to `ZonedDateTime`.
- `PlainDate.from('2026-03-08T12:00:00Z')` throws: a `Z` designator means an exact moment, which a plain value must not silently discard.
- Formatting goes through `toLocaleString()`. `new Intl.DateTimeFormat().format(zonedDateTime)` throws a `TypeError` (the polyfill's message says to call `toLocaleString()`), and options that do not apply to the type are rejected (a `timeStyle` on a `PlainDate`). Both throw natively in Node 26.11.1, Chrome 155 and the polyfill, as the Intl part of Temporal's spec requires (`HandleDateTimeValue` throws for a `ZonedDateTime`; a `PlainDate` format with only time fields is null, which throws).
- `toString()` for `Instant` is always UTC (`…Z`); to show a zone, convert first.
- `Date.prototype.toTemporalInstant` exists only where Temporal does; the polyfill exports it as a standalone function instead.

### Real-world scenario

A monthly billing date anchored on the 31st. Chaining `add({ months: 1 })` drifts, because each clamp loses the original day. Add the total offset to the **anchor** instead:

```js
import { Temporal } from '@js-temporal/polyfill';

const anchor = Temporal.PlainDate.from('2026-01-31');
const chained = anchor.add({ months: 1 }).add({ months: 1 });
console.log(chained.toString(), anchor.add({ months: 2 }).toString());
// → 2026-03-28 2026-03-31
const bill = (n) => anchor.add({ months: n }).toString();
console.log([1, 2, 3].map(bill));
// → [ '2026-02-28', '2026-03-31', '2026-04-30' ]
```

With `Date` the same logic needs manual last-day-of-month checks and mutation of a copy.

### Trade-offs

Temporal costs a larger API surface (eight types) and an explicit choice at every call site; `Date` lets you skip that choice and then breaks. Native support is new, so libraries that serve older engines still need a polyfill, and `Date` remains the type many platform APIs return or accept. For an `Instant` that only needs ordering and storage, a plain epoch number or ISO string is still enough.

How I checked support: `typeof Temporal` was `'object'` on an official Node 26.11.1 build and `undefined` on Node 22.23.2 and 24.19.0. Their V8 `--harmony-temporal` flag adds an older implementation that still has `Temporal.TimeZone`, prints `Asia/Calcutta` for `Asia/Kolkata` and doesn't throw on `format(zonedDateTime)`, so don't test against it. A Homebrew build of Node 26.7.0 had no `Temporal` (`process.config.variables.v8_enable_temporal_support` was `0`): Node's build docs say Temporal needs `temporal_rs` at build time, so a distribution's build can lack it even though Node 26's release notes say it is enabled by default.

## Exercises

### Same clock time, or same elapsed time?

```js
import { Temporal } from '@js-temporal/polyfill';

const start = Temporal.ZonedDateTime.from('2026-11-01T00:30[America/New_York]');
console.log(start.add({ days: 1 }).toString());
console.log(start.add({ hours: 24 }).toString());
```

**Answer:** `2026-11-02T00:30:00-05:00[America/New_York]` then `2026-11-01T23:30:00-05:00[America/New_York]`. Clocks go back on 1 November, so that calendar day lasts 25 hours. One calendar day later is 00:30 on the 2nd, which is 25 elapsed hours. 24 elapsed hours is only 23:30 on the 1st.
