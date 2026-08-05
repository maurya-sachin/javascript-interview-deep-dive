# The 'this' Keyword & Binding

> **Focus**: JavaScript fundamentals and advanced concepts

---

## Question 1: How does the 'this' keyword work in JavaScript?

**Difficulty:** 🔴 Hard
**Frequency:** ⭐⭐⭐⭐⭐
**Time:** 10 minutes
**Companies:** Google, Meta, Amazon, Microsoft, Apple

### Question
Explain how `this` works in different contexts. What determines its value?

### Answer

**`this`** refers to the object that is executing the current function. Its value depends on HOW the function is called.

1. **Rules for `this`**
   - Default: global object (or undefined in strict mode)
   - Method call: object before the dot
   - Constructor: new object being created
   - Arrow function: lexical `this` from enclosing scope
   - Explicit: call/apply/bind

2. **Common Pitfalls**
   - Losing `this` when passing methods as callbacks
   - Arrow functions don't have own `this`
   - Event handlers set `this` to element

### Code Example

```javascript
// 1. GLOBAL CONTEXT
console.log(this); // window (browser) or global (Node)

function globalFunc() {
  console.log(this); // window (or undefined in strict mode)
}

// 2. METHOD CALL
const obj = {
  name: "Alice",
  greet() {
    console.log(this.name); // "Alice" (this = obj)
  }
};

obj.greet(); // this = obj

// 3. LOST THIS
const greet = obj.greet;
greet(); // undefined (this = global/undefined)

// 4. CONSTRUCTOR
function Person(name) {
  this.name = name; // this = new object
}

const alice = new Person("Alice");
console.log(alice.name); // "Alice"

// 5. ARROW FUNCTIONS
const obj2 = {
  name: "Bob",
  greet: () => {
    console.log(this.name); // undefined (lexical this from outer scope)
  },
  greetNormal() {
    const inner = () => {
      console.log(this.name); // "Bob" (arrow function inherits this)
    };
    inner();
  }
};

// 6. EXPLICIT BINDING
function greet() {
  console.log(`Hello, ${this.name}!`);
}

const user = { name: "Alice" };

greet.call(user);   // "Hello, Alice!"
greet.apply(user);  // "Hello, Alice!"

const boundGreet = greet.bind(user);
boundGreet();       // "Hello, Alice!"

// 7. EVENT HANDLERS
button.addEventListener('click', function() {
  console.log(this); // button element
});

button.addEventListener('click', () => {
  console.log(this); // lexical this (not button!)
});

// 8. CLASS METHODS
class Component {
  name = "MyComponent";

  regularMethod() {
    console.log(this.name); // Loses 'this' when passed as callback
  }

  arrowMethod = () => {
    console.log(this.name); // Preserves 'this'
  };
}

const comp = new Component();
setTimeout(comp.regularMethod, 100); // undefined
setTimeout(comp.arrowMethod, 100);   // "MyComponent"
```

### Resources

