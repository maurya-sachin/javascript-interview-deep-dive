# Memory Management & Optimization

> **Focus**: JavaScript fundamentals and advanced concepts

---

## Question 1: Explain Garbage Collection in JavaScript

**Difficulty:** 🔴 Hard
**Frequency:** ⭐⭐⭐⭐
**Time:** 12-15 minutes
**Companies:** Google, Meta, Amazon

### Question
How does garbage collection work in JavaScript? Explain the mark-and-sweep algorithm.

### Answer

**Garbage Collection (GC)** automatically reclaims memory occupied by objects that are no longer reachable from the root (global object).

**Main Algorithms:**

1. **Reference Counting** (old, has issues)
2. **Mark-and-Sweep** (modern, used by V8)
3. **Generational Collection** (V8 optimization)

### Mark-and-Sweep Algorithm

**Phase 1: Mark**
- Start from "roots" (global objects, local variables)
- Traverse all reachable objects
- Mark each reachable object

**Phase 2: Sweep**
- Scan entire memory
- Free unmarked (unreachable) objects
- Collect freed memory

### Code Example

```javascript
// Example: What gets garbage collected?

function outer() {
  let obj1 = { name: "Object 1" };  // Created on heap
  let obj2 = { name: "Object 2" };  // Created on heap

  obj1.reference = obj2;  // obj1 references obj2
  obj2.reference = obj1;  // obj2 references obj1 (circular!)

  return obj1;
}

let result = outer();
// obj1 is returned and referenced by 'result' → NOT collected
// obj2 is still referenced by obj1 → NOT collected
// Even with circular reference, both alive!

result = null;
// Now both obj1 and obj2 are unreachable → BOTH garbage collected

/*
MARK-AND-SWEEP HANDLES CIRCULAR REFERENCES:
============================================
1. Start from root (result variable)
2. result is null → no references
3. obj1 unreachable → mark for collection
4. obj2 only referenced by obj1 → also unreachable
5. Both collected, despite circular reference

Reference counting would FAIL here (circular ref = never 0)
*/
```

**Reference Counting (Old Algorithm):**

```javascript
// Old algorithm that DOESN'T work well with circular refs

let obj1 = { data: "A" };  // ref count: 1
let obj2 = { data: "B" };  // ref count: 1

obj1.ref = obj2;  // obj2 ref count: 2
obj2.ref = obj1;  // obj1 ref count: 2

obj1 = null;      // obj1 ref count: 1 (still referenced by obj2.ref)
obj2 = null;      // obj2 ref count: 1 (still referenced by obj1.ref)

// PROBLEM: Both ref counts > 0 but unreachable!
// Memory leak with reference counting!

/*
WHY REFERENCE COUNTING FAILS:
==============================
- Circular references never reach 0
- Memory leaks common
- Abandoned in favor of mark-and-sweep
*/
```

**Generational Garbage Collection (V8):**

```javascript
/*
V8 USES GENERATIONAL GC:
========================

HEAP STRUCTURE:
---------------
┌─────────────────────────────────┐
│ Young Generation (New Space)    │  ← New objects
│   - Size: ~1-8 MB               │
│   - Fast GC (Scavenger)         │
│   - Short-lived objects         │
└─────────────────────────────────┘
         ↓ (survives GC)
┌─────────────────────────────────┐
│ Old Generation (Old Space)      │  ← Long-lived objects
│   - Size: Much larger           │
│   - Slower GC (Mark-Sweep)      │
│   - Promoted objects            │
└─────────────────────────────────┘

HYPOTHESIS:
Most objects die young. By separating generations,
GC can focus on young space (frequent, fast) and
old space less often (infrequent, slower).
*/

// Young generation example
function createTemp() {
  let temp = { data: new Array(1000) };
  return temp.data.length;  // temp object dies quickly
}

createTemp();
// temp object never escapes function → dies in young generation

// Old generation example
let longLived = { data: [] };  // Survives multiple GC cycles
for (let i = 0; i < 10000; i++) {
  longLived.data.push(i);
}
// longLived promoted to old generation
```

**GC Triggers and Timing:**

```javascript
// GC runs automatically based on:
// 1. Memory pressure (heap getting full)
// 2. Periodic intervals
// 3. Idle time

/*
MINOR GC (Young Generation):
- Runs frequently (every few MB allocated)
- Fast (~1-10ms pause)
- Scavenger algorithm

MAJOR GC (Old Generation):
- Runs less frequently
- Slower (10-100ms+ pause)
- Mark-sweep-compact algorithm

INCREMENTAL MARKING:
- Breaks mark phase into small chunks
- Interleaved with application code
- Reduces pause times
*/

// Example: Detecting GC impact
console.time('operation');

let arr = [];
for (let i = 0; i < 1000000; i++) {
  arr.push({ index: i });
  // GC may trigger during this loop
}

console.timeEnd('operation');
// Timing will include GC pauses
```

**Reachability Example:**

```javascript
// ROOTS: Starting points for reachability
// - Global object (window in browsers)
// - Currently executing function stack
// - All active closures

let global = { name: "Global" };  // Reachable (global variable)

function demo() {
  let local = { name: "Local" };  // Reachable (active function)

  setTimeout(() => {
    console.log(local.name);  // Reachable (closure)
  }, 1000);

  let temp = { name: "Temp" };  // Reachable now
  // After function ends, temp unreachable if not captured
}

demo();
// 'local' stays reachable (captured by setTimeout closure)
// 'temp' becomes unreachable → garbage collected

/*
REACHABILITY GRAPH:
===================
Roots → global → { name: "Global" } ✓ Kept
Roots → demo (while running) → local → { name: "Local" } ✓ Kept (closure)
Roots → demo (while running) → temp → { name: "Temp" } ✗ Collected (no capture)
*/
```

**Write Barriers (Optimization):**

```javascript
/*
WRITE BARRIERS:
===============
When old generation object references new generation object,
need to track for young generation GC.

Example:
*/
let oldObj = {}; // In old generation after surviving GCs

function addReference() {
  let youngObj = { data: "new" };  // In young generation
  oldObj.ref = youngObj;  // Write barrier triggered!
  // GC must know oldObj.ref points to young generation
}

/*
Why needed?
-----------
Young generation GC only scans young space.
But old objects might reference young objects!
Write barriers ensure young GC checks old→young references.
*/
```

### Common Mistakes

❌ **Wrong**: Trying to manually trigger GC
```javascript
// No standard way to force GC in JavaScript
// (Node.js has --expose-gc flag, but not recommended)

if (global.gc) {
  global.gc();  // Only available with --expose-gc
}
// Don't rely on this!
```

✅ **Correct**: Write GC-friendly code
```javascript
// Help GC by nullifying large objects when done
let largeData = fetchLargeDataset();
processData(largeData);
largeData = null;  // Help GC
```

❌ **Wrong**: Assuming GC runs immediately
```javascript
let obj = { data: new Array(10000000) };
obj = null;
// Memory not freed immediately!
// GC runs on its own schedule
```

<details>
<summary><strong>🔍 Deep Dive: V8 Garbage Collection Internals</strong></summary>

**V8 Memory Layout:**

```javascript
/*
V8 HEAP STRUCTURE (64-bit):
===========================

Total Heap (Default: ~1.4 GB, configurable with --max-old-space-size)
│
├─ New Space (Young Generation): 1-32 MB
│  │
│  ├─ Semi-space 1 (From-space): Active allocation area
│  └─ Semi-space 2 (To-space): Used during scavenging
│
├─ Old Space (Old Generation): ~700 MB
│  ├─ Old Pointer Space: Objects with pointers to other objects
│  └─ Old Data Space: Objects containing only data (numbers, strings)
│
├─ Large Object Space: Objects > 512 KB
│  └─ Each object gets own memory page (not moved during GC)
│
├─ Code Space: JIT-compiled code
└─ Map Space: Hidden classes and shape information
*/

// Example showing allocation behavior:
function demonstrateHeapSpaces() {
  // Small objects → New Space
  let smallObj = { x: 1, y: 2 };

  // Large objects → Large Object Space (skip New Space!)
  let largeArray = new Array(1000000); // > 512 KB

  // Strings → Old Data Space (if interned)
  let str = "hello world";

  // Functions → Code Space (after JIT compilation)
  function add(a, b) { return a + b; }
  for (let i = 0; i < 100000; i++) add(i, i); // Trigger JIT
}
```

**Scavenger Algorithm (Minor GC):**

```javascript
/*
SCAVENGER (CHENEY'S ALGORITHM):
================================

New Space uses "semi-space" copying collector:

1. Allocation Phase:
   - Objects allocated in "From-space"
   - Fast bump-pointer allocation (just increment pointer)

2. Scavenge (when From-space full):
   Step 1: Identify live objects from roots
   Step 2: Copy live objects to "To-space"
   Step 3: Update pointers to copied objects
   Step 4: Swap From-space ↔ To-space
   Step 5: From-space now empty, ready for allocation

Dead objects? Simply left behind (implicit collection!)

Performance:
- Time proportional to LIVE objects (not total heap)
- Fast for young generation (most objects die young)
- Pause: 1-10ms typically
*/

// Example: Object lifecycle through scavenger
function scavengeExample() {
  // Allocation 1
  let obj1 = { id: 1 }; // Allocated in From-space

  // Force allocation pressure
  for (let i = 0; i < 100000; i++) {
    let temp = { data: i }; // Dies immediately
  }

  // Scavenge triggered!
  // obj1 still reachable → copied to To-space
  // All temp objects dead → left in From-space (freed)

  return obj1; // obj1 survived one scavenge
}

// After 2 scavenges, obj1 promoted to Old Space
```

**Mark-Sweep-Compact (Major GC):**

```javascript
/*
MAJOR GC PHASES:
================

Phase 1: MARKING (find all live objects)
-----------------------------------------
Tricolor marking algorithm:

White Set: Unprocessed objects (initially all)
Gray Set:  Found but children not processed
Black Set: Processed (object + all children scanned)

Algorithm:
1. Mark roots as gray
2. While gray set not empty:
   - Pick gray object
   - Mark all its children as gray (if white)
   - Move object to black set
3. End: Black = live, White = garbage

Phase 2: SWEEPING (reclaim dead objects)
-----------------------------------------
Scan entire old space:
- Black objects: Keep
- White objects: Add to free list

Phase 3: COMPACTING (optional, reduce fragmentation)
-----------------------------------------------------
Move live objects together:
- Eliminates fragmentation
- Enables bump-pointer allocation
- Expensive (copies objects)
- Only done when fragmentation high
*/

// Visualization of marking:
const heap = {
  global: { ref: 'obj1' },
  obj1: { data: 'A', ref: 'obj2' },
  obj2: { data: 'B', ref: 'obj3' },
  obj3: { data: 'C' },
  obj4: { data: 'D' } // Unreachable!
};

/*
MARK PHASE TRACE:
=================
Step 1: Start from roots
  Roots: [global] → Gray: [global], Black: [], White: [obj1,obj2,obj3,obj4]

Step 2: Process global
  global.ref → obj1
  Gray: [obj1], Black: [global], White: [obj2,obj3,obj4]

Step 3: Process obj1
  obj1.ref → obj2
  Gray: [obj2], Black: [global,obj1], White: [obj3,obj4]

Step 4: Process obj2
  obj2.ref → obj3
  Gray: [obj3], Black: [global,obj1,obj2], White: [obj4]

Step 5: Process obj3
  No children
  Gray: [], Black: [global,obj1,obj2,obj3], White: [obj4]

SWEEP PHASE:
============
Black set (keep): global, obj1, obj2, obj3
White set (collect): obj4 ← GARBAGE COLLECTED!
*/
```

