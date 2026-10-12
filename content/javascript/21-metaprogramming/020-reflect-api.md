---
title: "What is `Reflect` for?"
status: draft
difficulty: medium
frequency: 2
core: false
tags: [reflect, proxy, receiver, internal-methods, metaprogramming]
related:
  - javascript/metaprogramming/proxy-traps-invariants
  - javascript/prototypes/prototype-chain
  - javascript/objects-and-properties/getters-and-setters
  - javascript/this/call-apply-bind
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-reflect-object
  - https://tc39.es/ecma262/#sec-reflect.get
  - https://tc39.es/ecma262/#sec-reflect.set
  - https://tc39.es/ecma262/#sec-reflect.construct
  - https://tc39.es/ecma262/#sec-ordinaryget
  - https://tc39.es/ecma262/#sec-ordinarysetwithowndescriptor
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect
tldr: >
  `Reflect` has one function per Proxy trap, each calling the matching internal method directly. They are the default
  behavior a trap forwards to. `Reflect.get` and `Reflect.set` also take a `receiver`, the `this` for getters and
  setters, which is why a trap that ignores it breaks inheritance and accessors.
---

## Answer

`Reflect` is a plain namespace object (not callable, not a constructor) with 13 static methods, one for each essential internal method: `get`, `set`, `has`, `deleteProperty`, `getOwnPropertyDescriptor`, `defineProperty`, `ownKeys`, `getPrototypeOf`, `setPrototypeOf`, `isExtensible`, `preventExtensions`, `apply`, and `construct`. Their names match the Proxy traps, with the same parameters, so a trap can finish with `return Reflect.x(...args)` to do what the language would have done.

Why use it instead of `target[key]` or the `Object.*` functions:

- **`receiver`.** `Reflect.get(target, key, receiver)` and `Reflect.set(target, key, value, receiver)` pass the receiver to `[[Get]]` and `[[Set]]`. It becomes `this` for a getter or setter, and it is where `set` creates the data property. `target[key]` always uses `target`.
- **Boolean results.** `Reflect.defineProperty`, `deleteProperty`, `set`, `setPrototypeOf` and `preventExtensions` return `true` or `false` where `Object.defineProperty` and friends throw. That is exactly what a trap must return.
- **Functions, not syntax.** `in`, `delete`, `new` and spread-call become ordinary functions you can pass around. `Reflect.apply(fn, thisArg, args)` also works when `fn.apply` has been overwritten.
- **No coercion.** Passing a non-object as the target throws `TypeError`; `Object.getPrototypeOf(1)` quietly boxes it.
- **`Reflect.construct(target, args, newTarget)`** runs a constructor with a different `new.target`, which `new` cannot do.

A forwarding trap should pass its own `receiver` to `Reflect.get`/`Reflect.set`, and return the boolean.

## Example

```js
const user = {
  _name: 'Ada',
  get name() {
    return this._name;
  },
};

function track(target, forward) {
  const reads = [];
  const proxy = new Proxy(target, {
    get(t, key, receiver) {
      reads.push(key);
      return forward ? Reflect.get(t, key, receiver) : t[key];
    },
  });
  return { proxy, reads };
}

const naive = track(user, false);
naive.proxy.name;
console.log(naive.reads);
// → [ 'name' ]
const forwarding = track(user, true);
forwarding.proxy.name;
console.log(forwarding.reads);
// → [ 'name', '_name' ]
const child = Object.create(forwarding.proxy);
child._name = 'Child';
console.log(child.name);
// → Child
```

With `t[key]` the getter runs with `this` set to the raw target, so the proxy never sees `_name`. With `receiver`, `this` is the proxy, and for an object inheriting from the proxy it is that object (`Child`; the naive trap would give `Ada`).

## Pitfalls

- Writing `t[key]` or `t[key] = value` in a trap. It works until a getter, a setter, or an inheriting object appears, and then `this` is wrong.
- Ignoring the return value of `Reflect.set`. A `set` trap must return a boolean, and in strict code `false` makes the assignment throw.
- Passing `target` as the receiver by hand. If you pass the target, `this` is the raw object and the setter writes there, skipping the proxy.
- Assuming `Reflect.*` and `Object.*` are interchangeable. The ones that overlap differ on errors (`Reflect` returns booleans where `Object` throws) and on coercion of primitives.

## Follow-ups

