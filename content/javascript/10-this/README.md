# 10 — `this`

> **Status:** 🔴 planned · **Published:** 0/5 · **Last verified:** —

How `this` is bound at each call site, why arrows differ, and how to control it.

## Learning goals

After this chapter you can:

- Determine `this` for any call site
- Explain why arrow functions can't be rebound
- Fix lost-`this` bugs in callbacks
- Implement `bind`, including `new` support

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Default, implicit, explicit, and `new` binding; precedence → 010
- `this` in strict vs sloppy mode, at module top level, in classes → 010
- Lexical `this` in arrow functions → 020
- `call`, `apply`, `bind`; bound function exotic objects → 030, 050
- Lost `this` in callbacks; the Reference Record; `(0, obj.fn)()` → 040
- `this` in event handlers and timers (host-defined) → 040

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [How is the value of `this` determined?](010-this-binding-rules.md) | medium | 🟡 draft |
| 020 | [Why don't arrow functions have their own `this`?](020-arrow-functions-this.md) | easy | 🟡 draft |
| 030 | [`call` vs `apply` vs `bind`?](030-call-apply-bind.md) | easy | 🟡 draft |
| 040 | [Why does a method lose `this` when passed as a callback?](040-lost-this-callbacks.md) | medium | 🟡 draft |
| 050 | [Implement `Function.prototype.bind`.](050-implement-bind.md) | hard | 🟡 draft |
<!-- generated:questions:end -->

## Sources

- **Spec:** [OrdinaryCallBindThis](https://tc39.es/ecma262/#sec-ordinarycallbindthis) · [ResolveThisBinding](https://tc39.es/ecma262/#sec-resolvethisbinding) · [Function.prototype.bind](https://tc39.es/ecma262/#sec-function.prototype.bind) · [Bound function exotic objects](https://tc39.es/ecma262/#sec-bound-function-exotic-objects)
- **MDN:** [this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this) · [bind](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind) · [call](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call) · [apply](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply)
