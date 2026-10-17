---
title: "What's the difference between ECMAScript, JavaScript, an engine, and a host?"
status: draft
difficulty: easy
frequency: 3
core: true
tags: [ecmascript, specification, engines, hosts, runtimes]
related:
  - javascript/how-javascript-runs/tc39-process
  - javascript/how-javascript-runs/compiled-or-interpreted
verified: 2026-10
sources:
  - https://tc39.es/ecma262/#sec-overview
  - https://tc39.es/ecma262/#sec-hosts-and-implementations
  - https://tc39.es/ecma262/#sec-host-defined
  - https://tc39.es/ecma262/#sec-hostenqueuepromisejob
  - https://tc39.es/ecma262/#sec-hostensurecancompilestrings
  - https://tc39.es/ecma262/#sec-HostLoadImportedModule
  - https://tc39.es/ecma262/#sec-hostgetimportmetaproperties
  - https://tc39.es/ecma262/#sec-global-object
  - https://tc39.es/ecma262/#sec-additional-ecmascript-features-for-web-browsers
  - https://html.spec.whatwg.org/multipage/webappapis.html#event-loops
  - https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html
  - https://v8.dev/
  - https://bun.sh/docs
  - https://docs.deno.com/api/deno/~/Deno.version
  - https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick
  - https://nodejs.org/docs/latest-v24.x/api/timers.html
  - https://nodejs.org/docs/latest-v24.x/api/esm.html
  - https://nodejs.org/docs/latest-v24.x/api/globals.html
  - https://html.spec.whatwg.org/multipage/structured-data.html#dom-structuredclone
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/JavaScript_technologies_overview
  - https://nodejs.org/docs/latest-v24.x/api/process.html#processversions
tldr: >
  ECMAScript is the specification (ECMA-262) that defines the language; JavaScript is the
  language as implemented. An engine (V8, SpiderMonkey, JavaScriptCore) implements the spec.
  A host (browser, Node.js, Deno, Bun) embeds an engine and adds what the spec leaves out:
  timers, I/O, the DOM, the event loop, and module loading.
---

## Answer

**ECMAScript** is the language specification, ECMA-262, written by TC39 and published as a yearly edition. It defines syntax, types, the built-ins (`Array`, `Promise`, `Map`, …) and the semantics of running code. **JavaScript** is the everyday name for that language as people use it; in practice the two mean the same thing, and "ES2024" just names a spec edition.

An **engine** is a program that implements the spec: it parses source, executes it, and manages memory. V8 (Chrome, Node.js, Deno), SpiderMonkey (Firefox) and JavaScriptCore (Safari, Bun) are the main ones.

A **host** (host environment) embeds an engine and supplies everything the spec deliberately does not define: timers, `console`, the DOM, `fetch`, file access, `process`, and the event loop that decides when queued work runs. Browsers, Node.js, Deno and Bun are hosts.

So who decides what? If the behaviour is in ECMA-262, it must be the same everywhere. If it is host-defined, it can differ, and the spec says so with *host hooks* such as `HostEnqueuePromiseJob`. `setTimeout`, `document` and `require` are not JavaScript; they are host APIs reached through the global object.

A useful test: if you could run the code in a bare engine shell with no host, would the feature exist? `Array.prototype.map` would; `setTimeout` would not.

## Example

```js
// ECMAScript-defined: present in every conforming engine.
console.log(typeof Array.prototype.map); // → function
console.log(typeof Promise.withResolvers); // → function

// Host-defined: Node.js provides these, a browser provides others.
console.log(typeof setTimeout); // → function
console.log(typeof process); // → object
console.log(typeof document); // → undefined

// The engine and the host are separate, versioned components.
console.log(typeof process.versions.v8); // → string
console.log(typeof process.versions.node); // → string
```

## Pitfalls

