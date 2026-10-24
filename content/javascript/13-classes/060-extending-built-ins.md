---
title: "How do you extend built-ins like `Array` and `Error`?"
status: draft
difficulty: hard
frequency: 1
core: false
tags: [class, subclassing, built-ins, new-target, symbol-species, array, error]
related:
  - javascript/classes/super-keyword
  - javascript/prototypes/new-operator
  - javascript/errors-and-cleanup/custom-errors
  - javascript/metaprogramming/well-known-symbols
verified: 2026-10
perishable:
  - Restricting built-in subclassing is a Stage 1 proposal
sources:
  - https://tc39.es/ecma262/#sec-array-constructor
  - https://tc39.es/ecma262/#sec-error-message
  - https://tc39.es/ecma262/#sec-ordinarycreatefromconstructor
  - https://tc39.es/ecma262/#sec-getprototypefromconstructor
  - https://tc39.es/ecma262/#sec-arrayspeciescreate
  - https://tc39.es/ecma262/#sec-speciesconstructor
  - https://tc39.es/ecma262/#sec-get-array-%symbol.species%
  - https://github.com/tc39/proposal-rm-builtin-subclassing
  - https://github.com/tc39/proposals/blob/main/stage-1-proposals.md
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/extends
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/species
tldr: >
  `class X extends Array` works because `super()` runs the built-in constructor with the original
  `new.target`, so it allocates the exotic object with `X.prototype`. Methods like `map` and
  `filter` then construct results via `this.constructor[Symbol.species]`, calling your constructor
  with a length. Subclass `Error` freely; subclass collections only when the constructor stays compatible.
---

## Answer

Built-in constructors such as `Array`, `Error`, `Map`, and `Promise` allocate their own special objects (an exotic array, an object with `[[ErrorData]]`, and so on). Because `new` passes `new.target` through `super(...)`, the built-in uses `GetPrototypeFromConstructor(newTarget, ...)` to give that object the subclass's prototype. So `class Stack extends Array` produces a real array (`Array.isArray` is `true`, `length` works) that inherits from `Stack.prototype`. ES5-style `Array.call(this)` can't do this: it creates and discards an exotic object, and `this` stays ordinary.

**`Symbol.species`.** `map`, `filter`, `slice`, `splice`, `concat`, `flat`, and `flatMap` build their results with `ArraySpeciesCreate`: read `this.constructor`, then its `[Symbol.species]` (a getter that returns the constructor itself by default), and call `new Species(length)`. So:

- results are instances of your subclass, and your methods work on them;
- **your constructor is called with a length**, so a constructor with a different signature silently misbehaves (the `label` below becomes `2`);
- `static get [Symbol.species]() { return Array; }` makes those methods return plain arrays. `Promise.prototype.then`, `ArrayBuffer`, `RegExp` and typed arrays consult species too. `Map` and `Set` define the getter, but their methods don't use it.

**`Error`.** The most common legitimate subclass. Call `super(message, options)` (so `cause` works), set `name` yourself (it defaults to `"Error"`), and add fields. `instanceof` works.

Recommendation: subclass `Error`; subclass `Array`/`Map`/`Promise` only when instances must pass `Array.isArray`/be accepted as the built-in and your constructor accepts the built-in's arguments. Otherwise wrap the built-in in a class and expose only the methods you need. A Stage 1 TC39 proposal to restrict built-in subclassing records that many implementers consider species a mistake, citing complexity, performance cliffs and security bugs; the spec is unchanged.

## Example

```js
class Stack extends Array {
  peek() { return this.at(-1); }
}
const s = Stack.of(1, 2, 3);
console.log(s instanceof Stack, Array.isArray(s), s.peek()); // → true true 3
console.log(s.filter((n) => n > 1) instanceof Stack); // → true

class Names extends Array {
  constructor(label) { super(); this.label = label; }
}
const names = new Names('users');
names.push('ada', 'grace'); // map below calls new Names(2)
console.log(names.map((n) => n.toUpperCase()).label); // → 2

class Safe extends Array {
  static get [Symbol.species]() { return Array; }
}
console.log(Safe.from([1, 2]).map((n) => n * 2) instanceof Safe); // → false

class HttpError extends Error {
  constructor(status, message, options) {
    super(message, options);
    this.name = 'HttpError';
    this.status = status;
  }
}
const err = new HttpError(404, 'not found', { cause: 'x' });
console.log(err instanceof Error, String(err), err.cause); // → true HttpError: not found x
```

## Pitfalls

- Changing the constructor signature of an `Array`/`Promise` subclass. Species calls `new Subclass(length)` or `new Subclass(executor)`, so extra required parameters break internal calls.
- Forgetting `name`. `class E extends Error {}` gives `new E('m').name === 'Error'`, so logs and `String(err)` show `Error` unless you set it.
- Overriding `set`/`add` on a `Map`/`Set` subclass without knowing the constructor calls it for every initial entry. The override runs during construction, possibly before your own fields exist.
- Relying on `structuredClone` to keep the subclass. The copy of an error is a plain `Error`, not an instance of your class.

## Follow-ups

**Q:** Why can't ES5-style `Array.call(this)` subclass `Array`?
**A:** It can't forward `new.target`. The call allocates a fresh exotic array and discards it, so `this` stays an ordinary object and `Array.isArray(this)` is `false`.

**Q:** What does `Symbol.species` on `Array` return?
**A:** `this`, via a getter on the constructor, so `Stack[Symbol.species]` is `Stack` unless you override it.

**Q:** Do I need `Object.setPrototypeOf(this, new.target.prototype)` in a custom error?
**A:** Not with native classes: `super(message)` already creates the error from `new.target.prototype`. The workaround is for code compiled down to ES5, where `Error.call(this)` can't forward `new.target`.

## Exercises

### Predict the output

```js
class Queue extends Array {
  static get [Symbol.species]() { return Array; }
}
const q = Queue.of(1, 2, 3);
console.log(q.slice(1) instanceof Queue, q.slice(1) instanceof Array);

class E1 extends Error {}
console.log(new E1('m').name);

class LoudMap extends Map {
  set(key, value) { console.log('set', key); return super.set(key, value); }
}
new LoudMap([['a', 1]]);
```

**Answer:** `false true`; then `Error`; then `set a`. Species points at plain `Array`, but `Queue.of` still builds a `Queue`. `name` is inherited from `Error.prototype`. The `Map` constructor looks up `this.set` and calls it for each entry.
