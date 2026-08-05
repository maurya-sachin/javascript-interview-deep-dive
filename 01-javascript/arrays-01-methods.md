# Array Methods & Iteration

> **Focus**: JavaScript fundamentals and advanced concepts

---

## Question 1: What are find(), some(), and every() array methods?

**Difficulty:** 🟢 Easy
**Frequency:** ⭐⭐⭐⭐
**Time:** 5 minutes
**Companies:** Google, Meta, Amazon

### Question
Explain these array methods and their differences.

### Answer

These methods search arrays but return different things.

1. **find()**
   - Returns **first element** that matches
   - Returns `undefined` if not found

2. **some()**
   - Returns **boolean** - true if ANY element matches
   - Short-circuits on first match

3. **every()**
   - Returns **boolean** - true if ALL elements match
   - Short-circuits on first non-match

### Code Example

```javascript
const numbers = [1, 2, 3, 4, 5];

// 1. find() - returns first match
const firstEven = numbers.find(n => n % 2 === 0);
console.log(firstEven); // 2

const notFound = numbers.find(n => n > 10);
console.log(notFound); // undefined

// 2. some() - returns boolean (ANY)
const hasEven = numbers.some(n => n % 2 === 0);
console.log(hasEven); // true

const hasNegative = numbers.some(n => n < 0);
console.log(hasNegative); // false

// 3. every() - returns boolean (ALL)
const allPositive = numbers.every(n => n > 0);
console.log(allPositive); // true

const allEven = numbers.every(n => n % 2 === 0);
console.log(allEven); // false

// 4. PRACTICAL EXAMPLES
const users = [
  { name: "Alice", age: 25, active: true },
  { name: "Bob", age: 17, active: true },
  { name: "Charlie", age: 30, active: false }
];

// Find first adult
const firstAdult = users.find(u => u.age >= 18);
console.log(firstAdult.name); // "Alice"

// Check if any user is inactive
const hasInactive = users.some(u => !u.active);
console.log(hasInactive); // true

// Check if all users are adults
const allAdults = users.every(u => u.age >= 18);
console.log(allAdults); // false
```

<details>
<summary><strong>🔍 Deep Dive: V8 Implementation of Array Search Methods</strong></summary>

**How V8 Executes find(), some(), every():**

```javascript
// Simplified V8 internal implementation concept

// find() - Returns first matching element
Array.prototype.find = function(callback, thisArg) {
  const O = Object(this);  // ToObject conversion
  const len = O.length >>> 0;  // Convert to uint32

  for (let k = 0; k < len; k++) {
    // Note: find() does NOT skip holes — it reads every index directly
    const kValue = O[k];
    if (callback.call(thisArg, kValue, k, O)) {
      return kValue;  // ✅ Return FIRST match
    }
  }
  return undefined;  // Not found
};

// some() - Returns boolean (ANY match)
Array.prototype.some = function(callback, thisArg) {
  const O = Object(this);
  const len = O.length >>> 0;

  for (let k = 0; k < len; k++) {
    if (k in O) {
      if (callback.call(thisArg, O[k], k, O)) {
        return true;  // ✅ SHORT-CIRCUIT on first true
      }
    }
  }
  return false;  // No matches
};

// every() - Returns boolean (ALL match)
Array.prototype.every = function(callback, thisArg) {
  const O = Object(this);
  const len = O.length >>> 0;

  for (let k = 0; k < len; k++) {
    if (k in O) {
      if (!callback.call(thisArg, O[k], k, O)) {
        return false;  // ✅ SHORT-CIRCUIT on first false
      }
    }
  }
  return true;  // All match
};
```

**Key Implementation Details:**

1. **Sparse Array Handling**: `if (k in O)` checks if index exists — this applies to `some()`/`every()`, but **not** to `find()`
   ```javascript
   const sparse = [1, , 3, , 5];  // Has "holes"

   sparse.find((x, i) => {
     console.log(i, x);
     return false;
   });
   // Logs: 0 1, 1 undefined, 2 3, 3 undefined, 4 5
   // find() visits EVERY index (unlike map/filter/some/every, it does NOT skip holes)

   sparse.some((x, i) => {
     console.log(i, x);
     return false;
   });
   // Logs: 0 1, 2 3, 4 5 (skips indices 1 and 3 — holes are not visited)
   ```

2. **Short-Circuit Optimization**:
   - `some()`: Stops on FIRST `true` → O(1) best case
   - `every()`: Stops on FIRST `false` → O(1) best case
   - `find()`: Stops on FIRST match → O(1) best case

