---
title: "When do you use `Object.create(null)`?"
status: draft
difficulty: medium
frequency: 2
core: false
tags: [object-create, null-prototype, dictionary, proto, maps]
related:
  - javascript/prototypes/proto-vs-prototype
  - javascript/prototypes/prototype-chain
  - javascript/keyed-collections/map-vs-object
  - javascript/objects-and-properties/enumerating-properties
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-object.create
  - https://tc39.es/ecma262/#sec-object.prototype.__proto__
  - https://tc39.es/ecma262/#sec-runtime-semantics-propertydefinitionevaluation
  - https://tc39.es/ecma262/#sec-ParseJSON
  - https://tc39.es/ecma262/#sec-object.groupby
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy
  - https://nodejs.org/docs/latest/api/querystring.html#querystringparsestr-sep-eq-options
tldr: >
  `Object.create(null)` (or `{ __proto__: null }`) makes an object with no prototype, so no
  inherited keys such as `toString`, `constructor` or the `__proto__` accessor. It is a safe
  lookup table for arbitrary string keys. The price is no inherited methods, so
  string conversion and `obj.hasOwnProperty` fail. Often a `Map` is the better dictionary.
---

## Answer

`Object.create(proto)` makes an object whose `[[Prototype]]` is `proto`, and `proto` may be `null`. `Object.create` throws a `TypeError` if `proto` is neither an object nor `null`. With `null`, the object's chain is empty: it has **no inherited properties at all**.

Use it when an object is a **dictionary** keyed by data you don't control (words, usernames, header names, query keys):

- On a normal object, `'toString' in table` and `table['constructor']` are truthy even though nobody stored them, so lookups, counters and "seen before" checks give wrong answers.
- The `__proto__` key is special on a normal object: `table['__proto__'] = value` runs the inherited accessor and changes the prototype instead of storing a key. Without `Object.prototype`, `__proto__` is an ordinary key.

The platform does the same for keyed data: `Object.groupBy` returns a null-prototype object, and so does Node's `querystring.parse`.

The costs:

- No `toString`/`valueOf`: `` `${dict}` `` and `dict + ''` throw `TypeError`.
- No `hasOwnProperty`: use `Object.hasOwn(dict, key)` or `key in dict` (safe, because nothing is inherited).
- `dict instanceof Object` is `false`, and some libraries and assertion helpers assume `Object.prototype` exists.
- `{ ...dict }` and `Object.assign({}, dict)` return ordinary objects, so copying loses the null prototype.

`{ __proto__: null }` in an object literal is equivalent and more readable, because the literal form sets `[[Prototype]]` directly. For a real dictionary, prefer `Map`: any key type, insertion order, `size`, and no prototype pitfalls at all. Reach for a null-prototype object when you need an object shape, like JSON output or property syntax.

## Example

```js
function countWords(words, table) {
  for (const word of words) table[word] = (table[word] ?? 0) + 1;
  return table;
}
const words = ['a', 'constructor', 'a'];
console.log(countWords(words, {}));
// → { a: 2, constructor: 'function Object() { [native code] }1' }
console.log(countWords(words, Object.create(null)));
// → [Object: null prototype] { a: 2, constructor: 1 }

const dict = { __proto__: null }; // literal form: sets [[Prototype]] to null
console.log('toString' in dict, 'toString' in {}); // → false true

dict['__proto__'] = 5; // an ordinary key here: there is no inherited setter
console.log(Object.keys(dict)); // → [ '__proto__' ]

try {
  `${dict}`; // no toString or valueOf to convert with
} catch (error) {
  console.log(error.constructor.name); // → TypeError
}
console.log(dict instanceof Object, Object.hasOwn(dict, '__proto__')); // → false true
```

## Pitfalls

- Using a plain `{}` as a counter or cache keyed by user input. Keys like `constructor`, `toString` and `__proto__` collide with inherited members.
- Calling `dict.hasOwnProperty(key)` on a null-prototype object. There is no such method, so the call throws a `TypeError`. Use `Object.hasOwn`.
- Logging or concatenating one and getting a `TypeError`. Convert explicitly, e.g. with `JSON.stringify(dict)` or `Object.entries`.
- Copying it with spread or `Object.assign({}, dict)` and expecting the null prototype to survive. `Object.assign` also uses `[[Set]]`, so a `__proto__` key in the source runs the setter on the target instead of copying a key.

## Follow-ups

**Q:** `Object.create(null)` or `new Map()` for a dictionary?
**A:** `Map` unless you need object features. It accepts any key type, keeps insertion order, has `size`, and `__proto__` is just a key. A null-prototype object is right when the data must be a plain object, such as JSON-like output or a config you read with property syntax.

**Q:** Does `JSON.parse` create a `__proto__` property?
**A:** Yes, as an own data property: `JSON.parse('{"__proto__": 1}')` has the own key `"__proto__"` and an unchanged prototype. The spec skips the object-literal special case during `ParseJSON`. The danger comes later, when code copies or merges those keys with assignment.

**Q:** Is `Object.create(null)` the same as `{ __proto__: null }`?
**A:** The result is the same. The literal sets `[[Prototype]]` as syntax; it doesn't call the `__proto__` setter, and it only works as a non-computed key.

## Exercises

### Predict the output

```js
const plain = {};
const bare = Object.create(null);
plain.__proto__ = { admin: true };
bare.__proto__ = { admin: true };
console.log(plain.admin, bare.admin);
console.log(Object.keys(plain), Object.keys(bare));
console.log('valueOf' in plain, 'valueOf' in bare);
```

**Answer:** `true undefined`, then `[] [ '__proto__' ]`, then `true false`. On `plain`, the assignment hits the inherited `__proto__` setter, so `admin` becomes inherited and no key is added. On `bare` there's no setter, so `__proto__` becomes an own property and `admin` is not reachable through it.
