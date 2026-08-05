# TypeScript Strict Mode

## Question 1: What is strict mode and what checks does it enable?

**Answer:**

TypeScript's strict mode is a collection of type-checking compiler flags that enforce stricter type safety and help catch common programming errors at compile time. When enabled via `"strict": true` in `tsconfig.json`, it activates all strict type-checking options simultaneously.

**Strict mode enables the following compiler flags:**

1. **`noImplicitAny`**: Raises errors on expressions and declarations with an implied `any` type
2. **`noImplicitThis`**: Raises errors on `this` expressions with an implied `any` type
3. **`strictNullChecks`**: Makes `null` and `undefined` distinct types that must be explicitly handled
4. **`strictFunctionTypes`**: Enables stricter checking of function parameter types (contravariance)
5. **`strictBindCallApply`**: Ensures `bind`, `call`, and `apply` methods are invoked with correct arguments
6. **`strictPropertyInitialization`**: Ensures class properties are initialized in the constructor or with default values
7. **`alwaysStrict`**: Parses files in ECMAScript strict mode and emits "use strict" for each source file
8. **`useUnknownInCatchVariables`**: Changes the default type of catch clause variables from `any` to `unknown`

**Basic configuration:**

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true  // Enables all strict flags
  }
}

// Or enable individually:
{
  "compilerOptions": {
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    // ... other flags
  }
}
```

**Examples of strict mode catching errors:**

```typescript
// ❌ Without strict mode (compiles but unsafe)
function processUser(user) {  // implicit 'any' type
  console.log(user.name.toUpperCase());  // Runtime error if user is null
}

let value: string | null = null;
console.log(value.length);  // Runtime error


// ✅ With strict mode (compile-time errors)
function processUser(user: User) {  // Must specify type
  if (user && user.name) {  // Must check for null/undefined
    console.log(user.name.toUpperCase());
  }
}

let value: string | null = null;
console.log(value.length);  // ❌ Error: Object is possibly 'null'
```

---

<details>
<summary><strong>🔍 Deep Dive: Strict Flags Internals and Migration Strategies</strong></summary>

**1. Type Checker Architecture**

TypeScript's type checker implements strict mode flags through enhanced type analysis phases:

```typescript
// Type checker flow with strict mode
interface TypeCheckerPhases {
  binding: 'Symbol resolution and scope analysis',
  checking: 'Type inference and compatibility checks',
  flow: 'Control flow analysis for narrowing',
  inference: 'Generic type parameter inference'
}

// strictNullChecks adds null/undefined to union types
type InferredType<T> = T extends null | undefined
  ? never
  : T;

// Without strictNullChecks:
// string | null → treated as 'string' (unsafe)

// With strictNullChecks:
// string | null → must handle both cases explicitly
```

**2. Control Flow Analysis with `strictNullChecks`**

The type checker performs sophisticated control flow analysis to narrow types:

```typescript
// TypeScript analyzes control flow to narrow types
function processValue(value: string | null | undefined) {
  // Type: string | null | undefined

  if (value) {
    // Type narrowed to: string
    console.log(value.toUpperCase());
  }

  // Type guard narrows further
  if (typeof value === 'string') {
    // Type: string
    value.trim();
  }

  // Null assertion (use sparingly)
  const guaranteed = value!;  // Type: string (bypasses null check)
}

// Discriminated unions with strict null checks
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function handleResult<T>(result: Result<T>) {
  if (result.success) {
    // Type narrowed: result.data is T (not T | undefined)
    console.log(result.data);
  } else {
    // Type narrowed: result.error exists
    console.error(result.error);
  }
}
```

**3. Function Type Contravariance (`strictFunctionTypes`)**

Strict mode enforces sound function parameter checking:

```typescript
// Without strictFunctionTypes: bivariant (unsafe)
// With strictFunctionTypes: contravariant (safe)

interface Animal { name: string; }
interface Dog extends Animal { breed: string; }

type AnimalHandler = (animal: Animal) => void;
type DogHandler = (dog: Dog) => void;

// ❌ Without strictFunctionTypes (bivariant - allows unsound assignment)
const dogOnlyHandler: DogHandler = (dog) => {
  console.log(dog.breed.toUpperCase());  // Assumes every argument is a Dog
};

const unsafeGeneralHandler: AnimalHandler = dogOnlyHandler;  // Allowed but unsound
unsafeGeneralHandler({ name: 'Buddy' });  // 💥 Runtime error: breed is undefined

// The reverse direction is always sound and always allowed, flag or not:
const handleAnimal: AnimalHandler = (animal) => {
  console.log(animal.name);
};

const handleDog: DogHandler = handleAnimal;  // ✅ Safe: narrows what's accepted
handleDog({ name: 'Buddy', breed: 'Labrador' });  // Works

// ✅ With strictFunctionTypes (contravariant - sound)
const safeDogOnlyHandler: DogHandler = (dog) => {
  console.log(dog.breed.toUpperCase());
};

// ❌ Error: Type 'DogHandler' is not assignable to type 'AnimalHandler'
// const safeGeneralHandler: AnimalHandler = safeDogOnlyHandler;

// Correct approach: use generics or proper typing
function createHandler<T extends Animal>(handler: (item: T) => void) {
  return handler;
}
```

**4. `strictBindCallApply` Implementation**

TypeScript models the signatures of `bind`, `call`, and `apply` with tuple types:

```typescript
// Internal TypeScript lib.es5.d.ts definitions (simplified)
interface Function {
  apply<T, R>(this: (this: T, ...args: any[]) => R, thisArg: T, args?: any[]): R;
  call<T, R>(this: (this: T, ...args: any[]) => R, thisArg: T, ...args: any[]): R;
  bind<T>(this: T, thisArg: ThisParameterType<T>): OmitThisParameter<T>;
}

// With strictBindCallApply enabled
function greet(this: { name: string }, greeting: string, punctuation: string) {
  return `${greeting}, ${this.name}${punctuation}`;
}

const user = { name: 'Alice' };

// ✅ Correct usage
greet.call(user, 'Hello', '!');  // "Hello, Alice!"
greet.apply(user, ['Hi', '.']);  // "Hi, Alice."
const boundGreet = greet.bind(user);

// ❌ Strict mode catches errors
greet.call(user, 'Hello');  // Error: Expected 3 arguments, got 2
greet.apply(user, ['Hi', '.', 'extra']);  // Error: Too many arguments
greet.bind({ wrongProp: 'Bob' });  // Error: Missing 'name' property
```

**5. `strictPropertyInitialization` and Definite Assignment**

Ensures class properties are properly initialized:

```typescript
class User {
  // ❌ Error: Property 'name' has no initializer
  name: string;

  // ✅ Solutions:

  // 1. Initialize in constructor
  email: string;
  constructor(email: string) {
    this.email = email;
  }

  // 2. Default value
  role: string = 'user';

  // 3. Optional property
  phone?: string;

  // 4. Definite assignment assertion (use with caution)
  id!: number;  // "I promise this will be assigned"

  // Common pattern: initialized in lifecycle method
  initialize(id: number) {
    this.id = id;
  }
}

// Definite assignment with validation
class Product {
  private _price!: number;

  get price(): number {
    return this._price;
  }

  set price(value: number) {
    if (value < 0) throw new Error('Price cannot be negative');
    this._price = value;
  }

  constructor(price: number) {
    this.price = price;  // Uses setter for validation
  }
}
```

**6. `useUnknownInCatchVariables` (TypeScript 4.4+)**

Changes error handling to be more type-safe:

```typescript
// Before TypeScript 4.4 (or without flag)
try {
  riskyOperation();
} catch (error) {  // Type: any
  console.log(error.message);  // No type checking
}

// With useUnknownInCatchVariables
try {
  riskyOperation();
} catch (error) {  // Type: unknown
  // ❌ Error: Object is of type 'unknown'
  console.log(error.message);

  // ✅ Must narrow the type first
  if (error instanceof Error) {
    console.log(error.message);
  } else if (typeof error === 'string') {
    console.log(error);
  } else {
    console.log('Unknown error:', error);
  }
}

// Type-safe error handling helper
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return String(error);
}

try {
  await fetchData();
} catch (error) {
  logError(getErrorMessage(error));
}
```

**7. Migration Strategy: Incremental Adoption**

```typescript
// tsconfig.json for gradual migration
{
  "compilerOptions": {
    "strict": false,  // Keep off initially

    // Enable flags one at a time
    "noImplicitAny": true,  // Start here (biggest impact)
    "strictNullChecks": false,  // Add after noImplicitAny
    "strictFunctionTypes": false,
    "strictPropertyInitialization": false,

    // Per-file opt-in during migration
    "skipLibCheck": true  // Skip node_modules type checking
  },

  // Exclude problematic files temporarily
  "exclude": [
    "src/legacy/**/*",
    "src/vendor/**/*"
  ]
}

// Use @ts-expect-error for known issues during migration
// @ts-expect-error Legacy code: will fix in TICKET-123
const legacyData = getLegacyData();

// Or suppress specific files
// @ts-nocheck at top of file (temporary only)
```

**8. Performance Implications**

Strict mode adds minimal compilation overhead:

```typescript
// Benchmark results (typical medium project)
//
// Without strict mode:
// - Type checking: 8.5s
// - Memory usage: 450MB
//
// With strict mode:
// - Type checking: 9.2s (+8% slower)
// - Memory usage: 480MB (+6.7% more)
//
// Trade-off: Minimal performance cost for significant safety gains

