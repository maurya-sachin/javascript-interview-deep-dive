# Data Structures: Weak Collections

## Question 1: What are WeakMap and WeakSet in JavaScript and when should you use them?

### Answer

**WeakMap** and **WeakSet** are specialized collection types introduced in ES6 that hold weak references to their keys (WeakMap) or values (WeakSet). Unlike their strong counterparts (Map and Set), weak collections allow their entries to be garbage collected when there are no other references to the keys/values, making them ideal for scenarios where you need to associate data with objects without preventing those objects from being cleaned up.

### Key Characteristics

#### WeakMap
```javascript
const wm = new WeakMap();
const key = { id: 1 };

// Store data with object as key
wm.set(key, 'associated data');
console.log(wm.get(key)); // 'associated data'
console.log(wm.has(key)); // true
wm.delete(key);
```

**Key Features:**
- Only accepts objects as keys (no primitives)
- Keys are weakly referenced
- Not enumerable (no iteration methods)
- No `.size` property
- No `.clear()` method
- Keys can be garbage collected

#### WeakSet
```javascript
const ws = new WeakSet();
const obj = { id: 1 };

// Store objects in the set
ws.add(obj);
console.log(ws.has(obj)); // true
ws.delete(obj);
```

**Key Features:**
- Only accepts objects as values
- Values are weakly referenced
- Not enumerable (no iteration methods)
- No `.size` property
- No `.clear()` method
- Values can be garbage collected

### Fundamental Differences from Map/Set

#### Map vs WeakMap

```javascript
// ❌ Map: Strong references prevent garbage collection
const strongMap = new Map();
let user = { name: 'John', email: 'john@example.com' };
strongMap.set(user, 'user metadata');

// Even if we null the user reference, Map keeps it alive
user = null; // Map still holds the reference!
// Memory leak: object cannot be garbage collected

// ✅ WeakMap: Weak references allow garbage collection
const weakMap = new WeakMap();
let user2 = { name: 'Jane', email: 'jane@example.com' };
weakMap.set(user2, 'user metadata');

// When we null the user reference, WeakMap doesn't prevent GC
user2 = null; // Object can be garbage collected
// No memory leak: WeakMap entry will be automatically removed
```

#### Set vs WeakSet

```javascript
// ❌ Set: Strong references
const strongSet = new Set();
let listener = { callback: () => {} };
strongSet.add(listener);

listener = null; // Set still holds the reference
// Memory leak

// ✅ WeakSet: Weak references
const weakSet = new WeakSet();
let listener2 = { callback: () => {} };
weakSet.add(listener2);

listener2 = null; // Can be garbage collected
// No memory leak
```

### Comparison Table

| Feature | Map | WeakMap | Set | WeakSet |
|---------|-----|---------|-----|---------|
| Key/Value Types | Any | Objects only (keys) | Any | Objects only |
| Garbage Collection | No | Yes (weak refs) | No | Yes (weak refs) |
| Enumerable | Yes | No | Yes | No |
| `.size` property | Yes | No | Yes | No |
| `.clear()` method | Yes | No | Yes | No |
| Iteration methods | Yes | No | Yes | No |
| Use case | General purpose | Memory-sensitive | General purpose | Memory-sensitive |

### Memory Management and Garbage Collection

#### How Weak References Work

```javascript
// Strong reference example
let obj1 = { data: 'important' };
const map = new Map();
map.set(obj1, 'metadata');

// Reference count: 2 (obj1 variable + map key)
obj1 = null; // Reference count: 1 (map key)
// Object still exists in memory because Map holds it

// Weak reference example
let obj2 = { data: 'important' };
const weakMap = new WeakMap();
weakMap.set(obj2, 'metadata');

// Reference count: 1 (obj2 variable)
// WeakMap doesn't contribute to reference count
obj2 = null; // Reference count: 0
// Object becomes eligible for garbage collection
// WeakMap entry will be automatically removed
```

#### Garbage Collection Behavior

```javascript
// Demonstrating GC-eligible objects (conceptual)
function createWeakMapExample() {
  const wm = new WeakMap();

  // Create temporary objects
  for (let i = 0; i < 1000; i++) {
    let obj = { id: i, data: new Array(10000) };
    wm.set(obj, `metadata-${i}`);
    // obj goes out of scope at end of iteration
    // Eligible for GC immediately
  }

  // WeakMap automatically cleans up entries
  // as objects are garbage collected
  return wm;
}

// Compare with Map
function createMapExample() {
  const m = new Map();

  // Create temporary objects
  for (let i = 0; i < 1000; i++) {
    let obj = { id: i, data: new Array(10000) };
    m.set(obj, `metadata-${i}`);
    // obj goes out of scope BUT Map keeps it alive
    // NOT eligible for GC
  }

  // Map holds ALL objects in memory
  // Potential memory leak
  return m;
}
```

### Use Case 1: Private Data Pattern

```javascript
// ❌ Old way: Using Symbols (still accessible via reflection)
const _private = Symbol('private');

class User {
  constructor(name, password) {
    this.name = name;
    this[_private] = { password }; // Still accessible
  }
}

const user = new User('John', 'secret123');
console.log(Object.getOwnPropertySymbols(user)); // Can find it!

// ✅ WeakMap: True privacy with automatic cleanup
const privateData = new WeakMap();

class SecureUser {
  constructor(name, password) {
    this.name = name;
    // Store private data externally
    privateData.set(this, {
      password,
      loginAttempts: 0,
      lastLogin: null
    });
  }

  authenticate(password) {
    const data = privateData.get(this);
    if (data.password === password) {
      data.lastLogin = new Date();
      data.loginAttempts = 0;
      return true;
    }
    data.loginAttempts++;
    return false;
  }

  getLoginAttempts() {
    return privateData.get(this).loginAttempts;
  }
}

const secureUser = new SecureUser('John', 'secret123');
console.log(secureUser.password); // undefined - truly private!
console.log(secureUser.authenticate('secret123')); // true
console.log(secureUser.getLoginAttempts()); // 0

// When secureUser is garbage collected, private data is too
```

#### Advanced Private Data Pattern

```javascript
// ✅ Multiple private properties with WeakMap
const privateProps = new WeakMap();

class BankAccount {
  constructor(owner, initialBalance) {
    this.owner = owner;

    // Store all private data in one object
    privateProps.set(this, {
      balance: initialBalance,
      pin: null,
      transactions: [],
      isLocked: false
    });
  }

  setPin(pin) {
    const data = privateProps.get(this);
    if (pin.length !== 4) {
      throw new Error('PIN must be 4 digits');
    }
    data.pin = pin;
  }

  deposit(amount, pin) {
    const data = privateProps.get(this);

    if (data.isLocked) {
      throw new Error('Account is locked');
    }

    if (data.pin !== pin) {
      throw new Error('Invalid PIN');
    }

    data.balance += amount;
    data.transactions.push({
      type: 'deposit',
      amount,
      date: new Date(),
      balance: data.balance
    });
  }

  withdraw(amount, pin) {
    const data = privateProps.get(this);

    if (data.isLocked) {
      throw new Error('Account is locked');
    }

    if (data.pin !== pin) {
      throw new Error('Invalid PIN');
    }

    if (amount > data.balance) {
      throw new Error('Insufficient funds');
    }

    data.balance -= amount;
    data.transactions.push({
      type: 'withdrawal',
      amount,
      date: new Date(),
      balance: data.balance
    });
  }

  getBalance(pin) {
    const data = privateProps.get(this);
    if (data.pin !== pin) {
      throw new Error('Invalid PIN');
    }
    return data.balance;
  }

  getTransactionHistory(pin) {
    const data = privateProps.get(this);
    if (data.pin !== pin) {
      throw new Error('Invalid PIN');
    }
    return [...data.transactions]; // Return copy
  }
}

const account = new BankAccount('John Doe', 1000);
account.setPin('1234');
account.deposit(500, '1234');
account.withdraw(200, '1234');
console.log(account.getBalance('1234')); // 1300

// Private data is completely inaccessible
console.log(account.balance); // undefined
console.log(account.pin); // undefined
console.log(account.transactions); // undefined
```

