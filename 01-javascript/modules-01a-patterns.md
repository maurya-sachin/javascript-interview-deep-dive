# Modules & Design Patterns

> **Focus**: JavaScript fundamentals and advanced concepts

---

## Question 1: ES6 Modules vs CommonJS - What's the Difference?

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐⭐
**Time:** 10-12 minutes
**Companies:** Google, Meta, Amazon, Microsoft, Netflix

### Question
Explain the differences between ES6 modules (ESM) and CommonJS. When would you use each?

### Answer

**ES6 Modules (ESM)** and **CommonJS** are two different module systems for organizing JavaScript code.

**Key Differences:**

| Feature | ES6 Modules | CommonJS |
|---------|-------------|----------|
| Syntax | `import/export` | `require/module.exports` |
| Loading | Static (compile-time) | Dynamic (runtime) |
| Environment | Browser + Node.js (>= 12) | Node.js primarily |
| Tree Shaking | ✅ Yes | ❌ No |
| Top-level await | ✅ Yes | ❌ No |
| `this` in module | `undefined` | `exports` object |
| File extension | `.mjs` or `.js` (with type: module) | `.js` or `.cjs` |

### Code Example

**ES6 Modules:**

```javascript
// math.js (ES6 Module)
export const PI = 3.14159;

export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

export default function multiply(a, b) {
  return a * b;
}

// app.js (ES6 Import)
import multiply, { add, subtract, PI } from './math.js';

console.log(add(5, 3));        // 8
console.log(subtract(5, 3));   // 2
console.log(multiply(5, 3));   // 15
console.log(PI);               // 3.14159

/*
ES6 MODULE FEATURES:
====================
1. Static structure (analyzed at parse time)
2. Named exports + default export
3. Imports are hoisted
4. Imports are read-only (immutable bindings)
5. Supports tree shaking (dead code elimination)
*/
```

**CommonJS:**

```javascript
// math.js (CommonJS)
const PI = 3.14159;

function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

function multiply(a, b) {
  return a * b;
}

module.exports = {
  PI,
  add,
  subtract,
  multiply: multiply  // or just 'multiply' with shorthand
};

// Or export default function:
// module.exports = multiply;

// app.js (CommonJS Require)
const { add, subtract, multiply, PI } = require('./math');
// or: const math = require('./math');

console.log(add(5, 3));        // 8
console.log(subtract(5, 3));   // 2
console.log(multiply(5, 3));   // 15
console.log(PI);               // 3.14159

/*
COMMONJS FEATURES:
==================
1. Dynamic structure (evaluated at runtime)
2. Synchronous loading
3. Exports are values (copied)
4. Can conditionally require modules
5. No static analysis for tree shaking
*/
```

**Static vs Dynamic Loading:**

```javascript
// ES6 - STATIC (must be top-level)
import { func } from './module.js';  // ✅ OK

if (condition) {
  import { func } from './module.js';  // ❌ Error
}

// Must use dynamic import() for conditional
if (condition) {
  const module = await import('./module.js');  // ✅ OK
}

// CommonJS - DYNAMIC (can be anywhere)
const module1 = require('./module1');  // ✅ OK

if (condition) {
  const module2 = require('./module2');  // ✅ OK (dynamic)
}

function loadModule() {
  return require('./module3');  // ✅ OK
}

/*
WHY STATIC IS BETTER:
=====================
1. Bundlers can analyze dependencies at build time
2. Tree shaking possible (remove unused code)
3. Better IDE support (autocomplete, refactoring)
4. Faster module resolution
*/
```

**Live Bindings vs Value Copy:**

```javascript
// ES6 - LIVE BINDINGS
// counter.js
export let count = 0;

export function increment() {
  count++;
}

// app.js
import { count, increment } from './counter.js';

console.log(count);  // 0
increment();
console.log(count);  // 1 (live binding!)

// count++;  // ❌ TypeError: Assignment to constant variable
// Imports are read-only!

// CommonJS - VALUE COPY
// counter.js
let count = 0;

function increment() {
  count++;
}

module.exports = { count, increment };

// app.js
const { count, increment } = require('./counter');

console.log(count);  // 0
increment();
console.log(count);  // 0 (copied value!)

// To get updated value:
const counter = require('./counter');
console.log(counter.count);  // 1 (accessing object property)

/*
LIVE BINDINGS:
==============
ES6: Import binds to actual variable (live)
CommonJS: Exports copy of value (snapshot)

Impact:
- ES6: Changes in exporting module reflected in importing module
- CommonJS: Need to export object to share mutable state
*/
```

**Circular Dependencies:**

```javascript
// ES6 live bindings help with circular deps, but `const`/`let` exports
// still hit the temporal dead zone (TDZ) if read before initialization

// a.js (ES6)
import { b } from './b.js';
export const a = 'a';
console.log('a.js:', b);

// b.js (ES6)
import { a } from './a.js';
export const b = 'b';
console.log('b.js:', a);

// main.js
import './a.js';
// Actual output:
// ReferenceError: Cannot access 'a' before initialization
// (b.js runs before a.js reaches `export const a = 'a'`, and `const`
// bindings are not initialized until that line executes — accessing
// them earlier throws, it does NOT silently return undefined)

// ✅ Function declarations avoid this because they're fully hoisted:
// a.js
import { fb } from './b.js';
export function fa() { return 'a'; }
console.log('a.js sees fb():', fb()); // 'b'
// b.js
import { fa } from './a.js';
export function fb() { return 'b'; }
console.log('b.js sees fa():', fa()); // 'a'
// Output: fb.js sees fa(): a   →  fa.js sees fb(): b

// CommonJS (has issues)
// a.js
const { b } = require('./b');
exports.a = 'a';
console.log('a.js:', b);  // undefined (partial execution)

// b.js
const { a } = require('./a');
exports.b = 'b';
console.log('b.js:', a);  // undefined

/*
ES6 modules only handle circular deps gracefully when the circularly
referenced bindings are functions (hoisted) or are not accessed until
after all modules finish evaluating — const/let exports still throw.
CommonJS never throws here, but silently returns undefined instead.
*/
```

**Using Both in Node.js:**

```javascript
// package.json
{
  "type": "module"  // Treat .js as ES6 modules
}

// Or use file extensions:
// .mjs - ES6 modules
// .cjs - CommonJS
// .js - Depends on "type" in package.json

// Import CommonJS from ES6
// utils.cjs (CommonJS)
module.exports = { helper: () => 'help' };

// app.mjs (ES6)
import utils from './utils.cjs';  // ✅ Works
console.log(utils.helper());

// Import ES6 from CommonJS (needs dynamic import)
// module.mjs (ES6)
export const data = 'ES6 data';

// app.cjs (CommonJS)
(async () => {
  const module = await import('./module.mjs');
  console.log(module.data);
})();
```

### Common Mistakes

❌ **Wrong**: Mixing default and named exports confusingly
```javascript
// ❌ Confusing
export default function foo() {}
export const bar = 'bar';

// Import
import foo from './module';  // Gets default
import { bar } from './module';  // Gets named

// Better: Use all named or all default consistently
```

✅ **Correct**: Consistent export strategy
```javascript
// All named exports
export function foo() {}
export const bar = 'bar';

import { foo, bar } from './module';
```

❌ **Wrong**: Using require in ES6 modules
```javascript
// ES6 module
import something from './module.js';
const other = require('./other.js');  // ❌ Error
```

✅ **Correct**: Use dynamic import
```javascript
import something from './module.js';
const other = await import('./other.js');
```

### Follow-up Questions
1. "How does tree shaking work with ES6 modules?"
2. "Can you use top-level await in CommonJS?"
3. "How do bundlers handle different module formats?"
4. "What's the performance difference between ESM and CommonJS?"

<details>
<summary><strong>🔍 Deep Dive: Module Loading Internals & V8 Optimization</strong></summary>

**ES6 Modules: 3-Phase Loading Process**

```javascript
// Phase 1: CONSTRUCTION (Parse & Build Module Graph)
// =====================================================
// Before any code runs, V8 parses all imports statically

// app.js
import { helper } from './utils.js';
import { config } from './config.js';

// V8 builds dependency graph:
// app.js → utils.js
// app.js → config.js

// Graph is built at PARSE TIME (before execution)
// This enables:
// 1. Circular dependency detection
// 2. Dead code elimination (tree shaking)
// 3. Parallel module fetching (in browsers)


// Phase 2: INSTANTIATION (Memory Allocation & Linking)
// =====================================================
// V8 allocates memory for all exports and links imports

// utils.js
export let count = 0;
export function increment() { count++; }

// V8 creates:
// 1. Memory slot for 'count' variable
// 2. Reference binding from importers to this slot
// 3. Function object for 'increment'

// Imports are LIVE BINDINGS (not copies):
// app.js → utils.count (reference to actual memory slot)


// Phase 3: EVALUATION (Execute Code)
// ===================================
// Run module code in dependency order (bottom-up)

// 1. config.js runs first (no dependencies)
// 2. utils.js runs second (no dependencies)
// 3. app.js runs last (depends on both)

// Result: All modules initialized, variables assigned


// LIVE BINDINGS DEMONSTRATION:
// utils.js
export let counter = 0;
export function inc() { counter++; }

// app.js
import { counter, inc } from './utils.js';

console.log(counter); // 0
inc();
console.log(counter); // 1 (LIVE UPDATE!)

// How it works:
// counter in app.js is a REFERENCE to utils.counter
// When utils.counter changes, all importers see new value
// Implemented as indirect memory access (pointer)
```

**CommonJS: Single-Phase Immediate Execution**

```javascript
// CommonJS executes immediately when required

// utils.js
console.log('utils.js executing');
let count = 0;

function increment() {
  count++;
}

module.exports = { count, increment };

// app.js
console.log('Before require');
const { count, increment } = require('./utils'); // Executes utils.js NOW
console.log('After require');

// Output:
// Before require
// utils.js executing
// After require

// SYNCHRONOUS BLOCKING:
// require() blocks until module fully executes

// CACHING:
const utils1 = require('./utils'); // Executes utils.js
const utils2 = require('./utils'); // Returns cached (doesn't re-execute)

console.log(utils1 === utils2); // true (same object)


// VALUE COPY vs LIVE BINDING:
// utils.js
let counter = 0;
function inc() { counter++; }
module.exports = { counter, inc };

// app.js
const { counter, inc } = require('./utils');

console.log(counter); // 0
inc();
console.log(counter); // 0 (COPIED VALUE, not live!)

// Why? module.exports copies VALUES at export time:
// { counter: 0, inc: [Function] }

// To see updated value, access via object:
const utils = require('./utils');
console.log(utils.counter); // 0
inc();
console.log(utils.counter); // 1 (object property updated)
```

