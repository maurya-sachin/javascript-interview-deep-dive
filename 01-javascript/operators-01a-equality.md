# Type Checking & Equality

> **Focus**: Core JavaScript concepts

---

## Question 1: What is the difference between == and ===?

**Difficulty:** 🟢 Easy
**Frequency:** ⭐⭐⭐⭐⭐
**Time:** 5 minutes
**Companies:** Google, Meta, Amazon, Microsoft, Netflix

### Question
Explain the difference between loose equality (==) and strict equality (===). When should you use each?

### Answer

- **`==`** (Loose/Abstract Equality): Performs type coercion before comparison
- **`===`** (Strict Equality): No type coercion, checks both type and value

1. **How == Works**
   - If types are different, JavaScript converts them to the same type
   - Follows complex coercion rules
   - Can lead to unexpected behavior
   - Special case: `null == undefined` returns `true`

2. **How === Works**
   - If types are different, immediately returns `false`
   - No type conversion
   - More predictable and explicit
   - Recommended for most comparisons

3. **Coercion Rules for ==**
   - String to number: `"5" == 5` → `true`
   - Boolean to number: `true == 1` → `true`
   - Object to primitive: `[5] == 5` → `true`
   - `null == undefined` → `true` (special case)

4. **When to Use Each**
   - Use `===` almost always (best practice)
   - Use `==` only when intentionally checking for `null` or `undefined`
   - Most style guides enforce `===`

5. **Best Practices**
   - Default to `===` for clarity and safety
   - Avoid relying on coercion
   - Explicitly convert types when needed
   - Use linters to enforce `===`

### Code Example

```javascript
// 1. BASIC COMPARISONS

// === (Strict Equality)
console.log(5 === 5);           // true (same type, same value)
console.log(5 === "5");         // false (different types)
console.log(true === 1);        // false (different types)
console.log(null === undefined); // false (different types)

// == (Loose Equality)
console.log(5 == 5);            // true
console.log(5 == "5");          // true (string coerced to number)
console.log(true == 1);         // true (boolean coerced to number)
console.log(null == undefined);  // true (special case)

// 2. TYPE COERCION EXAMPLES

// String to number
console.log("10" == 10);        // true
console.log("10" === 10);       // false

// Boolean to number
console.log(true == 1);         // true (true → 1)
console.log(false == 0);        // true (false → 0)
console.log(true === 1);        // false

// Empty string to number
console.log("" == 0);           // true ("" → 0)
console.log("" === 0);          // false

// Null and undefined
console.log(null == undefined); // true (special case)
console.log(null === undefined); // false
console.log(null == 0);         // false
console.log(undefined == 0);    // false

// 3. ARRAY AND OBJECT COMPARISONS

// Arrays to primitives
console.log([1] == 1);          // true ([1] → "1" → 1)
console.log([1] === 1);         // false

console.log([] == 0);           // true ([] → "" → 0)
console.log([] === 0);          // false

console.log([""] == 0);         // true ([""] → "" → 0)

// Objects
console.log({} == {});          // false (different references)
console.log({} === {});         // false

// 4. TRICKY CASES

console.log(false == "");       // true (both → 0)
console.log(false == "0");      // true (both → 0)
console.log("" == "0");         // false (string comparison)

console.log(0 == "");           // true
console.log(0 == "0");          // true

// The infamous case
console.log([] == ![]);         // true!
/*
Explanation:
1. ![] → false (empty array is truthy)
2. [] == false
3. [] → "" (ToPrimitive)
4. "" == false
5. "" → 0, false → 0
6. 0 == 0 → true
*/

// 5. NaN COMPARISON (SPECIAL CASE)

console.log(NaN == NaN);        // false
console.log(NaN === NaN);       // false
console.log(Object.is(NaN, NaN)); // true (use Object.is for NaN)

// Check for NaN
console.log(Number.isNaN(NaN)); // true (correct way)
console.log(isNaN("hello"));    // true (converts to number first!)
console.log(Number.isNaN("hello")); // false (doesn't convert)

// 6. +0 AND -0

console.log(+0 == -0);          // true
console.log(+0 === -0);         // true
console.log(Object.is(+0, -0)); // false

// 7. PRACTICAL - NULL/UNDEFINED CHECK

// ❌ Bad: Checking both separately
if (value === null || value === undefined) {
  console.log("Value is nullish");
}

// ✅ Good: Using == for null check (rare acceptable use)
if (value == null) {
  // true if value is null OR undefined
  console.log("Value is nullish");
}

// ✅ Better: Modern nullish check
if (value !== null && value !== undefined) {
  console.log("Value is not null/undefined");
}

// 8. PRACTICAL - USER INPUT VALIDATION

function validateAge(age) {
  // User input might be string or number

  // ❌ Bad: Using ==
  if (age == 18) {
    return true; // Would match "18" too
  }

  // ✅ Good: Explicit conversion + ===
  if (Number(age) === 18) {
    return true;
  }

  // ✅ Better: Type check first
  if (typeof age === 'number' && age === 18) {
    return true;
  }
}

// 9. COMPARISON ALGORITHM

// === Algorithm:
// 1. If types differ → false
// 2. If both undefined → true
// 3. If both null → true
// 4. If both numbers and same value → true
// 5. If both strings and same characters → true
// 6. If both booleans and same → true
// 7. If both reference same object → true
// 8. Otherwise → false

// == Algorithm (simplified):
// 1. If same type → compare like ===
// 2. If null/undefined → true
// 3. If number/string → convert string to number
// 4. If boolean → convert boolean to number
// 5. If object/primitive → convert object to primitive
// 6. Otherwise → false
```

### Common Mistakes

- ❌ **Mistake:** Using == carelessly
  ```javascript
  const input = "0";

  if (input == false) { // true! (unexpected)
    console.log("Empty");
  }
  ```

- ❌ **Mistake:** Thinking == is "more flexible"
  ```javascript
  function isEqual(a, b) {
    return a == b; // Dangerous! Hidden coercion
  }

  console.log(isEqual("1", 1));    // true
  console.log(isEqual(true, 1));   // true
  console.log(isEqual([], ""));    // true (unexpected!)
  ```

- ✅ **Correct:** Use === by default
  ```javascript
  if (input === "") {
    console.log("Empty");
  }

  // Explicit conversion when needed
  if (Number(input) === 0) {
    console.log("Zero");
  }
  ```

### Follow-up Questions

- "What are the coercion rules for the == operator?"
- "Why does `[] == ![]` return true?"
- "When is it acceptable to use ==?"
- "What is Object.is() and how is it different?"
- "How does != differ from !==?"

<details>
<summary><strong>🔍 Deep Dive: Equality Operator Internals</strong></summary>

**V8 Equality Algorithm Implementation:**

```javascript
// === (Strict Equality) Internal Algorithm (simplified):
function StrictEqual(x, y) {
  // 1. If Type(x) is different from Type(y), return false
  if (typeof x !== typeof y) return false;

  // 2. If Type(x) is Undefined, return true
  if (x === undefined) return true;

  // 3. If Type(x) is Null, return true
  if (x === null) return true;

  // 4. If Type(x) is Number, then
  if (typeof x === 'number') {
    // a. If x is NaN, return false
    if (Number.isNaN(x)) return false;
    // b. If y is NaN, return false
    if (Number.isNaN(y)) return false;
    // c. If x is the same Number value as y, return true
    if (x === y) return true;
    // d. If x is +0 and y is -0, return true
    if (x === 0 && y === 0) return true;
    // e. If x is -0 and y is +0, return true
    if (x === 0 && y === 0) return true;
    // f. Return false
    return false;
  }

  // 5. If Type(x) is String, return true if x and y are exactly the same
  if (typeof x === 'string') return x === y;

  // 6. If Type(x) is Boolean, return true if x and y are both true or both false
  if (typeof x === 'boolean') return x === y;

  // 7. If Type(x) is Symbol, return true if x and y are the same Symbol value
  if (typeof x === 'symbol') return x === y;

  // 8. Return true if x and y refer to the same object, otherwise false
  return x === y;
}

// Performance: ~2-6ns per operation in V8 (extremely fast)
// No type conversion = minimal CPU cycles
```

**== (Abstract Equality) Internal Algorithm:**

```javascript
// == Internal Algorithm (simplified ES specification):
function AbstractEqual(x, y) {
  // 1. If Type(x) is the same as Type(y), then
  //    Return the result of performing Strict Equality Comparison x === y
  if (typeof x === typeof y) {
    return x === y;
  }

  // 2. If x is null and y is undefined, return true
  if (x === null && y === undefined) return true;

  // 3. If x is undefined and y is null, return true
  if (x === undefined && y === null) return true;

  // 4. If Type(x) is Number and Type(y) is String,
  //    return the result of the comparison x == ToNumber(y)
  if (typeof x === 'number' && typeof y === 'string') {
    return x === Number(y);
  }

  // 5. If Type(x) is String and Type(y) is Number,
  //    return the result of the comparison ToNumber(x) == y
  if (typeof x === 'string' && typeof y === 'number') {
    return Number(x) === y;
  }

  // 6. If Type(x) is Boolean, return ToNumber(x) == y
  if (typeof x === 'boolean') {
    return Number(x) == y;
  }

  // 7. If Type(y) is Boolean, return x == ToNumber(y)
  if (typeof y === 'boolean') {
    return x == Number(y);
  }

  // 8. If Type(x) is String, Number, or Symbol and Type(y) is Object,
  //    return the result of x == ToPrimitive(y)
  if ((typeof x === 'string' || typeof x === 'number' || typeof x === 'symbol')
      && typeof y === 'object') {
    return x == toPrimitive(y);
  }

  // 9. If Type(x) is Object and Type(y) is String, Number, or Symbol,
  //    return the result of ToPrimitive(x) == y
  if (typeof x === 'object'
      && (typeof y === 'string' || typeof y === 'number' || typeof y === 'symbol')) {
    return toPrimitive(x) == y;
  }

  // 10. Return false
  return false;
}

// ToPrimitive conversion helper (simplified):
function toPrimitive(obj) {
  // Calls valueOf() first, then toString()
  if (obj.valueOf && typeof obj.valueOf() !== 'object') {
    return obj.valueOf();
  }
  if (obj.toString) {
    return obj.toString();
  }
  return obj;
}

// Performance: ~12-60ns per operation (3-10x slower than ===)
// Additional overhead from type conversion
```

**Performance Benchmarks:**

