# JavaScript Collections: Map and Set

## Question 1: What are Map and Set in JavaScript and how do they differ from Objects and Arrays?

### Answer

**Map** and **Set** are built-in collection data structures introduced in ES6 (ES2015) that provide more specialized and efficient alternatives to Objects and Arrays for certain use cases.

**Map** is a collection of key-value pairs where keys can be any data type (not just strings/symbols like Objects). It maintains insertion order and provides efficient lookup, insertion, and deletion operations.

**Set** is a collection of unique values where each value can occur only once. It automatically handles uniqueness and provides efficient membership testing.

### Map vs Object

**Key Differences:**

1. **Key Types:**
   - **Map**: Keys can be ANY type (objects, functions, primitives)
   - **Object**: Keys are always strings or symbols (other types are coerced to strings)

```javascript
// ❌ Object - keys are coerced to strings
const obj = {};
const key1 = { id: 1 };
const key2 = { id: 2 };

obj[key1] = 'value1';
obj[key2] = 'value2';

console.log(obj[key1]); // 'value2' - both keys became "[object Object]"
console.log(Object.keys(obj)); // ['[object Object]']

// ✅ Map - keys retain their type
const map = new Map();
map.set(key1, 'value1');
map.set(key2, 'value2');

console.log(map.get(key1)); // 'value1'
console.log(map.get(key2)); // 'value2'
```

2. **Size Property:**
   - **Map**: Built-in `.size` property
   - **Object**: Must manually count with `Object.keys(obj).length`

```javascript
// ❌ Object - manual counting
const obj = { a: 1, b: 2, c: 3 };
console.log(Object.keys(obj).length); // 3 - inefficient

// ✅ Map - O(1) size property
const map = new Map([['a', 1], ['b', 2], ['c', 3]]);
console.log(map.size); // 3 - instant
```

3. **Iteration Order:**
   - **Map**: Guaranteed insertion order
   - **Object**: Order not guaranteed in older JS (though modern engines preserve insertion order for string keys)

```javascript
// ❌ Object - order not reliably guaranteed in all scenarios
const obj = {};
obj[3] = 'three';
obj[1] = 'one';
obj[2] = 'two';
console.log(Object.keys(obj)); // ['1', '2', '3'] - numeric keys are sorted

// ✅ Map - strict insertion order
const map = new Map();
map.set(3, 'three');
map.set(1, 'one');
map.set(2, 'two');
console.log([...map.keys()]); // [3, 1, 2] - insertion order preserved
```

4. **Performance:**
   - **Map**: Optimized for frequent additions/deletions, O(1) lookup
   - **Object**: Better for static structure with known keys

```javascript
// ❌ Object - property deletion is slow
const obj = { a: 1, b: 2, c: 3 };
delete obj.b; // Slow, changes object shape

// ✅ Map - deletion is optimized
const map = new Map([['a', 1], ['b', 2], ['c', 3]]);
map.delete('b'); // Fast, O(1) operation
```

5. **Prototype Chain:**
   - **Map**: No prototype pollution risk
   - **Object**: Inherits from Object.prototype (collision risk)

```javascript
// ❌ Object - prototype pollution risk
const obj = {};
console.log(obj.toString); // [Function: toString] - inherited
console.log('toString' in obj); // true - confusing

// ✅ Map - clean, no prototype
const map = new Map();
console.log(map.get('toString')); // undefined - clean
console.log(map.has('toString')); // false - predictable
```

6. **Direct Iteration:**
   - **Map**: Directly iterable with for...of
   - **Object**: Requires Object.keys/values/entries

```javascript
// ❌ Object - indirect iteration
const obj = { a: 1, b: 2, c: 3 };
for (const [key, value] of Object.entries(obj)) {
  console.log(key, value);
}

// ✅ Map - direct iteration
const map = new Map([['a', 1], ['b', 2], ['c', 3]]);
for (const [key, value] of map) {
  console.log(key, value);
}
```

### Set vs Array

**Key Differences:**

1. **Uniqueness:**
   - **Set**: Automatically ensures uniqueness
   - **Array**: Allows duplicates

```javascript
// ❌ Array - manual deduplication needed
const arr = [1, 2, 2, 3, 3, 3];
const unique = [...new Set(arr)]; // Manual deduplication
console.log(unique); // [1, 2, 3]

// ✅ Set - automatic uniqueness
const set = new Set([1, 2, 2, 3, 3, 3]);
console.log([...set]); // [1, 2, 3] - automatic
```

2. **Lookup Performance:**
   - **Set**: O(1) membership test with `.has()`
   - **Array**: O(n) with `.includes()` or `.indexOf()`

```javascript
// ❌ Array - O(n) lookup
const arr = Array.from({ length: 10000 }, (_, i) => i);
console.time('array');
arr.includes(9999); // Must scan entire array
console.timeEnd('array'); // ~0.1ms on large arrays

// ✅ Set - O(1) lookup
const set = new Set(arr);
console.time('set');
set.has(9999); // Instant hash lookup
console.timeEnd('set'); // ~0.001ms
```

3. **Index Access:**
   - **Set**: No index access (must convert to array)
   - **Array**: Direct index access

```javascript
// ❌ Set - no index access
const set = new Set([10, 20, 30]);
console.log(set[0]); // undefined - not supported

// ✅ Array - direct index access
const arr = [10, 20, 30];
console.log(arr[0]); // 10

// Workaround for Set:
console.log([...set][0]); // 10 - convert to array
```

4. **Order Preservation:**
   - **Set**: Maintains insertion order
   - **Array**: Maintains insertion order

```javascript
// Both preserve order
const set = new Set([3, 1, 2]);
console.log([...set]); // [3, 1, 2]

const arr = [3, 1, 2];
console.log(arr); // [3, 1, 2]
```

5. **Mutation Methods:**
   - **Set**: `.add()`, `.delete()`, `.clear()`
   - **Array**: `.push()`, `.pop()`, `.splice()`, etc.

```javascript
// Set methods
const set = new Set([1, 2, 3]);
set.add(4);      // Add element
set.delete(2);   // Remove element
set.clear();     // Remove all

// Array methods
const arr = [1, 2, 3];
arr.push(4);     // Add to end
arr.pop();       // Remove from end
arr.splice(1, 1); // Remove at index
```

### When to Use Each

**Use Map When:**
- Keys need to be non-string types (objects, functions, etc.)
- Frequent additions and deletions
- Need guaranteed iteration order
- Need to avoid prototype pollution
- Working with dynamic key-value pairs
- Need efficient size tracking

```javascript
// ✅ Map - object keys
const cache = new Map();
const element = document.querySelector('#app');
cache.set(element, { data: 'cached' });
console.log(cache.get(element)); // { data: 'cached' }

// ✅ Map - frequent updates
const userSessions = new Map();
userSessions.set('user1', { loginTime: Date.now() });
userSessions.set('user2', { loginTime: Date.now() });
userSessions.delete('user1'); // Efficient deletion
```

**Use Object When:**
- Keys are always strings
- Fixed structure (known keys at design time)
- Need JSON serialization
- Simple key-value storage
- Better semantics (property access with dot notation)

```javascript
// ✅ Object - fixed structure
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3
};
console.log(config.apiUrl); // Clean syntax

// ✅ Object - JSON serialization
const data = { name: 'John', age: 30 };
const json = JSON.stringify(data); // Works with objects
console.log(json); // '{"name":"John","age":30}'
```

**Use Set When:**
- Need to ensure uniqueness
- Frequent membership tests (has/includes)
- Need to remove duplicates
- Working with large collections of unique values
- Mathematical set operations (union, intersection, difference)

```javascript
// ✅ Set - uniqueness
const tags = new Set();
tags.add('javascript');
tags.add('react');
tags.add('javascript'); // Ignored - already exists
console.log(tags.size); // 2

// ✅ Set - efficient lookup
const allowedUsers = new Set(['admin', 'user1', 'user2']);
if (allowedUsers.has(username)) {
  // Grant access - O(1) check
}
```

**Use Array When:**
- Order matters and need index access
- Duplicates are allowed/needed
- Need array methods (map, filter, reduce, etc.)
- Working with sequential data
- Need to sort or transform data

```javascript
// ✅ Array - index access and methods
const scores = [85, 92, 78, 95, 88];
const topScore = scores[0];
const average = scores.reduce((a, b) => a + b) / scores.length;
const highScores = scores.filter(s => s >= 90);

// ✅ Array - duplicates needed
const history = ['login', 'view', 'edit', 'view', 'logout'];
const viewCount = history.filter(a => a === 'view').length; // 2
```

---

<details>
<summary><strong>🔍 Deep Dive: V8 Implementation and Performance</strong></summary>


### Hash Table Implementation

Both Map and Set are implemented using **hash tables** in V8 (Chrome/Node.js engine):

**Map Structure:**
```
Map {
  [[MapData]]: HashTable {
    buckets: Array[capacity],
    size: 3,
    deleted: 0,
    capacity: 8
  }
}

Bucket structure:
[hash % capacity] -> [key, value, next] -> [key, value, next] -> null
```

**Set Structure:**
```
Set {
  [[SetData]]: HashTable {
    buckets: Array[capacity],
    size: 3,
    deleted: 0,
    capacity: 8
  }
}

Bucket structure (values only):
[hash % capacity] -> [value, next] -> [value, next] -> null
```

### Time Complexity Analysis

| Operation | Map | Set | Object | Array |
|-----------|-----|-----|--------|-------|
| Insert | O(1) | O(1) | O(1) | O(1) amortized |
| Delete | O(1) | O(1) | O(1)* | O(n) |
| Lookup | O(1) | O(1) | O(1) | O(n) |
| Size | O(1) | O(1) | O(n) | O(1) |
| Iteration | O(n) | O(n) | O(n) | O(n) |

*Object delete is O(1) but slow due to shape changes

### Memory Layout

