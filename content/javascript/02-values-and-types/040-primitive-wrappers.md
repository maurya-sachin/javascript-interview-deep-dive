---
title: "How can a primitive have methods?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [primitives, wrapper-objects, autoboxing, toobject, strict-mode]
related:
  - javascript/values-and-types/language-types
  - javascript/values-and-types/symbols
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-toobject
  - https://tc39.es/ecma262/#sec-getvalue
  - https://tc39.es/ecma262/#sec-putvalue
  - https://tc39.es/ecma262/#sec-ordinarycallbindthis
  - https://developer.mozilla.org/en-US/docs/Glossary/Primitive
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Data_structures
tldr: >
  A property access on a primitive first runs `ToObject` on it, creating a temporary wrapper
  (String, Number, Boolean, Symbol, BigInt) whose prototype supplies the method. The wrapper is
  thrown away afterwards, so `'a'.foo = 1` can't stick (it throws in strict mode). `null` and
  `undefined` have no wrapper, so property access on them throws.
---

## Answer

Primitives have no properties of their own. When you write `'abc'.toUpperCase()`, the spec's property-read step (`GetValue`) calls **`ToObject`** on the base value. For a string, `ToObject` returns a new **String object** whose `[[StringData]]` slot holds the primitive; Number, Boolean, Symbol and BigInt work the same way with their own wrapper types. The property lookup then runs on that object, finds `toUpperCase` on `String.prototype`, and calls it with the original primitive as `this`. Nothing is stored afterwards. MDN calls this *auto-boxing*.

Consequences:

- **Writes are lost.** `PutValue` also converts the base with `ToObject`, so `str.foo = 1` writes onto a throwaway wrapper. In strict mode (modules, classes) the failed write throws a `TypeError`; in sloppy mode it's silently ignored.
- **`null` and `undefined` have no wrapper.** `ToObject` throws a `TypeError` for them, which is why `undefined.x` throws (V8 words it "Cannot read properties of undefined").
- **Engines may skip the allocation.** The spec notes that the object "is not accessible outside" the operation, so an implementation may avoid creating it.
- **`this` is the one place boxing can show.** A sloppy-mode function called on a primitive receives a wrapper object as `this`; a strict function receives the primitive unchanged.

Don't create wrappers yourself. `new String('a')` is an object: `typeof` is `"object"`, `new String('')` is truthy, and `new String('a') === new String('a')` is `false`. Called *without* `new`, `String(x)`, `Number(x)` and `Boolean(x)` are plain conversions that return primitives.

## Example

```js
const word = 'hello';
console.log(word.toUpperCase(), word.length); // → HELLO 5

try {
  word.foo = 1; // ToObject creates a wrapper, the property lands on it, the wrapper is discarded
} catch (error) {
  console.log(error.message); // → Cannot create property 'foo' on string 'hello'
}
console.log(word.foo); // → undefined

const sloppy = new Function('return typeof this'); // Function bodies are sloppy unless they opt in
const strict = new Function('"use strict"; return typeof this');
console.log(sloppy.call('hi'), strict.call('hi')); // → object string

console.log(typeof new String('x'), typeof String('x')); // → object string
console.log(new String('a') === new String('a'), new String('a') == 'a'); // → false true
```

## Pitfalls

- Saying "strings are objects in JavaScript". They are primitives that get a temporary wrapper on demand.
- Writing `new Number(5)` or `new Boolean(false)`. A `Boolean` object is truthy even when it wraps `false`, and wrappers fail `===` checks.
- Expecting `value.prop = x` on a primitive to work. In sloppy code it fails silently, which hides the bug.
- Assuming a `String.prototype` extension sees a primitive `this`. In sloppy mode it gets a wrapper object, so `typeof this` is `"object"`.

## Follow-ups

**Q:** What does `Object(value)` do with a primitive?
**A:** Called with a primitive it returns a wrapper object, like `ToObject`; `Object(1n)` gives a BigInt object. With `null` or `undefined` it returns a new empty object instead of throwing.

**Q:** Why is `typeof Object('hi')` `"object"` while `typeof String('hi')` is `"string"`?
**A:** `Object('hi')` boxes; `String('hi')` called without `new` converts and returns a primitive.
