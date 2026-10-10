# 21 — Metaprogramming

> **Status:** 🔴 planned · **Published:** 0/5 · **Last verified:** —

Intercepting and customizing language behaviour: Proxy, Reflect, well-known symbols, exotic objects, and `eval`.

## Learning goals

After this chapter you can:

- Map Proxy traps to the internal methods they intercept
- Forward traps correctly with `Reflect` and `receiver`
- Customize built-in behaviour with well-known symbols
- Explain the risks of `eval` and `new Function`

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Internal methods (`[[Get]]`, `[[Set]]`, `[[DefineOwnProperty]]`, …) and the traps that mirror them → 010
- Proxy invariants, revocable proxies, Proxy-based reactivity → 010
- `Reflect` methods, `receiver`, forwarding traps → 020
- `Symbol.iterator`, `toPrimitive`, `hasInstance`, `toStringTag`, `species`, `asyncIterator`, `dispose` → 030
- Ordinary vs exotic objects (arrays, strings, arguments, bound functions, proxies, module namespaces, typed arrays) → 040
- Direct vs indirect `eval`, `new Function`, Content Security Policy → 050
- ShadowRealm (Stage 2.7) → —

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [What can a Proxy intercept, and what are its invariants?](010-proxy-traps-invariants.md) | hard | 🔴 planned |
| 020 | [What is `Reflect` for?](020-reflect-api.md) | medium | 🔴 planned |
| 030 | [Which well-known symbols let you customize built-in behavior?](030-well-known-symbols.md) | medium | 🔴 planned |
| 040 | [What is an exotic object?](040-exotic-objects.md) | hard | 🔴 planned |
| 050 | [Why is `eval` dangerous, and what's the difference between direct and indirect eval?](050-eval-direct-indirect.md) | medium | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- **Spec:** [Proxy internal methods](https://tc39.es/ecma262/#sec-proxy-object-internal-methods-and-internal-slots) · [Reflect](https://tc39.es/ecma262/#sec-reflect-object) · [Well-known symbols](https://tc39.es/ecma262/#sec-well-known-symbols) · [Built-in exotic objects](https://tc39.es/ecma262/#sec-built-in-exotic-object-internal-methods-and-slots) · [eval](https://tc39.es/ecma262/#sec-eval-x)
- **MDN:** [Meta programming](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Meta_programming) · [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) · [Reflect](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect) · [eval](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval)