```javascript
// Benchmark: 10 million comparisons
const iterations = 10000000;

// Test 1: === (Strict) - Same types
console.time('=== same type');
for (let i = 0; i < iterations; i++) {
  5 === 5;
}
console.timeEnd('=== same type'); // ~18ms

// Test 2: === (Strict) - Different types
console.time('=== diff type');
for (let i = 0; i < iterations; i++) {
  5 === "5";
}
console.timeEnd('=== diff type'); // ~20ms (fast rejection)

// Test 3: == (Loose) - Same types
console.time('== same type');
for (let i = 0; i < iterations; i++) {
  5 == 5;
}
console.timeEnd('== same type'); // ~22ms (delegates to ===)

// Test 4: == (Loose) - Type coercion
console.time('== coercion');
for (let i = 0; i < iterations; i++) {
  5 == "5";
}
console.timeEnd('== coercion'); // ~85ms (string → number conversion)

// Test 5: == (Loose) - Complex coercion
console.time('== complex');
for (let i = 0; i < iterations; i++) {
  [] == 0;
}
console.timeEnd('== complex'); // ~650ms (ToPrimitive + conversion)

// Key insights:
// - === is 3-10x faster for different types
// - == with coercion is 4-35x slower
// - Complex coercions can be 100x+ slower
```

**Memory Implications:**

```javascript
// === doesn't allocate memory (direct comparison)
const a = { name: "Alice" };
const b = { name: "Alice" };

console.log(a === b); // false (different references)
// No memory allocated, just pointer comparison (~1ns)

// == with ToPrimitive can allocate memory
const obj = {
  valueOf() {
    return 42; // New primitive created
  }
};

console.log(obj == 42); // true
// Allocates temporary primitive for comparison

// String coercion creates temporary strings:
const arr = [1, 2, 3];
console.log(arr == "1,2,3"); // true
// Array.toString() creates new string "1,2,3" (~24 bytes)
// Then compares and discards
// Memory churn if done repeatedly in hot loops
```

**ToPrimitive Conversion in Detail:**

```javascript
// Understanding ToPrimitive algorithm
const obj = {
  valueOf() {
    console.log('valueOf called');
    return 10;
  },
  toString() {
    console.log('toString called');
    return '20';
  }
};

// With == operator (numeric context)
console.log(obj == 10);
// Output:
// valueOf called
// true
// valueOf() is tried first in numeric context

console.log(obj == '10');
// Output:
// valueOf called
// true (valueOf returns 10, "10" coerces to 10, 10 === 10)

// String context (like in template literals)
console.log(`Value: ${obj}`);
// Output:
// toString called
// "Value: 20"

// Explicit string coercion
console.log(String(obj));
// Output:
// toString called
// "20"

// Complex example: Array coercion
const arr = [5];
console.log(arr == 5);
// Process:
// 1. ToPrimitive(arr) → arr.toString() → "5"
// 2. "5" == 5
// 3. ToNumber("5") → 5
// 4. 5 === 5 → true

// Empty array special case
console.log([] == 0);
// Process:
// 1. ToPrimitive([]) → [].toString() → ""
// 2. "" == 0
// 3. ToNumber("") → 0
// 4. 0 === 0 → true
```

**The Infamous `[] == ![]` Breakdown:**

```javascript
// Step-by-step analysis of [] == ![]
const arr = [];

// Step 1: Evaluate right side first (! has higher precedence)
!arr // false ([] is truthy, so ![] is false)

// Step 2: Now we have [] == false
// Apply == algorithm

// Step 3: Type(x) is Object, Type(y) is Boolean
// Rule: If Type(y) is Boolean, return x == ToNumber(y)
// ToNumber(false) = 0
// Now: [] == 0

// Step 4: Type(x) is Object, Type(y) is Number
// Rule: Return ToPrimitive(x) == y
// ToPrimitive([]) → [].toString() → ""
// Now: "" == 0

// Step 5: Type(x) is String, Type(y) is Number
// Rule: Return ToNumber(x) == y
// ToNumber("") = 0
// Now: 0 == 0

// Step 6: Both are numbers, use ===
// 0 === 0 → true

console.log([] == ![]); // true

// This is why == is considered dangerous!
```

**Object.is() vs === vs ==:**

```javascript
// Object.is() - "Same Value" equality
function sameValue(x, y) {
  // Special case for NaN
  if (Number.isNaN(x) && Number.isNaN(y)) return true;

  // Special case for +0 and -0
  if (x === 0 && y === 0) {
    return 1/x === 1/y; // +0: 1/+0 = Infinity, -0: 1/-0 = -Infinity
  }

  // Otherwise same as ===
  return x === y;
}

// Comparison table:
console.log('=== vs Object.is():');
console.log(NaN === NaN);        // false
console.log(Object.is(NaN, NaN)); // true ✅

console.log(+0 === -0);          // true
console.log(Object.is(+0, -0));  // false ✅

console.log(5 === 5);            // true
console.log(Object.is(5, 5));    // true

// Performance:
// Object.is() is ~5% slower than === (extra NaN/zero checks)
// Use === for normal comparisons
// Use Object.is() only when you need NaN or +0/-0 distinction
```

**V8 Optimization Strategies:**

```javascript
// V8 uses inline caches for equality checks
function compare(a, b) {
  return a === b;
}

// First few calls: V8 monitors types
compare(5, 5);      // Observes: number === number
compare(10, 20);    // Observes: number === number
compare(3, 3);      // Observes: number === number

// After ~10 calls: V8 optimizes with TurboFan
// Generates specialized machine code:
// - Assumes both operands are numbers
// - Direct register comparison (1-2 CPU cycles)
// - No type checks needed

// But if you change types:
compare("hello", "world"); // Deoptimizes! (different type)
// V8 falls back to generic comparison (slower)

// Best practice: Keep types consistent in hot paths
function optimizedCompare(a, b) {
  // Type guard helps V8 optimize
  if (typeof a !== 'number' || typeof b !== 'number') {
    return false;
  }
  return a === b; // V8 knows both are numbers
}
```

**Practical Performance Impact:**

```javascript
// Real-world scenario: Array.includes() implementation

// ❌ Bad: Using == (slow)
function includesLoose(array, value) {
  for (let i = 0; i < array.length; i++) {
    if (array[i] == value) return true; // Type coercion overhead
  }
  return false;
}

// ✅ Good: Using === (fast)
function includesStrict(array, value) {
  for (let i = 0; i < array.length; i++) {
    if (array[i] === value) return true; // No coercion
  }
  return false;
}

// Benchmark: 1000 searches in 10000-element array
const arr = Array.from({ length: 10000 }, (_, i) => i);

console.time('== loose');
for (let i = 0; i < 1000; i++) {
  includesLoose(arr, "5000"); // String search in number array
}
console.timeEnd('== loose'); // ~450ms (coercion on every comparison!)

console.time('=== strict');
for (let i = 0; i < 1000; i++) {
  includesStrict(arr, 5000); // Number search in number array
}
console.timeEnd('=== strict'); // ~15ms (30x faster!)

// Lesson: Always use === in hot loops
```

</details>

<details>
<summary><strong>🐛 Real-World Scenario: E-commerce Cart Bug</strong></summary>

**Scenario:** Your e-commerce site is adding duplicate items to shopping carts, causing checkout confusion and customer complaints. Investigation reveals the bug is in the "add to cart" logic using `==` instead of `===`.

**The Problem:**

```javascript
// ❌ BUG: Using == to check if item already in cart
class ShoppingCart {
  constructor() {
    this.items = [];
  }

  addItem(productId, quantity) {
    // Check if item already exists
    const existingItem = this.items.find(item => item.productId == productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.items.push({ productId, quantity });
    }
  }

  getItems() {
    return this.items;
  }
}

// User adds items:
const cart = new ShoppingCart();

cart.addItem(123, 1);     // Product ID as number
cart.addItem("123", 1);   // Product ID as string (from URL query param)
cart.addItem(123, 1);     // Product ID as number again

console.log(cart.getItems());
// Expected: [{ productId: 123, quantity: 3 }]
// Actual: [{ productId: 123, quantity: 2 }, { productId: "123", quantity: 1 }]
//
// BUG: Duplicate entry! User sees item twice in cart
// 123 == "123" returns true, but they're stored separately
// When displaying cart, both show as "Product 123"

// Production impact:
// - Checkout shows duplicate items
// - Total price calculation wrong
// - User confusion: "Why is this item here twice?"
// - Customer support tickets: 85/week
// - Cart abandonment rate: 12% (should be 8%)
// - Revenue impact: ~$25k/month lost
```

**Debugging Process:**

```javascript
// Step 1: Reproduce the issue
const cart = new ShoppingCart();

console.log('Adding product 123 (number)');
cart.addItem(123, 1);
console.log('Cart:', cart.getItems());
// [{ productId: 123, quantity: 1 }]

console.log('Adding product "123" (string)');
cart.addItem("123", 1);
console.log('Cart:', cart.getItems());
// [{ productId: 123, quantity: 1 }, { productId: "123", quantity: 1 }]
// BUG CONFIRMED: Two separate entries!

// Step 2: Investigate why
console.log('Does 123 == "123"?', 123 == "123");   // true
console.log('Does 123 === "123"?', 123 === "123"); // false

// Aha! The == operator returns true, but items are stored with different types
// find() compares with ==, thinks they're the same
// But array storage keeps them separate (different types)

// Step 3: Check data sources
// - Product IDs from database: numbers (123)
// - Product IDs from URL params: strings ("123")
// - Product IDs from API responses: sometimes strings, sometimes numbers
// Inconsistent typing across codebase!
```

**Solution 1: Use Strict Equality:**

```javascript
// ✅ FIX: Use === for type-safe comparison
class ShoppingCartFixed {
  constructor() {
    this.items = [];
  }

  addItem(productId, quantity) {
    // Use === to ensure type matches
    const existingItem = this.items.find(item => item.productId === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.items.push({ productId, quantity });
    }
  }
}

const cart = new ShoppingCartFixed();

cart.addItem(123, 1);     // number
cart.addItem("123", 1);   // string (different type!)
cart.addItem(123, 1);     // number

console.log(cart.getItems());
// [{ productId: 123, quantity: 2 }, { productId: "123", quantity: 1 }]
// Still shows duplicates, but now it's consistent

// Problem: Still not fully fixed - need to normalize types!
```

**Solution 2: Normalize Product IDs:**

