# Error Handling & Debugging

> **Focus**: JavaScript fundamentals and advanced concepts

---

## Question 1: How does error handling work with try-catch-finally?

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐
**Time:** 5-7 minutes
**Companies:** Google, Meta, Amazon

### Question
Explain try-catch-finally blocks. How do you handle errors in JavaScript?

### Answer

**try-catch-finally** provides structured error handling in JavaScript.

1. **Structure**
   - `try`: Code that might throw error
   - `catch`: Handle the error
   - `finally`: Always executes (optional)
   - Can throw custom errors

2. **Error Types**
   - `Error`: Generic error
   - `TypeError`: Wrong type
   - `ReferenceError`: Undefined variable
   - `SyntaxError`: Parse error
   - Custom errors

### Code Example

```javascript
// 1. BASIC TRY-CATCH
try {
  const result = riskyOperation();
  console.log(result);
} catch (error) {
  console.error("Error occurred:", error.message);
}

// 2. TRY-CATCH-FINALLY
try {
  console.log("Trying...");
  throw new Error("Something went wrong!");
} catch (error) {
  console.log("Caught:", error.message);
} finally {
  console.log("This always runs!");
}

// 3. THROWING CUSTOM ERRORS
function divide(a, b) {
  if (b === 0) {
    throw new Error("Cannot divide by zero!");
  }
  return a / b;
}

try {
  divide(10, 0);
} catch (error) {
  console.log(error.message); // "Cannot divide by zero!"
}

// 4. CUSTOM ERROR CLASS
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

function validateAge(age) {
  if (age < 0) {
    throw new ValidationError("Age cannot be negative");
  }
}

try {
  validateAge(-5);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log("Validation failed:", error.message);
  }
}

// 5. ASYNC ERROR HANDLING
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch:", error);
    throw error; // Re-throw if needed
  } finally {
    console.log("Fetch attempt completed");
  }
}
```

### Common Mistakes

- ❌ **Mistake:** Forgetting finally executes even with return
  ```javascript
  function test() {
    try {
      return "try";
    } finally {
      console.log("finally runs"); // Still executes!
    }
  }
  test(); // Logs "finally runs", then returns "try"
  ```

- ❌ **Mistake:** Catching all errors without re-throwing
  ```javascript
  try {
    criticalOperation();
  } catch (error) {
    console.log(error); // Swallows error - bad!
  }

  // ✅ Better: Re-throw if you can't handle
  try {
    criticalOperation();
  } catch (error) {
    logError(error);
    throw error; // Re-throw so caller knows
  }
  ```

- ✅ **Correct:** Use specific error types
  ```javascript
  try {
    validateUser(data);
  } catch (error) {
    if (error instanceof ValidationError) {
      // Handle validation error
    } else {
      // Re-throw unexpected errors
      throw error;
    }
  }
  ```

<details>
<summary><strong>🔍 Deep Dive: Error Handling Internals</strong></summary>

**How V8 Implements try-catch:**

```javascript
// Your code:
try {
  riskyOperation();
} catch (error) {
  console.log(error.message);
}

// V8 internal mechanism (simplified):
// 1. Creates exception handler table entry
// 2. Marks code region as "guarded"
// 3. If exception thrown in region → jump to catch block
// 4. Exception object passed to catch variable

// Exception handler table (conceptual):
// {
//   tryStart: bytecode_offset_10,
//   tryEnd: bytecode_offset_25,
//   catchHandler: bytecode_offset_30,
//   finallyHandler: bytecode_offset_50
// }
```

**Performance Impact of try-catch:**

```javascript
// Myth: try-catch is slow
// Reality: Modern V8 optimizes try-catch well

// Benchmark: 1 million iterations
const iterations = 1000000;

// Test 1: Without try-catch
function withoutTryCatch() {
  let result = 0;
  for (let i = 0; i < iterations; i++) {
    result += i * 2;
  }
  return result;
}

console.time('no-try-catch');
withoutTryCatch();
console.timeEnd('no-try-catch'); // ~8ms

// Test 2: With try-catch (no errors thrown)
function withTryCatch() {
  let result = 0;
  for (let i = 0; i < iterations; i++) {
    try {
      result += i * 2;
    } catch (e) {
      // Never reached
    }
  }
  return result;
}

console.time('with-try-catch');
withTryCatch();
console.timeEnd('with-try-catch'); // ~9ms

// Test 3: With try-catch (errors thrown and caught)
function withErrors() {
  let result = 0;
  for (let i = 0; i < iterations; i++) {
    try {
      if (i % 1000 === 0) throw new Error('test');
      result += i * 2;
    } catch (e) {
      // Caught 1000 times
    }
  }
  return result;
}

console.time('with-errors');
withErrors();
console.timeEnd('with-errors'); // ~450ms

// Conclusion:
// - try-catch structure: ~10% overhead (minimal)
// - Actually throwing errors: ~50x slower!
// - Lesson: Use try-catch freely, but avoid throwing in hot paths
```

