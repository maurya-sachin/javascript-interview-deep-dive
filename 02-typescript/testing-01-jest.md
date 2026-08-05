# TypeScript Testing with Jest

## Question 1: How to test TypeScript code with Jest?

**Short Answer:**
Testing TypeScript with Jest requires configuring Jest to compile TS files using `ts-jest` or Babel, setting up type-aware test utilities, and leveraging TypeScript's type system for better test assertions. The setup involves installing dependencies (`jest`, `ts-jest`, `@types/jest`), configuring `jest.config.js` with a TypeScript preset, and writing type-safe tests with proper assertions.

**Detailed Explanation:**

### Basic Setup

**Installation:**
```bash
npm install --save-dev jest ts-jest @types/jest typescript
```

**jest.config.js:**
```typescript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

**tsconfig.json for tests:**
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["jest", "node"]
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

### Type-Safe Test Examples

**Testing a typed function:**
```typescript
// src/calculator.ts
export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }

  divide(a: number, b: number): number {
    if (b === 0) {
      throw new Error('Division by zero');
    }
    return a / b;
  }
}

// src/calculator.test.ts
import { Calculator } from './calculator';

describe('Calculator', () => {
  let calculator: Calculator;

  beforeEach(() => {
    calculator = new Calculator();
  });

  it('should add two numbers correctly', () => {
    // TypeScript ensures type safety
    const result: number = calculator.add(2, 3);
    expect(result).toBe(5);

    // This would cause a TypeScript error:
    // calculator.add('2', '3'); // Error: Argument of type 'string' not assignable
  });

  it('should throw error when dividing by zero', () => {
    expect(() => calculator.divide(10, 0)).toThrow('Division by zero');
  });

  it('should handle decimal division', () => {
    const result = calculator.divide(10, 3);
    expect(result).toBeCloseTo(3.333, 3);
  });
});
```

**Testing async TypeScript code:**
```typescript
// src/userService.ts
interface User {
  id: number;
  name: string;
  email: string;
}

export class UserService {
  async fetchUser(id: number): Promise<User> {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      throw new Error('User not found');
    }
    return response.json();
  }

  async createUser(data: Omit<User, 'id'>): Promise<User> {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
}

// src/userService.test.ts
import { UserService } from './userService';

// Mock fetch globally
global.fetch = jest.fn();

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
    jest.clearAllMocks();
  });

  it('should fetch user by id', async () => {
    const mockUser = { id: 1, name: 'John', email: 'john@test.com' };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser
    });

    const user = await service.fetchUser(1);

    expect(fetch).toHaveBeenCalledWith('/api/users/1');
    expect(user).toEqual(mockUser);
    // TypeScript ensures the returned user has correct shape
    expect(user.name).toBe('John');
  });

  it('should handle fetch errors', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false
    });

    await expect(service.fetchUser(999)).rejects.toThrow('User not found');
  });

  it('should create user without id', async () => {
    const newUserData = { name: 'Jane', email: 'jane@test.com' };
    const createdUser = { id: 2, ...newUserData };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => createdUser
    });

    const result = await service.createUser(newUserData);

    expect(result.id).toBeDefined();
    expect(result.name).toBe('Jane');
  });
});
```

### Testing Generics

```typescript
// src/repository.ts
export class Repository<T extends { id: number }> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  findById(id: number): T | undefined {
    return this.items.find(item => item.id === id);
  }

  getAll(): T[] {
    return [...this.items];
  }
}

// src/repository.test.ts
import { Repository } from './repository';

interface Product {
  id: number;
  name: string;
  price: number;
}

describe('Repository<T>', () => {
  it('should work with Product type', () => {
    const repo = new Repository<Product>();

    const product: Product = { id: 1, name: 'Laptop', price: 999 };
    repo.add(product);

    const found = repo.findById(1);
    expect(found).toEqual(product);

    // TypeScript ensures type safety
    if (found) {
      expect(found.price).toBe(999); // Property exists and is number
    }
  });

  it('should return undefined for non-existent items', () => {
    const repo = new Repository<Product>();
    const found = repo.findById(999);
    expect(found).toBeUndefined();
  });
});
```

---

<details>
<summary><strong>🔍 Deep Dive: Jest + TypeScript Configuration and Type Assertions</strong></summary>

### ts-jest vs Babel Compilation

**ts-jest (Recommended for TypeScript projects):**
```typescript
// jest.config.js with ts-jest
// Note: configuring ts-jest via `globals: { 'ts-jest': {...} }` is deprecated.
// Modern ts-jest (29+) passes options directly through `transform`.
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        // Override tsconfig for tests
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      },
      // Improve performance
      isolatedModules: true
    }]
  }
};
```

**How ts-jest works:**
1. **Transform step**: `ts-jest` intercepts `.ts` files during test runs
2. **Compilation**: Compiles TypeScript to JavaScript in-memory
3. **Type checking**: Can optionally perform type checking (disabled with `isolatedModules: true`)
4. **Source maps**: Generates source maps for accurate error reporting

**Babel preset (Faster, no type checking):**
```typescript
// jest.config.js with Babel
// Note: `preset` must point to a Jest preset package, not a Babel preset —
// `@babel/preset-typescript` belongs in the `transform` config below (or in babel.config.js).
module.exports = {
  transform: {
    '^.+\\.tsx?$': ['babel-jest', {
      presets: [
        '@babel/preset-env',
        '@babel/preset-typescript'
      ]
    }]
  }
};
```

**Performance comparison:**
- **ts-jest**: ~2.5s for 100 tests (with type checking)
- **ts-jest (isolatedModules)**: ~1.2s for 100 tests
- **Babel**: ~0.8s for 100 tests
- **Trade-off**: Babel strips types without checking them

### Advanced Type Assertions

**Custom matchers with TypeScript:**
```typescript
// src/test-utils/matchers.ts
import { expect } from '@jest/globals';

interface CustomMatchers<R = unknown> {
  toBeValidEmail(): R;
  toHaveProperty<T>(property: keyof T): R;
}

declare global {
  namespace jest {
    interface Expect extends CustomMatchers {}
    interface Matchers<R> extends CustomMatchers<R> {}
    interface InverseAsymmetricMatchers extends CustomMatchers {}
  }
}

