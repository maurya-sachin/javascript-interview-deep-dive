# Coding Problems & Solutions

> **Focus**: JavaScript coding challenges with multiple approaches and algorithmic analysis

---

## Question 1: How do you count character frequency in a string?

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐
**Time:** 7-10 minutes
**Companies:** Google, Meta, Amazon, Microsoft

### Question
Create a function that counts the frequency of each character in a string. Explain multiple approaches including object mapping and Map usage.

### Answer

**Character frequency counting** is a common string manipulation problem with applications in data analysis, compression, and text processing.

1. **Approaches**
   - Object as hash map (classic approach)
   - Map data structure (modern approach)
   - Array for ASCII/Unicode range
   - Reduce method (functional approach)

2. **Considerations**
   - Case sensitivity
   - Space handling
   - Special characters
   - Unicode support
   - Performance for large strings

3. **Use Cases**
   - Anagram detection
   - Text analysis
   - Compression algorithms
   - Password strength checking
   - Spam detection

### Code Example

```javascript
// 1. OBJECT APPROACH (MOST COMMON)

function charFrequency1(str) {
  const freq = {};

  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }

  return freq;
}

console.log(charFrequency1("hello"));
// { h: 1, e: 1, l: 2, o: 1 }

console.log(charFrequency1("mississippi"));
// { m: 1, i: 4, s: 4, p: 2 }

// 2. MAP APPROACH (MODERN)

function charFrequency2(str) {
  const freq = new Map();

  for (const char of str) {
    freq.set(char, (freq.get(char) || 0) + 1);
  }

  return freq;
}

const result = charFrequency2("hello");
console.log(result);
// Map(4) { 'h' => 1, 'e' => 1, 'l' => 2, 'o' => 1 }

// Convert Map to object if needed
console.log(Object.fromEntries(result));
// { h: 1, e: 1, l: 2, o: 1 }

// 3. REDUCE APPROACH (FUNCTIONAL)

function charFrequency3(str) {
  return str.split('').reduce((freq, char) => {
    freq[char] = (freq[char] || 0) + 1;
    return freq;
  }, {});
}

console.log(charFrequency3("hello"));
// { h: 1, e: 1, l: 2, o: 1 }

// 4. CASE-INSENSITIVE VERSION

function charFrequencyCaseInsensitive(str) {
  const freq = {};

  for (const char of str.toLowerCase()) {
    freq[char] = (freq[char] || 0) + 1;
  }

  return freq;
}

console.log(charFrequencyCaseInsensitive("Hello World"));
// { h: 1, e: 1, l: 3, o: 2, ' ': 1, w: 1, r: 1, d: 1 }

// 5. IGNORE SPACES AND SPECIAL CHARACTERS

function charFrequencyAlphaOnly(str) {
  const freq = {};

  for (const char of str.toLowerCase()) {
    // Only count letters
    if (char >= 'a' && char <= 'z') {
      freq[char] = (freq[char] || 0) + 1;
    }
  }

  return freq;
}

console.log(charFrequencyAlphaOnly("Hello, World! 123"));
// { h: 1, e: 1, l: 3, o: 2, w: 1, r: 1, d: 1 }

// 6. SORTED BY FREQUENCY

function charFrequencySorted(str) {
  const freq = {};

  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }

  // Convert to array, sort by frequency (descending)
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .reduce((obj, [char, count]) => {
      obj[char] = count;
      return obj;
    }, {});
}

console.log(charFrequencySorted("mississippi"));
// { i: 4, s: 4, p: 2, m: 1 }

// 7. WITH ARRAY (FOR ASCII ONLY)

function charFrequencyArray(str) {
  const freq = new Array(256).fill(0); // ASCII range

  for (const char of str) {
    freq[char.charCodeAt(0)]++;
  }

  // Convert to object for readability
  const result = {};
  for (let i = 0; i < freq.length; i++) {
    if (freq[i] > 0) {
      result[String.fromCharCode(i)] = freq[i];
    }
  }

  return result;
}

console.log(charFrequencyArray("hello"));
// { h: 1, e: 1, l: 2, o: 1 }

// 8. FIND MOST FREQUENT CHARACTER

function mostFrequentChar(str) {
  const freq = {};
  let maxChar = '';
  let maxCount = 0;

  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;

    if (freq[char] > maxCount) {
      maxCount = freq[char];
      maxChar = char;
    }
  }

  return { char: maxChar, count: maxCount };
}

console.log(mostFrequentChar("mississippi"));
// { char: 's', count: 4 } (deterministic: 's' is the first char to strictly
// exceed the previous max count, since 'i' only ties at 4, never exceeds it)

// 9. PERFORMANCE COMPARISON

function benchmark(fn, str, iterations = 10000) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn(str);
  }
  const end = performance.now();
  return (end - start).toFixed(2) + 'ms';
}

const testStr = "the quick brown fox jumps over the lazy dog".repeat(10);

console.log('Object:', benchmark(charFrequency1, testStr));      // ~45ms
console.log('Map:', benchmark(charFrequency2, testStr));         // ~48ms
console.log('Reduce:', benchmark(charFrequency3, testStr));      // ~65ms
console.log('Array:', benchmark(charFrequencyArray, testStr));   // ~35ms (fastest for ASCII!)

// 10. UNICODE-SAFE VERSION

function charFrequencyUnicode(str) {
  const freq = new Map();

  // Use spread to handle Unicode correctly
  for (const char of [...str]) {
    freq.set(char, (freq.get(char) || 0) + 1);
  }

  return Object.fromEntries(freq);
}

console.log(charFrequencyUnicode("Hello 😀🎉"));
// { H: 1, e: 1, l: 2, o: 1, ' ': 1, '😀': 1, '🎉': 1 }

// 11. CHARACTER HISTOGRAM

function charHistogram(str) {
  const freq = charFrequency1(str);

  for (const [char, count] of Object.entries(freq)) {
    console.log(`${char}: ${'█'.repeat(count)} (${count})`);
  }
}

charHistogram("hello");
// h: █ (1)
// e: █ (1)
// l: ██ (2)
// o: █ (1)

// 12. ANAGRAM DETECTION USING FREQUENCY

function areAnagrams(str1, str2) {
  if (str1.length !== str2.length) return false;

  const freq1 = charFrequency1(str1.toLowerCase());
  const freq2 = charFrequency1(str2.toLowerCase());

  // Compare frequency maps
  for (const char in freq1) {
    if (freq1[char] !== freq2[char]) return false;
  }

  return true;
}

console.log(areAnagrams("listen", "silent")); // true
console.log(areAnagrams("hello", "world"));   // false

// 13. FIRST NON-REPEATING CHARACTER

function firstNonRepeating(str) {
  const freq = {};

  // Count frequencies
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }

  // Find first with count 1
  for (const char of str) {
    if (freq[char] === 1) return char;
  }

  return null;
}

console.log(firstNonRepeating("swiss")); // 'w'
console.log(firstNonRepeating("aabbcc")); // null

// 14. TOP K FREQUENT CHARACTERS

function topKFrequent(str, k) {
  const freq = charFrequency1(str);

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([char, count]) => ({ char, count }));
}

console.log(topKFrequent("mississippi", 2));
// [{ char: 'i', count: 4 }, { char: 's', count: 4 }]
```