**Error Stack Traces:**

```javascript
// Stack trace creation is expensive
class CustomError extends Error {
  constructor(message) {
    super(message);
    this.name = "CustomError";

    // Stack trace captured here (expensive!)
    // V8 walks the call stack and serializes it
  }
}

// Benchmark: Stack trace overhead
console.time('create-errors');
for (let i = 0; i < 100000; i++) {
  new Error('test'); // Creates stack trace
}
console.timeEnd('create-errors'); // ~250ms

console.time('create-objects');
for (let i = 0; i < 100000; i++) {
  { message: 'test' }; // Just object
}
console.timeEnd('create-objects'); // ~5ms

// Stack traces are 50x slower to create!
// But: Essential for debugging, worth the cost
```

**Stack Trace Depth:**

```javascript
// V8 limits stack trace depth
Error.stackTraceLimit; // Default: 10

// Change limit:
Error.stackTraceLimit = 50; // Capture more frames (slower)
Error.stackTraceLimit = 5;  // Capture fewer frames (faster)
Error.stackTraceLimit = 0;  // No stack trace (fastest, not recommended)

// Deep recursion example:
function recursive(depth) {
  if (depth === 0) {
    const error = new Error('Deep error');
    console.log(error.stack.split('\n').length); // Count frames
    throw error;
  }
  recursive(depth - 1);
}

Error.stackTraceLimit = 10;
try {
  recursive(100); // 100 levels deep
} catch (e) {
  console.log(e.stack.split('\n').length); // Only 11 (limit + 1)
}
```

**finally Block Guarantees:**

```javascript
// finally ALWAYS executes (almost)
function testFinally() {
  try {
    return "try";
  } finally {
    console.log("finally"); // Runs before return!
  }
}

console.log(testFinally());
// Output:
// "finally"
// "try"

// Return value can be overridden by finally:
function overrideReturn() {
  try {
    return "try";
  } finally {
    return "finally"; // Overrides try's return!
  }
}

console.log(overrideReturn()); // "finally"

// Exception can be overridden by finally:
function overrideException() {
  try {
    throw new Error("try error");
  } finally {
    return "finally"; // Suppresses exception!
  }
}

console.log(overrideException()); // "finally" (no error thrown!)

// Only way to prevent finally: process termination
function neverFinally() {
  try {
    process.exit(0); // Kills process
  } finally {
    console.log("never runs"); // Process already dead
  }
}
```

**Error Object Properties:**

```javascript
// Standard Error properties
const error = new Error("Something went wrong");

// Built-in properties:
error.message;    // "Something went wrong"
error.name;       // "Error"
error.stack;      // Stack trace string

// V8-specific (non-standard but useful):
Error.captureStackTrace(error, functionToHideFromStack);

// Custom properties:
class APIError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.name = "APIError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.timestamp = Date.now();

    // Remove constructor from stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      timestamp: this.timestamp
      // Note: stack not included (sensitive info)
    };
  }
}

const apiError = new APIError("User not found", 404, "USER_NOT_FOUND");
console.log(apiError.toJSON());
// {
//   name: "APIError",
//   message: "User not found",
//   statusCode: 404,
//   errorCode: "USER_NOT_FOUND",
//   timestamp: 1699999999999
// }
```

**TurboFan Deoptimization:**

