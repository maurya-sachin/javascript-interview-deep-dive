# JSON - Custom Serialization & Complex Types

> **Focus**: Advanced JSON serialization patterns and handling complex data structures

---

## Question 1: How do you implement custom JSON serialization and handle complex data types?

**Difficulty:** 🔴 Hard
**Frequency:** ⭐⭐⭐⭐
**Time:** 12-15 minutes
**Companies:** Google, Meta, Amazon, Netflix, Airbnb

### Question

JSON.stringify() has limitations when handling complex JavaScript data types. How do you implement custom serialization to properly handle:

- Non-serializable types (Date, Map, Set, RegExp, Error)
- Class instances with prototypes
- Circular references
- Special values (BigInt, Infinity, NaN, undefined, Symbol)
- Binary data (TypedArrays, Buffers)
- Symbol properties
- Custom toJSON() methods
- Replacer and reviver function patterns
- When to use third-party serialization libraries

### Answer

Custom JSON serialization extends JSON.stringify/parse to handle complex data types that standard JSON cannot represent. This requires implementing type-preservation strategies, handling circular references, and designing serialization/deserialization pipelines.

**Core Strategies:**

1. **toJSON() Method**: Add custom serialization logic to classes
2. **Replacer Functions**: Transform values during stringify
3. **Reviver Functions**: Restore values during parse
4. **Type Markers**: Embed type information (__type, __value)
5. **Circular Detection**: Use WeakSet/WeakMap to track references
6. **Schema Validation**: Ensure data integrity after deserialization

**Types Requiring Custom Handling:**

```javascript
// ❌ Standard JSON loses type information
const data = {
  date: new Date('2025-01-15'),
  map: new Map([['key', 'value']]),
  set: new Set([1, 2, 3]),
  regexp: /test/gi,
  error: new Error('Custom error'),
  bigint: 9007199254740991n,
  infinity: Infinity,
  nan: NaN,
  undef: undefined,
  symbol: Symbol('test'),
  binary: new Uint8Array([1, 2, 3])
};

JSON.parse(JSON.stringify(data));
// {
//   date: "2025-01-15T00:00:00.000Z",  // ❌ String, not Date
//   map: {},                            // ❌ Empty object
//   set: {},                            // ❌ Empty object
//   regexp: {},                         // ❌ Empty object
//   error: {},                          // ❌ Empty object
//   // bigint: throws TypeError          // ❌ Cannot serialize
//   infinity: null,                     // ❌ Becomes null
//   nan: null,                          // ❌ Becomes null
//   // undef: missing                   // ❌ Property removed
//   // symbol: missing                  // ❌ Property removed
//   binary: {0:1, 1:2, 2:3}            // ❌ Plain object
// }
```

**Implementation Requirements:**

- Preserve type information (Date vs ISO string)
- Handle circular references without infinite loops
- Restore prototype chain for class instances
- Support versioning for data migrations
- Balance serialization size vs fidelity
- Consider security (prototype pollution, code injection)

### Code Example

**1. toJSON() Method for Custom Classes:**

```javascript
class User {
  constructor(name, createdAt) {
    this.name = name;
    this.createdAt = createdAt;
    this.metadata = new Map([['role', 'admin']]);
  }

  // ✅ Custom serialization
  toJSON() {
    return {
      __type: 'User',
      __version: 1,
      name: this.name,
      createdAt: this.createdAt.toISOString(),
      metadata: Array.from(this.metadata.entries())
    };
  }

  // ✅ Static factory for deserialization
  static fromJSON(json) {
    const user = new User(json.name, new Date(json.createdAt));
    user.metadata = new Map(json.metadata);
    return user;
  }
}

const user = new User('Alice', new Date('2025-01-15'));
const json = JSON.stringify(user);
console.log(json);
// {"__type":"User","__version":1,"name":"Alice","createdAt":"2025-01-15T00:00:00.000Z","metadata":[["role","admin"]]}

const restored = User.fromJSON(JSON.parse(json));
console.log(restored instanceof User); // true
console.log(restored.metadata.get('role')); // "admin"
```

**2. Date Serialization/Deserialization:**

```javascript
// ❌ Lossy serialization
const data = { timestamp: new Date('2025-01-15T10:30:00Z') };
const restored = JSON.parse(JSON.stringify(data));
console.log(restored.timestamp instanceof Date); // false (it's a string)

// ✅ Type-preserving serialization
function serializeDate(date) {
  return { __type: 'Date', __value: date.toISOString() };
}

function deserializeDate(obj) {
  if (obj.__type === 'Date') {
    return new Date(obj.__value);
  }
  return obj;
}

// Using replacer/reviver
const data2 = { timestamp: new Date('2025-01-15T10:30:00Z') };

const json = JSON.stringify(data2, (key, value) => {
  if (value instanceof Date) {
    return serializeDate(value);
  }
  return value;
});

const restored2 = JSON.parse(json, (key, value) => {
  if (value && value.__type === 'Date') {
    return deserializeDate(value);
  }
  return value;
});

console.log(restored2.timestamp instanceof Date); // true
```

**3. Map and Set Serialization:**

```javascript
// ✅ Map serialization with type preservation
function serializeMap(map) {
  return {
    __type: 'Map',
    __value: Array.from(map.entries())
  };
}

function deserializeMap(obj) {
  if (obj.__type === 'Map') {
    return new Map(obj.__value);
  }
  return obj;
}

// ✅ Set serialization
function serializeSet(set) {
  return {
    __type: 'Set',
    __value: Array.from(set.values())
  };
}

function deserializeSet(obj) {
  if (obj.__type === 'Set') {
    return new Set(obj.__value);
  }
  return obj;
}

// Example usage
const data = {
  userRoles: new Map([
    ['alice', 'admin'],
    ['bob', 'user']
  ]),
  activeUsers: new Set(['alice', 'charlie'])
};

const json = JSON.stringify(data, (key, value) => {
  if (value instanceof Map) return serializeMap(value);
  if (value instanceof Set) return serializeSet(value);
  return value;
});

const restored = JSON.parse(json, (key, value) => {
  if (value && value.__type === 'Map') return deserializeMap(value);
  if (value && value.__type === 'Set') return deserializeSet(value);
  return value;
});

console.log(restored.userRoles instanceof Map); // true
console.log(restored.activeUsers instanceof Set); // true
console.log(restored.userRoles.get('alice')); // "admin"
```

**4. RegExp Serialization:**

```javascript
// ✅ RegExp serialization preserving flags
function serializeRegExp(regexp) {
  return {
    __type: 'RegExp',
    source: regexp.source,
    flags: regexp.flags
  };
}

function deserializeRegExp(obj) {
  if (obj.__type === 'RegExp') {
    return new RegExp(obj.source, obj.flags);
  }
  return obj;
}

const data = {
  emailPattern: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i,
  phonePattern: /^\+?[\d\s-()]+$/g
};

const json = JSON.stringify(data, (key, value) => {
  if (value instanceof RegExp) {
    return serializeRegExp(value);
  }
  return value;
});

const restored = JSON.parse(json, (key, value) => {
  if (value && value.__type === 'RegExp') {
    return deserializeRegExp(value);
  }
  return value;
});

console.log(restored.emailPattern instanceof RegExp); // true
console.log(restored.emailPattern.flags); // "i"
console.log(restored.emailPattern.test('TEST@EXAMPLE.COM')); // true
```

**5. Error Object Serialization:**

```javascript
// ✅ Error serialization with stack trace
function serializeError(error) {
  return {
    __type: 'Error',
    name: error.name,
    message: error.message,
    stack: error.stack,
    // Custom properties
    code: error.code,
    statusCode: error.statusCode
  };
}

function deserializeError(obj) {
  if (obj.__type === 'Error') {
    const error = new Error(obj.message);
    error.name = obj.name;
    error.stack = obj.stack;
    error.code = obj.code;
    error.statusCode = obj.statusCode;
    return error;
  }
  return obj;
}

class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

const error = new ValidationError('Invalid email', 'email');
error.statusCode = 400;

const json = JSON.stringify(error, (key, value) => {
  if (value instanceof Error) {
    return serializeError(value);
  }
  return value;
});

const restored = JSON.parse(json, (key, value) => {
  if (value && value.__type === 'Error') {
    return deserializeError(value);
  }
  return value;
});

console.log(restored instanceof Error); // true
console.log(restored.name); // "ValidationError"
console.log(restored.statusCode); // 400
```

**6. Circular Reference Handling:**

```javascript
// ❌ Circular references cause infinite loop
const obj = { name: 'Parent' };
obj.self = obj; // Circular reference
// JSON.stringify(obj); // TypeError: Converting circular structure to JSON

// ✅ Circular reference detection with WeakSet
function safeStringify(obj, space) {
  const seen = new WeakSet();

  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  }, space);
}

const circular = { name: 'Parent' };
circular.self = circular;
circular.child = { name: 'Child', parent: circular };

console.log(safeStringify(circular, 2));
// {
//   "name": "Parent",
//   "self": "[Circular]",
//   "child": {
//     "name": "Child",
//     "parent": "[Circular]"
//   }
// }

// ✅ Advanced: Preserve circular references with IDs
function stringifyWithRefs(obj) {
  const refs = new Map();
  let refId = 0;

  // First pass: assign IDs to objects
  function assignIds(value) {
    if (typeof value === 'object' && value !== null) {
      if (refs.has(value)) return;
      refs.set(value, refId++);
      Object.values(value).forEach(assignIds);
    }
  }
  assignIds(obj);

  // Second pass: replace circular refs with IDs
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return { __ref: refs.get(value) };
      }
      seen.add(value);
      value.__id = refs.get(value);
    }
    return value;
  });
}

function parseWithRefs(json) {
  const parsed = JSON.parse(json);
  const objects = new Map();

  // First pass: collect all objects by ID
  function collectObjects(value) {
    if (value && typeof value === 'object') {
      if (value.__id !== undefined) {
        objects.set(value.__id, value);
        delete value.__id;
      }
      Object.values(value).forEach(collectObjects);
    }
  }
  collectObjects(parsed);

  // Second pass: restore circular references
  function restoreRefs(value) {
    if (value && typeof value === 'object') {
      if (value.__ref !== undefined) {
        return objects.get(value.__ref);
      }
      for (const key in value) {
        value[key] = restoreRefs(value[key]);
      }
    }
    return value;
  }

  return restoreRefs(parsed);
}

const obj2 = { name: 'Parent' };
obj2.self = obj2;
const json2 = stringifyWithRefs(obj2);
const restored2 = parseWithRefs(json2);
console.log(restored2.self === restored2); // true (circular ref restored)
```

