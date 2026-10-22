---
title: "What is Annex B, and which legacy behaviours does it keep alive?"
status: draft
difficulty: medium
frequency: 2
core: false
tags: [annex-b, web-compatibility, legacy, sloppy-mode, specification]
related:
  - javascript/how-javascript-runs/ecmascript-engine-host
  - javascript/how-javascript-runs/strict-mode
  - javascript/how-javascript-runs/scripts-vs-modules
  - javascript/scope-and-execution-contexts/hoisting
  - javascript/prototypes/proto-vs-prototype
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-additional-ecmascript-features-for-web-browsers
  - https://tc39.es/ecma262/#sec-html-like-comments
  - https://tc39.es/ecma262/#sec-regular-expressions-patterns
  - https://tc39.es/ecma262/#sec-additional-built-in-properties
  - https://tc39.es/ecma262/#sec-block-level-function-declarations-web-legacy-compatibility-semantics
  - https://tc39.es/ecma262/#sec-variablestatements-in-catch-blocks
  - https://tc39.es/ecma262/#sec-IsHTMLDDA-internal-slot
  - https://tc39.es/ecma262/#sec-conformance-legacy-normative-optional
  - https://tc39.es/ecma262/#sec-object.prototype.__proto__
  - https://262.ecma-international.org/10.0/#sec-additional-ecmascript-features-for-web-browsers
tldr: >
  Annex B is the part of ECMA-262 that specifies legacy features browsers must keep for
  existing web pages: HTML-like comments, lenient regex syntax, `escape`, `substr`, the HTML
  string methods, sloppy-mode block-function semantics, and `document.all`'s special slot. It's
  required in browsers and optional elsewhere. The spec itself tells you not to use it in new code.
---

## Answer

Annex B, "Additional ECMAScript Features for Web Browsers", is a normative annex of ECMA-262. It's **required when the host is a web browser** and optional for other hosts. Its own note is blunt: every feature in it has undesirable characteristics and would be removed if existing web pages didn't depend on it, so programmers shouldn't use or assume it in new code. It exists to make those legacy behaviours interoperable rather than leaving each browser to guess.

It has three parts:

- **B.1 Additional syntax.** HTML-like comments (`<!--` starts a line comment, and `-->` does at the start of a line), allowed in scripts but not modules. Lenient regex patterns without the `u` or `v` flag: a lone `]` or `{` is a literal character, plus legacy escapes.
- **B.2 Additional built-ins.** `escape` and `unescape`; `String.prototype.substr`; the HTML methods (`anchor`, `bold`, `link`, …) that wrap a string in a tag; `trimLeft`/`trimRight` as aliases of `trimStart`/`trimEnd`; `Date.prototype.getYear`, `setYear`, `toGMTString`; `RegExp.prototype.compile`.
- **B.3 Other semantics.** Sloppy-mode rules for function declarations in blocks and `if` clauses, labelled functions, `var` redeclaring a catch parameter, `for (var x = init in obj)`, the `[[IsHTMLDDA]]` slot that makes `document.all` act like `undefined`, and a few browser-specific host hooks.

Not every legacy feature lives there. `with` and legacy octal literals (`010`) are in the main body, required everywhere but only in sloppy mode. In ES2019, `__proto__` and `__defineGetter__` were in Annex B; the current spec has them in the main body, marked *Normative Optional, Legacy*.

Optional doesn't mean absent: Node.js 24 isn't a browser, but its engine (V8) implements these features, so every example below runs there.

## Example

```js
// Indirect eval runs a sloppy global script; module code would reject some of this.
const sloppy = (source) => (0, eval)(source);

console.log(sloppy('const a = 1 <!-- an HTML-like comment\na')); // → 1

const blockFunction = `
  function outer() {
    { function inner() {} } // B.3.2: also gets a var binding in outer
    return typeof inner;
  }
  outer();`;
console.log(sloppy(blockFunction)); // → function
console.log(sloppy(`'use strict';${blockFunction}`)); // → undefined

console.log(sloppy('/]/.test("]")')); // → true
try {
  sloppy('/]/u');
} catch (error) {
  console.log(error.name); // → SyntaxError
}

console.log('abcdef'.substr(-3, 2), 'x'.bold(), escape('a b')); // → de <b>x</b> a%20b
```

## Pitfalls

- Assuming Annex B features exist in every engine. Outside browsers they're optional; a small embedded engine may leave them out. Use `slice` rather than `substr`, `encodeURIComponent` rather than `escape`.
- Writing a function declaration inside a block in sloppy code and expecting block scoping. Annex B also creates a function-scoped `var` binding, assigned when the block's declaration is evaluated; strict mode doesn't.
- Saying `<!--` is "just HTML". In a classic script it's a real comment token, so in `x <!-- y` everything from `<!--` to the end of the line is ignored; in a module it's a SyntaxError.
- Calling `with` or `010` "Annex B". They're legacy, but specified in the main body and required in every host.

## Follow-ups

**Q:** Why not just delete these features?
**A:** Because browsers can't ship a change that breaks existing pages. Writing the legacy behaviour down at least makes every browser behave the same way; non-browser hosts may leave it out.

**Q:** Why does `typeof document.all` return `"undefined"`?
**A:** `document.all` is a host object with the `[[IsHTMLDDA]]` slot. Annex B makes such objects falsy in `ToBoolean`, loosely equal to `null` and `undefined`, and report `"undefined"` from `typeof`. The spec says it exists for web compatibility and that no other object should have it.

**Q:** Does strict mode turn Annex B off?
**A:** Partly. The B.3 semantics for block functions and labelled functions, and HTML-like comments in modules, depend on code being sloppy or a script. The B.2 built-ins such as `substr` exist regardless of mode.

## Exercises

### Predict the output

```js
const sloppy = (source) => (0, eval)(source);
console.log(sloppy('try { throw 1 } catch (e) { var e = 2 } e'));
```

**Answer:** `undefined`. B.3.4 lets `var e` redeclare the catch parameter in sloppy code, but the declaration is hoisted to the global scope while the initialiser assigns to the catch parameter, the innermost `e`. After the `catch` block, `e` resolves to the hoisted `var`, which was never assigned.