3. **Time Complexity**:
   - Best case: O(1) - match/mismatch at start
   - Average case: O(n/2) - match/mismatch in middle
   - Worst case: O(n) - match/mismatch at end or not found

**V8 Optimization Techniques:**

1. **Inline Caching (IC)**:
   ```javascript
   // V8 builds an IC for callback patterns
   const users = Array(1000).fill().map((_, i) => ({ id: i, active: i % 2 === 0 }));

   // First call: V8 creates IC for callback shape
   users.some(u => u.active); // ~0.5ms

   // Subsequent calls: Uses cached optimized code
   users.some(u => u.active); // ~0.1ms (5x faster!)

   // Different callback shape: New IC created
   users.some(u => u.id > 500); // ~0.5ms first time
   ```

2. **Hidden Classes & Property Access**:
   ```javascript
   // ✅ GOOD: Consistent object shapes (V8 optimizes)
   const users = [
     { id: 1, name: "Alice", active: true },
     { id: 2, name: "Bob", active: false }
   ];

   // V8 creates hidden class for this shape
   // Property access is optimized (offset-based lookup)
   users.find(u => u.active); // Fast!

   // ❌ BAD: Polymorphic (mixed shapes de-optimize)
   const mixed = [
     { id: 1, name: "Alice", active: true },
     { id: 2, name: "Bob" },  // Missing 'active'
     { id: 3, age: 25, active: true }  // Has 'age' (different shape)
   ];

   // V8 must use slower dictionary lookup
   mixed.find(u => u.active); // Slower (polymorphic IC)
   ```

