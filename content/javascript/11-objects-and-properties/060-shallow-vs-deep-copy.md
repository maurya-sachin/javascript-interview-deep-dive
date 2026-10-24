---
title: "Shallow vs deep copy — spread, `Object.assign`, or `structuredClone`?"
status: draft
difficulty: medium
frequency: 5
core: true
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
  - https://nodejs.org/docs/latest-v24.x/api/worker_threads.html#considerations-when-cloning-objects-with-prototypes-classes-and-accessors
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

## Deep dive

### How it works

`structuredClone(value)` runs `StructuredSerializeWithTransfer` (built on `StructuredSerializeInternal`), then `StructuredDeserializeWithTransfer`: two separate passes. Serialization turns the graph into an intermediate Record tree, with a *memory* map from each source object to its Record. A second visit to the same object returns the existing Record, which is how cycles and shared references survive. Deserialization then builds new objects from those Records.

For an ordinary object, the serialize step does, per the HTML spec:

1. It takes `EnumerableOwnProperties(value, key)`, which is why symbol keys and non-enumerable properties are dropped.
2. For each key it checks `HasOwnProperty`, then reads `value.[[Get]](key, value)`. Reading through `[[Get]]` is what runs a getter and stores its result, and why the clone has data properties.
3. It never reads `[[Prototype]]`, so deserialization creates a plain `Object`.

`Error` objects take their own branch: the serialized `name` is kept only if it is one of the seven built-in error names (otherwise it becomes `"Error"`), and `message` is kept only when it is an own data property. The record holds only `name`, `message` and an implementation-defined stack; custom fields are not part of it.

```js
let reads = 0;
const source = {
  get stamp() { reads++; return 'now'; },
  [Symbol('hidden')]: 1,
};
Object.defineProperty(source, 'secret', { value: 2, enumerable: false });

const copy = structuredClone(source);
console.log(reads, Object.getOwnPropertyDescriptor(copy, 'stamp')); // → 1 { value: 'now', writable: true, enumerable: true, configurable: true }
console.log(Reflect.ownKeys(copy)); // → [ 'stamp' ]

class ValidationError extends Error {
  name = 'ValidationError';
  field = 'email';
}
const error = structuredClone(new ValidationError('bad'));
console.log(error.name, error.message, error.field, error instanceof ValidationError); // → Error bad undefined false
```

### Edge cases

- **Getters run exactly once, and may throw.** An error thrown by a getter propagates out of `structuredClone`. Clone untrusted objects knowing that.
- **Holes in sparse arrays are preserved**, unlike with `Array.from`.
- **`transfer` moves instead of copies.** `structuredClone(buffer, { transfer: [buffer] })` detaches the original `ArrayBuffer` (`byteLength` becomes `0`) and avoids copying the bytes. It is the same mechanism `postMessage` uses.
- **Shared references stay shared.** Two properties pointing to one object still point to one object in the clone.

```js
const buffer = new ArrayBuffer(8);
const moved = structuredClone(buffer, { transfer: [buffer] });
console.log(buffer.byteLength, moved.byteLength, buffer.detached); // → 0 8 true

const shared = { id: 1 };
const graph = structuredClone({ a: shared, b: shared });
console.log(graph.a === graph.b, graph.a !== shared); // → true true

console.log(structuredClone([1, , 3])); // → [ 1, <1 empty item>, 3 ]
```

### Real-world scenario

The same algorithm backs `postMessage`, so the limits of `structuredClone` are the limits of sending data to a Worker, between windows, or through a Node `MessageChannel`. A class instance arrives as a plain object, and a payload with a function fails with `DataCloneError` at the call site, not on the receiving side:

```js
import { once } from 'node:events';
import { MessageChannel } from 'node:worker_threads';

class Cart {
  items = [{ sku: 'a1', qty: 2 }];
  total() { return this.items.reduce((sum, item) => sum + item.qty, 0); }
}

const { port1, port2 } = new MessageChannel();
port1.postMessage(new Cart());
const [received] = await once(port2, 'message');
console.log(received.constructor.name, typeof received.total, received.items); // → Object undefined [ { sku: 'a1', qty: 2 } ]

try {
  port1.postMessage({ onDone() {} });
} catch (error) {
  console.log(error.name); // → DataCloneError
}
port1.close();
```

The usual fix is to send data and rebuild behaviour on the other side: send `cart.items` (or a `toJSON`-style plain snapshot) and construct `new Cart(items)` where it is received.

### Trade-offs

`structuredClone` is the right default for plain, acyclic-or-cyclic data with built-in types: it is built in and handles graphs and common built-ins. It is a full copy every time, so on large state it costs time and memory proportional to the whole graph, where immutable updates with spread copy only the path from the root to the changed node and share everything else. For undo history or frequent snapshots of big state, prefer structural sharing (spread the changed path, or a library built for it) and reserve `structuredClone` for boundaries: crossing threads, persisting, or isolating input you don't trust. When class instances matter, write a `clone()` method on the class; no general-purpose cloner can know your invariants.

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