**7. Class Instance Serialization:**

```javascript
// Registry for class constructors
const classRegistry = new Map();

function registerClass(name, constructor) {
  classRegistry.set(name, constructor);
}

// ✅ Generic class serialization
function serializeInstance(instance) {
  const className = instance.constructor.name;
  if (!classRegistry.has(className)) {
    throw new Error(`Class ${className} not registered`);
  }

  return {
    __type: 'ClassInstance',
    __class: className,
    __data: { ...instance } // Copy own properties
  };
}

function deserializeInstance(obj) {
  if (obj.__type === 'ClassInstance') {
    const constructor = classRegistry.get(obj.__class);
    if (!constructor) {
      throw new Error(`Class ${obj.__class} not found in registry`);
    }

    const instance = Object.create(constructor.prototype);
    Object.assign(instance, obj.__data);
    return instance;
  }
  return obj;
}

class Product {
  constructor(name, price) {
    this.name = name;
    this.price = price;
  }

  getTax() {
    return this.price * 0.1;
  }

  getTotal() {
    return this.price + this.getTax();
  }
}

// Register the class
registerClass('Product', Product);

const product = new Product('Laptop', 1000);

const json = JSON.stringify(product, (key, value) => {
  if (value && value.constructor && value.constructor !== Object && value.constructor !== Array) {
    return serializeInstance(value);
  }
  return value;
});

const restored = JSON.parse(json, (key, value) => {
  if (value && value.__type === 'ClassInstance') {
    return deserializeInstance(value);
  }
  return value;
});

console.log(restored instanceof Product); // true
console.log(restored.getTotal()); // 1100 (methods work!)
```

**8. BigInt Serialization:**

```javascript
// ❌ BigInt throws error
const data = { largeNumber: 9007199254740991n };
// JSON.stringify(data); // TypeError: Do not know how to serialize a BigInt

// ✅ BigInt as string with type marker
function serializeBigInt(bigint) {
  return {
    __type: 'BigInt',
    __value: bigint.toString()
  };
}

function deserializeBigInt(obj) {
  if (obj.__type === 'BigInt') {
    return BigInt(obj.__value);
  }
  return obj;
}

const data2 = { largeNumber: 9007199254740991n };

const json = JSON.stringify(data2, (key, value) => {
  if (typeof value === 'bigint') {
    return serializeBigInt(value);
  }
  return value;
});

const restored = JSON.parse(json, (key, value) => {
  if (value && value.__type === 'BigInt') {
    return deserializeBigInt(value);
  }
  return value;
});

console.log(typeof restored.largeNumber); // "bigint"
console.log(restored.largeNumber === 9007199254740991n); // true
```

**9. TypedArray and Buffer Serialization:**

```javascript
// ✅ TypedArray serialization
function serializeTypedArray(typedArray) {
  return {
    __type: 'TypedArray',
    __arrayType: typedArray.constructor.name,
    __value: Array.from(typedArray)
  };
}

function deserializeTypedArray(obj) {
  if (obj.__type === 'TypedArray') {
    const TypedArrayConstructor = globalThis[obj.__arrayType];
    return new TypedArrayConstructor(obj.__value);
  }
  return obj;
}

const data = {
  buffer: new Uint8Array([255, 128, 64, 32]),
  floats: new Float32Array([1.5, 2.7, 3.9])
};

const json = JSON.stringify(data, (key, value) => {
  if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
    return serializeTypedArray(value);
  }
  return value;
});

const restored = JSON.parse(json, (key, value) => {
  if (value && value.__type === 'TypedArray') {
    return deserializeTypedArray(value);
  }
  return value;
});

console.log(restored.buffer instanceof Uint8Array); // true
console.log(restored.floats instanceof Float32Array); // true
console.log(Array.from(restored.buffer)); // [255, 128, 64, 32]
```

**10. Special Values (Infinity, NaN, undefined):**

```javascript
// ❌ Special values become null or are omitted
const data = {
  infinity: Infinity,
  negInfinity: -Infinity,
  nan: NaN,
  undef: undefined
};

console.log(JSON.stringify(data));
// {"infinity":null,"negInfinity":null,"nan":null}
// (undefined property is omitted)

// ✅ Preserve special values
function serializeSpecialValue(value) {
  if (value === Infinity) return { __type: 'Infinity' };
  if (value === -Infinity) return { __type: '-Infinity' };
  if (Number.isNaN(value)) return { __type: 'NaN' };
  if (value === undefined) return { __type: 'undefined' };
  return value;
}

function deserializeSpecialValue(obj) {
  if (obj && typeof obj === 'object' && obj.__type) {
    if (obj.__type === 'Infinity') return Infinity;
    if (obj.__type === '-Infinity') return -Infinity;
    if (obj.__type === 'NaN') return NaN;
    if (obj.__type === 'undefined') return undefined;
  }
  return obj;
}

const json = JSON.stringify(data, (key, value) => {
  return serializeSpecialValue(value);
});

const restored = JSON.parse(json, (key, value) => {
  return deserializeSpecialValue(value);
});

console.log(restored.infinity === Infinity); // true
console.log(Number.isNaN(restored.nan)); // true
console.log(restored.undef === undefined); // true
```

**11. Symbol Property Handling:**

```javascript
// ❌ Symbol properties are ignored
const sym = Symbol('id');
const data = { name: 'Alice', [sym]: 42 };

console.log(JSON.stringify(data)); // {"name":"Alice"}
// Symbol property is lost

// ✅ Preserve symbol properties
function stringifyWithSymbols(obj) {
  const symbolProps = Object.getOwnPropertySymbols(obj);
  const symbolData = {};

  symbolProps.forEach(sym => {
    symbolData[sym.description || sym.toString()] = obj[sym];
  });

  const enhanced = {
    ...obj,
    __symbols: symbolData
  };

  return JSON.stringify(enhanced);
}

function parseWithSymbols(json) {
  const parsed = JSON.parse(json);
  const symbols = parsed.__symbols;
  delete parsed.__symbols;

  if (symbols) {
    Object.entries(symbols).forEach(([key, value]) => {
      const sym = Symbol(key);
      parsed[sym] = value;
    });
  }

  return parsed;
}

const sym2 = Symbol('userId');
const obj = { name: 'Alice', [sym2]: 123 };

const json2 = stringifyWithSymbols(obj);
const restored = parseWithSymbols(json2);

console.log(Object.getOwnPropertySymbols(restored).length > 0); // true
```

**12. Versioned Serialization for Migrations:**

```javascript
// ✅ Version-aware serialization
class VersionedSerializer {
  constructor() {
    this.version = 2; // Current version
    this.migrations = {
      1: this.migrateV1toV2.bind(this)
    };
  }

  serialize(data) {
    return JSON.stringify({
      __version: this.version,
      __data: data
    });
  }

  deserialize(json) {
    const parsed = JSON.parse(json);
    let version = parsed.__version || 1;
    let data = parsed.__data || parsed; // Legacy support

    // Apply migrations
    while (version < this.version) {
      const migration = this.migrations[version];
      if (migration) {
        data = migration(data);
      }
      version++;
    }

    return data;
  }

  migrateV1toV2(data) {
    // V1 had 'username', V2 uses 'name'
    return {
      ...data,
      name: data.username,
      username: undefined
    };
  }
}

const serializer = new VersionedSerializer();

// Old V1 data
const v1Json = '{"username":"Alice","age":30}';
const restored = serializer.deserialize(v1Json);
console.log(restored); // { name: 'Alice', age: 30, username: undefined }

// New V2 data
const v2Data = { name: 'Bob', age: 25 };
const v2Json = serializer.serialize(v2Data);
console.log(v2Json); // {"__version":2,"__data":{"name":"Bob","age":25}}
```

**13. Complete Generic Serializer/Deserializer:**

```javascript
// ✅ Production-ready serializer
class SuperSerializer {
  constructor() {
    this.classRegistry = new Map();
  }

  registerClass(constructor) {
    this.classRegistry.set(constructor.name, constructor);
  }

  stringify(obj, space) {
    const seen = new WeakSet();

    const replacer = (key, value) => {
      // Handle circular references
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return { __type: 'Circular' };
        }
        seen.add(value);
      }

      // Date
      if (value instanceof Date) {
        return { __type: 'Date', __value: value.toISOString() };
      }

      // Map
      if (value instanceof Map) {
        return { __type: 'Map', __value: Array.from(value.entries()) };
      }

      // Set
      if (value instanceof Set) {
        return { __type: 'Set', __value: Array.from(value.values()) };
      }

      // RegExp
      if (value instanceof RegExp) {
        return { __type: 'RegExp', source: value.source, flags: value.flags };
      }

      // Error
      if (value instanceof Error) {
        return {
          __type: 'Error',
          name: value.name,
          message: value.message,
          stack: value.stack
        };
      }

      // BigInt
      if (typeof value === 'bigint') {
        return { __type: 'BigInt', __value: value.toString() };
      }

      // Special numbers
      if (value === Infinity) return { __type: 'Infinity' };
      if (value === -Infinity) return { __type: '-Infinity' };
      if (Number.isNaN(value)) return { __type: 'NaN' };

      // undefined
      if (value === undefined) return { __type: 'undefined' };

      // TypedArray
      if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
        return {
          __type: 'TypedArray',
          __arrayType: value.constructor.name,
          __value: Array.from(value)
        };
      }

      // Custom class instances
      if (value && value.constructor && this.classRegistry.has(value.constructor.name)) {
        return {
          __type: 'ClassInstance',
          __class: value.constructor.name,
          __data: { ...value }
        };
      }

      return value;
    };

    return JSON.stringify(obj, replacer, space);
  }

  parse(json) {
    const reviver = (key, value) => {
      if (value && typeof value === 'object' && value.__type) {
        switch (value.__type) {
          case 'Date':
            return new Date(value.__value);

          case 'Map':
            return new Map(value.__value);

          case 'Set':
            return new Set(value.__value);

          case 'RegExp':
            return new RegExp(value.source, value.flags);

          case 'Error': {
            const error = new Error(value.message);
            error.name = value.name;
            error.stack = value.stack;
            return error;
          }

          case 'BigInt':
            return BigInt(value.__value);

          case 'Infinity':
            return Infinity;

          case '-Infinity':
            return -Infinity;

          case 'NaN':
            return NaN;

          case 'undefined':
            return undefined;

          case 'TypedArray': {
            const TypedArrayConstructor = globalThis[value.__arrayType];
            return new TypedArrayConstructor(value.__value);
          }

          case 'ClassInstance': {
            const constructor = this.classRegistry.get(value.__class);
            if (constructor) {
              const instance = Object.create(constructor.prototype);
              Object.assign(instance, value.__data);
              return instance;
            }
            return value.__data;
          }

          case 'Circular':
            return '[Circular]';
        }
      }
      return value;
    };

    return JSON.parse(json, reviver);
  }
}

// Example usage
class Account {
  constructor(id, balance) {
    this.id = id;
    this.balance = balance;
  }

  deposit(amount) {
    this.balance += amount;
  }
}

const serializer = new SuperSerializer();
serializer.registerClass(Account);

const complexData = {
  timestamp: new Date('2025-01-15T10:30:00Z'),
  users: new Map([
    ['alice', { age: 30, roles: new Set(['admin', 'user']) }],
    ['bob', { age: 25, roles: new Set(['user']) }]
  ]),
  pattern: /^[a-z]+$/i,
  stats: {
    infinity: Infinity,
    nan: NaN,
    largeNum: 9007199254740991n
  },
  buffer: new Uint8Array([1, 2, 3]),
  account: new Account('acc123', 1000)
};

const json = serializer.stringify(complexData, 2);
console.log(json);

const restored = serializer.parse(json);
console.log(restored.timestamp instanceof Date); // true
console.log(restored.users instanceof Map); // true
console.log(restored.users.get('alice').roles instanceof Set); // true
console.log(restored.pattern instanceof RegExp); // true
console.log(restored.stats.infinity === Infinity); // true
console.log(typeof restored.stats.largeNum === 'bigint'); // true
console.log(restored.buffer instanceof Uint8Array); // true
console.log(restored.account instanceof Account); // true
console.log(typeof restored.account.deposit); // "function"
```

