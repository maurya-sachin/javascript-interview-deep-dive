# Timers & Scheduling

> **Focus**: JavaScript timers, event loop integration, and scheduling patterns

---

## Question 1: How do setTimeout() and setInterval() work in JavaScript?

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐⭐
**Time:** 10-12 minutes
**Companies:** Google, Meta, Amazon, Microsoft, Netflix

### Question

Explain how `setTimeout()` and `setInterval()` work in JavaScript. Cover:

- Syntax and parameters for both functions
- Return values and timer IDs
- Minimum delays and timing accuracy
- How timers interact with the event loop
- `this` binding behavior in timer callbacks
- Passing arguments to callbacks
- Clearing timers properly
- Common use cases and patterns (debounce, throttle, polling)
- Limitations and accuracy considerations

### Answer

**`setTimeout()` - Execute Once After Delay**

```javascript
const timerId = setTimeout(callback, delay, arg1, arg2, ...);
```

- **callback**: Function to execute after delay
- **delay**: Milliseconds to wait (default: 0)
- **arg1, arg2, ...**: Optional arguments passed to callback
- **Returns**: Positive integer timer ID (used for clearing)

**`setInterval()` - Execute Repeatedly**

```javascript
const timerId = setInterval(callback, delay, arg1, arg2, ...);
```

- Same parameters as `setTimeout()`
- Executes callback repeatedly every `delay` milliseconds
- Continues until cleared with `clearInterval(timerId)`

**Key Characteristics:**

1. **Minimum Delays**:
   - 0ms delay → actually ~1ms minimum
   - Nested `setTimeout()` ≥5 levels deep → 4ms minimum (browser throttling)
   - Background/inactive tabs → 1000ms minimum (browser optimization)

2. **Event Loop Integration**:
   - Timers are **macrotasks** (task queue)
   - Executed after current call stack and microtasks
   - Not guaranteed to run at exact time (depends on event loop)

3. **`this` Binding**:
   - Regular functions: `this` is `window` (or `undefined` in strict mode)
   - Arrow functions: inherit `this` from enclosing scope
   - Methods: need `.bind()` or arrow functions

4. **Clearing Timers**:
   - `clearTimeout(timerId)` - cancel setTimeout
   - `clearInterval(timerId)` - stop setInterval
   - Always clear timers in cleanup code (especially in React/frameworks)

5. **Common Patterns**:
   - **Debounce**: Delay execution until after inactivity period
   - **Throttle**: Limit execution frequency
   - **Polling**: Check server/state at intervals
   - **Delayed actions**: Wait before executing (UI transitions, tooltips)

### Code Example

**Basic Usage:**

```javascript
// setTimeout - execute once after delay
setTimeout(() => {
  console.log('Executed after 2 seconds');
}, 2000);

// setInterval - execute repeatedly
const intervalId = setInterval(() => {
  console.log('Executed every 3 seconds');
}, 3000);

// Clear interval after 10 seconds
setTimeout(() => {
  clearInterval(intervalId);
  console.log('Interval cleared');
}, 10000);
```

**Passing Arguments to Callbacks:**

```javascript
// ✅ Method 1: Use additional parameters
setTimeout(greet, 1000, 'Alice', 'Hello');

function greet(name, greeting) {
  console.log(`${greeting}, ${name}!`); // "Hello, Alice!" after 1s
}

// ✅ Method 2: Use arrow function
const user = 'Bob';
setTimeout(() => {
  greet(user, 'Hi');
}, 1000);

// ❌ DON'T: Call function immediately
setTimeout(greet('Charlie', 'Hey'), 1000); // Executes immediately!
```

**`this` Binding Issues and Solutions:**

```javascript
const person = {
  name: 'Alice',

  // ❌ Problem: this is window/undefined
  greetWrong() {
    setTimeout(function() {
      console.log(`Hello, ${this.name}`); // this is NOT person
    }, 1000);
  },

  // ✅ Solution 1: Arrow function
  greetArrow() {
    setTimeout(() => {
      console.log(`Hello, ${this.name}`); // this is person
    }, 1000);
  },

  // ✅ Solution 2: bind()
  greetBind() {
    setTimeout(function() {
      console.log(`Hello, ${this.name}`);
    }.bind(this), 1000);
  },

  // ✅ Solution 3: Store this reference
  greetSelf() {
    const self = this;
    setTimeout(function() {
      console.log(`Hello, ${self.name}`);
    }, 1000);
  }
};

person.greetWrong(); // "Hello, undefined"
person.greetArrow(); // "Hello, Alice"
person.greetBind(); // "Hello, Alice"
person.greetSelf(); // "Hello, Alice"
```

**Recursive setTimeout Pattern (Self-Adjusting Timer):**

```javascript
// ❌ setInterval: doesn't wait for async completion
setInterval(async () => {
  await fetchData(); // If this takes >5s, requests stack up!
}, 5000);

// ✅ Recursive setTimeout: waits for completion
function poll() {
  setTimeout(async () => {
    await fetchData(); // Completes first
    poll(); // Then schedules next
  }, 5000);
}
poll();

// ✅ With error handling and cleanup
let isPolling = true;

function smartPoll() {
  if (!isPolling) return;

  setTimeout(async () => {
    try {
      await fetchData();
    } catch (error) {
      console.error('Polling error:', error);
    }
    smartPoll(); // Continue polling
  }, 5000);
}

smartPoll();

// Stop polling
function stopPolling() {
  isPolling = false;
}
```

**Clearing Timers Properly:**

```javascript
// ❌ Timer leak: never cleared
function leakyComponent() {
  setInterval(() => {
    console.log('Still running even after component unmounted!');
  }, 1000);
}

// ✅ Store ID and clear
function properComponent() {
  const timerId = setInterval(() => {
    console.log('Interval running');
  }, 1000);

  // Cleanup function
  return () => {
    clearInterval(timerId);
    console.log('Cleaned up!');
  };
}

const cleanup = properComponent();
// Later...
cleanup(); // Stops interval

// ✅ React useEffect pattern
function MyComponent() {
  useEffect(() => {
    const timerId = setInterval(() => {
      console.log('Component alive');
    }, 1000);

    // Cleanup on unmount
    return () => clearInterval(timerId);
  }, []);
}
```

**Minimum Delay Demonstration:**

```javascript
// 0ms delay → actually ~1ms
console.log('Start:', performance.now());

setTimeout(() => {
  console.log('0ms delay:', performance.now());
  // Output: ~1-4ms actual delay
}, 0);

// Nested setTimeout ≥5 levels → 4ms minimum
function nestedTimers(depth = 0) {
  const start = performance.now();

  setTimeout(() => {
    const elapsed = performance.now() - start;
    console.log(`Depth ${depth}: ${elapsed.toFixed(2)}ms`);

    if (depth < 7) {
      nestedTimers(depth + 1);
    }
  }, 0);
}

nestedTimers();
// Output:
// Depth 0: ~1ms
// Depth 1: ~1ms
// Depth 2: ~1ms
// Depth 3: ~1ms
// Depth 4: ~1ms
// Depth 5: ~4ms ← Throttled!
// Depth 6: ~4ms
// Depth 7: ~4ms
```

**Event Loop Interaction (Macrotask vs Microtask):**

```javascript
console.log('1: Synchronous');

setTimeout(() => {
  console.log('2: setTimeout (macrotask)');
}, 0);

Promise.resolve().then(() => {
  console.log('3: Promise (microtask)');
});

console.log('4: Synchronous');

// Output order:
// 1: Synchronous
// 4: Synchronous
// 3: Promise (microtask) ← Microtasks first
// 2: setTimeout (macrotask) ← Then macrotasks
```

**Debounce Implementation with setTimeout:**

```javascript
function debounce(func, delay) {
  let timerId;

  return function(...args) {
    // Clear previous timer
    clearTimeout(timerId);

    // Set new timer
    timerId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// Usage: Search input
const searchInput = document.getElementById('search');
const debouncedSearch = debounce((query) => {
  console.log('Searching for:', query);
  // API call here
}, 500);

searchInput.addEventListener('input', (e) => {
  debouncedSearch(e.target.value);
  // Only searches 500ms after user stops typing
});
```

**Throttle Implementation with setTimeout:**

```javascript
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

// Usage: Scroll event
const throttledScroll = throttle(() => {
  console.log('Scroll position:', window.scrollY);
}, 200);

window.addEventListener('scroll', throttledScroll);
// Only logs every 200ms maximum
```

**Polling Pattern with setInterval:**

```javascript
// Simple polling
const pollInterval = setInterval(async () => {
  const data = await fetch('/api/status').then(r => r.json());
  console.log('Status:', data);

  if (data.complete) {
    clearInterval(pollInterval);
    console.log('Polling stopped: task complete');
  }
}, 3000);

// ✅ Better: With error handling and backoff
class Poller {
  constructor(url, interval = 3000, maxRetries = 5) {
    this.url = url;
    this.interval = interval;
    this.maxRetries = maxRetries;
    this.retries = 0;
    this.timerId = null;
  }

  start() {
    this.poll();
  }

  async poll() {
    try {
      const data = await fetch(this.url).then(r => r.json());
      console.log('Data:', data);

      this.retries = 0; // Reset on success

      if (!data.complete) {
        this.timerId = setTimeout(() => this.poll(), this.interval);
      } else {
        console.log('Polling complete');
      }
    } catch (error) {
      console.error('Polling error:', error);

      if (++this.retries < this.maxRetries) {
        // Exponential backoff
        const backoff = this.interval * Math.pow(2, this.retries);
        console.log(`Retrying in ${backoff}ms...`);
        this.timerId = setTimeout(() => this.poll(), backoff);
      } else {
        console.error('Max retries reached');
      }
    }
  }

  stop() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
      console.log('Polling stopped');
    }
  }
}

const poller = new Poller('/api/job-status', 2000);
poller.start();
// Later: poller.stop();
```

**Animation: setInterval vs requestAnimationFrame:**

```javascript
// ❌ setInterval for animation (janky, not synced with display refresh)
let position = 0;
setInterval(() => {
  position += 5;
  element.style.left = position + 'px';
}, 16); // ~60fps, but not smooth

// ✅ requestAnimationFrame (smooth, synced with browser paint)
let position = 0;
function animate() {
  position += 5;
  element.style.left = position + 'px';

  if (position < 500) {
    requestAnimationFrame(animate);
  }
}
requestAnimationFrame(animate);
```

**Timer ID Management:**

```javascript
// ✅ Timer registry for cleanup
class TimerManager {
  constructor() {
    this.timers = new Map();
  }

  setTimeout(callback, delay, id = Symbol()) {
    const timerId = setTimeout(() => {
      callback();
      this.timers.delete(id);
    }, delay);

    this.timers.set(id, { type: 'timeout', timerId });
    return id;
  }

  setInterval(callback, delay, id = Symbol()) {
    const timerId = setInterval(callback, delay);
    this.timers.set(id, { type: 'interval', timerId });
    return id;
  }

  clear(id) {
    const timer = this.timers.get(id);
    if (!timer) return;

    if (timer.type === 'timeout') {
      clearTimeout(timer.timerId);
    } else {
      clearInterval(timer.timerId);
    }

    this.timers.delete(id);
  }

  clearAll() {
    for (const [id, timer] of this.timers) {
      if (timer.type === 'timeout') {
        clearTimeout(timer.timerId);
      } else {
        clearInterval(timer.timerId);
      }
    }
    this.timers.clear();
  }
}

// Usage
const timerManager = new TimerManager();

const id1 = timerManager.setTimeout(() => console.log('Task 1'), 1000);
const id2 = timerManager.setInterval(() => console.log('Task 2'), 2000);

// Clear specific timer
timerManager.clear(id1);

// Clear all on cleanup
window.addEventListener('beforeunload', () => {
  timerManager.clearAll();
});
```