**Incremental Marking:**

```javascript
/*
PROBLEM: Major GC pause can be 100ms+ (janky!)

SOLUTION: Incremental Marking
==============================

Instead of marking all at once:
1. Mark for 5ms
2. Let JavaScript run
3. Mark for 5ms
4. Let JavaScript run
...repeat until marking complete

Then: Fast final sweep

Result: Total pause time same, but spread out
        No single long jank!

CHALLENGE: Objects can change during pauses!
Solution: Write barriers track changes

WRITE BARRIER EXAMPLE:
*/

// Imagine marking is halfway done...
let oldObj = { data: "old" }; // Already marked black

function causeWriteBarrier() {
  let newObj = { data: "new" }; // Not yet marked (white)

  // This assignment happens DURING incremental marking!
  oldObj.ref = newObj;  // Black → White reference!

  // Write barrier triggers:
  // - Detects black object writing to white object
  // - Marks newObj as gray (needs processing)
  // - Ensures newObj won't be incorrectly swept
}

/*
WITHOUT WRITE BARRIER:
======================
1. oldObj marked black (done processing)
2. newObj still white (not processed yet)
3. oldObj.ref = newObj (creates black→white reference)
4. Marking finishes
5. Sweep collects all white objects
6. newObj collected even though oldObj references it!
7. BUG: oldObj.ref now dangling pointer!

WITH WRITE BARRIER:
===================
Step 3 triggers write barrier:
- Marks newObj as gray
- newObj will be processed before sweep
- newObj survives GC correctly
*/
```

**Concurrent and Parallel GC:**

```javascript
/*
V8 GC OPTIMIZATIONS:
====================

1. PARALLEL GC:
   Multiple GC threads work simultaneously
   - Mark phase: 4 threads scan heap in parallel
   - Sweep phase: Parallel sweeping
   - JavaScript paused during this (stop-the-world)
   - Reduces pause time by ~4x

2. CONCURRENT GC:
   GC runs on separate threads WHILE JavaScript runs!
   - Concurrent marking: Mark objects while app runs
   - Concurrent sweeping: Sweep while app runs
   - Only brief pauses for synchronization
   - Challenge: Handle object changes during GC

3. IDLE-TIME GC:
   Run GC when browser is idle (no frames to render)
   - Browser tells V8: "You have 10ms idle time"
   - V8 does incremental marking in idle time
   - Minimal impact on user experience
*/

// Example: Monitoring GC with Performance API
if (performance.measureUserAgentSpecificMemory) {
  async function measureMemory() {
    const result = await performance.measureUserAgentSpecificMemory();
    console.log('Memory breakdown:', result.breakdown);

    // Shows:
    // - JavaScript objects
    // - Detached DOM nodes
    // - Per-frame memory usage
  }
}

// Node.js: GC performance hooks
if (typeof process !== 'undefined') {
  const { PerformanceObserver } = require('perf_hooks');

  const obs = new PerformanceObserver((items) => {
    items.getEntries().forEach((entry) => {
      console.log('GC Event:', {
        kind: entry.detail.kind,      // Scavenge, Mark-Sweep-Compact, etc.
        duration: entry.duration,     // How long GC took
        freed: entry.detail.freed,    // Bytes freed
      });
    });
  });

  obs.observe({ entryTypes: ['gc'] });
}
```

**Memory Profiling and Optimization:**

```javascript
/*
HEAP SNAPSHOT ANALYSIS:
=======================

Chrome DevTools → Memory → Take Heap Snapshot

Metrics to watch:
- Shallow Size: Object's own memory
- Retained Size: Object + everything it keeps alive
- Retainers: What keeps object alive

Example: Finding memory leaks
*/

// ❌ LEAK: Detached DOM nodes
class ComponentWithLeak {
  constructor() {
    this.element = document.createElement('div');
    this.element.innerHTML = '<p>Content</p>';
    document.body.appendChild(this.element);

    // Leak: Event listener captures entire component
    this.element.addEventListener('click', () => {
      console.log(this.data); // 'this' keeps component alive
    });

    this.data = new Array(1000000); // Large data
  }

  destroy() {
    document.body.removeChild(this.element); // Remove from DOM
    // But event listener still holds reference!
    // this.element is now "detached DOM node"
    // Component + this.data never freed!
  }
}

// ✅ FIX: Clean up event listeners
class ComponentFixed {
  constructor() {
    this.element = document.createElement('div');
    this.element.innerHTML = '<p>Content</p>';
    document.body.appendChild(this.element);

    this.handleClick = this.handleClick.bind(this);
    this.element.addEventListener('click', this.handleClick);

    this.data = new Array(1000000);
  }

  handleClick() {
    console.log(this.data);
  }

  destroy() {
    this.element.removeEventListener('click', this.handleClick); // Remove listener
    document.body.removeChild(this.element);
    // Now component can be GC'd
  }
}
```

**Advanced GC Tuning (Node.js):**

```javascript
/*
NODE.JS GC FLAGS:
=================

Memory limits:
--max-old-space-size=4096    // Old space: 4GB (default: ~1.4GB)
--max-semi-space-size=32     // New space: 32MB per semi-space

GC behavior:
--expose-gc                  // Expose global.gc() function
--trace-gc                   // Log GC events
--trace-gc-verbose           // Detailed GC logs

Performance tuning:
--optimize-for-size          // Favor smaller memory footprint
--max-old-space-size         // More memory = less frequent major GC
*/

// Example: Server with large memory needs
// Start Node.js with: node --max-old-space-size=8192 server.js

const server = require('http').createServer((req, res) => {
  // Can use up to 8GB before GC pressure increases
  const largeData = processLargeDataset();
  res.end(JSON.stringify(largeData));
});

// Monitor GC impact on latency
if (process.env.NODE_ENV === 'production') {
  const { PerformanceObserver } = require('perf_hooks');

  const obs = new PerformanceObserver((items) => {
    items.getEntries().forEach((entry) => {
      if (entry.duration > 50) {
        console.warn('Long GC pause detected:', {
          duration: entry.duration,
          kind: entry.detail.kind
        });
        // Alert: GC pauses affecting latency!
      }
    });
  });

  obs.observe({ entryTypes: ['gc'] });
}
```

</details>

<details>
<summary><strong>🐛 Real-World Scenario: Memory Leak in SPA</strong></summary>

**Scenario:** Your single-page application (SPA) slows down after 30 minutes of use. Memory usage climbs from 50MB to 800MB. Users report tab crashes and browser warnings: "This page is using significant memory."

**The Problem:**

```javascript
// ❌ MEMORY LEAK: Event listeners not cleaned up
class DataGrid {
  constructor(elementId) {
    this.element = document.getElementById(elementId);
    this.data = [];
    this.eventListeners = [];

    // Fetch data every 5 seconds
    this.intervalId = setInterval(() => {
      this.fetchData();
    }, 5000);

    // Add click listeners to rows
    this.renderRows();
  }

  async fetchData() {
    const response = await fetch('/api/data');
    this.data = await response.json(); // Grows over time

    this.renderRows();
  }

  renderRows() {
    // Clear existing rows
    this.element.innerHTML = '';

    // Render new rows
    this.data.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${item.name}</td><td>${item.value}</td>`;

      // ❌ LEAK: Adds new listener every render!
      row.addEventListener('click', () => {
        console.log('Clicked:', item); // Closure captures entire data array!
      });

      this.element.appendChild(row);
    });
  }

  destroy() {
    // ❌ Forgot to:
    // 1. Clear interval
    // 2. Remove event listeners
    // 3. Clear data reference
  }
}

// Usage pattern that causes leak:
class App {
  constructor() {
    this.currentView = null;
  }

  showDataGrid() {
    // ❌ LEAK: Old grid never destroyed!
    this.currentView = new DataGrid('grid-container');
  }

  showOtherView() {
    // ❌ Replace view without cleanup
    this.currentView = new OtherView();
    // Old DataGrid still has:
    // - Running interval
    // - Event listeners
    // - Large data array
    // → Memory leak!
  }
}

// After navigating between views 50 times:
// - 50 intervals running
// - 50 data arrays in memory (50 * 10MB = 500MB!)
// - 1000s of event listeners
```

**Production Metrics Before Fix:**

```javascript
// Metrics collected over 1 week:
const metrics = {
  memoryLeaks: {
    initialMemory: '50MB',
    after30min: '800MB',
    after1hour: '1.4GB',
    crashRate: '15%', // Users hitting memory limit
    complaintTickets: 45,
    bounceRate: '22%' // Users leaving due to slowness
  },
  gcPauses: {
    minor: '5-15ms',    // OK
    major: '150-400ms', // Janky! Causes UI freezes
    frequency: 'Every 2-3 minutes' // Too often
  },
  userImpact: {
    slowScrolling: '60% of sessions',
    tabCrashes: '120/week',
    revenueLoss: '$12k/week' // Users abandoning transactions
  }
};
```

**Debugging Process:**

```javascript
// Step 1: Take heap snapshots
// Chrome DevTools → Memory → Heap Snapshot

// Compare snapshots:
// Snapshot 1: Initial load (50MB)
// Snapshot 2: After 30min (800MB)
// Comparison view shows:

const leakAnalysis = {
  objects: {
    'Detached DOM nodes': '450 nodes (120MB)', // ← Smoking gun!
    'Array': '850 instances (350MB)',
    'Closure': '4500 instances (180MB)',
    'EventListener': '4500 instances (90MB)'
  },
  retainers: {
    // What keeps objects alive?
    topRetainer: 'setInterval callback',
    secondRetainer: 'click event listeners',
    thirdRetainer: 'closure scope (data array)'
  }
};

// Step 2: Allocation Timeline
// Memory → Allocation Timeline
// Shows: Memory spikes every time showDataGrid() called

// Step 3: Identify retainers
// Click on detached DOM node → See retainer tree:
/*
Detached HTMLTableRowElement
  ← onclick EventListener
    ← closure scope
      ← item variable
        ← data Array (10MB!)
          ← DataGrid instance
            ← setInterval callback
              ← Global interval ID
*/

