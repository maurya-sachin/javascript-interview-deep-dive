---
title: "How do you send data reliably when the user leaves the page?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [send-beacon, keepalive, fetch-later, analytics, visibilitychange, pagehide]
related:
  - browser/network-apis/fetch-request-options
  - browser/network-apis/fetch-resolves-on-errors
  - browser/navigation/page-lifecycle-events
  - browser/navigation/back-forward-cache
  - browser/storage/how-cookies-work
verified: 2026-10
perishable:
  - "fetchLater(): Chromium 135+, not in Firefox or Safari"
  - Firefox 159 applies no quota to sendBeacon()
  - Exit-time delivery results from Chrome 156 and Firefox 159
  - Chrome 155+ doesn't run unload handlers by default
sources:
  - https://w3c.github.io/beacon/#sec-processing-model
  - https://w3c.github.io/beacon/#introduction
  - https://fetch.spec.whatwg.org/#request-keepalive-flag
  - https://fetch.spec.whatwg.org/#concept-http-network-or-cache-fetch
  - https://fetch.spec.whatwg.org/#concept-fetch-group-terminate
  - https://fetch.spec.whatwg.org/#dom-window-fetchlater
  - https://fetch.spec.whatwg.org/#queue-a-deferred-fetch
  - https://fetch.spec.whatwg.org/#available-deferred-fetch-quota
  - https://developer.chrome.com/docs/web-platform/deprecating-unload
  - https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon#browser_compatibility
  - https://developer.mozilla.org/en-US/docs/Web/API/Window/fetchLater#browser_compatibility
  - https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch#browser_compatibility
tldr: >
  Hand the request to the browser so it outlives the page: `navigator.sendBeacon()` or
  `fetch(url, { keepalive: true })`, which share a 64 KiB in-flight budget, or Chrome's `fetchLater()`.
  Send when `visibilitychange` reports `"hidden"`, plus `pagehide`, not on `unload`, and batch data
  as you go so the exit send is small.
---

## Answer

When a document goes away, the Fetch Standard terminates its in-flight fetches unless they are *keepalive*. A plain `fetch()` started on the way out can be cancelled: in Firefox 159, closing the tab lost it every time. Three APIs mark a request so it survives:

- **`navigator.sendBeacon(url, data)`** queues a `POST` and returns `true` if it was queued, `false` if the data is over quota. No response, no custom headers, always cookies. A string goes as `text/plain;charset=UTF-8`; `URLSearchParams`, `FormData` and a `Blob` bring their own type. A `Blob` typed `application/json` makes a cross-origin beacon wait for a CORS preflight.
- **`fetch(url, { keepalive: true })`**: the same mechanism with the whole `fetch()` API (method, headers, `credentials`). Stream bodies aren't allowed.
- **`fetchLater(url, init)`** registers a request now; the browser sends it when the document is destroyed, or after `activateAfter` milliseconds. Abort it and register again to update the data. Chromium 135+ only; not in Firefox or Safari.

Keepalive requests from one page share **64 KiB of in-flight body**. Past it, `sendBeacon()` returns `false` and a keepalive `fetch()` rejects with a `TypeError`. Firefox 159 enforced this for `fetch()` but not for beacons: a 16 MiB one went through.

**When to send.** Flush when `visibilitychange` reports `visibilityState === 'hidden'`. The Beacon spec calls it the only event guaranteed to fire on mobile when the user switches apps, after which the OS may kill the page without `unload`. Add `pagehide` for navigations. Avoid `unload` and `beforeunload`: they can be skipped, wherever `unload` runs it keeps the page out of the back/forward cache, and since Chrome 155 Chrome doesn't run `unload` handlers by default. The page can come back after `"hidden"`, so a flush must be repeatable: send what's new and clear it.

Better still, batch while the user is active, so the exit send carries only the tail.

## Example

```js
const pending = [];
function track(name) {
  pending.push({ name, at: Math.round(performance.now()) });
}

function flush() {
  if (pending.length === 0) return;
  const body = JSON.stringify(pending); // a string goes as text/plain;charset=UTF-8
  if (navigator.sendBeacon('/beacon', body)) pending.length = 0; // false: keep for the next flush
}

addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flush();
});
addEventListener('pagehide', flush);

track('opened');
track('scrolled');

console.log(navigator.sendBeacon('/beacon', 'x'.repeat(64 * 1024 + 1)));
// → false
```

Chrome 156 printed `false`. Firefox 159 printed `true` and sent all 65,537 bytes. Driven with Puppeteer, navigating away or closing the tab (3 runs of each per browser), the server received the two events once each time, as `text/plain;charset=UTF-8`: `visibilitychange` sent them, so `pagehide` found nothing left.

## Pitfalls

- Sending from `unload` or `beforeunload`. A backgrounded mobile page can be killed without them.
- Sending JSON as a `Blob` typed `application/json` to another origin. The beacon then needs a preflight the server must answer; a plain string avoids it, and the server parses `text/plain`.
- Ignoring the `false` from `sendBeacon()`. It means the data was dropped; the 64 KiB budget counts every keepalive request still in flight, not just this one.
- Flushing on both `visibilitychange` and `pagehide` without clearing what was sent, which double-counts the session.

## Follow-ups

**Q:** Do beacons carry cookies to another origin?
**A:** Yes. The Beacon spec sets credentials mode `include`; a beacon from `localhost:8051` to `localhost:8052` carried the cookie in Chrome 156 and Firefox 159.

**Q:** Can you read the response to a beacon?
**A:** No, `sendBeacon()` returns only a boolean. A keepalive `fetch()` resolves with a response if the page is still alive to receive it.

**Q:** What does `fetchLater()`'s return value tell you?
**A:** `result.activated` turns `true` once the request has been sent. With `activateAfter: 1000` it read `false` immediately and `true` 1.5 s later in Chrome 156.

## Deep dive

### Edge cases

What the server received after each exit, with one page sending from `visibilitychange` and `pagehide` by beacon, keepalive `fetch()` and plain `fetch()`, plus a `fetchLater()` registered at load (3 runs each, Puppeteer, local server):

| Exit | Chrome 156 | Firefox 159 |
|---|---|---|
| Navigate away | everything; `pagehide`'s `persisted` was `true` | everything except `fetchLater()`, which doesn't exist |
| Close the tab | everything | beacon and keepalive only; both plain fetches lost |
| Switch tabs | `visibilitychange` sends only | `visibilitychange` sends only |

Chrome delivering plain fetches here doesn't make them safe: the spec lets the browser terminate them, and Firefox did.

**The quota.** It's checked when a keepalive request with a body starts. Chrome 156 counted beacons and keepalive fetches together: a 40 KiB keepalive `fetch()` still in flight made a 40 KiB beacon return `false`, and the other way round the `fetch()` rejected. Firefox 159 limited keepalive fetches the same way, but sent a 16 MiB beacon.

**`fetchLater()` in Chrome 156.** It has its own quota of 64 KiB per destination origin, counting the URL, referrer, headers and body: a 65,537-byte body threw `QuotaExceededError` ("got 65624 bytes"). A `ReadableStream` body threw a `TypeError` because its length is unknown, and a negative `activateAfter` a `RangeError`. Aborting its signal before it was sent cancelled it. A page that navigated away into the back/forward cache had already sent its pending `fetchLater()`, and on return `result.activated` was `true`.
