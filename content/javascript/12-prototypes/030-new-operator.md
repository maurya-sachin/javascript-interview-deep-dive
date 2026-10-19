---
title: "What does the `new` operator do?"
status: draft
difficulty: medium
frequency: 4
core: false
tags: [new, constructor, new-target, return-override, construct]
related:
  - javascript/prototypes/proto-vs-prototype
  - javascript/prototypes/instanceof
  - javascript/this/this-binding-rules
  - javascript/classes/classes-vs-prototypes
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-evaluatenew
  - https://tc39.es/ecma262/#sec-construct
  - https://tc39.es/ecma262/#sec-ecmascript-function-objects-construct-argumentslist-newtarget
  - https://tc39.es/ecma262/#sec-ordinarycreatefromconstructor
  - https://tc39.es/ecma262/#sec-getprototypefromconstructor
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new
tldr: >
  `new F(...args)` creates an object whose `[[Prototype]]` is `F.prototype`, calls `F` with
  `this` set to that object, and returns it. If `F` returns an object, that object replaces the
  new one; a returned primitive is ignored (a derived class throws for any but `undefined`). Only functions with
  a `[[Construct]]` method qualify, so arrows, methods and built-in non-constructors throw.
---

## Answer

`new F(...args)` evaluates `F` and the arguments, throws a `TypeError` if `F` is not a constructor, then calls `F.[[Construct]](args, newTarget)`. For an ordinary `function` (a *base* constructor) that does four things:

1. **Create** an ordinary object.
2. **Link** it: its `[[Prototype]]` is `newTarget.prototype`. If that property isn't an object, the `Object.prototype` of `newTarget`'s realm is used instead.
3. **Call** `F` with `this` bound to the new object and `new.target` set to the constructor.
4. **Return** a value: if `F` returns an *object* (including a function or array), that is the result of `new` and the object from step 1 is discarded. Otherwise, the new object is the result and the return value is ignored.

The return rule is the one interviewers probe: `return 42` is ignored, `return {}` replaces the instance. In a **derived class** constructor, the rules are stricter: returning anything but an object or `undefined` throws a `TypeError`, and `this` isn't created until `super()` returns.

Only constructors have `[[Construct]]`: ordinary `function`s and `class`es, bound versions of them, and some built-ins like `Date` or `Map`. Arrow functions, shorthand methods, async functions and `Math.max` do not, so `new` on them throws a `TypeError`. A class constructor does the reverse and throws if called *without* `new`.

Inside a function, **`new.target`** is the constructor `new` was applied to, or `undefined` for a plain call. It lets a function detect how it was called, and it is how `Reflect.construct(F, args, NewTarget)` and subclassing choose which `prototype` to link.

## Example

```js
const isObject = (value) =>
  (typeof value === 'object' && value !== null) || typeof value === 'function';

function myNew(Constructor, ...args) {
  const prototype = Constructor.prototype;
  const instance = Object.create(isObject(prototype) ? prototype : Object.prototype); // create + link
  const result = Constructor.apply(instance, args); // call with this = instance
  return isObject(result) ? result : instance; // object return replaces; primitives are ignored
}

function Point(x, y) {
  this.x = x;
  this.y = y;
}
Point.prototype.norm = function () { return Math.hypot(this.x, this.y); };

const p = myNew(Point, 3, 4);
console.log(p, p.norm(), p instanceof Point); // → Point { x: 3, y: 4 } 5 true

function Primitive() { this.a = 1; return 42; }
function Override() { this.a = 1; return { b: 2 }; }
console.log(new Primitive(), new Override()); // → Primitive { a: 1 } { b: 2 }

function Guarded() { if (!new.target) return new Guarded(); this.ok = true; }
console.log(Guarded()); // → Guarded { ok: true }

class Plain {}
try { Plain(); } catch (error) { console.log(error.name); } // → TypeError
```

## Pitfalls

- Calling a constructor function without `new`. In sloppy mode `this` becomes the global object and the function silently creates globals; in strict mode `this` is `undefined` and it throws. Guard with `new.target` or use `class`.
- Returning an object from a constructor and wondering why `instanceof` fails. The returned object replaces the instance, so it has no link to `F.prototype` unless you set one.
- Believing `myNew` above reproduces `new` fully. It can't handle classes (which throw when called), derived constructors, or `new.target`; use `Reflect.construct` for those.
- Forgetting precedence: `new Foo().bar()` creates then calls `bar`, while `new Foo.bar()` constructs `Foo.bar`. `new Foo` without parentheses is allowed, and passes no arguments.

## Follow-ups

**Q:** What is `new.target`?
**A:** A meta property available inside functions. It is the constructor that `new` was applied to (or the third argument of `Reflect.construct`), and `undefined` in a plain call. In a subclass, `new.target` is the *subclass* even inside the parent's constructor, so the parent can link the right prototype.

**Q:** How does `new` differ for a class?
**A:** The mechanics are the same, but class constructors can't be called without `new`, and derived classes don't create `this` themselves: the base constructor does, via `super()`, using `new.target.prototype`.

**Q:** Why isn't `Object.create` plus `apply` the same as `new`?
**A:** The real `[[Construct]]` receives `new.target`, throws for non-constructors, and lets built-ins such as `Date`, `Map` and arrays create objects with internal slots. `Object.create` only makes an ordinary object.

## Exercises

### Predict the output

```js
function A() { this.v = 1; return []; }
function B() { this.v = 1; return 'x'; }
console.log(new A().v, new B().v);

class Base {}
class Derived extends Base {
  constructor() { super(); return 1; }
}
try { new Derived(); } catch (error) { console.log(error.name); }
```

**Answer:** `undefined 1`, then `TypeError`. `new A()` yields the returned array, which has no `v`. `new B()` ignores the string and yields the instance. A derived constructor may only return an object or `undefined`.
