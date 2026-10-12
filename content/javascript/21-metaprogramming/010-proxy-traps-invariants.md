---
title: "What can a Proxy intercept, and what are its invariants?"
status: draft
difficulty: hard
frequency: 3
core: true
tags: [proxy, traps, invariants, internal-methods, reactivity, metaprogramming]
related:
  - javascript/objects-and-properties/property-descriptors
  - javascript/objects-and-properties/freeze-seal-preventextensions
  - javascript/metaprogramming/reflect-api
  - javascript/metaprogramming/exotic-objects
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-proxy-object-internal-methods-and-internal-slots
  - https://tc39.es/ecma262/#sec-proxycreate
  - https://tc39.es/ecma262/#sec-proxy.revocable
  - https://tc39.es/ecma262/#sec-invariants-of-the-essential-internal-methods
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
tldr: >
  A Proxy wraps a target and a handler. Each of the 13 essential internal methods (`[[Get]]`, `[[Set]]`,
  `[[HasProperty]]`, `[[OwnPropertyKeys]]`, `[[Call]]`, …) has a matching trap that can replace it. After a trap
  returns, the engine checks invariants against the target and throws `TypeError` if the trap lies about
  non-configurable or non-extensible state.
---

## Answer

A `Proxy` is an exotic object with slots `[[ProxyTarget]]` and `[[ProxyHandler]]`. Each essential internal method has a **trap**, a handler method that replaces it. If the handler lacks the trap, the operation goes to the target unchanged.

| Internal method | Trap |
|---|---|
| `[[Get]]` / `[[Set]]` | `get` / `set` |
| `[[HasProperty]]` | `has` (the `in` operator) |
| `[[Delete]]` | `deleteProperty` |
| `[[GetOwnProperty]]` / `[[DefineOwnProperty]]` | `getOwnPropertyDescriptor` / `defineProperty` |
| `[[OwnPropertyKeys]]` | `ownKeys` |
| `[[GetPrototypeOf]]` / `[[SetPrototypeOf]]` | `getPrototypeOf` / `setPrototypeOf` |
| `[[IsExtensible]]` / `[[PreventExtensions]]` | `isExtensible` / `preventExtensions` |
| `[[Call]]` / `[[Construct]]` | `apply` / `construct` (only if the target is callable / a constructor) |

One syntax can trigger several traps: `Object.keys(proxy)` calls `ownKeys`, then `getOwnPropertyDescriptor` per key.

**Invariants.** After a trap returns, the Proxy checks the result against the target and throws `TypeError` on a contradiction. Examples:

- `get` must return the real value for a non-writable, non-configurable data property.
- `has`, `deleteProperty` and `getOwnPropertyDescriptor` cannot hide a non-configurable property, or any property of a non-extensible target.
- `ownKeys` must include every non-configurable key, and for a non-extensible target must list exactly the target's keys, with no duplicates.
- `construct` must return an object.

A frozen target is the one state a trap cannot override.

**`Proxy.revocable(target, handler)`** returns `{ proxy, revoke }`. After `revoke()` every operation on the proxy throws `TypeError`, so you can hand out access and take it back.

Limits: a proxy is a different object from its target (`proxy !== target`), and it has none of the target's internal slots, so built-ins such as `Map` and `Date`, and classes with `#private` fields, fail when `this` is the proxy.

## Example

```js
const target = {};
Object.defineProperty(target, 'id', { value: 1 });
target.name = 'Ada';

const log = [];
const proxy = new Proxy(target, {
  get(t, key, receiver) {
    log.push(`get ${String(key)}`);
    return Reflect.get(t, key, receiver);
  },
  has(t, key) {
    log.push(`has ${String(key)}`);
    return Reflect.has(t, key);
  },
});
proxy.name;
'name' in proxy;
console.log(log);
// → [ 'get name', 'has name' ]

const liar = new Proxy(target, { get: () => 2 });
console.log(liar.name);
// → 2
try {
  liar.id;
} catch (e) {
  console.log(e.constructor.name);
}
// → TypeError
```

`id` is non-writable and non-configurable, so `get` cannot report a different value. `name` is an ordinary property, so the lie goes through.

## Pitfalls

- Returning `false` from `set` or `deleteProperty`. In strict code (modules, classes) the assignment or `delete` then throws a `TypeError`; return `true` after a successful write.
- Forgetting that a proxy is not its target. `proxy === target` is `false`, a `WeakSet` holding the target does not recognise the proxy, and a `Map` or `Date` target throws when called through the proxy.
- Reactivity that only watches the top level. A `set` trap on the outer object does not see `state.nested.n = 2`; nested objects need their own proxy, usually created lazily in `get`.
- Using a Proxy on a hot path without measuring. Every operation becomes a call into JavaScript.

## Follow-ups

**Q:** Why does `new Proxy(new Map(), {}).set(1, 2)` throw?
**A:** `Map.prototype.set` needs the `[[MapData]]` slot on `this`. `this` is the proxy, which has only `[[ProxyTarget]]` and `[[ProxyHandler]]`. Binding the method to the target in `get` fixes it.

**Q:** Can a Proxy intercept `typeof` or `===`?
**A:** No. They don't use an internal method that has a trap. `typeof` depends only on whether the target was callable when the proxy was created.

**Q:** How is `Proxy` different from `Object.defineProperty` getters?
**A:** Getters and setters cover properties you define in advance. A Proxy sees every key, including missing ones, `in`, `delete` and enumeration.

## Deep dive

### How it works

`ProxyCreate(target, handler)` throws unless both are objects. It builds an object whose essential internal methods are the Proxy versions, and adds `[[Call]]` only if the target is callable and `[[Construct]]` only if it is a constructor. That decision is fixed at creation: it is why `typeof` of a proxy never changes.