- [MDN: this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)
- [JavaScript.info: Object methods, "this"](https://javascript.info/object-methods)

<details>
<summary><strong>🔍 Deep Dive: How V8 Resolves 'this' at Runtime</strong></summary>

**`this` Resolution Algorithm:**

V8 determines `this` value using these rules (in order of priority):

1. **new binding**: `new` keyword → new object
2. **Explicit binding**: `call`/`apply`/`bind` → specified object
3. **Implicit binding**: Method call → object before dot
4. **Default binding**: Standalone call → global (or undefined in strict mode)
5. **Lexical binding**: Arrow function → outer scope's `this`

```javascript
// Priority demonstration:
function show() {
  console.log(this.value);
}

const obj1 = { value: 1, show };
const obj2 = { value: 2 };

// Explicit > Implicit
obj1.show.call(obj2); // 2 (call wins over method)

// new > Explicit
const BoundShow = show.bind(obj1);
const instance = new BoundShow(); // undefined (new wins, 'this' = new object)
instance.value = 3; // sets value on that specific instance only
new BoundShow(); // undefined (a fresh object again; it doesn't inherit instance's value)
```

**How V8 Compiles `this` References:**

```javascript
// Your code:
const obj = {
  value: 42,
  getValue() {
    return this.value;
  }
};

// V8's TurboFan optimizes to (conceptually):
// 1. Check if 'this' is defined (not undefined/null)
// 2. Create hidden class for object shape
// 3. Map 'value' property to memory offset
// 4. Direct memory access: *(this + offset)

// Cold (first few calls):
// - Lookup 'this' in context
// - Check object shape
// - Find property 'value'
// ~50ns per call

// Hot (after ~10,000 calls):
// - Inline property access
// - Skip shape checks (monomorphic)
// - Direct memory offset: this[offset_0]
// ~5ns per call (10x faster!)
```

**Arrow Functions Don't Create `this` Binding:**

```javascript
// Regular function:
function regularFunc() {
  console.log(this); // Has own 'this' binding
}

// Transpiled arrow function (conceptual):
function arrowFunc() {
  const _this = lexicalThis; // Captured from outer scope at creation time
  return () => {
    console.log(_this); // Uses captured _this, not new binding
  };
}

// Example:
const obj = {
  name: "Object",

  regularMethod: function() {
    // this = obj (dynamic binding)

    setTimeout(function() {
      console.log(this); // window/global (lost context)
    }, 100);
  },

  arrowMethod: function() {
    // this = obj (dynamic binding)

    setTimeout(() => {
      console.log(this); // obj (captured lexical this)
    }, 100);
  }
};

// Under the hood:
// Arrow function stores reference to outer 'this' in [[HomeObject]] internal slot
// Regular function creates new 'this' binding based on call site
```

**Strict Mode Impact on `this`:**

```javascript
// Non-strict mode:
function showThis() {
  console.log(this); // global object (window/global)
}

showThis(); // window

// Strict mode:
"use strict";
function showThisStrict() {
  console.log(this); // undefined
}

showThisStrict(); // undefined

// Why? Security and bug prevention
// In non-strict: this = global is a common source of bugs
// In strict: Forces explicit binding, prevents accidental global pollution

// Performance impact:
// Strict mode: Slightly faster (no global lookup)
// Non-strict: Slower (must resolve global object)
```

**Performance: Different Binding Methods:**

```javascript
// Benchmark: 1 million calls
const iterations = 1000000;
const obj = { value: 42 };

function getValue() {
  return this.value;
}

// Test 1: Method call (implicit binding)
console.time('implicit');
obj.getValue = getValue;
for (let i = 0; i < iterations; i++) {
  obj.getValue();
}
console.timeEnd('implicit'); // ~8ms (fastest)

// Test 2: call()
console.time('call');
for (let i = 0; i < iterations; i++) {
  getValue.call(obj);
}
console.timeEnd('call'); // ~12ms (~50% slower)

// Test 3: apply()
console.time('apply');
for (let i = 0; i < iterations; i++) {
  getValue.apply(obj);
}
console.timeEnd('apply'); // ~13ms (~60% slower)

// Test 4: bind() - created once
console.time('bind-reuse');
const boundGetValue = getValue.bind(obj);
for (let i = 0; i < iterations; i++) {
  boundGetValue();
}
console.timeEnd('bind-reuse'); // ~9ms (nearly as fast as implicit)

// Test 5: bind() - created every call (anti-pattern!)
console.time('bind-recreate');
for (let i = 0; i < iterations; i++) {
  getValue.bind(obj)();
}
console.timeEnd('bind-recreate'); // ~180ms (20x slower! Huge overhead)

// Ranking (fastest to slowest):
// 1. Implicit binding (method call): 8ms
// 2. Bound function (reused): 9ms
// 3. call(): 12ms
// 4. apply(): 13ms
// 5. bind() per call: 180ms ❌ Never do this!
```

**Memory Implications:**

```javascript
// Regular methods: Shared across all instances
class UserRegular {
  constructor(name) {
    this.name = name;
  }

  greet() {
    console.log(this.name);
  }
}

// Arrow in class field: Separate function per instance
class UserArrow {
  constructor(name) {
    this.name = name;
  }

  greet = () => {
    console.log(this.name);
  };
}

// Memory comparison (1,000 instances):
// UserRegular:
//   - 1,000 objects with 'name' property
//   - 1 shared 'greet' function on prototype
//   - Total: ~40KB (40 bytes per object)
//
// UserArrow:
//   - 1,000 objects with 'name' property
//   - 1,000 separate 'greet' functions
//   - Total: ~120KB (120 bytes per object)
//
// Arrow functions: 3x more memory!
// Trade-off: Memory vs convenience (no binding needed)
```

**V8 Inline Caching for `this` Access:**

```javascript
// Monomorphic (same object shape):
function process(obj) {
  return obj.value * 2; // V8 optimizes: direct offset access
}

const obj1 = { value: 10 };
const obj2 = { value: 20 };

for (let i = 0; i < 10000; i++) {
  process(obj1); // Always same shape
  process(obj2); // Same shape
}
// Result: Monomorphic inline cache (fastest)

// Polymorphic (multiple shapes):
const obj3 = { value: 30, extra: true }; // Different shape!

for (let i = 0; i < 10000; i++) {
  process(obj1);
  process(obj2);
  process(obj3); // Different shape breaks inline cache
}
// Result: Polymorphic (slower - must check multiple shapes)

// Megamorphic (too many shapes):
for (let i = 0; i < 10000; i++) {
  process({ value: i }); // New shape every call!
}
// Result: Megamorphic (slowest - gives up on caching)

// Performance impact:
// Monomorphic: 100% (baseline)
// Polymorphic: 70% (30% slower)
// Megamorphic: 30% (70% slower!)
```

**The `this` Context in Event Loop:**

```javascript
// How 'this' works across async boundaries:

const obj = {
  value: 42,

  syncMethod() {
    console.log(this.value); // 42 (called as obj.syncMethod())
  },

  asyncMethod() {
    setTimeout(function() {
      console.log(this.value); // undefined (callback loses context)
    }, 0);
  },

  asyncArrow() {
    setTimeout(() => {
      console.log(this.value); // 42 (arrow captures lexical this)
    }, 0);
  }
};

// Call stack vs Task queue:
// 1. obj.asyncMethod() called → 'this' = obj
// 2. setTimeout queues callback in task queue
// 3. Call stack empties
// 4. Callback executed as standalone function → 'this' = global/undefined
//
// Arrow function: Captures 'this' at creation time (step 1)
// Regular function: Gets new 'this' at call time (step 4)
```

**Hidden Classes and Property Access:**

```javascript
// V8 creates hidden classes for object shapes
class Point {
  constructor(x, y) {
    this.x = x; // Hidden class C0 → C1 (adds x)
    this.y = y; // Hidden class C1 → C2 (adds y)
  }

  distance() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }
}

// All Point instances share hidden class C2
// Property access this.x → offset 0
// Property access this.y → offset 8 (64-bit)
// Direct memory access: *(this + 0), *(this + 8)

// Adding properties dynamically breaks optimization:
const p1 = new Point(3, 4);
p1.z = 5; // New hidden class C3 (only for p1)

// Now p1 has different shape than other Points
// V8 can't use inline cache → slower property access
```

</details>

<details>
<summary><strong>🐛 Real-World Scenario: React Event Handler Lost Context Bug</strong></summary>

**Scenario:** Your React dashboard crashes in production with "Cannot read property 'setState' of undefined" when users click buttons. The error only happens in certain components. Investigation reveals `this` binding issues in event handlers.

**The Problem:**

```javascript
// ❌ BUG: Event handler loses 'this' context
class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      loading: false,
      filter: 'all'
    };
  }

  // Regular method (NOT bound)
  handleFilterChange(newFilter) {
    // When called from event handler, 'this' = undefined!
    this.setState({ filter: newFilter }); // ❌ TypeError: Cannot read property 'setState' of undefined
  }

  render() {
    return (
      <div>
        <button onClick={this.handleFilterChange}>All</button>
        {/* When clicked, 'this' is lost in handleFilterChange */}
      </div>
    );
  }
}

// Production scenario:
// - Users click filter buttons → app crashes
// - White screen of death
// - Error logged to Sentry: "Cannot read property 'setState' of undefined"
// - Frequency: 850 errors/day across 15,000 daily users (~5.7%)
// - User complaints: "Dashboard broken, can't filter data"
```

**Why It Happens:**

```javascript
// Understanding the context loss:

class Dashboard extends React.Component {
  handleFilterChange(newFilter) {
    console.log(this); // What is 'this'?
  }

  render() {
    // When you write:
    <button onClick={this.handleFilterChange}>

    // It's equivalent to:
    const handler = this.handleFilterChange; // Extract method reference
    button.addEventListener('click', handler); // Pass as callback

    // When button clicked:
    handler('all'); // Called as standalone function, not method!
    // this = undefined (in strict mode, which React uses)
  }
}

// Step-by-step execution:
// 1. React renders: <button onClick={this.handleFilterChange}>
// 2. React extracts method reference: const fn = this.handleFilterChange
// 3. User clicks button
// 4. React calls: fn('all')  // NOT dashboard.fn('all')!
// 5. Inside handleFilterChange, 'this' = undefined (no object before dot)
// 6. this.setState → undefined.setState → TypeError!
```

**Debugging Process:**

```javascript
// Step 1: Add logging to identify the issue
class Dashboard extends React.Component {
  handleFilterChange(newFilter) {
    console.log('this:', this); // undefined
    console.log('typeof this:', typeof this); // 'undefined'

    // Temporarily add guard to prevent crash
    if (!this) {
      console.error('Lost this context!');
      return;
    }

    this.setState({ filter: newFilter });
  }
}

// Step 2: Check React DevTools
// - Component renders successfully
// - State exists in component
// - But 'this' is undefined in event handler

// Step 3: Reproduce locally
// - Add breakpoint in handleFilterChange
// - Click button
// - Inspect 'this' → undefined
// - Stack trace shows React synthetic event system called function standalone
```

**Solution 1: Bind in Constructor (Traditional):**

```javascript
// ✅ FIX: Explicitly bind in constructor
class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = { filter: 'all' };

    // Bind method to component instance
    this.handleFilterChange = this.handleFilterChange.bind(this);
    // Creates new function with 'this' permanently bound to component
  }

  handleFilterChange(newFilter) {
    this.setState({ filter: newFilter }); // ✅ 'this' = component instance
  }

  render() {
    return <button onClick={this.handleFilterChange}>All</button>;
    // Now handleFilterChange has 'this' bound, works correctly
  }
}

// Pros:
// - Works in all React versions
// - Performance: bind() called once (in constructor)
// - Memory: One bound function per component instance

// Cons:
// - Boilerplate (must remember to bind every method)
// - Easy to forget → bugs
```

**Solution 2: Arrow Function in Class Field (Modern, Recommended):**

```javascript
// ✅ BEST: Arrow function class field (auto-binds)
class Dashboard extends React.Component {
  state = {
    data: [],
    loading: false,
    filter: 'all'
  };

  // Arrow function captures lexical 'this' (component instance)
  handleFilterChange = (newFilter) => {
    this.setState({ filter: newFilter }); // ✅ Always works!
  };

  render() {
    return <button onClick={this.handleFilterChange}>All</button>;
  }
}

// How it works:
// - Arrow function defined as class field (not prototype method)
// - Created during component construction
// - Captures 'this' from constructor context
// - 'this' always = component instance, no matter how it's called

// Pros:
// - No manual binding needed
// - Clean syntax
// - Can't forget to bind

// Cons:
// - Separate function per instance (memory overhead)
// - Not on prototype (can't be inherited/overridden easily)
```

**Solution 3: Arrow Function in Render (Anti-Pattern):**

```javascript
// ❌ BAD: Arrow function in render (creates new function every render!)
class Dashboard extends React.Component {
  handleFilterChange(newFilter) {
    this.setState({ filter: newFilter });
  }

  render() {
    return (
      <button onClick={() => this.handleFilterChange('all')}>
        All
      </button>
    );
  }
}

// Problems:
// 1. New function created on EVERY render
// 2. If passed to child component, child re-renders unnecessarily
// 3. Performance: Extra allocations, GC pressure
// 4. Memory: Old functions must be garbage collected

// Example performance impact:
// - Dashboard renders 50 times/second during data updates
// - 50 new functions/second created
// - Over 1 minute: 3,000 function allocations
// - Unnecessary child component re-renders

// When it's OK:
// - Simple callbacks not passed to children
// - Non-performance-critical code
// - Prototyping/debugging
```

**Solution 4: Bind in JSX (Also Anti-Pattern):**

```javascript
// ❌ BAD: Bind in render
class Dashboard extends React.Component {
  handleFilterChange(newFilter) {
    this.setState({ filter: newFilter });
  }

  render() {
    return (
      <button onClick={this.handleFilterChange.bind(this)}>
        All
      </button>
    );
  }
}

// Problem: bind() creates new function every render
// Same issues as arrow function in render
```

**Real Production Metrics:**

```javascript
// Before fix (no binding):
// - Crashes: 850/day (5.7% of users)
// - Error rate: 12% of dashboard interactions
// - Support tickets: 45/week
// - User churn: +8% (users abandon after crashes)
// - Revenue impact: ~$15k/month lost (frustrated users leave)
// - Developer time: 12 hours/week debugging "Cannot read property 'setState'" errors

// After fix (arrow function class fields):
// - Crashes: 0/day ✅
// - Error rate: 0%
// - Support tickets: 2/week (95% reduction, unrelated issues)
// - User churn: Back to baseline
// - Revenue recovered: $15k/month
// - Developer time saved: 11 hours/week
// - Customer satisfaction: +92%
// - Code reliability: +100%

// Additional benefits:
// - Easier onboarding (juniors don't need to remember binding)
// - Less code review time (no "forgot to bind" comments)
// - Fewer regressions (binding is automatic)
```

**Complex Real-World Example: Multiple Event Handlers:**

```javascript
// Production-ready dashboard with proper binding
class Dashboard extends React.Component {
  state = {
    data: [],
    loading: false,
    filter: 'all',
    sortBy: 'date',
    page: 1
  };

  // ✅ All handlers use arrow functions (auto-bound)
  handleFilterChange = (newFilter) => {
    this.setState({ filter: newFilter, page: 1 }); // Reset page when filtering
  };

  handleSortChange = (sortBy) => {
    this.setState({ sortBy });
  };

  handlePageChange = (newPage) => {
    this.setState({ page: newPage });
  };

  handleRefresh = async () => {
    this.setState({ loading: true });

    try {
      const data = await this.fetchData();
      this.setState({ data, loading: false });
    } catch (error) {
      console.error('Fetch failed:', error);
      this.setState({ loading: false });
    }
  };

  fetchData = async () => {
    const { filter, sortBy, page } = this.state;

    const response = await fetch(`/api/data?filter=${filter}&sort=${sortBy}&page=${page}`);
    return response.json();
  };

  render() {
    const { data, loading, filter } = this.state;

    return (
      <div>
        {/* All event handlers work correctly - no manual binding needed! */}
        <button onClick={this.handleFilterChange.bind(null, 'all')}>All</button>
        <button onClick={this.handleFilterChange.bind(null, 'active')}>Active</button>
        <button onClick={this.handleSortChange.bind(null, 'date')}>Sort by Date</button>
        <button onClick={this.handleRefresh}>Refresh</button>

        {loading && <Spinner />}

        <DataTable
          data={data}
          onPageChange={this.handlePageChange}
          // Passing to child - no re-render issues since function is stable
        />
      </div>
    );
  }
}

// Note: Using .bind(null, arg) for partial application is OK here
// because handleFilterChange is already bound to component via arrow function
// We're just pre-filling the 'newFilter' argument
```

**TypeScript Version (Type Safety):**

```typescript
import React, { Component } from 'react';

interface DashboardState {
  data: any[];
  loading: boolean;
  filter: 'all' | 'active' | 'completed';
}

class Dashboard extends Component<{}, DashboardState> {
  state: DashboardState = {
    data: [],
    loading: false,
    filter: 'all'
  };

  // Arrow function with proper typing
  handleFilterChange = (newFilter: DashboardState['filter']): void => {
    this.setState({ filter: newFilter });
    // TypeScript ensures 'newFilter' is valid filter value
  };

  render() {
    return (
      <button onClick={() => this.handleFilterChange('all')}>
        All
      </button>
    );
  }
}
```

**Alternative: Functional Component with Hooks (Modern React):**

```javascript
// ✅ MODERN: Functional component (no 'this' issues!)
import { useState, useCallback } from 'react';

function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  // useCallback memoizes function (stable reference)
  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter);
  }, []); // Empty deps = function never changes

  return (
    <div>
      <button onClick={() => handleFilterChange('all')}>All</button>
      {/* No 'this' binding needed - closures handle it naturally */}
    </div>
  );
}

// Benefits of hooks:
// - No 'this' keyword at all
// - No binding issues
// - Simpler mental model
// - Less boilerplate
// - Better tree-shaking
```

</details>

<details>
<summary><strong>⚖️ Trade-offs: Different 'this' Binding Approaches</strong></summary>

### 1. Regular Method vs Arrow Function in Class

```javascript
// Pattern 1: Regular method on prototype
class UserRegular {
  constructor(name) {
    this.name = name;
  }

  greet() {
    console.log(this.name);
  }
}

// Pattern 2: Arrow function as class field
class UserArrow {
  constructor(name) {
    this.name = name;
  }

  greet = () => {
    console.log(this.name);
  };
}
```

| Aspect | Regular Method | Arrow Function Field |
|--------|---------------|---------------------|
| **Memory** | ✅ Shared on prototype | ❌ Per instance (3x more) |
| **Performance** | ✅ Faster instantiation | ⚠️ Slower (creates function) |
| **Auto-binding** | ❌ No (manual bind needed) | ✅ Yes (automatic) |
| **Inheritance** | ✅ Can override in subclass | ⚠️ Harder to override |
| **Testing** | ✅ Easy to spy on prototype | ⚠️ Must spy on instance |
| **React use case** | ❌ Need to bind | ✅ Perfect for event handlers |
| **Best for** | Many instances | React components, callbacks |

**Memory Impact Example:**

```javascript
// Test: Create 10,000 instances
console.time('Regular method');
const regularUsers = Array.from({ length: 10000 }, (_, i) => new UserRegular(`User${i}`));
console.timeEnd('Regular method'); // ~15ms

console.time('Arrow function');
const arrowUsers = Array.from({ length: 10000 }, (_, i) => new UserArrow(`User${i}`));
console.timeEnd('Arrow function'); // ~45ms (3x slower)

// Memory (Chrome DevTools):
// Regular: 400KB (40 bytes/instance + 1 shared function)
// Arrow: 1.2MB (120 bytes/instance, each has own function)
```

### 2. Binding Strategies Comparison

```javascript
class Component {
  constructor() {
    // Strategy 1: Bind in constructor
    this.method1 = this.method1.bind(this);
  }

  method1() { console.log(this); }

  // Strategy 2: Arrow function field
  method2 = () => { console.log(this); };

  // Strategy 3: Regular method (manual binding needed)
  method3() { console.log(this); }
}

const c = new Component();

// Usage:
setTimeout(c.method1, 100); // ✅ Works (bound in constructor)
setTimeout(c.method2, 100); // ✅ Works (arrow auto-binds)
setTimeout(c.method3, 100); // ❌ Fails (not bound)
```

| Strategy | Instantiation | Memory/Instance | When to Use |
|----------|--------------|----------------|-------------|
| **Bind in constructor** | Slower (manual binding) | Medium | Legacy code, compatibility |
| **Arrow function field** | Slower (creates function) | High | Modern React, convenience |
| **Regular method + bind at call site** | Fast | Low | Rare, specific cases |
| **Regular method (no binding)** | Fastest | Lowest | Non-callback methods |

### 3. Arrow Functions in Different Contexts

```javascript
// Context 1: Object literal
const obj1 = {
  value: 42,
  getValue: () => {
    return this.value; // ❌ 'this' = global, not obj1!
  }
};

obj1.getValue(); // undefined (arrow doesn't bind to obj1)

// Context 2: Class field
class Obj2 {
  value = 42;

  getValue = () => {
    return this.value; // ✅ 'this' = instance
  };
}

const obj2 = new Obj2();
obj2.getValue(); // 42 (arrow binds to instance)
```

| Context | Arrow Function Behavior | Recommended? |
|---------|------------------------|--------------|
| **Object literal** | ❌ Binds to outer scope (not object) | ❌ Use regular function |
| **Class field** | ✅ Binds to instance | ✅ Good for callbacks |
| **Event handler** | ✅ Preserves outer context | ✅ Perfect for this |
| **Callback** | ✅ No binding needed | ✅ Ideal use case |

### 4. Performance: Explicit Binding Methods

```javascript
const obj = { value: 42 };

function getValue() {
  return this.value;
}

// Benchmark results (1 million calls):
// 1. Method call: obj.getValue()         →  8ms (fastest)
// 2. Bound function (reused): bound()    →  9ms
// 3. call(): getValue.call(obj)          → 12ms
// 4. apply(): getValue.apply(obj)        → 13ms
// 5. bind() per call: getValue.bind(obj)()  → 180ms (20x slower!)
```

| Method | Speed | Memory | Use Case |
|--------|-------|--------|----------|
| **Method call** | ✅ Fastest | ✅ No overhead | Default choice |
| **Bound function (reused)** | ✅ Nearly as fast | ⚠️ Small overhead | React event handlers |
| **call()** | ⚠️ 50% slower | ✅ No allocation | Borrowing methods |
| **apply()** | ⚠️ 60% slower | ✅ No allocation | Array-like args |
| **bind() per call** | ❌ 20x slower | ❌ New function each time | ❌ Never do this! |

### 5. React-Specific Trade-offs

```javascript
// Pattern 1: Bind in constructor
class Component1 extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() { /* ... */ }

  render() {
    return <button onClick={this.handleClick}>Click</button>;
  }
}

// Pattern 2: Arrow function field
class Component2 extends React.Component {
  handleClick = () => { /* ... */ };

  render() {
    return <button onClick={this.handleClick}>Click</button>;
  }
}

// Pattern 3: Arrow in render (anti-pattern!)
class Component3 extends React.Component {
  handleClick() { /* ... */ }

  render() {
    return <button onClick={() => this.handleClick()}>Click</button>;
    // New function every render!
  }
}
```

| Pattern | Pros | Cons | Verdict |
|---------|------|------|---------|
| **Bind in constructor** | Standard, works everywhere | Boilerplate, easy to forget | ⚠️ OK for legacy |
| **Arrow function field** | Clean, auto-binds, modern | Memory overhead | ✅ Best for React |
| **Arrow in render** | Quick to write | Performance issues, re-renders | ❌ Avoid |

### 6. Functional Component (Hooks) vs Class Component

```javascript
// Class component (must handle 'this')
class ClassComponent extends React.Component {
  state = { count: 0 };

  increment = () => {
    this.setState({ count: this.state.count + 1 });
  };

  render() {
    return <button onClick={this.increment}>{this.state.count}</button>;
  }
}

// Functional component (no 'this' at all!)
function FunctionalComponent() {
  const [count, setCount] = useState(0);

  const increment = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  return <button onClick={increment}>{count}</button>;
}
```

| Aspect | Class Component | Functional Component |
|--------|----------------|---------------------|
| **'this' issues** | ❌ Must handle binding | ✅ No 'this' keyword |
| **Boilerplate** | ⚠️ More code | ✅ Less code |
| **Learning curve** | ⚠️ Steeper ('this' complexity) | ✅ Easier (closures) |
| **Bundle size** | ⚠️ Larger | ✅ Smaller |
| **Current best practice** | ❌ Legacy approach | ✅ Modern standard |
| **When to use** | Maintaining old code | New components |

### Decision Matrix

| Use Case | Best Approach | Reason |
|----------|--------------|--------|
| **React event handlers** | Arrow function field | Auto-binds, clean |
| **Many instances (1000+)** | Regular method + bind | Memory efficient |
| **Object literals** | Regular function | Arrow doesn't bind to object |
| **One-off callbacks** | Arrow in render | OK if not passed to children |
| **High-performance loops** | Method call | Fastest execution |
| **New React code** | Functional components | No 'this' issues |
| **Library public API** | Regular methods | Allow users to override |

### Real-World Recommendation

```javascript
// ✅ RECOMMENDED: Modern React
// Use functional components (no 'this' at all)
function MyComponent() {
  const [state, setState] = useState();

  const handleClick = useCallback(() => {
    setState(newValue);
  }, []);

  return <button onClick={handleClick}>Click</button>;
}

// If you MUST use class components:
class MyComponent extends React.Component {
  // ✅ Use arrow functions for event handlers
  handleClick = () => {
    this.setState({ /* ... */ });
  };

  // ✅ Use regular methods for non-callback methods
  calculateSomething() {
    return this.state.value * 2;
  }

  render() {
    // Called as method, 'this' is bound correctly
    const result = this.calculateSomething();

    // Arrow function passed as callback, 'this' preserved
    return <button onClick={this.handleClick}>{result}</button>;
  }
}
```

</details>

<details>
<summary><strong>💬 Explain to Junior: Understanding 'this' Simply</strong></summary>

**Simple Analogy: 'this' is Like a Name Tag**

Think of `this` as a **name tag that changes** depending on **who's wearing the uniform**.

```javascript
const restaurant = {
  name: "Joe's Diner",

  greet() {
    console.log(`Welcome to ${this.name}!`);
    // 'this' = whoever is wearing the "restaurant" uniform
  }
};

restaurant.greet(); // "Welcome to Joe's Diner!"
// restaurant is wearing the uniform, so this.name = restaurant.name

// Now take off the uniform:
const greet = restaurant.greet;
greet(); // "Welcome to undefined!"
// Nobody is wearing the uniform, so this = nobody (undefined)
```

**The Golden Rule: Look LEFT of the Dot**

```javascript
const dog = {
  name: "Buddy",
  speak() {
    console.log(this.name);
  }
};

// Question: What is 'this' inside speak()?
// Answer: Look at who's calling it!

dog.speak();
// ↑ 'dog' is LEFT of the dot
// So 'this' = dog

const speak = dog.speak;
speak();
// ↑ No dot! Nobody on the left
// So 'this' = undefined (or window in non-strict mode)
```

**Why Callbacks Lose 'this':**

```javascript
const user = {
  name: "Alice",
  greet() {
    console.log(`Hello, ${this.name}!`);
  }
};

// Works:
user.greet(); // "Hello, Alice!" ✅
// this = user (user is left of dot)

// Doesn't work:
setTimeout(user.greet, 1000); // "Hello, undefined!" ❌

// Why? Let's break it down:
// setTimeout extracts the function:
const extractedFunction = user.greet;

// Then calls it later:
extractedFunction(); // No dot! No object on left! this = undefined
```

**The Fix: Arrow Functions Remember Context**

```javascript
const user = {
  name: "Alice",

  // Regular function - 'this' changes based on caller
  regularGreet: function() {
    console.log(this.name);
  },

  // Arrow function - 'this' frozen at creation time
  arrowGreet: () => {
    console.log(this.name); // 'this' = whatever it was when arrow was created
  }
};

// Arrow function analogy:
// Regular function = Chameleon (changes color/this based on environment)
// Arrow function = Photo (captures moment in time, never changes)
```

**Common Beginner Mistakes:**

```javascript
// ❌ MISTAKE 1: Arrow function in object literal
const person = {
  name: "Bob",
  greet: () => {
    console.log(this.name); // ❌ undefined
    // Arrow captures outer 'this', not person!
  }
};

person.greet(); // undefined (not "Bob")

// ✅ FIX: Use regular function
const person = {
  name: "Bob",
  greet() {
    console.log(this.name); // ✅ "Bob"
  }
};


// ❌ MISTAKE 2: Passing method as callback without binding
class Counter {
  count = 0;

  increment() {
    this.count++; // Will crash if 'this' is undefined
  }
}

const counter = new Counter();
button.addEventListener('click', counter.increment); // ❌ 'this' will be undefined

// ✅ FIX 1: Bind it
button.addEventListener('click', counter.increment.bind(counter));

// ✅ FIX 2: Use arrow function
class Counter {
  count = 0;

  increment = () => {
    this.count++; // Always works!
  };
}
```

**Visual Explanation:**

```javascript
// Think of 'this' like a GPS tracker

// Method call: GPS attached to object
const obj = {
  value: 42,
  getValue() {
    return this.value; // GPS points to obj
  }
};

obj.getValue(); // GPS tracker on obj → finds value ✅

// Standalone call: GPS lost signal!
const getValue = obj.getValue;
getValue(); // GPS has no object → returns undefined ❌

// Arrow function: GPS permanently locked to location
const obj2 = {
  value: 42,
  getValue: () => {
    return this.value; // GPS locked to OUTER scope (not obj2!)
  }
};
```

**Explaining to PM (Non-Technical):**

"Imagine a company badge:

**Regular functions** (chameleon badge):
- The badge changes based on WHO is wearing it
- If Alice wears it, it says 'Alice'
- If Bob wears it, it says 'Bob'
- If nobody wears it, it's blank
- This is like 'this' in regular functions - depends on who calls it

**Arrow functions** (photo badge):
- The badge is a photo taken at one moment
- No matter WHO wears it, the photo never changes
- Photo shows whoever was there when it was taken
- This is like arrow functions - 'this' is captured and never changes

**The Problem:**
When you pass a regular function badge to someone else, they're not wearing it - it's blank!

**The Solution:**
- Use arrow function badge (photo never changes)
- OR attach the badge permanently to one person (bind)

**Business Value:**
- Prevents bugs where functions can't find their data
- Example: Button click handlers in forms - without proper 'this', form submissions fail
- Costs: Every time this causes a bug = 30-60 minutes debugging time
- Modern approach (arrow functions) eliminates 90% of these bugs"

**Practice Exercise:**

```javascript
// Challenge: What does each log?

const quiz = {
  answer: 42,

  test1: function() {
    console.log(this.answer); // ?
  },

  test2: () => {
    console.log(this.answer); // ?
  },

  test3: function() {
    setTimeout(function() {
      console.log(this.answer); // ?
    }, 100);
  },

  test4: function() {
    setTimeout(() => {
      console.log(this.answer); // ?
    }, 100);
  }
};

quiz.test1();  // ?
quiz.test2();  // ?
quiz.test3();  // ?
quiz.test4();  // ?

// Scroll down for answers...
//
//
//
// Answers:
quiz.test1();  // 42 (regular method, this = quiz)
quiz.test2();  // undefined (arrow in object literal, this = global)
quiz.test3();  // undefined (setTimeout callback loses context)
quiz.test4();  // 42 (arrow captures 'this' from outer function)
```

**Key Takeaways for Juniors:**

1. **'this' = who called the function** (look left of the dot)
2. **Regular function**: 'this' changes based on caller
3. **Arrow function**: 'this' locked to outer scope
4. **Callbacks lose context**: Extract function = lose 'this'
5. **Fix with arrow functions** or **bind()**
6. **In objects**: Use regular functions (not arrows)
7. **In classes**: Use arrow functions for event handlers
8. **Modern React**: Avoid 'this' entirely (use hooks)

**When to Ask for Help:**

- "I get 'Cannot read property X of undefined'" → likely 'this' issue
- "My method works when called directly but fails in setTimeout" → lost context
- "Arrow function doesn't have the right 'this'" → check where it's defined

</details>

---

## Question 2: Explain Implicit, Explicit, and Default Binding

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐⭐
**Time:** 10-12 minutes
**Companies:** Google, Meta, Amazon, Uber

### Question
Explain the different types of `this` binding in JavaScript with examples of each.

### Answer

### **1. Default Binding**

Applied when no other rule matches. `this` refers to global object (or `undefined` in strict mode).

```javascript
function defaultBinding() {
  console.log(this === window); // true (browser, non-strict)
}

defaultBinding();

// Strict mode
"use strict";
function strictDefault() {
  console.log(this); // undefined
}

strictDefault();

/*
DEFAULT BINDING RULES:
- Standalone function call
- No object context
- Non-strict: this → global
- Strict: this → undefined
*/
```

### **2. Implicit Binding**

When function is called as a method of an object. `this` → that object.

```javascript
const calculator = {
  value: 0,

  add(num) {
    this.value += num;
    return this;
  },

  subtract(num) {
    this.value -= num;
    return this;
  },

  getValue() {
    return this.value;
  }
};

calculator.add(10).subtract(3);
console.log(calculator.getValue()); // 7

/*
IMPLICIT BINDING:
- Method called on object: obj.method()
- this → obj (object before dot)
- Can be chained (return this pattern)
*/
```

**Losing Implicit Binding:**

```javascript
const obj = {
  name: "Object",
  greet() {
    console.log(`Hello from ${this.name}`);
  }
};

// Case 1: Method reference
obj.greet(); // "Hello from Object" ✅

const greet = obj.greet;
greet(); // "Hello from undefined" ❌ (lost context)

// Case 2: Callback
setTimeout(obj.greet, 100); // "Hello from undefined" ❌

// Case 3: Passing to function
function execute(fn) {
  fn();
}
execute(obj.greet); // "Hello from undefined" ❌

/*
IMPLICIT BINDING LOST WHEN:
- Method assigned to variable
- Passed as callback
- Passed to another function

Solution: Use .bind() or arrow function wrapper
*/
```

### **3. Explicit Binding**

Manually specify `this` using `call()`, `apply()`, or `bind()`.

#### **call()** - Arguments passed individually

```javascript
function introduce(age, city) {
  console.log(`I'm ${this.name}, ${age}, from ${city}`);
}

