# Async Patterns & Performance

> **Focus**: JavaScript fundamentals and advanced concepts

---

## Question 1: What are common async patterns and anti-patterns in JavaScript?

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐
**Time:** 8-12 minutes
**Companies:** Google, Meta, Amazon, Airbnb

### Question
What are some common patterns for handling asynchronous code in JavaScript? What are the anti-patterns to avoid? How do you handle error propagation and cancellation?

### Answer

**Common Patterns:**
- **Sequential execution:** One operation after another (using await)
- **Parallel execution:** Multiple operations simultaneously (Promise.all)
- **Retry logic:** Attempt operations with exponential backoff
- **Timeout:** Limit operation duration with Promise.race
- **Debounce/throttle:** Control operation frequency
- **Cancellation:** AbortController for fetch requests
- **Queue:** Process items with concurrency limit

**Anti-Patterns:**
- **Promise hell:** Excessive nesting of promises
- **Missing error handling:** Unhandled promise rejections
- **Sequential when parallel:** Not using Promise.all
- **Blocking event loop:** Long synchronous operations
- **Memory leaks:** Not cleaning up listeners/timers

**Error Handling Best Practices:**
- Always add .catch() or try/catch
- Propagate errors appropriately
- Provide context in error messages
- Use finally for cleanup
- Handle partial failures with allSettled

### Code Example

