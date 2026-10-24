---
title: "Why shouldn't you use `Math.random` for tokens or IDs?"
status: draft
difficulty: easy
frequency: 3
core: false
tags: [math-random, randomness, security, web-crypto, uuid]
related:
  - javascript/numbers-and-bigint/floating-point-precision
  - javascript/numbers-and-bigint/bitwise-and-int32
  - javascript/how-javascript-runs/ecmascript-engine-host
verified: 2026-10
perishable:
  - V8 implements Math.random with xorshift128+
sources:
  - https://tc39.es/ecma262/#sec-math.random
  - https://v8.dev/blog/math-random
  - https://chromium.googlesource.com/v8/v8/+/main/src/numbers/math-random.cc
  - https://w3c.github.io/webcrypto/#Crypto-method-getRandomValues
  - https://w3c.github.io/webcrypto/#Crypto-method-randomUUID
  - https://nodejs.org/docs/latest-v24.x/api/crypto.html#cryptorandomintmin-max-callback
  - https://nodejs.org/docs/latest-v24.x/api/crypto.html#cryptorandomuuidoptions
  - https://www.rfc-editor.org/rfc/rfc9562#section-5.4
tldr: >
  The spec only asks `Math.random` for an approximately uniform number in [0, 1) from an
  implementation-defined algorithm; it promises nothing about unpredictability. Engines use fast
  non-cryptographic generators (V8: xorshift128+), whose output can be predicted from earlier
  values. For tokens, IDs and secrets use `crypto.getRandomValues` or `crypto.randomUUID`.
---

## Answer

Because `Math.random` is built to be **fast and statistically uniform, not unpredictable**.

The spec's whole requirement is a Number in [0, 1), "chosen randomly or pseudo randomly with approximately uniform distribution", using an implementation-defined algorithm, plus distinct sequences for distinct realms. It says nothing about seeding quality or predictability, so no security property can be relied on.

In practice engines use a small, fast pseudo-random generator. In V8 it's xorshift128+ (since V8 4.9, Chrome 49): 128 bits of state that pass statistical tests, but the V8 team states it "is still not cryptographically secure". Its output is a deterministic function of a small internal state, and it isn't designed to stop someone who has seen earlier outputs from working out that state and the values that follow. In V8 you can even see the determinism directly: the `--random-seed` flag fixes the seed and replays the same sequence.

That matters wherever a value must be unguessable: session IDs, password-reset and CSRF tokens, invite codes, API keys, one-time codes, nonces. Use a **CSPRNG** (cryptographically secure pseudo-random number generator) instead:

- `crypto.getRandomValues(typedArray)` from the Web Crypto API fills an integer typed array (up to 65,536 bytes) with cryptographically strong values. It works in browsers, workers and Node.js.
- `crypto.randomUUID()` returns a random version 4 UUID. In browsers it's limited to secure contexts (HTTPS).
- In Node.js, `crypto.randomInt(min, max)` returns an integer in [min, max) without modulo bias, and `crypto.randomBytes` returns a `Buffer`.

`Math.random` remains fine for things that aren't secrets: shuffling a demo playlist, jitter in retry back-off, sampling, games without stakes.

## Example

```js
import { execFileSync } from 'node:child_process';

// Node.js 24 (V8): a fixed seed replays the exact same "random" numbers.
const run = () =>
  execFileSync(process.execPath, ['--random-seed=42', '-p', 'Math.random()']).toString();
console.log(run() === run()); // → true

// Unguessable values come from the CSPRNG.
const id = crypto.randomUUID();
console.log(id.length, id[14]); // → 36 4

const bytes = crypto.getRandomValues(new Uint8Array(32)); // 256 bits
const token = Buffer.from(bytes).toString('base64url'); // Buffer: Node.js only
console.log(token.length); // → 43

try {
  crypto.getRandomValues(new Uint8Array(65537));
} catch (error) {
  console.log(error.name); // → QuotaExceededError
}
```

## Pitfalls

- Building IDs as `Math.random().toString(36).slice(2)`. However long the string looks, it's derived from a predictable generator.
- Mapping random bytes to a range with `%`. `byte % 6` over 256 values is biased toward the low results; use `crypto.randomInt` or reject values above the largest multiple of the range.
- Assuming a UUID is a secret just because it's random. A v4 UUID has 122 random bits, enough to be unguessable, but it's often logged or exposed in URLs; treat tokens as credentials.
- Calling `crypto.randomUUID()` on a plain-HTTP page. It's marked `[SecureContext]`, so the method doesn't exist there; `getRandomValues` isn't restricted.

## Follow-ups

**Q:** Isn't xorshift128+ "good randomness"?
**A:** Statistically, yes: V8 chose it because it passes the TestU01 suite, which the older MWC1616 failed. Statistical quality and unpredictability are different properties; a CSPRNG must also resist an attacker who has seen previous outputs.

**Q:** Is `crypto.getRandomValues` slower?
**A:** Per call, yes: the V8 team describes it as cryptographically secure "at a performance cost". For tokens that cost is negligible, since you generate a few bytes per request, not millions of floats in a loop.

**Q:** Can you seed `Math.random` for reproducible tests?
**A:** Not from JavaScript; the language has no seeding API. In V8 the `--random-seed` flag does it for the whole process. For reproducible tests, use a small seeded PRNG you control and inject it.

## Exercises

### Spot the bias

```js
const roll = () => (crypto.getRandomValues(new Uint8Array(1))[0] % 6) + 1;
```

**Answer:** It's a secure source with a biased mapping. A byte has 256 values and 256 = 6 × 42 + 4, so faces 1–4 each get 43 of the 256 byte values and faces 5–6 get 42. Use `crypto.randomInt(1, 7)` in Node.js, or discard bytes ≥ 252 and draw again.
