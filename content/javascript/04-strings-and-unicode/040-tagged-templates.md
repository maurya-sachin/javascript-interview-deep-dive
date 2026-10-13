---
title: "How do tagged template literals work?"
status: draft
difficulty: medium
frequency: 3
core: false
tags: [template-literal, tagged-template, string-raw, cooked, raw, escaping]
related:
  - javascript/strings-and-unicode/utf16-string-length
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-tagged-templates-runtime-semantics-evaluation
  - https://tc39.es/ecma262/#sec-gettemplateobject
  - https://tc39.es/ecma262/#sec-static-semantics-templatestrings
  - https://tc39.es/ecma262/#sec-string.raw
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/raw
tldr: >
  A tagged template, tag`a${x}b`, calls the tag function with a frozen array of the literal string parts
  (with a `raw` property holding the unprocessed text) followed by the substitution values as separate
  arguments. The same array object is reused for each call from the same source location. The tag may
  return any value, not just a string.
---

## Answer

Putting an expression before a template literal turns it into a call: tag`a${x}b${y}c` calls `tag(strings, x, y)`.

- **First argument:** `strings`, an array of the literal pieces. It always has one more element than there are substitutions. It is **frozen**, and so is its `strings.raw` array.
- **Remaining arguments:** the substitution values, **not converted to strings**. The tag decides what to do with them (`${obj}` is not stringified for you).
- **`strings.raw`:** the source text of each piece, with escape sequences left unprocessed. For `` `a\n` `` the cooked element is `"a"` plus a newline; the raw element is `a\n` with a literal backslash.
- **Return value:** whatever the tag returns, which need not be a string. Libraries return DOM nodes, query objects, or functions.

The spec builds the strings array once per source location per realm (`GetTemplateObject`) and caches it, so the same call site passes the identical array each time it runs. That identity makes it a safe cache key. Two textually identical tagged templates at different locations get different arrays.

If a piece contains an invalid escape such as `\unicode`, an untagged template is a syntax error, but a tagged one is allowed: the cooked element is `undefined` and the raw text is still available.

`String.raw` is the built-in tag that returns the raw text with substitutions joined in. It is handy for Windows paths and for regex source.

Tagging is how safe-by-construction APIs are built: the tag sees the fixed text and the dynamic values separately, so it can escape or parameterize the values (HTML escaping, SQL placeholders). Plain template literals cannot do that, because they hand you only the merged string.

## Example

```js
function tag(strings, ...values) {
  console.log(strings.length === values.length + 1); // → true
  console.log(strings, strings.raw); // → [ 'line\n', '' ] [ 'line\\n', '' ]
  console.log(Object.isFrozen(strings), values); // → true [ 'x' ]
}
tag`line\n${"x"}`;

const same = (strings) => strings;
const calls = [1, 2].map(() => same`site`);
console.log(calls[0] === calls[1]); // → true (one call site)
console.log(same`site` === same`site`); // → false (two call sites)

console.log(String.raw`C:\new\table${1}`); // → C:\new\table1

// Illustrative only: not a complete HTML sanitizer.
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const html = (strings, ...values) =>
  strings.reduce((out, part, i) => out + part + (i < values.length ? escapeHtml(values[i]) : ""), "");
console.log(html`<p>${'<img src=x onerror="alert(1)">'}</p>`);
// → <p>&#60;img src=x onerror=&#34;alert(1)&#34;&#62;</p>
```

## Pitfalls

- Expecting the tag to receive strings for the values. `${[1, 2]}` arrives as the array; call `String(value)` yourself if needed.
- Treating `strings` as always plain data. It is frozen, so `strings.push(...)` or `strings[0] = ...` throws. Copy it first.
- Not handling `undefined` cooked pieces. With an invalid escape such as `\unicode`, `strings[i]` is `undefined`, so string methods on it throw. Read `strings.raw` when you accept arbitrary escapes.
- Assuming an untagged template stringifies like a tag would. Untagged `${x}` calls `ToString`, so a Symbol throws a `TypeError`, and objects become `"[object Object]"`.

## Follow-ups

**Q:** What does `String.raw` do?
**A:** It is a tag that concatenates the raw pieces with the substitutions converted to strings. Backslash sequences stay as typed. It also works as a function: `String.raw({ raw: ["a", "b"] }, 1)` returns `"a1b"`.

**Q:** What is `this` inside a tag called as ``obj.tag`x` ``?
**A:** `obj`. The tag expression is evaluated as a reference like any call's callee, so member tags receive their object as `this`.

**Q:** Does the tag run when the template is created?
**A:** It runs each time the expression is evaluated. Only the strings array is created once per site; the tag call and substitution expressions happen on every evaluation.

## Exercises

### Count the pieces

```js
const tag = (strings, ...values) => `${strings.length}:${values.length}`;
console.log(tag`${1}${2}`, tag`no substitutions`);
```

**Answer:** `3:2 1:0`. The pieces array always has one more element than there are substitutions, and consecutive substitutions are separated by empty strings.

### Cooked versus raw

```js
const show = (strings) => [strings[0], strings.raw[0]];
console.log(show`\unicode`);
console.log(show`a\tb`.map((s) => s.length));
```

**Answer:** `[ undefined, '\\unicode' ]`, then `[ 3, 4 ]`. The invalid escape cooks to `undefined`. The cooked tab is one character (`a`, tab, `b`); the raw text keeps the backslash and `t`.