```javascript
// ============================================
// Pattern 1: Sequential execution
// ============================================
async function loadUserData(userId) {
  // Operations that depend on previous results
  const user = await fetchUser(userId);
  const preferences = await fetchPreferences(user.id);
  const history = await fetchHistory(user.id, preferences.limit);

  return { user, preferences, history };
}


// ============================================
// Pattern 2: Parallel execution
// ============================================
async function loadDashboard(userId) {
  // Independent operations can run in parallel
  const [user, stats, notifications, friends] = await Promise.all([
    fetchUser(userId),
    fetchStats(userId),
    fetchNotifications(userId),
    fetchFriends(userId)
  ]);

  return { user, stats, notifications, friends };
}


// ============================================
// Pattern 3: Retry with exponential backoff
// ============================================
async function fetchWithRetry(url, maxRetries = 3) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;

      if (i < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, i) * 1000;
        console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
}


// ============================================
// Pattern 4: Timeout wrapper
// ============================================
function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    )
  ]);
}

// Usage
try {
  const data = await withTimeout(
    fetch('/api/slow-endpoint'),
    5000
  );
} catch (error) {
  if (error.message === 'Operation timed out') {
    console.error('Request took too long');
  }
}


// ============================================
// Pattern 5: Debounce (async version)
// ============================================
function debounce(func, delay) {
  let timeoutId;

  return function debounced(...args) {
    clearTimeout(timeoutId);

    return new Promise((resolve) => {
      timeoutId = setTimeout(async () => {
        resolve(await func.apply(this, args));
      }, delay);
    });
  };
}

// Usage
const debouncedSearch = debounce(async (query) => {
  const results = await fetch(`/api/search?q=${query}`);
  return results.json();
}, 300);

// Only last call within 300ms executes
debouncedSearch('hello');
debouncedSearch('hello world'); // Only this executes


// ============================================
// Pattern 6: AbortController for cancellation
// ============================================
async function searchWithCancel(query, signal) {
  try {
    const response = await fetch(`/api/search?q=${query}`, { signal });
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Search cancelled');
      return null;
    }
    throw error;
  }
}

// Usage
const controller = new AbortController();

searchWithCancel('query', controller.signal);

// Cancel after 5 seconds
setTimeout(() => controller.abort(), 5000);

// Or cancel on user action
button.addEventListener('click', () => controller.abort());


// ============================================
// Pattern 7: Queue with concurrency limit
// ============================================
class AsyncQueue {
  constructor(concurrency = 5) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  async add(asyncFn) {
    while (this.running >= this.concurrency) {
      await new Promise(resolve => this.queue.push(resolve));
    }

    this.running++;

    try {
      return await asyncFn();
    } finally {
      this.running--;
      const resolve = this.queue.shift();
      if (resolve) resolve();
    }
  }
}

// Usage
const queue = new AsyncQueue(3); // Max 3 concurrent

const tasks = Array.from({ length: 100 }, (_, i) =>
  queue.add(() => fetchUser(i))
);

const results = await Promise.all(tasks);


// ============================================
// Pattern 8: Graceful degradation
// ============================================
async function loadDataWithFallback(userId) {
  let data = {};

  // Critical data - must succeed
  try {
    data.user = await fetchUser(userId);
  } catch (error) {
    console.error('Failed to load user');
    throw error; // Can't continue without user
  }

  // Optional data - continue if fails
  try {
    data.preferences = await fetchPreferences(userId);
  } catch (error) {
    console.warn('Using default preferences');
    data.preferences = DEFAULT_PREFERENCES;
  }

  // Optional data - just skip if fails
  try {
    data.recommendations = await fetchRecommendations(userId);
  } catch (error) {
    console.warn('Recommendations unavailable');
    // Don't set recommendations key
  }

  return data;
}


// ============================================
// Anti-Pattern 1: Promise hell (nested promises)
// ============================================

// ❌ Bad: Nested promises
fetch('/api/user')
  .then(response => response.json())
  .then(user => {
    fetch(`/api/posts/${user.id}`)
      .then(response => response.json())
      .then(posts => {
        fetch(`/api/comments/${posts[0].id}`)
          .then(response => response.json())
          .then(comments => {
            console.log(comments);
          });
      });
  });

// ✅ Good: Flat promise chain
fetch('/api/user')
  .then(r => r.json())
  .then(user => fetch(`/api/posts/${user.id}`))
  .then(r => r.json())
  .then(posts => fetch(`/api/comments/${posts[0].id}`))
  .then(r => r.json())
  .then(comments => console.log(comments));

// ✅ Better: Async/await
async function loadData() {
  const user = await fetch('/api/user').then(r => r.json());
  const posts = await fetch(`/api/posts/${user.id}`).then(r => r.json());
  const comments = await fetch(`/api/comments/${posts[0].id}`).then(r => r.json());
  return comments;
}


// ============================================
// Anti-Pattern 2: Unhandled rejections
// ============================================

// ❌ Bad: No error handling
async function loadUser(id) {
  const response = await fetch(`/api/user/${id}`);
  return response.json(); // What if fetch fails?
}

// ✅ Good: Proper error handling
async function loadUserSafe(id) {
  try {
    const response = await fetch(`/api/user/${id}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to load user ${id}:`, error);
    throw new Error(`User ${id} unavailable: ${error.message}`);
  }
}


// ============================================
// Anti-Pattern 3: Sequential when parallel
// ============================================

// ❌ Bad: Sequential (slow - 9 seconds total)
async function loadAllUsersSlow(ids) {
  const users = [];

  for (const id of ids) {
    const user = await fetchUser(id); // Wait 3s each
    users.push(user);
  }

  return users;
}

// ✅ Good: Parallel (fast - 3 seconds total)
async function loadAllUsersFast(ids) {
  return await Promise.all(
    ids.map(id => fetchUser(id))
  );
}


// ============================================
// Anti-Pattern 4: Not returning promises
// ============================================

// ❌ Bad: Missing return
async function loadData() {
  fetch('/api/data').then(r => r.json()); // Missing return!
}

const result = await loadData(); // undefined!

// ✅ Good: Return the promise
async function loadDataCorrect() {
  return fetch('/api/data').then(r => r.json());
}


// ============================================
// Anti-Pattern 5: Async in forEach
// ============================================

// ❌ Bad: forEach doesn't wait for async
async function processItems(items) {
  items.forEach(async (item) => {
    await processItem(item); // forEach doesn't wait!
  });
  console.log('Done'); // Executes immediately!
}

// ✅ Good: Use for...of
async function processItemsCorrect(items) {
  for (const item of items) {
    await processItem(item);
  }
  console.log('Done'); // Executes after all items
}

// ✅ Good: Parallel with Promise.all
async function processItemsParallel(items) {
  await Promise.all(
    items.map(item => processItem(item))
  );
  console.log('Done'); // Executes after all items
}


// ============================================
// Pattern 9: Error aggregation
// ============================================
async function loadMultipleWithErrors(urls) {
  const results = await Promise.allSettled(
    urls.map(url => fetch(url).then(r => r.json()))
  );

  const successful = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);

  const failed = results
    .filter(r => r.status === 'rejected')
    .map(r => r.reason.message);

  if (failed.length > 0) {
    console.warn(`${failed.length} requests failed:`, failed);
  }

  if (successful.length === 0) {
    throw new Error('All requests failed');
  }

  return {
    data: successful,
    errors: failed
  };
}


// ============================================
// Pattern 10: Memoization for async functions
// ============================================
function memoizeAsync(fn) {
  const cache = new Map();

  return async function(...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = await fn.apply(this, args);
    cache.set(key, result);

    return result;
  };
}

// Usage
const fetchUserMemoized = memoizeAsync(async (id) => {
  console.log(`Fetching user ${id}...`);
  return fetch(`/api/user/${id}`).then(r => r.json());
});

await fetchUserMemoized(1); // Fetches from API
await fetchUserMemoized(1); // Returns from cache


// ============================================
// Pattern 11: Cleanup with finally
// ============================================
async function loadWithSpinner(url) {
  showSpinner();

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    showError(error.message);
    throw error;
  } finally {
    hideSpinner(); // Always executes
  }
}


// ============================================
// Pattern 12: Race conditions prevention
// ============================================
class SearchBox {
  constructor() {
    this.lastSearchId = 0;
  }

  async search(query) {
    const searchId = ++this.lastSearchId;

    const results = await fetch(`/api/search?q=${query}`).then(r => r.json());

    // Only use results if this is still the latest search
    if (searchId === this.lastSearchId) {
      this.displayResults(results);
    } else {
      console.log('Ignoring stale results');
    }
  }

  displayResults(results) {
    // Update UI
  }
}


// ============================================
// Pattern 13: Progressive loading
// ============================================
async function loadUserWithProgress(userId, onProgress) {
  onProgress(0, 'Loading user...');
  const user = await fetchUser(userId);

  onProgress(33, 'Loading posts...');
  const posts = await fetchPosts(userId);

  onProgress(66, 'Loading comments...');
  const comments = await fetchComments(userId);

  onProgress(100, 'Complete!');

  return { user, posts, comments };
}

// Usage
await loadUserWithProgress(123, (percent, message) => {
  updateProgressBar(percent);
  updateStatusText(message);
});


// ============================================
// Pattern 14: Lazy loading with cache
// ============================================
class LazyLoader {
  constructor() {
    this.cache = new Map();
    this.loading = new Map();
  }

  async load(key, loader) {
    // Return cached value
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Return in-progress load
    if (this.loading.has(key)) {
      return this.loading.get(key);
    }

    // Start new load
    const promise = loader().then(value => {
      this.cache.set(key, value);
      this.loading.delete(key);
      return value;
    }).catch(error => {
      this.loading.delete(key);
      throw error;
    });

    this.loading.set(key, promise);
    return promise;
  }
}

const loader = new LazyLoader();

// Multiple calls return same promise
Promise.all([
  loader.load('user-1', () => fetchUser(1)),
  loader.load('user-1', () => fetchUser(1)),
  loader.load('user-1', () => fetchUser(1))
]); // Only one actual fetch


// ============================================
// Pattern 15: Batch requests
// ============================================
class BatchLoader {
  constructor(batchFn, delay = 10) {
    this.batchFn = batchFn;
    this.delay = delay;
    this.queue = [];
    this.timeoutId = null;
  }

  load(id) {
    return new Promise((resolve, reject) => {
      this.queue.push({ id, resolve, reject });

      if (!this.timeoutId) {
        this.timeoutId = setTimeout(() => this.flush(), this.delay);
      }
    });
  }

  async flush() {
    const queue = this.queue.slice();
    this.queue = [];
    this.timeoutId = null;

    try {
      const ids = queue.map(item => item.id);
      const results = await this.batchFn(ids);

      queue.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      queue.forEach(item => item.reject(error));
    }
  }
}

// Usage
const userLoader = new BatchLoader(async (ids) => {
  // Fetch multiple users in one request
  return fetch(`/api/users?ids=${ids.join(',')}`).then(r => r.json());
});

// These get batched into single request
const user1 = userLoader.load(1);
const user2 = userLoader.load(2);
const user3 = userLoader.load(3);

const [u1, u2, u3] = await Promise.all([user1, user2, user3]);
```

### Common Mistakes

- ❌ **Mistake:** Using async/await with forEach
  ```javascript
  // Doesn't work as expected!
  items.forEach(async item => {
    await processItem(item); // forEach doesn't wait
  });
  console.log('Done'); // Executes immediately
  ```

- ❌ **Mistake:** Creating promise hell with nesting
  ```javascript
  fetch('/api/user').then(r1 => {
    r1.json().then(user => {
      fetch('/api/posts').then(r2 => {
        // Too nested!
      });
    });
  });
  ```

- ❌ **Mistake:** Not handling all rejection cases
  ```javascript
  const promise = fetch('/api/data'); // No .catch()
  // Unhandled rejection if fetch fails!
  ```

- ✅ **Correct:** Use appropriate patterns for each scenario
  ```javascript
  // Sequential when needed
  for (const item of items) {
    await processItem(item);
  }

  // Parallel when possible
  await Promise.all(items.map(item => processItem(item)));

  // Always handle errors
  try {
    await operation();
  } catch (error) {
    handleError(error);
  }
  ```

### Follow-up Questions