// Optimization: Use project references for large codebases
{
  "compilerOptions": {
    "strict": true,
    "composite": true,  // Enable project references
    "incremental": true  // Faster rebuilds
  }
}
```

</details>

---

<details>
<summary><strong>🐛 Real-World Scenario: Migrating a Production Codebase to Strict Mode</strong></summary>

**Context**: E-commerce platform with 150k lines of JavaScript migrating to TypeScript strict mode

**Before Migration Metrics:**
- 150,000 lines of JavaScript
- 2,847 files
- 15 production bugs per month (average)
- 12% of bugs related to null/undefined errors
- 8% related to type mismatches
- Code review time: 4 hours per PR (average)

**The Problem:**

```typescript
// Typical pre-migration code (JavaScript converted to basic TypeScript)
// user-service.ts
export class UserService {
  private cache;  // implicit 'any'

  constructor() {
    this.cache = {};  // type inference: {}
  }

  getUser(id) {  // implicit 'any' for parameter and return type
    const user = this.cache[id];
    return user.profile.settings;  // Runtime error if user is undefined
  }

  updateUser(id, data) {  // implicit 'any' types
    const user = this.cache[id];
    user.name = data.name.toUpperCase();  // Runtime error if data.name is null
    user.lastModified = new Date();
  }

  // Function used in event handlers
  handleUserClick(event) {  // implicit 'any'
    const userId = event.target.dataset.userId;
    this.updateUser(userId, event.data);
  }
}

// Real production incident (March 2024)
// Bug: Application crashed when user.profile was null
// Root cause: getUser() didn't check for null/undefined
// Impact: 2,500 users affected, 15 minutes downtime
// Cost: $12,000 in lost revenue
```

**Migration Process (8-week timeline):**

**Week 1-2: Enable `noImplicitAny`**

```typescript
// Step 1: Add explicit types to function signatures
export class UserService {
  private cache: Record<string, User>;  // ✅ Explicit type

  constructor() {
    this.cache = {};
  }

  // ✅ Explicit parameter and return types
  getUser(id: string): UserProfile | undefined {
    const user = this.cache[id];
    return user?.profile?.settings;  // Still unsafe without strictNullChecks
  }

  updateUser(id: string, data: Partial<User>): void {
    const user = this.cache[id];
    if (data.name) {
      user.name = data.name.toUpperCase();  // Still unsafe
    }
    user.lastModified = new Date();
  }

  handleUserClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const userId = target.dataset.userId;
    this.updateUser(userId!, { name: 'Updated' });  // Unsafe assertion
  }
}

// Week 1-2 Results:
// - 1,247 type errors to fix
// - Fixed 892 errors (72%)
// - Used 'any' escape hatch for 355 cases (28%)
// - Time spent: 80 developer hours
// - Bugs found during migration: 23 potential null reference errors
```

**Week 3-4: Enable `strictNullChecks`**

```typescript
// Step 2: Handle null/undefined explicitly
export class UserService {
  private cache: Record<string, User> = {};

  // ✅ Return type includes undefined, forcing callers to handle it
  getUser(id: string): UserProfile | undefined {
    const user = this.cache[id];
    if (!user?.profile?.settings) {
      return undefined;
    }
    return user.profile.settings;
  }

  // ✅ Defensive programming enforced by type system
  updateUser(id: string, data: Partial<User>): boolean {
    const user = this.cache[id];

    if (!user) {
      console.error(`User ${id} not found`);
      return false;  // Explicit error handling
    }

    if (data.name) {
      user.name = data.name.toUpperCase();
    }

    user.lastModified = new Date();
    return true;
  }

  handleUserClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const userId = target.dataset.userId;

    // ✅ Explicit null checking
    if (!userId) {
      console.error('No userId in dataset');
      return;
    }

    const success = this.updateUser(userId, { name: 'Updated' });
    if (!success) {
      this.showError('Failed to update user');
    }
  }

  // ✅ Helper with proper null handling
  private showError(message: string): void {
    const errorEl = document.getElementById('error-message');
    if (errorEl) {  // Must check for null
      errorEl.textContent = message;
    }
  }
}

// Week 3-4 Results:
// - 2,156 new type errors from strictNullChecks
// - Fixed 1,943 errors (90%)
// - Used non-null assertion (!) for 213 cases (10%)
// - Time spent: 120 developer hours
// - Bugs found: 47 potential null reference errors
// - Pattern: 65% of errors in DOM manipulation code
```

**Week 5-6: Enable `strictFunctionTypes` and `strictBindCallApply`**

```typescript
// Step 3: Fix function type issues
export class UserService {
  private cache: Record<string, User> = {};

  // ✅ Proper event handler typing
  private eventHandlers: Map<string, (event: Event) => void> = new Map();

  registerHandler(
    eventName: string,
    handler: (event: Event) => void
  ): void {
    this.eventHandlers.set(eventName, handler);
  }

  // ✅ Bound method with correct 'this' type
  handleUserClick = (event: MouseEvent): void => {
    // Arrow function ensures 'this' is UserService instance
    const target = event.target as HTMLElement;
    const userId = target.dataset.userId;

    if (!userId) return;

    this.updateUser(userId, { name: 'Updated' });
  }

  // ✅ Using bind/call/apply with type safety
  delegateToHelper(id: string): void {
    function helperFunction(this: UserService, userId: string, action: string) {
      const user = this.cache[userId];
      console.log(`${action} user:`, user?.name);
    }

    // ✅ Strict mode ensures correct arguments
    helperFunction.call(this, id, 'Updating');
    helperFunction.apply(this, [id, 'Fetching']);

    const bound = helperFunction.bind(this, id);
    bound('Deleting');
  }
}

// Week 5-6 Results:
// - 387 new type errors
// - Fixed all 387 errors (100%)
// - Time spent: 40 developer hours
// - Bugs found: 12 incorrect event handler bindings
// - Pattern: Most errors in class methods used as callbacks
```

**Week 7-8: Enable `strictPropertyInitialization` and Full Strict Mode**

```typescript
// Step 4: Ensure all properties are initialized
export class UserService {
  // ✅ All properties explicitly initialized
  private cache: Record<string, User> = {};
  private eventHandlers: Map<string, (event: Event) => void> = new Map();

  // ✅ Properties initialized in constructor
  private readonly apiUrl: string;
  private readonly timeout: number;

  // ✅ Optional properties for lazy initialization
  private metricsCollector?: MetricsCollector;

  constructor(config: ServiceConfig) {
    this.apiUrl = config.apiUrl;
    this.timeout = config.timeout ?? 5000;

    // Conditional initialization
    if (config.enableMetrics) {
      this.initializeMetrics();
    }
  }

  private initializeMetrics(): void {
    this.metricsCollector = new MetricsCollector();
  }

  // ✅ Method safely handles optional property
  logMetric(name: string, value: number): void {
    this.metricsCollector?.record(name, value);
  }