### Use Case 2: DOM Node Metadata

```javascript
// ❌ Bad: Storing metadata on DOM nodes directly
function attachMetadataBad() {
  const element = document.getElementById('user-card');

  // Pollutes the DOM node
  element._metadata = {
    userId: 123,
    loaded: Date.now(),
    interactions: 0
  };

  // Risks name collision with framework properties
}

// ❌ Bad: Using Map with DOM nodes
const domMetadataMap = new Map();

function attachMetadataWithMap() {
  const element = document.getElementById('user-card');

  domMetadataMap.set(element, {
    userId: 123,
    loaded: Date.now(),
    interactions: 0
  });

  // Problem: If element is removed from DOM, Map keeps it alive
  // Memory leak! DOM node cannot be garbage collected
}

// ✅ Good: WeakMap for DOM metadata
const domMetadata = new WeakMap();

function attachMetadata(element, data) {
  domMetadata.set(element, {
    ...data,
    loaded: Date.now(),
    interactions: 0
  });
}

function getMetadata(element) {
  return domMetadata.get(element);
}

function incrementInteractions(element) {
  const data = domMetadata.get(element);
  if (data) {
    data.interactions++;
    data.lastInteraction = Date.now();
  }
}

// Usage
const userCard = document.getElementById('user-card');
attachMetadata(userCard, { userId: 123, role: 'admin' });

userCard.addEventListener('click', () => {
  incrementInteractions(userCard);
  console.log(getMetadata(userCard));
});

// When element is removed from DOM, metadata is auto-cleaned
document.body.removeChild(userCard);
// userCard can be garbage collected along with its metadata
```

#### Real-World DOM Tracking Example

```javascript
// ✅ Track component state for DOM elements
const componentState = new WeakMap();
const eventListeners = new WeakMap();

class UIComponent {
  constructor(element) {
    this.element = element;

    // Store component state
    componentState.set(element, {
      isActive: false,
      isLoading: false,
      hasError: false,
      data: null
    });

    // Store event listeners for cleanup
    eventListeners.set(element, new Map());
  }

  on(event, handler) {
    const listeners = eventListeners.get(this.element);
    if (!listeners.has(event)) {
      listeners.set(event, []);
    }
    listeners.get(event).push(handler);
    this.element.addEventListener(event, handler);
  }

  setState(updates) {
    const state = componentState.get(this.element);
    Object.assign(state, updates);
    this.render();
  }

  getState() {
    return componentState.get(this.element);
  }

  render() {
    const state = this.getState();

    if (state.isLoading) {
      this.element.classList.add('loading');
    } else {
      this.element.classList.remove('loading');
    }

    if (state.hasError) {
      this.element.classList.add('error');
    } else {
      this.element.classList.remove('error');
    }

    if (state.isActive) {
      this.element.classList.add('active');
    } else {
      this.element.classList.remove('active');
    }
  }

  destroy() {
    // Clean up event listeners
    const listeners = eventListeners.get(this.element);
    if (listeners) {
      listeners.forEach((handlers, event) => {
        handlers.forEach(handler => {
          this.element.removeEventListener(event, handler);
        });
      });
    }

    // WeakMaps will auto-clean when element is GC'd
  }
}

// Usage
const button = document.getElementById('submit-btn');
const component = new UIComponent(button);

component.on('click', () => {
  component.setState({ isLoading: true });

  fetch('/api/submit')
    .then(data => {
      component.setState({ isLoading: false, data, isActive: true });
    })
    .catch(error => {
      component.setState({ isLoading: false, hasError: true });
    });
});
```

### Use Case 3: Caching with Automatic Cleanup

```javascript
// ❌ Bad: Regular Map for caching (memory leak)
const cache = new Map();

function expensiveOperation(obj) {
  if (cache.has(obj)) {
    return cache.get(obj);
  }

  const result = /* expensive computation */ obj.value * 2;
  cache.set(obj, result);
  return result;
}

// Problem: Cache grows indefinitely
// Objects never get cleaned up even when no longer needed

// ✅ Good: WeakMap for caching
const weakCache = new WeakMap();

function expensiveOperationCached(obj) {
  if (weakCache.has(obj)) {
    console.log('Cache hit!');
    return weakCache.get(obj);
  }

  console.log('Cache miss, computing...');
  const result = obj.value * 2; // Expensive computation
  weakCache.set(obj, result);
  return result;
}

// Usage
let data1 = { value: 10 };
console.log(expensiveOperationCached(data1)); // Cache miss, computing... 20
console.log(expensiveOperationCached(data1)); // Cache hit! 20

data1 = null; // Cache entry automatically cleaned up
```

#### Advanced Memoization Pattern

```javascript
// ✅ Memoization with WeakMap for object arguments
const memoized = new WeakMap();

function memoize(fn) {
  return function(...args) {
    // Only works if first argument is an object
    const key = args[0];

    if (typeof key !== 'object' || key === null) {
      // Fallback for primitives
      return fn.apply(this, args);
    }

    if (!memoized.has(key)) {
      memoized.set(key, new Map());
    }

    const cache = memoized.get(key);
    const cacheKey = JSON.stringify(args.slice(1));

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const result = fn.apply(this, args);
    cache.set(cacheKey, result);
    return result;
  };
}

// Usage
const calculateScore = memoize((user, multiplier) => {
  console.log('Calculating score...');
  return user.points * multiplier;
});

const user1 = { name: 'John', points: 100 };
console.log(calculateScore(user1, 2)); // Calculating score... 200
console.log(calculateScore(user1, 2)); // 200 (cached)
console.log(calculateScore(user1, 3)); // Calculating score... 300

// When user1 is GC'd, all cached results are too
```

#### Cache with Size Limits

```javascript
// ✅ WeakMap-based cache with automatic cleanup
class SmartCache {
  constructor() {
    this.cache = new WeakMap();
    this.metadata = new WeakMap();
  }

  set(key, value, ttl = null) {
    if (typeof key !== 'object' || key === null) {
      throw new Error('Key must be an object');
    }

    this.cache.set(key, value);
    this.metadata.set(key, {
      created: Date.now(),
      ttl,
      hits: 0
    });
  }

  get(key) {
    if (!this.cache.has(key)) {
      return undefined;
    }

    const meta = this.metadata.get(key);

    // Check TTL
    if (meta.ttl && Date.now() - meta.created > meta.ttl) {
      this.delete(key);
      return undefined;
    }

    // Update statistics
    meta.hits++;
    meta.lastAccess = Date.now();

    return this.cache.get(key);
  }

  has(key) {
    return this.cache.has(key);
  }

  delete(key) {
    this.cache.delete(key);
    this.metadata.delete(key);
  }

  getStats(key) {
    return this.metadata.get(key);
  }
}

// Usage
const smartCache = new SmartCache();
const apiResponse = { data: 'important data' };

smartCache.set(apiResponse, { processed: true }, 5000); // 5 second TTL
console.log(smartCache.get(apiResponse)); // { processed: true }

setTimeout(() => {
  console.log(smartCache.get(apiResponse)); // undefined (TTL expired)
}, 6000);
```

