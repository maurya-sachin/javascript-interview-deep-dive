---
title: "What do `fetch()` options like `mode`, `credentials`, and `cache` control?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [fetch, request-mode, opaque-response, credentials, http-cache, redirect, referrer-policy]
related:
  - browser/network-apis/fetch-resolves-on-errors
  - browser/network-apis/sending-data-on-exit
  - browser/storage/how-cookies-work
  - browser/workers/service-worker-caching
verified: 2026-10
sources:
  - https://fetch.spec.whatwg.org/#requestinit
  - https://fetch.spec.whatwg.org/#concept-request-mode
  - https://fetch.spec.whatwg.org/#concept-request-credentials-mode
  - https://fetch.spec.whatwg.org/#concept-request-cache-mode
  - https://fetch.spec.whatwg.org/#concept-request-redirect-mode
  - https://fetch.spec.whatwg.org/#concept-filtered-response-opaque
  - https://fetch.spec.whatwg.org/#concept-filtered-response-opaque-redirect
  - https://fetch.spec.whatwg.org/#no-cors-safelisted-request-header
  - https://fetch.spec.whatwg.org/#concept-http-network-or-cache-fetch
  - https://w3c.github.io/webappsec-referrer-policy/#default-referrer-policy
tldr: >
  `mode` sets what a cross-origin request may do and what you get back: `'cors'` (default) needs the
  server's consent, `'no-cors'` returns an unreadable opaque response. `credentials` decides when
  cookies go along: same origin only by default. `cache` picks how the request uses the HTTP cache,
  from `'no-store'` to `'only-if-cached'`.
---

## Answer

Each option sets one field of the *request* the Fetch Standard builds.

**`mode`** decides what a cross-origin request may do and what comes back. `fetch()` defaults to `'cors'`: a cross-origin response is readable only if the server opts in with CORS headers, otherwise the promise rejects with a `TypeError`. `'same-origin'` rejects any cross-origin URL. `'no-cors'` sends the request anyway, but only with `GET`, `HEAD` or `POST` (a `PUT` throws) and safelisted headers (others are silently dropped). You get an **opaque response**: `type` `"opaque"`, `status` 0, `ok` `false`, no headers, an empty body. Script can't read it, only hand it on, for example to a service worker's cache. Which server headers make CORS succeed is CORS policy, not this option.

**`credentials`** decides when cookies, HTTP auth and client certificates go along. `'same-origin'`, the default, sends them only to your own origin. `'include'` sends them cross-origin too, and the response is then usable only if the server explicitly allows credentials. `'omit'` never sends them and ignores any `Set-Cookie` that comes back.

**`cache`** picks how this request uses the browser's HTTP cache:

- `'default'`: follow the response's caching headers.
- `'no-store'`: skip the cache both ways.
- `'reload'`: go to the network, then store the result.
- `'no-cache'`: always revalidate; a 304 serves the cached body.
- `'force-cache'`: use any cached copy, even stale.
- `'only-if-cached'`: never touch the network; requires `mode: 'same-origin'`.

This is the HTTP cache only, not the Cache API a service worker manages.

**`redirect`**: `'follow'` (default), `'error'` (a redirect becomes a network error) or `'manual'` (an `"opaqueredirect"` response with status 0). **`referrerPolicy`** and `referrer` shape the `Referer` header; the default policy, `strict-origin-when-cross-origin`, sends only your origin to other origins.

## Example

```js
// This page is http://localhost:8051; http://localhost:8052 is another origin.
const opaque = await fetch('http://localhost:8052/data.json', { mode: 'no-cors' });
console.log(opaque.type, opaque.status, opaque.ok, [...opaque.headers].length);
// → opaque 0 false 0
console.log(JSON.stringify(await opaque.text()));
// → ""

try {
  await fetch('http://localhost:8052/data.json'); // default mode 'cors', no CORS headers
} catch (error) {
  console.log(error.name);
  // → TypeError
}

// /counted answers "hit N" and is cacheable: Cache-Control: max-age=60 plus an ETag
const read = async (init) => (await fetch('/counted', init)).text();
console.log(await read());
// → hit 1
console.log(await read()); // fresh copy from the HTTP cache
// → hit 1
console.log(await read({ cache: 'no-store' })); // network; cache neither read nor updated
// → hit 2
console.log(await read());
// → hit 1
console.log(await read({ cache: 'reload' })); // network; cache updated
// → hit 3
console.log(await read({ cache: 'no-cache' })); // conditional request; server sends 304
// → hit 3
```