```javascript
// try-catch can prevent optimization in older V8 versions
// Modern V8 (since 2017) optimizes try-catch well

// Old V8 behavior (pre-2017):
function oldOptimization() {
  let result = 0;
  try {
    // This function would NOT be optimized
    for (let i = 0; i < 1000000; i++) {
      result += i;
    }
  } catch (e) {}
  return result;
}

// Modern V8 (post-2017):
// Same function IS optimized by TurboFan
// try-catch no longer prevents optimization

// Still deoptimizes if:
// 1. Error is actually thrown (deopt at throw site)
// 2. catch block is executed (deopt on entry)

function willDeopt() {
  for (let i = 0; i < 100000; i++) {
    try {
      if (i === 50000) throw new Error(); // Deopt here!
    } catch (e) {
      // Function deoptimized when this runs
    }
  }
}

// Check optimization status (V8 debug mode):
// %OptimizeFunctionOnNextCall(willDeopt);
// %GetOptimizationStatus(willDeopt);
```

**Memory Impact of Error Objects:**

```javascript
// Error objects with stack traces are memory-heavy
const error = new Error('test');

// Approximate memory per Error:
// - Error object: 48 bytes
// - Message string: 24 bytes + length
// - Stack trace string: 500-2000 bytes (depends on depth)
// Total: ~600-2100 bytes per Error

// Memory leak example:
const errors = [];
for (let i = 0; i < 10000; i++) {
  errors.push(new Error(`Error ${i}`));
}

// Memory used: ~10-20 MB for 10k errors
// Be careful caching Error objects!

// ✅ Better: Store error data, not Error objects
const errorData = [];
for (let i = 0; i < 10000; i++) {
  errorData.push({
    message: `Error ${i}`,
    timestamp: Date.now()
    // No stack trace = ~100 bytes each
  });
}

// Memory used: ~1 MB for 10k error records
```

</details>

<details>
<summary><strong>🐛 Real-World Scenario: Unhandled Promise Rejection Crash</strong></summary>

**Scenario:** Your Node.js production server crashes overnight with "UnhandledPromiseRejectionWarning". Investigation reveals async errors aren't properly caught in try-catch blocks. The app processes 50k requests/day, and crashes happen randomly 2-3 times daily, causing 5-10 minutes of downtime each time.

**The Problem:**

```javascript
// ❌ BUG: try-catch doesn't catch promise rejections
async function processOrder(orderId) {
  try {
    // This looks safe, but it's NOT!
    const order = getOrder(orderId); // Returns Promise
    const payment = processPayment(order); // Returns Promise

    // Neither await, so exceptions NOT caught!
    return payment;
  } catch (error) {
    console.error("Error:", error); // Never reached!
    return null;
  }
}

// What actually happens:
processOrder(123);
// UnhandledPromiseRejectionWarning: Payment failed
// (node:12345) [DEP0018] DeprecationWarning: Unhandled promise rejections are deprecated

// Production logs:
// [2025-11-13 03:15:42] UnhandledPromiseRejectionWarning: Payment API timeout
// [2025-11-13 03:15:42] Server crashed, restarting...
// [2025-11-13 03:15:47] Server back online (5 seconds downtime)
//
// Frequency: 2-3 crashes/day
// Impact: Lost orders during downtime (~$2k/crash)
// Customer complaints: 15/week about checkout failures
```

**Why try-catch Doesn't Work:**

```javascript
// try-catch is synchronous, promises are asynchronous
function demonstrateProblem() {
  try {
    // Promise rejection happens LATER (next tick)
    Promise.reject(new Error('async error'));
    // Execution continues, exits try block
  } catch (error) {
    // Never catches because error thrown later!
    console.log('Caught:', error);
  }
}

demonstrateProblem();
// Uncaught (in promise) Error: async error

// Timeline:
// 1. Promise.reject schedules microtask
// 2. try block exits
// 3. Later: microtask runs, throws error
// 4. catch block already past - too late!
```

**Debugging Steps:**

```javascript
// Step 1: Add promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  console.error('Promise:', promise);

  // Log stack trace
  console.error('Stack:', reason.stack);

  // Find which promise
  console.error('Promise details:', {
    toString: promise.toString(),
    constructor: promise.constructor.name
  });
});

// Step 2: Reproduce locally
async function testOrder() {
  // Intentionally break payment
  const order = await getOrder(123);
  processPayment(order); // Missing await - found the bug!
}

testOrder();
// Unhandled Rejection: Payment failed
// Stack: at processPayment (payment.js:45)

// Step 3: Search codebase for missing awaits
// grep -r "const.*=.*async" --include="*.js"
// Review all async function calls
```