**Map/Set Memory Overhead:**
```javascript
// Empty collections
const emptyMap = new Map(); // ~280 bytes overhead
const emptySet = new Set(); // ~280 bytes overhead
const emptyObj = {};        // ~56 bytes overhead
const emptyArr = [];        // ~80 bytes overhead

// Per-entry overhead
// Map: 32 bytes per entry (16 key + 16 value)
// Set: 16 bytes per entry
// Object: 16-24 bytes per property
// Array: 8 bytes per element
```

**Example:**
```javascript
// 1000 entries
const map1000 = new Map();
for (let i = 0; i < 1000; i++) {
  map1000.set(i, i * 2);
}
// Memory: 280 + (1000 × 32) = ~32,280 bytes

const obj1000 = {};
for (let i = 0; i < 1000; i++) {
  obj1000[i] = i * 2;
}
// Memory: 56 + (1000 × 20) = ~20,056 bytes
// BUT: Object is faster to allocate initially
```

### Hash Function Details

**V8 Hash Strategy:**
1. **String keys**: MurmurHash3 variant
2. **Number keys**: Identity hash (number itself)
3. **Object keys**: Hidden class hash (memory address based)

```javascript
// String hashing
const map = new Map();
map.set('abc', 1);
// Internal: hash('abc') -> 0x7a3b9c1f
// Bucket: 0x7a3b9c1f % capacity

// Object hashing
const obj = { id: 1 };
map.set(obj, 'value');
// Internal: hash(obj) -> memory address hash
// Each object has unique hash
```

### Collision Handling

**Separate Chaining:**
```javascript
// Multiple keys hash to same bucket
const map = new Map();
map.set('abc', 1); // hash % 8 = 3
map.set('xyz', 2); // hash % 8 = 3 (collision!)

// Internal structure:
// buckets[3] -> ['abc', 1, next] -> ['xyz', 2, null]
// Lookup still O(1) average, O(n) worst case
```

### Load Factor and Rehashing

**Dynamic Resizing:**
```javascript
// Map starts with capacity 8
const map = new Map();

// Add 7 entries (load factor = 7/8 = 0.875)
for (let i = 0; i < 7; i++) {
  map.set(i, i);
}

// Add 8th entry -> triggers rehash
map.set(7, 7);
// Internal:
// 1. Allocate new buckets (capacity 16)
// 2. Rehash all entries
// 3. Update capacity
// Cost: O(n) but amortized O(1)
```

### Iterator Implementation

**Map/Set Iterators:**
```javascript
const map = new Map([['a', 1], ['b', 2], ['c', 3]]);

// Internal iterator structure
const iterator = map.entries();
// {
//   [[IteratedMap]]: map reference,
//   [[MapNextIndex]]: 0,
//   [[MapIterationKind]]: 'entries'
// }

iterator.next(); // { value: ['a', 1], done: false }
// Increments [[MapNextIndex]] to 1
```

**Insertion Order Tracking:**
```javascript
// V8 maintains insertion order via linked list
// Each entry has:
// - key
// - value
// - hash
// - next (for collision chain)
// - insertionIndex (for iteration order)

const map = new Map();
map.set('c', 3); // insertionIndex: 0
map.set('a', 1); // insertionIndex: 1
map.set('b', 2); // insertionIndex: 2

// Iteration follows insertionIndex
for (const [k, v] of map) {
  console.log(k); // 'c', 'a', 'b' - insertion order
}
```

### Performance Benchmarks

**Lookup Performance:**
```javascript
// 10,000 entries
const map = new Map();
const obj = {};
const set = new Set();
const arr = [];

for (let i = 0; i < 10000; i++) {
  map.set(i, i);
  obj[i] = i;
  set.add(i);
  arr.push(i);
}

// Lookup worst case (last element)
console.time('map.get');
map.get(9999); // ~0.002ms
console.timeEnd('map.get');

console.time('obj access');
obj[9999]; // ~0.001ms (fastest)
console.timeEnd('obj access');

console.time('set.has');
set.has(9999); // ~0.002ms
console.timeEnd('set.has');

console.time('arr.includes');
arr.includes(9999); // ~0.15ms (slowest - O(n))
console.timeEnd('arr.includes');
```

**Insertion Performance:**
```javascript
// 10,000 insertions
console.time('map.set');
const map = new Map();
for (let i = 0; i < 10000; i++) {
  map.set(i, i); // ~1.2ms total
}
console.timeEnd('map.set');

console.time('obj assign');
const obj = {};
for (let i = 0; i < 10000; i++) {
  obj[i] = i; // ~0.8ms total (faster initial allocation)
}
console.timeEnd('obj assign');

console.time('set.add');
const set = new Set();
for (let i = 0; i < 10000; i++) {
  set.add(i); // ~1.0ms total
}
console.timeEnd('set.add');
```

**Deletion Performance:**
```javascript
// Delete 5,000 entries
console.time('map.delete');
for (let i = 0; i < 5000; i++) {
  map.delete(i); // ~0.6ms total
}
console.timeEnd('map.delete');

console.time('obj delete');
for (let i = 0; i < 5000; i++) {
  delete obj[i]; // ~2.5ms total (slower due to shape changes)
}
console.timeEnd('obj delete');

console.time('set.delete');
for (let i = 0; i < 5000; i++) {
  set.delete(i); // ~0.5ms total
}
console.timeEnd('set.delete');
```

</details>

---

<details>
<summary><strong>🐛 Real-World Scenario: Memory Leak in Cache System</strong></summary>


### The Problem

A Node.js API server was experiencing increasing memory usage over time, eventually hitting 2GB and crashing with OOM (Out of Memory) errors. The issue occurred in production after 6-8 hours of normal traffic.

**Initial Metrics:**
- Memory at startup: 120 MB
- Memory after 1 hour: 350 MB
- Memory after 4 hours: 980 MB
- Memory after 8 hours: 1.9 GB → CRASH
- Request rate: ~100 req/s
- Cache hit rate: 75%

### The Buggy Code

```javascript
// ❌ BUGGY: Using Object for caching with DOM elements as keys
class RequestCache {
  constructor() {
    this.cache = {}; // Plain object
    this.timestamps = {};
  }

  set(request, response) {
    // Convert request object to string key
    const key = JSON.stringify(request);
    this.cache[key] = response;
    this.timestamps[key] = Date.now();
  }

  get(request) {
    const key = JSON.stringify(request);
    return this.cache[key];
  }

  // Cleanup old entries (NEVER CALLED!)
  cleanup() {
    const now = Date.now();
    const maxAge = 60000; // 1 minute

    Object.keys(this.cache).forEach(key => {
      if (now - this.timestamps[key] > maxAge) {
        delete this.cache[key];
        delete this.timestamps[key];
      }
    });
  }
}

// Express route
app.get('/api/data', async (req, res) => {
  const cached = cache.get(req.query);
  if (cached) {
    return res.json(cached);
  }

  const data = await fetchData(req.query);
  cache.set(req.query, data);
  res.json(data);
});
```

**Issues:**
1. Object keys are strings → `JSON.stringify()` creates new strings constantly
2. No automatic cleanup → cache grows indefinitely
3. Duplicate string keys for similar requests
4. No size limit
5. `cleanup()` method exists but never called

### Debugging Steps

**Step 1: Memory Profiling**
```bash
# Enable heap snapshots
node --inspect server.js

# In Chrome DevTools:
# Memory → Take snapshot every hour
# Compare snapshots
```

**Findings:**
- 47,000 cache entries after 8 hours
- Expected: ~6,000 entries (100 req/s × 60s = 6,000 per minute)
- Memory retained: 1.8 GB in cache objects
- String keys average 200 bytes each
- Response objects average 3 KB each

**Step 2: Code Analysis**
```javascript
// Check cache size
console.log(Object.keys(cache.cache).length); // 47,000+

// Check memory usage
const used = process.memoryUsage();
console.log({
  rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
  heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
  heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
});
// { rss: '1847 MB', heapTotal: '1812 MB', heapUsed: '1795 MB' }
```

**Step 3: Identify Root Cause**
```javascript
// Problem 1: Duplicate keys
const req1 = { userId: '123', filter: 'active' };
const req2 = { filter: 'active', userId: '123' };

const key1 = JSON.stringify(req1); // '{"userId":"123","filter":"active"}'
const key2 = JSON.stringify(req2); // '{"filter":"active","userId":"123"}'
// Different strings for same logical request!

// Problem 2: No cleanup
// cleanup() method never called → cache grows infinitely

// Problem 3: No size limit
// After 8 hours: 100 req/s × 28,800s × 3KB = 8.6 GB potential
// Actual: 47,000 entries × 3KB = 141 MB (responses) + strings
```

### The Fix

```javascript
// ✅ FIXED: Using Map with proper cleanup and size limits
class RequestCache {
  constructor(maxSize = 5000, maxAge = 60000) {
    this.cache = new Map(); // Use Map instead of Object
    this.maxSize = maxSize;
    this.maxAge = maxAge;

    // Automatic cleanup every 30 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 30000);
  }

  // Generate consistent key from request
  _generateKey(request) {
    // Sort keys for consistent hashing
    const sorted = Object.keys(request)
      .sort()
      .reduce((acc, key) => {
        acc[key] = request[key];
        return acc;
      }, {});
    return JSON.stringify(sorted);
  }

  set(request, response) {
    const key = this._generateKey(request);

    // Enforce size limit (LRU-style)
    if (this.cache.size >= this.maxSize) {
      // Delete oldest entry (first in Map)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data: response,
      timestamp: Date.now()
    });
  }

  get(request) {
    const key = this._generateKey(request);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  cleanup() {
    const now = Date.now();
    let deletedCount = 0;

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.maxAge) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    console.log(`Cache cleanup: removed ${deletedCount} entries, size: ${this.cache.size}`);
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// Initialize with limits
const cache = new RequestCache(5000, 60000); // Max 5000 entries, 1 min TTL

// Graceful shutdown
process.on('SIGTERM', () => {
  cache.destroy();
  process.exit(0);
});
```

