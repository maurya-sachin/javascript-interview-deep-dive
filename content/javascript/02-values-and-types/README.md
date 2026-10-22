# 02 — Values and types

> **Status:** 🔴 planned · **Published:** 0/8 · **Last verified:** —

The eight language types, how primitives differ from objects, and how to check what a value is.

## Learning goals

After this chapter you can:

- Name the eight language types and explain why `typeof` doesn't map one-to-one onto them
- Explain how primitives get methods without being objects
- Predict when a function call can change the caller's data
- Pick the right type check for a given value

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- The eight language types; primitives vs objects → 010
- `typeof` results and quirks (functions, `null`, undeclared variables) → 020, 070
- `null` vs `undefined`; `void`; missing vs absent values → 030
- Primitive immutability and wrapper objects (autoboxing) → 040
- Value vs reference semantics; mutation vs reassignment → 050
- Symbols: uniqueness, `description`, global registry (`Symbol.for`) → 060
- `instanceof`, `Array.isArray`, `Object.prototype.toString`, `Symbol.toStringTag`, `Error.isError` → 070
- Records & Tuples (withdrawn) — why there are no immutable compound primitives → 080

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [What are JavaScript's types?](010-language-types.md) | easy | 🟡 draft |
| 020 | [Why does `typeof null` return `"object"`?](020-typeof-null.md) | easy | 🟡 draft |
| 030 | [What's the difference between `null` and `undefined`?](030-null-vs-undefined.md) | easy | 🟡 draft |
| 040 | [How can a primitive have methods?](040-primitive-wrappers.md) | medium | 🟡 draft |
| 050 | [Is JavaScript pass-by-value or pass-by-reference?](050-pass-by-sharing.md) | medium | 🟡 draft |
| 060 | [What are Symbols for?](060-symbols.md) | medium | 🟡 draft |
| 070 | [How do you reliably check a value's type?](070-type-checking.md) | medium | 🟡 draft |
| 080 | [Why doesn't JavaScript have immutable records and tuples?](080-why-no-records-and-tuples.md) | medium | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- **Spec:** [Language types](https://tc39.es/ecma262/#sec-ecmascript-language-types) · [typeof](https://tc39.es/ecma262/#sec-typeof-operator) · [Symbol objects](https://tc39.es/ecma262/#sec-symbol-objects)
- **MDN:** [Data structures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Data_structures) · [typeof](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof) · [Symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol)