**Time Complexity:**
- Object/Map approach: O(n) where n is string length
- Space: O(k) where k is number of unique characters

**Space Complexity:**
- Object/Map: O(k) for k unique characters
- Array approach: O(256) for ASCII or O(65536) for Unicode BMP

### Common Mistakes

- ❌ **Mistake:** Not handling empty strings
  ```javascript
  function charFreq(str) {
    const freq = {};
    for (const char of str) { // Works, but no validation
      freq[char] = (freq[char] || 0) + 1;
    }
    return freq;
  }
  charFreq(""); // {} (works, but should validate)
  ```

- ❌ **Mistake:** Using `str.split('')` for Unicode strings
  ```javascript
  "😀🎉".split(''); // Breaks emoji!
  // Use [...str] or for...of instead
  ```

- ✅ **Correct:** Validate input and handle Unicode
  ```javascript
  function charFreq(str) {
    if (!str || typeof str !== 'string') return {};

    const freq = {};
    for (const char of str) { // Handles Unicode correctly
      freq[char] = (freq[char] || 0) + 1;
    }
    return freq;
  }
  ```

<details>
<summary><strong>🔍 Deep Dive: Character Frequency Optimization</strong></summary>


**Hash Map Performance:**

```javascript
// Object vs Map performance for character counting

// Test with 1 million character string
const testStr = "abcdefghij".repeat(100000);

// Object approach
console.time('Object');
const freq1 = {};
for (const char of testStr) {
  freq1[char] = (freq1[char] || 0) + 1;
}
console.timeEnd('Object'); // ~15ms

// Map approach
console.time('Map');
const freq2 = new Map();
for (const char of testStr) {
  freq2.set(char, (freq2.get(char) || 0) + 1);
}
console.timeEnd('Map'); // ~18ms

// Array approach (fastest for ASCII)
console.time('Array');
const freq3 = new Array(256).fill(0);
for (const char of testStr) {
  freq3[char.charCodeAt(0)]++;
}
console.timeEnd('Array'); // ~8ms

// Winner: Array approach (2x faster for ASCII)
// But: Object is most flexible and readable
```

