---
title: "Class fields vs methods — where does each live?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [class, class-fields, methods, arrow-functions, prototype, this]
related:
  - javascript/classes/classes-vs-prototypes
  - javascript/this/lost-this-callbacks
  - javascript/this/arrow-functions-this
  - javascript/prototypes/prototype-chain
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-definefield
  - https://tc39.es/ecma262/#sec-runtime-semantics-classfielddefinitionevaluation
  - https://tc39.es/ecma262/#sec-initializeinstanceelements
  - https://tc39.es/ecma262/#sec-ecmascript-function-objects-construct-argumentslist-newtarget
  - https://tc39.es/ecma262/#sec-super-keyword-runtime-semantics-evaluation
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Public_class_fields
tldr: >
  Methods are defined once on `Class.prototype` and shared. Fields are defined on every instance
  as own enumerable properties, using define semantics (no setters called), in order: before the
  constructor body in a base class, right after `super()` returns in a derived one. An
  arrow-function field fixes `this` at the cost of one closure per instance.
---

## Answer

**Methods** (`name() {}`) are created once, when the class is evaluated, and stored on `Class.prototype` as writable, configurable, non-enumerable properties. Every instance reaches the same function object through the chain.

**Fields** (`name = value;`, or `name;`) are not on the prototype. Each field becomes an initializer function, stored in the constructor's `[[Fields]]` list. On every construction `InitializeInstanceElements` runs them with `this` set to the new instance and calls `CreateDataPropertyOrThrow(this, name, value)`. So each instance gets an own, enumerable, writable, configurable data property, and a field without an initializer is created as `undefined`.

Consequences:

- **Define, not set.** A field never calls an inherited setter and isn't blocked by a read-only inherited property; it shadows them. A `this.x = ...` assignment in the constructor does call the setter.
- **Timing.** In a base class, fields are defined just before the constructor body runs. In a derived class, they're defined right after `super()` returns, so a base constructor can't see the subclass's fields. Prototype methods, in contrast, are visible already.
- **Order and scope.** Fields initialise top to bottom, and an initializer sees earlier fields only. Constructor parameters aren't in scope.
- **Arrow-function fields** capture the instance as `this`, so they survive being passed as callbacks. The price: a new closure for every instance, and no shared prototype method for subclasses to override with `super.method()` or tests to spy on.

Rule of thumb: put behaviour in methods, put per-instance state in fields, and use an arrow field only when the method is routinely handed off as a callback.

## Example

```js
class Button {
  label = 'ok';                         // field: own property, one per instance
  onClickArrow = () => this.label;      // field holding a per-instance closure
  onClickMethod() { return this.label; } // method: one shared function on the prototype
}
const a = new Button();
const b = new Button();

console.log(Object.keys(a)); // → [ 'label', 'onClickArrow' ]
console.log(a.onClickMethod === b.onClickMethod); // → true
console.log(a.onClickArrow === b.onClickArrow); // → false

const { onClickArrow, onClickMethod } = a;
console.log(onClickArrow()); // → ok
try { onClickMethod(); } catch (e) { console.log(e.name); } // → TypeError

class Base { set value(v) { console.log('setter', v); } }
class WithField extends Base { value = 1; }
class WithAssign extends Base { constructor() { super(); this.value = 1; } }
new WithField();  // fields define, so the inherited setter is skipped
new WithAssign(); // → setter 1
```

## Pitfalls

- Passing a method as a callback (`el.addEventListener('click', btn.onClickMethod)`). It loses `this`; bind it or use an arrow field when it's a handler.
- Reading a subclass field from the base constructor. It's still `undefined` because the field isn't defined until `super()` returns.
- Using an arrow field and then trying `super.handle()` or overriding `handle` as a method in a subclass. The own property on the instance shadows the prototype method.
- Expecting a field to run a parent's setter, as transpiled code sometimes did. Native class fields use define semantics.

## Follow-ups

**Q:** How much memory do arrow fields cost?
**A:** One function object and one own property per instance, versus one shared function for a method. That is negligible for a few components and worth avoiding for thousands of instances. Exact sizes depend on the engine, so measure before optimising.

**Q:** Is `x;` the same as not declaring `x`?
**A:** No. The declaration defines an own property `x` with value `undefined`, so `'x' in obj` is `true`, and it appears in `Object.keys`.

**Q:** Where does `this` point inside a field initializer?
**A:** At the instance being created. Initializers are methods of a synthetic function whose home object is the prototype, so `super.method()` is allowed there too.

## Exercises

### Predict the output

```js
class Base {
  constructor() { console.log(this.field, typeof this.method); }
}
class Derived extends Base {
  field = 1;
  method() {}
}
new Derived();

class C { a = 1; b = this.c; c = this.a + 1; }
console.log(new C());

class D { x; }
console.log(Object.keys(new D()), 'x' in new D());
```

**Answer:** `undefined function`; then `C { a: 1, b: undefined, c: 2 }`; then `[ 'x' ] true`. The prototype exists before construction, but the derived field is only defined after `super()` returns. `b` reads `c` before `c` is defined, and `x;` defines an own property set to `undefined`.