3. **Array Element Kinds** (V8's internal array representation):
   ```javascript
   // V8 tracks array "element kind" for optimization

   // PACKED_SMI_ELEMENTS (fastest - small integers only)
   const smi = [1, 2, 3, 4, 5];
   smi.find(x => x > 3); // Fastest path

   // PACKED_DOUBLE_ELEMENTS (fast - all numbers)
   const doubles = [1.5, 2.7, 3.14];
   doubles.find(x => x > 2); // Fast path

   // PACKED_ELEMENTS (generic - mixed types)
   const mixed = [1, "two", 3, "four"];
   mixed.find(x => typeof x === 'string'); // Slower (type checks)

   // HOLEY_ELEMENTS (slowest - has gaps)
   const holey = [1, , 3, , 5];
   holey.find(x => x > 2); // Slowest (hole checks required)

   // V8 optimization levels:
   // PACKED_SMI > PACKED_DOUBLE > PACKED > HOLEY_SMI > HOLEY_DOUBLE > HOLEY
   ```

4. **TurboFan JIT Compilation**:
   ```javascript
   // Hot function optimization (called many times)
   function findActiveUser(users) {
     return users.find(u => u.active === true);
   }

   const users = Array(10000).fill().map((_, i) => ({
     id: i,
     active: i % 2 === 0
   }));

   // Cold (first ~100 calls): Interpreted
   for (let i = 0; i < 100; i++) {
     findActiveUser(users); // ~0.5ms each
   }

   // Warm (100-10,000 calls): Baseline JIT compiled
   for (let i = 0; i < 10000; i++) {
     findActiveUser(users); // ~0.2ms each
   }

   // Hot (10,000+ calls): TurboFan optimized
   for (let i = 0; i < 100000; i++) {
     findActiveUser(users); // ~0.05ms each (10x faster!)
   }

   // TurboFan optimizations:
   // - Inlines callback function
   // - Eliminates property access overhead
   // - Removes type checks (assumes shape consistency)
   // - Uses SIMD instructions for array iteration
   ```

**Memory Layout & Access Patterns:**

```javascript
// V8 stores arrays in contiguous memory (when possible)

// ✅ GOOD: Contiguous memory (cache-friendly)
const packed = [1, 2, 3, 4, 5];
// Memory: [1][2][3][4][5] - sequential access, fast!

// ❌ BAD: Sparse array (dictionary mode)
const sparse = [];
sparse[0] = 1;
sparse[1000000] = 2;
// Memory: Hash table with entries {0: 1, 1000000: 2}
// No sequential access benefits, slower!

// Benchmark: find() performance
console.time('packed');
const packed = Array(100000).fill().map((_, i) => i);
packed.find(x => x === 99999); // Check last element
console.timeEnd('packed'); // ~0.8ms

console.time('sparse');
const sparse = [];
for (let i = 0; i < 100000; i++) {
  sparse[i * 100] = i; // Every 100th index
}
sparse.find(x => x === 99999);
console.timeEnd('sparse'); // ~15ms (19x slower!)
```

**Short-Circuit Efficiency Analysis:**

```javascript
// Practical impact of short-circuiting

// Dataset: 1 million items
const data = Array(1000000).fill().map((_, i) => ({ id: i, value: i }));

// Test 1: Target at position 100 (early match)
console.time('find-early');
data.find(x => x.id === 100);
console.timeEnd('find-early'); // ~0.001ms (stopped after 100 iterations)

// Test 2: Target at position 500,000 (middle)
console.time('find-middle');
data.find(x => x.id === 500000);
console.timeEnd('find-middle'); // ~2ms (stopped after 500,000 iterations)

// Test 3: Target at position 999,999 (late)
console.time('find-late');
data.find(x => x.id === 999999);
console.timeEnd('find-late'); // ~4ms (stopped after 999,999 iterations)

// Test 4: Target doesn't exist
console.time('find-none');
data.find(x => x.id === -1);
console.timeEnd('find-none'); // ~4ms (checked all 1M items)

// Comparison with filter() (no short-circuit):
console.time('filter');
data.filter(x => x.id === 100)[0];
console.timeEnd('filter'); // ~8ms (ALWAYS checks all 1M items!)

// Short-circuit benefit: Up to 8,000x faster for early matches!
```

**Empty Array Edge Cases:**

```javascript
// Edge case behavior

// Empty array with every()
[].every(x => false); // true (vacuous truth - all 0 elements match!)
[].every(x => true);  // true

// Empty array with some()
[].some(x => true);   // false (no elements to match)
[].some(x => false);  // false

// Empty array with find()
[].find(x => true);   // undefined (no elements)

// Why every([]) returns true:
// "All elements satisfy the condition" is vacuously true when there are no elements
// This follows mathematical logic (∀x ∈ ∅, P(x) is true)
```

**Callback Function Performance:**

```javascript
// Callback complexity impacts performance

const data = Array(100000).fill().map((_, i) => ({ id: i, value: i * 2 }));

// Test 1: Simple comparison (fast)
console.time('simple');
data.find(x => x.id === 50000);
console.timeEnd('simple'); // ~0.5ms

// Test 2: Complex calculation (slower)
console.time('complex');
data.find(x => {
  const squared = x.value ** 2;
  const root = Math.sqrt(squared);
  const rounded = Math.floor(root);
  return rounded === 50000;
});
console.timeEnd('complex'); // ~8ms (16x slower!)

// Test 3: External function call (slowest)
function expensiveCheck(x) {
  return JSON.stringify(x).length > 10;
}

console.time('external');
data.find(x => expensiveCheck(x));
console.timeEnd('external'); // ~25ms (50x slower!)

// Lesson: Keep callbacks simple for hot paths
```

**thisArg Parameter Usage:**

```javascript
// The rarely-used second parameter

const multiplier = {
  factor: 10,
  isMatch(num) {
    return num > this.factor; // Uses 'this' from object
  }
};

const numbers = [1, 5, 8, 12, 15];

// ❌ Without thisArg (wrong 'this')
numbers.find(multiplier.isMatch); // In strict mode/modules: TypeError (this is undefined)
                                   // In non-strict scripts: 'this' is the global object, so it silently returns undefined

// ✅ With thisArg (correct 'this')
numbers.find(multiplier.isMatch, multiplier); // 12

// Modern alternative: Arrow function
numbers.find(num => multiplier.isMatch(num)); // 12

// Or bind:
numbers.find(multiplier.isMatch.bind(multiplier)); // 12
```

</details>

<details>
<summary><strong>🐛 Real-World Scenario: Debugging Slow Search Performance</strong></summary>

**Scenario**: You're debugging a production admin dashboard that searches through 50,000 user records. Search operations are taking 2+ seconds, causing the UI to freeze. Customer support is receiving 20+ complaints per day about "slow loading" and "unresponsive interface."

**Production Metrics (Before Fix):**
- Average search time: 2,150ms
- P95 search time: 3,800ms
- UI freeze duration: 1-4 seconds
- User complaints: 23/day
- Bounce rate on admin page: 42%
- Database load: High (unnecessary queries)

**The Problem Code:**

```javascript
// ❌ CRITICAL BUG: Using filter() when you only need first match
const users = Array(50000).fill().map((_, i) => ({
  id: i,
  email: `user${i}@example.com`,
  name: `User ${i}`,
  status: i % 5 === 0 ? 'inactive' : 'active',
  permissions: ['read', 'write'].slice(0, Math.random() > 0.5 ? 2 : 1),
  lastLogin: new Date(Date.now() - Math.random() * 86400000 * 365),
  metadata: {
    createdAt: new Date(2020, 0, 1),
    department: ['Sales', 'Engineering', 'Marketing'][i % 3]
  }
}));

// BAD: filter() checks ALL 50,000 records EVERY TIME
console.time('filter-search');
const user = users.filter(u => u.email === 'user1000@example.com')[0];
console.timeEnd('filter-search');  // ~18-25ms (checks all 50,000!)

// Even worse: Multiple filter() calls in the same function
console.time('multiple-filters');
function getUserInfo(email) {
  const user = users.filter(u => u.email === email)[0];
  const activeUsers = users.filter(u => u.status === 'active');
  const sameDepart = users.filter(u =>
    u.metadata.department === user.metadata.department
  );

  return {
    user,
    totalActive: activeUsers.length,
    departmentCount: sameDepart.length
  };
}
getUserInfo('user1000@example.com');
console.timeEnd('multiple-filters');  // ~55-65ms (3 full scans!)

// Production impact:
// - 150,000 iterations per search (50k * 3)
// - UI thread blocked for 50-65ms
// - Memory: 3 intermediate arrays created (wasteful)
```

**Debugging Process:**

**Step 1: Identify the Performance Bottleneck**

```javascript
// Add performance markers
console.time('TOTAL: getUserInfo');

console.time('1. Find user');
const user = users.filter(u => u.email === email)[0];
console.timeEnd('1. Find user');  // ~20ms ⚠️

console.time('2. Count active');
const activeUsers = users.filter(u => u.status === 'active');
console.timeEnd('2. Count active');  // ~18ms ⚠️

console.time('3. Count department');
const sameDepart = users.filter(u =>
  u.metadata.department === user.metadata.department
);
console.timeEnd('3. Count department');  // ~22ms ⚠️

console.timeEnd('TOTAL: getUserInfo');  // ~60ms total

// Aha! Each filter() scans the entire 50k array
// 3 separate full scans = 150k operations
```

**Step 2: Analyze with Chrome DevTools**

```javascript
// Performance tab shows:
// - Main thread blocked: 60ms
// - JavaScript execution: 58ms
// - Function: getUserInfo (self time: 55ms)
// - Majority time in Array.filter calls

// Memory profiler shows:
// - 3 arrays allocated (50k, 40k, 16k elements)
// - Total memory allocated: ~5MB per search
// - GC pressure: High (frequent collections)
```

**Step 3: Fix with Appropriate Methods**

```javascript
// ✅ FIXED: Use find(), some(), and single reduce()
console.time('optimized-search');
function getUserInfoOptimized(email) {
  // 1. Use find() instead of filter()[0]
  const user = users.find(u => u.email === email);

  if (!user) {
    return { error: 'User not found' };
  }

  // 2. Use single reduce() for multiple aggregations
  const stats = users.reduce((acc, u) => {
    if (u.status === 'active') acc.activeCount++;
    if (u.metadata.department === user.metadata.department) {
      acc.departmentCount++;
    }
    return acc;
  }, { activeCount: 0, departmentCount: 0 });

  return {
    user,
    totalActive: stats.activeCount,
    departmentCount: stats.departmentCount
  };
}

const result = getUserInfoOptimized('user1000@example.com');
console.timeEnd('optimized-search');  // ~22ms

// Performance improvement:
// - Before: 60ms (3 full scans)
// - After: 22ms (find() stops early + 1 full scan)
// - Speedup: 2.7x faster
// - Memory: 1 small object vs 3 large arrays
```

**Step 4: Further Optimization with Caching**

```javascript
// ✅ EVEN BETTER: Cache aggregated data
class UserSearchOptimized {
  constructor(users) {
    this.users = users;
    this.emailIndex = new Map();
    this.stats = null;

    // Build indexes on initialization
    this.buildIndexes();
  }

  buildIndexes() {
    console.time('build-indexes');

    // Build email index
    this.users.forEach(user => {
      this.emailIndex.set(user.email, user);
    });

    // Pre-calculate stats
    this.stats = this.users.reduce((acc, u) => {
      acc.byStatus[u.status] = (acc.byStatus[u.status] || 0) + 1;
      acc.byDepartment[u.metadata.department] =
        (acc.byDepartment[u.metadata.department] || 0) + 1;
      return acc;
    }, {
      byStatus: {},
      byDepartment: {}
    });

    console.timeEnd('build-indexes');  // ~45ms (one-time cost)
  }

  getUserInfo(email) {
    console.time('cached-search');

    // O(1) lookup via Map
    const user = this.emailIndex.get(email);

    if (!user) {
      return { error: 'User not found' };
    }

    // O(1) lookups from pre-calculated stats
    const result = {
      user,
      totalActive: this.stats.byStatus.active || 0,
      departmentCount: this.stats.byDepartment[user.metadata.department] || 0
    };

    console.timeEnd('cached-search');  // ~0.005ms!
    return result;
  }
}

const searcher = new UserSearchOptimized(users);
searcher.getUserInfo('user1000@example.com');

// Performance:
// - Initialization: 45ms (one-time)
// - Each search: ~0.005ms
// - Speedup vs original: 12,000x faster!
```

**Real Production Fix & Results:**

```javascript
// PRODUCTION IMPLEMENTATION

class AdminDashboardSearch {
  constructor() {
    this.users = [];
    this.indexes = {
      email: new Map(),
      id: new Map(),
      status: new Map(),
      department: new Map()
    };
    this.aggregates = null;
    this.lastIndexUpdate = null;
  }

  async loadUsers() {
    console.time('load-users');

    // Fetch from API
    const response = await fetch('/api/admin/users');
    this.users = await response.json();

    // Build indexes
    this.buildIndexes();

    console.timeEnd('load-users');
  }

  buildIndexes() {
    const start = performance.now();

    // Clear existing indexes
    Object.values(this.indexes).forEach(map => map.clear());

    this.users.forEach(user => {
      // Email index (primary lookup)
      this.indexes.email.set(user.email.toLowerCase(), user);

      // ID index
      this.indexes.id.set(user.id, user);

      // Status index (for filtering)
      if (!this.indexes.status.has(user.status)) {
        this.indexes.status.set(user.status, []);
      }
      this.indexes.status.get(user.status).push(user);

      // Department index
      const dept = user.metadata.department;
      if (!this.indexes.department.has(dept)) {
        this.indexes.department.set(dept, []);
      }
      this.indexes.department.get(dept).push(user);
    });

    // Calculate aggregates
    this.aggregates = {
      total: this.users.length,
      byStatus: {},
      byDepartment: {}
    };

    this.indexes.status.forEach((users, status) => {
      this.aggregates.byStatus[status] = users.length;
    });

    this.indexes.department.forEach((users, dept) => {
      this.aggregates.byDepartment[dept] = users.length;
    });

    this.lastIndexUpdate = Date.now();

    const duration = performance.now() - start;
    console.log(`Indexes built in ${duration.toFixed(2)}ms`);
  }

  searchByEmail(email) {
    // O(1) lookup
    return this.indexes.email.get(email.toLowerCase());
  }

  searchById(id) {
    // O(1) lookup
    return this.indexes.id.get(id);
  }

  getUsersByStatus(status) {
    // O(1) lookup to pre-filtered list
    return this.indexes.status.get(status) || [];
  }

  getUsersByDepartment(department) {
    // O(1) lookup to pre-filtered list
    return this.indexes.department.get(department) || [];
  }

  getStats() {
    return this.aggregates;
  }

  // Optimized version of original function
  getUserInfo(email) {
    const user = this.searchByEmail(email);

    if (!user) {
      return { error: 'User not found' };
    }

    return {
      user,
      totalActive: this.aggregates.byStatus.active || 0,
      departmentCount: this.aggregates.byDepartment[user.metadata.department] || 0
    };
  }
}

// Initialize once on page load
const dashboard = new AdminDashboardSearch();
await dashboard.loadUsers();

// Usage in search handlers
function handleUserSearch(email) {
  console.time('search');
  const result = dashboard.getUserInfo(email);
  console.timeEnd('search');  // ~0.003ms
  displayResults(result);
}
```

**Production Metrics (After Fix):**

```javascript
// Before optimization:
// - Average search time: 2,150ms
// - P95 search time: 3,800ms
// - Memory per search: ~5MB (temporary arrays)
// - CPU usage: High (main thread blocking)
// - User complaints: 23/day
// - Bounce rate: 42%

// After optimization:
// - Initial index build: 65ms (one-time on page load)
// - Average search time: 0.004ms (537,500x faster!)
// - P95 search time: 0.008ms
// - Memory per search: ~48 bytes (tiny object)
// - CPU usage: Minimal (no main thread blocking)
// - User complaints: 0/day ✅
// - Bounce rate: 8% (81% reduction) ✅
// - User satisfaction: +94%
// - Support ticket reduction: 100%

// Additional benefits:
// - Can handle 100,000+ users without performance degradation
// - Instant search results (feels like magic to users)
// - Reduced server load (fewer API calls for repeated searches)
// - Better UX: No UI freezing, smooth animations maintained
// - Developer productivity: Easier to add new search features
```

**Common Mistakes & Lessons:**

```javascript
// ❌ MISTAKE 1: Using filter() for single-item lookup
const user = users.filter(u => u.id === userId)[0];
// Fix: Use find()
const user = users.find(u => u.id === userId);

// ❌ MISTAKE 2: Using filter().length for existence check
if (users.filter(u => u.status === 'active').length > 0) { }
// Fix: Use some()
if (users.some(u => u.status === 'active')) { }

// ❌ MISTAKE 3: Multiple filter() calls for aggregation
const active = users.filter(u => u.status === 'active').length;
const inactive = users.filter(u => u.status === 'inactive').length;
// Fix: Use single reduce()
const counts = users.reduce((acc, u) => {
  acc[u.status] = (acc[u.status] || 0) + 1;
  return acc;
}, {});

// ❌ MISTAKE 4: Recreating indexes on every search
function search(email) {
  const index = new Map(users.map(u => [u.email, u])); // ❌ Expensive!
  return index.get(email);
}
// Fix: Build index once, reuse many times

// ❌ MISTAKE 5: Using indexOf for object lookups
const index = users.findIndex(u => u.id === userId);
const user = users[index];
// Fix: Use find() directly or build Map index
```

**Key Takeaways:**

1. **Use the right tool for the job**: find() for single item, some() for existence, every() for validation
2. **Short-circuit when possible**: find/some/every stop early, filter never does
3. **Avoid repeated full scans**: Use reduce() for multiple aggregations
4. **Index for repeated lookups**: O(n) build once → O(1) lookups many times
5. **Profile before optimizing**: Measure to find actual bottlenecks
6. **Consider memory vs speed trade-offs**: Indexes use memory but save time

</details>

<details>
<summary><strong>⚖️ Trade-offs: find() vs filter() vs indexOf()</strong></summary>

| Method | Returns | Stops Early? | Use When | Performance |
|--------|---------|--------------|----------|-------------|
| `find()` | Element or undefined | ✅ Yes | Need first matching element | O(n) worst, O(1) best |
| `filter()` | Array of matches | ❌ No | Need ALL matches | Always O(n) |
| `some()` | Boolean | ✅ Yes | Check if ANY exists | O(n) worst, O(1) best |
| `every()` | Boolean | ✅ Yes | Check if ALL match | O(n) worst, O(1) best |
| `indexOf()` | Index or -1 | ✅ Yes | Find primitive values | O(n) worst, O(1) best |
| `includes()` | Boolean | ✅ Yes | Check primitive exists | O(n) worst, O(1) best |

**Performance Comparison** (10,000 items, target at index 100):

```javascript
const arr = Array(10000).fill().map((_, i) => ({ id: i }));

// 1. find() - FAST (stops at 100)
console.time('find');
arr.find(x => x.id === 100);
console.timeEnd('find');  // ~0.02ms

// 2. filter() - SLOW (checks all 10,000)
console.time('filter');
arr.filter(x => x.id === 100)[0];
console.timeEnd('filter');  // ~1.2ms

// 3. some() - FAST (boolean check, stops at 100)
console.time('some');
arr.some(x => x.id === 100);
console.timeEnd('some');  // ~0.02ms

// find() is 60x faster than filter() for single-match scenarios!
```

**When to Use Each:**

```javascript
// ✅ Use find() - When you need the FIRST matching element
const admin = users.find(u => u.role === 'admin');

// ✅ Use filter() - When you need ALL matching elements
const allAdmins = users.filter(u => u.role === 'admin');

// ✅ Use some() - When you only need to know IF it exists
const hasAdmin = users.some(u => u.role === 'admin');

// ✅ Use every() - When you need to validate ALL elements
const allActive = users.every(u => u.status === 'active');

// ✅ Use indexOf() / includes() - For primitive values
const hasApple = fruits.includes('apple');  // Faster than find!
const appleIndex = fruits.indexOf('apple');
```

**Memory Trade-offs:**

```javascript
// filter() creates NEW array (memory overhead)
const result = arr.filter(x => x.id > 100);  // May allocate large array

// find() returns single element (minimal memory)
const result = arr.find(x => x.id > 100);  // Returns single object

// For large datasets, find() is more memory efficient!
```

</details>

<details>
<summary><strong>💬 Explain to Junior: Array Search Methods</strong></summary>

**Simple Explanation:**

Imagine you're looking through a stack of 100 resumes to hire developers:

**find()** = "Find me the FIRST person who knows React"
- You stop reading as soon as you find ONE person who knows React
- You get that person's resume back
- If nobody knows React, you get `undefined`

```javascript
const firstReactDev = resumes.find(resume =>
  resume.skills.includes('React')
);
// Returns: { name: "Alice", skills: ["React", "Node"] }
```

**some()** = "Does ANYONE know React?"
- You stop reading as soon as you find ONE person
- You just answer YES or NO
- Much faster when you only need to know if it exists

```javascript
const hasReactDev = resumes.some(resume =>
  resume.skills.includes('React')
);
// Returns: true (found at least one)
```

**every()** = "Does EVERYONE know JavaScript?"
- You stop reading as soon as you find ONE person who doesn't
- You answer YES only if ALL match
- Used for validation

```javascript
const allKnowJS = resumes.every(resume =>
  resume.skills.includes('JavaScript')
);
// Returns: false (Bob doesn't know JS, stopped checking)
```

**Analogy for a PM:**

"Think of it like searching for a restaurant:
- **find()**: 'Show me the first Italian restaurant' → Returns the restaurant
- **some()**: 'Are there any Italian restaurants?' → Returns yes/no
- **every()**: 'Are all restaurants Italian?' → Returns yes/no

The key benefit? If you find what you're looking for early, you stop searching. With filter(), you'd check every restaurant even if the first one was Italian!"

**Visual Example:**

```javascript
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// find() - Looking for first number > 5
// Checks: 1? no, 2? no, 3? no, 4? no, 5? no, 6? YES! → Returns 6
numbers.find(n => n > 5);  // 6

// some() - Is ANY number > 5?
// Checks: 1? no, 2? no, 3? no, 4? no, 5? no, 6? YES! → Returns true
numbers.some(n => n > 5);  // true

// every() - Are ALL numbers > 5?
// Checks: 1? no → Returns false immediately!
numbers.every(n => n > 5);  // false
```

**Common Mistake to Avoid:**

```javascript
// ❌ DON'T do this (wasteful):
if (users.filter(u => u.role === 'admin').length > 0) {
  // Checks ALL users, creates array, then checks length
}

// ✅ DO this instead (efficient):
if (users.some(u => u.role === 'admin')) {
  // Stops at first admin, returns boolean immediately
}
```

</details>

### Resources

- [MDN: Array.prototype.find()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find)

---

## Question 2: Essential Array Methods - map, filter, reduce

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐⭐
**Time:** 10-15 minutes
**Companies:** Google, Meta, Amazon, Microsoft, Uber, Netflix

### Question
Explain map(), filter(), and reduce(). Provide examples and explain when to use each.

### Answer

These are **higher-order functions** that take a callback and return new values without mutating the original array.

### Code Example

**map() - Transform Each Element:**

```javascript
// Syntax: array.map(callback(element, index, array))
// Returns: New array with transformed elements

const numbers = [1, 2, 3, 4, 5];

// Double each number
const doubled = numbers.map(num => num * 2);
console.log(doubled);  // [2, 4, 6, 8, 10]

// Extract property from objects
const users = [
  { name: "Alice", age: 25 },
  { name: "Bob", age: 30 },
  { name: "Charlie", age: 35 }
];

const names = users.map(user => user.name);
console.log(names);  // ["Alice", "Bob", "Charlie"]

// With index
const indexed = numbers.map((num, index) => ({
  value: num,
  index: index
}));
console.log(indexed);
// [{ value: 1, index: 0 }, { value: 2, index: 1 }, ...]

/*
USE CASES:
- Transform data structure
- Extract specific properties
- Convert data types
- Return same length array with modifications
*/
```

**filter() - Select Elements:**

```javascript
// Syntax: array.filter(callback(element, index, array))
// Returns: New array with elements that pass the test

const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Get even numbers
const evens = numbers.filter(num => num % 2 === 0);
console.log(evens);  // [2, 4, 6, 8, 10]

// Filter objects
const users = [
  { name: "Alice", age: 17, active: true },
  { name: "Bob", age: 25, active: false },
  { name: "Charlie", age: 30, active: true }
];

const adults = users.filter(user => user.age >= 18);
const activeUsers = users.filter(user => user.active);
const activeAdults = users.filter(user => user.age >= 18 && user.active);

console.log(activeAdults);
// [{ name: "Charlie", age: 30, active: true }]

/*
USE CASES:
- Remove unwanted elements
- Search/find matching items
- Validation filtering
- Return subset of original array
*/
```

**reduce() - Reduce to Single Value:**

```javascript
// Syntax: array.reduce(callback(accumulator, current, index, array), initialValue)
// Returns: Single accumulated value

const numbers = [1, 2, 3, 4, 5];

// Sum all numbers
const sum = numbers.reduce((acc, num) => acc + num, 0);
console.log(sum);  // 15

// Find maximum
const max = numbers.reduce((acc, num) => Math.max(acc, num), -Infinity);
console.log(max);  // 5

// Count occurrences
const fruits = ["apple", "banana", "apple", "orange", "banana", "apple"];
const count = fruits.reduce((acc, fruit) => {
  acc[fruit] = (acc[fruit] || 0) + 1;
  return acc;
}, {});
console.log(count);  // { apple: 3, banana: 2, orange: 1 }

// Group by property
const users = [
  { name: "Alice", role: "admin" },
  { name: "Bob", role: "user" },
  { name: "Charlie", role: "admin" }
];

const grouped = users.reduce((acc, user) => {
  const role = user.role;
  if (!acc[role]) acc[role] = [];
  acc[role].push(user);
  return acc;
}, {});

console.log(grouped);
/*
{
  admin: [{ name: "Alice", role: "admin" }, { name: "Charlie", role: "admin" }],
  user: [{ name: "Bob", role: "user" }]
}
*/

// Flatten array
const nested = [[1, 2], [3, 4], [5, 6]];
const flattened = nested.reduce((acc, arr) => acc.concat(arr), []);
console.log(flattened);  // [1, 2, 3, 4, 5, 6]

// Build object from array
const keyValue = [["name", "John"], ["age", 30], ["city", "NYC"]];
const obj = keyValue.reduce((acc, [key, value]) => {
  acc[key] = value;
  return acc;
}, {});
console.log(obj);  // { name: "John", age: 30, city: "NYC" }

/*
USE CASES:
- Sum, average, min, max calculations
- Counting and grouping
- Flattening nested structures
- Converting arrays to objects
- Implementing other array methods
- Complex transformations
*/
```

**Chaining Methods:**

```javascript
const users = [
  { name: "Alice", age: 25, score: 85 },
  { name: "Bob", age: 17, score: 92 },
  { name: "Charlie", age: 30, score: 78 },
  { name: "David", age: 22, score: 95 }
];

// Get average score of adult users
const avgAdultScore = users
  .filter(user => user.age >= 18)        // Filter adults
  .map(user => user.score)                // Extract scores
  .reduce((sum, score, idx, arr) => {     // Calculate average
    return idx === arr.length - 1
      ? (sum + score) / arr.length
      : sum + score;
  }, 0);

console.log(avgAdultScore);  // 86

// Or cleaner:
const avgScore = users
  .filter(u => u.age >= 18)
  .reduce((sum, u, i, arr) => {
    sum += u.score;
    return i === arr.length - 1 ? sum / arr.length : sum;
  }, 0);
```

**Implementing map/filter with reduce:**

```javascript
// map implementation using reduce
Array.prototype.myMap = function(callback) {
  return this.reduce((acc, item, index, array) => {
    acc.push(callback(item, index, array));
    return acc;
  }, []);
};

// filter implementation using reduce
Array.prototype.myFilter = function(callback) {
  return this.reduce((acc, item, index, array) => {
    if (callback(item, index, array)) {
      acc.push(item);
    }
    return acc;
  }, []);
};

// Test
const nums = [1, 2, 3, 4, 5];
console.log(nums.myMap(x => x * 2));      // [2, 4, 6, 8, 10]
console.log(nums.myFilter(x => x % 2 === 0));  // [2, 4]
```

### Common Mistakes

❌ **Wrong**: Forgetting to return in map
```javascript
const doubled = [1, 2, 3].map(num => {
  num * 2;  // ❌ No return!
});
console.log(doubled);  // [undefined, undefined, undefined]
```

✅ **Correct**: Always return in map
```javascript
const doubled = [1, 2, 3].map(num => num * 2);
// Or with explicit return:
const doubled2 = [1, 2, 3].map(num => {
  return num * 2;
});
```

❌ **Wrong**: Forgetting initial value in reduce
```javascript
const nums = [];
const sum = nums.reduce((acc, num) => acc + num);  // ❌ Error!
// TypeError: Reduce of empty array with no initial value
```

✅ **Correct**: Always provide initial value
```javascript
const sum = nums.reduce((acc, num) => acc + num, 0);  // 0
```

❌ **Wrong**: Mutating in map/filter
```javascript
const users = [{ name: "Alice" }, { name: "Bob" }];

const modified = users.map(user => {
  user.role = "admin";  // ❌ Mutates original!
  return user;
});

console.log(users[0].role);  // "admin" (original mutated!)
```

✅ **Correct**: Return new objects
```javascript
const modified = users.map(user => ({
  ...user,
  role: "admin"
}));

console.log(users[0].role);  // undefined (original unchanged)
```
