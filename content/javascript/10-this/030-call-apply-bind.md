---
title: "`call` vs `apply` vs `bind`?"
status: draft
difficulty: easy
frequency: 5
core: false
tags: [this, call, apply, bind, partial-application]
related:
  - javascript/this/this-binding-rules
  - javascript/this/arrow-functions-this
  - javascript/this/lost-this-callbacks
  - javascript/this/implement-bind
  - javascript/functions/currying-partial-application
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-function.prototype.call
  - https://tc39.es/ecma262/#sec-function.prototype.apply
  - https://tc39.es/ecma262/#sec-function.prototype.bind
  - https://tc39.es/ecma262/#sec-boundfunctioncreate
  - https://tc39.es/ecma262/#sec-bound-function-exotic-objects-call-thisargument-argumentslist
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
tldr: >
  All three set `this` explicitly. `call(thisArg, ...args)` and `apply(thisArg, argsArray)`
  invoke the function now; they differ only in how arguments are passed. `bind(thisArg,
  ...args)` doesn't invoke: it returns a new bound function with `this` and leading
  arguments fixed, which later `call`/`bind` can't change.
---

## Answer

| | Invokes now? | Arguments | Returns |
|---|---|---|---|
| `fn.call(thisArg, a, b)` | yes | listed one by one | `fn`'s result |
| `fn.apply(thisArg, [a, b])` | yes | one array or array-like (`null`/`undefined` means none) | `fn`'s result |
| `fn.bind(thisArg, a)` | no | leading arguments, fixed now | a new function |

**`call` vs `apply`** differ only in argument passing. `fn.apply(thisArg, args)` is `fn.call(thisArg, ...args)` for arrays; `apply` is still useful when the arguments are an array-like that isn't iterable, because spread needs an iterable.

**`bind`** returns a *bound function exotic object*. Its internal `[[Call]]` ignores the `this` it receives and calls the target with the saved `[[BoundThis]]`, passing `[[BoundArguments]]` followed by the new arguments. Consequences:

- `call`, `apply` and a second `bind` can't change a bound `this`. Extra `bind` arguments are still applied (partial application).
- With `new`, the bound `this` is ignored, but the bound arguments are still prepended, so `Point.bind(null, 0)` works as a constructor with `x` pre-filled.
- It has no `prototype`; its `name` is `"bound " + target.name`, and its `length` is the target's minus the bound arguments (never below 0).

**Sloppy-mode detail:** `call` and `apply` pass `thisArg` unchanged. A sloppy target then turns `undefined`/`null` into `globalThis` and boxes primitives; a strict target receives them as given.

**Arrow functions** ignore all three `thisArg`s, since they have no `this` binding of their own.

Typical uses: borrowing a method for an array-like (`Array.prototype.map.call('abc', fn)`), forwarding arguments, partial application, and fixing a method's receiver before passing it as a callback.

## Example

```js
// Module code.
function greet(greeting, punctuation) {
  return `${greeting}, ${this.name}${punctuation}`;
}
const ada = { name: 'Ada' };
const grace = { name: 'Grace' };

console.log(greet.call(ada, 'Hello', '!')); // → Hello, Ada!
console.log(greet.apply(grace, ['Hi', '?'])); // → Hi, Grace?

const greetAda = greet.bind(ada, 'Hey');
console.log(greetAda('.')); // → Hey, Ada.
console.log(greetAda.call(grace, '.')); // → Hey, Ada.
console.log(greetAda.bind(grace)('.')); // → Hey, Ada.
console.log(greetAda.name, greetAda.length); // → bound greet 1
console.log('prototype' in greetAda); // → false

console.log(Math.max.apply(null, { length: 3, 0: 4, 1: 9, 2: 2 })); // → 9
console.log(Array.prototype.map.call('abc', (c) => c.toUpperCase())); // → [ 'A', 'B', 'C' ]
```

## Pitfalls

- Expecting `call` or a second `bind` to override a bound function. The first `bind` wins; later `thisArg`s are ignored.
- Passing `null` as `thisArg` to a sloppy method that uses `this`. It becomes `globalThis`, which hides bugs; in strict code it stays `null` and throws on property access.
- Calling `bind` and discarding the result. It never changes the original function.
- Spreading or applying huge arrays. Both push every element as an argument, so very large inputs can exceed the engine's argument limit and throw a `RangeError` (it does for 3 million elements in Node 24).

## Follow-ups

**Q:** What happens if you `new` a bound function?
**A:** The bound `this` is dropped: `[[Construct]]` constructs the target with the bound arguments prepended and, when `new.target` is the bound function itself, `new.target` becomes the target. `instanceof` therefore works against either function.

**Q:** Can `bind` be applied twice to add arguments?
**A:** Yes. Bound arguments accumulate in order: `f.bind(null, 1).bind(null, 2)(3)` calls `f(1, 2, 3)`. Only the first `thisArg` counts.

**Q:** `bind` or an arrow wrapper to fix a method's receiver?
**A:** Both fix `this`. `bind` also pre-fills leading arguments and keeps all later ones; `(x) => obj.method(x)` forwards only the parameters you list but reads more explicitly. Neither is checked for a missing method until called.

## Exercises

### Predict the output

```js
function show() {
  return this.id;
}
const a = show.bind({ id: 'a' });
const b = a.bind({ id: 'b' });
console.log(a.call({ id: 'c' }), b(), new a() instanceof show);
```

**Answer:** `a a true`. Both rebinding attempts are ignored. `new a()` constructs `show` (the bound `this` is dropped), creating an instance of `show`, so `instanceof` is `true`.