  // Full strict mode example
  async fetchUser(id: string): Promise<User | null> {
    try {
      const response = await fetch(`${this.apiUrl}/users/${id}`, {
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        return null;
      }

      const data: unknown = await response.json();

      // ✅ Type guard for runtime validation
      if (this.isUser(data)) {
        this.cache[id] = data;
        return data;
      }

      return null;
    } catch (error) {
      // ✅ useUnknownInCatchVariables handling
      if (error instanceof Error) {
        console.error('Fetch error:', error.message);
      }
      return null;
    }
  }

  private isUser(data: unknown): data is User {
    return (
      typeof data === 'object' &&
      data !== null &&
      'id' in data &&
      'name' in data
    );
  }
}

// Week 7-8 Results:
// - 523 new type errors
// - Fixed 498 errors (95%)
// - Used definite assignment (!) for 25 cases (5%)
// - Time spent: 60 developer hours
// - Bugs found: 18 uninitialized properties
```

**Final Migration Results (After 8 weeks):**

```typescript
// tsconfig.json - Full strict mode
{
  "compilerOptions": {
    "strict": true,  // ✅ All strict flags enabled
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}

// Post-migration metrics (6 months after completion):
//
// Development Impact:
// - Total type errors fixed: 4,313
// - Total developer hours: 300 hours (7.5 weeks)
// - Average PR review time: 2.5 hours (37.5% reduction)
// - New bugs introduced: 3 (during migration)
// - Legacy bugs discovered and fixed: 100
//
// Production Impact:
// - Null/undefined errors: 1.2 per month (90% reduction)
// - Type-related bugs: 0.8 per month (90% reduction)
// - Total production bugs: 8 per month (47% reduction)
// - Downtime incidents: 0 (from 2-3 per month)
// - Developer confidence: 8.5/10 (up from 6.2/10)
//
// Business Impact:
// - Revenue protected: ~$144,000/year (from prevented downtime)
// - Development velocity: +15% (less time debugging)
// - Onboarding time: -20% (types as documentation)
// - Migration cost: $45,000 (300 hours × $150/hour)
// - ROI: 320% in first year
```

**Key Lessons Learned:**

1. **Incremental adoption is critical** - enabling all strict flags at once would have been overwhelming
2. **Start with `noImplicitAny`** - biggest bang for buck, forces type discipline
3. **`strictNullChecks` finds the most bugs** - caught 47 potential null reference errors
4. **Team training essential** - 2 days of workshops on strict TypeScript patterns
5. **Tooling helps** - ESLint rules, automated refactoring tools saved 40% of time
6. **Legacy code strategy** - excluded vendor code, migrated incrementally by module
7. **Type guards are crucial** - runtime validation with compile-time safety is powerful
8. **CI/CD integration** - strict mode in CI prevented regression

</details>

---

<details>
<summary><strong>⚖️ Trade-offs: Gradual vs Immediate Strict Adoption</strong></summary>

**Decision Matrix:**

| Factor | Gradual Migration | Immediate Strict Mode | Winner |
|--------|-------------------|----------------------|--------|
| **Time to Full Strict** | 8-12 weeks | 1-2 weeks (new projects) | Immediate ✅ |
| **Developer Disruption** | Low (learn incrementally) | High (steep learning curve) | Gradual ✅ |
| **Bugs Found** | High (100+ in case study) | High (prevents from start) | Tie ⚖️ |
| **Code Quality** | Improves over time | High from day 1 | Immediate ✅ |
| **Team Morale** | Manageable pace | Can be overwhelming | Gradual ✅ |
| **Technical Debt** | Temporary (during migration) | None | Immediate ✅ |
| **Business Risk** | Low (controlled rollout) | Medium (if retrofitting) | Gradual ✅ |
| **Long-term Maintenance** | Same (both end at strict) | Same (both end at strict) | Tie ⚖️ |

**1. Gradual Migration (Existing Codebase)**

**Pros:**
- **Manageable workload**: Fix errors in batches, not all at once
- **Team learning curve**: Developers learn strict patterns incrementally
- **Lower risk**: Can rollback individual flags if issues arise
- **Prioritization**: Fix critical paths first (auth, payments, etc.)
- **Business continuity**: Development continues during migration

**Cons:**
- **Extended timeline**: 2-3 months to full strict mode
- **Temporary inconsistency**: Codebase has mixed strict/non-strict patterns
- **Multiple refactoring passes**: Same code touched multiple times
- **Technical debt**: Temporary `any` escape hatches accumulate
- **Team confusion**: Different files have different strictness levels

**Best for:**
- Large existing codebases (100k+ lines)
- Teams new to TypeScript
- Projects with tight deadlines
- Legacy JavaScript migrations

**Example strategy:**

```typescript
// Week 1-2: noImplicitAny
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": true
  }
}

// Week 3-4: strictNullChecks
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}

// Week 5-6: strictFunctionTypes + strictBindCallApply
// Week 7-8: strictPropertyInitialization + full strict
{
  "compilerOptions": {
    "strict": true  // All flags enabled
  }
}
```

**2. Immediate Strict Mode (New Projects)**

**Pros:**
- **Clean start**: No technical debt from day 1
- **Consistent codebase**: All code follows same strict patterns
- **Best practices enforced**: Team learns correct patterns immediately
- **Fewer bugs**: Type safety prevents issues before they happen
- **Better IDE support**: More accurate autocomplete and refactoring
- **Documentation**: Types serve as living documentation

**Cons:**
- **Slower initial development**: More upfront type definitions required
- **Learning curve**: Team must understand strict patterns from start
- **Boilerplate**: More verbose code in some cases
- **Third-party friction**: Some libraries have poor type definitions
- **Developer frustration**: Can feel restrictive for beginners

**Best for:**
- New TypeScript projects
- Teams experienced with TypeScript
- High-reliability applications (fintech, healthcare)
- Projects with strong type safety requirements

**Example setup:**

```typescript
// tsconfig.json for new project
{
  "compilerOptions": {
    "strict": true,  // ✅ Enable from day 1
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",

    // Additional strict-adjacent flags
    "noUncheckedIndexedAccess": true,  // Arrays/objects might be undefined
    "noImplicitReturns": true,  // All code paths must return
    "noFallthroughCasesInSwitch": true,  // Switch cases must break

    // Linting-like flags
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "allowUnreachableCode": false
  }
}

// Example: Strict mode from start
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  profile?: UserProfile;  // Explicit optional
}

// ✅ All edge cases handled from start
function getUser(id: string): User | null {
  const user = database.users.get(id);
  return user ?? null;
}

function displayUserProfile(userId: string): void {
  const user = getUser(userId);

  if (!user) {
    showError('User not found');
    return;
  }

  const profile = user.profile;
  if (!profile) {
    showError('Profile not available');
    return;
  }

  render(profile);
}
```

**3. Hybrid Approach (Recommended for Most Teams)**

**Strategy:** Strict mode for new code, gradual migration for legacy

```typescript
// tsconfig.json (base)
{
  "compilerOptions": {
    "strict": false,  // Off by default
    "noImplicitAny": true  // Minimum baseline
  }
}

// tsconfig.strict.json (extends base)
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "strict": true  // Full strict mode
  },
  "include": [
    "src/modules/new-feature/**/*",
    "src/modules/refactored/**/*"
  ]
}

// package.json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "type-check:strict": "tsc --project tsconfig.strict.json --noEmit",
    "type-check:all": "npm run type-check && npm run type-check:strict"
  }
}

// CI/CD: Both must pass
// - New code fails if not strict-compliant
// - Legacy code checked with baseline rules
```

**Performance Comparison:**

```typescript
// Compilation time impact (medium project: 50k lines)
//
// No strict flags:
// - Initial build: 12.3s
// - Incremental: 1.8s
// - Memory: 420MB
//
// Full strict mode:
// - Initial build: 13.1s (+6.5%)
// - Incremental: 2.0s (+11%)
// - Memory: 450MB (+7%)
//
// Trade-off: Minimal performance cost (<10%) for significant safety gains
// Recommendation: Performance impact is negligible for the benefits
```

**Cost-Benefit Analysis (1-year projection):**

```typescript
// Gradual Migration (Large Codebase: 150k lines)
//
// Costs:
// - Migration time: 300 developer hours ($45,000)
// - Training: 40 hours ($6,000)
// - Tooling setup: 20 hours ($3,000)
// Total: $54,000
//
// Benefits:
// - Bugs prevented: ~100 bugs × $500 avg cost = $50,000
// - Downtime prevented: 3 incidents × $12,000 = $36,000
// - Faster onboarding: -20% time × 5 new hires = $15,000
// - Development velocity: +15% × $300k yearly = $45,000
// Total: $146,000
//
// ROI: 170% ($92,000 net benefit)

// Immediate Strict Mode (New Project)
//
// Costs:
// - Training: 40 hours ($6,000)
// - Initial slowdown: +10% time for 2 months ($10,000)
// Total: $16,000
//
// Benefits:
// - Bugs prevented from start: ~50 bugs × $500 = $25,000
// - No migration cost in future: $45,000 saved
// - Better code quality from day 1: $20,000 (faster reviews)
// Total: $90,000
//
// ROI: 463% ($74,000 net benefit)
```

**When to Choose Each Approach:**

| Scenario | Recommendation | Reasoning |
|----------|---------------|-----------|
| New greenfield project | Immediate strict ✅ | No legacy code, best practices from start |
| Large legacy codebase | Gradual migration ✅ | Manageable risk, team learning curve |
| Team new to TypeScript | Gradual migration ✅ | Avoid overwhelming developers |
| High-reliability app | Immediate strict ✅ | Safety is paramount |
| Tight deadline | Gradual migration ✅ | Spread work over time |
| Small project (<10k lines) | Immediate strict ✅ | Migration would be quick anyway |
| Active development | Hybrid approach ✅ | New code strict, migrate legacy incrementally |

</details>

---

<details>
<summary><strong>💬 Explain to Junior: TypeScript Strict Mode Simplified</strong></summary>

**The Analogy:**

Think of TypeScript strict mode like **safety features in a car**:

**Without strict mode** (basic TypeScript):
- Like a car with seatbelts but no airbags, anti-lock brakes, or stability control
- You have some protection (basic type checking)
- But you can still get hurt (runtime errors from null, wrong types)
- You might not notice problems until you crash (production bugs)

**With strict mode** (full TypeScript):
- Like a modern car with all safety features enabled
- Seatbelts + airbags + ABS + traction control + lane assist
- Multiple layers of protection catch problems before they cause crashes
- The car warns you (compiler errors) before you do something dangerous
- Slightly more restrictive (have to check blind spots), but way safer

**What Strict Mode Actually Does:**

```typescript
// Without strict mode: TypeScript is relaxed
function greet(name) {  // ✅ Compiles (but 'name' is any type)
  console.log(name.toUpperCase());
}

greet(null);  // 💥 CRASH at runtime!


// With strict mode: TypeScript is protective
function greet(name) {  // ❌ Error: Parameter 'name' implicitly has 'any' type
  console.log(name.toUpperCase());
}

// Force you to be explicit:
function greet(name: string) {  // ✅ Must specify type
  console.log(name.toUpperCase());
}

greet(null);  // ❌ Error: Argument of type 'null' is not assignable to 'string'
// TypeScript prevents the crash BEFORE runtime!
```

**The 8 Strict Flags (Simplified):**

**1. `noImplicitAny`** - "Tell me what type this is!"

```typescript
// ❌ Without: TypeScript guesses (often wrong)
function add(a, b) {  // TypeScript: "I'll assume these are 'any' type"
  return a + b;
}
add(5, "10");  // Returns "510" (oops, string concatenation!)

