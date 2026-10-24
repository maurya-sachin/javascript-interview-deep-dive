---
title: "How do private fields (`#x`) work?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [class, private-fields, private-names, brand-check, encapsulation, proxy]
related:
  - javascript/closures/private-state
  - javascript/classes/classes-vs-prototypes
  - javascript/classes/fields-vs-methods
  - javascript/metaprogramming/proxy-traps-invariants
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-private-names
  - https://tc39.es/ecma262/#sec-privateelement-specification-type
  - https://tc39.es/ecma262/#sec-privatefieldadd
  - https://tc39.es/ecma262/#sec-privateget
  - https://tc39.es/ecma262/#sec-privateset
  - https://tc39.es/ecma262/#sec-privatemethodoraccessoradd
  - https://tc39.es/ecma262/#sec-runtime-semantics-classdefinitionevaluation
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_elements
tldr: >
  `#name` declares a private element: a field, method, or accessor keyed by a Private Name that
  exists only in the class body's scope. It isn't a property, so it's invisible to reflection,
  `Object.freeze`, and proxies. Access on an object that lacks it throws a `TypeError`;
  `#x in obj` is the brand check.
---

## Answer

A `#name` declaration creates a **Private Name**: a unique key created each time the class is evaluated and visible only inside the class body. Fields, methods, accessors and their `static` forms can all be private. Each object stores its private elements in a separate `[[PrivateElements]]` list, not among its properties.

What follows from that:

- **Real encapsulation.** Outside the class, `obj.#x` is a `SyntaxError` at parse time, and `obj['#x']` is just an ordinary string key. `delete obj.#x` is a `SyntaxError` even inside the class.
- **Invisible to reflection.** `Object.keys`, `Reflect.ownKeys`, `JSON.stringify`, and `structuredClone` don't see them.
- **Not properties, so no property machinery.** `Object.freeze` doesn't stop writes to private fields. Proxies can't intercept them: `new Proxy(obj, {}).#x` looks the Private Name up on the proxy object itself, which has none, so it throws a `TypeError`.
- **Own-object only.** Lookup doesn't walk the prototype chain. A subclass can't touch a parent's `#x` directly, though inherited methods that use it keep working on subclass instances, because the parent constructor installed it on `this`.
- **Brand checks.** Reading a missing private element throws a `TypeError`. `#x in obj` returns a boolean instead, which is the safe "is this really one of ours?" test (it throws for non-objects).
- **Private methods are shared**, not copied per instance: each object's list holds the same function, and the spec notes engines may track this as a per-class brand.

Compared with alternatives: `_name` is a convention anyone can bypass, a `Symbol` key is still discoverable via `getOwnPropertySymbols`, and closures give true privacy but allocate per-instance functions and can't be shared with prototype methods.

## Example

```js
class Account {
  #balance = 0;
  static #count = 0;

  constructor(initial) {
    this.#balance = initial;
    Account.#count++;
  }
  #audit() { return `balance=${this.#balance}`; }
  get balance() { return this.#balance; }
  deposit(n) { this.#balance += n; return this.#audit(); }
  static isAccount(v) { return typeof v === 'object' && v !== null && #balance in v; }
  static get count() { return Account.#count; }
}
const acct = new Account(10);
console.log(acct.deposit(5)); // → balance=15
console.log(Object.keys(acct), Reflect.ownKeys(acct), JSON.stringify(acct)); // → [] [] {}
console.log(Account.isAccount(acct), Account.isAccount({ balance: 1 })); // → true false
console.log(Account.count); // → 1

const wrapped = new Proxy(acct, {});
try { wrapped.balance; } catch (e) { console.log(e.name); } // → TypeError
Object.freeze(acct);
acct.deposit(5); // frozen objects can still change private state
console.log(acct.balance); // → 20
```

## Pitfalls

- Calling a method with the wrong receiver, such as a detached method or `Account.prototype.deposit.call({})`. The private lookup fails with a `TypeError`.
- Putting an instance with private fields behind a `Proxy` and calling its methods. `this` is the proxy, so every private access throws. Bind methods to the target, or avoid proxying such objects.
- Treating `#x` as a string key: `this['#x']` is an unrelated public property.
- Expecting subclasses to see a parent's private names. Each `#name` belongs to the class that wrote it; two classes can each have a `#x` without conflict.

## Follow-ups

**Q:** Does each class evaluation create new private names?
**A:** Yes. `ClassDefinitionEvaluation` makes a fresh Private Name per `#name` every time it runs, so a factory that returns a class expression gives each result its own names, and `#x in obj` is false across them.

**Q:** Private fields or `WeakMap` for privacy?
**A:** Private fields. They are simpler, checked by the engine, and give you brand checks. A `WeakMap` is only needed for targets that predate private names.

**Q:** Can a field be added twice to the same object?
**A:** No. `PrivateFieldAdd` throws a `TypeError` if the object already has that name. This can happen when a base constructor returns an existing object and the same derived class is constructed over it twice.

## Exercises

### Predict the output

```js
class Counter {
  #n = 0;
  static peek(o) { return #n in o ? o.#n : 'not a Counter'; }
}
const make = () => class { #x = 1; static has(o) { return #x in o; } };
const K1 = make(), K2 = make();
console.log(K1.has(new K1()), K2.has(new K1()));
console.log(Counter.peek(new Counter()), Counter.peek({}));
class Account {
  #balance = 0;
  get balance() { return this.#balance; }
}
class Savings extends Account { get doubled() { return this.balance * 2; } }
console.log(new Savings().doubled);
```

**Answer:** `true false`, then `0 not a Counter`, then `0`. Each `make()` call evaluates the class again, so `K2`'s `#x` is a different Private Name. `#n in o` is the brand check. The inherited getter works on `Savings` instances because `Account`'s constructor installed `#balance` on `this`.
