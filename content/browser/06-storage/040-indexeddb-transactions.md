---
title: "How does IndexedDB work, and why do its transactions commit on their own?"
status: draft
difficulty: hard
frequency: 3
core: false
tags: [indexeddb, transactions, auto-commit, object-store, versionchange]
related:
  - browser/storage/choosing-browser-storage
  - javascript/async-and-the-event-loop/task-microtask-ordering
  - browser/workers/structured-clone-and-transfer
  - javascript/objects-and-properties/shallow-vs-deep-copy
  - browser/storage/quotas-and-eviction
verified: 2026-10
perishable:
  - "IDBTransaction.commit(): Chrome 76+, Firefox 74+, Safari 15+"
  - "Durability hint: Chrome 83+, Firefox 126+, Safari 15+"
sources:
  - https://w3c.github.io/IndexedDB/#transaction-lifecycle
  - https://w3c.github.io/IndexedDB/#cleanup-indexed-database-transactions
  - https://w3c.github.io/IndexedDB/#fire-a-success-event
  - https://w3c.github.io/IndexedDB/#upgrade-transaction
  - https://w3c.github.io/IndexedDB/#dom-idbdatabase-createobjectstore
  - https://w3c.github.io/IndexedDB/#dom-idbtransaction-commit
  - https://w3c.github.io/IndexedDB/#transaction-durability-hint
  - https://w3c.github.io/IndexedDB/#eventdef-idbopendbrequest-blocked
  - https://w3c.github.io/IndexedDB/#handling-versionchange
  - https://html.spec.whatwg.org/multipage/webappapis.html#perform-a-microtask-checkpoint
  - https://html.spec.whatwg.org/multipage/webappapis.html#clean-up-after-running-a-callback
  - https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/commit#browser_compatibility
  - https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/durability#browser_compatibility
tldr: >
  IndexedDB stores structured clones in object stores, with indexes, inside versioned databases;
  schema changes happen only in `upgradeneeded`. Every request runs in a transaction that stays
  active only while its creating task runs or one of its request events is dispatched. Once no
  requests are pending, it commits, so awaiting `fetch()` or a timer mid-transaction makes the
  next request throw.
---

## Answer

IndexedDB is the browser's asynchronous, transactional object database, one set of databases per origin.

- **Versions.** `indexedDB.open(name, version)` opens a database. A higher version fires `upgradeneeded` inside a `versionchange` transaction, the only place to create or delete object stores and indexes.
- **Object stores** hold structured clones (objects, `Date`, `Map`, `Blob`…), keyed by a `keyPath` property, a key generator or an explicit key. **Indexes** query by another property: `store.index('byPrice').getAll(IDBKeyRange.upperBound(8))`.
- **Transactions.** Every read and write is a request in a transaction over named stores, `readonly` or `readwrite`. Read-write transactions over the same store run one at a time. A failed request you don't handle aborts the transaction and rolls back its writes.

**Why it commits on its own.** A transaction is *active* while the task that created it runs, and again while each of its requests' `success` or `error` events is dispatched. Requests can only be placed while it's active. When every request has finished and no new one was placed, the browser commits. There's no keep-alive: the transaction lasts exactly as long as you keep placing requests from its own callbacks.

So a `fetch()`, a timer or any other non-IndexedDB wait in the middle breaks it. When your code resumes, the transaction is inactive or already committed, and the next request throws `TransactionInactiveError`. Awaiting a promise that wraps an IndexedDB request is fine: the success handler resolves it, and the code after `await` runs in the microtask checkpoint inside that dispatch, while the transaction is still active.

The fix is ordering: fetch first, then open the transaction and write. `tx.commit()` commits as soon as the placed requests finish, without waiting for their handlers, and the `durability: 'relaxed'` option trades crash safety for speed.

## Example

```js
const done = (req) => new Promise((resolve, reject) => {
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

const open = indexedDB.open('shop', 1);
open.onupgradeneeded = () => {
  const items = open.result.createObjectStore('items', { keyPath: 'id' });
  items.createIndex('byPrice', 'price');
};
const db = await done(open);

let items = db.transaction('items', 'readwrite').objectStore('items');
await done(items.put({ id: 1, price: 5 }));
const item = await done(items.get(1)); // still active: resumed inside the success event
console.log(item.price);
// → 5

items = db.transaction('items', 'readwrite').objectStore('items');
await fetch('/prices.json'); // any non-IndexedDB wait: network, a timer, a message
try {
  items.put({ id: 1, price: 6 });
} catch (e) {
  console.log(e.name);
}
// → TransactionInactiveError
```

Chrome 156 and Firefox 159 printed the same in 3 runs each. The second transaction committed empty while `fetch()` was in flight.

## Pitfalls

- Awaiting network or timers mid-transaction. The next request throws, or, if the earlier writes already committed, the operation is half done.
- Creating stores outside `upgradeneeded`. `createObjectStore()` then throws `InvalidStateError`; bump the version instead.
- Ignoring `versionchange`. A tab still holding the old version blocks the upgrade in a newer tab. Handle it with `db.onversionchange = () => db.close()` and prompt a reload.
- Letting one failed request go unhandled. `add()` of an existing key fails with `ConstraintError` and aborts the transaction, rolling back the `put()` placed before it.

## Follow-ups

**Q:** What exactly happens when two tabs need different versions?
**A:** The newer tab's `open()` fires `versionchange` on every old connection. If one stays open, the request gets `blocked` and `upgradeneeded` waits until it closes. Closing inside `versionchange` let the upgrade run without `blocked` in Chrome 156 and Firefox 159.

**Q:** What can't IndexedDB store?
**A:** Anything structured clone rejects: functions and DOM nodes threw `DataCloneError` from `put()` in both browsers. Class instances come back as plain objects, the same rules as `postMessage()`.

**Q:** When is `commit()` useful?
**A:** After the last request of a batch: the browser commits without waiting for the event handlers. Any later request on that transaction throws `TransactionInactiveError`. Chrome 76+, Firefox 74+, Safari 15+.

## Deep dive

### How it works

The IndexedDB spec gives each transaction a state: *active*, *inactive*, *committing* or *finished*. Creating one marks it active and registers it for cleanup; at the end of the current microtask checkpoint, HTML's event loop runs "cleanup Indexed Database transactions", which sets it inactive. So a transaction survives `await Promise.resolve()` right after it's created, but not a new task.

Firing a request's `success` event sets the transaction active, dispatches, then sets it inactive again. If its request list is then empty, the transaction commits right there. Microtasks queued by a listener run when the listener returns, still inside the dispatch, which is why promise wrappers work.

### Edge cases

Each wait placed before the next request in a `readwrite` transaction, in Chrome 156 and Firefox 159 (same results):

| Wait | Next request |
|---|---|
| `await` a promise-wrapped IndexedDB request | works |
| `await Promise.resolve()` right after creating the transaction | works |
| `queueMicrotask()` inside a `success` handler | works |
| `setTimeout(…, 0)` inside a `success` handler | `TransactionInactiveError` |
| `await` a `setTimeout` promise | `TransactionInactiveError` |
| `await fetch()` | `TransactionInactiveError` |