**V8 Optimization Internals:**

```javascript
// TREE SHAKING: How Bundlers Use Static Analysis

// library.js (1MB total)
export function usedFunction() { /* 10KB */ }
export function unusedA() { /* 200KB */ }
export function unusedB() { /* 300KB */ }
export function unusedC() { /* 490KB */ }

// app.js
import { usedFunction } from './library.js';

// Webpack/Rollup analysis:
// 1. Parse all export declarations (static)
// 2. Trace imports from entry point
// 3. Mark used exports
// 4. Eliminate unmarked code

// Final bundle: Only includes usedFunction (10KB)
// Savings: 990KB (99% reduction!)


// WHY COMMONJS CAN'T TREE SHAKE:

// library.js (CommonJS)
function usedFunction() { /* 10KB */ }
function unusedA() { /* 200KB */ }
function unusedB() { /* 300KB */ }

module.exports = {
  usedFunction,
  unusedA,
  unusedB
};

// app.js
const { usedFunction } = require('./library');

// Bundler sees:
// 1. require() call (dynamic, could be conditional)
// 2. module.exports = { ... } (runtime assignment)
// 3. Can't statically determine what's used
// 4. Must include ENTIRE module to be safe

// Final bundle: ALL 510KB included
// Why? Bundler can't prove unusedA/unusedB aren't needed


// DYNAMIC REQUIRE EXAMPLE (why static analysis fails):
const moduleName = userInput; // Could be anything!
const module = require(`./${moduleName}.js`); // Can't analyze statically

// Bundler must include ALL possible modules
```

**Module Resolution Algorithm:**

```javascript
// ES6 MODULES: Static Resolution
import { helper } from './utils.js';
// 1. Resolve path at parse time
// 2. Fetch module file
// 3. Add to dependency graph
// 4. Path must be string literal (static)

// ❌ Can't do this:
const path = './utils.js';
import { helper } from path; // SyntaxError


// COMMONJS: Dynamic Resolution
const path = process.env.NODE_ENV === 'production'
  ? './prod-utils'
  : './dev-utils';

const utils = require(path); // ✅ Works! (runtime resolution)

// Resolution steps:
// 1. Check if absolute/relative path
// 2. Try exact path
// 3. Try with .js extension
// 4. Try with .json extension
// 5. Try with .node extension
// 6. Try as directory (index.js)
// 7. Check node_modules
// 8. Move up directory tree
```

**Performance Benchmarks:**

```javascript
// Test: Import 100 modules, measure time

// ES6 MODULES (with HTTP/2 in browser):
// Initial load: 450ms (parallel fetches)
// Subsequent: 12ms (cached, instant graph)

// COMMONJS (Node.js):
// Initial load: 180ms (synchronous, no network)
// Subsequent: 8ms (cached requires)

// ES6 MODULES (bundled):
// Initial load: 85ms (single file, optimized)
// Tree shaking: -60% bundle size

// COMMONJS (bundled):
// Initial load: 120ms (single file, no optimization)
// Tree shaking: Not possible
```

**Circular Dependencies Handling:**

```javascript
// ES6 MODULES: const/let exports still throw in this circular shape

// a.js
import { b } from './b.js';
export const a = 'a';
console.log('a.js:', b);

// b.js
import { a } from './a.js';
export const b = 'b';
console.log('b.js:', a);

// Execution:
// 1. Parse both files, create bindings (hoisted, but in the TDZ)
// 2. Bindings for `a` and `b` exist but are NOT initialized yet
// 3. Execute b.js first: reading `a` while it's in the TDZ throws
// 4. a.js never reaches `console.log('a.js:', b)` — evaluation aborts

// Actual output:
// Uncaught ReferenceError: Cannot access 'a' before initialization
//
// (Using `export function` instead of `export const` avoids this,
// since function declarations are fully hoisted with their value.)


// COMMONJS: Partial Execution Problem

// a.js
const { b } = require('./b.js');
exports.a = 'a';
console.log('a.js:', b);

// b.js
const { a } = require('./a.js'); // a.js starts executing
exports.b = 'b';
console.log('b.js:', a); // a.js not finished, a is undefined

// Output:
// b.js: undefined (a.js partially executed)
// a.js: b

// Problem: module.exports updated after require()
// Solution: Use module.exports object, not destructuring
```

**Memory Usage:**

```javascript
// ES6 MODULES: Shared Namespace

// constants.js
export const BIG_ARRAY = new Array(1000000).fill(0); // 8MB

// Multiple importers share same array:
import { BIG_ARRAY } from './constants.js'; // Reference
import { BIG_ARRAY as ARR } from './constants.js'; // Same reference

// Memory: 8MB total (single instance)


// COMMONJS: Can Create Copies

// constants.js
module.exports = {
  BIG_ARRAY: new Array(1000000).fill(0) // 8MB
};

// If destructured:
const { BIG_ARRAY } = require('./constants'); // Reference to object property
const obj = require('./constants'); // Cached (same object)

// Memory: 8MB total (shared via cache)

// But if module returns new objects:
module.exports = () => ({
  BIG_ARRAY: new Array(1000000).fill(0)
});

// Each require creates new instance:
const obj1 = require('./constants')(); // 8MB
const obj2 = require('./constants')(); // Another 8MB

// Memory: 16MB (two instances!)
```

**Browser vs Node.js Differences:**

```javascript
// BROWSER: ES6 Modules Only
// <script type="module" src="app.js"></script>

// - Deferred by default (like defer attribute)
// - Runs after HTML parsed
// - CORS applies to cross-origin modules
// - Strict mode by default
// - Top-level 'this' is undefined
// - Can use import/export


// NODE.JS: Both Supported

// ES6 Modules (require "type": "module" in package.json or .mjs extension):
import { readFile } from 'fs/promises';
export const data = await readFile('file.txt'); // Top-level await ✅

// CommonJS (default or .cjs extension):
const fs = require('fs');
const data = fs.readFileSync('file.txt'); // Synchronous ✅

// Key difference:
// ESM: Asynchronous, promise-based
// CJS: Synchronous, blocking
```

</details>

<details>
<summary><strong>🐛 Real-World Scenario: Bundle Size Explosion After Library Import</strong></summary>

**Scenario:** Your production React app's bundle size jumped from 150KB to 2.3MB after adding moment.js for date formatting. Page load time increased from 1.2s to 8.5s, causing 35% bounce rate spike. Users complain about slow loading, especially on mobile networks.

**The Problem:**

```javascript
// ❌ ISSUE: CommonJS library + Single import pulls entire 2.3MB library

// components/DateFormatter.jsx
const moment = require('moment'); // Or import moment from 'moment'

function formatDate(date) {
  return moment(date).format('YYYY-MM-DD');
}

export default formatDate;


// Webpack bundle analysis shows:
// ┌──────────────────────────────────────┐
// │ Bundle Size: 2.3MB                   │
// ├──────────────────────────────────────┤
// │ moment.js: 2.15MB (93%)              │
// │ Your code: 150KB (7%)                │
// └──────────────────────────────────────┘

// Why so large?
// moment.js (CommonJS) includes:
// - Core library: 300KB
// - All locales: 1.8MB (160+ languages!)
// - Timezone data: 50KB
// - Legacy polyfills: 20KB

// Because it's CommonJS:
// - No tree shaking possible
// - Bundler includes EVERYTHING
// - Even though you only use format()
```

**Production Metrics Before Fix:**

```javascript
// Performance Impact:
// - Initial bundle: 150KB → 2.3MB (1,433% increase!)
// - Download time (4G): 0.8s → 6.2s
// - Parse time: 0.4s → 2.3s
// - Total load time: 1.2s → 8.5s (708% slower)

// Business Impact:
// - Bounce rate: 12% → 35% (192% increase)
// - Page views: -28%
// - Conversion rate: 4.2% → 2.1% (50% drop!)
// - Revenue loss: ~$15k/week
// - User complaints: 87 tickets/week
// - Mobile users most affected (50% of traffic)

// Lighthouse scores:
// Before: Performance 95, FCP 1.1s, LCP 1.8s
// After:  Performance 42, FCP 4.2s, LCP 8.5s
```

**Debugging Process:**

```javascript
// Step 1: Identify the culprit
// Run webpack-bundle-analyzer

npm install --save-dev webpack-bundle-analyzer

// webpack.config.js
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin()
  ]
};

// Build and view:
npm run build

// Browser opens showing:
// [moment.js: 2.15MB] ← HUGE!
// [react: 45KB]
// [your-app: 105KB]


// Step 2: Check what's actually used
// Search codebase for moment usage:

grep -r "moment" src/

// Results:
// src/components/DateFormatter.jsx:1: import moment from 'moment'
// src/components/DateFormatter.jsx:4: return moment(date).format('YYYY-MM-DD')

// Only using .format() method!
// Don't need 160 locales, timezones, etc.


// Step 3: Check if tree shaking is working
// Check moment.js package.json:

{
  "name": "moment",
  "main": "moment.js",  // CommonJS entry point ❌
  "module": undefined   // No ESM version ❌
}

// Problem: moment.js is CommonJS only
// No ESM build → no tree shaking possible
```

**Solution 1: Replace with ESM-Compatible Library**

```javascript
// ✅ FIX: Use date-fns (ESM, tree-shakeable)

// Before:
import moment from 'moment';

function formatDate(date) {
  return moment(date).format('YYYY-MM-DD');
}


// After:
import { format } from 'date-fns'; // Only imports format function!

function formatDate(date) {
  return format(new Date(date), 'yyyy-MM-dd');
}


// Bundle analysis after change:
// ┌──────────────────────────────────────┐
// │ Bundle Size: 165KB                   │
// ├──────────────────────────────────────┤
// │ date-fns/format: 15KB (9%)           │
// │ Your code: 150KB (91%)               │
// └──────────────────────────────────────┘

// Savings: 2.15MB removed (93% reduction!)

// Why it works:
// 1. date-fns is modular ESM library
// 2. Each function is separate export
// 3. Webpack only bundles 'format' function
// 4. Tree shaking removes unused functions
```

**Solution 2: Use Moment with Webpack IgnorePlugin**

```javascript
// ✅ ALTERNATIVE: Keep moment, exclude locales

// webpack.config.js
const webpack = require('webpack');

module.exports = {
  plugins: [
    // Ignore all locale files
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/,
    }),
  ],
};

// Now moment.js bundle:
// Before: 2.15MB (with all locales)
// After:  300KB (core only, 86% smaller)

// If you need specific locales:
import moment from 'moment';
import 'moment/locale/es'; // Import only Spanish
import 'moment/locale/fr'; // Import only French

// Bundle: 300KB + 15KB (locales) = 315KB
// Still 85% smaller than before!
```

