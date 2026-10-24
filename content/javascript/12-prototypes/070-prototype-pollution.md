---
title: "What is prototype pollution, and how do you prevent it?"
status: draft
difficulty: hard
frequency: 4
core: true
tags: [prototypes, security, prototype-pollution, proto, deep-merge, nodejs]
related:
  - javascript/prototypes/prototype-chain
  - javascript/prototypes/proto-vs-prototype
  - javascript/prototypes/object-create-null
  - javascript/objects-and-properties/object-literal-syntax
  - javascript/objects-and-properties/freeze-seal-preventextensions
  - javascript/keyed-collections/map-vs-object
verified: 2026-10
perishable:
  - "Node.js 24 --disable-proto accepts delete or throw"
  - "Node.js --frozen-intrinsics is still experimental"
sources:
  - https://tc39.es/ecma262/#sec-ordinaryset
  - https://tc39.es/ecma262/#sec-ordinarysetwithowndescriptor
  - https://tc39.es/ecma262/#sec-object.prototype.__proto__
  - https://tc39.es/ecma262/#sec-set-object.prototype.__proto__
  - https://tc39.es/ecma262/#sec-json.parse
  - https://tc39.es/ecma262/#sec-runtime-semantics-propertydefinitionevaluation
  - https://tc39.es/ecma262/#sec-createdataproperty
  - https://tc39.es/ecma262/#sec-object.freeze
  - https://nodejs.org/docs/latest-v24.x/api/cli.html#--disable-protomode
  - https://nodejs.org/docs/latest-v24.x/api/cli.html#--frozen-intrinsics
  - https://github.com/advisories/GHSA-6c3j-c64m-qhgq
  - https://github.com/advisories/GHSA-jf85-cpcp-j695
tldr: >
  Prototype pollution is writing attacker-controlled properties onto a shared prototype, usually
  `Object.prototype`, so every object inherits them. It happens when code copies untrusted keys
  with `[[Set]]`: a `__proto__` key hits the inherited setter, `constructor.prototype` reaches it
  directly. Prevent it with key allow-lists, own-property checks, null-prototype objects or `Map`.
---

## Answer

Prototype pollution is a bug class where untrusted input adds or changes properties on a shared prototype — almost always `Object.prototype`. Every ordinary object then inherits the value, so code far away that reads an absent property (`options.isAdmin`, `config.template`) suddenly sees the attacker's value. The impact depends on those "gadgets": privilege checks, HTML rendering (XSS), or options passed to a process or template engine.

The usual sink is a recursive **merge, clone, or path setter** (`set(obj, 'a.b.c', v)`) that walks keys from input and assigns with `target[key] = value`. Two key paths reach the prototype:

1. **`__proto__`.** `JSON.parse('{"__proto__": {...}}')` creates an ordinary *own* property named `"__proto__"` — JSON parsing doesn't use the literal's special `__proto__` syntax. `Object.keys` lists it, so a merge copies it. But reading `target['__proto__']` on a normal object hits the inherited `Object.prototype.__proto__` getter and returns `Object.prototype`, and the merge then writes into it.
2. **`constructor.prototype`.** `target.constructor` is `Object` (inherited), and `Object.prototype` is the prototype. No accessor is involved, so removing `__proto__` doesn't stop this path.

Prevention, strongest first:

- **Validate input against a schema or key allow-list**, so unknown keys never reach a merge.
- **Never descend into or assign the keys `__proto__`, `constructor`, `prototype`**, and recurse only into the target's *own* properties (`Object.hasOwn`).
- **Use dictionaries without a prototype**: a `Map`, or `Object.create(null)` / `{ __proto__: null }` at every level you create.
- **Define, don't assign.** `Object.defineProperty`, spread and `Object.fromEntries` create own properties and never trigger the `__proto__` setter.
- **Hardening:** `Object.freeze(Object.prototype)` makes writes fail, and Node.js 24's `--disable-proto=delete` or `=throw` removes or locks the accessor. Both have costs and neither covers every path.

## Example

```js
function merge(target, source) {
  for (const key of Object.keys(source)) {
    const value = source[key];
    if (typeof value === 'object' && value !== null) {
      target[key] ??= {};
      merge(target[key], value); // recurses into whatever target[key] is
    } else {
      target[key] = value;
    }
  }
  return target;
}

const viaProto = JSON.parse('{"__proto__": {"isAdmin": true}}');
console.log(Object.keys(viaProto)); // → [ '__proto__' ]
merge({}, viaProto);
console.log({}.isAdmin); // → true
delete Object.prototype.isAdmin;

merge({}, JSON.parse('{"constructor": {"prototype": {"isAdmin": true}}}'));
console.log({}.isAdmin); // → true
delete Object.prototype.isAdmin;
```

## Pitfalls

- Blocking only `__proto__`. The `constructor.prototype` path needs no accessor at all.
- Making only the top-level target null-prototype. A merge that creates nested `{}` objects is vulnerable again one level down.
- Checking `if (obj.isAdmin)` on objects built from input. Use `Object.hasOwn`, or a null-prototype object, so inherited values don't count.
- Assuming `JSON.parse` is the vulnerability. It only creates an own key; the bug is code that later copies it with `[[Set]]`.