**Solution 1: Add Missing await:**

```javascript
// ✅ FIX: Await all promises
async function processOrder(orderId) {
  try {
    const order = await getOrder(orderId);      // ✅ await
    const payment = await processPayment(order); // ✅ await

    // Now exceptions ARE caught!
    return payment;
  } catch (error) {
    console.error("Error processing order:", error);

    // Send to error tracking
    await logErrorToService(error, { orderId });

    // Return graceful failure
    return { success: false, error: error.message };
  }
}

// Works correctly:
const result = await processOrder(123);
// If error: { success: false, error: "Payment failed" }
```

**Solution 2: Global Error Handlers:**

```javascript
// ✅ SAFETY NET: Global handlers (last resort)
process.on('unhandledRejection', async (reason, promise) => {
  console.error('🚨 Unhandled Rejection detected!');
  console.error('Reason:', reason);
  console.error('Promise:', promise);

  // Log to external service
  await logCriticalError({
    type: 'UnhandledRejection',
    reason: reason.message,
    stack: reason.stack,
    timestamp: Date.now()
  });

  // DON'T exit process - let it continue
  // (fix the root cause instead)
});

process.on('uncaughtException', async (error, origin) => {
  console.error('🚨 Uncaught Exception!');
  console.error('Error:', error);
  console.error('Origin:', origin);

  await logCriticalError({
    type: 'UncaughtException',
    error: error.message,
    stack: error.stack,
    origin,
    timestamp: Date.now()
  });

  // For uncaught exceptions, safer to restart
  console.error('Restarting process in 1 second...');
  setTimeout(() => process.exit(1), 1000);
});
```

**Solution 3: Wrapper with Error Handling:**

```javascript
// ✅ BEST: Create async wrapper with guaranteed error handling
function asyncHandler(fn) {
  return async function(...args) {
    try {
      return await fn(...args);
    } catch (error) {
      // Log error
      console.error(`Error in ${fn.name}:`, error);

      // Send to monitoring service
      await reportError(error, {
        function: fn.name,
        args: JSON.stringify(args)
      });

      // Re-throw or return error response
      throw error;
    }
  };
}

// Usage with Express:
app.post('/api/orders', asyncHandler(async (req, res) => {
  const order = await getOrder(req.body.orderId);
  const payment = await processPayment(order);

  res.json({ success: true, payment });
}));

// All errors automatically caught and logged!

// Even better: Use express-async-errors
const asyncErrors = require('express-async-errors');
// Now ALL async route handlers automatically catch errors
```

**Solution 4: ESLint Rule:**

```javascript
// ✅ PREVENTION: Add ESLint rule to catch missing awaits
// .eslintrc.js
module.exports = {
  rules: {
    // Require Promises to be handled appropriately (awaited, returned, or explicitly voided)
    '@typescript-eslint/no-floating-promises': 'error',

    // Disallow async functions that never use await
    'require-await': 'error',

    // Require rejecting/throwing with Error objects, not plain values
    'prefer-promise-reject-errors': 'error'
  }
};

// Now ESLint warns:
async function test() {
  processPayment(order); // ❌ ESLint: Promises must be awaited
}
```

**Real Production Metrics:**

```javascript
// Before fix (missing awaits):
// - Crashes per day: 2-3
// - Downtime per crash: 5 minutes
// - Total daily downtime: 10-15 minutes
// - Lost orders: ~15/day ($2k/crash = $6k/day)
// - Customer complaints: 15/week
// - Developer time debugging: 4 hours/week
// - 500 errors: 25/day (from crashes)

// After fix (proper awaits + global handlers + ESLint):
// - Crashes per day: 0 ✅
// - Downtime: 0 minutes ✅
// - Lost orders: 0 ✅
// - Customer complaints: 1-2/week (unrelated issues)
// - Developer time debugging: 30 min/week
// - 500 errors: 2/day (legitimate errors, handled gracefully)
// - Revenue saved: $6k/day = ~$180k/month
// - Uptime: 99.99% (was 99.0%)
```

**Complex Example: Multiple Async Operations:**