**Common Mistakes:**

```javascript
// ❌ Mistake 1: Forgetting to clear timers
function Component() {
  setInterval(() => {
    console.log('Memory leak!');
  }, 1000);
} // Timer keeps running forever

// ✅ Fix: Always clear
function Component() {
  const id = setInterval(() => console.log('OK'), 1000);
  return () => clearInterval(id);
}

// ❌ Mistake 2: Calling function instead of passing reference
setTimeout(myFunction(), 1000); // Executes immediately!

// ✅ Fix: Pass reference or use arrow function
setTimeout(myFunction, 1000);
setTimeout(() => myFunction(), 1000);

// ❌ Mistake 3: Wrong this binding
const obj = {
  value: 42,
  method() {
    setTimeout(function() {
      console.log(this.value); // undefined
    }, 1000);
  }
};

// ✅ Fix: Use arrow function
const obj = {
  value: 42,
  method() {
    setTimeout(() => {
      console.log(this.value); // 42
    }, 1000);
  }
};

// ❌ Mistake 4: setInterval without clearing
setInterval(() => {
  fetchData(); // Runs forever, even after navigation!
}, 5000);

// ✅ Fix: Store ID and implement cleanup
const intervalId = setInterval(() => fetchData(), 5000);
// Clear when done
window.addEventListener('beforeunload', () => clearInterval(intervalId));
```


<details>
<summary><strong>🔍 Deep Dive: JavaScript Timers</strong></summary>


**Browser Timer Implementation (Chromium/V8):**

JavaScript timers are implemented using the browser's event loop and timer heap:

1. **Timer Registration**:
   ```cpp
   // Simplified Chromium implementation
   class TimerBase {
     double next_fire_time_;
     TimerHeap* heap_;

     void Start(double interval) {
       next_fire_time_ = CurrentTime() + interval;
       heap_->Insert(this); // Add to min-heap sorted by fire time
     }
   };
   ```

2. **Timer Heap (Min-Heap)**:
   - Timers stored in priority queue sorted by next fire time
   - O(log n) insertion, O(1) peek next timer
   - Browser checks heap each event loop iteration

3. **Timer Execution Flow**:
   ```
   Event Loop Iteration:
   1. Execute current task (script, event handler)
   2. Execute all microtasks (Promises, queueMicrotask)
   3. Check timer heap for expired timers
   4. If timer expired → add callback to macrotask queue
   5. Render (if needed)
   6. Repeat
   ```

**Event Loop Phases (Node.js):**

Node.js has explicit phases:

```
   ┌───────────────────────────┐
┌─>│           timers          │ ← setTimeout/setInterval callbacks
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │     pending callbacks     │
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │       idle, prepare       │
│  └─────────────┬─────────────┘      ┌───────────────┐
│  ┌─────────────┴─────────────┐      │   incoming:   │
│  │           poll            │<─────┤  connections, │
│  └─────────────┬─────────────┘      │   data, etc.  │
│  ┌─────────────┴─────────────┐      └───────────────┘
│  │           check           │ ← setImmediate callbacks
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
└──┤      close callbacks      │
   └───────────────────────────┘
```

**Macrotask vs Microtask Queue:**

```javascript
// Macrotasks (Task Queue):
// - setTimeout, setInterval
// - setImmediate (Node.js)
// - I/O operations
// - UI rendering

// Microtasks (Microtask Queue):
// - Promise.then/catch/finally
// - queueMicrotask()
// - MutationObserver

// Execution order:
console.log('1: Sync');

setTimeout(() => console.log('2: Macro'), 0);

Promise.resolve().then(() => console.log('3: Micro'));

queueMicrotask(() => console.log('4: Micro'));

setTimeout(() => console.log('5: Macro'), 0);

console.log('6: Sync');

// Output: 1, 6, 3, 4, 2, 5
// Rule: All microtasks between each macrotask
```

**Timer Resolution and Accuracy:**

Timers are **not precise** due to:

1. **Minimum Delays**:
   ```javascript
   // HTML5 spec: Nested setTimeout ≥5 levels → 4ms minimum
   // Reason: Prevent CPU hogging by infinite setTimeout(fn, 0) loops

   function measureNesting() {
     const times = [];
     let lastTime = performance.now();

     function nested(depth) {
       setTimeout(() => {
         const now = performance.now();
         const elapsed = now - lastTime;
         times.push({ depth, elapsed });
         lastTime = now;

         if (depth < 10) nested(depth + 1);
         else console.table(times);
       }, 0);
     }

     nested(0);
   }

   measureNesting();
   // Depths 0-4: ~1ms
   // Depths 5+: ~4ms (throttled)
   ```

2. **Background Tab Throttling**:
   ```javascript
   // Inactive tabs: 1000ms minimum delay
   // Reason: Save battery and CPU

   document.addEventListener('visibilitychange', () => {
     if (document.hidden) {
       console.log('Tab hidden: timers will be throttled to 1s minimum');
     } else {
       console.log('Tab visible: normal timer behavior');
     }
   });
   ```

3. **Event Loop Congestion**:
   ```javascript
   // If main thread busy, timers delayed
   setTimeout(() => console.log('Should run at 100ms'), 100);

   // Block for 200ms
   const start = Date.now();
   while (Date.now() - start < 200) {} // Blocking!

   // Timer callback runs AFTER blocking ends (~200ms actual delay)
   ```

**Why Nested setTimeout ≥5 Times → 4ms Minimum:**

From HTML5 specification:

```
If nesting level is greater than 5, and timeout is less than 4ms,
then set timeout to 4ms.

Purpose: Prevent malicious/poorly-written code from hogging CPU
with setTimeout(fn, 0) loops.
```

Example:

```javascript
let level = 0;
function nest() {
  const start = performance.now();
  setTimeout(() => {
    const elapsed = performance.now() - start;
    console.log(`Level ${level}: ${elapsed.toFixed(2)}ms`);

    if (++level < 10) nest();
  }, 0);
}
nest();

// Output:
// Level 0: 1.20ms
// Level 1: 1.15ms
// Level 2: 1.10ms
// Level 3: 1.25ms
// Level 4: 1.05ms
// Level 5: 4.10ms ← Throttled!
// Level 6: 4.05ms
// Level 7: 4.15ms
// ...
```

**Worker Threads and Timers:**

Web Workers have separate event loops:

```javascript
// main.js
const worker = new Worker('worker.js');

setTimeout(() => {
  console.log('Main thread timer');
}, 1000);

// worker.js
setTimeout(() => {
  console.log('Worker thread timer');
  // Runs independently of main thread
}, 1000);
```

**Performance.now() vs Date.now() for Timing:**

```javascript
// Date.now(): System clock (can jump/adjust)
const start1 = Date.now();
// ... work ...
const elapsed1 = Date.now() - start1;
// Problem: Unreliable if system clock changes

// performance.now(): Monotonic clock (never goes backward)
const start2 = performance.now();
// ... work ...
const elapsed2 = performance.now() - start2;
// Better: Always accurate, microsecond resolution

// Comparison
console.log(Date.now());          // 1699564823456 (timestamp)
console.log(performance.now());   // 1234.5678901234 (ms since page load)
```

**V8 Timer Optimization Strategies:**

1. **Timer Heap Coalescing**:
   ```javascript
   // Multiple timers with same delay → batched
   setTimeout(() => console.log('A'), 1000);
   setTimeout(() => console.log('B'), 1000);
   setTimeout(() => console.log('C'), 1000);
   // V8 may execute all in same tick
   ```

2. **Timer Deferral**:
   ```javascript
   // Low-priority timers deferred during high load
   // Browser prioritizes rendering and user interaction
   ```

**Memory Leaks from Uncleared Timers:**

```javascript
// ❌ Memory leak example
class DataFetcher {
  constructor() {
    this.data = new Array(1000000); // Large array

    setInterval(() => {
      console.log('Fetching...', this.data.length);
    }, 1000);
  }
}

const fetchers = [];
for (let i = 0; i < 100; i++) {
  fetchers.push(new DataFetcher());
  // Each keeps 1M array in memory forever!
}

// ✅ Fix: Store timer ID and clear
class DataFetcher {
  constructor() {
    this.data = new Array(1000000);

    this.timerId = setInterval(() => {
      console.log('Fetching...', this.data.length);
    }, 1000);
  }

  destroy() {
    clearInterval(this.timerId);
    this.data = null; // Allow GC
  }
}
```

**Timer Drift and Compensation:**

```javascript
// setInterval drifts over time
let expectedTime = Date.now() + 1000;
setInterval(() => {
  const drift = Date.now() - expectedTime;
  console.log('Drift:', drift, 'ms');
  expectedTime += 1000;
}, 1000);

// Output after 10 seconds:
// Drift: 2ms
// Drift: 5ms
// Drift: 8ms
// Drift: 12ms (accumulates!)

// ✅ Self-correcting timer
class PreciseTimer {
  constructor(callback, interval) {
    this.callback = callback;
    this.interval = interval;
    this.expected = Date.now() + interval;
    this.timerId = null;
    this.start();
  }

  start() {
    this.tick();
  }

  tick() {
    const drift = Date.now() - this.expected;

    this.callback();

    this.expected += this.interval;

    // Compensate for drift
    const nextDelay = Math.max(0, this.interval - drift);
    this.timerId = setTimeout(() => this.tick(), nextDelay);
  }

  stop() {
    clearTimeout(this.timerId);
  }
}

const timer = new PreciseTimer(() => {
  console.log('Tick');
}, 1000);
// Drift stays near 0ms
```

**Comparison: setTimeout vs requestAnimationFrame vs setImmediate:**

```javascript
// setTimeout: Minimum ~4ms delay, not synced with rendering
setTimeout(() => {
  element.style.left = '100px'; // May cause tearing
}, 16);

// requestAnimationFrame: Synced with browser paint cycle (~60fps)
requestAnimationFrame(() => {
  element.style.left = '100px'; // Smooth, no tearing
});

// setImmediate (Node.js): Executes after I/O events, before timers
setImmediate(() => {
  console.log('Immediate'); // After current I/O
});

setTimeout(() => {
  console.log('Timeout'); // After timers phase
}, 0);

// Node.js output order here is NOT guaranteed (depends on process performance);
// it's only deterministic ("immediate" always first) when both are scheduled
// from within an I/O callback.
```


</details>


<details>
<summary><strong>🐛 Real-World Scenario: JavaScript Timers</strong></summary>


**Context: Real-Time Stock Trading Dashboard Memory Leak**

**The System:**
- React-based stock trading dashboard
- 50+ components displaying live stock prices
- Real-time updates every 2 seconds via WebSocket
- Live charts, price tickers, portfolio value updates
- Deployed to 12,000+ active traders

