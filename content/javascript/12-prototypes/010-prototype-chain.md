---
title: "How does prototypal inheritance work?"
status: draft
difficulty: medium
frequency: 5
core: true
tags: [prototype, prototype-chain, inheritance, property-lookup, shadowing]
related:
  - javascript/objects-and-properties/property-descriptors
  - javascript/objects-and-properties/getters-and-setters
  - javascript/this/this-binding-rules
  - javascript/prototypes/proto-vs-prototype
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-ordinaryget
  - https://tc39.es/ecma262/#sec-ordinaryset
  - https://tc39.es/ecma262/#sec-ordinarysetwithowndescriptor
  - https://tc39.es/ecma262/#sec-ordinarysetprototypeof
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain
tldr: >
  Every object has an internal `[[Prototype]]` link to another object or `null`. Reading a
  property that isn't an own property continues the search on the prototype, then its prototype,
  until `null`. Writing never changes a prototype: it creates an own property that shadows the
  inherited one, unless an inherited setter or non-writable property intercepts it.
---

## Answer

Every object has an internal slot, `[[Prototype]]`, that holds another object or `null`. Following those links gives the **prototype chain**. It ends at `null`; for most objects the last link is `Object.prototype`.

**Reading** (`obj.key`): if `obj` has an own property `key`, use it. Otherwise ask `[[Prototype]]` the same question, and repeat. If the chain reaches `null`, the result is `undefined`. An inherited getter is called with `this` set to the *original* object, not the prototype where it was found.

**Writing** (`obj.key = value`) also consults the chain, but only to see whether something intercepts it:

- An inherited **setter** runs, with `this` set to `obj`.
- An inherited **non-writable** data property blocks the write. Sloppy mode ignores it silently; strict mode (modules, classes) throws `TypeError`.
- Otherwise `obj` gets a new **own** property. This is called *shadowing*: the prototype is untouched, and the inherited value is hidden for `obj` only.

So inheritance in JavaScript is **delegation**: objects don't copy their parent's properties, they look them up at access time. Methods live once on a shared prototype, and every instance finds them by lookup. Consequences: changing a prototype is visible to all objects inheriting from it, and mutating an inherited object (such as pushing onto an inherited array) mutates the shared one.

`in` and `for...in` see inherited properties; `Object.hasOwn`, `Object.keys` and `Object.entries` see only own ones.

## Example

```js
const base = {
  kind: 'animal',
  tags: [],
  get label() { return `${this.kind}:${this.name}`; },
  set nickname(value) { this._nick = value; },
};
Object.defineProperty(base, 'id', { value: 1, writable: false });

const dog = Object.create(base);
dog.name = 'Rex';

console.log(dog.kind, Object.hasOwn(dog, 'kind')); // → animal false
dog.kind = 'dog'; // creates an own property that shadows base.kind
console.log(dog.label, base.kind); // → dog:Rex animal

dog.nickname = 'R'; // the inherited setter runs with this === dog
console.log(Object.hasOwn(dog, '_nick'), Object.hasOwn(base, '_nick')); // → true false

try {
  dog.id = 2; // inherited non-writable data property blocks the assignment
} catch (error) {
  console.log(error.constructor.name); // → TypeError
}

dog.tags.push('x'); // reads base.tags, then mutates the shared array
console.log(base.tags); // → [ 'x' ]
console.log('toString' in dog, Object.hasOwn(dog, 'toString')); // → true false
```

## Pitfalls

- Thinking assignment modifies the prototype. `dog.kind = 'dog'` creates an own property on `dog`; `base.kind` is unchanged. Only mutation of an inherited *object* (`dog.tags.push`) reaches the shared value.
- Putting mutable state (arrays, objects) on a prototype. Every inheriting object shares it. Create such state per instance, in the constructor.
- Expecting `obj.key = value` to work when the prototype defines `key` as non-writable or as a getter without a setter. In strict mode it throws; in sloppy mode it silently does nothing.
- Using `for...in` and forgetting it includes inherited enumerable properties. Filter with `Object.hasOwn`, or use `Object.keys`.

## Follow-ups

**Q:** What is at the end of the chain?
**A:** `null`. `Object.prototype` is the usual last object, and its own `[[Prototype]]` is `null`. Objects made with `Object.create(null)` have no `Object.prototype` at all.

**Q:** Can the chain contain a cycle?
**A:** Not with ordinary objects. `Object.setPrototypeOf(a, b)` throws a `TypeError` if `a` is already in `b`'s chain (`Cyclic __proto__ value` in V8). The spec requires this check only for ordinary objects; a `Proxy` whose `getPrototypeOf` trap returns an object that inherits from the proxy creates a cycle the check cannot see.

**Q:** How do you tell an own property from an inherited one?
**A:** `Object.hasOwn(obj, key)` (own only) versus `key in obj` (own or inherited).

## Deep dive

### How it works

The spec expresses lookup as recursion. For an ordinary object, `[[Get]]` calls `OrdinaryGet(obj, key, receiver)`:

