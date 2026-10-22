# 01 — How JavaScript runs

> **Status:** 🔴 planned · **Published:** 0/8 · **Last verified:** —

What JavaScript is made of — the specification, engines, and hosts — how features get added, and the two kinds of source code it runs.

## Learning goals

After this chapter you can:

- Explain the roles of the spec, engines, and hosts, and which one defines a given behaviour
- Describe how a proposal moves through TC39 and when a feature is safe to use
- Explain what strict mode changes and why modules and classes are always strict
- Choose between a polyfill and a transpiler for a missing feature

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- ECMAScript vs JavaScript; the specification and its yearly editions → 010
- Engines (V8, SpiderMonkey, JavaScriptCore) and hosts (browsers, Node.js, Deno, Bun) → 010
- Host-defined behaviour: what the spec leaves to the host → 010
- TC39 stages 0–4 (incl. 2.7), test262, the yearly cut-off → 020
- What's coming next: current Stage 3 proposals → 020
- Parsing, bytecode, and JIT compilation at a glance → 030
- Scripts vs modules: scope, strictness, top-level `this`, loading → 040
- Strict mode rules and implicit strictness (modules, classes) → 050
- Sloppy-mode-only behaviour (`with`, legacy octals, `arguments` aliasing) → 050
- Polyfills, transpilers (Babel, SWC, esbuild), and target browsers → 060
- Hashbang comments → 070
- Annex B: legacy features kept for web compatibility → 080

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [What's the difference between ECMAScript, JavaScript, an engine, and a host?](010-ecmascript-engine-host.md) | easy | 🟡 draft |
| 020 | [How does a feature become part of JavaScript?](020-tc39-process.md) | medium | 🟡 draft |
| 030 | [Is JavaScript compiled or interpreted?](030-compiled-or-interpreted.md) | medium | 🟡 draft |
| 040 | [What's the difference between a script and a module?](040-scripts-vs-modules.md) | medium | 🟡 draft |
| 050 | [What does strict mode change, and when is code strict automatically?](050-strict-mode.md) | medium | 🟡 draft |
| 060 | [What's the difference between a polyfill and a transpiler?](060-polyfill-vs-transpiler.md) | easy | 🟡 draft |
| 070 | [What is a hashbang comment, and why is it in the grammar?](070-hashbang-comments.md) | easy | 🟡 draft |
| 080 | [What is Annex B, and which legacy behaviours does it keep alive?](080-annex-b-legacy-features.md) | medium | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- **Spec:** [Overview](https://tc39.es/ecma262/#sec-overview) · [Strict mode](https://tc39.es/ecma262/#sec-strict-mode-of-ecmascript) · [Scripts](https://tc39.es/ecma262/#sec-scripts) · [Modules](https://tc39.es/ecma262/#sec-modules)
- **TC39:** [Process document](https://tc39.es/process-document/) · [Proposals](https://github.com/tc39/proposals)
- **MDN:** [JavaScript technologies overview](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/JavaScript_technologies_overview) · [Strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode) · [Modules guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