### Results After Fix

**Memory Usage:**
- Startup: 120 MB
- After 1 hour: 180 MB (stable)
- After 4 hours: 185 MB (stable)
- After 8 hours: 190 MB (stable)
- After 24 hours: 195 MB (stable) ✅

**Cache Metrics:**
- Max cache size: 5,000 entries (enforced)
- Average cache size: 3,200 entries
- Cleanup runs: every 30 seconds
- Average entries removed per cleanup: 150-200
- Memory saved: ~1.6 GB

**Performance:**
- Cache hit rate: 75% (unchanged)
- Lookup time: 0.002ms (Map.get)
- Insertion time: 0.003ms (Map.set)
- No more OOM crashes
- Server uptime: 30+ days

### Key Lessons

1. **Use Map for dynamic caching**: Better performance for frequent updates
2. **Always implement size limits**: Prevent unbounded growth
3. **Automatic cleanup**: Don't rely on manual cleanup calls
4. **Consistent key generation**: Sort object keys before stringification
5. **Monitor memory**: Set up alerts for abnormal growth
6. **Graceful shutdown**: Clean up intervals and resources

</details>

---

<details>
<summary><strong>⚖️ Trade-offs: Choosing the Right Data Structure</strong></summary>


### Performance Comparison Table

| Operation | Map | Set | Object | Array |
|-----------|-----|-----|--------|-------|
| Insert (small) | ⚡⚡ (1.2ms/10k) | ⚡⚡ (1.0ms/10k) | ⚡⚡⚡ (0.8ms/10k) | ⚡⚡⚡ (0.5ms/10k) |
| Insert (large) | ⚡⚡⚡ (constant) | ⚡⚡⚡ (constant) | ⚡⚡ (shape changes) | ⚡⚡⚡ (amortized) |
| Lookup | ⚡⚡⚡ (0.002ms) | ⚡⚡⚡ (0.002ms) | ⚡⚡⚡ (0.001ms) | ⚡ (0.15ms/10k) |
| Delete | ⚡⚡⚡ (0.6ms/5k) | ⚡⚡⚡ (0.5ms/5k) | ⚡ (2.5ms/5k) | ⚡⚡ (varies) |
| Size | ⚡⚡⚡ (O(1)) | ⚡⚡⚡ (O(1)) | ⚡ (O(n)) | ⚡⚡⚡ (O(1)) |
| Memory | 32KB/1k entries | 16KB/1k entries | 20KB/1k entries | 8KB/1k entries |
| Iteration | ⚡⚡⚡ (ordered) | ⚡⚡⚡ (ordered) | ⚡⚡ (varies) | ⚡⚡⚡ (ordered) |

### Decision Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│ DECISION TREE: Which Data Structure?                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Need key-value pairs?                                           │
│   ├─ YES → Keys can be non-strings?                            │
│   │         ├─ YES → Frequent add/delete?                      │
│   │         │         ├─ YES → USE MAP ✅                       │
│   │         │         └─ NO → Object might be fine            │
│   │         └─ NO → Need JSON serialization?                   │
│   │                   ├─ YES → USE OBJECT ✅                    │
│   │                   └─ NO → USE MAP (cleaner)                │
│   │                                                              │
│   └─ NO → Need unique values only?                             │
│             ├─ YES → Frequent membership tests?                │
│             │         ├─ YES → USE SET ✅                        │
│             │         └─ NO → Array with filter might work     │
│             └─ NO → Need index access or duplicates?           │
│                       └─ YES → USE ARRAY ✅                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Use Case Scenarios

**Scenario 1: User Session Storage**
```javascript
// REQUIREMENT: Store user sessions, frequent lookups by session ID

// ❌ Object - works but not semantic
const sessions = {};
sessions['sess_123'] = { userId: 1, loginTime: Date.now() };

// ✅ Map - better choice
const sessions = new Map();
sessions.set('sess_123', { userId: 1, loginTime: Date.now() });
sessions.set('sess_456', { userId: 2, loginTime: Date.now() });

// WINNER: Map
// - Semantic (designed for dynamic key-value)
// - Efficient deletion when session expires
// - Easy size tracking: sessions.size
```

**Scenario 2: Configuration Object**
```javascript
// REQUIREMENT: App configuration, static structure, need JSON

// ❌ Map - overkill for static config
const config = new Map([
  ['apiUrl', 'https://api.example.com'],
  ['timeout', 5000]
]);
JSON.stringify([...config]); // Complex serialization

// ✅ Object - perfect fit
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
};
JSON.stringify(config); // Simple serialization

// WINNER: Object
// - Clean syntax (config.apiUrl)
// - JSON serialization built-in
// - Static structure is semantic
```

**Scenario 3: Tag System**
```javascript
// REQUIREMENT: Store unique tags, frequent membership tests

// ❌ Array - O(n) lookup
const tags = ['javascript', 'react', 'nodejs'];
tags.includes('react'); // O(n) - scans array

// ✅ Set - O(1) lookup
const tags = new Set(['javascript', 'react', 'nodejs']);
tags.has('react'); // O(1) - hash lookup

// WINNER: Set
// - Automatic uniqueness
// - Fast membership tests
// - Easy add/remove operations
```

**Scenario 4: Event History (with duplicates)**
```javascript
// REQUIREMENT: Store user actions in order, duplicates needed

// ❌ Set - removes duplicates
const history = new Set(['login', 'view', 'view', 'logout']);
console.log([...history]); // ['login', 'view', 'logout'] - lost info!

// ✅ Array - preserves duplicates
const history = ['login', 'view', 'view', 'logout'];
console.log(history.filter(a => a === 'view').length); // 2 ✅

// WINNER: Array
// - Duplicates preserved
// - Order maintained
// - Array methods available (filter, map, etc.)
```

**Scenario 5: DOM Element Cache**
```javascript
// REQUIREMENT: Cache data by DOM element reference

// ❌ Object - converts element to "[object HTMLDivElement]"
const cache = {};
const elem1 = document.querySelector('#div1');
const elem2 = document.querySelector('#div2');
cache[elem1] = { data: 'one' };
cache[elem2] = { data: 'two' };
console.log(Object.keys(cache)); // ['[object HTMLDivElement]'] - collision!

// ✅ Map - uses element as key directly
const cache = new Map();
cache.set(elem1, { data: 'one' });
cache.set(elem2, { data: 'two' });
console.log(cache.get(elem1)); // { data: 'one' } ✅

// WINNER: Map
// - Object keys supported
// - No key collision
// - Semantic for non-string keys
```

### Memory Trade-offs

**Small Collections (< 100 entries):**
```javascript
// Object/Array slightly faster and more memory-efficient
const small = { a: 1, b: 2, c: 3 };
// Memory: ~200 bytes
// Access: ~0.001ms

const smallMap = new Map([['a', 1], ['b', 2], ['c', 3]]);
// Memory: ~380 bytes (overhead)
// Access: ~0.002ms

// RECOMMENDATION: Use Object/Array for small, static data
```

**Large Collections (> 1000 entries):**
```javascript
// Map/Set more efficient for dynamic operations
const large = {};
for (let i = 0; i < 10000; i++) {
  large[i] = i;
}
// Memory: ~200 KB
// Delete 5000: ~2.5ms (slow)

const largeMap = new Map();
for (let i = 0; i < 10000; i++) {
  largeMap.set(i, i);
}
// Memory: ~320 KB (more overhead)
// Delete 5000: ~0.6ms (fast) ✅

// RECOMMENDATION: Use Map/Set for large, dynamic collections
```

### Iteration Trade-offs

```javascript
// Object iteration
const obj = { a: 1, b: 2, c: 3 };
for (const key in obj) {
  if (obj.hasOwnProperty(key)) { // Need prototype check
    console.log(key, obj[key]);
  }
}
// OR
Object.entries(obj).forEach(([k, v]) => console.log(k, v));

// Map iteration (cleaner)
const map = new Map([['a', 1], ['b', 2], ['c', 3]]);
for (const [key, value] of map) { // Direct iteration
  console.log(key, value);
}
// OR
map.forEach((value, key) => console.log(key, value));

// RECOMMENDATION: Map has cleaner iteration syntax
```

</details>

---

<details>
<summary><strong>💬 Explain to Junior: Collections Made Simple</strong></summary>


### The Analogy

**Object/Array** = Your closet organized by shelves
- Clothes on labeled shelves (string keys)
- Easy to find if you know the shelf name
- But... what if you want to organize by the actual item (not just a label)?

**Map** = Museum catalog system
- Can use the actual artifact as the key (not just a label)
- "Where's the Egyptian vase?" → Points to actual vase object
- Keeps track of when each item was added (insertion order)
- Has a counter showing total items (size property)

**Set** = Bouncer's guest list
- Each name appears only once
- Fast to check "Is this person on the list?" (O(1))
- No duplicates allowed
- Remembers the order people were added

**Array** = Playlist
- Songs can repeat (duplicates allowed)
- Order matters (track 1, track 2, track 3)
- Can jump to specific track (index access)

### Common Junior Mistakes

**Mistake 1: Using Object for non-string keys**
```javascript
// ❌ WRONG: Objects as keys become "[object Object]"
const userCache = {};
const user1 = { id: 1 };
const user2 = { id: 2 };
userCache[user1] = 'data1';
userCache[user2] = 'data2'; // Overwrites user1!
console.log(Object.keys(userCache)); // ['[object Object]'] - only 1 key!

// ✅ RIGHT: Use Map for object keys
const userCache = new Map();
userCache.set(user1, 'data1');
userCache.set(user2, 'data2');
console.log(userCache.size); // 2 ✅
```

