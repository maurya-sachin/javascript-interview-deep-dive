---
title: "What do the comma operator, `void`, labels and `switch` fall-through do?"
status: draft
difficulty: medium
frequency: 2
core: false
tags: [operators, comma-operator, void, labels, switch, control-flow]
related:
  - javascript/operators-and-syntax/operator-precedence
  - javascript/operators-and-syntax/loop-statements
  - javascript/metaprogramming/eval-direct-indirect
  - javascript/this/lost-this-callbacks
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-comma-operator
  - https://tc39.es/ecma262/#sec-void-operator
  - https://tc39.es/ecma262/#sec-labelled-statements
  - https://tc39.es/ecma262/#sec-switch-statement
  - https://tc39.es/ecma262/#sec-runtime-semantics-caseblockevaluation
  - https://tc39.es/ecma262/#sec-runtime-semantics-caseclauseisselected
  - https://typescript-eslint.io/rules/no-floating-promises/
tldr: >
  The comma operator evaluates both operands and returns the right one. `void` evaluates its operand
  and returns `undefined`. A label names a statement so `break` can leave it, or `continue` can
  restart an outer loop. `switch` compares with strict equality, then runs from the first matching
  clause through every later one until `break`, `return` or `throw`.
---

## Answer

**Comma operator.** `a, b` evaluates `a`, calls `GetValue` on it (so getters still run), discards it, then evaluates and returns `b`. It's the lowest-precedence operator. Most commas in code aren't it: argument lists, array and object literals and `let a = 1, b = 2` are separators. Where you do see it: the update clause of `for (let i = 0, j = n - 1; i < j; i++, j--)`, and `(0, fn)()`, which calls `fn` without a `this` because the comma returns a value, not a reference (that's also how `(0, eval)(code)` becomes an indirect eval).

**`void`.** `void expr` evaluates `expr` and returns `undefined`. `void 0` is a short `undefined` that can't be shadowed. In current code it marks a discarded result: `() => void save()` returns nothing whatever `save` returns, and typescript-eslint's `no-floating-promises` accepts `void promise` as "deliberately not awaited" (a lint convention; rejections still go unhandled).

**Labels.** `name:` before a statement lets `break name` jump past the end of that statement — any statement, even a plain block — and `continue name` start the next iteration of a labelled loop. They're the clean way to leave nested loops. Labels don't cross function boundaries, so you can't `break` out of a `forEach` callback.

**`switch`.** The discriminant is evaluated once, then `case` expressions are evaluated top to bottom, lazily, and compared with `IsStrictlyEqual` — so `'1'` never matches `1` and `NaN` never matches anything. Execution starts at the first match and **falls through** every later clause until `break`, `return` or `throw`. `default` runs only when no `case` matches, but it can sit anywhere, and fall-through enters it in source order. The whole `{ … }` is one block scope, so `let` in two clauses collides.

## Example

```js
const obj = { name: 'obj', who() { return this?.name; } };
console.log((obj.who)(), (0, obj.who)()); // → obj undefined

let saved = false;
console.log(void (saved = true), saved); // → undefined true

const pairs = [];
outer: for (const a of [1, 2, 3]) {
  for (const b of [1, 2, 3]) {
    if (b === 2) continue outer; // next a
    if (a === 3) break outer;    // leave both loops
    pairs.push(`${a}${b}`);
  }
}
console.log(pairs); // → [ '11', '21' ]

const tried = [];
const at = (n) => (tried.push(n), n);
function run(v) {
  const out = [];
  switch (v) {
    case at(1): out.push(1);   // no break: falls through
    default: out.push('d');
    case at(2): out.push(2);
  }
  return out;
}
console.log(run(1), run(2), run('1')); // → [ 1, 'd', 2 ] [ 2 ] [ 'd', 2 ]
console.log(tried); // → [ 1, 1, 2, 1, 2 ]
```

## Pitfalls

- Reading every comma as the comma operator. `let a = 1, b = 2` is a declaration list; only expression commas evaluate and discard.
- Forgetting `break` and running the next clause too. Linters flag fall-through without a comment for a reason.
- Expecting `switch` to coerce. It uses strict equality, so a number from `parseInt` won't match `case '1'`.
- Declaring `let x` in two clauses (SyntaxError), or reading one clause's `let` from another (ReferenceError at run time: the binding exists but is uninitialised).

## Follow-ups

**Q:** Why does `(obj.method)()` keep `this` but `(0, obj.method)()` lose it?
**A:** Parentheses alone return the Reference unchanged, so the call still sees a base object. The comma operator calls `GetValue` on its right operand and returns the plain function value, so the call has no base and `this` is `undefined` (in strict code).

**Q:** How do you get per-clause scope in a `switch`?
**A:** Wrap the clause body in braces: `case 1: { const x = …; break; }`. Each block gets its own Declarative Environment Record, so names can repeat across clauses and nothing leaks between them.

**Q:** What does `switch (true)` do?
**A:** Each `case` expression is evaluated in order and compared to `true` with strict equality, so the first clause whose condition is exactly `true` runs. It works as an `if`/`else if` chain, but a truthy non-boolean such as `1` doesn't match.

## Exercises

### Predict the output

```js
const log = [];
const c = (n) => (log.push(n), n);
switch (2) {
  case c(1):
  case c(2): log.push('hit');
  case c(3): log.push('fell'); break;
  case c(4): log.push('never');
}
console.log(log);
```

**Answer:** `[ 1, 2, 'hit', 'fell' ]`. Case expressions are evaluated lazily until one matches: `c(1)` fails, `c(2)` matches. Fall-through then runs the next clause's statements without evaluating `c(3)`, and `break` stops before `c(4)`.

### Predict the output

```js
const x = (1, 2, 3);
console.log(x, void x, typeof void 0);
```

**Answer:** `3 undefined undefined`. The comma operator returns its last operand. `void x` evaluates `x` and returns `undefined`, and `typeof undefined` is the string `'undefined'`.
