---
title: "Which well-known symbols let you customize built-in behavior?"
status: draft
difficulty: medium
frequency: 2
core: false
tags: [symbols, well-known-symbols, iterator, toprimitive, hasinstance, species, metaprogramming]
related:
  - javascript/metaprogramming/proxy-traps-invariants
  - javascript/iterators-and-generators/iteration-protocols
  - javascript/coercion-and-equality/object-to-primitive
  - javascript/prototypes/instanceof
  - javascript/errors-and-cleanup/explicit-resource-management
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-well-known-symbols
  - https://tc39.es/ecma262/#sec-toprimitive
  - https://tc39.es/ecma262/#sec-instanceofoperator
  - https://tc39.es/ecma262/#sec-object.prototype.tostring
  - https://tc39.es/ecma262/#sec-symbol.species
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol#well-known_symbols
tldr: >
  Well-known symbols are built-in `Symbol.*` values the spec uses as property keys for extension points. Define the
  property and the built-in calls it: `iterator` for `for…of` and spread, `toPrimitive` for coercion, `hasInstance`
  for `instanceof`, `toStringTag` for `Object.prototype.toString`, `species`, `isConcatSpreadable`, the regex-protocol
  four, and `unscopables`.
---

## Answer

Well-known symbols are built-in symbol values, stored as `Symbol.iterator` and so on, that the specification uses as **property keys for hooks**. A built-in algorithm looks up that key on your object. If you define it, your code runs. Symbols avoid collisions with string-named properties, and they are shared across realms (not in the global symbol registry).

| Symbol | Consulted by | You define |
|---|---|---|
| `iterator` | `for…of`, spread, destructuring, `Array.from`, `Promise.all` | method returning an iterator |
| `asyncIterator` | `for await…of` | method returning an async iterator |
| `toPrimitive` | `ToPrimitive`: `+`, template literals, relational operators | `(hint) => primitive`, hint `"string"`, `"number"` or `"default"` |
| `hasInstance` | `instanceof` | static `(value) => boolean` |
| `toStringTag` | `Object.prototype.toString` | string |
| `species` | methods that build a new instance, such as `Array.prototype.map` | static getter returning a constructor |
| `isConcatSpreadable` | `Array.prototype.concat` | boolean |
| `match`, `matchAll`, `replace`, `search`, `split` | the matching `String.prototype` methods, and `IsRegExp` | method on any object |
| `unscopables` | `with` statements | object of names to hide |
| `dispose`, `asyncDispose` | `using` and `await using` | cleanup method |

Details interviewers probe: `toPrimitive` replaces `valueOf`/`toString` (when absent, `OrdinaryToPrimitive` calls them in an order that depends on the hint), and `Date` treats the default hint as `"string"`. `hasInstance` is looked up first, so it overrides the prototype-chain check. `toStringTag` only changes the tag in `[object X]`, and does not change `typeof`. `species` lets a subclass opt out of `map` and `filter` returning the subclass.

## Example

```js
class Temperature {
  constructor(celsius) {
    this.celsius = celsius;
  }
  [Symbol.toPrimitive](hint) {
    return hint === 'string' ? `${this.celsius}°C` : this.celsius;
  }
  get [Symbol.toStringTag]() {
    return 'Temperature';
  }
  static [Symbol.hasInstance](value) {
    return typeof value?.celsius === 'number';
  }
  *[Symbol.iterator]() {
    yield this.celsius;
    yield (this.celsius * 9) / 5 + 32;
  }
}

const t = new Temperature(20);
console.log(`${t}`, t + 1, t > 10);
// → 20°C 21 true
console.log(Object.prototype.toString.call(t));
// → [object Temperature]
console.log({ celsius: 5 } instanceof Temperature, {} instanceof Temperature);
// → true false
console.log([...t]);
// → [ 20, 68 ]
```

## Pitfalls

- Returning an object from `[Symbol.toPrimitive]`. The result must be a primitive, or the conversion throws `TypeError`.
- Overriding `Symbol.hasInstance` for type checks that should use the prototype chain. It changes `instanceof` for everyone who uses the class, and a custom check can disagree with `Object.getPrototypeOf`.
- Using `Object.prototype.toString` as a reliable type test. Any object can set `Symbol.toStringTag`, and the spec itself says this test is not reliable for program-defined objects.
- Forgetting that `Symbol.species` affects subclasses of `Array`, `Promise` and others. A subclass whose constructor has a different signature breaks `map`, `slice` or `then` unless species is overridden.

## Follow-ups

**Q:** Which hint does `` `${obj}` `` use, and which does `obj + 1`?
**A:** The template literal uses `"string"`. `+` uses `"default"`. Relational operators and `*` use `"number"`.