**The Problem:**

Week of March 2024:
- Users reporting browser crashes after 2-3 hours of trading
- Chrome DevTools showing 2.8GB memory usage (started at 120MB)
- 89 crash reports per day
- $234,000 in lost trades due to crashes during peak hours
- Client escalation: "Critical P0 - traders losing money"

**Initial Symptoms:**

```javascript
// User complaints:
// - "Browser becomes sluggish after 1 hour"
// - "Tab crashes during market hours"
// - "Memory usage keeps growing"
// - "Page reload fixes it temporarily"
```

**Investigation Process:**

**Step 1: Chrome DevTools Memory Profiler**

```javascript
// Take heap snapshots every 30 minutes
// Observation: Memory growing linearly ~800MB/hour

// Heap snapshot comparison:
// Snapshot 1 (0min):  120MB
// Snapshot 2 (30min): 520MB
// Snapshot 3 (60min): 920MB
// Snapshot 4 (90min): 1.3GB

// Red flag: Detached DOM nodes growing
// 0min: 45 detached nodes
// 90min: 18,234 detached nodes (!)
```

**Step 2: Allocation Timeline**

```javascript
// Record allocation timeline for 5 minutes
// Identified: Array objects growing unbounded
// Source: Timer callbacks still executing after component unmount
```

**Step 3: Code Audit - Found The Culprit**

```javascript
// ❌ BUGGY CODE: StockTicker component
function StockTicker({ symbol }) {
  const [price, setPrice] = useState(null);

  useEffect(() => {
    // Fetch price every 2 seconds
    setInterval(async () => {
      const data = await fetch(`/api/stocks/${symbol}`).then(r => r.json());
      setPrice(data.price);
    }, 2000);

    // ❌ CRITICAL BUG: No cleanup! Timer runs forever!
  }, [symbol]);

  return <div>Price: ${price}</div>;
}

// What happens:
// 1. User views 50 stocks → 50 intervals created
// 2. User switches to portfolio view → StockTicker components unmount
// 3. 50 intervals STILL RUNNING in background!
// 4. Each interval holds references to unmounted components
// 5. Components can't be garbage collected
// 6. After 2 hours: 3,600 intervals running (50 tickers × 36 view changes/hour)
```

**Step 4: Reproduce Locally**

```javascript
// Reproduction script
function simulateUserBehavior() {
  let mountCount = 0;

  const interval = setInterval(() => {
    // Simulate mounting 50 StockTickers
    for (let i = 0; i < 50; i++) {
      mountBuggyComponent();
    }

    mountCount++;
    console.log(`Mounted ${mountCount * 50} components total`);
    console.log(`Memory: ${(performance.memory.usedJSHeapSize / 1048576).toFixed(2)}MB`);

    if (mountCount === 100) {
      clearInterval(interval);
      console.log('Final memory:', performance.memory.usedJSHeapSize / 1048576, 'MB');
      // Result: 2.4GB memory usage (confirmed the bug!)
    }
  }, 1000);
}

simulateUserBehavior();
```

**Root Cause Analysis:**

1. **Missing Cleanup Function**: `useEffect` didn't return cleanup function
2. **Timer References**: Each `setInterval` kept closure references to:
   - `symbol` prop
   - `setPrice` state updater
   - Component fiber node (React internals)
3. **Garbage Collection Blocked**: Detached components couldn't be GC'd
4. **Linear Growth**: Every view change added 50 more unclearable timers

**The Solution:**

**Fix 1: Add Cleanup Function**

```javascript
// ✅ FIXED: Proper cleanup
function StockTicker({ symbol }) {
  const [price, setPrice] = useState(null);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      const data = await fetch(`/api/stocks/${symbol}`).then(r => r.json());
      setPrice(data.price);
    }, 2000);

    // ✅ Cleanup: Clear interval on unmount
    return () => {
      clearInterval(intervalId);
      console.log(`Cleaned up interval for ${symbol}`);
    };
  }, [symbol]);

  return <div>Price: ${price}</div>;
}
```

**Fix 2: Timer Registry for Tracking**

```javascript
// ✅ Global timer registry (development mode)
class TimerRegistry {
  constructor() {
    this.timers = new Map();
  }

  register(id, componentName) {
    this.timers.set(id, {
      component: componentName,
      timestamp: Date.now()
    });
  }

  unregister(id) {
    this.timers.delete(id);
  }

  logActiveTimers() {
    console.log('Active timers:', this.timers.size);
    for (const [id, info] of this.timers) {
      const age = (Date.now() - info.timestamp) / 1000;
      console.log(`- ${info.component}: ${age.toFixed(0)}s old`);
    }
  }
}

const timerRegistry = new TimerRegistry();

// Usage in component
function StockTicker({ symbol }) {
  const [price, setPrice] = useState(null);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      const data = await fetch(`/api/stocks/${symbol}`).then(r => r.json());
      setPrice(data.price);
    }, 2000);

    if (process.env.NODE_ENV === 'development') {
      timerRegistry.register(intervalId, `StockTicker:${symbol}`);
    }

    return () => {
      clearInterval(intervalId);
      if (process.env.NODE_ENV === 'development') {
        timerRegistry.unregister(intervalId);
      }
    };
  }, [symbol]);

  return <div>Price: ${price}</div>;
}

// Check for leaks in dev console
window.checkTimers = () => timerRegistry.logActiveTimers();
```

**Fix 3: ESLint Rule to Prevent Future Leaks**

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'react-hooks/exhaustive-deps': 'error',

    // Custom rule: Require cleanup for timers
    'custom/require-timer-cleanup': 'error'
  }
};

// custom/require-timer-cleanup rule implementation
module.exports = {
  create(context) {
    return {
      CallExpression(node) {
        // Detect setInterval/setTimeout without cleanup
        if (
          ['setInterval', 'setTimeout'].includes(node.callee.name) &&
          !hasCleanupFunction(node)
        ) {
          context.report({
            node,
            message: 'Timer must be cleared in cleanup function'
          });
        }
      }
    };
  }
};
```

**Fix 4: Automated Memory Testing**

```javascript
// memory-leak.test.js
describe('Memory leak prevention', () => {
  it('should cleanup timers on unmount', async () => {
    const { unmount } = render(<StockTicker symbol="AAPL" />);

    // Check no lingering timers
    const timersBefore = getActiveTimers(); // Custom helper
    unmount();

    await wait(100); // Let cleanup run

    const timersAfter = getActiveTimers();
    expect(timersAfter).toBe(timersBefore - 1);
  });

  it('should not leak memory after 100 mount/unmount cycles', async () => {
    const memoryBefore = performance.memory.usedJSHeapSize;

    for (let i = 0; i < 100; i++) {
      const { unmount } = render(<StockTicker symbol="AAPL" />);
      await wait(10);
      unmount();
    }

    // Force garbage collection (Chrome --expose-gc flag)
    if (global.gc) global.gc();

    await wait(1000);

    const memoryAfter = performance.memory.usedJSHeapSize;
    const growth = (memoryAfter - memoryBefore) / 1048576;

    // Allow 10MB growth (generous buffer)
    expect(growth).toBeLessThan(10);
  });
});
```

**Results After Fix:**

**Immediate Impact (Week 1):**
- ✅ Memory usage: Stable at 118-125MB (down from 2.8GB)
- ✅ Crash rate: 0 crashes (down from 89/day)
- ✅ No detached DOM nodes accumulation
- ✅ Browser responsive even after 8+ hours

**Business Impact:**
- ✅ $0 lost trades due to crashes (down from $234k/week)
- ✅ 99.9% uptime during market hours
- ✅ 95% customer satisfaction score (up from 62%)
- ✅ Zero P0 escalations

**Long-Term Improvements:**
- ✅ ESLint rule prevents future timer leaks (11 violations caught in code review)
- ✅ Automated memory tests in CI/CD (fail build if >50MB growth)
- ✅ Timer registry in development mode (easy debugging)
- ✅ Documentation: "Timer Best Practices" guide for team

**Key Lessons:**

1. **Always cleanup timers** in `useEffect` return functions
2. **Memory profiling** essential for long-running apps
3. **Detached DOM nodes** = red flag for memory leaks
4. **Automated testing** prevents regressions
5. **Development tools** (timer registry) accelerate debugging


</details>


<details>
<summary><strong>⚖️ Trade-offs: JavaScript Timers</strong></summary>


**1. setTimeout vs setInterval**

| Aspect | setTimeout | setInterval | Winner |
|--------|-----------|-------------|---------|
| **Precision** | Self-adjusting with recursive pattern | Fixed intervals, accumulates drift | setTimeout |
| **Cleanup** | Auto-clears after execution | Must manually clear | setTimeout |
| **Simplicity** | Requires recursive pattern | One-line setup | setInterval |
| **Async Safety** | Waits for callback completion | Can stack callbacks | setTimeout |
| **Use Case** | Delays, debounce, adaptive polling | Fixed-rate tasks, clocks | Depends |
| **Memory** | Lower (cleared automatically) | Higher (runs forever) | setTimeout |

**When to use setTimeout:**
```javascript
// ✅ Delays and one-time actions
setTimeout(() => showTooltip(), 500);

// ✅ Debouncing user input
const debounced = debounce(handleInput, 300);

// ✅ Adaptive polling (waits for completion)
function poll() {
  setTimeout(async () => {
    await fetchData();
    poll(); // Next iteration after completion
  }, 5000);
}
```

**When to use setInterval:**
```javascript
// ✅ Fixed-rate tasks (fast callbacks)
setInterval(() => {
  updateClock(); // Synchronous, fast
}, 1000);

// ✅ Heartbeat/keepalive
setInterval(() => {
  sendHeartbeat(); // Fast, no async
}, 30000);
```


</details>

---

**2. Recursive setTimeout vs setInterval**

| Aspect | Recursive setTimeout | setInterval | Winner |
|--------|---------------------|-------------|---------|
| **Drift Compensation** | Self-adjusting | Accumulates drift | Recursive setTimeout |
| **Callback Stacking** | Never stacks (waits) | Can stack if slow | Recursive setTimeout |
| **Code Complexity** | More complex (recursive) | Simpler (one line) | setInterval |
| **Async Callbacks** | Safe (waits for Promise) | Unsafe (stacks) | Recursive setTimeout |
| **CPU Usage** | Lower (adaptive) | Higher (fixed) | Recursive setTimeout |

**Example: Async callback handling**

```javascript
// ❌ setInterval: Callbacks stack if API slow
setInterval(async () => {
  await fetch('/api/data'); // If this takes >5s, next call starts anyway!
}, 5000);
// Result: Multiple concurrent requests, API overload

// ✅ Recursive setTimeout: Waits for completion
function poll() {
  setTimeout(async () => {
    await fetch('/api/data'); // Completes first
    poll(); // Then schedules next
  }, 5000);
}
poll();
// Result: One request at a time, no stacking
```

---

**3. Timer-Based Polling vs WebSocket/SSE**

| Aspect | Polling (timers) | WebSocket/SSE | Winner |
|--------|-----------------|---------------|---------|
| **Latency** | High (poll interval) | Low (instant) | WebSocket/SSE |
| **Server Load** | High (repeated requests) | Low (persistent connection) | WebSocket/SSE |
| **Simplicity** | Simple (setTimeout/setInterval) | Complex (connection management) | Polling |
| **Firewall/Proxy** | Works everywhere (HTTP) | May be blocked | Polling |
| **Real-Time** | Pseudo real-time | True real-time | WebSocket/SSE |
| **Fallback** | Always works | Needs fallback to polling | Polling |

**Decision matrix:**

```javascript
// Use Polling when:
// - Simple use case (check status every 30s)
// - Real-time not critical
// - Firewall/proxy concerns
// - Low update frequency (<1/min)