**Solution 3: Dynamic Imports for Heavy Operations**

```javascript
// ✅ BEST: Code splitting with dynamic imports

// Before (loads moment immediately):
import moment from 'moment';

function DatePicker() {
  const [date, setDate] = useState(new Date());

  const handleFormat = () => {
    return moment(date).format('YYYY-MM-DD');
  };

  return <div>{handleFormat()}</div>;
}


// After (loads moment only when needed):
function DatePicker() {
  const [date, setDate] = useState(new Date());
  const [formatted, setFormatted] = useState('');

  const handleFormat = async () => {
    // Dynamic import - separate chunk
    const moment = (await import('moment')).default;
    setFormatted(moment(date).format('YYYY-MM-DD'));
  };

  useEffect(() => {
    handleFormat();
  }, [date]);

  return <div>{formatted}</div>;
}

// Webpack creates:
// - main.bundle.js: 150KB (your app)
// - moment.chunk.js: 300KB (loaded on demand)

// Initial load: 150KB (80% faster!)
// Moment loads async after page interactive
```

**Solution 4: Native Intl API (No Library!)**

```javascript
// ✅ MODERN BEST: Use browser's built-in Intl API

// Before:
import moment from 'moment';
const formatted = moment(date).format('YYYY-MM-DD');

// After (zero dependencies!):
const formatted = new Intl.DateTimeFormat('en-CA').format(date);
// 'en-CA' locale uses YYYY-MM-DD format

// Or with options:
const formatted = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(date);

// Bundle impact: 0 bytes (built into browser!)
// Supported: All modern browsers (IE11+)


// More examples:
// Relative time (like moment.fromNow()):
const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
rtf.format(-1, 'day'); // "yesterday"
rtf.format(2, 'day');  // "in 2 days"

// Number formatting:
const nf = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});
nf.format(1234.56); // "$1,234.56"
```

**Production Metrics After Fix:**

```javascript
// Implemented Solution 1 (date-fns) + Solution 4 (Intl for simple cases)

// Performance Impact:
// - Bundle size: 2.3MB → 165KB (93% reduction!)
// - Download time (4G): 6.2s → 0.9s
// - Parse time: 2.3s → 0.5s
// - Total load time: 8.5s → 1.4s (607% faster!)

// Business Impact:
// - Bounce rate: 35% → 10% (71% improvement)
// - Page views: +42% (recovered + growth)
// - Conversion rate: 2.1% → 4.8% (129% increase!)
// - Revenue recovered: $15k/week + $3k extra
// - User complaints: 87 → 4 tickets/week
// - Mobile users satisfaction: +92%

// Lighthouse scores:
// Performance: 42 → 96
// FCP: 4.2s → 1.0s
// LCP: 8.5s → 1.6s

// Developer benefits:
// - CI build time: 4.2 min → 1.8 min (57% faster)
// - HMR rebuild: 8s → 2s (75% faster)
// - Deployment size: 2.3MB → 165KB (cheaper hosting)
```

**Migration Script:**

```javascript
// Automated migration from moment to date-fns

// codemod.js (using jscodeshift)
module.exports = function(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // Replace moment imports
  root.find(j.ImportDeclaration, {
    source: { value: 'moment' }
  }).forEach(path => {
    // Change to date-fns
    path.node.source.value = 'date-fns';
    path.node.specifiers = [
      j.importSpecifier(j.identifier('format'))
    ];
  });

  // Replace moment().format() calls
  root.find(j.CallExpression, {
    callee: {
      object: { callee: { name: 'moment' } },
      property: { name: 'format' }
    }
  }).forEach(path => {
    // moment(date).format('YYYY-MM-DD')
    // → format(new Date(date), 'yyyy-MM-dd')

    const dateArg = path.node.callee.object.arguments[0];
    const formatStr = path.node.arguments[0];

    // Convert format string (moment → date-fns)
    const newFormat = formatStr.value
      .replace(/YYYY/g, 'yyyy')
      .replace(/DD/g, 'dd');

    path.replace(
      j.callExpression(
        j.identifier('format'),
        [
          j.newExpression(j.identifier('Date'), [dateArg]),
          j.literal(newFormat)
        ]
      )
    );
  });

  return root.toSource();
};

// Run migration:
npx jscodeshift -t codemod.js src/**/*.js
```

**Key Lessons:**

1. **Check bundle size after every dependency** (use bundle analyzer)
2. **Prefer ESM libraries** over CommonJS for tree shaking
3. **Use dynamic imports** for heavy libraries loaded conditionally
4. **Consider native APIs** (Intl) before adding libraries
5. **Monitor Lighthouse scores** in CI/CD pipeline
6. **Test on slow networks** (3G/4G throttling)
7. **Bundle size budget** (<200KB gzipped for main bundle)

</details>

<details>
<summary><strong>⚖️ Trade-offs: ES6 Modules vs CommonJS Decision Matrix</strong></summary>

### Comprehensive Comparison

| Aspect | ES6 Modules (ESM) | CommonJS (CJS) |
|--------|------------------|----------------|
| **Loading** | Asynchronous, 3-phase | Synchronous, immediate |
| **Syntax** | `import/export` | `require/module.exports` |
| **Static Analysis** | ✅ Yes (parse-time) | ❌ No (runtime) |
| **Tree Shaking** | ✅ Possible | ❌ Not possible |
| **Live Bindings** | ✅ Yes (reference) | ❌ No (value copy) |
| **Top-level await** | ✅ Supported | ❌ Not supported |
| **Circular Dependencies** | ✅ Handles well | ⚠️ Partial execution |
| **Browser Support** | ✅ Native | ❌ Needs bundler |
| **Node.js** | ✅ v12+ (requires config) | ✅ Default |
| **Dynamic Imports** | ✅ `import()` | ✅ `require()` |
| **Bundle Size** | ✅ Smaller (optimized) | ❌ Larger (no optimization) |
| **Performance** | ⚠️ Slower initial parse | ✅ Faster execution |
| **Backwards Compat** | ❌ Modern only | ✅ Works everywhere |
| **TypeScript** | ✅ First-class | ✅ Compatible |

### When to Use ES6 Modules

```javascript
// ✅ USE ESM WHEN:

// 1. Building modern web applications
import React from 'react';
import { useState } from 'react';
// - Tree shaking critical for bundle size
// - Targeting modern browsers
// - Using TypeScript


// 2. Publishing libraries (provide ESM build)
// package.json
{
  "name": "my-library",
  "main": "dist/index.js",      // CommonJS (backwards compat)
  "module": "dist/index.esm.js", // ES6 (tree shaking)
  "type": "module"
}
// - Consumers can tree shake
// - Better DX for modern tools


// 3. Browser-only code
<script type="module">
  import { render } from './app.js';
  render();
</script>
// - Native browser support
// - No build step needed


// 4. Using top-level await
// config.js
const response = await fetch('/api/config');
const config = await response.json();
export default config;
// - Only works with ESM
// - Clean async initialization


// 5. Need live bindings
// counter.js
export let count = 0;
export function increment() { count++; }

// app.js
import { count, increment } from './counter.js';
console.log(count); // 0
increment();
console.log(count); // 1 (live update!)
```

### When to Use CommonJS

```javascript
// ✅ USE COMMONJS WHEN:

// 1. Node.js scripts and tools
const fs = require('fs');
const path = require('path');
// - Simpler setup (no "type": "module")
// - Synchronous loading (fine for server)
// - Established pattern


// 2. Legacy Node.js environments
// Supporting Node.js < 12
const express = require('express');
const app = express();
// - ESM not available
// - CommonJS only option


// 3. Dynamic module loading needed
const moduleName = process.env.DB_TYPE; // 'postgres' or 'mysql'
const db = require(`./adapters/${moduleName}`);
// - Runtime path resolution
// - Conditional requires
// - ESM requires import() (more verbose)


// 4. Rapid prototyping/scripts
const axios = require('axios');
axios.get('/api/data').then(res => console.log(res.data));
// - Quick to write
// - No config needed
// - Single-file scripts


// 5. Publishing Node.js-only packages
// CLI tools, build tools, server utilities
module.exports = function buildTool(options) {
  // ...
};
// - Node.js ecosystem standard
// - Better backward compatibility
```

### Hybrid Approach (Support Both)

```javascript
// DUAL PACKAGE (ESM + CJS):

// package.json
{
  "name": "my-package",
  "version": "1.0.0",
  "type": "module", // Default to ESM
  "main": "./dist/index.cjs",    // CommonJS entry
  "module": "./dist/index.js",   // ESM entry
  "exports": {
    ".": {
      "import": "./dist/index.js",  // ESM
      "require": "./dist/index.cjs" // CJS
    }
  }
}

// Build two versions:
// ESM: dist/index.js
// CJS: dist/index.cjs

// Consumers get best of both:
// import { helper } from 'my-package'; // Uses ESM (tree shakeable)
// const { helper } = require('my-package'); // Uses CJS (works in old Node)
```

### Migration Strategy

```javascript
// MIGRATING FROM COMMONJS TO ESM:

// Phase 1: Add "type": "module" to package.json
{
  "type": "module"
}

// Phase 2: Rename .js to .mjs (or keep .js with type: module)
// - utils.js → utils.mjs

// Phase 3: Convert syntax
// Before:
const fs = require('fs');
const { readFile } = require('fs/promises');
module.exports = { myExport };

// After:
import fs from 'fs';
import { readFile } from 'fs/promises';
export { myExport };

// Phase 4: Update imports
// Before:
const utils = require('./utils');
const { helper } = require('./helpers');

// After:
import utils from './utils.js'; // Note: .js extension required!
import { helper } from './helpers.js';

// Phase 5: Handle CommonJS dependencies
// Old CommonJS modules can be imported:
import express from 'express'; // Works (ESM imports CJS)

// But not vice versa:
// const esmModule = require('./esm-module'); // Error!
// Use dynamic import instead:
const esmModule = await import('./esm-module.js');
```

### Performance Comparison

```javascript
// BENCHMARK: 100 module imports

// ES6 Modules (Browser with HTTP/2):
// - Parse time: 120ms
// - Network time: 450ms (parallel fetches)
// - Total: 570ms
// - Subsequent: 8ms (cached)

// ES6 Modules (Bundled):
// - Single file download: 80ms
// - Parse: 35ms
// - Total: 115ms
// - Bundle size: 60% smaller (tree shaking)

// CommonJS (Node.js):
// - Sync requires: 95ms
// - No network (local files)
// - Total: 95ms
// - Subsequent: 4ms (cached)

// CommonJS (Bundled):
// - Single file download: 140ms
// - Parse: 42ms
// - Total: 182ms
// - Bundle size: Larger (no optimization)


// WINNER:
// - Browser: ESM bundled (tree shaking wins)
// - Node.js: CommonJS (sync faster for server)
// - Library: ESM (let consumers tree shake)
```

