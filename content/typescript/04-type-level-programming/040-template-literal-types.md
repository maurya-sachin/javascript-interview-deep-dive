---
title: "What are template literal types, and what are they used for?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [template-literal-types, string-types, infer, intrinsic-types, inference]
related:
  - typescript/type-system-basics/literal-types-as-const
  - typescript/type-level-programming/infer-keyword
  - typescript/type-level-programming/mapped-types
verified: 2026-10
sources:
  - https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-1.html
  - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-8.html
  - https://github.com/microsoft/TypeScript/pull/40336
  - https://github.com/microsoft/TypeScript/pull/40580
  - https://github.com/microsoft/TypeScript/pull/47050
tldr: >
  Template literal types (TS 4.1) use backtick syntax in a type position. With literal or union
  placeholders they build string literal unions by cross-product. With `string` / `number` they
  describe string patterns, and with `infer` they parse strings. `Uppercase`, `Capitalize` and
  friends are compiler intrinsics.
---

## Answer

A template literal type is the backtick syntax used in a type: `` `${A}-${B}` ``. It does three jobs.

1. **Build string unions.** Placeholders that are literal types are concatenated. Union placeholders are cross-multiplied, so `` `${"en" | "ja"}_${"title" | "body"}` `` is four literals. This is how you derive event names (`` `${K}Changed` ``) or CSS-like tokens from existing unions.
2. **Describe a string pattern.** A placeholder of `string`, `number` or `bigint` makes a non-literal pattern (`boolean` just expands to `"true" | "false"`, checked): `` `${number}px` `` accepts `"12px"` and rejects `"12em"`; `` `--${string}` `` accepts any string with that prefix. Patterns also work as mapped-type key sources, e.g. `` `data-${string}` ``.
3. **Parse strings with `infer`.** In a conditional type, `` S extends `${infer A}-${infer B}` `` splits the string. `A` takes the shortest match up to the first delimiter and the last placeholder takes the rest. With adjacent placeholders each non-final `infer` captures a single character. Add `infer N extends number` (TS 4.8) to turn `"42"` into the literal `42`.

**Intrinsic string types.** `Uppercase`, `Lowercase`, `Capitalize`, `Uncapitalize` are implemented inside the compiler (`intrinsic` in `lib.es5.d.ts`; PR 40580), not in TypeScript. They distribute over unions and are the usual way to turn `name` into `getName`.

**Constraints.** Placeholders must be `string | number | bigint | boolean | null | undefined`; use `string & K` for a key type that may include symbols. A union in each position multiplies, and the compiler errors (TS2590) when the result becomes too large, so generate big sets ahead of time instead.

Typical uses: typed event or route names, parsing route params (`/users/:id`), typed `on("xChanged")` APIs, CSS unit strings, and key renaming in mapped types.

## Example

```ts
// TypeScript 7.0.2 and 6.0.3, --strict
type Key = `${"en" | "ja"}_${"title" | "body"}`; // "en_body" | "en_title" | "ja_body" | "ja_title"
type Getter = `get${Capitalize<"name" | "age">}`; // "getName" | "getAge"

type Px = `${number}px`;
const ok: Px = "12px";
const bad: Px = "12em";
// Error TS2322: Type '"12em"' is not assignable to type '`${number}px`'.

type Pair = "a-b-c" extends `${infer A}-${infer B}` ? [A, B] : never; // ["a", "b-c"]
type Chars = "abc" extends `${infer A}${infer B}` ? [A, B] : never; // ["a", "bc"]
type Num = "42" extends `${infer N extends number}` ? N : never; // 42

type Split<S extends string, D extends string> =
  S extends `${infer Head}${D}${infer Tail}` ? [Head, ...Split<Tail, D>] : [S];
type Parts = Split<"a.b.c", ".">; // ["a", "b", "c"]

type Params<R> = R extends `${string}:${infer P}/${infer Rest}`
  ? P | Params<`/${Rest}`>
  : R extends `${string}:${infer P}` ? P : never;
type RouteParams = Params<"/users/:id/posts/:postId">; // "id" | "postId"

type Prefixed = `--${string}`;
const flag: Prefixed = "-flag";
// Error TS2322: Type '"-flag"' is not assignable to type '`--${string}`'.
```

## Pitfalls

- Interpolating a type that may be `symbol`. `` `x${symbol}` `` is TS2322; narrow with `string & K`.
- Generating large cross products. Five ten-member unions (100,000 members) gave TS2590 on 6.0.3 and 7.0.2, while four (10,000) compiled.
- Expecting `infer` to backtrack. The first match wins: `"a-b-c"` splits at the first `-`, giving `"b-c"` as the tail.
- Assuming a pattern type is checked at runtime. `` `${number}px` `` only checks literals the compiler can see; a `string` variable is not assignable to it without a cast or guard.

## Follow-ups

**Q:** What does `Uppercase<string>` give?
**A:** It stays `Uppercase<string>`, the strings uppercasing leaves unchanged, so a plain `string` is not assignable (TS2322 on 6.0.3 and 7.0.2). PR 40580 first made it `string`; PR 47050 kept it as its own type from 4.8 (4.7.4 accepted `string`, 4.8.4 gave TS2322).

**Q:** How do you make an `on` method that types its callback from the event name?
**A:** Take a generic `Key extends string & keyof T`, accept `` `${Key}Changed` `` and type the callback as `(v: T[Key]) => void`; inference recovers `Key` from the pattern (handbook example).

## Exercises

### Kebab to camel

Write `CamelCase<S>` so `CamelCase<"foo-bar-baz">` is `"fooBarBaz"`.

```ts
type CamelCase<S extends string> = unknown;
```

**Answer:** `` type CamelCase<S extends string> = S extends `${infer H}-${infer T}` ? `${H}${CamelCase<Capitalize<T>>}` : S; ``. Split at the first dash, capitalize the rest, and recurse. Checked: gives `"fooBarBaz"`.