const pollForStatus = () => {
  setTimeout(async () => {
    const status = await fetch('/api/status').then(r => r.json());
    updateUI(status);

    if (!status.complete) {
      pollForStatus(); // Continue
    }
  }, 10000); // Every 10 seconds
};

// Use WebSocket when:
// - True real-time needed (<100ms latency)
// - High update frequency (>1/second)
// - Bi-directional communication
// - Many concurrent users

const ws = new WebSocket('wss://api.example.com');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  updateUI(data); // Instant updates
};
```

---

**4. setInterval vs requestAnimationFrame for Animations**

| Aspect | setInterval | requestAnimationFrame | Winner |
|--------|-------------|----------------------|---------|
| **Smoothness** | Janky (not synced) | Smooth (60fps synced) | RAF |
| **Battery** | Higher drain | Optimized (pauses when hidden) | RAF |
| **Precision** | ~16ms (unsynced) | Browser paint cycle | RAF |
| **Control** | Manual timing | Browser-controlled | setInterval |
| **Use Case** | Non-visual timers | Animations, visual updates | RAF |

**Performance comparison:**

```javascript
// ❌ setInterval: Janky animation
let position = 0;
setInterval(() => {
  position += 5;
  element.style.transform = `translateX(${position}px)`;
}, 16); // Not synced with paint, tearing/jank

// ✅ requestAnimationFrame: Smooth 60fps
let position = 0;
function animate() {
  position += 5;
  element.style.transform = `translateX(${position}px)`;

  if (position < 500) {
    requestAnimationFrame(animate);
  }
}
requestAnimationFrame(animate);
// Synced with browser paint, smooth
```

---

**5. Client-Side vs Server-Side Polling**

| Aspect | Client Polling (setTimeout) | Server Polling (cron, workers) | Winner |
|--------|----------------------------|-------------------------------|---------|
| **User-Specific** | Yes (per user) | No (shared) | Client |
| **Scalability** | Poor (N users = N polls) | Good (1 poll for all) | Server |
| **Latency** | Lower (direct to user) | Higher (poll → notify → user) | Client |
| **Server Load** | High (N × poll rate) | Low (1 × poll rate) | Server |
| **Offline** | Stops when tab closed | Continues 24/7 | Server |

**Decision matrix:**

```javascript
// Use Client-Side Polling when:
// - User-specific data (notifications, cart)
// - Low user count (<100 concurrent)
// - Simple implementation needed

function pollNotifications() {
  setTimeout(async () => {
    const notifications = await fetch('/api/user/notifications').then(r => r.json());
    updateBadge(notifications.count);
    pollNotifications();
  }, 30000);
}

// Use Server-Side Polling when:
// - Shared data (stock prices, weather)
// - High user count (>1000 concurrent)
// - Need background processing

// Server (Node.js cron job)
cron.schedule('*/10 * * * * *', async () => {
  const prices = await fetchStockPrices();
  io.emit('prices', prices); // Broadcast to all WebSocket clients
});
```

---

**Performance Comparison Table:**

| Task | setTimeout | setInterval | RAF | WebSocket | Winner |
|------|-----------|-------------|-----|-----------|---------|
| **Debounce** | ⭐⭐⭐⭐⭐ | ⭐ | N/A | N/A | setTimeout |
| **Throttle** | ⭐⭐⭐⭐ | ⭐⭐⭐ | N/A | N/A | setTimeout |
| **Clock Display** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ | N/A | setInterval |
| **API Polling** | ⭐⭐⭐⭐⭐ | ⭐⭐ | N/A | ⭐⭐⭐⭐ | setTimeout or WS |
| **Animations** | ⭐ | ⭐ | ⭐⭐⭐⭐⭐ | N/A | RAF |
| **Real-Time Chat** | ⭐ | ⭐ | N/A | ⭐⭐⭐⭐⭐ | WebSocket |
| **Heartbeat** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | N/A | ⭐⭐⭐⭐ | setInterval or WS |


<details>
<summary><strong>💬 Explain to Junior: JavaScript Timers Simplified</strong></summary>


**Simple Analogy:**

Think of JavaScript timers like setting alarms on your phone:

- **setTimeout** = One-time alarm
  - "Wake me up in 30 minutes" → rings once and stops
  - Example: Snooze button, cooking timer

- **setInterval** = Repeating alarm
  - "Remind me every hour to drink water" → keeps ringing every hour
  - Example: Medication reminders, daily standup

**How They Work (Simple Explanation):**

```javascript
// setTimeout: Do something ONCE after a delay
setTimeout(() => {
  console.log('This runs once after 2 seconds');
}, 2000);

// setInterval: Do something REPEATEDLY every interval
setInterval(() => {
  console.log('This runs every 3 seconds');
}, 3000);
```

**Why Timers Aren't Perfectly Accurate:**

Imagine you're a chef (JavaScript) cooking multiple dishes (tasks):

1. **Main dish cooking** (synchronous code) - you're busy chopping
2. **Timer rings** (setTimeout callback) - but you can't stop chopping immediately!
3. **You finish chopping** (current task completes)
4. **Then you check the timer** (event loop processes timer callback)

Result: Timer callback runs a bit late because you were busy.

**The `this` Binding Problem (Simplified):**

```javascript
const person = {
  name: 'Alice',

  // ❌ Problem: setTimeout forgets who 'this' is
  greetWrong() {
    setTimeout(function() {
      console.log(this.name); // undefined - 'this' is NOT person!
    }, 1000);
  },

  // ✅ Solution: Arrow function remembers 'this'
  greetRight() {
    setTimeout(() => {
      console.log(this.name); // 'Alice' - 'this' is person!
    }, 1000);
  }
};

person.greetWrong(); // "undefined"
person.greetRight(); // "Alice"
```

**Rule of thumb:** Use arrow functions in timers to keep `this` working correctly.

**Common Mistakes and Fixes:**

**Mistake 1: Forgetting to clear timers**

```javascript
// ❌ Bad: Timer runs forever, even after you don't need it
function startClock() {
  setInterval(() => {
    console.log(new Date());
  }, 1000);
} // No way to stop it!

// ✅ Good: Save the ID so you can stop it later
function startClock() {
  const clockId = setInterval(() => {
    console.log(new Date());
  }, 1000);

  // Return a function to stop the clock
  return () => clearInterval(clockId);
}

const stopClock = startClock(); // Start clock
// Later...
stopClock(); // Stop clock
```

**Mistake 2: Calling function instead of passing it**

```javascript
// ❌ Bad: Executes immediately!
setTimeout(myFunction(), 1000); // Runs NOW, not after 1 second

// ✅ Good: Pass function reference
setTimeout(myFunction, 1000); // Runs after 1 second

// ✅ Or use arrow function
setTimeout(() => myFunction(), 1000); // Runs after 1 second
```

**Interview Answer Template:**

> "setTimeout and setInterval are JavaScript functions for scheduling code execution. setTimeout runs a callback once after a delay, while setInterval runs it repeatedly at intervals. They work with the event loop's macrotask queue, so they're not perfectly precise. Common uses include debouncing user input, polling APIs, and implementing delays. Important to remember: always clear timers with clearTimeout/clearInterval to prevent memory leaks, and use arrow functions to preserve `this` binding."

**Copy-Paste Patterns:**

**Pattern 1: Debounce (wait until user stops typing)**

```javascript
function debounce(func, delay) {
  let timerId;

  return function(...args) {
    clearTimeout(timerId); // Cancel previous timer
    timerId = setTimeout(() => func(...args), delay); // Start new timer
  };
}

// Usage: Search as user types
const searchInput = document.getElementById('search');
const debouncedSearch = debounce((query) => {
  console.log('Searching for:', query);
}, 500);

searchInput.addEventListener('input', (e) => {
  debouncedSearch(e.target.value);
  // Only searches 500ms after user stops typing
});
```

**Pattern 2: Polling with cleanup (React)**

```javascript
function MyComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Start polling
    const intervalId = setInterval(async () => {
      const result = await fetch('/api/data').then(r => r.json());
      setData(result);
    }, 5000);

    // Cleanup: stop polling when component unmounts
    return () => clearInterval(intervalId);
  }, []); // Empty array = run once on mount

  return <div>{data}</div>;
}
```

**Pattern 3: Recursive setTimeout (adaptive polling)**

```javascript
function poll() {
  setTimeout(async () => {
    const data = await fetch('/api/status').then(r => r.json());
    console.log('Status:', data);

    if (!data.complete) {
      poll(); // Continue polling
    } else {
      console.log('Done!');
    }
  }, 3000);
}

poll(); // Start polling
```

**Key Takeaways:**

1. **setTimeout** = one-time, **setInterval** = repeating
2. Always **clear timers** to prevent memory leaks
3. Use **arrow functions** to preserve `this`
4. Timers aren't perfectly accurate (event loop dependency)
5. **Recursive setTimeout** is safer than **setInterval** for async work


</details>

---

## Question 2: What's the difference between setTimeout and setInterval, and when should you use each?

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐
**Time:** 8-10 minutes
**Companies:** Amazon, Microsoft, Netflix, Shopify

### Question

Explain the key differences between `setTimeout()` and `setInterval()`. Cover:

- Fundamental execution differences
- Timer drift and accuracy
- Recursive `setTimeout` vs `setInterval`
- When to use each approach
- Performance implications
- Cleanup patterns and best practices
- Common pitfalls and how to avoid them

### Answer

**Fundamental Differences:**

| Aspect | setTimeout | setInterval |
|--------|-----------|-------------|
| **Execution** | Once after delay | Repeatedly at intervals |
| **Timing** | Waits for callback completion (if recursive) | Fires at fixed intervals regardless |
| **Cleanup** | Auto-clears after execution | Must manually clear |
| **Drift** | Self-adjusting (if compensated) | Accumulates over time |
| **Use Case** | One-time delays, debounce | Clocks, heartbeats, fixed-rate polling |

**Key Difference: Execution Timing**

```javascript
// setTimeout: Executes ONCE
setTimeout(() => {
  console.log('Runs once after 2 seconds');
}, 2000);

// setInterval: Executes REPEATEDLY
setInterval(() => {
  console.log('Runs every 2 seconds');
}, 2000);