### Real-World Recommendations

| Project Type | Recommendation | Reason |
|-------------|----------------|--------|
| **React/Vue/Angular App** | ESM | Tree shaking, modern tooling |
| **Next.js/Nuxt** | ESM | Framework default, better optimization |
| **Node.js API Server** | Either (ESM preferred) | Top-level await, modern syntax |
| **CLI Tool** | CommonJS | Better compatibility, simpler |
| **Library (npm package)** | Both (dual build) | Support all consumers |
| **Browser Scripts** | ESM | Native support, no build needed |
| **Legacy Node (<12)** | CommonJS | ESM not available |
| **Monorepo** | ESM | Better workspace support |
| **Quick Scripts** | CommonJS | Less config, faster setup |

### Common Pitfalls

```javascript
// ❌ PITFALL 1: Missing .js extension in ESM
import utils from './utils'; // Error in Node.js ESM!
import utils from './utils.js'; // ✅ Required

// ❌ PITFALL 2: Mixing import/require in same file
import React from 'react';
const express = require('express'); // Error if type: "module"

// ✅ FIX: Use dynamic import
import React from 'react';
const express = (await import('express')).default;

// ❌ PITFALL 3: __dirname in ESM (not available)
console.log(__dirname); // ReferenceError

// ✅ FIX: Use import.meta.url
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ❌ PITFALL 4: require.resolve in ESM
const path = require.resolve('some-module'); // Error

// ✅ FIX: Use import.meta.resolve (experimental)
const path = import.meta.resolve('some-module');
```

### Decision Flowchart

```
Start: Need to choose module system
│
├─ Are you targeting browsers?
│  ├─ Yes → Use ESM (native support)
│  └─ No → Continue
│
├─ Are you building a library?
│  ├─ Yes → Provide BOTH (dual package)
│  └─ No → Continue
│
├─ Need to support Node.js < 12?
│  ├─ Yes → Use CommonJS
│  └─ No → Continue
│
├─ Need tree shaking / bundle optimization?
│  ├─ Yes → Use ESM
│  └─ No → Continue
│
├─ Need top-level await?
│  ├─ Yes → Use ESM (only option)
│  └─ No → Continue
│
├─ Need dynamic runtime requires?
│  ├─ Yes → Use CommonJS (simpler)
│  │         or ESM with import()
│  └─ No → Continue
│
└─ Default → Use ESM (modern standard)
```

</details>

<details>
<summary><strong>💬 Explain to Junior: ES6 Modules vs CommonJS Simplified</strong></summary>

**Simple Analogy: Restaurant vs Food Truck**

Think of modules like getting food:

**CommonJS = Food Truck (Make Everything First)**
```javascript
// Food truck makes ALL food when it opens
const menu = require('./food-truck');

// Food truck (food-truck.js):
console.log('Cooking pizza...');
console.log('Making burgers...');
console.log('Preparing salads...');
console.log('Baking desserts...');

module.exports = {
  pizza: '🍕',
  burger: '🍔',
  salad: '🥗',
  dessert: '🍰'
};

// You order: "Just pizza please"
const { pizza } = require('./food-truck');

// Result: Food truck still made EVERYTHING (even though you wanted pizza only)
// Wasted effort, wasted resources
```

