---
title: "What does strict mode change, and when is code strict automatically?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [strict-mode, sloppy-mode, modules, classes, arguments]
related:
  - javascript/how-javascript-runs/scripts-vs-modules
  - javascript/scope-and-execution-contexts/hoisting
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-strict-mode-of-ecmascript
  - https://tc39.es/ecma262/#sec-strict-mode-code
  - https://tc39.es/ecma262/#sec-createunmappedargumentsobject
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode/Transitioning_to_strict_mode
tldr: >
  Strict mode turns silent mistakes into errors and removes unsafe features: no implicit globals,
  assignments to read-only properties throw, `this` is not coerced to the global object, `with` and
  legacy octals are syntax errors, and `arguments` stops aliasing parameters. It is on for modules and
  class bodies, and opt-in with a "use strict" directive elsewhere.
---

## Answer

Strict mode is a restricted variant of the language that makes silent failures throw and drops error-prone legacy features. The non-strict default is called **sloppy mode**.

**What changes**

- Assigning to an undeclared name throws `ReferenceError` instead of creating a global.
- Writes that fail silently in sloppy mode throw `TypeError`: assigning to a read-only or getter-only property, adding a property to a non-extensible object, `delete` on a non-configurable property.
- `this` is not boxed or replaced: a plain function call has `this === undefined`, and a primitive `this` stays a primitive. Sloppy mode substitutes `globalThis` or a wrapper object.
- `arguments` is *unmapped*: it no longer aliases named parameters, and `arguments.callee` throws.
- Early (syntax) errors for: `with`, legacy octal literals such as `010`, duplicate parameter names, assigning to `eval` or `arguments`, and future reserved words like `public` as identifiers.
- Direct `eval` gets its own variable scope instead of leaking `var` declarations into the caller.

**When code is strict automatically**

- Module code, always.
- Class bodies (every method, accessor, field and static block, even in a sloppy script).
- Code nested inside strict code.

**Otherwise it is opt-in** with a `'use strict'` directive: the first statement of a script (whole file) or of a function (that function only). Function-body strictness applies to the function, not to the file around it.

## Example

```js
// Module code is strict. A Function-constructor body is sloppy unless it opts in.
const run = (body, ...params) => {
  try {
    return new Function(...params, body)(1);
  } catch (error) {
    return error.name;
  }
};

console.log(run('arguments[0] = 9; return a', 'a')); // → 9
console.log(run('"use strict"; arguments[0] = 9; return a', 'a')); // → 1
console.log(run('return this === globalThis')); // → true
console.log(run('"use strict"; return this')); // → undefined
console.log(run('undeclaredSloppy = 5; return undeclaredSloppy')); // → 5
console.log(run('"use strict"; undeclaredStrict = 5')); // → ReferenceError
console.log(run('with ({ x: 1 }) { return x }')); // → 1
console.log(run('"use strict"; with ({ x: 1 }) { return x }')); // → SyntaxError

class Counter {
  read() {
    return this;
  }
}
const read = new Counter().read;
console.log(read()); // → undefined
```

## Pitfalls

- Putting `'use strict'` after another statement. A directive must come first (comments are fine); otherwise it is just an expression statement and does nothing.
- Adding the directive to a function with default, rest, or destructured parameters. That combination is a `SyntaxError`.
- Thinking you need `'use strict'` in modules or classes. It is already in force there, and bundlers or transpilers adding it is redundant.
- Expecting a file-level directive to be harmless when concatenating scripts. It applies to everything after it in that script, so concatenating files can turn a sloppy file strict.

## Follow-ups

**Q:** Does strict mode make code faster?
**A:** The spec makes no performance promise, so treat strict mode as a correctness feature: it surfaces bugs that sloppy mode hides.

**Q:** What does `arguments` mapping mean?
**A:** In sloppy functions with simple parameters, `arguments[0]` and the first parameter share storage, so writing one changes the other. Strict functions get an unmapped copy, so they are independent.

**Q:** How do I adopt strict mode in legacy code?
**A:** One function at a time: add the directive, then fix the errors it reveals (undeclared variables, `this` assumptions, silent write failures). Moving files to ES modules gives the whole file strict mode at once.