### Use Case 4: Object Tracking with WeakSet

```javascript
// ✅ Track processed objects to avoid reprocessing
const processedObjects = new WeakSet();

function processData(obj) {
  if (processedObjects.has(obj)) {
    console.log('Already processed, skipping...');
    return;
  }

  console.log('Processing:', obj);
  // Expensive processing...

  processedObjects.add(obj);
}

// Usage
const data1 = { id: 1, value: 'test' };
processData(data1); // Processing: { id: 1, value: 'test' }
processData(data1); // Already processed, skipping...

// When data1 is GC'd, it's automatically removed from WeakSet
```

#### Circular Reference Detection

```javascript
// ✅ Detect circular references with WeakSet
function deepClone(obj, seen = new WeakSet()) {
  // Handle primitives
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Detect circular reference
  if (seen.has(obj)) {
    throw new Error('Circular reference detected!');
  }

  // Add to seen set
  seen.add(obj);

  // Clone object
  const clone = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clone[key] = deepClone(obj[key], seen);
    }
  }

  return clone;
}

// Usage
const obj = { name: 'John' };
obj.self = obj; // Circular reference

try {
  deepClone(obj);
} catch (e) {
  console.log(e.message); // Circular reference detected!
}

// Non-circular example
const safe = { a: 1, b: { c: 2 } };
const cloned = deepClone(safe);
console.log(cloned); // { a: 1, b: { c: 2 } }
```

#### Mark Objects as Immutable

```javascript
// ✅ Track frozen/sealed objects
const frozenObjects = new WeakSet();
const sealedObjects = new WeakSet();

function markAsFrozen(obj) {
  Object.freeze(obj);
  frozenObjects.add(obj);
}

function markAsSealed(obj) {
  Object.seal(obj);
  sealedObjects.add(obj);
}

function isFrozen(obj) {
  return frozenObjects.has(obj);
}

function isSealed(obj) {
  return sealedObjects.has(obj);
}

function safeModify(obj, key, value) {
  if (frozenObjects.has(obj)) {
    throw new Error('Cannot modify frozen object');
  }

  if (sealedObjects.has(obj) && !(key in obj)) {
    throw new Error('Cannot add properties to sealed object');
  }

  obj[key] = value;
}

// Usage
const config = { apiKey: 'secret', timeout: 5000 };
markAsFrozen(config);

try {
  safeModify(config, 'apiKey', 'new-secret');
} catch (e) {
  console.log(e.message); // Cannot modify frozen object
}
```

### Use Case 5: Event Listener Management

```javascript
// ✅ Track registered event listeners
const registeredListeners = new WeakMap();

class EventManager {
  register(element, event, handler) {
    if (!registeredListeners.has(element)) {
      registeredListeners.set(element, new Map());
    }

    const listeners = registeredListeners.get(element);

    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }

    listeners.get(event).add(handler);
    element.addEventListener(event, handler);
  }

  unregister(element, event, handler) {
    if (!registeredListeners.has(element)) return;

    const listeners = registeredListeners.get(element);

    if (listeners.has(event)) {
      listeners.get(event).delete(handler);
      element.removeEventListener(event, handler);
    }
  }

  unregisterAll(element) {
    if (!registeredListeners.has(element)) return;

    const listeners = registeredListeners.get(element);

    listeners.forEach((handlers, event) => {
      handlers.forEach(handler => {
        element.removeEventListener(event, handler);
      });
    });

    registeredListeners.delete(element);
  }

  getListenerCount(element, event) {
    if (!registeredListeners.has(element)) return 0;

    const listeners = registeredListeners.get(element);
    if (!listeners.has(event)) return 0;

    return listeners.get(event).size;
  }
}

// Usage
const eventManager = new EventManager();
const button = document.getElementById('btn');

const handler1 = () => console.log('Click 1');
const handler2 = () => console.log('Click 2');

eventManager.register(button, 'click', handler1);
eventManager.register(button, 'click', handler2);

console.log(eventManager.getListenerCount(button, 'click')); // 2

eventManager.unregisterAll(button);
// When button is removed from DOM, WeakMap entry is auto-cleaned
```

### Limitations

#### 1. No Iteration

```javascript
const wm = new WeakMap();
const ws = new WeakSet();

wm.set({ id: 1 }, 'data1');
wm.set({ id: 2 }, 'data2');

// ❌ These don't exist
// wm.forEach()
// wm.keys()
// wm.values()
// wm.entries()
// for...of loop

// ❌ These don't exist
// ws.forEach()
// ws.values()
// for...of loop

// You can only access entries if you have the key reference
const key = { id: 1 };
wm.set(key, 'data');
console.log(wm.get(key)); // Works only because we have 'key'
```

#### 2. No Size Property

```javascript
const wm = new WeakMap();
wm.set({ id: 1 }, 'data1');
wm.set({ id: 2 }, 'data2');

console.log(wm.size); // undefined

// ❌ Cannot count entries
// No way to know how many items are in the WeakMap

// Workaround: Maintain separate counter if needed
let count = 0;
const countedWeakMap = new WeakMap();

function setWithCount(key, value) {
  if (!countedWeakMap.has(key)) {
    count++;
  }
  countedWeakMap.set(key, value);
}

function deleteWithCount(key) {
  if (countedWeakMap.has(key)) {
    count--;
    countedWeakMap.delete(key);
  }
}

// Note: count may be inaccurate due to GC
```

#### 3. No Clear Method

```javascript
const wm = new WeakMap();
wm.set({ id: 1 }, 'data1');
wm.set({ id: 2 }, 'data2');

// ❌ No clear() method
// wm.clear(); // TypeError

// Only way to "clear" is to create new instance
let myWeakMap = new WeakMap();
myWeakMap.set({ id: 1 }, 'data');

// "Clear" by replacing
myWeakMap = new WeakMap();
```

#### 4. Keys Must Be Objects

```javascript
const wm = new WeakMap();

// ❌ Primitives not allowed
try {
  wm.set('string-key', 'value');
} catch (e) {
  console.log(e.message); // Invalid value used as weak map key
}

try {
  wm.set(123, 'value');
} catch (e) {
  console.log(e.message); // Invalid value used as weak map key
}

try {
  wm.set(Symbol.for('registered'), 'value'); // Registered symbols still rejected
} catch (e) {
  console.log(e.message); // Invalid value used as weak map key
}

// ✅ Only objects work
wm.set({}, 'value'); // OK
wm.set([], 'value'); // OK
wm.set(() => {}, 'value'); // OK
wm.set(new Date(), 'value'); // OK

// ✅ Since ES2023, unique (non-registered) Symbols work too
wm.set(Symbol('key'), 'value'); // OK
```

### Performance Characteristics

#### Memory Usage