// ✅ With: You must be explicit
function add(a: number, b: number): number {
  return a + b;
}
add(5, "10");  // ❌ Error caught at compile time!
```

**2. `strictNullChecks`** - "Check if it exists before using it!"

```typescript
// ❌ Without: Can crash on null/undefined
const users = ['Alice', 'Bob'];
const user = users[5];  // undefined
console.log(user.toUpperCase());  // 💥 CRASH!

// ✅ With: Must check first
const users: string[] = ['Alice', 'Bob'];
const user: string | undefined = users[5];
// ❌ Error: Object is possibly 'undefined'
console.log(user.toUpperCase());

// Fix: Check before using
if (user) {
  console.log(user.toUpperCase());  // ✅ Safe!
}
```

**3. `strictFunctionTypes`** - "Functions must match exactly!"

```typescript
// Ensures function parameters are compatible

type Handler = (value: string | number) => void;

// ✅ Safe: Can handle both string and number
const safeHandler: Handler = (value) => {
  console.log(value);
};

// ❌ Unsafe: Only handles strings
const unsafeHandler: Handler = (value: string) => {
  console.log(value.toUpperCase());  // What if value is a number?
};
```

**4. `strictBindCallApply`** - "Check function calls are correct!"

```typescript
function greet(name: string, age: number) {
  console.log(`${name} is ${age} years old`);
}

// ✅ Correct usage
greet.call(null, 'Alice', 30);

// ❌ Error: Wrong number of arguments
greet.call(null, 'Alice');

// ❌ Error: Wrong types
greet.call(null, 'Alice', 'thirty');
```

**5. `strictPropertyInitialization`** - "Initialize all class properties!"

```typescript
class User {
  name: string;  // ❌ Error: Must initialize this!

  // ✅ Fixes:
  email: string = '';  // Default value
  age?: number;  // Optional property

  id: string;
  constructor(id: string) {
    this.id = id;  // Initialize in constructor
  }
}
```

**6-8. Other Flags** - Additional safety checks

```typescript
// alwaysStrict: Adds "use strict" to JavaScript output
// useUnknownInCatchVariables: Errors are 'unknown' not 'any'
// (Other internal checks for edge cases)
```

**Interview Answer Template:**

**Question: "What is TypeScript strict mode?"**

**Great Answer:**
"TypeScript strict mode is a compiler setting that enables all strict type-checking options at once. It's like turning on all safety features in a car - it catches more potential bugs at compile time instead of runtime.

The most important flags are `noImplicitAny`, which forces you to explicitly type parameters and variables, and `strictNullChecks`, which makes you handle null and undefined explicitly. This prevents the most common runtime errors.

For example, with strict mode enabled, if I try to access a property on something that might be null, TypeScript will show a compile error and force me to add a null check first. This has prevented countless production bugs in my experience.

I always enable strict mode for new projects because the upfront cost of being more explicit is far less than the cost of debugging runtime errors in production. For existing codebases, I migrate gradually - usually starting with `noImplicitAny`, then `strictNullChecks`, and so on."

**Common Interview Questions:**

1. **"Why use strict mode?"**
   - Answer: Catches bugs at compile time, better IDE support, safer refactoring, serves as documentation

2. **"How to migrate existing code?"**
   - Answer: Enable flags one at a time, start with `noImplicitAny`, fix errors incrementally, use project references for large codebases

3. **"What's the performance impact?"**
   - Answer: Minimal (~5-10% longer compilation), but runtime performance is identical, benefits far outweigh costs

4. **"Can you disable strict mode for specific files?"**
   - Answer: Yes, use `// @ts-nocheck` at top of file (temporary only), or exclude files in tsconfig, but this is a code smell

**Key Takeaways:**
- Strict mode = maximum type safety
- Prevents null/undefined errors (biggest cause of runtime bugs)
- Forces explicit typing (makes code self-documenting)
- Enable for all new projects, migrate gradually for existing code
- Small upfront cost, massive long-term benefits

---

## Question 2: How to migrate a JavaScript project to strict TypeScript?

**Answer:**

Migrating a JavaScript project to strict TypeScript is a systematic process that requires careful planning, incremental adoption, and team coordination. The goal is to achieve full type safety without disrupting ongoing development.

**High-level migration strategy:**

1. **Set up TypeScript infrastructure** (tsconfig.json, build tools)
2. **Convert `.js` files to `.ts`** (rename files, add basic types)
3. **Enable strict flags incrementally** (noImplicitAny → strictNullChecks → full strict)
4. **Fix type errors systematically** (by module, by severity, by team)
5. **Establish team practices** (code reviews, type guidelines, CI/CD integration)

**Basic migration checklist:**

```typescript
// 1. Install TypeScript and type definitions
npm install --save-dev typescript @types/node
npm install --save-dev @types/react @types/react-dom  // if using React

// 2. Create tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "allowJs": true,  // ✅ Allow .js files during migration
    "checkJs": false,  // Don't type-check .js files yet
    "strict": false,  // Enable incrementally
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}

// 3. Rename files: .js → .ts, .jsx → .tsx
// Start with leaf modules (no dependencies) first

// 4. Add types to function signatures
// Before (JavaScript):
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// After (TypeScript):
interface Item {
  price: number;
}

function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// 5. Enable strict flags one at a time
// Week 1: "noImplicitAny": true
// Week 2: "strictNullChecks": true
// Week 3: "strict": true
```

**Key principles for successful migration:**

1. **Incremental approach**: Don't try to migrate everything at once
2. **Module-by-module**: Migrate complete modules/features, not random files
3. **Bottom-up**: Start with utility functions, then modules with no dependencies
4. **Team buy-in**: Ensure all developers understand the benefits and process
5. **Automated tools**: Use TypeScript language service, linters, codemods
6. **Continuous integration**: Make type checking part of CI/CD pipeline
7. **Documentation**: Create team guidelines for common patterns

</details>

---

<details>
<summary><strong>🔍 Deep Dive: Migration Strategies and Internals</strong></summary>

**1. File Conversion Strategies**

**Strategy A: Big Bang (Not Recommended)**

```typescript
// Convert all .js → .ts in one go
// ❌ Problems:
// - Overwhelming number of errors (thousands)
// - Blocks all development
// - High risk of breaking production
// - Team burnout
//
// Only viable for very small projects (<5k lines)
```

**Strategy B: Bottom-Up (Recommended)**

```typescript
// Start with leaf modules (no dependencies)
// Then work up the dependency tree

// Example dependency tree:
//
// App.tsx
//   ├── UserDashboard.tsx
//   │     ├── UserProfile.tsx
//   │     │     └── Avatar.tsx ← Start here (leaf)
//   │     └── UserSettings.tsx ← Then here
//   └── utils/
//         ├── formatters.ts ← Start here (no dependencies)
//         └── validators.ts ← Then here

// Migration order:
// 1. utils/formatters.ts (pure functions, no dependencies)
// 2. utils/validators.ts (depends only on formatters)
// 3. Avatar.tsx (simple component, no children)
// 4. UserProfile.tsx (depends on Avatar)
// 5. UserSettings.tsx (sibling to UserProfile)
// 6. UserDashboard.tsx (depends on both)
// 7. App.tsx (root component)

// Example: Migrating formatters.ts
// Before (JavaScript):
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

// After (TypeScript with strict mode):
export function formatCurrency(amount: number): string {
  if (!Number.isFinite(amount)) {
    throw new TypeError('Amount must be a finite number');
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

// Type definition file helps other modules during migration
// formatters.d.ts (if you can't migrate the .js file yet)
export function formatCurrency(amount: number): string;
```

**Strategy C: Feature-by-Feature (Recommended for Active Development)**

```typescript
// Migrate complete features/modules, not individual files
// ✅ Advantages:
// - Aligns with sprint/iteration work
// - Developers can focus on one feature at a time
// - Easier to test migrations
// - Minimal context switching

// Example: Migrate "Authentication" feature
//
// src/features/auth/
//   ├── login.ts ✅ Migrated
//   ├── logout.ts ✅ Migrated
//   ├── register.ts ✅ Migrated
//   └── passwordReset.ts ✅ Migrated
//
// All 4 files migrated together in one PR
// Can be tested as a complete unit

// tsconfig for feature migration
{
  "compilerOptions": {
    "strict": true
  },
  "include": [
    "src/features/auth/**/*"  // Only auth feature uses strict mode
  ]
}
```

**2. Handling `allowJs` and `checkJs`**

```typescript
// tsconfig.json progression during migration

// Phase 1: Allow .js files alongside .ts
{
  "compilerOptions": {
    "allowJs": true,  // ✅ .js and .ts can coexist
    "checkJs": false,  // Don't type-check .js files
    "strict": false
  }
}

// Phase 2: Check .js files for obvious errors
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,  // ✅ Type-check .js files (lenient)
    "strict": false
  }
}

// This catches obvious errors in .js files:
// - Typos in property names
// - Wrong number of arguments
// - Definitely incorrect types

// Example .js file with checkJs:
// user.js
export function getUser(id) {
  return database.users.fined(id);  // ❌ Error: Property 'fined' does not exist
}                                    // (Did you mean 'find'?)

// Phase 3: Full strict mode for all .ts files
{
  "compilerOptions": {
    "allowJs": true,  // Still allow .js (if any remain)
    "checkJs": true,
    "strict": true  // ✅ Strict mode for .ts files
  }
}

// Phase 4: No more .js files
{
  "compilerOptions": {
    "allowJs": false,  // ✅ Only .ts files allowed
    "strict": true
  }
}
```

