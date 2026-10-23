# 20 — Modules

> **Status:** 🔴 planned · **Published:** 0/9 · **Last verified:** —

How ES modules load and link, how they differ from CommonJS, and the newer module features.

## Learning goals

After this chapter you can:

- Describe the load, link, and evaluate phases and live bindings
- Explain ESM/CommonJS differences and how Node.js bridges them
- Predict what a circular import does
- Use dynamic `import()`, top-level `await`, and import attributes appropriately

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- Static structure; construction, linking, evaluation; Module Records → 010
- Live bindings vs copied values; named vs default exports; namespace objects → 010
- ESM vs CommonJS: loading, `require(esm)`, interop, dual packages → 020
- Cycles and TDZ errors in module graphs → 030
- `import()`, code splitting, lazy loading → 040
- Top-level `await` and async module evaluation → 050
- Import attributes, JSON modules → 060
- `import.meta.url`, `import.meta.resolve` → 070
- Tree shaking and side-effect-free modules → 080
- Import maps and bare specifiers in browsers → 090
- Import defer and source phase imports (Stage 3) → —

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
| 010 | [How do ES modules load?](010-es-module-loading.md) | hard | 🟡 draft |
| 020 | [ES modules vs CommonJS — what differs and how do they interoperate?](020-esm-vs-commonjs.md) | medium | 🟡 draft |
| 030 | [What happens with circular imports?](030-circular-imports.md) | hard | 🟡 draft |
| 040 | [How does dynamic `import()` work?](040-dynamic-import.md) | medium | 🟡 draft |
| 050 | [What does top-level `await` do to the module graph?](050-top-level-await.md) | medium | 🟡 draft |
| 060 | [What are import attributes and JSON modules?](060-import-attributes-json-modules.md) | easy | 🟡 draft |
| 070 | [What is `import.meta`?](070-import-meta.md) | easy | 🟡 draft |
| 080 | [How does tree shaking work, and what stops it?](080-tree-shaking.md) | medium | 🟡 draft |
| 090 | [How do browsers resolve bare specifiers with import maps?](090-import-maps.md) | medium | 🔴 planned |
<!-- generated:questions:end -->

## Sources

- **Spec:** [Modules](https://tc39.es/ecma262/#sec-modules) · [Cyclic Module Records](https://tc39.es/ecma262/#sec-cyclic-module-records) · [Import calls](https://tc39.es/ecma262/#sec-import-calls) · [import.meta](https://tc39.es/ecma262/#sec-meta-properties)
- **Node.js:** [ECMAScript modules](https://nodejs.org/api/esm.html) · [require(esm)](https://nodejs.org/api/modules.html#loading-ecmascript-modules-using-require)
- **MDN:** [Modules guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) · [import()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import) · [import.meta](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import.meta) · [Import attributes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import/with)
