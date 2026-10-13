---
title: "What are JavaScript's types?"
status: draft
difficulty: easy
frequency: 5
core: true
tags: [types, primitives, objects, typeof, immutability]
related:
  - javascript/values-and-types/typeof-null
  - javascript/values-and-types/primitive-wrappers
  - javascript/values-and-types/pass-by-sharing
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-ecmascript-language-types
  - https://tc39.es/ecma262/#sec-ecmascript-language-types-number-type
  - https://tc39.es/ecma262/#sec-typeof-operator
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Data_structures
  - https://developer.mozilla.org/en-US/docs/Glossary/Primitive
tldr: >
  The spec defines eight language types: Undefined, Null, Boolean, String, Symbol, Number,
  BigInt (the seven primitives) and Object. Primitives are immutable and compared by value;
  objects are collections of properties, compared by identity. `typeof` has no `"null"`
  result and reports `"function"` for callable objects, so it isn't a one-to-one map.
---

## Answer

ECMAScript has **eight language types**: **Undefined, Null, Boolean, String, Symbol, Number, BigInt, and Object**. The first seven are *primitive values*; every member of the eighth, Object, is an object. Functions, arrays, dates, maps and class instances are all just objects.

What separates the two groups:

- **Primitives are immutable.** You can reassign a variable that holds a string, but you can't change the string itself. Methods like `toUpperCase()` return a new value.
- **Primitives compare by value, objects by identity.** `'a' === 'a'` is `true`; `{} === {}` is `false`, because each literal creates a new object.
- **Objects are collections of properties**, each either a data property or an accessor property. Primitives have no properties of their own; `'abc'.length` works through a temporary wrapper (see the primitive-wrappers question).

Two types are easy to blur. `undefined` is what a variable holds before assignment; `null` is the explicit "no value" you assign. Number is an IEEE 754 double and BigInt is an arbitrary-precision integer, so they're different types and don't mix in arithmetic (`1n + 1` throws).

**`typeof` is not the type list.** It returns eight strings, but they don't line up with the eight types: `typeof null` is `"object"`, and callable objects report `"function"` although Function isn't a separate type.

## Example

```js
const samples = [undefined, null, true, 'text', Symbol('id'), 42, 42n, { a: 1 }, () => {}];
console.log(samples.map((value) => typeof value).join(' '));
// → undefined object boolean string symbol number bigint object function

const word = 'abc';
console.log(word.toUpperCase(), word); // → ABC abc

try {
  word[0] = 'X'; // modules are strict, so the failed write throws
} catch (error) {
  console.log(error.message); // → Cannot assign to read only property '0' of string 'abc'
}

console.log('x' === 'x', {} === {}); // → true false
```

## Pitfalls

- Saying "JavaScript has seven (or six) types" and leaving out Object, or counting `function` and `array` as types. They're objects.
- Treating `typeof` output as the type list: it maps `null` to `"object"` and any callable object to `"function"`.
- Believing `const` makes a value immutable. `const` fixes the binding; primitives are immutable by nature, objects stay mutable unless frozen.
- Mixing Number and BigInt (`1n + 1` throws a `TypeError`), or assuming `42n === 42` (different types, so `false`).

## Follow-ups

**Q:** Is a string a primitive or an object?
**A:** A primitive. `new String('a')` creates a String *object*, a different thing. Property access on a primitive string temporarily wraps it, which is why `'a'.length` works.

**Q:** Does assigning an object to another variable copy it?
**A:** No. Both variables hold a reference to the same object, so a mutation through one is visible through the other. Primitives are copied by value.

## Deep dive

### How it works

The spec defines *language types* as the types of values a programmer manipulates directly. `typeof` is specified as a fixed sequence of checks on the operand's type: Undefined gives `"undefined"`, Null gives `"object"`, and so on; for an Object it returns `"function"` if the value has a `[[Call]]` internal method and `"object"` otherwise. The result strings are therefore a property of the operator, not a second type system.

Each type has a precise shape:

- **Undefined and Null** each have exactly one value.
- **Number** is the set of IEEE 754 binary64 doubles, with all NaN bit patterns collapsed into one `NaN` value. That's why integers lose exactness beyond 2^53.
- **BigInt** is an integer of any size.
- **String** is an ordered sequence of 16-bit unsigned integers (UTF-16 code units), so `'😀'.length` is `2`.
- **Symbol** values are unique and immutable, and can be used as property keys.

### Edge cases

`NaN` is a Number value, so `typeof NaN` is `"number"`. `-0` is a distinct Number value from `+0`, though `===` treats them as equal. Primitives have no identity, so there's no way to ask whether two `42`s are "the same 42"; the question only makes sense for objects.

`typeof` on an identifier with no declaration returns `"undefined"` instead of throwing (the spec checks for an unresolvable reference first), but a `let` binding in its temporal dead zone still throws a `ReferenceError`.

```js
console.log(typeof NaN, Object.is(0, -0), 0 === -0); // → number false true
console.log(typeof undeclaredName); // → undefined
```

## Exercises

### Predict the output

```js
const a = 'hi';
const b = new String('hi');
console.log(typeof a, typeof b, a === b, a == b);
```

**Answer:** `string object false true`. `b` is a String object, so `===` compares different types and fails; `==` converts the object to a primitive first and finds equal strings.
