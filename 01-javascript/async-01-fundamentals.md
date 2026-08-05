# Asynchronous JavaScript Fundamentals

> **Focus**: JavaScript fundamentals and advanced concepts

---

## Question 1: Explain synchronous vs asynchronous code execution in JavaScript

**Difficulty:** 🟢 Easy
**Frequency:** ⭐⭐⭐⭐⭐
**Time:** 5-7 minutes
**Companies:** Google, Meta, Amazon, Microsoft, Netflix

### Question

What is the difference between synchronous and asynchronous code execution in JavaScript? Why is asynchronous programming important for web applications?

### Answer

**Synchronous execution:**

- Code runs **sequentially**, one line at a time
- Each operation must **complete** before the next one starts
- **Blocks** the main thread while waiting for operations to finish
- Simple and predictable flow of execution

**Asynchronous execution:**

- Code can run **concurrently** without blocking
- Operations can be **initiated** and continue in the background
- Allows the program to **continue** while waiting for time-consuming tasks
- Uses callbacks, promises, or async/await to handle results

**Why asynchronous is crucial:**

- **User experience:** Prevents UI freezing during network requests or heavy computations
- **Performance:** Makes efficient use of I/O operations (file reads, API calls)
- **Responsiveness:** Application remains interactive while waiting for operations
- **Scalability:** Handles multiple operations simultaneously without spawning threads

### Code Example

```javascript
// ============================================
// Example 1: Synchronous blocking code
// ============================================
console.log('Start');

function slowOperation() {
  // Simulating slow operation with blocking loop
  const start = Date.now();
  while (Date.now() - start < 3000) {
    // Blocks for 3 seconds
  }
  return 'Done';
}

console.log(slowOperation()); // Blocks here for 3 seconds
console.log('End');

// Output (takes 3+ seconds):
// Start
// Done (after 3 seconds)
// End


// ============================================
// Example 2: Asynchronous non-blocking code
// ============================================
console.log('Start');

setTimeout(() => {
  console.log('Timeout callback');
}, 3000);

console.log('End');

// Output (immediate):
// Start
// End
// Timeout callback (after 3 seconds)


// ============================================
// Example 3: Real-world API call comparison
// ============================================

// ❌ Synchronous approach (if it existed - hypothetical)
// function getUserSync(userId) {
//   const response = fetch(`/api/user/${userId}`); // Would block
//   return response.json();
// }
// console.log('Before');
// const user = getUserSync(123); // Blocks entire app
// console.log('After', user);

// ✅ Asynchronous approach (actual implementation)
function getUserAsync(userId) {
  return fetch(`/api/user/${userId}`)
    .then(response => response.json());
}

console.log('Before');
getUserAsync(123)
  .then(user => console.log('User:', user));
console.log('After'); // Executes immediately

// Output:
// Before
// After
// User: { id: 123, name: '...' } (when request completes)


// ============================================
// Example 4: Multiple async operations
// ============================================
console.log('Start fetching data...');

// All three requests start simultaneously
Promise.all([
  fetch('/api/user/1').then(r => r.json()),
  fetch('/api/user/2').then(r => r.json()),
  fetch('/api/user/3').then(r => r.json())
])
.then(users => {
  console.log('All users:', users);
});

console.log('Requests sent, continuing...');

// Output:
// Start fetching data...
// Requests sent, continuing...
// All users: [...] (when all complete)


// ============================================
// Example 5: Async/await syntax (still asynchronous)
// ============================================
async function loadUserData(userId) {
  console.log('Loading user...');

  // Non-blocking despite looking synchronous
  const user = await fetch(`/api/user/${userId}`).then(r => r.json());

  console.log('User loaded:', user.name);
  return user;
}

console.log('Before');
loadUserData(123); // Returns promise immediately
console.log('After');

// Output:
// Before
// Loading user...
// After
// User loaded: John (when request completes)


// ============================================
// Example 6: File reading comparison
// ============================================

// Node.js synchronous file read (blocks)
const fs = require('fs');

console.log('Start');
const content = fs.readFileSync('file.txt', 'utf8'); // Blocks
console.log('File content:', content);
console.log('End');

// Node.js asynchronous file read (non-blocking)
console.log('Start');
fs.readFile('file.txt', 'utf8', (err, content) => {
  console.log('File content:', content); // Executes later
});
console.log('End'); // Executes immediately

// Output:
// Start
// End
// File content: ... (when read completes)


// ============================================
// Example 7: UI responsiveness example
// ============================================

// ❌ Synchronous: Freezes UI
document.getElementById('btn').addEventListener('click', () => {
  // Heavy computation blocks UI
  let result = 0;
  for (let i = 0; i < 1000000000; i++) {
    result += i;
  }
  console.log(result); // UI frozen during loop
});

// ✅ Asynchronous: Keeps UI responsive
document.getElementById('btn').addEventListener('click', async () => {
  console.log('Processing...');

  // Offload to Web Worker or use setTimeout
  await new Promise(resolve => {
    setTimeout(() => {
      let result = 0;
      for (let i = 0; i < 1000000000; i++) {
        result += i;
      }
      console.log(result);
      resolve();
    }, 0);
  });

  console.log('Done!');
});


// ============================================
// Example 8: Sequential vs concurrent
// ============================================

// Sequential (slower - operations wait for each other)
async function loadSequential() {
  console.time('sequential');

  const user = await fetch('/api/user/1').then(r => r.json()); // Wait
  const posts = await fetch('/api/posts/1').then(r => r.json()); // Wait
  const comments = await fetch('/api/comments/1').then(r => r.json()); // Wait

  console.timeEnd('sequential'); // ~900ms (300ms each)
  return { user, posts, comments };
}

// Concurrent (faster - operations run in parallel)
async function loadConcurrent() {
  console.time('concurrent');

  // Start all requests simultaneously
  const [user, posts, comments] = await Promise.all([
    fetch('/api/user/1').then(r => r.json()),
    fetch('/api/posts/1').then(r => r.json()),
    fetch('/api/comments/1').then(r => r.json())
  ]);

  console.timeEnd('concurrent'); // ~300ms (all parallel)
  return { user, posts, comments };
}


// ============================================
// Example 9: Error handling comparison
// ============================================

// Synchronous error handling
try {
  const result = JSON.parse('invalid json'); // Throws immediately
  console.log(result);
} catch (error) {
  console.error('Sync error:', error.message);
}

// Asynchronous error handling
fetch('/api/data')
  .then(response => response.json())
  .catch(error => {
    console.error('Async error:', error.message);
  });

// With async/await
async function loadData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Async error:', error.message);
  }
}


// ============================================
// Example 10: Real-world patterns
// ============================================

// Loading state management with async
class DataLoader {
  constructor() {
    this.loading = false;
    this.data = null;
    this.error = null;
  }

  async load(url) {
    this.loading = true;
    this.error = null;

    try {
      const response = await fetch(url);
      this.data = await response.json();
    } catch (error) {
      this.error = error.message;
    } finally {
      this.loading = false;
    }

    return this.data;
  }
}

const loader = new DataLoader();

// UI remains responsive while loading
loader.load('/api/users').then(users => {
  console.log('Loaded:', users);
});

console.log('Loading state:', loader.loading); // true immediately
```

### Common Mistakes

- ❌ **Mistake:** Using synchronous APIs in the browser (blocking UI)

  ```javascript
  // No synchronous fetch exists (good thing!)
  // This would freeze the entire browser
  const data = fetchSync('/api/data'); // Doesn't exist
  ```

- ❌ **Mistake:** Not understanding that async code doesn't execute immediately

  ```javascript
  let user = null;
  fetch('/api/user').then(data => {
    user = data;
  });
  console.log(user); // null! Promise hasn't resolved yet
  ```

- ❌ **Mistake:** Using async when not needed (adds unnecessary complexity)

  ```javascript
  // Overkill for synchronous operations
  async function add(a, b) {
    return a + b; // No async operation here
  }
  ```

- ✅ **Correct:** Understand execution order and use async for I/O operations

  ```javascript
  let user = null;

  fetch('/api/user')
    .then(data => {
      user = data;
      console.log(user); // Correct: logs when data arrives
    });

  console.log(user); // null - this runs first
  ```

<details>
<summary><strong>🔍 Deep Dive: How V8 Handles Async Operations</strong></summary>

**V8 Engine's Async Execution Model:**

JavaScript runs in a **single-threaded** environment, but achieves concurrency through the event loop and offloading I/O operations to the host environment (browser or Node.js).

**Key Components:**

