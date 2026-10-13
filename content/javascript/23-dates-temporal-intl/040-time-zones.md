---
title: "How do you handle time zones correctly?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [time-zones, dst, utc, iana, offset, disambiguation, temporal, intl]
related:
  - javascript/dates-temporal-intl/date-pitfalls
  - javascript/dates-temporal-intl/temporal-types
  - javascript/dates-temporal-intl/intl-formatting
verified: 2026-10
sources:
  - https://data.iana.org/time-zones/tzdb/theory.html
  - https://tc39.es/ecma262/#sec-utc-t
  - https://tc39.es/ecma262/#sec-local-time-zone-adjustment
  - https://tc39.es/proposal-temporal/docs/zoneddatetime.html
  - https://tc39.es/proposal-temporal/docs/timezone.html
  - https://www.rfc-editor.org/rfc/rfc9557
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/ZonedDateTime
tldr: >
  A time zone is a named set of IANA rules (`America/New_York`) that map instants to wall-clock times, including DST
  and future government changes. An offset (`-05:00`) is only one result of those rules. Store UTC instants for
  things that happened, store wall time plus zone id for future events, and convert to a zone only at the display edge.
---

## Answer

Three different things get called "time zone":

- **Instant:** a moment on the UTC timeline (`2026-03-08T12:00:00Z`). It is the same everywhere.
- **Offset:** a fixed difference from UTC at one moment (`-04:00`, `+05:30`, `+05:45`). It says nothing about what it will be next month.
- **Zone:** an IANA identifier (`America/New_York`, `Asia/Kolkata`) naming a history of offset rules, including DST. The IANA database says to prefer such identifiers over abbreviations, because `CST` or `IST` are ambiguous.

Rules of thumb:

1. **Store instants in UTC** (ISO string with `Z`, or epoch milliseconds) for past events: logs, payments, `createdAt`. Convert to a zone **only for display**, with an explicit `timeZone`.
2. **Future local events** (a 09:00 meeting in London) need the *wall time plus the zone id*. A UTC instant computed today is wrong if the government changes the zone's rules before the event.
3. **Wall times are not always unique.** When clocks go forward, a range of local times is skipped (a gap). When they go back, a range happens twice (an overlap). You must pick a policy.
4. **Never assume 24 hours per day, whole-hour offsets, or the host zone.** Offsets such as `+05:30` and `+05:45` exist, southern-hemisphere zones move the other way, and servers should not depend on their own `TZ`.

`Date` has only two zones: UTC and the host's. For a gap it moves the time forward by the gap, and for an overlap it picks the earlier instant. It cannot hold "9:00 in Tokyo". Use `Intl.DateTimeFormat` with `timeZone` to display, and Temporal's `ZonedDateTime` to compute. Its `disambiguation` option (`'compatible'` default, `'earlier'`, `'later'`, `'reject'`) makes the gap and overlap policy explicit.

## Example

```js
// polyfill-run: @js-temporal/polyfill 0.5.1 on Node 24.19.0 (Node 24 has no native Temporal)
import { Temporal } from '@js-temporal/polyfill';

// US clocks: 02:30 on 2026-03-08 never happens; 01:30 on 2026-11-01 happens twice
const zone = 'America/New_York';
const gap = Temporal.PlainDateTime.from('2026-03-08T02:30');
const overlap = Temporal.PlainDateTime.from('2026-11-01T01:30');

for (const disambiguation of ['compatible', 'earlier', 'later']) {
  console.log(disambiguation, gap.toZonedDateTime(zone, { disambiguation }).toString());
  console.log(disambiguation, overlap.toZonedDateTime(zone, { disambiguation }).toString());
}
// → compatible 2026-03-08T03:30:00-04:00[America/New_York]
// → compatible 2026-11-01T01:30:00-04:00[America/New_York]
// → earlier 2026-03-08T01:30:00-05:00[America/New_York]
// → earlier 2026-11-01T01:30:00-04:00[America/New_York]
// → later 2026-03-08T03:30:00-04:00[America/New_York]
// → later 2026-11-01T01:30:00-05:00[America/New_York]
try { gap.toZonedDateTime(zone, { disambiguation: 'reject' }); } catch (e) { console.log(e.name); }
// → RangeError

// A future meeting: store the zone id with the wall time, derive the instant when needed
const meeting = Temporal.ZonedDateTime.from('2027-03-28T09:00[Europe/London]');
console.log(meeting.toInstant().toString(), meeting.offset);
// → 2027-03-28T08:00:00Z +01:00
```

Temporal output above is polyfill-run (not native).

## Pitfalls

- Storing only an offset (`-05:00`) and treating it as a zone. The offset is correct for one date; a month later the zone may be at `-04:00`.
- Storing a future event as a UTC instant only. If the zone's rules change, the stored instant stays fixed while the wall time people expect moves. Mexico stopped DST in October 2022: in Node 24's data, noon UTC on 1 July showed `07:00 GMT-05:00` in 2022 and `06:00 GMT-06:00` in 2023 for `America/Mexico_City`.
- Parsing or formatting without a zone on a server. Results change with the host `TZ`; always pass a `timeZone` or use UTC.
- Using abbreviations (`EST`, `IST`) as identifiers. They are ambiguous, and engines format them only for some locale and zone combinations (`'en-US'` printed `EDT`, while `'en-GB'` printed `GMT-4` for the same zone).

## Follow-ups

**Q:** How do you get the user's time zone in the browser?
**A:** `Intl.DateTimeFormat().resolvedOptions().timeZone` returns the IANA id the runtime is using. Send it with the request if the server must render local times.

**Q:** Why can a day have 23 or 25 hours?
**A:** DST transitions shift the offset by an hour mid-day. In `America/New_York`, 2026-03-08 has 23 hours and 2026-11-01 has 25. `ZonedDateTime.hoursInDay` returns it. Never add `24 * 3600 * 1000` to mean "tomorrow".

**Q:** When do I use `disambiguation: 'reject'`?
**A:** For user-entered local times that must be valid, such as booking forms. It throws a `RangeError` on a gap or overlap so you can ask the user instead of guessing.

**Q:** Do zone rules ever change after release?
**A:** Yes. IANA publishes tz database updates, and runtimes ship them with their ICU/tz data. Node 24.19.0 reported tz 2026b, 22.23.2 and 26.7.0 reported 2026a, so an old runtime can disagree with a new one about future offsets.

## Exercises

### Which instants?

```js
process.env.TZ = 'America/New_York';
const skipped = new Date(2026, 2, 8, 2, 30);
const repeated = new Date(2026, 10, 1, 1, 30);
console.log(skipped.toISOString(), repeated.toISOString());
```

**Answer:** `2026-03-08T07:30:00.000Z 2026-11-01T05:30:00.000Z`. The skipped 02:30 is moved forward by the gap and becomes 03:30 EDT (UTC−4, which is 07:30Z). The repeated 01:30 resolves to the earlier occurrence, still on EDT (UTC−4, which is 05:30Z), not the later 01:30 EST (06:30Z).
