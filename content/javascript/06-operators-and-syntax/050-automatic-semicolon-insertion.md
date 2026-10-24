---
title: "How does automatic semicolon insertion work, and when does it bite?"
status: draft
difficulty: medium
frequency: 2
core: false
tags: [asi, semicolons, syntax, restricted-productions, parsing]
related:
  - javascript/operators-and-syntax/loop-statements
  - javascript/functions/function-forms
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-let-and-const-declarations
  - https://tc39.es/ecma262/#sec-automatic-semicolon-insertion
  - https://tc39.es/ecma262/#sec-rules-of-automatic-semicolon-insertion
  - https://tc39.es/ecma262/#sec-interesting-cases-of-automatic-semicolon-insertion
  - https://tc39.es/ecma262/#sec-comments
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#automatic_semicolon_insertion
tldr: >
  The parser inserts a semicolon only where the next token is illegal and follows a newline,
  is `}`, or ends the input, or where a newline breaks a restricted production (`return`,
  `throw`, `break`, `continue`, postfix `++`/`--`). A newline alone never ends a statement, so
  a line starting with `(`, `[`, or a backtick continues the previous one.
---

## Answer

ASI is a parser repair rule, not "newlines end statements". The spec defines three cases:

1. **Offending token.** The parser reads left to right. If it meets a token the grammar doesn't allow there, it inserts a `;` before that token if (a) there's a line terminator between it and the previous token, (b) the token is `}`, or (c) the previous token is `)` and the `;` would end a `do…while`.
2. **End of input.** If the token stream ends and the program isn't complete, a `;` is added.
3. **Restricted productions.** After a few keywords, `[no LineTerminator here]` forbids a newline: `return`, `throw`, `break`, `continue`, `yield`, postfix `++`/`--`, and the `=>` of an arrow function (and `async` before `function`). ES2027 adds `using` and `await using`: `using⏎x = r` reads `using` as an identifier. A line break there makes the parser insert a `;` even though the next token would have been legal.

Two overriding limits: a `;` is never inserted if it would become an empty statement, or one of the two semicolons in a `for(;;)` header.

**When it bites:**

- **`return` followed by a newline** returns `undefined`; the value on the next line is dead code. Keep the value, or an opening `(`/`{`, on the `return` line.
- **A line starting with `(`, `[`, a template literal, `+`, `-`, or `/`** is a legal continuation, so no `;` is inserted and the two lines merge into a call, property access, tagged template, or binary expression. Use a semicolon on the previous line, or in "no-semicolon" code style, a leading `;` on these lines.
- **`a` newline `++b`** parses as `a; ++b`, because postfix `++` is restricted.

The reverse also exists: ASI can't fix real syntax errors, so `for (let i = 0⏎i < 3⏎i++)` is a `SyntaxError`.

## Example

```js
const run = (source) => {
  try {
    return new Function(source)();
  } catch (error) {
    return error.name;
  }
};

console.log(run('return\n{ ok: true }')); // → undefined
console.log(run('let a = 1, b = 2\nlet r = a\n++b\nreturn [a, b, r]')); // → [ 1, 3, 1 ]
console.log(run('const s = "a"\n[1].map(String)')); // → TypeError
console.log(run('const s = "a"\n;[1].map(String)\nreturn s')); // → a
console.log(run('throw\nnew Error("x")')); // → SyntaxError
console.log(run('for (let i = 0\ni < 3\ni++) {}')); // → SyntaxError
console.log(run('return /*\n*/ 5')); // → undefined
console.log(run('do {} while (false) return 3')); // → 3
```

## Pitfalls

- Believing "JavaScript ends a statement at a newline". It doesn't; it inserts a `;` only where the grammar would otherwise fail (or at a restricted production).
- Writing `return` and putting the object, array, or parenthesised expression on the next line. A bare `return` is a complete statement.
- Multi-line comments: a `/* … */` comment that contains a line break counts as a line terminator, so `return /*⏎*/ 5` returns `undefined`.
- Skipping semicolons without a plan. A statement beginning with `(`, `[`, `` ` ``, `+`, `-`, or `/` silently joins the line above it. Teams that omit semicolons need a lint rule or the leading-`;` habit; teams that keep them still need to know the `return`, `throw`, `break`, `continue`, and `++` cases.

## Follow-ups

**Q:** Is the `;` after `do…while (cond)` ever optional?
**A:** Yes. Rule 1(c) inserts it after `)` in a `do…while`, so `do {} while (false) foo()` on one line is valid. It's a special case the spec lists separately.

**Q:** Why isn't ASI applied in `for (a⏎b⏎c)`?
**A:** The override rule forbids a `;` that would become one of the two header semicolons, so the parser reports a `SyntaxError` instead.

**Q:** Are semicolons required to avoid ASI bugs?
**A:** Not required, but they remove the guesswork from lines that start with `(` or `[`. Restricted productions (`return⏎value`) still need care either way.

## Exercises

### Predict the output

```js
let a = 1
let b = 2
a
++
b
console.log(a, b)
```

**Answer:** `1 3`. Postfix `++` forbids a line break before it, so `a` ends at the newline and `++b` is a separate prefix increment.

### Fix the bug

```js
const names = ['Ada', 'Grace']
[0, 1].forEach((i) => console.log(names[i]))
```

**Answer:** It throws `TypeError`. There is no `;` after the first line, so it parses as `['Ada', 'Grace'][0, 1].forEach(…)`. The comma expression evaluates to `1`, so the code calls `forEach` on the string `'Grace'`. End the first line with `;` (or start the second with `;`), and it logs `Ada` then `Grace`.
