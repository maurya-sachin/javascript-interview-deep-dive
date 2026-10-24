---
title: "Is building a string with `+=` in a loop slow?"
status: draft
difficulty: medium
frequency: 2
core: false
tags: [strings, performance, v8, ropes, concatenation]
related:
  - javascript/strings-and-unicode/utf16-string-length
  - javascript/strings-and-unicode/everyday-string-methods
  - javascript/how-javascript-runs/ecmascript-engine-host
verified: 2026-10
perishable:
  - V8 ConsString and SlicedString minimum length is 13
  - V8 maximum string length is 2**29 - 24 on 64-bit
sources:
  - https://tc39.es/ecma262/#sec-applystringornumericbinaryoperator
  - https://tc39.es/ecma262/#sec-ecmascript-language-types-string-type
  - https://tc39.es/ecma262/#sec-string.prototype.concat
  - https://tc39.es/ecma262/#sec-template-literals-runtime-semantics-evaluation
  - https://chromium.googlesource.com/v8/v8/+/main/src/objects/string.h
  - https://nodejs.org/docs/latest-v24.x/api/buffer.html#bufferconstantsmax_string_length
tldr: >
  Not in modern engines. The spec only defines the result; strings are immutable, so a naive
  engine would copy everything on each `+=`. V8 instead builds a rope: `a + b` makes a
  ConsString pointing at both parts, and the characters are copied once, when the string is
  flattened. A `+=` loop and `array.join('')` are both fine; measure before rewriting.
---

## Answer

Not in current engines, but the reason is an engine optimisation, not the language.

The spec defines `+` on strings as producing a new String value, the concatenation of the two operands' code units; no string is ever modified in place. It says nothing about cost. Implemented naively, every `s += piece` would allocate a new buffer and copy all of `s`, so a loop building an n-character string would copy O(n²) characters.

**In V8**, `+` usually doesn't copy. Its source describes a **ConsString**: a pair of pointers to two other strings, which can themselves be ConsStrings, forming a binary tree (a *rope*) whose leaves, read left to right, are the value. Appending creates one small node, so a `+=` loop costs about one allocation per iteration. Results shorter than 13 characters are copied into a flat string instead, because a node isn't worth it.

The copy happens later, once: V8 **flattens** a cons string by allocating one sequential string with all the characters, and turns the original into a degenerate cons whose first part is that flat string. It does this when an operation needs the characters in one contiguous buffer.

V8 uses the same idea for substrings: a **SlicedString** (also 13+ characters) stores a pointer to the parent plus an offset and length instead of copying.

Practical answer for an interview:

- Write the clear version. `+=`, template literals and `array.join('')` all perform well in V8; profile before "optimising".
- `join` still reads better when pieces are already in an array or need a separator.
- Engine specifics change; SpiderMonkey and JavaScriptCore have their own string representations, so don't build on one engine's thresholds.

## Example

```js
import { execFileSync } from 'node:child_process';

// Asks V8 for a string's internal type in a child process (V8 debug API, not JavaScript).
const v8TypeOf = (expression) => {
  const script = `const pid = String(process.pid); %DebugPrint(${expression});`;
  const output = execFileSync(process.execPath, ['--allow-natives-syntax', '-e', script]);
  return output.toString().match(/type: (\w+)/)[1];
};

// Node.js 24 prints:
console.log(v8TypeOf("'a long enough prefix: ' + pid")); // → CONS_ONE_BYTE_STRING_TYPE
console.log(v8TypeOf("'pid ' + pid")); // → SEQ_ONE_BYTE_STRING_TYPE
console.log(v8TypeOf("('a long enough prefix: ' + pid).slice(0, 20)")); // → SLICED_ONE_BYTE_STRING_TYPE
console.log(v8TypeOf("'a long enough prefix: ' + pid + ' 😀'")); // → CONS_TWO_BYTE_STRING_TYPE

let html = '';
for (let i = 0; i < 100_000; i++) html += '<li></li>';
console.log(html.length); // → 900000
```

## Pitfalls

- Rewriting every `+=` into `push`/`join` "for performance" without measuring. In V8 it's usually no faster, and the code gets harder to read.
- Keeping a short slice of a huge string. In V8 a SlicedString points at its parent, and the source notes it can't yet truncate to let an otherwise unneeded parent be collected, so a 20-character slice can keep megabytes alive.
- Ignoring the length limit. Strings have a maximum length (in Node.js 24, `buffer.constants.MAX_STRING_LENGTH` is 536,870,888 code units); exceeding it throws a `RangeError`.
- Presenting ropes as JavaScript behaviour. They're a V8 implementation detail, so name the engine.

## Follow-ups

**Q:** What's the `ONE_BYTE`/`TWO_BYTE` in the type names?
**A:** In V8, a string whose code units all fit in one byte (Latin-1) is stored at one byte per unit; any wider unit, such as half of an emoji's surrogate pair, makes it two-byte. JavaScript still sees UTF-16 code units either way.

**Q:** Is a template literal faster than `+`?
**A:** Don't expect a meaningful difference: both are specified as string concatenation, and in Node.js 24 a long template result is also a ConsString. Choose by readability, and measure if a hot path matters.

**Q:** Do `+`, `concat` and template literals give the same string?
**A:** Not always, for objects. `+` calls `ToPrimitive` with no hint (`valueOf` first); `concat` and `${}` call `ToString` (`toString` first). With `{ valueOf: () => 1, toString: () => 'two' }`, `'a' + o` is `"a1"` but `'a'.concat(o)` is `"atwo"`.

## Exercises

### Predict the output

```js
const big = 'x'.repeat(2 ** 20);
const pieces = [big.slice(0, 20), big.slice(0, 20)];
console.log(pieces[0] === pieces[1], pieces[0].length);
```

**Answer:** `true 20`. String equality compares contents, never representation; whether V8 stores each slice as a SlicedString pointing into `big` is invisible to JavaScript. What it can affect is memory: in V8, each slice may keep the 1 MiB parent reachable.
