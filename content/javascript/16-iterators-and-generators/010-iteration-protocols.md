---
title: "What are the iteration protocols?"
status: draft
difficulty: medium
frequency: 4
core: true
tags: [iterator, iterable, symbol-iterator, for-of, protocols, iterator-close]
related:
  - javascript/arrays/array-from-and-fromasync
  - javascript/metaprogramming/well-known-symbols
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-iteration
  - https://tc39.es/ecma262/#sec-getiterator
  - https://tc39.es/ecma262/#sec-iteratorclose
  - https://tc39.es/ecma262/#sec-runtime-semantics-forinofbodyevaluation
  - https://tc39.es/ecma262/#sec-runtime-semantics-bindinginitialization
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols
tldr: >
  An iterable has a `[Symbol.iterator]()` method that returns an iterator. An iterator has a `next()`
  method that returns `{ value, done }`, and optionally `return()` for cleanup. `for…of`, spread,
  destructuring, `Array.from`, `Map`, `Set` and `Promise.all` all consume that contract. Consumers that
  stop early call `return()`.
---

## Answer

Two small protocols, both duck-typed.

- **Iterable:** an object with a `[Symbol.iterator]()` method that returns an iterator. Each call should return a fresh iterator.
- **Iterator:** an object with a `next()` method that returns an IteratorResult, `{ value, done }`. While `done` is `false`, `value` is the next element. When `done` is `true`, iteration is over, and `value` is the optional return value (which `for…of` and spread ignore). A missing `done` counts as `false`.

An iterator may also have `return()` and `throw()`. `return()` is the important one: it means "I'm stopping early, release your resources."

Consumers all start the same way. They call `obj[Symbol.iterator]()` (spec: `GetIterator`), read `next` once, and call it until `done` is `true`. If the method is missing, they throw a `TypeError`. That covers `for…of`, spread, array destructuring, `yield*`, `Array.from`, `new Map(iterable)`, `new Set(iterable)`, `Promise.all` and `Object.fromEntries`. Plain objects are not iterable. `Object.entries(obj)` gives you an array, and arrays are.

Built-in iterators (from arrays, maps, generators) are themselves iterable, because they inherit `Iterator.prototype[Symbol.iterator]`, which returns `this`. A hand-written iterator is not iterable unless you add that method.

Early exit matters. If a consumer stops before `done` (`break`, `return`, or a `throw` in the loop body), it calls `iterator.return()`. Array destructuring does the same when the pattern is satisfied before the iterator is finished. Normal exhaustion does not call `return()`.

Generators are the usual way to write iterators; this question is about the contract they implement.

## Example

```js
class LinkedList {
  #head = null;
  push(value) {
    this.#head = { value, next: this.#head };
    return this;
  }

  [Symbol.iterator]() {
    let node = this.#head;
    return {
      next() {
        if (node === null) return { value: undefined, done: true };
        const { value } = node;
        node = node.next;
        return { value, done: false };
      },
      return() {
        console.log('closed');
        node = null;
        return { value: undefined, done: true };
      },
    };
  }
}

const list = new LinkedList().push('c').push('b').push('a');
console.log([...list]); // → [ 'a', 'b', 'c' ]
const [first] = list; // → closed
console.log(first); // → a
for (const item of list) if (item === 'b') break; // → closed
```

## Pitfalls

- Returning the same iterator object from every `[Symbol.iterator]()` call. The second `for…of` then continues where the first stopped (or sees nothing). Create fresh state per call, unless the object is deliberately single-use like a generator.
- Forgetting `return()`. A `break` then leaves a lock, file handle or stream open, because nothing tells the iterator the loop is over.
- Passing an iterator where an iterable is needed. `{ next() {…} }` without `[Symbol.iterator]` throws a `TypeError` in `for…of`. Built-in iterators work because they inherit one.
- Returning a non-object from `next()` or `return()`. A non-object result from `next()` throws a `TypeError`. A non-object result from `return()` throws one too, but only when the loop is not already throwing.

## Follow-ups

**Q:** Is an array an iterator?
**A:** No. It is an iterable. `array[Symbol.iterator]()` returns a separate Array Iterator, which has `next()`. That is why you can loop over the same array twice.

**Q:** Why does `const [a, b] = iterable` call `return()` on a two-element iterator?
**A:** Destructuring stops after two `next()` calls without ever seeing `done: true`, so the iterator is not finished, and the spec closes it.

**Q:** What does `throw()` do?
**A:** It tells the iterator the caller hit an error. `for…of` never calls it. `yield*` forwards it to the inner iterator, and generators implement it (see the generator question).

## Deep dive

### How it works