// Step 4: Reproduce in isolation
function reproduceTest() {
  console.log('Initial:', performance.memory.usedJSHeapSize);

  for (let i = 0; i < 50; i++) {
    const grid = new DataGrid('test');
    // Simulate navigation (no cleanup)
    document.getElementById('test').innerHTML = '';
  }

  setTimeout(() => {
    console.log('After 50 iterations:', performance.memory.usedJSHeapSize);
    // Initial: 52MB → After: 780MB
    // Leak confirmed!
  }, 5000);
}
```

**Solution 1: Proper Cleanup:**

```javascript
// ✅ FIX: Comprehensive cleanup
class DataGridFixed {
  constructor(elementId) {
    this.element = document.getElementById(elementId);
    this.data = [];
    this.intervalId = null;
    this.abortController = new AbortController(); // For event cleanup

    this.startPolling();
    this.renderRows();
  }

  startPolling() {
    this.intervalId = setInterval(() => {
      this.fetchData();
    }, 5000);
  }

  async fetchData() {
    try {
      const response = await fetch('/api/data', {
        signal: this.abortController.signal // Allow aborting
      });
      this.data = await response.json();
      this.renderRows();
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Fetch failed:', error);
      }
    }
  }

  renderRows() {
    // Clear previous rows (removes old event listeners automatically)
    this.element.innerHTML = '';

    this.data.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${item.name}</td><td>${item.value}</td>`;

      // ✅ Use AbortController to auto-cleanup listeners
      row.addEventListener('click', () => {
        console.log('Clicked:', item);
      }, { signal: this.abortController.signal });

      this.element.appendChild(row);
    });
  }

  destroy() {
    // ✅ Comprehensive cleanup
    clearInterval(this.intervalId);    // Stop polling
    this.abortController.abort();      // Remove all event listeners
    this.element.innerHTML = '';       // Clear DOM
    this.data = null;                  // Clear data reference
    this.element = null;               // Clear element reference
  }
}

// Usage with proper lifecycle:
class AppFixed {
  constructor() {
    this.currentView = null;
  }

  showDataGrid() {
    // ✅ Destroy old view first
    if (this.currentView && this.currentView.destroy) {
      this.currentView.destroy();
    }

    this.currentView = new DataGridFixed('grid-container');
  }

  showOtherView() {
    // ✅ Cleanup before switching
    if (this.currentView && this.currentView.destroy) {
      this.currentView.destroy();
    }

    this.currentView = new OtherView();
  }
}
```

**Solution 2: WeakMap for Caching:**

```javascript
// ✅ BETTER: Use WeakMap to prevent retention
class DataGridWithWeakMap {
  constructor(elementId) {
    this.element = document.getElementById(elementId);
    // ✅ WeakMap allows GC of DOM nodes
    this.rowData = new WeakMap();

    this.renderRows();
  }

  renderRows() {
    const data = this.fetchData(); // Get data

    data.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${item.name}</td><td>${item.value}</td>`;

      // ✅ Store data in WeakMap (weak reference)
      this.rowData.set(row, item);

      row.addEventListener('click', () => {
        const data = this.rowData.get(row); // Retrieve from WeakMap
        console.log('Clicked:', data);
      });

      this.element.appendChild(row);
    });
  }

  destroy() {
    this.element.innerHTML = ''; // Clears rows
    // this.rowData entries auto-removed when rows GC'd!
  }
}
```

**Solution 3: Event Delegation:**

```javascript
// ✅ BEST: Event delegation (one listener, not thousands)
class DataGridWithDelegation {
  constructor(elementId) {
    this.element = document.getElementById(elementId);
    this.data = [];

    // ✅ Single event listener on container
    this.handleRowClick = this.handleRowClick.bind(this);
    this.element.addEventListener('click', this.handleRowClick);

    this.renderRows();
  }

  handleRowClick(event) {
    const row = event.target.closest('tr');
    if (!row) return;

    const index = Array.from(this.element.children).indexOf(row);
    const item = this.data[index];
    console.log('Clicked:', item);
  }

  renderRows() {
    // No event listeners on individual rows!
    this.element.innerHTML = this.data
      .map(item => `<tr><td>${item.name}</td><td>${item.value}</td></tr>`)
      .join('');
  }

  destroy() {
    // ✅ Only one listener to remove
    this.element.removeEventListener('click', this.handleRowClick);
    this.element.innerHTML = '';
    this.data = null;
  }
}
```

**Production Metrics After Fix:**

```javascript
// After implementing Solution 3 (Event Delegation + Cleanup):
const metricsAfterFix = {
  memoryUsage: {
    initialMemory: '50MB',
    after30min: '65MB',    // ✅ Stable!
    after1hour: '72MB',    // ✅ Minimal growth
    crashRate: '0.2%',     // ✅ 98% reduction
    complaintTickets: 2,   // ✅ 95% reduction
    bounceRate: '4%'       // ✅ 82% reduction
  },
  gcPauses: {
    minor: '2-5ms',        // ✅ Faster
    major: '15-40ms',      // ✅ 90% improvement
    frequency: 'Every 15-20 minutes' // ✅ Much less frequent
  },
  userImpact: {
    slowScrolling: '2% of sessions', // ✅ 97% improvement
    tabCrashes: '3/week',            // ✅ 97% reduction
    revenueLoss: '$500/week',        // ✅ $11.5k recovered/week
    customerSatisfaction: '+92%'
  },
  developerImpact: {
    debuggingTime: '4 hours/week → 20 minutes/week',
    codeQuality: 'Cleaner lifecycle management',
    testability: 'Easier to test (explicit destroy)'
  }
};
```

**Monitoring and Alerting:**

```javascript
// ✅ Production monitoring for memory issues
class MemoryMonitor {
  constructor() {
    this.initialMemory = performance.memory?.usedJSHeapSize || 0;
    this.checkInterval = setInterval(() => this.checkMemory(), 60000); // Every minute
  }

  checkMemory() {
    if (!performance.memory) return;

    const current = performance.memory.usedJSHeapSize;
    const growth = current - this.initialMemory;
    const growthMB = growth / (1024 * 1024);

    if (growthMB > 200) {
      // Alert: Memory grew > 200MB
      this.sendAlert({
        type: 'MEMORY_LEAK_SUSPECTED',
        growthMB,
        currentMB: current / (1024 * 1024),
        timeElapsed: Date.now() - this.startTime
      });
    }
  }