expect.extend({
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);

    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid email`
          : `expected ${received} to be a valid email`
    };
  },

  toHaveProperty<T>(received: T, property: keyof T) {
    const pass = property in received;

    return {
      pass,
      message: () =>
        pass
          ? `expected object not to have property ${String(property)}`
          : `expected object to have property ${String(property)}`
    };
  }
});

// Usage in tests:
interface User {
  id: number;
  email: string;
}

test('custom matchers work', () => {
  const user: User = { id: 1, email: 'test@example.com' };

  expect(user.email).toBeValidEmail();
  expect(user).toHaveProperty<User>('email');
});
```

### Type-Safe Mock Utilities

**Creating typed mocks:**
```typescript
// src/test-utils/mockFactory.ts
export type MockedObject<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? jest.MockedFunction<T[K]>
    : T[K];
};

export function createMock<T>(): MockedObject<T> {
  return {} as MockedObject<T>;
}

// Advanced: Partial mocking with type safety
export function createPartialMock<T>(
  overrides: Partial<MockedObject<T>>
): MockedObject<T> {
  return overrides as MockedObject<T>;
}

// Usage:
interface PaymentGateway {
  processPayment(amount: number): Promise<string>;
  refund(transactionId: string): Promise<void>;
  getStatus(transactionId: string): Promise<'success' | 'failed' | 'pending'>;
}

test('type-safe mocking', async () => {
  const mockGateway = createMock<PaymentGateway>();

  mockGateway.processPayment = jest.fn().mockResolvedValue('txn_123');
  mockGateway.getStatus = jest.fn().mockResolvedValue('success');

  const txnId = await mockGateway.processPayment(100);
  const status = await mockGateway.getStatus(txnId);

  expect(mockGateway.processPayment).toHaveBeenCalledWith(100);
  expect(status).toBe('success');
});
```

### Testing Type Guards

```typescript
// src/typeGuards.ts
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'email' in obj &&
    typeof (obj as any).id === 'number' &&
    typeof (obj as any).email === 'string'
  );
}

// src/typeGuards.test.ts
import { isString, isUser } from './typeGuards';

describe('Type Guards', () => {
  describe('isString', () => {
    it('should return true for strings', () => {
      expect(isString('hello')).toBe(true);
      expect(isString('')).toBe(true);
    });

    it('should return false for non-strings', () => {
      expect(isString(123)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
      expect(isString({})).toBe(false);
    });

    it('should narrow types correctly', () => {
      const value: unknown = 'test';

      if (isString(value)) {
        // TypeScript knows value is string here
        expect(value.toUpperCase()).toBe('TEST');
      }
    });
  });

  describe('isUser', () => {
    it('should validate user objects', () => {
      const validUser = { id: 1, email: 'test@example.com' };
      expect(isUser(validUser)).toBe(true);
    });

    it('should reject invalid objects', () => {
      expect(isUser(null)).toBe(false);
      expect(isUser({ id: 1 })).toBe(false);
      expect(isUser({ email: 'test@example.com' })).toBe(false);
      expect(isUser({ id: '1', email: 'test@example.com' })).toBe(false);
    });
  });
});
```

### Path Mapping and Module Resolution

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/utils/*": ["src/utils/*"],
      "@/models/*": ["src/models/*"],
      "@/services/*": ["src/services/*"]
    }
  }
}

// jest.config.js
module.exports = {
  preset: 'ts-jest',
  moduleNameMapper: {
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/models/(.*)$': '<rootDir>/src/models/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1'
  }
};

// Now tests can use path aliases:
import { formatDate } from '@/utils/date';
import { User } from '@/models/User';
import { UserService } from '@/services/UserService';
```

### Coverage with Type Information

```bash
# Generate coverage with type-aware analysis
npx jest --coverage --collectCoverageFrom='src/**/*.ts'

# Coverage output shows:
# - Branch coverage (including type narrowing branches)
# - Function coverage (typed function calls)
# - Line coverage (all executable TS lines)
```

**Coverage configuration:**
```typescript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',        // Exclude type definitions
    '!src/**/*.test.ts',     // Exclude test files
    '!src/**/index.ts',      // Exclude barrel exports
    '!src/**/__mocks__/**'   // Exclude mocks
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/critical/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  }
};
```

</details>

---

<details>
<summary><strong>🐛 Real-World Scenario: Test Type Errors in Production E-commerce Platform</strong></summary>

### The Problem

**Context:** E-commerce checkout service processing 50,000 orders/day experienced runtime errors from type mismatches not caught by tests.

**Initial Metrics (Before Type-Safe Testing):**
- **Runtime errors**: 45 type-related errors/day
- **Failed orders**: 127 orders/day (~0.25% failure rate)
- **Revenue impact**: $12,500 daily loss
- **Test coverage**: 78% (but not type-aware)
- **Bug detection time**: 2-4 hours after deployment

**Error Example:**
```typescript
// src/services/OrderService.ts
interface Order {
  id: string;
  items: CartItem[];
  total: number;
  userId: number;
}

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

class OrderService {
  async calculateTotal(items: CartItem[]): Promise<number> {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  async createOrder(userId: number, items: CartItem[]): Promise<Order> {
    const total = await this.calculateTotal(items);

    // Bug: Sometimes API returns userId as string
    const order: Order = {
      id: generateId(),
      items,
      total,
      userId // Runtime error if userId is string!
    };

    return this.saveOrder(order);
  }
}

// ❌ OLD TEST (Not type-safe)
describe('OrderService', () => {
  it('should create order', async () => {
    const service = new OrderService();
    const items = [{ productId: '1', quantity: 2, price: 50 }];

    // Test passes but doesn't catch type errors
    const order = await service.createOrder('123' as any, items); // Wrong type!

    expect(order.total).toBe(100);
  });
});
```

**The Bug:**
```typescript
// Production error log:
// TypeError: Cannot perform operation on different types
// Expected: number, Received: string
// Stack: OrderService.createOrder -> database.insert
// Occurred: 45 times in 24 hours
```

### Root Cause Analysis

**Investigation:**
```typescript
// 1. Check test coverage
npm run test:coverage

// Output showed:
// - OrderService.ts: 95% coverage
// - But tests used 'as any' to bypass types
// - No runtime type validation

// 2. Review failed requests
// API Gateway logs showed:
{
  "endpoint": "/api/orders",
  "errors": [
    {
      "type": "TYPE_MISMATCH",
      "field": "userId",
      "expected": "number",
      "received": "string",
      "count": 127
    }
  ]
}

// 3. Trace source
// Legacy authentication service returned userId as string
// New order service expected number
```

### Solution Implementation

**Step 1: Enable strict type checking in tests**
```typescript
// jest.config.js - BEFORE
// Note: `globals: { 'ts-jest': {...} }` is the deprecated config style;
// modern ts-jest passes these options through `transform` instead.
module.exports = {
  preset: 'ts-jest',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      isolatedModules: true // Fast but no type checking
    }]
  }
};

// jest.config.js - AFTER
module.exports = {
  preset: 'ts-jest',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      isolatedModules: false, // Enable type checking
      diagnostics: {
        warnOnly: false, // Fail on type errors
        ignoreCodes: [] // Don't ignore any errors
      }
    }]
  }
};
```

**Step 2: Create type-safe test utilities**
```typescript
// src/test-utils/typeHelpers.ts
export function createTypedMock<T>(): jest.Mocked<T> {
  return {} as jest.Mocked<T>;
}

export function assertType<T>(value: unknown): asserts value is T {
  // Runtime validation with type assertion
  if (!isValidType<T>(value)) {
    throw new Error(`Type assertion failed: ${JSON.stringify(value)}`);
  }
}

// Validate API responses match expected types
export function validateApiResponse<T>(
  response: unknown,
  schema: (val: unknown) => val is T
): T {
  if (!schema(response)) {
    throw new Error('API response does not match expected schema');
  }
  return response;
}
```

**Step 3: Rewrite tests with strict types**
```typescript
// src/services/OrderService.test.ts - AFTER
import { OrderService } from './OrderService';
import { createTypedMock, validateApiResponse } from '@/test-utils/typeHelpers';

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(() => {
    service = new OrderService();
  });

  describe('createOrder', () => {
    it('should reject invalid userId type', async () => {
      const items: CartItem[] = [
        { productId: '1', quantity: 2, price: 50 }
      ];

      // ✅ TypeScript error: Argument type string not assignable to number
      await expect(
        // @ts-expect-error - Testing runtime behavior
        service.createOrder('123', items)
      ).rejects.toThrow('Invalid userId type');
    });

    it('should accept valid userId number', async () => {
      const items: CartItem[] = [
        { productId: '1', quantity: 2, price: 50 }
      ];

      const order = await service.createOrder(123, items); // ✅ Correct type

      expect(order.userId).toBe(123);
      expect(typeof order.userId).toBe('number');
    });

    it('should validate CartItem types', () => {
      const invalidItems = [
        { productId: 1, quantity: 2, price: 50 } // productId should be string
      ];

      // TypeScript catches this at compile time
      // @ts-expect-error
      expect(() => service.calculateTotal(invalidItems)).toThrow();
    });
  });
});
```

**Step 4: Add runtime type validation**
```typescript
// src/services/OrderService.ts - AFTER
import { z } from 'zod';

const CartItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().positive()
});

const OrderInputSchema = z.object({
  userId: z.number().int().positive(),
  items: z.array(CartItemSchema).min(1)
});

class OrderService {
  async createOrder(userId: number, items: CartItem[]): Promise<Order> {
    // Runtime validation
    const validated = OrderInputSchema.parse({ userId, items });

    const total = await this.calculateTotal(validated.items);

    const order: Order = {
      id: generateId(),
      items: validated.items,
      total,
      userId: validated.userId // Guaranteed to be number
    };

    return this.saveOrder(order);
  }
}

// Test the validation
describe('OrderService - Runtime Validation', () => {
  it('should throw on string userId at runtime', async () => {
    const service = new OrderService();
    const items: CartItem[] = [{ productId: '1', quantity: 1, price: 50 }];

    await expect(
      service.createOrder('123' as any, items)
    ).rejects.toThrow('Expected number, received string');
  });
});
```

### Results After Implementation

**Metrics (After 2 weeks):**
- **Runtime type errors**: 45/day → 0/day (100% reduction)
- **Failed orders**: 127/day → 2/day (98.4% reduction)
- **Revenue recovery**: $12,500/day saved
- **Test suite build time**: +15% (from 45s to 52s) - acceptable trade-off
- **Bug detection**: Before deployment (pre-commit hooks)

**Code quality improvements:**
```typescript
// Before: 78% coverage, type-blind tests
// After: 92% coverage, type-aware tests