```javascript
// ✅ PRODUCTION-READY: Comprehensive error handling
class OrderService {
  async processOrder(orderId) {
    const startTime = Date.now();

    try {
      // Step 1: Fetch order (with timeout)
      const order = await this.fetchOrderWithTimeout(orderId, 5000);
      if (!order) {
        throw new ValidationError('Order not found', { orderId });
      }

      // Step 2: Validate order
      await this.validateOrder(order);

      // Step 3: Process payment (with retry)
      const payment = await this.processPaymentWithRetry(order, 3);

      // Step 4: Update inventory (rollback on failure)
      try {
        await this.updateInventory(order);
      } catch (inventoryError) {
        // Rollback payment
        await this.refundPayment(payment.id);
        throw new InventoryError('Insufficient stock', {
          orderId,
          paymentId: payment.id
        });
      }

      // Step 5: Send confirmation
      await this.sendConfirmation(order, payment).catch(err => {
        // Don't fail order if email fails
        console.warn('Email failed, but order succeeded:', err);
      });

      // Log success metrics
      const duration = Date.now() - startTime;
      this.logMetrics('order.success', { orderId, duration });

      return { success: true, order, payment };

    } catch (error) {
      // Log failure metrics
      const duration = Date.now() - startTime;
      this.logMetrics('order.failure', {
        orderId,
        duration,
        error: error.message
      });

      // Categorize error
      if (error instanceof ValidationError) {
        // User error - don't retry, return 400
        return {
          success: false,
          error: error.message,
          code: 'VALIDATION_ERROR'
        };
      } else if (error instanceof PaymentError) {
        // Payment error - retry manually, return 402
        return {
          success: false,
          error: 'Payment failed',
          code: 'PAYMENT_ERROR',
          retryable: true
        };
      } else if (error instanceof InventoryError) {
        // Inventory error - refunded, return 409
        return {
          success: false,
          error: 'Out of stock',
          code: 'INVENTORY_ERROR'
        };
      } else {
        // Unknown error - log and return 500
        await this.reportCriticalError(error, { orderId });
        return {
          success: false,
          error: 'Internal server error',
          code: 'INTERNAL_ERROR'
        };
      }
    } finally {
      // Always runs - cleanup resources
      await this.cleanupTempData(orderId).catch(err => {
        console.warn('Cleanup failed:', err);
      });
    }
  }

  async fetchOrderWithTimeout(orderId, timeout) {
    return Promise.race([
      this.fetchOrder(orderId),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ]);
  }

  async processPaymentWithRetry(order, maxRetries) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.processPayment(order);
      } catch (error) {
        if (attempt === maxRetries) throw error;

        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retry ${attempt}/${maxRetries} in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}

// Custom error classes
class ValidationError extends Error {
  constructor(message, data) {
    super(message);
    this.name = 'ValidationError';
    this.data = data;
  }
}

class PaymentError extends Error {
  constructor(message, data) {
    super(message);
    this.name = 'PaymentError';
    this.data = data;
  }
}

class InventoryError extends Error {
  constructor(message, data) {
    super(message);
    this.name = 'InventoryError';
    this.data = data;
  }
}
```

</details>

<details>
<summary><strong>⚖️ Trade-offs: Error Handling Strategies</strong></summary>

### 1. try-catch vs Error Callbacks

```javascript
// Pattern 1: try-catch (modern)
async function fetchUser(id) {
  try {
    const response = await fetch(`/api/users/${id}`);
    return await response.json();
  } catch (error) {
    console.error('Fetch failed:', error);
    return null;
  }
}

// Pattern 2: Error callbacks (old Node.js style)
function fetchUserCallback(id, callback) {
  fetch(`/api/users/${id}`)
    .then(response => response.json())
    .then(data => callback(null, data))
    .catch(error => callback(error, null));
}
```

| Aspect | try-catch | Error Callbacks |
|--------|-----------|-----------------|
| **Readability** | ✅ Clear flow | ❌ Callback hell |
| **Error handling** | ✅ Centralized | ⚠️ Check every call |
| **Stack traces** | ✅ Preserved | ⚠️ Often lost |
| **Modern** | ✅ Standard | ❌ Legacy |
| **Composition** | ✅ Easy | ❌ Complex |
| **Performance** | ✅ Similar | ✅ Similar |

**When to use each:**
- Use try-catch for all modern async code
- Use callbacks only for legacy Node.js APIs

### 2. Re-throw vs Swallow Errors