  sendAlert(data) {
    fetch('/api/monitoring/alert', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  destroy() {
    clearInterval(this.checkInterval);
  }
}

// Initialize monitoring in production
if (process.env.NODE_ENV === 'production') {
  const monitor = new MemoryMonitor();
}
```

</details>

<details>
<summary><strong>⚖️ Trade-offs: GC Strategies</strong></summary>

**1. Manual Memory Management vs Garbage Collection:**

```javascript
// Manual (C/C++):
// ✅ Full control over when memory freed
// ✅ Predictable performance (no GC pauses)
// ❌ Developers must remember to free (memory leaks)
// ❌ Use-after-free bugs (dangling pointers)
// ❌ More development time

// Automatic GC (JavaScript):
// ✅ No manual free() calls
// ✅ No use-after-free bugs
// ✅ Faster development
// ❌ GC pauses (unpredictable)
// ❌ Less control over when memory freed
// ❌ Overhead of GC algorithm
```

**2. Reference Counting vs Mark-and-Sweep:**

| Aspect | Reference Counting | Mark-and-Sweep |
|--------|-------------------|----------------|
| **Circular references** | ❌ Memory leak | ✅ Handles correctly |
| **Collection timing** | ✅ Immediate when count = 0 | ⚠️ Delayed until GC runs |
| **Pause time** | ✅ Distributed (incremental) | ⚠️ Stop-the-world pause |
| **Overhead** | ⚠️ Every assignment updates count | ✅ Lower per-assignment cost |
| **Cache locality** | ⚠️ Poor (scattered frees) | ✅ Better (batch frees) |
| **Used by** | Python (with cycle detector), Swift | JavaScript, Java, Go |

```javascript
// Example: Why mark-and-sweep wins for JavaScript

// ❌ Reference counting fails here:
function createCircular() {
  let obj1 = { name: "A" };
  let obj2 = { name: "B" };

  obj1.ref = obj2;  // obj2 count: 2
  obj2.ref = obj1;  // obj1 count: 2

  return null;
  // Objects unreachable but counts > 0
  // Memory leak!
}

// ✅ Mark-and-sweep succeeds:
function createCircular() {
  let obj1 = { name: "A" };
  let obj2 = { name: "B" };

  obj1.ref = obj2;
  obj2.ref = obj1;

  return null;
  // GC starts from roots
  // Can't reach obj1 or obj2
  // Both marked as garbage
  // Both collected!
}
```

**3. Generational vs Non-Generational GC:**

```javascript
/*
GENERATIONAL GC TRADE-OFFS:
===========================

Hypothesis: Most objects die young

✅ PROS:
- Fast young generation GC (1-10ms)
- Focus effort where most garbage is
- Less frequent expensive major GC
- Better overall throughput

❌ CONS:
- Write barriers overhead (track old→young refs)
- Complexity (two GC algorithms)
- Promotion overhead (copying to old space)
- Age tracking overhead
*/

// Example: Performance comparison
function generateTraffic() {
  // Young generation pattern (dies quickly)
  for (let i = 0; i < 1000000; i++) {
    let temp = { data: i }; // Dies immediately
  }
  // Generational GC: Fast scavenger handles this
  // Non-generational: Would scan ALL heap every time
}

// Metrics:
// Generational GC: 5-10 scavenges, 5ms each = 50ms total
// Non-generational: 1 full GC, 200ms = 200ms total
// Winner: Generational GC (4x faster!)
```

**4. Stop-the-World vs Concurrent GC:**

| Aspect | Stop-the-World | Concurrent |
|--------|---------------|------------|
| **Pause time** | ❌ 10-100ms+ | ✅ 1-5ms (only sync pauses) |
| **Total time** | ✅ Faster overall | ⚠️ More total time (overhead) |
| **Complexity** | ✅ Simple | ❌ Very complex |
| **Correctness** | ✅ Easy to reason about | ⚠️ Write barriers needed |
| **Throughput** | ✅ Higher | ⚠️ Lower (barrier overhead) |
| **Latency** | ❌ High tail latencies | ✅ Low tail latencies |

```javascript
// When each is better:

// ✅ Stop-the-world: Batch processing, background jobs
function batchProcessor() {
  // Process 1M records
  // Don't care about latency
  // Want max throughput
  // Stop-the-world GC = fine
}

// ✅ Concurrent: UI applications, servers
function handleRequest(req, res) {
  // Must respond in < 100ms
  // GC pause = bad UX
  // Concurrent GC = crucial
}
```

**5. Compacting vs Non-Compacting GC:**

```javascript
/*
COMPACTING GC:
==============

✅ PROS:
- No fragmentation
- Fast allocation (bump pointer)
- Better cache locality (objects together)
- Lower memory overhead

❌ CONS:
- Must move objects (update all pointers)
- More expensive GC
- Need to pause application (tricky concurrent)

NON-COMPACTING (FREE LIST):
============================

✅ PROS:
- Simpler (no moving objects)
- Can allocate during GC
- Easier to make concurrent

❌ CONS:
- Fragmentation (waste memory)
- Slower allocation (find free block)
- Worse cache locality
*/

// Example: Fragmentation issue
const heap = {
  // Non-compacting: Free list
  // [obj 10KB] [free 5KB] [obj 8KB] [free 3KB] [obj 12KB] [free 20KB]
  //
  // Want to allocate 15KB:
  // - 5KB block: Too small
  // - 3KB block: Too small
  // - 20KB block: OK, but waste 5KB
  // Total free: 28KB, but can't allocate 15KB efficiently!

  // Compacting: After compaction
  // [obj 10KB] [obj 8KB] [obj 12KB] [free 28KB contiguous]
  //
  // Want to allocate 15KB:
  // - Just bump pointer by 15KB
  // - No waste, fast allocation
};
```

**6. Explicit null vs Relying on GC:**

```javascript
// Pattern 1: Explicit nulling (helping GC)
function processLargeData() {
  let largeArray = new Array(10000000); // 80MB

  doWork(largeArray);

  largeArray = null; // ✅ Help GC

  doOtherWork(); // GC can run now
}

// Pattern 2: Let GC handle it
function processLargeData() {
  let largeArray = new Array(10000000);

  doWork(largeArray);

  doOtherWork(); // largeArray still in scope!
}
```

| Aspect | Explicit null | Rely on GC |
|--------|--------------|------------|
| **Readability** | ⚠️ More code | ✅ Cleaner |
| **Clarity** | ✅ Clear intent | ⚠️ Implicit |
| **Effectiveness** | ✅ Immediate eligibility | ⚠️ Delayed (scope end) |
| **Maintenance** | ❌ Must remember | ✅ Automatic |
| **Best for** | Large objects, long functions | Normal code |

**Decision Matrix:**

| Scenario | Recommended Approach |
|----------|---------------------|
| **Tight loops creating objects** | Generational GC shines |
| **Low-latency required** | Concurrent + Incremental GC |
| **High throughput batch** | Stop-the-world acceptable |
| **Limited memory** | Compacting GC preferred |
| **Large objects (>10MB)** | Explicit null after use |
| **Long-lived objects** | Let GC promote to old space |
| **Circular refs** | Mark-and-sweep required |
| **Real-time systems** | Manual memory management (not JS!) |

</details>

<details>
<summary><strong>💬 Explain to Junior: Garbage Collection Simplified</strong></summary>

**Simple Analogy: Cleaning Your Room**

Imagine your room is the computer's memory:

```javascript
// Your room = Memory
// Toys/books = Objects in memory
// You (playing) = JavaScript program

function playWithToys() {
  let toy1 = { name: "Robot" };    // Take out robot
  let toy2 = { name: "Ball" };     // Take out ball

  play(toy1, toy2);

  // When function ends, you're done playing
  // Garbage collector = Mom cleaning up unused toys!
}

// Garbage collector asks: "Are you still playing with this?"
// - If YES (reachable): Keep it
// - If NO (unreachable): Put it away (free memory)
```

**How Mark-and-Sweep Works (Simple Version):**

```javascript
/*
STEP 1: MARK (Find what's still needed)
========================================

Mom starts from you (the "root"):
1. "What are you holding?" → Robot ✓ (mark as needed)
2. "What is Robot connected to?" → Ball ✓ (mark as needed)
3. "Anything else?" → No

STEP 2: SWEEP (Clean up what's not needed)
===========================================

Mom looks at all toys in room:
- Robot: Marked ✓ → Keep
- Ball: Marked ✓ → Keep
- Old puzzle: Not marked ✗ → Put away (free memory!)

Toys that you can't reach anymore = Garbage!
*/

// Code example:
function demonstrateGC() {
  let inUse = { name: "Keep me" };      // You're holding this

  let garbage = { name: "Trash me" };   // You let go

  return inUse;
  // inUse: You're returning it = still needed ✓
  // garbage: No one references it = garbage ✗
}
```

**Why Garbage Collection is Helpful:**

```javascript
// Without GC (imagine you had to manually clean):
function manualMemory() {
  let toy = create("Robot");
  play(toy);
  free(toy);  // ❌ Must remember to clean up!

  if (condition) {
    return; // ❌ Forgot to free(toy)! Memory leak!
  }

  free(toy); // ❌ If you freed twice? Crash!
}

// With GC (automatic cleaning):
function automaticMemory() {
  let toy = { name: "Robot" };
  play(toy);
  // ✅ GC automatically cleans up when you're done!
  // ✅ Can't forget!
  // ✅ Can't double-free!
}
```

**Common Questions:**

**Q: "When does garbage collection happen?"**
```javascript
// A: JavaScript decides automatically!

// Triggers:
// 1. Memory getting full
// 2. Regular intervals
// 3. When browser is idle (not doing anything)

// You don't control it (and that's OK!)
```

**Q: "Can I force garbage collection?"**
```javascript
// A: No (in normal JavaScript)

// ❌ Can't do this in browser:
// forceGarbageCollection(); // Doesn't exist

// ✅ But you can help GC:
function helpGC() {
  let bigData = new Array(1000000);
  processBigData(bigData);

  bigData = null; // Tell GC: "I don't need this anymore"
  // GC will collect it when it runs next
}
```

**Q: "What's a memory leak?"**
```javascript
// A: When you accidentally keep things you don't need

// Example: Losing track of toys
let toyBox = [];

function createToy() {
  let toy = { name: "Robot" };
  toyBox.push(toy); // Add to box

  // Later...
  toy = null; // You're not using it

  // But it's still in toyBox!
  // GC can't clean it (box still references it)
  // Memory leak = toys piling up in box forever
}

// ✅ Fix: Remove from box when done
function createToyFixed() {
  let toy = { name: "Robot" };
  toyBox.push(toy);

  // Later...
  const index = toyBox.indexOf(toy);
  toyBox.splice(index, 1); // Remove from box
  toy = null;

  // Now GC can clean it up!
}
```

**Visual Example:**

```javascript
// Imagine memory as a shelf:

// [Robot] [Ball] [Puzzle] [Book] [Game]
//   ↑      ↑                        ↑
//   |      |                        |
//  You → Friend                   Toy box
//
// Mark phase: GC marks what's reachable
// - Robot: You use it ✓ Mark
// - Ball: Friend uses it ✓ Mark
// - Puzzle: No one uses it ✗ (not marked)
// - Book: No one uses it ✗ (not marked)
// - Game: Toy box has it ✓ Mark
//
// Sweep phase: Remove unmarked
// [Robot] [Ball] [FREE] [FREE] [Game]
//
// Memory freed: Puzzle and Book space now available!
```

**Explaining to PM:**

"Garbage collection is like an automatic janitor for computer memory.

**Without GC:**
- Programmers must manually 'throw away' everything
- Easy to forget → memory leaks → app crashes
- Like if every employee had to empty their own trash can and sweep floors
- Error-prone and time-consuming

**With GC:**
- JavaScript automatically cleans up unused memory
- Programmers just create and use objects
- Janitor (GC) figures out what's trash and throws it away
- Like having a cleaning crew handle office cleanup

**Business value:**
- Fewer bugs (can't forget to clean up)
- Faster development (don't write cleanup code)
- Better reliability (app doesn't crash from memory leaks)
- Industry standard (all modern languages have GC)

**Trade-off:**
- Sometimes janitor cleans while office is busy (GC pause)
- Can cause brief slow-downs (10-50ms)
- But much better than constant crashes from memory bugs!"

**Key Points for Juniors:**

1. **You don't control GC** - It runs automatically
2. **Objects reachable from roots are kept** - Everything else is trash
3. **Circular references are OK** - Modern GC handles them
4. **Help GC by clearing big objects** - `largeData = null` when done
5. **Memory leaks happen from accidental references** - Event listeners, closures, global variables

</details>

### Follow-up Questions
1. "What's the difference between minor and major GC?"
2. "How does V8's generational GC improve performance?"
3. "What are write barriers and why are they needed?"
4. "Can you detect GC pauses in your application?"

### Resources
- [V8 Garbage Collection](https://v8.dev/blog/trash-talk)
- [MDN: Mark and Sweep](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management#mark-and-sweep_algorithm)
- [Visualizing Garbage Collection](https://spin.atomicobject.com/2014/09/03/visualizing-garbage-collection-algorithms/)

---

## Question 2: What are Memory Leaks and How to Prevent Them?

**Difficulty:** 🔴 Hard
**Frequency:** ⭐⭐⭐⭐
**Time:** 12-15 minutes
**Companies:** Google, Meta, Netflix, Uber

### Question
What causes memory leaks in JavaScript? How do you detect and fix them?

### Answer

A **memory leak** occurs when memory that is no longer needed is not freed, causing the application to consume increasingly more memory over time.

**Common Causes:**

1. Forgotten timers/callbacks
2. Closures holding references
3. Detached DOM nodes
4. Global variables
5. Event listeners not removed

### Code Example

**1. Forgotten Timers:**

```javascript
// ❌ MEMORY LEAK
function startTimer() {
  let largeData = new Array(1000000).fill('data');

  setInterval(() => {
    console.log(largeData[0]);  // Closure keeps largeData alive
  }, 1000);
}

startTimer();
// largeData NEVER freed (interval never cleared)

// ✅ FIXED
function startTimer() {
  let largeData = new Array(1000000).fill('data');

  const intervalId = setInterval(() => {
    console.log(largeData[0]);
  }, 1000);

  // Clear when done
  setTimeout(() => {
    clearInterval(intervalId);
    // Now largeData can be GC'd
  }, 10000);
}
```

**2. Closure Leaks:**

```javascript
// ❌ MEMORY LEAK
function createLeak() {
  let largeArray = new Array(1000000);

  return function smallClosure() {
    // Only uses first element
    return largeArray[0];
  };
}

const leak = createLeak();
// Entire largeArray kept in memory for one element!

// ✅ FIXED
function noLeak() {
  let largeArray = new Array(1000000);
  let firstElement = largeArray[0];  // Extract what you need

  return function smallClosure() {
    return firstElement;  // Only small value captured
  };
}

const noLeakFunc = noLeak();
// Only firstElement kept, largeArray can be GC'd
```

**3. Detached DOM Nodes:**

```javascript
// ❌ MEMORY LEAK
let detachedNodes = [];

function addElement() {
  let div = document.createElement('div');
  div.innerHTML = 'Content'.repeat(10000);
  document.body.appendChild(div);

  // Store reference
  detachedNodes.push(div);

  // Later remove from DOM
  document.body.removeChild(div);
  // But still referenced in array → MEMORY LEAK!
}

// ✅ FIXED
let weakNodeSet = new WeakSet();

function addElement() {
  let div = document.createElement('div');
  div.innerHTML = 'Content'.repeat(10000);
  document.body.appendChild(div);

  // Weak reference
  weakNodeSet.add(div);

  document.body.removeChild(div);
  // WeakSet doesn't prevent GC
}
```

**4. Event Listener Leaks:**

```javascript
// ❌ MEMORY LEAK
class Component {
  constructor() {
    this.data = new Array(1000000);

    // Event listener keeps entire component alive
    document.addEventListener('click', () => {
      console.log(this.data.length);
    });
  }

  destroy() {
    // Forgot to remove listener!
  }
}

let component = new Component();
component.destroy();
component = null;
// Still in memory! (event listener holds reference)

// ✅ FIXED
class Component {
  constructor() {
    this.data = new Array(1000000);
    this.handleClick = this.handleClick.bind(this);

    document.addEventListener('click', this.handleClick);
  }

  handleClick() {
    console.log(this.data.length);
  }

  destroy() {
    // Remove listener
    document.removeEventListener('click', this.handleClick);
  }
}

let component = new Component();
component.destroy();
component = null;
// Now can be GC'd
```

**5. Global Variables:**

```javascript
// ❌ MEMORY LEAK (Accidental Global)
function leak() {
  // Missing 'let' keyword
  myData = new Array(1000000);  // Creates window.myData
}

leak();
// myData never freed (global)

// ✅ FIXED
"use strict";

function noLeak() {
  let myData = new Array(1000000);  // Properly scoped
}

noLeak();
// myData GC'd after function
```

**6. Console.log Leaks:**

```javascript
// ❌ POTENTIAL LEAK (in production!)
function process() {
  let largeObject = { data: new Array(1000000) };

  console.log("Processing:", largeObject);
  // Console keeps reference to logged objects!

  // ... rest of code ...
}

// ✅ FIXED
function process() {
  let largeObject = { data: new Array(1000000) };

  if (process.env.NODE_ENV === 'development') {
    console.log("Processing:", largeObject);
  }

  // Or log primitives only
  console.log("Processing:", largeObject.data.length);
}
```

**Detecting Memory Leaks:**

```javascript
// Using Chrome DevTools Memory Profiler

// 1. Take heap snapshot
// 2. Perform action
// 3. Take another snapshot
// 4. Compare snapshots

// Example test:
class LeakyClass {
  constructor() {
    this.data = new Array(1000000).fill('leak');
  }
}

const leaks = [];

// Run this multiple times and check memory
function createLeak() {
  leaks.push(new LeakyClass());
}

// Memory should grow linearly
setInterval(createLeak, 1000);

/*
DETECTION TOOLS:
================
1. Chrome DevTools Memory Profiler
   - Heap snapshots
   - Allocation timeline
   - Comparison view

2. Performance Monitor
   - Watch memory over time
   - Identify growing memory

3. Node.js --inspect
   - Chrome DevTools for Node.js
   - Heap snapshots

4. process.memoryUsage() (Node.js)
   - Programmatic monitoring
*/
```

**Memory Leak Patterns to Avoid:**

```javascript
// Pattern 1: Cache without limits
// ❌ BAD
const cache = {};

function getData(id) {
  if (!cache[id]) {
    cache[id] = expensiveOperation(id);
    // Cache grows forever!
  }
  return cache[id];
}

// ✅ GOOD: Use WeakMap or LRU cache
const cache = new Map();
const MAX_CACHE_SIZE = 100;

function getData(id) {
  if (!cache.has(id)) {
    if (cache.size >= MAX_CACHE_SIZE) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);  // Remove oldest
    }
    cache.set(id, expensiveOperation(id));
  }
  return cache.get(id);
}