Chrome 156 and Firefox 159 printed the same, against a local Node server on two ports.

## Pitfalls

- Using `mode: 'no-cors'` to "fix" a CORS error. The request goes out, but the response is opaque: no status, no headers, no body.
- Expecting cookies on a cross-origin API call by default. `api.example.com` is another origin to `app.example.com`, so a session cookie scoped to `example.com` goes there only with `credentials: 'include'`.
- Treating `'no-cache'` as "don't cache". It still uses the cache after revalidating; `'no-store'` is the one that skips it.
- Passing `cache: 'only-if-cached'` without `mode: 'same-origin'`. The call throws a `TypeError` before any request.

## Follow-ups

**Q:** What is `redirect: 'manual'` for, if script can't read the `Location`?
**A:** The spec's reason: a service worker can return the opaque-redirect response to a navigation, so the browser replays the redirect offline. To the page it is nearly indistinguishable from a network error, apart from `type` `"opaqueredirect"`.

**Q:** Is `mode: 'no-cors'` a security hole?
**A:** No. It only sends what a form or an `<img>` could already send: a safelisted method, safelisted headers, no readable response. It's the mode those elements use.

**Q:** Which option keeps a request alive after the page unloads?
**A:** `keepalive: true`, with a 64 KiB budget for in-flight bodies. It's the basis of sending data on exit.

## Deep dive

### How it works

The `Request` constructor applies the options and throws a `TypeError` for impossible combinations before anything is sent: `mode: 'navigate'`, `cache: 'only-if-cached'` without `mode: 'same-origin'`, and a method other than `GET`, `HEAD` or `POST` in `no-cors` mode. In `no-cors` mode the headers object gets the `"request-no-cors"` guard, so appending a header that isn't no-CORS-safelisted does nothing. A `new Request('/x')` in Chrome 156 and Firefox 159 reports the defaults: `mode` `'cors'`, `credentials` `'same-origin'`, `cache` `'default'`, `redirect` `'follow'`, `referrer` `'about:client'`.

The cache modes also change the request headers, from the spec's HTTP-network-or-cache fetch steps. A local server saw this from both browsers:

| `cache` | Request headers added |
|---|---|
| `'no-store'`, `'reload'` | `Pragma: no-cache`, `Cache-Control: no-cache` |
| `'no-cache'` with a cached copy | `If-None-Match` (the stored ETag), `Cache-Control: max-age=0` |
| `'default'` with a fresh copy | no request at all |

### Edge cases

Observed in Chrome 156 and Firefox 159; the page is on `localhost:8051`, after the same origin set the cookie `session=abc`. Cookies ignore ports, so the cookie exists for both origins.

| Request | Result |
|---|---|
| `fetch('/cookie-echo')` | cookie sent |
| `fetch('/cookie-echo', { credentials: 'omit' })` | no cookie |
| `fetch('http://localhost:8052/cookie-echo')` | no cookie: another origin |
| same, `credentials: 'include'`, no `Access-Control-Allow-Credentials` | cookie sent, promise rejects with `TypeError` |
| same, `credentials: 'include'`, server allows credentials | cookie sent, response readable |
| `no-cors` `POST` with `X-Custom` and `Content-Type: application/json` | server got neither; the string body went as `text/plain;charset=UTF-8` |
| `redirect: 'manual'` on a 302 | `type` `"opaqueredirect"`, `status` 0, `url` the original URL |
| `redirect: 'follow'` on a 302 | `redirected` `true`, `url` the final URL |
| cross-origin with the default referrer policy | `Referer: http://localhost:8051/` |
| same origin, or `referrerPolicy: 'unsafe-url'` | full URL with query string |
| `referrerPolicy: 'no-referrer'` or `referrer: ''` | no `Referer` |

The `'include'` row shows why a failed CORS check isn't a privacy guarantee for the request: the cookie went to the server, and only the response was withheld.