```javascript
// Pattern 1: Re-throw (propagate)
async function getData() {
  try {
    return await fetchData();
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error; // Caller can handle
  }
}

// Pattern 2: Swallow (handle locally)
async function getDataSafe() {
  try {
    return await fetchData();
  } catch (error) {
    console.error('Fetch failed:', error);
    return null; // Swallow error
  }
}
```

| Aspect | Re-throw | Swallow |
|--------|----------|---------|
| **Caller awareness** | ✅ Knows about error | ❌ Unaware |
| **Recovery** | ✅ Caller can retry | ❌ Hidden failure |
| **Debugging** | ✅ Clear failure | ⚠️ Silent failure |
| **Use case** | Critical operations | Non-critical features |

**Decision matrix:**
- **Re-throw:** Payment processing, auth, data mutation
- **Swallow:** Analytics, logging, optional features

### 3. finally vs Manual Cleanup

```javascript
// Pattern 1: finally block
async function processFile(path) {
  const file = await openFile(path);
  try {
    return await processFileData(file);
  } finally {
    await file.close(); // Always closes
  }
}

// Pattern 2: Manual cleanup
async function processFileManual(path) {
  const file = await openFile(path);
  try {
    const result = await processFileData(file);
    await file.close();
    return result;
  } catch (error) {
    await file.close(); // Duplicate cleanup
    throw error;
  }
}
```

| Aspect | finally | Manual Cleanup |
|--------|---------|----------------|
| **Guaranteed execution** | ✅ Always runs | ⚠️ Must duplicate |
| **Code duplication** | ✅ DRY | ❌ Duplicated |
| **Readability** | ✅ Clear intent | ⚠️ Verbose |
| **Error safety** | ✅ Runs on error | ⚠️ Easy to forget |

**When to use finally:**
- Resource cleanup (files, connections, locks)
- Metrics/logging that must happen
- Resetting state

### 4. Custom Errors vs Generic Errors

```javascript
// Pattern 1: Custom error classes
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

function validateUser(data) {
  if (!data.email) {
    throw new ValidationError('Email required', 'email');
  }
}

try {
  validateUser({});
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(`Field ${error.field}: ${error.message}`);
  }
}

// Pattern 2: Generic errors with properties
function validateUserGeneric(data) {
  if (!data.email) {
    const error = new Error('Email required');
    error.type = 'validation';
    error.field = 'email';
    throw error;
  }
}
```

| Aspect | Custom Error Classes | Generic + Properties |
|--------|---------------------|---------------------|
| **Type checking** | ✅ `instanceof` | ⚠️ Check properties |
| **Code completion** | ✅ TypeScript types | ❌ No types |
| **Hierarchy** | ✅ Can extend | ❌ Flat |
| **Boilerplate** | ⚠️ More code | ✅ Less code |
| **Clarity** | ✅ Self-documenting | ⚠️ Must check props |

**When to use custom errors:**
- Large applications with many error types
- TypeScript projects
- Domain-driven design

**When to use generic errors:**
- Small scripts
- Rapid prototyping
- Simple error categorization

### 5. Global Handlers vs Local try-catch

```javascript
// Pattern 1: Global handlers
process.on('unhandledRejection', handleError);
process.on('uncaughtException', handleError);

async function doWork() {
  await riskyOperation(); // No try-catch
}

// Pattern 2: Local try-catch everywhere
async function doWorkSafe() {
  try {
    await riskyOperation();
  } catch (error) {
    handleError(error);
  }
}
```

| Aspect | Global Handlers | Local try-catch |
|--------|----------------|-----------------|
| **Safety net** | ✅ Catches all | ⚠️ Can miss some |
| **Specific handling** | ❌ Generic | ✅ Context-aware |
| **Debugging** | ⚠️ Lost context | ✅ Full context |
| **Boilerplate** | ✅ Less code | ⚠️ Repetitive |

**Best practice: Use both**
```javascript
// Local try-catch for business logic
async function processOrder(order) {
  try {
    await validateOrder(order);
    await processPayment(order);
    return { success: true };
  } catch (error) {
    // Handle specific errors
    if (error instanceof ValidationError) {
      return { success: false, reason: 'invalid' };
    }
    throw error; // Let global handler catch unexpected
  }
}

// Global handler for unexpected errors
process.on('unhandledRejection', (error) => {
  console.error('UNEXPECTED ERROR:', error);
  reportToMonitoring(error);
});
```