**Q:** Is `Reflect` required to use a Proxy?
**A:** No. It is the convenient default behavior. A trap can do anything, but must still satisfy the invariants.

**Q:** Why does `Reflect.ownKeys` differ from `Object.keys`?
**A:** `Reflect.ownKeys` calls `[[OwnPropertyKeys]]` and returns every own key (strings and symbols, enumerable or not). `Object.keys` filters to enumerable strings.

**Q:** What is `receiver` when I just write `obj.x`?
**A:** `obj`. Through the prototype chain it stays the original object, not the prototype that holds the property.

## Deep dive

### How it works

`Reflect.get(target, key, receiver)` throws `TypeError` unless `target` is an object, converts `key` with `ToPropertyKey`, defaults `receiver` to `target`, and returns `target.[[Get]](key, receiver)`. For an ordinary object, `OrdinaryGet` finds the descriptor; for an accessor it calls the getter with `receiver` as `this`, and if the property is missing it forwards to the prototype's `[[Get]]` with the same receiver. That is why a receiver set at the start of a lookup survives the whole prototype chain.

`[[Set]]` is where receiver matters most. `OrdinarySetWithOwnDescriptor` finds the property on the target or its prototypes. For a data property it then looks at the receiver: if the receiver has no such property, it calls `CreateDataProperty(receiver, key, value)`, and if it has one, `receiver.[[DefineOwnProperty]]`. The write lands on the receiver, not on the object that held the property. An accessor calls its setter with `this` = receiver.

```js
const target = {};
const receiver = {};
console.log(Reflect.set(target, 'k', 1, receiver), target.k, receiver.k);
// → true undefined 1
```

This also explains a common detail: when a proxy's `set` trap forwards with the original receiver, and the receiver is the proxy itself, `OrdinarySet` calls the proxy's `[[GetOwnProperty]]` and `[[DefineOwnProperty]]`. In Node.js 24, `proxy.a = 5` logs `set`, `getOwnPropertyDescriptor`, `defineProperty` if all three traps are instrumented.

### Edge cases

Overlap with `Object.*`: the booleans versus exceptions, and coercion:

```js
const frozen = Object.freeze({ a: 1 });
console.log(Reflect.defineProperty(frozen, 'b', { value: 1 }));
// → false
try {
  Object.defineProperty(frozen, 'b', { value: 1 });
} catch (e) {
  console.log(e.constructor.name);
}
// → TypeError
try {
  Reflect.getPrototypeOf(1);
} catch (e) {
  console.log(e.constructor.name);
}
// → TypeError
console.log(Object.getPrototypeOf(1) === Number.prototype);
// → true
```

`Reflect.construct` changes `new.target`, and so which prototype the instance gets:

```js
class A { constructor() { this.kind = new.target.name; } }
class B {}
const o = Reflect.construct(A, [], B);
console.log(o.kind, o instanceof B, o instanceof A);
// → B true false
```

`Reflect.apply` ignores an overwritten `fn.apply`: with `fn.apply = () => 'hacked'`, `fn.apply()` gives `'hacked'` and `Reflect.apply(fn, null, [])` calls the function. `Reflect.ownKeys({ b: 1, [Symbol('s')]: 2, 1: 0 })` is `[ '1', 'b', Symbol(s) ]`: integer keys ascending, then strings, then symbols, each in creation order.

### Trade-offs

Using `Reflect` costs one more call per trap, small next to the trap itself. The benefit is behaviour that matches the language in the cases you didn't think of. For a trap you intend to fully replace (a `get` that never reads the target), `Reflect` adds nothing. Outside proxies, prefer `Object.*` and syntax; reach for `Reflect` when you need the boolean result, a receiver, or `new.target`.

## Exercises

### Receiver of a setter

```js
const withSetter = {
  set v(x) {
    this._v = x;
  },
};
const other = {};
Reflect.set(withSetter, 'v', 9, other);
console.log(other._v, withSetter._v);
```

**Answer:** `9 undefined`. The setter runs with `this` = `other`, so it writes there.

### Fix the trap

```js
const handler = {
  set(t, key, value) {
    t[key] = value;
  },
};
const p = new Proxy({}, handler);
p.x = 1;
```

**Answer:** In a module (strict mode) this throws `TypeError`: the trap returns `undefined`, which counts as `false`. Write `return Reflect.set(t, key, value, receiver)` with `receiver` as the fourth trap parameter.
