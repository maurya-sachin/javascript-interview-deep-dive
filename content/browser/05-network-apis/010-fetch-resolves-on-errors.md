---
title: "Why doesn't `fetch()` reject on a 404, and when does it reject?"
status: draft
difficulty: easy
frequency: 5
core: true
tags: [fetch, response-ok, network-error, http-status, error-handling, response-body]
related:
  - browser/network-apis/fetch-request-options
  - browser/network-apis/streaming-bodies
  - javascript/async-and-the-event-loop/cancelling-async-work
  - javascript/errors-and-cleanup/async-error-boundaries
  - javascript/promises/promise-combinators
verified: 2026-10
perishable:
  - Network error messages differ in Chrome 156 and Firefox 159
sources:
  - https://fetch.spec.whatwg.org/#fetch-method
  - https://fetch.spec.whatwg.org/#concept-network-error
  - https://fetch.spec.whatwg.org/#ok-status
  - https://fetch.spec.whatwg.org/#dom-response-ok
  - https://fetch.spec.whatwg.org/#concept-main-fetch
  - https://fetch.spec.whatwg.org/#concept-body-consume-body
  - https://fetch.spec.whatwg.org/#body-unusable
  - https://fetch.spec.whatwg.org/#dom-response-clone
  - https://fetch.spec.whatwg.org/#concept-request-redirect-mode
tldr: >
  A 404 or 500 is still a response, so `fetch()` fulfills with it; check `response.ok` (status 200–299)
  yourself. The promise rejects only when there is no response: a network error (DNS, refused
  connection, failed CORS check) or invalid input gives a `TypeError`, an abort gives the signal's
  reason, usually an `AbortError`.
---

## Answer

`fetch()` settles when it has a **response**, not when the request succeeded. A 404 or a 500 is a complete HTTP response: the server answered. So the promise fulfills with a `Response`, and success is yours to check: `response.ok` is `true` only for an *ok status*, 200 to 299, and `response.status` holds the code.

The promise rejects only when there is no response to hand over:

- **Network error → `TypeError`.** DNS failure, a refused or reset connection, a failed CORS check, a request blocked by CSP, mixed content or a bad port, and `redirect: 'error'` meeting a redirect. The Fetch Standard turns each into one *network error* (type `"error"`, status 0) and rejects with a `TypeError`, so the page can't tell them apart; the details show only in the DevTools console. The message is browser-specific: Chrome prints `Failed to fetch`, Firefox `NetworkError when attempting to fetch resource.`
- **Invalid input → `TypeError`**, thrown while building the `Request`: an unparsable URL, or a body on a `GET`.
- **Abort → the signal's reason**: a `DOMException` named `AbortError` for `controller.abort()`, `TimeoutError` for `AbortSignal.timeout()`.

The promise fulfills once the status and headers arrive; the body streams in afterwards. So errors can also surface later, when you read the body. A connection that drops mid-body makes `response.text()` reject with a `TypeError`. `.json()` rejects with a `SyntaxError` when the body isn't JSON, such as an HTML error page or an empty body.

A body can be read **once**. Any reading method sets `bodyUsed` to `true`, and a second `.json()` rejects with a `TypeError`. To read it twice, call `response.clone()` before the first read.

The usual wrapper awaits `fetch()`, throws its own error when `!response.ok`, with the status and the error body, and only then parses.

## Example

```js
const res = await fetch('/missing'); // the server answers 404
console.log(res.status, res.ok);
// → 404 false

try {
  await fetch('http://localhost:8059/'); // nothing listens on this port
} catch (error) {
  console.log(error.name);
  // → TypeError
}

async function getJson(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${url}`, { cause: await res.text() });
  }
  return res.json();
}

try {
  await getJson('/broken'); // the server answers 500 with a JSON body
} catch (error) {
  console.log(error.message, error.cause);
  // → HTTP 500 from /broken {"error":"db down"}
}
```

Run as a module script from `http://localhost:8051` against a local Node server, in Chrome 156 and Firefox 159; both printed the same.

## Pitfalls

- Wrapping `fetch()` in `try`/`catch` and expecting a 404 or 500 to land in `catch`. Only network errors, invalid input and aborts get there.
- Calling `res.json()` before checking `res.ok`. An HTML error page then rejects with a `SyntaxError`, and the real status is lost.
- Reading the body for logging, then handing the `Response` to code that reads it again. The second read rejects with a `TypeError`; `clone()` first.
- Matching on the error message (`'Failed to fetch'`). It differs per browser; branch on `error.name` instead.

## Follow-ups

**Q:** How do you tell an abort from a network failure?
**A:** By `error.name`: `AbortError` or `TimeoutError` (both `DOMException`s, not `TypeError`s) for an abort, `TypeError` for a network error. Checking `signal.aborted` works too.

**Q:** What happens on a redirect?
**A:** By default `fetch()` follows it and fulfills with the final response: `res.redirected` is `true` and `res.url` is the final URL. `redirect: 'error'` turns the redirect into a network error instead.