**3. Type Declaration Files (`.d.ts`) for Legacy Code**

```typescript
// Useful when you can't migrate a .js file yet
// but other .ts files need to import it

// legacy-module.js (can't migrate yet due to complexity)
export function complexLegacyFunction(data) {
  // 500 lines of complex logic
  return processedData;
}

// legacy-module.d.ts (type definitions for the .js file)
export interface LegacyData {
  id: string;
  value: number;
  metadata?: Record<string, unknown>;
}

export interface ProcessedData {
  success: boolean;
  result: unknown;
}

export function complexLegacyFunction(data: LegacyData): ProcessedData;

// Now TypeScript files can safely import the legacy module
// new-feature.ts
import { complexLegacyFunction } from './legacy-module';

const data: LegacyData = { id: '123', value: 42 };
const result = complexLegacyFunction(data);  // Type-checked!
```

**4. Automated Migration Tools**

```typescript
// 1. TypeScript Language Service API
// Automatically infer types from usage

// JavaScript:
function add(a, b) {
  return a + b;
}
add(5, 10);  // Always called with numbers

// TypeScript can infer:
function add(a: number, b: number): number {
  return a + b;
}

// 2. ts-migrate (Airbnb's tool)
npm install -g ts-migrate
ts-migrate migrate:init .  // Create tsconfig.json
ts-migrate migrate:rename .  // Rename .js → .ts
ts-migrate migrate:annotate .  // Add @ts-expect-error to errors

// Result:
function processUser(user) {  // Still has implicit 'any'
  // @ts-expect-error TS7006: Parameter 'user' implicitly has 'any' type
  return user.name.toUpperCase();
}

// You can then fix these systematically

// 3. eslint-plugin-typescript for gradual migration
// .eslintrc.js
module.exports = {
  extends: [
    'plugin:@typescript-eslint/recommended'
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',  // Warn instead of error
    '@typescript-eslint/explicit-function-return-type': 'off'  // Too strict for migration
  }
};

// 4. VS Code Quick Fixes
// TypeScript language server suggests fixes:
// - Infer type from usage
// - Add missing properties
// - Convert to optional chaining
// - Add type annotations

// Example: VS Code suggests:
const user = getUser();
user.name.toUpperCase();
// Quick fix: "Add optional chaining"
user?.name?.toUpperCase();
```

**5. Handling Third-Party Libraries**

```typescript
// Problem: Library has no type definitions

// Solution 1: Install @types package
npm install --save-dev @types/lodash

// Solution 2: Create local type definitions
// types/my-library.d.ts
declare module 'my-library' {
  export function doSomething(value: string): Promise<number>;
}

// Solution 3: Use module augmentation for incomplete types
// types/express.d.ts
import { Request } from 'express';

declare module 'express' {
  interface Request {
    user?: {
      id: string;
      role: string;
    };
  }
}

// Now req.user is typed throughout the app

// Solution 4: Ambient declarations for global variables
// types/globals.d.ts
declare global {
  interface Window {
    __INITIAL_STATE__: {
      user: User;
      theme: 'light' | 'dark';
    };
  }
}

export {};  // Make this a module
```

**6. Incremental Strict Mode Configuration**

```typescript
// Use multiple tsconfig files for gradual rollout

// tsconfig.base.json (shared config)
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}

// tsconfig.json (loose mode for legacy code)
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": true  // Minimum baseline
  },
  "include": ["src/**/*"],
  "exclude": ["src/new/**/*"]  // Exclude strict code
}

// tsconfig.strict.json (strict mode for new code)
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,  // Extra strict
    "noImplicitReturns": true
  },
  "include": [
    "src/new/**/*",  // New features
    "src/migrated/**/*"  // Migrated legacy code
  ]
}

// package.json scripts
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "type-check:strict": "tsc --project tsconfig.strict.json --noEmit",
    "type-check:all": "npm run type-check && npm run type-check:strict"
  }
}

// CI/CD: Both must pass
// GitHub Actions example
- name: Type check
  run: npm run type-check:all
```

**7. Advanced Type Inference During Migration**

```typescript
// TypeScript 4.7+ has powerful inference
// Often you don't need to add types manually

// Example 1: Inferred from return type
function fetchUser(id: string) {
  return fetch(`/api/users/${id}`)
    .then(res => res.json())
    .then(data => ({
      id: data.id,
      name: data.name,
      email: data.email
    }));
}

// TypeScript infers return type:
// Promise<{ id: any; name: any; email: any; }>

// Add type assertion for better inference:
interface User {
  id: string;
  name: string;
  email: string;
}

function fetchUser(id: string): Promise<User> {
  return fetch(`/api/users/${id}`)
    .then(res => res.json())
    .then(data => data as User);  // Better: validate at runtime
}

// Example 2: Inferred from usage
const users = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' }
];
// TypeScript infers: Array<{ id: string; name: string; }>

// Example 3: Discriminated unions inferred
const result = Math.random() > 0.5
  ? { success: true, data: { value: 42 } }
  : { success: false, error: 'Failed' };

// TypeScript infers:
// { success: boolean; data: { value: number; }; error?: undefined; } |
// { success: boolean; error: string; data?: undefined; }

// Better: Explicit discriminated union
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

**8. Handling Common Migration Challenges**

```typescript
// Challenge 1: Circular dependencies
// Before (JavaScript - works but fragile):
// user.js
import { getOrders } from './order.js';
export function getUser(id) {
  return { id, orders: getOrders(id) };
}

// order.js
import { getUser } from './user.js';
export function getOrders(userId) {
  const user = getUser(userId);
  return user.orders;
}

// After (TypeScript - circular dependency error):
// ❌ Error: Circular dependency detected

// Solution: Extract shared types
// types.ts
export interface User {
  id: string;
  orders: Order[];
}

export interface Order {
  id: string;
  userId: string;
}

// user.ts
import type { User, Order } from './types';
import { getOrders } from './order';

export function getUser(id: string): User {
  return { id, orders: getOrders(id) };
}

// order.ts
import type { User, Order } from './types';

export function getOrders(userId: string): Order[] {
  return [];  // Implementation
}

// Challenge 2: Dynamic property access
// Before:
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
};

const setting = 'apiUrl';
console.log(config[setting]);  // Works in JS

// After (TypeScript):
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
};

const setting = 'apiUrl';
console.log(config[setting]);  // ❌ Error: Element implicitly has 'any' type

// Solution 1: Type assertion
console.log(config[setting as keyof typeof config]);

// Solution 2: Type-safe accessor
type ConfigKey = keyof typeof config;
function getConfig(key: ConfigKey) {
  return config[key];
}
console.log(getConfig('apiUrl'));  // ✅ Type-safe

// Solution 3: Use Record type
type Config = Record<string, string | number>;
const config: Config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
};

// Challenge 3: Event handlers with 'this' context
// Before (JavaScript):
class Button {
  constructor() {
    this.element = document.createElement('button');
    this.element.addEventListener('click', this.handleClick);
  }

  handleClick(event) {
    this.element.textContent = 'Clicked!';  // 'this' is wrong!
  }
}

// After (TypeScript with strict mode):
class Button {
  private element: HTMLButtonElement;

  constructor() {
    this.element = document.createElement('button');
    // ✅ Arrow function preserves 'this'
    this.element.addEventListener('click', this.handleClick);
  }

  // ✅ Arrow function property
  private handleClick = (event: MouseEvent): void => {
    this.element.textContent = 'Clicked!';
  }

  // Or use .bind()
  // constructor() {
  //   this.element.addEventListener('click', this.handleClick.bind(this));
  // }
}
```

</details>

---

<details>
<summary><strong>🐛 Real-World Scenario: E-commerce Platform Migration (150k Lines)</strong></summary>

**Context**: Migrate a large JavaScript e-commerce platform to strict TypeScript

**Project Metrics (Before Migration):**
- 150,000 lines of JavaScript
- 2,847 files (.js, .jsx)
- 47 developers across 6 teams
- Active development (50+ PRs per week)
- Production bugs: 15/month (20% type-related)
- Build time: 45 seconds
- Test suite runtime: 12 minutes

**Timeline**: 6-month migration (parallel with active development)

**Week-by-Week Migration Plan:**

**Weeks 1-2: Setup and Preparation**

```typescript
// 1. Install dependencies
npm install --save-dev typescript @types/node @types/react @types/react-dom
npm install --save-dev @types/jest @types/lodash

// 2. Create initial tsconfig.json (very permissive)
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "jsx": "react",

    // ✅ Allow JavaScript during migration
    "allowJs": true,
    "checkJs": false,

    // ✅ Very permissive initially
    "strict": false,
    "noImplicitAny": false,

    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "node",

    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "build"]
}

// 3. Update build tools
// webpack.config.js
module.exports = {
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']  // ✅ Support both
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  }
};

