---
title: "Implement `memoize`. What makes the cache key hard?"
status: draft
difficulty: medium
frequency: 4
core: true
tags: [closures, memoization, caching, map, weakmap, pure-functions]
related:
  - javascript/closures/what-is-a-closure
  - javascript/functions/pure-functions
  - javascript/closures/closure-memory
  - javascript/keyed-collections/map-vs-object
  - javascript/keyed-collections/weakmap-weakset
  - javascript/keyed-collections/lru-cache-with-map
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-map.prototype.set
  - https://tc39.es/ecma262/#sec-canonicalizekeyedcollectionkey
  - https://tc39.es/ecma262/#sec-samevaluezero
  - https://tc39.es/ecma262/#sec-json.stringify
  - https://tc39.es/ecma262/#sec-serializejsonproperty
  - https://tc39.es/ecma262/#sec-weakmap-objects
  - https://react.dev/reference/react/useMemo
  - https://lodash.com/docs/4.17.15#memoize
tldr: >
  `memoize(fn)` returns a wrapper that keeps a `Map` in its closure: on a hit it returns the stored
  result, on a miss it calls `fn`, stores, and returns. One primitive argument is an easy key.
  Several arguments or objects aren't: `JSON.stringify` and `join` collide, and identity keys miss
  mutations. Only memoize pure functions, and bound the cache.
---

## Answer

Memoization caches a function's results by its inputs, so repeated calls with the same arguments skip the work. `memoize(fn)` creates a `Map` and returns a wrapper that closes over it: if `cache.has(arg)`, return `cache.get(arg)`; otherwise call `fn`, store the result, and return it. Each memoized function gets its own private cache.

Three details interviewers check: use `has`, not a truthiness test, so cached `0`, `''` or `undefined` count as hits; forward `this` with `call`; and use a `Map`, not an object, so keys aren't converted to strings (`1` and `'1'` stay distinct).

The hard part is the **key**:

- **One primitive argument.** `Map` compares with SameValueZero, so `NaN` finds `NaN`. But `Map` also canonicalises `-0` to `+0`, so a function that distinguishes them returns the wrong cached value.
- **Several arguments.** `JSON.stringify(args)` is the common shortcut and it's lossy: `undefined`, `NaN` and functions all become `null`, a `Map` becomes `{}`, a `Date` becomes the same string as its ISO text, BigInt throws, and two equal objects with different key order give different keys. `args.join(',')` makes `(1, 2)` and `('1,2')` collide. A collision-free option is a nested `Map` per argument position.
- **Object arguments.** Keying by identity is fast but misses mutation: change the object and you get a stale result. Keying by structure costs a deep serialisation per call. Pick deliberately; immutable data makes identity keys correct.

Two rules sit around all of this. Only memoize **pure** functions — anything reading time, randomness or mutable state returns stale data. And **bound the cache**: an unbounded `Map` grows forever, so use an LRU, a TTL, or a `WeakMap` when keys are objects.

## Example

```js
function memoize(fn) {
  const cache = new Map(); // one per memoized function, kept alive by the closure
  return function (arg) {
    if (cache.has(arg)) return cache.get(arg);
    const result = fn.call(this, arg);
    cache.set(arg, result);
    return result;
  };
}

let runs = 0;
const square = memoize((n) => { runs++; return n * n; });
console.log(square(4), square(4), runs); // → 16 16 1

// Recursion must call the memoized wrapper, not the raw function
const fib = memoize((n) => (n < 2 ? n : fib(n - 1) + fib(n - 2)));
console.log(fib(50)); // → 12586269025

// Map treats -0 and +0 as one key
const inverse = memoize((x) => 1 / x);
console.log(inverse(0), inverse(-0)); // → Infinity Infinity

// JSON keys collide
const key = (...args) => JSON.stringify(args);
console.log(key(undefined) === key(null), key(NaN) === key(null)); // → true true
```

## Pitfalls

- Testing `if (cache.get(arg))` instead of `cache.has(arg)`. Falsy results like `0` are recomputed on every call.
- Memoizing a function that depends on time, randomness, or outer mutable state. The cache returns yesterday's answer.
- Keying multi-argument calls with `JSON.stringify` or `join`, then debugging "random" wrong results from collisions.
- Leaving the cache unbounded in a long-lived process. Every distinct input is retained for the life of the wrapper.

## Follow-ups