```javascript
// Regular Map: Memory grows with entries
const regularMap = new Map();
const objects = [];

// Create 10000 entries
for (let i = 0; i < 10000; i++) {
  const obj = { id: i, data: new Array(1000).fill(i) };
  regularMap.set(obj, `metadata-${i}`);
  objects.push(obj);
}

console.log(regularMap.size); // 10000

// Clear object references
objects.length = 0;

// Map still holds ALL objects in memory
console.log(regularMap.size); // Still 10000
// Memory usage: ~10MB (keys) + ~100KB (values)

// WeakMap: Memory freed when keys are GC'd
const weakMap = new WeakMap();
const objects2 = [];

// Create 10000 entries
for (let i = 0; i < 10000; i++) {
  const obj = { id: i, data: new Array(1000).fill(i) };
  weakMap.set(obj, `metadata-${i}`);
  objects2.push(obj);
}

// Clear object references
objects2.length = 0;

// After GC, WeakMap entries are gone
// Memory freed automatically
// Cannot check .size, but memory is released
```

#### Access Performance

```javascript
// Both have O(1) access time
const map = new Map();
const weakMap = new WeakMap();
const key = { id: 1 };

map.set(key, 'value');
weakMap.set(key, 'value');

// Performance is similar
console.time('Map get');
for (let i = 0; i < 1000000; i++) {
  map.get(key);
}
console.timeEnd('Map get'); // ~15ms

console.time('WeakMap get');
for (let i = 0; i < 1000000; i++) {
  weakMap.get(key);
}
console.timeEnd('WeakMap get'); // ~15ms
```

#### When WeakMap is Faster

```javascript
// WeakMap is faster for short-lived objects
function benchmarkShortLived() {
  console.time('Map with short-lived objects');
  const map = new Map();

  for (let i = 0; i < 100000; i++) {
    const obj = { id: i };
    map.set(obj, i);
    // Objects immediately become unreachable
  }

  // Must manually clear
  map.clear();
  console.timeEnd('Map with short-lived objects');
  // ~50ms + manual cleanup overhead

  console.time('WeakMap with short-lived objects');
  const weakMap = new WeakMap();

  for (let i = 0; i < 100000; i++) {
    const obj = { id: i };
    weakMap.set(obj, i);
    // Objects automatically cleaned by GC
  }

  // No manual cleanup needed
  console.timeEnd('WeakMap with short-lived objects');
  // ~45ms + automatic GC cleanup
}

benchmarkShortLived();
```

---

<details>
<summary><strong>🔍 Deep Dive: V8 Implementation of Weak References</strong></summary>


### V8 Implementation of Weak References

#### Ephemeron Tables

WeakMap and WeakSet are implemented using **ephemeron tables** in V8. An ephemeron is a key-value pair where the value is kept alive only as long as the key is reachable.

```javascript
// Conceptual implementation (simplified)
class EphemeronTable {
  constructor() {
    this.entries = []; // Array of { key: WeakRef, value: any }
  }

  set(key, value) {
    // Store weak reference to key
    this.entries.push({
      key: new WeakRef(key), // Weak reference
      value: value
    });
  }

  get(key) {
    for (const entry of this.entries) {
      const entryKey = entry.key.deref(); // Dereference weak ref
      if (entryKey === key) {
        return entry.value;
      }
    }
    return undefined;
  }

  // GC automatically removes entries where key.deref() returns undefined
}
```

#### V8 Garbage Collection and WeakMaps

V8 uses generational garbage collection with two generations:
- **Young generation (Scavenger)**: Short-lived objects, collected frequently
- **Old generation (Mark-Sweep-Compact)**: Long-lived objects, collected less frequently

**WeakMap GC Process:**

1. **Mark Phase**: GC marks all reachable objects starting from roots
2. **WeakMap Scan**: After marking, V8 scans WeakMaps
3. **Ephemeron Processing**:
   - If key is marked (reachable), keep entry
   - If key is not marked (unreachable), remove entry
4. **Sweep Phase**: Free memory from removed entries

```javascript
// Example of GC interaction
let key1 = { id: 1 };
let key2 = { id: 2 };
const wm = new WeakMap();

wm.set(key1, 'data1');
wm.set(key2, 'data2');

// Before GC: Both entries exist
console.log(wm.has(key1)); // true
console.log(wm.has(key2)); // true

// Remove strong reference to key1
key1 = null;

// Trigger GC (conceptual - cannot force in JS)
// gc(); // If --expose-gc flag is used

// After GC: key1 entry is removed
// console.log(wm.has(key1)); // Cannot check - we lost reference!
console.log(wm.has(key2)); // still true
```

#### Hash Table Implementation

V8 implements WeakMap using a hash table with quadratic probing:

```javascript
// Simplified V8 hash table structure
class WeakMapHashTable {
  constructor(capacity = 16) {
    this.capacity = capacity;
    this.entries = new Array(capacity).fill(null);
    this.count = 0;
  }

  hash(key) {
    // V8 uses object's memory address for hashing
    // Simplified: use object's identity
    return this.getObjectHash(key) % this.capacity;
  }

  getObjectHash(obj) {
    // V8 stores hash code in object's hidden class
    if (!obj.__hashCode__) {
      obj.__hashCode__ = Math.floor(Math.random() * 0x7FFFFFFF);
    }
    return obj.__hashCode__;
  }

  set(key, value) {
    let index = this.hash(key);
    let i = 0;

    // Quadratic probing
    while (this.entries[index] !== null) {
      const entry = this.entries[index];
      const entryKey = entry.key.deref();

      if (entryKey === key) {
        // Update existing entry
        entry.value = value;
        return;
      }

      // Collision: probe next slot
      i++;
      index = (index + i * i) % this.capacity;
    }

    // Insert new entry
    this.entries[index] = {
      key: new WeakRef(key),
      value: value
    };
    this.count++;

    // Rehash if load factor > 0.75
    if (this.count / this.capacity > 0.75) {
      this.rehash();
    }
  }

  get(key) {
    let index = this.hash(key);
    let i = 0;

    while (this.entries[index] !== null) {
      const entry = this.entries[index];
      const entryKey = entry.key.deref();

      if (entryKey === undefined) {
        // Key was GC'd, skip this entry
        i++;
        index = (index + i * i) % this.capacity;
        continue;
      }

      if (entryKey === key) {
        return entry.value;
      }

      i++;
      index = (index + i * i) % this.capacity;
    }

    return undefined;
  }

  rehash() {
    const oldEntries = this.entries;
    this.capacity *= 2;
    this.entries = new Array(this.capacity).fill(null);
    this.count = 0;

    for (const entry of oldEntries) {
      if (entry !== null) {
        const key = entry.key.deref();
        if (key !== undefined) {
          this.set(key, entry.value);
        }
      }
    }
  }
}
```

### Memory Management Deep Dive

#### Reference Counting vs. Weak References

```javascript
// Strong references (reference counting)
let obj1 = { data: 'test' }; // ref count = 1
const map = new Map();
map.set(obj1, 'metadata'); // ref count = 2

function processObject(obj) {
  // ref count = 3 (temporary)
  console.log(obj.data);
} // ref count = 2 (after function returns)

processObject(obj1);

obj1 = null; // ref count = 1 (Map still holds it)
// Object CANNOT be garbage collected

// Weak references (no ref count contribution)
let obj2 = { data: 'test' }; // ref count = 1
const weakMap = new WeakMap();
weakMap.set(obj2, 'metadata'); // ref count = STILL 1

function processObject2(obj) {
  // ref count = 2 (temporary)
  console.log(obj.data);
} // ref count = 1 (after function returns)

processObject2(obj2);

obj2 = null; // ref count = 0
// Object CAN be garbage collected
// WeakMap entry will be removed automatically
```

#### Memory Leak Prevention

