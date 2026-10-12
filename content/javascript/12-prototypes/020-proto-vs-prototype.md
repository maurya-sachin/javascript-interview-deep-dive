---
title: "`__proto__` vs `prototype` vs `Object.getPrototypeOf`?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [prototype, proto, getprototypeof, setprototypeof, constructor]
related:
  - javascript/prototypes/prototype-chain
  - javascript/prototypes/new-operator
  - javascript/prototypes/object-create-null
  - javascript/classes/classes-vs-prototypes
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-object.prototype.__proto__
  - https://tc39.es/ecma262/#sec-function-instances-prototype
  - https://tc39.es/ecma262/#sec-makeconstructor
  - https://tc39.es/ecma262/#sec-ordinarysetprototypeof
  - https://tc39.es/ecma262/#sec-runtime-semantics-propertydefinitionevaluation
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/proto
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/setPrototypeOf
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/prototype
tldr: >
  `[[Prototype]]` is the internal link every object has. `Object.getPrototypeOf`/`setPrototypeOf`
  are the standard ways to read and change it. `__proto__` is a legacy accessor on
  `Object.prototype` that does the same. `prototype` is an ordinary property on constructor
  functions: the object `new` will use as the `[[Prototype]]` of instances. It is not the
  function's own prototype.
---

## Answer

Four names, two ideas: the link (`[[Prototype]]`, with `getPrototypeOf` and `__proto__` as ways to reach it) and the constructor property that feeds it (`prototype`).

- **`[[Prototype]]`** is an internal slot on every object: the link the engine follows during property lookup. Code can't touch the slot directly.
- **`Object.getPrototypeOf(obj)`** and **`Object.setPrototypeOf(obj, proto)`** (also `Reflect.*`) read and write that slot. They are the standard API. Prefer `Object.create(proto)` to choose a prototype at creation.
- **`obj.__proto__`** is a legacy accessor property defined on `Object.prototype`. Its getter returns `[[GetPrototypeOf]]` of `this`; its setter calls `[[SetPrototypeOf]]`. It exists for web compatibility and is marked legacy in the spec. Don't use it in new code. Because it is inherited, objects with no `Object.prototype` in their chain (`Object.create(null)`) don't have it.
- **`F.prototype`** is an ordinary data property of constructor functions (not arrow functions or methods). Its value is the object that `new F()` uses as the `[[Prototype]]` of the new instance. It is **not** `F`'s own prototype: `Object.getPrototypeOf(F)` is `Function.prototype`.

So for `const ann = new User()`:

```
Object.getPrototypeOf(ann) === User.prototype
User.prototype.constructor === User
Object.getPrototypeOf(User) === Function.prototype
```

Each ordinary function gets a fresh `prototype` object whose only property is a non-enumerable `constructor` pointing back at the function. `constructor` is inherited, not an own property of instances, and it is just a convention: replacing `F.prototype` with a new object loses it.

An object literal can set the prototype with `{ __proto__: proto }`. That literal form is different from the accessor: it is specified syntax for non-computed `__proto__` keys, and it doesn't trigger the setter.

Changing `[[Prototype]]` after creation is slow in every engine (MDN says so), so set it at creation.

## Example

```js
function User(name) { this.name = name; }
User.prototype.greet = function () { return `hi ${this.name}`; };

const ann = new User('Ann');
console.log(Object.getPrototypeOf(ann) === User.prototype); // → true
console.log(ann.__proto__ === User.prototype); // → true
console.log(User.prototype.constructor === User); // → true
console.log(Object.getPrototypeOf(User) === Function.prototype); // → true
console.log(Object.getPrototypeOf(User.prototype) === Object.prototype); // → true
console.log(ann.prototype); // → undefined
console.log(Object.hasOwn(ann, 'constructor'), ann.constructor === User); // → false true

User.prototype = { greet() { return 'replaced'; } }; // a fresh object: no constructor property
console.log(ann.greet(), new User('Bo').greet()); // → hi Ann replaced
console.log(new User('Bo').constructor === Object); // → true
const dict = { __proto__: null }; // literal form: sets [[Prototype]], no accessor involved
console.log(dict.__proto__); // → undefined
```

## Pitfalls

- Believing `obj.prototype` exists on instances. Only functions that can be constructors have it, and instances read their prototype through `Object.getPrototypeOf`.
- Reassigning `F.prototype` after creating instances. Existing instances keep the old prototype, while later `new F()` calls get the new one.
- Overwriting `Constructor.prototype = {...}` and forgetting that `constructor` goes with it. Code that reads `obj.constructor` then gets `Object`.
- Using `__proto__` as a key on data from users: on an ordinary object, `obj['__proto__'] = value` runs the setter and changes the prototype instead of adding a key.

## Follow-ups

**Q:** Why was `__proto__` standardised if it is discouraged?
**A:** Browsers already shipped it and sites depended on it, so the spec documented it as a legacy accessor for compatibility. It is marked legacy and normative-optional: non-browser hosts may omit it. `getPrototypeOf`/`setPrototypeOf` are the standard API.

**Q:** Which functions have no `prototype` property?
**A:** Arrow functions, methods defined with shorthand syntax, async functions, and bound functions can't be constructors and have none. Classes and ordinary `function` declarations do, and generator functions have one too (used for the generator objects they return, not for `new`).

**Q:** What happens if you try to change `Object.prototype`'s prototype?
**A:** It throws a `TypeError`. `Object.prototype` is an immutable prototype exotic object, so its `[[Prototype]]` stays `null`.

## Exercises

### Predict the output

```js
function F() {}
const a = new F();
F.prototype = { tag: 'new' };
const b = new F();
console.log(a.tag, b.tag);
console.log(a instanceof F, b instanceof F);
console.log(b.constructor === Object);
```

**Answer:** `undefined new`, then `false true`, then `true`. `a` still links to the old prototype object, so `a instanceof F` (which compares against the *current* `F.prototype`) is `false`. The replacement object has no `constructor`, so `b.constructor` is inherited from `Object.prototype`.
