---
title: "Which precedence and associativity rules trip people up?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [operators, precedence, associativity, exponentiation, nullish-coalescing, grammar]
related:
  - javascript/operators-and-syntax/nullish-and-optional-chaining
  - javascript/coercion-and-equality/addition-operator-coercion
  - javascript/coercion-and-equality/relational-comparison
  - javascript/operators-and-syntax/comma-void-labels-switch
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-ecmascript-language-expressions
  - https://tc39.es/ecma262/#sec-exp-operator
  - https://tc39.es/ecma262/#sec-binary-logical-operators
  - https://tc39.es/ecma262/#sec-conditional-operator
  - https://tc39.es/ecma262/#sec-evaluatestringornumericbinaryexpression
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_precedence
tldr: >
  Precedence decides how operands group; associativity decides grouping among equals. Most binary
  operators are left-associative, but `**`, `?:` and assignment group right. Grouping never changes
  evaluation order: operands still run left to right. The traps: `+` beats `?:`, `!` beats `in`
  and `instanceof`, `-2 ** 2` and unparenthesised `??` with `||`/`&&` are SyntaxErrors.
---

## Answer

The spec has no precedence table. Precedence falls out of the expression grammar: each level is a nonterminal built from the next tighter one, from `AssignmentExpression` down through `ConditionalExpression`, `ShortCircuitExpression`, the logical, bitwise, equality, relational, shift, additive, multiplicative and exponentiation levels, to unary, update and member/call expressions. MDN's table summarises that grammar.

**Associativity** settles chains of one level. Most binary operators are left-associative: `1 + 2 + '3'` is `(1 + 2) + '3'`, `'33'`. Three groups are right-associative: `**` (`2 ** 3 ** 2` is `2 ** 9`), the conditional operator (so `a ? b : c ? d : e` chains like `else if`), and assignment (`a = b = 5`).

**Grouping is not evaluation order.** `f() + g() * h()` multiplies first, but binary operators evaluate their left operand before their right (for arithmetic, that's step 1 of `EvaluateStringOrNumericBinaryExpression`), so the calls still run `f`, `g`, `h`.

The rules people actually get wrong:

- `'Role: ' + isAdmin ? 'admin' : 'user'` — `+` binds tighter than `?:`, so the condition is the non-empty string and the result is always `'admin'`.
- `!key in obj` and `!x instanceof C` — unary `!` binds tighter, so you test `false in obj` or `false instanceof C`.
- `x & 1 === 0` — equality binds tighter than bitwise AND, giving `x & false`.
- `typeof x === 'string'` works because `typeof` is unary and binds tighter than `===`.

Two mixes are rejected outright. `-2 ** 2` is a SyntaxError: `**`'s left operand must be an update expression, not a unary one, so you must write `(-2) ** 2` or `-(2 ** 2)`. And `??` can't share a chain with `||` or `&&` without parentheses: the grammar puts `CoalesceExpression` and `LogicalORExpression` side by side, so neither contains the other.

## Example

```js
console.log(1 + 2 * 3);               // → 7
console.log(typeof 'x' === 'string'); // → true

// Left-associative: same-level operators group left to right
console.log(1 + 2 + '3', '1' + 2 + 3); // → 33 123

// Right-associative: 2 ** (3 ** 2), and ?: chains like else-if
console.log(2 ** 3 ** 2); // → 512
const size = (n) => n < 10 ? 'S' : n < 100 ? 'M' : 'L';
console.log(size(5), size(50), size(500)); // → S M L

// + binds tighter than ?:, so the condition is the whole string
const isAdmin = false;
console.log('Role: ' + isAdmin ? 'admin' : 'user'); // → admin

// Grouping is not evaluation order: operands run left to right
const seen = [];
const v = (n) => (seen.push(n), n);
console.log(v(1) + v(2) * v(3), seen); // → 7 [ 1, 2, 3 ]

// Mixes the grammar rejects
const parses = (src) => {
  try { new Function(src); return 'ok'; } catch (e) { return e.name; }
};
console.log(parses('-2 ** 2'), parses('(-2) ** 2'));         // → SyntaxError ok
console.log(parses('a ?? b || c'), parses('(a ?? b) || c')); // → SyntaxError ok
```

## Pitfalls

- Assuming precedence decides which operand runs first. It only decides grouping; side effects still happen left to right.
- Writing `!key in obj` or `!(x) instanceof C`. Negate the whole test: `!(key in obj)`.
- Concatenating into a conditional (`'a' + cond ? x : y`) or into `??` (`'n: ' + count ?? 0`). Parenthesise the right-hand part.
- Expecting `-x ** 2` to mean `-(x ** 2)` as in maths or Python. JavaScript refuses to guess and throws a SyntaxError; `typeof x ** 2` and `await x ** 2` are rejected for the same reason.

## Follow-ups

**Q:** Why does `3 > 2 > 1` give `false`?
**A:** Relational operators are left-associative, so it's `(3 > 2) > 1`, which is `true > 1`. `true` converts to `1`, and `1 > 1` is `false`. Chained comparisons don't mean "between" in JavaScript.

**Q:** Why is `a && b || c` allowed but `a ?? b || c` not?
**A:** `&&` is a level inside the `||` grammar, so `a && b || c` parses as `(a && b) || c`. `??` sits beside `||` in `ShortCircuitExpression`, not inside it, so a chain mixing them has no parse. The grammar makes you add parentheses instead of picking an order.

**Q:** Does `new Foo.Bar()` construct `Foo` or `Foo.Bar`?
**A:** `Foo.Bar`. Member access binds as part of the `new` expression, so the whole `Foo.Bar` is the constructor and `()` is its argument list. To construct the result of a call, write `new (getClass())()`.

## Exercises

### Predict the output

```js
const count = 0;
console.log('Items: ' + count ?? 'none');
console.log(3 > 2 > 1, 1 < 2 < 3);
```

**Answer:** `Items: 0`, then `false true`. `+` binds tighter than `??`, so the left side is the string `'Items: 0'`, which isn't nullish. The comparisons group left: `(3 > 2) > 1` is `true > 1`, `false`; `(1 < 2) < 3` is `true < 3`, `true`.

### Fix the bug

```js
const n = 4;
const isEven = n & 1 === 0;
console.log(isEven);
```

**Answer:** It prints `0`, because `===` binds tighter than `&`, so it computes `4 & false`, and `false` converts to `0`. Write `(n & 1) === 0`, which is `true`.
