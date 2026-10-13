---
title: "What is catastrophic backtracking?"
status: draft
difficulty: hard
frequency: 2
core: true
tags: [regexp, backtracking, redos, performance, security, v8, irregexp, re2]
related:
  - javascript/regular-expressions/named-groups-lookbehind
  - javascript/regular-expressions/regex-methods
  - javascript/regular-expressions/regex-flags
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-pattern-semantics
  - https://tc39.es/ecma262/#sec-compileassertion
  - https://v8.dev/blog/non-backtracking-regexp
  - https://v8.dev/blog/regexp-tier-up
  - https://nodejs.org/docs/latest-v24.x/api/vm.html
  - https://nodejs.org/docs/latest-v24.x/api/worker_threads.html
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions/Quantifiers
  - https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS
  - https://github.com/google/re2/wiki/Syntax
tldr: >
  A backtracking engine tries alternatives in order and retreats on failure. With nested or overlapping quantifiers such
  as `^(a+)+$`, a failing input has exponentially many ways to split, so each extra character doubles the time. On
  untrusted input that is ReDoS: one request can freeze the event loop. Fix the pattern, bound the input, or use a
  linear-time engine.
---

## Answer

JavaScript regexes are matched by **backtracking**: the engine tries the first choice (a quantifier's greedy count, the left alternative) and, if the rest of the pattern fails, returns to the last choice and tries the next. That is cheap when matches succeed. When the overall match **fails** and the pattern gives the engine many equivalent ways to consume the same text, it tries all of them. That is catastrophic backtracking.

Two shapes cause it:

- **Nested quantifiers over overlapping text**, such as `(a+)+`, `(\w+\s?)*`, `(.*)*`: the same run of characters can be split between iterations in exponentially many ways.
- **Overlapping alternatives under a quantifier**, such as `(a|a)+`, `(\d|\d\d)+`.

Quadratic cases are also real: `/\s+$/` on a long run of spaces followed by a non-space retries from every start position.

**ReDoS** (regular-expression denial of service) is an attacker choosing input that triggers this. Matching is synchronous, so in Node.js one request blocks the event loop; in the browser it freezes the tab.

Defences, from best to weakest:

1. **Rewrite so each character can be matched in only one way.** `^(a+)+$` is `^a+$`; `^(\w+\s?)*$` is `^(?:\w+\s)*\w*$`.
2. **Emulate an atomic group** with a lookahead and a backreference: `(?=(a+))\1`. JavaScript has no native atomic groups or possessive quantifiers, but lookarounds are atomic, so the engine cannot re-split what the lookahead captured.
3. **Bound the input length** before matching.
4. **Use a non-backtracking engine** for untrusted patterns or input: RE2 (npm `re2`), or V8's experimental linear engine.
5. **Isolate** the work in a worker thread or `vm` context with a timeout. This limits damage; it does not fix the pattern.

## Example

```js
const ms = (re, input) => {
  const start = performance.now();
  re.test(input);
  return Math.round(performance.now() - start);
};

const risky = /^(a+)+$/; // nested quantifier: many ways to split the a's
const safe = /^a+$/; // same language, one way to match
const atomic = /^(?:(?=(a+))\1)+$/; // lookahead + backreference: never re-split

risky.test('a'); // warm-up: the first run uses V8's regexp interpreter

for (const n of [20, 22, 24, 26]) {
  console.log(`risky n=${n}: ${ms(risky, 'a'.repeat(n) + '!')} ms`);
}
// → risky n=20: 7 ms
// → risky n=22: 27 ms
// → risky n=24: 106 ms
// → risky n=26: 426 ms  (one machine; each +2 chars is about x4)

const big = 'a'.repeat(1_000_000) + '!';
console.log(safe.test(big), ms(safe, big) < 50);
// → false true
console.log(atomic.test('aaa'), atomic.test('a'.repeat(100_000) + '!'));
// → true false
```

## Pitfalls

- Testing only with inputs that match. Backtracking blows up on **failure**, so test with a long near-miss, such as the valid prefix plus one bad character at the end.
- "Fixing" with `(a+?)+?` or `(a*)*`. Lazy quantifiers and `*` change the order of attempts, not the number of ways to split. At n = 22 I measured 21 ms for `^(a+?)+?$` and 54 ms for `^(a*)*$`, against 29 ms for `^(a+)+$`.
- Believing a length limit alone is safe. An input limit of a few hundred characters still lets `(a+)+` run for years (the cost doubles per character), so it must be paired with a fixed pattern.
- Counting on V8's fallback flag as a general fix. It skips patterns with backreferences or lookarounds, and with the `i` or `u` flag (I confirmed lookahead, `i` and `u` on Node.js 24), so the lookahead-based atomic idiom opts out of it.

## Follow-ups

**Q:** Why can't the engine just detect this?
**A:** JavaScript semantics (ordered alternatives, greedy and lazy choice, captures, backreferences, lookarounds) are defined as a backtracking search. Linear-time engines such as RE2 get their guarantee by dropping backreferences and lookarounds, so a general fix would change which patterns are legal.

**Q:** Does `y` or `^` protect me?
**A:** Anchors avoid retrying from every start position, which removes the quadratic case, but not the exponential one: `^(a+)+$` is anchored and still explodes.

**Q:** Is `(?>…)` available?
**A:** No. JavaScript has no atomic groups or possessive quantifiers. The lookahead-plus-backreference idiom is the standard emulation.

## Deep dive

### How it works

The specification defines matching as a chain of matchers that each call a *continuation* for "the rest of the pattern". A greedy `+` tries one more iteration first, and if the continuation returns *failure*, tries fewer. The first successful path wins, so results depend on the order of attempts, and a straightforward backtracking engine does not remember that a given suffix already failed at a given position.

For `/^(a+)+$/` on `'aaa!'`, the outer group can consume `aaa`, `aa|a`, `a|aa`, `a|a|a`, and so on: 2^(n-1) compositions, each ending in a failed `$`. V8's own write-up shows the same shape with `/(a*)*b/` and states that it "does not finish within our lifetimes" for 100 characters. My measurements on one machine (Node.js 24.19, V8 13.6, warm regex) were about 7, 27, 106 and 426 ms for n = 20, 22, 24, 26, and about 1.7 s for n = 28. At n = 26 the cold first call took about 2.2 s, because V8 first runs a regex in its bytecode interpreter and only recompiles to native code when it is reused (see the tier-up post). Absolute numbers will differ; the growth rate is the point.

### Edge cases

The overlapping-alternative and delimiter-optional forms behave the same. On the same machine, cold, with n = 26: `^(a|a)+$` took about 3.7 s, and `^(\w+\s?)*$` about 2.8 s. In contrast `^(a|aa)+$` took 15 ms at n = 26: the alternatives overlap but the failure is found in a Fibonacci number of steps, not 2^n, which is why you test rather than eyeball.

The quadratic case needs no nesting:

```js
const trailingSpaces = /\s+$/;
for (const n of [10_000, 20_000]) {
  const input = ' '.repeat(n) + 'x';
  const start = performance.now();
  trailingSpaces.test(input);
  console.log(n, Math.round(performance.now() - start), 'ms');
}
// → 10000 155 ms
// → 20000 621 ms
```

Doubling the input quadruples the time. To trim, use `String.prototype.trimEnd()`; it took 0.1 ms on a million-character string.

### Real-world scenario

Fix the pattern, then **prove the rewrite is equivalent** by brute force over a small alphabet, since the "obvious" rewrite is easy to get subtly wrong:

```js
const slow = /^(\w+\s?)*$/;
const fast = /^(?:\w+\s)*\w*$/;

let checked = 0;
const compare = (s) => {
  checked++;
  if (slow.test(s) !== fast.test(s)) throw new Error(`differs on ${JSON.stringify(s)}`);
  if (s.length < 8) for (const c of ['a', ' ', '!']) compare(s + c);
};
compare('');
console.log(checked);
// → 9841
```

When you cannot change the pattern (a user-supplied or third-party one), cap the damage. `vm` interrupts synchronous code, including a regex, when `timeout` expires; a worker can be killed from outside:

```js
import vm from 'node:vm';

try {
  vm.runInNewContext("/^(a+)+$/.test('a'.repeat(40) + '!')", {}, { timeout: 200 });
} catch (error) {
  console.log(error.code);
}
// → ERR_SCRIPT_EXECUTION_TIMEOUT
```

I confirmed that both `vm` with `timeout` and `worker.terminate()` stop this regex at about 200 ms. The `vm` module is not a security sandbox, and a worker adds startup and messaging cost, so reserve either for untrusted patterns.

### Trade-offs

| Option | Cost | Limit |
|---|---|---|
| Rewrite the pattern | Needs analysis and an equivalence test | Not possible for user-supplied patterns |
| Lookahead + backreference | Extra capture group, renumbering | Changes semantics: `/^(?=(a+))\1a$/.test('aaa')` is `false` while `/^a+a$/.test('aaa')` is `true`, because the engine cannot give back an `a` |
| Input length limit | One comparison | Only a bound; exponential growth makes any limit above a few dozen characters unsafe on its own |
| RE2 (`re2` on npm) | Native addon; different engine | Rejects backreferences and lookarounds (RE2 syntax lists them as unsupported) |
| V8 `--enable-experimental-regexp-engine-on-excessive-backtracks` | A process flag | Falls back after 50,000 backtracks (`--regexp-backtracks-before-fallback`), only for patterns without backreferences or lookarounds |
| V8 `l` flag (`--enable-experimental-regexp-engine`) | Non-standard flag, much slower on ordinary patterns | Throws on construction for patterns it cannot run in linear time |

With the fallback flag, `/^(a+)+$/` on 40 `a`s plus `!` returned in about a millisecond on my machine, while the same pattern with a lookahead added (`/^(?=)(a+)+$/`) or the `i` flag still took about 0.5 s at n = 24 because the fallback does not apply. V8's post calls the engine experimental and warns that Irregexp is far faster on most ordinary patterns. These are V8 flags and V8 behaviour, not part of ECMAScript, and other engines differ.

## Exercises

### Which of these is exponential?

```js
const a = /^(\d+,?)+$/;
const b = /^\d+(,\d+)*$/;
const input = '1'.repeat(24) + 'x';
console.log(a.test(input), b.test(input));
```

**Answer:** `false false`, but `a` is the dangerous one. In `a`, the comma is optional, so a run of digits can be split between iterations in 2^(n-1) ways, and the failing `x` forces all of them (about 110 ms warm at n = 24 on my machine, doubling per digit). `b` requires a comma between iterations, so each digit has exactly one place to go and it fails in linear time.