// Pattern 2: Observer pattern without cleanup
// ❌ BAD
class EventEmitter {
  constructor() {
    this.listeners = [];
  }

  on(callback) {
    this.listeners.push(callback);
    // No way to remove!
  }
}

// ✅ GOOD: Provide cleanup
class EventEmitter {
  constructor() {
    this.listeners = [];
  }

  on(callback) {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
}

const emitter = new EventEmitter();
const unsubscribe = emitter.on(() => {});
// Later:
unsubscribe();
```

### Common Mistakes

❌ **Wrong**: Ignoring cleanup in unmount
```javascript
// React example
function Component() {
  useEffect(() => {
    const interval = setInterval(() => {
      // Do something
    }, 1000);

    // ❌ No cleanup = leak
  }, []);
}
```

✅ **Correct**: Always cleanup
```javascript
function Component() {
  useEffect(() => {
    const interval = setInterval(() => {
      // Do something
    }, 1000);

    return () => clearInterval(interval);  // Cleanup
  }, []);
}
```

<details>
<summary><strong>🔍 Deep Dive: Memory Leak Patterns and Detection</strong></summary>

**Advanced Memory Leak Patterns:**

```javascript
/*
PATTERN 1: Closure Scope Retention
===================================

Problem: Closures capture entire scope, not just used variables
*/

// ❌ LEAK: Large unused variables captured
function createHandler() {
  // Large data structure
  const largeData = new Array(1000000).fill({
    timestamp: Date.now(),
    value: Math.random()
  });

  // Process initial data
  processData(largeData);

  // Return handler that doesn't need largeData
  return function onClick() {
    console.log('Clicked!');
    // Doesn't use largeData, but entire scope captured!
  };
}

const handler = createHandler();
document.addEventListener('click', handler);
// largeData kept in memory even though handler doesn't use it!

// ✅ FIX: Split into separate scopes
function createHandler() {
  // Scope 1: Process large data
  {
    const largeData = new Array(1000000).fill({
      timestamp: Date.now(),
      value: Math.random()
    });
    processData(largeData);
    // largeData eligible for GC when block ends
  }

  // Scope 2: Create handler
  return function onClick() {
    console.log('Clicked!');
    // Only captures this scope (no largeData)
  };
}

/*
PATTERN 2: Accidental DOM Tree Retention
=========================================

Problem: Keeping reference to child keeps entire tree alive
*/

// ❌ LEAK: Storing inner element
class DataTable {
  constructor() {
    this.tableElement = document.createElement('table');
    this.tableElement.innerHTML = `
      <thead><tr><th>Name</th><th>Value</th></tr></thead>
      <tbody>${'<tr><td>Data</td><td>Value</td></tr>'.repeat(10000)}</tbody>
    `;

    document.body.appendChild(this.tableElement);

    // Store reference to single cell
    this.favoriteCell = this.tableElement.querySelector('td');
    // ❌ This keeps entire table in memory!
  }

  destroy() {
    document.body.removeChild(this.tableElement);
    // But this.favoriteCell still references a <td>
    // Which references its <tr> parent
    // Which references <tbody> parent
    // Which references <table> parent
    // Entire detached DOM tree kept in memory!
  }
}

// ✅ FIX: Clear all references
class DataTableFixed {
  constructor() {
    this.tableElement = document.createElement('table');
    this.tableElement.innerHTML = `
      <thead><tr><th>Name</th><th>Value</th></tr></thead>
      <tbody>${'<tr><td>Data</td><td>Value</td></tr>'.repeat(10000)}</tbody>
    `;

    document.body.appendChild(this.tableElement);

    // Store data, not DOM reference
    this.favoriteCellValue = this.tableElement.querySelector('td').textContent;
  }

  destroy() {
    document.body.removeChild(this.tableElement);
    this.tableElement = null; // Clear reference
    // Now entire tree can be GC'd
  }
}

/*
PATTERN 3: Promise Chains
==========================

Problem: Rejected promises in long chains retain context
*/

// ❌ LEAK: Long promise chain
async function processUserData(userId) {
  const userData = await fetchUser(userId); // Large object

  return Promise.resolve()
    .then(() => validateData(userData))
    .then(() => enrichData(userData))
    .then(() => saveData(userData))
    .then(() => notifyUser(userData))
    .then(() => logSuccess(userData))
    .catch(error => {
      // Error handler captures entire promise chain context
      // All userData references kept in memory
      console.error('Failed:', error);
      return { success: false };
    });

  // If chain is long, userData retained through many .then() calls
}

// ✅ FIX: Extract only needed data
async function processUserDataFixed(userId) {
  const userData = await fetchUser(userId);

  // Extract only what's needed
  const userInfo = {
    id: userData.id,
    email: userData.email
  };

  // userData can now be GC'd

  return Promise.resolve()
    .then(() => validateData(userInfo))
    .then(() => enrichData(userInfo))
    .then(() => saveData(userInfo))
    .then(() => notifyUser(userInfo))
    .then(() => logSuccess(userInfo))
    .catch(error => {
      console.error('Failed:', error);
      return { success: false };
    });
}

/*
PATTERN 4: WeakMap/WeakSet Misunderstanding
============================================

Problem: Thinking WeakMap prevents all leaks
*/

// ❌ STILL LEAKS: WeakMap key is primitive
const cache = new WeakMap();

function cacheData(userId) {
  // ❌ Primitives can't be WeakMap keys!
  // cache.set(userId, largeData); // TypeError

  // Workaround: Wrap in object
  const key = { userId };
  cache.set(key, largeData);

  return key; // ❌ But now you're returning the key!
  // Caller holds key → keeps largeData alive
  // WeakMap doesn't help!
}

// ✅ CORRECT: Use objects as keys
class User {
  constructor(id) {
    this.id = id;
  }
}

const userCache = new WeakMap();

function cacheUserData(user) {
  const largeData = fetchUserData(user.id);
  userCache.set(user, largeData); // Object as key

  // When no references to 'user' object exist
  // WeakMap entry auto-removed
  // largeData eligible for GC
}

const user = new User(123);
cacheUserData(user);

// Later...
user = null; // Last reference gone
// userCache entry auto-removed
// largeData can be GC'd
```

**Advanced Detection Techniques:**

```javascript
/*
TECHNIQUE 1: Heap Snapshot Diff Analysis
=========================================

Chrome DevTools → Memory → Heap Snapshot
*/

class MemoryLeakDetector {
  constructor() {
    this.snapshots = [];
  }

  async takeSnapshot(label) {
    // In real Chrome DevTools:
    // 1. Click "Take snapshot"
    // 2. Label it
    // 3. Perform action
    // 4. Take another snapshot
    // 5. Use "Comparison" view

    console.log(`Snapshot: ${label}`);

    if (performance.memory) {
      this.snapshots.push({
        label,
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      });
    }
  }