```javascript
// ✅ BETTER: Normalize product IDs to consistent type
class ShoppingCartNormalized {
  constructor() {
    this.items = [];
  }

  // Helper: Normalize product ID to number
  #normalizeProductId(productId) {
    const normalized = Number(productId);
    if (Number.isNaN(normalized)) {
      throw new Error(`Invalid product ID: ${productId}`);
    }
    return normalized;
  }

  addItem(productId, quantity) {
    // Normalize incoming product ID
    const normalizedId = this.#normalizeProductId(productId);

    // Now safe to use === (always comparing numbers)
    const existingItem = this.items.find(
      item => item.productId === normalizedId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.items.push({ productId: normalizedId, quantity });
    }
  }

  getItems() {
    return this.items;
  }
}

const cart = new ShoppingCartNormalized();

cart.addItem(123, 1);     // number → normalized to 123
cart.addItem("123", 1);   // string → normalized to 123
cart.addItem(123, 1);     // number → normalized to 123

console.log(cart.getItems());
// [{ productId: 123, quantity: 3 }] ✅
// Perfect! Single entry with correct total quantity
```

**Solution 3: TypeScript + Zod Validation:**

```typescript
// ✅ BEST: Use TypeScript + runtime validation
import { z } from 'zod';

// Define schema
const ProductIdSchema = z.union([
  z.number().int().positive(),
  z.string().regex(/^\d+$/).transform(Number)
]);

const CartItemSchema = z.object({
  productId: ProductIdSchema,
  quantity: z.number().int().positive()
});

type CartItem = z.infer<typeof CartItemSchema>;

class ShoppingCartTS {
  private items: CartItem[] = [];

  addItem(productId: unknown, quantity: unknown): void {
    // Validate and normalize at boundary
    const validated = CartItemSchema.parse({ productId, quantity });

    // TypeScript knows productId is always number here
    const existingItem = this.items.find(
      item => item.productId === validated.productId
    );

    if (existingItem) {
      existingItem.quantity += validated.quantity;
    } else {
      this.items.push(validated);
    }
  }

  getItems(): CartItem[] {
    return this.items;
  }
}

const cart = new ShoppingCartTS();

cart.addItem(123, 1);      // ✅ Passes validation, normalized to number
cart.addItem("123", 1);    // ✅ Passes validation, normalized to number
cart.addItem(123, 1);      // ✅ Passes validation, normalized to number
cart.addItem("abc", 1);    // ❌ Throws validation error

console.log(cart.getItems());
// [{ productId: 123, quantity: 3 }] ✅
```

**Real Production Metrics:**

```javascript
// Before fix (using ==):
// - Cart duplicate bug reports: 85/week
// - Data inconsistency: 450 carts/day with duplicates
// - Customer support time: 15 hours/week
// - Cart abandonment: 12% (3% due to confusion from duplicates)
// - Revenue lost: ~$25k/month
// - Database queries: Higher (duplicate entries)
// - Checkout failures: 35/week (duplicate SKU validation errors)

// After fix (using === + normalization):
// - Cart duplicate bugs: 0/week ✅
// - Data consistency: 100%
// - Customer support time: 2 hours/week (87% reduction)
// - Cart abandonment: 8.5% (normal baseline)
// - Revenue recovered: $25k/month
// - Database efficiency: +15% (no duplicate entries)
// - Checkout failures from duplicates: 0/week
// - Customer satisfaction: +92%
// - Developer confidence: High (TypeScript prevents regression)

// Time to fix: 4 hours
// ROI: $25k/month revenue + 13 hours/week support time saved
```

**Additional Edge Cases Discovered:**

```javascript
// Other bugs found during investigation:

// Bug 1: Quantity comparison
function updateQuantity(cartQuantity, newQuantity) {
  if (cartQuantity == newQuantity) {
    return; // No change
  }
  // Update logic...
}

updateQuantity(5, "5");   // No update (== returns true)
updateQuantity(5, "05");  // No update (== coerces "05" to 5)
updateQuantity(0, "");    // No update! ("" coerces to 0)
// Fix: Use ===

// Bug 2: Product availability check
const inStock = {
  "123": true,  // String key
  456: false    // Number key (becomes "456" in object)
};

function isAvailable(productId) {
  return inStock[productId] == true; // Dangerous ==
}

console.log(isAvailable(123));    // true == true → true (numeric key coerced to "123")
console.log(isAvailable("123"));  // true == true → true ✅
console.log(isAvailable(456));    // false == true → false ✅
console.log(isAvailable("456"));  // false == true → false ✅

// Looks fine, but what about:
console.log(isAvailable("true")); // undefined == true → false (expected)
console.log(isAvailable(1));      // undefined == true → false (but 1 == true!)

// Fix: Use === and be consistent with types

// Bug 3: Discount code validation
const validCodes = ["SAVE10", "SAVE20", "SAVE30"];

function isValidDiscount(code) {
  return validCodes.includes(code); // Uses ===, good!
}

// But in another file:
function applyDiscount(code) {
  if (code == "SAVE10") {
    return 0.10;
  }
  // ...
}

applyDiscount("SAVE10");  // Works
applyDiscount("  SAVE10  "); // Doesn't work (whitespace, but also type issue)

// If someone did:
applyDiscount(["SAVE10"]); // ["SAVE10"] == "SAVE10"?
// Array.toString() → "SAVE10", then "SAVE10" == "SAVE10" → true!
// Accidentally applies discount!

// Fix: Use === everywhere + trim + validate types
```

**Testing After Fix:**

```javascript
// Comprehensive test suite
describe('ShoppingCart', () => {
  let cart;

  beforeEach(() => {
    cart = new ShoppingCartNormalized();
  });

  test('handles number product IDs', () => {
    cart.addItem(123, 1);
    cart.addItem(123, 2);
    expect(cart.getItems()).toEqual([
      { productId: 123, quantity: 3 }
    ]);
  });

  test('handles string product IDs', () => {
    cart.addItem("123", 1);
    cart.addItem("123", 2);
    expect(cart.getItems()).toEqual([
      { productId: 123, quantity: 3 }
    ]);
  });

  test('handles mixed number/string product IDs', () => {
    cart.addItem(123, 1);
    cart.addItem("123", 1);
    cart.addItem(123, 1);
    expect(cart.getItems()).toEqual([
      { productId: 123, quantity: 3 }
    ]);
  });

  test('rejects invalid product IDs', () => {
    expect(() => cart.addItem("abc", 1)).toThrow();
    expect(() => cart.addItem(null, 1)).toThrow();
    expect(() => cart.addItem(undefined, 1)).toThrow();
  });

  test('handles different valid products', () => {
    cart.addItem(123, 1);
    cart.addItem(456, 2);
    expect(cart.getItems()).toEqual([
      { productId: 123, quantity: 1 },
      { productId: 456, quantity: 2 }
    ]);
  });
});

// All tests pass ✅
```

</details>

<details>
<summary><strong>⚖️ Trade-offs: == vs === vs Object.is()</strong></summary>

**Comparison Matrix:**

| Aspect | == (Loose) | === (Strict) | Object.is() |
|--------|-----------|-------------|-------------|
| **Type coercion** | ✅ Yes | ❌ No | ❌ No |
| **Performance** | ⚠️ Slow (12-60ns) | ✅ Fast (2-6ns) | ✅ Fast (3-7ns) |
| **NaN == NaN** | ❌ false | ❌ false | ✅ true |
| **+0 == -0** | ✅ true | ✅ true | ❌ false |
| **null == undefined** | ✅ true | ❌ false | ❌ false |
| **Predictability** | ❌ Low | ✅ High | ✅ High |
| **Readability** | ⚠️ Confusing | ✅ Clear | ✅ Clear |
| **Recommended** | ❌ Rarely | ✅ Always | ⚠️ Special cases |

**When to Use Each:**

```javascript
// ✅ Use === (99% of cases)
// - Default choice for all comparisons
// - Predictable, fast, no surprises
function isAdmin(role) {
  return role === "admin"; // Clear intent
}

// - Safe with different types
console.log(5 === "5");  // false (no hidden coercion)
console.log(0 === false); // false (different types)

// - Works in all contexts
const users = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" }
];
const found = users.find(u => u.id === 2); // ✅


// ✅ Use == (rare cases)
// - ONLY for null/undefined check (acceptable use)
function processValue(value) {
  if (value == null) {
    // true if value is null OR undefined
    return "No value";
  }
  return value;
}

// Equivalent to:
if (value === null || value === undefined) {
  return "No value";
}

// But shorter and idiomatic
// This is the ONLY acceptable use of ==


// ✅ Use Object.is() (special cases)
// - When you need to distinguish NaN
function isActuallyNaN(value) {
  return Object.is(value, NaN);
  // vs Number.isNaN(value) - same result, but less clear intent
}

// - When you need to distinguish +0 and -0
function isNegativeZero(value) {
  return Object.is(value, -0);
}

// Example: Direction in physics simulation
function getDirection(velocity) {
  if (Object.is(velocity, -0)) {
    return "approaching from right";
  } else if (Object.is(velocity, +0)) {
    return "approaching from left";
  }
  return velocity > 0 ? "moving right" : "moving left";
}

// - Implementing Map/Set key comparison
class CustomMap {
  has(key) {
    return this.keys.some(k => Object.is(k, key));
  }
}

const map = new CustomMap();
map.set(NaN, "value");
console.log(map.has(NaN)); // true (Object.is works)
// vs regular ===
console.log(NaN === NaN);  // false
```

**Performance Comparison (10M ops):**

```javascript
const iterations = 10000000;

// Benchmark 1: === (same type)
console.time('=== same');
for (let i = 0; i < iterations; i++) {
  5 === 5;
}
console.timeEnd('=== same'); // ~18ms ✅ Fastest

// Benchmark 2: === (different types)
console.time('=== diff');
for (let i = 0; i < iterations; i++) {
  5 === "5";
}
console.timeEnd('=== diff'); // ~20ms ✅ Fast rejection

// Benchmark 3: == (same type, delegates to ===)
console.time('== same');
for (let i = 0; i < iterations; i++) {
  5 == 5;
}
console.timeEnd('== same'); // ~22ms ⚠️ Slightly slower

// Benchmark 4: == (coercion needed)
console.time('== coerce');
for (let i = 0; i < iterations; i++) {
  5 == "5";
}
console.timeEnd('== coerce'); // ~85ms ❌ 4x slower

// Benchmark 5: == (complex coercion)
console.time('== complex');
for (let i = 0; i < iterations; i++) {
  [] == 0;
}
console.timeEnd('== complex'); // ~650ms ❌ 35x slower!

// Benchmark 6: Object.is()
console.time('Object.is');
for (let i = 0; i < iterations; i++) {
  Object.is(5, 5);
}
console.timeEnd('Object.is'); // ~24ms ✅ Very close to ===

// Takeaway: === is fastest, == with coercion is significantly slower
```

**Coercion Rules Complexity:**

