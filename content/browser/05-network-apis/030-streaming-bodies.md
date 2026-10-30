---
title: "How do you stream a response body and show download progress?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [fetch, readable-stream, streams, text-decoder-stream, download-progress, request-streams]
related:
  - browser/network-apis/fetch-resolves-on-errors
  - browser/network-apis/fetch-request-options
  - browser/workers/structured-clone-and-transfer
  - javascript/async-and-the-event-loop/cancelling-async-work
verified: 2026-10
perishable:
  - "ReadableStream async iteration: Chrome 124, Firefox 110, Safari 27"
  - "Request body streams: Chrome 105+ only, Firefox and Safari none"
  - Chrome 156 rejects streaming uploads over HTTP/1.1
sources:
  - https://fetch.spec.whatwg.org/#dom-body-body
  - https://fetch.spec.whatwg.org/#body-unusable
  - https://fetch.spec.whatwg.org/#dom-requestinit-duplex
  - https://fetch.spec.whatwg.org/#concept-bodyinit-extract
  - https://streams.spec.whatwg.org/#rs-get-reader
  - https://streams.spec.whatwg.org/#default-reader-read
  - https://streams.spec.whatwg.org/#rs-asynciterator
  - https://streams.spec.whatwg.org/#rs-pipe-through
  - https://encoding.spec.whatwg.org/#interface-textdecoderstream
  - https://encoding.spec.whatwg.org/#dom-textdecodeoptions-stream
  - https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream#browser_compatibility
  - https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch#browser_compatibility
tldr: >
  `response.body` is a `ReadableStream` of `Uint8Array` chunks. Read it with `getReader()` and a
  `read()` loop, or `for await`. Decode text with `TextDecoderStream`, not per chunk. For progress, sum
  chunk sizes against `Content-Length`, which is missing with chunked encoding and is the compressed
  size under gzip, so percentages can be wrong.
---

## Answer

`response.body` is a `ReadableStream` of `Uint8Array` chunks, there as soon as `fetch()` fulfills, before the body has arrived. `res.json()` and `res.text()` wait for all of it; reading the stream yourself lets you handle bytes as they land.

Call `res.body.getReader()` and loop on `await reader.read()`, which resolves to `{ value, done }`. Or iterate with `for await (const chunk of res.body)`, supported since Chrome 124, Firefox 110 and Safari 27. Either way the stream is now **locked**: `res.json()` rejects with a `TypeError`. Breaking out of `for await` cancels the stream, as does `reader.cancel()`; aborting the fetch's signal errors it.

**Text.** Chunks can split anywhere, including inside a multi-byte UTF-8 character. Pipe through `new TextDecoderStream()`, or reuse one `TextDecoder` with `decode(chunk, { stream: true })`. Decoding each chunk separately turns a split `é` into two `�`. For line-based formats such as NDJSON, also buffer the unfinished last line.

**Progress.** Add up `chunk.byteLength` and divide by `Content-Length`. Two catches:

- With chunked transfer encoding there is no `Content-Length`, so show indeterminate progress.
- With `Content-Encoding: gzip` or `br`, the header is the compressed size while chunks arrive decompressed. A 100,000-byte body sent gzipped had a `Content-Length` of 132. Have the server send the uncompressed size in its own header, or show bytes rather than percent.

**Uploads.** A `ReadableStream` request body needs `duplex: 'half'`, and only Chrome supports it (105 and later); in Chrome 156 it also needed HTTP/2. Upload progress is the one thing `XMLHttpRequest`'s `upload` events still give you that `fetch()` doesn't, portably.

## Example

```js
async function download(url, onProgress) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const length = res.headers.get('Content-Length'); // null with chunked encoding
  const total = length === null ? null : Number(length);
  const reader = res.body.getReader();
  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read(); // value is a Uint8Array
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    onProgress(received, total);
  }
  return new Blob(chunks);
}

const percents = [];
await download('/sized', (received, total) => percents.push(Math.round((100 * received) / total)));
console.log(percents.at(-1));
// → 100

let last;
const blob = await download('/gzip', (received, total) => (last = `${received} of ${total}`));
console.log(last, blob.size);
// → 100000 of 132 100000
```