**Mistake 2: Not using Set for uniqueness**
```javascript
// ❌ WRONG: Manual deduplication
const tags = [];
function addTag(tag) {
  if (!tags.includes(tag)) { // O(n) check every time!
    tags.push(tag);
  }
}
addTag('react');
addTag('react'); // Slow check
addTag('vue');

// ✅ RIGHT: Let Set handle uniqueness
const tags = new Set();
function addTag(tag) {
  tags.add(tag); // Automatic uniqueness, O(1)
}
addTag('react');
addTag('react'); // Ignored automatically
addTag('vue');
```

**Mistake 3: Forgetting Map.get()**
```javascript
// ❌ WRONG: Trying to access Map like Object
const map = new Map([['name', 'John']]);
console.log(map['name']); // undefined ❌
console.log(map.name); // undefined ❌

// ✅ RIGHT: Use Map methods
console.log(map.get('name')); // 'John' ✅
```

**Mistake 4: Converting Set to Array unnecessarily**
```javascript
// ❌ WRONG: Convert to Array for every check
const allowedUsers = new Set(['admin', 'user1', 'user2']);
const allowed = [...allowedUsers]; // Creates new array
if (allowed.includes(username)) { // O(n) check
  // ...
}

// ✅ RIGHT: Use Set directly
if (allowedUsers.has(username)) { // O(1) check
  // ...
}
```

**Mistake 5: Not clearing collections**
```javascript
// ❌ WRONG: Leaving old data in memory
const cache = new Map();
// ... add 10,000 entries ...
// Never cleared → memory leak

// ✅ RIGHT: Clear when done
cache.clear(); // Remove all entries
// OR delete specific entries
cache.delete(oldKey);
```

### Interview Answer Template

**Question: "When would you use Map over Object?"**

**Template Answer:**
```
"I'd use Map when I need non-string keys, frequent add/delete operations,
or guaranteed iteration order. For example, [give specific scenario like
caching by DOM element]. Map is better here because [explain why - object
keys would collide, need O(1) deletion, etc.].

However, for static configuration or simple key-value pairs with string
keys, I'd stick with Object because [better syntax, JSON serialization,
less overhead, etc.]."
```

**Example scenarios to memorize:**
1. **DOM element cache** → Map (object keys)
2. **User sessions** → Map (frequent updates)
3. **App config** → Object (static, JSON)
4. **Unique tags** → Set (uniqueness)
5. **Event history** → Array (duplicates needed)

### Copy-Paste Utilities

**1. LRU Cache with Map**
```javascript
class LRUCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    const value = this.cache.get(key);
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Delete oldest (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}

// Usage
const cache = new LRUCache(3);
cache.set('a', 1);
cache.set('b', 2);
cache.set('c', 3);
cache.set('d', 4); // Evicts 'a' (oldest)
```

**2. Set Operations**
```javascript
// Union (A ∪ B)
const union = new Set([...setA, ...setB]);

// Intersection (A ∩ B)
const intersection = new Set([...setA].filter(x => setB.has(x)));

// Difference (A - B)
const difference = new Set([...setA].filter(x => !setB.has(x)));

// Symmetric Difference (A △ B)
const symmetricDiff = new Set([
  ...[...setA].filter(x => !setB.has(x)),
  ...[...setB].filter(x => !setA.has(x))
]);
```

**3. Map to/from Object**
```javascript
// Object to Map
const obj = { a: 1, b: 2, c: 3 };
const map = new Map(Object.entries(obj));

// Map to Object
const mapToObj = Object.fromEntries(map);
// OR
const mapToObj2 = [...map].reduce((acc, [key, value]) => {
  acc[key] = value;
  return acc;
}, {});
```

**4. Debounced Set with Callback**
```javascript
class WatchedSet extends Set {
  constructor(onChange) {
    super();
    this.onChange = onChange;
  }

  add(value) {
    const hadValue = this.has(value);
    super.add(value);
    if (!hadValue) this.onChange(this);
    return this;
  }

  delete(value) {
    const hadValue = this.has(value);
    const result = super.delete(value);
    if (hadValue) this.onChange(this);
    return result;
  }
}

// Usage
const tags = new WatchedSet(() => {
  console.log('Tags changed:', [...tags]);
});
tags.add('react'); // Logs: Tags changed: ['react']
tags.add('vue');   // Logs: Tags changed: ['react', 'vue']
```

**5. TTL Map (Time-To-Live)**
```javascript
class TTLMap extends Map {
  constructor(ttl = 60000) { // 1 minute default
    super();
    this.ttl = ttl;
  }

  set(key, value) {
    super.set(key, {
      value,
      expiry: Date.now() + this.ttl
    });
    return this;
  }

  get(key) {
    const entry = super.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiry) {
      this.delete(key);
      return undefined;
    }
    return entry.value;
  }
}

// Usage
const cache = new TTLMap(5000); // 5 second TTL
cache.set('key', 'value');
setTimeout(() => {
  console.log(cache.get('key')); // undefined - expired
}, 6000);
```

</details>

---

## Question 2: What are the methods and use cases for Map and Set?

### Answer

Map and Set provide rich APIs for managing collections efficiently. Understanding their methods and practical use cases is essential for writing clean, performant code.

### Map Methods

**Core Methods:**

1. **`set(key, value)`** - Add or update entry
```javascript
const map = new Map();
map.set('name', 'John');
map.set('age', 30);
map.set('age', 31); // Update existing
console.log(map.get('age')); // 31

// Chainable
map.set('city', 'NYC').set('country', 'USA');
```

2. **`get(key)`** - Retrieve value
```javascript
const map = new Map([['name', 'John']]);
console.log(map.get('name')); // 'John'
console.log(map.get('missing')); // undefined
```

3. **`has(key)`** - Check existence
```javascript
const map = new Map([['name', 'John']]);
console.log(map.has('name')); // true
console.log(map.has('age')); // false

// Use for conditional logic
if (map.has('name')) {
  console.log(`Hello ${map.get('name')}`);
}
```

4. **`delete(key)`** - Remove entry
```javascript
const map = new Map([['a', 1], ['b', 2]]);
map.delete('a'); // Returns true (was deleted)
map.delete('c'); // Returns false (didn't exist)
console.log(map.size); // 1
```

5. **`clear()`** - Remove all entries
```javascript
const map = new Map([['a', 1], ['b', 2], ['c', 3]]);
console.log(map.size); // 3
map.clear();
console.log(map.size); // 0
```

6. **`size`** - Get count (property, not method)
```javascript
const map = new Map();
console.log(map.size); // 0
map.set('a', 1).set('b', 2);
console.log(map.size); // 2
```

**Iteration Methods:**

7. **`keys()`** - Get iterator of keys
```javascript
const map = new Map([['a', 1], ['b', 2], ['c', 3]]);
for (const key of map.keys()) {
  console.log(key); // 'a', 'b', 'c'
}

// Convert to array
const keysArray = [...map.keys()]; // ['a', 'b', 'c']
```

8. **`values()`** - Get iterator of values
```javascript
const map = new Map([['a', 1], ['b', 2], ['c', 3]]);
for (const value of map.values()) {
  console.log(value); // 1, 2, 3
}

// Convert to array
const valuesArray = [...map.values()]; // [1, 2, 3]
```

9. **`entries()`** - Get iterator of [key, value] pairs
```javascript
const map = new Map([['a', 1], ['b', 2]]);
for (const [key, value] of map.entries()) {
  console.log(key, value); // 'a' 1, 'b' 2
}

// Convert to array
const entriesArray = [...map.entries()]; // [['a', 1], ['b', 2]]
```

10. **`forEach(callback)`** - Iterate with callback
```javascript
const map = new Map([['a', 1], ['b', 2], ['c', 3]]);

// Note: value comes BEFORE key (different from Array)
map.forEach((value, key, map) => {
  console.log(`${key} => ${value}`);
});

// With arrow function
map.forEach((value, key) => console.log(key, value));
```

**Complete Map Example:**
```javascript
// ✅ Complete Map usage
const userRoles = new Map();

// Add entries
userRoles.set('john@example.com', 'admin');
userRoles.set('jane@example.com', 'editor');
userRoles.set('bob@example.com', 'viewer');

// Check existence
if (userRoles.has('john@example.com')) {
  console.log('John is registered');
}

// Get value
const johnRole = userRoles.get('john@example.com');
console.log(`John's role: ${johnRole}`); // admin

// Update value
userRoles.set('john@example.com', 'superadmin');

// Iterate
console.log('All users:');
for (const [email, role] of userRoles) {
  console.log(`${email}: ${role}`);
}

// Delete entry
userRoles.delete('bob@example.com');

// Check size
console.log(`Total users: ${userRoles.size}`); // 2

// Clear all
userRoles.clear();
```

### Set Methods

**Core Methods:**

1. **`add(value)`** - Add element
```javascript
const set = new Set();
set.add(1);
set.add(2);
set.add(2); // Ignored - already exists
console.log(set.size); // 2

// Chainable
set.add(3).add(4).add(5);
```

2. **`has(value)`** - Check existence
```javascript
const set = new Set([1, 2, 3]);
console.log(set.has(2)); // true
console.log(set.has(5)); // false

// Use for validation
const allowedTags = new Set(['javascript', 'react', 'vue']);
if (!allowedTags.has(userTag)) {
  throw new Error('Invalid tag');
}
```

3. **`delete(value)`** - Remove element
```javascript
const set = new Set([1, 2, 3]);
set.delete(2); // Returns true
set.delete(5); // Returns false (didn't exist)
console.log([...set]); // [1, 3]
```

4. **`clear()`** - Remove all elements
```javascript
const set = new Set([1, 2, 3]);
set.clear();
console.log(set.size); // 0
```

5. **`size`** - Get count (property)
```javascript
const set = new Set([1, 2, 3]);
console.log(set.size); // 3
```

**Iteration Methods:**

6. **`values()`** - Get iterator of values
```javascript
const set = new Set([1, 2, 3]);
for (const value of set.values()) {
  console.log(value); // 1, 2, 3
}
```

7. **`keys()`** - Same as values() (for consistency with Map)
```javascript
const set = new Set([1, 2, 3]);
for (const key of set.keys()) {
  console.log(key); // 1, 2, 3 (same as values)
}
```

8. **`entries()`** - Get [value, value] pairs (for consistency with Map)
```javascript
const set = new Set([1, 2, 3]);
for (const [key, value] of set.entries()) {
  console.log(key, value); // 1 1, 2 2, 3 3 (key === value)
}
```

9. **`forEach(callback)`** - Iterate with callback
```javascript
const set = new Set([1, 2, 3]);