```javascript
// == has 25+ comparison paths in the spec!
// Here are the most common gotchas:

// Path 1: String + Number
console.log("5" == 5);    // true (string → number)
console.log("05" == 5);   // true (leading zeros ignored)
console.log("5.0" == 5);  // true (parsed as float)

// Path 2: Boolean + Anything
console.log(true == 1);   // true (true → 1)
console.log(false == 0);  // true (false → 0)
console.log(true == "1"); // true (true → 1, "1" → 1)
console.log(false == ""); // true (false → 0, "" → 0)

// Path 3: Object + Primitive
console.log([5] == 5);        // true ([5] → "5" → 5)
console.log([1,2] == "1,2");  // true ([1,2] → "1,2")
console.log({} == "[object Object]"); // true

// Path 4: null/undefined special case
console.log(null == undefined); // true (ONLY these two)
console.log(null == 0);         // false (null doesn't coerce to 0!)
console.log(undefined == 0);    // false

// Path 5: NaN never equals anything (even itself)
console.log(NaN == NaN);        // false
console.log(NaN == undefined);  // false
console.log(NaN == null);       // false

// With ===, there's only 1 rule: Same type AND same value
// Much simpler to reason about!
```

**Code Smell Detection:**

```javascript
// ❌ RED FLAG: Using == in production code
if (userInput == expectedValue) {
  // What types are being compared?
  // Will coercion happen?
  // Is this intentional or a bug?
}

// ✅ GREEN FLAG: Using === everywhere
if (userInput === expectedValue) {
  // Clear: types must match
  // No hidden behavior
  // Easy to understand
}

// ⚠️ YELLOW FLAG: Using == for null check (acceptable)
if (value == null) {
  // OK: Idiomatic null/undefined check
  // But add comment for clarity
}

// Better with comment:
if (value == null) { // Intentional: checks both null and undefined
  return defaultValue;
}

// Most explicit (but verbose):
if (value === null || value === undefined) {
  return defaultValue;
}

// Modern best:
return value ?? defaultValue; // Nullish coalescing
```

**ESLint Rules:**

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    // ✅ Enforce === and !==
    "eqeqeq": ["error", "always"],

    // ⚠️ Or allow == only for null check
    "eqeqeq": ["error", "always", { "null": "ignore" }],

    // ✅ Catch common mistakes
    "no-eq-null": "error", // Disallow == null (forces === null || === undefined)
  }
};

// This prevents bugs at lint time!
```

**Decision Tree:**

```
Need to compare two values?
│
├─ Are both values always the same type?
│  └─ ✅ Use === (fast, clear)
│
├─ Do you need to check for null OR undefined?
│  ├─ Yes → Use == null (acceptable, or use ??)
│  └─ No → ✅ Use ===
│
├─ Do you need to distinguish NaN or +0/-0?
│  └─ ✅ Use Object.is()
│
└─ Do you want type coercion?
   ├─ Yes → ❌ Don't! Explicitly convert first, then use ===
   └─ No → ✅ Use ===
```

**Summary Table:**

| Scenario | Best Choice | Example |
|----------|------------|---------|
| **General comparison** | `===` | `x === 5` |
| **Null/undefined check** | `==` or `??` | `x == null` or `x ?? defaultValue` |
| **Array.includes()** | `===` | `arr.includes(value)` |
| **NaN detection** | `Number.isNaN()` | `Number.isNaN(x)` |
| **+0/-0 distinction** | `Object.is()` | `Object.is(x, -0)` |
| **User input validation** | `===` after normalization | `Number(input) === 5` |
| **Hot path loops** | `===` | Always fastest |

</details>

<details>
<summary><strong>💬 Explain to Junior: Equality in JavaScript</strong></summary>

**Simple Analogy: Comparing People**

Think of comparing two people:

```javascript
// === is like checking if two people are IDENTICAL TWINS
// - Same DNA (type)
// - Same appearance (value)
// If anything is different → NOT equal

const person1 = { name: "Alice", age: 25 };
const person2 = { name: "Alice", age: 25 };

console.log(person1 === person2); // false (different people, even if they look the same)

// == is like checking if two people are "similar enough"
// - JavaScript tries to make them comparable
// - Might change their appearance (type coercion) to compare
// - Can lead to weird results!

console.log(5 == "5"); // true (JavaScript says "close enough!")
console.log(5 === "5"); // false (one is number, one is string - NOT identical)
```

**The Magic == Operator (Type Coercion):**

```javascript
// == tries to be "helpful" but causes confusion

// Example 1: String vs Number
console.log(5 == "5");  // true
// JavaScript thinks: "Let me convert '5' to number 5, then compare"
// 5 == 5 → true

// With ===:
console.log(5 === "5"); // false
// JavaScript thinks: "Different types, immediately false"

// Example 2: Boolean vs Number
console.log(1 == true); // true
// JavaScript: "Let me convert true to number 1"
// 1 == 1 → true

console.log(1 === true); // false
// JavaScript: "Different types, false"

// Example 3: Empty string vs Zero
console.log("" == 0);   // true (!)
// JavaScript: "Let me convert '' to number 0"
// 0 == 0 → true

console.log("" === 0);  // false
// Different types, no conversion
```

**Common Beginner Mistakes:**

```javascript
// ❌ MISTAKE 1: Using == and getting surprised
function checkAge(age) {
  if (age == 18) {
    console.log("You are 18!");
  }
}

checkAge(18);    // "You are 18!" ✅
checkAge("18");  // "You are 18!" (Surprise! String also matches)
checkAge("018"); // "You are 18!" (Leading zero ignored!)

// ✅ FIX: Use ===
function checkAgeStrict(age) {
  if (age === 18) {
    console.log("You are 18!");
  }
}

checkAge(18);    // "You are 18!" ✅
checkAge("18");  // Nothing (strings don't match)


// ❌ MISTAKE 2: Checking for "empty" with ==
function isEmpty(value) {
  if (value == "") {
    return true;
  }
  return false;
}

isEmpty("");     // true ✅
isEmpty(0);      // true (Oops! 0 coerces to "")
isEmpty(false);  // true (Oops! false coerces to "")
isEmpty(null);   // false (Weird! null doesn't coerce to "")

// ✅ FIX: Use === and be explicit
function isEmptyStrict(value) {
  return value === "";
}


// ❌ MISTAKE 3: The infamous [] == ![]
console.log([] == ![]); // true (WAT?!)

// Explanation (complicated!):
// 1. ![] → false (empty array is truthy, so NOT array = false)
// 2. [] == false
// 3. [] → "" (array converts to string)
// 4. "" == false
// 5. "" → 0, false → 0 (both convert to 0)
// 6. 0 == 0 → true

// With ===:
console.log([] === ![]); // false (sensible!)
```

**The ONLY Acceptable Use of ==:**

```javascript
// ✅ Checking for null OR undefined (both at once)
function greet(name) {
  if (name == null) {
    // This is true if name is null OR undefined
    return "Hello, Guest!";
  }
  return `Hello, ${name}!`;
}

greet(null);      // "Hello, Guest!" (null caught)
greet(undefined); // "Hello, Guest!" (undefined caught)
greet("Alice");   // "Hello, Alice!"

// This is equivalent to:
if (name === null || name === undefined) {
  // More verbose but clearer
}

// Or modern way:
const finalName = name ?? "Guest"; // Nullish coalescing
```

**Visual Comparison Table:**

```javascript
// What does each operator return?

console.log('--- Comparing 5 and "5" ---');
console.log('5 == "5":', 5 == "5");   // true (coercion: "5" → 5)
console.log('5 === "5":', 5 === "5"); // false (different types)

console.log('--- Comparing 0 and false ---');
console.log('0 == false:', 0 == false);   // true (false → 0)
console.log('0 === false:', 0 === false); // false (different types)

console.log('--- Comparing "" and 0 ---');
console.log('"" == 0:', "" == 0);   // true ("" → 0)
console.log('"" === 0:', "" === 0); // false (different types)

console.log('--- Comparing null and undefined ---');
console.log('null == undefined:', null == undefined);   // true (special case)
console.log('null === undefined:', null === undefined); // false (different types)

console.log('--- Comparing NaN and NaN ---');
console.log('NaN == NaN:', NaN == NaN);   // false (NaN never equals itself)
console.log('NaN === NaN:', NaN === NaN); // false (same rule)
console.log('Object.is(NaN, NaN):', Object.is(NaN, NaN)); // true (only way!)
```

**Explaining to PM (Non-Technical):**

"Imagine you're comparing two products in our inventory:

**== (Loose equality)** is like saying:
- 'Product #5' and 'Product #005' are the same (ignores leading zeros)
- 'Product 5' and Product ID 5 are the same (ignores that one is text, one is number)
- Can lead to bugs: Wrong product gets shipped!

**=== (Strict equality)** is like saying:
- 'Product #5' and 'Product #005' are DIFFERENT (exact match required)
- 'Product 5' (text) and Product ID 5 (number) are DIFFERENT
- More accurate: Right product gets shipped

**Business impact:**
- Using == led to 85 support tickets/week (duplicate items in cart)
- Switching to === reduced tickets to 0/week
- Saved $25k/month in lost revenue from cart abandonment
- Developer time saved: 13 hours/week

**Rule:** Always use === unless you have a very specific reason not to."

**Practice Exercise:**

```javascript
// What do these return? (Try to guess before running)

// 1.
console.log(1 == "1");     // ?
console.log(1 === "1");    // ?

// 2.
console.log(true == 1);    // ?
console.log(true === 1);   // ?

// 3.
console.log([] == 0);      // ?
console.log([] === 0);     // ?

// 4.
console.log(null == 0);    // ?
console.log(null === 0);   // ?

// Answers:
// 1. true, false (string "1" coerces to number 1)
// 2. true, false (true coerces to 1)
// 3. true, false ([] → "" → 0)
// 4. false, false (null only equals undefined with ==)
```

**Key Takeaways for Juniors:**

1. **Always use ===** (default choice)
2. **Never use ==** except for null/undefined check
3. **== does magic (type coercion)** which causes bugs
4. **=== is predictable** - same type AND same value
5. **Use ESLint** to enforce === and catch mistakes

**Memory Aid:**

```
=   → Assignment (x = 5)
==  → "Equal-ish" (maybe convert types first)
=== → "Exactly equal" (no conversion, strict check)

