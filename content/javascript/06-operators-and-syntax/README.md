# 06 — Operators and syntax

> **Status:** 🔴 planned · **Published:** 0/7 · **Last verified:** —

Everyday syntax interviewers probe: destructuring, spread and rest, short-circuiting operators, loops, and semicolons.

## Learning goals

After this chapter you can:

- Destructure nested data with defaults and know when it throws
- Choose `??` over `||` correctly
- Pick the right loop for objects, arrays, and async work
- Spot code that automatic semicolon insertion breaks

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Object and array destructuring: defaults, renaming, nesting → 010
- Destructuring `null`/`undefined`; defaults apply only to `undefined` → 010
- Spread in calls, arrays, and objects; rest in parameters and patterns → 020
- `??`, `||`, `&&` short-circuiting; `??=`, `||=`, `&&=` → 030
- Optional chaining on properties and calls, and how far it short-circuits → 030
- `for…in` (enumerable string keys, inherited), `for…of` (iterables), `forEach` (no `break`, no `await`) → 040
- ASI rules and restricted productions (`return`, `++`, lines starting with `(` or `[`) → 050
- Operator precedence and associativity (`**`, mixing `??` with `||`) → 060
- Comma operator, `void`, labels, `switch` fall-through → 070

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [How does destructuring work, and where does it throw?](010-destructuring.md) | easy | 🟡 draft |
| 020 | [What's the difference between spread and rest?](020-spread-vs-rest.md) | easy | 🟡 draft |
| 030 | [`??` vs `\|\|`, and how do optional chaining and logical assignment short-circuit?](030-nullish-and-optional-chaining.md) | easy | 🟡 draft |
| 040 | [`for…in` vs `for…of` vs `forEach` — when do you use each?](040-loop-statements.md) | easy | 🟡 draft |
| 050 | [How does automatic semicolon insertion work, and when does it bite?](050-automatic-semicolon-insertion.md) | medium | 🟡 draft |
| 060 | [Which precedence and associativity rules trip people up?](060-operator-precedence.md) | medium | 🟡 draft |
| 070 | [What do the comma operator, `void`, labels and `switch` fall-through do?](070-comma-void-labels-switch.md) | medium | 🟡 draft |
<!-- generated:questions:end -->

## Sources

- **Spec:** [Destructuring assignment](https://tc39.es/ecma262/#sec-destructuring-assignment) · [Optional chains](https://tc39.es/ecma262/#sec-optional-chains) · [for-in and for-of](https://tc39.es/ecma262/#sec-for-in-and-for-of-statements) · [Automatic semicolon insertion](https://tc39.es/ecma262/#sec-automatic-semicolon-insertion)
- **MDN:** [Destructuring](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring) · [Nullish coalescing](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing) · [Optional chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining) · [for...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of)
