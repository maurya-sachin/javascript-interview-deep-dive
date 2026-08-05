# Async/Await & Modern Patterns

> **Focus**: JavaScript fundamentals and advanced concepts

---

## Question 1: Explain async/await syntax. How does it differ from promises?

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐⭐
**Time:** 7-10 minutes
**Companies:** Google, Meta, Amazon, Netflix, Airbnb

### Question
What is async/await in JavaScript? How does it compare to using promises with .then()? What are the advantages and potential pitfalls of async/await?

### Answer

**Async/Await Basics:**
- **Syntactic sugar** over promises, not a replacement
- `async` function **always returns a promise**
- `await` **pauses** function execution until promise settles
- Makes asynchronous code **look synchronous**

**Key Characteristics:**
- `await` can only be used inside `async` functions (or top-level in modules)
- `await` unwraps promise value (no need for .then())
- Errors can be caught with **try/catch** blocks
- Still **non-blocking** - other code continues to execute
- Returns are automatically wrapped in `Promise.resolve()`

**Advantages over .then():**
- More **readable**, resembles synchronous code
- Easier **error handling** with try/catch
- Better **debugging** (clearer stack traces)
- Simpler **conditionals and loops** with async operations

**Potential Pitfalls:**
- Sequential `await` calls may be **slower** than Promise.all
- Easy to forget `await`, getting promise instead of value
- Try/catch can hide errors if not careful
- Cannot await in regular functions

### Code Example

```javascript
// ============================================
// Example 1: Basic async/await syntax
// ============================================

// Promise-based approach
function getUserPromise(id) {
  return fetch(`/api/user/${id}`)
    .then(response => response.json())
    .then(user => {
      console.log('User:', user);
      return user;
    })
    .catch(error => {
      console.error('Error:', error);
      throw error;
    });
}

// Async/await approach (cleaner)
async function getUserAsync(id) {
  try {
    const response = await fetch(`/api/user/${id}`);
    const user = await response.json();
    console.log('User:', user);
    return user;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}


// ============================================
// Example 2: Async functions always return promises
// ============================================
async function returnNumber() {
  return 42; // Automatically wrapped in Promise.resolve(42)
}

returnNumber().then(num => {
  console.log(num); // 42
});

// Equivalent to:
function returnNumberPromise() {
  return Promise.resolve(42);
}

// Throwing in async function creates rejected promise
async function throwError() {
  throw new Error('Failed'); // Automatically wrapped in Promise.reject()
}

throwError().catch(error => {
  console.error(error.message); // 'Failed'
});


// ============================================
// Example 3: Error handling comparison
// ============================================

// With promises - single catch
fetch('/api/user')
  .then(response => response.json())
  .then(user => fetch(`/api/posts/${user.id}`))
  .then(response => response.json())
  .then(posts => console.log(posts))
  .catch(error => console.error('Error:', error));

// With async/await - try/catch
async function loadUserAndPosts() {
  try {
    const userResponse = await fetch('/api/user');
    const user = await userResponse.json();

    const postsResponse = await fetch(`/api/posts/${user.id}`);
    const posts = await postsResponse.json();

    console.log(posts);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Multiple try/catch blocks for granular error handling
async function loadDataWithGranularErrors() {
  let user;

  try {
    const response = await fetch('/api/user');
    user = await response.json();
  } catch (error) {
    console.error('Failed to load user:', error);
    return; // Exit early
  }

  try {
    const response = await fetch(`/api/posts/${user.id}`);
    const posts = await response.json();
    console.log('Posts:', posts);
  } catch (error) {
    console.error('Failed to load posts (continuing anyway):', error);
    // Continue with user data only
  }

  return user;
}


// ============================================
// Example 4: Sequential vs parallel execution
// ============================================

// ❌ Slow: Sequential execution (3 seconds total)
async function loadSequential() {
  const user1 = await fetch('/api/user/1').then(r => r.json()); // 1s
  const user2 = await fetch('/api/user/2').then(r => r.json()); // 1s
  const user3 = await fetch('/api/user/3').then(r => r.json()); // 1s

  return [user1, user2, user3];
}

// ✅ Fast: Parallel execution (1 second total)
async function loadParallel() {
  const [user1, user2, user3] = await Promise.all([
    fetch('/api/user/1').then(r => r.json()),
    fetch('/api/user/2').then(r => r.json()),
    fetch('/api/user/3').then(r => r.json())
  ]);

  return [user1, user2, user3];
}

// Alternative parallel syntax
async function loadParallelAlt() {
  // Start all requests simultaneously
  const promise1 = fetch('/api/user/1').then(r => r.json());
  const promise2 = fetch('/api/user/2').then(r => r.json());
  const promise3 = fetch('/api/user/3').then(r => r.json());

  // Wait for all to complete
  const user1 = await promise1;
  const user2 = await promise2;
  const user3 = await promise3;

  return [user1, user2, user3];
}


// ============================================
// Example 5: Conditional logic with async/await
// ============================================

// Complex with promises
function loadUserDataPromise(userId, includePosts) {
  return fetch(`/api/user/${userId}`)
    .then(response => response.json())
    .then(user => {
      if (includePosts) {
        return fetch(`/api/posts/${userId}`)
          .then(response => response.json())
          .then(posts => {
            user.posts = posts;
            return user;
          });
      }
      return user;
    });
}

// Cleaner with async/await
async function loadUserDataAsync(userId, includePosts) {
  const response = await fetch(`/api/user/${userId}`);
  const user = await response.json();

  if (includePosts) {
    const postsResponse = await fetch(`/api/posts/${userId}`);
    user.posts = await postsResponse.json();
  }

  return user;
}


// ============================================
// Example 6: Loops with async/await
// ============================================

// Processing items sequentially
async function processItemsSequential(items) {
  const results = [];

  for (const item of items) {
    const result = await processItem(item); // Wait for each
    results.push(result);
  }

  return results;
}

// Processing items in parallel (faster)
async function processItemsParallel(items) {
  const promises = items.map(item => processItem(item));
  return await Promise.all(promises);
}

// Processing with concurrency limit
async function processItemsWithLimit(items, limit = 5) {
  const results = [];

  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    const batchResults = await Promise.all(
      batch.map(item => processItem(item))
    );
    results.push(...batchResults);
  }

  return results;
}


// ============================================
// Example 7: Top-level await (ES2022)
// ============================================

// In module files (.mjs or type: "module")
// No need for async wrapper

// Old way:
(async () => {
  const data = await fetch('/api/data').then(r => r.json());
  console.log(data);
})();

// New way (top-level await):
const data = await fetch('/api/data').then(r => r.json());
console.log(data);

// Useful for module initialization
const config = await fetch('/config.json').then(r => r.json());
export default config;


// ============================================
// Example 8: Async/await with Promise.all variants
// ============================================

// Promise.all - fails fast
async function loadAllUsers(ids) {
  try {
    const users = await Promise.all(
      ids.map(id => fetch(`/api/user/${id}`).then(r => r.json()))
    );
    return users; // All succeeded
  } catch (error) {
    console.error('At least one request failed:', error);
    return [];
  }
}

// Promise.allSettled - never rejects
async function loadAllUsersSettled(ids) {
  const results = await Promise.allSettled(
    ids.map(id => fetch(`/api/user/${id}`).then(r => r.json()))
  );

  const successful = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);

  const failed = results
    .filter(r => r.status === 'rejected')
    .map(r => r.reason);

  console.log(`Loaded ${successful.length}, failed ${failed.length}`);
  return successful;
}

// Promise.race - first to settle
async function loadWithFallback(primaryUrl, fallbackUrl) {
  try {
    const result = await Promise.race([
      fetch(primaryUrl).then(r => r.json()),
      fetch(fallbackUrl).then(r => r.json())
    ]);
    return result; // Whichever completes first
  } catch (error) {
    console.error('Both requests failed:', error);
    throw error;
  }
}


// ============================================
// Example 9: Retry logic with async/await
// ============================================
async function fetchWithRetry(url, maxRetries = 3) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json(); // Success
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${i + 1} failed, retrying...`);

      // Wait before retry (exponential backoff)
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
}

// Usage
try {
  const data = await fetchWithRetry('/api/data', 3);
  console.log('Data:', data);
} catch (error) {
  console.error('All retries exhausted:', error.message);
}


// ============================================
// Example 10: Timeout with async/await
// ============================================
function timeout(ms) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), ms)
  );
}

async function fetchWithTimeout(url, ms = 5000) {
  try {
    const response = await Promise.race([
      fetch(url),
      timeout(ms)
    ]);

    return await response.json();
  } catch (error) {
    if (error.message === 'Timeout') {
      console.error(`Request timed out after ${ms}ms`);
    }
    throw error;
  }
}

// Usage
try {
  const data = await fetchWithTimeout('/api/slow-endpoint', 3000);
  console.log('Data:', data);
} catch (error) {
  console.error('Request failed:', error.message);
}


// ============================================
// Example 11: Common pitfalls
// ============================================

// ❌ Pitfall 1: Forgetting await
async function loadUserPitfall(id) {
  const user = fetch(`/api/user/${id}`).then(r => r.json());
  console.log(user); // Promise, not user data!
  return user;
}

// ✅ Correct: Always await
async function loadUserCorrect(id) {
  const user = await fetch(`/api/user/${id}`).then(r => r.json());
  console.log(user); // Actual user data
  return user;
}

// ❌ Pitfall 2: Using await in non-async function
function regularFunction() {
  // const data = await fetch('/api/data'); // SyntaxError!
}

// ✅ Correct: Make function async
async function asyncFunction() {
  const data = await fetch('/api/data');
  return data;
}

// ❌ Pitfall 3: Swallowing errors with empty catch
async function silentFailure() {
  try {
    await fetch('/api/data');
  } catch (error) {
    // Empty catch - error disappears!
  }
}

// ✅ Correct: Handle or re-throw errors
async function properErrorHandling() {
  try {
    await fetch('/api/data');
  } catch (error) {
    console.error('Error occurred:', error);
    throw error; // Or handle appropriately
  }
}


// ============================================
// Example 12: Real-world patterns
// ============================================

// Data fetching with loading states
class DataLoader {
  constructor() {
    this.cache = new Map();
  }

  async fetchUser(id) {
    // Check cache first
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }

