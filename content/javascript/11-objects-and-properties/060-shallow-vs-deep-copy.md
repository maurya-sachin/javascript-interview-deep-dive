---
title: "Shallow vs deep copy — spread, `Object.assign`, or `structuredClone`?"
status: draft
difficulty: medium
frequency: 5
core: false
tags: [objects, copying, structured-clone, spread, object-assign, deep-clone]
related:
  - javascript/values-and-types/pass-by-sharing
  - javascript/operators-and-syntax/spread-vs-rest
  - javascript/objects-and-properties/property-descriptors
  - javascript/objects-and-properties/deep-equality
  - javascript/json-and-binary-data/json-stringify-edge-cases
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-copydataproperties
  - https://tc39.es/ecma262/#sec-object.assign
  - https://html.spec.whatwg.org/multipage/structured-data.html#structuredserializeinternal
  - https://html.spec.whatwg.org/multipage/structured-data.html#dom-structuredclone
  - https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone
  - https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
tldr: >
  Spread and `Object.assign` copy only the top level: nested objects stay shared. For a deep
  copy, `structuredClone` handles cycles and built-ins like `Date`, `Map` and `Set`, but throws
  on functions and symbols, and it drops prototypes, getters (they become values), symbol keys,
  non-enumerable properties and attributes.
---

## Answer

**Shallow copies** create a new top-level object and copy each own enumerable property by value. For nested objects that value is a reference, so the copy and the original share them.

| | `{ ...src }` | `Object.assign({}, src)` |
|---|---|---|
| Copies | own enumerable, strings and symbols | same |
| Getters | read once, value stored | same |
| Writes with | `CreateDataProperty` (defines) | `[[Set]]` (can run setters, including a source key `__proto__`) |
| Prototype | the result is a plain object | the target keeps its own |

Both skip inherited and non-enumerable properties. `Object.assign` also mutates its target, so use `{ ...a, ...b }` for non-mutating merges.

**Deep copies:**

- `structuredClone(value)` (browsers and Node) walks the object graph and builds a new one. It records each object in a memory map, so **cycles and shared references are preserved**. It supports primitives (including `BigInt`, `NaN`, `-0`), plain objects, arrays, `Date`, `RegExp`, `Map`, `Set`, typed arrays and `ArrayBuffer`, boxed primitives, and built-in `Error` types.
- `JSON.parse(JSON.stringify(x))` is a poor deep copy: it drops `undefined` and functions, turns `Date` into a string, `Map` into `{}`, `NaN` into `null`, and throws on cycles and `BigInt`.

**What `structuredClone` cannot clone or keeps:**

- **Throws** `DataCloneError` for functions (including methods), symbol values, `Promise`, `WeakMap`/`WeakSet`, `Proxy`, and platform objects that aren't serializable (such as DOM nodes).
- **Silently drops**: symbol keys, non-enumerable properties, and attributes (a frozen object comes back unfrozen; the prototype chain is gone).
- **Flattens**: a class instance comes back as a plain `Object` without its methods; a getter's current value becomes a data property; custom `Error` subclasses lose `name` and extra fields; `RegExp` loses `lastIndex`.

Use spread for flat or immutable-update cases, `structuredClone` for plain data, and custom code for class instances.

## Example

```js
const original = {
  name: 'Ada',
  tags: ['math'],
  address: { city: 'London' },
  joined: new Date(0),
  scores: new Map([['a', 1]]),
};

const shallow = { ...original };
shallow.address.city = 'Paris'; // nested object is shared with `original`
console.log(original.address.city); // → Paris

const deep = structuredClone(original);
deep.address.city = 'Rome';
console.log(original.address.city); // → Paris
console.log(deep.joined instanceof Date, deep.scores.get('a')); // → true 1

const cyclic = { id: 1 };
cyclic.self = cyclic;
const copy = structuredClone(cyclic);
console.log(copy.self === copy, copy !== cyclic); // → true true

try {
  structuredClone({ run() {} });
} catch (error) {
  console.log(error.name); // → DataCloneError
}
```

## Pitfalls

- Assuming spread is deep. `{ ...state, user: { ...state.user } }` copies only the levels you spread.
- Cloning class instances with `structuredClone` and calling their methods. The result is a plain object with data only.
- Using `Object.assign` to clone untrusted JSON. A parsed own `__proto__` key reaches `[[Set]]` and changes the target's prototype; spread defines it as an ordinary property.
- Reaching for `JSON.parse(JSON.stringify(x))` on data with dates, `undefined`, `Map`, or cycles.

## Follow-ups

**Q:** Does `structuredClone` preserve shared references?
**A:** Yes. Two properties pointing at one object still point at one object in the clone, because the algorithm keeps a memory map of objects already seen. That is also why cycles work.

**Q:** Can you clone a function-containing object?
**A:** Not with `structuredClone`; it throws. Clone the data and copy the function references yourself, or restructure so functions live on a shared prototype or module.

**Q:** How do you copy an object and keep its getters and prototype?
**A:** `Object.create(Object.getPrototypeOf(src), Object.getOwnPropertyDescriptors(src))`. This is still shallow, and getters stay accessors.

## Exercises

### Write `deepClone` for plain data

```js
function deepClone(value, seen = new WeakMap()) {
  if (typeof value !== 'object' || value === null) return value;
  if (seen.has(value)) return seen.get(value);
  const copy = Array.isArray(value) ? [] : {};
  seen.set(value, copy); // register before recursing so cycles resolve to the copy
  for (const [key, child] of Object.entries(value)) {
    Object.defineProperty(copy, key, {
      value: deepClone(child, seen),
      writable: true,
      enumerable: true,
      configurable: true,
    });
  }
  return copy;
}

const data = { list: [1, { n: 2 }] };
data.self = data;
const copy = deepClone(data);
console.log(copy.self === copy, copy.list[1] !== data.list[1]); // → true true

const parsed = JSON.parse('{"__proto__":{"x":1}}');
console.log(Object.keys(deepClone(parsed)), deepClone(parsed).x); // → [ '__proto__' ] undefined
```

**Answer:** The `WeakMap` is the cycle guard: the copy is registered before its children are visited. `defineProperty` keeps a `__proto__` key as data. This handles JSON-like data only; `Date`, `Map`, `Set` and class instances would collapse to plain objects, so prefer `structuredClone` when it applies.