```javascript
// ❌ Memory leak with Map
class LeakyCache {
  constructor() {
    this.cache = new Map();
  }

  computeAndCache(obj) {
    if (this.cache.has(obj)) {
      return this.cache.get(obj);
    }

    const result = this.expensiveComputation(obj);
    this.cache.set(obj, result);
    return result;
  }

  expensiveComputation(obj) {
    // Simulate expensive operation
    return { computed: obj.value * 2 };
  }
}

// Usage that causes memory leak
const leakyCache = new LeakyCache();

function processData() {
  for (let i = 0; i < 10000; i++) {
    const temp = { value: i };
    leakyCache.computeAndCache(temp);
    // temp goes out of scope but Map keeps it alive!
  }
  // All 10000 objects are still in memory
}

processData();
console.log('Memory leaked!');

// ✅ Fixed with WeakMap
class SafeCache {
  constructor() {
    this.cache = new WeakMap();
  }

  computeAndCache(obj) {
    if (this.cache.has(obj)) {
      return this.cache.get(obj);
    }

    const result = this.expensiveComputation(obj);
    this.cache.set(obj, result);
    return result;
  }

  expensiveComputation(obj) {
    return { computed: obj.value * 2 };
  }
}

// Usage without memory leak
const safeCache = new SafeCache();

function processDataSafely() {
  for (let i = 0; i < 10000; i++) {
    const temp = { value: i };
    safeCache.computeAndCache(temp);
    // temp can be GC'd after loop iteration
  }
  // Objects are eligible for garbage collection
}

processDataSafely();
console.log('Memory safe!');
```

#### Garbage Collection Timing

```javascript
// Demonstration of GC timing (conceptual)
if (typeof global !== 'undefined' && global.gc) {
  // Run Node.js with --expose-gc flag

  console.log('Memory before:', process.memoryUsage().heapUsed);

  const weakMap = new WeakMap();
  const objects = [];

  // Create 100,000 objects
  for (let i = 0; i < 100000; i++) {
    const obj = { id: i, data: new Array(100).fill(i) };
    weakMap.set(obj, `metadata-${i}`);
    objects.push(obj);
  }

  console.log('Memory with objects:', process.memoryUsage().heapUsed);

  // Clear references
  objects.length = 0;

  console.log('Memory after clearing refs:', process.memoryUsage().heapUsed);

  // Force GC
  global.gc();

  console.log('Memory after GC:', process.memoryUsage().heapUsed);
  // WeakMap entries are automatically removed
}
```

### Performance Optimization Patterns

#### Pattern 1: Lazy Computation with WeakMap

```javascript
// ✅ Compute expensive values only once per object
const computationCache = new WeakMap();

function getExpensiveValue(obj) {
  if (computationCache.has(obj)) {
    return computationCache.get(obj);
  }

  // Expensive computation
  console.log('Computing...');
  const result = Object.keys(obj).reduce((acc, key) => {
    return acc + (typeof obj[key] === 'number' ? obj[key] : 0);
  }, 0);

  computationCache.set(obj, result);
  return result;
}

// Usage
const data = { a: 1, b: 2, c: 3, d: 'test' };
console.log(getExpensiveValue(data)); // Computing... 6
console.log(getExpensiveValue(data)); // 6 (cached)
console.log(getExpensiveValue(data)); // 6 (cached)
```

#### Pattern 2: Observer Pattern with Automatic Cleanup

```javascript
// ✅ Observers that don't prevent GC
const observers = new WeakMap();

class Observable {
  notify(data) {
    // Implementation details...
  }
}

function addObserver(observable, callback) {
  if (!observers.has(observable)) {
    observers.set(observable, new Set());
  }
  observers.get(observable).add(callback);
}

function removeObserver(observable, callback) {
  if (observers.has(observable)) {
    observers.get(observable).delete(callback);
  }
}

function notifyObservers(observable, data) {
  if (observers.has(observable)) {
    observers.get(observable).forEach(callback => {
      callback(data);
    });
  }
}

// Usage
let obs = new Observable();
addObserver(obs, data => console.log('Observer 1:', data));
addObserver(obs, data => console.log('Observer 2:', data));

notifyObservers(obs, { message: 'Hello' });
// Observer 1: { message: 'Hello' }
// Observer 2: { message: 'Hello' }

obs = null; // Observers are automatically cleaned up
```

#### Pattern 3: Decorator Pattern with WeakMap

```javascript
// ✅ Add behavior without modifying objects
const decorations = new WeakMap();

function decorate(obj, decorator) {
  if (!decorations.has(obj)) {
    decorations.set(obj, []);
  }
  decorations.get(obj).push(decorator);
}

function invoke(obj, method, ...args) {
  // Apply decorators
  const decs = decorations.get(obj) || [];

  for (const decorator of decs) {
    args = decorator.before ? decorator.before(method, args) : args;
  }

  // Call original method
  let result = obj[method](...args);

  // Apply after decorators
  for (const decorator of decs) {
    result = decorator.after ? decorator.after(method, result) : result;
  }

  return result;
}

// Usage
const calculator = {
  add(a, b) {
    return a + b;
  }
};

const loggingDecorator = {
  before(method, args) {
    console.log(`Calling ${method} with`, args);
    return args;
  },
  after(method, result) {
    console.log(`${method} returned`, result);
    return result;
  }
};

decorate(calculator, loggingDecorator);
invoke(calculator, 'add', 2, 3);
// Calling add with [2, 3]
// add returned 5
```

</details>

---

<details>
<summary><strong>🐛 Real-World Scenario: Memory Leak in Single Page Application</strong></summary>


### Problem: Memory Leak in Single Page Application

**Context**: A large e-commerce SPA with dynamic product listings. Users reported the browser becoming sluggish after browsing products for 10-15 minutes.

**Initial Symptoms**:
```
- Browser memory usage: 150MB → 1.2GB after 15 minutes
- Scrolling becomes janky (FPS drops from 60 to 15)
- Page interactions delayed by 500-1000ms
- Chrome DevTools heap snapshot shows 50,000+ detached DOM nodes
```

#### Investigation Process

**Step 1: Heap Snapshot Analysis**
```javascript
// Found in heap snapshot: Map holding product objects
const productCache = new Map(); // Global cache

class ProductCard {
  constructor(product) {
    this.product = product;
    this.element = this.createElement();

    // ❌ Store metadata in global Map
    productCache.set(this.element, {
      productId: product.id,
      loadTime: Date.now(),
      views: 0,
      interactions: []
    });

    this.attachListeners();
  }

  createElement() {
    const div = document.createElement('div');
    div.className = 'product-card';
    div.innerHTML = `
      <img src="${this.product.image}" alt="${this.product.name}">
      <h3>${this.product.name}</h3>
      <p>$${this.product.price}</p>
      <button class="add-to-cart">Add to Cart</button>
    `;
    return div;
  }

  attachListeners() {
    const button = this.element.querySelector('.add-to-cart');
    button.addEventListener('click', () => {
      const metadata = productCache.get(this.element);
      metadata.interactions.push({
        type: 'add-to-cart',
        timestamp: Date.now()
      });
      this.addToCart();
    });
  }

  addToCart() {
    console.log('Added to cart:', this.product.name);
  }

  destroy() {
    // ❌ Forgot to remove from productCache!
    this.element.remove();
  }
}

// Infinite scroll loading products
function loadProducts(products) {
  const container = document.getElementById('products');

  products.forEach(product => {
    const card = new ProductCard(product);
    container.appendChild(card.element);
  });
}

// User scrolls, old products are removed but stay in Map
function clearOldProducts() {
  const container = document.getElementById('products');
  const cards = container.querySelectorAll('.product-card');

  // Remove first 20 cards (keep recent 30)
  for (let i = 0; i < 20 && i < cards.length; i++) {
    cards[i].remove(); // ❌ Map still holds reference!
  }
}
```