Remember: More = signs = More strict
```

</details>

### Resources

- [MDN: Equality Comparisons](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness)
- [JavaScript Equality Table](https://dorey.github.io/JavaScript-Equality-Table/)
- [Understanding == vs ===](https://www.freecodecamp.org/news/loose-vs-strict-equality-in-javascript/)

---

## Question 2: What is the difference between null and undefined?

**Difficulty:** 🟢 Easy
**Frequency:** ⭐⭐⭐⭐⭐
**Time:** 5 minutes
**Companies:** Google, Meta, Amazon, Microsoft

### Question
Explain the difference between `null` and `undefined` in JavaScript. When would you use each?

### Answer

Both represent absence of value, but with different meanings:
- **`undefined`**: Variable declared but not assigned, or missing property
- **`null`**: Intentional absence of value (explicit)

1. **undefined Characteristics**
   - Default value for uninitialized variables
   - Default return value for functions
   - Missing object properties
   - Type: `undefined`
   - Represents "not yet defined"

2. **null Characteristics**
   - Must be explicitly assigned
   - Represents intentional absence
   - Type: `object` (historical bug)
   - Represents "intentionally empty"

3. **When Variables Become undefined**
   - Declared but not initialized
   - Function parameters not passed
   - Accessing non-existent object properties
   - Function without return statement

4. **When to Use null**
   - Explicitly clear a value
   - Indicate "no object" (API returns)
   - Reset object references
   - Intentionally empty state

5. **Checking for null/undefined**
   - Use `== null` to check both
   - Use `=== null` or `=== undefined` for specific check
   - Use nullish coalescing (`??`) for default values
   - Use optional chaining (`?.`) for safe access

### Code Example

```javascript
// 1. UNDEFINED - UNINITIALIZED VARIABLES

let x;
console.log(x);        // undefined
console.log(typeof x); // "undefined"

var y;
console.log(y);        // undefined

// 2. NULL - EXPLICIT ABSENCE

let user = null; // Explicitly "no user"
console.log(user);        // null
console.log(typeof user); // "object" (historical bug!)

// 3. FUNCTION RETURN VALUES

function noReturn() {
  // No return statement
}

console.log(noReturn()); // undefined

function explicitNull() {
  return null; // Explicit no value
}

console.log(explicitNull()); // null

// 4. FUNCTION PARAMETERS

function greet(name) {
  console.log(name); // undefined if not passed
}

greet(); // undefined

// 5. OBJECT PROPERTIES

const obj = { name: "John" };

console.log(obj.name);  // "John"
console.log(obj.age);   // undefined (property doesn't exist)
console.log(obj.city);  // undefined

// Explicit null
const user = {
  name: "Alice",
  email: null // Explicitly no email
};

console.log(user.email); // null

// 6. ARRAY ELEMENTS

const arr = [1, 2, 3];
console.log(arr[10]);    // undefined (index doesn't exist)

const arr2 = [1, null, 3];
console.log(arr2[1]);    // null (explicitly set)

// 7. CHECKING FOR NULL VS UNDEFINED

let value1;
let value2 = null;

// Checking undefined
console.log(value1 === undefined);  // true
console.log(typeof value1 === "undefined"); // true

// Checking null
console.log(value2 === null);       // true
console.log(value2 === undefined);  // false

// Checking both (nullish)
console.log(value1 == null);        // true
console.log(value2 == null);        // true

// 8. TYPE CHECKING

console.log(typeof undefined); // "undefined"
console.log(typeof null);      // "object" (bug!)

// Correct null check
console.log(null === null);         // true
console.log(value2 === null);       // true

// 9. PRACTICAL - DEFAULT VALUES

// ❌ Using undefined
function getUser(id) {
  if (id === 1) {
    return { name: "John" };
  }
  return undefined; // Don't do this
}

// ✅ Using null
function getUserBetter(id) {
  if (id === 1) {
    return { name: "John" };
  }
  return null; // Clear intent: no user found
}

// 10. NULLISH COALESCING

let username;
let savedName = null;

// ❌ Using || (treats 0, "", false as falsy)
const name1 = username || "Guest";    // "Guest"
const name2 = savedName || "Guest";   // "Guest"

// ✅ Using ?? (only null/undefined)
const name3 = username ?? "Guest";    // "Guest"
const name4 = savedName ?? "Guest";   // "Guest"

// Difference:
const count = 0;
console.log(count || 10);  // 10 (0 is falsy)
console.log(count ?? 10);  // 0 (0 is not null/undefined)

// 11. OPTIONAL CHAINING

const user = {
  name: "Alice",
  address: null
};

// ❌ Without optional chaining
console.log(user.address.city); // TypeError!

// ✅ With optional chaining
console.log(user.address?.city); // undefined (safe)
console.log(user.settings?.theme); // undefined

// 12. CLEARING REFERENCES

let largeObject = { /* huge data */ };

// Clear reference to allow garbage collection
largeObject = null;

// 13. API RESPONSES

// Common pattern: null means "no data"
function fetchUser(id) {
  const users = {
    1: { name: "Alice" },
    2: { name: "Bob" }
  };

  return users[id] || null; // null if not found
}

console.log(fetchUser(1)); // { name: "Alice" }
console.log(fetchUser(99)); // null (not found)

// 14. DESTRUCTURING WITH DEFAULTS

const { name = "Guest", age = 18 } = {};
console.log(name); // "Guest" (undefined → default)
console.log(age);  // 18

const { city = "NYC" } = { city: null };
console.log(city); // null (null doesn't trigger default!)

// Use nullish coalescing for true default
const { country } = { country: null };
console.log(country ?? "USA"); // "USA"

// 15. TYPEOF VS STRICT EQUALITY

function isUndefined(value) {
  // ✅ Method 1: Strict equality
  return value === undefined;

  // ✅ Method 2: typeof (safer for undeclared variables)
  return typeof value === "undefined";
}

function isNull(value) {
  // ✅ Only strict equality works
  return value === null;

  // ❌ typeof doesn't help
  // typeof null === "object"
}

// 16. JSON SERIALIZATION

const data = {
  name: "John",
  age: undefined,
  city: null
};

console.log(JSON.stringify(data));
// {"name":"John","city":null}
// undefined is omitted, null is preserved!
```

### Common Mistakes

- ❌ **Mistake:** Using typeof for null check
  ```javascript
  if (typeof value === "null") { // ❌ Never true!
    // typeof null is "object"
  }
  ```

- ❌ **Mistake:** Not distinguishing between null and undefined
  ```javascript
  function getUserAge(user) {
    return user.age; // undefined if missing, but could be null
  }

  // Better: be explicit
  function getUserAge(user) {
    return user.age !== undefined ? user.age : null;
  }
  ```

- ✅ **Correct:** Use appropriate checks
  ```javascript
  // Check specifically
  if (value === null) { }
  if (value === undefined) { }

  // Check either (nullish)
  if (value == null) { }

  // Use nullish coalescing
  const result = value ?? defaultValue;
  ```

### Follow-up Questions

- "Why does `typeof null` return 'object'?"
- "When should you explicitly return null?"
- "What is the difference between `== null` and `=== null`?"
- "How does JSON.stringify handle null vs undefined?"
- "What is nullish coalescing and when would you use it?"

<details>
<summary><strong>🔍 Deep Dive: null vs undefined Internals</strong></summary>

**V8 Internal Representation:**

```javascript
// In V8, values are tagged with type information in the lowest bits

// undefined representation:
// - Dedicated singleton value
// - Tag: 0x02 (undefined type)
// - Only one instance globally
// - Memory address: Fixed location in V8 heap

// null representation:
// - Also a singleton value
// - Tag: 0x00 (object type) - This is the bug!
// - Historical accident from JavaScript's first implementation
// - Memory address: Different fixed location

// Why typeof null === "object":
/*
In the original JavaScript (1995), values were stored in 32-bit units:
- First 3 bits: type tag
- Remaining bits: actual value

Type tags:
000: object
001: int
010: double
100: string
110: boolean

null was represented as: 0x00000000 (all zeros)
The type check looked at first 3 bits: 000 → "object"

This bug was kept for backward compatibility!
*/
```

**Performance: Checking null vs undefined:**

```javascript
// Benchmark: 10 million checks
const iterations = 10000000;

let value = undefined;

// Test 1: typeof check for undefined
console.time('typeof undefined');
for (let i = 0; i < iterations; i++) {
  typeof value === "undefined";
}
console.timeEnd('typeof undefined'); // ~45ms

// Test 2: === check for undefined
console.time('=== undefined');
for (let i = 0; i < iterations; i++) {
  value === undefined;
}
console.timeEnd('=== undefined'); // ~18ms (2.5x faster!)

// Test 3: === check for null
value = null;
console.time('=== null');
for (let i = 0; i < iterations; i++) {
  value === null;
}
console.timeEnd('=== null'); // ~18ms (same speed)

// Test 4: == null (checks both)
console.time('== null');
for (let i = 0; i < iterations; i++) {
  value == null;
}
console.timeEnd('== null'); // ~25ms (includes null/undefined check)

// Test 5: Nullish coalescing
console.time('??');
for (let i = 0; i < iterations; i++) {
  value ?? "default";
}
console.timeEnd('??'); // ~28ms

// Key insights:
// - === is fastest (direct comparison)
// - typeof has overhead (type string comparison)
// - ?? is almost as fast as ==
```

**Memory Implications:**

```javascript
// Both null and undefined are singletons (only one instance)

let a = undefined;
let b = undefined;
let c = undefined;

// All three point to THE SAME undefined value in memory
// No additional memory allocated

let x = null;
let y = null;
let z = null;

// All three point to THE SAME null value in memory
// No additional memory allocated

// Comparison (objects are different):
let obj1 = {};
let obj2 = {};
console.log(obj1 === obj2); // false (different objects in memory)

// But null/undefined are singletons:
console.log(undefined === undefined); // true (same instance)
console.log(null === null);           // true (same instance)

// Memory layout:
/*
V8 Heap:
┌─────────────┐
│ undefined   │ ← Single global instance (4-8 bytes)
│ (0x12AB)    │
└─────────────┘
       ↑
       │
   ┌───┴───┬───────┬───────┐
   │ var a │ var b │ var c │ (all point to same address)
   └───────┴───────┴───────┘

┌─────────────┐
│ null        │ ← Single global instance (4-8 bytes)
│ (0x34CD)    │
└─────────────┘
       ↑
       │
   ┌───┴───┬───────┬───────┐
   │ var x │ var y │ var z │ (all point to same address)
   └───────┴───────┴───────┘

Total memory: ~16 bytes for both (regardless of how many variables)
*/
```

**typeof null Bug - Historical Context:**

```javascript
// The original JavaScript (Netscape Navigator 2.0, 1995)
// Brendan Eich implemented it in 10 days

// Type representation in the engine:
const TYPE_TAGS = {
  OBJECT:    0b000,  // 0
  INT:       0b001,  // 1
  DOUBLE:    0b010,  // 2
  STRING:    0b100,  // 4
  BOOLEAN:   0b110   // 6
};

// null was represented as all zeros: 0x00000000
// The typeof check looked at the first 3 bits
// 000 → "object"

