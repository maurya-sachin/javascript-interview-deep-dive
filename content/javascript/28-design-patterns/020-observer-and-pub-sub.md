---
title: "Implement an event emitter. How does observer differ from publish/subscribe?"
status: draft
difficulty: medium
frequency: 5
core: true
tags: [observer, pub-sub, event-emitter, event-target, memory-leaks]
related:
  - javascript/closures/what-is-a-closure
  - javascript/memory-and-gc/memory-leaks
  - javascript/errors-and-cleanup/uncaught-errors
  - javascript/design-patterns/singleton
verified: 2026-10
perishable:
  - Node.js EventEmitter default max listeners is 10
sources:
  - https://nodejs.org/api/events.html#asynchronous-vs-synchronous
  - https://nodejs.org/api/events.html#error-events
  - https://nodejs.org/api/events.html#eventsdefaultmaxlisteners
  - https://nodejs.org/api/events.html#emitterremovelistenereventname-listener
  - https://nodejs.org/api/events.html#emitterrawlistenerseventname
  - https://nodejs.org/api/events.html#eventtarget-error-handling
  - https://dom.spec.whatwg.org/#add-an-event-listener
  - https://dom.spec.whatwg.org/#remove-an-event-listener
  - https://dom.spec.whatwg.org/#concept-event-listener-invoke
  - https://dom.spec.whatwg.org/#concept-event-listener-inner-invoke
  - https://dom.spec.whatwg.org/#dom-eventtarget-addeventlistener
tldr: >
  An emitter keeps a list of listeners per event: `on` adds one and returns an unsubscribe
  function, `off` removes it, `once` wraps it so it removes itself, and `emit` calls a snapshot
  of the list synchronously. In observer, subscribers attach to the subject itself; in
  publish/subscribe, both sides know only a broker and a topic, never each other.
---

## Answer

**Observer** and **publish/subscribe** solve the same problem, telling interested code that something happened, with different coupling.

- **Observer:** the subject owns its list of observers and calls them directly. Observers subscribe *on the subject*, so each side holds a reference to the other. A DOM element's `addEventListener` and a Node.js stream's `'data'` event are observer.
- **Publish/subscribe:** publishers and subscribers know only a **broker** and a **topic** name. Neither can reach the other. The broker can be an app-wide event bus or a message system that adds asynchronous delivery, buffering and filtering.

The same emitter class can be either: owned by one object, it's observer; shared as a global bus, it's pub/sub. People use the words loosely, so name the coupling rather than argue the label.

An emitter interviewers will accept does five things:

1. `on(event, listener)` appends and **returns an unsubscribe function**, so callers can't forget which function they registered.
2. `off(event, listener)` removes it, and deletes the entry when the list is empty.
3. `once` registers a wrapper that removes itself before calling the listener, and remembers the original so `off(event, original)` still works.
4. `emit` calls listeners **synchronously, in registration order**, like Node.js's `EventEmitter` and DOM `dispatchEvent`.
5. `emit` iterates a **snapshot**, so listeners added or removed during an emit can't make it skip or repeat one. Below, `on`/`off` replace the array instead of mutating it, which makes every array already a snapshot.