// 4. Create type definition files for key modules
// types/api.d.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'customer';
}

export interface Product {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
}

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

// Week 1-2 Results:
// - TypeScript configured
// - Build pipeline updated
// - Core type definitions created
// - Team training sessions (8 hours total)
// - Documentation wiki created
// - No production code changed yet
```

**Weeks 3-6: Migrate Utility Functions (Bottom-Up)**

```typescript
// Strategy: Start with leaf modules (no dependencies)

// utils/formatters.js → utils/formatters.ts
// Before:
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString();
}

// After (with strict mode):
export function formatCurrency(amount: number): string {
  if (!Number.isFinite(amount)) {
    throw new TypeError('Amount must be a finite number');
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function formatDate(date: Date | string | number): string {
  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) {
    throw new TypeError('Invalid date');
  }

  return dateObj.toLocaleDateString();
}

// utils/validators.js → utils/validators.ts
// After:
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidCreditCard(card: string): boolean {
  const cleaned = card.replace(/\s/g, '');
  return /^\d{13,19}$/.test(cleaned) && luhnCheck(cleaned);
}

function luhnCheck(num: string): boolean {
  // Luhn algorithm implementation
  let sum = 0;
  let isEven = false;

  for (let i = num.length - 1; i >= 0; i--) {
    let digit = parseInt(num.charAt(i), 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

// Weeks 3-6 Results:
// - 127 utility files migrated (src/utils/)
// - All formatters, validators, helpers now typed
// - 0 production bugs introduced
// - Found 15 existing bugs during migration:
//   - 8 incorrect null checks
//   - 4 wrong number of function arguments
//   - 3 typos in property names
// - Time spent: 240 developer hours
// - Team velocity: -5% (learning curve)
```

**Weeks 7-12: Migrate API Layer (Feature-by-Feature)**

```typescript
// Strategy: Migrate complete API modules with types

// api/users.js → api/users.ts
// Before:
export async function fetchUser(id) {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

export async function updateUser(id, data) {
  const response = await fetch(`/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}

// After (with strict types and error handling):
import type { User } from '../types/api';

interface UpdateUserPayload {
  name?: string;
  email?: string;
}

interface ApiError {
  message: string;
  code: string;
  statusCode: number;
}

class ApiException extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

export async function fetchUser(id: string): Promise<User> {
  try {
    const response = await fetch(`/api/users/${id}`);

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new ApiException(response.status, error.code, error.message);
    }

    const data: unknown = await response.json();

    // ✅ Runtime validation
    if (!isUser(data)) {
      throw new TypeError('Invalid user data from API');
    }

    return data;
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }

    throw new ApiException(500, 'FETCH_ERROR', getErrorMessage(error));
  }
}

export async function updateUser(
  id: string,
  data: UpdateUserPayload
): Promise<User> {
  if (!id) {
    throw new TypeError('User ID is required');
  }

  if (!data.name && !data.email) {
    throw new TypeError('At least one field must be updated');
  }

  try {
    const response = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new ApiException(response.status, error.code, error.message);
    }

    const result: unknown = await response.json();

    if (!isUser(result)) {
      throw new TypeError('Invalid user data from API');
    }

    return result;
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }

    throw new ApiException(500, 'UPDATE_ERROR', getErrorMessage(error));
  }
}

// Type guard for runtime validation
function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'email' in data &&
    'name' in data &&
    'role' in data &&
    typeof (data as User).id === 'string' &&
    typeof (data as User).email === 'string' &&
    typeof (data as User).name === 'string' &&
    ['admin', 'customer'].includes((data as User).role)
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
}

// Weeks 7-12 Results:
// - 43 API modules migrated
// - All API calls now type-safe
// - Runtime validation added
// - Found 23 bugs:
//   - 12 missing error handling
//   - 8 incorrect response parsing
//   - 3 race conditions
// - Time spent: 360 developer hours
// - API-related bugs in production: 12/month → 3/month (75% reduction)
```

**Weeks 13-18: Migrate React Components**

```typescript
// Strategy: Component-by-component migration
// Start with leaf components (no children)

// components/Button.jsx → components/Button.tsx
// Before:
import React from 'react';

export function Button({ children, onClick, variant }) {
  const className = `btn btn-${variant}`;
  return (
    <button className={className} onClick={onClick}>
      {children}
    </button>
  );
}

// After (with strict types):
import React, { ReactNode, MouseEvent } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  type = 'button'
}: ButtonProps): JSX.Element {
  const className = `btn btn-${variant}`;

  return (
    <button
      className={className}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  );
}

// Complex component migration:
// components/ProductCard.jsx → components/ProductCard.tsx
// After:
import React, { useState } from 'react';
import type { Product } from '../types/api';

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string, quantity: number) => void;
  onViewDetails: (productId: string) => void;
}

export function ProductCard({
  product,
  onAddToCart,
  onViewDetails
}: ProductCardProps): JSX.Element {
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdding, setIsAdding] = useState<boolean>(false);

  const handleAddToCart = async (): Promise<void> => {
    setIsAdding(true);

    try {
      await onAddToCart(product.id, quantity);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      // Show error toast
    } finally {
      setIsAdding(false);
    }
  };

  const handleQuantityChange = (newQuantity: number): void => {
    if (newQuantity < 1 || newQuantity > 99) {
      return;
    }
    setQuantity(newQuantity);
  };

  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p className="price">{formatCurrency(product.price)}</p>

      {product.inStock ? (
        <>
          <input
            type="number"
            min="1"
            max="99"
            value={quantity}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10))}
          />
          <button onClick={handleAddToCart} disabled={isAdding}>
            {isAdding ? 'Adding...' : 'Add to Cart'}
          </button>
        </>
      ) : (
        <p className="out-of-stock">Out of Stock</p>
      )}

      <button onClick={() => onViewDetails(product.id)}>
        View Details
      </button>
    </div>
  );
}

// Weeks 13-18 Results:
// - 312 React components migrated
// - All props now typed
// - Event handlers type-safe
// - Found 31 bugs:
//   - 18 incorrect prop types passed
//   - 9 missing null checks
//   - 4 event handler signature mismatches
// - Time spent: 480 developer hours
// - Component-related bugs: 8/month → 2/month (75% reduction)
```

**Weeks 19-22: Enable Strict Flags Incrementally**

```typescript
// Week 19: Enable noImplicitAny
{
  "compilerOptions": {
    "allowJs": true,
    "strict": false,
    "noImplicitAny": true  // ✅ First strict flag
  }
}

// Errors found: 1,847
// Fixed in 1 week: 1,847 (100%)
// Pattern: Most errors in event handlers and legacy code

// Week 20: Enable strictNullChecks
{
  "compilerOptions": {
    "allowJs": true,
    "strict": false,
    "noImplicitAny": true,
    "strictNullChecks": true  // ✅ Second strict flag
  }
}

// Errors found: 2,934
// Fixed in 2 weeks: 2,934 (100%)
// Pattern: DOM manipulation, API responses, array access

// Example fixes:
// Before:
const user = users.find(u => u.id === userId);
console.log(user.name);  // ❌ Error: Object is possibly 'undefined'

// After:
const user = users.find(u => u.id === userId);
if (!user) {
  throw new Error(`User ${userId} not found`);
}
console.log(user.name);  // ✅ Type narrowed to User

// Week 21-22: Enable full strict mode
{
  "compilerOptions": {
    "allowJs": false,  // ✅ No more .js files
    "strict": true  // ✅ All strict flags
  }
}

// Errors found: 567 (remaining strict flags)
// Fixed in 2 weeks: 567 (100%)
// Time spent: 200 developer hours

// Weeks 19-22 Results:
// - Full strict mode enabled
// - All .js files converted to .ts
// - 5,348 total type errors fixed
// - 0 production bugs introduced during this phase
```

**Weeks 23-26: Polish and Optimization**

```typescript
// 1. Remove all @ts-expect-error comments
// Search codebase for temporary suppressions
grep -r "@ts-expect-error" src/
// Found: 89 instances
// Fixed: 89 (replaced with proper types)

// 2. Add stricter linting rules
// .eslintrc.js
module.exports = {
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking'
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',  // ✅ No 'any' allowed
    '@typescript-eslint/strict-boolean-expressions': 'warn',
    '@typescript-eslint/no-unnecessary-condition': 'warn'
  }
};

// 3. Enable additional strict flags
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,  // Array access returns T | undefined
    "noImplicitReturns": true,  // All code paths must return
    "noFallthroughCasesInSwitch": true,  // Switch cases must break
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}

// 4. Performance optimization
// Enable incremental compilation
{
  "compilerOptions": {
    "strict": true,
    "incremental": true,  // ✅ Faster rebuilds
    "tsBuildInfoFile": ".tsbuildinfo"
  }
}

// Before optimization:
// - Build time: 52 seconds (from 45s with JS)
//
// After optimization:
// - Initial build: 48 seconds
// - Incremental build: 8 seconds
// - Memory usage: 580MB (acceptable)

// Weeks 23-26 Results:
// - All temporary workarounds removed
// - Additional strict flags enabled
// - Build performance optimized
// - Documentation completed
// - Time spent: 160 developer hours
```

**Final Migration Metrics (After 6 Months):**

```typescript
// Before Migration:
// - 150,000 lines of JavaScript
// - 2,847 .js/.jsx files
// - Build time: 45 seconds
// - Production bugs: 15/month (20% type-related)
// - Developer confidence: 6.2/10
// - Onboarding time: 4 weeks

// After Migration:
// - 165,000 lines of TypeScript (+10% from types)
// - 2,847 .ts/.tsx files
// - Build time: 48 seconds (initial), 8 seconds (incremental)
// - Production bugs: 6/month (60% reduction)
// - Type-related bugs: <1/month (95% reduction)
// - Developer confidence: 8.7/10
// - Onboarding time: 3 weeks (-25%)

// Migration Cost:
// - Total developer hours: 1,920 hours (48 weeks × 40 hours)
// - Cost: $288,000 (1,920 hours × $150/hour)

// Benefits (First Year):
// - Bugs prevented: ~110 bugs × $800 avg = $88,000
// - Downtime prevented: 6 incidents × $15,000 = $90,000
// - Faster onboarding: 5 devs × 1 week × $7,500 = $37,500
// - Development velocity: +12% × $2M yearly = $240,000
// Total: $455,500

// ROI: 58% in first year ($167,500 net benefit)
// Long-term: Compounding benefits from safer refactoring,
// faster development, better documentation

// Key Success Factors:
// 1. Incremental approach (6 months, not "big bang")
// 2. Bottom-up migration (utilities → API → components)
// 3. Team training (8 hours upfront + ongoing support)
// 4. Automated tools (ts-migrate, ESLint, VS Code)
// 5. Strong type definitions (comprehensive types/ folder)
// 6. CI/CD integration (type checking in pipeline)
// 7. Code review focus (type safety as requirement)
// 8. Documentation (migration guide, best practices wiki)
```

**Lessons Learned:**

1. **Start with utilities** - low risk, high learning value
2. **Enable strict flags incrementally** - avoid overwhelming the team
3. **Invest in team training** - 8 hours saved 200+ hours of mistakes
4. **Use type guards liberally** - runtime validation is crucial
5. **Don't rush** - 6 months was perfect pace for this size project
6. **Automate where possible** - ts-migrate saved ~40% of manual work
7. **Celebrate milestones** - team morale is key to success

</details>

---

<details>
<summary><strong>⚖️ Trade-offs: Migration Approaches and Strategies</strong></summary>

**Decision Matrix: Migration Strategy Selection**

| Factor | Bottom-Up | Top-Down | Feature-by-Feature | Big Bang |
|--------|-----------|----------|-------------------|----------|
| **Risk Level** | Low ✅ | Medium | Low ✅ | High ❌ |
| **Time to Complete** | 3-6 months | 2-4 months | 4-8 months | 2-4 weeks |
| **Learning Curve** | Gradual ✅ | Steep | Moderate | Very steep ❌ |
| **Team Disruption** | Minimal ✅ | High | Low ✅ | Very high ❌ |
| **Bugs Found** | High ✅ | Medium | High ✅ | High |
| **Business Continuity** | Excellent ✅ | Good | Excellent ✅ | Poor ❌ |
| **Code Quality** | Improves gradually | Improves top-down | Improves by feature | Improves immediately |

**1. Bottom-Up Migration (Recommended for Most)**

**Strategy:** Start with leaf modules (no dependencies), work up dependency tree

**Pros:**
- **Low risk**: Each module migrated independently
- **Minimal disruption**: Other teams can keep working
- **Learning curve**: Developers learn patterns on simple code first
- **Early wins**: Utility functions are easy to type, build confidence
- **Compound benefits**: Typed utilities make higher-level code easier

**Cons:**
- **Long timeline**: Can take 3-6 months for large codebases
- **Delayed benefits**: Core business logic migrated last
- **Temporary inconsistency**: Mixed .js and .ts files for months
- **Dependency tracking**: Must carefully track what depends on what

**Best for:**
- Large codebases (50k+ lines)
- Teams new to TypeScript
- Active development (can't pause for migration)
- Risk-averse organizations

**Example:**

```typescript
// Migration order:
// 1. src/utils/ (pure functions, no dependencies)
// 2. src/api/ (depends only on utils)
// 3. src/hooks/ (depends on utils and api)
// 4. src/components/ (depends on hooks)
// 5. src/pages/ (depends on components)
// 6. src/app.tsx (root, depends on everything)

// Week 1-4: Utils
// 127 files, 12,000 lines
// Time: 240 hours
// Bugs found: 15

// Week 5-8: API
// 43 files, 8,500 lines
// Time: 360 hours
// Bugs found: 23

// Week 9-14: Components
// 312 files, 85,000 lines
// Time: 720 hours
// Bugs found: 31

// Week 15-18: Pages and App
// 52 files, 28,000 lines
// Time: 400 hours
// Bugs found: 18
```

**2. Top-Down Migration**

**Strategy:** Start with entry points (App.tsx), work down dependency tree

**Pros:**
- **User-facing first**: Main user flows typed earliest
- **Integration issues found early**: Component boundaries tested first
- **Visible progress**: UI changes are obvious to stakeholders

**Cons:**
- **High complexity**: Entry points have most dependencies
- **Steep learning curve**: Hardest code migrated first
- **Temporary type assertions**: Must use `any` for untyped dependencies
- **Risky**: Errors in core code can block everything

**Best for:**
- Small to medium codebases (< 50k lines)
- Teams experienced with TypeScript
- Projects with clear component hierarchy

**Example:**

```typescript
// Migration order:
// 1. src/App.tsx (root)
// 2. src/pages/ (top-level routes)
// 3. src/components/ (UI components)
// 4. src/hooks/ (state management)
// 5. src/api/ (data fetching)
// 6. src/utils/ (helpers)

// Challenge: Early files need types from untyped dependencies
// App.tsx
import { fetchUser } from './api/users';  // Still .js file

// Temporary solution: Create type definitions
// api/users.d.ts
export function fetchUser(id: string): Promise<User>;

// Later: Migrate the actual implementation
// api/users.js → api/users.ts
```

**3. Feature-by-Feature Migration (Recommended for Active Development)**

**Strategy:** Migrate complete features/modules together

**Pros:**
- **Aligns with sprints**: Can plan migration into regular work
- **Complete feature coverage**: All parts of feature typed at once
- **Easier testing**: Can test entire feature after migration
- **Team ownership**: Each team migrates their own features

**Cons:**
- **Longest timeline**: Can take 4-8 months
- **Inconsistent patterns**: Different teams may adopt different styles
- **Cross-feature dependencies**: Shared code tricky to migrate
- **Coordination overhead**: Must track which features are migrated

**Best for:**
- Large teams (multiple feature teams)
- Microservices architecture
- Active product development
- Feature-flagged codebases

**Example:**

```typescript
// Migration plan by feature:

// Sprint 1: Authentication feature
// src/features/auth/
//   ├── login.ts ✅
//   ├── register.ts ✅
//   ├── passwordReset.ts ✅
//   └── hooks/useAuth.ts ✅
// Time: 2 weeks
// Team: Auth team

// Sprint 2: Product catalog feature
// src/features/products/
//   ├── ProductList.tsx ✅
//   ├── ProductDetail.tsx ✅
//   ├── api/products.ts ✅
//   └── hooks/useProducts.ts ✅
// Time: 3 weeks
// Team: Catalog team

// Sprint 3: Shopping cart feature
// src/features/cart/
//   ├── Cart.tsx ✅
//   ├── CartItem.tsx ✅
//   ├── api/cart.ts ✅
//   └── hooks/useCart.ts ✅
// Time: 2 weeks
// Team: Cart team

// Shared code migrated when first needed:
// src/shared/
//   ├── api/client.ts (migrated in Sprint 1)
//   ├── components/Button.tsx (migrated in Sprint 2)
//   └── utils/formatters.ts (migrated in Sprint 1)
```

**4. Big Bang Migration (Not Recommended)**

**Strategy:** Convert all files to TypeScript at once

**Pros:**
- **Fast**: Can complete in 2-4 weeks
- **Consistent**: All code follows same patterns
- **No mixed state**: No .js and .ts coexistence

**Cons:**
- **Very high risk**: Can break production if errors missed
- **Team burnout**: All developers working on migration full-time
- **Business disruption**: No feature development during migration
- **Overwhelming**: Thousands of errors to fix at once

**Only viable for:**
- Very small projects (< 10k lines)
- Projects with no active development
- Teams with lots of TypeScript experience

**Example (Small Project):**

```typescript
// Project: 8,000 lines, 157 files
// Timeline: 2 weeks, full team (5 developers)

// Week 1:
// - Day 1-2: Setup tsconfig, convert all .js → .ts
// - Day 3-5: Fix all type errors (2,347 errors)
//   - Each developer takes 30-40 files
//   - Daily standups to coordinate

// Week 2:
// - Day 1-3: Enable strict flags, fix errors (1,523 errors)
// - Day 4: Testing, bug fixes
// - Day 5: Deploy to production

// Result:
// - Migration complete in 2 weeks
// - 0 production bugs (small codebase, thorough testing)
// - Team exhausted (not sustainable for larger projects)
```

**Cost-Benefit Comparison (1-Year Projection):**

```typescript
// Large Codebase (150k lines):

// Bottom-Up Migration:
// Cost: $288,000 (6 months)
// Benefits: $455,500
// ROI: 58%
// Risk: Low
// Team morale: Good

// Top-Down Migration:
// Cost: $240,000 (5 months, faster but riskier)
// Benefits: $410,000 (fewer bugs found early)
// ROI: 71%
// Risk: Medium
// Team morale: Moderate (stressful at start)

// Feature-by-Feature:
// Cost: $320,000 (8 months, longest)
// Benefits: $480,000 (highest quality)
// ROI: 50%
// Risk: Low
// Team morale: Excellent (aligned with regular work)

// Big Bang (Not viable for large codebases):
// Cost: $180,000 (3 months, full team)
// Benefits: $350,000
// ROI: 94%
// Risk: Very high (potential production outages)
// Team morale: Poor (burnout)
```

**When to Use Each Strategy:**

| Scenario | Best Strategy | Reasoning |
|----------|--------------|-----------|
| 150k+ lines, active development | Feature-by-Feature ✅ | Aligns with regular work, low disruption |
| 50k-150k lines, established team | Bottom-Up ✅ | Low risk, manageable pace |
| < 50k lines, new TypeScript team | Bottom-Up ✅ | Learning curve on simple code first |
| < 50k lines, experienced team | Top-Down or Bottom-Up | Either works, choose based on priority |
| < 10k lines | Big Bang (carefully) | Quick migration possible |
| Multiple feature teams | Feature-by-Feature ✅ | Team ownership, parallel work |
| High-reliability app (fintech) | Bottom-Up ✅ | Lowest risk |
| Tight deadline (3 months) | Top-Down or Bottom-Up | Fastest while maintaining safety |

**Recommended Hybrid Approach:**

```typescript
// Combine strategies for optimal results:

// Phase 1: Bottom-Up for Shared Code (Weeks 1-4)
// - src/utils/ (pure functions)
// - src/api/client.ts (base HTTP client)
// - src/types/ (shared type definitions)
//
// Result: Foundation for rest of codebase

// Phase 2: Feature-by-Feature for Business Logic (Weeks 5-20)
// - Each team migrates their features
// - Use shared types from Phase 1
// - Parallel work, minimal coordination
//
// Result: All features fully typed

// Phase 3: Enable Strict Flags (Weeks 21-24)
// - noImplicitAny (week 21)
// - strictNullChecks (week 22-23)
// - Full strict (week 24)
//
// Result: Full type safety across codebase
```

</details>

---

<details>
<summary><strong>💬 Explain to Junior: Migrating to TypeScript Simplified</strong></summary>

**The Analogy:**

Migrating a JavaScript project to TypeScript is like **converting a handwritten recipe book into a printed cookbook with exact measurements**:

**JavaScript (handwritten recipes):**
- "Add some sugar" → how much? depends on the cook
- "Mix until smooth" → what's smooth? subjective
- Works if you're experienced, but beginners make mistakes

**TypeScript (printed cookbook):**
- "Add 2 cups of sugar" → exact measurement
- "Mix for 3 minutes at medium speed" → precise instructions
- Anyone can follow the recipe correctly

**Migration is the process of:**
1. Rewriting each recipe with exact measurements (adding types)
2. Testing each recipe to make sure it still works (type checking)
3. Eventually all recipes are precise (full strict mode)

**Why Migrate?**

```typescript
// JavaScript: Can call this function wrong
function calculateDiscount(price, discountPercent) {
  return price - (price * discountPercent / 100);
}

calculateDiscount(100, 20);  // Correct: $80
calculateDiscount("100", "20");  // Oops! "100NaN"
calculateDiscount(100);  // Oops! NaN (missing argument)

// TypeScript: Forces correct usage
function calculateDiscount(price: number, discountPercent: number): number {
  return price - (price * discountPercent / 100);
}

calculateDiscount(100, 20);  // ✅ $80
calculateDiscount("100", "20");  // ❌ Error: strings not allowed
calculateDiscount(100);  // ❌ Error: missing argument
```

**How to Migrate (Simplified Steps):**

**Step 1: Install TypeScript**

```bash
npm install --save-dev typescript
```

**Step 2: Create Configuration (tsconfig.json)**

```typescript
{
  "compilerOptions": {
    "strict": false,  // Start permissive
    "allowJs": true   // Allow .js files during migration
  }
}
```

**Step 3: Rename Files (.js → .ts)**

```bash
# Before:
# calculator.js
# user.js
# api.js

# After:
# calculator.ts
# user.ts
# api.ts
```

**Step 4: Add Types to Functions**

```typescript
// Before (JavaScript):
function greet(name) {
  return `Hello, ${name}!`;
}

// After (TypeScript):
function greet(name: string): string {
  return `Hello, ${name}!`;
}

// Before:
function add(a, b) {
  return a + b;
}

// After:
function add(a: number, b: number): number {
  return a + b;
}
```

**Step 5: Enable Strict Mode (Gradually)**

```typescript
// Week 1: Basic types
{
  "compilerOptions": {
    "noImplicitAny": true  // Must specify types
  }
}

// Week 2: Handle null/undefined
{
  "compilerOptions": {
    "strictNullChecks": true  // Must check for null
  }
}

// Week 3: Full strict
{
  "compilerOptions": {
    "strict": true  // All safety checks
  }
}
```

**Common Migration Patterns:**

**1. Adding Types to Objects**

```typescript
// Before:
const user = {
  name: 'Alice',
  age: 30,
  email: 'alice@example.com'
};

// After:
interface User {
  name: string;
  age: number;
  email: string;
}

const user: User = {
  name: 'Alice',
  age: 30,
  email: 'alice@example.com'
};
```

**2. Handling Null/Undefined**

```typescript
// Before (JavaScript - crashes if user not found):
function getUser(id) {
  const user = database.find(id);
  return user.name;  // 💥 Crashes if user is null
}

// After (TypeScript - forces you to check):
function getUser(id: string): string | null {
  const user = database.find(id);

  if (!user) {
    return null;  // Handle missing user
  }

  return user.name;
}
```

**3. Typing Arrays**

```typescript
// Before:
const numbers = [1, 2, 3];
const users = [
  { name: 'Alice' },
  { name: 'Bob' }
];

// After:
const numbers: number[] = [1, 2, 3];

interface User {
  name: string;
}
const users: User[] = [
  { name: 'Alice' },
  { name: 'Bob' }
];
```

**4. Typing Functions**

```typescript
// Before:
const double = (x) => x * 2;
const filter = (arr, fn) => arr.filter(fn);

// After:
const double = (x: number): number => x * 2;
const filter = <T>(arr: T[], fn: (item: T) => boolean): T[] => arr.filter(fn);
```

**Migration Timeline (Example):**

```
Week 1-2: Setup and utilities
- Install TypeScript
- Create tsconfig.json
- Migrate utility functions (formatters, validators)

Week 3-4: API layer
- Migrate API calls
- Add type definitions for responses

Week 5-8: Components
- Migrate UI components
- Type props and state

Week 9-10: Enable strict mode
- Fix null/undefined errors
- Remove 'any' types

Week 11-12: Polish
- Add documentation
- Team training
- Deploy to production
```

**Interview Answer Template:**

**Question: "How would you migrate a JavaScript project to TypeScript?"**

**Great Answer:**
"I'd take an incremental approach to minimize risk. First, I'd install TypeScript and create a permissive tsconfig.json that allows JavaScript files during migration. Then I'd start with utility functions since they're usually pure functions with no dependencies - these are the easiest to type and build team confidence.

Next, I'd migrate the API layer and add type definitions for API responses. This provides type safety for the rest of the application. Then I'd move to React components, starting with leaf components that don't have children, working up to parent components.

Throughout the migration, I'd enable strict mode flags incrementally - first `noImplicitAny` to require explicit types, then `strictNullChecks` to handle null/undefined properly, and finally full strict mode. This gradual approach lets the team learn TypeScript patterns on simple code before tackling complex business logic.

For a large codebase, I'd expect this to take 3-6 months depending on size, but the investment is worth it - we typically see 60-90% reduction in type-related bugs and improved developer productivity from better IDE support."

**Common Interview Questions:**

1. **"What's the first step in migration?"**
   - Answer: Install TypeScript, create tsconfig.json with `allowJs: true` and `strict: false`

2. **"What order should you migrate files?"**
   - Answer: Bottom-up - utilities first, then API layer, then components, finally app entry point

3. **"How to handle third-party libraries without types?"**
   - Answer: Install `@types/library-name` if available, otherwise create custom `.d.ts` type definitions

4. **"How long does migration typically take?"**
   - Answer: Small project (< 10k lines): 2-4 weeks; Medium (50k lines): 2-3 months; Large (150k lines): 4-6 months

5. **"Should you enable strict mode immediately?"**
   - Answer: No, enable flags incrementally - `noImplicitAny` first, then `strictNullChecks`, then full strict

**Key Takeaways:**
- Migrate incrementally, not all at once
- Start with simple code (utilities) to learn patterns
- Enable strict flags gradually (noImplicitAny → strictNullChecks → full strict)
- Expect 3-6 months for large projects
- Benefits: fewer bugs, better IDE support, easier refactoring
- Team training is essential for success

**Remember:** Migration is a marathon, not a sprint. Take your time, learn patterns on simple code, and gradually increase strictness. The long-term benefits are massive!

</details>
