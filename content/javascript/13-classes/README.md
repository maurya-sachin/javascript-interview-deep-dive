# 13 — Classes

> **Status:** 🔴 planned · **Published:** 0/7 · **Last verified:** —

What `class` adds over constructor functions: fields, private names, static blocks, `super`, and subclassing built-ins.

## Learning goals

After this chapter you can:

- List what classes do that constructor functions can't
- Explain how private names differ from symbols and closures
- Say where fields and methods live and what that costs
- Subclass a built-in correctly

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Class constructors: strict, not callable without `new`, TDZ for the class binding → 010
- Private fields, methods, and accessors; `#x in obj` brand checks; proxies don't forward them → 020
- Instance fields vs prototype methods; arrow-function fields and memory → 030
- Static fields and methods; `static {}` blocks → 040
- `super()` and `super.x`; `[[HomeObject]]`; derived constructors → 050
- `new.target`, subclassing built-ins, `Symbol.species` → 060
- Mixins, composition, delegation → 070
- Decorators (Stage 2.7 — revisit when finished) → —

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [Are classes just syntactic sugar over prototypes?](010-classes-vs-prototypes.md) | medium | 🟡 draft |
| 020 | [How do private fields (`#x`) work?](020-private-fields.md) | medium | 🟡 draft |
| 030 | [Class fields vs methods — where does each live?](030-fields-vs-methods.md) | medium | 🟡 draft |
| 040 | [What are static members and static initialization blocks?](040-static-members-and-blocks.md) | easy | 🟡 draft |
| 050 | [How does `super` work?](050-super-keyword.md) | hard | 🟡 draft |
| 060 | [How do you extend built-ins like `Array` and `Error`?](060-extending-built-ins.md) | hard | 🟡 draft |
| 070 | [Composition vs inheritance — when do mixins make sense?](070-composition-vs-inheritance.md) | medium | 🟡 draft |
<!-- generated:questions:end -->

## Sources

- **Spec:** [Class definitions](https://tc39.es/ecma262/#sec-class-definitions) · [PrivateEnvironment Records](https://tc39.es/ecma262/#sec-privateenvironment-records) · [The super keyword](https://tc39.es/ecma262/#sec-super-keyword)
- **MDN:** [Classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes) · [Private elements](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_elements) · [Static initialization blocks](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Static_initialization_blocks) · [super](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/super)