// Note: value appears twice (for consistency with Map)
set.forEach((value, valueAgain, set) => {
  console.log(value); // 1, 2, 3
});
```

**Complete Set Example:**
```javascript
// ✅ Complete Set usage
const tags = new Set();

// Add elements
tags.add('javascript');
tags.add('react');
tags.add('vue');
tags.add('react'); // Ignored - already exists

// Check existence
if (tags.has('javascript')) {
  console.log('JavaScript tag exists');
}

// Iterate
console.log('All tags:');
for (const tag of tags) {
  console.log(tag);
}

// Convert to array
const tagsArray = [...tags]; // ['javascript', 'react', 'vue']

// Delete element
tags.delete('vue');

// Check size
console.log(`Total tags: ${tags.size}`); // 2

// Clear all
tags.clear();
```

### Advanced Use Cases

**Use Case 1: Deduplication**
```javascript
// ❌ Manual deduplication
const arr = [1, 2, 2, 3, 3, 3, 4];
const unique = arr.filter((item, index) => arr.indexOf(item) === index);
console.log(unique); // [1, 2, 3, 4] - but O(n²) complexity

// ✅ Set for automatic deduplication
const unique = [...new Set([1, 2, 2, 3, 3, 3, 4])];
console.log(unique); // [1, 2, 3, 4] - O(n) complexity
```

**Use Case 2: Object Deduplication**
```javascript
// ❌ WRONG: Set with objects (compares by reference)
const users = [
  { id: 1, name: 'John' },
  { id: 2, name: 'Jane' },
  { id: 1, name: 'John' } // Duplicate
];
const unique = [...new Set(users)]; // Doesn't work - different references
console.log(unique.length); // 3 ❌

// ✅ RIGHT: Use Map with ID as key
const uniqueMap = new Map();
users.forEach(user => uniqueMap.set(user.id, user));
const uniqueUsers = [...uniqueMap.values()];
console.log(uniqueUsers.length); // 2 ✅
```

**Use Case 3: Caching with Object Keys**
```javascript
// Use Case: Cache API responses by request object
const responseCache = new Map();

async function fetchData(params) {
  // Use stringified params as key
  const cacheKey = JSON.stringify(params);

  if (responseCache.has(cacheKey)) {
    console.log('Cache hit!');
    return responseCache.get(cacheKey);
  }

  console.log('Cache miss, fetching...');
  const response = await fetch(`/api/data?${new URLSearchParams(params)}`);
  const data = await response.json();

  responseCache.set(cacheKey, data);
  return data;
}

// Usage
await fetchData({ userId: 1, type: 'profile' }); // Cache miss
await fetchData({ userId: 1, type: 'profile' }); // Cache hit!
```

**Use Case 4: Rate Limiting with Map**
```javascript
// Rate limiter: Max 10 requests per minute per IP
const rateLimiter = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const requests = rateLimiter.get(ip) || [];

  // Filter out requests older than 1 minute
  const recentRequests = requests.filter(time => now - time < 60000);

  if (recentRequests.length >= 10) {
    return false; // Rate limit exceeded
  }

  recentRequests.push(now);
  rateLimiter.set(ip, recentRequests);
  return true;
}

// Usage
if (checkRateLimit('192.168.1.1')) {
  // Process request
} else {
  // Return 429 Too Many Requests
}
```

**Use Case 5: Graph Adjacency List**
```javascript
// Graph representation with Map
class Graph {
  constructor() {
    this.adjacencyList = new Map();
  }

  addVertex(vertex) {
    if (!this.adjacencyList.has(vertex)) {
      this.adjacencyList.set(vertex, new Set());
    }
  }

  addEdge(vertex1, vertex2) {
    this.adjacencyList.get(vertex1).add(vertex2);
    this.adjacencyList.get(vertex2).add(vertex1); // Undirected
  }

  getNeighbors(vertex) {
    return [...this.adjacencyList.get(vertex)];
  }

  hasEdge(vertex1, vertex2) {
    return this.adjacencyList.get(vertex1).has(vertex2);
  }
}

// Usage
const graph = new Graph();
graph.addVertex('A');
graph.addVertex('B');
graph.addVertex('C');
graph.addEdge('A', 'B');
graph.addEdge('B', 'C');

console.log(graph.getNeighbors('B')); // ['A', 'C']
console.log(graph.hasEdge('A', 'C')); // false
```

**Use Case 6: Set Operations**
```javascript
// Union
function union(setA, setB) {
  return new Set([...setA, ...setB]);
}

// Intersection
function intersection(setA, setB) {
  return new Set([...setA].filter(x => setB.has(x)));
}

// Difference
function difference(setA, setB) {
  return new Set([...setA].filter(x => !setB.has(x)));
}

// Symmetric Difference
function symmetricDifference(setA, setB) {
  return new Set([
    ...[...setA].filter(x => !setB.has(x)),
    ...[...setB].filter(x => !setA.has(x))
  ]);
}

// Usage
const setA = new Set([1, 2, 3, 4]);
const setB = new Set([3, 4, 5, 6]);

console.log([...union(setA, setB)]); // [1, 2, 3, 4, 5, 6]
console.log([...intersection(setA, setB)]); // [3, 4]
console.log([...difference(setA, setB)]); // [1, 2]
console.log([...symmetricDifference(setA, setB)]); // [1, 2, 5, 6]
```

**Use Case 7: Memoization with Map**
```javascript
// Fibonacci with memoization
function fibonacci() {
  const memo = new Map();

  return function fib(n) {
    if (n <= 1) return n;

    if (memo.has(n)) {
      return memo.get(n);
    }

    const result = fib(n - 1) + fib(n - 2);
    memo.set(n, result);
    return result;
  };
}

const fib = fibonacci();
console.log(fib(50)); // Instant with memoization
// Without memo: would take forever
```

**Use Case 8: Two-Way Map (Bidirectional)**
```javascript
class BiMap {
  constructor() {
    this.keyToValue = new Map();
    this.valueToKey = new Map();
  }

  set(key, value) {
    // Remove old mappings if they exist
    if (this.keyToValue.has(key)) {
      const oldValue = this.keyToValue.get(key);
      this.valueToKey.delete(oldValue);
    }
    if (this.valueToKey.has(value)) {
      const oldKey = this.valueToKey.get(value);
      this.keyToValue.delete(oldKey);
    }

    this.keyToValue.set(key, value);
    this.valueToKey.set(value, key);
  }

  getByKey(key) {
    return this.keyToValue.get(key);
  }

  getByValue(value) {
    return this.valueToKey.get(value);
  }

  deleteByKey(key) {
    const value = this.keyToValue.get(key);
    this.keyToValue.delete(key);
    this.valueToKey.delete(value);
  }

  deleteByValue(value) {
    const key = this.valueToKey.get(value);
    this.valueToKey.delete(value);
    this.keyToValue.delete(key);
  }
}

// Usage
const biMap = new BiMap();
biMap.set('USA', 'Washington DC');
biMap.set('France', 'Paris');

console.log(biMap.getByKey('USA')); // 'Washington DC'
console.log(biMap.getByValue('Paris')); // 'France'
```

**Use Case 9: Circular Reference Detection**
```javascript
function hasCircularReference(obj) {
  const seen = new Set();

  function detect(value) {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    if (seen.has(value)) {
      return true; // Circular reference found!
    }

    seen.add(value);

    for (const key in value) {
      if (detect(value[key])) {
        return true;
      }
    }

    seen.delete(value); // Backtrack
    return false;
  }

  return detect(obj);
}

// Usage
const obj = { a: 1 };
obj.b = obj; // Circular reference
console.log(hasCircularReference(obj)); // true
```

**Use Case 10: Event Subscription System**
```javascript
class EventEmitter {
  constructor() {
    this.events = new Map(); // event -> Set of listeners
  }

  on(event, listener) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(listener);
  }

  off(event, listener) {
    if (this.events.has(event)) {
      this.events.get(event).delete(listener);
    }
  }

  emit(event, ...args) {
    if (this.events.has(event)) {
      for (const listener of this.events.get(event)) {
        listener(...args);
      }
    }
  }

  once(event, listener) {
    const onceWrapper = (...args) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }
}

// Usage
const emitter = new EventEmitter();
emitter.on('login', (user) => console.log(`${user} logged in`));
emitter.once('logout', (user) => console.log(`${user} logged out`));

emitter.emit('login', 'John'); // 'John logged in'
emitter.emit('logout', 'John'); // 'John logged out'
emitter.emit('logout', 'John'); // (nothing - removed after once)
```

---

<details>
<summary><strong>🔍 Deep Dive: Method Optimization and Iterators</strong></summary>


### Internal Method Implementation

**Map.set() internals:**
```javascript
// Pseudo-code of V8 implementation
Map.prototype.set = function(key, value) {
  // 1. Compute hash of key
  const hash = ComputeHash(key);

  // 2. Find bucket
  const bucketIndex = hash % this.capacity;
  const bucket = this.buckets[bucketIndex];

  // 3. Check if key exists (linear search in bucket)
  for (let entry of bucket) {
    if (SameValueZero(entry.key, key)) {
      entry.value = value; // Update existing
      return this;
    }
  }

  // 4. Add new entry
  bucket.push({ key, value, insertionIndex: this.size });
  this.size++;

  // 5. Check load factor and rehash if needed
  if (this.size / this.capacity > 0.75) {
    this.rehash();
  }

  return this;
};
```

**Set.has() internals:**
```javascript
// Pseudo-code
Set.prototype.has = function(value) {
  // 1. Compute hash
  const hash = ComputeHash(value);

  // 2. Find bucket
  const bucketIndex = hash % this.capacity;
  const bucket = this.buckets[bucketIndex];

  // 3. Linear search in bucket
  for (let entry of bucket) {
    if (SameValueZero(entry.value, value)) {
      return true;
    }
  }

  return false;
};
// Average: O(1) - buckets are small
// Worst: O(n) - all values hash to same bucket (rare)
```

### Iterator Protocol

**Map Iterator Structure:**
```javascript
const map = new Map([['a', 1], ['b', 2]]);
const iterator = map.entries();