**Memory Layout:**

```javascript
// V8 internal representation

// Object property storage
const freq = { a: 5, b: 3, c: 10 };
// V8 uses:
// - Hidden class (shape) for property layout
// - Properties array for values
// - Fast property access for first ~10 properties
// - Slow dictionary mode for >100 properties

// Map storage
const freqMap = new Map([['a', 5], ['b', 3], ['c', 10]]);
// V8 uses:
// - Hash table with linked list for collisions
// - Separate storage for keys and values
// - Maintains insertion order

// Array storage (ASCII)
const freqArray = new Array(256);
// V8 uses:
// - Contiguous memory block
// - Direct index access (fastest)
// - Fixed size (wasteful for sparse data)
```

**Cache Locality Impact:**

```javascript
// Sequential access (better cache performance)
function sequentialCount(str) {
  const freq = new Map();

  // Process characters in order (cache-friendly)
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    freq.set(char, (freq.get(char) || 0) + 1);
  }

  return freq;
}

// Random access (worse cache performance)
function randomCount(str) {
  const freq = new Map();
  const indices = [...Array(str.length).keys()].sort(() => Math.random() - 0.5);

  // Process in random order (cache misses)
  for (const i of indices) {
    const char = str[i];
    freq.set(char, (freq.get(char) || 0) + 1);
  }

  return freq;
}

// Sequential: Better CPU cache hits
// Random: More cache misses = slower
```

**Algorithmic Optimizations:**

```javascript
// Early termination for specific queries

// Find if any character repeats (don't need full count)
function hasRepeatingChar(str) {
  const seen = new Set();

  for (const char of str) {
    if (seen.has(char)) return true; // Early exit!
    seen.add(char);
  }

  return false;
}

// Time: O(n) worst case, O(k) average where k << n
// Space: O(min(n, unique_chars))

// Find first character with frequency > threshold
function findFrequentChar(str, threshold) {
  const freq = {};

  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
    if (freq[char] > threshold) return char; // Early exit!
  }

  return null;
}

// Time: O(n) worst case, but often much less
```

**SIMD Optimization (Advanced):**