1. Ask `obj.[[GetOwnProperty]](key)`.
2. If there is no own property, get `parent = obj.[[GetPrototypeOf]]()`. If `parent` is `null`, return `undefined`; otherwise return `parent.[[Get]](key, receiver)`.
3. If it is a data property, return its value. If it is an accessor, call its getter with `receiver` as `this`.

`receiver` is the object the lookup started from, and it is passed down the chain unchanged. That is why a getter or method found on a prototype sees the original object as `this`.

`[[Set]]` follows the same shape. `OrdinarySetWithOwnDescriptor` finds the first object on the chain that has the key, then decides based on what it found. If no object has it, the key is treated as a plain writable data property:

- **Not found anywhere, or found as a writable data property:** the write goes to the *receiver*, not to the object where the property was found. If the receiver has no own property of that name, it creates one (`CreateDataProperty`); if it has one, it updates it.
- **Found as a non-writable data property:** `[[Set]]` returns `false`. Strict-mode code turns `false` into a `TypeError`.
- **Found as an accessor:** the setter is called with the receiver as `this`. With no setter, `[[Set]]` returns `false`.

Two details: the check for a non-writable property happens along the whole chain, not only on the object being written to, and the "write goes to the receiver" rule is why inheriting a writable property never modifies the prototype.

### Edge cases

Writes treat the chain differently from reads, and `defineProperty` does not follow the write rules at all:

```js
'use strict';
const proto = Object.freeze({ limit: 10 });
const child = Object.create(proto);

try {
  child.limit = 20; // blocked by the inherited non-writable property
} catch (error) {
  console.log(error.constructor.name); // → TypeError
}
Object.defineProperty(child, 'limit', { value: 20, enumerable: true });
console.log(child.limit, proto.limit); // → 20 10
```

Assignment is blocked by the inherited non-writable property; `defineProperty` only looks at `child` itself, so it can create the shadowing property anyway. This is also the standard workaround when a frozen prototype blocks a normal assignment.

Other edge cases:

- **Primitives.** `'abc'.length` or `(5).toFixed(1)` works because property access on a primitive applies `ToObject`, which makes a temporary wrapper whose chain leads to `String.prototype` or `Number.prototype`.
- **Cycles.** `OrdinarySetPrototypeOf` walks the new prototype's chain and returns `false` if it meets the object being modified; `Object.setPrototypeOf` turns that into a `TypeError`. The walk stops at any non-ordinary object (such as a `Proxy`), so a cycle through one is not detected.
- **Non-extensible objects.** `Object.preventExtensions`, `seal` and `freeze` also fix `[[Prototype]]`: `OrdinarySetPrototypeOf` returns `false` if the object is non-extensible and the prototype would change.
- **`Object.prototype`** is an immutable prototype exotic object: its `[[Prototype]]` can never be changed from `null`.

### Real-world scenario

Class methods are the common case. `class User { greet() {} }` puts `greet` on `User.prototype` once. A million `User` instances share one function through the chain instead of owning a million copies. The same mechanism makes `Array.prototype.map` available on every array, and it is what a code-review comment about "mutating shared state through a prototype" is warning about:

```js
function Cart() {}
Cart.prototype.items = []; // shared by every Cart

const a = new Cart();
const b = new Cart();
a.items.push('book');
console.log(b.items); // → [ 'book' ]
```

The fix is to create the array per instance (`this.items = []` in the constructor, or a class field), so each cart owns its array.

### Trade-offs

Delegation keeps memory low and lets you patch behaviour for every object at once, but it makes behaviour depend on the chain *at the time of the access*. A property can come from several objects away, so reading a single file no longer tells you where a value originates. Deep chains also cost a little per miss, since each level is another check. Engines hide most of this with hidden classes and inline caches, which work best when objects keep a stable shape and prototype; changing a prototype after creation can invalidate those caches (see the `__proto__` question).

Copying (spreading or `Object.assign`) takes a snapshot instead: no sharing surprises, but no updates either, and no `instanceof`/method reuse. Choose delegation when behaviour should be shared and live; choose copying when each object must be independent.

## Exercises

### Predict the output

```js
function Counter() {}
Counter.prototype.count = 0;
const a = new Counter();
const b = new Counter();
a.count++;
console.log(a.count, b.count, Counter.prototype.count);

const proto = { items: [] };
const x = Object.create(proto);
const y = Object.create(proto);
x.items = x.items.concat(1);
y.items.push(2);
console.log(x.items, y.items, proto.items);
```

**Answer:** `1 0 0`, then `[ 1 ] [ 2 ] [ 2 ]`. `a.count++` reads the inherited `0` and writes `1` as a new own property on `a`. `concat` returns a new array, so the assignment gives `x` its own `items`. `y.items.push(2)` mutates the shared array on `proto`.

### Why does this assignment fail?

```js
'use strict';
const config = Object.freeze({ debug: false });
const local = Object.create(config);
local.debug = true;
```

**Answer:** It throws a `TypeError`. `freeze` made `debug` non-writable, and the inherited non-writable data property makes `[[Set]]` return `false`, which strict mode reports. Use `Object.defineProperty(local, 'debug', { value: true, ... })` to create the own property directly.