  analyze() {
    if (this.snapshots.length < 2) {
      console.warn('Need at least 2 snapshots to compare');
      return;
    }

    for (let i = 1; i < this.snapshots.length; i++) {
      const prev = this.snapshots[i - 1];
      const curr = this.snapshots[i];

      const growth = curr.usedJSHeapSize - prev.usedJSHeapSize;
      const growthMB = growth / (1024 * 1024);

      console.log(`${prev.label} → ${curr.label}:`);
      console.log(`  Growth: ${growthMB.toFixed(2)} MB`);

      if (growthMB > 10) {
        console.warn('  ⚠️ Potential memory leak!');
      }
    }
  }
}

// Usage:
const detector = new MemoryLeakDetector();

detector.takeSnapshot('Initial load');

// Perform action
for (let i = 0; i < 100; i++) {
  createComponent();
}

detector.takeSnapshot('After 100 components');

// Destroy components
destroyAllComponents();

detector.takeSnapshot('After destroy');

detector.analyze();
// Expected: Memory after destroy ≈ Initial load
// If not: Memory leak!

/*
TECHNIQUE 2: Allocation Timeline
=================================

Chrome DevTools → Memory → Allocation instrumentation on timeline

Shows:
- Blue bars: Allocations over time
- Gray bars: Objects freed

Analysis:
- Growing blue bars = leak
- Correlate with actions (click, navigation, etc.)
*/

// Example: Trigger suspicious action repeatedly
function stressTest() {
  const iterations = 100;

  console.log('Starting stress test...');
  console.log('Watch Allocation Timeline in DevTools');

  let count = 0;
  const intervalId = setInterval(() => {
    // Suspicious action
    createSuspectedLeakyComponent();

    count++;

    if (count >= iterations) {
      clearInterval(intervalId);
      console.log('Stress test complete');
      console.log('Check if memory plateaus or keeps growing');
    }
  }, 100);
}

/*
TECHNIQUE 3: Programmatic Monitoring (Node.js)
===============================================
*/

if (typeof process !== 'undefined') {
  const v8 = require('v8');
  const vm = require('vm');

  class MemoryMonitor {
    constructor(options = {}) {
      this.checkInterval = options.interval || 60000; // 1 minute
      this.growthThreshold = options.threshold || 50; // 50MB
      this.baseline = null;
      this.intervalId = null;
    }

    start() {
      this.baseline = this.getMemoryUsage();
      console.log('Memory monitoring started:', this.baseline);

      this.intervalId = setInterval(() => {
        this.check();
      }, this.checkInterval);
    }

    stop() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }

    getMemoryUsage() {
      const heapStats = v8.getHeapStatistics();
      const usage = process.memoryUsage();

      return {
        heapUsed: usage.heapUsed / (1024 * 1024), // MB
        heapTotal: usage.heapTotal / (1024 * 1024),
        external: usage.external / (1024 * 1024),
        rss: usage.rss / (1024 * 1024),
        heapStats: {
          totalHeapSize: heapStats.total_heap_size / (1024 * 1024),
          usedHeapSize: heapStats.used_heap_size / (1024 * 1024),
          heapSizeLimit: heapStats.heap_size_limit / (1024 * 1024)
        }
      };
    }

    check() {
      const current = this.getMemoryUsage();
      const growth = current.heapUsed - this.baseline.heapUsed;

      console.log('Memory check:', {
        heapUsed: `${current.heapUsed.toFixed(2)} MB`,
        growth: `${growth > 0 ? '+' : ''}${growth.toFixed(2)} MB`,
        rss: `${current.rss.toFixed(2)} MB`
      });

      if (growth > this.growthThreshold) {
        console.warn('⚠️ Memory leak detected!');
        this.takeHeapSnapshot();
      }
    }

    takeHeapSnapshot() {
      const filename = `heap-${Date.now()}.heapsnapshot`;
      const snapshotStream = v8.writeHeapSnapshot(filename);

      console.log(`Heap snapshot saved: ${filename}`);
      console.log('Analyze with Chrome DevTools:');
      console.log('1. Open DevTools → Memory');
      console.log('2. Click "Load" button');
      console.log(`3. Select ${filename}`);
    }
  }

  // Usage:
  const monitor = new MemoryMonitor({
    interval: 30000,  // Check every 30s
    threshold: 50     // Alert if growth > 50MB
  });

  monitor.start();

  // In production:
  process.on('SIGTERM', () => {
    monitor.stop();
    monitor.takeHeapSnapshot(); // Final snapshot before shutdown
  });
}
```

**Memory Leak Prevention Checklist:**

```javascript
/*
PREVENTION CHECKLIST:
=====================

✅ Event Listeners:
  - Remove listeners in cleanup/unmount
  - Use AbortController for automatic cleanup
  - Prefer event delegation over many listeners

✅ Timers:
  - Clear intervals and timeouts
  - Store timer IDs for cleanup
  - Use AbortController with setTimeout/setInterval polyfills

✅ Closures:
  - Extract only needed data from large objects
  - Avoid capturing large scope unnecessarily
  - Use block scopes to limit lifetime

✅ DOM References:
  - Clear references to removed elements
  - Use WeakMap/WeakSet for DOM-keyed data
  - Avoid storing parent → child references

✅ Caches:
  - Implement size limits (LRU, FIFO)
  - Use WeakMap for object-keyed caches
  - Periodically prune old entries

✅ Global State:
  - Minimize global variables
  - Clean up when no longer needed
  - Use namespacing to avoid accidental globals

✅ Third-Party Libraries:
  - Check for destroy/dispose methods
  - Read docs on cleanup
  - Test for leaks (many libs have memory issues)

✅ React Specific:
  - Return cleanup from useEffect
  - Use useCallback to avoid recreating closures
  - Memoize large objects with useMemo
  - Use React DevTools Profiler to find leaks
*/

// Example: Comprehensive cleanup pattern
class ApplicationView {
  constructor() {
    // Track all cleanup tasks
    this.cleanupTasks = [];

    this.init();
  }

  init() {
    // Setup with cleanup tracking
    this.setupEventListeners();
    this.setupTimers();
    this.setupSubscriptions();
  }

  setupEventListeners() {
    const handleClick = () => console.log('clicked');

    document.addEventListener('click', handleClick);

    // Track cleanup
    this.cleanupTasks.push(() => {
      document.removeEventListener('click', handleClick);
    });
  }

  setupTimers() {
    const intervalId = setInterval(() => {
      this.update();
    }, 1000);

    // Track cleanup
    this.cleanupTasks.push(() => {
      clearInterval(intervalId);
    });
  }

  setupSubscriptions() {
    const unsubscribe = store.subscribe(() => {
      this.render();
    });

    // Track cleanup
    this.cleanupTasks.push(unsubscribe);
  }

  destroy() {
    // Execute all cleanup tasks
    this.cleanupTasks.forEach(cleanup => cleanup());
    this.cleanupTasks = [];

    // Clear object references
    this.data = null;
    this.element = null;
  }
}
```

</details>

<details>
<summary><strong>🐛 Real-World Scenario: E-commerce Memory Leak</strong></summary>

**Scenario:** Your e-commerce site's product listing page becomes progressively slower as users browse. After viewing 50+ products, the page freezes. Memory profiling shows growth from 80MB to 1.2GB. Customers complain about browser tab crashes during checkout.

**The Problem:**

```javascript
// ❌ MULTIPLE MEMORY LEAKS in product viewer
class ProductViewer {
  constructor(productId) {
    this.productId = productId;
    this.images = [];
    this.reviews = [];
    this.relatedProducts = [];

    // LEAK 1: Image preloading without cleanup
    this.preloadImages();

    // LEAK 2: WebSocket never closed
    this.socket = new WebSocket('wss://api.example.com/products');
    this.socket.onmessage = (event) => {
      this.handlePriceUpdate(JSON.parse(event.data));
    };

    // LEAK 3: Infinite scroll loading all reviews
    this.loadReviews();

    // LEAK 4: Animation frame not cancelled
    this.animateCarousel();

    // LEAK 5: Global event listener
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  preloadImages() {
    // Load all product images
    const imageUrls = this.getImageUrls(); // 20 high-res images

    imageUrls.forEach(url => {
      const img = new Image();
      img.src = url; // ❌ Loads all images into memory
      this.images.push(img); // ❌ Never cleared
    });
  }

  async loadReviews() {
    // Load all 5000 reviews at once
    const reviews = await fetch(`/api/products/${this.productId}/reviews`);
    this.reviews = await reviews.json(); // ❌ 50MB of review data
  }

  animateCarousel() {
    const animate = () => {
      this.updateCarousel();
      this.rafId = requestAnimationFrame(animate); // ❌ Never cancelled
    };

    animate();
  }

  handleResize() {
    // Recalculate layout
    this.layout();
  }

  destroy() {
    // ❌ NO CLEANUP!
    // - Images still in memory
    // - WebSocket still open
    // - Animation frame still running
    // - Window resize listener still active
  }
}

// Usage pattern causing leak:
class ProductListingPage {
  constructor() {
    this.currentViewer = null;
  }