The spec wraps an iterator in an Iterator Record with three fields: `[[Iterator]]`, `[[NextMethod]]` and `[[Done]]`. `GetIterator(obj, sync)` looks up `@@iterator` with `GetMethod`, throws a `TypeError` if it is `undefined`, calls it, and requires an object back. `GetIteratorDirect` reads `next` once and stores it, so replacing `iterator.next` mid-loop has no effect on the running loop.

Each step is `IteratorStepValue`: call `[[NextMethod]]`, require an object result (`TypeError` otherwise), read `done`, and if it is not true read `value`. If `next` throws, or `done` or `value` throws on a getter, `[[Done]]` is set to `true`. A broken iterator is never asked to close itself.

`IteratorClose(record, completion)` is where cleanup lives. It looks up `return` with `GetMethod` and, if present, calls it. The precedence rules are:

- If `return` is missing, the original completion stands.
- If the original completion is a throw, it wins: an error from `return()` is discarded.
- Otherwise an error from `return()` propagates, and a non-object result throws a `TypeError`.

`for…of` calls `IteratorClose` whenever the body completes abruptly: `break`, `return`, an outer `continue`, or an exception (including one thrown while binding the loop variable). Destructuring calls it when the binding ran to the end of the pattern while `[[Done]]` is still `false`.

### Edge cases

Which consumers close, using an iterator whose `return()` logs:

```js
const noisy = (n) => ({
  [Symbol.iterator]() {
    let i = 0;
    return {
      next: () => (i < n ? { value: i++, done: false } : { value: undefined, done: true }),
      return() { console.log('return called'); return {}; },
    };
  },
});

for (const x of noisy(2)) {} // exhausted: no return()
const [a, b] = noisy(2); // → return called
const [c, d, e] = noisy(2); // asked for a third, saw done: no return()
const [f] = noisy(2); // → return called
console.log([...noisy(2)]); // → [ 0, 1 ]
```

Exact-length destructuring (`[a, b]` on two elements) still closes, because the iterator has not yet reported `done`. That is harmless for arrays, but it matters for iterators with side effects.

Error precedence is observable:

```js
const failing = {
  [Symbol.iterator]() {
    return {
      next: () => ({ value: 1, done: false }),
      return() { throw new Error('cleanup failed'); },
    };
  },
};

try {
  for (const x of failing) throw new Error('body failed');
} catch (error) {
  console.log(error.message); // → body failed
}
try {
  for (const x of failing) break;
} catch (error) {
  console.log(error.message); // → cleanup failed
}
```

Other edges: iterators are not required to be restartable, and once `done` is `true` later `next()` calls "should" also return `done: true`, which the spec says is not enforced. The `value` of the final `done: true` result is dropped by `for…of`, spread and destructuring; only `yield*` and manual `next()` calls see it. A string iterates by code point, not by UTF-16 code unit, so `[...'a😀']` has two elements.

### Real-world scenario

An iterable that owns a resource: a lock held for the length of a scan. `return()` is what makes `break` safe.

```js
class Cursor {
  #rows;
  constructor(rows) { this.#rows = rows; }

  [Symbol.iterator]() {
    console.log('lock acquired');
    let i = 0;
    return {
      next: () => (i < this.#rows.length ? { value: this.#rows[i++], done: false } : this.#release()),
      return: () => this.#release(),
    };
  }

  #release() {
    console.log('lock released');
    return { value: undefined, done: true };
  }
}

for (const row of new Cursor(['r1', 'r2', 'r3'])) {
  if (row === 'r2') break;
}
// → lock acquired
// → lock released
```

Without `return()`, the `break` would leave the lock held. In practice you rarely write this by hand; a generator with `try…finally` gets the same behaviour (see the generator question).

### Trade-offs

Protocols over concrete types let one syntax work across every collection and lets you add new ones without changing consumers. The cost is that each step allocates an IteratorResult object, and that the lazy, single-pass nature surprises code that expects to re-read. For fixed-size data that you will index or measure, an array is simpler; reach for an iterable when the data is lazy, large, or has cleanup.

## Exercises

### Predict the output

```js
const iterable = {
  [Symbol.iterator]() {
    let n = 0;
    return {
      next: () => ({ value: n++, done: n > 3 }),
      return() { console.log('closed'); return {}; },
    };
  },
};
const [x, y] = iterable;
console.log(x, y);
for (const v of iterable) {
  if (v === 1) break;
}
console.log([...iterable].length);
```

**Answer:** `closed`, `0 1`, `closed`, `3`. Destructuring takes two values without seeing `done`, so it closes before the `console.log`. The `break` closes the second iterator. Spread runs a third, fresh iterator to exhaustion (three values, then `done`), so it does not close.