// CI/CD Pipeline additions:
{
  "scripts": {
    "test": "jest",
    "test:types": "tsc --noEmit",
    "test:coverage": "jest --coverage",
    "precommit": "npm run test:types && npm run test"
  }
}
```

**Performance impact:**
```bash
# Test execution times:
# - ts-jest (isolatedModules: true): 1.2s
# - ts-jest (type checking enabled): 1.8s (+50%)
# - Benefit: Caught 12 type errors before production

# CI/CD times:
# - Before: 45s (tests only)
# - After: 52s (tests + type checking)
# - ROI: Prevented $12.5k daily losses
```

### Key Takeaways

1. **Type checking in tests is crucial**: Coverage metrics don't show type safety
2. **Runtime validation complements TypeScript**: Use zod/yup for API boundaries
3. **Strict test configuration pays off**: Small performance cost, massive error prevention
4. **Type-safe mocks prevent false positives**: Mock with correct types from the start
5. **CI/CD must include type checks**: Add `tsc --noEmit` to pipeline

</details>

---

<details>
<summary><strong>⚖️ Trade-offs: Type Safety in Tests</strong></summary>

### 1. ts-jest vs Babel

| Aspect | ts-jest | @babel/preset-typescript | Winner |
|--------|---------|--------------------------|--------|
| **Type checking** | ✅ Full type checking | ❌ Strips types only | ts-jest |
| **Speed** | Slower (1.8s/100 tests) | Faster (0.8s/100 tests) | Babel |
| **Error detection** | Compile-time + runtime | Runtime only | ts-jest |
| **Setup complexity** | Moderate | Simple | Babel |
| **Memory usage** | Higher (~200MB) | Lower (~120MB) | Babel |
| **Best for** | Libraries, critical code | Fast iteration, simple apps | Depends |

**Decision matrix:**
```typescript
// Use ts-jest when:
- Building libraries or frameworks
- Type safety is critical (financial, healthcare)
- Large codebase with complex types
- Team wants type errors caught in tests

// Use Babel when:
- Rapid prototyping
- Type checking happens separately (CI/CD)
- Performance is critical (1000+ tests)
- Types are simple and straightforward
```

**Hybrid approach:**
```typescript
// jest.config.js
module.exports = {
  projects: [
    {
      displayName: 'unit-fast',
      preset: '@babel/preset-typescript',
      testMatch: ['**/*.test.ts']
    },
    {
      displayName: 'integration-typed',
      preset: 'ts-jest',
      testMatch: ['**/*.integration.ts']
    }
  ]
};
```

### 2. Type-Aware Assertions vs Runtime Validation

**Type-aware (compile-time):**
```typescript
// ✅ TypeScript catches at compile time
interface User {
  id: number;
  email: string;
}

const user: User = { id: 1, email: 'test@example.com' };

// This fails TypeScript compilation:
// expect(user.name).toBe('John'); // Error: Property 'name' does not exist

// Pros:
// - Instant feedback (IDE)
// - Zero runtime cost
// - Refactoring safety

// Cons:
// - Doesn't catch data from external sources (APIs, DB)
// - Can be bypassed with 'as any'
```

**Runtime validation:**
```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.number(),
  email: z.string().email()
});

const validateUser = (data: unknown) => {
  return UserSchema.parse(data); // Throws if invalid
};

// ✅ Catches invalid data at runtime
test('validates user from API', () => {
  const apiData = { id: '1', email: 'invalid' }; // Wrong types

  expect(() => validateUser(apiData)).toThrow();
});

// Pros:
// - Catches external data issues
// - Works with 'unknown' types
// - Self-documenting schemas

// Cons:
// - Runtime overhead (~0.1ms per validation)
// - Extra dependency (zod: 53KB gzipped)
// - Duplicate type definitions
```

**Best practice - Combine both:**
```typescript
interface User {
  id: number;
  email: string;
}

const UserSchema = z.object({
  id: z.number(),
  email: z.string().email()
});

// Type inference from schema
type User = z.infer<typeof UserSchema>;

function createUser(data: unknown): User {
  // Runtime validation
  return UserSchema.parse(data);
}

// Tests get both compile-time and runtime safety
test('creates valid user', () => {
  const user = createUser({ id: 1, email: 'test@example.com' });

  expect(user.id).toBe(1); // TypeScript knows user.id exists
});
```

### 3. Strict vs Lenient tsconfig for Tests

**Strict configuration:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**Impact on tests:**
```typescript
// ❌ Fails with strict: true
test('calculates total', () => {
  const items = [{ price: 10 }]; // Implicit any
  const total = items.reduce((sum, item) => sum + item.price, 0);
  expect(total).toBe(10);
});

// ✅ Passes with strict types
interface Item {
  price: number;
}

test('calculates total', () => {
  const items: Item[] = [{ price: 10 }];
  const total = items.reduce((sum, item) => sum + item.price, 0);
  expect(total).toBe(10);
});
```

**Trade-offs:**

| Aspect | Strict Mode | Lenient Mode |
|--------|------------|--------------|
| **Safety** | High | Low |
| **Boilerplate** | More types needed | Less verbose |
| **Onboarding** | Steeper learning curve | Easier for juniors |
| **Refactoring** | Safer, catches issues | Risky, silent failures |
| **Test speed** | Same | Same |

**Recommendation:**
```typescript
// Production code: strict: true
// Test code: Can be slightly lenient for mocks

// tsconfig.json (production)
{
  "compilerOptions": {
    "strict": true
  }
}

// tsconfig.test.json (tests)
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": false, // Allow unused vars in test setup
    "noUnusedParameters": false // Allow unused params in mocks
  }
}
```

### 4. Coverage Thresholds with TypeScript

**Aggressive thresholds:**
```typescript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  }
};

// Pros:
// - Forces thorough testing
// - High confidence in codebase

// Cons:
// - Hard to maintain with complex types
// - Can lead to meaningless tests just for coverage
// - Slower CI/CD (more tests to run)
```

**Realistic thresholds with TypeScript:**
```typescript
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/core/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  // Exclude type-only files
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/types.ts',
    '!src/**/*.interface.ts'
  ]
};
```

**Why this works:**
- Type-only files don't need runtime coverage
- Critical code gets higher thresholds
- Overall project stays maintainable

</details>

---

<details>
<summary><strong>💬 Explain to Junior: Testing TypeScript Like Checking Homework</strong></summary>

### The Analogy

**Testing TypeScript is like a teacher grading homework with two passes:**

1. **First pass (TypeScript compiler)**: Check if you followed the format rules
   - Did you write in the correct language?
   - Did you use the right structure?
   - Did you spell variable names correctly?

2. **Second pass (Jest tests)**: Check if your answers are correct
   - Does the code produce the right results?
   - Does it handle errors properly?
   - Does it work with different inputs?

**Without TypeScript in tests:**
```typescript
// Like handing in homework in the wrong language
// Teacher can't even read it to check if answers are right

test('adds numbers', () => {
  const result = add('5', '3'); // Strings instead of numbers
  expect(result).toBe(8); // Test passes but code is broken!
});
```

**With TypeScript in tests:**
```typescript
// Like having the teacher check your format BEFORE grading content
// Catches mistakes earlier

test('adds numbers', () => {
  const result = add(5, 3); // TypeScript ensures correct types
  expect(result).toBe(8); // Now testing actual logic
});

// This wouldn't even compile:
// add('5', '3'); // Error: Expected number, got string
```

### Simple Explanation

**What is testing TypeScript code?**

Testing TypeScript is writing code that automatically checks if your main code works correctly. It's like having a robot that tests your app for you instead of clicking buttons manually.

**Why use Jest with TypeScript?**

Jest is a testing tool that can understand TypeScript if you set it up correctly. Think of it like installing a translation app so Jest can read your TypeScript code.

**Basic setup steps:**
1. Install Jest and TypeScript tools
2. Tell Jest how to read TypeScript (using `ts-jest`)
3. Write tests that check your code
4. Run tests to see if everything works

### Common Interview Questions & Answers

**Q: How do you set up Jest to work with TypeScript?**

**Answer:**
"To test TypeScript with Jest, I install three packages: `jest` for testing, `ts-jest` to compile TypeScript files, and `@types/jest` for type definitions. Then I create a `jest.config.js` file with `preset: 'ts-jest'` to tell Jest to use the TypeScript compiler. This allows Jest to understand and run `.ts` test files.

For example:
```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node'
};
```

Then I can write tests in `.test.ts` files and Jest will automatically compile and run them."

**Q: What's the difference between testing JavaScript and TypeScript?**

**Answer:**
"The main difference is type safety. In JavaScript tests, you might accidentally pass the wrong type and the test still runs. In TypeScript tests, the compiler catches type errors before tests even run.

For example:
```typescript
// JavaScript - test runs but code is broken
function add(a, b) {
  return a + b;
}
expect(add('5', 3)).toBe(8); // Returns '53' but test passes!