### 6. Synchronous vs Asynchronous Error Handling

```javascript
// Sync errors: try-catch
function parseJSON(str) {
  try {
    return JSON.parse(str);
  } catch (error) {
    return null;
  }
}

// Async errors: try-catch with await
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    return await response.json();
  } catch (error) {
    return null;
  }
}

// Promise errors: .catch()
function fetchDataPromise() {
  return fetch('/api/data')
    .then(r => r.json())
    .catch(error => null);
}
```

| Use Case | Best Approach |
|----------|--------------|
| **Sync operations** | try-catch |
| **Async/await** | try-catch |
| **Promise chains** | `.catch()` |
| **Mixed sync/async** | try-catch |
| **Event emitters** | `.on('error')` |

### Decision Framework

**Error Handling Checklist:**

1. **Is operation critical?**
   - Yes → Re-throw after logging
   - No → Swallow and continue

2. **Need cleanup?**
   - Yes → Use finally
   - No → Simple try-catch

3. **Many error types?**
   - Yes → Custom error classes
   - No → Generic errors

4. **Async operation?**
   - Yes → await + try-catch
   - No → sync try-catch

5. **Need global safety net?**
   - Yes → Add unhandledRejection handler
   - No → Local try-catch sufficient

</details>

<details>
<summary><strong>💬 Explain to Junior: Error Handling Simplified</strong></summary>

**Simple Analogy: Catching a Ball**

Error handling is like playing catch:

```javascript
// Normal code = throwing a ball
function throwBall() {
  return "ball"; // Ball thrown successfully
}

// Error = ball thrown wild
function throwWild() {
  throw new Error("Ball went wild!"); // Uh oh!
}

// try-catch = trying to catch the ball
try {
  const ball = throwWild(); // Try to catch
  console.log("Caught:", ball);
} catch (error) {
  console.log("Missed! Ball went:", error.message);
}
```

**The Three Parts:**

```javascript
try {
  // TRY: Attempt something risky
  const result = riskyOperation();
  console.log("Success!");
} catch (error) {
  // CATCH: Handle if it goes wrong
  console.log("Oops:", error.message);
} finally {
  // FINALLY: Always do this (cleanup)
  console.log("Game over, clean up!");
}

// Output:
// "Oops: Something failed"
// "Game over, clean up!"
```

**Why We Need Error Handling:**

```javascript
// ❌ WITHOUT ERROR HANDLING: App crashes
function divideWithoutHandling(a, b) {
  return a / b; // What if b is 0?
}

console.log(divideWithoutHandling(10, 0)); // Infinity (weird!)

// If division threw error:
// app.js:5 Uncaught Error: Division by zero
// [App crashes] 💥

// ✅ WITH ERROR HANDLING: App survives
function divideWithHandling(a, b) {
  try {
    if (b === 0) {
      throw new Error("Can't divide by zero!");
    }
    return a / b;
  } catch (error) {
    console.log("Error:", error.message);
    return 0; // Safe default
  }
}

console.log(divideWithHandling(10, 0)); // Error: Can't divide by zero! (returns 0)
// App keeps running ✅
```

**Common Beginner Mistakes:**

```javascript
// ❌ MISTAKE 1: Forgetting await with async
async function fetchUserWrong(id) {
  try {
    const response = fetch(`/api/users/${id}`); // Missing await!
    return response.json(); // Missing await!
  } catch (error) {
    console.log("Never catches!"); // Never runs!
  }
}

// ✅ CORRECT: Await promises
async function fetchUserRight(id) {
  try {
    const response = await fetch(`/api/users/${id}`); // ✅ await
    return await response.json(); // ✅ await
  } catch (error) {
    console.log("Error:", error); // Now catches!
  }
}


// ❌ MISTAKE 2: Swallowing errors silently
try {
  importantOperation();
} catch (error) {
  // Nothing here = silent failure (bad!)
}

// ✅ CORRECT: Always log errors at minimum
try {
  importantOperation();
} catch (error) {
  console.error("Operation failed:", error);
  // Or show user-friendly message
}


// ❌ MISTAKE 3: Not understanding finally
function testFinally() {
  try {
    return "try"; // Think this returns?
  } finally {
    console.log("finally runs"); // This runs FIRST!
  }
}

console.log(testFinally());
// Output:
// "finally runs"
// "try"

// finally ALWAYS runs, even with return!
```