**Q:** Is `res.ok === false` always an HTTP error?
**A:** No. An opaque response from `mode: 'no-cors'` has status 0 and `ok` `false` even when the server answered 200, because the page may not see the status.

## Deep dive

### How it works

The `fetch()` method steps in the Fetch Standard explain every outcome:

1. Build a `Request` from the arguments. If that throws, reject with the exception: this is where a bad URL or a `GET` with a body becomes a `TypeError`.
2. If the signal is already aborted, reject with its abort reason. An abort later in the request does the same, and also errors the request and response body streams.
3. Run the fetch. When a response is ready, which is as soon as its status and headers are, check it: a *network error* rejects the promise with a new `TypeError`; anything else fulfills it with a `Response` object.

Main fetch turns a bad port, mixed content or a CSP violation into a network error before any connection is made; a failed CORS check, DNS failure or refused connection produce one later. All of them reach step 3 as the same kind of response, which is why the page only ever sees `TypeError`.

`ok` is a getter: `true` when the status is in 200–299. Nothing about 4xx or 5xx is an error to the API.

Reading a body goes through *consume body*: if the body is *unusable* (its stream is disturbed, meaning read from, or locked to a reader), it returns a promise rejected with a `TypeError`. Otherwise it reads the stream to the end and converts the bytes; `.json()` runs a JSON parse, so a parse failure rejects with that `SyntaxError`. A response with no body, such as a 204, gives `.text()` an empty string and `.json()` a `SyntaxError`. `clone()` throws a `TypeError` when the body is already unusable, which is why the clone has to come first.

### Edge cases

Observed in Chrome 156 and Firefox 159, with a local Node server:

| Situation | Settles with | Chrome message | Firefox message |
|---|---|---|---|
| Connection refused, DNS failure, CORS failure, `redirect: 'error'` | `TypeError` | `Failed to fetch` | `NetworkError when attempting to fetch resource.` |
| `fetch('http://:80/')` | `TypeError` | `Failed to execute 'fetch' on 'Window': Failed to parse URL from http://:80/` | `Window.fetch: http://:80/ is not a valid URL.` |
| `controller.abort()` | `AbortError` | `signal is aborted without reason` | `The operation was aborted. ` |
| `AbortSignal.timeout(100)` | `TimeoutError` | `signal timed out` | `The operation timed out.` |
| Connection dropped after headers | fulfills, then `text()` rejects with `TypeError` | `Failed to fetch` | `Content-Length header of network response exceeds response Body.` |
| Second `.json()` | `TypeError` | `Failed to execute 'json' on 'Response': body stream already read` | `Response.json: Body has already been consumed.` |
| `.json()` on an HTML page | `SyntaxError` | `Unexpected token '<', "<!doctype "... is not valid JSON` | `JSON.parse: unexpected character at line 1 column 1 of the JSON data` |

### Real-world scenario

An API client should keep three failures separate, because the UI reacts differently to each: offline or blocked (retry, show "check your connection"), an HTTP error (show the server's message, maybe log out on 401), and a cancelled request (show nothing).

```js
class HttpError extends Error {
  constructor(response, body) {
    super(`HTTP ${response.status} ${response.statusText}`);
    this.name = 'HttpError';
    this.status = response.status;
    this.body = body;
  }
}

async function request(url, { signal, ...init } = {}) {
  const res = await fetch(url, { ...init, signal }); // TypeError or AbortError propagate as-is
  if (!res.ok) throw new HttpError(res, await res.text());
  return res.status === 204 ? null : res.json();
}

try {
  await request('/broken', { signal: AbortSignal.timeout(5000) });
} catch (error) {
  console.log(error.name, error.status, error.body);
  // → HttpError 500 {"error":"db down"}
}
```

The error body is read as text, not JSON, because error pages are often HTML. The 204 check avoids the `SyntaxError` that `.json()` gives an empty body. Passing the signal through is all the client does for cancellation; how signals compose is its own question.

## Exercises

### What does this log?

```js
const res = await fetch('/broken'); // 500, body {"error":"db down"}
const data = await res.json();
console.log(res.ok, data.error);
```

**Answer:** `false db down`. The 500 is a response, so `fetch()` fulfills, and its body is valid JSON, so `.json()` fulfills too.

### What does this log?

```js
const res = await fetch('/data.json'); // 200, body {"name":"Ada"}
console.log(await res.text());
try {
  await res.json();
} catch (error) {
  console.log(error.name, res.bodyUsed);
}
```

**Answer:** `{"name":"Ada"}`, then `TypeError true`. The first read used the body up, so the second rejects.

### What does this log?

```js
const controller = new AbortController();
const pending = fetch('/data.json', { signal: controller.signal });
controller.abort();
try {
  await pending;
} catch (error) {
  console.log(error.name, error instanceof TypeError);
}
```

**Answer:** `AbortError false`. An abort rejects with the signal's reason, a `DOMException`, not a `TypeError`.
