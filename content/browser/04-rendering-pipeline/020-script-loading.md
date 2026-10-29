---
title: "How do `defer`, `async`, and module scripts change loading and execution order?"
status: draft
difficulty: medium
frequency: 5
core: true
tags: [script, defer, async, module-scripts, domcontentloaded, document-write, parser-blocking]
related:
  - javascript/how-javascript-runs/scripts-vs-modules
  - javascript/modules/es-module-loading
  - browser/rendering-pipeline/parser-and-render-blocking
  - browser/rendering-pipeline/pixel-pipeline
verified: 2026-10
sources:
  - https://html.spec.whatwg.org/multipage/scripting.html#attr-script-async
  - https://html.spec.whatwg.org/multipage/scripting.html#prepare-the-script-element
  - https://html.spec.whatwg.org/multipage/scripting.html#execute-the-script-element
  - https://html.spec.whatwg.org/multipage/scripting.html#dom-script-async
  - https://html.spec.whatwg.org/multipage/parsing.html#the-end
  - https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#document-write-steps
  - https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#ignore-destructive-writes-counter
tldr: >
  A plain `<script src>` stops the parser until it's fetched and run. `defer` fetches in parallel
  and runs after parsing, in document order, before `DOMContentLoaded`. `async` fetches in parallel
  and runs on arrival, in any order. Module scripts are deferred by default; `async` works on them,
  even inline. Script-inserted scripts are async unless `async = false`.
---

## Answer

A classic `<script src>` with no attributes is *parser-blocking*: the parser stops, the script is fetched and run, then parsing resumes. The attributes change whether fetching blocks the parser and when the script runs:

- **`defer`** (external classic scripts only): fetched in parallel with parsing; runs after parsing finishes, in document order, before `DOMContentLoaded`.
- **`async`**: fetched in parallel; runs as soon as it arrives, possibly mid-parse, in arrival order. It can run before or after `DOMContentLoaded`, but always before `load`.
- **`type="module"`**: deferred by default. The module and its imports are fetched in parallel, and it runs after parsing, in document order alongside `defer` scripts. `async` makes it run as soon as its graph is ready, and this works on inline modules too.
- **Inline classic scripts** ignore both attributes and run when the parser reaches them.
- **Script-inserted scripts** (`document.createElement('script')`) never block the parser and are async by default: `script.async` reads `true`. Set it to `false` to run several in insertion order.

`document.write()` only inserts markup from a parser-blocking classic script while the page is parsing. Called from an external `async` or `defer` script, or from any module, it is ignored; Chrome logs a warning and Firefox stays silent. Called after the document has finished loading, it implicitly opens a new document and wipes the page.

In practice: `defer` or modules for application code that needs the DOM and a fixed order; `async` for independent scripts such as analytics; parser-blocking scripts only when something must run before the rest of the document is parsed.

## Example

```html
<script>
  const order = [];
  window.log = (name) => order.push(name);
  document.addEventListener('DOMContentLoaded', () => log('DOMContentLoaded'));
  addEventListener('load', () => console.log(order.join(', ')));
</script>
<!-- each /js?name=… script runs log(name); delay is server latency in ms -->
<script defer src="/js?name=defer-slow&delay=300"></script>
<script defer src="/js?name=defer-fast"></script>
<script async src="/js?name=async-slow&delay=600"></script>
<script type="module">log('inline module');</script>
<script type="module" async>log('inline async module');</script>
<script defer>log('inline defer');</script>
<script>log('classic');</script>
<!-- → inline defer, classic, inline async module, defer-slow, defer-fast, inline module, DOMContentLoaded, async-slow -->
```

Served from a local Node server with real delays; Chrome 156 and Firefox 159 printed the same in three loads each. `defer-fast` waits for `defer-slow`, and the inline `defer` script runs immediately.

## Pitfalls

- Adding `defer` to an inline script and expecting it to wait for the DOM. Only external classic scripts honour it; wrap the code in a `DOMContentLoaded` listener or move it to a file.
- Loading dependent scripts with `async`, such as a library and its plugin. Arrival order decides, so the plugin can run first and throw.
- Injecting several scripts and expecting them to run in insertion order. They're async by default.
- Calling `document.write()` from code that may load asynchronously or late: it's dropped, or it replaces the page.

## Follow-ups

**Q:** Do `defer` scripts wait for style sheets?
**A:** Yes. After parsing, the HTML Standard waits before each deferred script until the document has no style sheet that is blocking scripts, so a slow `<link rel="stylesheet">` in `<head>` delays them, and `DOMContentLoaded` with them.