**14. Performance-Optimized Pattern:**

```javascript
// ✅ Fast path for simple objects, slow path for complex
class OptimizedSerializer {
  static stringify(obj) {
    // Fast path: try standard JSON first
    try {
      const json = JSON.stringify(obj);
      // Quick check if it round-trips correctly
      const test = JSON.parse(json);
      if (this.isEqual(obj, test)) {
        return json; // Fast path succeeded
      }
    } catch (e) {
      // Fall through to slow path
    }

    // Slow path: use full serializer
    const serializer = new SuperSerializer();
    return serializer.stringify(obj);
  }

  static isEqual(a, b) {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (typeof a !== 'object' || a === null) return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;

    return keysA.every(key => this.isEqual(a[key], b[key]));
  }
}

// Benchmark
const simpleObj = { name: 'Alice', age: 30, active: true };
const complexObj = {
  date: new Date(),
  map: new Map([['key', 'value']]),
  set: new Set([1, 2, 3])
};

console.time('Simple object');
for (let i = 0; i < 10000; i++) {
  OptimizedSerializer.stringify(simpleObj);
}
console.timeEnd('Simple object'); // Fast path ~5ms

console.time('Complex object');
for (let i = 0; i < 10000; i++) {
  OptimizedSerializer.stringify(complexObj);
}
console.timeEnd('Complex object'); // Slow path ~150ms
```

**15. Security Considerations:**

```javascript
// ⚠️ Note: JSON.parse() alone does NOT pollute Object.prototype —
// "__proto__" is created as a plain own data property, not through the
// prototype setter. The risk shows up later, if this parsed object is
// passed into an unsafe recursive merge/extend function.
const maliciousJson = '{"__proto__":{"isAdmin":true}}';
const obj = JSON.parse(maliciousJson);
const newObj = {};
console.log(newObj.isAdmin); // undefined (NOT polluted by JSON.parse itself)

// Still worth blocking dangerous keys defensively before merging untrusted data:
// ✅ Safe reviver with validation
class SafeSerializer {
  static DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype'];

  static parse(json, options = {}) {
    const { allowedTypes = new Set(), maxDepth = 10 } = options;

    let currentDepth = 0;

    const reviver = (key, value) => {
      // Block dangerous keys
      if (this.DANGEROUS_KEYS.includes(key)) {
        throw new Error(`Dangerous key detected: ${key}`);
      }

      // Track depth
      if (typeof value === 'object' && value !== null) {
        currentDepth++;
        if (currentDepth > maxDepth) {
          throw new Error('Maximum depth exceeded');
        }
      }

      // Validate type markers
      if (value && value.__type) {
        if (!allowedTypes.has(value.__type)) {
          throw new Error(`Type not allowed: ${value.__type}`);
        }
      }

      return value;
    };

    try {
      currentDepth = 0;
      return JSON.parse(json, reviver);
    } catch (e) {
      console.error('Deserialization failed:', e.message);
      throw e;
    }
  }
}

// Usage
const safeJson = '{"name":"Alice","age":30}';
const safe = SafeSerializer.parse(safeJson, {
  allowedTypes: new Set(['Date', 'Map', 'Set']),
  maxDepth: 5
});
console.log(safe);

try {
  const unsafe = SafeSerializer.parse(maliciousJson);
} catch (e) {
  console.log('Attack blocked:', e.message); // "Dangerous key detected: __proto__"
}
```

**16. Real-World: localStorage State Persistence:**

```javascript
// ✅ Production state manager with persistence
class StateManager {
  constructor(storageKey = 'app_state') {
    this.storageKey = storageKey;
    this.serializer = new SuperSerializer();
    this.state = this.load() || this.getInitialState();
  }

  getInitialState() {
    return {
      user: null,
      preferences: new Map(),
      cache: new Map(),
      lastSync: null
    };
  }

  save() {
    try {
      const json = this.serializer.stringify(this.state);

      // Check size (localStorage has ~5-10MB limit)
      const sizeKB = new Blob([json]).size / 1024;
      if (sizeKB > 5000) {
        console.warn(`State too large: ${sizeKB}KB`);
        this.compressState();
      }

      localStorage.setItem(this.storageKey, json);
      console.log(`State saved (${sizeKB.toFixed(2)}KB)`);
    } catch (e) {
      console.error('Failed to save state:', e);
      this.handleSaveError(e);
    }
  }

  load() {
    try {
      const json = localStorage.getItem(this.storageKey);
      if (!json) return null;

      const state = this.serializer.parse(json);
      console.log('State loaded successfully');
      return state;
    } catch (e) {
      console.error('Failed to load state:', e);
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }

  compressState() {
    // Remove old cache entries
    const cache = this.state.cache;
    const oneHourAgo = Date.now() - 3600000;

    for (const [key, value] of cache.entries()) {
      if (value.timestamp < oneHourAgo) {
        cache.delete(key);
      }
    }
  }

  handleSaveError(error) {
    if (error.name === 'QuotaExceededError') {
      console.log('Storage quota exceeded, clearing cache');
      this.state.cache.clear();
      this.save(); // Retry
    }
  }

  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.save();
  }

  getState() {
    return this.state;
  }
}

// Usage
const stateManager = new StateManager();

stateManager.setState({
  user: { id: 1, name: 'Alice' },
  preferences: new Map([
    ['theme', 'dark'],
    ['language', 'en']
  ]),
  lastSync: new Date()
});

// Reload page - state persists
const restored = stateManager.getState();
console.log(restored.preferences instanceof Map); // true
console.log(restored.lastSync instanceof Date); // true
```

**17. Comparison with Third-Party Libraries:**

```javascript
// Using flatted (circular reference handling)
import { stringify, parse } from 'flatted';

const circular = { name: 'Parent' };
circular.self = circular;

const json = stringify(circular);
const restored = parse(json);
console.log(restored.self === restored); // true

// Using superjson (type preservation)
import superjson from 'superjson';

const data = {
  date: new Date(),
  map: new Map([['key', 'value']]),
  set: new Set([1, 2, 3]),
  bigint: 9007199254740991n,
  regex: /test/gi
};

const { json, meta } = superjson.serialize(data);
const restored = superjson.deserialize({ json, meta });
console.log(restored.date instanceof Date); // true
console.log(restored.map instanceof Map); // true

// Using devalue (comprehensive serialization)
import { stringify, parse } from 'devalue';

const complexData = {
  date: new Date(),
  map: new Map([['key', 'value']]),
  set: new Set([1, 2, 3]),
  regex: /test/gi,
  undefined: undefined,
  nan: NaN,
  infinity: Infinity
};

const json = stringify(complexData);
const restored = parse(json);
console.log(restored.date instanceof Date); // true
console.log(restored.undefined === undefined); // true
```

**18. MessagePack Alternative:**

```javascript
// MessagePack: Binary serialization (smaller, faster)
import msgpack from 'msgpack-lite';

const data = {
  id: 12345,
  name: 'Alice',
  tags: ['admin', 'user'],
  active: true,
  timestamp: Date.now()
};

// JSON
const jsonStr = JSON.stringify(data);
console.log('JSON size:', jsonStr.length); // ~100 bytes

// MessagePack
const packed = msgpack.encode(data);
console.log('MessagePack size:', packed.length); // ~60 bytes (40% smaller!)

// Decode
const unpacked = msgpack.decode(packed);
console.log(unpacked); // Same structure

// ✅ Use MessagePack when:
// - Size matters (mobile, bandwidth-limited)
// - Binary data is common
// - Performance is critical
// - Not debugging (binary not human-readable)

// ✅ Use JSON when:
// - Human readability needed
// - Wide compatibility required
// - Debugging during development
// - Browser APIs require it (localStorage, postMessage)
```

**19. Protocol Buffers Alternative:**

```javascript
// Protocol Buffers: Schema-based serialization
// user.proto
/*
syntax = "proto3";

message User {
  int32 id = 1;
  string name = 2;
  repeated string tags = 3;
  bool active = 4;
  int64 timestamp = 5;
}
*/

// Using protobuf.js
import protobuf from 'protobufjs';

const root = await protobuf.load('user.proto');
const User = root.lookupType('User');

const user = {
  id: 12345,
  name: 'Alice',
  tags: ['admin', 'user'],
  active: true,
  timestamp: Date.now()
};

// Encode
const message = User.create(user);
const buffer = User.encode(message).finish();
console.log('Protobuf size:', buffer.length); // ~25 bytes (75% smaller than JSON!)

// Decode
const decoded = User.decode(buffer);
console.log(User.toObject(decoded));

// ✅ Use Protocol Buffers when:
// - Strict schema required
// - Cross-language compatibility (Go, Java, Python)
// - Maximum performance needed
// - Backwards compatibility important (schema evolution)

// ❌ Avoid when:
// - Dynamic schemas (frequent changes)
// - JavaScript-only environment
// - Simple use cases (overkill)
```

