# LRU Cache Implementation

**Difficulty:** 🔴 Hard
**Frequency:** ⭐⭐⭐⭐⭐
**Companies:** Google, Meta, Amazon, Microsoft, Apple
**Time:** 45 minutes

---

## Problem Statement

Design and implement a data structure for Least Recently Used (LRU) cache. Support `get(key)` and `put(key, value)` operations in O(1) time.

### Requirements

- ✅ get(key): Get value (returns -1 if not exists), marks as recently used
- ✅ put(key, value): Set/update value, evict LRU item if at capacity
- ✅ Both operations must be O(1) time complexity
- ✅ Handle capacity limits properly
- ✅ Maintain access order correctly

---

## Solution

### Approach 1: HashMap + Doubly Linked List

```javascript
class Node {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();

    // Dummy head and tail for easier manipulation
    this.head = new Node(0, 0);
    this.tail = new Node(0, 0);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key) {
    if (!this.cache.has(key)) {
      return -1;
    }

    const node = this.cache.get(key);

    // Move to front (most recently used)
    this.removeNode(node);
    this.addToFront(node);

    return node.value;
  }

  put(key, value) {
    // If key exists, update and move to front
    if (this.cache.has(key)) {
      const node = this.cache.get(key);
      node.value = value;
      this.removeNode(node);
      this.addToFront(node);
      return;
    }

    // Create new node
    const newNode = new Node(key, value);

    // Add to cache and front of list
    this.cache.set(key, newNode);
    this.addToFront(newNode);

    // Check capacity
    if (this.cache.size > this.capacity) {
      // Remove LRU (node before tail)
      const lru = this.tail.prev;
      this.removeNode(lru);
      this.cache.delete(lru.key);
    }
  }

  addToFront(node) {
    // Add after head
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
  }

  removeNode(node) {
    const prev = node.prev;
    const next = node.next;
    prev.next = next;
    next.prev = prev;
  }
}

// Usage
const cache = new LRUCache(2);
cache.put(1, 1); // cache: {1=1}
cache.put(2, 2); // cache: {1=1, 2=2}
cache.get(1);    // returns 1, cache: {2=2, 1=1}
cache.put(3, 3); // evicts 2, cache: {1=1, 3=3}
cache.get(2);    // returns -1 (not found)
cache.put(4, 4); // evicts 1, cache: {3=3, 4=4}
```

**Complexity:**
- Time: O(1) for both get and put
- Space: O(capacity)

---

### Approach 2: Using JavaScript Map (Preserves Insertion Order)

```javascript
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) {
      return -1;
    }

    // Get value and re-insert to move to end (most recent)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);

    return value;
  }

  put(key, value) {
    // If exists, delete to re-insert at end
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Add to end (most recent)
    this.cache.set(key, value);

    // Check capacity - first key is LRU
    if (this.cache.size > this.capacity) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
}
```

**Complexity:**
- Time: O(1) average, but Map delete/set can be slower than linked list
- Space: O(capacity)

---

### Approach 3: With TTL (Time To Live)

```javascript
class LRUCacheWithTTL {
  constructor(capacity, ttl = Infinity) {
    this.capacity = capacity;
    this.ttl = ttl; // milliseconds
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) {
      return -1;
    }

    const { value, timestamp } = this.cache.get(key);

    // Check if expired
    if (Date.now() - timestamp > this.ttl) {
      this.cache.delete(key);
      return -1;
    }

    // Re-insert to update order
    this.cache.delete(key);
    this.cache.set(key, { value, timestamp: Date.now() });

    return value;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    this.cache.set(key, { value, timestamp: Date.now() });

    if (this.cache.size > this.capacity) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  // Clean expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, { timestamp }] of this.cache.entries()) {
      if (now - timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}
```

---

### Approach 4: Production-Ready with Statistics

