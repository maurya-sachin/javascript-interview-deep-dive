---
title: "How do you handle errors you didn't catch?"
status: draft
difficulty: medium
frequency: 2
core: false
tags: [uncaught-exception, unhandled-rejection, window-onerror, reporterror, process-on, exit-code, monitoring]
related:
  - javascript/errors-and-cleanup/async-error-boundaries
  - javascript/promises/promise-error-handling
  - javascript/async-and-the-event-loop/event-loop
verified: 2026-10
sources:
  - https://html.spec.whatwg.org/multipage/webappapis.html#runtime-script-errors
  - https://html.spec.whatwg.org/multipage/webappapis.html#unhandled-promise-rejections
  - https://html.spec.whatwg.org/multipage/webappapis.html#event-handler-attributes
  - https://nodejs.org/docs/latest-v24.x/api/process.html#event-uncaughtexception
  - https://nodejs.org/docs/latest-v24.x/api/process.html#event-unhandledrejection
  - https://nodejs.org/docs/latest-v24.x/api/process.html#event-rejectionhandled
  - https://nodejs.org/docs/latest-v24.x/api/process.html#exit-codes
  - https://nodejs.org/docs/latest-v24.x/api/cli.html#--unhandled-rejectionsmode
  - https://developer.mozilla.org/en-US/docs/Web/API/Window/error_event
  - https://developer.mozilla.org/en-US/docs/Web/API/Window/unhandledrejection_event
  - https://developer.mozilla.org/en-US/docs/Web/API/Window/reportError
tldr: >
  The host reports errors that nothing caught. Browsers fire an `error` event on `window` for uncaught
  exceptions and `unhandledrejection` for promises nobody handled. Node.js emits `uncaughtException` and
  `unhandledRejection` on `process`, and by default exits with code 1. Use these hooks to log and shut down
  cleanly, not to keep running.
---

## Answer

The language has no global error handler. Each host (the browser, Node.js) decides what happens when a throw or rejection reaches the top, and offers a hook.

**Browsers**
- An uncaught exception fires an `error` event (an `ErrorEvent`) on `window`. `window.onerror` receives `(message, source, lineno, colno, error)`, and returning `true` cancels the default console report. `addEventListener('error', ...)` gives the same event object.
- A promise that is rejected with no handler fires `unhandledrejection` with `event.promise` and `event.reason`. `event.preventDefault()` cancels the event, so the browser skips its default console report. If a handler is attached later, `rejectionhandled` fires.
- `reportError(error)` reports an error as if it were uncaught, without throwing. Libraries use it to surface errors from callbacks they swallow.

**Node.js**
- `process.on('uncaughtException', (error, origin) => ...)`. Without a listener, Node prints the stack and exits with code 1. With one, the process continues, and exits with code 0 unless you set `process.exitCode`.
- `process.on('unhandledRejection', (reason, promise) => ...)`. The default mode (`--unhandled-rejections=throw`) emits this event, and if there is no listener it raises the rejection as an uncaught exception.
- A throw inside the `uncaughtException` handler itself exits with code 7.

**What to do in them:** log the error with context, send it to monitoring, flush what you can, and in Node.js exit so a supervisor restarts the process. The Node.js docs call `uncaughtException` a last resort: after one, the application is in an undefined state and it is not safe to resume normal operation. In the browser, use the hooks for telemetry, and keep real handling at the call sites (error boundaries, `try`/`catch`, `.catch`).

## Example

```js
const report = (kind, error) => console.log(`report ${kind}: ${error.message}`);

process.on('uncaughtException', (error, origin) => {
  report(origin, error);
  process.exitCode = 1;
});
process.on('unhandledRejection', (reason) => {
  report('unhandledRejection', reason);
  process.exitCode = 1;
});

setTimeout(() => {
  throw new Error('timer failed');
}, 0);
Promise.reject(new Error('promise lost'));
// → report unhandledRejection: promise lost
// → report uncaughtException: timer failed
```

Node.js example, run in Node 24. The process exits with code 1 once the work is done.

## Pitfalls

- Treating `uncaughtException` as `catch`. Resuming after it can leave open handles, half-written state, and locks. Log, clean up synchronously, and exit.
- Registering a handler that swallows everything. Adding any `unhandledRejection` listener removes the default crash, so failures turn into log lines and the process exits with code 0 unless you set `process.exitCode`.
- Throwing or doing async work inside the handler. A throw in an `uncaughtException` handler exits with code 7, and async cleanup may not finish before exit. Also, `reportError` is a browser and worker API: `typeof reportError` is `"undefined"` in Node 24.
- Expecting `error` events to carry the real error cross-origin. For a classic script from another origin served without CORS, the browser mutes it to `"Script error."` with no line number.

## Follow-ups

**Q:** What is the difference between `unhandledrejection` and `rejectionhandled`?
**A:** `unhandledrejection` fires when a rejected promise has no handler by the time the host checks. If a handler is attached afterwards, `rejectionhandled` (browser) or `'rejectionHandled'` (Node.js) fires, so tools can retract the report.

**Q:** Should `uncaughtException` handlers keep the server running?
**A:** No. State may be corrupt. Do synchronous cleanup, exit, and let a process manager restart. `'uncaughtExceptionMonitor'` observes the error without changing the default crash.