**20. Decision Matrix:**

```javascript
/*
SERIALIZATION FORMAT COMPARISON:

┌──────────────────┬──────────┬───────────┬─────────────┬──────────────┐
│ Feature          │ JSON     │ MessagePack│ ProtoBuf   │ Custom JSON  │
├──────────────────┼──────────┼───────────┼─────────────┼──────────────┤
│ Size             │ ★★★☆☆    │ ★★★★☆     │ ★★★★★       │ ★★★☆☆        │
│ Speed            │ ★★★★☆    │ ★★★★★     │ ★★★★★       │ ★★★☆☆        │
│ Human Readable   │ ★★★★★    │ ☆☆☆☆☆     │ ☆☆☆☆☆       │ ★★★★★        │
│ Type Preservation│ ★☆☆☆☆    │ ★★★☆☆     │ ★★★★☆       │ ★★★★★        │
│ Browser Support  │ ★★★★★    │ ★★★★☆     │ ★★★☆☆       │ ★★★★★        │
│ Schema Required  │ No       │ No        │ Yes         │ No           │
│ Circular Refs    │ No       │ No        │ No          │ Yes (custom) │
│ Learning Curve   │ ★☆☆☆☆    │ ★★☆☆☆     │ ★★★★☆       │ ★★★☆☆        │
└──────────────────┴──────────┴───────────┴─────────────┴──────────────┘

USE CASES:

JSON + Custom Serializer:
✅ localStorage persistence
✅ Browser APIs (postMessage, IndexedDB)
✅ Complex types (Map, Set, Date, RegExp)
✅ Circular references
✅ Debugging (human-readable)

MessagePack:
✅ WebSocket communication
✅ Mobile apps (bandwidth limited)
✅ Binary data (images, files)
✅ High-frequency updates

Protocol Buffers:
✅ Microservices (cross-language)
✅ gRPC communication
✅ Strict schemas
✅ Version compatibility

Standard JSON:
✅ REST APIs
✅ Configuration files
✅ Simple objects
✅ Wide compatibility
*/

// Example decision function
function chooseSerializer(context) {
  const {
    needsHumanReadable,
    needsTypePreservation,
    needsCircularRefs,
    needsSmallSize,
    needsMaxSpeed,
    crossLanguage
  } = context;

  if (crossLanguage) {
    return 'ProtocolBuffers';
  }

  if (needsCircularRefs || needsTypePreservation) {
    return 'CustomJSON';
  }

  if (needsMaxSpeed && needsSmallSize && !needsHumanReadable) {
    return 'MessagePack';
  }

  if (needsHumanReadable) {
    return 'JSON';
  }

  return 'JSON'; // Default
}

// Usage
const webAppContext = {
  needsHumanReadable: true,
  needsTypePreservation: true,
  needsCircularRefs: false,
  needsSmallSize: false,
  needsMaxSpeed: false,
  crossLanguage: false
};

console.log(chooseSerializer(webAppContext)); // "CustomJSON"

const microserviceContext = {
  needsHumanReadable: false,
  needsTypePreservation: false,
  needsCircularRefs: false,
  needsSmallSize: true,
  needsMaxSpeed: true,
  crossLanguage: true
};

console.log(chooseSerializer(microserviceContext)); // "ProtocolBuffers"
```


<details>
<summary><strong>🔍 Deep Dive: JSON Serialization</strong></summary>


**Why Custom Serialization is Needed:**

JSON is designed for simple data interchange, not for preserving complex JavaScript semantics. It has fundamental limitations:

1. **No Type Information**: JSON has only 7 types (string, number, boolean, null, object, array). JavaScript has many more (Date, Map, Set, RegExp, Error, Symbol, BigInt, TypedArrays).

2. **No Reference Equality**: JSON serialization creates new objects, losing reference identity. Circular references cause errors.

3. **Lossy Conversions**: Special values (Infinity, NaN, undefined) are converted or omitted.

4. **No Prototype Chain**: Class instances become plain objects, losing methods.

**Type Information Preservation Strategies:**

**1. Type Marker Pattern (`__type` field):**

```javascript
// Embed type information in serialized data
{
  "__type": "Date",
  "__value": "2025-01-15T10:30:00.000Z"
}
```

**Pros:**
- Simple to implement
- Works with standard JSON
- Self-describing data
- Easy to debug (human-readable)

**Cons:**
- Increases serialization size (10-20%)
- Property name conflicts (__type collision)
- No schema validation
- Manual type handling in reviver

**2. Schema-Based Serialization:**

```javascript
// Define schema separately
const schema = {
  timestamp: 'Date',
  users: 'Map<string, User>',
  settings: 'Set<string>'
};

// Serialize with schema reference
{
  "__schema": "UserStateV1",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "users": [["alice", {...}]],
  "settings": ["dark", "en"]
}
```

**Pros:**
- Smaller serialization (no type markers per value)
- Strong typing (TypeScript integration)
- Validation at deserialization
- Schema evolution support

**Cons:**
- More complex implementation
- Schema must be available at runtime
- Breaking changes require migration
- Overhead for dynamic schemas

**3. Runtime Introspection:**

```javascript
// Detect types at serialization time
function detectType(value) {
  if (value instanceof Date) return 'Date';
  if (value instanceof Map) return 'Map';
  if (value instanceof Set) return 'Set';
  // ...
}
```

**Pros:**
- No manual type annotations
- Automatic type detection
- Works with existing code

**Cons:**
- Performance overhead (instanceof checks)
- Cannot detect custom classes without registry
- Ambiguity (custom class vs plain object)

**Circular Reference Detection Algorithms:**

**1. WeakSet Approach (Memory Efficient):**

```javascript
function safeStringify(obj) {
  const seen = new WeakSet();

  return JSON.stringify(obj, function(key, value) {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  });
}

// ✅ Pros:
// - Memory efficient (WeakSet doesn't prevent GC)
// - Fast lookup (O(1))
// - No memory leaks

// ❌ Cons:
// - Cannot restore circular references
// - Replaces circular refs with string
// - Lossy serialization
```

**2. Reference ID Approach (Preserving):**

```javascript
function stringifyWithRefs(obj) {
  const refs = new Map();
  let refId = 0;

  // Pass 1: Assign IDs
  function assignIds(value) {
    if (typeof value === 'object' && value !== null) {
      if (refs.has(value)) return;
      refs.set(value, refId++);
      Object.values(value).forEach(assignIds);
    }
  }
  assignIds(obj);

  // Pass 2: Serialize with ref IDs
  const seen = new WeakSet();
  return JSON.stringify(obj, function(key, value) {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return { __ref: refs.get(value) };
      }
      seen.add(value);
      value.__id = refs.get(value);
    }
    return value;
  });
}

// ✅ Pros:
// - Preserves circular references
// - Can fully restore object graph
// - Maintains reference identity

// ❌ Cons:
// - Two-pass algorithm (slower)
// - More complex deserialization
// - Larger serialization size
// - Modifies original object (__id property)
```

**3. Path-Based Approach:**

```javascript
function stringifyWithPaths(obj) {
  const seen = new Map(); // value -> path

  function serialize(value, path = '$') {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return { __ref: seen.get(value) };
      }
      seen.set(value, path);

      if (Array.isArray(value)) {
        return value.map((item, i) => serialize(item, `${path}[${i}]`));
      } else {
        const result = {};
        for (const key in value) {
          result[key] = serialize(value[key], `${path}.${key}`);
        }
        return result;
      }
    }
    return value;
  }

  return JSON.stringify(serialize(obj));
}

// ✅ Pros:
// - Human-readable paths (debugging)
// - Can restore references with path resolution
// - No object modification

// ❌ Cons:
// - Complex path resolution logic
// - Larger serialization size (full paths)
// - Slower (string concatenation)
```

**Performance Analysis:**

```javascript
// Benchmark different approaches
const testData = createComplexObject(1000); // 1000 nested objects

console.time('Standard JSON (fails on circular)');
try { JSON.stringify(testData); } catch(e) {}
console.timeEnd('Standard JSON (fails on circular)'); // ~5ms (error)

console.time('WeakSet approach');
safeStringifyWeakSet(testData);
console.timeEnd('WeakSet approach'); // ~15ms

console.time('Reference ID approach');
stringifyWithRefs(testData);
console.timeEnd('Reference ID approach'); // ~45ms (2 passes)

console.time('Path-based approach');
stringifyWithPaths(testData);
console.timeEnd('Path-based approach'); // ~80ms (string concat)

/*
PERFORMANCE COMPARISON (10,000 objects):

┌──────────────────────┬──────────┬────────────┬─────────────┐
│ Approach             │ Time     │ Size       │ Restorable  │
├──────────────────────┼──────────┼────────────┼─────────────┤
│ Standard JSON        │ ~50ms    │ 100KB      │ ❌ (fails)  │
│ WeakSet              │ ~150ms   │ 105KB      │ ❌          │
│ Reference ID         │ ~450ms   │ 120KB      │ ✅          │
│ Path-based           │ ~800ms   │ 180KB      │ ✅          │
│ flatted library      │ ~200ms   │ 125KB      │ ✅          │
└──────────────────────┴──────────┴────────────┴─────────────┘

Recommendation: Use flatted library for production (optimized C++ implementation)
*/
```

**V8 Optimization Opportunities:**

1. **Monomorphic Property Access**: Keep object shapes consistent

```javascript
// ✅ Good: Consistent shape
const obj1 = { __type: 'Date', __value: '...' };
const obj2 = { __type: 'Map', __value: [...] };
const obj3 = { __type: 'Set', __value: [...] };

// ❌ Bad: Polymorphic shapes
const obj1 = { __type: 'Date', value: '...' }; // different property name
const obj2 = { __type: 'Map', __value: [...], extra: true }; // extra property
```

2. **Hidden Classes**: Initialize all properties in constructor

```javascript
// ✅ Good: All properties initialized
class SerializedValue {
  constructor(type, value) {
    this.__type = type;
    this.__value = value;
    this.__version = 1; // Initialize even if unused
  }
}

// ❌ Bad: Properties added dynamically
class SerializedValue {
  constructor(type, value) {
    this.__type = type;
    this.__value = value;
    // __version added later causes shape change
  }
}
```

3. **Avoid `delete` operator**: Causes deoptimization

```javascript
// ✅ Good: Set to undefined
obj.__temp = undefined;

// ❌ Bad: Delete property
delete obj.__temp; // Causes hidden class change
```