- "How would you implement request deduplication for identical concurrent requests?"
- "What strategies would you use to prevent memory leaks in long-running async operations?"
- "How do you handle token refresh in async API calls?"
- "What's the best way to implement optimistic updates with rollback?"
- "How would you design a resilient retry system with circuit breaker pattern?"

<details>
<summary><strong>🔍 Deep Dive</strong></summary>

**Promise.all() vs Promise.allSettled() vs Promise.race():**
- `all()`: Rejects on first failure (fail-fast, ~5ns overhead per promise)
- `allSettled()`: Never rejects, waits for all (~8ns overhead)
- `race()`: Resolves/rejects on first completion (~3ns overhead)

**Sequential vs Parallel Performance:**
```javascript
// Sequential: 3s (1s + 1s + 1s)
await task1(); await task2(); await task3();

// Parallel: 1s (all run simultaneously)
await Promise.all([task1(), task2(), task3()]);
```

**Request Deduplication Pattern:**
Cache in-flight promises by request key (URL + params). Multiple identical requests share same promise.

**Circuit Breaker States:**
- **Closed**: Normal operation
- **Open**: Failures exceeded threshold, reject immediately
- **Half-Open**: Test if service recovered

</details>

<details>
<summary><strong>🐛 Real-World Scenario</strong></summary>

**Problem:** Search autocomplete made 100+ API calls per second, overloaded server.

**Bug:**
```javascript
searchInput.on('keyup', async (e) => {
  const results = await fetch(`/api/search?q=${e.target.value}`);
  // Every keystroke = new request! ❌
});
```

**Impact:**
- Server CPU: 95% (usually 20%)
- API rate limit hit: 500+ users blocked
- Search latency: 5s (target: 200ms)

**Fix - Debounce + AbortController:**
```javascript
let controller;

searchInput.on('keyup', debounce(async (e) => {
  controller?.abort();  // Cancel previous request
  controller = new AbortController();

  const results = await fetch(`/api/search?q=${e.target.value}`, {
    signal: controller.signal
  });
}, 300));  // Wait 300ms after last keystroke
```

**Metrics After Fix:**
- API calls: 95% reduction (100/s → 5/s)
- Server CPU: 25% (normal)
- Search latency: 150ms

</details>

<details>
<summary><strong>⚖️ Trade-offs</strong></summary>

| Pattern | Latency | Error Handling | Complexity | Best For |
|---------|---------|----------------|------------|----------|
| **Sequential** | High (additive) | ✅ Easy (try/catch per step) | Low | Dependent operations |
| **Parallel** | Low (max of all) | ⚠️ Partial failures tricky | Medium | Independent operations |
| **Retry** | High (with backoff) | ✅ Resilient | Medium | Flaky APIs |
| **Circuit Breaker** | Low (fast fail) | ✅ Prevents cascades | High | Microservices |
| **Debounce** | Medium (delayed) | ✅ Simple | Low | User input |

</details>

<details>
<summary><strong>💬 Explain to Junior</strong></summary>

**Async Patterns Like Restaurant Orders:**

**Sequential (Slow):**
"First make pizza. When done, make salad. When done, make dessert."
Total: 60 min

**Parallel (Fast):**
"Make pizza, salad, and dessert at the same time!"
Total: 30 min (pizza takes longest)

**Debounce:**
Customer keeps changing order. Wait until they stop talking for 5 seconds before cooking.

**Retry with Backoff:**
Kitchen out of tomatoes. Try again in 1 min. Still out? Try in 2 min. Then 4 min, 8 min...

**Circuit Breaker:**
Kitchen keeps burning food. After 5 burnt dishes, stop sending orders for 10 min. Let kitchen recover.

</details>

### Resources