**Q:** How do you make a rejection crash the process even with a listener?
**A:** Rethrow it from the `unhandledRejection` handler. The throw reaches `uncaughtException`, whose origin is then `'uncaughtException'`. Or run Node with `--unhandled-rejections=strict`.

## Deep dive

### How it works

**Browsers.** The HTML standard's *report an exception* algorithm creates an `ErrorEvent` and fires `error` at the global object with `cancelable: true`. The `onerror` handler is special: because the event is an `ErrorEvent` on a window or worker global, the handler gets five arguments, and a `true` return value cancels the event. If nothing cancels it, the browser may report to the developer console, and for a dedicated worker the error is also fired at the `Worker` object in the parent. `reportError(e)` runs the same algorithm.

Unhandled rejections go through `HostPromiseRejectionTracker`: the engine tells the host when a promise is rejected without a handler, and later when a handler is added. The host collects them in an "about-to-be-notified" list and, after the current task and its microtasks finish, fires `unhandledrejection` for each promise that is still unhandled. The event is cancelable too.

```js
// Browser only, not run here
window.addEventListener('error', (event) => {
  sendToMonitoring(event.error ?? event.message);
});
window.addEventListener('unhandledrejection', (event) => {
  sendToMonitoring(event.reason);
  event.preventDefault(); // suppress the default console error
});
```

**Node.js.** An exception that reaches the event loop is emitted as `'uncaughtException'` if there is a listener, and otherwise printed with exit code 1. A rejection with no handler within a turn of the event loop emits `'unhandledRejection'`. The default mode is `throw`: emit the event, and with no listener raise it as an uncaught exception. Other `--unhandled-rejections` modes are `strict`, `warn`, `warn-with-error-code`, and `none`. The exit codes can be checked directly:

```js
import { spawnSync } from 'node:child_process';

const exitCode = (code) => spawnSync(process.execPath, ['-e', code]).status;

console.log(exitCode(`throw new Error('boom')`));
// → 1
console.log(exitCode(`process.on('uncaughtException', () => {}); throw new Error('boom')`));
// → 0
console.log(exitCode(`process.on('uncaughtException', () => { throw new Error('again'); }); throw new Error('boom')`));
// → 7
console.log(exitCode(`Promise.reject(new Error('lost'))`));
// → 1
console.log(exitCode(`process.on('unhandledRejection', () => {}); Promise.reject(new Error('lost'))`));
// → 0
```

### Edge cases

- Rejections with a non-error reason (`Promise.reject('text')`) still crash by default, but give you no stack. Reject with `Error` objects.
- Errors thrown during the ES module static loading phase of the entry point are always raised as uncaught exceptions, whatever the rejection mode.
- An uncaught error in a dedicated worker is also fired as an `error` event at the `Worker` object in its owner.
- Node.js passes `origin` (`'uncaughtException'` or `'unhandledRejection'`) to `uncaughtException` listeners, so a logger can tell a thrown error from a rejection that was promoted to one.

### Real-world scenario

A Node.js service installs one module at startup. On either event it logs the error with its stack and request context, starts a bounded shutdown (stop accepting connections, close what it can), sets `process.exitCode = 1`, and lets a supervisor (systemd, Kubernetes, PM2) restart it. A browser app registers `error` and `unhandledrejection` once, forwards `event.error` and `event.reason` to its monitoring service, and still uses error boundaries and `.catch` for recoverable cases, so users see an error screen instead of a blank page.

### Trade-offs

Global handlers are a safety net for reporting and cannot recover, because they have lost the call context that explains what failed. Aggressive crash-on-unhandled behavior surfaces bugs early and keeps state clean, but one stray rejection can take down a busy server. Most teams accept that and rely on restarts and graceful draining. The alternative of swallowing and continuing hides bugs, which the Node.js docs warn against.

## Exercises

### Does the process exit with an error

```js
import { spawnSync } from 'node:child_process';

const code = `
  process.on('unhandledRejection', (reason) => console.log('seen', reason.message));
  Promise.reject(new Error('lost'));
`;
console.log(spawnSync(process.execPath, ['-e', code]).status);
```

**Answer:** Prints `0` (the child prints `seen lost`). A listener replaces the default crash in the `throw` mode, and nothing sets `process.exitCode`. A real handler should set it, or exit.

### Which event

```js
process.on('uncaughtException', (error, origin) => console.log('uncaught', origin));
process.on('unhandledRejection', () => console.log('unhandled'));
process.on('unhandledRejection', () => { throw new Error('rethrown'); });
Promise.reject(new Error('lost'));
```

**Answer:** `unhandled`, then `uncaught uncaughtException` (run in Node 24). Both listeners run for the rejection. The second one throws, and that throw is an uncaught exception, so its origin is `'uncaughtException'`.

### Browser: stop the console error

```js
// Browser only, not run here
window.addEventListener('unhandledrejection', (event) => {
  console.log('reason:', event.reason);
  event.preventDefault();
});
Promise.reject('nope');
```

**Answer:** The handler logs `reason: nope`, and the browser does not print its default unhandled-rejection message, because the event was canceled. This follows the HTML standard's notify-about-rejected-promises steps (not run here, because it needs a browser).