**Streaming Serialization for Large Objects:**

```javascript
// For very large objects (>100MB), stream serialization
class StreamingSerializer {
  async *streamStringify(obj, chunkSize = 1024) {
    let buffer = '';
    const stack = [{ value: obj, isArray: Array.isArray(obj), index: 0 }];

    buffer += Array.isArray(obj) ? '[' : '{';

    while (stack.length > 0) {
      const current = stack[stack.length - 1];

      // ... streaming logic ...

      if (buffer.length >= chunkSize) {
        yield buffer;
        buffer = '';
      }
    }

    if (buffer) yield buffer;
  }
}

// Usage with ReadableStream
const serializer = new StreamingSerializer();
const stream = new ReadableStream({
  async start(controller) {
    for await (const chunk of serializer.streamStringify(largeObject)) {
      controller.enqueue(chunk);
    }
    controller.close();
  }
});

// Send over network without loading entire JSON in memory
await fetch('/api/upload', {
  method: 'POST',
  body: stream,
  headers: { 'Content-Type': 'application/json' }
});
```

**Compression Strategies:**

```javascript
// Combine serialization with compression
import pako from 'pako';

function compressedStringify(obj) {
  const json = JSON.stringify(obj);
  const compressed = pako.gzip(json);
  return compressed;
}

function compressedParse(compressed) {
  const json = pako.ungzip(compressed, { to: 'string' });
  return JSON.parse(json);
}

// Benchmark
const largeData = createLargeObject(10000);

const json = JSON.stringify(largeData);
console.log('Original size:', json.length); // 1,500,000 bytes

const compressed = compressedStringify(largeData);
console.log('Compressed size:', compressed.length); // 150,000 bytes (90% reduction!)

/*
COMPRESSION COMPARISON:

┌──────────────┬─────────────┬──────────────┬─────────────┐
│ Method       │ Size        │ Comp Time    │ Decomp Time │
├──────────────┼─────────────┼──────────────┼─────────────┤
│ None         │ 1,500 KB    │ 0ms          │ 0ms         │
│ gzip         │ 150 KB (10%)│ 45ms         │ 15ms        │
│ brotli       │ 130 KB (9%) │ 120ms        │ 20ms        │
│ LZ4          │ 200 KB (13%)│ 15ms         │ 5ms         │
└──────────────┴─────────────┴──────────────┴─────────────┘

Recommendation:
- gzip: Best balance (widely supported, good compression)
- brotli: Best compression (slower, modern browsers)
- LZ4: Fastest (use for real-time data)
*/
```

**Security Considerations:**

**1. Prototype Pollution (downstream of JSON.parse, not caused by it):**

```javascript
// ⚠️ JSON.parse() itself does not pollute Object.prototype — it creates
// "__proto__" as a plain own data property. Real pollution happens only
// if the parsed object is later fed into an unsafe recursive merge.
const malicious = '{"__proto__":{"isAdmin":true}}';
JSON.parse(malicious);

const user = {};
console.log(user.isAdmin); // undefined (NOT polluted)

// Still good practice to block dangerous keys before merging untrusted data:
// ✅ Safe parsing
function safeParse(json) {
  return JSON.parse(json, (key, value) => {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      throw new Error(`Dangerous key: ${key}`);
    }
    return value;
  });
}
```

**2. Code Injection via reviver:**

```javascript
// ❌ Dangerous: Executing arbitrary code
const malicious = '{"__type":"Function","__value":"console.log(\\"pwned\\")"}';

JSON.parse(malicious, (key, value) => {
  if (value.__type === 'Function') {
    return new Function(value.__value); // ❌ Code injection!
  }
  return value;
});

// ✅ Safe: Whitelist allowed types
const ALLOWED_TYPES = new Set(['Date', 'Map', 'Set', 'RegExp']);

JSON.parse(json, (key, value) => {
  if (value.__type && !ALLOWED_TYPES.has(value.__type)) {
    throw new Error(`Type not allowed: ${value.__type}`);
  }
  // ... safe type restoration ...
  return value;
});
```

**3. Denial of Service (DoS):**

```javascript
// ❌ Vulnerable: Unlimited depth/size
const malicious = generateDeeplyNested(100000); // 100k levels deep
JSON.parse(JSON.stringify(malicious)); // Stack overflow!

// ✅ Safe: Limit depth and size
function safeParse(json, options = {}) {
  const { maxDepth = 20, maxSize = 1024 * 1024 } = options;

  if (json.length > maxSize) {
    throw new Error(`JSON too large: ${json.length} > ${maxSize}`);
  }

  let depth = 0;
  return JSON.parse(json, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      depth++;
      if (depth > maxDepth) {
        throw new Error(`Maximum depth exceeded: ${depth} > ${maxDepth}`);
      }
    }
    return value;
  });
}
```

**Comparison: JSON vs Alternative Formats:**

| Feature | JSON | MessagePack | Protocol Buffers | CBOR |
|---------|------|-------------|------------------|------|
| **Size** | 100% | 60-70% | 40-50% | 55-65% |
| **Speed (encode)** | Fast | Faster | Fastest | Fast |
| **Speed (decode)** | Fast | Faster | Fastest | Fast |
| **Human Readable** | Yes | No | No | No |
| **Schema** | No | No | Required | No |
| **Browser Support** | Native | Library | Library | Library |
| **Type System** | Limited | Rich | Very Rich | Rich |
| **Streaming** | Possible | Yes | Yes | Yes |
| **Standardization** | RFC 8259 | Yes | Yes | RFC 8949 |

**When to Use Each:**

- **JSON**: Web APIs, config files, debugging, localStorage
- **MessagePack**: WebSocket, mobile apps, binary data
- **Protocol Buffers**: Microservices, gRPC, strict schemas
- **CBOR**: IoT, constrained devices, space-critical


</details>


<details>
<summary><strong>🐛 Real-World Scenario: JSON Serialization</strong></summary>


**Context:**
A state management library (similar to Redux) with a persistence middleware for saving app state to localStorage. The library is used by a large e-commerce application with ~50,000 daily active users.

**Problem:**
After implementing persistence, users reported data loss and incorrect behavior after page reloads. Bug reports included:

- Shopping cart items losing custom configurations (Maps became empty objects)
- User preferences reset (Sets became empty)
- Date filters defaulting to current date instead of saved selections
- Custom validation rules (RegExp) not working
- Product comparison feature broken (circular references in product catalog)

**Impact Metrics:**
- **234 bug reports** in first week after release
- **15% increase in cart abandonment** (users losing items)
- **$15,000 in support costs** (customer service tickets)
- **4.2 → 3.1 star rating** on app stores
- **12% user churn** (frustrated users leaving)

**Investigation Steps:**

1. **localStorage Inspection:**
```javascript
// What was saved
localStorage.getItem('app_state');
// {
//   "cart": {
//     "items": {},  // ❌ Was a Map
//     "promo": {}   // ❌ Was a Set
//   },
//   "filters": {
//     "startDate": "2025-01-01T00:00:00.000Z",  // ❌ String, not Date
//     "pattern": {}  // ❌ Was RegExp
//   }
// }
```

2. **Type Loss Analysis:**
```javascript
// Before persistence
state.cart.items instanceof Map; // true
state.cart.promo instanceof Set; // true
state.filters.startDate instanceof Date; // true
state.filters.pattern instanceof RegExp; // true

// After reload
state.cart.items instanceof Map; // false (plain object!)
state.cart.promo instanceof Set; // false (plain object!)
state.filters.startDate instanceof Date; // false (string!)
state.filters.pattern instanceof RegExp; // false (empty object!)
```

3. **Circular Reference Discovery:**
```javascript
// Product catalog had circular refs
const catalog = {
  products: [
    { id: 1, name: 'Laptop', related: [] }
  ]
};
catalog.products[0].related.push(catalog.products[0]); // Circular!

// Saving threw error
localStorage.setItem('catalog', JSON.stringify(catalog));
// TypeError: Converting circular structure to JSON
```

**Root Cause:**

Standard `JSON.stringify()` was used for persistence:

```javascript
// ❌ Original implementation
class PersistenceMiddleware {
  save(state) {
    const json = JSON.stringify(state); // Loses types!
    localStorage.setItem('state', json);
  }

  load() {
    const json = localStorage.getItem('state');
    return json ? JSON.parse(json) : null; // Returns plain objects!
  }
}
```

**Limitations discovered:**
1. Map → `{}` (empty object)
2. Set → `{}` (empty object)
3. Date → ISO string (not Date instance)
4. RegExp → `{}` (empty object)
5. Circular refs → Error (crash)

**Solution Implementation:**

**Step 1: Custom Serializer with Type Markers**

```javascript
class TypePreservingSerializer {
  constructor() {
    this.typeHandlers = new Map([
      [Date, this.serializeDate],
      [Map, this.serializeMap],
      [Set, this.serializeSet],
      [RegExp, this.serializeRegExp],
      [Error, this.serializeError]
    ]);
  }

  serializeDate(date) {
    return { __type: 'Date', __value: date.toISOString() };
  }

  serializeMap(map) {
    return { __type: 'Map', __value: Array.from(map.entries()) };
  }

  serializeSet(set) {
    return { __type: 'Set', __value: Array.from(set.values()) };
  }

  serializeRegExp(regexp) {
    return {
      __type: 'RegExp',
      source: regexp.source,
      flags: regexp.flags
    };
  }

  serializeError(error) {
    return {
      __type: 'Error',
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  stringify(obj) {
    const seen = new WeakSet(); // Circular ref detection

    const replacer = (key, value) => {
      // Handle circular references
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return { __type: 'Circular', __path: key };
        }
        seen.add(value);
      }

      // Handle special types
      for (const [Type, handler] of this.typeHandlers) {
        if (value instanceof Type) {
          return handler.call(this, value);
        }
      }

      return value;
    };

    return JSON.stringify(obj, replacer);
  }

  parse(json) {
    const reviver = (key, value) => {
      if (value && typeof value === 'object' && value.__type) {
        switch (value.__type) {
          case 'Date':
            return new Date(value.__value);
          case 'Map':
            return new Map(value.__value);
          case 'Set':
            return new Set(value.__value);
          case 'RegExp':
            return new RegExp(value.source, value.flags);
          case 'Error': {
            const error = new Error(value.message);
            error.name = value.name;
            error.stack = value.stack;
            return error;
          }
          case 'Circular':
            return '[Circular Reference]';
        }
      }
      return value;
    };

    return JSON.parse(json, reviver);
  }
}
```