1. **Call Stack** (V8's execution stack):
   - Tracks function execution contexts
   - Single-threaded: one thing at a time
   - LIFO structure

2. **Web APIs / C++ APIs** (Browser/Node.js):
   - setTimeout/setInterval
   - fetch/XMLHttpRequest
   - File system operations (Node.js)
   - These run **outside** the JavaScript thread

3. **Callback Queue & Microtask Queue**:
   - Callbacks wait here after async operations complete
   - Event loop pushes callbacks to stack when empty

**Internal Flow:**

```javascript
// What happens internally:

// 1. Synchronous code execution
console.log('Start'); // → Call stack: [console.log]
                      // → Output: "Start"
                      // → Stack: []

// 2. Async operation initiated
setTimeout(() => {
  console.log('Timeout');
}, 1000);
// → setTimeout handler passed to Web API
// → Continues immediately (non-blocking)
// → Stack: []

// 3. More synchronous code
console.log('End'); // → Stack: [console.log]
                    // → Output: "End"
                    // → Stack: []

// 4. After 1000ms, Web API adds callback to queue
// → Callback Queue: [() => console.log('Timeout')]

// 5. Event loop checks: stack empty? yes → push callback
// → Stack: [callback, console.log]
// → Output: "Timeout"
```

**V8's Promise Implementation:**

```javascript
// Promises use microtask queue (higher priority)

fetch('/api/data')
  .then(response => response.json())
  .then(data => console.log(data));

// Internal flow:
// 1. fetch() returns Promise object immediately
// 2. Network request handled by browser (C++ code)
// 3. .then() callbacks registered in Promise's internal slots
// 4. When response arrives, callbacks → microtask queue
// 5. Event loop processes microtasks before macrotasks
```

**Memory & Performance:**

- **Synchronous blocking**: Stack fills up, can overflow
- **Asynchronous**: Stack clears, callbacks stored in heap
- **Memory efficiency**: Callbacks use less memory than blocked stack frames
- **Time complexity**: O(1) for adding to queue, O(n) for processing n callbacks

**V8 Optimization - TurboFan:**

```javascript
// V8 can optimize async patterns if consistent

// Optimizable (consistent shape):
async function fetchUser(id) {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

// Multiple calls → TurboFan generates optimized machine code
for (let i = 0; i < 1000; i++) {
  fetchUser(i); // Optimized after ~10 iterations
}
```

</details>

<details>
<summary><strong>🐛 Real-World Scenario: UI Freeze Bug</strong></summary>

**Scenario**: Your e-commerce site's product filter is freezing the UI for 3-5 seconds when users select categories. Users are complaining and leaving the site.

**The Bug:**

```javascript
// ❌ PROBLEM: Synchronous blocking code
function filterProducts(category) {
  const filtered = [];

  // Blocks UI for large datasets (10,000+ products)
  for (let i = 0; i < allProducts.length; i++) {
    if (allProducts[i].category === category) {
      // Expensive computation per product
      const score = calculateRelevanceScore(allProducts[i]);
      if (score > 0.5) {
        filtered.push(allProducts[i]);
      }
    }
  }

  updateUI(filtered); // UI frozen until this completes
}

// With 10,000 products: ~4 seconds freeze
button.addEventListener('click', () => {
  filterProducts('electronics'); // UI FREEZES
});
```

**Debugging Steps:**

1. **Open Chrome DevTools Performance Tab**:

   ```javascript
   // Record performance profile
   // See: Long Task warning (>50ms)
   // Main thread blocked for 4000ms
   ```

2. **Identify the bottleneck**:

   ```javascript
   console.time('filter');
   filterProducts('electronics');
   console.timeEnd('filter'); // "filter: 4234ms"
   ```

3. **Solution 1: Break into chunks (async)**:

   ```javascript
   // ✅ FIX: Process in chunks with async breaks
   async function filterProductsAsync(category) {
     const filtered = [];
     const chunkSize = 100;

     for (let i = 0; i < allProducts.length; i += chunkSize) {
       const chunk = allProducts.slice(i, i + chunkSize);

       // Process chunk synchronously
       for (const product of chunk) {
         if (product.category === category) {
           const score = calculateRelevanceScore(product);
           if (score > 0.5) {
             filtered.push(product);
           }
         }
       }

       // Yield to event loop every 100 items
       if (i % 500 === 0) {
         updateProgress((i / allProducts.length) * 100);
         await new Promise(resolve => setTimeout(resolve, 0));
       }
     }

     updateUI(filtered);
   }

   // Now: 50ms chunks, UI responsive, shows progress
   button.addEventListener('click', async () => {
     showLoader(true);
     await filterProductsAsync('electronics');
     showLoader(false);
   });
   ```

4. **Solution 2: Web Worker (best for heavy computation)**:

   ```javascript
   // ✅ BEST: Offload to Web Worker (separate thread)

   // worker.js
   self.addEventListener('message', (e) => {
     const { products, category } = e.data;
     const filtered = products.filter(p => {
       if (p.category === category) {
         const score = calculateRelevanceScore(p);
         return score > 0.5;
       }
       return false;
     });

     self.postMessage(filtered);
   });

   // main.js
   const worker = new Worker('worker.js');

   button.addEventListener('click', () => {
     showLoader(true);

     worker.postMessage({
       products: allProducts,
       category: 'electronics'
     });

     worker.addEventListener('message', (e) => {
       updateUI(e.data);
       showLoader(false);
     });

     // UI remains fully responsive!
   });
   ```

**Performance Comparison:**

| Approach | Time | UI Blocked? | Complexity |
|----------|------|-------------|------------|
| Sync (original) | 4000ms | ✅ Yes | Low |
| Async chunks | 4200ms | ❌ No (50ms chunks) | Medium |
| Web Worker | 3800ms | ❌ No | High |

**Real Production Fix Applied:**

- **Before**: 4s freeze, 40% bounce rate
- **After**: Async chunks with progress bar
- **Result**: 0s freeze, <5% bounce rate, 200% conversion increase

</details>

<details>
<summary><strong>⚖️ Trade-offs: Sync vs Async vs Parallel</strong></summary>

**1. Synchronous vs Asynchronous:**

| Aspect | Synchronous | Asynchronous |
|--------|-------------|--------------|
| **Execution** | Sequential, blocking | Concurrent, non-blocking |
| **Complexity** | Simple, predictable | Complex, requires careful handling |
| **Performance** | Poor for I/O | Excellent for I/O |
| **Memory** | Stack frames accumulate | Callbacks in heap |
| **Use Case** | CPU-bound, small tasks | I/O-bound, network calls |

```javascript
// Benchmark: File reading (1MB file)

// Synchronous (Node.js):
console.time('sync');
const data = fs.readFileSync('large-file.txt', 'utf8');
console.timeEnd('sync'); // ~50ms, blocks thread

// Asynchronous:
console.time('async');
fs.readFile('large-file.txt', 'utf8', (err, data) => {
  console.timeEnd('async'); // ~50ms (measured when the read completes)
});
console.log('Continues immediately, does not wait for the read'); // Runs right away
```

**2. Sequential vs Concurrent Async:**

```javascript
const urls = ['/api/user/1', '/api/user/2', '/api/user/3'];

// Sequential: 900ms (300ms × 3)
async function sequential() {
  console.time('sequential');
  const results = [];

  for (const url of urls) {
    const response = await fetch(url); // Waits for each
    results.push(await response.json());
  }

  console.timeEnd('sequential'); // ~900ms
  return results;
}

// Concurrent: 300ms (all parallel)
async function concurrent() {
  console.time('concurrent');

  const promises = urls.map(url =>
    fetch(url).then(r => r.json())
  );

  const results = await Promise.all(promises);

  console.timeEnd('concurrent'); // ~300ms (3x faster!)
  return results;
}
```

**Trade-off Analysis:**

| Method | Time | Memory | Error Handling | Use When |
|--------|------|--------|----------------|----------|
| Sequential | Slow | Low | Easy (try-catch per request) | Dependencies between requests |
| Concurrent | Fast | Higher | Complex (one failure stops all) | Independent requests |
| Promise.allSettled | Fast | Higher | Best (continues on failure) | Want all results regardless |

**3. Async/Await vs Promises vs Callbacks:**

```javascript
// Callbacks: Callback hell
getData(url, (err, data) => {
  if (err) handleError(err);
  processData(data, (err, result) => {
    if (err) handleError(err);
    saveData(result, (err) => {
      if (err) handleError(err);
      console.log('Done');
    });
  });
});

// Promises: Better, chainable
getData(url)
  .then(data => processData(data))
  .then(result => saveData(result))
  .then(() => console.log('Done'))
  .catch(handleError);

// Async/await: Most readable
async function workflow() {
  try {
    const data = await getData(url);
    const result = await processData(data);
    await saveData(result);
    console.log('Done');
  } catch (err) {
    handleError(err);
  }
}
```

| Approach | Readability | Error Handling | Browser Support | Debuggability |
|----------|-------------|----------------|-----------------|---------------|
| Callbacks | Poor | Manual | All | Hard |
| Promises | Good | .catch() | Modern | Good |
| Async/await | Excellent | try-catch | Modern | Excellent |

**4. Performance Considerations:**

```javascript
// Benchmark: 1000 operations

// Sync: Blocks UI
console.time('sync');
for (let i = 0; i < 1000; i++) {
  heavyComputation(); // Each blocks
}
console.timeEnd('sync'); // ~5000ms, UI frozen

// Async (microtasks): Still blocks rendering
console.time('microtasks');
const promises = [];
for (let i = 0; i < 1000; i++) {
  promises.push(Promise.resolve().then(() => heavyComputation()));
}
await Promise.all(promises);
console.timeEnd('microtasks'); // ~5000ms, UI frozen

// Async (macrotasks): Allows rendering
console.time('macrotasks');
async function processWithBreaks() {
  for (let i = 0; i < 1000; i++) {
    heavyComputation();

    if (i % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
}
await processWithBreaks();
console.timeEnd('macrotasks'); // ~5100ms, UI responsive!
```

**Memory Trade-offs:**

```javascript
// Sync: Stack-based (limited)
function recursiveSync(n) {
  if (n === 0) return;
  recursiveSync(n - 1);
}
recursiveSync(10000); // Stack overflow!

// Async: Heap-based (scalable)
async function recursiveAsync(n) {
  if (n === 0) return;
  await new Promise(resolve => setTimeout(resolve, 0));
  return recursiveAsync(n - 1);
}
recursiveAsync(100000); // Works! Each call uses new stack
```

</details>

<details>
<summary><strong>💬 Explain to Junior: Sync vs Async</strong></summary>

**Simple Explanation:**

Imagine you're cooking dinner:

**Synchronous (Blocking):**

- You put pasta in boiling water
- You stand there and watch it for 10 minutes
- You can't do anything else
- After 10 minutes, you start chopping vegetables
- After that, you start cooking sauce
- **Total time**: 10 + 5 + 8 = 23 minutes

```javascript
console.log('Start cooking pasta'); // Stand and wait
wait(10); // Do nothing for 10 minutes
console.log('Start chopping vegetables'); // Stand and wait
wait(5);
console.log('Start cooking sauce');
wait(8);
console.log('Dinner ready!'); // 23 minutes later
```

**Asynchronous (Non-blocking):**

- You put pasta in boiling water
- **While it's cooking**, you start chopping vegetables
- **While pasta is still cooking**, you start the sauce
- Everything finishes around the same time
- **Total time**: ~10 minutes (everything overlaps!)

```javascript
console.log('Start cooking pasta');
setTimeout(() => console.log('Pasta ready!'), 10000);

console.log('Start chopping vegetables');
setTimeout(() => console.log('Veggies ready!'), 5000);

console.log('Start cooking sauce');
setTimeout(() => console.log('Sauce ready!'), 8000);

// All happen concurrently!
// Output:
// Start cooking pasta
// Start chopping vegetables
// Start cooking sauce
// (5 sec) Veggies ready!
// (8 sec) Sauce ready!
// (10 sec) Pasta ready!
```

**Analogy for a PM:**

"Think of a restaurant:

**Synchronous approach**:

- Waiter takes order from Table 1
- Waiter waits at kitchen until food is ready (5 minutes)
- Waiter serves Table 1
- Only then can waiter help Table 2
- **Result**: One table at a time, others wait

**Asynchronous approach**:

- Waiter takes order from Table 1, gives to kitchen
- Immediately helps Table 2 (doesn't wait!)
- Helps Table 3, 4, 5...
- When Table 1's food is ready, kitchen alerts waiter
- Waiter serves Table 1
- **Result**: Many tables served simultaneously

JavaScript is the waiter - it can start tasks and come back when they're done, instead of waiting around!"

**Code Example for Beginners:**

```javascript
// WRONG: Trying to use result immediately
let userData = null;

fetch('/api/user').then(data => {
  userData = data;
});

console.log(userData); // null! (Promise hasn't resolved yet)

// RIGHT: Wait for result
fetch('/api/user')
  .then(data => {
    console.log(data); // ✅ Data is here now!
    // Use data here
  });

// OR with async/await (easier):
async function getUser() {
  const userData = await fetch('/api/user').then(r => r.json());
  console.log(userData); // ✅ Data is here!
  return userData;
}
```

**Visual Timeline:**

```javascript
console.log('A'); // → Output immediately

setTimeout(() => {
  console.log('B'); // → Output after 2 seconds
}, 2000);

console.log('C'); // → Output immediately

// Timeline:
// 0ms:    A → C
// 2000ms: B

// NOT: A → (wait 2 sec) → B → C
// BUT: A → C → (wait 2 sec) → B
```

**Common "Aha!" Moment:**

```javascript
// Quiz: What order do these print?

console.log('1');

setTimeout(() => console.log('2'), 0); // Even with 0ms!

Promise.resolve().then(() => console.log('3'));

console.log('4');

// Answer: 1, 4, 3, 2
// Why?
// - 1 & 4: Synchronous (run immediately)
// - 3: Microtask (Promises - higher priority)
// - 2: Macrotask (setTimeout - lower priority)
```

**Key Takeaway:**

"Async is like a restaurant kitchen - you don't wait for one dish to finish before starting another. You start multiple dishes, and serve them as they're ready. JavaScript is the chef managing everything!"

</details>

### Follow-up Questions

- "What is the JavaScript event loop and how does it enable asynchronous execution?"
- "Can you explain the difference between parallelism and concurrency in JavaScript?"
- "How would you handle multiple async operations that depend on each other?"
- "What are the performance implications of using too many async operations?"
- "How does Node.js handle asynchronous I/O differently from the browser?"

### Resources

- [MDN: Asynchronous JavaScript](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous)
- [JavaScript.info: Introduction to callbacks](https://javascript.info/callbacks)
- [JavaScript.info: Promise](https://javascript.info/promise-basics)
- [Understanding the Event Loop](https://www.youtube.com/watch?v=8aGhZQkoFbQ)

---

## Question 2: Explain the JavaScript event loop, call stack, and callback queue

**Difficulty:** 🔴 Hard
**Frequency:** ⭐⭐⭐⭐⭐
**Time:** 10-15 minutes
**Companies:** Google, Meta, Amazon, Netflix, Uber

### Question

How does the JavaScript event loop work? Explain the role of the call stack, callback queue (task queue), and microtask queue in the execution model.

### Answer

**Call Stack:**

- **LIFO** (Last In, First Out) data structure
- Keeps track of **function execution contexts**
- JavaScript is **single-threaded**, so only one stack
- When stack is empty, event loop checks queues

**Callback Queue (Task Queue/Macrotask Queue):**

- Holds **callbacks** from async operations (setTimeout, setInterval, I/O)
- Processed **after** call stack is empty
- **One task per event loop iteration**
- Examples: setTimeout, setInterval, setImmediate (Node.js)

**Microtask Queue:**

- **Higher priority** than callback queue
- Processed **immediately** after current task completes
- **All microtasks** execute before next macrotask
- Examples: Promise callbacks (.then, .catch, .finally), queueMicrotask, MutationObserver

**Event Loop Process:**

1. Execute code on call stack
2. When stack is empty, check microtask queue
3. Execute **all** microtasks
4. Check callback queue, execute **one** macrotask
5. Repeat from step 2

### Code Example

```javascript
// ============================================
// Example 1: Basic event loop demonstration
// ============================================
console.log('1: Start');

setTimeout(() => {
  console.log('2: setTimeout');
}, 0);

Promise.resolve().then(() => {
  console.log('3: Promise');
});

console.log('4: End');

// Output:
// 1: Start
// 4: End
// 3: Promise (microtask - executes first)
// 2: setTimeout (macrotask - executes after microtasks)

// Explanation:
// 1. "Start" and "End" execute synchronously on call stack
// 2. setTimeout callback goes to macrotask queue
// 3. Promise callback goes to microtask queue
// 4. Microtasks execute before macrotasks


// ============================================
// Example 2: Call stack visualization
// ============================================
function third() {
  console.log('third');
  // Call stack: [global, first, second, third]
}

function second() {
  console.log('second');
  third();
  // Call stack: [global, first, second]
}

function first() {
  console.log('first');
  second();
  // Call stack: [global, first]
}

first();
// Call stack: [global]

// Call stack evolution:
// [global] → [global, first] → [global, first, second]
// → [global, first, second, third] → [global, first, second]
// → [global, first] → [global] → []


// ============================================
// Example 3: Multiple microtasks vs macrotasks
// ============================================
console.log('Start');

setTimeout(() => console.log('Timeout 1'), 0);
setTimeout(() => console.log('Timeout 2'), 0);

Promise.resolve().then(() => console.log('Promise 1'));
Promise.resolve().then(() => console.log('Promise 2'));

console.log('End');

// Output:
// Start
// End
// Promise 1
// Promise 2
// Timeout 1
// Timeout 2

// All microtasks (Promise 1 & 2) complete before any macrotask (Timeout 1 & 2)


// ============================================
// Example 4: Nested microtasks and macrotasks
// ============================================
console.log('Script start');

setTimeout(() => {
  console.log('setTimeout 1');

  Promise.resolve().then(() => {
    console.log('Promise in setTimeout 1');
  });
}, 0);

Promise.resolve()
  .then(() => {
    console.log('Promise 1');

    setTimeout(() => {
      console.log('setTimeout in Promise 1');
    }, 0);
  })
  .then(() => {
    console.log('Promise 2');
  });

console.log('Script end');

// Output:
// Script start
// Script end
// Promise 1
// Promise 2
// setTimeout 1
// Promise in setTimeout 1
// setTimeout in Promise 1


// ============================================
// Example 5: Chained promises (all microtasks)
// ============================================
Promise.resolve()
  .then(() => {
    console.log('Promise 1');
    return Promise.resolve();
  })
  .then(() => {
    console.log('Promise 2');
  })
  .then(() => {
    console.log('Promise 3');
  });

setTimeout(() => {
  console.log('Timeout');
}, 0);

console.log('Sync');

// Output:
// Sync
// Promise 1
// Promise 2
// Promise 3
// Timeout


// ============================================
// Example 6: Stack overflow example
// ============================================

// ❌ Synchronous recursion - stack overflow
function recursiveSync(n) {
  if (n === 0) return;
  recursiveSync(n - 1); // Grows call stack
}

// recursiveSync(100000); // RangeError: Maximum call stack size exceeded

// ✅ Async recursion - no stack overflow
function recursiveAsync(n) {
  if (n === 0) return;

  setTimeout(() => {
    recursiveAsync(n - 1); // Stack clears between calls
  }, 0);
}

recursiveAsync(100000); // Works! Each call starts with empty stack


// ============================================
// Example 7: queueMicrotask API
// ============================================
console.log('Start');

setTimeout(() => console.log('Timeout'), 0);

queueMicrotask(() => {
  console.log('Microtask 1');
});

Promise.resolve().then(() => {
  console.log('Promise');
});

queueMicrotask(() => {
  console.log('Microtask 2');
});

console.log('End');

// Output:
// Start
// End
// Microtask 1
// Promise
// Microtask 2
// Timeout


// ============================================
// Example 8: Complex event loop scenario
// ============================================
async function async1() {
  console.log('async1 start');
  await async2();
  console.log('async1 end'); // Microtask
}

async function async2() {
  console.log('async2');
}

console.log('script start');

setTimeout(() => {
  console.log('setTimeout');
}, 0);

async1();

new Promise((resolve) => {
  console.log('promise1');
  resolve();
}).then(() => {
  console.log('promise2');
});

console.log('script end');

// Output:
// script start
// async1 start
// async2
// promise1
// script end
// async1 end (microtask)
// promise2 (microtask)
// setTimeout (macrotask)


// ============================================
// Example 9: Visualizing with delays
// ============================================
console.log('1: Sync');

setTimeout(() => {
  console.log('2: Macro 1');

  Promise.resolve().then(() => {
    console.log('3: Micro inside Macro 1');
  });

  setTimeout(() => {
    console.log('4: Macro inside Macro 1');
  }, 0);
}, 0);

Promise.resolve()
  .then(() => {
    console.log('5: Micro 1');

    return new Promise(resolve => {
      setTimeout(() => {
        console.log('6: Macro inside Micro 1');
        resolve();
      }, 0);
    });
  })
  .then(() => {
    console.log('7: Micro 2');
  });

console.log('8: Sync');

// Output:
// 1: Sync
// 8: Sync
// 5: Micro 1
// 2: Macro 1
// 3: Micro inside Macro 1
// 6: Macro inside Micro 1
// 7: Micro 2
// 4: Macro inside Macro 1


// ============================================
// Example 10: Blocking the event loop
// ============================================

// ❌ Bad: Long-running task blocks event loop
function blockingTask() {
  const start = Date.now();
  while (Date.now() - start < 3000) {
    // Blocks event loop for 3 seconds
  }
  console.log('Blocking task done');
}

setTimeout(() => console.log('This will be delayed'), 0);
blockingTask(); // Blocks everything
// "This will be delayed" won't execute until blockingTask completes

// ✅ Good: Break into chunks
async function nonBlockingTask() {
  for (let i = 0; i < 1000; i++) {
    // Do some work

    if (i % 100 === 0) {
      // Yield to event loop every 100 iterations
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  console.log('Non-blocking task done');
}

setTimeout(() => console.log('This will execute'), 0);
nonBlockingTask(); // Event loop can process other tasks


// ============================================
// Example 11: Node.js setImmediate vs setTimeout
// ============================================
// In Node.js, setImmediate has special behavior

setTimeout(() => {
  console.log('setTimeout');
}, 0);

setImmediate(() => {
  console.log('setImmediate');
});

// Output order is NOT guaranteed outside I/O cycle
// But within I/O cycle, setImmediate always executes first

const fs = require('fs');

fs.readFile(__filename, () => {
  setTimeout(() => {
    console.log('setTimeout in I/O');
  }, 0);

  setImmediate(() => {
    console.log('setImmediate in I/O'); // Always first
  });
});


// ============================================
// Example 12: MutationObserver (microtask in browser)
// ============================================
const observer = new MutationObserver(() => {
  console.log('DOM mutation'); // Microtask
});

observer.observe(document.body, { childList: true });

console.log('Start');

setTimeout(() => {
  console.log('Timeout');
}, 0);

document.body.appendChild(document.createElement('div')); // Triggers observer

console.log('End');

// Output:
// Start
// End
// DOM mutation (microtask)
// Timeout (macrotask)
```

### Common Mistakes

- ❌ **Mistake:** Thinking setTimeout(fn, 0) executes immediately

  ```javascript
  setTimeout(() => console.log('Later'), 0);
  console.log('Now');
  // Output: Now, Later (not Later, Now)
  ```

- ❌ **Mistake:** Not understanding microtask priority

  ```javascript
  setTimeout(() => console.log('Timeout'), 0);
  Promise.resolve().then(() => console.log('Promise'));
  // Output: Promise, Timeout (not Timeout, Promise)
  ```

- ❌ **Mistake:** Blocking the event loop with long-running sync code

  ```javascript
  // This freezes the entire app
  while (true) {
    // CPU-intensive work
  }
  ```

- ✅ **Correct:** Understand execution order and break up long tasks

  ```javascript
  // Proper order understanding
  console.log('1: Sync');
  setTimeout(() => console.log('3: Macro'), 0);
  Promise.resolve().then(() => console.log('2: Micro'));

  // Breaking up long tasks
  async function processLargeArray(items) {
    for (let i = 0; i < items.length; i++) {
      processItem(items[i]);

      if (i % 1000 === 0) {
        await new Promise(r => setTimeout(r, 0)); // Yield
      }
    }
  }
  ```

<details>
<summary><strong>🔍 Deep Dive: V8's Event Loop Implementation</strong></summary>

**Architecture:**

The event loop is NOT part of V8 JavaScript engine itself. It's provided by the **host environment** (browser or Node.js), while V8 provides the call stack and heap.

**Components in Detail:**

1. **Call Stack (V8)**:
   - LIFO structure for execution contexts
   - Stack frame contains: function arguments, local variables, return address
   - Max size ~10-15k frames (varies by environment)
   - Stack overflow → RangeError

```javascript
// Call stack visualization
function third() { throw new Error('Stack trace'); }
function second() { third(); }
function first() { second(); }
first();

// Error stack trace shows call stack:
// Error: Stack trace
//     at third (file.js:1)
//     at second (file.js:2)
//     at first (file.js:3)
```

2. **Web APIs (Browser) / C++ APIs (Node.js)**:
   - **Browser**: DOM APIs, fetch, setTimeout, XMLHttpRequest
   - **Node.js**: File system, network, timers, crypto
   - Run in **separate threads** outside JavaScript
   - Completion callbacks pushed to queues

3. **Microtask Queue** (Job Queue):
   - Implemented in V8 itself
   - FIFO queue
   - Processed **completely** after each task
   - Examples: Promise callbacks, queueMicrotask, MutationObserver

4. **Macrotask Queue** (Callback Queue):
   - Implemented by host environment
   - FIFO queue
   - One task per event loop tick
   - Examples: setTimeout, setInterval, I/O, UI events

**Event Loop Algorithm (Simplified):**

```javascript
// Pseudocode for event loop
while (eventLoop.waitForTask()) {
  // 1. Execute oldest macrotask from queue
  const task = macrotaskQueue.dequeue();
  execute(task);

  // 2. Execute ALL microtasks
  while (microtaskQueue.hasTasks()) {
    const microtask = microtaskQueue.dequeue();
    execute(microtask);
  }

  // 3. Render (if needed, browser only)
  if (needsRendering()) {
    renderUI();
  }
}
```

**V8 Optimization - Hidden Classes:**

```javascript
// V8 creates hidden classes for objects
// Event loop callbacks benefit from consistent shapes

// ✅ GOOD: Consistent callback shape
function handleEvent(event) {
  return { type: event.type, timestamp: Date.now() };
}

setTimeout(() => handleEvent({ type: 'timeout' }), 0);
Promise.resolve().then(() => handleEvent({ type: 'promise' }));

// V8 creates ONE hidden class for both callbacks
// → Optimized property access via inline caching
```

**Memory Layout:**

```
┌─────────────────────┐
│   Call Stack        │ ← Execution contexts (LIFO)
│   [Function frames] │
└─────────────────────┘

┌─────────────────────┐
│   Heap              │ ← Objects, closures, callbacks
│   [All objects]     │
└─────────────────────┘

┌─────────────────────┐
│ Microtask Queue     │ ← Promise callbacks (FIFO)
│ [Micro 1, Micro 2]  │
└─────────────────────┘

┌─────────────────────┐
│ Macrotask Queue     │ ← setTimeout, I/O (FIFO)
│ [Macro 1, Macro 2]  │
└─────────────────────┘
```

**Performance Characteristics:**

| Operation | Time Complexity | Notes |
|-----------|----------------|-------|
| Push to call stack | O(1) | Fast |
| Pop from call stack | O(1) | Fast |
| Add to microtask queue | O(1) | Fast |
| Add to macrotask queue | O(1) | Fast |
| Process microtask queue | O(n) | All microtasks |
| Process macrotask queue | O(1) | One per tick |

**Node.js Event Loop Phases:**

```javascript
// Node.js has more complex event loop with phases:

// 1. Timers → setTimeout/setInterval callbacks
// 2. Pending callbacks → I/O callbacks deferred to next loop
// 3. Idle, prepare → Internal only
// 4. Poll → Retrieve new I/O events
// 5. Check → setImmediate callbacks
// 6. Close callbacks → socket.on('close')

// Between each phase: process microtask queue!

setImmediate(() => console.log('Immediate'));
setTimeout(() => console.log('Timeout'), 0);

// In I/O cycle: setImmediate ALWAYS before setTimeout
fs.readFile('file.txt', () => {
  setImmediate(() => console.log('Immediate in I/O'));
  setTimeout(() => console.log('Timeout in I/O'), 0);
});
// Output: Immediate in I/O, Timeout in I/O
```

</details>

<details>
<summary><strong>🐛 Real-World Scenario: Event Loop Blocking Bug</strong></summary>

**Scenario**: Your analytics dashboard becomes unresponsive when processing large datasets. Users report "browser not responding" warnings after clicking "Generate Report".

**The Problem:**

```javascript
// ❌ BLOCKING: Synchronous heavy computation
class AnalyticsDashboard {
  generateReport(transactions) {
    console.log('Generating report...');

    const report = {
      totalRevenue: 0,
      byCategory: {},
      topProducts: []
    };

    // Blocks event loop for 50,000 transactions (~3-5 seconds)
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];

      report.totalRevenue += tx.amount;

      if (!report.byCategory[tx.category]) {
        report.byCategory[tx.category] = 0;
      }
      report.byCategory[tx.category] += tx.amount;

      // Expensive operation per transaction
      const productScore = this.calculateProductScore(tx);
      this.updateTopProducts(report.topProducts, tx, productScore);
    }

    this.displayReport(report); // UI frozen until here
    return report;
  }
}

// User clicks "Generate Report"
button.addEventListener('click', () => {
  dashboard.generateReport(allTransactions); // FREEZES UI for 5 seconds
});
```

**Debugging Steps:**

1. **Open Chrome DevTools Performance Tab**:
   ```javascript
   // Record performance while clicking "Generate Report"
   // See: Long Task warning (>50ms)
   // Main thread blocked for 5000ms
   // Frame drops from 60fps → 0fps
   ```

2. **Identify blocking code**:
   ```javascript
   console.time('generateReport');
   dashboard.generateReport(allTransactions);
   console.timeEnd('generateReport'); // "generateReport: 4837ms"

   // Chrome warns: "Violation: 'click' handler took 4837ms"
   ```

3. **Check call stack during freeze**:
   ```javascript
   // Performance profile shows:
   // generateReport → 4837ms (99.8% of time)
   //   ├─ calculateProductScore → 2000ms
   //   └─ updateTopProducts → 1500ms
   ```

**Solution 1: Break into chunks with async breaks**

```javascript
// ✅ FIX: Process in chunks, yield to event loop
class AnalyticsDashboard {
  async generateReportAsync(transactions, chunkSize = 1000) {
    console.log('Generating report...');
    this.showProgress(0);

    const report = {
      totalRevenue: 0,
      byCategory: {},
      topProducts: []
    };

    // Process in chunks
    for (let i = 0; i < transactions.length; i += chunkSize) {
      const chunk = transactions.slice(i, i + chunkSize);

      // Process chunk synchronously
      for (const tx of chunk) {
        report.totalRevenue += tx.amount;

        if (!report.byCategory[tx.category]) {
          report.byCategory[tx.category] = 0;
        }
        report.byCategory[tx.category] += tx.amount;

        const productScore = this.calculateProductScore(tx);
        this.updateTopProducts(report.topProducts, tx, productScore);
      }

      // Yield to event loop every chunk
      const progress = ((i + chunkSize) / transactions.length) * 100;
      this.showProgress(Math.min(progress, 100));

      // Critical: setTimeout allows UI updates & user interaction
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    this.displayReport(report);
    return report;
  }
}

// Event listener
button.addEventListener('click', async () => {
  button.disabled = true;
  await dashboard.generateReportAsync(allTransactions);
  button.disabled = false;
});
```

**Solution 2: Web Worker (best for CPU-intensive)**

```javascript
// ✅ BEST: Offload to separate thread

// analytics-worker.js
self.addEventListener('message', (e) => {
  const { transactions } = e.data;

  const report = {
    totalRevenue: 0,
    byCategory: {},
    topProducts: []
  };

  // Heavy computation runs in worker thread
  // Doesn't block main thread at all!
  for (const tx of transactions) {
    report.totalRevenue += tx.amount;

    if (!report.byCategory[tx.category]) {
      report.byCategory[tx.category] = 0;
    }
    report.byCategory[tx.category] += tx.amount;

    const productScore = calculateProductScore(tx);
    updateTopProducts(report.topProducts, tx, productScore);

    // Send progress updates
    if (transactions.indexOf(tx) % 1000 === 0) {
      self.postMessage({
        type: 'progress',
        value: (transactions.indexOf(tx) / transactions.length) * 100
      });
    }
  }

  self.postMessage({ type: 'complete', report });
});

// main.js
const worker = new Worker('analytics-worker.js');

button.addEventListener('click', () => {
  button.disabled = true;
  showProgress(0);

  worker.postMessage({ transactions: allTransactions });

  worker.addEventListener('message', (e) => {
    if (e.data.type === 'progress') {
      showProgress(e.data.value);
    } else if (e.data.type === 'complete') {
      displayReport(e.data.report);
      button.disabled = false;
    }
  });

  // UI remains fully responsive!
  // User can still scroll, click, type
});
```

**Performance Comparison:**

| Approach | Time | Max Block | UI Responsive? | Complexity |
|----------|------|-----------|----------------|------------|
| Synchronous | 4837ms | 4837ms | ❌ No | Low |
| Async chunks (1000) | 5100ms | 98ms | ✅ Yes | Medium |
| Async chunks (500) | 5200ms | 52ms | ✅ Yes | Medium |
| Web Worker | 4500ms | 0ms | ✅ Fully | High |

**Production Metrics After Fix:**

```javascript
// Before (Synchronous):
// - UI freeze: 5 seconds
// - Frame drops: 300 frames (5s × 60fps)
// - User complaints: 40% of users abandoned report
// - Bounce rate: 25%

// After (Web Worker):
// - UI freeze: 0 seconds
// - Frame drops: 0 frames (60fps maintained)
// - User satisfaction: 95% completion rate
// - Bounce rate: 3%
// - Bonus: Report 7% faster (worker thread optimization)
```

**Additional Fix: requestIdleCallback**

```javascript
// ✅ ADVANCED: Process during browser idle time
async function generateReportIdle(transactions) {
  const report = { totalRevenue: 0, byCategory: {}, topProducts: [] };
  let index = 0;

  function processChunk(deadline) {
    // Process while time remaining
    while (deadline.timeRemaining() > 0 && index < transactions.length) {
      const tx = transactions[index++];
      report.totalRevenue += tx.amount;
      // ... process transaction
    }

    showProgress((index / transactions.length) * 100);

    if (index < transactions.length) {
      requestIdleCallback(processChunk);
    } else {
      displayReport(report);
    }
  }

  requestIdleCallback(processChunk);
}

// Processes only when browser is idle
// Lowest impact on user experience
```

</details>

<details>
<summary><strong>⚖️ Trade-offs: Event Loop Strategies</strong></summary>

**1. Synchronous vs Asynchronous Processing:**

| Strategy | Execution Time | UI Responsiveness | Code Complexity | Memory Usage |
|----------|---------------|-------------------|-----------------|--------------|
| **Synchronous** | Fastest | Blocks UI | Simple | Low (stack) |
| **Async chunks** | +5-10% overhead | Responsive | Medium | Medium (heap) |
| **Web Worker** | Fastest or faster | Fully responsive | Complex | Higher (separate context) |
| **requestIdleCallback** | Slowest | Most responsive | Complex | Medium |

```javascript
// Benchmark: Processing 50,000 items

// Synchronous: 1000ms, blocks UI
function syncProcess(items) {
  return items.map(process);
}

// Async chunks: 1050ms, 50ms blocks
async function asyncChunks(items, chunkSize = 1000) {
  const results = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    results.push(...items.slice(i, i + chunkSize).map(process));
    await new Promise(r => setTimeout(r, 0));
  }
  return results;
}

// Web Worker: 950ms, 0ms blocks
const worker = new Worker('processor.js');
// ... (faster due to separate thread + optimizations)
```

**2. Microtask vs Macrotask Scheduling:**

```javascript
// Use microtask for: High-priority, small tasks
// Use macrotask for: Lower priority, allows rendering

// ❌ WRONG: Many microtasks block rendering
for (let i = 0; i < 10000; i++) {
  Promise.resolve().then(() => processItem(i));
}
// All 10,000 execute before next paint → janky UI

// ✅ CORRECT: Macrotasks allow rendering
for (let i = 0; i < 10000; i++) {
  if (i % 100 === 0) {
    setTimeout(() => processItem(i), 0);
  } else {
    processItem(i);
  }
}
// Renders every 100 items → smooth UI
```

**Trade-off Matrix:**

| Aspect | Microtasks | Macrotasks |
|--------|-----------|-----------|
| **Priority** | High | Normal |
| **Execution** | All before render | One per cycle |
| **Use for** | Critical updates | Background work |
| **Rendering** | Blocks | Allows |
| **Examples** | Promise, queueMicrotask | setTimeout, I/O |

**3. Chunk Size Trade-offs:**

```javascript
const CHUNK_SIZES = [100, 500, 1000, 5000];

// Benchmark results (50,000 items):
// Chunk 100:  5500ms, 22ms avg block, 61fps
// Chunk 500:  5200ms, 52ms avg block, 60fps
// Chunk 1000: 5100ms, 98ms avg block, 58fps
// Chunk 5000: 4900ms, 450ms avg block, 30fps (janky!)

// ✅ OPTIMAL: ~16ms chunks for 60fps
// 16ms = 1 frame at 60fps
const optimalChunkSize = items.length / Math.ceil(totalTime / 16);
```

**4. Stack vs Heap Memory:**

```javascript
// Synchronous recursion: Stack-based (limited)
function recurseSync(n) {
  if (n === 0) return;
  recurseSync(n - 1);
}
recurseSync(15000); // Stack overflow! (~10-15k limit)

// Async recursion: Heap-based (scalable)
async function recurseAsync(n) {
  if (n === 0) return;
  await new Promise(resolve => setTimeout(resolve, 0));
  return recurseAsync(n - 1);
}
recurseAsync(100000); // Works! Each call clears stack

// Trade-off: Async uses more heap memory but prevents overflow
```

**5. When to Use What:**

```javascript
// ✅ Synchronous: Fast, small, CPU-bound
const hash = crypto.createHash('sha256').update(data).digest('hex');

// ✅ Microtask: High-priority state updates
Promise.resolve().then(() => {
  updateCriticalUI();
});

// ✅ Macrotask: Allow rendering between operations
setTimeout(() => {
  processBackgroundTask();
}, 0);

// ✅ Web Worker: Heavy computation
const worker = new Worker('heavy-computation.js');

// ✅ requestIdleCallback: Non-critical work
requestIdleCallback(() => {
  cleanupCache();
});

// ✅ requestAnimationFrame: Visual updates
requestAnimationFrame(() => {
  updateAnimation();
});
```

**6. Real-World Decision Matrix:**

| Scenario | Solution | Why |
|----------|----------|-----|
| **API call** | Async (fetch/Promise) | I/O operation |
| **10 items to process** | Synchronous | Too small for async overhead |
| **10,000 items** | Async chunks or Web Worker | Prevents UI freeze |
| **Animation** | requestAnimationFrame | Syncs with display refresh |
| **State update after API** | Microtask (Promise.then) | High priority |
| **Analytics tracking** | Macrotask (setTimeout) | Low priority, non-blocking |
| **Image processing** | Web Worker | CPU-intensive |
| **Cache cleanup** | requestIdleCallback | Non-critical |

**7. Performance Budget:**

```javascript
// Google's RAIL model guidelines:
// - Response: <100ms (user input)
// - Animation: 16ms per frame (60fps)
// - Idle: 50ms chunks
// - Load: <1000ms

// Apply to chunk sizing:
const MAX_TASK_TIME = 50; // ms
const estimatedTimePerItem = 0.5; // ms
const chunkSize = Math.floor(MAX_TASK_TIME / estimatedTimePerItem); // 100 items

async function processWithBudget(items) {
  for (let i = 0; i < items.length; i += chunkSize) {
    const start = performance.now();

    // Process chunk
    items.slice(i, i + chunkSize).forEach(process);

    const elapsed = performance.now() - start;
    console.log(`Chunk ${i}: ${elapsed}ms`); // Monitor budget

    await new Promise(r => setTimeout(r, 0));
  }
}
```

</details>

<details>
<summary><strong>💬 Explain to Junior: Event Loop</strong></summary>

**Simple Analogy: Coffee Shop**

Imagine JavaScript is a coffee shop with **one barista** (single-threaded):

**Call Stack = Barista's Current Task:**
- Barista can only make ONE drink at a time
- LIFO: If making latte, must finish before next drink
- Stack of tasks on the counter

**Callback Queue = Order Queue:**
- Customers (callbacks) waiting in line
- FIFO: First customer served first
- Timer beeps when espresso is ready → customer added to queue

**Microtask Queue = VIP Queue:**
- VIP customers (Promise callbacks) cut to front
- ALL VIPs served before regular customers
- Higher priority

**Event Loop = Manager:**
- Checks: "Barista busy?" → No → "Any VIPs?" → Serve all VIPs → "Any regular customers?" → Serve one → Repeat

**Visual Example:**

```javascript
// Coffee shop simulation

console.log('1: Open shop'); // Barista starts working

setTimeout(() => {
  console.log('2: Regular customer (macrotask)');
}, 0); // Add to regular queue

Promise.resolve().then(() => {
  console.log('3: VIP customer (microtask)');
}); // Add to VIP queue

console.log('4: Close shop'); // Barista finishes opening tasks

// Output:
// 1: Open shop (barista's current task)
// 4: Close shop (barista's current task)
// 3: VIP customer (all VIPs first!)
// 2: Regular customer (then regular queue)
```

**Explaining to PM:**

"Think of JavaScript like a single-lane highway:

**Synchronous code** = Cars currently on highway
- Must complete before next car enters

**Asynchronous code** = Cars parked at rest stops
- Waiting for event (timer, API response)
- When event happens, car rejoins highway

**Event loop** = Traffic controller
- Decides which parked car can rejoin highway
- VIP lane (microtasks) always goes first
- Regular lane (macrotasks) goes one at a time

**Why it matters:**
- If one car breaks down (long task), entire highway stops
- That's why we break long tasks into chunks → cars pull over regularly
- Keeps traffic (UI) flowing smoothly!"

**Common "Aha!" Moment:**

```javascript
// Quiz: What prints first?

console.log('A');

setTimeout(() => console.log('B'), 0); // Even with 0ms!

console.log('C');

// Answer: A, C, B

// Why B is last even with 0ms timeout?
// 1. setTimeout adds B to queue (doesn't execute)
// 2. A and C execute synchronously
// 3. Event loop checks queue, finds B, executes it
```

**Debugging Tip for Juniors:**

```javascript
// Visual stack trace helper
function showStack(label) {
  console.log(`\n=== ${label} ===`);
  console.trace('Stack:');
}

showStack('Start');

setTimeout(() => {
  showStack('After timeout');
}, 0);

Promise.resolve().then(() => {
  showStack('After promise');
});

showStack('End');

// Output shows call stack at each point
// Helps visualize execution order
```

**Real Code Analogy:**

```javascript
// Restaurant kitchen analogy

// Synchronous: Chef cooks ONE dish, waits for it to finish
function cookSync() {
  bakePizza(); // Stand and wait 10 mins
  chopVeggies(); // Stand and wait 5 mins
  cookPasta(); // Stand and wait 8 mins
  // Total: 23 minutes, chef does nothing while waiting
}

// Asynchronous: Chef starts multiple dishes
async function cookAsync() {
  putPizzaInOven(); // Start and move on
  await timer(10); // Oven timer (macrotask)

  chopVeggies(); // While pizza cooks

  boilPasta(); // Start pasta
  await timer(8); // Pasta timer (macrotask)

  // Total: ~10 minutes, chef productive!
}
```

**Key Takeaways for Juniors:**

1. **JavaScript = Single-threaded** (one thing at a time)
2. **Event loop = Manager** (decides what runs next)
3. **Microtasks > Macrotasks** (VIP vs regular queue)
4. **Long tasks = UI freeze** (break into chunks!)
5. **setTimeout(fn, 0) ≠ immediate** (goes to queue)

**Practice Exercise:**

```javascript
// Predict output order:

console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve()
  .then(() => console.log('3'))
  .then(() => console.log('4'));

console.log('5');

setTimeout(() => console.log('6'), 0);

Promise.resolve().then(() => console.log('7'));

// Answer: 1, 5, 3, 7, 4, 2, 6

// Why?
// Sync: 1, 5
// Microtasks: 3, 7, 4 (all before macrotasks)
// Macrotasks: 2, 6 (one per loop iteration)
```

</details>

### Follow-up Questions

- "What happens if a microtask creates another microtask infinitely?"
- "How would you debug an event loop blocking issue in production?"
- "What is the difference between process.nextTick and setImmediate in Node.js?"
- "Can you explain the phases of the Node.js event loop?"
- "How do Web Workers relate to the event loop?"

### Resources

- [MDN: Event Loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop)
- [JavaScript.info: Event loop](https://javascript.info/event-loop)
- [What the heck is the event loop anyway? (Video)](https://www.youtube.com/watch?v=8aGhZQkoFbQ)
- [Jake Archibald: In The Loop (Video)](https://www.youtube.com/watch?v=cCOL7MC4Pl0)
- [Node.js Event Loop](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/)

---

## Question 3: Explain microtasks vs macrotasks and their execution order

**Difficulty:** 🔴 Hard
**Frequency:** ⭐⭐⭐⭐
**Time:** 8-12 minutes
**Companies:** Google, Meta, Netflix, Uber

### Question

What is the difference between microtasks and macrotasks in JavaScript? How does their execution order work in the event loop? Give examples of each.

### Answer

**Macrotasks (Task Queue):**

- **Examples:** setTimeout, setInterval, setImmediate (Node.js), I/O operations, UI rendering
- Added to **task queue**
- **One macrotask** processed per event loop iteration
- Lower priority than microtasks
- Represent "major" units of work

**Microtasks (Microtask Queue):**

- **Examples:** Promise callbacks (.then, .catch, .finally), queueMicrotask, MutationObserver, process.nextTick (Node.js)
- Added to **microtask queue**
- **ALL microtasks** processed before next macrotask
- Higher priority - always execute before macrotasks
- Represent "smaller" units of work that should complete quickly

**Execution Order:**

1. Execute synchronous code (call stack)
2. Execute **ALL** microtasks in queue
3. Render UI (if needed)
4. Execute **ONE** macrotask
5. Repeat from step 2

**Key Difference:**

- Macrotasks: One per loop iteration
- Microtasks: ALL before next macrotask

### Code Example

```javascript
// ============================================
// Example 1: Basic microtask vs macrotask
// ============================================
console.log('1: Sync start');

setTimeout(() => {
  console.log('2: Macrotask (setTimeout)');
}, 0);

Promise.resolve().then(() => {
  console.log('3: Microtask (Promise)');
});

console.log('4: Sync end');

// Output:
// 1: Sync start
// 4: Sync end
// 3: Microtask (Promise)
// 2: Macrotask (setTimeout)


// ============================================
// Example 2: Multiple microtasks before macrotask
// ============================================
console.log('Start');

setTimeout(() => console.log('Timeout 1'), 0);
setTimeout(() => console.log('Timeout 2'), 0);

Promise.resolve().then(() => console.log('Promise 1'));
Promise.resolve().then(() => console.log('Promise 2'));
Promise.resolve().then(() => console.log('Promise 3'));

console.log('End');

// Output:
// Start
// End
// Promise 1
// Promise 2
// Promise 3
// Timeout 1
// Timeout 2

// All 3 microtasks complete before any macrotask


// ============================================
// Example 3: Nested microtasks
// ============================================
console.log('Start');

Promise.resolve()
  .then(() => {
    console.log('Promise 1');

    // Creates new microtask
    Promise.resolve().then(() => {
      console.log('Promise 2 (nested)');
    });

    console.log('Promise 1 continued');
  })
  .then(() => {
    console.log('Promise 3');
  });

setTimeout(() => console.log('Timeout'), 0);

console.log('End');

// Output:
// Start
// End
// Promise 1
// Promise 1 continued
// Promise 2 (nested)
// Promise 3
// Timeout


// ============================================
// Example 4: queueMicrotask API
// ============================================
console.log('Start');

setTimeout(() => console.log('Macrotask'), 0);

queueMicrotask(() => {
  console.log('Microtask 1');

  queueMicrotask(() => {
    console.log('Microtask 2 (nested)');
  });
});

Promise.resolve().then(() => console.log('Promise'));

console.log('End');

// Output:
// Start
// End
// Microtask 1
// Promise
// Microtask 2 (nested)
// Macrotask


// ============================================
// Example 5: Microtask queue starvation
// ============================================

// ⚠️ Warning: This creates infinite microtasks
function infiniteMicrotasks() {
  Promise.resolve().then(() => {
    console.log('Microtask');
    infiniteMicrotasks(); // Creates another microtask
  });
}

// infiniteMicrotasks(); // Never reaches macrotask queue!

// Macrotasks allow other work between iterations
function safeMacrotasks() {
  setTimeout(() => {
    console.log('Macrotask');
    safeMacrotasks(); // Allows other tasks to run
  }, 0);
}


// ============================================
// Example 6: Event loop iteration visualization
// ============================================
console.log('=== Iteration 1 ===');
console.log('Sync 1');

setTimeout(() => console.log('Macro 1'), 0);
setTimeout(() => console.log('Macro 2'), 0);

Promise.resolve().then(() => {
  console.log('Micro 1');

  setTimeout(() => console.log('Macro 3'), 0);

  Promise.resolve().then(() => console.log('Micro 2'));
});

console.log('Sync 2');

// Execution breakdown:
//
// Call Stack (Synchronous):
//   - Sync 1
//   - Sync 2
//
// Microtask Queue (All execute):
//   - Micro 1 → adds Macro 3 and Micro 2
//   - Micro 2
//
// Macrotask Queue (One per iteration):
//   - Iteration 2: Macro 1
//   - Iteration 3: Macro 2
//   - Iteration 4: Macro 3


// ============================================
// Example 7: Promise timing nuances
// ============================================
Promise.resolve().then(() => {
  console.log('Promise then 1');
}).then(() => {
  console.log('Promise then 2');
});

queueMicrotask(() => {
  console.log('queueMicrotask');
});

// Output:
// Promise then 1
// queueMicrotask
// Promise then 2

// Why? First .then() completes, adding second .then() to queue
// queueMicrotask was already in queue before second .then()


// ============================================
// Example 8: Async/await and microtasks
// ============================================
async function asyncFunc() {
  console.log('Async start');

  await Promise.resolve(); // Yields to microtask queue

  console.log('After await'); // Microtask
}

console.log('Start');

setTimeout(() => console.log('Timeout'), 0);

asyncFunc();

console.log('End');

// Output:
// Start
// Async start
// End
// After await (microtask)
// Timeout (macrotask)


// ============================================
// Example 9: Node.js process.nextTick (special microtask)
// ============================================
// In Node.js, process.nextTick has even higher priority

console.log('Start');

setTimeout(() => console.log('Timeout'), 0);

Promise.resolve().then(() => console.log('Promise'));

process.nextTick(() => console.log('nextTick'));

console.log('End');

// Output (Node.js):
// Start
// End
// nextTick (highest priority)
// Promise (regular microtask)
// Timeout (macrotask)


// ============================================
// Example 10: Real-world implications
// ============================================

// Problem: UI blocking with too many microtasks
function processItems(items) {
  items.forEach(item => {
    // Each creates microtask - blocks UI rendering
    Promise.resolve().then(() => processItem(item));
  });
}

// Solution: Break into macrotasks
async function processItemsSafe(items) {
  for (const item of items) {
    processItem(item);

    // Yield to event loop every 100 items
    if (items.indexOf(item) % 100 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
}


// ============================================
// Example 11: Detailed execution trace
// ============================================
console.log('1: Script start');

setTimeout(() => {
  console.log('2: setTimeout 1');

  Promise.resolve().then(() => {
    console.log('3: Promise in setTimeout 1');
  });
}, 0);

Promise.resolve()
  .then(() => {
    console.log('4: Promise 1');

    setTimeout(() => {
      console.log('5: setTimeout in Promise 1');
    }, 0);
  })
  .then(() => {
    console.log('6: Promise 2');
  });

setTimeout(() => {
  console.log('7: setTimeout 2');
}, 0);

Promise.resolve().then(() => {
  console.log('8: Promise 3');
});

console.log('9: Script end');

// Output:
// 1: Script start
// 9: Script end
// 4: Promise 1
// 8: Promise 3
// 6: Promise 2
// 2: setTimeout 1
// 3: Promise in setTimeout 1
// 7: setTimeout 2
// 5: setTimeout in Promise 1


// ============================================
// Example 12: Browser rendering and tasks
// ============================================

// Microtasks can delay rendering
button.addEventListener('click', () => {
  // Starts paint cycle
  element.style.background = 'red';

  // Blocks painting (runs before render)
  Promise.resolve().then(() => {
    doHeavyWork(); // Delays paint
  });
});

// Macrotasks allow rendering between tasks
button.addEventListener('click', () => {
  element.style.background = 'red';

  // Allows paint to happen first
  setTimeout(() => {
    doHeavyWork();
  }, 0);
});


// ============================================
// Example 13: Complex nesting scenario
// ============================================
console.log('A');

setTimeout(() => {
  console.log('B');
  Promise.resolve().then(() => console.log('C'));
}, 0);

Promise.resolve()
  .then(() => {
    console.log('D');
    setTimeout(() => console.log('E'), 0);
  })
  .then(() => {
    console.log('F');
  });

setTimeout(() => {
  console.log('G');
  Promise.resolve().then(() => console.log('H'));
}, 0);

Promise.resolve().then(() => {
  console.log('I');
});

console.log('J');

// Output:
// A
// J
// D
// I
// F
// B
// C
// G
// H
// E


// ============================================
// Example 14: Understanding "run to completion"
// ============================================

// Each task runs to completion before next task
setTimeout(() => {
  console.log('Task 1 start');

  // Long-running synchronous code blocks everything
  for (let i = 0; i < 1000000000; i++) {}

  console.log('Task 1 end');
}, 0);

setTimeout(() => {
  console.log('Task 2'); // Waits for Task 1 to complete
}, 0);


// ============================================
// Example 15: Microtask checkpoint timing
// ============================================
console.log('Start');

// Macrotask 1
setTimeout(() => {
  console.log('Timeout 1');

  // Adds to microtask queue
  Promise.resolve()
    .then(() => console.log('Micro A'))
    .then(() => console.log('Micro B'));
}, 0);

// Macrotask 2
setTimeout(() => {
  console.log('Timeout 2');

  Promise.resolve().then(() => console.log('Micro C'));
}, 0);

console.log('End');

// Output:
// Start
// End
// Timeout 1 (first macrotask)
// Micro A (microtasks after macrotask)
// Micro B
// Timeout 2 (second macrotask)
// Micro C (microtasks after second macrotask)
```

### Common Mistakes

- ❌ **Mistake:** Thinking setTimeout(fn, 0) executes before promises

  ```javascript
  setTimeout(() => console.log('Timeout'), 0);
  Promise.resolve().then(() => console.log('Promise'));
  // Output: Promise, Timeout (not Timeout, Promise)
  ```

- ❌ **Mistake:** Creating too many microtasks (starving macrotasks)

  ```javascript
  // Blocks event loop indefinitely
  function recurse() {
    Promise.resolve().then(recurse);
  }
  recurse(); // UI freezes, no rendering
  ```

- ❌ **Mistake:** Not understanding microtask queue draining

  ```javascript
  Promise.resolve().then(() => {
    console.log('A');
    Promise.resolve().then(() => console.log('B'));
  });
  setTimeout(() => console.log('C'), 0);

  // Output: A, B, C
  // B executes before C (all microtasks first)
  ```

- ✅ **Correct:** Understand execution phases and priorities

  ```javascript
  // Synchronous code → Microtasks → Macrotask → repeat
  console.log('1: Sync');
  Promise.resolve().then(() => console.log('2: Micro'));
  setTimeout(() => console.log('3: Macro'), 0);
  // Always: 1, 2, 3
  ```

<details>
<summary><strong>🔍 Deep Dive: Microtask vs Macrotask Implementation</strong></summary>

**V8 & Browser Implementation:**

Microtasks and macrotasks are implemented at different levels:

**Microtask Queue** (V8 internal):
- Managed by **V8 JavaScript engine itself**
- Part of `Isolate` class in V8
- FIFO queue structure
- Processed by `MicrotaskQueue::RunMicrotasks()`
- Guaranteed to complete before next macrotask

```cpp
// Simplified V8 implementation (C++)
class MicrotaskQueue {
  std::queue<Microtask*> queue_;

  void EnqueueMicrotask(Microtask* task) {
    queue_.push(task);  // O(1)
  }

  void RunMicrotasks() {
    while (!queue_.empty()) {  // Process ALL
      Microtask* task = queue_.front();
      queue_.pop();
      task->Run();
    }
  }
};
```

**Macrotask Queue** (Browser/Node.js):
- Managed by **host environment**
- Multiple queues for different task sources (timers, I/O, UI events)
- Browser processes ONE macrotask per event loop iteration
- Examples: setTimeout queue, I/O callback queue, rendering queue

**Execution Order (Detailed):**

```javascript
// 1. Execute synchronous script (macrotask)
console.log('Sync 1');

// 2. Schedule macrotask
setTimeout(() => console.log('Macro 1'), 0);
//    → Added to Timer Queue (macrotask)

// 3. Schedule microtask
Promise.resolve().then(() => console.log('Micro 1'));
//    → Added to Microtask Queue

console.log('Sync 2');

// 4. Script ends
//    → Check Microtask Queue → Execute ALL microtasks
//    → Output: "Micro 1"

// 5. Event loop tick
//    → Check Macrotask Queue → Execute ONE macrotask
//    → Output: "Macro 1"
//    → Check Microtask Queue → Empty
//    → Next tick...

// Final output: Sync 1, Sync 2, Micro 1, Macro 1
```

**Microtask Checkpoint:**

After **every** task, V8 performs a "microtask checkpoint":

```javascript
// Pseudocode for event loop with checkpoints
while (true) {
  // Execute one macrotask
  const task = macrotaskQueue.dequeue();
  if (task) {
    execute(task);

    // Microtask checkpoint
    runAllMicrotasks();  // ← ALL microtasks
  }

  // Rendering (browser only)
  if (timeToRender()) {
    render();
    runAllMicrotasks();  // ← Checkpoint after render too!
  }
}
```

**Microtask Types:**

```javascript
// 1. Promise callbacks
Promise.resolve().then(() => {}); // Microtask

// 2. queueMicrotask API
queueMicrotask(() => {}); // Direct microtask scheduling

// 3. MutationObserver (browser)
const observer = new MutationObserver(() => {}); // Microtask

// 4. process.nextTick (Node.js - special microtask)
process.nextTick(() => {}); // Higher priority than regular microtasks!
```

**Macrotask Types:**

```javascript
// 1. Timers
setTimeout(() => {}, 0); // Timer queue
setInterval(() => {}, 100); // Timer queue

// 2. I/O (Node.js)
fs.readFile('file.txt', callback); // I/O queue

// 3. UI Events (browser)
button.addEventListener('click', () => {}); // Event queue

// 4. setImmediate (Node.js)
setImmediate(() => {}); // Check queue

// 5. requestAnimationFrame (browser)
requestAnimationFrame(() => {}); // Animation queue (before render)
```

**Priority Levels (Node.js):**

```javascript
// Highest to lowest priority:

// 1. process.nextTick (special microtask queue)
process.nextTick(() => console.log('1: nextTick'));

// 2. Microtasks (Promise, queueMicrotask)
Promise.resolve().then(() => console.log('2: Promise'));
queueMicrotask(() => console.log('3: queueMicrotask'));

// 3. Macrotasks (timers, I/O, setImmediate)
setTimeout(() => console.log('4: setTimeout'), 0);
setImmediate(() => console.log('5: setImmediate'));

// Output: 1, 2, 3, 4, 5 (in Node.js)
// Note: 4 and 5 order can vary outside I/O cycle
```

**Memory & Performance:**

```javascript
// Microtasks are CHEAPER than macrotasks

// Memory layout:
// - Microtask: Closure stored in heap, queue reference in V8
// - Macrotask: Closure + timer data structure in host environment

// Performance benchmark (1000 iterations):
console.time('microtasks');
for (let i = 0; i < 1000; i++) {
  Promise.resolve().then(() => {});
}
console.timeEnd('microtasks'); // ~2ms

console.time('macrotasks');
for (let i = 0; i < 1000; i++) {
  setTimeout(() => {}, 0);
}
console.timeEnd('macrotasks'); // ~15ms

// Microtasks are ~7x faster to schedule!
```

**Starving the Event Loop:**

```javascript
// ⚠️ DANGER: Infinite microtasks block everything

function infiniteMicrotasks() {
  Promise.resolve().then(() => {
    console.log('Microtask');
    infiniteMicrotasks(); // Creates another microtask
  });
}

infiniteMicrotasks();
// → Microtasks never end
// → Macrotasks never execute
// → UI rendering blocked
// → Browser hangs!

// ✅ SAFE: Macrotasks allow other work
function safeMacrotasks() {
  setTimeout(() => {
    console.log('Macrotask');
    safeMacrotasks();
  }, 0);
}
// → One per event loop tick
// → Other tasks can run
// → UI can render
```

**Browser Rendering Timing:**

```javascript
// Rendering happens AFTER microtasks, BEFORE next macrotask

button.addEventListener('click', () => {
  element.style.background = 'red'; // Mark for repaint

  // Microtask: Runs BEFORE paint
  Promise.resolve().then(() => {
    element.style.background = 'blue'; // Overrides red
  });

  // Browser paints: blue (not red!)
  // Red is never visible
});

// vs Macrotask

button.addEventListener('click', () => {
  element.style.background = 'red'; // Mark for repaint

  // Macrotask: Runs AFTER paint
  setTimeout(() => {
    element.style.background = 'blue';
  }, 0);

  // Browser paints: red (visible!)
  // Then paints: blue (visible!)
  // User sees red flash before blue
});
```

</details>

<details>
<summary><strong>🐛 Real-World Scenario: Microtask Queue Starvation</strong></summary>

**Scenario**: Your real-time chat application freezes when receiving a flood of messages. Users can't type, scroll, or click anything. The UI is completely unresponsive.

**The Problem:**

```javascript
// ❌ PROBLEM: Recursive microtasks starve event loop
class ChatApp {
  constructor() {
    this.messageQueue = [];
    this.processing = false;
  }

  async onMessageReceived(message) {
    this.messageQueue.push(message);

    if (!this.processing) {
      this.processMessages();
    }
  }

  async processMessages() {
    this.processing = true;

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();

      // Process message (validate, sanitize, format)
      const processed = await this.processMessage(message);

      // Update UI - creates microtask
      await this.updateUI(processed);

      // Problem: This loop never yields to event loop!
      // If messages keep coming, queue never empties
      // Microtasks keep getting added
      // Event loop can't process macrotasks (UI events)
    }

    this.processing = false;
  }

  async processMessage(message) {
    // Heavy processing
    return Promise.resolve(sanitize(message));
  }

  async updateUI(message) {
    // DOM update
    return Promise.resolve(appendToChat(message));
  }
}

// When 1000 messages arrive rapidly:
for (let i = 0; i < 1000; i++) {
  chatApp.onMessageReceived({ text: `Message ${i}` });
}

// Result: UI frozen for ~5 seconds
// No scrolling, clicking, typing possible
// Browser shows "Page Unresponsive" warning
```

**Debugging Steps:**

1. **Open Chrome DevTools Performance Tab**:
   ```javascript
   // Record during message flood
   // See: Microtask queue constantly full
   // Main thread: 100% microtask processing
   // No time for rendering or user input
   ```

2. **Check microtask depth**:
   ```javascript
   console.time('processMessages');
   await chatApp.processMessages();
   console.timeEnd('processMessages'); // "processMessages: 4982ms"

   // Chrome warning: "Forced reflow while executing JavaScript"
   // Performance.now() shows no idle time
   ```

3. **Monitor event loop**:
   ```javascript
   let lastCheck = Date.now();
   setInterval(() => {
     const now = Date.now();
     const delay = now - lastCheck;
     console.log(`Event loop delay: ${delay}ms`);
     lastCheck = now;
   }, 100);

   // During problem: "Event loop delay: 5000ms" (supposed to be 100ms!)
   ```

**Solution 1: Break into macrotasks (setTimeout)**

```javascript
// ✅ FIX: Yield to event loop with macrotasks
class ChatApp {
  async processMessages() {
    this.processing = true;
    const BATCH_SIZE = 10; // Process 10 messages per batch

    while (this.messageQueue.length > 0) {
      // Process batch
      for (let i = 0; i < BATCH_SIZE && this.messageQueue.length > 0; i++) {
        const message = this.messageQueue.shift();
        const processed = await this.processMessage(message);
        await this.updateUI(processed);
      }

      // Yield to event loop (macrotask)
      if (this.messageQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
        // → Allows UI events, rendering, user input
      }
    }

    this.processing = false;
  }
}

// Result:
// - Processes 10 messages
// - Yields to event loop
// - UI can render, user can interact
// - Repeat until queue empty
```

**Solution 2: requestAnimationFrame (better for UI)**

```javascript
// ✅ BETTER: Sync with browser rendering
class ChatApp {
  processMessages() {
    this.processing = true;
    const BATCH_SIZE = 10;

    const processBatch = () => {
      if (this.messageQueue.length === 0) {
        this.processing = false;
        return;
      }

      // Process batch synchronously
      for (let i = 0; i < BATCH_SIZE && this.messageQueue.length > 0; i++) {
        const message = this.messageQueue.shift();
        const processed = this.processMessageSync(message);
        this.updateUISync(processed);
      }

      // Schedule next batch for next animation frame
      requestAnimationFrame(processBatch);
      // → Guaranteed 60fps, smooth rendering
    };

    requestAnimationFrame(processBatch);
  }

  processMessageSync(message) {
    return sanitize(message); // Synchronous version
  }

  updateUISync(message) {
    appendToChat(message); // Synchronous DOM update
  }
}

// Result:
// - Processes batches between frames
// - 60fps maintained
// - Smooth scrolling
// - Responsive UI
```

**Solution 3: requestIdleCallback (best for non-critical)**

```javascript
// ✅ BEST: Process during browser idle time
class ChatApp {
  processMessages() {
    this.processing = true;

    const processWhenIdle = (deadline) => {
      // Process while browser is idle
      while (
        deadline.timeRemaining() > 0 &&
        this.messageQueue.length > 0
      ) {
        const message = this.messageQueue.shift();
        const processed = this.processMessageSync(message);
        this.updateUISync(processed);
      }

      // More messages? Schedule for next idle period
      if (this.messageQueue.length > 0) {
        requestIdleCallback(processWhenIdle);
      } else {
        this.processing = false;
      }
    };

    requestIdleCallback(processWhenIdle);
  }
}

// Result:
// - Processes only when browser is idle
// - Zero impact on user interactions
// - Prioritizes responsiveness over speed
```

**Performance Comparison:**

| Approach | Time (1000 msgs) | UI Freeze | Responsiveness | FPS |
|----------|-----------------|-----------|----------------|-----|
| **Microtasks only** | 4982ms | ✅ Yes (5s) | ❌ Blocked | 0 |
| **setTimeout batches** | 5200ms | ❌ No | ✅ Good | 30-40 |
| **requestAnimationFrame** | 5100ms | ❌ No | ✅ Excellent | 60 |
| **requestIdleCallback** | 6500ms | ❌ No | ✅ Perfect | 60 |

**Production Metrics After Fix:**

```javascript
// Before (Microtasks only):
// - UI freeze: 5 seconds during message flood
// - Frame drops: 300 frames (5s × 60fps)
// - User complaints: "Chat freezes when active"
// - Chrome warnings: "Page Unresponsive"

// After (requestAnimationFrame):
// - UI freeze: 0 seconds
// - Frame drops: 0 frames (60fps maintained)
// - User satisfaction: "Smooth even with spam"
// - Processing time: +2% (acceptable trade-off)
```

**Advanced: Hybrid Approach**

```javascript
// ✅ PRODUCTION: Combine strategies for optimal UX
class ChatApp {
  async processMessages() {
    this.processing = true;
    const HIGH_PRIORITY_THRESHOLD = 5; // Show first 5 immediately

    // Phase 1: High priority (microtasks for instant feedback)
    let count = 0;
    while (
      this.messageQueue.length > 0 &&
      count < HIGH_PRIORITY_THRESHOLD
    ) {
      const message = this.messageQueue.shift();
      const processed = await this.processMessage(message);
      await this.updateUI(processed);
      count++;
    }

    // Phase 2: Remaining messages (requestAnimationFrame)
    if (this.messageQueue.length > 0) {
      this.processRemainingWithRAF();
    } else {
      this.processing = false;
    }
  }

  processRemainingWithRAF() {
    const BATCH_SIZE = 10;

    const processBatch = () => {
      for (let i = 0; i < BATCH_SIZE && this.messageQueue.length > 0; i++) {
        const message = this.messageQueue.shift();
        const processed = this.processMessageSync(message);
        this.updateUISync(processed);
      }

      if (this.messageQueue.length > 0) {
        requestAnimationFrame(processBatch);
      } else {
        this.processing = false;
      }
    };

    requestAnimationFrame(processBatch);
  }
}

// Result:
// - First 5 messages: Instant (microtasks)
// - Remaining: Smooth 60fps (requestAnimationFrame)
// - Best of both worlds!
```

**Key Lesson:**

Microtasks are FAST but **block rendering**. Use them for:
- Critical updates (state changes)
- Small, quick operations
- Immediate feedback

Use macrotasks for:
- Background processing
- Large batches
- Non-critical work that can wait

</details>

<details>
<summary><strong>⚖️ Trade-offs: Microtask vs Macrotask Strategies</strong></summary>

**1. Execution Timing:**

| Aspect | Microtasks | Macrotasks |
|--------|-----------|-----------|
| **When executed** | After current task, before render | One per event loop tick |
| **Quantity per tick** | ALL in queue | ONE from queue |
| **Priority** | High | Normal |
| **Blocks rendering** | ✅ Yes | ❌ No |
| **Use for** | Critical state updates | Background work |

```javascript
// Benchmark: 1000 operations

// Microtasks: All execute before render
console.time('microtasks');
for (let i = 0; i < 1000; i++) {
  Promise.resolve().then(() => updateState(i));
}
console.timeEnd('microtasks'); // ~2ms scheduling, ~50ms execution, 0 renders

// Macrotasks: Renders between executions
console.time('macrotasks');
for (let i = 0; i < 1000; i++) {
  setTimeout(() => updateState(i), 0);
}
console.timeEnd('macrotasks'); // ~15ms scheduling, ~1000ms total, ~60 renders
```

**2. UI Responsiveness:**

```javascript
// ❌ WRONG: Microtasks block UI
function updateManyItemsMicro(items) {
  items.forEach(item => {
    Promise.resolve().then(() => {
      processItem(item); // Heavy computation
      updateDOM(item);
    });
  });
}

updateManyItemsMicro(10000);
// → All 10,000 execute before next paint
// → UI frozen for ~2 seconds
// → User can't interact

// ✅ CORRECT: Macrotasks allow UI updates
function updateManyItemsMacro(items, batchSize = 100) {
  let index = 0;

  function processBatch() {
    const end = Math.min(index + batchSize, items.length);

    for (let i = index; i < end; i++) {
      processItem(items[i]);
      updateDOM(items[i]);
    }

    index = end;

    if (index < items.length) {
      setTimeout(processBatch, 0); // Next batch
    }
  }

  processBatch();
}

updateManyItemsMacro(10000);
// → Processes 100 items per tick
// → Renders between batches
// → UI responsive throughout
```

**3. Performance Trade-offs:**

| Operation | Microtask Time | Macrotask Time | Overhead |
|-----------|---------------|---------------|----------|
| Schedule callback | ~0.002ms | ~0.015ms | 7.5x |
| Execute callback | Same | Same | - |
| Total (1000 ops) | ~2ms + execution | ~15ms + execution | +13ms |

```javascript
// When overhead matters vs when it doesn't

// ✅ Microtask: Single async operation
async function fetchUser(id) {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
  // → Promise microtask overhead: ~0.002ms (negligible)
}

// ❌ Microtask: Batched operations
async function fetchAllUsers(ids) {
  return Promise.all(ids.map(id => fetchUser(id)));
  // → 1000 promises × 0.002ms = ~2ms overhead
  // → Still negligible compared to network time
}

// ✅ Macrotask: UI rendering matters
function processLargeDataset(data) {
  const batches = chunk(data, 1000);

  batches.forEach(batch => {
    setTimeout(() => {
      batch.forEach(process);
    }, 0);
  });
  // → Allows rendering between batches
  // → +13ms overhead acceptable for UX
}
```

**4. Memory Usage:**

```javascript
// Microtasks: Lower memory overhead
// - Stored in V8 internal queue
// - Simple closure reference
// - Fast allocation/deallocation

// Macrotasks: Higher memory overhead
// - Stored in host environment (browser/Node.js)
// - Additional timer data structures
// - More complex lifecycle

// Benchmark: Memory usage for 10,000 callbacks
const before = process.memoryUsage().heapUsed;

// Microtasks
const microtasks = [];
for (let i = 0; i < 10000; i++) {
  microtasks.push(Promise.resolve().then(() => {}));
}

const afterMicro = process.memoryUsage().heapUsed;
console.log(`Microtasks: ${(afterMicro - before) / 1024}KB`);
// → ~300KB

// Macrotasks
const macrotasks = [];
for (let i = 0; i < 10000; i++) {
  macrotasks.push(setTimeout(() => {}, 0));
}

const afterMacro = process.memoryUsage().heapUsed;
console.log(`Macrotasks: ${(afterMacro - afterMicro) / 1024}KB`);
// → ~800KB

// Microtasks use ~60% less memory
```

**5. Error Handling:**

```javascript
// Microtasks: Errors in same tick
Promise.resolve()
  .then(() => { throw new Error('Microtask error'); })
  .catch(err => console.error(err)); // Caught immediately

// Uncaught errors:
Promise.resolve().then(() => {
  throw new Error('Uncaught');
});
// → Triggers 'unhandledrejection' event (can still catch)

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason);
});

// Macrotasks: Errors in separate ticks
setTimeout(() => {
  throw new Error('Macrotask error');
}, 0);
// → Uncatchable with try-catch in outer scope
// → Must use window.onerror or error boundary
```

**6. Debugging:**

```javascript
// Microtasks: Harder to debug (no async stack trace)
Promise.resolve()
  .then(() => step1())
  .then(() => step2())
  .then(() => step3());
// → Stack trace shows only current step
// → Hard to trace back to origin

// ✅ Use async stack traces (Chrome DevTools)
// Settings → Enable "Async stack traces"

// Macrotasks: Easier to debug
setTimeout(() => {
  setTimeout(() => {
    setTimeout(() => {
      console.trace('Macrotask trace');
    }, 0);
  }, 0);
}, 0);
// → Clear separation between tasks
// → Easier to set breakpoints
```

**7. Decision Matrix:**

| Scenario | Use Microtask | Use Macrotask | Why |
|----------|--------------|--------------|-----|
| **Single state update** | ✅ Yes | ❌ No | Fast, low overhead |
| **Batch processing** | ❌ No | ✅ Yes | Needs UI updates |
| **Animation** | ❌ No | ✅ RAF | Sync with frames |
| **API response handling** | ✅ Yes | ❌ No | Promise-based |
| **Background computation** | ❌ No | ✅ Yes | Shouldn't block UI |
| **Critical bug fix** | ✅ Yes | ❌ No | Must execute ASAP |
| **Cache cleanup** | ❌ No | ✅ Idle | Low priority |
| **Event debouncing** | ❌ No | ✅ Yes | Delay between executions |

**8. Real-World Patterns:**

```javascript
// Pattern 1: Microtask for state consistency
class Store {
  constructor() {
    this.state = {};
    this.listeners = [];
    this.pendingNotify = false;
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };

    if (!this.pendingNotify) {
      this.pendingNotify = true;

      // Microtask: Batch multiple setState calls
      Promise.resolve().then(() => {
        this.listeners.forEach(fn => fn(this.state));
        this.pendingNotify = false;
      });
    }
  }
}

// Pattern 2: Macrotask for UI work
class UIProcessor {
  processQueue(items) {
    const BATCH_SIZE = 50;
    let index = 0;

    const processBatch = () => {
      const end = Math.min(index + BATCH_SIZE, items.length);

      for (let i = index; i < end; i++) {
        this.processItem(items[i]);
      }

      index = end;

      if (index < items.length) {
        // Macrotask: Allow rendering
        setTimeout(processBatch, 0);
      }
    };

    processBatch();
  }
}

// Pattern 3: Hybrid approach
class DataLoader {
  async load(data) {
    // Phase 1: Critical data (microtask)
    const critical = await Promise.all(
      data.slice(0, 10).map(item => this.loadCritical(item))
    );
    this.renderCritical(critical);

    // Phase 2: Remaining data (macrotask batches)
    const remaining = data.slice(10);
    for (let i = 0; i < remaining.length; i += 50) {
      await new Promise(resolve => setTimeout(resolve, 0));

      const batch = remaining.slice(i, i + 50);
      const loaded = await Promise.all(
        batch.map(item => this.loadNormal(item))
      );
      this.renderBatch(loaded);
    }
  }
}
```

**Key Takeaway:**

- **Microtasks**: Fast, high-priority, blocks rendering → Use for critical state updates
- **Macrotasks**: Slower, normal priority, allows rendering → Use for background work & batches

Choose based on **what's more important: speed or responsiveness**.

</details>

<details>
<summary><strong>💬 Explain to Junior: Microtasks vs Macrotasks</strong></summary>

**Simple Analogy: Restaurant Kitchen**

Imagine a restaurant kitchen with one chef (JavaScript):

**Microtasks = "While you're here..." tasks:**
- Chef is making a dish
- Sous chef says: "While you're here, add salt"
- Chef says: "While you're here, garnish this"
- Boss says: "While you're here, taste this"
- Chef does **ALL** "while you're here" tasks **before moving on**
- ⚠️ If too many, chef never finishes current order!

**Macrotasks = "Next order" tasks:**
- Orders waiting on the ticket rail
- Chef finishes current dish
- Does ALL "while you're here" tasks
- Serves the dish (renders UI)
- Takes **ONE** new order from rail
- Repeat

```javascript
// Code example

console.log('Chef starts shift'); // Synchronous work

// Microtasks: "While you're here..."
Promise.resolve().then(() => {
  console.log('While you\'re here, add salt');
});

Promise.resolve().then(() => {
  console.log('While you\'re here, garnish');
});

// Macrotasks: "Next order"
setTimeout(() => {
  console.log('Next order: Table 1');
}, 0);

setTimeout(() => {
  console.log('Next order: Table 2');
}, 0);

console.log('Chef finishes current dish');

// Output:
// Chef starts shift
// Chef finishes current dish
// While you're here, add salt      ← ALL microtasks
// While you're here, garnish        ← before
// Next order: Table 1               ← any macrotask
// Next order: Table 2
```

**Visual Timeline:**

```javascript
// What happens second-by-second:

// Second 0: Synchronous code
console.log('Start'); // ✅ Execute now

// Second 0: Schedule work
setTimeout(() => console.log('Macro 1'), 0);  // → Macrotask queue
Promise.resolve().then(() => console.log('Micro 1')); // → Microtask queue
setTimeout(() => console.log('Macro 2'), 0);  // → Macrotask queue
Promise.resolve().then(() => console.log('Micro 2')); // → Microtask queue

console.log('End'); // ✅ Execute now

// ┌──────────────────────────────────┐
// │ Call Stack Empty                 │
// └──────────────────────────────────┘
//
// ┌──────────────────────────────────┐
// │ Microtask Queue                  │
// │ [Micro 1, Micro 2]               │ ← Process ALL
// └──────────────────────────────────┘
//
// ✅ Execute: Micro 1
// ✅ Execute: Micro 2
//
// ┌──────────────────────────────────┐
// │ Macrotask Queue                  │
// │ [Macro 1, Macro 2]               │ ← Process ONE
// └──────────────────────────────────┘
//
// ✅ Execute: Macro 1
//
// Check microtasks → Empty
//
// ✅ Execute: Macro 2
//
// Final output: Start, End, Micro 1, Micro 2, Macro 1, Macro 2
```

**Explaining to PM:**

"Think of it like email vs regular mail:

**Microtasks = Urgent emails:**
- Check inbox
- See 5 urgent emails
- Must respond to ALL 5 before moving on
- Fast, high priority
- ⚠️ If emails keep coming, you never leave your desk!

**Macrotasks = Regular mail:**
- Mailman delivers letters
- You open ONE letter
- Process it completely
- Check urgent emails (do all of them)
- Open next letter
- Repeat

**Why it matters:**
- Urgent emails (microtasks): Great for quick updates
- Too many urgent emails: You're stuck at desk, can't do other work
- Regular mail (macrotasks): Allows breaks between letters
- Breaks let you: answer phone, help customers, update reports (render UI)

Our code uses microtasks for critical updates (state changes), macrotasks for background work (processing data)."

**Common Gotcha for Juniors:**

```javascript
// ❌ WRONG: Thinking setTimeout runs immediately

let value = 0;

setTimeout(() => {
  value = 10; // Macrotask
}, 0);

console.log(value); // What prints?

// Answer: 0 (not 10!)
// Why? setTimeout schedules macrotask for LATER
// console.log runs NOW (synchronous)


// ✅ CORRECT: Use Promise for "next available time"

let value2 = 0;

Promise.resolve().then(() => {
  value2 = 10; // Microtask
});

console.log(value2); // Still 0!

// But microtask runs BEFORE setTimeout:
Promise.resolve().then(() => console.log('Micro')); // Runs first
setTimeout(() => console.log('Macro'), 0); // Runs second
```

**Practice Quiz:**

```javascript
// Predict the output:

console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve()
  .then(() => console.log('3'))
  .then(() => console.log('4'));

setTimeout(() => console.log('5'), 0);

Promise.resolve().then(() => {
  console.log('6');
  setTimeout(() => console.log('7'), 0);
});

console.log('8');

// Answer: 1, 8, 3, 6, 4, 2, 5, 7

// Breakdown:
// Sync: 1, 8
// Microtasks (ALL): 3, 6, 4
//   (note: 6 adds setTimeout to macro queue)
// Macrotasks (ONE at a time): 2, 5, 7
```

**Key Rules for Juniors:**

1. **Sync first**: All regular code runs first
2. **Microtasks next**: ALL promises/microtasks run
3. **Macrotask last**: ONE setTimeout/macrotask runs
4. **Repeat** from step 2

```javascript
// Memory trick: "SAMMA"
// S - Sync code
// A - All microtasks
// M - Macrotask (one)
// M - Microtasks again (if any added)
// A - (repeat)
```

**When to Use What (Junior Guide):**

```javascript
// ✅ Use Promise/Microtask when:
// - Updating state
// - Handling API responses
// - Need it to run ASAP

async function updateUserData() {
  const user = await fetch('/api/user').then(r => r.json());
  // ↑ Microtask: Promise callback
  setState({ user }); // Run ASAP
}

// ✅ Use setTimeout/Macrotask when:
// - Background work
// - Want to let UI update
// - Debouncing

function searchProducts(query) {
  // Let user keep typing
  setTimeout(() => {
    fetch(`/api/search?q=${query}`);
  }, 300); // Debounce
}

// ✅ Use requestAnimationFrame when:
// - Animations
// - Visual updates
// - Smooth transitions

function animateElement() {
  requestAnimationFrame(() => {
    element.style.transform = `translateX(${x}px)`;
  });
}
```

**Debugging Tip:**

```javascript
// Add colors to see execution order in console

console.log('%c Sync', 'color: blue; font-weight: bold');

setTimeout(() => {
  console.log('%c Macro', 'color: red; font-weight: bold');
}, 0);

Promise.resolve().then(() => {
  console.log('%c Micro', 'color: green; font-weight: bold');
});

// Blue → Green → Red (always!)
```

</details>

### Follow-up Questions

- "How does queueMicrotask differ from Promise.resolve().then()?"
- "What is process.nextTick in Node.js and how does it fit into the event loop?"
- "Can you have too many microtasks? What happens to performance?"
- "How do MutationObserver callbacks fit into this model?"
- "What is the relationship between requestAnimationFrame and these queues?"

### Resources

- [MDN: Microtasks](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide)
- [JavaScript.info: Microtasks](https://javascript.info/microtask-queue)
- [Jake Archibald: Tasks, microtasks, queues and schedules](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/)
- [Node.js: Event Loop Phases](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/)

---