const person1 = { name: "Alice" };
const person2 = { name: "Bob" };

introduce.call(person1, 25, "NYC");
// I'm Alice, 25, from NYC

introduce.call(person2, 30, "LA");
// I'm Bob, 30, from LA

/*
CALL SYNTAX:
func.call(thisArg, arg1, arg2, ...)
- First argument: thisArg (what this should be)
- Rest arguments: function arguments
*/
```

#### **apply()** - Arguments passed as array

```javascript
function sum() {
  return Array.from(arguments).reduce((a, b) => a + b, 0);
}

const context = { multiplier: 2 };

const args = [1, 2, 3, 4, 5];

const result = sum.apply(context, args);
console.log(result); // 15

// Modern alternative with spread
const result2 = sum.call(context, ...args);
console.log(result2); // 15

/*
APPLY SYNTAX:
func.apply(thisArg, [argsArray])
- First argument: thisArg
- Second argument: array of arguments

USE CASE: When you have arguments as array
*/
```

**Practical Example: Array-like to Array**

```javascript
function convertToArray() {
  // arguments is array-like, not real array
  return Array.prototype.slice.call(arguments);
}

const arr = convertToArray(1, 2, 3, 4);
console.log(Array.isArray(arr)); // true

// Modern way:
const arr2 = Array.from(arguments);
const arr3 = [...arguments];
```

#### **bind()** - Returns new function with fixed `this`

```javascript
const person = {
  firstName: "John",
  lastName: "Doe",

  getFullName() {
    return `${this.firstName} ${this.lastName}`;
  }
};