**Q:** How does lodash's `_.memoize` choose the key?
**A:** By default it uses only the first argument, so `f(1, 2)` and `f(1, 3)` share an entry. Pass a resolver function to build the key from all arguments. The cache is exposed as `memoized.cache`, so you can clear or replace it.

**Q:** How is React's `useMemo` different?
**A:** It's per component instance and keeps only the latest value. On each render React compares each dependency with its previous value using `Object.is`; if none changed, it returns the stored value, otherwise it recomputes. It's a render optimisation, not a general cache.

**Q:** When is memoization a bad trade?
**A:** When the function is cheaper than building and looking up the key, when inputs rarely repeat, or when results are large. You pay memory for every entry and time for every key, hit or miss.

## Deep dive

### How it works

The wrapper is an ordinary closure: `cache` is a binding in the call environment of `memoize`, and the returned function's `[[Environment]]` keeps that environment — and every cached value in it — alive for as long as the wrapper is reachable. Each `memoize(fn)` call creates a separate cache. Drop the wrapper and the whole cache becomes collectable.

For several arguments, a trie of `Map`s avoids string keys entirely. Each argument selects a child map, and a private symbol marks the stored result at the end of the path:

```js
function memoizeArgs(fn) {
  const root = new Map();
  const RESULT = Symbol('result'); // can't collide with any argument
  return function (...args) {
    let node = root;
    for (const arg of args) {
      if (!node.has(arg)) node.set(arg, new Map());
      node = node.get(arg);
    }
    if (!node.has(RESULT)) node.set(RESULT, fn.apply(this, args));
    return node.get(RESULT);
  };
}

let calls = 0;
const area = memoizeArgs((w, h) => { calls++; return w * h; });
console.log(area(2, 3), area(2, 3), area('2', 3), calls); // → 6 6 6 2
```

Keys keep their type and identity, objects work as keys, and `f(1)` and `f(1, undefined)` are separate entries, which matters if `fn` reads `arguments.length`. To stop object arguments from being retained, use a `WeakMap` for object keys and a `Map` for primitives at each level; a `WeakMap` can't hold primitives, so neither alone is enough.

### Edge cases

- **`-0`.** `Map.prototype.set` runs `CanonicalizeKeyedCollectionKey`, which turns `-0` into `+0`. If `-0` matters, key it separately (`Object.is(arg, -0)`).
- **`this`.** Both wrappers forward `this` but don't key on it. Memoizing a method shared across instances returns one instance's answer to another; key on `this` first, or memoize per instance.
- **Identity keys and mutation.** With identity keys, `label(user)` after `user.id = 2` returns the old string. That's correct only if inputs are treated as immutable.
- **Exceptions.** If `fn` throws, nothing is stored, so the next call retries. That's usually what you want.

### Real-world scenario

Request deduplication is memoization of an async function. Cache the **promise**, not the resolved value, so concurrent callers share one request, and evict on rejection so one network blip isn't cached forever:

```js
function memoizeAsync(fn) {
  const cache = new Map();
  return (key) => {
    if (!cache.has(key)) {
      const promise = fn(key).catch((error) => {
        cache.delete(key); // don't cache failures
        throw error;
      });
      cache.set(key, promise);
    }
    return cache.get(key);
  };
}
```

Two `load(7)` calls made together trigger one request and both see the same result or rejection; a call after a rejection starts a fresh request. Production versions add a TTL so data can refresh.

### Trade-offs

Memoization trades memory for time, and the key is part of the cost. A primitive `Map` lookup is cheap; `JSON.stringify` on large objects can cost more than the function it protects. Bounded caches (LRU via `Map` insertion order, or a TTL) cap memory but add eviction logic. `WeakMap` caches free entries with their keys but only accept objects and can't be iterated or sized. If inputs rarely repeat, the hit rate is low and memoization only adds overhead — measure before adding it.

## Exercises

### Predict the output

```js
const memo = (fn) => {
  const cache = {};
  return (arg) => cache[arg] ?? (cache[arg] = fn(arg));
};
let calls = 0;
const describe = memo((x) => { calls++; return typeof x; });
console.log(describe(1), describe('1'), describe(null), describe('null'), calls);
```

**Answer:** `number number object object 2`. A plain object converts every key to a string, so `1` and `'1'` share the key `'1'`, and `null` and `'null'` share `'null'`. The second call in each pair returns the first type. Use a `Map` to keep keys distinct.