// This was discovered early but couldn't be fixed:
// 1. Already deployed to millions of users
// 2. Fixing would break existing code
// 3. Became part of the spec

// Attempted fix in ECMAScript 4 (2008):
// - Proposed: typeof null === "null"
// - Rejected: Would break too much existing code

// Workaround:
function typeOf(value) {
  if (value === null) return "null";
  return typeof value;
}

console.log(typeOf(null));      // "null"
console.log(typeOf(undefined)); // "undefined"
console.log(typeOf({}));        // "object"
```

**Undefined in Different Contexts:**

```javascript
// 1. Uninitialized variable
let a;
console.log(a); // undefined

// 2. Missing function parameter
function test(param) {
  console.log(param); // undefined if not passed
}
test();

// 3. Missing return statement
function noReturn() {
  // ...
}
console.log(noReturn()); // undefined

// 4. Explicit return undefined
function explicitUndefined() {
  return undefined; // Explicit but uncommon
}

// 5. Missing object property
const obj = { name: "Alice" };
console.log(obj.age); // undefined

// 6. Array hole
const arr = [1, , 3]; // Hole at index 1
console.log(arr[1]); // undefined

// 7. Accessing out-of-bounds array index
const arr2 = [1, 2, 3];
console.log(arr2[10]); // undefined

// 8. Deleted object property
const obj2 = { a: 1, b: 2 };
delete obj2.a;
console.log(obj2.a); // undefined

// 9. void operator
console.log(void 0); // undefined (always returns undefined)
console.log(void "anything"); // undefined

// 10. Global undefined variable
console.log(window.undefined); // undefined (browser)
console.log(global.undefined); // undefined (Node.js)

// Note: undefined can be shadowed (bad practice!)
function bad() {
  let undefined = "oops";
  console.log(undefined); // "oops" (shadowed!)
}

// Safe way: void 0 always returns actual undefined
function safe() {
  let undefined = "oops";
  console.log(void 0); // undefined (real undefined)
}
```

**Null Use Cases:**

```javascript
// 1. Explicit "no object" in API responses
async function fetchUser(id) {
  const response = await fetch(`/api/users/${id}`);
  if (response.status === 404) {
    return null; // Explicitly no user found
  }
  return response.json();
}

// 2. Clearing object references (garbage collection)
let heavyObject = new HeavyResource();
// ... use object ...
heavyObject = null; // Allow GC to reclaim memory

// 3. DOM API (returns null for not found)
const element = document.getElementById("nonexistent");
console.log(element); // null

// 4. RegExp match (returns null if no match)
const result = "hello".match(/xyz/);
console.log(result); // null

// 5. Intentionally empty value in data structures
const user = {
  name: "Alice",
  phoneNumber: null, // User hasn't provided phone yet
  email: "alice@example.com"
};

// 6. Database NULL values (commonly mapped to JavaScript null)
const dbResult = {
  id: 1,
  name: "Alice",
  middleName: null, // No middle name in database
  age: 25
};

// 7. Prototypal inheritance (Object.create(null))
const pureObject = Object.create(null); // No prototype chain
console.log(pureObject.toString); // undefined (no inherited methods)
```

**Checking null vs undefined - Best Practices:**

```javascript
// ✅ RECOMMENDED PATTERNS

// 1. Check for specific value
if (value === null) {
  // Explicitly null
}

if (value === undefined) {
  // Explicitly undefined
}

// 2. Check for either (nullish)
if (value == null) {
  // null OR undefined (only acceptable use of ==)
}

// 3. Nullish coalescing (modern)
const result = value ?? defaultValue;
// defaultValue used if value is null or undefined

// 4. Optional chaining (modern)
const city = user?.address?.city;
// Safely navigate, returns undefined if any level is null/undefined

// 5. Combining both
const name = user?.name ?? "Guest";
// Safe access + default value

// ❌ AVOID

// Bad: Using || (treats 0, false, "" as missing)
const count = value || 10; // Wrong if value is 0

// Bad: Using typeof for null
if (typeof value === "null") { } // Never true!

// Bad: Truthy/falsy check (too broad)
if (!value) { } // Also catches 0, false, "", NaN

// Bad: Checking undefined with typeof in modern code
if (typeof value === "undefined") { } // Verbose
// Prefer: value === undefined
```

**JSON Serialization Differences:**

```javascript
// undefined vs null in JSON

const data = {
  name: "Alice",
  age: undefined,
  city: null,
  active: true
};

// JSON.stringify omits undefined, keeps null
console.log(JSON.stringify(data));
// {"name":"Alice","city":null,"active":true}
// "age" is completely removed!

// Array behavior:
const arr = [1, undefined, null, 4];
console.log(JSON.stringify(arr));
// [1,null,null,4]
// undefined becomes null in arrays!

// Implications for APIs:
const apiResponse = {
  user: {
    name: "Alice",
    email: undefined, // Won't be in JSON!
    phone: null       // Will be in JSON as null
  }
};

// Server receives:
// {"user":{"name":"Alice","phone":null}}
// "email" field is missing

// This can cause issues:
const received = JSON.parse(JSON.stringify(apiResponse));
console.log("email" in received.user); // false
console.log("phone" in received.user); // true
console.log(received.user.phone);      // null
console.log(received.user.email);      // undefined (property doesn't exist)
```

**Advanced: Undefined Global Pollution:**

```javascript
// In non-strict mode, undefined can be reassigned (!)

(function() {
  // ❌ BAD: undefined is not a keyword, it's a global variable!
  var undefined = "I'm not undefined!";

  console.log(undefined);          // "I'm not undefined!"
  console.log(typeof undefined);   // "string"

  let x;
  console.log(x === undefined);    // false! (x is real undefined, but undefined is "I'm not undefined!")
})();

// ✅ SOLUTION 1: Use strict mode
"use strict";
var undefined = "test"; // TypeError: Cannot assign to read-only property 'undefined'

// ✅ SOLUTION 2: Use void 0 (always returns real undefined)
(function() {
  var undefined = "fake";

  let x;
  console.log(x === void 0);      // true (void 0 is real undefined)
  console.log(x === undefined);   // false (undefined is shadowed)
})();

// ✅ SOLUTION 3: IIFE pattern (old school)
(function(undefined) {
  // undefined is a local parameter, not global variable
  let x;
  console.log(x === undefined); // true (safe)
})();
```

</details>

<details>
<summary><strong>🐛 Real-World Scenario: API Response Handling Bug</strong></summary>

**Scenario:** Your frontend app crashes when the backend API returns `null` instead of omitting fields, because the code expects `undefined` for missing data. This inconsistency causes "Cannot read property of null" errors across the application.

**The Problem:**

```javascript
// ❌ BUG: Assuming missing fields are undefined, but API returns null

// Frontend expects:
const expectedResponse = {
  user: {
    name: "Alice",
    email: "alice@example.com"
    // phoneNumber is missing (undefined)
  }
};

// But API actually returns:
const actualResponse = {
  user: {
    name: "Alice",
    email: "alice@example.com",
    phoneNumber: null  // Explicitly null instead of omitted
  }
};

// Frontend code:
function displayUserInfo(userData) {
  const { user } = userData;

  // This works with undefined but breaks with null:
  const phone = user.phoneNumber.toString(); // TypeError: Cannot read property 'toString' of null

  return {
    name: user.name,
    email: user.email,
    phone: phone
  };
}

displayUserInfo(actualResponse); // CRASH!

// Production impact:
// - 350 crashes/day across user profile pages
// - Error rate: 8% of profile page views
// - User complaints: 45/week
// - Support tickets: 30/week
// - Time to debug: 12 hours (inconsistent between endpoints)
// - Revenue impact: ~$15k/month (users can't update profiles)
```

**Debugging Process:**

```javascript
// Step 1: Identify the pattern
console.log('Expected response:', expectedResponse);
console.log('Actual response:', actualResponse);

console.log('phoneNumber in expected:', expectedResponse.user.phoneNumber);
// undefined

console.log('phoneNumber in actual:', actualResponse.user.phoneNumber);
// null

// Step 2: Check how code handles both
console.log('undefined check:', expectedResponse.user.phoneNumber === undefined);
// true

console.log('null check:', actualResponse.user.phoneNumber === undefined);
// false (null !== undefined)

console.log('Nullish check:', expectedResponse.user.phoneNumber == null);
// true (undefined == null)

console.log('Nullish check:', actualResponse.user.phoneNumber == null);
// true (null == null)

// Step 3: Analyze API responses across different endpoints
/*
GET /api/users/123:
{
  "user": {
    "name": "Alice",
    "email": "alice@example.com",
    "phoneNumber": null,        ← null (PostgreSQL NULL)
    "address": {
      "street": null,           ← null
      "city": "Boston"
    }
  }
}

GET /api/users/456:
{
  "user": {
    "name": "Bob",
    "email": "bob@example.com"
    // phoneNumber omitted     ← undefined in JS
  }
}

Inconsistency found:
- Old API endpoints: Omit null fields (undefined in JS)
- New API endpoints: Include null fields (null in JS)
- Backend team didn't coordinate!
*/

// Step 4: Find all affected code
/*
grep -r "\.phoneNumber" src/
Found 23 locations accessing phoneNumber
Only 8 have null checks
15 are vulnerable to crashes!
*/
```

**Solution 1: Defensive null checks:**

```javascript
// ✅ FIX: Handle both null and undefined

function displayUserInfo(userData) {
  const { user } = userData;

  // Option 1: Check for nullish (null or undefined)
  const phone = user.phoneNumber != null
    ? user.phoneNumber.toString()
    : "Not provided";

  return {
    name: user.name,
    email: user.email,
    phone: phone
  };
}

// Option 2: Use optional chaining
function displayUserInfoSafe(userData) {
  const { user } = userData;

  return {
    name: user.name,
    email: user.email,
    phone: user.phoneNumber?.toString() ?? "Not provided"
  };
}

// Option 3: Nullish coalescing
function displayUserInfoModern(userData) {
  const { user } = userData;

  const phone = (user.phoneNumber ?? "N/A").toString();

  return {
    name: user.name,
    email: user.email,
    phone: phone
  };
}

// All three work with both null and undefined!
```

**Solution 2: Normalize API responses:**

```javascript
// ✅ BETTER: Create a normalization layer

function normalizeApiResponse(data) {
  // Recursively convert null to undefined
  if (data === null) {
    return undefined;
  }

  if (Array.isArray(data)) {
    return data.map(normalizeApiResponse);
  }

  if (typeof data === 'object') {
    const normalized = {};
    for (const [key, value] of Object.entries(data)) {
      const normalizedValue = normalizeApiResponse(value);
      if (normalizedValue !== undefined) {
        normalized[key] = normalizedValue;
      }
    }
    return normalized;
  }

  return data;
}

