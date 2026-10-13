---
title: "What are the stages of the TypeScript compiler?"
status: draft
difficulty: hard
frequency: 2
core: false
tags: [compiler, scanner, parser, binder, checker, emitter, language-service, program]
related:
  - typescript/the-compiler/type-erasure
  - typescript/the-compiler/checking-vs-emitting
  - typescript/the-compiler/native-compiler-port
  - typescript/modules-and-declaration-files/module-resolution
verified: 2026-10
sources:
  - https://github.com/microsoft/TypeScript-Compiler-Notes
  - https://github.com/microsoft/TypeScript-Compiler-Notes/blob/main/codebase/src/compiler/scanner.md
  - https://github.com/microsoft/TypeScript-Compiler-Notes/blob/main/codebase/src/compiler/binder.md
  - https://github.com/microsoft/TypeScript-Compiler-Notes/blob/main/codebase/src/compiler/checker.md
  - https://github.com/microsoft/TypeScript-Compiler-Notes/blob/main/codebase/src/compiler/emitter.md
  - https://github.com/microsoft/TypeScript-Compiler-Notes/blob/main/codebase/src/compiler/services.md
  - https://www.typescriptlang.org/tsconfig/#extendedDiagnostics
  - https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
tldr: >
  A `Program` is built from your files, then each file goes through scanner (tokens), parser
  (AST), binder (symbols and scopes) and checker (types and errors), and finally the emitter
  (transform the AST, print JS, `.d.ts` and maps). The language service reuses the same
  Program for editor features. The checker is lazy, answering only the questions asked.
---

## Answer

The compiler works on a **Program**: the set of source files (your roots plus everything they import and the `lib` files) and the compiler options. The compiler notes describe the stages on that program:

1. **Scanner** turns text into tokens (`const`, `x`, `:`, `number`, …), one `scan()` call at a time.
2. **Parser** drives the scanner and builds the **AST**. Each file becomes a `SourceFile` node. Type annotations are still in the tree here.
3. **Binder** walks each AST and creates a **Symbol** for every declaration, stored in a symbol table per scope. It also builds the control-flow graph used for narrowing. Declarations that share a name, like two `interface Box` blocks or a class and a namespace, end up on one merged symbol.
4. **Checker** is the type system: it assigns types to symbols, resolves relationships, and reports semantic diagnostics. The notes say it computes lazily and only examines what contributes to the question asked.
5. **Emitter** takes the program and, through transformers, rewrites the AST (types removed, syntax down-levelled for `target`, modules converted), then a printer writes `.js`, `.d.ts` and `.js.map`.

Two points interviewers like. First, syntax errors come from parsing and type errors from the checker, and type checking is not required for emit, which is why `transpileModule` and `noCheck` work. Second, the **language service** (`tsserver`, the editor features) is not a separate compiler: it builds on the same parser, binder and checker to answer hover, completion and rename, and the notes credit incremental parsing for keeping server mode fast.

Version note: TypeScript 7 is a Go port of this structure, with parsing, checking and emitting done in parallel; the stages are the same. Its npm package ships no JavaScript compiler API, so the demo below uses 5.9.3 and 6.0.3.

## Example

```js
// scratch script on typescript 5.9.3 and 6.0.3 (identical output)
const scan = ts.createScanner(ts.ScriptTarget.ES2022, true, ts.LanguageVariant.Standard, "const x: number = 1;");
// loop scan.scan() collecting scan.getTokenText()
// → [ 'const', 'x', ':', 'number', '=', '1', ';' ]

const sf = ts.createSourceFile("a.ts", text, ts.ScriptTarget.ES2022, true); // parser
// text: two `interface Box` blocks, `const b: Box = …`, `const s: string = b.value;`
console.log(sf.statements.length, ts.isInterfaceDeclaration(sf.statements[0])); // → 4 true

const program = ts.createProgram(["a.ts"], options, host);   // host serves `sf`
const checker = program.getTypeChecker();
const box = checker.getSymbolAtLocation(sf.statements[0].name);
console.log(box.name, box.declarations.length);              // → Box 2   (binder merged both)
console.log(program.getSemanticDiagnostics(sf).map((d) => d.code)); // → [ 2322 ]   (checker)

console.log(ts.transpileModule("const x: number = 1;", { compilerOptions: options }).outputText.trim());
// → "use strict";
//   const x = 1;   (emitter; options had strict: true)
```

## Pitfalls

- Assuming a syntax error stops checking. On a test file with a syntax error, `getSyntacticDiagnostics` returned `1109` and `getSemanticDiagnostics` returned `2322` and `2304` (5.9.3): the parser recovers and the checker still runs.
- Ignoring the stage timings. `--extendedDiagnostics` printed `Parse time`, `Bind time`, `Check time` and `Emit time` on 5.9.3, 6.0.3 and 7.0.2. In Microsoft's native-previews post, 5.8 spent 63.26s of 72.81s checking the Sentry codebase, so checking is usually where a slow build goes.
- Treating the language service as a second implementation. Its quick info and diagnostics came from the same checker in my run, so an editor error and a `tsc` error should agree; when they do not, suspect different TypeScript versions or tsconfig.
- Calling `require("typescript").createProgram` on 7.0. It resolved to an object with only `version` and `versionMajorMinor` on 7.0.2; the announcement says 7.0 ships without an API and expects one in 7.1.

## Follow-ups

**Q:** Where does module resolution happen?
**A:** While building the Program, before binding: the program follows imports and `/// <reference>` directives to find every file it must parse. `--extendedDiagnostics` reports `ResolveModule time` separately on 5.9.3.

**Q:** Why is the checker one huge file?
**A:** The compiler notes list the reasons they were given: keep everything together, share closure state for speed, avoid god objects and extra calls. Treat that as the maintainers' rationale from the notes, not a measurement.

**Q:** What does the language service add?
**A:** A host that supplies file text and versions, plus editor-oriented APIs like quick info. With `ts.createLanguageService` on 5.9.3, hovering `toFixed` returned `(method) Number.toFixed(fractionDigits?: number): string`, and after the text changed, diagnostics came back `[ 2322 ]`.