**Step 2: Schema Validation**

```javascript
class StateValidator {
  constructor(schema) {
    this.schema = schema;
  }

  validate(state) {
    const errors = [];

    for (const [path, expectedType] of Object.entries(this.schema)) {
      const value = this.getPath(state, path);

      if (!this.checkType(value, expectedType)) {
        errors.push({
          path,
          expected: expectedType,
          actual: typeof value
        });
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('State validation failed', errors);
    }

    return true;
  }

  checkType(value, expectedType) {
    if (expectedType === 'Date') return value instanceof Date;
    if (expectedType === 'Map') return value instanceof Map;
    if (expectedType === 'Set') return value instanceof Set;
    if (expectedType === 'RegExp') return value instanceof RegExp;
    return typeof value === expectedType;
  }

  getPath(obj, path) {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
  }
}

// Define schema
const stateSchema = {
  'cart.items': 'Map',
  'cart.promo': 'Set',
  'filters.startDate': 'Date',
  'filters.pattern': 'RegExp',
  'user.createdAt': 'Date'
};

const validator = new StateValidator(stateSchema);
```

**Step 3: Version Migrations**

```javascript
class VersionedPersistence {
  constructor() {
    this.version = 2; // Current version
    this.migrations = {
      1: this.migrateV1toV2.bind(this)
    };
  }

  save(state) {
    const versionedState = {
      __version: this.version,
      __timestamp: Date.now(),
      __data: state
    };

    const serializer = new TypePreservingSerializer();
    const json = serializer.stringify(versionedState);
    localStorage.setItem('app_state', json);
  }

  load() {
    const json = localStorage.getItem('app_state');
    if (!json) return null;

    const serializer = new TypePreservingSerializer();
    const parsed = serializer.parse(json);

    let version = parsed.__version || 1;
    let state = parsed.__data || parsed; // Legacy support

    // Apply migrations
    while (version < this.version) {
      const migration = this.migrations[version];
      if (migration) {
        console.log(`Migrating state from v${version} to v${version + 1}`);
        state = migration(state);
      }
      version++;
    }

    // Validate after migration
    const validator = new StateValidator(stateSchema);
    try {
      validator.validate(state);
    } catch (e) {
      console.error('State validation failed:', e);
      return null; // Return null to trigger reset
    }

    return state;
  }

  migrateV1toV2(state) {
    // V1 had `cart` as array, V2 uses Map
    if (Array.isArray(state.cart)) {
      state.cart = {
        items: new Map(state.cart.map(item => [item.id, item])),
        promo: new Set()
      };
    }
    return state;
  }
}
```

**Step 4: Error Handling and Fallbacks**

```javascript
class RobustPersistence {
  constructor() {
    this.persistence = new VersionedPersistence();
    this.serializer = new TypePreservingSerializer();
    this.maxRetries = 3;
  }

  save(state, retry = 0) {
    try {
      this.persistence.save(state);
      console.log('✅ State saved successfully');
    } catch (error) {
      console.error('❌ Save failed:', error);

      if (error.name === 'QuotaExceededError') {
        this.handleQuotaExceeded(state);
      } else if (retry < this.maxRetries) {
        console.log(`Retrying... (${retry + 1}/${this.maxRetries})`);
        setTimeout(() => this.save(state, retry + 1), 1000);
      } else {
        this.reportError('save_failed', error);
      }
    }
  }

  load() {
    try {
      const state = this.persistence.load();

      if (!state) {
        console.warn('No saved state, using defaults');
        return this.getDefaultState();
      }

      console.log('✅ State loaded successfully');
      return state;

    } catch (error) {
      console.error('❌ Load failed:', error);
      this.reportError('load_failed', error);

      // Backup: Try to recover from corrupted state
      return this.attemptRecovery() || this.getDefaultState();
    }
  }

  handleQuotaExceeded(state) {
    console.warn('Storage quota exceeded, compressing state...');

    // Remove old cache entries
    if (state.cache) {
      state.cache.clear();
    }

    // Remove old history
    if (state.history && state.history.length > 10) {
      state.history = state.history.slice(-10);
    }

    // Retry save
    this.save(state);
  }

  attemptRecovery() {
    try {
      // Try to load raw JSON without parsing
      const raw = localStorage.getItem('app_state');
      if (!raw) return null;

      // Try manual parsing with error recovery
      const partial = this.parsePartial(raw);
      console.log('⚠️ Recovered partial state');
      return partial;

    } catch (e) {
      console.error('Recovery failed:', e);
      return null;
    }
  }

  parsePartial(json) {
    // Attempt to extract valid parts of corrupted JSON
    // This is a simplified example
    try {
      return JSON.parse(json);
    } catch (e) {
      // Try to fix common issues
      const fixed = json
        .replace(/,\s*}/g, '}')  // Remove trailing commas
        .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
      return JSON.parse(fixed);
    }
  }

  getDefaultState() {
    return {
      cart: {
        items: new Map(),
        promo: new Set()
      },
      filters: {
        startDate: new Date(),
        pattern: /.*/
      },
      user: null
    };
  }

  reportError(type, error) {
    // Send to error tracking (Sentry, etc.)
    console.error(`[Analytics] ${type}:`, error.message);
  }
}
```

**Results After Implementation:**

**Metrics (4 weeks post-fix):**
- **0 type-related bugs** (down from 234)
- **95% reduction in support tickets** related to state persistence
- **Cart abandonment back to 8%** (from 15%)
- **App rating recovered to 4.1 stars** (from 3.1)
- **User churn reduced to 3%** (from 12%)
- **100% type fidelity** (all types preserved correctly)

**Performance Impact:**
```
┌──────────────────────┬───────────┬─────────────┐
│ Metric               │ Before    │ After       │
├──────────────────────┼───────────┼─────────────┤
│ Save time            │ 5ms       │ 12ms        │
│ Load time            │ 8ms       │ 15ms        │
│ Storage size         │ 50KB      │ 65KB (+30%) │
│ Type fidelity        │ 0%        │ 100%        │
│ Circular ref support │ ❌        │ ✅          │
│ Schema validation    │ ❌        │ ✅          │
│ Version migrations   │ ❌        │ ✅          │
└──────────────────────┴───────────┴─────────────┘
```

**Trade-off Analysis:**
- **30% larger storage** (type markers) vs **100% type preservation**
- **2x slower serialization** vs **zero data loss**
- **More complex code** vs **better reliability**
- **Upfront development time** vs **massive reduction in support costs**

**ROI:**
- Development cost: 40 hours @ $100/hr = $4,000
- Savings: $15,000/month support costs → $750/month
- Payback period: <1 month
- Annual savings: ~$171,000

**Lessons Learned:**

1. **Test with real data**: Synthetic tests didn't catch Map/Set serialization issues
2. **Monitor storage size**: Added alerts when state exceeds 80% of quota
3. **Schema validation is essential**: Catches corruption early
4. **Version all serialized data**: Makes migrations smooth
5. **Plan for errors**: localStorage can fail (quota, corruption, browser bugs)
6. **Compression helps**: Added gzip for large states (50% size reduction)
7. **Document migrations**: Each version change needs migration strategy


</details>


<details>
<summary><strong>⚖️ Trade-offs: JSON Serialization</strong></summary>


**1. toJSON() vs Replacer Function**

| Aspect | toJSON() Method | Replacer Function |
|--------|----------------|-------------------|
| **Encapsulation** | ✅ Logic in class | ❌ External logic |
| **Reusability** | ✅ Automatic | ❌ Must pass replacer |
| **Flexibility** | ❌ Per-class only | ✅ Cross-cutting |
| **Debugging** | ✅ Easy to trace | ❌ Harder to debug |
| **Testing** | ✅ Unit testable | ✅ Integration test |

**Example:**

```javascript
// toJSON() - Good for domain objects
class User {
  toJSON() {
    return { __type: 'User', ...this };
  }
}

// Replacer - Good for cross-cutting concerns
JSON.stringify(data, (key, value) => {
  if (value instanceof Date) return serializeDate(value);
  return value;
});
```

**When to use:**
- **toJSON()**: Domain objects, encapsulated logic, class-specific serialization
- **Replacer**: Global transformations, debugging, one-off serialization


</details>

---

**2. Type Markers vs Schemas**

| Aspect | Type Markers | Schema-Based |
|--------|--------------|--------------|
| **Runtime Overhead** | ❌ Higher (per-value markers) | ✅ Lower (schema reference) |
| **Type Safety** | ❌ Runtime only | ✅ Compile-time (TypeScript) |
| **Flexibility** | ✅ Dynamic types | ❌ Fixed schema |
| **Serialization Size** | ❌ Larger (+10-20%) | ✅ Smaller |
| **Migration** | ❌ Manual | ✅ Schema evolution |
| **Debugging** | ✅ Self-describing | ❌ Need schema |

**Example:**

```javascript
// Type markers (self-describing)
{
  "user": {
    "__type": "User",
    "createdAt": { "__type": "Date", "__value": "2025-01-15..." }
  }
}

// Schema-based (compact)
{
  "__schema": "UserV1",
  "user": {
    "createdAt": "2025-01-15..."
  }
}
// Schema stored separately:
// { "user.createdAt": "Date" }
```

**Decision Matrix:**

```
Use Type Markers when:
✅ Dynamic data (unknown structure)
✅ Debugging important
✅ No TypeScript
✅ Small datasets
✅ Rapid prototyping

Use Schemas when:
✅ Fixed structure
✅ Large datasets (minimize size)
✅ TypeScript integration
✅ Schema evolution needed
✅ Cross-language compatibility
```

---

**3. Custom Serialization vs Libraries**

| Library | Pros | Cons | Use Case |
|---------|------|------|----------|
| **Custom** | Full control, no deps, optimized | More code, bugs, maintenance | Specific needs, learning |
| **flatted** | Circular refs, small (1KB), fast | No type preservation | Circular structures |
| **superjson** | Type preservation, TypeScript | 10KB, opinionated | Full-stack apps |
| **devalue** | Comprehensive, fast | 5KB, less docs | SvelteKit, general |
| **serialize-javascript** | Functions, RegExp, Date | Security risks (eval) | Non-sensitive data |

**Code Comparison:**

```javascript
// Custom (full control)
class MySerializer {
  stringify(obj) {
    // Custom logic for your types
    // Optimized for your use case
    // No external dependencies
  }
}

// flatted (circular refs)
import { stringify, parse } from 'flatted';
stringify(circularObj); // Just works

// superjson (type preservation)
import superjson from 'superjson';
const { json, meta } = superjson.serialize(complexObj);

// devalue (comprehensive)
import { stringify, parse } from 'devalue';
stringify(obj); // Handles most types
```

