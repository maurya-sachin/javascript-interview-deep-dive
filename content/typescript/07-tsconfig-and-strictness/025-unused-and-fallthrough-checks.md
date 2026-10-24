---
title: "What do `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch` catch, and when do you leave them to a linter?"
status: draft
difficulty: easy
frequency: 2
core: false
tags: [nounusedlocals, nounusedparameters, nofallthroughcasesinswitch, linting, tsconfig]
related:
  - typescript/tsconfig-and-strictness/flags-beyond-strict
  - typescript/tsconfig-and-strictness/strict-mode-flags
  - typescript/tsconfig-and-strictness/skiplibcheck-declaration-sourcemaps
verified: 2026-10
sources:
  - https://www.typescriptlang.org/tsconfig/noUnusedLocals.html
  - https://www.typescriptlang.org/tsconfig/noUnusedParameters.html
  - https://www.typescriptlang.org/tsconfig/noFallthroughCasesInSwitch.html
  - https://www.typescriptlang.org/tsconfig/noEmitOnError.html
  - https://eslint.org/docs/latest/rules/no-fallthrough
tldr: >
  `noUnusedLocals` errors on declared-but-unread variables, imports, types and private members;
  `noUnusedParameters` on unread parameters (and type parameters), except names starting with `_`.
  `noFallthroughCasesInSwitch` errors when a non-empty `case` can run into the next. They are
  errors, not warnings, so many teams leave the unused checks to a linter and keep the switch check.
---

## Answer

None of the three is in `strict`; each is off unless you set it.

- **`noUnusedLocals`** (TS6133 / TS6196 / TS6192): a local variable, function, class, type, interface, import, or `private` member that is never *read*. Assigning to it doesn't count as use. Exports are never reported, since another file may use them.
- **`noUnusedParameters`** (TS6133): unread parameters, also destructured parameter parts and unused type parameters. A leading underscore (`_req`) exempts a parameter, which the tsconfig reference documents for parameters. In my tests it also exempted array-destructuring slots, but **not** an ordinary local such as `const _x`.
- **`noFallthroughCasesInSwitch`** (TS7029): a non-empty `case` whose end is reachable, so control runs into the next clause. Empty cases (`case 1: case 2:`) are allowed for grouping. It uses control-flow reachability: `break`, `return`, `throw`, `continue`, or a call to a function returning `never` all end a case.

**Compiler or linter?** These are **errors**: with them on, `tsc` exits non-zero and an unused variable you left while editing fails the type-check script. Emit still happens unless `noEmitOnError` is set. A linter rule can be a warning, autofixed, and configured (ignore patterns, rest siblings, a `// falls through` comment), and ESLint's core `no-fallthrough` accepts such a comment where TS7029 does not.

What I do: keep `noFallthroughCasesInSwitch` in `tsconfig`, since a silent fallthrough is a real bug and there is little to configure. Put unused-code checks in **one** place: the linter if the project has one (e.g. `@typescript-eslint/no-unused-vars`), otherwise the two compiler flags. Having both reports each problem twice.

## Example

```ts
// tsc --strict --noUnusedLocals --noUnusedParameters --noFallthroughCasesInSwitch (6.0.3 and 7.0.2)
import { a, b } from "./helper.js";
// Error TS6192: All imports in import declaration are unused.
const _local = 1;
// Error TS6133: '_local' is declared but its value is never read.
const [_first, second] = [1, 2];
// Error TS6133: 'second' is declared but its value is never read.   (_first is fine)
let written = 0; written = 1;
// Error TS6133: 'written' is declared but its value is never read.
export function handler(req: string, res: string, _next: unknown) { return res; }
// Error TS6133: 'req' is declared but its value is never read.

export function label(code: number): string {
  let out = "";
  switch (code) {
    case 1:
    case 2: out += "low"; break;   // empty case 1: fine
    case 3:
      out += "mid";
      // falls through
    case 4: out += "high"; break;
    // Error TS7029: Fallthrough case in switch.   (reported at case 3; the comment doesn't help)
  }
  return out;
}
```

## Pitfalls

- Assuming `_` works for locals. `const _unused = 1` is still TS6133; the exemption covers parameters and, in my test, destructuring slots.
- Expecting a `// falls through` comment to silence TS7029. `tsc` ignores comments here; restructure the case or turn the flag off.
- Running the flags and `no-unused-vars` together. Every unused name is reported by both tools, and their exceptions (rest siblings, `_` names) differ.
- Matching on codes across versions. For an unused type parameter `function g<T>()`, 6.0.3 printed TS6133 ("its value is never read") and 7.0.2 printed TS6196 ("declared but never used").

## Follow-ups

**Q:** Why isn't `p` reported in `const { p, ...rest } = obj` when only `rest` is used?
**A:** That is the omit-a-property idiom, and in my test on both versions `tsc` didn't report `p`. Writing `p` removes it from `rest`, so it has a purpose even if never read.

**Q:** Will these flags fail an editor's live checks or a bundler build?
**A:** Editors show them as errors from the same `tsc` diagnostics. Tools that only strip types (esbuild, for example) never run the checker, so only your type-check step fails.