**Q:** What happens with both `async` and `defer`?
**A:** `async` wins: preparing the script checks it first. *Legacy:* `defer` was the fallback for browsers that didn't support `async`.

**Q:** What does `nomodule` do?
**A:** A classic script with `nomodule` is skipped by browsers that support modules, which let sites ship a fallback bundle next to a `type="module"` one. On a module script it has no effect.

## Deep dive

### How it works

The HTML Standard's *prepare the script element* algorithm runs when the parser finishes a `<script>` end tag, or when script connects a script element to the document. For an external classic script or any module script, it files the element in one of four places on the document:

1. **Set of scripts that will execute as soon as possible:** elements with `async`, or with the *force async* flag. Each runs whenever its fetch completes.
2. **List of scripts that will execute in order as soon as possible:** script-inserted elements without async. Each runs once it and everything before it are ready.
3. **List of scripts that will execute when the document has finished parsing:** parser-inserted `defer` and non-async module scripts.
4. **Pending parsing-blocking script:** everything else that the parser created. The parser stops until it runs.

An inline classic script skips all of this and runs at once, unless a style sheet is blocking scripts; then it becomes the pending parsing-blocking script.

*Force async* is why injected scripts are async. Elements created by the parser start with it false; elements created by script start with it true. The `async` getter returns `true` when either force async or the content attribute is set, and the setter clears force async, which moves the element from set 1 to list 2.

When parsing stops, *the end* runs: it sets `readyState` to `"interactive"`, runs list 3 in order (each waiting for its fetch and for blocking style sheets), queues `DOMContentLoaded`, then waits for sets 1 and 2 to empty and for everything delaying the load event before firing `load`.

Inline module scripts still go through a queued networking task even with no imports, so they never run synchronously the way inline classic scripts do.

### Edge cases

Script-inserted scripts, served with the same delays:

```js
const ran = [];
window.log = (name) => ran.push(name);
const add = (name, delay, inOrder) => {
  const script = document.createElement('script');
  if (inOrder) script.async = false;
  script.src = `/js?name=${name}&delay=${delay}`;
  document.head.append(script);
};
console.log(document.createElement('script').async);
// → true
add('a1', 300); add('a2', 0);             // default: run on arrival
add('o1', 300, true); add('o2', 0, true); // async = false: insertion order
addEventListener('load', () => {
  console.log(ran.filter((name) => name.startsWith('a')).join(', '));
  // → a2, a1
  console.log(ran.filter((name) => name.startsWith('o')).join(', '));
  // → o1, o2
});
```

Chrome 156 and Firefox 159 agreed in three loads each. How the two groups interleave differed between the browsers, which is allowed: only the order inside the ordered list is guaranteed.

- **Async before `DOMContentLoaded`.** With two parser-inserted `async` scripts (300 ms and 0 ms) and a 600 ms `defer` script, both browsers ran the fast async, the slow async, the deferred script, then `DOMContentLoaded`. Make the deferred script fast and the async ones run after it.
- **`document.write()` and the ignore-destructive-writes counter.** Executing an external script or any module increments the document's counter. `document.write()` with no parser insertion point returns early when the counter is above zero; without it, it would call `document.open()` and replace the document. Chrome 156 logged its warning for the module case too.
- **`currentScript`.** It points to the running classic `<script>`, but is `null` while a module runs; modules use `import.meta.url`.
- **Modules run once.** Two `<script type="module">` elements importing the same URL share one module instance from the module map, so its top-level code runs once.

### Real-world scenario

A page loads `vendor.js`, `app.js` that uses it, and an analytics tag, all with `async` to "make the page faster". Whenever the smaller `app.js` arrives first, it throws a `ReferenceError`, so the bug shows up only on some loads and networks. The fix: `defer` on `vendor.js` and `app.js` (or one module graph with `import`), keep `async` only on the independent analytics tag. If the analytics vendor's snippet still uses `document.write()`, loading it asynchronously silently drops the write, which is why such snippets were rewritten to inject elements.

### Trade-offs

Parser-blocking scripts give a guarantee nothing else does: they run before any later markup is parsed, which `document.write()` and early feature detection rely on. The cost is a stalled parser for every round trip. `defer` and modules keep the parser moving and preserve order, but nothing runs until parsing ends, so a huge HTML document delays the app. `async` runs earliest but gives up order and any guarantee about the DOM being complete.