**Practical Examples:**

```javascript
// 1. Reading a file safely
async function readFile(path) {
  try {
    const data = await fs.readFile(path);
    return data;
  } catch (error) {
    console.error("File not found:", path);
    return null; // Safe default
  }
}

// 2. API call with retry
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      if (i === retries - 1) {
        // Last retry failed
        throw error;
      }
      console.log(`Retry ${i + 1}/${retries}...`);
    }
  }
}

// 3. Database connection cleanup
async function queryDatabase(sql) {
  const connection = await db.connect();
  try {
    const result = await connection.query(sql);
    return result;
  } finally {
    await connection.close(); // Always close connection!
  }
}
```

**Explaining to PM:**

"Error handling is like having insurance for your code.

**Without error handling:**
- App crashes when something goes wrong
- Users see 'Page not found' or white screen
- We lose all data in progress
- No way to recover

**With error handling:**
- App catches problems gracefully
- Shows user-friendly error messages
- Logs error for developers to fix
- App keeps running for other users

**Business value:**
- **Better UX:** Users see helpful messages instead of crashes
- **Higher uptime:** App doesn't crash from one error
- **Faster debugging:** We know exactly what went wrong and where
- **Data safety:** Can rollback failed operations
- **Cost savings:** One crash = lost revenue ($2k/crash in our case)

**Example:** Shopping cart
- Without: Payment fails → entire app crashes → lose customer
- With: Payment fails → show 'Try again' message → customer retries → sale completed"

**Visual Example:**

```javascript
// Shopping cart checkout
async function checkout(cartId) {
  const startTime = Date.now();

  try {
    // Step 1: Validate cart
    const cart = await getCart(cartId);
    if (cart.items.length === 0) {
      throw new Error("Cart is empty!");
    }

    // Step 2: Process payment
    const payment = await processPayment(cart.total);

    // Step 3: Update inventory
    await reduceInventory(cart.items);

    // Step 4: Send confirmation email
    await sendEmail(cart.userEmail, "Order confirmed!");

    // Success!
    return { success: true, orderId: payment.orderId };

  } catch (error) {
    // Something went wrong
    console.error("Checkout failed:", error);

    // Show user-friendly message
    return {
      success: false,
      message: "Checkout failed. Please try again."
    };

  } finally {
    // Always log how long it took
    const duration = Date.now() - startTime;
    console.log(`Checkout took ${duration}ms`);
  }
}

// Usage:
const result = await checkout('cart-123');
if (result.success) {
  console.log("Order placed:", result.orderId);
} else {
  console.log("Error:", result.message);
}
```

**Key Rules for Juniors:**

1. **Always use try-catch for risky operations**
   - File operations, network requests, parsing JSON

2. **Await promises inside try-catch**
   ```javascript
   try {
     const data = await fetchData(); // ✅ await
   } catch (error) {
     // Catches errors
   }
   ```

3. **Use finally for cleanup**
   ```javascript
   finally {
     closeConnection(); // Always runs
   }
   ```

4. **Log errors (at minimum)**
   ```javascript
   catch (error) {
     console.error(error); // At least log it!
   }
   ```

5. **Don't swallow errors silently**
   ```javascript
   catch (error) {
     // ❌ Empty catch = bad!
   }
   ```

**Quick Test:**

```javascript
// What gets logged?
async function test() {
  try {
    console.log("1");
    throw new Error("Oops");
    console.log("2"); // Does this run?
  } catch (error) {
    console.log("3");
  } finally {
    console.log("4");
  }
  console.log("5");
}

test();

// Answer:
// "1"
// "3" (error caught)
// "4" (finally always runs)
// "5" (execution continues)

// "2" never runs (error thrown before it)
```

</details>

### Follow-up Questions

- "What is the difference between throw and return?"
- "When should you use finally block?"
- "How do you create custom error types?"
- "What is the difference between Error, TypeError, and ReferenceError?"
- "How do you handle async errors in promises?"

### Resources

- [MDN: try...catch](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch)
- [MDN: Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)
- [JavaScript.info: Error Handling](https://javascript.info/error-handling)

---

