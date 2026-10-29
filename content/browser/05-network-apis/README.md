# 05 — Network APIs

> **Status:** 🔴 planned · **Published:** 0/4 · **Last verified:** —

The browser's request APIs: what `fetch()` resolves and rejects with, the options that change a request, streaming bodies, and sending data as a page goes away.

## Learning goals

After this chapter you can:

- Handle HTTP errors from `fetch()` correctly
- Choose `mode`, `credentials` and `cache` for a request and explain opaque responses
- Stream a response body and report download progress
- Send analytics reliably when the user leaves

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- `fetch()` semantics: network errors vs HTTP errors, `Response.ok`, bodies read once → 010
- Request options: `mode`, `credentials`, `cache`, `redirect`, `referrerPolicy`; opaque responses → 020
- Streaming bodies: `ReadableStream`, readers, `TextDecoderStream`, download progress, request streams → 030
- Sending data on exit: `navigator.sendBeacon()`, `keepalive`, `fetchLater()` → 040

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [Why doesn't `fetch()` reject on a 404, and when does it reject?](010-fetch-resolves-on-errors.md) | easy | 🟡 draft |
| 020 | [What do `fetch()` options like `mode`, `credentials`, and `cache` control?](020-fetch-request-options.md) | medium | 🟡 draft |
| 030 | [How do you stream a response body and show download progress?](030-streaming-bodies.md) | medium | 🟡 draft |
| 040 | [How do you send data reliably when the user leaves the page?](040-sending-data-on-exit.md) | medium | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- [Fetch — `fetch()` method](https://fetch.spec.whatwg.org/#fetch-method)
- [Fetch — `RequestInit`](https://fetch.spec.whatwg.org/#requestinit)
- [Fetch — Request mode](https://fetch.spec.whatwg.org/#concept-request-mode)
- [Streams Standard](https://streams.spec.whatwg.org/)
- [Beacon](https://w3c.github.io/beacon/)
