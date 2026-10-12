---
title: "Is JavaScript pass-by-value or pass-by-reference?"
status: draft
difficulty: medium
frequency: 4
core: true
tags: [pass-by-sharing, references, mutation, assignment, functions]
related:
  - javascript/values-and-types/language-types
  - javascript/closures/what-is-a-closure
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-evaluatecall
  - https://tc39.es/ecma262/#sec-runtime-semantics-argumentlistevaluation
  - https://tc39.es/ecma262/#sec-functiondeclarationinstantiation
  - https://tc39.es/ecma262/#sec-ecmascript-language-types
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Data_structures
tldr: >
  Always pass-by-value, but the value of an object variable is a reference to the object. Arguments
  are evaluated to values and bound to the parameters, so reassigning a parameter never affects the
  caller's variable, while mutating the object it refers to is visible to everyone holding that
  reference. This is often called pass-by-sharing.
---

## Answer

JavaScript is **pass-by-value**; there is no pass-by-reference. What makes it look otherwise is what an object *value* is: a reference to an object. MDN states it directly: arguments are always passed by value, and object arguments are *passed by sharing*.

The spec shows the mechanism. A call is evaluated by `ArgumentListEvaluation`, which evaluates each argument expression and calls `GetValue` on it, producing a list of language values. `Call` then binds those values to the parameters. The callee never receives the caller's variable, only what it held.

- **Primitive argument:** the parameter gets its own copy of an immutable value. Nothing the callee does can change the caller's variable.
- **Object argument:** the parameter gets a copy of the *reference*. Caller variable and parameter now point at the same object.

That gives the rule to say in an interview:

- **Mutating** the object through the parameter (`user.name = 'Ada'`, `list.push(1)`) is visible to the caller, because both references reach the same object.
- **Reassigning** the parameter (`user = {}`) only repoints the callee's local binding. The caller's variable is untouched.

True pass-by-reference would let `swap(a, b)` exchange the caller's variables. In JavaScript it can't, because the function never has access to those bindings.

Assignment works the same way: `const alias = obj` copies the reference, so `alias` and `obj` are one object. The same applies to spread and `Object.assign`: they copy the references held by the top-level properties (a shallow copy). Use `structuredClone` for a deep copy.

## Example

```js
function update(user, count) {
  user.name = 'Ada'; // mutation: visible to the caller
  user = { name: 'Grace' }; // reassignment: only the local binding changes
  count += 1; // changes the local copy only
}

const person = { name: 'Alan', tags: ['a'] };
let n = 1;
update(person, n);
console.log(person.name, n); // → Ada 1

function swap(a, b) {
  [a, b] = [b, a];
}
let x = 1;
let y = 2;
swap(x, y);
console.log(x, y); // → 1 2

const shallow = { ...person };
shallow.tags.push('b'); // the nested array is shared
console.log(person.tags); // → [ 'a', 'b' ]
console.log(structuredClone(person).tags === person.tags); // → false
```

## Pitfalls

- Concluding "objects are passed by reference" because mutation is visible. Reassigning the parameter doesn't affect the caller, which a real by-reference language would allow.
- Saying "primitives by value, objects by reference". Everything is by value; the value of an object variable is a reference.
- Thinking a spread or `Object.assign` copy is independent. Nested objects and arrays are still shared.
- Mutating arguments inside "pure" helpers (`items.sort()`, `items.push()`), so callers get surprise side effects. Copy first, or use non-mutating methods.

## Follow-ups

**Q:** How do I prevent a function from mutating my object?
**A:** Pass a copy (`structuredClone`, or a spread for flat data), or have the function return a new value. `Object.freeze` blocks writes at runtime but is shallow, and in sloppy mode failed writes are silent.

**Q:** Does `const` stop the callee from changing the object?
**A:** No. `const` fixes the caller's binding. It says nothing about the object's contents.

## Deep dive

### How it works

The call path has three steps. `EvaluateCall` runs `ArgumentListEvaluation`, which evaluates each argument expression and passes it through `GetValue`. If the expression is a variable, `GetValue` reads its *current value* out of the binding. The result is a List of language values. A Reference Record, the spec-internal thing that points at a binding, is never a language value and can't be put in that List. `EvaluateCall` then checks the callee is callable and invokes `Call(func, thisValue, argList)`.

Inside the callee, `FunctionDeclarationInstantiation` receives `argList`, wraps it in a list iterator, and runs `IteratorBindingInitialization` to create and initialise the parameter bindings in the callee's own Function Environment Record. A parameter is therefore a new binding in a new environment, initialised with a copy of what the caller's variable held. If that value is an Object, the copy is a second reference to the same object, and nothing in the language copies the object itself implicitly.

```js
const caller = { v: 1 };
function reassign(param) {
  param = null; // rebinds the callee's own binding
}
function mutate(param) {
  param.v = 2; // follows the shared reference
}
reassign(caller);
console.log(caller); // → { v: 1 }
mutate(caller);
console.log(caller); // → { v: 2 }
```

### Edge cases

- **Default parameters** are evaluated on each call, so `function add(item, list = []) { … }` gets a fresh array per call unless the caller passes one.
- **Strings are safe to pass around** because primitives are immutable. `str.toUpperCase()` returns a new string; the caller's value can't change.
- **Shallow copies share nested objects.** `{ ...person }` copies the top-level property values, which for nested objects are references.

```js
function add(item, list = []) {
  list.push(item);
  return list;
}
console.log(add(1), add(2)); // → [ 1 ] [ 2 ]

const original = { tags: ['a'] };
const shallow = { ...original };
shallow.tags.push('b');
console.log(original.tags); // → [ 'a', 'b' ]
```

### Trade-offs

Passing a reference makes large structures cheap to hand around, because only the reference is copied. The cost is that any holder of the reference can mutate the shared object. The options are to copy at the boundary (`structuredClone`, or a spread for flat data), return new values instead of mutating, or freeze (shallowly) what must not change. Each costs either allocation or discipline.

## Exercises

### Predict the output

```js
function reset(list) {
  list.push(4);
  list = [];
  list.push(5);
}
const numbers = [1, 2, 3];
reset(numbers);
console.log(numbers);
```

**Answer:** `[ 1, 2, 3, 4 ]`. `push(4)` mutates the shared array. `list = []` repoints the local parameter to a new array, so `push(5)` goes to that array, which the caller never sees.
