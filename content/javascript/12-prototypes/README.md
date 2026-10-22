# 12 — Prototypes and inheritance

> **Status:** 🔴 planned · **Published:** 0/8 · **Last verified:** —

The `[[Prototype]]` chain, how lookup and assignment walk it, and what `new` and `instanceof` do.

## Learning goals

After this chapter you can:

- Trace a property lookup and an assignment through the prototype chain
- Explain the difference between `prototype` and `[[Prototype]]`
- Implement `new` and `instanceof`
- Spot the risks of extending native prototypes

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- `[[Prototype]]` and `[[Get]]` lookup along the chain → 010
- Shadowing and assignment along the chain (inherited setters, non-writable properties) → 010
- The `prototype` property, `constructor`, the `__proto__` accessor → 020
- `Object.getPrototypeOf`/`setPrototypeOf` and the cost of changing prototypes → 020
- `new`: create, link, call, return-override rules → 030
- `OrdinaryHasInstance`, `Symbol.hasInstance`, `isPrototypeOf` → 040
- Null-prototype objects as dictionaries → 050
- Monkey-patching built-ins and web-compatibility fallout → 060
- Prototype pollution → 070
- Delegation-style objects (OLOO) vs constructor functions → 080

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [How does prototypal inheritance work?](010-prototype-chain.md) | medium | 🟡 draft |
| 020 | [`__proto__` vs `prototype` vs `Object.getPrototypeOf`?](020-proto-vs-prototype.md) | medium | 🟡 draft |
| 030 | [What does the `new` operator do?](030-new-operator.md) | medium | 🟡 draft |
| 040 | [How does `instanceof` work?](040-instanceof.md) | medium | 🟡 draft |
| 050 | [When do you use `Object.create(null)`?](050-object-create-null.md) | medium | 🟡 draft |
| 060 | [Should you extend native prototypes?](060-extending-native-prototypes.md) | medium | 🟡 draft |
| 070 | [What is prototype pollution, and how do you prevent it?](070-prototype-pollution.md) | hard | 🔴 planned |
| 080 | [What is delegation-style object linking, and how does it compare with constructors and classes?](080-delegation-vs-constructors.md) | medium | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- **Spec:** [OrdinaryGet](https://tc39.es/ecma262/#sec-ordinaryget) · [OrdinarySet](https://tc39.es/ecma262/#sec-ordinaryset) · [The new operator](https://tc39.es/ecma262/#sec-new-operator) · [InstanceofOperator](https://tc39.es/ecma262/#sec-instanceofoperator) · [Object.create](https://tc39.es/ecma262/#sec-object.create)
- **MDN:** [Inheritance and the prototype chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain) · [new](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new) · [instanceof](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof)