```javascript
class AdvancedLRUCache {
  constructor(capacity, options = {}) {
    this.capacity = capacity;
    this.ttl = options.ttl || Infinity;
    this.onEvict = options.onEvict || null;

    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      sets: 0
    };
  }

  get(key) {
    if (!this.cache.has(key)) {
      this.stats.misses++;
      return -1;
    }

    const entry = this.cache.get(key);

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return -1;
    }

    // Update timestamp and move to end
    entry.timestamp = Date.now();
    entry.accessCount++;
    this.cache.delete(key);
    this.cache.set(key, entry);

    this.stats.hits++;
    return entry.value;
  }

  put(key, value) {
    this.stats.sets++;

    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 0
    });

    if (this.cache.size > this.capacity) {
      const [evictKey, evictEntry] = this.cache.entries().next().value;

      if (this.onEvict) {
        this.onEvict(evictKey, evictEntry.value);
      }

      this.cache.delete(evictKey);
      this.stats.evictions++;
    }
  }

  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }

    const entry = this.cache.get(key);
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }

  keys() {
    return Array.from(this.cache.keys());
  }

  getStats() {
    return {
      ...this.stats,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      size: this.cache.size,
      capacity: this.capacity
    };
  }

  reset() {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      sets: 0
    };
  }
}

// Usage
const cache = new AdvancedLRUCache(100, {
  ttl: 60000, // 1 minute
  onEvict: (key, value) => {
    console.log(`Evicted: ${key} = ${value}`);
  }
});

cache.put('user:1', { name: 'Alice' });
cache.get('user:1'); // Cache hit
console.log(cache.getStats());
```

---

## Test Cases

```javascript
describe('LRUCache', () => {
  test('basic get and put', () => {
    const cache = new LRUCache(2);

    cache.put(1, 1);
    cache.put(2, 2);
    expect(cache.get(1)).toBe(1);

    cache.put(3, 3); // Evicts key 2
    expect(cache.get(2)).toBe(-1);

    cache.put(4, 4); // Evicts key 1
    expect(cache.get(1)).toBe(-1);
    expect(cache.get(3)).toBe(3);
    expect(cache.get(4)).toBe(4);
  });

  test('updates existing key', () => {
    const cache = new LRUCache(2);

    cache.put(1, 1);
    cache.put(2, 2);
    cache.put(1, 10); // Update key 1

    expect(cache.get(1)).toBe(10);
    expect(cache.get(2)).toBe(2);
  });

  test('get marks as recently used', () => {
    const cache = new LRUCache(2);

    cache.put(1, 1);
    cache.put(2, 2);
    cache.get(1); // Mark 1 as recently used

    cache.put(3, 3); // Should evict 2, not 1
    expect(cache.get(1)).toBe(1);
    expect(cache.get(2)).toBe(-1);
    expect(cache.get(3)).toBe(3);
  });

  test('capacity of 1', () => {
    const cache = new LRUCache(1);

    cache.put(1, 1);
    cache.put(2, 2); // Evicts 1

    expect(cache.get(1)).toBe(-1);
    expect(cache.get(2)).toBe(2);
  });

  test('large capacity', () => {
    const cache = new LRUCache(1000);

    for (let i = 0; i < 1000; i++) {
      cache.put(i, i * 2);
    }

    for (let i = 0; i < 1000; i++) {
      expect(cache.get(i)).toBe(i * 2);
    }

    cache.put(1000, 2000); // Evicts 0
    expect(cache.get(0)).toBe(-1);
  });

  test('TTL expiration', (done) => {
    const cache = new LRUCacheWithTTL(5, 100);

    cache.put('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');

    setTimeout(() => {
      expect(cache.get('key1')).toBe(-1);
      done();
    }, 150);
  });
});
```

---

## Common Mistakes

- ❌ Using array and searching (O(n) time)
- ❌ Not handling capacity of 1
- ❌ Not updating order on get()
- ❌ Forgetting to delete from Map on eviction
- ❌ Not considering edge cases (duplicate puts)

✅ Use Map + Doubly Linked List
✅ O(1) operations guaranteed
✅ Update order on both get and put
✅ Clean up properly on eviction
✅ Handle all edge cases

---

## Real-World Applications

```javascript
// API Response Cache
class APICache extends LRUCache {
  constructor(capacity = 100) {
    super(capacity);
  }

  async fetchWithCache(url) {
    const cached = this.get(url);
    if (cached !== -1) {
      return cached;
    }

    const response = await fetch(url);
    const data = await response.json();
    this.put(url, data);

    return data;
  }
}

// Usage
const apiCache = new APICache(50);
const userData = await apiCache.fetchWithCache('/api/user/123');
```

---

[← Back to Algorithms](../README.md)