  async viewProduct(productId) {
    // ❌ Destroy not called on old viewer!
    this.currentViewer = new ProductViewer(productId);

    // User browses 50 products:
    // - 50 ProductViewer instances in memory
    // - 50 WebSocket connections open
    // - 1000 images loaded (20 * 50)
    // - 50 animation frames running
    // - 250,000 reviews in memory (5000 * 50)
    // Total: ~1.2GB leaked!
  }
}
```

**Production Metrics Before Fix:**

```javascript
const productionMetrics = {
  memory: {
    initial: '80MB',
    after10Products: '280MB',
    after50Products: '1.2GB',
    after100Products: 'Tab crash'
  },
  performance: {
    timeToInteractive: {
      initial: '1.2s',
      after10Products: '2.8s',
      after50Products: '8.5s' // Unacceptable!
    },
    scrollFPS: {
      initial: '60 FPS',
      after50Products: '15 FPS' // Janky!
    }
  },
  userImpact: {
    tabCrashes: '380/week',
    abandonedCarts: '25% (spike from 8%)',
    supportTickets: '120/week ("site is broken")',
    revenueLoss: '$45k/week',
    negativeReviews: '85 new reviews mentioning slowness'
  },
  technicalDebt: {
    openWebSockets: 'Hundreds (server strain)',
    serverCosts: '+40% (handling zombie connections)',
    developerTime: '20 hours/week firefighting'
  }
};
```

**Debugging Process:**

```javascript
// Step 1: Heap snapshot comparison
/*
DevTools → Memory → Take Heap Snapshot

Snapshot 1: After 1 product view (100MB)
Snapshot 2: After 10 product views (300MB)
Snapshot 3: After 50 product views (1.2GB)

Comparison 1→2→3 shows:
- Detached DOM nodes: 450 nodes
- Image objects: 200 instances (400MB!)
- Array (reviews): 50 instances (500MB!)
- WebSocket: 50 instances (50 connections!)
- Closure: 10,000 instances (closure per review)
*/

// Step 2: Allocation Timeline
/*
DevTools → Memory → Allocation Timeline

Shows:
- Huge allocation spikes when loading reviews
- Gradual growth from image loading
- Steady growth from closures
*/

// Step 3: Performance recording
/*
DevTools → Performance → Record

Shows:
- 50 requestAnimationFrame loops running simultaneously!
- Major GC pauses every 10 seconds (200-400ms)
- Long tasks from layout recalculation
*/

// Step 4: Network panel
/*
DevTools → Network → WS (WebSockets)

Shows:
- 50 WebSocket connections all active
- Server sending price updates to all connections
- Wasting bandwidth and server resources
*/

// Step 5: Reproduce in isolation
class MemoryLeakTest {
  async runTest() {
    const detector = new MemoryLeakDetector();

    detector.takeSnapshot('Initial');

    // Simulate user browsing 50 products
    for (let i = 0; i < 50; i++) {
      const viewer = new ProductViewer(i);
      await this.delay(100); // Simulate browsing

      if (i % 10 === 0) {
        detector.takeSnapshot(`After ${i} products`);
      }
    }

    detector.analyze();
    // Result: Clear memory growth pattern
    // 0 products: 80MB
    // 10 products: 280MB (+200MB)
    // 20 products: 480MB (+200MB)
    // Pattern: Linear growth = leak confirmed!
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

**Solution: Comprehensive Cleanup:**

```javascript
// ✅ FIX: All leaks addressed
class ProductViewerFixed {
  constructor(productId) {
    this.productId = productId;
    this.images = [];
    this.reviews = [];
    this.relatedProducts = [];
    this.abortController = new AbortController();
    this.rafId = null;
    this.socket = null;

    this.init();
  }

  async init() {
    // FIX 1: Lazy load images (only visible ones)
    this.lazyLoadImages();

    // FIX 2: WebSocket with cleanup
    this.setupWebSocket();

    // FIX 3: Paginated reviews
    await this.loadReviewsPage(1); // Only first page

    // FIX 4: Cancellable animation
    this.animateCarousel();

    // FIX 5: Cleanup-friendly event listeners
    this.setupEventListeners();
  }

  lazyLoadImages() {
    // Use Intersection Observer for lazy loading
    const imageElements = document.querySelectorAll('[data-product-image]');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src; // Load only when visible
          observer.unobserve(img);
        }
      });
    });

    imageElements.forEach(img => observer.observe(img));

    // Store observer for cleanup
    this.imageObserver = observer;
  }

  setupWebSocket() {
    this.socket = new WebSocket('wss://api.example.com/products');

    const handleMessage = (event) => {
      this.handlePriceUpdate(JSON.parse(event.data));
    };

    this.socket.addEventListener('message', handleMessage, {
      signal: this.abortController.signal
    });
  }

  async loadReviewsPage(page = 1, pageSize = 20) {
    // Load paginated reviews (20 at a time, not 5000!)
    const response = await fetch(
      `/api/products/${this.productId}/reviews?page=${page}&size=${pageSize}`,
      { signal: this.abortController.signal }
    );

    const data = await response.json();

    // Only store current page
    this.reviews = data.reviews; // 20 reviews (~200KB)
    this.currentPage = page;
    this.totalPages = data.totalPages;
  }

  animateCarousel() {
    let isAnimating = true;

    const animate = () => {
      if (!isAnimating) return; // Check flag

      this.updateCarousel();
      this.rafId = requestAnimationFrame(animate);
    };

    animate();

    // Store stop function
    this.stopAnimation = () => {
      isAnimating = false;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    };
  }

  setupEventListeners() {
    // Use AbortController for auto-cleanup
    window.addEventListener('resize', () => this.handleResize(), {
      signal: this.abortController.signal
    });
  }

  handleResize() {
    this.layout();
  }

  destroy() {
    // ✅ COMPREHENSIVE CLEANUP

    // 1. Abort all fetch requests and event listeners
    this.abortController.abort();

    // 2. Close WebSocket
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    // 3. Stop animation
    if (this.stopAnimation) {
      this.stopAnimation();
    }

    // 4. Disconnect observers
    if (this.imageObserver) {
      this.imageObserver.disconnect();
      this.imageObserver = null;
    }

    // 5. Clear data arrays
    this.images = null;
    this.reviews = null;
    this.relatedProducts = null;

    // 6. Clear DOM references
    this.element = null;
  }
}

// ✅ Usage with proper lifecycle
class ProductListingPageFixed {
  constructor() {
    this.currentViewer = null;
  }

  async viewProduct(productId) {
    // ✅ Destroy old viewer before creating new one
    if (this.currentViewer) {
      this.currentViewer.destroy();
      this.currentViewer = null;
    }

    this.currentViewer = new ProductViewerFixed(productId);
  }

  destroy() {
    if (this.currentViewer) {
      this.currentViewer.destroy();
      this.currentViewer = null;
    }
  }
}
```

**Alternative Solution: Resource Pooling:**

```javascript
// ✅ ADVANCED: Reuse viewers instead of destroying
class ProductViewerPool {
  constructor(maxSize = 3) {
    this.pool = [];
    this.maxSize = maxSize;
  }

  acquire(productId) {
    let viewer;

    if (this.pool.length > 0) {
      // Reuse existing viewer
      viewer = this.pool.pop();
      viewer.setProduct(productId);
    } else {
      // Create new viewer
      viewer = new ProductViewerFixed(productId);
    }

    return viewer;
  }

  release(viewer) {
    if (this.pool.length < this.maxSize) {
      // Reset and return to pool
      viewer.reset();
      this.pool.push(viewer);
    } else {
      // Pool full, destroy
      viewer.destroy();
    }
  }

  destroy() {
    this.pool.forEach(viewer => viewer.destroy());
    this.pool = [];
  }
}

// Usage:
const viewerPool = new ProductViewerPool(3);

class ProductListingPagePooled {
  constructor() {
    this.currentViewer = null;
  }

  async viewProduct(productId) {
    // Release old viewer to pool
    if (this.currentViewer) {
      viewerPool.release(this.currentViewer);
    }

    // Acquire viewer from pool
    this.currentViewer = viewerPool.acquire(productId);
  }
}

// Benefits:
// - Max 3 viewers in memory (vs 50+ before)
// - No creation/destruction overhead
// - Predictable memory usage
```

**Production Metrics After Fix:**

```javascript
const metricsAfterFix = {
  memory: {
    initial: '80MB',
    after10Products: '95MB',   // ✅ Stable!
    after50Products: '102MB',  // ✅ Minimal growth
    after100Products: '108MB'  // ✅ No crash!
  },
  performance: {
    timeToInteractive: {
      initial: '1.2s',
      after10Products: '1.3s',  // ✅ Consistent
      after50Products: '1.4s'   // ✅ 83% improvement
    },
    scrollFPS: {
      initial: '60 FPS',
      after50Products: '58 FPS' // ✅ Smooth!
    }
  },
  userImpact: {
    tabCrashes: '5/week',          // ✅ 99% reduction
    abandonedCarts: '8%',          // ✅ Back to normal
    supportTickets: '8/week',      // ✅ 93% reduction
    revenueLoss: '$0',             // ✅ $45k/week recovered
    negativeReviews: '2 (praising performance)'
  },
  technicalDebt: {
    openWebSockets: '1 per user',  // ✅ Proper cleanup
    serverCosts: '-35%',           // ✅ Fewer connections
    developerTime: '1 hour/week'   // ✅ 95% reduction
  },
  businessImpact: {
    conversionRate: '+18%',
    customerSatisfaction: '+85%',
    pageViews: '+22%',
    revenueGain: '$65k/week' // From improved UX + recovered lost revenue
  }
};
```

</details>

<details>
<summary><strong>⚖️ Trade-offs: Memory Management Strategies</strong></summary>

**1. Manual Cleanup vs Automatic (GC):**

```javascript
// Manual cleanup: Explicit destroy calls
class ComponentManual {
  constructor() {
    this.data = loadData();
    this.listener = () => this.update();
    window.addEventListener('resize', this.listener);
  }

  destroy() {
    window.removeEventListener('resize', this.listener);
    this.data = null;
  }
}

// Automatic: WeakMap/WeakSet/AbortController
class ComponentAutomatic {
  constructor() {
    this.abortController = new AbortController();
    this.data = new WeakMap(); // Auto-cleanup

    window.addEventListener('resize', () => this.update(), {
      signal: this.abortController.signal
    });
  }

  destroy() {
    this.abortController.abort(); // Auto-removes listeners
  }
}
```

| Aspect | Manual Cleanup | Automatic |
|--------|---------------|-----------|
| **Control** | ✅ Full control | ⚠️ Less control |
| **Risk** | ❌ Easy to forget | ✅ Hard to forget |
| **Debugging** | ✅ Explicit | ⚠️ Implicit (harder to debug) |
| **Code clarity** | ⚠️ More boilerplate | ✅ Cleaner |
| **Performance** | ✅ Predictable | ⚠️ GC timing unknown |

**2. WeakMap vs Map for Caching:**

```javascript
// Map: Strong references (objects never GC'd)
const cacheMap = new Map();

function cacheDataMap(element, data) {
  cacheMap.set(element, data);
  // element never GC'd (Map keeps it alive)
  // Must manually delete: cacheMap.delete(element)
}

// WeakMap: Weak references (auto-cleanup)
const cacheWeakMap = new WeakMap();

function cacheDataWeakMap(element, data) {
  cacheWeakMap.set(element, data);
  // When element has no other references → auto-removed from WeakMap
}
```

| Aspect | Map | WeakMap |
|--------|-----|---------|
| **Keys** | Any type | Objects only |
| **Size** | .size property | ❌ No size property |
| **Iteration** | ✅ forEach, keys(), values() | ❌ Not iterable |
| **GC** | ❌ Keeps keys alive | ✅ Allows GC |
| **Use case** | Long-lived cache | DOM element data |

**3. Event Delegation vs Individual Listeners:**

```javascript
// Individual listeners (more memory)
class ListIndividual {
  constructor() {
    this.items = document.querySelectorAll('.item');
    this.items.forEach(item => {
      item.addEventListener('click', () => this.handleClick(item));
      // 100 items = 100 event listeners + 100 closures
    });
  }
}

// Event delegation (less memory)
class ListDelegation {
  constructor() {
    this.list = document.querySelector('.list');
    this.list.addEventListener('click', (e) => {
      const item = e.target.closest('.item');
      if (item) this.handleClick(item);
      // 1 event listener for all items
    });
  }
}
```

| Aspect | Individual Listeners | Event Delegation |
|--------|---------------------|------------------|
| **Memory** | ❌ N listeners | ✅ 1 listener |
| **Performance** | ⚠️ Slower (many listeners) | ✅ Faster |
| **Dynamic content** | ❌ Must rebind | ✅ Auto-works |
| **Cleanup** | ❌ Must remove all | ✅ Remove one |
| **Specific events** | ✅ Easy | ⚠️ Need event.target check |

**4. Eager Loading vs Lazy Loading:**

```javascript
// Eager: Load everything upfront
class ProductEager {
  constructor(id) {
    this.images = this.loadAllImages(); // 20 images (40MB)
    this.reviews = this.loadAllReviews(); // 5000 reviews (50MB)
    this.related = this.loadRelated(); // 50 products (10MB)
    // Total: 100MB per product view
  }
}

// Lazy: Load on demand
class ProductLazy {
  constructor(id) {
    this.id = id;
    // Nothing loaded yet (100KB)
  }

  async getImages() {
    if (!this.images) {
      this.images = await this.loadVisibleImages(); // 5 images (10MB)
    }
    return this.images;
  }

  async getReviews(page = 1) {
    return await this.loadReviewsPage(page); // 20 reviews (200KB)
  }
}
```

| Aspect | Eager Loading | Lazy Loading |
|--------|--------------|--------------|
| **Initial load** | ❌ Slow (load all) | ✅ Fast (load minimal) |
| **Memory** | ❌ High upfront | ✅ Low (on-demand) |
| **Latency** | ✅ No wait after load | ⚠️ Wait when accessing |
| **Complexity** | ✅ Simple | ⚠️ More complex |
| **Best for** | Small datasets | Large datasets |

**5. Object Pooling vs Create/Destroy:**

```javascript
// Create/Destroy: New instance each time
class ViewerCreateDestroy {
  viewProduct(id) {
    const viewer = new ProductViewer(id); // Allocate
    // ... use viewer ...
    viewer.destroy(); // Free
    // GC must collect
  }
}

// Object Pool: Reuse instances
class ViewerPool {
  constructor() {
    this.pool = [];
  }

  acquire(id) {
    const viewer = this.pool.pop() || new ProductViewer();
    viewer.setProduct(id);
    return viewer; // Reuse existing
  }

  release(viewer) {
    viewer.reset();
    this.pool.push(viewer); // Return to pool
  }
}
```

| Aspect | Create/Destroy | Object Pool |
|--------|----------------|-------------|
| **Allocation** | ❌ Every use | ✅ Once |
| **GC pressure** | ❌ High | ✅ Low |
| **Memory** | ✅ Only what's needed | ⚠️ Pool size |
| **Complexity** | ✅ Simple | ⚠️ More complex |
| **Best for** | Infrequent creation | Frequent churn |

**6. Pagination vs Infinite Scroll:**

```javascript
// Pagination: Limited items loaded
class PaginatedList {
  loadPage(page) {
    this.items = fetchItems(page, 20); // 20 items
    // Previous page items GC'd
  }
}

// Infinite scroll: All items accumulate
class InfiniteScrollList {
  constructor() {
    this.items = [];
  }

  loadMore() {
    const newItems = fetchItems(this.items.length, 20);
    this.items.push(...newItems); // Accumulates!
    // After 100 loads: 2000 items in memory
  }
}
```

| Aspect | Pagination | Infinite Scroll |
|--------|-----------|----------------|
| **Memory** | ✅ Constant | ❌ Grows indefinitely |
| **UX** | ⚠️ Page loads | ✅ Smooth scrolling |
| **Performance** | ✅ Stable | ⚠️ Degrades over time |
| **SEO** | ✅ Better | ⚠️ Harder |
| **Memory leak risk** | ✅ Low | ❌ High |

**Decision Matrix:**

| Scenario | Best Strategy | Reason |
|----------|--------------|--------|
| **DOM element data** | WeakMap | Auto-cleanup |
| **Many event listeners** | Event delegation | Less memory |
| **Large images** | Lazy loading | On-demand only |
| **Frequently created objects** | Object pooling | Reduce GC pressure |
| **Long lists** | Pagination + virtual scroll | Constant memory |
| **Cache with size limit** | Map + LRU eviction | Controlled growth |
| **Temporary data** | Let GC handle | Simplicity |
| **Critical cleanup** | Manual + automatic | Belt and suspenders |

</details>

<details>
<summary><strong>💬 Explain to Junior: Memory Leaks Simplified</strong></summary>

**Simple Analogy: Library Books**

Think of computer memory like a library:

```javascript
// Library = Memory
// Books = Objects
// Checking out book = Creating object
// Returning book = Object eligible for GC

function borrowBook() {
  let book = { title: "JavaScript Guide" }; // Check out book

  readBook(book);

  // When function ends, book automatically returned (GC'd)
}

// ❌ MEMORY LEAK: Book never returned
let borrowedBooks = [];

function borrowBookAndForget() {
  let book = { title: "JavaScript Guide" };

  borrowedBooks.push(book); // Keep reference

  // Even if you stop using it, it's still "checked out"
  // Library can't lend it to others (memory not freed)
}
```

**Common Memory Leak Causes (Simplified):**

**1. Forgotten Timers:**

```javascript
// ❌ LEAK: Timer running forever
function startClock() {
  let bigData = "Very large data...".repeat(100000);

  setInterval(() => {
    console.log("Tick"); // Uses bigData (keeps it alive)
  }, 1000);

  // Timer never stopped = bigData never freed!
}

// ✅ FIX: Stop timer when done
function startClockFixed() {
  let bigData = "Very large data...".repeat(100000);

  const intervalId = setInterval(() => {
    console.log("Tick");
  }, 1000);

  // Later:
  clearInterval(intervalId); // Stop timer = bigData can be GC'd
}
```

**2. Event Listeners:**

```javascript
// ❌ LEAK: Listener never removed
function setupButton() {
  let bigData = new Array(1000000);

  document.getElementById('button').addEventListener('click', () => {
    console.log(bigData.length);
  });

  // Page changes but listener still there!
  // bigData stuck in memory
}

// ✅ FIX: Remove listener
function setupButtonFixed() {
  let bigData = new Array(1000000);

  const handleClick = () => console.log(bigData.length);

  const button = document.getElementById('button');
  button.addEventListener('click', handleClick);

  // When done:
  button.removeEventListener('click', handleClick);
  // Now bigData can be GC'd
}
```

**3. Closures Holding Too Much:**

```javascript
// ❌ LEAK: Closure keeps entire large object
function processUser() {
  const user = {
    id: 1,
    name: "Alice",
    bigData: new Array(1000000) // Huge!
  };

  // Return function that only needs ID
  return function getUserId() {
    return user.id; // But keeps entire user object!
  };
}

const getId = processUser();
// user.bigData still in memory (not needed!)

// ✅ FIX: Extract only what you need
function processUserFixed() {
  const user = {
    id: 1,
    name: "Alice",
    bigData: new Array(1000000)
  };

  const userId = user.id; // Extract ID only

  return function getUserId() {
    return userId; // Only keeps small ID, not bigData
  };
}

const getIdFixed = processUserFixed();
// user.bigData can be GC'd!
```

**How to Find Memory Leaks:**

```javascript
/*
STEP 1: Notice the problem
- Browser tab gets slow
- Page uses more memory over time
- Eventually crashes

STEP 2: Use Chrome DevTools
1. Open DevTools → Memory tab
2. Take "Heap snapshot" (like taking photo of memory)
3. Do something (click button, navigate, etc.)
4. Take another snapshot
5. Compare snapshots:
   - Growing memory = leak!
   - Find what's growing (detached DOM nodes, arrays, etc.)

STEP 3: Fix the leak
- If event listeners: Remove them
- If timers: Clear them
- If closures: Capture less data
- If DOM nodes: Clear references
*/

// Example: Testing for leaks
function testForLeak() {
  // Take snapshot 1
  console.log('Snapshot 1: Initial');

  // Do something 10 times
  for (let i = 0; i < 10; i++) {
    createSomething();
  }

  // Take snapshot 2
  console.log('Snapshot 2: After 10 iterations');

  // Compare:
  // If Snapshot 2 much bigger = LEAK!
}
```

**Real-World Example:**

```javascript
// Imagine a photo gallery app

// ❌ LEAK VERSION:
class PhotoGalleryLeaky {
  constructor() {
    this.photos = [];

    // Load new photos every second
    setInterval(() => {
      this.loadMorePhotos();
    }, 1000);
  }

  loadMorePhotos() {
    const newPhotos = getPhotos(); // 10 photos, 5MB each

    this.photos.push(...newPhotos); // Keep adding!

    // After 1 minute: 600 photos (3GB!)
    // Browser crashes!
  }
}

// ✅ FIXED VERSION:
class PhotoGalleryFixed {
  constructor() {
    this.photos = [];
    this.maxPhotos = 20; // Limit!

    this.intervalId = setInterval(() => {
      this.loadMorePhotos();
    }, 1000);
  }

  loadMorePhotos() {
    const newPhotos = getPhotos();

    this.photos.push(...newPhotos);

    // Remove old photos if too many
    if (this.photos.length > this.maxPhotos) {
      this.photos = this.photos.slice(-this.maxPhotos); // Keep last 20
    }

    // Memory stays constant: 20 photos (100MB)
  }

  destroy() {
    clearInterval(this.intervalId); // Stop loading!
  }
}
```

**Explaining to PM:**

"Memory leaks are like leaving the faucet running.

**Without memory leaks:**
- You fill a glass, drink it, pour out extra water
- Glass is ready for next use
- Water bill stays normal

**With memory leaks:**
- You fill a glass, drink it, but never pour out extra
- Keep filling more glasses
- Eventually run out of glasses
- Water bill skyrockets
- House floods!

**In apps:**
- Without leaks: Memory used → freed → reused (normal)
- With leaks: Memory used → never freed → browser slows → crashes
- Customer frustrated → lost revenue

**Business impact:**
- Before fix: 15% of users have tab crashes
- After fix: < 0.5% crashes
- Result: More sales, happier customers

**Why it happens:**
- Developers forget to 'turn off the faucet' (clear timers, remove listeners)
- Code gets complex, easy to miss cleanup
- That's why we need automated tests and code reviews

**How we prevent:**
- Code reviews (peer checks)
- Automated tests for memory
- Cleanup checklist for developers
- Monitoring in production (alert if memory grows)"

**Beginner Checklist:**

When creating components/features, always ask:

1. ✅ **Do I have event listeners?**
   - If YES: Remove them in cleanup

2. ✅ **Do I have timers (setInterval/setTimeout)?**
   - If YES: Clear them in cleanup

3. ✅ **Do I store DOM element references?**
   - If YES: Clear them when element removed

4. ✅ **Do I have closures capturing large data?**
   - If YES: Extract only what you need

5. ✅ **Do I have a destroy/cleanup method?**
   - If NO: Create one!

6. ✅ **Is my data structure growing indefinitely?**
   - If YES: Add size limits

</details>

### Follow-up Questions
1. "How do you use Chrome DevTools to find memory leaks?"
2. "What's the difference between WeakMap and Map for memory?"
3. "Can closures cause memory leaks?"
4. "How do you prevent memory leaks in SPAs?"

### Resources
- [Chrome DevTools Memory Profiling](https://developer.chrome.com/docs/devtools/memory-problems/)
- [4 Types of Memory Leaks](https://auth0.com/blog/four-types-of-leaks-in-your-javascript-code-and-how-to-get-rid-of-them/)
- [Finding Memory Leaks in Node.js](https://www.alexkras.com/simple-guide-to-finding-a-javascript-memory-leak-in-node-js/)

---