// Lose context
const getFullName = person.getFullName;
console.log(getFullName()); // "undefined undefined"

// Fix with bind
const boundGetFullName = person.getFullName.bind(person);
console.log(boundGetFullName()); // "John Doe"

// Use in callbacks
setTimeout(person.getFullName.bind(person), 100);
// "John Doe" ✅

/*
BIND SYNTAX:
const newFunc = func.bind(thisArg, arg1, arg2, ...)

KEY DIFFERENCES from call/apply:
- Returns new function (doesn't invoke immediately)
- Can preset arguments (partial application)
- Permanent binding (can't be changed)
*/
```

**Partial Application with bind:**

```javascript
function multiply(a, b) {
  return a * b;
}

const double = multiply.bind(null, 2);
const triple = multiply.bind(null, 3);

console.log(double(5));  // 10
console.log(triple(5));  // 15

/*
PARTIAL APPLICATION:
- Preset some arguments
- Returns function expecting remaining args
- null used when this doesn't matter
*/
```

### **4. Hard Binding Pattern**

```javascript
function hardBind(fn, obj) {
  return function(...args) {
    return fn.apply(obj, args);
  };
}

const obj = { value: 42 };

function getValue() {
  return this.value;
}

const bound = hardBind(getValue, obj);

// Cannot lose binding
console.log(bound()); // 42
console.log(bound.call(window)); // 42 (still bound!)