// Internal structure:
// {
//   [[IteratedMap]]: map reference,
//   [[MapNextIndex]]: 0,
//   [[MapIterationKind]]: 'entries' // or 'keys' or 'values'
// }

// First call
iterator.next();
// Returns: { value: ['a', 1], done: false }
// Updates: [[MapNextIndex]] = 1

// Second call
iterator.next();
// Returns: { value: ['b', 2], done: false }
// Updates: [[MapNextIndex]] = 2

// Third call
iterator.next();
// Returns: { value: undefined, done: true }
```

**Custom Iterator:**
```javascript
// Create custom iterable Map wrapper
class IterableMap extends Map {
  // Default iterator (for...of uses this)
  [Symbol.iterator]() {
    return this.entries();
  }

  // Custom iterator that filters
  *filterKeys(predicate) {
    for (const [key, value] of this) {
      if (predicate(key)) {
        yield [key, value];
      }
    }
  }

  // Custom iterator that transforms
  *mapValues(transform) {
    for (const [key, value] of this) {
      yield [key, transform(value)];
    }
  }
}

// Usage
const map = new IterableMap([['a', 1], ['b', 2], ['c', 3]]);

// Filter keys starting with 'a'
for (const [key, value] of map.filterKeys(k => k.startsWith('a'))) {
  console.log(key, value); // 'a' 1
}

// Transform values
for (const [key, value] of map.mapValues(v => v * 2)) {
  console.log(key, value); // 'a' 2, 'b' 4, 'c' 6
}
```

### Chaining Performance

**Method Chaining Cost:**
```javascript
// Each set() returns 'this' → enables chaining
const map = new Map();

// ✅ Chaining (single expression)
map.set('a', 1).set('b', 2).set('c', 3);
// Cost: 3 hash computations + 3 insertions

// ✅ Separate calls (same cost)
map.set('a', 1);
map.set('b', 2);
map.set('c', 3);
// Cost: 3 hash computations + 3 insertions
// Performance: IDENTICAL

// Chaining is syntactic sugar, no performance difference
```

**Chaining with Sets:**
```javascript
const set = new Set();

// ✅ Chaining
set.add(1).add(2).add(3);

// ✅ Array to Set (more efficient for bulk)
const set2 = new Set([1, 2, 3]);
// Slightly faster: single allocation + bulk insert
```

### forEach vs for...of Performance

**Benchmark:**
```javascript
const map = new Map();
for (let i = 0; i < 10000; i++) {
  map.set(i, i * 2);
}

// forEach
console.time('forEach');
map.forEach((value, key) => {
  // Process
});
console.timeEnd('forEach'); // ~1.2ms

// for...of
console.time('for...of');
for (const [key, value] of map) {
  // Process
}
console.timeEnd('for...of'); // ~1.0ms (slightly faster)

// Reason: for...of uses native iterator (less overhead)
// forEach creates new function scope each iteration
```

### Memory Impact of Iteration

**Iterator Memory:**
```javascript
// Iterators hold reference to collection
const map = new Map([[1, 'a'], [2, 'b'], [3, 'c']]);
const iterator = map.entries();

// While iterator exists, map cannot be garbage collected
// Even if we clear all references to map

// To allow GC:
iterator = null; // Release iterator
map = null;      // Release map
```

**Safe Iteration During Modification:**
```javascript
const map = new Map([[1, 'a'], [2, 'b'], [3, 'c']]);

// ❌ DANGEROUS: Modifying while iterating
for (const [key, value] of map) {
  if (value === 'b') {
    map.delete(key); // May skip entries or cause bugs
  }
}

// ✅ SAFE: Collect keys first, then delete
const keysToDelete = [];
for (const [key, value] of map) {
  if (value === 'b') {
    keysToDelete.push(key);
  }
}
keysToDelete.forEach(key => map.delete(key));

// ✅ SAFE: Use Array.from to snapshot
Array.from(map.entries()).forEach(([key, value]) => {
  if (value === 'b') {
    map.delete(key); // Safe - iterating over snapshot
  }
});
```

</details>

---

<details>
<summary><strong>🐛 Real-World Scenario: Performance Bug in Search Autocomplete</strong></summary>


### The Problem

An e-commerce search autocomplete feature was experiencing severe performance degradation as users typed, causing UI freezes and dropped keystrokes. The issue was particularly bad for users with large search histories.

**Initial Metrics:**
- First keystroke: 5ms response time
- Fifth keystroke: 250ms response time
- Tenth keystroke: 1200ms response time (UI freeze)
- User search history size: ~2000 items
- Autocomplete suggestions pool: ~50,000 products

### The Buggy Code

```javascript
// ❌ BUGGY: Using Array for search history and suggestions
class SearchAutocomplete {
  constructor() {
    this.searchHistory = []; // Array of search terms
    this.suggestions = []; // Array of product objects
  }

  addToHistory(term) {
    // Remove duplicate if exists
    const index = this.searchHistory.indexOf(term);
    if (index !== -1) {
      this.searchHistory.splice(index, 1); // O(n) operation
    }

    // Add to front
    this.searchHistory.unshift(term); // O(n) operation

    // Limit to 2000
    if (this.searchHistory.length > 2000) {
      this.searchHistory.pop();
    }
  }

  getSuggestions(query) {
    const results = [];

    // Check if any search history matches
    for (const term of this.searchHistory) { // O(n)
      if (term.includes(query)) {
        results.push(term);
      }
    }

    // Check if any product matches
    for (const product of this.suggestions) { // O(m)
      if (product.name.includes(query)) {
        // Check for duplicates
        if (!results.includes(product.name)) { // O(k) per check!
          results.push(product.name);
        }
      }
    }

    return results.slice(0, 10);
  }
}

// Usage (called on every keystroke)
const autocomplete = new SearchAutocomplete();
input.addEventListener('input', (e) => {
  const suggestions = autocomplete.getSuggestions(e.target.value);
  renderSuggestions(suggestions);
});
```

**Issues:**
1. `indexOf()` and `includes()` are O(n) - scanning entire array each time
2. `splice()` and `unshift()` shift all elements - O(n) operations
3. Nested `includes()` in loop creates O(n × m × k) complexity
4. No deduplication before checking duplicates
5. Recalculating suggestions on every keystroke (even for same prefix)

**Complexity Analysis:**
```javascript
// Per keystroke:
// addToHistory: O(n) + O(n) + O(n) = O(n)
// getSuggestions: O(n) + O(m × k) where k = results.length
// Total: O(n + m × k)

// With n=2000, m=50000, k=100:
// ~5,000,000 operations per keystroke!
```

### Debugging Steps

**Step 1: Performance Profiling**
```javascript
// Add timing
const start = performance.now();
const suggestions = autocomplete.getSuggestions(query);
const end = performance.now();
console.log(`Search took: ${end - start}ms`);

// Results:
// Query 'a': 5ms
// Query 'ap': 15ms
// Query 'app': 45ms
// Query 'appl': 120ms
// Query 'apple': 350ms (UI freeze!)
```

**Step 2: Identify Hotspots**
```javascript
// Add detailed timing
getSuggestions(query) {
  const results = [];

  console.time('history search');
  for (const term of this.searchHistory) {
    if (term.includes(query)) {
      results.push(term);
    }
  }
  console.timeEnd('history search'); // 2ms

  console.time('product search');
  for (const product of this.suggestions) {
    if (product.name.includes(query)) {
      console.time('duplicate check');
      if (!results.includes(product.name)) { // <-- HOTSPOT!
        results.push(product.name);
      }
      console.timeEnd('duplicate check'); // 100ms total!
    }
  }
  console.timeEnd('product search');

  return results.slice(0, 10);
}

// Findings: duplicate check is 95% of the time!
```

**Step 3: Analyze Memory**
```javascript
// Check array sizes
console.log('History size:', autocomplete.searchHistory.length); // 2000
console.log('Suggestions size:', autocomplete.suggestions.length); // 50000

// Estimate operations per keystroke
// Worst case: all 50000 products match
// For each: results.includes() scans growing results array
// Operations: 1 + 2 + 3 + ... + 50000 = n(n+1)/2
// = 1,250,025,000 comparisons! 😱
```

### The Fix

```javascript
// ✅ FIXED: Using Set and Map for O(1) operations
class SearchAutocomplete {
  constructor() {
    this.searchHistory = new Map(); // term -> timestamp
    this.suggestionsTrie = new Map(); // prefix -> Set of products
    this.maxHistory = 2000;
    this.cache = new Map(); // query -> results (memoization)
  }

  addToHistory(term) {
    // Remove oldest if at limit
    if (this.searchHistory.size >= this.maxHistory) {
      // Map maintains insertion order, first key is oldest
      const oldestKey = this.searchHistory.keys().next().value;
      this.searchHistory.delete(oldestKey);
    }

    // Update or add (moves to end if exists)
    if (this.searchHistory.has(term)) {
      this.searchHistory.delete(term); // Remove old position
    }
    this.searchHistory.set(term, Date.now()); // Add at end

    // Clear cache since history changed
    this.cache.clear();
  }