// Recursive setTimeout: Executes repeatedly BUT waits for completion
function recursiveTimeout() {
  setTimeout(() => {
    console.log('Runs every 2 seconds, waits for completion');
    recursiveTimeout(); // Schedule next iteration
  }, 2000);
}
recursiveTimeout();
```

**Timer Drift:**

- **setInterval**: Doesn't wait for callback completion → drift accumulates
- **Recursive setTimeout**: Waits for callback → self-adjusting, minimal drift

**When to Use Each:**

**Use setTimeout when:**
- One-time delayed action (tooltip, modal)
- Debouncing user input
- API polling with async callbacks (use recursive pattern)
- Variable intervals based on conditions
- Need to wait for previous operation to complete

**Use setInterval when:**
- Fixed-rate tasks (clock display, countdown timer)
- Heartbeat/keepalive signals (if fast/synchronous)
- Animations (though `requestAnimationFrame` is better)
- Simple, synchronous repeated tasks

**Cleanup Requirements:**

- **setTimeout**: Auto-clears after execution (but can be manually cleared before)
- **setInterval**: Must ALWAYS manually clear to avoid memory leaks

### Code Example

**Basic Execution Difference:**

```javascript
console.log('Start');

// setTimeout: Runs once
setTimeout(() => {
  console.log('setTimeout: Executed once');
}, 1000);

// setInterval: Runs repeatedly
let count = 0;
const intervalId = setInterval(() => {
  console.log(`setInterval: Execution ${++count}`);

  if (count === 3) {
    clearInterval(intervalId);
    console.log('setInterval: Cleared');
  }
}, 1000);

// Output:
// Start
// setTimeout: Executed once (after 1s)
// setInterval: Execution 1 (after 1s)
// setInterval: Execution 2 (after 2s)
// setInterval: Execution 3 (after 3s)
// setInterval: Cleared
```

**Timer Drift Demonstration:**

```javascript
// ❌ setInterval: Accumulates drift
console.log('setInterval drift test:');
let intervalExpected = Date.now() + 1000;

const intervalId = setInterval(() => {
  const now = Date.now();
  const drift = now - intervalExpected;
  console.log(`Drift: ${drift}ms`);
  intervalExpected += 1000;
}, 1000);

setTimeout(() => clearInterval(intervalId), 10000);

// Output (example):
// Drift: 2ms
// Drift: 5ms
// Drift: 8ms
// Drift: 12ms (accumulates over time)

// ✅ Recursive setTimeout: Self-adjusting
console.log('Recursive setTimeout drift test:');
let timeoutExpected = Date.now() + 1000;

function selfAdjustingTimeout() {
  const now = Date.now();
  const drift = now - timeoutExpected;
  console.log(`Drift: ${drift}ms`);

  timeoutExpected += 1000;
  const nextDelay = Math.max(0, 1000 - drift); // Compensate for drift

  setTimeout(selfAdjustingTimeout, nextDelay);
}
selfAdjustingTimeout();

// Output:
// Drift: 1ms
// Drift: 0ms
// Drift: 1ms
// Drift: 0ms (stays near 0)
```

**setInterval vs Recursive setTimeout Comparison:**

```javascript
// Example: API polling

// ❌ setInterval: Doesn't wait for async callback
console.log('setInterval (problematic):');
setInterval(async () => {
  console.log('Request started:', new Date().toISOString());
  await fetch('/api/slow-endpoint'); // Takes 3 seconds
  console.log('Request completed:', new Date().toISOString());
  // Problem: Next interval fires BEFORE this completes!
}, 2000);

// Output:
// Request started: 10:00:00
// Request started: 10:00:02 ← Started before previous finished!
// Request completed: 10:00:03
// Request started: 10:00:04
// Request completed: 10:00:05
// Requests stack up, overload server!

// ✅ Recursive setTimeout: Waits for completion
console.log('Recursive setTimeout (correct):');
function pollAPI() {
  setTimeout(async () => {
    console.log('Request started:', new Date().toISOString());
    await fetch('/api/slow-endpoint'); // Takes 3 seconds
    console.log('Request completed:', new Date().toISOString());

    pollAPI(); // Schedule next AFTER completion
  }, 2000);
}
pollAPI();

// Output:
// Request started: 10:00:00
// Request completed: 10:00:03
// Request started: 10:00:05 ← Waits for previous to finish
// Request completed: 10:00:08
// Request started: 10:00:10
// No stacking!
```

**Async Callback Handling:**

```javascript
// ❌ setInterval with slow async callbacks: DANGER!
setInterval(async () => {
  const start = Date.now();
  await heavyAsyncOperation(); // Takes 5 seconds
  const elapsed = Date.now() - start;
  console.log(`Callback took ${elapsed}ms`);
}, 3000);

// Timeline:
// 0s:  Callback 1 starts
// 3s:  Callback 2 starts (Callback 1 still running!)
// 5s:  Callback 1 finishes
// 6s:  Callback 3 starts (Callback 2 still running!)
// 8s:  Callback 2 finishes
// Result: Multiple callbacks running concurrently!

// ✅ Recursive setTimeout: One at a time
function safeRecursive() {
  setTimeout(async () => {
    const start = Date.now();
    await heavyAsyncOperation(); // Takes 5 seconds
    const elapsed = Date.now() - start;
    console.log(`Callback took ${elapsed}ms`);

    safeRecursive(); // Next iteration after completion
  }, 3000);
}
safeRecursive();

// Timeline:
// 0s:  Callback 1 starts
// 5s:  Callback 1 finishes
// 8s:  Callback 2 starts (3s delay after Callback 1 finished)
// 13s: Callback 2 finishes
// 16s: Callback 3 starts
// Result: Callbacks never overlap!
```

**Self-Adjusting Timer with Drift Compensation:**

```javascript
class PreciseInterval {
  constructor(callback, interval) {
    this.callback = callback;
    this.interval = interval;
    this.expected = Date.now() + interval;
    this.timerId = null;
  }

  start() {
    this.step();
  }

  step() {
    const drift = Date.now() - this.expected;

    // Execute callback
    this.callback();

    // Calculate next expected time
    this.expected += this.interval;

    // Compensate for drift
    const nextDelay = Math.max(0, this.interval - drift);

    console.log(`Drift: ${drift}ms, Next delay: ${nextDelay}ms`);

    // Schedule next iteration
    this.timerId = setTimeout(() => this.step(), nextDelay);
  }

  stop() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}

// Usage
const preciseTimer = new PreciseInterval(() => {
  console.log('Tick:', new Date().toISOString());
}, 1000);

preciseTimer.start();

// Stop after 10 seconds
setTimeout(() => preciseTimer.stop(), 10000);

// Output: Drift stays near 0ms (self-correcting)
```

**Cleanup Patterns:**

```javascript
// ❌ setInterval: Forget to clear = memory leak
function leakyFunction() {
  setInterval(() => {
    console.log('This runs forever!');
  }, 1000);
  // No cleanup!
}
leakyFunction();
// Timer keeps running even after function exits

// ✅ setTimeout: Auto-clears, but can be manually cleared
function safeTimeout() {
  const timerId = setTimeout(() => {
    console.log('Executed');
  }, 5000);

  // Can cancel if needed
  return () => clearTimeout(timerId);
}

const cancel = safeTimeout();
// Changed my mind:
cancel(); // Cancels before execution

// ✅ setInterval: Must always clear
function safeInterval() {
  const intervalId = setInterval(() => {
    console.log('Repeating');
  }, 1000);

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    console.log('Interval cleared');
  };
}

const stopInterval = safeInterval();
// Later:
stopInterval(); // Stops interval
```

**React useEffect Patterns:**

```javascript
// ✅ setTimeout in React
function DelayedMessage() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setVisible(true);
    }, 2000);

    // Optional cleanup (if component unmounts before timeout)
    return () => clearTimeout(timerId);
  }, []);

  return visible ? <div>Message appeared!</div> : null;
}

// ✅ setInterval in React: ALWAYS cleanup
function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // CRITICAL: Clear on unmount
    return () => {
      clearInterval(intervalId);
      console.log('Clock stopped');
    };
  }, []);

  return <div>{time.toLocaleTimeString()}</div>;
}

// ✅ Recursive setTimeout in React: Adaptive polling
function StatusPoller() {
  const [status, setStatus] = useState(null);
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    if (!isPolling) return;

    function poll() {
      setTimeout(async () => {
        if (!isPolling) return; // Check again

        const data = await fetch('/api/status').then(r => r.json());
        setStatus(data);

        if (data.complete) {
          setIsPolling(false);
        } else {
          poll(); // Continue
        }
      }, 3000);
    }

    poll();

    return () => setIsPolling(false); // Stop on unmount
  }, [isPolling]);

  return <div>Status: {status?.message}</div>;
}
```

**Polling with Exponential Backoff:**

```javascript
class ExponentialBackoffPoller {
  constructor(url, baseInterval = 1000, maxInterval = 60000) {
    this.url = url;
    this.baseInterval = baseInterval;
    this.maxInterval = maxInterval;
    this.currentInterval = baseInterval;
    this.timerId = null;
    this.isPolling = false;
  }

  start() {
    this.isPolling = true;
    this.poll();
  }