Then state your error policy: by default one throwing listener stops the rest (as in Node.js's `EventEmitter`); the DOM reports the exception and keeps going.

## Example

```js
class Emitter {
  #listeners = new Map(); // event → array of listeners, replaced on change, never mutated
  on(event, listener) {
    this.#listeners.set(event, [...(this.#listeners.get(event) ?? []), listener]);
    return () => this.off(event, listener);
  }
  off(event, listener) {
    const list = this.#listeners.get(event) ?? [];
    const rest = list.filter((l) => l !== listener && l.listener !== listener);
    if (rest.length > 0) this.#listeners.set(event, rest);
    else this.#listeners.delete(event); // don't keep empty entries alive
  }
  once(event, listener) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      listener.apply(this, args);
    };
    wrapper.listener = listener; // lets off(event, listener) find the wrapper
    return this.on(event, wrapper);
  }
  emit(event, ...args) {
    const list = this.#listeners.get(event) ?? []; // a snapshot: on/off replace it
    for (const listener of list) listener.apply(this, args);
    return list.length > 0;
  }
}
const bus = new Emitter();
bus.once('save', (doc) => console.log('saved', doc));
bus.emit('save', 'a.txt'); // → saved a.txt
console.log(bus.emit('save', 'b.txt')); // → false
```

## Pitfalls

- Mutating the listener array in place (`splice`) while `emit` is looping over it. Removing the current listener shifts the next one into its slot, and the loop skips it.
- Implementing `once` without remembering the original. `off(event, original)` then finds nothing and the wrapper fires later anyway.
- Letting one throwing listener silently cancel the rest. Decide the policy and say it out loud.
- Never unsubscribing. The emitter's list keeps each listener, and everything its closure references, reachable for as long as the emitter lives. That is the classic leak of a component subscribed to a global bus.

## Follow-ups

**Q:** Should `emit` deliver synchronously or asynchronously?
**A:** Node.js's `EventEmitter` and DOM `dispatchEvent` are synchronous: `emit` returns after every listener ran, in order. That keeps ordering obvious and stack traces useful. A listener that needs to defer can schedule its own work; Node.js's docs suggest `setImmediate()` or `process.nextTick()`.

**Q:** What does Node.js do when an `'error'` event has no listener?
**A:** `emit('error', err)` throws `err`; uncaught, it crashes the process. So any `EventEmitter` that can fail needs an `'error'` listener. Node.js's `EventTarget` has no such special case.

**Q:** How does the DOM make unsubscribing easier?
**A:** `addEventListener` takes `{ once: true }` and `{ signal }`: aborting the `AbortController` removes the listener. It also ignores a second registration with the same type, callback and capture flag, so duplicates can't pile up.

**Q:** If the same function is registered twice, what does `off` remove?
**A:** It's a design choice. The Example removes every registration. Node.js's `removeListener` removes one, the most recently added. DOM `EventTarget` never stores duplicates in the first place.

## Deep dive

### How it works

The listener list is the whole design. Two decisions in it are worth explaining in an interview.

**Copy-on-write.** `on` and `off` build a new array and swap it into the map; nothing ever mutates an array that `emit` might be iterating. The cost moves to subscription time (O(n) per `on`/`off`), and `emit` allocates nothing. The alternative is to mutate in place and have `emit` copy the list (`[...list]`) on every call, which is cheaper when emits are rare and listeners change often. Both produce the same behaviour.

**The `once` wrapper.** The wrapper removes itself *before* calling the listener, so a listener that emits the same event again doesn't re-enter itself. Storing the original on `wrapper.listener` is what lets `off(event, original)` match. Node.js's own `once` wrappers keep the original on a `listener` property too; its docs show it through `rawListeners()`.

Observer versus pub/sub is a question of *where the list lives*. In observer it lives in the subject; in pub/sub it lives in the broker, keyed by topic. A topic broker is just this emitter with a shared instance, which is why both patterns are implemented with the same code and differ in who can see whom.

### Edge cases

**Removing a listener during an emit.** Implementations disagree on whether a listener removed mid-emit still runs:

```js
import { EventEmitter } from 'node:events';
// Emitter is the class from the Example

const ours = new Emitter();
const node = new EventEmitter();
const target = new EventTarget(); // Node.js's implementation of the DOM interface

const log = [];
const second = () => log.push('second');
ours.on('x', () => ours.off('x', second));
ours.on('x', second);
node.on('x', () => node.off('x', second));
node.on('x', second);
target.addEventListener('x', () => target.removeEventListener('x', second));
target.addEventListener('x', second);

ours.emit('x');
node.emit('x');
target.dispatchEvent(new Event('x'));
console.log(log); // → [ 'second', 'second' ]
```

Only two entries: the Example's emitter and Node.js's `EventEmitter` still call `second`, while `EventTarget` doesn't. Node.js's docs say every listener attached at the moment of emitting is called, so removals take effect from the next emit. The DOM spec clones the list too, but its "remove an event listener" step sets a *removed* flag, and the inner invoke loop skips listeners with that flag. Neither is wrong; pick one and document it.

**A throwing listener.** In the Example and in Node.js's `EventEmitter`, an exception propagates out of `emit` and later listeners don't run. The DOM's inner invoke instead *reports* the exception and continues; Node.js's `EventTarget` follows that and treats the error as an uncaught exception on the next tick. If you want isolation in your own emitter, collect errors and rethrow them together:

```js
function emitIsolated(listeners, ...args) {
  const errors = [];
  for (const listener of listeners) {
    try {
      listener(...args);
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length > 0) throw new AggregateError(errors, 'listener failed');
}

try {
  emitIsolated([() => { throw new TypeError('bad'); }, () => console.log('second ran')]);
} catch (error) {
  console.log(error.name, error.errors.length);
}
// → second ran
// → AggregateError 1
```

**The `'error'` event in Node.js.** If nothing listens, `emit('error', err)` throws `err` itself. This is specific to `EventEmitter`; the Example's emitter treats `'error'` like any other name unless you add the rule.

### Real-world scenario

A UI component subscribes to an app-wide store or bus when it mounts and forgets to unsubscribe when it unmounts. Every mount adds a listener; each listener's closure holds the component's state and often its DOM nodes, so unmounted screens stay reachable through the bus. The fix is structural: make `on` return the unsubscribe function and call it from the component's cleanup, or use an `AbortSignal` with `addEventListener`.

Node.js has a tripwire for this. By default it warns once more than 10 listeners are added for one event on one emitter; its docs describe this as a hint for finding leaks, not a hard limit:

```js
import { EventEmitter } from 'node:events';

process.on('warning', (warning) => console.log(warning.name));
const emitter = new EventEmitter();
for (let i = 0; i < 11; i++) emitter.on('data', () => {});
console.log(emitter.listenerCount('data')); // → 11
// → MaxListenersExceededWarning
```

The warning arrives after the synchronous code finishes, and Node.js also prints it to stderr. Raising the limit with `setMaxListeners` is right only when many listeners are legitimate.

### Trade-offs

Events decouple the sender from its receivers, which is the point and also the cost: "who reacts to this?" is no longer answerable by reading the call site. Pub/sub decouples further, so a typo in a topic name fails silently. Prefer a direct call or an observer owned by the subject when there's one known receiver; reach for a bus when receivers genuinely come and go. Synchronous delivery keeps ordering and stack traces; asynchronous delivery protects the emitter from slow or throwing listeners at the cost of both.

## Exercises

### Predict the output

```js
class NaiveEmitter {
  listeners = [];
  on(fn) { this.listeners.push(fn); }
  off(fn) { this.listeners.splice(this.listeners.indexOf(fn), 1); }
  emit() { for (const fn of this.listeners) fn(); }
}
const e = new NaiveEmitter();
const a = () => { console.log('a'); e.off(a); };
const b = () => console.log('b');
e.on(a);
e.on(b);
e.emit();
e.emit();
```

**Answer:** `a`, then `b`. During the first emit, `a` splices itself out at index 0, `b` moves to index 0, and the array iterator moves on to index 1, so `b` is skipped. Only the second emit reaches `b`. (`off` has a second bug: for an unknown `fn`, `indexOf` returns `-1` and `splice(-1, 1)` removes the last listener.)

### Predict the output

```js
import { EventEmitter } from 'node:events';
const node = new EventEmitter();
const greet = () => console.log('hi');
node.once('ready', greet);
node.off('ready', greet);
console.log(node.emit('ready'), node.listenerCount('ready'));
```

**Answer:** `false 0`. Node.js's `once` wrapper keeps a reference to `greet`, so `off` with the original function finds and removes the wrapper. `emit` returns `false` because no listeners were registered for `'ready'`.
