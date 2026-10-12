---
title: "Implement `Function.prototype.bind`."
status: draft
difficulty: hard
frequency: 4
core: false
tags: [this, bind, implementation, new-target, bound-functions]
related:
  - javascript/this/call-apply-bind
  - javascript/this/this-binding-rules
  - javascript/functions/currying-partial-application
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-function.prototype.bind
  - https://tc39.es/ecma262/#sec-boundfunctioncreate
  - https://tc39.es/ecma262/#sec-bound-function-exotic-objects-call-thisargument-argumentslist
  - https://tc39.es/ecma262/#sec-bound-function-exotic-objects-construct-argumentslist-newtarget
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new.target
tldr: >
  Return a function that calls the target with the saved `this` and the saved arguments
  followed by the new ones. Behave differently under `new`: ignore the saved `this`, and
  build the object with `Reflect.construct`. A userland version can't match a real bound
  function's `prototype`, `instanceof`, `length`/`name` and brand.
---

## Answer

The spec defines `bind` through a **bound function exotic object**. It stores `[[BoundTargetFunction]]`, `[[BoundThis]]` and `[[BoundArguments]]`, and its internal methods do two things:

- **`[[Call]]`:** call the target with `[[BoundThis]]` and `[[BoundArguments]]` followed by the call's own arguments. The `this` of the call is ignored.
- **`[[Construct]]`:** construct the target with the bound arguments prepended, ignoring `[[BoundThis]]`. If `new.target` is the bound function itself, it is replaced by the target.

A userland version needs to reproduce those two paths. A normal function can tell them apart through `new.target`, which is `undefined` for a plain call. `Reflect.apply` and `Reflect.construct` are the clean primitives: the first calls with an explicit `this`, the second constructs with an explicit `new.target`, so a constructed object gets the right prototype.

Use the rest parameter and spread for argument merging; the old `Array.prototype.slice.call(arguments)` is no longer needed. Validate the target, as the spec does, with a `TypeError`.

**What it can't replicate:**

- The result is a normal function. It has an own `prototype` (non-configurable, so you can't delete it), so `new bound() instanceof bound` is `false`, where for a native bound function `instanceof` is delegated to the target.
- `name` and `length` are those of the inner function unless you define them (`bound <name>`, target length minus bound arguments); they can be copied with `Object.defineProperties`.
- Its `[[Prototype]]` is `Function.prototype`, not the target's, and `toString` shows your source, not `function () { [native code] }`.
- It isn't a real exotic object, so engines can't treat it specially and tools can't see the target.

State these limits out loud in an interview; they show you know it is an approximation.

## Example

```js
function bind(target, boundThis, ...boundArgs) {
  if (typeof target !== 'function') {
    throw new TypeError('Bind must be called on a function');
  }
  function bound(...args) {
    const allArgs = [...boundArgs, ...args];
    if (new.target) {
      // Like [[Construct]]: the bound this is ignored.
      const newTarget = new.target === bound ? target : new.target;
      return Reflect.construct(target, allArgs, newTarget);
    }
    return Reflect.apply(target, boundThis, allArgs);
  }
  return bound;
}

function describe(greeting, mark) {
  return `${greeting}, ${this.name}${mark}`;
}
function Point(x, y) {
  Object.assign(this, { x, y });
}
const hello = bind(describe, { name: 'Ada' }, 'Hello');
console.log(hello('!')); // → Hello, Ada!
console.log(hello.call({ name: 'Grace' }, '?')); // → Hello, Ada?

const OnYAxis = bind(Point, null, 0);
const point = new OnYAxis(5);
console.log(point); // → Point { x: 0, y: 5 }
console.log(point instanceof Point, point instanceof OnYAxis); // → true false
```

## Pitfalls

- Using `target.apply(boundThis, allArgs)`. It breaks if the target overrides `apply` or inherits a different one; `Reflect.apply` always performs the call.
- Skipping the `new` path. `new bound()` would then call the target with the saved `this` and return the wrapper's own empty object instead of constructing an instance of the target.
- Implementing it as an arrow function. Arrows have no `new.target` of their own and can't be constructed, so the `new` path is unreachable.
- Forgetting that `bound(...args)` must prepend the *bound* arguments: `[...args, ...boundArgs]` is the wrong order.

## Follow-ups

**Q:** Why not just `(...args) => target.apply(boundThis, [...boundArgs, ...args])`?
**A:** It's correct for plain calls and a fine one-liner when `new` isn't needed. It can't be constructed, so `new bound()` throws a `TypeError`, where a native bound function constructs the target.

**Q:** How would you make `name` and `length` match?
**A:** Define them on the result: `name` as `bound ${target.name}` and `length` as `Math.max(0, target.length - boundArgs.length)`. Both are configurable, so `Object.defineProperties` works. The spec also handles non-string names and infinite lengths.

**Q:** Why can't you delete `prototype` from your version?
**A:** A function declared with `function` gets a non-configurable `prototype`. Methods and arrows have none but can't be constructed, so you'd lose the `new` path.

## Exercises

### Match `name` and `length`

Extend the example's `bind` so `bind(add, null, 1)` has `name` `"bound add"` and `length` `2` for `function add(a, b, c)`.

```js
function add(a, b, c) {
  return a + b + c;
}
const add1 = bind(add, null, 1);
console.log(add1.name, add1.length); // → bound add 2
```

**Answer:** Before `return bound`, add `Object.defineProperties(bound, { name: { value: `bound ${target.name}` }, length: { value: Math.max(0, target.length - boundArgs.length) } });`. Own `name` and `length` of a function are configurable, so redefining works. The result still differs from native: it keeps an own `prototype`.