**Step 2: Identify Root Cause**
```javascript
// Problem analysis:
// 1. ProductCard stores DOM elements in global Map
// 2. When cards are removed from DOM, Map keeps them alive
// 3. Each card has event listeners → prevents GC
// 4. Interactions array grows → more memory leaked
// 5. After 15 minutes: 50,000 cards × 50KB = 2.5GB leaked!

// Heap snapshot revealed:
// - 47,234 detached <div class="product-card"> nodes
// - 47,234 Map entries in productCache
// - 236,170 event listeners (5 per card)
// - Total memory: 1.18GB of leaked DOM nodes
```

#### Solution: WeakMap for Automatic Cleanup

```javascript
// ✅ Fixed: Use WeakMap instead of Map
const productMetadata = new WeakMap();

class ProductCardFixed {
  constructor(product) {
    this.product = product;
    this.element = this.createElement();

    // ✅ Use WeakMap: automatically cleaned when element is GC'd
    productMetadata.set(this.element, {
      productId: product.id,
      loadTime: Date.now(),
      views: 0,
      interactions: []
    });

    this.attachListeners();
  }

  createElement() {
    const div = document.createElement('div');
    div.className = 'product-card';
    div.innerHTML = `
      <img src="${this.product.image}" alt="${this.product.name}">
      <h3>${this.product.name}</h3>
      <p>$${this.product.price}</p>
      <button class="add-to-cart">Add to Cart</button>
    `;
    return div;
  }

  attachListeners() {
    const button = this.element.querySelector('.add-to-cart');

    // Store handler reference for cleanup
    this.clickHandler = () => {
      const metadata = productMetadata.get(this.element);
      if (metadata) {
        metadata.interactions.push({
          type: 'add-to-cart',
          timestamp: Date.now()
        });
      }
      this.addToCart();
    };

    button.addEventListener('click', this.clickHandler);
  }

  addToCart() {
    console.log('Added to cart:', this.product.name);
  }

  destroy() {
    // ✅ Clean up event listeners
    const button = this.element.querySelector('.add-to-cart');
    if (button && this.clickHandler) {
      button.removeEventListener('click', this.clickHandler);
    }

    // Remove element
    this.element.remove();

    // ✅ No need to manually delete from WeakMap!
    // Entry will be automatically removed when element is GC'd
  }
}

// Clear old products (now memory-safe)
function clearOldProductsSafe() {
  const container = document.getElementById('products');
  const cards = container.querySelectorAll('.product-card');

  // Remove first 20 cards
  for (let i = 0; i < 20 && i < cards.length; i++) {
    const card = cards[i];

    // Clean up if ProductCard instance is available
    // Otherwise, just remove from DOM
    card.remove();

    // WeakMap entry automatically removed after GC
  }
}
```

#### Additional Optimizations

```javascript
// ✅ Better: Track ProductCard instances for proper cleanup
const productCards = new WeakMap();

class ProductCardOptimized {
  constructor(product) {
    this.product = product;
    this.element = this.createElement();
    this.clickHandler = null;

    // Track instance by element
    productCards.set(this.element, this);

    // Store metadata
    productMetadata.set(this.element, {
      productId: product.id,
      loadTime: Date.now(),
      views: 0,
      interactions: []
    });

    this.attachListeners();
  }

  createElement() {
    const div = document.createElement('div');
    div.className = 'product-card';
    div.innerHTML = `
      <img src="${this.product.image}" alt="${this.product.name}">
      <h3>${this.product.name}</h3>
      <p>$${this.product.price}</p>
      <button class="add-to-cart">Add to Cart</button>
    `;
    return div;
  }

  attachListeners() {
    const button = this.element.querySelector('.add-to-cart');

    this.clickHandler = () => {
      const metadata = productMetadata.get(this.element);
      if (metadata) {
        metadata.interactions.push({
          type: 'add-to-cart',
          timestamp: Date.now()
        });
      }
      this.addToCart();
    };

    button.addEventListener('click', this.clickHandler);
  }

  addToCart() {
    console.log('Added to cart:', this.product.name);
  }

  destroy() {
    // Clean up event listeners
    const button = this.element.querySelector('.add-to-cart');
    if (button && this.clickHandler) {
      button.removeEventListener('click', this.clickHandler);
      this.clickHandler = null;
    }

    // Remove element
    this.element.remove();
  }
}

// Improved cleanup function
function clearOldProductsOptimized() {
  const container = document.getElementById('products');
  const cards = container.querySelectorAll('.product-card');

  // Remove first 20 cards with proper cleanup
  for (let i = 0; i < 20 && i < cards.length; i++) {
    const element = cards[i];
    const cardInstance = productCards.get(element);

    if (cardInstance) {
      cardInstance.destroy(); // Proper cleanup
    } else {
      element.remove(); // Fallback
    }
  }
}
```

#### Results After Fix

**Metrics Before:**
```
- Memory usage after 15 min: 1.2GB
- Detached DOM nodes: 47,234
- FPS during scroll: 15-20
- Page interaction delay: 500-1000ms
- Time to load 50 new products: 800ms
```

**Metrics After:**
```
- Memory usage after 15 min: 180MB (85% reduction!)
- Detached DOM nodes: ~50 (99.9% reduction!)
- FPS during scroll: 58-60 (smooth!)
- Page interaction delay: <50ms
- Time to load 50 new products: 120ms (6.6x faster)
```

#### Key Lessons

1. **Always use WeakMap for DOM metadata**: Prevents memory leaks automatically
2. **Clean up event listeners**: Even with WeakMap, listeners must be removed
3. **Monitor memory usage**: Use Chrome DevTools Performance Monitor
4. **Test with realistic data**: Load test with thousands of items
5. **Profile regularly**: Take heap snapshots before/after major operations

</details>

---

<details>
<summary><strong>⚖️ Trade-offs: WeakMap vs Map, WeakSet vs Set</strong></summary>


### WeakMap vs Map

#### Comparison Table

| Aspect | Map | WeakMap | Best For |
|--------|-----|---------|----------|
| **Keys** | Any type | Objects only | Map: Any keys<br>WeakMap: Object keys |
| **GC** | No (strong refs) | Yes (weak refs) | Map: Persistent data<br>WeakMap: Temporary associations |
| **Iteration** | Yes (forEach, for...of) | No | Map: Need to iterate<br>WeakMap: Don't need iteration |
| **Size** | `.size` available | No `.size` | Map: Need count<br>WeakMap: Don't need count |
| **Clear** | `.clear()` available | No `.clear()` | Map: Need bulk clear<br>WeakMap: Automatic cleanup |
| **Serialization** | JSON.stringify friendly | Cannot serialize | Map: Need to serialize<br>WeakMap: Memory-only data |
| **Memory** | Grows indefinitely | Auto-cleanup | Map: Controlled lifecycle<br>WeakMap: DOM/temporary objects |
| **Performance** | Consistent O(1) | O(1) + GC overhead | Map: Predictable perf<br>WeakMap: Long-running apps |

#### When to Use Map

