# 08 — Functions

> **Status:** 🔴 planned · **Published:** 0/9 · **Last verified:** —

The function forms and how they differ, parameters, and the functional techniques interviews ask you to implement.

## Learning goals

After this chapter you can:

- Choose between function forms based on hoisting, `this`, `arguments`, and `new`
- Explain parameter scope and when defaults are evaluated
- Implement currying and composition from scratch

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Declarations, expressions, named function expressions, arrows, methods → 010
- `[[Call]]` vs `[[Construct]]`: which functions work with `new` → 010
- Default parameter evaluation, parameter scope, rest parameters → 020
- `arguments`: array-like, mapped vs unmapped, absent in arrows → 030
- First-class functions, callbacks, higher-order functions → 040
- IIFEs and why block scope and modules replaced them → 050
- Currying, partial application, arity (`length`) → 060
- Function composition → 070
- Function `name` and `length`; name inference → 080
- Pure functions and side effects → 090

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [Function declarations vs expressions vs arrow functions — what actually differs?](010-function-forms.md) | easy | 🟡 draft |
| 020 | [How do default and rest parameters work?](020-default-and-rest-parameters.md) | medium | 🟡 draft |
| 030 | [What is the `arguments` object, and why avoid it?](030-arguments-object.md) | easy | 🟡 draft |
| 040 | [What are higher-order functions?](040-higher-order-functions.md) | easy | 🟡 draft |
| 050 | [What is an IIFE, and do you still need one?](050-iife.md) | easy | 🟡 draft |
| 060 | [What are currying and partial application?](060-currying-partial-application.md) | medium | 🟡 draft |
| 070 | [Implement `compose` and `pipe`.](070-compose-and-pipe.md) | medium | 🟡 draft |
| 080 | [Where do a function's `name` and `length` come from?](080-function-name-and-length.md) | medium | 🟡 draft |
| 090 | [What makes a function pure, and why does it matter?](090-pure-functions.md) | easy | 🟡 draft |
<!-- generated:questions:end -->

## Sources

- **Spec:** [ECMAScript function objects](https://tc39.es/ecma262/#sec-ecmascript-function-objects) · [Function definitions](https://tc39.es/ecma262/#sec-function-definitions) · [Arrow functions](https://tc39.es/ecma262/#sec-arrow-function-definitions) · [Arguments exotic objects](https://tc39.es/ecma262/#sec-arguments-exotic-objects)
- **MDN:** [Functions guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions) · [Arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions) · [arguments](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments) · [Default parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Default_parameters)
