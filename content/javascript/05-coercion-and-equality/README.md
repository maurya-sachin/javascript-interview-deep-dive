# 05 — Coercion and equality

> **Status:** 🔴 planned · **Published:** 0/6 · **Last verified:** —

How values convert between types, the algorithms behind `==` and `===`, and which comparison each API uses.

## Learning goals

After this chapter you can:

- Walk through `==` for any pair of values
- Predict the result of mixed-type `+`
- Customize how an object converts to a primitive
- Say which equality algorithm `includes`, `indexOf`, `Map`, and `Object.is` use

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Explicit vs implicit coercion; `ToNumber`, `ToString`, `ToBoolean` → 010, 020
- The `IsLooselyEqual` algorithm step by step → 010
- Falsy values, including `0n` and `document.all` → 020
- `ToPrimitive`, hints, `Symbol.toPrimitive`, `valueOf`/`toString` order → 030
- `Date` objects defaulting to the string hint → 030
- `+`: string concatenation vs numeric addition → 040
- `IsStrictlyEqual`, `SameValue`, `SameValueZero`, and the APIs using each → 050
- Relational comparison (`<`, `>`) coercion → 060

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [How does `==` decide whether two values are equal?](010-loose-equality.md) | medium | 🟡 draft |
| 020 | [Which values are falsy?](020-truthy-falsy.md) | easy | 🟡 draft |
| 030 | [How does an object convert to a primitive?](030-object-to-primitive.md) | hard | 🟡 draft |
| 040 | [Why does `[] + {}` give `"[object Object]"`?](040-addition-operator-coercion.md) | medium | 🟡 draft |
| 050 | [`===` vs `Object.is` vs SameValueZero — which comparison does each API use?](050-equality-algorithms.md) | medium | 🟡 draft |
| 060 | [How does `<` compare values of different types, and why is `null >= 0` true?](060-relational-comparison.md) | medium | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- **Spec:** [Type conversion](https://tc39.es/ecma262/#sec-type-conversion) · [IsLooselyEqual](https://tc39.es/ecma262/#sec-islooselyequal) · [ToPrimitive](https://tc39.es/ecma262/#sec-toprimitive) · [Addition operator](https://tc39.es/ecma262/#sec-addition-operator-plus)
- **MDN:** [Equality comparisons and sameness](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Equality_comparisons_and_sameness) · [Symbol.toPrimitive](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toPrimitive) · [Falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy)