  indexSuggestions(products) {
    // Build prefix trie for fast lookups
    products.forEach(product => {
      const name = product.name.toLowerCase();

      // Index all prefixes (up to length 4)
      for (let i = 1; i <= Math.min(4, name.length); i++) {
        const prefix = name.substring(0, i);

        if (!this.suggestionsTrie.has(prefix)) {
          this.suggestionsTrie.set(prefix, new Set());
        }

        this.suggestionsTrie.get(prefix).add(product.name);
      }
    });
  }

  getSuggestions(query) {
    if (!query) return [];

    // Check cache
    if (this.cache.has(query)) {
      return this.cache.get(query);
    }

    const results = new Set(); // Automatic deduplication!
    const lowerQuery = query.toLowerCase();

    // Search history (Map iteration is fast)
    for (const term of this.searchHistory.keys()) {
      if (term.toLowerCase().includes(lowerQuery)) {
        results.add(term);
        if (results.size >= 10) break; // Early exit
      }
    }

    // Search products (use trie for fast prefix lookup)
    const prefix = lowerQuery.substring(0, Math.min(4, lowerQuery.length));
    const candidates = this.suggestionsTrie.get(prefix) || new Set();

    for (const name of candidates) {
      if (name.toLowerCase().includes(lowerQuery)) {
        results.add(name);
        if (results.size >= 10) break; // Early exit
      }
    }

    // Convert to array and cache
    const resultArray = Array.from(results).slice(0, 10);
    this.cache.set(query, resultArray);

    return resultArray;
  }

  clearCache() {
    this.cache.clear();
  }
}

// Usage with debouncing
const autocomplete = new SearchAutocomplete();
autocomplete.indexSuggestions(products); // Index once on load

let debounceTimer;
input.addEventListener('input', (e) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const suggestions = autocomplete.getSuggestions(e.target.value);
    renderSuggestions(suggestions);
  }, 100); // 100ms debounce
});

// Add to history on search submission
form.addEventListener('submit', (e) => {
  autocomplete.addToHistory(input.value);
});
```

### Results After Fix

**Performance:**
- First keystroke: 0.8ms (6× faster)
- Fifth keystroke: 1.2ms (200× faster!)
- Tenth keystroke: 1.5ms (800× faster!)
- UI stays responsive at all times ✅

**Memory:**
- Trie index: ~12 MB (one-time cost)
- Cache: ~500 KB (grows with unique queries, cleared periodically)
- Total memory increase: ~12.5 MB
- Trade-off: Acceptable for massive performance gain

**Complexity:**
- addToHistory: O(1) average (Map operations)
- getSuggestions: O(k + m) where k = history size, m = candidates from trie
- With trie: m is typically 100-500 (not 50,000!)
- Result: ~1000 operations per keystroke (5000× improvement!)

**User Experience:**
- No UI freezes
- Instant suggestions
- Smooth typing experience
- Works with 10,000+ search history
- Works with 100,000+ products

### Additional Optimizations

**Debouncing:**
```javascript
// Don't search on every keystroke
let debounceTimer;
input.addEventListener('input', (e) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    search(e.target.value);
  }, 150); // Wait 150ms after user stops typing
});
```

**Cache Invalidation:**
```javascript
// Clear cache periodically to prevent memory bloat
setInterval(() => {
  if (autocomplete.cache.size > 1000) {
    autocomplete.cache.clear();
    console.log('Cache cleared (too large)');
  }
}, 60000); // Every minute
```

**Lazy Trie Building:**
```javascript
// Build trie incrementally, not all at once
async function buildTrieIncrementally(products) {
  const batchSize = 1000;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    autocomplete.indexSuggestions(batch);

    // Yield to browser to prevent UI freeze
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}
```

### Key Lessons

1. **Set for automatic deduplication**: Eliminates O(n) `includes()` checks
2. **Map for O(1) lookups**: Replace Array when doing frequent searches
3. **Cache results**: Memoize expensive computations
4. **Use appropriate data structures**: Trie for prefix searches, Set for uniqueness
5. **Debounce user input**: Don't process every keystroke
6. **Profile before optimizing**: Identify real bottlenecks
7. **Early exits**: Stop searching when you have enough results

</details>

---

<details>
<summary><strong>⚖️ Trade-offs: Method Performance Comparison</strong></summary>


### Map Method Performance

| Method | Time Complexity | Use Case | Alternative |
|--------|----------------|----------|-------------|
| `set()` | O(1) avg, O(n) rehash | Add/update entry | Object property assignment |
| `get()` | O(1) avg | Retrieve value | Object property access |
| `has()` | O(1) avg | Check existence | `in` operator for Object |
| `delete()` | O(1) avg | Remove entry | `delete obj.key` |
| `clear()` | O(1) | Remove all | `obj = {}` |
| `size` | O(1) | Get count | `Object.keys(obj).length` (O(n)) |
| `forEach()` | O(n) | Iterate with callback | `for...in` loop |
| `keys()` | O(1) iterator creation | Get keys | `Object.keys()` (O(n) array) |
| `values()` | O(1) iterator creation | Get values | `Object.values()` (O(n) array) |
| `entries()` | O(1) iterator creation | Get pairs | `Object.entries()` (O(n) array) |

### Set Method Performance

| Method | Time Complexity | Use Case | Alternative |
|--------|----------------|----------|-------------|
| `add()` | O(1) avg, O(n) rehash | Add element | Array `push()` + manual dedup |
| `has()` | O(1) avg | Check existence | Array `includes()` (O(n)) |
| `delete()` | O(1) avg | Remove element | Array `splice()` (O(n)) |
| `clear()` | O(1) | Remove all | `arr = []` or `arr.length = 0` |
| `size` | O(1) | Get count | Array `.length` (O(1)) |
| `forEach()` | O(n) | Iterate | Array `forEach()` |
| `values()` | O(1) iterator creation | Get values | Array iterator |
| `keys()` | O(1) iterator creation | Same as values | N/A |
| `entries()` | O(1) iterator creation | Get [value, value] pairs | N/A |

### Iteration Method Comparison

**Scenario: Iterate over 10,000 entries**

```javascript
const map = new Map();
for (let i = 0; i < 10000; i++) {
  map.set(i, i * 2);
}

// Method 1: for...of with entries()
console.time('for...of entries');
for (const [key, value] of map.entries()) {
  // Process
}
console.timeEnd('for...of entries'); // ~1.0ms ✅ Fastest

// Method 2: for...of default
console.time('for...of default');
for (const [key, value] of map) {
  // Process
}
console.timeEnd('for...of default'); // ~1.0ms ✅ Fastest (same)

// Method 3: forEach
console.time('forEach');
map.forEach((value, key) => {
  // Process
});
console.timeEnd('forEach'); // ~1.2ms (slightly slower)

// Method 4: keys() + get()
console.time('keys + get');
for (const key of map.keys()) {
  const value = map.get(key); // Extra hash lookup!
  // Process
}
console.timeEnd('keys + get'); // ~1.8ms ❌ Slowest

// WINNER: for...of (direct iteration, no extra lookups)
```

### Conversion Performance

**Map/Set ↔ Array:**

```javascript
// Array to Set
console.time('new Set()');
const set = new Set([1, 2, 3, /* ... */, 10000]);
console.timeEnd('new Set()'); // ~0.8ms

// Set to Array
console.time('spread operator');
const arr1 = [...set];
console.timeEnd('spread operator'); // ~0.5ms ✅ Fastest

console.time('Array.from()');
const arr2 = Array.from(set);
console.timeEnd('Array.from()'); // ~0.7ms (slightly slower)

console.time('forEach + push');
const arr3 = [];
set.forEach(v => arr3.push(v));
console.timeEnd('forEach + push'); // ~1.2ms ❌ Slowest

// Object to Map
const obj = { /* 10000 properties */ };

console.time('Object.entries()');
const map = new Map(Object.entries(obj));
console.timeEnd('Object.entries()'); // ~2.5ms

console.time('for...in loop');
const map2 = new Map();
for (const key in obj) {
  if (obj.hasOwnProperty(key)) {
    map2.set(key, obj[key]);
  }
}
console.timeEnd('for...in loop'); // ~3.0ms ❌ Slower

// WINNER: Spread operator for Set, Object.entries() for Object
```

### Bulk Operations Trade-offs

**Adding 10,000 items:**

```javascript
// Map: individual sets
console.time('map individual');
const map = new Map();
for (let i = 0; i < 10000; i++) {
  map.set(i, i * 2);
}
console.timeEnd('map individual'); // ~1.2ms

// Map: from array of pairs
console.time('map from array');
const pairs = Array.from({ length: 10000 }, (_, i) => [i, i * 2]);
const map2 = new Map(pairs);
console.timeEnd('map from array'); // ~1.5ms (slower due to array creation)

// Set: individual adds
console.time('set individual');
const set = new Set();
for (let i = 0; i < 10000; i++) {
  set.add(i);
}
console.timeEnd('set individual'); // ~0.9ms

// Set: from array
console.time('set from array');
const arr = Array.from({ length: 10000 }, (_, i) => i);
const set2 = new Set(arr);
console.timeEnd('set from array'); // ~0.8ms ✅ Faster

// RECOMMENDATION:
// - Map: individual sets (unless you already have array)
// - Set: from array if available (faster initialization)
```

### Memory vs Speed Trade-offs

**Scenario: Cache with 1000 entries**

```javascript
// Option 1: Map (more memory, faster operations)
const mapCache = new Map();
for (let i = 0; i < 1000; i++) {
  mapCache.set(`key${i}`, { data: `value${i}` });
}
// Memory: ~32 KB
// Lookup: 0.001ms
// Delete: 0.001ms

// Option 2: Object (less memory, slower deletes)
const objCache = {};
for (let i = 0; i < 1000; i++) {
  objCache[`key${i}`] = { data: `value${i}` };
}
// Memory: ~20 KB (40% less)
// Lookup: 0.0008ms (slightly faster)
// Delete: 0.05ms (50× slower!)