```javascript
// ✅ Use Map when:

// 1. Need to iterate over entries
const userRoles = new Map([
  ['user1', 'admin'],
  ['user2', 'editor'],
  ['user3', 'viewer']
]);

userRoles.forEach((role, userId) => {
  console.log(`${userId}: ${role}`);
});

// 2. Need to count entries
console.log(`Total users: ${userRoles.size}`);

// 3. Need to serialize data
const serialized = JSON.stringify([...userRoles]);
localStorage.setItem('userRoles', serialized);

// 4. Keys are primitives
const scoresByName = new Map([
  ['Alice', 95],
  ['Bob', 87],
  ['Charlie', 92]
]);

// 5. Need to clear all entries at once
userRoles.clear();

// 6. Data should persist regardless of references
const config = new Map([
  ['apiUrl', 'https://api.example.com'],
  ['timeout', 5000],
  ['retries', 3]
]);
// Config should exist throughout app lifecycle
```

#### When to Use WeakMap

```javascript
// ✅ Use WeakMap when:

// 1. Keys are DOM elements
const elementMetadata = new WeakMap();
const button = document.getElementById('btn');
elementMetadata.set(button, { clicks: 0, created: Date.now() });
// Metadata auto-cleaned when button removed from DOM

// 2. Keys are temporary objects
const computationCache = new WeakMap();
function processData(obj) {
  if (computationCache.has(obj)) {
    return computationCache.get(obj);
  }
  const result = expensiveComputation(obj);
  computationCache.set(obj, result);
  return result;
}
// Cache entries auto-cleaned when objects are no longer needed

// 3. Private data pattern
const privateData = new WeakMap();
class User {
  constructor(name, password) {
    this.name = name;
    privateData.set(this, { password });
  }

  verifyPassword(pwd) {
    return privateData.get(this).password === pwd;
  }
}
// Private data auto-cleaned when User instance is GC'd

// 4. Memory-sensitive applications
const observerMetadata = new WeakMap();
function trackObserver(observer, data) {
  observerMetadata.set(observer, data);
}
// Observers auto-cleaned, no memory leak

// 5. Don't need iteration or size
const nodeVisited = new WeakMap();
function dfs(node) {
  if (nodeVisited.has(node)) return;
  nodeVisited.set(node, true);
  // Process node...
}
// No need to count visited nodes or iterate them
```

### WeakSet vs Set

#### Comparison Table

| Aspect | Set | WeakSet | Best For |
|--------|-----|---------|----------|
| **Values** | Any type | Objects only | Set: Any values<br>WeakSet: Object values |
| **GC** | No (strong refs) | Yes (weak refs) | Set: Persistent collection<br>WeakSet: Temporary tracking |
| **Iteration** | Yes (forEach, for...of) | No | Set: Need to iterate<br>WeakSet: Just checking membership |
| **Size** | `.size` available | No `.size` | Set: Need count<br>WeakSet: Don't need count |
| **Clear** | `.clear()` available | No `.clear()` | Set: Need bulk clear<br>WeakSet: Automatic cleanup |
| **Use Cases** | Unique values, sets | Object marking, visited tracking | Set: Math sets<br>WeakSet: Algorithm state |

#### When to Use Set

```javascript
// ✅ Use Set when:

// 1. Need unique primitive values
const uniqueIds = new Set([1, 2, 3, 2, 1]); // [1, 2, 3]
console.log(uniqueIds.size); // 3

// 2. Need to iterate
const tags = new Set(['js', 'react', 'node']);
tags.forEach(tag => console.log(tag));

// 3. Need set operations
const setA = new Set([1, 2, 3]);
const setB = new Set([2, 3, 4]);

// Union
const union = new Set([...setA, ...setB]); // [1, 2, 3, 4]

// Intersection
const intersection = new Set([...setA].filter(x => setB.has(x))); // [2, 3]

// Difference
const difference = new Set([...setA].filter(x => !setB.has(x))); // [1]

// 4. Need to serialize
const serialized = JSON.stringify([...tags]);

// 5. Values should persist
const activeUsers = new Set();
activeUsers.add('user1');
activeUsers.add('user2');
// activeUsers persists throughout app lifecycle
```

#### When to Use WeakSet

```javascript
// ✅ Use WeakSet when:

// 1. Mark objects as processed
const processedNodes = new WeakSet();

function processNode(node) {
  if (processedNodes.has(node)) {
    return; // Already processed
  }

  // Process node...
  processedNodes.add(node);
}

// 2. Detect circular references
function hasCircularReference(obj, seen = new WeakSet()) {
  if (seen.has(obj)) {
    return true; // Circular reference found
  }

  seen.add(obj);

  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (hasCircularReference(obj[key], seen)) {
        return true;
      }
    }
  }

  return false;
}

// 3. Track object membership without preventing GC
const registeredListeners = new WeakSet();

function registerListener(listener) {
  registeredListeners.add(listener);
}

function isRegistered(listener) {
  return registeredListeners.has(listener);
}

// Listeners auto-cleaned when no longer referenced

// 4. Mark objects as frozen/sealed
const frozenObjects = new WeakSet();

function markFrozen(obj) {
  Object.freeze(obj);
  frozenObjects.add(obj);
}

function isFrozen(obj) {
  return frozenObjects.has(obj);
}
```

### Decision Matrix

#### Choose Map When:
- ✅ Keys can be primitives (strings, numbers, etc.)
- ✅ Need to iterate over entries
- ✅ Need to know collection size
- ✅ Need to clear all entries at once
- ✅ Need to serialize/deserialize
- ✅ Data should persist throughout app lifecycle
- ✅ Working with configuration, settings, or lookup tables

#### Choose WeakMap When:
- ✅ Keys are always objects
- ✅ Don't need iteration
- ✅ Don't need to know size
- ✅ Want automatic cleanup when objects are GC'd
- ✅ Implementing private data pattern
- ✅ Storing DOM element metadata
- ✅ Caching computed values for objects
- ✅ Memory-sensitive applications with many temporary objects

#### Choose Set When:
- ✅ Values can be primitives
- ✅ Need to iterate over values
- ✅ Need to know collection size
- ✅ Need set operations (union, intersection, difference)
- ✅ Need to serialize/deserialize
- ✅ Working with unique lists, tags, or categories

#### Choose WeakSet When:
- ✅ Values are always objects
- ✅ Don't need iteration
- ✅ Don't need to know size
- ✅ Just need to mark/check object membership
- ✅ Tracking visited nodes in algorithms
- ✅ Detecting circular references
- ✅ Marking objects with properties (frozen, sealed, processed)

### Performance Considerations

```javascript
// Memory usage comparison
console.log('--- Memory Usage Test ---');

// Test 1: Map vs WeakMap with short-lived objects
console.time('Map creation');
const map = new Map();
for (let i = 0; i < 100000; i++) {
  map.set({ id: i }, i);
}
console.timeEnd('Map creation'); // ~50ms
// Memory: ~15MB retained indefinitely

console.time('WeakMap creation');
const weakMap = new WeakMap();
for (let i = 0; i < 100000; i++) {
  weakMap.set({ id: i }, i);
}
console.timeEnd('WeakMap creation'); // ~45ms
// Memory: ~15MB initially, freed after GC

// Test 2: Access performance (similar)
const key = { id: 1 };
map.set(key, 'value');
weakMap.set(key, 'value');

console.time('Map access');
for (let i = 0; i < 1000000; i++) {
  map.get(key);
}
console.timeEnd('Map access'); // ~15ms

console.time('WeakMap access');
for (let i = 0; i < 1000000; i++) {
  weakMap.get(key);
}
console.timeEnd('WeakMap access'); // ~15ms

// Conclusion: Access performance is similar
// Memory management is the key difference
```

</details>

---