- [MDN: Async functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
- [JavaScript Promises: An introduction](https://web.dev/promises/)
- [Async JavaScript Patterns](https://www.patterns.dev/posts/async-patterns/)
- [You Don't Know JS: Async & Performance](https://github.com/getify/You-Dont-Know-JS/blob/1st-ed/async%20&%20performance/README.md)

---

## Question 2: How does AbortController work for canceling async operations?

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐
**Time:** 8-10 minutes
**Companies:** Google, Meta, Microsoft, Amazon

### Question
Explain AbortController and AbortSignal. How do you use them to cancel fetch requests and other async operations?

### Answer

**AbortController** is a Web API that allows you to cancel one or more async operations (fetch requests, event listeners, etc.) using an abort signal.

**Key Concepts:**

1. **AbortController** - Creates a controller object with signal and abort() method
2. **AbortSignal** - The signal property used to communicate with async operations
3. **Cancellation** - Call controller.abort() to cancel operations listening to the signal
4. **AbortError** - Operations throw an AbortError when canceled
5. **Multiple Operations** - Same signal can be used for multiple related operations

### Code Example

```javascript
// ============================================
// 1. BASIC FETCH CANCELLATION
// ============================================

const controller = new AbortController();
const signal = controller.signal;

// Start fetch with signal
fetch('/api/data', { signal })
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => {
    if (error.name === 'AbortError') {
      console.log('Fetch aborted!');
    } else {
      console.error('Fetch failed:', error);
    }
  });

// Cancel the fetch
setTimeout(() => controller.abort(), 1000);


// ============================================
// 2. ABORT WITH TIMEOUT
// ============================================

async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController();
  const signal = controller.signal;

  // Auto-abort after timeout
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal });
    clearTimeout(timeoutId);
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

// Usage
try {
  const data = await fetchWithTimeout('/api/slow-endpoint', 3000);
  console.log(data);
} catch (error) {
  console.error(error.message);
}


// ============================================
// 3. CANCEL MULTIPLE REQUESTS
// ============================================

const controller = new AbortController();
const signal = controller.signal;

// Start multiple requests with same signal
Promise.all([
  fetch('/api/users', { signal }).then(r => r.json()),
  fetch('/api/posts', { signal }).then(r => r.json()),
  fetch('/api/comments', { signal }).then(r => r.json())
])
.then(([users, posts, comments]) => {
  console.log('All data loaded:', users, posts, comments);
})
.catch(error => {
  if (error.name === 'AbortError') {
    console.log('All requests canceled');
  }
});

// Cancel all three requests at once
controller.abort();


// ============================================
// 4. REACT COMPONENT CLEANUP PATTERN
// ============================================

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadUser() {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          signal: controller.signal
        });
        const data = await response.json();
        setUser(data);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Failed to load user:', error);
        }
      } finally {
        setLoading(false);
      }
    }

    loadUser();

    // Cleanup: abort on unmount or userId change
    return () => controller.abort();
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  return <div>{user?.name}</div>;
}


// ============================================
// 5. SEARCH WITH DEBOUNCE AND CANCELLATION
// ============================================

class SearchBox {
  constructor() {
    this.controller = null;
  }

  async search(query) {
    // Cancel previous search
    if (this.controller) {
      this.controller.abort();
    }

    // Create new controller for this search
    this.controller = new AbortController();
    const signal = this.controller.signal;

    try {
      const response = await fetch(`/api/search?q=${query}`, { signal });
      const results = await response.json();
      this.displayResults(results);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Search failed:', error);
      }
    }
  }

  displayResults(results) {
    // Update UI
  }
}

// Usage
const searchBox = new SearchBox();

input.addEventListener('input', (e) => {
  searchBox.search(e.target.value);
});


// ============================================
// 6. MANUAL ABORT CHECKING
// ============================================

async function longRunningOperation(signal) {
  // Check if already aborted
  if (signal.aborted) {
    throw new DOMException('Operation aborted', 'AbortError');
  }

  // Listen for abort event
  signal.addEventListener('abort', () => {
    console.log('Abort signal received!');
  });

  for (let i = 0; i < 100; i++) {
    // Check abort status periodically
    if (signal.aborted) {
      throw new DOMException('Operation aborted', 'AbortError');
    }

    await processChunk(i);
  }

  return 'Complete';
}

// Usage
const controller = new AbortController();

longRunningOperation(controller.signal)
  .then(result => console.log(result))
  .catch(error => {
    if (error.name === 'AbortError') {
      console.log('Operation canceled');
    }
  });

// Cancel after 2 seconds
setTimeout(() => controller.abort(), 2000);


// ============================================
// 7. ABORT REASON (Modern API)
// ============================================

const controller = new AbortController();

controller.abort('User clicked cancel button');

try {
  await fetch('/api/data', { signal: controller.signal });
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Abort reason:', controller.signal.reason);
    // "User clicked cancel button"
  }
}


// ============================================
// 8. ABORT AFTER TIMEOUT HELPER
// ============================================

// This is what AbortSignal.timeout() does internally
// (shown here for understanding; use the built-in below in real code)
function createTimeoutSignal(ms) {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

// Built-in AbortSignal.timeout() (standard, widely supported)
try {
  const response = await fetch('/api/data', {
    signal: AbortSignal.timeout(5000)
  });
  const data = await response.json();
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request timed out');
  }
}


// ============================================
// 9. COMBINING MULTIPLE SIGNALS
// ============================================

function combineSignals(...signals) {
  const controller = new AbortController();

  const onAbort = () => controller.abort();

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      return controller.signal;
    }
    signal.addEventListener('abort', onAbort);
  }

  return controller.signal;
}

// Usage
const userController = new AbortController();
const timeoutSignal = AbortSignal.timeout(5000);

const combinedSignal = combineSignals(
  userController.signal,
  timeoutSignal
);

fetch('/api/data', { signal: combinedSignal });

// Aborts if EITHER user cancels OR timeout occurs


// ============================================
// 10. ABORT EVENT LISTENER
// ============================================

const controller = new AbortController();
const signal = controller.signal;

signal.addEventListener('abort', () => {
  console.log('Signal aborted!');
  console.log('Reason:', signal.reason);
});

// Check if aborted
console.log(signal.aborted); // false

controller.abort('Custom reason');

console.log(signal.aborted); // true


// ============================================
// 11. PROMISE WITH ABORT SUPPORT
// ============================================

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    // Check if already aborted
    if (signal?.aborted) {
      return reject(new DOMException('Aborted', 'AbortError'));
    }

    const timeoutId = setTimeout(resolve, ms);

    // Listen for abort
    signal?.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

// Usage
const controller = new AbortController();

delay(5000, controller.signal)
  .then(() => console.log('Delay complete'))
  .catch(err => {
    if (err.name === 'AbortError') {
      console.log('Delay aborted');
    }
  });

setTimeout(() => controller.abort(), 1000);


// ============================================
// 12. AXIOS WITH ABORT CONTROLLER
// ============================================

const controller = new AbortController();

axios.get('/api/data', {
  signal: controller.signal
})
.then(response => console.log(response.data))
.catch(error => {
  if (axios.isCancel(error)) {
    console.log('Request canceled:', error.message);
  }
});

controller.abort();


// ============================================
// 13. ABORT RACE CONDITION PREVENTION
// ============================================

class DataLoader {
  constructor() {
    this.currentController = null;
  }

  async load(id) {
    // Cancel previous load
    if (this.currentController) {
      this.currentController.abort();
    }

    // Create new controller
    this.currentController = new AbortController();
    const signal = this.currentController.signal;

    try {
      const response = await fetch(`/api/data/${id}`, { signal });
      const data = await response.json();

      // Only update if this is still the current request
      if (!signal.aborted) {
        this.updateUI(data);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Load failed:', error);
      }
    }
  }

  updateUI(data) {
    // Update UI with data
  }
}


// ============================================
// 14. EVENT LISTENER WITH ABORT SIGNAL
// ============================================

const controller = new AbortController();

document.addEventListener('click', (event) => {
  console.log('Clicked:', event.target);
}, { signal: controller.signal });

// Remove listener by aborting
controller.abort(); // Listener automatically removed


// ============================================
// 15. CUSTOM ABORTABLE OPERATION
// ============================================

class AbortableTask {
  constructor(task) {
    this.task = task;
    this.controller = new AbortController();
  }

  async execute() {
    try {
      return await this.task(this.controller.signal);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Task aborted');
        return null;
      }
      throw error;
    }
  }

  abort(reason) {
    this.controller.abort(reason);
  }
}

// Usage
const task = new AbortableTask(async (signal) => {
  for (let i = 0; i < 10; i++) {
    if (signal.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    await processItem(i);
  }
  return 'Complete';
});

task.execute().then(result => console.log(result));

// Can abort from outside
setTimeout(() => task.abort('Timeout'), 2000);
```

### Common Mistakes

- ❌ **Mistake:** Not checking for AbortError
  ```javascript
  // ❌ Generic error handling
  fetch('/api/data', { signal })
    .catch(error => {
      console.error('Request failed!'); // Logs for user cancellation too
    });

  // ✅ Check for AbortError
  fetch('/api/data', { signal })
    .catch(error => {
      if (error.name === 'AbortError') {
        console.log('User canceled request');
        return; // Don't show error to user
      }
      console.error('Request failed:', error);
    });
  ```

- ❌ **Mistake:** Reusing AbortController
  ```javascript
  // ❌ Can't reuse after abort!
  const controller = new AbortController();
  controller.abort();

  fetch('/api/data', { signal: controller.signal }); // Already aborted!

  // ✅ Create new controller for each operation
  const newController = new AbortController();
  fetch('/api/data', { signal: newController.signal });
  ```

- ❌ **Mistake:** Not cleaning up timeout
  ```javascript
  // ❌ Timeout keeps running
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 5000);

  fetch('/api/data', { signal: controller.signal }); // If completes in 1s, timeout still fires

  // ✅ Clear timeout on completion
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  fetch('/api/data', { signal: controller.signal })
    .finally(() => clearTimeout(timeoutId));
  ```

- ✅ **Best Practice:** Always handle AbortError
  ```javascript
  async function safeFetch(url, options = {}) {
    try {
      const response = await fetch(url, options);
      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        return null; // Silent cancellation
      }
      throw error; // Re-throw other errors
    }
  }
  ```

### Follow-up Questions

- "How would you implement a retry mechanism that respects abort signals?"
- "Can you cancel a promise that's already in progress?"
- "How do you combine multiple abort signals?"
- "What happens if you abort after the fetch completes but before json() finishes?"
- "How would you implement a cancelable debounce function?"

<details>
<summary><strong>🔍 Deep Dive</strong></summary>

**AbortController Implementation:** Creates AbortSignal (event target). When `abort()` called, signal fires `abort` event. Fetch API listens to signal, cancels HTTP request.

**Can You Cancel In-Progress Promises?** No! Promises are not cancelable. AbortController cancels the UNDERLYING OPERATION (HTTP request), not the promise. Promise still settles (rejects with AbortError).

**Combining Multiple Signals:**
```javascript
const combined = AbortSignal.any([signal1, signal2, signal3]);
// Aborts when ANY signal aborts
```

**Abort After Fetch But Before json():**
Both fetch and `.json()` respect abort signal. If aborted between them, `.json()` throws AbortError.

**Performance:** AbortController overhead ~50ns. Signal checking ~5ns per operation.

</details>

<details>
<summary><strong>🐛 Real-World Scenario</strong></summary>

**Problem:** Users navigated away but fetch requests continued, wasting bandwidth.

**Bug:**
```javascript
async function loadData() {
  const data = await fetch('/api/data');  // ❌ No cancellation
  updateUI(data);  // User already left page!
}

// User clicks → starts fetch → clicks away → fetch still running
```

**Impact:**
- Wasted bandwidth: 50GB/day
- Server load: 30% unnecessary requests
- Memory leaks: Responses kept in memory

**Fix - AbortController:**
```javascript
let controller;

async function loadData() {
  controller?.abort();  // Cancel previous request
  controller = new AbortController();

  try {
    const data = await fetch('/api/data', {
      signal: controller.signal
    });
    updateUI(data);
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('Request canceled');  // Expected
    } else {
      throw err;
    }
  }
}

// Cleanup on unmount:
onUnmount(() => controller?.abort());
```

**Metrics After Fix:**
- Wasted bandwidth: 0 (requests canceled immediately)
- Server load: 70% of previous (30% reduction)
- Memory leaks: 0

</details>

<details>
<summary><strong>⚖️ Trade-offs</strong></summary>

| Approach | Cancellation | Complexity | Browser Support | Best For |
|----------|-------------|------------|----------------|----------|
| **AbortController** | ✅ Native | Low | ✅ Modern browsers | Fetch, async ops |
| **Promise wrapper** | ⚠️ Fake (doesn't stop operation) | Medium | ✅ All | Legacy promises |
| **Timeout** | ✅ Time-based | Low | ✅ All | Slow operations |
| **Manual flag** | ⚠️ Check required | Medium | ✅ All | Custom logic |

**When to use AbortController:** Navigation changes, component unmount, user cancellation, timeouts.

</details>

<details>
<summary><strong>💬 Explain to Junior</strong></summary>

**AbortController Like a Stop Button:**

Imagine ordering food delivery:

**Without AbortController:**
```javascript
orderFood();  // Started delivery
// Changed mind? Too bad! Delivery continues
```

**With AbortController:**
```javascript
const controller = new AbortController();

orderFood({ signal: controller.signal });

// Changed mind?
controller.abort();  // ✅ Cancels delivery truck
```

**Real Example:**
```javascript
// Search autocomplete
searchInput.on('change', async (query) => {
  const controller = new AbortController();

  const results = await fetch(`/search?q=${query}`, {
    signal: controller.signal
  });

  // User types again? Old request aborted automatically
});
```

**Key Point:** You can't cancel a promise itself, but you CAN cancel what the promise is doing (HTTP request, timeout, etc.).

</details>

### Resources

- [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [MDN: AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)
- [Abortable fetch](https://developers.google.com/web/updates/2017/09/abortable-fetch)

---

## Question 3: Explain debouncing and throttling for async operations

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐⭐
**Time:** 10-12 minutes
**Companies:** Google, Meta, Amazon, Microsoft, Uber

### Question
What's the difference between debouncing and throttling? Implement both patterns for handling high-frequency async events like search inputs or scroll handlers.

### Answer

**Debouncing** delays execution until a pause in events occurs, while **throttling** limits execution to once per time interval.

**Key Concepts:**

1. **Debounce** - Execute only after N ms of inactivity (e.g., wait for user to stop typing)
2. **Throttle** - Execute at most once per N ms (e.g., limit scroll handler rate)
3. **Leading vs Trailing** - Execute at start or end of time window
4. **Cancellation** - Clear pending executions when needed
5. **Use Cases** - Search autocomplete (debounce), scroll/resize handlers (throttle)

### Code Example

```javascript
// ============================================
// 1. BASIC DEBOUNCE IMPLEMENTATION
// ============================================

function debounce(func, delay) {
  let timeoutId;

  return function(...args) {
    // Clear previous timeout
    clearTimeout(timeoutId);

    // Set new timeout
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// Usage
const search = debounce((query) => {
  console.log('Searching for:', query);
  fetch(`/api/search?q=${query}`);
}, 300);

input.addEventListener('input', (e) => search(e.target.value));
// Only executes 300ms after user stops typing


// ============================================
// 2. DEBOUNCE WITH LEADING EDGE
// ============================================

function debounce(func, delay, immediate = false) {
  let timeoutId;

  return function(...args) {
    const callNow = immediate && !timeoutId;

    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (!immediate) {
        func.apply(this, args);
      }
    }, delay);

    if (callNow) {
      func.apply(this, args);
    }
  };
}

// Execute immediately, then ignore for delay period
const saveImmediate = debounce(saveData, 1000, true);
button.addEventListener('click', saveImmediate);
// First click executes immediately, subsequent clicks ignored for 1s


// ============================================
// 3. ASYNC DEBOUNCE
// ============================================

function debounceAsync(func, delay) {
  let timeoutId;
  let rejectPrevious;

  return function(...args) {
    return new Promise((resolve, reject) => {
      // Reject previous pending call
      if (rejectPrevious) {
        rejectPrevious(new Error('Debounced'));
      }

      clearTimeout(timeoutId);

      rejectPrevious = reject;

      timeoutId = setTimeout(async () => {
        rejectPrevious = null;
        try {
          const result = await func.apply(this, args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };
}

// Usage
const debouncedFetch = debounceAsync(async (query) => {
  const response = await fetch(`/api/search?q=${query}`);
  return response.json();
}, 300);

async function handleInput(e) {
  try {
    const results = await debouncedFetch(e.target.value);
    displayResults(results);
  } catch (error) {
    if (error.message !== 'Debounced') {
      console.error('Search failed:', error);
    }
  }
}


// ============================================
// 4. BASIC THROTTLE IMPLEMENTATION
// ============================================

function throttle(func, limit) {
  let inThrottle;

  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// Usage
const handleScroll = throttle(() => {
  console.log('Scroll position:', window.scrollY);
  loadMoreItems();
}, 200);

window.addEventListener('scroll', handleScroll);
// Executes at most once every 200ms


// ============================================
// 5. THROTTLE WITH TRAILING CALL
// ============================================

function throttle(func, limit) {
  let inThrottle;
  let lastArgs;

  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;

        // Execute last call if any
        if (lastArgs) {
          func.apply(this, lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      // Save last call for trailing execution
      lastArgs = args;
    }
  };
}


// ============================================
// 6. ASYNC THROTTLE
// ============================================

function throttleAsync(func, limit) {
  let inThrottle = false;
  let pendingArgs = null;

  async function execute(args) {
    inThrottle = true;

    try {
      return await func.apply(this, args);
    } finally {
      setTimeout(() => {
        inThrottle = false;

        if (pendingArgs) {
          const args = pendingArgs;
          pendingArgs = null;
          execute(args);
        }
      }, limit);
    }
  }

  return function(...args) {
    if (!inThrottle) {
      return execute(args);
    } else {
      pendingArgs = args;
      return Promise.resolve();
    }
  };
}


// ============================================
// 7. SEARCH WITH DEBOUNCE + ABORT
// ============================================

function createDebouncedSearch(delay = 300) {
  let timeoutId;
  let controller;

  return async function search(query) {
    // Cancel previous timeout and request
    clearTimeout(timeoutId);
    if (controller) {
      controller.abort();
    }

    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        controller = new AbortController();

        try {
          const response = await fetch(`/api/search?q=${query}`, {
            signal: controller.signal
          });
          const results = await response.json();
          resolve(results);
        } catch (error) {
          if (error.name !== 'AbortError') {
            reject(error);
          }
        }
      }, delay);
    });
  };
}

// Usage
const debouncedSearch = createDebouncedSearch(300);

input.addEventListener('input', async (e) => {
  try {
    const results = await debouncedSearch(e.target.value);
    displayResults(results);
  } catch (error) {
    console.error('Search failed:', error);
  }
});


// ============================================
// 8. SCROLL THROTTLE WITH ABORTSIGNAL
// ============================================

function throttleScroll(callback, limit, signal) {
  let inThrottle = false;

  const handler = () => {
    if (signal?.aborted) return;

    if (!inThrottle) {
      callback();
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };

  return handler;
}

// Usage
const controller = new AbortController();

const handleScroll = throttleScroll(() => {
  loadMoreItems();
}, 200, controller.signal);

window.addEventListener('scroll', handleScroll, {
  signal: controller.signal
});

// Cleanup
controller.abort(); // Stops throttling and removes listener


// ============================================
// 9. RATE LIMITED API CALLS
// ============================================

class RateLimiter {
  constructor(maxCalls, perMilliseconds) {
    this.maxCalls = maxCalls;
    this.perMilliseconds = perMilliseconds;
    this.calls = [];
  }

  async execute(fn) {
    const now = Date.now();

    // Remove old calls outside time window
    this.calls = this.calls.filter(time => now - time < this.perMilliseconds);

    if (this.calls.length >= this.maxCalls) {
      // Wait until oldest call expires
      const oldestCall = this.calls[0];
      const waitTime = this.perMilliseconds - (now - oldestCall);

      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.execute(fn); // Retry
    }

    this.calls.push(now);
    return fn();
  }
}

// Usage: Max 5 calls per second
const limiter = new RateLimiter(5, 1000);

async function makeApiCall(id) {
  return limiter.execute(() =>
    fetch(`/api/user/${id}`).then(r => r.json())
  );
}

// These will be rate-limited
const users = await Promise.all(
  Array.from({ length: 100 }, (_, i) => makeApiCall(i))
);


// ============================================
// 10. DEBOUNCED RESIZE HANDLER
// ============================================

const debouncedResize = debounce(() => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  console.log(`Window resized to ${width}x${height}`);
  recalculateLayout();
}, 250);

window.addEventListener('resize', debouncedResize);


// ============================================
// 11. THROTTLED MOUSE MOVE
// ============================================

const throttledMouseMove = throttle((e) => {
  const x = e.clientX;
  const y = e.clientY;

  updateCursorPosition(x, y);
  checkHoverElements(x, y);
}, 50);

document.addEventListener('mousemove', throttledMouseMove);


// ============================================
// 12. CANCELABLE DEBOUNCE
// ============================================

function debounceWithCancel(func, delay) {
  let timeoutId;

  const debounced = function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };

  debounced.cancel = () => {
    clearTimeout(timeoutId);
  };

  debounced.flush = function(...args) {
    clearTimeout(timeoutId);
    func.apply(this, args);
  };

  return debounced;
}

// Usage
const save = debounceWithCancel(saveData, 2000);

input.addEventListener('input', () => save());

// Manual control
cancelButton.addEventListener('click', () => save.cancel());
saveButton.addEventListener('click', () => save.flush());


// ============================================
// 13. PROMISE QUEUE WITH THROTTLE
// ============================================

class ThrottledQueue {
  constructor(limit, interval) {
    this.limit = limit; // Max concurrent
    this.interval = interval; // Min time between batches
    this.queue = [];
    this.running = 0;
    this.lastBatch = 0;
  }

  async add(asyncFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ asyncFn, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.running >= this.limit) return;

    const now = Date.now();
    const timeSinceLastBatch = now - this.lastBatch;

    if (timeSinceLastBatch < this.interval) {
      setTimeout(() => this.process(), this.interval - timeSinceLastBatch);
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    this.running++;
    this.lastBatch = Date.now();

    try {
      const result = await item.asyncFn();
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    } finally {
      this.running--;
      this.process();
    }
  }
}

// Usage: Max 3 concurrent, min 500ms between batches
const queue = new ThrottledQueue(3, 500);

const tasks = Array.from({ length: 100 }, (_, i) =>
  queue.add(() => fetch(`/api/item/${i}`).then(r => r.json()))
);

const results = await Promise.all(tasks);
```

### Common Mistakes

- ❌ **Mistake:** Confusing debounce and throttle
  ```javascript
  // ❌ Using debounce for scroll (executes only after scrolling stops)
  const handleScroll = debounce(() => {
    updateUI(); // Only runs when scrolling stops!
  }, 200);

  // ✅ Use throttle for continuous updates
  const handleScroll = throttle(() => {
    updateUI(); // Runs every 200ms while scrolling
  }, 200);
  ```

- ❌ **Mistake:** Not cleaning up debounce/throttle
  ```javascript
  // ❌ Memory leak!
  useEffect(() => {
    const debouncedFn = debounce(fn, 300);
    window.addEventListener('scroll', debouncedFn);
  }, []); // No cleanup!

  // ✅ Clean up properly
  useEffect(() => {
    const debouncedFn = debounce(fn, 300);
    window.addEventListener('scroll', debouncedFn);

    return () => {
      window.removeEventListener('scroll', debouncedFn);
      debouncedFn.cancel?.(); // Cancel pending calls
    };
  }, []);
  ```

- ❌ **Mistake:** Creating new debounced function on each render
  ```javascript
  // ❌ Creates new function every render!
  function Component() {
    const handleSearch = debounce((query) => {
      search(query);
    }, 300);

    return <input onChange={e => handleSearch(e.target.value)} />;
  }

  // ✅ Use useCallback or useMemo
  function Component() {
    const handleSearch = useCallback(
      debounce((query) => search(query), 300),
      []
    );

    return <input onChange={e => handleSearch(e.target.value)} />;
  }
  ```

- ✅ **Best Practice:** Use libraries like Lodash
  ```javascript
  import { debounce, throttle } from 'lodash';

  const debouncedSearch = debounce(search, 300);
  const throttledScroll = throttle(handleScroll, 200);
  ```

### Follow-up Questions

- "When would you use debounce vs throttle?"
- "How would you implement a debounce with maximum wait time?"
- "Can you combine debouncing with AbortController?"
- "How does requestIdleCallback differ from throttling?"
- "What's the difference between leading and trailing execution?"

<details>
<summary><strong>🔍 Deep Dive</strong></summary>

**Debounce vs Throttle:**
- **Debounce**: Wait for silence (e.g., search after user stops typing)
- **Throttle**: Limit frequency (e.g., scroll handler max once per 100ms)

**Leading vs Trailing:**
- **Leading**: Execute immediately, ignore subsequent calls
- **Trailing**: Execute after delay (default)

**Max Wait Time:** Debounce with max wait ensures function runs eventually even if user never stops (prevents infinite delay).

**requestIdleCallback vs Throttle:**
- `requestIdleCallback`: Runs when browser idle (variable timing, ~10-50ms)
- Throttle: Fixed interval (predictable, e.g., every 100ms)

**Performance:** Debounce/throttle overhead ~100ns per call (timeout management).

</details>

<details>
<summary><strong>🐛 Real-World Scenario</strong></summary>

**Problem:** Resize handler froze browser during window resize.

**Bug:**
```javascript
window.addEventListener('resize', () => {
  recalculateLayout();  // ❌ Fires 100+ times per second!
  updateCharts();
  reflow();
});
```

**Impact:**
- FPS: 5 (target: 60)
- Browser frozen during resize
- User complaints: "App is laggy"

**Fix - Throttle:**
```javascript
const throttledResize = throttle(() => {
  recalculateLayout();
  updateCharts();
  reflow();
}, 100);  // Max once per 100ms

window.addEventListener('resize', throttledResize);
```

**Metrics After Fix:**
- FPS: 60 (smooth)
- Handler calls: 95% reduction (100/s → 10/s)
- User feedback: "Smooth now"

</details>

<details>
<summary><strong>⚖️ Trade-offs</strong></summary>

| Technique | Use Case | Responsiveness | CPU Usage | Best For |
|-----------|----------|---------------|-----------|----------|
| **Debounce** | Search input | Low (delayed) | ✅ Minimal | User input that settles |
| **Throttle** | Scroll handler | High (regular updates) | ⚠️ Moderate | Continuous events |
| **requestIdleCallback** | Analytics | Low (when idle) | ✅ Minimal | Non-critical tasks |
| **requestAnimationFrame** | Animations | High (60fps) | ⚠️ Moderate | Visual updates |

**Debounce when:** User finishes action (search, form input, window resize complete)

**Throttle when:** Continuous updates needed (scroll position, mouse move, progress bar)

</details>

<details>
<summary><strong>💬 Explain to Junior</strong></summary>

**Debounce vs Throttle Like Elevators:**

**Debounce = Elevator Waiting for More People:**
```javascript
// Waits 5 seconds after LAST person enters
// If someone enters at 4.9s, reset timer to 5s again
debounce(closeElevator, 5000);
```

**Throttle = Elevator Departing Every 5 Minutes:**
```javascript
// Departs every 5 min, no matter what
// People after departure wait for next cycle
throttle(closeElevator, 300000);
```

**Real Examples:**

**Debounce - Search:**
```javascript
// Wait 300ms after user STOPS typing
const search = debounce(async (query) => {
  const results = await fetch(`/search?q=${query}`);
}, 300);

input.on('keyup', (e) => search(e.target.value));
```

**Throttle - Scroll:**
```javascript
// Update scroll position max once per 100ms
const updateScrollPos = throttle(() => {
  console.log('Scroll position:', window.scrollY);
}, 100);

window.addEventListener('scroll', updateScrollPos);
```

</details>

### Resources

- [Debouncing and Throttling Explained](https://css-tricks.com/debouncing-throttling-explained-examples/)
- [Lodash: debounce](https://lodash.com/docs/#debounce)
- [Lodash: throttle](https://lodash.com/docs/#throttle)

---

## Question 4: How do you prevent memory leaks in async code?

**Difficulty:** 🔴 Hard
**Frequency:** ⭐⭐⭐⭐
**Time:** 8-10 minutes
**Companies:** Google, Meta, Amazon, Microsoft

### Question
What causes memory leaks in async JavaScript? How do you detect and prevent them, especially in long-running applications?

### Answer

**Memory leaks in async code** occur when references to objects are unintentionally retained, preventing garbage collection.

**Key Concepts:**

1. **Event Listeners** - Not removing listeners when components unmount
2. **Timers** - setInterval/setTimeout not being cleared
3. **Promises** - Holding references in closures after component unmounts
4. **Subscriptions** - Not unsubscribing from observables/streams
5. **Circular References** - Objects referencing each other preventing GC

### Code Example

```javascript
// ============================================
// 1. EVENT LISTENER LEAK
// ============================================

// ❌ Memory leak - listener never removed
class Component {
  constructor() {
    window.addEventListener('resize', this.handleResize);
  }

  handleResize = () => {
    console.log('Resized');
  };
}

// ✅ Proper cleanup
class Component {
  constructor() {
    this.controller = new AbortController();

    window.addEventListener('resize', this.handleResize, {
      signal: this.controller.signal
    });
  }

  handleResize = () => {
    console.log('Resized');
  };

  destroy() {
    this.controller.abort(); // Removes all listeners
  }
}


// ============================================
// 2. TIMER LEAK
// ============================================

// ❌ setInterval never cleared
function startPolling() {
  setInterval(() => {
    fetch('/api/status').then(r => r.json());
  }, 5000);
}

// ✅ Clear on cleanup
function startPolling() {
  const intervalId = setInterval(() => {
    fetch('/api/status').then(r => r.json());
  }, 5000);

  return () => clearInterval(intervalId);
}

const cleanup = startPolling();
// Later: cleanup();


// ============================================
// 3. PROMISE LEAK (setState after unmount)
// ============================================

// ❌ React: setState on unmounted component
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(r => r.json())
      .then(data => setUser(data)); // Leak if component unmounts!
  }, [userId]);

  return <div>{user?.name}</div>;
}

// ✅ Cancel on unmount
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/users/${userId}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          setUser(data);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return <div>{user?.name}</div>;
}


// ============================================
// 4. CLOSURE LEAK
// ============================================

// ❌ Closures holding large objects
function createHandler() {
  const largeData = new Array(1000000).fill('data');

  return async () => {
    // Handler holds reference to largeData forever
    await fetch('/api/endpoint');
  };
}

// ✅ Release references
function createHandler() {
  let largeData = new Array(1000000).fill('data');

  return async () => {
    const data = largeData; // Copy reference
    largeData = null; // Release original

    await processData(data);
  };
}


// ============================================
// 5. WEAK REFERENCES FOR CACHING
// ============================================

// ❌ Regular Map holds references forever
const cache = new Map();

async function fetchUser(id) {
  if (cache.has(id)) {
    return cache.get(id);
  }

  const user = await fetch(`/api/user/${id}`).then(r => r.json());
  cache.set(id, user);
  return user;
}

// ✅ WeakMap allows garbage collection
const cache = new WeakMap();

async function fetchUser(userObj) {
  if (cache.has(userObj)) {
    return cache.get(userObj);
  }

  const data = await fetch(`/api/user/${userObj.id}`).then(r => r.json());
  cache.set(userObj, data);
  return data;
}
```

### Common Mistakes

- ❌ **Mistake:** Not cleaning up subscriptions
  ```javascript
  // ❌ Subscription leak
  useEffect(() => {
    const subscription = observable.subscribe(data => {
      updateUI(data);
    });
    // Missing cleanup!
  }, []);

  // ✅ Unsubscribe on cleanup
  useEffect(() => {
    const subscription = observable.subscribe(data => {
      updateUI(data);
    });

    return () => subscription.unsubscribe();
  }, []);
  ```

### Follow-up Questions

- "How do you detect memory leaks in production?"
- "What tools would you use to profile memory usage?"
- "How do WeakMap and WeakSet help prevent leaks?"

<details>
<summary><strong>🔍 Deep Dive</strong></summary>

**Common Memory Leak Patterns in Async Code:**
1. **Event listeners not removed:** `addEventListener` without `removeEventListener`
2. **Timers not cleared:** `setInterval` without `clearInterval`
3. **Closures holding references:** Large objects captured in async callbacks
4. **Promise chains:** Uncaught promise keeps references alive
5. **Global variables:** Accidental global assignments in async functions

**WeakMap/WeakSet Benefits:**
- Keys are weak references (garbage collected when no other references exist)
- Perfect for caching data tied to DOM elements (auto-cleaned when element removed)

**Detection Tools:**
- Chrome DevTools Memory Profiler
- Heap snapshots (compare before/after)
- Allocation timeline

**Performance:** Memory leak detection overhead ~10-50ms per snapshot (production monitoring should be throttled).

</details>

<details>
<summary><strong>🐛 Real-World Scenario</strong></summary>

**Problem:** SPA memory grew from 50MB → 1.5GB after 2 hours of use.

**Bug:**
```javascript
function setupPolling() {
  setInterval(async () => {
    const data = await fetchLargeDataset();  // 10MB response
    processData(data);
  }, 5000);

  // ❌ No cleanup! Interval runs forever, holds data references
}

// Called on every page navigation
router.on('navigate', setupPolling);
```

**Impact:**
- Heap size: 50MB → 1.5GB (after 100 navigations)
- Browser tab crashes after 2 hours
- User complaints: "App becomes unusable"

**Fix - Cleanup:**
```javascript
let intervalId;

function setupPolling() {
  // Clear previous interval
  if (intervalId) clearInterval(intervalId);

  intervalId = setInterval(async () => {
    const data = await fetchLargeDataset();
    processData(data);
  }, 5000);
}

// Cleanup on unmount
function cleanup() {
  clearInterval(intervalId);
  intervalId = null;
}

router.on('leave', cleanup);
```

**Metrics After Fix:**
- Heap size: Stable at 50-60MB
- No crashes after 8+ hours
- User feedback: "App stays fast"

</details>

<details>
<summary><strong>⚖️ Trade-offs</strong></summary>

| Technique | Memory Safety | Performance | Complexity | Best For |
|-----------|--------------|-------------|------------|----------|
| **Manual cleanup** | ✅ Full control | ✅ Fast | Medium | Timers, listeners |
| **WeakMap/WeakSet** | ✅ Auto GC | ✅ Fast | Low | DOM-tied caches |
| **AbortController** | ✅ Auto cleanup | ✅ Fast | Low | Fetch requests |
| **FinalizationRegistry** | ✅ Auto cleanup | ⚠️ Slow (GC-dependent) | High | Resource cleanup |
| **Memory profiling** | ⚠️ Detection only | ❌ Slow (dev tool) | Low | Debugging |

**Best Practice:** Always cleanup in component unmount/page leave handlers.

</details>

<details>
<summary><strong>💬 Explain to Junior</strong></summary>

**Memory Leaks Like Forgetting to Turn Off Lights:**

When you leave a room, turn off the lights. In JavaScript async code, "leaving a room" = unmounting component or navigating away.

**Common Leaks:**

**1. Event Listeners (Lights Left On):**
```javascript
// ❌ Bad: Listener never removed
element.addEventListener('click', handler);
// Component unmounts → listener still exists!

// ✅ Good: Remove listener
element.addEventListener('click', handler);
onUnmount(() => element.removeEventListener('click', handler));
```

**2. Intervals (Water Running):**
```javascript
// ❌ Bad: Interval runs forever
const id = setInterval(() => fetchData(), 1000);

// ✅ Good: Clear interval
const id = setInterval(() => fetchData(), 1000);
onUnmount(() => clearInterval(id));
```

**3. Closures Holding Large Data (Hoarding):**
```javascript
// ❌ Bad: hugeData kept in memory
async function process() {
  const hugeData = await fetchLarge();  // 100MB

  setInterval(() => {
    // Closure holds hugeData forever!
    console.log(hugeData.length);
  }, 1000);
}

// ✅ Good: Only keep what you need
async function process() {
  const hugeData = await fetchLarge();
  const length = hugeData.length;  // Extract small value

  setInterval(() => {
    console.log(length);  // Only holds number, not 100MB
  }, 1000);
}
```

**Rule:** Always cleanup async operations when done (remove listeners, clear timers, abort requests).

</details>

### Resources

- [MDN: Memory Management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management)
- [Debugging Memory Leaks](https://developer.chrome.com/docs/devtools/memory-problems/)

---