**ES6 Modules = Restaurant (Order First, Cook What's Needed)**
```javascript
// Restaurant menu (restaurant.js):
export const pizza = '🍕';
export const burger = '🍔';
export const salad = '🥗';
export const dessert = '🍰';

// You order: "Just pizza please"
import { pizza } from './restaurant.js';

// Result: Restaurant ONLY makes pizza (smart!)
// Bundler sees you only import pizza
// Tree shaking removes burger, salad, dessert from final bundle
// Faster, smaller, efficient
```

**Why This Matters in Real Code:**

```javascript
// Imagine a big library (like moment.js):

// COMMONJS WAY:
const moment = require('moment');
// Includes:
// - Date formatting
// - 160 languages
// - Timezones
// - Calendars
// - Everything!
// Total: 2.3MB

// You only use:
moment().format('YYYY-MM-DD');

// But you get: ALL 2.3MB (can't remove unused parts)


// ESM WAY:
import { format } from 'date-fns';
// Bundler sees: "They only use format"
// Tree shaking: "Let's remove everything else"
// Final bundle: 15KB (just format function!)

// Savings: 2.3MB → 15KB (99% smaller!)
```

**Key Differences Explained Simply:**

**1. When Code Runs:**

```javascript
// COMMONJS: Runs IMMEDIATELY when required
// food.js
console.log('Making food!');
module.exports = { pizza: '🍕' };

// app.js
console.log('Before require');
const food = require('./food'); // Runs food.js NOW
console.log('After require');

// Output:
// Before require
// Making food!
// After require


// ESM: Analyzes first, runs later
// food.js
console.log('Making food!');
export const pizza = '🍕';

// app.js
console.log('Before import');
import { pizza } from './food.js'; // Doesn't run food.js yet!
console.log('After import');

// Output (different order!):
// Making food! (run during parse phase)
// Before import
// After import
```

**2. Values vs References (Live Bindings):**

```javascript
// COMMONJS: Copies values (like taking a photo)
// counter.js
let count = 0;
function increment() { count++; }
module.exports = { count, increment };

// app.js
const { count, increment } = require('./counter');
console.log(count); // 0
increment();
console.log(count); // Still 0! (photo doesn't update)


// ESM: Live references (like a webcam)
// counter.js
export let count = 0;
export function increment() { count++; }

// app.js
import { count, increment } from './counter.js';
console.log(count); // 0
increment();
console.log(count); // 1! (webcam shows live update)
```

**3. Static vs Dynamic:**

```javascript
// COMMONJS: Dynamic (decided at runtime)
const feature = userInput; // Could be anything!
const module = require(`./${feature}.js`); // ✅ Works

if (isDevelopment) {
  const devTools = require('./devTools'); // ✅ Works
}


// ESM: Static (decided at parse time)
const feature = userInput;
import module from `./${feature}.js`; // ❌ Error! (must be string literal)

if (isDevelopment) {
  import devTools from './devTools'; // ❌ Error! (must be top-level)
}

// ESM solution: dynamic import()
if (isDevelopment) {
  const devTools = await import('./devTools.js'); // ✅ Works
}
```

**4. Tree Shaking (Dead Code Elimination):**

```javascript
// Imagine a toolbox:

// tools.js
export function hammer() { /* ... */ }      // 5KB
export function screwdriver() { /* ... */ } // 5KB
export function saw() { /* ... */ }         // 5KB
export function drill() { /* ... */ }       // 5KB
// Total: 20KB

// COMMONJS:
const tools = require('./tools');
tools.hammer(); // Use only hammer

// Final bundle: 20KB (ALL tools included)
// Why? Bundler can't tell what's used (dynamic)


// ESM:
import { hammer } from './tools.js';
hammer(); // Use only hammer

// Final bundle: 5KB (ONLY hammer included)
// Why? Bundler sees "only hammer imported"
// Tree shaking removes unused tools
// Savings: 75%!
```

**Common Beginner Questions:**

**Q: "Can I use both in the same project?"**
```javascript
// ❌ Not in the same file
import React from 'react';
const express = require('express'); // Error!

// ✅ But different files can use different systems
// utils.js (ESM)
export const helper = () => {};

// server.js (CommonJS)
const express = require('express');
```

**Q: "Which should I use for new projects?"**
```javascript
// ✅ Use ESM for:
// - React/Vue/Angular apps
// - Modern web projects
// - Libraries (better for users)
// - Anything targeting browsers

// ✅ Use CommonJS for:
// - Quick Node.js scripts
// - Legacy Node.js (< v12)
// - When you need dynamic requires
```

**Q: "Why do I see both in tutorials?"**
```javascript
// Old tutorials (before 2015): CommonJS
const React = require('react');

// Modern tutorials (2015+): ESM
import React from 'react';

// Both work, but ESM is newer and better for most cases
```

**Visual Comparison:**

```javascript
// COMMONJS (Food Truck):
// 1. ❌ Makes everything immediately
// 2. ❌ Copies values (static photo)
// 3. ✅ Can load conditionally
// 4. ❌ Bundler can't optimize (includes everything)
// 5. ✅ Works in old Node.js

// ES6 MODULES (Restaurant):
// 1. ✅ Analyzes first, makes what's needed
// 2. ✅ Live references (webcam)
// 3. ⚠️ Must use import() for conditional
// 4. ✅ Bundler optimizes (tree shaking)
// 5. ⚠️ Needs modern Node.js (v12+)
```

**Practical Example - Before/After:**

```javascript
// Your app imports a huge library:

// BEFORE (CommonJS):
const _ = require('lodash');
_.debounce(fn, 100);

// Bundle size: 70KB (entire lodash)
// Load time: 2.1s


// AFTER (ESM):
import { debounce } from 'lodash-es';
debounce(fn, 100);

// Bundle size: 3KB (just debounce)
// Load time: 0.4s
// Savings: 95%!
```

**Key Takeaway for Juniors:**

1. **ESM is newer and better** for most projects (especially web apps)
2. **Tree shaking saves tons of space** (only include what you use)
3. **CommonJS still useful** for Node.js scripts and legacy code
4. **Live bindings are powerful** (imports update automatically)
5. **Start with ESM** for new projects unless you have a reason not to

**Quick Decision:**
- Building a website/web app? → **Use ESM**
- Building a quick Node.js script? → **CommonJS is fine**
- Publishing a library? → **Support both (dual build)**

</details>

### Resources
- [MDN: JavaScript Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [ES Modules: A Cartoon Deep Dive](https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/)
- [Node.js ES Modules](https://nodejs.org/api/esm.html)

---

## Question 2: Dynamic Import - How and When to Use It?

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐
**Time:** 8-10 minutes
**Companies:** Google, Meta, Netflix, Airbnb

### Question
Explain dynamic imports in JavaScript. When should you use them and what are the benefits?

### Answer

**Dynamic Import** allows you to load ES6 modules asynchronously at runtime using the `import()` function (returns a Promise).

**Key Points:**
1. **Syntax**: `import()` is a function-like expression that returns a Promise
2. **Code Splitting**: Enables splitting code into smaller chunks loaded on-demand
3. **Conditional Loading**: Load modules based on runtime conditions
4. **Performance**: Reduces initial bundle size, faster page loads
5. **Top-level await**: Can use await with dynamic imports in ES modules

### Code Example

```javascript
// 1. BASIC DYNAMIC IMPORT
// ✅ Load module when needed
button.addEventListener('click', async () => {
  const module = await import('./heavy-chart-library.js');
  module.renderChart(data);
});

// ❌ Static import loads immediately (slower initial load)
import { renderChart } from './heavy-chart-library.js';
button.addEventListener('click', () => renderChart(data));

// 2. CONDITIONAL MODULE LOADING
async function loadTranslations(locale) {
  let translations;

  if (locale === 'es') {
    translations = await import('./translations/es.js');
  } else if (locale === 'fr') {
    translations = await import('./translations/fr.js');
  } else {
    translations = await import('./translations/en.js');
  }

  return translations.default;
}

// Usage
const t = await loadTranslations('es');
console.log(t.greeting); // "Hola"

// 3. FEATURE DETECTION & POLYFILLS
async function loadPolyfills() {
  if (!('IntersectionObserver' in window)) {
    await import('intersection-observer');
  }

  if (!window.fetch) {
    await import('whatwg-fetch');
  }
}

// 4. ROUTE-BASED CODE SPLITTING (React Router example)
const routes = [
  {
    path: '/dashboard',
    component: () => import('./pages/Dashboard.jsx')
  },
  {
    path: '/profile',
    component: () => import('./pages/Profile.jsx')
  },
  {
    path: '/settings',
    component: () => import('./pages/Settings.jsx')
  }
];

// 5. LAZY LOADING IMAGES
async function lazyLoadImages() {
  const images = document.querySelectorAll('img[data-src]');

  const { default: LazyLoad } = await import('vanilla-lazyload');

  new LazyLoad({
    elements_selector: 'img[data-src]'
  });
}

// 6. ERROR HANDLING
async function safeImport(modulePath) {
  try {
    const module = await import(modulePath);
    return module;
  } catch (error) {
    console.error(`Failed to load module: ${modulePath}`, error);
    // Fallback strategy
    return import('./fallback-module.js');
  }
}

// 7. PARALLEL DYNAMIC IMPORTS
async function loadMultipleModules() {
  const [
    { default: Chart },
    { default: Table },
    { default: Map }
  ] = await Promise.all([
    import('./Chart.js'),
    import('./Table.js'),
    import('./Map.js')
  ]);

  return { Chart, Table, Map };
}

// 8. PRELOADING (hint to browser)
// Add to <head>
// <link rel="modulepreload" href="/heavy-module.js">

// Then import when needed
const module = await import('./heavy-module.js'); // Already preloaded!

// 9. DYNAMIC IMPORT WITH DESTRUCTURING
const { helper, util, formatter } = await import('./utils.js');

// 10. IMPORT WITH FALLBACK
async function importWithFallback(primaryPath, fallbackPath) {
  try {
    return await import(primaryPath);
  } catch {
    return await import(fallbackPath);
  }
}

// Usage
const module = await importWithFallback(
  './cdn-module.js',
  './local-module.js'
);

// 11. VITE/WEBPACK GLOB IMPORTS (build-time)
// Vite
const modules = import.meta.glob('./modules/*.js');
// Returns: { './modules/a.js': () => import('./modules/a.js'), ... }

for (const path in modules) {
  modules[path]().then(mod => console.log(mod));
}

// 12. DYNAMIC IMPORT IN NODE.JS
// ES module (Node >= 20.10, import attributes)
// Note: the older `assert: { type: 'json' }` syntax (import assertions)
// has been replaced by `with { type: 'json' }` (import attributes) and
// no longer works on current Node.js versions.
const config = await import('./config.json', {
  with: { type: 'json' }
});

// 13. REACT LAZY LOADING
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  );
}

// 14. ANALYTICS TRACKING (load after page interactive)
window.addEventListener('load', async () => {
  const { initAnalytics } = await import('./analytics.js');
  initAnalytics();
});

// 15. A/B TESTING
async function loadExperiment(variant) {
  if (variant === 'A') {
    return import('./experiments/variant-a.js');
  } else {
    return import('./experiments/variant-b.js');
  }
}
```

### Common Mistakes

❌ **Wrong**: Not handling Promise rejection
```javascript
const module = await import('./module.js'); // May crash app
```

✅ **Correct**: Always use try-catch
```javascript
try {
  const module = await import('./module.js');
} catch (error) {
  console.error('Module load failed:', error);
}
```

❌ **Wrong**: Using dynamic import for critical above-fold code
```javascript
// Header component (critical!)
const Header = await import('./Header.js'); // ❌ Slower
```

✅ **Correct**: Static import for critical path
```javascript
import Header from './Header.js'; // ✅ Bundled, immediate
```

### Follow-up Questions
1. "How does dynamic import affect bundle size?"
2. "Can you use dynamic import in CommonJS?"
3. "What's the difference between import() and require()?"
4. "How do bundlers handle dynamic imports?"

<details>
<summary><strong>🔍 Deep Dive: Dynamic Import Implementation & Bundler Internals</strong></summary>

**How Dynamic Imports Work (Browser & Bundler):**

```javascript
// 1. BROWSER NATIVE DYNAMIC IMPORT
// Modern browsers support import() natively

// index.html
<script type="module">
  // This creates a PROMISE that resolves to the module
  const modulePromise = import('./utils.js');

  modulePromise.then(module => {
    console.log(module); // Module namespace object
    module.helper(); // Call exported function
  });

  // Or with async/await:
  const module = await import('./utils.js');
  module.helper();
</script>

// How it works internally:
// 1. Browser creates new <script type="module"> tag
// 2. Fetches ./utils.js via network request
// 3. Parses and evaluates module
// 4. Returns module namespace object
// 5. Caches module for future imports


// 2. WEBPACK DYNAMIC IMPORT (Code Splitting)
// Webpack transforms dynamic imports into chunk loading

// Your code:
button.addEventListener('click', async () => {
  const module = await import('./heavy-feature.js');
  module.init();
});

// Webpack compiles to (simplified):
button.addEventListener('click', async () => {
  // Webpack runtime injects this:
  const module = await __webpack_require__.e(/* chunkId */ 42)
    .then(__webpack_require__.bind(null, /* moduleId */ './heavy-feature.js'));

  module.init();
});

// What __webpack_require__.e() does:
// 1. Check if chunk already loaded (cache lookup)
// 2. If not, create <script> tag with src="/42.chunk.js"
// 3. Append to document.head
// 4. Return promise that resolves when chunk loads
// 5. Execute chunk code (defines modules)
// 6. Return module namespace


// 3. CHUNK GENERATION
// Webpack creates separate files for dynamic imports

// Entry: app.js (imports both statically and dynamically)
// main.bundle.js: Your app code + static imports (450KB)
// 42.chunk.js: Dynamically imported feature (200KB)
// 43.chunk.js: Another dynamic import (150KB)

// webpack.config.js
module.exports = {
  output: {
    filename: '[name].bundle.js',
    chunkFilename: '[id].chunk.[contenthash].js', // Dynamic chunks
    path: path.resolve(__dirname, 'dist')
  }
};


// 4. CHUNK LOADING MECHANISM (JSONP Pattern)
// Webpack uses JSONP for chunk loading

// Generated chunk file (42.chunk.js):
(window.webpackJsonp = window.webpackJsonp || []).push([
  [42], // Chunk ID
  {
    './heavy-feature.js': function(module, exports, __webpack_require__) {
      // Your module code here
      exports.init = function() { /* ... */ };
    }
  }
]);

// Main bundle listens for chunks:
window.webpackJsonp.push = function(data) {
  const [chunkIds, modules] = data;

  // Install modules
  for (let moduleId in modules) {
    __webpack_modules__[moduleId] = modules[moduleId];
  }

  // Resolve chunk loading promises
  resolveChunkPromises(chunkIds);
};


// 5. PERFORMANCE: Network Waterfall
// Dynamic imports can create request cascades

// ❌ BAD: Nested dynamic imports (waterfall)
// app.js
const featureA = await import('./featureA.js'); // Request 1: 200ms

// featureA.js
const featureB = await import('./featureB.js'); // Request 2: 200ms (starts after A loads)

// featureB.js
const featureC = await import('./featureC.js'); // Request 3: 200ms (starts after B loads)

// Total load time: 600ms (serial loading)


// ✅ GOOD: Parallel dynamic imports
// app.js
const [featureA, featureB, featureC] = await Promise.all([
  import('./featureA.js'),
  import('./featureB.js'),
  import('./featureC.js')
]);

// Total load time: 200ms (parallel loading, 3x faster!)


// 6. PRELOAD / PREFETCH HINTS
// Webpack magic comments for optimization

// Prefetch: Load in idle time (low priority)
const Dashboard = () => import(
  /* webpackPrefetch: true */
  './Dashboard.jsx'
);
// Generates: <link rel="prefetch" href="/Dashboard.chunk.js">
// Browser loads during idle time, ready when needed


// Preload: Load in parallel with parent (high priority)
const CriticalComponent = () => import(
  /* webpackPreload: true */
  './CriticalComponent.jsx'
);
// Generates: <link rel="preload" href="/CriticalComponent.chunk.js">
// Loads immediately alongside main bundle


// Chunk name (better debugging):
const Dashboard = () => import(
  /* webpackChunkName: "dashboard" */
  './Dashboard.jsx'
);
// Generates: dashboard.chunk.js (instead of 42.chunk.js)


// 7. CACHING STRATEGY
// Dynamic imports are cached in module registry

const cache = new Map();

async function loadModule(path) {
  // Check cache first
  if (cache.has(path)) {
    console.log('Cache hit!');
    return cache.get(path);
  }

  // Load module
  console.log('Cache miss, loading...');
  const module = await import(path);

  // Cache for next time
  cache.set(path, module);
  return module;
}

// First call: Loads from network
await loadModule('./utils.js'); // "Cache miss, loading..."

// Second call: Returns from cache (instant!)
await loadModule('./utils.js'); // "Cache hit!"


// 8. CODE SPLITTING STRATEGIES

// Route-based splitting (React Router):
const routes = [
  {
    path: '/dashboard',
    component: lazy(() => import('./pages/Dashboard'))
  },
  {
    path: '/settings',
    component: lazy(() => import('./pages/Settings'))
  }
];
// Each route = separate chunk, loads on navigation


// Component-based splitting:
const HeavyChart = lazy(() => import('./components/HeavyChart'));
// Chart library only loads when component renders


// Library splitting:
async function loadLodash() {
  const { default: _ } = await import('lodash-es');
  return _;
}
// Lodash in separate chunk, not main bundle


// 9. VITE'S DYNAMIC IMPORT (ESM-based)
// Vite uses native ESM dynamic imports (faster)

// Development: Native browser import()
const module = await import('./utils.js');
// - No bundling in dev
// - Direct ESM file served
// - Instant HMR updates

// Production: Rollup code splitting
// - Bundles dynamic imports into chunks
// - Optimized with tree shaking
// - Smaller chunks than Webpack


// 10. ERROR HANDLING WITH RETRIES
// Production-ready dynamic import with retry logic

async function importWithRetry(
  importFn,
  retries = 3,
  delay = 1000
) {
  for (let i = 0; i < retries; i++) {
    try {
      return await importFn();
    } catch (error) {
      console.warn(`Import failed (attempt ${i + 1}/${retries}):`, error);

      if (i === retries - 1) {
        throw new Error(`Failed to load module after ${retries} attempts`);
      }

      // Exponential backoff
      await new Promise(resolve =>
        setTimeout(resolve, delay * Math.pow(2, i))
      );
    }
  }
}

// Usage:
const module = await importWithRetry(
  () => import('./flaky-cdn-module.js')
);

// Network issue? Retries with backoff:
// Attempt 1: immediate
// Attempt 2: 1s delay
// Attempt 3: 2s delay
// If all fail: throws error


// 11. MEMORY MANAGEMENT
// Dynamic imports stay in memory after loaded

// Memory leak example:
function loadUserDashboard(userId) {
  // Each user loads their own dashboard module
  return import(`./dashboards/user-${userId}.js`);
}

// Problem: Each dynamic import is cached
// If 1000 users login: 1000 separate modules in memory!

// Solution: Shared modules or manual cache clearing
const dashboardCache = new Map();

async function loadUserDashboard(userId) {
  const cacheKey = `user-${userId}`;

  if (!dashboardCache.has(cacheKey)) {
    const module = await import(`./dashboards/user-${userId}.js`);
    dashboardCache.set(cacheKey, module);

    // Limit cache size (LRU eviction)
    if (dashboardCache.size > 10) {
      const firstKey = dashboardCache.keys().next().value;
      dashboardCache.delete(firstKey);
    }
  }

  return dashboardCache.get(cacheKey);
}


// 12. BENCHMARKS: Static vs Dynamic Import

// Test: 10 modules, 100KB each

// STATIC IMPORT:
// - Initial bundle: 1MB (all modules)
// - First load: 800ms (download + parse)
// - Navigation: 0ms (everything ready)

// DYNAMIC IMPORT:
// - Initial bundle: 200KB (core only)
// - First load: 150ms (smaller bundle)
// - Navigation: 120ms (chunk download + parse)

// Winner depends on use case:
// - Single-page app: Static (better after initial load)
// - Multi-page app: Dynamic (faster first load)


// 13. HTTP/2 PUSH WITH DYNAMIC IMPORTS
// Server can push chunks before requested

// Server (Node.js + HTTP/2):
const http2 = require('http2');
const fs = require('fs');

const server = http2.createSecureServer({ /* SSL certs */ });

server.on('stream', (stream, headers) => {
  const path = headers[':path'];

  if (path === '/') {
    // Push critical chunks before requested
    stream.pushStream({ ':path': '/dashboard.chunk.js' }, (err, pushStream) => {
      const chunk = fs.readFileSync('./dist/dashboard.chunk.js');
      pushStream.end(chunk);
    });

    // Send main HTML
    stream.end('<html>...</html>');
  }
});

// Result: Chunk arrives before import() called
// Zero wait time on dynamic import!


// 14. WEBPACK MODULE FEDERATION (Advanced)
// Share modules between separate builds

// app1/webpack.config.js (Host)
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'app1',
      remotes: {
        app2: 'app2@http://localhost:3002/remoteEntry.js'
      }
    })
  ]
};

// app1: Dynamically import from app2
const RemoteComponent = lazy(() => import('app2/Component'));

// Cross-application code sharing!
// Each app can dynamically load from others
```

**Chunking Algorithms:**

```javascript
// Webpack's default splitting strategy:

// 1. Entry chunks: Your main app
// 2. Async chunks: Dynamic imports
// 3. Vendor chunks: node_modules

// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all', // Split both sync and async

      cacheGroups: {
        // Vendor chunk: All node_modules
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          priority: 10
        },

        // Common chunk: Shared across 2+ modules
        common: {
          minChunks: 2,
          name: 'common',
          priority: 5
        }
      }
    }
  }
};

// Results in:
// - main.bundle.js: Your app code (100KB)
// - vendor.chunk.js: React, libraries (300KB)
// - common.chunk.js: Shared utilities (50KB)
// - dashboard.chunk.js: Dynamic dashboard (200KB)
```

</details>

<details>
<summary><strong>🐛 Real-World Scenario: Slow Route Transitions Due to Chunk Loading</strong></summary>

**Scenario:** Your React SPA has fast initial load (2.1s) after implementing code splitting, but users complain that navigating between routes feels sluggish. Dashboard route takes 3-4 seconds to load, causing frustration. Analytics show 25% of users bounce when clicking "Dashboard" link due to perceived slowness.

**The Problem:**

```javascript
// ❌ ISSUE: Naive dynamic imports without optimization

// App.js
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Dynamic imports for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}


// The flow when user clicks "Dashboard":
// 1. React shows <div>Loading...</div> (immediate)
// 2. Browser requests dashboard.chunk.js (200ms network)
// 3. Browser parses chunk (150ms)
// 4. React renders Dashboard component (50ms)
// Total: 400ms PLUS any data fetching!


// pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { LineChart } from 'recharts'; // Heavy charting library!
import { DataTable } from './components/DataTable'; // Complex table

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Fetch data AFTER component loads
    fetch('/api/dashboard-data')
      .then(res => res.json())
      .then(setData);
  }, []);

  if (!data) return <div>Loading data...</div>;

  return (
    <div>
      <LineChart data={data} /> {/* Recharts: 400KB! */}
      <DataTable data={data} />
    </div>
  );
}


// Bundle analysis shows:
// ┌────────────────────────────────────────┐
// │ dashboard.chunk.js: 850KB              │
// ├────────────────────────────────────────┤
// │ recharts: 400KB (47%)                  │
// │ DataTable deps: 250KB (29%)            │
// │ Dashboard code: 200KB (24%)            │
// └────────────────────────────────────────┘

// Timeline when user clicks "Dashboard":
// 0ms:    User clicks
// 0ms:    Show "Loading..." fallback
// 200ms:  dashboard.chunk.js downloaded (850KB on 4G)
// 350ms:  Chunk parsed and executed
// 400ms:  Dashboard component mounts
// 400ms:  Data fetch starts
// 1200ms: Data fetch completes (800ms API)
// 1250ms: Charts render

// Total perceived delay: 1.25 seconds (feels slow!)
```

**Production Metrics Before Fix:**

```javascript
// User Experience Impact:
// - Dashboard load time: 3.4s average (p50)
// - Dashboard load time: 5.8s (p95, slow networks)
// - Bounce rate on dashboard link click: 25%
// - User session time: -15% (users leave faster)
// - Complaints: "Dashboard feels slow", "Takes forever to load"

// Performance Metrics:
// - dashboard.chunk.js: 850KB
// - Download time (4G): 1.8s
// - Parse time: 350ms
// - Component mount: 50ms
// - Data fetch: 800ms
// - Total: 3.4s

// Business Impact:
// - Dashboard engagement: -30%
// - Report views: -40%
// - Customer tickets: 18/week about slow dashboard
// - Abandonment rate: 25% → revenue loss ~$5k/week
```

**Debugging Process:**

```javascript
// Step 1: Measure with React DevTools Profiler
import { Profiler } from 'react';

function App() {
  return (
    <Profiler
      id="Dashboard"
      onRender={(id, phase, actualDuration) => {
        console.log(`${id} ${phase}: ${actualDuration}ms`);
        // Send to analytics
      }}
    >
      <Dashboard />
    </Profiler>
  );
}

// Results:
// Dashboard mount: 1250ms ← SLOW!
// - Component mount: 50ms
// - Data fetch wait: 1200ms (blocking render)


// Step 2: Network waterfall analysis (Chrome DevTools)
// Timeline:
// 0ms:    dashboard.chunk.js request starts
// 1800ms: dashboard.chunk.js response complete
// 1850ms: Chunk execution complete
// 1900ms: /api/dashboard-data request starts ← Problem!
// 2700ms: Data response complete

// Issue: Data fetch WAITS for chunk to load
// Can we start data fetch earlier?


// Step 3: Bundle size analysis
npm run build
webpack-bundle-analyzer

// Findings:
// - recharts is 400KB (too big!)
// - Could use lighter chart library
// - Or code split recharts further
```

**Solution 1: Prefetch Routes**

```javascript
// ✅ FIX: Prefetch chunks when user hovers on link

import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';

const Dashboard = lazy(() => import(
  /* webpackPrefetch: true */
  /* webpackChunkName: "dashboard" */
  './pages/Dashboard'
));

// Or manual prefetch on hover:
function NavLink({ to, children }) {
  const handleMouseEnter = () => {
    // Start loading chunk when user hovers
    if (to === '/dashboard') {
      import('./pages/Dashboard'); // Prefetch!
    }
  };

  return (
    <Link to={to} onMouseEnter={handleMouseEnter}>
      {children}
    </Link>
  );
}

// Result: When user clicks, chunk already loaded!
// Load time: 3.4s → 0.8s (75% faster!)
```

**Solution 2: Parallel Data Fetching**

```javascript
// ✅ BETTER: Fetch data in parallel with component loading

// App.js - Start data fetch immediately on route change
import { lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';

// Create resource BEFORE component loads
function createResource(promise) {
  let status = 'pending';
  let result;

  const suspender = promise.then(
    (data) => {
      status = 'success';
      result = data;
    },
    (error) => {
      status = 'error';
      result = error;
    }
  );

  return {
    read() {
      if (status === 'pending') throw suspender;
      if (status === 'error') throw result;
      return result;
    }
  };
}

// Start fetch immediately when route clicked
const dashboardDataResource = createResource(
  fetch('/api/dashboard-data').then(res => res.json())
);

const Dashboard = lazy(() => import('./pages/Dashboard'));

// Dashboard.jsx - Read from resource
export default function Dashboard() {
  const data = dashboardDataResource.read(); // Suspends if not ready

  return (
    <div>
      <LineChart data={data} />
      <DataTable data={data} />
    </div>
  );
}

// Timeline:
// 0ms:    User clicks → Start BOTH chunk load AND data fetch
// 1800ms: Chunk loads (parallel with data)
// 900ms:  Data loads (parallel with chunk)
// 1800ms: Dashboard renders (both ready)

// Load time: 3.4s → 1.8s (47% faster!)
```

**Solution 3: Code Split Heavy Dependencies**

```javascript
// ✅ BEST: Further split heavy chart library

// Dashboard.jsx
import { Suspense, lazy } from 'react';

// Split charts into separate chunk
const LineChart = lazy(() => import(
  /* webpackChunkName: "charts" */
  'recharts'
).then(module => ({ default: module.LineChart })));

export default function Dashboard() {
  const data = useDashboardData();

  return (
    <div>
      <h1>Dashboard</h1>
      <DataTable data={data} /> {/* Shows immediately */}

      {/* Chart loads after table */}
      <Suspense fallback={<div>Loading chart...</div>}>
        <LineChart data={data} />
      </Suspense>
    </div>
  );
}

// Result:
// - Initial dashboard: 450KB (table only)
// - Charts chunk: 400KB (loads after)
// - Perceived load time: 1.2s → user sees table immediately
// - Chart appears 400ms later (progressive enhancement!)
```

**Solution 4: Route-based Preloading Strategy**

```javascript
// ✅ PRODUCTION-READY: Intelligent preloading

// routeConfig.js
export const routes = [
  {
    path: '/dashboard',
    component: lazy(() => import('./pages/Dashboard')),
    preload: () => import('./pages/Dashboard'), // Preload function
    prefetchData: () => fetch('/api/dashboard-data') // Data prefetch
  },
  {
    path: '/analytics',
    component: lazy(() => import('./pages/Analytics')),
    preload: () => import('./pages/Analytics'),
    prefetchData: () => fetch('/api/analytics-data')
  }
];


// App.js - Preload on link hover/focus
import { routes } from './routeConfig';

function NavLink({ route }) {
  const handleIntent = () => {
    // User shows intent (hover/focus) → start loading
    route.preload(); // Load component chunk
    route.prefetchData(); // Load data
  };

  return (
    <Link
      to={route.path}
      onMouseEnter={handleIntent}
      onFocus={handleIntent}
    >
      {route.name}
    </Link>
  );
}


// Advanced: Preload likely next routes
import { useLocation } from 'react-router-dom';

function useRoutePreloader() {
  const location = useLocation();

  useEffect(() => {
    // Predict next route based on user behavior
    if (location.pathname === '/') {
      // Users usually go to dashboard after home
      routes.find(r => r.path === '/dashboard')?.preload();
    } else if (location.pathname === '/dashboard') {
      // From dashboard, users often check analytics
      routes.find(r => r.path === '/analytics')?.preload();
    }
  }, [location]);
}
```

**Solution 5: Service Worker Caching**

```javascript
// ✅ ADVANCED: Cache chunks with Service Worker

// service-worker.js
const CACHE_NAME = 'chunks-v1';
const CHUNKS_TO_CACHE = [
  '/dashboard.chunk.js',
  '/analytics.chunk.js',
  '/charts.chunk.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CHUNKS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('.chunk.js')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        // Cache hit: return immediately
        if (response) return response;

        // Cache miss: fetch and cache
        return fetch(event.request).then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        });
      })
    );
  }
});

// Result:
// - First visit: Chunks cached
// - Second visit: Chunks load from cache (instant!)
// - Offline: Chunks still available
```

**Production Metrics After Fix:**

```javascript
// Implemented: Solution 1 (Prefetch) + Solution 2 (Parallel fetch) + Solution 3 (Split charts)

// User Experience Impact:
// - Dashboard load time: 3.4s → 0.9s (74% faster!)
// - Dashboard load time p95: 5.8s → 1.6s (72% faster!)
// - Bounce rate: 25% → 6% (76% improvement)
// - User session time: +22%
// - User satisfaction: +88%

// Performance Metrics:
// - Prefetch on hover: Chunks ready when clicked (0ms wait)
// - Parallel data fetch: Saves 800ms
// - Progressive rendering: Table shows 400ms before charts
// - Perceived load: <1s (feels instant!)

// Business Impact:
// - Dashboard engagement: +45%
// - Report views: +62%
// - Customer tickets: 18 → 2/week
// - Abandonment rate: 25% → 6%
// - Revenue recovered: $5k/week
// - Daily active users: +18%

// Technical Metrics:
// - Chunk size: 850KB → 450KB (dashboard) + 400KB (charts, deferred)
// - First contentful paint: 1.2s → 0.4s
// - Time to interactive: 3.4s → 0.9s
// - Lighthouse score: 65 → 94
```

**Key Lessons:**

1. **Prefetch on user intent** (hover/focus) for instant navigation
2. **Parallel data fetching** eliminates sequential waterfalls
3. **Progressive rendering** shows content incrementally
4. **Code split heavy deps** keeps initial chunks small
5. **Monitor real user metrics** (not just lab tests)
6. **Service workers** for repeat visit performance
7. **Balance** bundle size vs request count

</details>

<details>
<summary><strong>⚖️ Trade-offs: Dynamic Import Strategies</strong></summary>

### Static Imports vs Dynamic Imports

| Aspect | Static Imports | Dynamic Imports |
|--------|---------------|-----------------|
| **Bundle Size** | ❌ Larger (everything included) | ✅ Smaller (split into chunks) |
| **Initial Load** | ❌ Slower (bigger download) | ✅ Faster (smaller main bundle) |
| **Navigation** | ✅ Instant (code already loaded) | ⚠️ Delay (chunk download) |
| **Complexity** | ✅ Simple | ⚠️ More complex |
| **Caching** | ✅ Single file to cache | ⚠️ Multiple chunks to manage |
| **HTTP Requests** | ✅ One request | ❌ Multiple requests |
| **Tree Shaking** | ✅ Works well | ✅ Works well |
| **SEO** | ✅ Better (everything in initial HTML) | ⚠️ Requires SSR or prerendering |
| **Offline** | ✅ Easier | ⚠️ Needs service worker |

### When to Use Dynamic Imports

```javascript
// ✅ USE DYNAMIC IMPORTS FOR:

// 1. Route-based code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
// Why: Users may never visit all routes
// Savings: 200-800KB per route


// 2. Heavy libraries used conditionally
async function loadPdfGenerator() {
  if (user.canGeneratePdf()) {
    const { default: pdfMake } = await import('pdfmake');
    return pdfMake;
  }
}
// Why: PDF library is 600KB, not everyone uses it
// Savings: 600KB for users who don't generate PDFs


// 3. Modal/Dialog content
function showUserProfile(userId) {
  const ProfileModal = lazy(() => import('./ProfileModal'));
  openModal(<ProfileModal userId={userId} />);
}
// Why: Modals not shown on initial render
// Savings: 50-150KB per modal


// 4. Admin/privileged features
if (user.isAdmin) {
  const AdminPanel = await import('./AdminPanel');
  render(<AdminPanel />);
}
// Why: 90% of users won't see admin features
// Savings: 300KB for non-admin users


// 5. Below-the-fold content
const IntersectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(async (entry) => {
    if (entry.isIntersecting) {
      const { Comments } = await import('./Comments');
      render(<Comments />);
    }
  });
});
// Why: Not visible initially
// Savings: Deferred load improves FCP


// 6. A/B test variants
const variant = getABTestVariant();

const Component = await import(
  variant === 'A' ? './VariantA' : './VariantB'
);
// Why: User only sees one variant
// Savings: 50% (don't load unused variant)
```

### When to AVOID Dynamic Imports

```javascript
// ❌ AVOID DYNAMIC IMPORTS FOR:

// 1. Critical above-fold content
// ❌ BAD:
const Header = lazy(() => import('./Header'));
// Why: Header needed immediately, delay is visible
// Use: Static import

// ✅ GOOD:
import Header from './Header';


// 2. Small modules (<20KB)
// ❌ BAD:
const utils = await import('./utils'); // 5KB
// Why: Network overhead > savings
// 100-200ms request for 5KB = not worth it

// ✅ GOOD:
import * as utils from './utils'; // Include in main bundle


// 3. Modules used on every route
// ❌ BAD:
const Navigation = lazy(() => import('./Navigation'));
// Why: Needed everywhere, creates unnecessary requests

// ✅ GOOD:
import Navigation from './Navigation';


// 4. Synchronous initialization code
// ❌ BAD:
const config = await import('./config');
app.init(config); // Delays app startup

// ✅ GOOD:
import config from './config'; // Available immediately


// 5. Hot paths (called frequently)
// ❌ BAD:
button.addEventListener('click', async () => {
  const handler = await import('./clickHandler'); // Every click!
  handler.handleClick();
});

// ✅ GOOD:
import { handleClick } from './clickHandler'; // Load once
button.addEventListener('click', handleClick);
```

### Loading Strategies Comparison

```javascript
// STRATEGY 1: Eager Loading (Static)
import Dashboard from './Dashboard';
import Analytics from './Analytics';
import Settings from './Settings';

// Pros:
// - Instant navigation (everything ready)
// - Simpler code (no suspense boundaries)
// - Better for small apps

// Cons:
// - Large initial bundle (slow first load)
// - Loads unused code


// STRATEGY 2: Lazy Loading (On-demand)
const Dashboard = lazy(() => import('./Dashboard'));

// Pros:
// - Small initial bundle (fast first load)
// - Only loads what's needed

// Cons:
// - Navigation delay (chunk download)
// - More complex code


// STRATEGY 3: Prefetching (Hybrid)
const Dashboard = lazy(() => import(
  /* webpackPrefetch: true */
  './Dashboard'
));

// Pros:
// - Small initial bundle
// - Chunks ready when needed (loaded in idle time)

// Cons:
// - Extra bandwidth if not used
// - More complex configuration


// STRATEGY 4: Preloading (Eager-ish)
<link rel="modulepreload" href="/dashboard.chunk.js">

const Dashboard = lazy(() => import('./Dashboard'));

// Pros:
// - Chunks load in parallel with main bundle
// - Instant when needed

// Cons:
// - Larger total download
// - HTTP/2 required for efficiency
```

### Bundle Size vs Request Count Trade-off

```javascript
// Scenario: 10 routes, 200KB each

// APPROACH 1: One big bundle
// - 1 request: main.bundle.js (2MB)
// - Pros: Instant navigation
// - Cons: 5s initial load on 3G

// APPROACH 2: 10 separate chunks
// - 1 request: main.bundle.js (100KB)
// - 10 requests: route chunks (200KB each, on-demand)
// - Pros: 0.5s initial load
// - Cons: 0.5s delay per route navigation

// APPROACH 3: Smart grouping
// - 1 request: main.bundle.js (100KB)
// - 1 request: common.chunk.js (300KB, shared code)
// - 3 requests: route-group chunks (500KB each, related routes)
// - Pros: 1s initial load, minimal navigation delay
// - Cons: More complex configuration

// Winner: Approach 3 (balanced)
```

### Real-World Bundle Budgets

```javascript
// Recommended maximum sizes:

// Main bundle (critical path):
// - Target: <150KB gzipped
// - Maximum: <200KB gzipped
// Why: Load in <2s on 3G

// Route chunks:
// - Target: <50KB gzipped
// - Maximum: <100KB gzipped
// Why: <500ms load on navigation

// Vendor chunks (React, libraries):
// - Target: <100KB gzipped
// - Maximum: <150KB gzipped
// Why: Cached across routes

// Lazy chunks (modals, features):
// - Target: <30KB gzipped
// - Maximum: <75KB gzipped
// Why: Quick to load when needed


// Monitoring in CI:
module.exports = {
  performance: {
    maxEntrypointSize: 200 * 1024, // 200KB
    maxAssetSize: 100 * 1024, // 100KB
    hints: 'error' // Fail build if exceeded
  }
};
```

### Decision Matrix

| Use Case | Strategy | Reason |
|----------|----------|--------|
| **Landing page** | Static | Speed critical, small |
| **App routes** | Dynamic | Many routes, not all visited |
| **Critical components** | Static | Needed immediately |
| **Modals/popups** | Dynamic | Not visible initially |
| **Admin panel** | Dynamic | Few users access |
| **Charts/visualization** | Dynamic | Heavy libraries |
| **Navigation** | Static | Used everywhere |
| **Form validators** | Static (<20KB) | Small, frequently used |
| **Large libraries** | Dynamic | Conditional usage |
| **A/B test variants** | Dynamic | Only one used |

</details>

<details>
<summary><strong>💬 Explain to Junior: Dynamic Imports Simplified</strong></summary>

**Simple Analogy: Pizza Restaurant vs Food Delivery**

Think of loading code like getting food:

**Static Imports = Restaurant Buffet**
```javascript
// You pay upfront, get ALL the food at once
import Dashboard from './Dashboard';
import Analytics from './Analytics';
import Settings from './Settings';
import AdminPanel from './AdminPanel';
import UserProfile from './UserProfile';

// Your plate (bundle):
// 🍕 Dashboard: 200KB
// 🍔 Analytics: 300KB
// 🌮 Settings: 150KB
// 🍰 AdminPanel: 400KB
// 🥗 UserProfile: 250KB
// Total: 1.3MB (ALL AT ONCE!)

// Problem: Takes 8 seconds to load everything
// But you only want pizza right now!
```

**Dynamic Imports = Food Delivery App**
```javascript
// Order only what you want, when you want it
const Dashboard = lazy(() => import('./Dashboard'));

// On app start:
// - Main menu loads: 100KB (fast! 1 second)
// - No food yet (just the menu)

// When you click "Dashboard":
// - App orders Dashboard (requests chunk)
// - Waits 200ms (delivery time)
// - Dashboard arrives and displays

// Total for what you actually use: 300KB
// Savings: 1MB not downloaded!
```

**Real Code Example:**

```javascript
// OLD WAY (Everything at once):
import Dashboard from './Dashboard'; // 200KB
import HeavyChart from './HeavyChart'; // 500KB
import AdminPanel from './AdminPanel'; // 300KB

// When app loads:
// - Download: 1MB (8 seconds on slow network!)
// - User sees: Loading screen for 8 seconds
// - User feels: "This is so slow!"


// NEW WAY (Load when needed):
// Main app:
import React from 'react';
// Total: 100KB (1 second to load)

// When user clicks "Dashboard":
const Dashboard = lazy(() => import('./Dashboard'));
// - Download: 200KB (2 seconds)
// - User sees: Dashboard loads
// - User feels: "This loaded fast!"

// When user clicks "Charts" (if they ever do):
const Charts = lazy(() => import('./HeavyChart'));
// - Download: 500KB (only if user clicks!)
// - Many users never click → 500KB saved!
```

**How It Works (Simple Explanation):**

```javascript
// Step 1: App starts
// ┌──────────────────────┐
// │ Main App: 100KB      │ ← Loads immediately
// │ - Menu               │
// │ - Navigation         │
// │ - Layout             │
// └──────────────────────┘

// Step 2: User clicks "Dashboard"
// ┌──────────────────────┐
// │ Show "Loading..."    │ ← Instant
// └──────────────────────┘
//          ↓
//    Request chunk
//          ↓
// ┌──────────────────────┐
// │ Download Dashboard   │ ← 200ms
// │ chunk: 200KB         │
// └──────────────────────┘
//          ↓
// ┌──────────────────────┐
// │ Show Dashboard       │ ← Render
// └──────────────────────┘
```

**Why This Is Better:**

```javascript
// WITHOUT DYNAMIC IMPORTS:
// User visits app
// ↓
// Wait 8 seconds (downloading everything)
// ↓
// Finally see homepage
// ↓
// User: "Too slow!" (leaves)

// Bounce rate: 40%


// WITH DYNAMIC IMPORTS:
// User visits app
// ↓
// Wait 1 second (downloading main app only)
// ↓
// See homepage immediately!
// ↓
// User clicks "Dashboard"
// ↓
// Wait 0.5 seconds (downloading dashboard chunk)
// ↓
// See dashboard
// ↓
// User: "This is fast!" (stays)

// Bounce rate: 10%
```

**Common Beginner Mistakes:**

```javascript
// ❌ MISTAKE 1: Dynamic importing small files
const SmallUtil = lazy(() => import('./small-5kb-file.js'));
// Problem: Network request overhead (200ms) > file size (5KB)
// Fix: Keep small files in main bundle

// ✅ CORRECT:
import { SmallUtil } from './small-5kb-file.js';


// ❌ MISTAKE 2: Dynamic importing critical content
const Header = lazy(() => import('./Header'));
// Problem: Header needed immediately, delay is visible!
// Fix: Static import for critical parts

// ✅ CORRECT:
import Header from './Header'; // Always visible → load immediately


// ❌ MISTAKE 3: Not showing loading state
function App() {
  const Dashboard = lazy(() => import('./Dashboard'));

  return <Dashboard />; // ❌ Crashes! No Suspense
}

// Fix: Always wrap in Suspense
function App() {
  const Dashboard = lazy(() => import('./Dashboard'));

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Dashboard />
    </Suspense>
  );
}
```

**Practical Example:**

```javascript
// Your Netflix-like app has:
// - Homepage: 100KB
// - Movie player: 800KB (video codecs, player UI)
// - User profile: 150KB
// - Admin panel: 500KB

// WRONG WAY (load everything):
import Homepage from './Homepage';       // 100KB
import MoviePlayer from './MoviePlayer'; // 800KB ← Most users don't watch!
import UserProfile from './UserProfile'; // 150KB
import AdminPanel from './AdminPanel';   // 500KB ← Only admins use!

// Total: 1.55MB
// Load time: 12 seconds on 3G
// User: "I just want to browse movies!" (leaves)


// RIGHT WAY (load on demand):
import Homepage from './Homepage'; // 100KB ← Load immediately

// Load player only when user clicks "Watch":
const MoviePlayer = lazy(() => import('./MoviePlayer')); // 800KB

// Load profile only when user clicks profile icon:
const UserProfile = lazy(() => import('./UserProfile')); // 150KB

// Load admin only for admins:
const AdminPanel = lazy(() => import('./AdminPanel')); // 500KB

// Total initial: 100KB
// Load time: 0.8 seconds on 3G
// User: "Wow, so fast!" (stays and watches)

// Savings:
// - 90% of users never watch → 800KB saved per user
// - 95% of users aren't admins → 500KB saved per user
// - Average user downloads: 250KB instead of 1.55MB (84% less!)
```

**When to Use Dynamic Imports (Simple Rules):**

```javascript
// ✅ DO use dynamic imports for:

// 1. Different pages/routes
const About = lazy(() => import('./About'));
// Users may not visit all pages

// 2. Heavy features most users don't use
const PdfGenerator = lazy(() => import('./PdfGenerator'));
// Only load if user clicks "Download PDF"

// 3. Admin-only features
if (user.isAdmin) {
  const Admin = await import('./Admin');
}
// Regular users never see this

// 4. Pop-ups and modals
const ShareModal = lazy(() => import('./ShareModal'));
// Only load when user clicks "Share"


// ❌ DON'T use dynamic imports for:

// 1. Main navigation
import Nav from './Nav'; // Needed everywhere

// 2. Above-the-fold content
import Hero from './Hero'; // First thing users see

// 3. Small files (<20KB)
import utils from './utils'; // Too small, not worth it

// 4. Critical app logic
import auth from './auth'; // Needed for app to work
```

**Explaining to Your Manager:**

"Dynamic imports are like ordering food delivery instead of buying groceries for the whole month upfront.

**Without dynamic imports:**
- App loads everything (1.5MB)
- Takes 10 seconds
- Users wait... and 40% leave before seeing anything
- Wasted bandwidth for features they never use

**With dynamic imports:**
- App loads essentials first (200KB)
- Takes 2 seconds → users see content fast!
- Extra features load when clicked (tiny delay)
- Only downloads what's actually used

**Business Impact:**
- Page load: 10s → 2s (80% faster!)
- Bounce rate: 40% → 10% (300% improvement)
- Bandwidth costs: -70% (load only what's needed)
- User satisfaction: +90%
- More users stay = more conversions"

**Quick Test Your Understanding:**

```javascript
// Question: Which should use dynamic import?

// A. Logo component (10KB, shown on every page)
// B. Video player (900KB, used when user clicks "Watch")
// C. Footer (15KB, bottom of every page)
// D. Admin dashboard (400KB, only admins see)

// Answers:
// A: NO (small + used everywhere → static import)
// B: YES! (huge + conditional → perfect for dynamic)
// C: NO (small + used everywhere → static import)
// D: YES! (big + only few users → perfect for dynamic)
```

**Key Takeaways:**

1. **Dynamic imports = Load code when you need it** (not all at once)
2. **Makes initial load fast** (smaller bundle)
3. **Saves bandwidth** (don't download unused code)
4. **Use for routes, modals, admin features** (conditional content)
5. **Don't use for nav, headers, small files** (critical/small content)
6. **Always wrap in Suspense** (show loading state)

**Mental Model:**
- **Static import** = Buy the whole pizza upfront
- **Dynamic import** = Order pizza by the slice when hungry

Use slices for code you MIGHT need. Buy the whole pizza for code you ALWAYS need.

</details>

### Resources
- [MDN: Dynamic Import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)
- [webpack: Code Splitting](https://webpack.js.org/guides/code-splitting/)
- [Vite: Dynamic Import](https://vitejs.dev/guide/features.html#dynamic-import)

---