<details>
<summary><strong>💬 Explain to Junior: WeakMap and WeakSet Simplified</strong></summary>


### Simple Analogy

**Regular Map/Set = Sticky Notes with Permanent Glue**
Imagine you're sticking notes on objects around your office. With regular sticky notes that have permanent glue, even if you throw away the object, the sticky note keeps holding onto it - it never lets go! The object can't be thrown away because the sticky note is still attached.

**WeakMap/WeakSet = Sticky Notes with Weak Glue**
Now imagine sticky notes with special "weak glue". When you stick them on objects, they stay attached only as long as someone is using the object. But as soon as nobody needs the object anymore, the weak glue lets go automatically, and both the object and the note can be thrown away together.

### Why This Matters

```javascript
// 🎯 The Problem: Memory Leaks

// Imagine a photo gallery app
const photoInfo = new Map(); // Regular Map (permanent sticky notes)

// User loads 1000 photos
for (let i = 0; i < 1000; i++) {
  const photoElement = createPhoto(i);

  // Attach info to photo (permanent sticky note)
  photoInfo.set(photoElement, {
    uploadDate: new Date(),
    likes: 0,
    comments: []
  });

  document.body.appendChild(photoElement);
}

// User closes the gallery
document.body.innerHTML = ''; // Photos removed from page

// ❌ Problem: photoInfo Map still holds ALL 1000 photos!
// They can't be deleted from memory because Map won't let go
// Memory leak: 1000 photos × 5MB = 5GB wasted!

console.log(photoInfo.size); // Still 1000!

// 🎯 The Solution: WeakMap

const photoInfoWeak = new WeakMap(); // Weak glue!

// User loads 1000 photos
for (let i = 0; i < 1000; i++) {
  const photoElement = createPhoto(i);

  // Attach info to photo (weak sticky note)
  photoInfoWeak.set(photoElement, {
    uploadDate: new Date(),
    likes: 0,
    comments: []
  });

  document.body.appendChild(photoElement);
}

// User closes the gallery
document.body.innerHTML = ''; // Photos removed from page

// ✅ Solution: WeakMap automatically lets go!
// Photos can be deleted from memory
// No memory leak!

// Can't check size, but memory is freed automatically
```

### Common Mistakes

#### Mistake 1: Using WeakMap with Primitive Keys

```javascript
// ❌ Wrong: Trying to use strings as keys
const weakMap = new WeakMap();

try {
  weakMap.set('user1', { name: 'John' }); // Error!
} catch (e) {
  console.log('Oops!', e.message);
  // Invalid value used as weak map key
}

// ✅ Right: Use objects as keys
const user1 = { id: 'user1' }; // Object key
weakMap.set(user1, { name: 'John' }); // Works!
```

#### Mistake 2: Expecting to Iterate

```javascript
// ❌ Wrong: Trying to loop through WeakMap
const weakMap = new WeakMap();
weakMap.set({ id: 1 }, 'data1');
weakMap.set({ id: 2 }, 'data2');

// This doesn't exist!
// weakMap.forEach((value, key) => { ... }); // Error!
// for (const entry of weakMap) { ... } // Error!

// ✅ Right: Use regular Map if you need to iterate
const map = new Map();
map.set({ id: 1 }, 'data1');
map.set({ id: 2 }, 'data2');

map.forEach((value, key) => {
  console.log(key, value);
});
```

#### Mistake 3: Losing Key References

```javascript
// ❌ Wrong: Losing the key reference
const weakMap = new WeakMap();

weakMap.set({ id: 1 }, 'data'); // Object created and immediately lost!

// Can't get it back because we don't have the key anymore
console.log(weakMap.get({ id: 1 })); // undefined
// Different object, even though it looks the same

// ✅ Right: Keep key reference
const key = { id: 1 };
weakMap.set(key, 'data');
console.log(weakMap.get(key)); // 'data' ✓
```

### Interview Answer Template

**Question**: "What is WeakMap and when would you use it?"

**Perfect Answer**:
```
"A WeakMap is like a regular Map, but with three key differences:

1. Keys MUST be objects (no primitives)
2. References to keys are 'weak' - they don't prevent garbage collection
3. You can't iterate over it or check its size

I'd use WeakMap when I need to associate data with objects without creating memory leaks.

For example, imagine a single-page app that creates thousands of DOM elements. If I store metadata about these elements in a regular Map, even when elements are removed from the page, the Map keeps them in memory forever - that's a memory leak.

With WeakMap, when an element is removed and no longer referenced anywhere else, JavaScript automatically cleans it up from memory, along with its metadata in the WeakMap.

Common use cases:
- Storing private data for class instances
- Caching computed values for objects
- Tracking DOM element metadata
- Any scenario where you want automatic cleanup"
```

### Copy-Paste Utilities

#### 1. Private Data Pattern

```javascript
// ✅ Use this for private class properties
const privateData = new WeakMap();

class MyClass {
  constructor(secretValue) {
    privateData.set(this, {
      secret: secretValue,
      // Add more private properties here
    });
  }

  getSecret() {
    return privateData.get(this).secret;
  }

  setSecret(newValue) {
    privateData.get(this).secret = newValue;
  }
}
```

#### 2. DOM Metadata Pattern

```javascript
// ✅ Use this for DOM element metadata
const elementMetadata = new WeakMap();

function attachMetadata(element, data) {
  elementMetadata.set(element, {
    ...data,
    created: Date.now()
  });
}

function getMetadata(element) {
  return elementMetadata.get(element);
}

function updateMetadata(element, updates) {
  const current = elementMetadata.get(element);
  if (current) {
    Object.assign(current, updates);
  }
}
```

#### 3. Memoization Pattern

```javascript
// ✅ Use this for caching expensive computations
const cache = new WeakMap();

function memoize(fn) {
  return function(obj) {
    if (cache.has(obj)) {
      return cache.get(obj);
    }

    const result = fn(obj);
    cache.set(obj, result);
    return result;
  };
}

// Usage:
const expensiveFunction = memoize((data) => {
  // Expensive computation...
  return data.value * 2;
});
```

#### 4. Circular Reference Detection

```javascript
// ✅ Use this to detect circular references
function hasCircularRef(obj, seen = new WeakSet()) {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  if (seen.has(obj)) {
    return true;
  }

  seen.add(obj);

  for (const key in obj) {
    if (hasCircularRef(obj[key], seen)) {
      return true;
    }
  }

  return false;
}

// Usage:
const obj = { name: 'test' };
obj.self = obj;
console.log(hasCircularRef(obj)); // true
```

### Key Takeaways

1. **WeakMap/WeakSet allow garbage collection** - They don't prevent objects from being cleaned up
2. **Use for temporary associations** - When you want data to automatically disappear with objects
3. **Can't iterate or count** - If you need these, use regular Map/Set
4. **Perfect for DOM metadata** - Prevents memory leaks in single-page apps
5. **Great for private data** - Implement truly private class properties
6. **Memory-safe caching** - Cache values without worrying about memory leaks

### When to Use What

**Use Regular Map/Set when:**
- You need to loop through entries
- You need to count entries
- Keys/values can be primitives
- Data should persist throughout app

**Use WeakMap/WeakSet when:**
- Keys/values are always objects
- You don't need to loop or count
- You want automatic memory cleanup
- Working with DOM elements or temporary objects
- Implementing private data or caching

Remember: If you're unsure, start with regular Map/Set. Switch to WeakMap/WeakSet when you identify memory issues or need automatic cleanup!

</details>