  async poll() {
    if (!this.isPolling) return;

    try {
      const response = await fetch(this.url);

      if (response.ok) {
        const data = await response.json();
        console.log('Success:', data);

        // Reset interval on success
        this.currentInterval = this.baseInterval;

        if (!data.complete) {
          this.scheduleNext();
        } else {
          console.log('Polling complete');
          this.stop();
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Polling error:', error);

      // Exponential backoff: double interval
      this.currentInterval = Math.min(
        this.currentInterval * 2,
        this.maxInterval
      );

      console.log(`Backing off: next poll in ${this.currentInterval}ms`);
      this.scheduleNext();
    }
  }

  scheduleNext() {
    this.timerId = setTimeout(() => this.poll(), this.currentInterval);
  }

  stop() {
    this.isPolling = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}

// Usage
const poller = new ExponentialBackoffPoller('/api/job-status', 2000, 60000);
poller.start();

// Output on errors:
// Polling error: ...
// Backing off: next poll in 4000ms
// Polling error: ...
// Backing off: next poll in 8000ms
// Polling error: ...
// Backing off: next poll in 16000ms
// ...until success or max 60s interval
```

**Clock Implementation:**

```javascript
// Simple clock with setInterval
function simpleClock() {
  const clockElement = document.getElementById('clock');

  setInterval(() => {
    clockElement.textContent = new Date().toLocaleTimeString();
  }, 1000);
}

// ✅ Better: Self-adjusting clock (stays in sync)
function preciseClock() {
  const clockElement = document.getElementById('clock');

  function update() {
    const now = new Date();
    clockElement.textContent = now.toLocaleTimeString();

    // Calculate ms until next full second
    const msUntilNextSecond = 1000 - now.getMilliseconds();

    setTimeout(update, msUntilNextSecond);
  }

  update(); // Start immediately
}

preciseClock();
// Always updates at exact second boundaries
```

**Performance Comparison:**

```javascript
// Test: Which is more accurate over 60 seconds?

// Test 1: setInterval
let intervalTicks = 0;
const intervalStart = Date.now();

const intervalId = setInterval(() => {
  intervalTicks++;
}, 1000);

setTimeout(() => {
  clearInterval(intervalId);
  const intervalElapsed = Date.now() - intervalStart;
  const intervalExpected = intervalTicks * 1000;
  const intervalDrift = intervalElapsed - intervalExpected;

  console.log('setInterval:');
  console.log(`  Ticks: ${intervalTicks}`);
  console.log(`  Expected: ${intervalExpected}ms`);
  console.log(`  Actual: ${intervalElapsed}ms`);
  console.log(`  Drift: ${intervalDrift}ms`);
}, 60000);

// Test 2: Recursive setTimeout with compensation
let timeoutTicks = 0;
const timeoutStart = Date.now();
let expected = timeoutStart + 1000;

function tick() {
  timeoutTicks++;
  const now = Date.now();
  const drift = now - expected;
  expected += 1000;

  const nextDelay = Math.max(0, 1000 - drift);

  if (timeoutTicks < 60) {
    setTimeout(tick, nextDelay);
  } else {
    const timeoutElapsed = Date.now() - timeoutStart;
    const timeoutExpected = timeoutTicks * 1000;
    const timeoutDrift = timeoutElapsed - timeoutExpected;

    console.log('Recursive setTimeout:');
    console.log(`  Ticks: ${timeoutTicks}`);
    console.log(`  Expected: ${timeoutExpected}ms`);
    console.log(`  Actual: ${timeoutElapsed}ms`);
    console.log(`  Drift: ${timeoutDrift}ms`);
  }
}
tick();

// Typical results after 60 seconds:
// setInterval:       Drift: 150-300ms
// Recursive setTimeout: Drift: 0-50ms
```

**Common Pitfalls:**

```javascript
// ❌ Pitfall 1: setInterval with async callback (stacking)
setInterval(async () => {
  await fetch('/api/data'); // If slow, requests stack!
}, 1000);

// ✅ Fix: Recursive setTimeout
function poll() {
  setTimeout(async () => {
    await fetch('/api/data');
    poll(); // Next iteration after completion
  }, 1000);
}

// ❌ Pitfall 2: Not clearing interval in React
function BadComponent() {
  useEffect(() => {
    setInterval(() => console.log('Leak!'), 1000);
    // Missing cleanup!
  }, []);
}

// ✅ Fix: Return cleanup function
function GoodComponent() {
  useEffect(() => {
    const id = setInterval(() => console.log('OK'), 1000);
    return () => clearInterval(id);
  }, []);
}

// ❌ Pitfall 3: Assuming exact timing
setInterval(() => {
  console.log('Expected every 100ms exactly');
}, 100);
// Reality: 102ms, 105ms, 98ms, 110ms... (varies!)

// ✅ Fix: Accept timing variance or use RAF for animations
requestAnimationFrame(function loop() {
  console.log('Synced with browser paint cycle');
  requestAnimationFrame(loop);
});
```


<details>
<summary><strong>🔍 Deep Dive: JavaScript Timers</strong></summary>


**Execution Timing Internals:**

The critical difference between `setInterval` and recursive `setTimeout` is **when the next timer is scheduled**:

**setInterval:**
```
Schedule: Call 1 → 1000ms → Call 2 → 1000ms → Call 3
          ↓                ↓                ↓
Execute:  [100ms]          [100ms]          [100ms]

Timeline:
0ms:    Call 1 scheduled
0ms:    Call 1 starts
100ms:  Call 1 completes
1000ms: Call 2 scheduled (even if Call 1 still running!)
1000ms: Call 2 starts
1100ms: Call 2 completes
2000ms: Call 3 scheduled
...

Problem: If callback takes >1000ms, calls overlap!
```

**Recursive setTimeout:**
```
Schedule: Call 1 → [complete] → 1000ms → Call 2 → [complete] → 1000ms → Call 3
          ↓                              ↓                              ↓
Execute:  [100ms]                        [100ms]                        [100ms]

Timeline:
0ms:    Call 1 scheduled
0ms:    Call 1 starts
100ms:  Call 1 completes
100ms:  Call 2 scheduled (after completion!)
1100ms: Call 2 starts
1200ms: Call 2 completes
1200ms: Call 3 scheduled
2200ms: Call 3 starts
...

Benefit: Calls never overlap, always waits for completion
```

**Timer Drift Analysis:**

```javascript
// Mathematical analysis of drift

// setInterval: Fixed interval, drift accumulates
// If callback takes Tc ms and interval is Ti ms:
// - If Tc < Ti: drift = 0 (ideal case)
// - If Tc ≥ Ti: drift accumulates linearly

// Example: Tc = 1002ms, Ti = 1000ms
// Iteration 1: drift = 2ms
// Iteration 2: drift = 4ms
// Iteration 3: drift = 6ms
// After N iterations: drift = N × 2ms

// Recursive setTimeout with compensation:
// Each iteration compensates for previous drift
// drift[n] = drift[n-1] - compensation
// Result: drift stays near 0

// Proof with code:
class DriftAnalyzer {
  constructor(interval, callbackDuration) {
    this.interval = interval;
    this.callbackDuration = callbackDuration;
    this.iterations = 0;
    this.startTime = Date.now();
  }

  testSetInterval() {
    const id = setInterval(() => {
      // Simulate work
      const workStart = Date.now();
      while (Date.now() - workStart < this.callbackDuration) {}

      this.iterations++;

      if (this.iterations >= 10) {
        clearInterval(id);
        this.reportResults('setInterval');
      }
    }, this.interval);
  }

  testRecursiveTimeout() {
    const expected = Date.now() + this.interval;

    const tick = () => {
      // Simulate work
      const workStart = Date.now();
      while (Date.now() - workStart < this.callbackDuration) {}

      this.iterations++;

      if (this.iterations >= 10) {
        this.reportResults('Recursive setTimeout');
      } else {
        const now = Date.now();
        const drift = now - expected;
        expected += this.interval;
        const nextDelay = Math.max(0, this.interval - drift);

        setTimeout(tick, nextDelay);
      }
    };
    tick();
  }

  reportResults(method) {
    const elapsed = Date.now() - this.startTime;
    const expectedDuration = this.iterations * this.interval;
    const drift = elapsed - expectedDuration;

    console.log(`${method}:`);
    console.log(`  Iterations: ${this.iterations}`);
    console.log(`  Expected duration: ${expectedDuration}ms`);
    console.log(`  Actual duration: ${elapsed}ms`);
    console.log(`  Total drift: ${drift}ms`);
    console.log(`  Avg drift/iteration: ${(drift / this.iterations).toFixed(2)}ms`);
  }
}

// Test with 1000ms interval, 1002ms callback duration
new DriftAnalyzer(1000, 1002).testSetInterval();
// Output: Total drift ~20ms (2ms × 10 iterations)

new DriftAnalyzer(1000, 1002).testRecursiveTimeout();
// Output: Total drift ~0-5ms (compensated)
```

**Callback Queue Stacking:**

When `setInterval` callback takes longer than interval:

```javascript
// Scenario: 1000ms interval, 1500ms async callback

setInterval(async () => {
  console.log('Start:', new Date().toISOString());
  await sleep(1500); // Simulate slow API call
  console.log('End:', new Date().toISOString());
}, 1000);

// Timeline:
// 0ms:    Iteration 1 starts
// 1000ms: Iteration 2 scheduled (Iteration 1 still running!)
// 1500ms: Iteration 1 completes
// 1500ms: Iteration 2 starts (queued callback executes immediately)
// 2000ms: Iteration 3 scheduled (Iteration 2 still running!)
// 3000ms: Iteration 2 completes
// 3000ms: Iteration 3 starts (queued)
// 4000ms: Iteration 4 scheduled

// Result: Callbacks execute back-to-back with no delay!
// Effectively becomes: execute, execute, execute... (continuous)

// Browser mitigation: Max 1 queued callback per setInterval
// So worst case: 2 concurrent callbacks (current + 1 queued)
// But still problematic for async operations!
```

**Memory Consumption Differences:**

```javascript
// setInterval: Higher memory usage

// Reason 1: Timer persists until manually cleared
// Reason 2: Closures keep references to scope

const intervalId = setInterval(() => {
  const largeArray = new Array(100000); // Created every iteration
  processData(largeArray);
}, 1000);

// If processData is async and slow, multiple largeArray instances
// may exist simultaneously in memory!

// setTimeout: Lower memory usage (recursive)

function recursiveTimeout() {
  setTimeout(() => {
    const largeArray = new Array(100000);
    processData(largeArray); // Completes
    // largeArray eligible for GC before next iteration

    recursiveTimeout();
  }, 1000);
}

// Only 1 largeArray instance at a time
```

**Browser Optimization Differences:**

Modern browsers optimize timers differently:

```javascript
// setInterval optimizations:
// 1. Timer coalescing: Multiple intervals with same timing → batched
// 2. Background throttling: Inactive tabs → 1000ms minimum
// 3. Timer alignment: Multiple timers → aligned to reduce wake-ups

// Recursive setTimeout optimizations:
// 1. Nesting throttling: ≥5 levels → 4ms minimum
// 2. Background throttling: Same as setInterval
// 3. Less predictable pattern → harder to optimize

// Performance benchmark:
function benchmark() {
  const iterations = 10000;

  // Test setInterval
  let intervalCount = 0;
  const intervalStart = performance.now();

  const id = setInterval(() => {
    if (++intervalCount >= iterations) {
      clearInterval(id);
      const intervalDuration = performance.now() - intervalStart;
      console.log(`setInterval: ${intervalDuration.toFixed(2)}ms`);

      // Test recursive setTimeout
      testRecursive();
    }
  }, 0);

  function testRecursive() {
    let timeoutCount = 0;
    const timeoutStart = performance.now();

    function tick() {
      if (++timeoutCount >= iterations) {
        const timeoutDuration = performance.now() - timeoutStart;
        console.log(`Recursive setTimeout: ${timeoutDuration.toFixed(2)}ms`);
      } else {
        setTimeout(tick, 0);
      }
    }
    tick();
  }
}

benchmark();
// Typical results:
// setInterval: 45000-50000ms (throttled to ~4-5ms/iteration)
// Recursive setTimeout: 50000-55000ms (slightly slower due to nesting throttle)
```

**Background Tab Behavior:**

```javascript
// Active tab: Normal timing
setInterval(() => console.log('Active'), 100); // ~100ms

// Inactive tab (after 5 seconds):
setInterval(() => console.log('Inactive'), 100); // ~1000ms minimum!

// Same for recursive setTimeout
function poll() {
  setTimeout(() => {
    console.log('Polling');
    poll();
  }, 100);
}
poll(); // Active: ~100ms, Inactive: ~1000ms

// Workaround: Web Workers (not throttled in background)
// worker.js
setInterval(() => {
  postMessage('Still running at 100ms even in background');
}, 100);
```


</details>


<details>
<summary><strong>🐛 Real-World Scenario: JavaScript Timers</strong></summary>


**Context: Live Sports Scores Dashboard API Polling**

**The System:**
- React-based live sports dashboard
- Displays scores for 20+ live games simultaneously
- Real-time score updates via API polling
- 50,000+ concurrent users during major events (IPL, World Cup)
- API rate limit: 100 requests/minute per user

**The Problem:**

April 2024, during IPL finals:

- API returning 429 (Too Many Requests) errors
- Score updates delayed by 3-5 minutes
- 400+ user complaints on Twitter: "Scores not updating!"
- Poor UX: Loading spinners stuck, stale data
- Business impact: Users switching to competitor apps

**Initial Symptoms:**

```javascript
// User complaints:
// - "Scores frozen at 15 overs, now it's 18 overs on TV!"
// - "Getting 'too many requests' errors"
// - "App keeps showing loading spinner"
// - "Refresh button doesn't help"
```

**Investigation Process:**

**Step 1: Network Tab Analysis**

```javascript
// Observed in Chrome DevTools Network tab:
// - 30+ concurrent API requests
// - Requests stacking up every 3 seconds
// - 429 responses: "Rate limit exceeded"
// - Some requests taking 10+ seconds to complete

// Timeline (per game):
// 0s:   Request 1 starts
// 3s:   Request 2 starts (Request 1 still pending!)
// 6s:   Request 3 starts (Requests 1, 2 still pending!)
// 9s:   Request 4 starts
// 11s:  Request 1 completes (11 seconds!)
// 12s:  Request 2 completes
// 12s:  Request 5 starts
// ... (requests stacking continuously)

// Result: 20 games × 5 pending requests = 100 concurrent requests!
// API rate limit: 100 requests/minute → exceeded in 15 seconds!
```

**Step 2: Code Audit - Found The Bug**

```javascript
// ❌ BUGGY CODE: GameScoreCard component
function GameScoreCard({ gameId }) {
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Poll every 3 seconds
    setInterval(async () => {
      setLoading(true);

      try {
        const response = await fetch(`/api/games/${gameId}/score`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setScore(data);
      } catch (error) {
        console.error('Fetch error:', error);
        // ❌ ERROR: Keeps polling even on errors!
      } finally {
        setLoading(false);
      }
    }, 3000);

    // ❌ CRITICAL BUGS:
    // 1. No cleanup function → interval never cleared
    // 2. setInterval doesn't wait for fetch completion
    // 3. No error backoff → hammers API even on 429 errors
    // 4. API call can take >3s, but interval fires anyway
  }, [gameId]);

  return (
    <div>
      {loading && <Spinner />}
      {score && <div>{score.team1} vs {score.team2}: {score.runs}/{score.wickets}</div>}
    </div>
  );
}

// Dashboard rendering 20 GameScoreCard components:
function Dashboard() {
  const liveGames = [/* 20 game IDs */];

  return (
    <div>
      {liveGames.map(gameId => (
        <GameScoreCard key={gameId} gameId={gameId} />
      ))}
    </div>
  );
}

// What happened:
// 1. Each GameScoreCard starts setInterval polling
// 2. API slow during peak traffic (5-10s response time)
// 3. setInterval fires every 3s regardless
// 4. Requests stack: 0s, 3s, 6s, 9s, 12s... (previous not finished!)
// 5. 20 games × 5 stacked requests = 100 concurrent requests
// 6. Hit rate limit → 429 errors
// 7. No backoff → continues hammering API
// 8. 429 errors → no data → stale UI
```

**Step 3: Response Time Tracking**

```javascript
// Added instrumentation to measure API response times

const responseTimes = [];

setInterval(async () => {
  const start = Date.now();

  try {
    await fetch(`/api/games/${gameId}/score`);
    const elapsed = Date.now() - start;
    responseTimes.push(elapsed);

    if (responseTimes.length >= 20) {
      const avg = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
      console.log('Avg response time:', avg.toFixed(0), 'ms');
      responseTimes.length = 0;
    }
  } catch (error) {
    console.error('Error:', error);
  }
}, 3000);

// Results:
// Avg response time: 8,234ms (way higher than 3s interval!)
// Explaining why requests stacked up
```

**Root Cause Analysis:**

1. **setInterval doesn't wait**: Fires every 3s regardless of API response time
2. **Slow API responses**: 5-10s during peak traffic
3. **Request stacking**: 3-4 requests per game in flight simultaneously
4. **No cleanup**: Intervals never cleared (though not main issue here)
5. **No error handling**: Keeps polling even on 429 errors
6. **Rate limit exceeded**: 100 concurrent requests → hit rate limit

**The Solution:**

**Fix 1: Recursive setTimeout (Wait for Completion)**

```javascript
// ✅ FIXED: Use recursive setTimeout
function GameScoreCard({ gameId }) {
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isPollingRef = useRef(true);

  useEffect(() => {
    isPollingRef.current = true;

    async function poll() {
      // Check if still polling (component mounted)
      if (!isPollingRef.current) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/games/${gameId}/score`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setScore(data);

        // ✅ Schedule next poll AFTER successful completion
        if (isPollingRef.current) {
          setTimeout(poll, 3000);
        }
      } catch (err) {
        console.error('Poll error:', err);
        setError(err.message);

        // ✅ Don't schedule next poll on error
        // (Could add backoff logic here)
      } finally {
        setLoading(false);
      }
    }

    poll(); // Start polling

    // ✅ Cleanup: Stop polling on unmount
    return () => {
      isPollingRef.current = false;
    };
  }, [gameId]);

  return (
    <div>
      {loading && <Spinner />}
      {error && <div className="error">{error}</div>}
      {score && <div>{score.team1} vs {score.team2}: {score.runs}/{score.wickets}</div>}
    </div>
  );
}

// Benefits:
// 1. Waits for API response before next poll
// 2. No request stacking
// 3. Proper cleanup on unmount
// 4. Error handling stops further polls
```

**Fix 2: Exponential Backoff on Errors**

```javascript
// ✅ Add exponential backoff for 429 errors
function GameScoreCard({ gameId }) {
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const isPollingRef = useRef(true);
  const retryDelayRef = useRef(3000); // Start with 3s

  useEffect(() => {
    isPollingRef.current = true;
    retryDelayRef.current = 3000;

    async function poll() {
      if (!isPollingRef.current) return;

      setLoading(true);

      try {
        const response = await fetch(`/api/games/${gameId}/score`);

        if (response.status === 429) {
          // Rate limited: exponential backoff
          retryDelayRef.current = Math.min(retryDelayRef.current * 2, 60000);
          console.log(`Rate limited. Retry in ${retryDelayRef.current}ms`);

          if (isPollingRef.current) {
            setTimeout(poll, retryDelayRef.current);
          }
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setScore(data);

        // Success: reset retry delay
        retryDelayRef.current = 3000;

        if (isPollingRef.current) {
          setTimeout(poll, 3000);
        }
      } catch (err) {
        console.error('Poll error:', err);

        // Backoff on errors
        retryDelayRef.current = Math.min(retryDelayRef.current * 1.5, 30000);

        if (isPollingRef.current) {
          setTimeout(poll, retryDelayRef.current);
        }
      } finally {
        setLoading(false);
      }
    }

    poll();

    return () => {
      isPollingRef.current = false;
    };
  }, [gameId]);

  return (
    <div>
      {loading && <Spinner />}
      {score && <div>{score.team1} vs {score.team2}: {score.runs}/{score.wickets}</div>}
    </div>
  );
}

// Backoff behavior:
// First 429:  Wait 6s   (3s × 2)
// Second 429: Wait 12s  (6s × 2)
// Third 429:  Wait 24s  (12s × 2)
// Fourth 429: Wait 48s  (24s × 2)
// Fifth 429:  Wait 60s  (max)
// Success:    Reset to 3s
```

**Fix 3: Loading State Management**

```javascript
// ✅ Better loading state (show loading only for first fetch)
function GameScoreCard({ gameId }) {
  const [score, setScore] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const isPollingRef = useRef(true);

  useEffect(() => {
    isPollingRef.current = true;

    async function poll() {
      if (!isPollingRef.current) return;

      try {
        const response = await fetch(`/api/games/${gameId}/score`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setScore(data);
        setLastUpdated(new Date());
        setIsInitialLoading(false);

        if (isPollingRef.current) {
          setTimeout(poll, 3000);
        }
      } catch (err) {
        console.error('Poll error:', err);
        setIsInitialLoading(false);

        // Retry with backoff
        if (isPollingRef.current) {
          setTimeout(poll, 10000);
        }
      }
    }

    poll();

    return () => {
      isPollingRef.current = false;
    };
  }, [gameId]);

  if (isInitialLoading) {
    return <Spinner />;
  }

  return (
    <div>
      {score && (
        <>
          <div>{score.team1} vs {score.team2}: {score.runs}/{score.wickets}</div>
          <div className="last-updated">
            Updated {lastUpdated?.toLocaleTimeString()}
          </div>
        </>
      )}
    </div>
  );
}

// Benefits:
// - Spinner only shows during initial load
// - "Updated X" timestamp shows data freshness
// - Better UX: no constant spinner flashing
```

**Results After Fix:**

**Immediate Impact (Same Day):**
- ✅ 429 errors: 0 (down from 400+/minute)
- ✅ Concurrent requests: 20 max (1 per game, down from 100)
- ✅ Score freshness: <2 seconds (down from 3-5 minutes)
- ✅ User complaints: 0 (down from 400+)

**Performance Metrics:**

```javascript
// Before (setInterval):
// - Concurrent requests: 80-120
// - 429 error rate: 68%
// - Avg data staleness: 178 seconds
// - User satisfaction: 62%

// After (recursive setTimeout):
// - Concurrent requests: 18-22
// - 429 error rate: 0%
// - Avg data staleness: 1.8 seconds
// - User satisfaction: 95%
```

**Business Impact:**
- ✅ Zero API rate limit violations
- ✅ Real-time scores (< 2s latency)
- ✅ 95% user satisfaction during IPL finals
- ✅ App usage increased 23% (users stopped switching to competitors)
- ✅ Zero infrastructure scaling needed (same API capacity)

**Key Lessons:**

1. **setInterval with async = danger**: Always use recursive setTimeout for async operations
2. **Monitor response times**: If response time > interval, you have a problem
3. **Exponential backoff**: Essential for rate-limited APIs
4. **Loading state UX**: Don't show spinner on every poll
5. **Request completion**: Wait for previous request before scheduling next


</details>


<details>
<summary><strong>⚖️ Trade-offs: JavaScript Timers</strong></summary>


**1. setTimeout vs setInterval: Complexity vs Simplicity**

| Aspect | setTimeout (Recursive) | setInterval | Winner |
|--------|----------------------|-------------|---------|
| **Code Complexity** | Higher (recursive pattern) | Lower (one-liner) | setInterval |
| **Async Safety** | Safe (waits for completion) | Unsafe (can stack) | setTimeout |
| **Self-Adjusting** | Yes (compensates drift) | No (fixed intervals) | setTimeout |
| **Cleanup** | Auto-clears each iteration | Must manually clear | setTimeout |
| **Readability** | Requires understanding recursion | Intuitive | setInterval |

**When to use setTimeout (recursive):**
```javascript
// ✅ API polling (async callbacks)
function pollAPI() {
  setTimeout(async () => {
    await fetch('/api/data');
    pollAPI();
  }, 5000);
}

// ✅ Adaptive intervals
function adaptivePoll() {
  setTimeout(async () => {
    const data = await fetch('/api/data').then(r => r.json());

    // Adjust interval based on response
    const nextInterval = data.hasUpdates ? 1000 : 10000;
    setTimeout(adaptivePoll, nextInterval);
  }, 5000);
}

// ✅ Debouncing
function debounce(fn, delay) {
  let timerId;
  return (...args) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn(...args), delay);
  };
}
```

**When to use setInterval:**
```javascript
// ✅ Clock display (fast, synchronous)
setInterval(() => {
  document.getElementById('clock').textContent = new Date().toLocaleTimeString();
}, 1000);

// ✅ Heartbeat (fast, no async)
setInterval(() => {
  sendHeartbeat(); // Synchronous, <1ms
}, 30000);

// ✅ Countdown timer (synchronous)
let countdown = 60;
const id = setInterval(() => {
  document.getElementById('timer').textContent = --countdown;
  if (countdown === 0) clearInterval(id);
}, 1000);
```


</details>

---

**2. Fixed Intervals vs Adaptive Intervals**

| Aspect | Fixed (setInterval) | Adaptive (setTimeout) | Winner |
|--------|--------------------|-----------------------|---------|
| **Predictability** | High (always same interval) | Low (varies) | setInterval |
| **Efficiency** | Lower (polls even when idle) | Higher (adapts to activity) | setTimeout |
| **Use Case** | Clocks, heartbeats | API polling, retry logic | Depends |

**Example: Adaptive polling based on activity**

```javascript
// ✅ Adaptive: Poll faster when data changing, slower when idle
function adaptivePoll() {
  setTimeout(async () => {
    const data = await fetch('/api/activity').then(r => r.json());

    // Adjust interval based on activity
    let nextInterval;
    if (data.changeRate > 10) {
      nextInterval = 1000; // High activity: 1s
    } else if (data.changeRate > 1) {
      nextInterval = 5000; // Medium activity: 5s
    } else {
      nextInterval = 30000; // Low activity: 30s
    }

    console.log(`Next poll in ${nextInterval}ms`);
    setTimeout(adaptivePoll, nextInterval);
  }, 5000);
}

// Efficiency gain: 90% fewer requests during idle periods
```

---

**3. Synchronous vs Asynchronous Callbacks**

| Aspect | Sync Callbacks | Async Callbacks | Winner |
|--------|---------------|-----------------|---------|
| **setInterval Safety** | Safe | Unsafe (stacking) | Sync |
| **setTimeout Safety** | Safe | Safe (recursive) | Both |
| **Complexity** | Simple | Requires Promise handling | Sync |

**Decision matrix:**

```javascript
// Synchronous callback: setInterval is fine
setInterval(() => {
  updateClock(); // Synchronous, <1ms
}, 1000);

// Asynchronous callback: Use recursive setTimeout
function poll() {
  setTimeout(async () => {
    await fetchData(); // Async, may take seconds
    poll(); // Safe: waits for completion
  }, 3000);
}
```

---

**4. Timer Drift Tolerance**

| Use Case | Drift Tolerance | Solution | Reason |
|----------|----------------|----------|---------|
| **Clock Display** | Low | Self-adjusting setTimeout | User expects accuracy |
| **API Polling** | High | Simple setInterval or setTimeout | Doesn't matter if 3.2s vs 3.0s |
| **Animation** | None | requestAnimationFrame | Must sync with paint |
| **Heartbeat** | Medium | setInterval | ±1s is acceptable |

**Example: When drift matters**

```javascript
// ❌ Clock with setInterval: Drifts over time
setInterval(() => {
  clockElement.textContent = new Date().toLocaleTimeString();
}, 1000);
// After 10 minutes: 5-10s drift

// ✅ Self-adjusting clock: Stays accurate
function accurateClock() {
  const now = new Date();
  clockElement.textContent = now.toLocaleTimeString();

  // Schedule next update at exactly next second boundary
  const msUntilNextSecond = 1000 - now.getMilliseconds();
  setTimeout(accurateClock, msUntilNextSecond);
}
accurateClock();
// After 10 minutes: <100ms drift
```

---

**5. Different Use Cases: Decision Table**

| Use Case | Best Solution | Interval | Why |
|----------|--------------|----------|-----|
| **Tooltip delay** | setTimeout | 500ms | One-time action |
| **Debounce input** | setTimeout (clear + reset) | 300ms | Reset on each keystroke |
| **Throttle scroll** | setTimeout (flag pattern) | 100ms | Limit execution rate |
| **API polling** | Recursive setTimeout | 3-10s | Wait for completion |
| **Clock display** | Self-adjusting setTimeout | 1s | Accuracy matters |
| **Heartbeat** | setInterval | 30s | Simple, fixed-rate |
| **Animation** | requestAnimationFrame | 16ms (60fps) | Sync with paint |
| **Countdown timer** | setInterval | 1s | Simple, synchronous |
| **Retry with backoff** | Recursive setTimeout | Exponential | Adaptive interval |
| **Live chat polling** | Recursive setTimeout + WebSocket fallback | 5s | Wait for response |

---

**Performance Comparison Table:**

| Metric | setTimeout (Recursive) | setInterval | requestAnimationFrame |
|--------|----------------------|-------------|----------------------|
| **CPU Usage** | Low (adaptive) | Medium (fixed) | Optimized (pauses when hidden) |
| **Memory** | Low (clears each iteration) | Medium (persistent timer) | Low (browser-managed) |
| **Accuracy** | High (self-correcting) | Medium (drift) | Perfect (60fps sync) |
| **Battery Impact** | Low (adaptive) | Medium (fixed) | Very Low (optimized) |
| **Background Throttling** | Yes (1000ms min) | Yes (1000ms min) | Pauses completely |
| **Best For** | API polling, async work | Clocks, heartbeats | Animations, visual updates |


<details>
<summary><strong>💬 Explain to Junior: JavaScript Timers Simplified</strong></summary>


**Simple Analogy:**

**setTimeout vs setInterval:**

- **setTimeout** = Setting a **one-time alarm**
  - "Remind me to take out the trash in 30 minutes" → rings once

- **setInterval** = Setting a **repeating alarm**
  - "Remind me to drink water every hour" → keeps ringing every hour

**The Key Difference:**

Imagine you're a chef cooking:

**setInterval (Fixed Schedule):**
```
Timer rings every 10 minutes: "Check the oven!"
- 10 min: Ring → You check (takes 2 minutes)
- 20 min: Ring → You check (takes 2 minutes)
- 30 min: Ring → You check (takes 2 minutes)
Fixed schedule, regardless of how long checking takes.
```

**Recursive setTimeout (Wait for Completion):**
```
Timer rings: "Check the oven!"
- 0 min:  Ring → You check (takes 2 minutes)
- 12 min: Ring → You check (takes 2 minutes) ← Waits for previous check
- 24 min: Ring → You check (takes 2 minutes)
Waits until you finish before scheduling next ring.
```

**The Problem with setInterval and Slow Tasks:**

```javascript
// Imagine API call takes 5 seconds, but interval is 3 seconds

setInterval(async () => {
  console.log('Start API call');
  await fetch('/api/data'); // Takes 5 seconds
  console.log('API call complete');
}, 3000);

// Timeline:
// 0s:  Start call 1
// 3s:  Start call 2 (call 1 still running!)
// 5s:  Call 1 complete
// 6s:  Start call 3 (call 2 still running!)
// 8s:  Call 2 complete
// Calls overlap! 🔴

// Fix: Recursive setTimeout
function poll() {
  setTimeout(async () => {
    console.log('Start API call');
    await fetch('/api/data'); // Takes 5 seconds
    console.log('API call complete');

    poll(); // Schedule next AFTER completion
  }, 3000);
}

// Timeline:
// 0s:  Start call 1
// 5s:  Call 1 complete
// 8s:  Start call 2 (3s after call 1 finished)
// 13s: Call 2 complete
// 16s: Start call 3
// No overlap! ✅
```

**Why This Matters:**

If you use `setInterval` with slow tasks:
1. Tasks stack up (multiple running at same time)
2. Server gets overloaded
3. You get rate-limited (429 errors)
4. App becomes slow and unresponsive

**When to Use Each:**

**Use setTimeout when:**
- You need to do something **once** (show tooltip after 500ms)
- You're **waiting for something async** (API calls)
- You want **adaptive timing** (poll faster when busy, slower when idle)

**Use setInterval when:**
- You need **fixed-rate repetition** (clock ticking every second)
- Task is **fast and synchronous** (update DOM, no network calls)
- **Simple use case** (countdown timer, heartbeat)

**Common Mistakes:**

**Mistake 1: Forgetting to clear setInterval**

```javascript
// ❌ Bad: Memory leak
function MyComponent() {
  useEffect(() => {
    setInterval(() => {
      console.log('Still running even after unmount!');
    }, 1000);
    // Missing cleanup!
  }, []);
}

// ✅ Good: Clear on cleanup
function MyComponent() {
  useEffect(() => {
    const id = setInterval(() => {
      console.log('OK');
    }, 1000);

    return () => clearInterval(id); // Stop on unmount
  }, []);
}
```

**Mistake 2: Using setInterval with async callbacks**

```javascript
// ❌ Bad: Requests stack up
setInterval(async () => {
  await fetch('/api/data'); // If slow, overlaps!
}, 3000);

// ✅ Good: Recursive setTimeout
function poll() {
  setTimeout(async () => {
    await fetch('/api/data'); // Waits for completion
    poll(); // Then schedules next
  }, 3000);
}
poll();
```

**Interview Answer Template:**

> "The main difference is execution timing. setTimeout runs a callback once after a delay, while setInterval runs it repeatedly at fixed intervals. The key issue is that setInterval doesn't wait for the callback to complete before scheduling the next execution, which can cause callbacks to overlap if they're slow or asynchronous. For async operations like API polling, I use recursive setTimeout instead—it waits for the previous call to complete before scheduling the next one. For simple synchronous tasks like updating a clock, setInterval is fine and simpler. Always remember to clear intervals with clearInterval to prevent memory leaks."

**Copy-Paste Pattern: Safe Polling**

```javascript
// React component with safe polling
function MyComponent() {
  const [data, setData] = useState(null);
  const isPollingRef = useRef(true);

  useEffect(() => {
    isPollingRef.current = true;

    async function poll() {
      // Check if still polling
      if (!isPollingRef.current) return;

      try {
        const result = await fetch('/api/data').then(r => r.json());
        setData(result);

        // Schedule next poll AFTER completion
        if (isPollingRef.current) {
          setTimeout(poll, 5000); // 5 seconds
        }
      } catch (error) {
        console.error('Poll error:', error);

        // Retry after 10 seconds on error
        if (isPollingRef.current) {
          setTimeout(poll, 10000);
        }
      }
    }

    poll(); // Start

    // Cleanup: Stop polling on unmount
    return () => {
      isPollingRef.current = false;
    };
  }, []);

  return <div>{data?.message}</div>;
}
```

**Key Takeaways:**

1. **setTimeout** = one-time, **setInterval** = repeating
2. **setInterval doesn't wait** for callback completion → can stack
3. **Recursive setTimeout waits** for completion → safe for async
4. **Always clear setInterval** to prevent memory leaks
5. **Use setTimeout for async work**, **setInterval for fast sync work**


</details>

---

### 📚 Additional Resources

- [MDN: setTimeout()](https://developer.mozilla.org/en-US/docs/Web/API/setTimeout)
- [MDN: setInterval()](https://developer.mozilla.org/en-US/docs/Web/API/setInterval)
- [Event Loop Explained](https://javascript.info/event-loop)
- [requestAnimationFrame for animations](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)
- [Jake Archibald: In The Loop (Event Loop Talk)](https://www.youtube.com/watch?v=cCOL7MC4Pl0)
- [HTML5 Spec: Timers](https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timers)