    try {
      const response = await fetch(`/api/user/${id}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const user = await response.json();

      // Cache result
      this.cache.set(id, user);

      return user;
    } catch (error) {
      console.error(`Failed to load user ${id}:`, error);
      throw error;
    }
  }

  async fetchMultipleUsers(ids) {
    const results = await Promise.allSettled(
      ids.map(id => this.fetchUser(id))
    );

    return results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);
  }
}

// Usage
const loader = new DataLoader();

async function displayUsers() {
  try {
    const users = await loader.fetchMultipleUsers([1, 2, 3]);
    console.log('Loaded users:', users);
  } catch (error) {
    console.error('Failed to display users:', error);
  }
}


// ============================================
// Example 13: Async iterators
// ============================================
async function* fetchPages(url) {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(`${url}?page=${page}`);
    const data = await response.json();

    yield data.items; // Yield page data

    hasMore = data.hasNext;
    page++;
  }
}

// Usage
async function processAllPages() {
  for await (const items of fetchPages('/api/items')) {
    console.log('Processing page:', items.length);
    // Process items...
  }
}
```

### Common Mistakes

- ❌ **Mistake:** Forgetting to await async function calls
  ```javascript
  async function getData() {
    const data = fetchData(); // Missing await!
    console.log(data); // Promise, not data
  }
  ```

- ❌ **Mistake:** Making everything sequential when it doesn't need to be
  ```javascript
  // Slow: 6 seconds total
  const user = await fetchUser();
  const posts = await fetchPosts();
  const comments = await fetchComments();

  // Fast: 2 seconds total (all parallel)
  const [user, posts, comments] = await Promise.all([
    fetchUser(),
    fetchPosts(),
    fetchComments()
  ]);
  ```

- ❌ **Mistake:** Using async/await with array methods incorrectly
  ```javascript
  // Doesn't work as expected!
  const results = items.map(async item => {
    return await processItem(item);
  }); // results is array of promises!

  // Correct:
  const results = await Promise.all(
    items.map(async item => await processItem(item))
  );
  ```

- ✅ **Correct:** Understand when to parallelize and how to handle arrays
  ```javascript
  // Sequential when order matters
  for (const item of items) {
    await processItem(item);
  }

  // Parallel when order doesn't matter
  await Promise.all(items.map(item => processItem(item)));
  ```

<details>
<summary><strong>🔍 Deep Dive: Async/Await Transformation in V8</strong></summary>

**How Async/Await is Compiled:**

```javascript
// Your code:
async function fetchUser(id) {
  const response = await fetch(`/api/user/${id}`);
  const user = await response.json();
  return user;
}

// V8 transforms to (simplified):
function fetchUser(id) {
  return __async(function* () {
    const response = yield fetch(`/api/user/${id}`);
    const user = yield response.json();
    return user;
  });
}

// The __async helper creates a promise and manages the generator
function __async(generatorFn) {
  return new Promise((resolve, reject) => {
    const generator = generatorFn();

    function step(nextFn) {
      let next;
      try {
        next = nextFn();
      } catch (error) {
        reject(error);
        return;
      }

      if (next.done) {
        resolve(next.value);
        return;
      }

      // next.value is the promise from await
      Promise.resolve(next.value).then(
        (value) => step(() => generator.next(value)),
        (error) => step(() => generator.throw(error))
      );
    }

    step(() => generator.next());
  });
}
```

**State Machine Transformation:**

```javascript
// Original async function:
async function example() {
  const a = await promise1();
  const b = await promise2(a);
  const c = await promise3(b);
  return c;
}

// V8 state machine (conceptual):
function example_stateMachine() {
  let state = 0;
  let result;

  return new Promise((resolve, reject) => {
    function resume(value) {
      switch (state) {
        case 0:
          state = 1;
          promise1().then(resume, reject);
          break;

        case 1:
          const a = value;
          state = 2;
          promise2(a).then(resume, reject);
          break;

        case 2:
          const b = value;
          state = 3;
          promise3(b).then(resume, reject);
          break;

        case 3:
          const c = value;
          resolve(c);
          break;
      }
    }

    resume();
  });
}

// Each await creates a new state
// Control jumps between states as promises resolve
```

**Microtask Queue Scheduling:**

```javascript
// Async/await uses microtasks under the hood

console.log('1: Sync start');

async function asyncFn() {
  console.log('2: Async fn start');

  await Promise.resolve();
  // Everything after await is scheduled as microtask

  console.log('4: After await');
}

asyncFn();
console.log('3: Sync end');

// Execution order:
// 1. Sync code: "1: Sync start"
// 2. asyncFn called: "2: Async fn start"
// 3. await hits, rest scheduled as microtask
// 4. Sync continues: "3: Sync end"
// 5. Call stack empty, microtask runs: "4: After await"

// Output:
// 1: Sync start
// 2: Async fn start
// 3: Sync end
// 4: After await
```

**Performance: Async/Await vs Promises:**

```javascript
// Benchmark: 1 million async operations

// Test 1: Promise chaining
console.time('promises');
for (let i = 0; i < 1000000; i++) {
  Promise.resolve(i)
    .then(v => v * 2)
    .then(v => v + 1);
}
console.timeEnd('promises'); // ~45ms

// Test 2: Async/await
console.time('async-await');
for (let i = 0; i < 1000000; i++) {
  (async () => {
    let v = await Promise.resolve(i);
    v = v * 2;
    v = v + 1;
    return v;
  })();
}
console.timeEnd('async-await'); // ~48ms

// Async/await is ~6% slower due to:
// 1. Generator function overhead
// 2. State machine transformation
// 3. Additional promise wrapping

// However: Difference is negligible in real apps
// Readability benefit far outweighs tiny performance cost
```

**Try-Catch vs .catch() Differences:**

```javascript
// Async/await with try-catch
async function withTryCatch() {
  try {
    const result = await asyncOperation();
    return result;
  } catch (error) {
    // Catches both sync and async errors
    console.error('Error:', error);
    throw error;
  }
}

// Promise with .catch()
function withCatch() {
  return asyncOperation()
    .then(result => result)
    .catch(error => {
      // Only catches promise rejections
      console.error('Error:', error);
      throw error;
    });
}

// Key difference:
async function demonstrates() {
  try {
    const x = 1;
    x.toUpperCase(); // Sync error!
    const result = await fetch('/api'); // Async error
    return result;
  } catch (error) {
    // Catches BOTH sync and async errors
    console.error(error);
  }
}

// With promises, sync errors escape:
function demonstratesPromise() {
  return Promise.resolve()
    .then(() => {
      const x = 1;
      x.toUpperCase(); // Sync error - NOT caught by .catch()!
      return fetch('/api');
    })
    .catch(error => {
      // Only catches promise rejections
      console.error(error);
    });
}
```

**V8 Optimization - TurboFan:**

```javascript
// V8 can optimize async functions with TurboFan JIT

async function hotPath(id) {
  const data = await fetchData(id);
  return data.value * 2;
}

// After ~10,000 calls, TurboFan optimizes:
// 1. Inlines fetchData if possible
// 2. Removes unnecessary promise wrapping
// 3. Optimizes state machine transitions
// 4. Result: 30-40% faster execution

// Benchmark:
console.time('cold');
for (let i = 0; i < 10000; i++) {
  await hotPath(i);
}
console.timeEnd('cold'); // ~150ms (interpreter)

console.time('hot');
for (let i = 0; i < 10000; i++) {
  await hotPath(i);
}
console.timeEnd('hot'); // ~95ms (optimized!)
```

**Memory Implications:**

```javascript
// Async/await creates closures that can hold references

// ❌ POTENTIAL LEAK: Large object captured
async function processData() {
  const largeData = await loadLargeDataset(); // 100MB

  // largeData is captured in closure
  await delay(1000);

  return largeData.summary; // Only need summary (1KB)
}

// After return, largeData is freed
// But during delay, 100MB is held in memory

// ✅ BETTER: Release early
async function processDataOptimized() {
  const largeData = await loadLargeDataset();

  const summary = largeData.summary; // Extract what we need
  // largeData can be GC'd now

  await delay(1000);

  return summary;
}

// Memory usage:
// processData: 100MB for 1 second
// processDataOptimized: 1KB for 1 second
```

**Await Unwrapping:**

```javascript
// Await automatically unwraps promises

const promise1 = Promise.resolve(42);
const value1 = await promise1;
console.log(value1); // 42 (unwrapped)

// Nested promises also unwrapped
const promise2 = Promise.resolve(Promise.resolve(42));
const value2 = await promise2;
console.log(value2); // 42 (fully unwrapped)

// Even thenables are awaited
const thenable = {
  then(resolve) {
    setTimeout(() => resolve('value'), 1000);
  }
};
const value3 = await thenable;
console.log(value3); // 'value' (after 1s)

// Internally, V8 calls Promise.resolve() on awaited value
// Then waits for resolution
```

**Stack Trace Preservation:**

```javascript
// V8 preserves async stack traces

async function level1() {
  await level2();
}

async function level2() {
  await level3();
}

async function level3() {
  throw new Error('Failed!');
}

try {
  await level1();
} catch (error) {
  console.error(error.stack);
  // Error: Failed!
  //     at level3 (async-03-async-await.md:123)
  //     at async level2 (async-03-async-await.md:117)
  //     at async level1 (async-03-async-await.md:113)
  //
  // V8 maintains async call stack across await boundaries
}

// Without async stack traces (old V8):
// Error: Failed!
//     at level3 (async-03-async-await.md:123)
// (no context about level2 or level1)
```

</details>

<details>
<summary><strong>🐛 Real-World Scenario: Sequential vs Parallel Performance Issue</strong></summary>

**Scenario:** Your dashboard page takes 15 seconds to load, causing 40% of users to abandon before seeing content. The issue is hidden in async/await code that looks correct but has terrible performance.

**The Problem:**

```javascript
// ❌ SLOW: Sequential loading (15 seconds total)
class DashboardService {
  async loadDashboard(userId) {
    console.time('dashboard-load');

    // Load user profile (3s)
    const user = await this.fetchUserProfile(userId);
    console.log('User loaded');

    // Load user posts (4s)
    const posts = await this.fetchUserPosts(userId);
    console.log('Posts loaded');

    // Load user followers (3s)
    const followers = await this.fetchUserFollowers(userId);
    console.log('Followers loaded');

    // Load user notifications (2s)
    const notifications = await this.fetchUserNotifications(userId);
    console.log('Notifications loaded');

    // Load recommended content (3s)
    const recommendations = await this.fetchRecommendations(userId);
    console.log('Recommendations loaded');

    console.timeEnd('dashboard-load'); // ~15 seconds!

    return {
      user,
      posts,
      followers,
      notifications,
      recommendations
    };
  }
}

// Production metrics:
// - Average load time: 15.2 seconds
// - User abandonment rate: 40% (before dashboard loads)
// - Bounce rate: 55%
// - User complaint: "App is so slow!"
```

**Debugging: Measuring Each Step:**

```javascript
// Step 1: Add detailed timing logs
class DashboardService {
  async loadDashboard(userId) {
    console.time('total');

    console.time('user');
    const user = await this.fetchUserProfile(userId);
    console.timeEnd('user'); // 3.1s

    console.time('posts');
    const posts = await this.fetchUserPosts(userId);
    console.timeEnd('posts'); // 4.2s

    console.time('followers');
    const followers = await this.fetchUserFollowers(userId);
    console.timeEnd('followers'); // 3.0s

    console.time('notifications');
    const notifications = await this.fetchUserNotifications(userId);
    console.timeEnd('notifications'); // 2.1s

    console.time('recommendations');
    const recommendations = await this.fetchRecommendations(userId);
    console.timeEnd('recommendations'); // 2.8s

    console.timeEnd('total'); // 15.2s total

    // All requests are independent but loaded sequentially!
    // This is the problem
  }
}
```

**Solution 1: Parallelize Independent Requests:**

```javascript
// ✅ FIX: Load everything in parallel (4.2 seconds)
class DashboardService {
  async loadDashboard(userId) {
    console.time('dashboard-load');

    // Start all requests simultaneously
    const [user, posts, followers, notifications, recommendations] =
      await Promise.all([
        this.fetchUserProfile(userId),      // 3s
        this.fetchUserPosts(userId),        // 4s (slowest)
        this.fetchUserFollowers(userId),    // 3s
        this.fetchUserNotifications(userId), // 2s
        this.fetchRecommendations(userId)   // 3s
      ]);

    console.timeEnd('dashboard-load'); // ~4.2 seconds! (70% faster)

    return {
      user,
      posts,
      followers,
      notifications,
      recommendations
    };
  }
}

// After fix:
// - Average load time: 4.2 seconds (from 15.2s)
// - User abandonment: 8% (from 40%)
// - Bounce rate: 15% (from 55%)
// - User satisfaction: +85%
```

**Solution 2: Progressive Loading with Priority:**

```javascript
// ✅ BETTER: Load critical data first, optional data later
class DashboardService {
  async loadDashboard(userId) {
    // CRITICAL: Load user + posts first (for above-the-fold content)
    const [user, posts] = await Promise.all([
      this.fetchUserProfile(userId),   // 3s
      this.fetchUserPosts(userId)      // 4s
    ]);

    // Show initial UI immediately (4s perceived load time)
    return {
      user,
      posts,
      // Placeholders for optional data
      followers: null,
      notifications: null,
      recommendations: null,

      // Load remaining data in background
      loadRemainingData: this.loadRemainingData(userId)
    };
  }

  async loadRemainingData(userId) {
    // OPTIONAL: Load rest in parallel (doesn't block initial render)
    const [followers, notifications, recommendations] =
      await Promise.allSettled([
        this.fetchUserFollowers(userId),    // 3s
        this.fetchUserNotifications(userId), // 2s
        this.fetchRecommendations(userId)   // 3s
      ]);

    return {
      followers: followers.status === 'fulfilled' ? followers.value : [],
      notifications: notifications.status === 'fulfilled' ? notifications.value : [],
      recommendations: recommendations.status === 'fulfilled' ? recommendations.value : []
    };
  }
}

// Usage:
async function renderDashboard() {
  const dashboard = await dashboardService.loadDashboard(userId);

  // Render critical content immediately (4s)
  renderUserProfile(dashboard.user);
  renderPosts(dashboard.posts);
  showLoadingSkeletons(['followers', 'notifications', 'recommendations']);

  // Load optional data in background
  const remaining = await dashboard.loadRemainingData;

  // Update UI with optional data as it arrives (7s total)
  if (remaining.followers.length) renderFollowers(remaining.followers);
  if (remaining.notifications.length) renderNotifications(remaining.notifications);
  if (remaining.recommendations.length) renderRecommendations(remaining.recommendations);
}

// Result:
// - Perceived load time: 4 seconds (critical content)
// - Full page load: 7 seconds (all content)
// - User abandonment: 5% (most users see content within 4s)
```

**Solution 3: Staged Loading with Timeout Fallbacks:**

```javascript
// ✅ BEST: Multi-stage loading with fallbacks
class DashboardService {
  async loadDashboard(userId) {
    console.time('stage1');

    // STAGE 1: Critical data with aggressive timeout (5s max)
    const stage1 = await Promise.all([
      this.withTimeout(this.fetchUserProfile(userId), 5000),
      this.withTimeout(this.fetchUserPosts(userId), 5000)
    ]).catch(error => {
      // Critical data failed - show error page
      throw new Error('Failed to load dashboard');
    });

    const [user, posts] = stage1;
    console.timeEnd('stage1'); // ~4s

    // STAGE 2: Important but not critical (3s timeout)
    console.time('stage2');
    const stage2 = await Promise.allSettled([
      this.withTimeout(this.fetchUserFollowers(userId), 3000),
      this.withTimeout(this.fetchUserNotifications(userId), 3000)
    ]);

    const followers = stage2[0].status === 'fulfilled'
      ? stage2[0].value
      : [];
    const notifications = stage2[1].status === 'fulfilled'
      ? stage2[1].value
      : [];
    console.timeEnd('stage2'); // ~3s

    // STAGE 3: Nice-to-have data (load in background, no wait)
    const stage3Promise = this.fetchRecommendations(userId)
      .catch(() => []);

    return {
      user,
      posts,
      followers,
      notifications,
      // Recommendations loaded lazily
      getRecommendations: () => stage3Promise
    };
  }

  withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), ms)
      )
    ]);
  }
}

// Usage:
async function renderDashboard() {
  const dashboard = await dashboardService.loadDashboard(userId);

  // Stage 1: Critical content (4s)
  renderUserProfile(dashboard.user);
  renderPosts(dashboard.posts);

  // Stage 2: Important content (loaded, render immediately)
  if (dashboard.followers.length) {
    renderFollowers(dashboard.followers);
  } else {
    showEmptyState('followers');
  }

  if (dashboard.notifications.length) {
    renderNotifications(dashboard.notifications);
  }

  // Stage 3: Load recommendations asynchronously
  dashboard.getRecommendations().then(recommendations => {
    if (recommendations.length) {
      renderRecommendations(recommendations);
    }
  });
}
```

**Performance Comparison:**

| Approach | Critical Load | Full Load | Abandonment | Complexity |
|----------|--------------|-----------|-------------|------------|
| **Sequential (original)** | 15s | 15s | 40% | Low |
| **Parallel (Solution 1)** | 4.2s | 4.2s | 8% | Low |
| **Progressive (Solution 2)** | 4s | 7s | 5% | Medium |
| **Staged (Solution 3)** | 4s | 7s | 3% | High |

**Real Production Metrics After Fix:**

```javascript
// Before (Sequential):
// - P50 load time: 15.2s
// - P95 load time: 22.1s
// - Abandonment rate: 40%
// - User complaints: 150/week
// - Revenue impact: -$200k/month

// After (Parallel + Progressive):
// - P50 load time: 4.1s
// - P95 load time: 6.8s
// - Abandonment rate: 5%
// - User complaints: 12/week
// - Revenue impact: +$180k/month (from reduced abandonment)

// Key learnings:
// 1. Always parallelize independent async operations
// 2. Load critical content first, optional later
// 3. Add timeout fallbacks for resilience
// 4. Measure and monitor load times in production
```

**Identifying Sequential vs Parallel Opportunities:**

```javascript
// Quick checklist for parallelization:

// ✅ Can parallelize (no dependencies):
async function goodForParallel() {
  const [a, b, c] = await Promise.all([
    fetchUserProfile(userId),    // Independent
    fetchUserSettings(userId),   // Independent
    fetchUserPreferences(userId) // Independent
  ]);
}

// ❌ Cannot parallelize (has dependencies):
async function mustBeSequential() {
  const user = await fetchUser(userId);
  // ↓ Depends on user.teamId
  const team = await fetchTeam(user.teamId);
  // ↓ Depends on team.projectIds
  const projects = await Promise.all(
    team.projectIds.map(id => fetchProject(id))
  );
}

// ✅ Hybrid (parallelize where possible):
async function optimized() {
  // Step 1: Get user (required for next steps)
  const user = await fetchUser(userId);

  // Step 2: Parallelize independent operations
  const [team, settings, preferences] = await Promise.all([
    fetchTeam(user.teamId),       // Depends on user
    fetchUserSettings(userId),    // Independent of team
    fetchUserPreferences(userId)  // Independent of team
  ]);

  // Step 3: Parallelize final operations
  const [projects, members] = await Promise.all([
    Promise.all(team.projectIds.map(id => fetchProject(id))),
    fetchTeamMembers(team.id)
  ]);

  return { user, team, settings, preferences, projects, members };
}
```

</details>

<details>
<summary><strong>⚖️ Trade-offs: Async/Await Patterns</strong></summary>

**1. Sequential vs Parallel Execution:**

```javascript
// Sequential: Predictable order, slower
async function sequential() {
  const a = await fetchA(); // 1s
  const b = await fetchB(); // 1s
  const c = await fetchC(); // 1s
  return [a, b, c];
  // Total: 3s
}

// Parallel: Faster, less predictable order
async function parallel() {
  const [a, b, c] = await Promise.all([
    fetchA(), // 1s
    fetchB(), // 1s
    fetchC()  // 1s
  ]);
  return [a, b, c];
  // Total: 1s
}

// When to use each:
// Sequential: Dependencies exist, order matters, rate limiting needed
// Parallel: Independent operations, speed critical, no rate limits
```

| Aspect | Sequential | Parallel |
|--------|-----------|----------|
| **Speed** | Slow (sum of all) | Fast (max of all) |
| **Memory** | Low (one at a time) | High (all at once) |
| **Server load** | Low (1 request) | High (N requests) |
| **Error handling** | Can stop early | All-or-nothing |
| **Debugging** | Easier | Harder |

**2. Try-Catch Granularity:**

```javascript
// Pattern 1: Single try-catch (coarse error handling)
async function singleTryCatch() {
  try {
    const user = await fetchUser();
    const posts = await fetchPosts();
    const comments = await fetchComments();
    return { user, posts, comments };
  } catch (error) {
    console.error('Something failed:', error);
    return null; // Can't tell what failed
  }
}

// Pattern 2: Multiple try-catch (granular error handling)
async function multipleTryCatch() {
  let user, posts, comments;

  try {
    user = await fetchUser();
  } catch (error) {
    console.error('User fetch failed:', error);
    return null; // Stop if user fails (critical)
  }

  try {
    posts = await fetchPosts();
  } catch (error) {
    console.error('Posts fetch failed:', error);
    posts = []; // Continue with empty posts (optional)
  }

  try {
    comments = await fetchComments();
  } catch (error) {
    console.error('Comments fetch failed:', error);
    comments = []; // Continue with empty comments (optional)
  }

  return { user, posts, comments };
}

// Pattern 3: Promise.allSettled (partial success)
async function allSettled() {
  const [userResult, postsResult, commentsResult] = await Promise.allSettled([
    fetchUser(),
    fetchPosts(),
    fetchComments()
  ]);

  if (userResult.status === 'rejected') {
    return null; // User is critical
  }

  return {
    user: userResult.value,
    posts: postsResult.status === 'fulfilled' ? postsResult.value : [],
    comments: commentsResult.status === 'fulfilled' ? commentsResult.value : []
  };
}
```

| Pattern | Code Clarity | Error Detail | Flexibility | Best For |
|---------|-------------|--------------|-------------|----------|
| **Single try-catch** | ✅ Clean | ❌ Low | ❌ Low | Simple cases |
| **Multiple try-catch** | ⚠️ Verbose | ✅ High | ✅ High | Critical + optional mix |
| **Promise.allSettled** | ✅ Clean | ✅ High | ✅ High | All optional/independent |

**3. Top-Level Await vs IIFE:**

```javascript
// Traditional: IIFE wrapper
(async () => {
  const data = await fetchData();
  console.log(data);
})();

// Modern: Top-level await (ES2022)
const data = await fetchData();
console.log(data);

// Trade-offs:
// IIFE:
// ✅ Works in all environments
// ✅ Explicit async scope
// ❌ Extra nesting
// ❌ Harder to export values

// Top-level await:
// ✅ Cleaner code
// ✅ Easy to export await results
// ❌ Requires ES modules
// ❌ Blocks module loading (can slow app startup)
// ❌ Not supported in all environments

// Example issue with top-level await:
// main.js
import { userData } from './user.js';
console.log('Main started'); // Waits for user.js to finish loading

// user.js
export const userData = await fetchUser(); // Blocks main.js!
// If this takes 5s, main.js waits 5s
```

**4. Async/Await vs Raw Promises:**

```javascript
// With async/await (imperative style)
async function imperative() {
  const user = await fetchUser();
  if (user.isAdmin) {
    const data = await fetchAdminData();
    return processAdminData(data);
  }
  const data = await fetchUserData();
  return processUserData(data);
}

// With raw promises (functional style)
function functional() {
  return fetchUser()
    .then(user => {
      if (user.isAdmin) {
        return fetchAdminData().then(processAdminData);
      }
      return fetchUserData().then(processUserData);
    });
}
```

| Aspect | Async/Await | Raw Promises |
|--------|-------------|--------------|
| **Readability** | ✅ Excellent | ⚠️ Good |
| **Conditionals** | ✅ Easy | ❌ Awkward |
| **Loops** | ✅ Easy | ❌ Hard |
| **Error handling** | ✅ try-catch | ⚠️ .catch() |
| **Debugging** | ✅ Better traces | ⚠️ Harder |
| **Performance** | ⚠️ Slightly slower | ✅ Slightly faster |
| **Composability** | ⚠️ Less functional | ✅ More functional |

**5. Error Propagation Strategies:**

```javascript
// Strategy 1: Let errors bubble (fail-fast)
async function bubbleErrors() {
  const data = await fetchData(); // Throws on error
  return processData(data);
}
// ✅ Simple
// ✅ Caller handles errors
// ❌ No context about where error occurred

// Strategy 2: Wrap with context (informative)
async function wrapErrors() {
  try {
    const data = await fetchData();
    return processData(data);
  } catch (error) {
    throw new Error(`Failed to load dashboard: ${error.message}`);
  }
}
// ✅ Adds context
// ⚠️ Original stack trace preserved
// ❌ Slightly more verbose

// Strategy 3: Transform errors (custom types)
class DataLoadError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'DataLoadError';
    this.originalError = originalError;
  }
}

async function transformErrors() {
  try {
    const data = await fetchData();
    return processData(data);
  } catch (error) {
    throw new DataLoadError('Dashboard load failed', error);
  }
}
// ✅ Type-safe error handling
// ✅ Original error available
// ✅ Can add metadata
// ❌ Most complex

// Strategy 4: Return error objects (no throw)
async function returnErrors() {
  try {
    const data = await fetchData();
    return { success: true, data: processData(data) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
// ✅ Explicit error handling
// ✅ No try-catch needed by caller
// ⚠️ Can forget to check success
// ❌ Less idiomatic JavaScript
```

**6. Concurrency Control:**

```javascript
// No control: Overwhelms server
async function noConcurrency(items) {
  return await Promise.all(items.map(item => processItem(item)));
}
// 10,000 items = 10,000 concurrent requests!

// Batched: Process N at a time
async function batched(items, batchSize = 10) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => processItem(item))
    );
    results.push(...batchResults);
  }
  return results;
}
// 10,000 items = 10 concurrent at a time

// Queue with limit: More control
class AsyncQueue {
  constructor(concurrency = 5) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  async add(fn) {
    while (this.running >= this.concurrency) {
      await new Promise(resolve => this.queue.push(resolve));
    }

    this.running++;
    try {
      return await fn();
    } finally {
      this.running--;
      const resolve = this.queue.shift();
      if (resolve) resolve();
    }
  }
}

async function queueBased(items) {
  const queue = new AsyncQueue(10);
  return await Promise.all(
    items.map(item => queue.add(() => processItem(item)))
  );
}
```

| Approach | Speed | Memory | Server Load | Complexity |
|----------|-------|--------|-------------|------------|
| **No control** | Fastest | Highest | Highest | Lowest |
| **Batched** | Medium | Medium | Medium | Low |
| **Queue** | Medium | Low | Controlled | High |

</details>

<details>
<summary><strong>💬 Explain to Junior: Async/Await Simplified</strong></summary>

**Simple Analogy: Restaurant Order**

Regular code = Standing at counter waiting for food:
```javascript
function syncOrder() {
  const food = waitForFood(); // Block for 10 minutes
  eat(food);
  // Can't do anything while waiting!
}
```

Async/await = Get a buzzer and sit down:
```javascript
async function asyncOrder() {
  const food = await orderFood(); // Get buzzer, sit down
  eat(food);
  // Can browse phone while waiting!
}
```

**The Magic Word: "await"**

`await` means "wait for this to finish, but let others continue":

```javascript
async function makeSandwich() {
  console.log('Step 1: Get bread');

  // Wait for toaster (2 seconds)
  await toast();
  console.log('Step 2: Toast ready');

  // Wait for scrambled eggs (3 seconds)
  await cookEggs();
  console.log('Step 3: Eggs ready');

  console.log('Step 4: Assemble sandwich');
}

// Output (takes 5 seconds total):
// Step 1: Get bread
// (wait 2s)
// Step 2: Toast ready
// (wait 3s)
// Step 3: Eggs ready
// Step 4: Assemble sandwich
```

**Common Beginner Mistakes:**

```javascript
// ❌ MISTAKE 1: Forgetting await
async function forgotAwait() {
  const data = fetchData(); // Returns Promise, not data!
  console.log(data); // Promise {<pending>}
  console.log(data.value); // undefined!
}

// ✅ CORRECT: Use await
async function withAwait() {
  const data = await fetchData(); // Waits and unwraps
  console.log(data); // { value: 42 }
  console.log(data.value); // 42
}


// ❌ MISTAKE 2: Using await in non-async function
function regularFunction() {
  const data = await fetchData(); // SyntaxError!
}

// ✅ CORRECT: Make function async
async function asyncFunction() {
  const data = await fetchData(); // Works!
}


// ❌ MISTAKE 3: Sequential when should be parallel
async function slow() {
  const user = await fetchUser();      // 2s
  const posts = await fetchPosts();    // 2s
  const comments = await fetchComments(); // 2s
  // Total: 6 seconds!
}

// ✅ CORRECT: Parallel loading
async function fast() {
  const [user, posts, comments] = await Promise.all([
    fetchUser(),      // All start together
    fetchPosts(),
    fetchComments()
  ]);
  // Total: 2 seconds! (fastest one)
}
```

**Explaining to PM:**

"Async/await is like having multiple employees vs one employee:

**Without async/await (synchronous):**
- One employee does everything sequentially
- Make coffee → Wait → Serve customer → Wait → Clean table
- Slow, customers wait in line

**With async/await (asynchronous):**
- Start coffee → Help customer → Clean table → Coffee ready
- Employee doesn't stand idle waiting
- Faster service, happier customers

**In our app:**
- Load user data → Load posts → Load notifications (sequential = 9s)
- vs
- Load all at once (parallel = 3s)

**Why it matters:**
- Users leave if page takes >5 seconds
- Async/await = faster page load = more users stay = more revenue"

**Visual Example:**

```javascript
// Scenario: Making breakfast

// ❌ SLOW: Do one thing at a time (Sequential)
async function slowBreakfast() {
  await brewCoffee();      // 5 min, stand and watch
  await toastBread();      // 3 min, stand and watch
  await cookEggs();        // 4 min, stand and watch
  // Total: 12 minutes
}

// ✅ FAST: Do multiple things (Parallel)
async function fastBreakfast() {
  // Start everything at once
  const [coffee, toast, eggs] = await Promise.all([
    brewCoffee(),   // 5 min
    toastBread(),   // 3 min
    cookEggs()      // 4 min
  ]);
  // Total: 5 minutes (time of slowest task)
}

// ✅ FASTEST: Start slow tasks first, do quick ones while waiting
async function smartBreakfast() {
  // Start coffee (slowest, 5 min)
  const coffeePromise = brewCoffee();

  // While coffee brews, toast bread (3 min)
  const toastPromise = toastBread();

  // While toast cooks, cook eggs (4 min)
  const eggsPromise = cookEggs();

  // Wait for everything to finish
  const [coffee, toast, eggs] = await Promise.all([
    coffeePromise,
    toastPromise,
    eggsPromise
  ]);
  // Total: 5 minutes + you were productive!
}
```

**Key Rules for Juniors:**

1. **Always use `async` keyword** when using `await`
   ```javascript
   async function myFunction() {
     await something();
   }
   ```

2. **Always `await` async functions** unless you want a promise
   ```javascript
   const data = await fetchData(); // ✅ Get the data
   const promise = fetchData();    // ❌ Get a promise
   ```

3. **Parallelize independent operations**
   ```javascript
   // ❌ Slow
   const a = await getA();
   const b = await getB();

   // ✅ Fast
   const [a, b] = await Promise.all([getA(), getB()]);
   ```

4. **Use try-catch for errors**
   ```javascript
   try {
     const data = await fetchData();
   } catch (error) {
     console.error('Failed:', error);
   }
   ```

5. **Return values automatically become promises**
   ```javascript
   async function getNumber() {
     return 42; // Returns Promise.resolve(42)
   }

   getNumber().then(n => console.log(n)); // 42
   ```

**Practice Exercise:**

```javascript
// Task: Load user profile and their last 5 posts
// Both operations take 2 seconds each

// Try writing this two ways:
// 1. Sequential (slow)
// 2. Parallel (fast)

// Solution 1: Sequential (4 seconds total)
async function loadProfileSequential(userId) {
  const profile = await fetchProfile(userId); // 2s
  const posts = await fetchPosts(userId, 5);  // 2s
  return { profile, posts };
  // Total: 4 seconds
}

// Solution 2: Parallel (2 seconds total)
async function loadProfileParallel(userId) {
  const [profile, posts] = await Promise.all([
    fetchProfile(userId),  // Start both
    fetchPosts(userId, 5)  // at same time
  ]);
  return { profile, posts };
  // Total: 2 seconds (2x faster!)
}
```

**When to Use What:**

```
Use Sequential (await one by one):
- Second operation needs result from first
- Example: Get user → Get user's team (needs user.teamId)

Use Parallel (Promise.all):
- Operations are independent
- Example: Get user + Get posts (both only need userId)

Use Progressive Loading:
- Show something ASAP, load rest later
- Example: Show profile immediately, load posts in background
```

</details>

### Follow-up Questions

- "How would you implement a queue system for async operations with concurrency control?"
- "What happens if you don't await an async function - where does the error go?"
- "Can you use async/await with setTimeout? How would you implement sleep()?"
- "How do async generators work and when would you use them?"
- "What are the performance implications of using async/await vs raw promises?"

### Resources

- [MDN: async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
- [MDN: await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
- [JavaScript.info: Async/await](https://javascript.info/async-await)
- [Async/Await Best Practices](https://maximorlov.com/linting-rules-for-asynchronous-code-in-javascript/)

---

## Question 2: Explain async iteration - for-await-of and async generators

**Difficulty:** 🔴 Hard
**Frequency:** ⭐⭐⭐
**Time:** 10-12 minutes
**Companies:** Google, Meta, Amazon, Netflix

### Question
How do async iterators work in JavaScript? Explain for-await-of loops and async generators with practical examples.

### Answer

**Async Iteration** allows you to iterate over data that arrives asynchronously (streams, paginated APIs, etc.) using `for-await-of` loops and async generator functions.

**Key Concepts:**

1. **for-await-of Loop** - Iterates over async iterables (promises, async generators)
2. **Async Generators** - Functions that use `async function*` and `yield` to produce async values
3. **AsyncIterator Protocol** - Objects with `next()` method that returns promises
4. **Use Cases** - Streaming data, paginated APIs, file processing, event streams
5. **Error Handling** - try-catch works naturally with for-await-of

### Code Example

```javascript
// ============================================
// 1. BASIC FOR-AWAIT-OF LOOP
// ============================================

// Array of promises
const promises = [
  Promise.resolve(1),
  Promise.resolve(2),
  Promise.resolve(3)
];

async function iteratePromises() {
  for await (const value of promises) {
    console.log(value);
  }
}

iteratePromises();
// Output:
// 1
// 2
// 3


// ============================================
// 2. ASYNC GENERATOR FUNCTION
// ============================================

async function* numberGenerator() {
  yield 1;
  await new Promise(resolve => setTimeout(resolve, 1000));
  yield 2;
  await new Promise(resolve => setTimeout(resolve, 1000));
  yield 3;
}

async function useGenerator() {
  for await (const num of numberGenerator()) {
    console.log(num);
  }
}

useGenerator();
// Output (1 second between each):
// 1
// 2
// 3


// ============================================
// 3. PAGINATED API FETCHING
// ============================================

async function* fetchPaginatedUsers(baseUrl) {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(`${baseUrl}?page=${page}&limit=10`);
    const data = await response.json();

    // Yield each user
    for (const user of data.users) {
      yield user;
    }

    hasMore = data.hasMore;
    page++;
  }
}

// Usage
async function processUsers() {
  for await (const user of fetchPaginatedUsers('/api/users')) {
    console.log(user.name);
    // Process user without loading all pages into memory
  }
}


// ============================================
// 4. ASYNC ITERATOR PROTOCOL (Manual Implementation)
// ============================================

const asyncIterable = {
  [Symbol.asyncIterator]() {
    let i = 0;

    return {
      async next() {
        if (i < 3) {
          await new Promise(resolve => setTimeout(resolve, 500));
          return { value: i++, done: false };
        }
        return { done: true };
      }
    };
  }
};

async function iterate() {
  for await (const value of asyncIterable) {
    console.log(value);
  }
}

iterate();
// Output (500ms between each):
// 0
// 1
// 2


// ============================================
// 5. STREAMING FILE PROCESSING
// ============================================

async function* readLargeFile(filePath) {
  const fileHandle = await openFile(filePath);
  const chunkSize = 1024 * 64; // 64KB chunks

  try {
    let chunk;
    while ((chunk = await fileHandle.read(chunkSize))) {
      if (chunk.length === 0) break;
      yield chunk;
    }
  } finally {
    await fileHandle.close();
  }
}

// Usage
async function processFile() {
  let totalBytes = 0;

  for await (const chunk of readLargeFile('large-file.txt')) {
    totalBytes += chunk.length;
    processChunk(chunk);
  }

  console.log(`Processed ${totalBytes} bytes`);
}


// ============================================
// 6. ASYNC GENERATOR WITH ERROR HANDLING
// ============================================

async function* fetchWithRetry(urls) {
  for (const url of urls) {
    let retries = 3;

    while (retries > 0) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        yield { url, data, success: true };
        break;
      } catch (error) {
        retries--;

        if (retries === 0) {
          yield { url, error: error.message, success: false };
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  }
}

// Usage
async function fetchAll() {
  const urls = ['/api/data1', '/api/data2', '/api/data3'];

  for await (const result of fetchWithRetry(urls)) {
    if (result.success) {
      console.log('Success:', result.url, result.data);
    } else {
      console.error('Failed:', result.url, result.error);
    }
  }
}


// ============================================
// 7. COMBINING ASYNC GENERATORS
// ============================================

async function* mergeAsyncGenerators(...generators) {
  const iterators = generators.map(g => g[Symbol.asyncIterator]());

  while (iterators.length > 0) {
    const results = await Promise.all(
      iterators.map(it => it.next())
    );

    for (let i = results.length - 1; i >= 0; i--) {
      if (results[i].done) {
        iterators.splice(i, 1);
      } else {
        yield results[i].value;
      }
    }
  }
}

// Usage
async function* gen1() {
  yield 1; await delay(100);
  yield 2; await delay(100);
}

async function* gen2() {
  yield 'a'; await delay(100);
  yield 'b'; await delay(100);
}

async function combine() {
  for await (const value of mergeAsyncGenerators(gen1(), gen2())) {
    console.log(value);
  }
}


// ============================================
// 8. ASYNC QUEUE IMPLEMENTATION
// ============================================

class AsyncQueue {
  constructor() {
    this.queue = [];
    this.resolvers = [];
  }

  enqueue(item) {
    if (this.resolvers.length > 0) {
      const resolve = this.resolvers.shift();
      resolve({ value: item, done: false });
    } else {
      this.queue.push(item);
    }
  }

  end() {
    for (const resolve of this.resolvers) {
      resolve({ done: true });
    }
    this.resolvers = [];
  }

  [Symbol.asyncIterator]() {
    return {
      next: () => {
        if (this.queue.length > 0) {
          return Promise.resolve({
            value: this.queue.shift(),
            done: false
          });
        }

        return new Promise(resolve => {
          this.resolvers.push(resolve);
        });
      }
    };
  }
}

// Usage
const queue = new AsyncQueue();

// Producer
setTimeout(() => queue.enqueue('First'), 1000);
setTimeout(() => queue.enqueue('Second'), 2000);
setTimeout(() => queue.enqueue('Third'), 3000);
setTimeout(() => queue.end(), 4000);

// Consumer
async function consume() {
  for await (const item of queue) {
    console.log('Received:', item);
  }
  console.log('Queue ended');
}

consume();


// ============================================
// 9. REAL-TIME EVENT STREAM
// ============================================

async function* watchServerEvents(url) {
  const eventSource = new EventSource(url);

  try {
    while (true) {
      const event = await new Promise((resolve, reject) => {
        eventSource.onmessage = resolve;
        eventSource.onerror = reject;
      });

      yield JSON.parse(event.data);
    }
  } finally {
    eventSource.close();
  }
}

// Usage
async function processEvents() {
  try {
    for await (const event of watchServerEvents('/api/events')) {
      console.log('Event received:', event);

      if (event.type === 'shutdown') {
        break;
      }
    }
  } catch (error) {
    console.error('Event stream error:', error);
  }
}


// ============================================
// 10. ASYNC GENERATOR WITH THROTTLING
// ============================================

async function* throttle(iterable, delay) {
  const startTime = Date.now();
  let count = 0;

  for await (const value of iterable) {
    count++;
    const elapsed = Date.now() - startTime;
    const expectedTime = count * delay;
    const waitTime = expectedTime - elapsed;

    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    yield value;
  }
}

// Usage
async function* fastSource() {
  for (let i = 0; i < 10; i++) {
    yield i;
  }
}

async function throttledProcessing() {
  // Process at most 1 item per 500ms
  for await (const value of throttle(fastSource(), 500)) {
    console.log(value);
  }
}


// ============================================
// 11. ASYNC GENERATOR RETURN VALUE
// ============================================

async function* generatorWithReturn() {
  yield 1;
  yield 2;
  return 'Final value'; // Return value
}

async function useReturnValue() {
  const gen = generatorWithReturn();

  console.log(await gen.next()); // { value: 1, done: false }
  console.log(await gen.next()); // { value: 2, done: false }
  console.log(await gen.next()); // { value: 'Final value', done: true }

  // for-await-of ignores return value
  for await (const value of generatorWithReturn()) {
    console.log(value); // Only logs 1, 2 (not 'Final value')
  }
}


// ============================================
// 12. TRANSFORMING ASYNC STREAMS
// ============================================

async function* map(iterable, fn) {
  for await (const value of iterable) {
    yield await fn(value);
  }
}

async function* filter(iterable, predicate) {
  for await (const value of iterable) {
    if (await predicate(value)) {
      yield value;
    }
  }
}

async function* take(iterable, count) {
  let i = 0;
  for await (const value of iterable) {
    if (i++ >= count) break;
    yield value;
  }
}

// Usage
async function processStream() {
  const numbers = async function*() {
    for (let i = 1; i <= 100; i++) {
      yield i;
    }
  };

  const stream = take(
    filter(
      map(numbers(), async n => n * 2),
      async n => n % 3 === 0
    ),
    5
  );

  for await (const value of stream) {
    console.log(value); // First 5 multiples of 6
  }
}


// ============================================
// 13. ERROR HANDLING IN ASYNC ITERATION
// ============================================

async function* faultyGenerator() {
  yield 1;
  yield 2;
  throw new Error('Generator error!');
  yield 3; // Never reached
}

async function handleErrors() {
  try {
    for await (const value of faultyGenerator()) {
      console.log(value);
    }
  } catch (error) {
    console.error('Caught error:', error.message);
  }
  console.log('Continued after error');
}

handleErrors();
// Output:
// 1
// 2
// Caught error: Generator error!
// Continued after error
```

### Common Mistakes

- ❌ **Mistake:** Using regular for-of with async iterators
  ```javascript
  // ❌ Won't work!
  for (const value of asyncIterable) {
    console.log(value); // Logs promises, not values!
  }

  // ✅ Correct
  for await (const value of asyncIterable) {
    console.log(value); // Logs actual values
  }
  ```

- ❌ **Mistake:** Forgetting async in generator function
  ```javascript
  // ❌ Wrong - not async
  function* generator() {
    yield await fetch('/api'); // Error!
  }

  // ✅ Correct
  async function* generator() {
    yield await fetch('/api').then(r => r.json());
  }
  ```

- ❌ **Mistake:** Not handling errors in async iteration
  ```javascript
  // ❌ Unhandled errors
  for await (const item of fetchData()) {
    process(item); // If fetchData throws, crashes
  }

  // ✅ Proper error handling
  try {
    for await (const item of fetchData()) {
      process(item);
    }
  } catch (error) {
    console.error('Error during iteration:', error);
  }
  ```

- ✅ **Best Practice:** Clean up resources
  ```javascript
  async function* resourceGenerator() {
    const resource = await openResource();

    try {
      yield* processResource(resource);
    } finally {
      await resource.close(); // Always cleanup
    }
  }
  ```

<details>
<summary><strong>🔍 Deep Dive: Async Iterator Protocol Internals</strong></summary>

**How Async Iterators Work in V8:**

```javascript
// Your code:
async function* numbers() {
  yield 1;
  yield 2;
  yield 3;
}

// V8 compiles to (simplified):
function numbers() {
  return {
    [Symbol.asyncIterator]() {
      let state = 0;
      const values = [1, 2, 3];

      return {
        async next() {
          if (state < values.length) {
            return {
              value: values[state++],
              done: false
            };
          }
          return { done: true };
        },

        async return(value) {
          state = values.length; // Skip to end
          return { value, done: true };
        },

        async throw(error) {
          state = values.length; // Skip to end
          throw error;
        }
      };
    }
  };
}
```

**AsyncIterator vs Iterator Differences:**

```javascript
// Sync iterator (Symbol.iterator)
const syncIterable = {
  [Symbol.iterator]() {
    let i = 0;
    return {
      next() {
        if (i < 3) {
          return { value: i++, done: false };
        }
        return { done: true };
      }
    };
  }
};

// Async iterator (Symbol.asyncIterator)
const asyncIterable = {
  [Symbol.asyncIterator]() {
    let i = 0;
    return {
      async next() { // Returns Promise!
        if (i < 3) {
          await delay(100); // Can await
          return { value: i++, done: false };
        }
        return { done: true };
      }
    };
  }
};

// Key difference:
// - Sync: next() returns { value, done }
// - Async: next() returns Promise<{ value, done }>
```

**for-await-of Desugaring:**

```javascript
// Your code:
for await (const value of asyncIterable) {
  console.log(value);
}

// Desugared to:
{
  const iterator = asyncIterable[Symbol.asyncIterator]();
  let result;

  while (true) {
    result = await iterator.next();

    if (result.done) {
      break;
    }

    const value = result.value;
    console.log(value);
  }
}

// With error handling:
{
  const iterator = asyncIterable[Symbol.asyncIterator]();
  let result;

  try {
    while (true) {
      result = await iterator.next();

      if (result.done) {
        break;
      }

      const value = result.value;
      console.log(value);
    }
  } catch (error) {
    // Call iterator.throw() if it exists
    if (typeof iterator.throw === 'function') {
      await iterator.throw(error);
    }
    throw error;
  } finally {
    // Call iterator.return() if it exists
    if (typeof iterator.return === 'function') {
      await iterator.return();
    }
  }
}
```

**Async Generator State Machine:**

```javascript
// Original async generator:
async function* fetchPages() {
  const page1 = await fetch('/api/page1');
  yield await page1.json();

  const page2 = await fetch('/api/page2');
  yield await page2.json();

  return 'done';
}

// V8 transforms to state machine (conceptual):
function fetchPages_StateMachine() {
  let state = 0;
  let page1, page1Data, page2, page2Data;

  return {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          switch (state) {
            case 0:
              state = 1;
              page1 = await fetch('/api/page1');
              page1Data = await page1.json();
              return { value: page1Data, done: false };

            case 1:
              state = 2;
              page2 = await fetch('/api/page2');
              page2Data = await page2.json();
              return { value: page2Data, done: false };

            case 2:
              state = 3;
              return { value: 'done', done: true };

            default:
              return { done: true };
          }
        }
      };
    }
  };
}

// Each yield creates a new state
// Each await within a state suspends execution
```

**Memory Management with Async Iterators:**

```javascript
// ❌ MEMORY LEAK: Holding all items in memory
async function* loadAllItems() {
  const items = await fetchAllItems(); // Load 10GB of data!

  for (const item of items) {
    yield item; // All items held in memory
  }
}

// ✅ STREAMING: Process items one at a time
async function* streamItems() {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    // Load one page at a time (10MB)
    const response = await fetch(`/api/items?page=${page}`);
    const data = await response.json();

    for (const item of data.items) {
      yield item; // Old items can be GC'd
    }

    hasMore = data.hasMore;
    page++;
    // Previous page is eligible for garbage collection
  }
}

// Memory usage:
// loadAllItems: 10GB constant
// streamItems: 10MB constant (1000x better!)
```

**Backpressure Implementation:**

```javascript
// Problem: Producer is faster than consumer
async function* fastProducer() {
  for (let i = 0; i < 1000000; i++) {
    yield i; // Produces instantly
  }
}

async function slowConsumer() {
  for await (const value of fastProducer()) {
    await processSlowly(value); // Takes 100ms each
  }
}

// Solution: Built-in backpressure
// for-await-of naturally provides backpressure:
// - next() is called AFTER previous value is processed
// - Producer waits for consumer
// - No unbounded queue buildup

// Manual backpressure example:
class BackpressureQueue {
  constructor(maxSize = 10) {
    this.queue = [];
    this.maxSize = maxSize;
    this.waiters = [];
  }

  async enqueue(item) {
    // Wait if queue is full
    while (this.queue.length >= this.maxSize) {
      await new Promise(resolve => this.waiters.push(resolve));
    }

    this.queue.push(item);
  }

  async dequeue() {
    const item = this.queue.shift();

    // Notify waiters that space is available
    if (this.waiters.length > 0) {
      const resolve = this.waiters.shift();
      resolve();
    }

    return item;
  }
}
```

**Performance: Async Generators vs Arrays:**

```javascript
// Benchmark: Processing 1 million items

// Test 1: Load all into array
console.time('array');
async function withArray() {
  const items = await fetchAll1MillionItems(); // 2s to fetch, 500MB memory

  for (const item of items) {
    await process(item); // 1ms each
  }
}
await withArray();
console.timeEnd('array');
// Time: 2s (fetch) + 1000s (process) = 1002s
// Memory: 500MB constant
// Time to first item: 2s

// Test 2: Async generator
console.time('generator');
async function* withGenerator() {
  let offset = 0;
  const batchSize = 100;

  while (offset < 1000000) {
    const batch = await fetchBatch(offset, batchSize); // 20ms per batch
    for (const item of batch) {
      yield item;
    }
    offset += batchSize;
  }
}

async function processWithGenerator() {
  for await (const item of withGenerator()) {
    await process(item); // 1ms each
  }
}
await processWithGenerator();
console.timeEnd('generator');
// Time: (20ms * 10000 batches) + 1000s = 1200s (20% slower)
// Memory: 5KB constant (100000x better!)
// Time to first item: 20ms (100x faster!)

// Trade-off:
// - Array: Faster total time, huge memory, slow to start
// - Generator: Slower total time, tiny memory, fast to start
// - Choose generator for large datasets where memory matters
```

**Cancellation Pattern:**

```javascript
// Async generators don't have built-in cancellation
// But you can implement it:

async function* cancellableGenerator(signal) {
  for (let i = 0; i < 1000; i++) {
    // Check for cancellation
    if (signal.aborted) {
      console.log('Generator cancelled');
      return; // Stop yielding
    }

    await delay(100);
    yield i;
  }
}

// Usage with AbortController
const controller = new AbortController();

async function run() {
  try {
    for await (const value of cancellableGenerator(controller.signal)) {
      console.log(value);

      if (value === 5) {
        controller.abort(); // Cancel after 5 items
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Iteration cancelled');
    }
  }
}

// Cleanup on abort:
async function* withCleanup(signal) {
  const resource = await openResource();

  try {
    for (let i = 0; i < 1000; i++) {
      if (signal.aborted) {
        throw new Error('Aborted');
      }

      yield await processWithResource(resource, i);
    }
  } finally {
    // Always cleanup, even on abort
    await resource.close();
    console.log('Resource cleaned up');
  }
}
```

</details>

<details>
<summary><strong>🐛 Real-World Scenario: Paginated API Memory Leak</strong></summary>

**Scenario:** Your admin dashboard loads 50,000 user records from a paginated API. After a few page loads, the browser tab crashes with "Out of Memory" error. The issue is in how you're fetching and processing paginated data.

**The Problem:**

```javascript
// ❌ MEMORY LEAK: Loading all pages into array
class UserService {
  async getAllUsers() {
    console.time('fetch-all-users');
    const allUsers = [];
    let page = 1;
    let hasMore = true;

    // Fetch all pages first
    while (hasMore) {
      const response = await fetch(`/api/users?page=${page}&limit=100`);
      const data = await response.json();

      // Push to array
      allUsers.push(...data.users); // PROBLEM: Accumulating in memory!

      hasMore = data.hasMore;
      page++;

      console.log(`Loaded page ${page}, total users: ${allUsers.length}`);
    }

    console.timeEnd('fetch-all-users'); // ~45 seconds
    console.log(`Memory usage: ${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    // Memory: 487 MB for 50,000 users (each ~10KB)

    // Process all users
    for (const user of allUsers) {
      await processUser(user); // Validation, transformation
    }

    return allUsers;
  }
}

// Production metrics:
// - Total users: 50,000
// - Memory usage: 487 MB
// - Time to first user processed: 45 seconds
// - Tab crashes: 15% of page loads (low-memory devices)
// - User complaints: "Dashboard freezes my browser"
```

**Debugging: Memory Profiling:**

```javascript
// Step 1: Check memory usage over time
class UserService {
  async getAllUsers() {
    const allUsers = [];
    let page = 1;

    while (page <= 500) { // 50,000 users / 100 per page
      const response = await fetch(`/api/users?page=${page}&limit=100`);
      const data = await response.json();

      allUsers.push(...data.users);

      // Log memory every 50 pages
      if (page % 50 === 0) {
        const memoryMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
        console.log(`Page ${page}: ${allUsers.length} users, ${memoryMB} MB`);
      }

      page++;
    }

    return allUsers;
  }
}

// Memory growth pattern:
// Page 50: 5,000 users, 52 MB
// Page 100: 10,000 users, 105 MB
// Page 150: 15,000 users, 158 MB
// Page 200: 20,000 users, 210 MB
// Page 250: 25,000 users, 263 MB
// Page 300: 30,000 users, 315 MB
// Page 350: 35,000 users, 368 MB
// Page 400: 40,000 users, 420 MB
// Page 450: 45,000 users, 473 MB
// Page 500: 50,000 users, 487 MB

// Linear memory growth = accumulating data
// This is the problem!
```

**Solution 1: Async Generator (Streaming):**

```javascript
// ✅ FIX: Stream users with async generator
class UserService {
  async *streamUsers() {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(`/api/users?page=${page}&limit=100`);
      const data = await response.json();

      // Yield users one at a time
      for (const user of data.users) {
        yield user; // Memory freed after processing
      }

      hasMore = data.hasMore;
      page++;
    }
  }

  async processAllUsers() {
    console.time('stream-users');
    let processedCount = 0;

    for await (const user of this.streamUsers()) {
      await processUser(user);
      processedCount++;

      if (processedCount % 1000 === 0) {
        const memoryMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
        console.log(`Processed ${processedCount} users, ${memoryMB} MB`);
      }
    }

    console.timeEnd('stream-users'); // ~50 seconds (slightly slower)
    return processedCount;
  }
}

// After fix:
// - Memory usage: 8-12 MB (constant!) vs 487 MB
// - Time to first user processed: 20ms vs 45s
// - Tab crashes: 0% vs 15%
// - User experience: Smooth, responsive UI

// Memory pattern with streaming:
// 1000 users: 8 MB
// 10000 users: 10 MB
// 25000 users: 9 MB
// 50000 users: 11 MB
// Constant memory usage = streaming working!
```

**Solution 2: Batched Processing with Generator:**

```javascript
// ✅ BETTER: Process in batches for better performance
class UserService {
  async *streamUserBatches(batchSize = 100) {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(`/api/users?page=${page}&limit=${batchSize}`);
      const data = await response.json();

      // Yield entire batch (better for bulk operations)
      yield data.users;

      hasMore = data.hasMore;
      page++;
    }
  }

  async processAllUsers() {
    console.time('batch-process');
    let totalProcessed = 0;

    for await (const batch of this.streamUserBatches(100)) {
      // Process batch in parallel (faster than one-by-one)
      await Promise.all(batch.map(user => processUser(user)));

      totalProcessed += batch.length;

      const memoryMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
      console.log(`Processed ${totalProcessed} users, ${memoryMB} MB`);
    }

    console.timeEnd('batch-process'); // ~25 seconds (2x faster!)
    return totalProcessed;
  }
}

// Results:
// - Memory: 8-15 MB (holds 100 users at a time)
// - Time: 25 seconds (parallel processing within batches)
// - Much faster than one-by-one processing
```

**Solution 3: Progress Tracking + UI Updates:**

```javascript
// ✅ BEST: Real-time progress for better UX
class UserService {
  async *streamUsersWithProgress() {
    let page = 1;
    let totalLoaded = 0;
    let hasMore = true;

    // First, get total count
    const countResponse = await fetch('/api/users/count');
    const { total } = await countResponse.json();

    while (hasMore) {
      const response = await fetch(`/api/users?page=${page}&limit=100`);
      const data = await response.json();

      for (const user of data.users) {
        totalLoaded++;

        yield {
          user,
          progress: {
            current: totalLoaded,
            total,
            percentage: ((totalLoaded / total) * 100).toFixed(1)
          }
        };
      }

      hasMore = data.hasMore;
      page++;
    }
  }

  async processAllUsers(onProgress) {
    let processed = 0;

    for await (const { user, progress } of this.streamUsersWithProgress()) {
      await processUser(user);
      processed++;

      // Update UI every 100 users
      if (processed % 100 === 0) {
        onProgress(progress);
      }
    }

    return processed;
  }
}

// Usage in UI:
async function loadDashboard() {
  const progressBar = document.getElementById('progress');
  const statusText = document.getElementById('status');

  const userService = new UserService();

  try {
    const total = await userService.processAllUsers(progress => {
      // Update UI in real-time
      progressBar.value = progress.percentage;
      statusText.textContent = `Processing ${progress.current} / ${progress.total} users (${progress.percentage}%)`;
    });

    console.log(`Successfully processed ${total} users`);
    statusText.textContent = `Completed! Processed ${total} users.`;
  } catch (error) {
    console.error('Processing failed:', error);
    statusText.textContent = 'Error processing users';
  }
}

// User experience:
// - See progress bar updating in real-time
// - UI remains responsive (doesn't freeze)
// - Can cancel operation if needed
// - Much better than "Loading..." for 45 seconds
```

**Comparison Table:**

| Approach | Memory | Time | UX | Crashes |
|----------|--------|------|----|---------|
| **Original (array)** | 487 MB | 45s | Poor (freeze) | 15% |
| **Stream one-by-one** | 11 MB | 50s | Good | 0% |
| **Stream batches** | 15 MB | 25s | Good | 0% |
| **Stream + progress** | 15 MB | 25s | Excellent | 0% |

**Real Production Metrics After Fix:**

```javascript
// Before (Array approach):
// - Memory usage: 487 MB average, 650 MB peak
// - Tab crashes: 15% on low-memory devices (< 4GB RAM)
// - User complaints: 45/week ("Browser freezes")
// - Admin dashboard abandonment: 22%

// After (Streaming + progress):
// - Memory usage: 12 MB average, 18 MB peak (97% reduction)
// - Tab crashes: 0%
// - User complaints: 2/week (unrelated issues)
// - Admin dashboard abandonment: 3%
// - Time to first user processed: 20ms vs 45s (2250x faster!)
// - Support tickets: -85%

// Key insights:
// 1. Async generators provide natural backpressure
// 2. Memory stays constant regardless of dataset size
// 3. Users see progress immediately (better perceived performance)
// 4. Can process millions of records without memory issues
```

**Bonus: Implementing Cancellation:**

```javascript
// ✅ ADVANCED: Allow user to cancel long operations
class UserService {
  async *streamUsers(signal) {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      // Check for cancellation before each API call
      if (signal?.aborted) {
        console.log('User cancelled operation');
        return; // Stop iteration
      }

      const response = await fetch(
        `/api/users?page=${page}&limit=100`,
        { signal } // Pass signal to fetch (will abort request)
      );
      const data = await response.json();

      for (const user of data.users) {
        // Check during iteration too
        if (signal?.aborted) return;

        yield user;
      }

      hasMore = data.hasMore;
      page++;
    }
  }
}

// Usage with cancel button:
let abortController;

async function startProcessing() {
  abortController = new AbortController();
  const cancelButton = document.getElementById('cancel');

  cancelButton.onclick = () => {
    abortController.abort();
    console.log('Cancelling...');
  };

  try {
    for await (const user of userService.streamUsers(abortController.signal)) {
      await processUser(user);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Operation cancelled by user');
    } else {
      throw error;
    }
  }
}
```

</details>

<details>
<summary><strong>⚖️ Trade-offs: Async Iteration Patterns</strong></summary>

**1. Array vs Async Generator:**

```javascript
// Pattern 1: Load all into array
async function loadAllArray() {
  const items = [];
  let page = 1;

  while (page <= 100) {
    const batch = await fetchPage(page);
    items.push(...batch);
    page++;
  }

  return items; // Return all at once
}

// Pattern 2: Async generator
async function* loadAllGenerator() {
  let page = 1;

  while (page <= 100) {
    const batch = await fetchPage(page);
    for (const item of batch) {
      yield item; // Yield one at a time
    }
    page++;
  }
}
```

| Aspect | Array | Async Generator |
|--------|-------|-----------------|
| **Memory** | High (all items) | Low (one item) |
| **Time to first item** | Slow (wait for all) | Fast (immediate) |
| **Random access** | ✅ Yes (items[5]) | ❌ No (sequential only) |
| **Multiple iterations** | ✅ Easy | ❌ Need to recreate |
| **Filtering/mapping** | ✅ Built-in methods | ⚠️ Manual |
| **Complexity** | Low | Medium |
| **Best for** | Small datasets, multiple passes | Large datasets, one pass |

**2. for-await-of vs Promise.all:**

```javascript
// Sequential: for-await-of
async function sequential(urls) {
  const results = [];

  for await (const url of urls) {
    const data = await fetch(url).then(r => r.json());
    results.push(data);
  }

  return results;
}
// Time: 3s per URL * 10 URLs = 30s
// Memory: One at a time

// Parallel: Promise.all
async function parallel(urls) {
  const results = await Promise.all(
    urls.map(url => fetch(url).then(r => r.json()))
  );

  return results;
}
// Time: 3s (max of all)
// Memory: All at once
```

| Scenario | Use for-await-of | Use Promise.all |
|----------|-----------------|-----------------|
| **Rate limiting needed** | ✅ | ❌ |
| **Memory constrained** | ✅ | ❌ |
| **Speed critical** | ❌ | ✅ |
| **Process results as they arrive** | ✅ | ❌ |
| **All operations independent** | ❌ | ✅ |
| **Order matters** | ✅ | ⚠️ |

**3. Async Generator vs Event Emitter:**

```javascript
// Pattern 1: Async generator
async function* dataStream() {
  for (let i = 0; i < 10; i++) {
    await delay(100);
    yield i;
  }
}

for await (const value of dataStream()) {
  console.log(value);
}

// Pattern 2: Event emitter
class DataStream extends EventEmitter {
  start() {
    for (let i = 0; i < 10; i++) {
      setTimeout(() => this.emit('data', i), i * 100);
    }
  }
}

const stream = new DataStream();
stream.on('data', value => console.log(value));
stream.start();
```

| Aspect | Async Generator | Event Emitter |
|--------|----------------|---------------|
| **Backpressure** | ✅ Automatic | ❌ Manual |
| **Error handling** | ✅ try-catch | ⚠️ .on('error') |
| **Cleanup** | ✅ finally block | ⚠️ Manual |
| **Multiple consumers** | ❌ Single | ✅ Multiple |
| **Pause/resume** | ✅ Built-in | ⚠️ Manual |
| **Browser support** | ✅ Modern | ✅ All |
| **Best for** | Data pipelines | Event-driven UI |

**4. Yielding Individual Items vs Batches:**

```javascript
// Pattern 1: Yield individual items
async function* yieldIndividual() {
  for (let i = 0; i < 10000; i++) {
    yield i; // 10000 yields
  }
}

// Pattern 2: Yield batches
async function* yieldBatches() {
  for (let i = 0; i < 10000; i += 100) {
    yield Array.from({ length: 100 }, (_, j) => i + j);
    // 100 yields
  }
}

// Pattern 3: Adaptive batching
async function* yieldAdaptive(targetTime = 16) {
  let batchSize = 1;
  let i = 0;

  while (i < 10000) {
    const start = performance.now();

    const batch = [];
    for (let j = 0; j < batchSize && i < 10000; j++, i++) {
      batch.push(i);
    }

    yield batch;

    const elapsed = performance.now() - start;

    // Adjust batch size to target 16ms per batch (60fps)
    if (elapsed < targetTime / 2) {
      batchSize = Math.min(batchSize * 2, 1000);
    } else if (elapsed > targetTime) {
      batchSize = Math.max(Math.floor(batchSize / 2), 1);
    }
  }
}
```

| Pattern | Flexibility | Performance | Complexity | Best For |
|---------|------------|-------------|------------|----------|
| **Individual** | ✅ High | ❌ Slow | Low | Simple cases |
| **Fixed batches** | ⚠️ Medium | ✅ Fast | Low | Known workload |
| **Adaptive** | ✅ High | ✅ Fast | High | Variable workload |

**5. Synchronous Transforms vs Async Transforms:**

```javascript
// Sync map (fast but blocks)
async function* syncMap(iterable, fn) {
  for await (const value of iterable) {
    yield fn(value); // Sync transform
  }
}

// Async map (slow but non-blocking)
async function* asyncMap(iterable, fn) {
  for await (const value of iterable) {
    yield await fn(value); // Async transform
  }
}

// Parallel async map (fastest but high memory)
async function* parallelMap(iterable, fn, concurrency = 5) {
  const queue = [];

  for await (const value of iterable) {
    queue.push(fn(value));

    if (queue.length >= concurrency) {
      yield await queue.shift();
    }
  }

  // Drain remaining
  for (const promise of queue) {
    yield await promise;
  }
}
```

| Pattern | Speed | Memory | Order Preserved | Best For |
|---------|-------|--------|-----------------|----------|
| **Sync** | Fastest | Lowest | ✅ | CPU-bound work |
| **Async sequential** | Slow | Low | ✅ | I/O-bound, strict order |
| **Async parallel** | Fast | High | ⚠️ | I/O-bound, order flexible |

**6. Pull-Based (Iterator) vs Push-Based (Observable):**

```javascript
// Pull-based: Consumer controls pace
async function* pullBased() {
  for (let i = 0; i < 10; i++) {
    console.log('Producer: Generating', i);
    yield i; // Waits for consumer to call next()
  }
}

async function consumer() {
  for await (const value of pullBased()) {
    console.log('Consumer: Processing', value);
    await delay(1000); // Slow consumer
  }
}
// Output: Producer waits for consumer (backpressure)

// Push-based: Producer controls pace
class Observable {
  constructor(producer) {
    this.producer = producer;
  }

  subscribe(observer) {
    this.producer(observer);
  }
}

const pushBased = new Observable(observer => {
  for (let i = 0; i < 10; i++) {
    console.log('Producer: Pushing', i);
    observer.next(i); // Pushes immediately
  }
});

pushBased.subscribe({
  next: async value => {
    console.log('Consumer: Processing', value);
    await delay(1000); // Can't slow down producer!
  }
});
// Output: Producer pushes all immediately (no backpressure)
```

**When to Use Each:**

```
Use async generators (pull-based):
✅ Paginated APIs
✅ File streaming
✅ Database cursors
✅ Slow consumers (need backpressure)
✅ Resource-constrained environments

Use observables (push-based):
✅ User events (clicks, keyboard)
✅ WebSocket messages
✅ Real-time data feeds
✅ Multiple consumers
✅ Event-driven architectures
```

</details>

<details>
<summary><strong>💬 Explain to Junior: Async Iteration Simplified</strong></summary>

**Simple Analogy: Netflix Streaming**

Regular for loop = Downloading entire movie first:
```javascript
// Download all 2 hours (2GB) first
const movie = await downloadEntireMovie();

// Then watch
for (const scene of movie.scenes) {
  watch(scene);
}
// Have to wait 30 minutes before watching starts!
```

for-await-of = Streaming chunks:
```javascript
// Start watching after 2 seconds!
for await (const chunk of streamMovie()) {
  watch(chunk); // Watch while it downloads
}
// Movie starts playing almost immediately
```

**What is an Async Generator?**

It's a function that gives you values one at a time, but waits for async operations:

```javascript
// Regular function: Returns everything at once
function getNumbers() {
  return [1, 2, 3, 4, 5];
}

// Generator: Returns one at a time
function* getNumbersSlowly() {
  yield 1;
  yield 2;
  yield 3;
}

// Async generator: Returns one at a time, can await
async function* getNumbersAsync() {
  await delay(1000);
  yield 1; // After 1 second

  await delay(1000);
  yield 2; // After another second

  await delay(1000);
  yield 3; // After another second
}

// Usage:
for await (const num of getNumbersAsync()) {
  console.log(num); // Logs every second
}
```

**Common Beginner Mistakes:**

```javascript
// ❌ MISTAKE 1: Using regular for-of with async iterator
async function* numbers() {
  yield 1;
  yield 2;
  yield 3;
}

// Wrong: for-of doesn't wait
for (const num of numbers()) {
  console.log(num); // Logs promises, not numbers!
}

// Right: for-await-of waits
for await (const num of numbers()) {
  console.log(num); // Logs 1, 2, 3
}


// ❌ MISTAKE 2: Forgetting async in function*
function* badGenerator() {
  yield await fetch('/api'); // SyntaxError!
}

// Right: Use async function*
async function* goodGenerator() {
  const response = await fetch('/api');
  yield response.json();
}


// ❌ MISTAKE 3: Loading all data into array first
async function loadAllUsers() {
  const users = [];

  // Load all pages
  for (let page = 1; page <= 100; page++) {
    const batch = await fetchPage(page);
    users.push(...batch); // Accumulating in memory!
  }

  // Then process
  for (const user of users) {
    await process(user);
  }
}
// Memory: Holds all 10,000 users (100MB)

// Right: Stream one at a time
async function* streamUsers() {
  for (let page = 1; page <= 100; page++) {
    const batch = await fetchPage(page);
    for (const user of batch) {
      yield user; // Process immediately
    }
  }
}

async function processUsers() {
  for await (const user of streamUsers()) {
    await process(user); // Old users get freed from memory
  }
}
// Memory: Holds one user at a time (10KB)
```

**Explaining to PM:**

"Async iteration is like a buffet line vs a plated meal:

**Plated meal (traditional approach):**
- Chef prepares ALL dishes first
- Waits for everything to be ready
- Then serves everything at once
- If there are 100 dishes, huge wait time
- Needs huge kitchen space to store all dishes

**Buffet line (async iteration):**
- Chef prepares dishes one by one
- Guests start eating as soon as first dish is ready
- No waiting for all dishes
- Kitchen only needs space for a few dishes at a time
- Much faster to serve first guest

**In our app:**
- Loading 50,000 users as array = 487 MB, 45-second wait, crashes
- Streaming 50,000 users = 12 MB, 20ms to first user, never crashes

**Business impact:**
- 15% crash rate → 0% crash rate
- 22% abandonment → 3% abandonment
- Happier users = more revenue"

**Visual Example: Pagination**

```javascript
// Traditional: Load all pages into array (slow start)
async function loadAllPages() {
  console.log('[0s] Starting to load pages...');

  const allData = [];

  for (let page = 1; page <= 5; page++) {
    await delay(1000); // Each page takes 1 second
    allData.push(`Page ${page} data`);
    console.log(`[${page}s] Loaded page ${page}`);
  }

  console.log('[5s] ALL PAGES LOADED! Now processing...');

  // Finally process
  for (const data of allData) {
    console.log(`[${Date.now()}] Processing: ${data}`);
  }
}

// Output:
// [0s] Starting to load pages...
// [1s] Loaded page 1
// [2s] Loaded page 2
// [3s] Loaded page 3
// [4s] Loaded page 4
// [5s] Loaded page 5
// [5s] ALL PAGES LOADED! Now processing...
// [5s] Processing: Page 1 data
// [5s] Processing: Page 2 data
// (5-second wait before any processing!)


// Async generator: Process as you load (fast start)
async function* streamPages() {
  console.log('[0s] Starting to stream pages...');

  for (let page = 1; page <= 5; page++) {
    await delay(1000);
    yield `Page ${page} data`;
    console.log(`[${page}s] Loaded and yielded page ${page}`);
  }
}

async function processStream() {
  for await (const data of streamPages()) {
    console.log(`[${Date.now()}] Processing: ${data}`);
  }
}

// Output:
// [0s] Starting to stream pages...
// [1s] Loaded and yielded page 1
// [1s] Processing: Page 1 data
// [2s] Loaded and yielded page 2
// [2s] Processing: Page 2 data
// [3s] Loaded and yielded page 3
// [3s] Processing: Page 3 data
// (Start processing immediately!)
```

**Key Rules for Juniors:**

1. **Use `async function*` for generators that await**
   ```javascript
   async function* myGenerator() {
     yield await fetch('/api');
   }
   ```

2. **Use `for await...of` to consume async iterators**
   ```javascript
   for await (const item of asyncIterable) {
     console.log(item);
   }
   ```

3. **Prefer streaming over arrays for large datasets**
   ```javascript
   // Bad: Load all into array
   const items = await loadAll(); // Huge memory!

   // Good: Stream one at a time
   for await (const item of stream()) { ... }
   ```

4. **Always handle errors in for-await-of**
   ```javascript
   try {
     for await (const item of stream()) {
       process(item);
     }
   } catch (error) {
     console.error('Stream error:', error);
   }
   ```

5. **Use `yield*` to delegate to another generator**
   ```javascript
   async function* delegating() {
     yield* otherGenerator();
     yield* yetAnotherGenerator();
   }
   ```

**Practice Exercise:**

```javascript
// Task: Fetch 10 pages of data, process each item
// Each page has 100 items
// Each page fetch takes 500ms

// Try writing this two ways:
// 1. Load all pages into array first (traditional)
// 2. Stream pages with async generator (better)

// Solution 1: Array (5 seconds to start)
async function loadAllPages() {
  const allItems = [];

  for (let page = 1; page <= 10; page++) {
    await delay(500); // Fetch page
    const items = Array.from({ length: 100 }, (_, i) => ({
      page,
      id: i
    }));
    allItems.push(...items);
  }

  // Start processing after 5 seconds
  for (const item of allItems) {
    console.log('Processing:', item);
  }
}

// Solution 2: Generator (500ms to start)
async function* streamPages() {
  for (let page = 1; page <= 10; page++) {
    await delay(500); // Fetch page

    const items = Array.from({ length: 100 }, (_, i) => ({
      page,
      id: i
    }));

    for (const item of items) {
      yield item; // Yield immediately
    }
  }
}

async function processStream() {
  // Start processing after 500ms!
  for await (const item of streamPages()) {
    console.log('Processing:', item);
  }
}
```

**When to Use What:**

```
Use arrays:
✅ Small datasets (< 1000 items)
✅ Need random access (items[5])
✅ Need to iterate multiple times
✅ Simple transformations (map, filter)

Use async generators:
✅ Large datasets (> 10,000 items)
✅ Memory constrained
✅ Want to start processing ASAP
✅ Paginated APIs
✅ File streaming
✅ One-pass processing
```

</details>

### Follow-up Questions

- "How would you implement an async iterator that polls an API every N seconds?"
- "What's the difference between for-await-of and Promise.all?"
- "How do you cancel an async generator?"
- "Can you convert a Node.js stream to an async iterable?"
- "How would you implement backpressure in an async generator?"

### Resources

- [MDN: for-await-of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of)
- [MDN: Async iteration and generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function*)
- [JavaScript.info: Async iteration and generators](https://javascript.info/async-iterators-generators)

---