`/sized` sends 100,000 bytes in five pieces 150 ms apart; `/gzip` sends 100,000 `x` characters gzipped. Same output in Chrome 156 and Firefox 159 over 5 runs each; `onProgress` ran 5 or 6 times per `/sized` download, as chunk boundaries follow the network, not the server's writes.

## Pitfalls

- Calling `res.json()` after `getReader()`. The stream is locked, so it rejects with a `TypeError`; once you read the stream, you own the whole body.
- Decoding each chunk with a fresh `TextDecoder`, which corrupts characters split between chunks.
- Computing `received / total` when `Content-Length` is missing. `Number(null)` is `0`, so the bar shows `Infinity%`.
- Sending a `ReadableStream` body without checking support. Firefox 159 doesn't throw: it sends the string `[object ReadableStream]` as `text/plain`.

## Follow-ups

**Q:** How do you stop a download halfway?
**A:** `reader.cancel()` (later reads resolve `{ done: true }`) or break out of `for await`. Aborting the fetch's `AbortSignal` also works and makes the pending `read()` reject with an `AbortError`.

**Q:** How do you read a body twice, say for progress and for `.json()`?
**A:** `res.clone()` before reading, or `res.body.tee()`, which splits one stream into two. Both branches get every chunk, so chunks the slower branch hasn't read yet wait in its queue.

**Q:** Can a worker parse the stream instead?
**A:** Yes. `ReadableStream` is transferable: `worker.postMessage(stream, [stream])` hands it over (Chrome 87, Firefox 103, Safari 27).

## Deep dive

### Edge cases

The split-character problem, with a server that writes `caf` plus the first byte of `é`, waits 200 ms, then writes the second byte. Chrome 156 and Firefox 159 printed the same:

```js
const res = await fetch('/utf8-split');
const decoder = new TextDecoder();
let text = '';
for await (const chunk of res.body) text += decoder.decode(chunk, { stream: true });
text += decoder.decode(); // flush whatever is left
console.log(text);
// → café

const parts = [];
for await (const part of (await fetch('/utf8-split')).body.pipeThrough(new TextDecoderStream())) {
  parts.push(part);
}
console.log(JSON.stringify(parts));
// → ["caf","é"]
```

`TextDecoderStream` holds the incomplete byte back and emits `é` with the next chunk.

**Request streams.** The Fetch Standard requires `duplex: 'half'` for a stream body ("half" means the whole request is sent before the response is processed), forbids it in `no-cors` mode and with `keepalive`, and always preflights it cross-origin. In Chrome 156, a stream upload to `http://localhost` over HTTP/1.1 rejected with `TypeError: Failed to fetch` and the console showed `net::ERR_ALPN_NEGOTIATION_FAILED`; the same upload to an HTTP/2 server over TLS arrived in pieces, 300 ms apart, as the stream produced them. Firefox 159 sent `[object ReadableStream]`, 23 bytes. A feature test that works because unsupporting browsers ignore `duplex` and stringify the body:

```js
let duplexAccessed = false;
const hasContentType = new Request('/upload', {
  method: 'POST',
  body: new ReadableStream(),
  get duplex() { duplexAccessed = true; return 'half'; },
}).headers.has('Content-Type');
console.log(duplexAccessed && !hasContentType);
// → true
```

Chrome 156 printed `true`, Firefox 159 `false`.

## Exercises

### What does this log?

```js
// The server writes "caf" plus the first byte of "é", waits, then writes the second byte
const res = await fetch('/utf8-split');
const parts = [];
for await (const chunk of res.body) parts.push(new TextDecoder().decode(chunk));
console.log(JSON.stringify(parts));
```

**Answer:** `["caf�","�"]`. Each fresh decoder sees half a character and replaces it with U+FFFD.

### What does this log?

```js
const res = await fetch('/data.json'); // {"name":"Ada"}
const reader = res.body.getReader();
console.log(res.body.locked, res.bodyUsed);
try {
  await res.json();
} catch (error) {
  console.log(error.name);
}
```

**Answer:** `true false`, then `TypeError`. Getting a reader locks the stream without reading it, and a locked body can't be consumed.