// This is essentially what .bind() does internally
```

### Common Mistakes

❌ **Wrong**: Thinking bind invokes function
```javascript
const obj = { name: "Test" };

function greet() {
  console.log(this.name);
}

obj.greet = greet.bind(obj); // Returns new function
// Need to call it:
obj.greet(); // "Test"
```

✅ **Correct**: Bind returns new function
```javascript
const boundGreet = greet.bind(obj);
boundGreet(); // "Test"
```

❌ **Wrong**: Re-binding bound function
```javascript
const obj1 = { name: "First" };
const obj2 = { name: "Second" };

function greet() {
  console.log(this.name);
}

const bound1 = greet.bind(obj1);
const bound2 = bound1.bind(obj2); // Doesn't work!

bound2(); // "First" (not "Second")
// First binding is permanent!
```

### Follow-up Questions
1. "When would you use call vs apply vs bind?"
2. "Can you chain bind calls?"
3. "How does explicit binding interact with arrow functions?"
4. "What's the performance difference between the three methods?"

### Resources
- [MDN: Function.prototype.call()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call)
- [MDN: Function.prototype.apply()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply)
- [MDN: Function.prototype.bind()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)

<details><summary><strong>🔍 Deep Dive: How call/apply/bind Work Internally</strong></summary>

**Performance: call vs apply vs bind**

```javascript
// Benchmark: 1 million calls
const iterations = 1000000;
const obj = { value: 42 };

function getValue(multiplier) {
  return this.value * multiplier;
}

// Test 1: call() - fastest for known arguments
console.time('call');
for (let i = 0; i < iterations; i++) {
  getValue.call(obj, 2);
}
console.timeEnd('call'); // ~12ms

// Test 2: apply() - slightly slower
console.time('apply');
for (let i = 0; i < iterations; i++) {
  getValue.apply(obj, [2]);
}
console.timeEnd('apply'); // ~13ms (~8% slower)

// Test 3: bind() - creating bound function
console.time('bind-create');
for (let i = 0; i < iterations; i++) {
  const bound = getValue.bind(obj);
  bound(2);
}
console.timeEnd('bind-create'); // ~180ms (15x slower! Don't do this)

// Test 4: bind() - reused (proper way)
console.time('bind-reuse');
const boundGetValue = getValue.bind(obj);
for (let i = 0; i < iterations; i++) {
  boundGetValue(2);
}
console.timeEnd('bind-reuse'); // ~9ms (faster than call/apply!)

// Why call is faster than apply:
// - call: V8 knows argument count at compile time
// - apply: Must check array length at runtime
// - Modern JS engines optimize both well, but call has slight edge
```

**How V8 Implements bind() Internally:**

```javascript
// Simplified version of what bind() does:
Function.prototype.myBind = function(context, ...boundArgs) {
  const originalFunction = this;

  return function boundFunction(...callArgs) {
    // Combine bound args + call args
    const allArgs = [...boundArgs, ...callArgs];

    // Call original function with specified context
    return originalFunction.apply(context, allArgs);
  };
};

// Usage example:
function greet(greeting, punctuation) {
  return `${greeting}, ${this.name}${punctuation}`;
}

const user = { name: "Alice" };

// Using custom bind:
const boundGreet = greet.myBind(user, "Hello");
console.log(boundGreet("!")); // "Hello, Alice!"
console.log(boundGreet("?")); // "Hello, Alice?"

// Actual bind() is optimized in C++ but conceptually similar
```

**call() vs apply() Under the Hood:**

```javascript
// How V8 optimizes call():

// Your code:
function.call(context, arg1, arg2, arg3);

// V8 TurboFan compiles to (conceptually):
// 1. Check argument count (known at compile time)
// 2. Create activation record with 'this' = context
// 3. Push arg1, arg2, arg3 onto stack
// 4. Jump to function code
// Fast path: ~15 CPU cycles

// How V8 handles apply():

// Your code:
function.apply(context, [arg1, arg2, arg3]);

// V8 must:
// 1. Check if second argument is array-like
// 2. Get array length (runtime check)
// 3. Extract each element
// 4. Create activation record with 'this' = context
// 5. Push arguments onto stack
// 6. Jump to function code
// Slower path: ~20 CPU cycles (extra array handling)
```

**Partial Application with bind():**

```javascript
// bind() allows partial application (presetting arguments)

function multiply(a, b, c) {
  return a * b * c;
}

// Bind first argument
const multiplyBy2 = multiply.bind(null, 2);
console.log(multiplyBy2(3, 4)); // 2 * 3 * 4 = 24

// Bind first two arguments
const multiplyBy2And3 = multiply.bind(null, 2, 3);
console.log(multiplyBy2And3(4)); // 2 * 3 * 4 = 24

// This is how bind() stores bound arguments internally:
// bound function = {
//   [[TargetFunction]]: multiply,
//   [[BoundThis]]: null,
//   [[BoundArguments]]: [2, 3]
// }
```

**Borrowing Array Methods (Classic Pattern):**

```javascript
// Array-like objects don't have array methods
const arrayLike = {
  0: 'a',
  1: 'b',
  2: 'c',
  length: 3
};

// ❌ Doesn't work:
// arrayLike.map(x => x.toUpperCase()); // TypeError: arrayLike.map is not a function

// ✅ Borrow Array.prototype.map:
const result = Array.prototype.map.call(arrayLike, x => x.toUpperCase());
console.log(result); // ['A', 'B', 'C']

// How it works:
// 1. Array.prototype.map doesn't require 'this' to be a real array
// 2. It only needs:
//    - this.length (number)
//    - this[0], this[1], ... (indexed access)
// 3. call() sets 'this' to arrayLike
// 4. map() iterates using arrayLike.length and arrayLike[i]

// Common borrows:
const slice = Array.prototype.slice.call(arrayLike);
const filter = Array.prototype.filter.call(arrayLike, x => x !== 'b');
const forEach = Array.prototype.forEach.call(arrayLike, x => console.log(x));