// DECISION MATRIX:
// - Frequent updates/deletes → Map (worth the memory cost)
// - Mostly reads, rarely updates → Object (save memory)
// - Non-string keys → Map (only option)
```

### forEach vs for...of Decision Matrix

```
┌─────────────────────────────────────────────────────────┐
│ forEach vs for...of                                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Use forEach when:                                       │
│ ✅ Functional style preferred                           │
│ ✅ Need this binding (with arrow functions, rarely)    │
│ ✅ Callback-based pattern (e.g., chaining)             │
│                                                          │
│ Use for...of when:                                      │
│ ✅ Need to break/continue loop                          │
│ ✅ Async operations (use for await...of)               │
│ ✅ Slightly better performance (native iterator)       │
│ ✅ More flexible control flow                           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Example:**
```javascript
const map = new Map([['a', 1], ['b', 2], ['c', 3]]);

// ❌ forEach - can't break
map.forEach((value, key) => {
  if (key === 'b') {
    // Can't break or continue!
    return; // Only returns from callback, not loop
  }
  console.log(key, value);
});
// Output: 'a' 1, 'c' 3 (still processes all)

// ✅ for...of - can break
for (const [key, value] of map) {
  if (key === 'b') {
    break; // Stops iteration entirely
  }
  console.log(key, value);
}
// Output: 'a' 1 (stops at 'b')
```

</details>

---

<details>
<summary><strong>💬 Explain to Junior: Methods and Use Cases Simplified</strong></summary>


### The Analogy

**Map methods** = Swiss Army knife
- Different tools for different jobs
- `set()` = Add/replace tool
- `get()` = Retrieve tool
- `has()` = Check tool
- `delete()` = Remove tool
- `clear()` = Reset everything

**Set methods** = Gym membership card scanner
- `add()` = Register new member
- `has()` = Check if member exists
- `delete()` = Cancel membership
- Automatically prevents duplicate registrations

### Common Junior Mistakes

**Mistake 1: Forgetting to use .get()/.has() for Map**
```javascript
const map = new Map([['name', 'John']]);

// ❌ WRONG: Trying to access like Object
if (map['name']) { // undefined - doesn't work!
  console.log('Found');
}

// ✅ RIGHT: Use .has() and .get()
if (map.has('name')) {
  console.log(map.get('name')); // 'John'
}
```

**Mistake 2: Forgetting Set.has() is O(1), Array.includes() is O(n)**
```javascript
const allowedUsers = ['admin', 'user1', 'user2', /* ... 10000 users */];

// ❌ SLOW: O(n) check on every request
if (allowedUsers.includes(username)) { // Scans entire array!
  // Grant access
}

// ✅ FAST: O(1) check
const allowedUsersSet = new Set(allowedUsers);
if (allowedUsersSet.has(username)) { // Instant hash lookup
  // Grant access
}
```

**Mistake 3: Not using Set for deduplication**
```javascript
const tags = ['javascript', 'react', 'javascript', 'vue', 'react'];

// ❌ MANUAL: O(n²) deduplication
const unique = tags.filter((tag, index) => tags.indexOf(tag) === index);

// ✅ AUTOMATIC: O(n) with Set
const unique = [...new Set(tags)]; // ['javascript', 'react', 'vue']
```

**Mistake 4: Converting Map entries incorrectly**
```javascript
const map = new Map([['a', 1], ['b', 2]]);

// ❌ WRONG: Trying to JSON.stringify Map directly
const json = JSON.stringify(map); // '{}' - empty object!

// ✅ RIGHT: Convert to Object or Array first
const obj = Object.fromEntries(map);
const json = JSON.stringify(obj); // '{"a":1,"b":2}'

// OR: Convert to array of pairs
const json = JSON.stringify([...map]); // '[["a",1],["b",2]]'
```

**Mistake 5: Modifying during iteration**
```javascript
const map = new Map([['a', 1], ['b', 2], ['c', 3]]);

// ❌ DANGEROUS: Delete during iteration
for (const [key, value] of map) {
  if (value === 2) {
    map.delete(key); // May cause skipped entries!
  }
}

// ✅ SAFE: Collect first, then modify
const keysToDelete = [];
for (const [key, value] of map) {
  if (value === 2) {
    keysToDelete.push(key);
  }
}
keysToDelete.forEach(key => map.delete(key));
```

### Visual Guide to Methods

**Map Methods:**
```
      ┌─────────────────────────┐
      │         MAP             │
      ├─────────────────────────┤
      │ key1 → value1           │
      │ key2 → value2           │  ← set(key, value): Add/update
      │ key3 → value3           │  ← get(key): Retrieve
      └─────────────────────────┘  ← has(key): Check
                                    ← delete(key): Remove
                                    ← clear(): Empty
                                    ← size: Count
```

**Set Methods:**
```
      ┌─────────────────────────┐
      │         SET             │
      ├─────────────────────────┤
      │ value1                  │
      │ value2                  │  ← add(value): Add unique
      │ value3                  │  ← has(value): Check
      └─────────────────────────┘  ← delete(value): Remove
                                    ← clear(): Empty
                                    ← size: Count
```

### Interview Answer Template

**Question: "How do you iterate over a Map?"**

**Template Answer:**
```
"There are several ways to iterate over a Map:

1. for...of loop with destructuring (most common):
   for (const [key, value] of map) { }

2. forEach method:
   map.forEach((value, key) => { })

3. Separate iterators:
   for (const key of map.keys()) { }
   for (const value of map.values()) { }

I prefer for...of because it's more flexible - I can use break/continue,
and it's slightly faster since it uses the native iterator. I'd use forEach
if I'm in a functional programming style or need to chain operations."
```

**Question: "When would you use Set operations like union/intersection?"**

**Template Answer:**
```
"Set operations are useful for comparing collections:

- Union (A ∪ B): Combine two sets
  Example: Merge user permissions from multiple roles

- Intersection (A ∩ B): Find common elements
  Example: Find users who have both 'admin' and 'editor' roles

- Difference (A - B): Find elements in A but not B
  Example: Find permissions removed in an update

I'd implement these using spread operator and filter:
const union = new Set([...setA, ...setB]);
const intersection = new Set([...setA].filter(x => setB.has(x)));
const difference = new Set([...setA].filter(x => !setB.has(x)));
```

### Copy-Paste Utilities

**1. Map Group By**
```javascript
// Group array by property
function groupBy(array, key) {
  return array.reduce((map, item) => {
    const group = item[key];
    if (!map.has(group)) {
      map.set(group, []);
    }
    map.get(group).push(item);
    return map;
  }, new Map());
}

// Usage
const users = [
  { name: 'John', role: 'admin' },
  { name: 'Jane', role: 'editor' },
  { name: 'Bob', role: 'admin' }
];
const grouped = groupBy(users, 'role');
// Map { 'admin' => [John, Bob], 'editor' => [Jane] }
```

**2. Set Operations Helper**
```javascript
class SetOps {
  static union(setA, setB) {
    return new Set([...setA, ...setB]);
  }

  static intersection(setA, setB) {
    return new Set([...setA].filter(x => setB.has(x)));
  }

  static difference(setA, setB) {
    return new Set([...setA].filter(x => !setB.has(x)));
  }

  static symmetricDifference(setA, setB) {
    return new Set([
      ...[...setA].filter(x => !setB.has(x)),
      ...[...setB].filter(x => !setA.has(x))
    ]);
  }

  static isSuperset(setA, subset) {
    for (const elem of subset) {
      if (!setA.has(elem)) return false;
    }
    return true;
  }

  static isSubset(setA, superset) {
    return this.isSuperset(superset, setA);
  }
}

// Usage
const setA = new Set([1, 2, 3]);
const setB = new Set([2, 3, 4]);
console.log([...SetOps.union(setA, setB)]); // [1, 2, 3, 4]
console.log([...SetOps.intersection(setA, setB)]); // [2, 3]
```

**3. Multi-Key Map**
```javascript
class MultiKeyMap {
  constructor() {
    this.map = new Map();
  }

  set(keys, value) {
    const key = JSON.stringify(keys.sort());
    this.map.set(key, value);
  }

  get(keys) {
    const key = JSON.stringify(keys.sort());
    return this.map.get(key);
  }

  has(keys) {
    const key = JSON.stringify(keys.sort());
    return this.map.has(key);
  }

  delete(keys) {
    const key = JSON.stringify(keys.sort());
    return this.map.delete(key);
  }
}

// Usage
const map = new MultiKeyMap();
map.set(['user', 123, 'profile'], { name: 'John' });
console.log(map.get([123, 'profile', 'user'])); // { name: 'John' }
// Order doesn't matter - internally sorted
```

**4. Frequency Counter**
```javascript
function countFrequency(array) {
  const freq = new Map();
  for (const item of array) {
    freq.set(item, (freq.get(item) || 0) + 1);
  }
  return freq;
}

// Usage
const words = ['apple', 'banana', 'apple', 'cherry', 'banana', 'apple'];
const frequency = countFrequency(words);
console.log(frequency);
// Map { 'apple' => 3, 'banana' => 2, 'cherry' => 1 }

// Find most common
const mostCommon = [...frequency.entries()].reduce((a, b) => a[1] > b[1] ? a : b);
console.log(mostCommon); // ['apple', 3]
```

**5. Weak Map/Set for Memory Management**
```javascript
// WeakMap: Keys must be objects, automatically garbage collected
const cache = new WeakMap();

function processElement(element) {
  if (cache.has(element)) {
    return cache.get(element);
  }

  const result = expensiveComputation(element);
  cache.set(element, result);
  return result;
}

// When element is removed from DOM, cache entry is automatically cleaned up

// WeakSet: For tracking objects without preventing GC
const visitedNodes = new WeakSet();

function traverse(node) {
  if (visitedNodes.has(node)) return;
  visitedNodes.add(node);

  // Process node
  for (const child of node.children) {
    traverse(child);
  }
}
// When nodes are removed, they're automatically cleaned from set
```

</details>