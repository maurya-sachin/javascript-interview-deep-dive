---
title: "What do computed keys, shorthand properties and method syntax change beyond brevity?"
status: draft
difficulty: medium
frequency: 2
core: false
tags: [objects, object-literals, computed-keys, methods, home-object, proto]
related:
  - javascript/objects-and-properties/property-keys-and-order
  - javascript/objects-and-properties/getters-and-setters
  - javascript/functions/function-forms
  - javascript/functions/function-name-and-length
  - javascript/classes/super-keyword
  - javascript/prototypes/proto-vs-prototype
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-object-initializer
  - https://tc39.es/ecma262/#sec-object-initializer-runtime-semantics-evaluation
  - https://tc39.es/ecma262/#sec-runtime-semantics-propertydefinitionevaluation
  - https://tc39.es/ecma262/#sec-object-initializer-static-semantics-early-errors
  - https://tc39.es/ecma262/#sec-runtime-semantics-definemethod
  - https://tc39.es/ecma262/#sec-makemethod
  - https://tc39.es/ecma262/#sec-evaluate-property-access-with-expression-key
tldr: >
  Method shorthand creates a non-constructor with a [[HomeObject]], so it can use `super`;
  `key: function () {}` can't. A computed key is evaluated and converted with ToPropertyKey before
  its value, in source order. `__proto__: value` sets the prototype, but a computed `['__proto__']`
  or shorthand `{ __proto__ }` creates an ordinary own property.
---

## Answer

Object literals are evaluated property by property, left to right, by `PropertyDefinitionEvaluation`. Each form has semantics of its own.

**Shorthand properties.** `{ x }` is `{ x: x }`: it reads the binding `x` and creates an own data property. Nothing more.

**Method syntax.** `{ greet() {} }` differs from `{ greet: function () {} }` in two ways. `DefineMethod` calls `MakeMethod`, which records the object as the function's `[[HomeObject]]`, so `super.greet()` works: it looks up the `[[Prototype]]` of the home object. And a method has no `[[Construct]]` and no `prototype` property, so `new obj.greet()` throws a TypeError. A `function` expression value is a constructor and can't contain `super` at all — that's a SyntaxError. Getters, setters, generator and async methods follow the method rules.

**Computed keys.** `{ [expr]: value }` evaluates `expr`, then runs `ToPropertyKey` on it, then evaluates `value`. So a key object's `toString` runs before the value expression, and each property finishes before the next starts. Assignment is different: in `obj[key] = value()` the current spec delays `ToPropertyKey` until after the right-hand side, and Node.js 24 follows that order.

**`__proto__`.** A non-computed `__proto__: value` is special syntax: if the value is an object or `null`, it sets the new object's `[[Prototype]]`, and otherwise it's ignored; either way no own property is created. Writing it twice is a SyntaxError. But a computed `['__proto__']: value` and the shorthand `{ __proto__ }` are ordinary definitions: they create an own property named `"__proto__"` and leave the prototype alone. JSON-parsed objects behave like the computed form.

Literal keys are normalised too: numeric literals become their canonical string (`0x10` → `'16'`, `1.0` → `'1'`), and duplicate keys are allowed, the last one winning — except `__proto__`.

## Example

```js
const log = [];
const key = { toString() { log.push('key'); return 'k'; } };
const value = () => (log.push('value'), 1);

const literal = { [key]: value() };
console.log(log.splice(0)); // → [ 'key', 'value' ]
const target = {};
target[key] = value();
console.log(log.splice(0)); // → [ 'value', 'key' ]

const base = { greet() { return 'base'; } };
const child = {
  __proto__: base,                              // sets [[Prototype]]
  greet() { return `child>${super.greet()}`; }, // [[HomeObject]] is child
  plain: function () {},
};
console.log(child.greet(), Object.hasOwn(child, '__proto__')); // → child>base false
console.log('prototype' in child.greet, 'prototype' in child.plain); // → false true
try { new child.greet(); } catch (e) { console.log(e.name); } // → TypeError

const computed = { ['__proto__']: base };
console.log(Object.getPrototypeOf(computed) === base, Object.hasOwn(computed, '__proto__')); // → false true
console.log(Object.keys({ 0x10: 'a', 1.0: 'b', '01': 'c' })); // → [ '1', '16', '01' ]
```

## Pitfalls

- Using method shorthand for something you `new`. Methods aren't constructors; use a class or a `function`.
- Copying a method to another object and expecting `super` to follow. `[[HomeObject]]` is fixed at definition, so `super` still refers to the original object's prototype.
- Expecting `{ ['__proto__']: x }` or `{ __proto__ }` to set the prototype. Only the plain `__proto__: x` form does.
- Expecting `{ __proto__: 5 }` to throw or create a property. A non-object, non-null value is silently ignored.

## Follow-ups

**Q:** Why is `{ __proto__: null, … }` a useful idiom?
**A:** It creates a dictionary with no prototype in one expression, like `Object.create(null)` plus properties. Lookups never hit `Object.prototype`, so keys like `toString` or `constructor` aren't pre-defined. It's spec syntax, unlike the `Object.prototype.__proto__` accessor, which is legacy.

**Q:** Does a method's `name` come from a computed key?
**A:** Yes. Methods get `SetFunctionName` with the evaluated key, so `{ [Symbol('id')]() {} }` has the name `'[id]'`. An anonymous function or arrow as a property value gets the key through NamedEvaluation — except under a non-computed `__proto__` key.

**Q:** Does a spread in a literal call setters?
**A:** No. `{ ...src }` uses CopyDataProperties, which defines own data properties on the new object. It reads `src`'s getters but never runs setters, unlike `Object.assign`, which uses `[[Set]]`.

## Exercises

### Predict the output

```js
let i = 0;
const obj = { [i++]: i, [i++]: i, [`k${i}`]: i++ };
console.log(obj, i);
```

**Answer:** `{ '0': 1, '1': 2, k2: 2 } 3`. Each key is evaluated before its value, and properties run left to right: key `0` (i becomes 1), value `1`; key `1` (i becomes 2), value `2`; key `'k2'`, value `2` (i becomes 3).