```javascript
// Modern CPUs can process multiple characters in parallel
// V8 may use SIMD for certain string operations

// Hypothetical SIMD-optimized counting (not directly accessible in JS)
// V8 internal optimization for character comparisons

function countSpecificChar(str, target) {
  let count = 0;

  // V8 can optimize this loop with SIMD
  for (let i = 0; i < str.length; i++) {
    if (str[i] === target) count++;
  }

  return count;

  // V8 TurboFan may:
  // 1. Process 16 characters at once (SSE)
  // 2. Use vector comparison instructions
  // 3. Reduce loop overhead
}

// Manual SIMD (if available via WebAssembly)
// Can achieve 4-8x speedup for large strings
```

</details>

<details>
<summary><strong>🐛 Real-World Scenario: Password Strength Checker Bug</strong></summary>


**Scenario:** Your password strength checker fails to properly count character types, allowing weak passwords that don't meet security requirements.

**The Problem:**

```javascript
// ❌ BUGGY: Incorrect character type counting
function checkPasswordStrength(password) {
  const freq = {};
  let lowercase = 0;
  let uppercase = 0;
  let digits = 0;
  let special = 0;

  for (const char of password) {
    freq[char] = (freq[char] || 0) + 1;

    // BUG: Using string comparison instead of charCode
    if (char >= 'a' && char <= 'z') lowercase++;
    if (char >= 'A' && char <= 'Z') uppercase++;
    if (char >= '0' && char <= '9') digits++;
    // BUG: Missing special character counting!
  }

  // Requirements: At least 1 of each type
  const isStrong = lowercase > 0 && uppercase > 0 && digits > 0 && special > 0;

  return { isStrong, freq, lowercase, uppercase, digits, special };
}

// Test weak password
console.log(checkPasswordStrength("Password1"));
// {
//   isStrong: false,  // Should be false (no special chars)
//   special: 0        // Correct!
// }

// But this passes when it shouldn't:
console.log(checkPasswordStrength("password123"));
// {
//   isStrong: false,  // Correct
//   lowercase: 8,
//   uppercase: 0,     // Correct
//   digits: 3,
//   special: 0
// }

// Production impact:
// - Weak passwords accepted: 230/day
// - Account compromises: 15/month
// - Password reset requests: 450/week
// - Security team escalations: 8/week
```

**Solution:**

```javascript
// ✅ FIXED: Proper character type counting
function checkPasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }

  const freq = {};
  const types = {
    lowercase: 0,
    uppercase: 0,
    digits: 0,
    special: 0
  };

  for (const char of password) {
    freq[char] = (freq[char] || 0) + 1;

    const code = char.charCodeAt(0);

    if (code >= 97 && code <= 122) {       // a-z
      types.lowercase++;
    } else if (code >= 65 && code <= 90) { // A-Z
      types.uppercase++;
    } else if (code >= 48 && code <= 57) { // 0-9
      types.digits++;
    } else {
      types.special++;
    }
  }

  // Check requirements
  const isStrong =
    types.lowercase > 0 &&
    types.uppercase > 0 &&
    types.digits > 0 &&
    types.special > 0 &&
    password.length >= 8;

  // Calculate strength score
  const score =
    (types.lowercase > 0 ? 25 : 0) +
    (types.uppercase > 0 ? 25 : 0) +
    (types.digits > 0 ? 25 : 0) +
    (types.special > 0 ? 25 : 0);

  return {
    isStrong,
    score,
    types,
    frequency: freq,
    length: password.length
  };
}

// Test cases
console.log(checkPasswordStrength("password123"));
// { isStrong: false, score: 50, types: { lowercase: 8, uppercase: 0, digits: 3, special: 0 } }

console.log(checkPasswordStrength("Password123!"));
// { isStrong: true, score: 100, types: { lowercase: 7, uppercase: 1, digits: 3, special: 1 } }

console.log(checkPasswordStrength("P@ss1"));
// { isStrong: false, score: 100 } // All types but too short
```

**Production Metrics After Fix:**

```javascript
// Before fix:
// - Weak passwords accepted: 230/day
// - Account compromises: 15/month
// - Password reset requests: 450/week
// - User complaints: 35/week

// After fix:
// - Weak passwords accepted: 0/day ✅
// - Account compromises: 1/month (95% reduction) ✅
// - Password reset requests: 180/week (60% reduction) ✅
// - Security incidents: 0 critical
// - User satisfaction: +78%
```

