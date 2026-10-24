---
title: "`for…in` vs `for…of` vs `forEach` — when do you use each?"
status: draft
difficulty: easy
frequency: 4
core: false
tags: [loops, for-in, for-of, foreach, iteration, async]
related:
  - javascript/iterators-and-generators/iteration-protocols
  - javascript/objects-and-properties/enumerating-properties
  - javascript/async-and-the-event-loop/sequential-vs-parallel-await
  - javascript/arrays/sparse-arrays
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-for-in-and-for-of-statements
  - https://tc39.es/ecma262/#sec-enumerate-object-properties
  - https://tc39.es/ecma262/#sec-runtime-semantics-forinofheadevaluation
  - https://tc39.es/ecma262/#sec-array.prototype.foreach
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
tldr: >
  `for…in` walks enumerable string keys of an object and its prototype chain, as strings.
  `for…of` walks the values produced by an iterable's iterator, and supports `break`, `return`,
  and `await`. `forEach` is an array method that calls a callback per element; it can't `break`,
  skips holes, and never waits for async callbacks.
---

## Answer

- **`for…in`** enumerates **string keys** of **enumerable** properties, including those inherited through the prototype chain; symbols and non-enumerable properties are skipped. Keys are always strings (array indexes too). Each object's own keys come in `[[OwnPropertyKeys]]` order (integer-like keys ascending, then insertion order), then its prototype's; the spec drops that guarantee when a Proxy, TypedArray or other listed exotic object is on the chain, or the chain changes mid-loop. It runs on `null`/`undefined` as a no-op. It is meant for plain-object keys; for arrays it also visits extra properties, and anything added to `Array.prototype` shows up.
- **`for…of`** works on any **iterable** (arrays, strings, `Map`, `Set`, generators, `arguments`, DOM collections). It calls `[Symbol.iterator]()` and gives you the *values*. A plain object is not iterable, so `for (x of {})` throws `TypeError`. It supports `break`, `continue`, `return`, and `await` inside an `async` function, and on early exit it calls the iterator's `return()` so generators can clean up.
- **`forEach`** is `Array.prototype.forEach(callback)` (also on `Map`, `Set`, `NodeList`). It reads indexes `0…length-1` captured at the start, skips holes, and ignores the callback's return value. You can't `break`, and `return` only ends that one callback. It is synchronous: an `async` callback returns a promise that `forEach` discards, so nothing waits for it and rejections go unhandled.

**Pick:** values of an array or other iterable, especially with `break` or `await` → `for…of`. Keys of an object → `Object.keys/entries` with `for…of`, since `for…in` includes inherited keys. Plain side effects over a whole array with a short callback → `forEach` is fine. For async work: sequential → `for…of` with `await`; concurrent → `Promise.all(array.map(…))`.

Variables declared with `let`/`const` in a `for…in`/`for…of` head get a fresh binding per iteration, so closures capture each iteration's value.

## Example

```js
const parent = { inherited: 1 };
const obj = Object.create(parent);
obj.b = 2;
obj[1] = 'one';
Object.defineProperty(obj, 'hidden', { value: 1 }); // non-enumerable
obj[Symbol('id')] = 1; // symbol key

const keys = []; for (const key in obj) keys.push(key);
console.log(keys); // → [ '1', 'b', 'inherited' ]
console.log(Object.keys(obj)); // → [ '1', 'b' ]

const letters = ['x', 'y'];
letters.extra = true;
const indexes = []; for (const key in letters) indexes.push(key);
console.log(indexes); // → [ '0', '1', 'extra' ]

[1, 2].forEach(async (n) => {
  await null;
  console.log('forEach', n);
});
console.log('after forEach');
for (const n of [1, 2]) {
  await null; // for…of really waits
  console.log('for…of', n);
}
// → after forEach
// → forEach 1
// → forEach 2
// → for…of 1
// → for…of 2
```

## Pitfalls

- Using `for…in` on arrays. Indexes come back as strings (`'0' + 1` is `'01'`), and extra properties like `arr.extra` or enumerable ones added to `Array.prototype` are visited too.
- Putting `await` in a `forEach` callback and expecting the loop to pause. The code after `forEach` runs immediately. Use `for…of`, or `await Promise.all(items.map(…))` for parallel work.
- Reaching for `forEach` and then wanting early exit. `return` in the callback is a `continue`. Use `for…of`, or `some`/`every`/`find`, which stop on their own.
- Mutating the array while looping. `forEach` visits only the original length (elements pushed during it are skipped), while `for…of` sees pushed elements and can loop forever.

## Follow-ups

**Q:** How do you loop over an object's own entries?
**A:** `for (const [key, value] of Object.entries(obj))`. It uses only own enumerable string keys and gives you key and value without `for…in`'s inherited keys or a `hasOwn` check.

**Q:** What does `for await…of` do?
**A:** It iterates an async iterable, or a sync iterable of promises, awaiting each step. Use it for streams and async generators.

**Q:** Does `break` in `for…of` do anything to the iterable?
**A:** Yes, it calls `iterator.return()` if it exists. A generator's `finally` block runs; an array iterator has no `return`, so nothing happens.

## Exercises

### Predict the output

```js
const items = [1, 2, 3];
let visited = 0;
items.forEach((n) => {
  visited++;
  if (n === 1) items.push(4);
});
console.log(visited, items.length);
```

**Answer:** `3 4`. `forEach` fixes its range to the original length (3) before the first callback, so the pushed `4` is never visited, but it is added to the array. A `for…of` loop would visit it as well.

### Fix the bug

```js
async function saveAll(users, save) {
  users.forEach(async (user) => {
    await save(user);
  });
  console.log('saved');
}
```

**Answer:** `'saved'` logs before any `save` finishes, and a failed `save` becomes an unhandled rejection. For sequential saves use `for (const user of users) await save(user);`. For concurrent saves use `await Promise.all(users.map(save));`. Either way the `await` now makes `'saved'` mean what it says.
