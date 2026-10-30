---
title: "How do cookies work — which requests carry them, and for how long?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [cookies, set-cookie, samesite, partitioned-cookies, chips, document-cookie]
related:
  - browser/storage/choosing-browser-storage
  - browser/network-apis/fetch-request-options
  - browser/storage/quotas-and-eviction
verified: 2026-10
perishable:
  - Chrome treats cookies without SameSite as Lax; Firefox 159 doesn't
  - "Partitioned attribute: Chrome 114+, Firefox 141+, Safari 26.2+"
  - Firefox 159 partitions all third-party cookies by default
  - Chrome 156 by default sends unpartitioned third-party cookies
sources:
  - https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html#name-domain-matching
  - https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html#name-paths-and-path-match
  - https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html#name-the-path-attribute
  - https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html#name-the-max-age-attribute
  - https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html#name-cookie-lifetime-limits
  - https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html#name-storage-model
  - https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html#name-retrieval-algorithm
  - https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html#name-the-samesite-attribute-2
  - https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html#name-the-__host-prefix
  - https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html#name-weak-confidentiality
  - https://html.spec.whatwg.org/multipage/dom.html#dom-document-cookie
  - https://www.ietf.org/archive/id/draft-cutler-httpbis-partitioned-cookies-01.html#section-2.1
  - https://cookiestore.spec.whatwg.org/#CookieStore
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie#browser_compatibility
  - https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/State_Partitioning
  - https://privacysandbox.google.com/cookies/chips
tldr: >
  The browser attaches every stored cookie whose domain, path, `Secure` and `SameSite` rules match
  the request. No `Domain` means this host only; `Domain` adds subdomains. `Path` matches by prefix.
  Without `Max-Age` or `Expires` it's a session cookie; `Max-Age` wins when both are set, capped at
  400 days. `document.cookie` sees only non-`HttpOnly` `name=value` pairs.
---

## Answer

A cookie is a `name=value` pair the browser stores and attaches to later requests in a `Cookie` header. A `Set-Cookie` response header or an assignment to `document.cookie` creates it, and its attributes decide where it goes and for how long.

**Which requests carry it.** A cookie is sent only if all of these match:

- **Domain.** Without `Domain` it's *host-only*: sent only to the exact host that set it. `Domain=example.com` sends it to `example.com` and every subdomain. A host may name itself or a parent, never another site or a public suffix like `co.uk`.
- **Path.** `Path=/admin` matches `/admin` and `/admin/users`, not `/administrator`. The default is the directory of the URL that set it.
- **`Secure`**: HTTPS only, though browsers also treat `http://localhost` as secure.
- **`SameSite`**, for requests from another site: `Strict` never sends it; `Lax` sends it on top-level navigations with safe methods, like following a link; `None` (which requires `Secure`) always does. Chrome treats a missing `SameSite` as `Lax`; Firefox 159 doesn't.
- **Expiry**: it hasn't expired.

Ports don't count, and several matches are listed longest path first. These attributes also defend against CSRF and cookie theft, which is web-security ground.

**For how long.** With neither `Expires` (a date) nor `Max-Age` (seconds) it's a session cookie, kept until the browser decides the session is over. With both, `Max-Age` wins. Browsers cap either at 400 days. To delete a cookie, set it again with the same name, domain and path and `Max-Age=0`.

**`document.cookie`** returns only `name=value` pairs, never attributes and never `HttpOnly` cookies. Each assignment sets one cookie.

**Partitioned cookies (CHIPS).** A third-party cookie set with `Partitioned` and `Secure` is stored per top-level site, so an embedded widget gets a separate jar on each site that embeds it.

## Example

```js
await fetch('/login'); // Set-Cookie: sid=abc; HttpOnly; Path=/
document.cookie = 'theme=dark; Max-Age=3600';
document.cookie = 'tab=2; Path=/admin';

console.log(document.cookie);
// → theme=dark

const sent = async (path) => (await fetch(path)).text(); // server echoes the Cookie header
console.log(await sent('/echo'));
// → sid=abc; theme=dark
console.log(await sent('/admin/users/echo'));
// → tab=2; sid=abc; theme=dark
console.log(await sent('/administrator/echo'));
// → sid=abc; theme=dark

document.cookie = 'tab=; Max-Age=0';
console.log(await sent('/admin/echo'));
// → tab=2; sid=abc; theme=dark
document.cookie = 'tab=; Max-Age=0; Path=/admin';
console.log(await sent('/admin/echo'));
// → sid=abc; theme=dark
```

Run on `http://example.test/ex020.html` against a local server, with the same output in Chrome 156 and Firefox 159. `sid` is sent but invisible to script. The first delete misses because it targets `Path=/`, a different cookie.

## Pitfalls

- Adding `Domain=example.com` to "restrict" a cookie. It widens it to every subdomain; leaving `Domain` out is the narrowest scope.
- Treating `Path` as a security boundary. Any same-origin page can read another path's cookies, for example through an iframe's `contentDocument.cookie`.
- Deleting or overwriting with a different `Path` or `Domain`. That addresses a different cookie, and the original stays.
- Assigning `'a=1; b=2'` to `document.cookie` expecting two cookies. Everything after the first `;` is read as attributes; `b=2` is ignored.

## Follow-ups

**Q:** What do the `__Host-` and `__Secure-` prefixes enforce?
**A:** A `__Secure-` cookie must be set with `Secure`. A `__Host-` cookie also needs `Path=/` and no `Domain`, which pins it to one host. Chrome 156 and Firefox 159 rejected each violation, including on `localhost`.

**Q:** Why can an embedded widget see its cookie in Chrome but not Firefox?
**A:** Firefox partitions every third-party cookie by top-level site by default. A `SameSite=None; Secure` cookie set in an iframe under one site was visible at the widget's own top-level site in Chrome 156, not in Firefox 159.

**Q:** Is there an asynchronous cookie API?
**A:** The Cookie Store API: `cookieStore.get()` returns attributes like `expires` and `path`, and it works in service workers. Chrome 87+, Firefox 140+, Safari 18.4+.

## Deep dive

### Edge cases

Cross-site requests to `https://example.test` after it set `lax`, `strict`, `none` (`SameSite=None; Secure`) and a cookie with no `SameSite` (`dflt`), from a page on `https://other.test`:

| Request | Chrome 156 | Firefox 159 |
|---|---|---|
| Link click (top-level `GET`) | `lax`, `none`, `dflt` | `lax`, `none`, `dflt` |
| `fetch(..., { credentials: 'include' })` | `none` | nothing |
| Same requests from `app.example.test` (same site) | all four | all four |

Firefox sent nothing on the cross-site `fetch()` because the request comes from a third-party context, where it only uses that context's partitioned cookies. A `SameSite=None` cookie without `Secure` was rejected in both.

The `Partitioned` attribute is defined only in an expired individual Internet-Draft (CHIPS); browsers ship it anyway: Chrome 114+, Firefox 141+, Safari 26.2+. A `Partitioned` cookie set in an iframe under `example.test` came back under `app.example.test`, the same site, and was absent at the widget's own top level in both browsers.