**Q:** Why doesn't `Symbol.for('Symbol.iterator')` give `Symbol.iterator`?
**A:** The well-known symbols are not in the global registry. `Symbol.for` creates a different symbol with that description, and `Symbol.keyFor(Symbol.iterator)` returns `undefined`.

**Q:** What is `Symbol.unscopables` for?
**A:** It lets `with` skip names added to a built-in after code already relied on the outer variable. `Array.prototype[Symbol.unscopables]` lists methods such as `values` and `flat`.

## Deep dive

### How it works

Each hook is an ordinary `Get` of the symbol from the object (or its prototype chain), followed by a call.

- **`ToPrimitive`** first calls `GetMethod(input, %Symbol.toPrimitive%)`. If it exists, the result must not be an object. If not, it runs `OrdinaryToPrimitive`: `toString` then `valueOf` for hint `"string"`, `valueOf` then `toString` otherwise. Of the built-ins, only `Date` and `Symbol` objects define their own: `Date` treats `"default"` as `"string"`, so `new Date(0) + 1` concatenates.
- **`instanceof`** calls `GetMethod(target, %Symbol.hasInstance%)`; if present, it returns `ToBoolean(Call(...))`. If absent it falls back to the prototype-chain walk (`OrdinaryHasInstance`). `Function.prototype[Symbol.hasInstance]` is non-writable and non-configurable, so `class A { static [Symbol.hasInstance]() {} }` works (a static method defines an own property) but plain assignment `A[Symbol.hasInstance] = …` does not.
- **`Object.prototype.toString`** picks a built-in tag from internal slots (`Array`, `Function`, `Error`, `Date`, …), then reads `Symbol.toStringTag`. If it's a string it replaces the built-in tag. That is how `Map`, `Promise` and generators print `[object Map]`, `[object Promise]`, `[object Generator]`.
- **Species**: `ArraySpeciesCreate` reads `constructor`, then `constructor[Symbol.species]`. The spec uses species for arrays, typed arrays, `ArrayBuffer`, `Promise` and `RegExp`.

### Edge cases

The regex protocol makes any object a "pattern", and `IsRegExp` reads `Symbol.match` as well. That is why `startsWith` rejects regexes, and why you can opt a regex out:

```js
const re = /a/;
try {
  'a/'.startsWith(re);
} catch (e) {
  console.log(e.constructor.name);
}
// → TypeError
re[Symbol.match] = false;
console.log('/a/'.startsWith(re));
// → true
```

Species and `concat`:

```js
class Plain extends Array {
  static get [Symbol.species]() {
    return Array;
  }
}
const p = Plain.from([1, 2, 3]);
console.log(p.map((x) => x) instanceof Plain, p.filter(Boolean).constructor.name);
// → false Array
const spread = { length: 2, 0: 'a', 1: 'b', [Symbol.isConcatSpreadable]: true };
console.log([0].concat(spread));
// → [ 0, 'a', 'b' ]
```

`unscopables` only matters in sloppy-mode `with` (CommonJS here). Running `with ([1, 2]) { typeof values }` gives `'undefined'` in Node.js 24, because `values` is listed in `Array.prototype[Symbol.unscopables]` and so is skipped, and the lookup goes outward. A `with` object can add its own: `{ a: 1, [Symbol.unscopables]: { a: true } }` hides `a` and `with (obj) { a }` reads the outer `a`.

Async iteration works the same as sync: `for await (const v of { async *[Symbol.asyncIterator]() { yield 'x'; } })`.

### Trade-offs

These hooks make an object feel built in, but they are global behaviour changes for that class: `toPrimitive` affects every `+` and template, and `hasInstance` every `instanceof`. Use them where the object really is a primitive-like value, a collection, or a pattern. For a one-off conversion an explicit method (`toCelsius()`, `matches(x)`) is clearer. `Symbol.dispose` and `Symbol.asyncDispose` belong to explicit resource management; see that question.

## Exercises

### Hint order

```js
const money = {
  [Symbol.toPrimitive](hint) {
    return hint === 'number' ? 42 : hint;
  },
};
console.log(`${money}`, money + '', +money, money * 2);
```

**Answer:** `string default 42 84`. Template literal: `"string"`. `money + ''`: `"default"`. Unary `+` and `*`: `"number"`.

### Custom `instanceof`

```js
class Even {
  static [Symbol.hasInstance](n) {
    return n % 2 === 0;
  }
}
console.log(2 instanceof Even, 3 instanceof Even);
```

**Answer:** `true false`. The right-hand side is looked up for `Symbol.hasInstance` first, and primitives are allowed as the left-hand side because the method receives the value untouched.