</details>

<details>
<summary><strong>⚖️ Trade-offs: Character Counting Approaches</strong></summary>


</details>

### Comparison Matrix

| Approach | Time | Space | Unicode | Readability | Use Case |
|----------|------|-------|---------|-------------|----------|
| **Object** | O(n) | O(k) | ✅ Good | ✅ Excellent | General purpose |
| **Map** | O(n) | O(k) | ✅ Perfect | ✅ Good | Modern code |
| **Array (ASCII)** | O(n) | O(256) | ❌ ASCII only | ⚠️ Okay | Performance critical |
| **Reduce** | O(n) | O(k) | ✅ Good | ⚠️ Functional | Functional style |

### Decision Guide

**For general text processing:**
```javascript
// ✅ Use Object (simplest, most compatible)
const freq = {};
for (const char of str) {
  freq[char] = (freq[char] || 0) + 1;
}
```

**For modern applications:**
```javascript
// ✅ Use Map (better for non-string keys, maintains order)
const freq = new Map();
for (const char of str) {
  freq.set(char, (freq.get(char) || 0) + 1);
}
```

**For ASCII performance:**
```javascript
// ✅ Use Array (2x faster for ASCII-only text)
const freq = new Array(256).fill(0);
for (const char of str) {
  freq[char.charCodeAt(0)]++;
}
```

<details>
<summary><strong>💬 Explain to Junior: Character Frequency Simplified</strong></summary>


**Simple Analogy: Counting Candies**

Imagine you have a bag of mixed candies and want to count how many of each color:

```javascript
// Candies: "RRBGGRRRBY" (R=Red, B=Blue, G=Green, Y=Yellow)

function countCandies(bag) {
  const count = {};

  for (const candy of bag) {
    // If we haven't seen this candy, start at 0
    // Then add 1
    count[candy] = (count[candy] || 0) + 1;
  }

  return count;
}

console.log(countCandies("RRBGGRRRBY"));
// { R: 6, B: 2, G: 2, Y: 1 }
```

**How the Counting Works:**

```javascript
// Step by step:
const bag = "RRB";
const count = {};

// First R:
count['R'] = (count['R'] || 0) + 1;  // undefined || 0 = 0, then + 1 = 1
// count = { R: 1 }

// Second R:
count['R'] = (count['R'] || 0) + 1;  // 1 || 0 = 1, then + 1 = 2
// count = { R: 2 }

// First B:
count['B'] = (count['B'] || 0) + 1;  // undefined || 0 = 0, then + 1 = 1
// count = { R: 2, B: 1 }
```

**Common Beginner Mistakes:**

```javascript
// ❌ MISTAKE 1: Forgetting to initialize
function wrong(str) {
  const freq = {};
  for (const char of str) {
    freq[char]++; // NaN! (undefined + 1 = NaN)
  }
  return freq;
}

// ✅ Correct:
function correct(str) {
  const freq = {};
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1; // Initialize to 0 if undefined
  }
  return freq;
}


// ❌ MISTAKE 2: Using array methods unnecessarily
function slow(str) {
  return str.split('').reduce((freq, char) => {
    freq[char] = (freq[char] || 0) + 1;
    return freq;
  }, {});
}
// Slower due to split + reduce overhead

// ✅ Better:
function fast(str) {
  const freq = {};
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }
  return freq;
}
```

**Key Rules:**
1. **Initialize to 0 if undefined:** `(freq[char] || 0)`
2. **Use for...of loop** for clean iteration
3. **Test with duplicates:** "aabbcc" should give { a: 2, b: 2, c: 2 }

</details>

### Follow-up Questions

- "How would you find the most frequent character?"
- "How can you use character frequency to detect anagrams?"
- "What's the time complexity of this operation?"
- "How would you handle case-insensitive counting?"

### Resources

- [MDN: Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
- [MDN: for...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of)

---

