---
title: "`call` vs `apply` vs `bind`?"
status: draft
difficulty: easy
frequency: 5
core: true
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
  - https://tc39.es/ecma262/#sec-createlistfromarraylike
  - https://tc39.es/ecma262/#sec-ordinaryhasinstance
  - https://nodejs.org/docs/latest-v24.x/api/events.html#eventtarget-and-event-api
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
**A:** The bound `this` is dropped: `[[Construct]]` constructs the target with the bound arguments prepended and, when `new.target` is the bound function itself, `new.target` becomes the target. `instanceof` works against either function, because it unwraps a bound function to its target.

**Q:** Can `bind` be applied twice to add arguments?
**A:** Yes. Bound arguments accumulate in order: `f.bind(null, 1).bind(null, 2)(3)` calls `f(1, 2, 3)`. Only the first `thisArg` counts.

**Q:** `bind` or an arrow wrapper to fix a method's receiver?
**A:** Both fix `this`. `bind` also pre-fills leading arguments and keeps all later ones; `(x) => obj.method(x)` forwards only the parameters you list but reads more explicitly. A missing method fails at `bind` time with `obj.method.bind`, but only at call time in the arrow.

## Deep dive

### How it works

`call` and `apply` are thin wrappers over the internal `Call(func, thisArg, args)`. They differ in how the argument list is built:

- `apply` returns `Call(func, thisArg)` with no arguments when `argArray` is `undefined` or `null`. Otherwise it runs `CreateListFromArrayLike`, which requires an *object*, reads `length` with `LengthOfArrayLike`, and then `Get`s each index. That is why a plain `{ length: 2, 0: 4, 1: 9 }` works, why a number throws `TypeError`, and why a getter-backed array-like runs its getters.
- `call` takes the rest arguments as they are.

`bind` does more work up front, and every step is observable:

1. `BoundFunctionCreate` makes a bound function exotic object with `[[BoundTargetFunction]]`, `[[BoundThis]]` and `[[BoundArguments]]`. Its `[[Prototype]]` is taken from `target.[[GetPrototypeOf]]()`, so it is *not* `Function.prototype` when the target has a different prototype (a derived class, for example).
2. `length` is set only if the target has an *own* `length` property holding a Number: `max(targetLength - boundArgCount, 0)`, with `Infinity` staying `Infinity`. Otherwise it stays `0`.
3. `name` is `"bound "` plus the target's `name`, or plus the empty string when `name` isn't a String.

```js
class Base {}
class Child extends Base {}

const BoundChild = Child.bind(null);
console.log(Object.getPrototypeOf(BoundChild) === Object.getPrototypeOf(Child)); // → true
console.log(Object.getPrototypeOf(Child) === Base); // → true
console.log(new BoundChild() instanceof Child, new Child() instanceof BoundChild); // → true true

function f(a, b, c) {}
Object.defineProperty(f, 'name', { value: 42 });
const bound = f.bind(null, 1).bind(null, 2);
console.log(JSON.stringify(bound.name), bound.length); // → "bound bound " 1

const noLength = Object.defineProperty(function () {}, 'length', { value: Infinity });
console.log(noLength.bind(null, 1).length); // → Infinity
```

`instanceof` works in both directions: `new BoundChild()` constructs with `new.target` set to `Child`, and `OrdinaryHasInstance` unwraps a bound function to its `[[BoundTargetFunction]]` before it would read `prototype`, which a bound function lacks. Binding twice yields `"bound bound "` plus the target name, and the second bind sees the first bound function's `length` (`3 - 1 - 1`).

### Edge cases

- **`apply` argument validation.** `null`/`undefined` means "no arguments" and anything that isn't an object throws.
- **`apply` can be shadowed.** `fn.apply` is a normal property lookup, so a function that defines its own `apply` hijacks `fn.apply(...)`. `Reflect.apply(fn, thisArg, args)` doesn't go through that lookup.
- **Arrow functions and bound functions ignore a later `thisArg`.** The spec notes this in `Function.prototype.bind`; arrows can still be bound for their *arguments*.

```js
console.log(Math.max.apply(null, { length: 2, 0: 4, 1: 9 })); // → 9
try {
  Math.max.apply(null, 5);
} catch (error) {
  console.log(error.name); // → TypeError
}
console.log(Math.max.apply(null, null), Math.max.apply(null)); // → -Infinity -Infinity

const fn = function () { return 'real'; };
fn.apply = () => 'hijacked';
console.log(fn.apply(null), Reflect.apply(fn, null, [])); // → hijacked real
```

### Real-world scenario

`bind` returns a new function every time it is called. Code that registers a listener with `this.handler.bind(this)` and later tries to remove it with another `this.handler.bind(this)` removes nothing, because `removeEventListener` matches by function identity. The handler keeps firing, along with whatever the instance retains:

```js
class Panel {
  constructor(target) {
    this.target = target;
    this.clicks = 0;
  }
  onClick() { this.clicks++; }

  attachBroken() {
    this.target.addEventListener('click', this.onClick.bind(this));
  }
  detachBroken() {
    this.target.removeEventListener('click', this.onClick.bind(this)); // a different function
  }
}

const target = new EventTarget();
const panel = new Panel(target);
panel.attachBroken();
panel.detachBroken();
target.dispatchEvent(new Event('click'));
console.log(panel.clicks); // → 1
console.log(panel.onClick.bind(panel) === panel.onClick.bind(panel)); // → false
```

Bind once and keep the reference (in the constructor, or a class field arrow function), and use that same reference for add and remove. Passing an `AbortSignal` in the `addEventListener` options is another way to remove it without keeping the function.

### Trade-offs

`bind` gives a real function you can store, compare and remove, plus partial application, at the cost of an extra allocation per call to `bind` and a function whose `name` and `length` are derived. An arrow wrapper (`(event) => this.onClick(event)`) is clearer about what is forwarded, but it is also a new function each time and doesn't pre-fill arguments. A class field arrow (`onClick = () => {…}`) fixes `this` per instance and gives a stable reference, but creates one function per instance instead of sharing the prototype method. Choose by whether you need identity (listeners), partial application (`bind`), or shared methods (prototype). For `apply` itself, modern code usually prefers spread (`fn(...args)`) and `Reflect.apply` when `fn.apply` can't be trusted.

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