**Decision Tree:**

```
Do you have circular references?
├─ Yes → flatted
└─ No
    Do you need Date/Map/Set/RegExp?
    ├─ Yes
    │   Do you use TypeScript?
    │   ├─ Yes → superjson
    │   └─ No → devalue
    └─ No → Standard JSON

Special case: Need functions/code?
└─ serialize-javascript (be careful!)

Want learning/full control?
└─ Custom implementation
```

---

**4. JSON vs Alternative Serialization Formats**

**Detailed Comparison:**

```javascript
// Test data
const testData = {
  id: 12345,
  name: 'Alice Johnson',
  email: 'alice@example.com',
  age: 30,
  active: true,
  tags: ['admin', 'user', 'premium'],
  metadata: {
    lastLogin: Date.now(),
    sessionCount: 42
  }
};

// JSON
const json = JSON.stringify(testData);
console.log('JSON size:', json.length); // 180 bytes
console.log('JSON (human-readable):', json);

// MessagePack
import msgpack from 'msgpack-lite';
const packed = msgpack.encode(testData);
console.log('MessagePack size:', packed.length); // 110 bytes (39% smaller)

// Protocol Buffers
// (requires schema definition)
const protobuf = require('protobufjs');
const UserProto = protobuf.loadSync('user.proto');
const encoded = UserProto.User.encode(testData).finish();
console.log('Protobuf size:', encoded.length); // 65 bytes (64% smaller!)

// CBOR
import cbor from 'cbor';
const cborEncoded = cbor.encode(testData);
console.log('CBOR size:', cborEncoded.length); // 105 bytes (42% smaller)
```

**Performance Benchmark (10,000 iterations):**

```
┌──────────────────┬──────────┬──────────┬───────────┬──────────┐
│ Format           │ Encode   │ Decode   │ Size      │ Human?   │
├──────────────────┼──────────┼──────────┼───────────┼──────────┤
│ JSON             │ 50ms     │ 45ms     │ 100%      │ ✅       │
│ MessagePack      │ 35ms     │ 30ms     │ 60%       │ ❌       │
│ Protocol Buffers │ 25ms     │ 20ms     │ 40%       │ ❌       │
│ CBOR             │ 40ms     │ 35ms     │ 58%       │ ❌       │
│ Custom JSON      │ 120ms    │ 100ms    │ 120%      │ ✅       │
└──────────────────┴──────────┴──────────┴───────────┴──────────┘

Winner: Protocol Buffers (smallest + fastest)
But: Requires schema + not human-readable
```

**Use Case Decision Matrix:**

```
┌─────────────────────────┬──────────────────────────────┐
│ Use Case                │ Recommended Format           │
├─────────────────────────┼──────────────────────────────┤
│ REST API                │ JSON (standard, compatible)  │
│ localStorage            │ Custom JSON (type preserve)  │
│ WebSocket (real-time)   │ MessagePack (fast, small)    │
│ Microservices (gRPC)    │ Protocol Buffers (schema)    │
│ Mobile app (bandwidth)  │ MessagePack or Protobuf      │
│ Configuration files     │ JSON (human-readable)        │
│ IoT devices             │ CBOR (compact, standard)     │
│ State management        │ Custom JSON (circular refs)  │
│ IPC (Electron/Worker)   │ MessagePack (fast, binary)   │
│ Log shipping            │ JSON (grep-able, tools)      │
└─────────────────────────┴──────────────────────────────┘
```

**Hybrid Approach (Best of Both Worlds):**

```javascript
class AdaptiveSerializer {
  serialize(data, context = {}) {
    const { format = 'auto', compress = false } = context;

    let serialized;

    if (format === 'auto') {
      // Choose format based on data characteristics
      if (this.isSimple(data)) {
        serialized = JSON.stringify(data); // Fast path
      } else if (this.hasCircularRefs(data)) {
        serialized = flatted.stringify(data); // Handle circular
      } else if (this.hasBinaryData(data)) {
        serialized = msgpack.encode(data); // Binary efficient
      } else {
        const customSerializer = new SuperSerializer();
        serialized = customSerializer.stringify(data); // Full features
      }
    } else {
      // Use specified format
      serialized = this.serializeWithFormat(data, format);
    }

    if (compress) {
      serialized = pako.gzip(serialized);
    }

    return serialized;
  }

  isSimple(data) {
    // Check if data is JSON-serializable without loss
    try {
      const json = JSON.stringify(data);
      const restored = JSON.parse(json);
      return this.deepEqual(data, restored);
    } catch {
      return false;
    }
  }

  // ... other helper methods
}

// Usage
const serializer = new AdaptiveSerializer();

// Simple object → JSON (fast)
serializer.serialize({ name: 'Alice', age: 30 });

// Circular refs → flatted
const circular = {}; circular.self = circular;
serializer.serialize(circular);

// Complex types → Custom serializer
serializer.serialize({
  date: new Date(),
  map: new Map(),
  set: new Set()
});

// Binary data → MessagePack
serializer.serialize({
  image: new Uint8Array([...])
});
```

---

**5. Security vs Convenience**

**Risk Matrix:**

| Pattern | Security Risk | Convenience | Mitigation |
|---------|--------------|-------------|------------|
| `eval()` in reviver | ⛔ Critical | ✅ High | Never use |
| Unrestricted type restoration | 🔴 High | ✅ High | Whitelist types |
| No depth limit | 🟠 Medium | ✅ High | Limit depth |
| No size limit | 🟠 Medium | ✅ High | Limit size |
| Prototype pollution | 🔴 High | ✅ High | Block __proto__ |
| Schema validation | 🟢 Low | ❌ Low | Always validate |

**Secure Implementation Checklist:**

```javascript
// ✅ Production-ready secure serializer
class SecureSerializer {
  constructor(options = {}) {
    this.allowedTypes = new Set(options.allowedTypes || [
      'Date', 'Map', 'Set', 'RegExp', 'Error'
    ]);
    this.maxDepth = options.maxDepth || 20;
    this.maxSize = options.maxSize || 1024 * 1024; // 1MB
    this.dangerousKeys = new Set(['__proto__', 'constructor', 'prototype']);
  }

  parse(json) {
    // 1. Size check
    if (json.length > this.maxSize) {
      throw new Error(`JSON exceeds max size: ${json.length} > ${this.maxSize}`);
    }

    let depth = 0;

    const reviver = (key, value) => {
      // 2. Block dangerous keys
      if (this.dangerousKeys.has(key)) {
        throw new Error(`Dangerous key blocked: ${key}`);
      }

      // 3. Depth check
      if (typeof value === 'object' && value !== null) {
        depth++;
        if (depth > this.maxDepth) {
          throw new Error(`Max depth exceeded: ${depth} > ${this.maxDepth}`);
        }
      }

      // 4. Type whitelist
      if (value && value.__type) {
        if (!this.allowedTypes.has(value.__type)) {
          throw new Error(`Type not allowed: ${value.__type}`);
        }
        return this.deserializeType(value);
      }

      return value;
    };

    try {
      depth = 0;
      return JSON.parse(json, reviver);
    } catch (error) {
      console.error('Secure parse failed:', error);
      throw error;
    }
  }

  deserializeType(value) {
    // Safe type restoration (no eval, no Function constructor)
    switch (value.__type) {
      case 'Date':
        return new Date(value.__value);
      case 'Map':
        return new Map(value.__value);
      case 'Set':
        return new Set(value.__value);
      case 'RegExp':
        return new RegExp(value.source, value.flags);
      case 'Error': {
        const error = new Error(value.message);
        error.name = value.name;
        return error;
      }
      default:
        throw new Error(`Unknown type: ${value.__type}`);
    }
  }
}

// Usage
const secure = new SecureSerializer({
  allowedTypes: ['Date', 'Map', 'Set'],
  maxDepth: 10,
  maxSize: 500000
});

try {
  const data = secure.parse(untrustedJson);
  console.log('Safe data:', data);
} catch (error) {
  console.error('Rejected untrusted data:', error);
}
```


<details>
<summary><strong>💬 Explain to Junior: JSON Serialization Simplified</strong></summary>


**Simple Analogy:**

Imagine you're packing for a trip. Standard JSON is like a basic suitcase that can only hold simple items (clothes, books). But you need to pack special items:

- **Camera** (Date) → Without custom packing, it arrives as a "description of a camera" (string), not the actual camera
- **Jewelry box with compartments** (Map) → Arrives as an empty box (object) without the compartments
- **Set of keys** (Set) → Arrives as just a random pile (object) without the "no duplicates" feature
- **Circular reference** (photo of your suitcase inside your suitcase) → Causes infinite loop!

**Custom serialization** is like having special packing instructions for each item type, so they arrive exactly as they were.


</details>

---

**Why JSON Can't Handle Everything:**

JSON was designed in 1999 for simple data exchange. It has only 7 types:

1. `string`
2. `number`
3. `boolean`
4. `null`
5. `object` (plain)
6. `array`
7. (that's it!)

JavaScript has way more:
- `Date`, `Map`, `Set`, `RegExp`, `Error`, `Symbol`, `BigInt`, `TypedArray`, `Promise`, `Function`, etc.

When you `JSON.stringify()` these complex types, they lose their "specialness":

```javascript
// ❌ What gets lost:
const data = {
  when: new Date('2025-01-15'),      // Date → string
  users: new Map([['alice', 1]]),    // Map → {}
  tags: new Set(['a', 'b']),         // Set → {}
  pattern: /test/i,                  // RegExp → {}
  error: new Error('Oops'),          // Error → {}
  bigNum: 9007199254740991n          // BigInt → ERROR!
};

const json = JSON.stringify(data);
const restored = JSON.parse(json);

console.log(restored.when instanceof Date);        // false (it's a string!)
console.log(restored.users instanceof Map);        // false (it's {})
console.log(restored.pattern instanceof RegExp);   // false (it's {})
```

---

**Step-by-Step: Building a Custom Serializer**

**Step 1: Detect the Type**

```javascript
function getType(value) {
  if (value instanceof Date) return 'Date';
  if (value instanceof Map) return 'Map';
  if (value instanceof Set) return 'Set';
  if (value instanceof RegExp) return 'RegExp';
  return null; // Not a special type
}
```

**Step 2: Add Type Markers**

```javascript
function addTypeMarker(value) {
  const type = getType(value);
  if (!type) return value; // Not special, return as-is

  return {
    __type: type,
    __value: convertToJSON(value) // Convert to JSON-safe format
  };
}

function convertToJSON(value) {
  if (value instanceof Date) {
    return value.toISOString(); // "2025-01-15T10:30:00.000Z"
  }
  if (value instanceof Map) {
    return Array.from(value.entries()); // [["key", "value"]]
  }
  if (value instanceof Set) {
    return Array.from(value.values()); // ["a", "b", "c"]
  }
  if (value instanceof RegExp) {
    return { source: value.source, flags: value.flags };
  }
}
```

**Step 3: Use a Replacer Function**

```javascript
function customStringify(obj) {
  return JSON.stringify(obj, (key, value) => {
    const type = getType(value);
    if (type) {
      return addTypeMarker(value);
    }
    return value;
  });
}

// Usage
const data = {
  timestamp: new Date('2025-01-15'),
  users: new Map([['alice', 1], ['bob', 2]])
};

const json = customStringify(data);
console.log(json);
// {
//   "timestamp": {"__type":"Date","__value":"2025-01-15T00:00:00.000Z"},
//   "users": {"__type":"Map","__value":[["alice",1],["bob",2]]}
// }
```

**Step 4: Restore Types with Reviver**

```javascript
function customParse(json) {
  return JSON.parse(json, (key, value) => {
    // Check if this value has a type marker
    if (value && value.__type) {
      return restoreType(value);
    }
    return value;
  });
}

function restoreType(obj) {
  switch (obj.__type) {
    case 'Date':
      return new Date(obj.__value);
    case 'Map':
      return new Map(obj.__value);
    case 'Set':
      return new Set(obj.__value);
    case 'RegExp':
      return new RegExp(obj.__value.source, obj.__value.flags);
  }
}

// Full round-trip
const original = {
  timestamp: new Date('2025-01-15'),
  users: new Map([['alice', 1]])
};

const json = customStringify(original);
const restored = customParse(json);

console.log(restored.timestamp instanceof Date);   // ✅ true!
console.log(restored.users instanceof Map);        // ✅ true!
console.log(restored.users.get('alice'));          // ✅ 1
```

---

**Common Mistakes to Avoid:**

**Mistake 1: Forgetting Circular References**

```javascript
// ❌ This will crash!
const obj = { name: 'Parent' };
obj.self = obj; // Circular reference

JSON.stringify(obj); // TypeError: Converting circular structure to JSON

// ✅ Fix: Detect and handle circular refs
function safeStringify(obj) {
  const seen = new WeakSet();

  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]'; // Mark as circular
      }
      seen.add(value);
    }
    return value;
  });
}
```

**Mistake 2: Not Versioning Serialized Data**

```javascript
// ❌ Bad: No version tracking
localStorage.setItem('state', JSON.stringify(state));

// Later, you change the structure:
// Old: { username: 'Alice' }
// New: { name: 'Alice' }

// ✅ Good: Version your data
function saveState(state) {
  const versioned = {
    __version: 2,
    __data: state
  };
  localStorage.setItem('state', JSON.stringify(versioned));
}

function loadState() {
  const json = localStorage.getItem('state');
  const parsed = JSON.parse(json);

  if (parsed.__version === 1) {
    // Migrate old data
    return {
      name: parsed.username, // Old field → new field
      ...parsed
    };
  }

  return parsed.__data;
}
```

**Mistake 3: Security Vulnerabilities**

```javascript
// ⚠️ JSON.parse() alone does not pollute Object.prototype — "__proto__"
// becomes a plain own property. Danger only appears if this parsed data
// later flows into an unsafe recursive merge/extend function.
const malicious = '{"__proto__":{"isAdmin":true}}';
JSON.parse(malicious);

const user = {};
console.log(user.isAdmin); // undefined (NOT polluted)

// ✅ Still good practice: Block dangerous keys before merging untrusted data
function safeParse(json) {
  return JSON.parse(json, (key, value) => {
    if (key === '__proto__' || key === 'constructor') {
      throw new Error('Dangerous key detected!');
    }
    return value;
  });
}
```

---

**Interview Answer Template:**

*"JSON.stringify has limitations with complex JavaScript types like Date, Map, Set, and RegExp. To handle these, I implement custom serialization using:*

1. **Type markers**: Embed `__type` and `__value` fields to preserve type information
2. **Replacer function**: Detect special types during stringify and add markers
3. **Reviver function**: Restore types during parse by checking markers
4. **Circular reference detection**: Use WeakSet to track visited objects

*For example, to serialize a Date:*

```javascript
// Replacer
if (value instanceof Date) {
  return { __type: 'Date', __value: value.toISOString() };
}

// Reviver
if (value.__type === 'Date') {
  return new Date(value.__value);
}
```

*The trade-offs are:*
- ✅ **Pros**: Full type fidelity, handles circular refs, extensible
- ❌ **Cons**: 10-30% larger size, slower performance, more complex

*For production, I'd also add:*
- Version tracking for migrations
- Schema validation
- Security checks (block __proto__)
- Size limits to prevent DoS

*Alternatives include libraries like flatted (circular refs), superjson (type preservation), or binary formats like MessagePack for smaller size and better performance."*

---

**Copy-Paste Utility Functions:**

```javascript
// 1. Safe stringify with circular reference handling
function safeStringify(obj, space) {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return '[Circular]';
      seen.add(value);
    }
    return value;
  }, space);
}

// 2. Type-preserving serializer
function serialize(obj) {
  return JSON.stringify(obj, (key, value) => {
    if (value instanceof Date) {
      return { __type: 'Date', __value: value.toISOString() };
    }
    if (value instanceof Map) {
      return { __type: 'Map', __value: Array.from(value.entries()) };
    }
    if (value instanceof Set) {
      return { __type: 'Set', __value: Array.from(value.values()) };
    }
    if (value instanceof RegExp) {
      return { __type: 'RegExp', source: value.source, flags: value.flags };
    }
    if (typeof value === 'bigint') {
      return { __type: 'BigInt', __value: value.toString() };
    }
    return value;
  });
}

function deserialize(json) {
  return JSON.parse(json, (key, value) => {
    if (value && value.__type) {
      if (value.__type === 'Date') return new Date(value.__value);
      if (value.__type === 'Map') return new Map(value.__value);
      if (value.__type === 'Set') return new Set(value.__value);
      if (value.__type === 'RegExp') return new RegExp(value.source, value.flags);
      if (value.__type === 'BigInt') return BigInt(value.__value);
    }
    return value;
  });
}

// 3. Safe parse with security checks
function safeParse(json, options = {}) {
  const { maxDepth = 20, maxSize = 1024 * 1024 } = options;

  if (json.length > maxSize) {
    throw new Error(`JSON too large: ${json.length} bytes`);
  }

  let depth = 0;
  return JSON.parse(json, (key, value) => {
    // Block dangerous keys
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      throw new Error(`Dangerous key: ${key}`);
    }

    // Track depth
    if (typeof value === 'object' && value !== null) {
      depth++;
      if (depth > maxDepth) {
        throw new Error(`Max depth exceeded: ${depth}`);
      }
    }

    return value;
  });
}

// Usage examples
const data = {
  date: new Date(),
  map: new Map([['key', 'value']]),
  circular: {}
};
data.circular.self = data.circular;

// Serialize
const json = safeStringify(data);
console.log(json);

// With type preservation
const jsonWithTypes = serialize(data);
const restored = deserialize(jsonWithTypes);
console.log(restored.date instanceof Date); // true

// Safe parse
const untrusted = '{"__proto__":{"isAdmin":true}}';
try {
  safeParse(untrusted);
} catch (e) {
  console.error('Blocked:', e.message);
}
```

---

**Practice Exercises:**

**Exercise 1: Serialize a class with methods**

```javascript
class Counter {
  constructor(initial = 0) {
    this.count = initial;
  }

  increment() {
    this.count++;
  }

  toJSON() {
    // TODO: Implement serialization
  }

  static fromJSON(json) {
    // TODO: Implement deserialization
  }
}

// Test
const counter = new Counter(5);
counter.increment();
const json = JSON.stringify(counter);
const restored = Counter.fromJSON(JSON.parse(json));
console.log(restored.count); // Should be 6
console.log(typeof restored.increment); // Should be "function"
```

**Solution:**

```javascript
class Counter {
  constructor(initial = 0) {
    this.count = initial;
  }

  increment() {
    this.count++;
  }

  toJSON() {
    return {
      __type: 'Counter',
      count: this.count
    };
  }

  static fromJSON(json) {
    return new Counter(json.count);
  }
}
```

**Exercise 2: Handle nested Maps and Sets**

```javascript
const data = {
  users: new Map([
    ['alice', { age: 30, tags: new Set(['admin', 'user']) }],
    ['bob', { age: 25, tags: new Set(['user']) }]
  ])
};

// TODO: Serialize and deserialize this structure
// Hint: Handle nested special types recursively
```

**Solution:**

```javascript
function deepSerialize(obj) {
  return JSON.stringify(obj, (key, value) => {
    if (value instanceof Map) {
      return {
        __type: 'Map',
        __value: Array.from(value.entries()).map(([k, v]) =>
          [k, deepSerialize(v)]
        )
      };
    }
    if (value instanceof Set) {
      return {
        __type: 'Set',
        __value: Array.from(value.values()).map(deepSerialize)
      };
    }
    return value;
  });
}

function deepDeserialize(json) {
  return JSON.parse(json, (key, value) => {
    if (value && value.__type === 'Map') {
      return new Map(value.__value.map(([k, v]) => [k, deepDeserialize(v)]));
    }
    if (value && value.__type === 'Set') {
      return new Set(value.__value.map(deepDeserialize));
    }
    return value;
  });
}
```

---

## 📚 Additional Resources

- [MDN: JSON.stringify()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)
- [MDN: JSON.parse()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse)
- [MDN: toJSON() method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#tojson_behavior)
- [flatted](https://github.com/WebReflection/flatted) - Circular reference serialization
- [superjson](https://github.com/blitz-js/superjson) - Type-preserving JSON
- [devalue](https://github.com/Rich-Harris/devalue) - Serialize JavaScript values
- [MessagePack](https://msgpack.org/) - Efficient binary serialization
- [Protocol Buffers](https://developers.google.com/protocol-buffers) - Google's serialization
- [CBOR](https://cbor.io/) - Concise Binary Object Representation
- [JSON Schema](https://json-schema.org/) - Validation and documentation
- [You Don't Know JS: Types & Grammar](https://github.com/getify/You-Dont-Know-JS) - Deep dive into JS types