// Modern alternatives:
Array.from(arrayLike);          // Convert to real array
[...arrayLike];                 // Spread (if iterable)
Array.from(arrayLike).map(...); // Then use array methods
```

**Hard Binding Pattern (Polyfill for bind()):**

```javascript
// Polyfill for bind() (how to implement it yourself)
if (!Function.prototype.bind) {
  Function.prototype.bind = function(context, ...boundArgs) {
    const fn = this;

    // Bound function
    const bound = function(...callArgs) {
      // Check if called with 'new' keyword
      if (this instanceof bound) {
        // new binding takes precedence over bind
        return new fn(...boundArgs, ...callArgs);
      }

      // Normal call: use bound context
      return fn.apply(context, [...boundArgs, ...callArgs]);
    };

    // Preserve prototype chain
    bound.prototype = Object.create(fn.prototype);

    return bound;
  };
}

// Example of new binding taking precedence:
function Person(name, age) {
  this.name = name;
  this.age = age;
}

const obj = { value: "ignored" };

const BoundPerson = Person.bind(obj, "Alice");

// Called with 'new': creates new object (obj is ignored)
const person = new BoundPerson(25);
console.log(person); // Person { name: "Alice", age: 25 }
console.log(obj);    // { value: "ignored" } (unchanged)

// Called normally: uses bound context
BoundPerson(25); // Sets properties on obj
console.log(obj); // { value: "ignored", name: "Alice", age: 25 }
```

**Arrow Functions and Explicit Binding:**

```javascript
// Arrow functions CANNOT be bound!

const obj1 = { value: "obj1" };
const obj2 = { value: "obj2" };

// Regular function: can be bound
const regular = function() {
  return this.value;
};

console.log(regular.call(obj1));  // "obj1" ✅
console.log(regular.call(obj2));  // "obj2" ✅

// Arrow function: ignores bind/call/apply
const arrow = () => {
  return this.value;
};

console.log(arrow.call(obj1));   // undefined (uses outer 'this')
console.log(arrow.call(obj2));   // undefined (uses outer 'this')

// Why? Arrow functions don't have their own 'this' binding
// They capture 'this' lexically (from outer scope)
// No amount of call/apply/bind can change it

// Proof:
const boundArrow = arrow.bind(obj1);
console.log(boundArrow.call(obj2)); // Still undefined!
```

**Method Chaining with Explicit Binding:**

```javascript
// Building a fluent API with bind():

class QueryBuilder {
  constructor() {
    this.query = '';
  }

  select(fields) {
    this.query += `SELECT ${fields} `;
    return this;
  }

  from(table) {
    this.query += `FROM ${table} `;
    return this;
  }

  where(condition) {
    this.query += `WHERE ${condition} `;
    return this;
  }

  execute() {
    console.log(this.query);
    return this.query;
  }
}

const qb = new QueryBuilder();

// Method chaining works because methods return 'this'
qb.select('*').from('users').where('age > 18').execute();
// SELECT * FROM users WHERE age > 18

// Extracting method breaks chaining (loses 'this'):
const select = qb.select;
// select('id, name'); // ❌ TypeError: Cannot read property 'query' of undefined

// Fix with bind:
const boundSelect = qb.select.bind(qb);
boundSelect('id, name').from('products').execute();
// ✅ Works! SELECT id, name FROM products
```

**V8 Optimization: Inline Caching for call/apply:**

```javascript
// V8 uses inline caches to optimize call/apply

function processUser(user) {
  console.log(user.name);
}

// Monomorphic (same object shape):
const user1 = { name: "Alice", age: 25 };
const user2 = { name: "Bob", age: 30 };

for (let i = 0; i < 10000; i++) {
  processUser.call(null, user1);
  processUser.call(null, user2);
}
// V8 optimizes: knows user has 'name' property
// Inline cache hit rate: ~99%
// Fast path taken

// Polymorphic (different shapes):
const user3 = { name: "Charlie", age: 35, role: "admin" }; // Different shape!

for (let i = 0; i < 10000; i++) {
  processUser.call(null, user1);
  processUser.call(null, user2);
  processUser.call(null, user3); // Breaks inline cache
}
// V8 must check multiple shapes
// Inline cache hit rate: ~70%
// Slower path

// Megamorphic (too many shapes):
for (let i = 0; i < 10000; i++) {
  processUser.call(null, { name: `User${i}` }); // New shape every time!
}
// V8 gives up on inline caching
// Full property lookup every call
// Slowest path
```

</details>

<details><summary><strong>🐛 Real-World Scenario: Array Method Borrowing Bug in IE11</strong></summary>

**Scenario:** Your e-commerce site's product filtering breaks in IE11 with "Object doesn't support property or method 'filter'". Modern browsers work fine. The issue: borrowing array methods from NodeList (array-like) doesn't work consistently in IE11.

**The Problem:**

```javascript
// ❌ BUG: IE11 doesn't support array methods on NodeList
function filterProducts(category) {
  const products = document.querySelectorAll('.product');

  // Modern browsers: works
  // IE11: TypeError - 'products' has no method 'filter'
  const filtered = products.filter(p => {
    return p.dataset.category === category;
  });

  return filtered;
}

// Production scenario:
// - Works in Chrome, Firefox, Safari
// - Breaks in IE11 (still 5% of corporate users)
// - Error rate: 450/day from IE11 users
// - User complaints: "Product filtering doesn't work"
// - Revenue loss: ~$3k/week (IE11 users can't find products)
```

**Why It Happens:**

```javascript
// Modern browsers:
const nodeList = document.querySelectorAll('.item');
console.log(nodeList.filter); // function filter() { ... }

// IE11:
const nodeList = document.querySelectorAll('.item');
console.log(nodeList.filter); // undefined ❌

// NodeList in IE11:
// - Is array-like (has length, numeric indices)
// - Does NOT inherit from Array.prototype
// - Has no array methods (forEach, map, filter, etc.)
//
// Modern browsers added array methods to NodeList.prototype
// IE11 never got this update
```

**Debugging Process:**

```javascript
// Step 1: Check what NodeList has in IE11
const products = document.querySelectorAll('.product');

console.log('Has length:', 'length' in products); // true
console.log('Is array:', Array.isArray(products)); // false
console.log('Has filter:', 'filter' in products); // false (IE11)
console.log('Has forEach:', 'forEach' in products); // false (IE11)

// Step 2: Check what works
console.log('Can access [0]:', products[0]); // Works
console.log('Can loop:', products.length); // Works

// Step 3: Identify the pattern
// IE11 NodeList = array-like but not array
// Need to convert or borrow methods
```

**Solution 1: Convert to Array:**

```javascript
// ✅ FIX: Convert NodeList to Array
function filterProducts(category) {
  const products = document.querySelectorAll('.product');

  // Convert to real array (works in IE11)
  const productsArray = Array.prototype.slice.call(products);

  // Now can use array methods
  const filtered = productsArray.filter(p => {
    return p.dataset.category === category;
  });

  return filtered;
}

// Modern alternative (IE11+):
const productsArray = Array.from(products);

// Spread operator (not IE11):
const productsArray = [...products]; // ❌ Doesn't work in IE11
```

**Solution 2: Borrow Array Methods:**

```javascript
// ✅ BETTER: Borrow methods directly
function filterProducts(category) {
  const products = document.querySelectorAll('.product');

  // Borrow filter from Array.prototype
  const filtered = Array.prototype.filter.call(products, p => {
    return p.dataset.category === category;
  });

  return filtered;
}

// How it works:
// 1. Array.prototype.filter is the filter function
// 2. .call(products, ...) sets 'this' to products NodeList
// 3. filter() only needs:
//    - this.length (NodeList has)
//    - this[i] (NodeList has)
// 4. Works perfectly in IE11!

// Shorter version:
const filtered = [].filter.call(products, p => ...);
// [].filter is same as Array.prototype.filter
```

**Solution 3: Utility Function (Reusable):**

```javascript
// ✅ BEST: Create reusable utility
const ArrayUtils = {
  toArray(arrayLike) {
    return Array.prototype.slice.call(arrayLike);
  },

  forEach(arrayLike, callback) {
    return Array.prototype.forEach.call(arrayLike, callback);
  },

  map(arrayLike, callback) {
    return Array.prototype.map.call(arrayLike, callback);
  },

  filter(arrayLike, callback) {
    return Array.prototype.filter.call(arrayLike, callback);
  },

  find(arrayLike, callback) {
    return Array.prototype.find.call(arrayLike, callback);
  }
};

// Usage:
function filterProducts(category) {
  const products = document.querySelectorAll('.product');

  const filtered = ArrayUtils.filter(products, p => {
    return p.dataset.category === category;
  });

  return filtered;
}

// Works in ALL browsers including IE11!
```

**Real Production Metrics:**

```javascript
// Before fix (using .filter() directly):
// - IE11 errors: 450/day
// - Affected users: 5% (IE11 corporate users)
// - Error rate: 100% of IE11 product filtering attempts
// - Customer complaints: 25/week
// - Revenue loss: ~$3k/week
// - Support tickets: 15/week (IE11 users)

// After fix (Array.prototype.filter.call):
// - IE11 errors: 0/day ✅
// - Works across all browsers
// - Customer complaints: 0/week (filtering related)
// - Revenue recovered: $3k/week
// - Support tickets: 0/week
// - Code maintenance: Easier (one utility function)
// - Bundle size: No increase (using built-in methods)
```

**Complex Real-World Example: Multi-Browser Compatibility:**

```javascript
// Production-ready product filtering with IE11 support
class ProductFilter {
  constructor(selector) {
    this.products = document.querySelectorAll(selector);
  }

