---
title: "How do getters and setters work?"
status: draft
difficulty: easy
frequency: 3
core: false
tags: [objects, getters, setters, accessor-properties]
related:
  - javascript/objects-and-properties/property-descriptors
  - javascript/objects-and-properties/shallow-vs-deep-copy
  - javascript/this/this-binding-rules
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-object-initializer
  - https://tc39.es/ecma262/#sec-runtime-semantics-methoddefinitionevaluation
  - https://tc39.es/ecma262/#sec-ordinaryget
  - https://tc39.es/ecma262/#sec-ordinarysetwithowndescriptor
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/set
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects#defining_getters_and_setters
tldr: >
  `get` and `set` define an accessor property: reading it calls the getter, assigning to it
  calls the setter, both with `this` set to the object the property was accessed on. There is
  no stored value. A getter-only property rejects writes (a `TypeError` in strict code); a
  setter-only property reads as `undefined`.
---

## Answer

`get name() {}` and `set name(value) {}` in an object literal or class body define an **accessor property**: a property whose attributes are `get`, `set`, `enumerable` and `configurable` instead of `value` and `writable`.

- **Read:** `[[Get]]` finds the accessor and calls the getter with the *receiver* (the object you read from) as `this`. No getter means `undefined`.
- **Write:** `[[Set]]` calls the setter with the new value. No setter means the write fails: silent in sloppy code, a `TypeError` in strict code.
- **No storage:** the accessor holds functions, not data. The value lives elsewhere: another property (conventionally `_x`), a closure, or a private field.

Because the receiver is `this`, an inherited accessor works on the child: `child.balance = 10` runs the setter with `this === child`, so the data lands on `child`.

**Where it shows up:**

- Validation or normalisation on write.
- Derived, read-only values (`fullName`, `area`).
- Lazy computation.
- Built-ins: `Map.prototype.size`, `RegExp.prototype.flags`, and `Object.prototype.__proto__` are getters.

**Details:**

- A literal's accessors are enumerable and configurable. Accessors in a `class` body live on the prototype and are non-enumerable, so they don't appear in `Object.keys` or `JSON.stringify` of an instance.
- Getter and setter functions get names like `get balance` and `set balance`.
- A getter that reads its own property name (`get v() { return this.v; }`) recurses until a `RangeError`.
- Spread and `Object.assign` read through the getter and store the plain value. They don't copy the accessor.
- `Object.defineProperty(o, 'k', { get() {…}, set(v) {…} })` creates the same thing programmatically.

## Example

```js
const account = {
  _balance: 100,
  get balance() {
    return this._balance;
  },
  set balance(value) {
    if (value < 0) throw new RangeError('Balance cannot be negative');
    this._balance = value;
  },
  get summary() {
    return `balance: ${this._balance}`;
  },
};

account.balance = 150;
console.log(account.balance, account.summary); // → 150 balance: 150

try {
  account.summary = 'x'; // getter only: the write is rejected
} catch (error) {
  console.log(error.name); // → TypeError
}

const copy = { ...account };
console.log(Object.getOwnPropertyDescriptor(copy, 'balance'));
// → { value: 150, writable: true, enumerable: true, configurable: true }

const child = Object.create(account); // `this` is the receiver, not the holder
child.balance = 10;
console.log(Object.hasOwn(child, '_balance'), account.balance); // → true 150
```

## Pitfalls

- Naming the backing field the same as the accessor. `this.balance = v` inside `set balance` calls itself forever.
- Expecting a getter-only property to throw in sloppy code. The assignment is silently ignored, so modules and classes (strict) reveal the bug while scripts hide it.
- Copying with spread and expecting live accessors. The copy has a snapshot, and calls the getter once.
- Heavy work in a getter that looks like a field read. Every access re-runs it, and side effects surprise readers.

## Follow-ups

**Q:** How do you make a getter lazy and cached?
**A:** On first call, replace it with a data property using `Object.defineProperty(this, 'key', { value, enumerable: true })`, then return the value. Later reads skip the getter. An own accessor must be configurable; an inherited one (a class getter) needs `this` to be extensible.

**Q:** Getter or a method?
**A:** A getter reads like data, so it should be cheap, idempotent and side-effect free. Anything that is slow, async or takes arguments should be a method.

**Q:** Do accessors appear in `Object.entries`?
**A:** Enumerable own accessors do, and `Object.entries` calls their getters to get the value. Class accessors, being non-enumerable on the prototype, don't.

## Exercises

### Predict the output

```js
let calls = 0;
const source = {
  get id() {
    calls += 1;
    return calls;
  },
};
const copy = { ...source };
copy.id = 100;
console.log(copy.id, source.id, calls);
```

**Answer:** `100 2 2`. Spread calls the getter once and stores `1` as a plain data property, which `copy.id = 100` overwrites. `source.id` calls the getter a second time.