- Calling `setTimeout`, `console.log`, `fetch` or the DOM "part of JavaScript". They are host APIs; the spec defines none of them.
- Treating "V8" as a synonym for "Node.js". Node.js is a host built on V8 that adds libuv-backed I/O, `require`, and its own module loader.
- Assuming a new feature works because the spec has it. The engine must ship it first, and the host must expose any host-side parts.
- Saying "ES6 is JavaScript 6". Editions are named by the spec (ES2015 onward by year), not by a JavaScript version number.

## Follow-ups

**Q:** Is the event loop part of ECMAScript?
**A:** No. The spec defines Jobs and the host hooks that enqueue them, but the event loop, task queues, and ordering between timers and I/O are defined by the host (the HTML Standard for browsers, libuv-based code in Node.js).

**Q:** Are Node.js and Deno different languages?
**A:** No. Both run V8 and implement the same ECMAScript. They differ in host APIs: module resolution, permissions, built-in modules, and global objects.

**Q:** Who owns the spec, and who owns the engines?
**A:** TC39, a committee of Ecma International, owns ECMA-262. Each engine is owned by its vendor team (Google, Mozilla, Apple), which decides when to ship a feature.

## Deep dive

### How it works

The spec describes an abstract machine. It never says how to parse fast or lay out memory; it says what observable result an algorithm must produce, and an engine may do anything that gives the same results. That is why V8 and SpiderMonkey can be built so differently and still run the same programs.

The spec is deliberately incomplete at the edges. It marks those places as *host-defined* and defines a *host hook*: an abstract operation whose behaviour the host supplies. Examples are `HostEnqueuePromiseJob` (how a promise reaction becomes a queued Job), `HostEnsureCanCompileStrings` (lets a host forbid `eval`, which is how Content-Security-Policy hooks in), and `HostLoadImportedModule` (how `import` specifiers are resolved and fetched). The engine implements the language; the host implements the hooks and adds *host objects* to the global object.

```js
// Three promise callbacks, one timer. The spec fixes the order of the
// promise jobs; where the timer lands relative to I/O is up to the host.
setTimeout(() => console.log('timer'), 0);
Promise.resolve().then(() => console.log('job 1'));
queueMicrotask(() => console.log('job 2'));
console.log('sync');
// → sync
// → job 1
// → job 2
// → timer
```

`Promise.then` jobs are specified. `setTimeout` is host-defined. Browsers follow the HTML Standard's event loop, which runs a microtask checkpoint after each task; Node.js 24 prints the same order here.

### Edge cases

- **Global object contents.** The spec requires `globalThis` and the standard built-ins on it. Everything else is the host's choice: `window`/`self` in browsers, `global` in Node.js, `document` only with a DOM.
- **Same name, different behaviour.** `console` is not in ECMA-262. Output format, async behaviour, and available methods differ across hosts.
- **Hosts can add language-adjacent features.** `import.meta` is specified as syntax, but its properties come from the host (`HostGetImportMetaProperties`): `import.meta.url` in browsers and Node.js, `import.meta.dirname` in Node.js.
- **Spec edition vs. implementation.** A browser or runtime does not implement "ES2025" as a unit. Each engine ships features individually, so check support per feature, not per edition.
- **Legacy:** Web browsers also implement Annex B, a normative part of the spec that documents legacy web-compatibility behaviour only required of web-browser hosts.

### Real-world scenario

A utility library runs in the browser and in Node.js. It uses `structuredClone`, `setTimeout`, and `Array.prototype.at`. `at` is ECMAScript, so its availability depends only on the engine version. `setTimeout` exists in both hosts, but Node.js returns a `Timeout` object while browsers return a number, which is the host difference that breaks `typeof id === 'number'` checks. `structuredClone` is a host API (defined in the HTML Standard and added by Node.js), so the library must check the host, not the engine, before using it.

### Trade-offs

Splitting spec, engine, and host lets one language run in browsers, servers, and embedded devices, and lets engines compete on speed. The cost is that "it works in my runtime" never proves it is JavaScript. Writing portable code means sticking to ECMA-262, feature-detecting host APIs, and knowing which layer a bug report belongs to: a spec bug, an engine bug, or a host difference.