  // Utility: Convert array-like to array
  _toArray(arrayLike) {
    return Array.prototype.slice.call(arrayLike);
  }

  // Filter by category
  filterByCategory(category) {
    return Array.prototype.filter.call(this.products, product => {
      return product.dataset.category === category;
    });
  }

  // Filter by price range
  filterByPrice(min, max) {
    return Array.prototype.filter.call(this.products, product => {
      const price = parseFloat(product.dataset.price);
      return price >= min && price <= max;
    });
  }

  // Search by name
  search(query) {
    return Array.prototype.filter.call(this.products, product => {
      const name = product.dataset.name.toLowerCase();
      return name.includes(query.toLowerCase());
    });
  }

  // Sort by price
  sortByPrice(ascending = true) {
    const products = this._toArray(this.products);

    return products.sort((a, b) => {
      const priceA = parseFloat(a.dataset.price);
      const priceB = parseFloat(b.dataset.price);

      return ascending ? priceA - priceB : priceB - priceA;
    });
  }

  // Get first match
  findOne(predicate) {
    // IE11 doesn't have .find()
    return Array.prototype.find
      ? Array.prototype.find.call(this.products, predicate)
      : this._toArray(this.products).filter(predicate)[0]; // Polyfill
  }
}

// Usage:
const filter = new ProductFilter('.product');

// Filter by category (works IE11+)
const electronics = filter.filterByCategory('electronics');

// Filter by price range
const affordable = filter.filterByPrice(0, 100);

// Search
const results = filter.search('laptop');

// Sort
const sortedByPrice = filter.sortByPrice(true);

// Find one
const firstMatch = filter.findOne(p => p.dataset.featured === 'true');
```

**Alternative: Using Modern Array Methods with Polyfill:**

```javascript
// If you need to support IE11 extensively:
// Include polyfills at top of script

// Polyfill for Array.from (IE11)
if (!Array.from) {
  Array.from = function(arrayLike) {
    return Array.prototype.slice.call(arrayLike);
  };
}

// Polyfill for NodeList.prototype.forEach (IE11)
if (!NodeList.prototype.forEach) {
  NodeList.prototype.forEach = Array.prototype.forEach;
}

// Now can use modern syntax in IE11:
const products = document.querySelectorAll('.product');

// Works in IE11 with polyfill:
products.forEach(p => console.log(p));

const productsArray = Array.from(products);
```

**Lesson Learned:**

```javascript
// Key takeaways for browser compatibility:

// ✅ ALWAYS convert NodeList to Array if using array methods
const array = Array.prototype.slice.call(nodeList);

// ✅ OR borrow methods directly
Array.prototype.forEach.call(nodeList, callback);

// ✅ Create utility functions for commonly borrowed methods
const utils = {
  map: (list, fn) => Array.prototype.map.call(list, fn),
  filter: (list, fn) => Array.prototype.filter.call(list, fn)
};

// ❌ NEVER assume NodeList has array methods
nodeList.map(...); // Breaks in IE11

// ❌ NEVER use spread on NodeList in IE11
[...nodeList]; // SyntaxError in IE11

// ✅ Test in target browsers (BrowserStack, Sauce Labs)
// ✅ Use Babel/polyfills for modern features
// ✅ Add ESLint rules to catch IE11-incompatible code
```

</details>

<details><summary><strong>⚖️ Trade-offs: call vs apply vs bind</strong></summary>

### 1. Performance Comparison

```javascript
const obj = { value: 42 };

function compute(a, b, c) {
  return this.value + a + b + c;
}

// Benchmark results (1 million calls):
// Method call:        8ms  (baseline - fastest)
// call():            12ms  (50% slower than method)
// apply():           13ms  (60% slower than method)
// bind() reused:      9ms  (similar to method call)
// bind() per call:  180ms  (20x slower - never do this!)
```

| Method | Speed | Memory | Use Case |
|--------|-------|--------|----------|
| **Method call** | ✅ Fastest (8ms) | ✅ No overhead | Default choice when possible |
| **call()** | ⚠️ Slower (12ms) | ✅ No allocation | Known arguments, borrowing methods |
| **apply()** | ⚠️ Slower (13ms) | ✅ No allocation | Arguments in array |
| **bind() once** | ✅ Fast (9ms) | ⚠️ Creates function | Permanent binding, React handlers |
| **bind() per call** | ❌ Very slow (180ms) | ❌ Creates function each time | ❌ Never do this! |

### 2. Argument Handling

```javascript
function greet(greeting, punctuation) {
  return `${greeting}, ${this.name}${punctuation}`;
}

const user = { name: "Alice" };

// call(): Arguments passed individually
greet.call(user, "Hello", "!");
// Best when: You know arguments at call site
// Syntax: clear and explicit

// apply(): Arguments passed as array
const args = ["Hello", "!"];
greet.apply(user, args);
// Best when: Arguments are already in array
// Syntax: convenient for dynamic arguments

// bind(): Creates new function with preset arguments
const boundGreet = greet.bind(user, "Hello");
boundGreet("!"); // "Hello, Alice!"
boundGreet("?"); // "Hello, Alice?"
// Best when: Need reusable function with fixed context/args
// Syntax: enables partial application
```

| Aspect | call() | apply() | bind() |
|--------|--------|---------|--------|
| **Arguments** | Individual | Array | Individual (partial) |
| **Invokes immediately** | ✅ Yes | ✅ Yes | ❌ No (returns function) |
| **Returns** | Function result | Function result | New function |
| **Partial application** | ❌ No | ❌ No | ✅ Yes |
| **Reusable** | ❌ No | ❌ No | ✅ Yes |

### 3. When to Use Each

**Use call():**

```javascript
// ✅ Borrowing array methods
const arrayLike = { 0: 'a', 1: 'b', length: 2 };
const result = Array.prototype.map.call(arrayLike, x => x.toUpperCase());

// ✅ Function composition
function compose(f, g) {
  return function(...args) {
    return f.call(this, g.apply(this, args));
  };
}

// ✅ Setting this once
function greet() {
  console.log(`Hello, ${this.name}!`);
}
greet.call({ name: "Alice" });
```

**Use apply():**

```javascript
// ✅ Spreading array as arguments
const numbers = [5, 6, 2, 3, 7];
const max = Math.max.apply(null, numbers); // 7

// Modern alternative: spread operator
const max = Math.max(...numbers); // Simpler!

// ✅ When arguments are dynamic array
function logger() {
  const args = Array.prototype.slice.call(arguments);
  console.log.apply(console, args);
}

// ✅ Function delegation
function BaseClass() {}
BaseClass.prototype.init = function(a, b, c) {
  this.data = [a, b, c];
};

function SubClass() {
  BaseClass.apply(this, arguments); // Forward all args to parent
}
```

**Use bind():**

```javascript
// ✅ Event handlers
class Button {
  constructor() {
    this.count = 0;
    this.element = document.createElement('button');

    // Bind once in constructor
    this.element.addEventListener('click', this.handleClick.bind(this));
  }

  handleClick() {
    this.count++;
  }
}

// ✅ Partial application
function multiply(a, b) {
  return a * b;
}

const double = multiply.bind(null, 2);
const triple = multiply.bind(null, 3);

console.log(double(5)); // 10
console.log(triple(5)); // 15

// ✅ setTimeout/setInterval
const obj = {
  value: 42,
  printValue() {
    console.log(this.value);
  }
};

// ❌ Loses context:
setTimeout(obj.printValue, 1000); // undefined

// ✅ Bind preserves context:
setTimeout(obj.printValue.bind(obj), 1000); // 42
```

### 4. Modern Alternatives

```javascript
// Old: call/apply for array spread
Math.max.apply(null, [1, 2, 3]);

// ✅ Modern: Spread operator
Math.max(...[1, 2, 3]);

// Old: bind for arrow context
setTimeout(function() { console.log(this.value); }.bind(obj), 1000);

// ✅ Modern: Arrow function
setTimeout(() => console.log(this.value), 1000);

// Old: apply for constructor forwarding
function Sub() {
  Parent.apply(this, arguments);
}

// ✅ Modern: super in classes
class Sub extends Parent {
  constructor(...args) {
    super(...args);
  }
}
```

| Old Pattern | Modern Alternative | Browser Support |
|-------------|-------------------|----------------|
| `apply(null, array)` | `...array` | ES6+ (IE11 with Babel) |
| `bind(obj)` | Arrow function | ES6+ |
| `call(obj, ...args)` | Method call when possible | Always |

### 5. Memory and Performance Trade-offs

```javascript
// Scenario: 1000 instances with event handlers

// Pattern 1: bind() in constructor
class Component1 {
  constructor() {
    this.handler = this.handleClick.bind(this);
  }

  handleClick() { /* ... */ }
}

// Memory: 1000 bound functions (120KB)
// Performance: Fast (bind once)
// Pros: Clean, no issues
// Cons: Memory overhead

// Pattern 2: Arrow function field
class Component2 {
  handleClick = () => { /* ... */ };
}

// Memory: 1000 arrow functions (120KB)
// Performance: Fast
// Pros: Cleaner syntax, auto-binds
// Cons: Same memory overhead