// TypeScript - compiler catches error
function add(a: number, b: number): number {
  return a + b;
}
expect(add('5', 3)).toBe(8); // Compile error: string not assignable to number
```

TypeScript tests give you two layers of safety: compile-time type checking and runtime behavior testing."

**Q: How do you test async functions in TypeScript?**

**Answer:**
"I test async functions using `async/await` with Jest's async matchers. TypeScript ensures the Promise types are correct.

Example:
```typescript
async function fetchUser(id: number): Promise<User> {
  const response = await fetch(\`/api/users/\${id}\`);
  return response.json();
}

test('fetches user', async () => {
  const user = await fetchUser(1);
  expect(user.id).toBe(1);
  expect(user.email).toBeDefined();
});
```

TypeScript guarantees that `fetchUser` returns a `Promise<User>`, so I know what properties to test for. If I try to access a property that doesn't exist on `User`, TypeScript will error during development."

**Q: How do you mock dependencies in TypeScript tests?**

**Answer:**
"I use `jest.fn()` and `jest.mock()` with type assertions to create type-safe mocks.

Example:
```typescript
interface UserService {
  getUser(id: number): Promise<User>;
}

const mockUserService: jest.Mocked<UserService> = {
  getUser: jest.fn().mockResolvedValue({ id: 1, name: 'John' })
};

test('uses mocked service', async () => {
  const user = await mockUserService.getUser(1);
  expect(mockUserService.getUser).toHaveBeenCalledWith(1);
  expect(user.name).toBe('John');
});
```

Using `jest.Mocked<T>` ensures that my mock has the same type signature as the real service, preventing mock-related bugs."

**Q: Should tests have 100% code coverage?**

**Answer:**
"Not necessarily. While high coverage is good, 100% isn't always practical or valuable. I focus on:

1. **Critical paths**: Payment processing, authentication - these should be near 100%
2. **Complex logic**: Algorithms, business rules - thoroughly tested
3. **Edge cases**: Error handling, boundary conditions - well covered

I typically aim for 80-85% coverage overall, with higher thresholds (90-95%) for critical modules.

```typescript
// jest.config.js
coverageThreshold: {
  global: { lines: 80, functions: 85 },
  './src/payment/': { lines: 95, functions: 95 }
}
```

The goal is meaningful tests, not just hitting a number. A test that verifies important behavior is better than ten tests that just improve coverage metrics."

### Key Points to Remember

1. **TypeScript + Jest = Double safety**: Compile-time type checking + runtime behavior testing
2. **Setup is simple**: Install packages, add config, write tests
3. **Tests catch bugs earlier**: Type errors don't even reach the test runner
4. **Use `ts-jest` preset**: It handles all the TypeScript compilation
5. **Type your mocks**: Use `jest.Mocked<T>` for type-safe mocks
6. **Coverage matters, but quality over quantity**: Test what matters, not just for metrics

### Interview Preparation Checklist

- [ ] Can explain Jest + TypeScript setup from scratch
- [ ] Understand difference between ts-jest and Babel preset
- [ ] Can write type-safe async tests
- [ ] Know how to create typed mocks
- [ ] Understand coverage thresholds and their trade-offs
- [ ] Can debug common Jest + TypeScript errors
- [ ] Know when to use runtime validation (zod) vs type checking
- [ ] Can configure path aliases in both tsconfig and Jest

</details>

---

## Question 2: How to mock and type test doubles in TypeScript?

**Short Answer:**
Mocking in TypeScript involves creating type-safe test doubles (mocks, stubs, spies) that preserve the type signature of the original dependencies. Jest provides `jest.fn()`, `jest.mock()`, and `jest.spyOn()` which can be typed using `jest.Mocked<T>`, `jest.MockedFunction<T>`, and `jest.SpyInstance<T>`. The key is ensuring mocks maintain type safety to catch errors at compile-time while providing flexibility to control behavior during tests.

**Detailed Explanation:**

### Types of Test Doubles in TypeScript

**1. Mock Functions:**
```typescript
// Basic typed mock function
type AddFunction = (a: number, b: number) => number;
const mockAdd: jest.MockedFunction<AddFunction> = jest.fn();

// Configure mock behavior
mockAdd.mockReturnValue(10);
mockAdd.mockReturnValueOnce(5).mockReturnValueOnce(15);

test('uses mock function', () => {
  expect(mockAdd(2, 3)).toBe(5);
  expect(mockAdd(7, 3)).toBe(15);
  expect(mockAdd(100, 200)).toBe(10); // Default return value

  expect(mockAdd).toHaveBeenCalledTimes(3);
  expect(mockAdd).toHaveBeenCalledWith(2, 3);
});
```

**2. Mock Objects/Services:**
```typescript
interface UserRepository {
  findById(id: number): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: number): Promise<void>;
}

// Create fully typed mock
const mockUserRepository: jest.Mocked<UserRepository> = {
  findById: jest.fn(),
  save: jest.fn(),
  delete: jest.fn()
};

// Configure mock responses
mockUserRepository.findById.mockResolvedValue({
  id: 1,
  name: 'John',
  email: 'john@example.com'
});

mockUserRepository.save.mockImplementation(async (user) => {
  return { ...user, id: Date.now() };
});

test('uses mocked repository', async () => {
  const user = await mockUserRepository.findById(1);
  expect(user?.name).toBe('John');

  const newUser = await mockUserRepository.save({
    id: 0,
    name: 'Jane',
    email: 'jane@example.com'
  });
  expect(newUser.id).toBeGreaterThan(0);
});
```

**3. Partial Mocks:**
```typescript
// When you only need to mock some methods
interface PaymentGateway {
  processPayment(amount: number): Promise<string>;
  refund(txnId: string): Promise<void>;
  getStatus(txnId: string): Promise<PaymentStatus>;
  validateCard(cardNumber: string): boolean;
}

const mockPaymentGateway: Partial<jest.Mocked<PaymentGateway>> = {
  processPayment: jest.fn().mockResolvedValue('txn_123'),
  getStatus: jest.fn().mockResolvedValue('SUCCESS')
  // validateCard and refund are omitted - this is a plain object, not a class
  // instance, so calling either of them here would throw at runtime
};

test('uses partial mock', async () => {
  const txnId = await mockPaymentGateway.processPayment!(100);
  expect(txnId).toBe('txn_123');
});
```

### Module Mocking

**Automatic module mock:**
```typescript
// src/services/emailService.ts
export class EmailService {
  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    // Real email sending logic
    return true;
  }
}

// src/services/userNotifier.test.ts
import { EmailService } from './emailService';
import { UserNotifier } from './userNotifier';

// Auto-mock the entire module
jest.mock('./emailService');

test('sends notification', async () => {
  const mockEmailService = new EmailService() as jest.Mocked<EmailService>;
  mockEmailService.sendEmail = jest.fn().mockResolvedValue(true);

  const notifier = new UserNotifier(mockEmailService);
  const result = await notifier.notifyUser(1, 'Hello');

  expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
    expect.any(String),
    'Notification',
    'Hello'
  );
  expect(result).toBe(true);
});
```

**Manual module mock with types:**
```typescript
// __mocks__/axios.ts
const mockAxios = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  create: jest.fn(() => mockAxios)
};

export default mockAxios;

// src/api/userApi.test.ts
import axios from 'axios';
import { UserApi } from './userApi';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

test('fetches users', async () => {
  mockedAxios.get.mockResolvedValue({
    data: [{ id: 1, name: 'John' }]
  });

  const api = new UserApi();
  const users = await api.getUsers();

  expect(mockedAxios.get).toHaveBeenCalledWith('/api/users');
  expect(users).toHaveLength(1);
});
```

### Spy on Methods

**Spying on class methods:**
```typescript
class Logger {
  log(message: string): void {
    console.log(`[LOG] ${message}`);
  }

  error(message: string): void {
    console.error(`[ERROR] ${message}`);
  }
}

test('spies on logger methods', () => {
  const logger = new Logger();
  const logSpy = jest.spyOn(logger, 'log');
  const errorSpy = jest.spyOn(logger, 'error');

  logger.log('Test message');
  logger.error('Error occurred');

  expect(logSpy).toHaveBeenCalledWith('Test message');
  expect(errorSpy).toHaveBeenCalledWith('Error occurred');

  // Restore original implementation
  logSpy.mockRestore();
  errorSpy.mockRestore();
});
```

**Spy with implementation override:**
```typescript
class DatabaseConnection {
  connect(): Promise<void> {
    // Real database connection
    return Promise.resolve();
  }

  query(sql: string): Promise<any[]> {
    // Real query execution
    return Promise.resolve([]);
  }
}

test('overrides database connection', async () => {
  const db = new DatabaseConnection();

  const connectSpy = jest.spyOn(db, 'connect')
    .mockResolvedValue(undefined);

  const querySpy = jest.spyOn(db, 'query')
    .mockResolvedValue([{ id: 1, name: 'Test' }]);

  await db.connect();
  const results = await db.query('SELECT * FROM users');

  expect(connectSpy).toHaveBeenCalled();
  expect(querySpy).toHaveBeenCalledWith('SELECT * FROM users');
  expect(results).toEqual([{ id: 1, name: 'Test' }]);
});
```

### Factory Functions for Type-Safe Mocks

**Mock factory pattern:**
```typescript
// src/test-utils/mockFactory.ts
export function createMockFunction<T extends (...args: any[]) => any>(): jest.MockedFunction<T> {
  return jest.fn() as jest.MockedFunction<T>;
}

export function createMockObject<T>(overrides?: Partial<jest.Mocked<T>>): jest.Mocked<T> {
  return {
    ...(overrides || {})
  } as jest.Mocked<T>;
}

// Usage
interface Calculator {
  add(a: number, b: number): number;
  subtract(a: number, b: number): number;
}

const mockCalculator = createMockObject<Calculator>({
  add: jest.fn((a, b) => a + b),
  subtract: jest.fn((a, b) => a - b)
});

test('uses mock factory', () => {
  const result = mockCalculator.add(5, 3);
  expect(result).toBe(8);
  expect(mockCalculator.add).toHaveBeenCalledWith(5, 3);
});
```

### Advanced: Recursive Mocking

**Deep mock for nested objects:**
```typescript
type DeepMocked<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? jest.MockedFunction<T[K]>
    : T[K] extends object
    ? DeepMocked<T[K]>
    : T[K];
};

interface Config {
  database: {
    host: string;
    connect(): Promise<void>;
  };
  cache: {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
  };
}

function createDeepMock<T extends object>(): DeepMocked<T> {
  return {} as DeepMocked<T>;
}

const mockConfig = createDeepMock<Config>();
mockConfig.database = {
  host: 'localhost',
  connect: jest.fn().mockResolvedValue(undefined)
};
mockConfig.cache = {
  get: jest.fn().mockResolvedValue('cached'),
  set: jest.fn().mockResolvedValue(undefined)
};

test('uses deep mock', async () => {
  await mockConfig.database.connect();
  const cached = await mockConfig.cache.get('key');

  expect(mockConfig.database.connect).toHaveBeenCalled();
  expect(cached).toBe('cached');
});
```

---

<details>
<summary><strong>🔍 Deep Dive: Type-Safe Mocking Internals</strong></summary>

### How jest.Mocked<T> Works

**Type definition analysis:**
```typescript
// From @types/jest
type MockedFunction<T extends (...args: any[]) => any> =
  jest.Mock<ReturnType<T>, Parameters<T>> & T;

type Mocked<T> = {
  [P in keyof T]: T[P] extends (...args: any[]) => any
    ? MockedFunction<T[P]>
    : T[P] extends object
    ? Mocked<T[P]>
    : T[P];
} & T;

// What this means:
// 1. For each property P in T:
//    - If it's a function, wrap it as MockedFunction
//    - If it's an object, recursively mock it
//    - Otherwise, keep the original type

// Example transformation:
interface Service {
  getName(): string;
  config: { port: number };
  save(data: string): Promise<void>;
}

// jest.Mocked<Service> becomes:
{
  getName: jest.MockedFunction<() => string>;
  config: { port: number };
  save: jest.MockedFunction<(data: string) => Promise<void>>;
}
```

### Mock Implementation Under the Hood

**How Jest tracks calls:**
```typescript
// Simplified version of Jest's mock tracking
class MockFunction<T extends (...args: any[]) => any> {
  calls: Array<Parameters<T>> = [];
  results: Array<ReturnType<T>> = [];
  mockImplementation: T | null = null;
  mockReturnValue: ReturnType<T> | undefined;

  constructor() {
    return new Proxy(this, {
      apply: (target, thisArg, args: Parameters<T>) => {
        // Track the call
        target.calls.push(args);

        // Use custom implementation if provided
        if (target.mockImplementation) {
          const result = target.mockImplementation(...args);
          target.results.push(result);
          return result;
        }

        // Use mock return value
        if (target.mockReturnValue !== undefined) {
          target.results.push(target.mockReturnValue);
          return target.mockReturnValue;
        }

        return undefined;
      }
    });
  }

  toHaveBeenCalledWith(...expectedArgs: Parameters<T>): boolean {
    return this.calls.some(call =>
      call.length === expectedArgs.length &&
      call.every((arg, i) => arg === expectedArgs[i])
    );
  }
}

// Usage example:
const mockFn = new MockFunction<(x: number) => string>();
mockFn.mockReturnValue = 'mocked';

console.log(mockFn(5)); // 'mocked'
console.log(mockFn.calls); // [[5]]
console.log(mockFn.toHaveBeenCalledWith(5)); // true
```

### Type Inference with Mock Implementations

**Preserving generic types:**
```typescript
interface Repository<T> {
  findAll(): Promise<T[]>;
  findById(id: number): Promise<T | null>;
  save(entity: T): Promise<T>;
}

// Generic mock factory
function createMockRepository<T>(): jest.Mocked<Repository<T>> {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    save: jest.fn()
  };
}

interface Product {
  id: number;
  name: string;
  price: number;
}

test('preserves generic types', async () => {
  const mockRepo = createMockRepository<Product>();

  // TypeScript infers correct types
  mockRepo.findAll.mockResolvedValue([
    { id: 1, name: 'Laptop', price: 999 }
  ]);

  mockRepo.findById.mockResolvedValue({
    id: 1,
    name: 'Laptop',
    price: 999
  });

  const products = await mockRepo.findAll();
  // TypeScript knows products is Product[]
  expect(products[0].price).toBe(999);

  const product = await mockRepo.findById(1);
  // TypeScript knows product is Product | null
  expect(product?.name).toBe('Laptop');
});
```

### Advanced Mock Matching

**Custom argument matchers:**
```typescript
// Type-safe custom matcher
function matchesShape<T>(expected: Partial<T>): any {
  return expect.objectContaining(expected);
}

interface CreateUserDto {
  name: string;
  email: string;
  age?: number;
}

const mockCreateUser = jest.fn<Promise<User>, [CreateUserDto]>();

test('matches partial arguments', async () => {
  mockCreateUser.mockResolvedValue({
    id: 1,
    name: 'John',
    email: 'john@example.com',
    age: 25
  });

  await mockCreateUser({
    name: 'John',
    email: 'john@example.com',
    age: 25
  });

  // Verify with partial matching
  expect(mockCreateUser).toHaveBeenCalledWith(
    matchesShape<CreateUserDto>({ name: 'John', email: expect.any(String) })
  );
});
```

### Mock Reset Strategies

**Understanding mock lifecycle:**
```typescript
describe('Mock reset strategies', () => {
  const mockFn = jest.fn();

  beforeEach(() => {
    // Choose one reset strategy:

    // 1. mockClear() - Clears call history, keeps implementation
    mockFn.mockClear();

    // 2. mockReset() - Clears history AND implementation
    // mockFn.mockReset();

    // 3. mockRestore() - Only for spies, restores original
    // mockFn.mockRestore();
  });

  test('first test', () => {
    mockFn.mockReturnValue('test1');
    mockFn();
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('second test - isolated', () => {
    // If using mockClear: implementation persists
    // If using mockReset: implementation is cleared
    expect(mockFn).toHaveBeenCalledTimes(0);
  });
});

// Global reset configuration
// jest.config.js
module.exports = {
  clearMocks: true, // Auto-clear before each test
  resetMocks: false, // Don't reset implementations
  restoreMocks: false // Don't restore spies
};
```

### Type-Safe Mock Builders

**Fluent builder pattern:**
```typescript
class MockBuilder<T> {
  private mockObj: Partial<jest.Mocked<T>> = {};

  method<K extends keyof T>(
    name: K,
    implementation: T[K]
  ): this {
    if (typeof implementation === 'function') {
      this.mockObj[name] = jest.fn(implementation as any) as any;
    }
    return this;
  }

  methodReturns<K extends keyof T>(
    name: K,
    returnValue: T[K] extends (...args: any[]) => infer R ? R : never
  ): this {
    this.mockObj[name] = jest.fn().mockReturnValue(returnValue) as any;
    return this;
  }

  build(): jest.Mocked<T> {
    return this.mockObj as jest.Mocked<T>;
  }
}

// Usage
interface MathService {
  add(a: number, b: number): number;
  multiply(a: number, b: number): number;
}

const mockMathService = new MockBuilder<MathService>()
  .method('add', (a, b) => a + b)
  .methodReturns('multiply', 100)
  .build();

test('uses builder pattern', () => {
  expect(mockMathService.add(2, 3)).toBe(5);
  expect(mockMathService.multiply(10, 10)).toBe(100);
});
```

</details>

---

<details>
<summary><strong>🐛 Real-World Scenario: Mock Type Safety Prevented Production Data Loss</strong></summary>

### The Problem

**Context:** SaaS analytics platform with 5,000 enterprise customers experienced critical data loss due to incorrectly mocked database layer in tests.

**Initial Metrics (Before Type-Safe Mocks):**
- **Data loss incidents**: 3 incidents in 2 months
- **Affected customers**: 127 customers
- **Data recovery time**: 4-6 hours per incident
- **Revenue impact**: $450,000 in refunds and credits
- **Test coverage**: 87% (but with unsafe mocks)
- **Bug detection**: Post-deployment (discovered by customers)

**The Bug:**
```typescript
// src/database/repository.ts
interface DataRepository {
  save<T>(collection: string, data: T[]): Promise<void>;
  delete(collection: string, ids: number[]): Promise<number>;
  update<T>(collection: string, id: number, data: Partial<T>): Promise<T>;
}

class MongoRepository implements DataRepository {
  async save<T>(collection: string, data: T[]): Promise<void> {
    await this.db.collection(collection).insertMany(data);
  }

  async delete(collection: string, ids: number[]): Promise<number> {
    const result = await this.db.collection(collection).deleteMany({
      _id: { $in: ids }
    });
    return result.deletedCount;
  }

  async update<T>(collection: string, id: number, data: Partial<T>): Promise<T> {
    const result = await this.db.collection(collection).findOneAndUpdate(
      { _id: id },
      { $set: data },
      { returnDocument: 'after' }
    );
    return result.value;
  }
}

// src/services/analyticsService.ts
class AnalyticsService {
  constructor(private repo: DataRepository) {}

  async deleteOldData(cutoffDate: Date): Promise<number> {
    const oldRecords = await this.getOldRecords(cutoffDate);
    const ids = oldRecords.map(r => r.id);
    return this.repo.delete('analytics', ids);
  }
}

// ❌ BROKEN TEST (Type-unsafe mock)
describe('AnalyticsService', () => {
  it('deletes old data', async () => {
    const mockRepo = {
      delete: jest.fn().mockResolvedValue(10) // Returns number ✅
    };

    const service = new AnalyticsService(mockRepo as any); // ⚠️ Type bypass!
    const deleted = await service.deleteOldData(new Date('2023-01-01'));

    expect(deleted).toBe(10);
    // Test passes, but mock is incomplete!
  });
});
```

**Production Error:**
```typescript
// Runtime error in production:
// TypeError: this.repo.save is not a function
// Stack: AnalyticsService.archiveData -> repo.save
// Impact: 127 customers lost archived analytics data
```

### Root Cause Analysis

**Investigation steps:**
```typescript
// 1. Review test mocks
// Found: Using 'as any' to bypass TypeScript
const mockRepo = {
  delete: jest.fn()
} as any; // ⚠️ Dangerous!

// Real repository has 3 methods:
// - save<T>()
// - delete()
// - update<T>()
// Mock only has delete()

// 2. Check production logs
{
  "error": "TypeError: this.repo.save is not a function",
  "service": "AnalyticsService",
  "method": "archiveData",
  "timestamp": "2024-01-15T03:22:18Z",
  "customersAffected": 127
}

// 3. Trace code path
// archiveData() calls repo.save() which doesn't exist in mock
// Tests never caught this because they only tested delete()
```

**Why it happened:**
1. Tests used incomplete mocks with `as any` type assertion
2. No compile-time validation of mock completeness
3. Tests only covered one code path (delete), not all (save, update)
4. CI/CD didn't enforce strict TypeScript in tests

### Solution Implementation

**Step 1: Create type-safe mock factory**
```typescript
// src/test-utils/mockFactory.ts
type MockedMethods<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? jest.MockedFunction<T[K]>
    : T[K];
};

export function createFullMock<T>(): MockedMethods<T> {
  // Force implementation of all methods
  return new Proxy({} as MockedMethods<T>, {
    get(target, prop) {
      if (!(prop in target)) {
        throw new Error(
          `Mock incomplete: method '${String(prop)}' not implemented. ` +
          `All interface methods must be mocked.`
        );
      }
      return target[prop as keyof T];
    }
  });
}

export function createMock<T>(
  implementation: MockedMethods<T>
): MockedMethods<T> {
  // Validate all methods exist
  const required = Object.getOwnPropertyNames(Object.getPrototypeOf(implementation));

  return implementation;
}

// Usage:
const mockRepo = createMock<DataRepository>({
  save: jest.fn(),
  delete: jest.fn(),
  update: jest.fn()
});
// ✅ TypeScript enforces all methods are present
```

**Step 2: Rewrite tests with strict types**
```typescript
// src/services/analyticsService.test.ts - AFTER
import { AnalyticsService } from './analyticsService';
import { DataRepository } from '../database/repository';
import { createMock } from '@/test-utils/mockFactory';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockRepo: jest.Mocked<DataRepository>;

  beforeEach(() => {
    // ✅ Type-safe mock with ALL required methods
    mockRepo = {
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(10),
      update: jest.fn().mockResolvedValue({} as any)
    };

    service = new AnalyticsService(mockRepo);
  });

  it('deletes old data', async () => {
    const deleted = await service.deleteOldData(new Date('2023-01-01'));

    expect(mockRepo.delete).toHaveBeenCalledWith(
      'analytics',
      expect.any(Array)
    );
    expect(deleted).toBe(10);
  });

  it('archives data before deletion', async () => {
    // ✅ Now tests the save() path too
    await service.archiveData(new Date('2023-01-01'));

    expect(mockRepo.save).toHaveBeenCalledWith(
      'archive',
      expect.arrayContaining([
        expect.objectContaining({ archivedAt: expect.any(Date) })
      ])
    );
  });

  it('updates metadata after deletion', async () => {
    // ✅ Tests update() path
    await service.deleteOldData(new Date('2023-01-01'));

    expect(mockRepo.update).toHaveBeenCalledWith(
      'metadata',
      expect.any(Number),
      { lastCleanup: expect.any(Date) }
    );
  });
});
```

**Step 3: Add compile-time enforcement**
```typescript
// tsconfig.test.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,

    // ✅ Ban dangerous type assertions
    "noUncheckedIndexedAccess": true
  }
}

// Add ESLint rule
// .eslintrc.js
module.exports = {
  rules: {
    '@typescript-eslint/no-explicit-any': 'error', // Ban 'as any'
    '@typescript-eslint/consistent-type-assertions': [
      'error',
      {
        assertionStyle: 'as',
        objectLiteralTypeAssertions: 'never' // Ban { ... } as Type
      }
    ]
  }
};
```

**Step 4: Add runtime mock validation**
```typescript
// src/test-utils/validateMock.ts
export function validateMock<T>(
  mock: Partial<T>,
  requiredMethods: Array<keyof T>
): void {
  const missing = requiredMethods.filter(method => !(method in mock));

  if (missing.length > 0) {
    throw new Error(
      `Mock validation failed. Missing methods: ${missing.join(', ')}`
    );
  }
}

// Usage in tests:
beforeEach(() => {
  mockRepo = {
    save: jest.fn(),
    delete: jest.fn(),
    update: jest.fn()
  };

  // ✅ Runtime validation
  validateMock<DataRepository>(mockRepo, ['save', 'delete', 'update']);

  service = new AnalyticsService(mockRepo);
});
```

**Step 5: Add CI/CD type checking**
```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      # ✅ Type-check before running tests
      - name: Type Check
        run: npm run type-check

      # ✅ Lint for unsafe type assertions
      - name: Lint
        run: npm run lint

      # ✅ Run tests with type checking enabled
      - name: Test
        run: npm test
        env:
          TS_JEST_DIAGNOSTICS: true
```

### Results After Implementation

**Metrics (After 3 months):**
- **Data loss incidents**: 3 incidents → 0 incidents (100% elimination)
- **Test suite compilation errors caught**: 47 incomplete mocks identified
- **Code coverage**: 87% → 94% (better path coverage)
- **CI/CD build time**: +8% (from 3m to 3m 15s) - acceptable trade-off
- **Developer confidence**: High (surveys showed 95% satisfaction)
- **Revenue saved**: $450k+ in potential refunds prevented

**Specific improvements:**
```typescript
// Before: 23 test files used 'as any'
// After: 0 test files use unsafe type assertions

// Before: Average 2.3 methods mocked per service
// After: Average 5.1 methods mocked per service (complete interfaces)

// Before: 34% of tests covered single code path
// After: 89% of tests covered multiple code paths
```

**Performance impact:**
```bash
# Test execution times:
# - Before (with 'as any'): 2.1s for 150 tests
# - After (type-safe mocks): 2.3s for 210 tests (+60 more tests, +9% time)

# Build times:
# - Type checking: +12s
# - ESLint validation: +3s
# - Total CI/CD: +15s (3m → 3m 15s)
# ROI: Prevented $450k in losses
```

### Key Takeaways

1. **Never use 'as any' in tests**: It defeats TypeScript's purpose
2. **Mock ALL interface methods**: Incomplete mocks cause production bugs
3. **Validate mocks at compile-time AND runtime**: Double safety net
4. **Enforce with ESLint and CI/CD**: Prevent unsafe code from merging
5. **Trade-off analysis**: +8% build time is worth preventing data loss

</details>

---

<details>
<summary><strong>⚖️ Trade-offs: Mocking Strategies in TypeScript</strong></summary>

### 1. Manual Mocks vs Auto-Mocks

**Manual mocks:**
```typescript
// __mocks__/userService.ts
export class UserService {
  async getUser(id: number) {
    return { id, name: 'Mocked User' };
  }
}

// Pros:
// - Full control over implementation
// - Can test edge cases easily
// - Reusable across tests

// Cons:
// - Must maintain alongside real code
// - Can get out of sync with interface changes
// - Extra boilerplate
```

**Auto-mocks:**
```typescript
import { UserService } from './userService';
jest.mock('./userService');

const mockUserService = new UserService() as jest.Mocked<UserService>;

// Pros:
// - No manual mock file needed
// - Auto-updates with interface changes
// - Less code to maintain

// Cons:
// - Less control over behavior
// - Can be confusing (real class name, mocked behavior)
// - Harder to debug
```

**Recommendation:**
```typescript
// Use manual mocks for:
// - External dependencies (axios, fs, database clients)
// - Complex services with state
// - Shared mocks across many tests

// Use auto-mocks for:
// - Simple utility classes
// - Internal services without side effects
// - One-off test scenarios
```

### 2. jest.Mocked<T> vs Partial Mocks

| Aspect | jest.Mocked<T> | Partial<jest.Mocked<T>> | Winner |
|--------|----------------|-------------------------|--------|
| **Type safety** | ✅ All methods required | ⚠️ Some methods optional | Mocked |
| **Flexibility** | Less flexible | More flexible | Partial |
| **Compile errors** | Catches missing methods | Allows incomplete mocks | Mocked |
| **Boilerplate** | More setup code | Less setup code | Partial |
| **Production safety** | Safer | Riskier | Mocked |

**When to use each:**
```typescript
// ✅ Use jest.Mocked<T> for critical services
const mockPaymentGateway: jest.Mocked<PaymentGateway> = {
  processPayment: jest.fn(),
  refund: jest.fn(),
  getStatus: jest.fn(),
  validateCard: jest.fn()
}; // TypeScript enforces ALL methods

// ✅ Use Partial for utilities with many methods
const mockLogger: Partial<jest.Mocked<Logger>> = {
  log: jest.fn()
  // Don't need error, warn, debug for this test
};
```

### 3. Spies vs Full Mocks

**Spies (partial replacement):**
```typescript
class EmailService {
  async sendEmail(to: string, body: string) {
    // Real implementation
    return sendToSMTP(to, body);
  }
}

test('spies on email service', async () => {
  const service = new EmailService();
  const spy = jest.spyOn(service, 'sendEmail')
    .mockResolvedValue(true);

  await service.sendEmail('test@example.com', 'Hello');

  expect(spy).toHaveBeenCalled();
  spy.mockRestore(); // Restore original
});

// Pros:
// - Keep most real implementation
// - Override only what's needed
// - Can restore original easily

// Cons:
// - Can accidentally call real code
// - Harder to isolate unit under test
// - Must remember to restore
```

**Full mocks (complete replacement):**
```typescript
const mockEmailService: jest.Mocked<EmailService> = {
  sendEmail: jest.fn().mockResolvedValue(true)
};

// Pros:
// - Complete isolation
// - No accidental side effects
// - Predictable behavior

// Cons:
// - More boilerplate
// - Loses integration validation
// - Can diverge from real implementation
```

**Decision matrix:**
```typescript
// Use spies when:
- Testing integration between components
- Real implementation is simple and fast
- You want to verify real code paths

// Use full mocks when:
- Unit testing in isolation
- Real implementation has side effects (network, DB)
- Performance matters (slow operations)
```

### 4. Type Inference vs Explicit Types

**Type inference:**
```typescript
const mockFn = jest.fn(() => 'hello');
// Type inferred as: jest.Mock<string, []>

mockFn.mockReturnValue('world'); // ✅ Works
mockFn.mockReturnValue(123); // ❌ TypeScript error

// Pros:
// - Less verbose
// - Types inferred from implementation
// - Fewer annotations needed

// Cons:
// - Can infer 'any' if not careful
// - Less explicit for readers
// - Harder to refactor
```

**Explicit types:**
```typescript
const mockFn: jest.MockedFunction<(name: string) => string> =
  jest.fn((name) => `Hello ${name}`);

mockFn('John'); // ✅ Correct usage
mockFn(123); // ❌ TypeScript error: number not assignable to string

// Pros:
// - Clear contract
// - Better refactoring support
// - Self-documenting

// Cons:
// - More verbose
// - Duplicate type information
// - Maintenance overhead
```

**Recommendation:**
```typescript
// Use inference for simple cases:
const add = jest.fn((a: number, b: number) => a + b);

// Use explicit types for complex interfaces:
const mockUserService: jest.Mocked<UserService> = {
  getUser: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn()
};
```

### 5. Mock Data Builders vs Inline Mocks

**Mock data builders:**
```typescript
// src/test-utils/builders.ts
class UserBuilder {
  private user: Partial<User> = {};

  withId(id: number): this {
    this.user.id = id;
    return this;
  }

  withEmail(email: string): this {
    this.user.email = email;
    return this;
  }

  build(): User {
    return {
      id: this.user.id ?? 1,
      name: this.user.name ?? 'Test User',
      email: this.user.email ?? 'test@example.com'
    };
  }
}

test('uses builder pattern', () => {
  const user = new UserBuilder()
    .withId(999)
    .withEmail('custom@example.com')
    .build();

  expect(user.id).toBe(999);
});

// Pros:
// - Reusable across tests
// - Fluent, readable API
// - Default values included
// - Type-safe

// Cons:
// - Extra boilerplate
// - Another abstraction to learn
// - Can be overkill for simple tests
```

**Inline mocks:**
```typescript
test('creates user', () => {
  const user: User = {
    id: 1,
    name: 'John',
    email: 'john@example.com'
  };

  expect(user.id).toBe(1);
});

// Pros:
// - Simple and direct
// - No extra files needed
// - Easy to understand

// Cons:
// - Duplication across tests
// - Hard to maintain
// - Verbose for complex objects
```

**When to use each:**
```typescript
// Use builders for:
// - Complex domain objects (users, orders, products)
// - Tests requiring many variations
// - Shared test data across suites

// Use inline for:
// - Simple DTOs or configs
// - One-off test scenarios
// - Small test files
```

</details>

---

<details>
<summary><strong>💬 Explain to Junior: Mocking Like Using a Stunt Double</strong></summary>

### The Analogy

**Mocking in tests is like using a stunt double in movies.**

Imagine you're filming a movie scene where the hero jumps off a building. You don't make the real actor jump - you use a stunt double who knows exactly what to do and won't get hurt.

**In testing:**
- **Real code** = Real actor (can be slow, dangerous, or expensive)
- **Mock** = Stunt double (predictable, safe, fast)
- **Test** = Movie director (controls what happens)

**Without mocks:**
```typescript
// Like making the actor actually jump off a building
test('sends welcome email', async () => {
  const emailService = new RealEmailService(); // Connects to real SMTP
  await emailService.send('user@example.com', 'Welcome!'); // Sends actual email

  // Problems:
  // - Actually sends emails (spam!)
  // - Slow (network latency)
  // - Can fail if internet is down
  // - Costs money (email provider fees)
});
```

**With mocks:**
```typescript
// Like using a stunt double
test('sends welcome email', async () => {
  const mockEmailService = {
    send: jest.fn().mockResolvedValue(true) // Pretends to send
  };

  await mockEmailService.send('user@example.com', 'Welcome!');

  // Check that the "stunt double" did what we asked
  expect(mockEmailService.send).toHaveBeenCalledWith(
    'user@example.com',
    'Welcome!'
  );

  // Benefits:
  // - No actual emails sent
  // - Fast (milliseconds)
  // - Always works
  // - Free
});
```

### Simple Explanation

**What is mocking?**

Mocking means creating a fake version of something so you can test your code without using the real thing. Like practicing a play with a stand-in actor instead of waiting for the main star.

**Why mock in TypeScript?**

TypeScript mocks are special because they check that your "stunt double" can do everything the "real actor" can. If your mock is missing methods, TypeScript will warn you during compilation.

```typescript
interface Actor {
  jump(): void;
  run(): void;
  fight(): void;
}

// ❌ Bad mock (incomplete stunt double)
const badMock = {
  jump: jest.fn()
  // Missing run() and fight()!
};

// ✅ Good mock (complete stunt double)
const goodMock: jest.Mocked<Actor> = {
  jump: jest.fn(),
  run: jest.fn(),
  fight: jest.fn()
};
```

### Common Types of Mocks

**1. Mock Functions (single action):**
```typescript
// Like having a stunt double for one specific action
const mockJump = jest.fn();

mockJump(); // Perform the action
expect(mockJump).toHaveBeenCalled(); // Verify it happened
```

**2. Mock Objects (collection of actions):**
```typescript
// Like having a full stunt coordinator team
const mockStuntTeam = {
  jump: jest.fn(),
  run: jest.fn(),
  fight: jest.fn()
};
```

**3. Spies (watch the real thing):**
```typescript
// Like filming the real actor but with safety cables
const actor = new RealActor();
const spy = jest.spyOn(actor, 'jump');

actor.jump(); // Real action happens
expect(spy).toHaveBeenCalled(); // But we're watching
```

### Common Interview Questions & Answers

**Q: What is the difference between a mock and a spy?**

**Answer:**
"A mock is a complete fake replacement, while a spy watches and tracks calls to the real implementation.

Think of it this way:
- **Mock**: Like a stunt double doing the dangerous scene. The real actor doesn't participate at all.
- **Spy**: Like a camera watching the real actor perform. The real action happens, but we're recording it.

Example:
```typescript
// Mock - complete replacement
const mockService = {
  save: jest.fn().mockResolvedValue(true)
};
// Real save() is never called

// Spy - wraps real implementation
const service = new RealService();
const spy = jest.spyOn(service, 'save');
await service.save(data); // Real save() is called, but tracked
expect(spy).toHaveBeenCalledWith(data);
```

Use mocks for unit tests (complete isolation), use spies for integration tests (verify real interactions)."

**Q: How do you create type-safe mocks in TypeScript?**

**Answer:**
"I use `jest.Mocked<T>` to create mocks that match the interface exactly, ensuring TypeScript catches missing methods.

Steps:
1. Define the interface
2. Create a mock with `jest.Mocked<InterfaceName>`
3. Implement all required methods as `jest.fn()`

Example:
```typescript
interface UserService {
  getUser(id: number): Promise<User>;
  saveUser(user: User): Promise<void>;
}

const mockUserService: jest.Mocked<UserService> = {
  getUser: jest.fn().mockResolvedValue({ id: 1, name: 'John' }),
  saveUser: jest.fn().mockResolvedValue(undefined)
};

// TypeScript ensures both methods exist
// If I forget saveUser, TypeScript will error immediately
```

This prevents runtime errors where tests pass but production breaks because the mock didn't match the real interface."

**Q: When should you mock dependencies?**

**Answer:**
"I mock dependencies when they involve external systems, slow operations, or unpredictable behavior.

**Mock when:**
- External APIs (HTTP requests, database calls)
- File system operations
- Date/time (for predictable tests)
- Random number generators
- Email/SMS sending
- Payment processing

**Don't mock when:**
- Pure functions (utilities, calculations)
- Simple value transformations
- Your own business logic (that's what you're testing!)

Example of when to mock:
```typescript
// ✅ Mock: External API call
const mockAPI = jest.fn().mockResolvedValue({ data: 'test' });

// ✅ Mock: Database
const mockDB = { query: jest.fn().mockResolvedValue([]) };

// ❌ Don't mock: Simple calculation
function add(a, b) { return a + b; }
// Just test it directly, no need to mock
```

The rule: Mock the boundaries (I/O, external systems), test your logic directly."

**Q: How do you verify mock function calls?**

**Answer:**
"Jest provides several matchers to verify how mocks were called:

```typescript
const mockFn = jest.fn();

mockFn('hello', 123);
mockFn('world', 456);

// Check if called at all
expect(mockFn).toHaveBeenCalled();

// Check number of calls
expect(mockFn).toHaveBeenCalledTimes(2);

// Check specific arguments
expect(mockFn).toHaveBeenCalledWith('hello', 123);

// Check last call
expect(mockFn).toHaveBeenLastCalledWith('world', 456);

// Check nth call
expect(mockFn).toHaveBeenNthCalledWith(1, 'hello', 123);

// Flexible matching
expect(mockFn).toHaveBeenCalledWith(
  expect.any(String),
  expect.any(Number)
);
```

In interviews, I explain that verifying mocks ensures your code calls dependencies correctly - like checking that the director gave the right instructions to the stunt team."

**Q: What is mockReturnValue vs mockResolvedValue?**

**Answer:**
"They both set return values for mocks, but for different types of functions:

- **mockReturnValue**: For synchronous functions (return immediately)
- **mockResolvedValue**: For async functions (return a Promise)

Example:
```typescript
// Synchronous function
const mockGetName = jest.fn();
mockGetName.mockReturnValue('John');
expect(mockGetName()).toBe('John'); // Immediate return

// Async function
const mockFetchUser = jest.fn();
mockFetchUser.mockResolvedValue({ id: 1, name: 'John' });
const user = await mockFetchUser(); // Returns Promise
expect(user.name).toBe('John');

// There's also mockRejectedValue for errors:
mockFetchUser.mockRejectedValue(new Error('Not found'));
await expect(mockFetchUser()).rejects.toThrow('Not found');
```

Rule of thumb: If the real function is async (uses Promise), use mockResolvedValue. Otherwise, use mockReturnValue."

### Key Points to Remember

1. **Mocks are fake replacements**: Like stunt doubles for real code
2. **Type safety prevents bugs**: `jest.Mocked<T>` ensures mocks match interfaces
3. **Mock external dependencies**: APIs, databases, file systems
4. **Don't mock your own logic**: Test the actual business logic
5. **Verify calls with matchers**: `toHaveBeenCalledWith`, `toHaveBeenCalledTimes`
6. **Use mockResolvedValue for async**: mockReturnValue for sync

### Interview Preparation Checklist

- [ ] Can explain difference between mock, stub, and spy
- [ ] Know how to create type-safe mocks with `jest.Mocked<T>`
- [ ] Understand when to mock vs when to use real implementations
- [ ] Can configure mock return values and implementations
- [ ] Know all verification matchers (toHaveBeenCalled, etc.)
- [ ] Understand mockClear vs mockReset vs mockRestore
- [ ] Can mock modules with `jest.mock()`
- [ ] Know how to spy on methods with `jest.spyOn()`
- [ ] Can create mock factories and builders
- [ ] Understand trade-offs between mocking strategies

</details>

---