// Use in API client:
async function fetchUser(id) {
  const response = await fetch(`/api/users/${id}`);
  const data = await response.json();

  // Normalize before returning
  return normalizeApiResponse(data);
}

// Now frontend code works consistently:
const user = await fetchUser(123);
console.log(user.phoneNumber); // undefined (normalized from null)

// All existing code that checks for undefined works!
if (user.phoneNumber === undefined) {
  // Handle missing phone
}
```

**Solution 3: API Contract with Zod:**

```typescript
// ✅ BEST: Define strict API contract with validation

import { z } from 'zod';

// Define schema that normalizes null to undefined
const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phoneNumber: z.string().nullable().transform(val => val ?? undefined),
  address: z.object({
    street: z.string().nullable().transform(val => val ?? undefined),
    city: z.string(),
    zip: z.string().nullable().transform(val => val ?? undefined)
  }).optional()
});

type User = z.infer<typeof UserSchema>;

// API client with validation:
async function fetchUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  const data = await response.json();

  // Validate and transform
  const validated = UserSchema.parse(data.user);

  return validated;
}

// Now TypeScript knows phoneNumber is string | undefined (never null!)
const user = await fetchUser(123);

// Type-safe access:
const phone: string | undefined = user.phoneNumber;
if (phone !== undefined) {
  console.log(phone.toString()); // Safe!
}

// Or with optional chaining:
console.log(user.phoneNumber?.toString() ?? "Not provided");
```

**Solution 4: Backend fix (ideal):**

```javascript
// ✅ BEST LONG-TERM: Fix backend to be consistent

// Before (inconsistent):
// Endpoint 1 returns: { "phoneNumber": null }
// Endpoint 2 returns: { } (phoneNumber omitted)

// After (consistent - omit null values):
// JSON serialization middleware on backend:

// Express.js example:
app.use((req, res, next) => {
  const originalJson = res.json;

  res.json = function(data) {
    // Remove null values before sending
    const cleaned = removeNulls(data);
    return originalJson.call(this, cleaned);
  };

  next();
});

function removeNulls(obj) {
  if (obj === null || obj === undefined) {
    return undefined;
  }

  if (Array.isArray(obj)) {
    return obj.map(removeNulls).filter(item => item !== undefined);
  }

  if (typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      const cleaned = removeNulls(value);
      if (cleaned !== undefined && cleaned !== null) {
        result[key] = cleaned;
      }
    }
    return result;
  }

  return obj;
}

// Now all endpoints consistently omit null values
// Frontend receives undefined for missing fields
```

**Real Metrics After Fix:**

```javascript
// Before (mixed null/undefined):
// - Crashes from null access: 350/day
// - Error rate: 8% of profile views
// - Support tickets: 30/week
// - Dev debugging time: 12 hours/week
// - User complaints: 45/week
// - Revenue lost: ~$15k/month
// - Profile update failures: 120/week

// After (Solution 3: Zod validation + normalization):
// - Crashes from null access: 0/day ✅
// - Error rate: 0.2% (unrelated issues)
// - Support tickets: 3/week (90% reduction)
// - Dev debugging time: 1 hour/week
// - User complaints: 2/week
// - Revenue recovered: $15k/month
// - Profile update success: 99.8%
// - Developer confidence: High (TypeScript catches issues)
// - API consistency: 100% (schema enforced)

// Additional benefits:
// - Onboarding new developers faster (clear API contract)
// - Fewer production hotfixes (validation catches issues)
// - Better error messages (Zod provides detailed errors)
// - Type safety across entire codebase
```

**Complex Real-World Example:**

```typescript
// Production-ready user profile handler

import { z } from 'zod';

// Define comprehensive schema
const AddressSchema = z.object({
  street: z.string().nullable().transform(v => v ?? undefined),
  city: z.string(),
  state: z.string().nullable().transform(v => v ?? undefined),
  zip: z.string().nullable().transform(v => v ?? undefined),
  country: z.string().default("USA")
}).nullable().transform(v => v ?? undefined);

const UserProfileSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  phoneNumber: z.string().nullable().transform(v => v ?? undefined),
  dateOfBirth: z.string().nullable().transform(v => v ?? undefined),
  address: AddressSchema,
  preferences: z.object({
    newsletter: z.boolean().default(false),
    notifications: z.boolean().default(true),
    theme: z.enum(["light", "dark"]).default("light")
  }).nullable().transform(v => v ?? { newsletter: false, notifications: true, theme: "light" as const })
});

type UserProfile = z.infer<typeof UserProfileSchema>;

// API client
class UserAPI {
  private baseURL = '/api';