Each proxy method follows the same shape: throw if revoked, read the trap with `GetMethod(handler, name)`, forward to the target if the trap is `undefined`, otherwise call the trap with the target as the first argument, then validate the result. The `[[Get]]` check, for example, reads the target's own descriptor for the key. If it is a non-configurable, non-writable data property and the trap's value is not `SameValue` to it, it throws. If it is a non-configurable accessor with an `undefined` getter, the trap must return `undefined`.

The same pattern covers the rest. `[[Set]]` rejects a different value for a frozen property. `[[HasProperty]]` and `[[Delete]]` refuse to hide a non-configurable property, or any property on a non-extensible target. `[[GetPrototypeOf]]` must return the target's prototype when the target is non-extensible. `[[IsExtensible]]` must agree with the target, and `[[PreventExtensions]]` may return `true` only if the target really is non-extensible. `[[OwnPropertyKeys]]` and `[[GetOwnProperty]]` have the strictest checks, listed in the answer.

### Edge cases

Invariants are checked after the trap, against the target at that moment. These are all caught `TypeError`s from Node.js 24:

```js
const frozen = Object.freeze({ a: 1 });
const attempts = {
  ownKeys: () => new Proxy(frozen, { ownKeys: () => [] }),
  has: () => new Proxy(frozen, { has: () => false }),
  set: () => new Proxy({}, { set: () => false }),
  construct: () => new Proxy(function () {}, { construct: () => 1 }),
};
for (const [name, make] of Object.entries(attempts)) {
  const p = make();
  try {
    if (name === 'ownKeys') Object.keys(p);
    if (name === 'has') 'a' in p;
    if (name === 'set') p.x = 1;
    if (name === 'construct') new p();
  } catch (e) {
    console.log(name, e.constructor.name);
  }
}
// → ownKeys TypeError
// → has TypeError
// → set TypeError
// → construct TypeError
```

The `set` case is not an invariant but the strict-mode rule: `[[Set]]` returning `false` makes the assignment operator throw. `Reflect.set(p, 'x', 1)` returns `false` instead. `new p()` fails because the `construct` trap returned `1`, not an object.

Revocation: `const { proxy, revoke } = Proxy.revocable({ a: 1 }, {})`. After `revoke()`, `proxy.a` throws `TypeError` ("Cannot perform 'get' on a proxy that has been revoked" in V8), while `typeof proxy` still works. Calling `revoke()` again is a no-op. This is how you give a plugin temporary access, or drop references so the target can be collected.

Slots: a proxy forwards property reads, but a built-in method reads internal slots from `this` directly. `new Proxy(new Date(0), {}).getTime()` throws "this is not a Date object." in V8. A class getter reading `#x` through a proxy throws, because a private name is looked up on the object itself, not through any trap. Binding methods to the target works for built-ins, and breaks identity for callers who expect `this` to be the proxy.

### Real-world scenario

Reactive state is the usual interview scenario: a `set` trap notices writes and triggers updates. A minimal version:

```js
function reactive(target, onChange) {
  return new Proxy(target, {
    set(t, key, value, receiver) {
      const old = t[key];
      const ok = Reflect.set(t, key, value, receiver);
      if (ok && !Object.is(old, value)) onChange(key);
      return ok;
    },
  });
}
const state = reactive({ count: 0, nested: { n: 1 } }, (key) => console.log('changed', key));
state.count++;
state.nested.n = 2;
// → changed count
```

Note the second assignment prints nothing: `nested` is the raw inner object. Forwarding with `Reflect.set(…, receiver)` and returning its boolean keeps the semantics of inheritance and non-writable properties (see the `Reflect` question). Validation, default values, negative array indexes, and logging proxies for tests follow the same shape.

### Trade-offs

Proxies give full interception without changing the object's callers, but each intercepted operation runs JavaScript, and engines can't optimise property access through a proxy the way they do for plain objects. I measured 20 million `o.n` reads in Node.js 24.19: about 10–75 ms on a plain object, about 200 ms through an empty-handler proxy, and about 460 ms through a `get` trap forwarding to `Reflect.get`. Those numbers are one machine and one microbenchmark; the ratio is the point, so measure your own workload before deciding.

Proxies are also invisible to `===`, `WeakMap` keys, `structuredClone` (which throws `DataCloneError` on a proxy in Node.js 24) and slot-based built-ins. Reach for getters, `Object.defineProperty`, or an explicit wrapper class when you only need to observe known keys. Use a Proxy when you need every key, `in`, `delete`, enumeration, or call interception.

## Exercises

### Which traps fire?

```js
const log = [];
const handler = new Proxy({}, {
  get: (_, trap) => (...args) => (log.push(trap), Reflect[trap](...args)),
});
const p = new Proxy({ a: 1, b: 2 }, handler);
Object.keys(p);
console.log(log);
```

**Answer:** `[ 'ownKeys', 'getOwnPropertyDescriptor', 'getOwnPropertyDescriptor' ]`. `Object.keys` lists own keys, then checks `enumerable` on each through its descriptor. Here the handler is itself a proxy whose `get` supplies a logging trap for every operation.

### Hide private keys

```js
const hidden = new Proxy({ a: 1, _b: 2 }, {
  ownKeys: (t) => Reflect.ownKeys(t).filter((k) => !k.startsWith('_')),
});
console.log(Object.keys(hidden), JSON.stringify(hidden));
```

**Answer:** `[ 'a' ] {"a":1}`. This works because the target is extensible and `_b` is configurable, so the invariants allow omitting it. On a frozen target the same trap would throw. Note `hidden._b` and `'_b' in hidden` still work: they need their own traps.