// Pattern 3: Regular method + bind at call site
class Component3 {
  handleClick() { /* ... */ }

  render() {
    return <button onClick={this.handleClick.bind(this)} />;
  }
}

// Memory: 1000 methods on prototype (40KB) + re-creates bind every render!
// Performance: Slow (bind on every render)
// Pros: Less initial memory
// Cons: ❌ Terrible performance, causes re-renders
```

### Decision Matrix

| Scenario | Best Choice | Reason |
|----------|------------|--------|
| **Borrow array method once** | call() | Fast, no allocation |
| **Borrow with array args** | apply() or spread | Convenient |
| **Event handler** | bind() once or arrow | Stable reference |
| **Partial application** | bind() | Designed for this |
| **Hot path (called millions of times)** | Method call | Fastest |
| **Dynamic context** | call() | Flexible |
| **Modern code** | Arrow functions | No binding needed |
| **React event handler** | Arrow function field | Auto-binds, clean |

### Real-World Recommendation

```javascript
// ✅ RECOMMENDED PATTERNS:

// 1. Borrowing methods: use call
Array.prototype.slice.call(arrayLike);

// 2. Array arguments: use spread (not apply)
Math.max(...numbers); // Not: Math.max.apply(null, numbers)

// 3. Event handlers: use arrow functions
class MyComponent {
  handleClick = () => { /* ... */ }; // Not: bind in constructor
}

// 4. Partial application: use bind
const double = multiply.bind(null, 2);

// 5. setTimeout/async: use arrow functions
setTimeout(() => this.method(), 1000); // Not: .bind(this)

// 6. Modern React: use hooks (no 'this' at all!)
function MyComponent() {
  const handleClick = useCallback(() => { /* ... */ }, []);
  return <button onClick={handleClick}>Click</button>;
}
```

</details>

<details><summary><strong>💬 Explain to Junior: call/apply/bind Simplified</strong></summary>

**Simple Analogy: Borrowing Tools**

Think of `call`, `apply`, and `bind` like **borrowing tools from a neighbor**:

```javascript
const neighbor = {
  name: "Bob",
  hammer: function() {
    console.log(`${this.name} is using the hammer`);
  }
};

const me = { name: "Alice" };

// ❌ I don't have a hammer:
// me.hammer(); // TypeError: me.hammer is not a function

// ✅ Borrow neighbor's hammer:
neighbor.hammer.call(me); // "Alice is using the hammer"

// call() = "Let me use your hammer RIGHT NOW"
// The tool knows who's using it ('this' = me)
```

**The Three Methods Explained:**

### 1. call() = "Use it right now"

```javascript
function introduce(age, city) {
  console.log(`I'm ${this.name}, ${age}, from ${city}`);
}

const person = { name: "Alice" };

// Call the function RIGHT NOW with person as 'this'
introduce.call(person, 25, "NYC");
// "I'm Alice, 25, from NYC"

// Think: call = "Here's who you are (person), here are your arguments (25, 'NYC'), go!"
```

### 2. apply() = "Use it right now, but with a bag of arguments"

```javascript
function introduce(age, city) {
  console.log(`I'm ${this.name}, ${age}, from ${city}`);
}

const person = { name: "Bob" };

// Same as call, but arguments in an array
const args = [30, "LA"];
introduce.apply(person, args);
// "I'm Bob, 30, from LA"

// Think: apply = call, but arguments are in an array (bag)
```

### 3. bind() = "Make a copy of the tool that remembers who owns it"

```javascript
function introduce(age, city) {
  console.log(`I'm ${this.name}, ${age}, from ${city}`);
}

const person = { name: "Charlie" };

// Create a NEW function that always uses 'person' as 'this'
const boundIntroduce = introduce.bind(person);

// Call it later (it remembers 'person')
boundIntroduce(35, "Boston"); // "I'm Charlie, 35, from Boston"
boundIntroduce(36, "Denver");  // "I'm Charlie, 36, from Denver"

// Think: bind = "Give me a personal copy of this tool that knows I own it"
```

**Visual Comparison:**

```javascript
const dog = {
  name: "Buddy",
  speak() {
    console.log(`Woof! I'm ${this.name}!`);
  }
};

const cat = { name: "Whiskers" };

// cat doesn't have a speak method
// Let's make cat borrow dog's speak method:

// Option 1: call (use it once, right now)
dog.speak.call(cat); // "Woof! I'm Whiskers!"

// Option 2: apply (same as call, but args in array)
dog.speak.apply(cat, []); // "Woof! I'm Whiskers!"
// No arguments needed here, but if there were:
// dog.speak.apply(cat, [arg1, arg2]);

// Option 3: bind (create a new function for cat)
const catSpeak = dog.speak.bind(cat);
catSpeak(); // "Woof! I'm Whiskers!"
catSpeak(); // "Woof! I'm Whiskers!" (can call many times)
```

**Common Beginner Mistakes:**

```javascript
// ❌ MISTAKE 1: Thinking bind() calls the function
const obj = { name: "Test" };

function greet() {
  console.log(`Hello, ${this.name}!`);
}

greet.bind(obj); // Does nothing! Just creates a new function

// ✅ FIX: Call the bound function
const boundGreet = greet.bind(obj);
boundGreet(); // "Hello, Test!"

// Or call immediately:
greet.bind(obj)(); // "Hello, Test!"


// ❌ MISTAKE 2: Using bind in a loop/render (performance issue)
class Button {
  render() {
    // Bad: Creates new function EVERY render
    return <button onClick={this.handleClick.bind(this)}>Click</button>;
  }

  handleClick() {
    console.log('Clicked!');
  }
}

// ✅ FIX: Bind once in constructor
class Button {
  constructor() {
    // Good: Bind once, reuse everywhere
    this.handleClick = this.handleClick.bind(this);
  }

  render() {
    return <button onClick={this.handleClick}>Click</button>;
  }
}

// ✅ BETTER: Use arrow function
class Button {
  handleClick = () => {
    console.log('Clicked!');
  };

  render() {
    return <button onClick={this.handleClick}>Click</button>;
  }
}
```

**Real-World Examples:**

```javascript
// Example 1: Borrowing array methods
const notAnArray = { 0: 'apple', 1: 'banana', 2: 'cherry', length: 3 };

// notAnArray doesn't have .map(), but we can borrow it!
const uppercased = Array.prototype.map.call(notAnArray, fruit => {
  return fruit.toUpperCase();
});

console.log(uppercased); // ['APPLE', 'BANANA', 'CHERRY']

// Example 2: Max of array
const numbers = [5, 2, 9, 1, 7];

// Math.max doesn't take an array, but we can use apply:
const max = Math.max.apply(null, numbers);
console.log(max); // 9

// Modern way (easier):
const max = Math.max(...numbers); // Same result!

// Example 3: Event handlers in classes
class Counter {
  constructor() {
    this.count = 0;
    const button = document.querySelector('button');

    // ❌ This won't work:
    // button.addEventListener('click', this.increment);
    // Because 'this' inside increment will be the button, not the Counter!

    // ✅ Fix with bind:
    button.addEventListener('click', this.increment.bind(this));
  }

  increment() {
    this.count++;
    console.log(this.count);
  }
}
```

**Explaining to PM (Non-Technical):**

"Think of these three methods like different ways to use a company car:

**call()** - 'I need the car RIGHT NOW for a specific trip'
- Get the keys
- Drive to your destination immediately
- Return the keys
- One-time use

**apply()** - 'Same as call(), but I have a list of stops written down'
- Get the keys
- Drive to all stops on your list (array of destinations)
- Return the keys
- One-time use, but with a prepared route

**bind()** - 'Give me a personal copy of the car keys'
- Get your own set of keys
- Keep them forever
- Use the car whenever you want
- The car always knows it's you driving

**Business Value:**
- Enables code reuse (one method, many contexts)
- Example: One 'calculate total' function works for carts, wishlists, orders
- Saves development time: 30-40% less code
- Fewer bugs: Don't duplicate logic
- Easier maintenance: Change one function, updates everywhere"

**When to Ask for Help:**

- "I get 'undefined is not a function'" → might need to borrow a method with call
- "My event handler doesn't work" → probably need bind or arrow function
- "How do I make a function remember its context?" → use bind
- "My button click does nothing" → 'this' is probably wrong, use bind/arrow

**Practice Quiz:**

```javascript
// What will these log?

const quiz = {
  answer: 42,

  test() {
    console.log(this.answer);
  }
};

// 1. Direct call:
quiz.test(); // ?

// 2. Lost context:
const test = quiz.test;
test(); // ?

// 3. Using call:
test.call(quiz); // ?

// 4. Using bind:
const boundTest = test.bind(quiz);
boundTest(); // ?

// 5. Arrow alternative:
const arrowTest = () => quiz.test();
arrowTest(); // ?

// Answers:
// 1. 42 (this = quiz)
// 2. undefined (this = global/undefined)
// 3. 42 (call sets this = quiz)
// 4. 42 (bind creates function with this = quiz)
// 5. 42 (arrow calls quiz.test() which has correct this)
```

**Key Takeaways:**

1. **call()** = Use function now, set 'this', pass arguments individually
2. **apply()** = Same as call, but arguments are in an array
3. **bind()** = Create new function with permanent 'this'
4. **call/apply** = immediate execution
5. **bind** = returns function for later use
6. **Modern alternative** = Arrow functions (don't need binding)

</details>

---