  async getUser(id: number): Promise<UserProfile> {
    try {
      const response = await fetch(`${this.baseURL}/users/${id}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Validate and normalize
      const validated = UserProfileSchema.parse(data);

      return validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('API response validation failed:', error.errors);
        throw new Error('Invalid API response format');
      }
      throw error;
    }
  }

  async updateUser(id: number, updates: Partial<UserProfile>): Promise<UserProfile> {
    // Similar validation for updates
    const response = await fetch(`${this.baseURL}/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    const data = await response.json();
    return UserProfileSchema.parse(data);
  }
}

// Usage in component:
async function displayUserProfile(userId: number) {
  const api = new UserAPI();
  const user = await api.getUser(userId);

  // Type-safe access (TypeScript knows these can be undefined)
  const phone = user.phoneNumber ?? "Not provided";
  const dob = user.dateOfBirth ?? "Not specified";
  const street = user.address?.street ?? "No address";

  return {
    name: user.name,
    email: user.email,
    phone,
    dob,
    street,
    newsletter: user.preferences.newsletter
  };
}

// No crashes, fully type-safe! ✅
```

</details>

<details>
<summary><strong>⚖️ Trade-offs: null vs undefined</strong></summary>

**Comparison Matrix:**

| Aspect | undefined | null |
|--------|-----------|------|
| **Type** | undefined | object (bug!) |
| **Assignment** | Default (implicit) | Explicit only |
| **Meaning** | "Not defined yet" | "Intentionally empty" |
| **JSON.stringify** | Omitted in objects, null in arrays | Preserved |
| **Function return** | Default if no return | Must explicitly return |
| **Missing property** | Yes (automatic) | No (must be set) |
| **Function param** | Default if not passed | Must explicitly pass |
| **Performance** | Same | Same (both singletons) |
| **Checking** | === undefined or typeof | === null only |
| **Best practice** | Let JS use it naturally | Use for "no object" |

**When to Use Each:**

```javascript
// ✅ Use undefined (let JavaScript handle it):
// 1. Let variables start as undefined
let name; // undefined automatically
console.log(name); // undefined

// 2. Optional function parameters
function greet(name) {
  // name is undefined if not passed
  console.log(name ?? "Guest");
}

// 3. Let missing properties be undefined
const user = { name: "Alice" };
console.log(user.age); // undefined (automatic)

// 4. Don't explicitly return undefined
function getUser(id) {
  if (id > 0) {
    return { id, name: "Alice" };
  }
  // Implicitly returns undefined (don't write: return undefined;)
}


// ✅ Use null (explicit "no value"):
// 1. API responses indicating "not found"
async function fetchUser(id) {
  const response = await fetch(`/api/users/${id}`);
  if (response.status === 404) {
    return null; // Explicit: no user exists
  }
  return response.json();
}

// 2. Clearing object references
let heavyResource = new LargeObject();
// ... use it ...
heavyResource = null; // Explicitly clear for GC

// 3. Database NULL values
const dbUser = {
  id: 1,
  name: "Alice",
  middleName: null, // Represents SQL NULL
  age: 25
};

// 4. Intentionally empty fields
const form = {
  name: "Alice",
  phoneNumber: null, // User explicitly left blank
  email: "alice@example.com"
};

// 5. Prototype-less objects
const pureObj = Object.create(null); // No __proto__
```

**Checking Patterns:**

```javascript
// Pattern 1: Check for specific value
if (value === undefined) {
  // Definitely undefined
}

if (value === null) {
  // Definitely null
}

// Pattern 2: Check for either (nullish)
if (value == null) {
  // null OR undefined (only acceptable use of ==)
}

// Equivalent to:
if (value === null || value === undefined) {
  // More explicit but verbose
}

// Pattern 3: Nullish coalescing (modern, recommended)
const result = value ?? defaultValue;
// Use defaultValue if value is null OR undefined

// Pattern 4: Optional chaining (modern, recommended)
const city = user?.address?.city;
// Returns undefined if any level is null or undefined

// Pattern 5: Combining both
const name = user?.profile?.name ?? "Guest";
// Safe access + default value


// ❌ ANTI-PATTERNS TO AVOID:

// Bad: Checking undefined with typeof (verbose)
if (typeof value === "undefined") { }
// Better: value === undefined

// Bad: Checking null with typeof (doesn't work!)
if (typeof value === "null") { } // Never true!

// Bad: Truthy/falsy check (too broad)
if (!value) { } // Catches 0, false, "", null, undefined

// Bad: Using || (treats 0, false, "" as missing)
const count = value || 10; // Wrong if value is 0

// Bad: Explicitly setting undefined
const user = { name: "Alice", age: undefined }; // Don't do this
// Better: Just omit the property
const user = { name: "Alice" };
```

**API Response Patterns:**

```javascript
// Pattern 1: Omit null/undefined fields (recommended)
// Clean, smaller payload
{
  "user": {
    "id": 1,
    "name": "Alice",
    "email": "alice@example.com"
    // phoneNumber omitted (not provided)
  }
}

// Frontend access:
user.phoneNumber // undefined (property doesn't exist)


// Pattern 2: Include null for missing fields
// Explicit about what's missing
{
  "user": {
    "id": 1,
    "name": "Alice",
    "email": "alice@example.com",
    "phoneNumber": null // Explicit: no phone number
  }
}

// Frontend access:
user.phoneNumber // null (property exists but empty)


// Pattern 3: Mixed approach (often causes issues!)
// ❌ Avoid: Inconsistent
{
  "user": {
    "id": 1,
    "name": "Alice",
    "email": "alice@example.com",
    "phoneNumber": null, // null for some fields
    // middleName omitted (undefined for others)
  }
}

// Recommendation: Choose Pattern 1 or 2, be consistent!
```

**Performance Considerations:**

```javascript
// Both null and undefined have same performance
// (both are singletons, simple pointer comparison)

// Benchmark: 10M comparisons
const iterations = 10000000;

let value1 = undefined;
console.time('undefined check');
for (let i = 0; i < iterations; i++) {
  value1 === undefined;
}
console.timeEnd('undefined check'); // ~18ms

let value2 = null;
console.time('null check');
for (let i = 0; i < iterations; i++) {
  value2 === null;
}
console.timeEnd('null check'); // ~18ms (same!)

// Nullish check (both)
console.time('nullish check');
for (let i = 0; i < iterations; i++) {
  value1 == null;
}
console.timeEnd('nullish check'); // ~25ms (minimal overhead)

// Conclusion: Performance is not a factor in choosing
// Choose based on semantics, not speed
```

**JSON Serialization Implications:**

```javascript
// Understanding JSON behavior

const data = {
  name: "Alice",
  age: undefined,  // Will be omitted
  city: null,      // Will be preserved
  active: true
};

JSON.stringify(data);
// {"name":"Alice","city":null,"active":true}
// "age" is gone!

// Arrays: undefined becomes null
const arr = [1, undefined, null, 4];
JSON.stringify(arr);
// [1,null,null,4]
// undefined → null in arrays!

// Implications:
// 1. Use null if you want the field in JSON
// 2. Use undefined if you want it omitted
// 3. Be careful with arrays (undefined → null)

// Example: API contract
const apiResponse = {
  user: {
    id: 1,
    name: "Alice",
    email: "alice@example.com",
    phoneNumber: null, // Explicitly in JSON: "phoneNumber": null
    age: undefined     // Omitted from JSON
  }
};

const json = JSON.stringify(apiResponse);
// {"user":{"id":1,"name":"Alice","email":"alice@example.com","phoneNumber":null}}

const parsed = JSON.parse(json);
console.log("phoneNumber" in parsed.user); // true
console.log("age" in parsed.user);         // false
console.log(parsed.user.age);              // undefined (missing property)
console.log(parsed.user.phoneNumber);      // null (present, but null)
```

**Decision Matrix:**

| Scenario | Use undefined | Use null | Rationale |
|----------|--------------|----------|-----------|
| **Variable not initialized** | ✅ | ❌ | Let JS handle it |
| **Missing function param** | ✅ | ❌ | Automatic behavior |
| **Missing object property** | ✅ | ❌ | Natural JS behavior |
| **API "not found"** | ❌ | ✅ | Explicit intent |
| **Database NULL** | ❌ | ✅ | Matches SQL semantics |
| **Clear object reference** | ❌ | ✅ | Explicit GC hint |
| **Optional form field** | ❌ | ✅ | User chose not to fill |
| **Prototype-less object** | ❌ | ✅ | Object.create(null) |
| **JSON field must exist** | ❌ | ✅ | undefined is omitted |
| **JSON field can be omitted** | ✅ | ❌ | Smaller payload |

**Summary:**

```javascript
// ✅ RECOMMENDED APPROACH

// Let JavaScript use undefined naturally:
let name; // undefined
function greet(name) { } // undefined if not passed
const obj = { name: "Alice" }; // obj.age is undefined

// Use null explicitly for "no value":
async function fetchUser(id) {
  // Return null for "not found"
  return null;
}

const user = {
  name: "Alice",
  middleName: null // Explicitly no middle name
};

// Check for nullish (both):
const result = value ?? "default";
const city = user?.address?.city;

// Never:
// ❌ return undefined; (just return;)
// ❌ let x = undefined; (just let x;)
// ❌ obj.age = undefined; (just delete obj.age; or omit)
```

</details>

<details>
<summary><strong>💬 Explain to Junior: null vs undefined</strong></summary>

**Simple Analogy: Empty Box vs No Box**

Think of a delivery system:

```javascript
// undefined = No box arrived yet
let package; // undefined
console.log(package); // undefined (no package delivered)

// null = Empty box delivered intentionally
let emptyPackage = null;
console.log(emptyPackage); // null (box arrived, but it's empty)
```

**Another way to think about it:**

```javascript
// undefined = "I don't know" or "Not set yet"
let favoriteColor; // "I haven't decided my favorite color yet"
console.log(favoriteColor); // undefined

// null = "None" or "Intentionally blank"
let middleName = null; // "I don't have a middle name" (explicit)
console.log(middleName); // null
```

**Common Scenarios:**

```javascript
// 1. VARIABLES

// undefined = Variable exists but has no value
let name;
console.log(name); // undefined (forgot to assign)

// null = Explicitly set to "nothing"
let name = null;
console.log(name); // null (intentionally empty)


// 2. OBJECT PROPERTIES

const user = { name: "Alice" };

// undefined = Property doesn't exist
console.log(user.age); // undefined (no age property)

// null = Property exists but is empty
const user2 = { name: "Alice", age: null };
console.log(user2.age); // null (age exists, but empty)


// 3. FUNCTION RETURNS

// undefined = Function didn't return anything
function doSomething() {
  console.log("Hello");
  // No return statement
}
console.log(doSomething()); // undefined

// null = Function explicitly returns "nothing found"
function findUser(id) {
  if (id === 1) {
    return { name: "Alice" };
  }
  return null; // Explicitly: "no user found"
}
console.log(findUser(999)); // null
```

**Common Beginner Mistakes:**

```javascript
// ❌ MISTAKE 1: Using typeof to check null
if (typeof value === "null") { // Never works!
  console.log("It's null");
}
// Why? typeof null is "object" (a JavaScript bug!)

// ✅ Correct way:
if (value === null) {
  console.log("It's null");
}


// ❌ MISTAKE 2: Expecting null and undefined to be the same
console.log(null === undefined); // false (different types)
console.log(null == undefined);  // true (special case in JavaScript)

// Use === for specific check:
if (value === null) { } // Only null
if (value === undefined) { } // Only undefined

// Use == to check both:
if (value == null) { } // null OR undefined


// ❌ MISTAKE 3: Explicitly setting undefined
const user = {
  name: "Alice",
  age: undefined // Don't do this!
};

// ✅ Better: Just don't include the property
const user = {
  name: "Alice"
  // age is automatically undefined
};


// ❌ MISTAKE 4: Using ! to check for null/undefined
if (!value) {
  console.log("Missing!");
}
// Problem: Also catches 0, false, ""

// ✅ Better: Be specific
if (value == null) {
  console.log("Missing!");
}
```

**When Does JavaScript Give You undefined?**

```javascript
// 1. Uninitialized variable
let x;
console.log(x); // undefined

// 2. Missing function parameter
function greet(name) {
  console.log(name);
}
greet(); // undefined

// 3. Missing object property
const obj = { name: "Alice" };
console.log(obj.age); // undefined

// 4. Function without return
function test() {
  console.log("Hi");
}
console.log(test()); // undefined

// 5. Array out of bounds
const arr = [1, 2, 3];
console.log(arr[10]); // undefined
```

**When Should YOU Use null?**

```javascript
// 1. "Not found" in searches
function findUser(id) {
  const users = { 1: "Alice", 2: "Bob" };
  return users[id] || null; // null if not found
}

// 2. Clearing a value
let currentUser = { name: "Alice" };
// ... later ...
currentUser = null; // "No user logged in now"

// 3. Database NULL values
const dbUser = {
  id: 1,
  name: "Alice",
  middleName: null // No middle name in database
};

// 4. Optional form fields
const formData = {
  name: "Alice",
  phoneNumber: null // User left blank
};
```

**Modern JavaScript Helpers:**

```javascript
// 1. Nullish Coalescing (??)
// Use default value if null OR undefined

const name = username ?? "Guest";
// If username is null or undefined, use "Guest"

// Examples:
console.log(null ?? "default");      // "default"
console.log(undefined ?? "default"); // "default"
console.log(0 ?? "default");         // 0 (0 is valid!)
console.log("" ?? "default");        // "" (empty string is valid!)


// 2. Optional Chaining (?.)
// Safely access nested properties

const user = { name: "Alice" };

// Old way:
const city = user.address ? user.address.city : undefined;

// New way:
const city = user.address?.city;
// Returns undefined if address doesn't exist (safe!)


// 3. Combining both:
const city = user?.address?.city ?? "Unknown";
// Safe access + default value
```

**Practical Example:**

```javascript
// Bad: Confusing undefined and null
function getUserInfo(userId) {
  const user = findUser(userId); // Returns null if not found

  // This breaks!
  if (user === undefined) {
    return "User not initialized"; // Never triggers (user is null, not undefined!)
  }

  return user.name;
}


// Good: Handle both
function getUserInfoFixed(userId) {
  const user = findUser(userId); // Returns null if not found

  // Check for nullish (both null and undefined)
  if (user == null) {
    return "User not found";
  }

  return user.name;
}


// Better: Modern approach
function getUserInfoModern(userId) {
  const user = findUser(userId);

  // Use optional chaining + nullish coalescing
  return user?.name ?? "User not found";
}
```

**Explaining to PM:**

"null and undefined are like two types of 'nothing' in JavaScript:

**undefined** = 'Not set yet' or 'Forgot to fill this in'
- Like a form field that hasn't been touched
- JavaScript's default for missing things
- Automatic behavior

**null** = 'Intentionally empty' or 'No value exists'
- Like a form field that user deliberately left blank
- Explicit choice by the developer
- Deliberate action

**Problem we had:**
- Backend sometimes sent null, sometimes undefined
- Frontend code expected only undefined
- Result: App crashed when it saw null (350 crashes/day!)

**Solution:**
- Standardized to handle both null and undefined
- Used modern JavaScript (?? and ?.) to safely handle missing data
- Crashes dropped to 0

**Business value:**
- More reliable app (no crashes)
- Better user experience
- Less support tickets (90% reduction)
- Developers can code faster (clear rules)"

**Quick Reference:**

```javascript
// CHECKING:
value === undefined    // Only undefined
value === null         // Only null
value == null          // Both null AND undefined
value ?? "default"     // Default if null or undefined
obj?.prop              // Safe access (returns undefined if missing)

// WHEN TO USE:
// ✅ Let JavaScript use undefined:
let x;                 // Automatically undefined
function(param) { }    // Automatically undefined if not passed
{ name: "Alice" }      // Missing props are undefined

// ✅ Use null explicitly:
return null;           // "Not found"
obj.field = null;      // "Intentionally empty"
const x = null;        // "Clear this reference"

// ❌ NEVER:
return undefined;      // Just use: return;
let x = undefined;     // Just use: let x;
obj.field = undefined; // Just don't set the field
```

**Key Takeaways:**

1. **undefined** = JavaScript's default for missing things
2. **null** = Your explicit "nothing here"
3. Both mean "no value" but with different intent
4. Use `??` and `?.` to handle both safely
5. Check for both with `== null` or `?? `
6. Never use `typeof` to check null (it returns "object"!)

</details>

### Resources

- [MDN: null](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/null)
- [MDN: undefined](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined)
- [JavaScript.info: null and undefined](https://javascript.info/types#null)

---
