---
title: "How do you type callbacks, overloads, `this`, and constrained generics in JSDoc?"
status: draft
difficulty: medium
frequency: 2
core: false
tags: [jsdoc, checkjs, callback, overload, this, template, typescript-7]
related:
  - typescript/modules-and-declaration-files/checkjs-jsdoc
  - typescript/modules-and-declaration-files/declaration-authoring-patterns
  - typescript/the-compiler/native-compiler-port
verified: 2026-10
perishable:
  - "TS 7.0 drops Closure function types and ignores @overload on arrows"
sources:
  - https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html
  - https://github.com/microsoft/TypeScript/blob/main/tsc/CHANGES.md
  - https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
tldr: >
  `@callback` names a function type (like `@typedef` for objects). Stacked `@overload` comments
  above a function declaration become its overload signatures. `@this {T}` types `this` and checks
  call sites. `@template {C} T` constrains a type parameter, and `[T=D]` gives it a default. TS 7.0
  drops Closure `function(string): void` types and `@overload` on arrow functions.
---

## Answer

These tags give a `// @ts-check` JavaScript file the parts of TypeScript that `@param`/`@type` can't express.

- **`@callback Name`** declares a named function type: its own `@param` and `@returns` lines describe the signature. Use it with `@type {Name}` on an arrow function and the parameters are inferred, with no per-parameter annotations. It can be generic, but `@template` must come *before* `@callback`; after it, 6.0.3 and 7.0.2 report TS8039.
- **`@overload`** (TS 5.0). Each JSDoc comment containing `@overload` becomes one overload signature of the function declaration that follows. The last, untagged comment types the implementation, which callers can't see, just like a TypeScript implementation signature.
- **`@this {Type}`** declares the type of `this` inside a function. It is checked both ways: inside, `this.prefix` is typed; at call sites, calling it detached from a matching object is TS2684.
- **`@template`** declares type parameters. Put a constraint in braces before the name: `@template {keyof T} K` is `K extends keyof T`. The handbook notes that in `@template {string} K, V` only the first name is constrained. `@template [T=string]` sets a default.

**TS 7.0 changes** (the JavaScript support was rewritten, per the TypeScript repo's `CHANGES.md`):
- Closure function syntax (`{function(string): void}`) is gone. 6.0.3 accepts it; 7.0.2 fails to parse it (TS1005). Use `{(s: string) => void}` or a `@callback`.
- `@overload` on an arrow function or function expression is ignored, because TypeScript has no overloads for those. Overload a `function` declaration, or put an overloaded type in `@type`.

I'd still move a file to `.ts` once it needs many of these: the tags work, but they're harder to read than the TypeScript they stand for.

## Example

```js
// @ts-check
// @template goes before @callback (after it: error TS8039)
/**
 * @template S, A
 * @callback Reducer
 * @param {S} state
 * @param {A} action
 * @returns {S}
 */
/** @type {Reducer<number, { by: number }>} */
const add = (state, action) => state + action.by; // both params inferred

/** @overload @param {string} x @returns {string} */
/** @overload @param {number} x @returns {number} */
/** @param {string | number} x */
function double(x) { return typeof x === "string" ? x + x : x * 2; }

/** @template {object} T @template {keyof T} K @param {T} obj @param {K} key @returns {T[K]} */
function pluck(obj, key) { return obj[key]; }

/** @this {{ prefix: string }} @param {string} msg */
function log(msg) { return this.prefix + msg; }

/** @type {string} */ const s = double(2);
// Error TS2322: Type 'number' is not assignable to type 'string'.
pluck({ a: 1 }, "b");
// Error TS2345: Argument of type '"b"' is not assignable to parameter of type '"a"'.
log("x");
// Error TS2684: The 'this' context of type 'void' is not assignable to method's 'this' of type '{ prefix: string; }'.
```

`tsc --strict --allowJs --noEmit`: 6.0.3 and 7.0.2 print exactly these three errors.

## Pitfalls

- Writing `@template` after `@callback` or `@typedef`. Error TS8039 ("A JSDoc '@template' tag may not follow a '@typedef', '@callback', or '@overload' tag"), and every use of the type parameter then fails with TS2304.
- Overloading an arrow function. On 6.0.3 two `@overload` comments above `const twice = (x) => ...` made `twice(2)` a `number`; on 7.0.2 they were ignored and it was `string | number`, so `/** @type {number} */ const r = twice(2)` became TS2322.
- Keeping Closure-style types such as `@type {function(string): void}` from older code. They check on 6.0.3 and are a parse error on 7.0.2.
- Expecting a constraint to apply to every name in `@template {string} K, V`. Only `K` is constrained; `V` is unconstrained.

## Follow-ups

**Q:** How do overload errors read in JavaScript files?
**A:** Like TypeScript's: TS2769 "No overload matches this call". 6.0.3 lists each overload's failure; 7.0.2 printed only "The last overload gave the following error." for the same call.

**Q:** When should you use `@typedef` with a function type instead of `@callback`?
**A:** `@typedef {(s: string) => boolean} Pred` is fine for short signatures. `@callback` reads better when parameters need names, descriptions or optional markers like `[index]`.