## Follow-ups

**Q:** Why doesn't `{ __proto__: x }` in my source code cause this?
**A:** In a literal, a non-computed `__proto__: x` is special syntax that sets the new object's prototype and creates no own property, so there's nothing for `Object.keys` to return. Only data that arrives as an own key — from `JSON.parse`, a computed key, or a query-string parser — becomes dangerous.

**Q:** Is `Object.freeze(Object.prototype)` a complete fix?
**A:** It blocks writes to that one prototype, but other shared prototypes (`Array.prototype`, `Function.prototype`) stay writable. It also triggers the "override mistake": assigning `obj.toString = …` on any object fails, which breaks some libraries.

**Q:** Has this affected real libraries?
**A:** Yes. jQuery before 3.4.0 copied an enumerable `__proto__` key in `jQuery.extend(true, {}, …)` (CVE-2019-11358), and lodash before 4.17.12 let `defaultsDeep` reach `Object.prototype` through `{constructor: {prototype: …}}` (CVE-2019-10744).

## Deep dive

### How it works

`target[key] = value` is a `[[Set]]`. `OrdinarySet` looks for `key` along the prototype chain; if it finds an accessor there, it calls the setter instead of creating an own property. `Object.prototype.__proto__` is exactly such an accessor — a legacy, normative-optional one in the spec — and its getter returns the receiver's prototype. So the merge's `target['__proto__']` read returns `Object.prototype`, and the recursive call writes into it.

JSON is different by design. `JSON.parse` evaluates its text as an object literal with the `__proto__` rule switched off, so it creates an own data property named `"__proto__"`. The danger is created later, when that key is copied with `[[Set]]`. `CreateDataProperty` — used by spread and `Object.fromEntries` — defines the own property directly and never consults the setter.

The `constructor` path is plainer: reading `target.constructor` finds the inherited `Object`, and `Object.prototype` is an ordinary property. The merge never needed `__proto__` at all.

### Edge cases

A null-prototype target only protects the level it's on:

```js
function merge(target, source) { // same as the Example
  for (const key of Object.keys(source)) {
    const value = source[key];
    if (typeof value === 'object' && value !== null) merge((target[key] ??= {}), value);
    else target[key] = value;
  }
  return target;
}
merge(Object.create(null), JSON.parse('{"__proto__": {"isAdmin": true}}'));
console.log({}.isAdmin); // → undefined
merge(Object.create(null), JSON.parse('{"nested": {"__proto__": {"isAdmin": true}}}'));
console.log({}.isAdmin); // → true
```

The first merge stores `__proto__` as an ordinary key on a dictionary. The second creates `target.nested = {}`, a normal object, and the payload one level down hits its inherited `__proto__` accessor.

Node.js's `--disable-proto=delete` removes `Object.prototype.__proto__`, so the first path just creates an own key, but the `constructor.prototype` payload still pollutes. With `--disable-proto=throw`, any use of the accessor throws an error with code `ERR_PROTO_ACCESS`. Neither changes the literal syntax: `{ __proto__: null }` still works.

### Real-world scenario

A safe merge for configuration objects combines the cheap defences:

```js
const BLOCKED = new Set(['__proto__', 'constructor', 'prototype']);
function safeMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (BLOCKED.has(key)) continue;
    const value = source[key];
    if (typeof value === 'object' && value !== null) {
      if (!Object.hasOwn(target, key)) target[key] = {}; // never descend into inherited values
      safeMerge(target[key], value);
    } else {
      target[key] = value;
    }
  }
  return target;
}
console.log(safeMerge({}, JSON.parse('{"__proto__": {"x": 1}, "a": {"b": 1}}')), {}.x); // → { a: { b: 1 } } undefined
```

In production, validate the payload against a schema first (only known keys and types pass), then merge. When the data really is a dictionary keyed by user input — tags, headers, per-user counters — store it in a `Map`, which has no inherited keys to collide with.

### Trade-offs

Deny-lists are easy to add to an existing merge but fragile: they must cover every write path, including path-string setters (`'a.__proto__.b'`). Allow-lists and schemas are robust but need upkeep as the shape changes. Null-prototype objects and `Map`s remove the problem for dictionaries, at the cost of no inherited methods and a different API. Freezing `Object.prototype`, or Node.js's experimental `--frozen-intrinsics`, is a strong backstop for applications that control all their code, but it breaks libraries that assign over inherited properties, so test before enabling it.

## Exercises

### Does this pollute?

```js
const input = JSON.parse('{"__proto__": {"polluted": true}}');
const copy = { ...input };
const assigned = Object.assign({}, input);
console.log({}.polluted, Object.hasOwn(copy, '__proto__'), assigned.polluted);
```

**Answer:** `undefined true true`. Neither pollutes `Object.prototype`. Spread defines `__proto__` as an own property of `copy`. `Object.assign` uses `[[Set]]`, so it hits the setter and replaces the prototype of `assigned` alone, which now inherits `polluted`. Global pollution needs a deep merge that writes *into* the object the getter returns.
