---
title: "How does `instanceof` work?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [instanceof, symbol-hasinstance, isprototypeof, prototype-chain, realms]
related:
  - javascript/prototypes/prototype-chain
  - javascript/prototypes/new-operator
  - javascript/values-and-types/type-checking
  - javascript/metaprogramming/well-known-symbols
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-instanceofoperator
  - https://tc39.es/ecma262/#sec-ordinaryhasinstance
  - https://tc39.es/ecma262/#sec-function.prototype-%symbol.hasinstance%
  - https://tc39.es/ecma262/#sec-object.prototype.isprototypeof
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/hasInstance
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/isPrototypeOf
tldr: >
  `v instanceof C` first calls `C[Symbol.hasInstance](v)` if defined. By default
  (`OrdinaryHasInstance`) it walks `v`'s prototype chain and returns `true` if it finds the
  current value of `C.prototype`. It doesn't check that `C` constructed `v`, primitives are
  always `false`, and it breaks across realms.
---

## Answer

`value instanceof Target` runs `InstanceofOperator`:

1. If `Target` isn't an object, throw a `TypeError`.
2. Look up `Target[Symbol.hasInstance]`. If it exists, call it with `value` and convert the result to a boolean. Every function inherits a default one from `Function.prototype`, so this step normally lands there.
3. Otherwise (no `Symbol.hasInstance`), `Target` must be callable, else `TypeError`.
4. Run `OrdinaryHasInstance(Target, value)`:
   - If `value` isn't an object, return `false`.
   - If `Target` is a bound function, test against its target function instead.
   - Read `P = Target.prototype`. If `P` isn't an object, throw `TypeError`.
   - Walk `value`'s chain with `[[GetPrototypeOf]]`: return `true` on the first link that is `P`, and `false` when the chain reaches `null`.

So `instanceof` asks *"is `Target.prototype` somewhere in `value`'s chain right now?"* It doesn't check who constructed `value`. `Animal.prototype.isPrototypeOf(value)` performs the same walk without the operator, and works when you have a prototype object but no constructor.

Consequences: reassigning `Target.prototype` makes old instances stop matching; `Object.create(null)` objects are `instanceof` nothing; primitives are `false` (`'a' instanceof String`) while their wrappers are `true`; and `Symbol.hasInstance` lets a class redefine the check (duck typing, "is an even number"). Objects from another realm (an iframe, `vm` context) have *that* realm's `Array.prototype`, so `otherArray instanceof Array` is `false`: use `Array.isArray` for arrays.

## Example

```js
function myInstanceof(value, Target) {
  if (typeof Target !== 'function') throw new TypeError('Right-hand side is not callable');
  if (typeof value !== 'object' && typeof value !== 'function' || value === null) return false;
  // simplified: ignores Symbol.hasInstance, bound functions and a non-object Target.prototype
  for (let proto = Object.getPrototypeOf(value); proto !== null; proto = Object.getPrototypeOf(proto)) {
    if (proto === Target.prototype) return true;
  }
  return false;
}

class Animal {}
class Dog extends Animal {}
const rex = new Dog();
console.log(myInstanceof(rex, Animal), rex instanceof Animal); // → true true
console.log(Animal.prototype.isPrototypeOf(rex)); // → true
console.log(Object.create(null) instanceof Object); // → false
console.log('abc' instanceof String, new String('abc') instanceof String); // → false true

class Even {
  static [Symbol.hasInstance](value) { return Number.isInteger(value) && value % 2 === 0; }
}
console.log(4 instanceof Even, 3 instanceof Even); // → true false

Object.setPrototypeOf(rex, null); // detach rex from its chain
console.log(rex instanceof Animal); // → false
```

## Pitfalls

- Treating `instanceof` as "was created by `new Target`". It only tests the current chain, so `Object.create(Target.prototype)` passes and a re-parented object fails.
- Using it across realms (iframes, `vm`, some test runners). The other realm's `Array`, `Error`, `Date` are different constructors. Use `Array.isArray`, or brand checks such as `Object.prototype.toString.call`.
- Using it on primitives, where it returns `false`. Use `typeof` for those.
- Expecting it to work with arrow functions or objects: an arrow function has no `prototype`, so `x instanceof arrow` throws a `TypeError` for object `x`, and a non-callable right-hand side throws too.

## Follow-ups

**Q:** `instanceof` versus `isPrototypeOf`?
**A:** Same walk, different inputs. `instanceof` takes a constructor and reads its `prototype`; `proto.isPrototypeOf(obj)` takes the prototype object directly and returns `false` for primitives. It is inherited from `Object.prototype`, so on a null-prototype object call `Object.prototype.isPrototypeOf.call(proto, obj)`.

**Q:** How would you make `instanceof` check for a shape rather than a class?
**A:** Define `static [Symbol.hasInstance](value)` on the class and test the shape there, such as `'then' in value`. Use it sparingly: it makes `instanceof` mean something different from the inheritance relationship.

**Q:** Why does `x instanceof BoundFn` work?
**A:** Bound functions have no `prototype`, so `OrdinaryHasInstance` forwards the check to the bound target function.

## Exercises

### Predict the output

```js
function Box() {}
const a = new Box();
Box.prototype = {};
const b = new Box();
console.log(a instanceof Box, b instanceof Box);
console.log(Object.prototype.isPrototypeOf(a), Function.prototype.isPrototypeOf(Box));
console.log(Object instanceof Function, Function instanceof Object);
```

**Answer:** `false true`, then `true true`, then `true true`. `a` links to the old `Box.prototype`, which is no longer the current one. `Object.prototype` is at the end of every ordinary chain, and `Function.prototype` is `Box`'s prototype. `Object` is a function, and `Function` is an object, so both checks hold.
