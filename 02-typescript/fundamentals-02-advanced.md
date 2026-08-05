# TypeScript Fundamentals - Advanced

> Advanced fundamentals: literal types, enums, type assertions, typeof, keyof, and more

---

## Questions 4-15: TypeScript Fundamentals Deep Dive

**Difficulty:** 🟡 Medium to 🔴 Hard
**Frequency:** ⭐⭐⭐⭐
**Consolidated comprehensive coverage**

### Q4: Type Inference & Type Annotations

```typescript
// Type inference (TypeScript infers the type)
let name = "John"; // inferred as string
let age = 30; // inferred as number
let isActive = true; // inferred as boolean

// Explicit type annotation
let username: string = "Jane";
let count: number = 42;
let items: string[] = ["a", "b", "c"];

// Function return type inference
function add(a: number, b: number) {
  return a + b; // Return type inferred as number
}

// Better: Explicit return type
function multiply(a: number, b: number): number {
  return a * b;
}
```

### Q5: Literal Types & Template Literal Types

```typescript
// String literal types
type Direction = "north" | "south" | "east" | "west";
let dir: Direction = "north"; // OK
// let invalid: Direction = "up"; // Error

// Numeric literal types
type DiceRoll = 1 | 2 | 3 | 4 | 5 | 6;

// Template literal types
type Greeting = `Hello ${string}`;
let greeting: Greeting = "Hello World"; // OK

type EmailLocale = `${string}@${string}.${string}`;
```

### Q6: Enums (Numeric & String)

```typescript
// Numeric enum
enum Status {
  Pending = 0,
  InProgress = 1,
  Completed = 2
}

let taskStatus: Status = Status.InProgress;

// String enum (preferred)
enum LogLevel {
  Error = "ERROR",
  Warning = "WARNING",
  Info = "INFO"
}

// Const enum (inlined at compile time)
const enum Direction {
  Up,
  Down,
  Left,
  Right
}
```

### Q7: Type Assertions & Type Casting

```typescript
// Type assertion (angle bracket)
let someValue: any = "hello";
let strLength: number = (<string>someValue).length;

// Type assertion (as syntax - preferred)
let value: any = "world";
let len: number = (value as string).length;

// Non-null assertion
function processUser(user?: { name: string }) {
  console.log(user!.name); // Tell TS user is not null
}

// Const assertions
let obj = { name: "John" } as const;
// obj.name = "Jane"; // Error: readonly
```

### Q8: typeof & keyof Operators

```typescript
// typeof
const person = { name: "Alice", age: 30 };
type Person = typeof person; // { name: string; age: number }

// keyof
type PersonKeys = keyof Person; // "name" | "age"

function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const name = getProperty(person, "name"); // Type: string
```

### Q9: Indexed Access Types

```typescript
type Person = {
  name: string;
  age: number;
  address: {
    city: string;
    country: string;
  };
};

type PersonName = Person["name"]; // string
type PersonAddress = Person["address"]; // { city: string; country: string }
type City = Person["address"]["city"]; // string

// Array indexed access
type StringArray = string[];
type ArrayElement = StringArray[number]; // string
```

### Q10: Optional & Readonly Properties

```typescript
interface User {
  readonly id: number;
  name: string;
  email?: string; // Optional
  age?: number;
}

const user: User = { id: 1, name: "John" };
// user.id = 2; // Error: readonly
user.name = "Jane"; // OK

// Readonly utility type
type ReadonlyUser = Readonly<User>;
```

### Q11: Function Overloads

```typescript
// Function overload signatures
function format(value: string): string;
function format(value: number): string;
function format(value: boolean): string;

// Implementation signature
function format(value: string | number | boolean): string {
  return String(value);
}

const str = format("hello"); // Type: string
const num = format(42); // Type: string
```

### Q12: Type Guards & Narrowing

```typescript
// typeof type guard
function print(value: string | number) {
  if (typeof value === "string") {
    console.log(value.toUpperCase()); // value is string
  } else {
    console.log(value.toFixed(2)); // value is number
  }
}

// instanceof type guard
class Dog {
  bark() {}
}
class Cat {
  meow() {}
}

function makeSound(animal: Dog | Cat) {
  if (animal instanceof Dog) {
    animal.bark();
  } else {
    animal.meow();
  }
}

// User-defined type guard
function isString(value: any): value is string {
  return typeof value === "string";
}
```

### Q13: Never & Unknown Types

```typescript
// never (represents values that never occur)
function throwError(message: string): never {
  throw new Error(message);
}

function infiniteLoop(): never {
  while (true) {}
}

// unknown (type-safe any)
let value: unknown = "hello";
// let str: string = value; // Error
if (typeof value === "string") {
  let str: string = value; // OK after type guard
}
```

### Q14: Tuple Types

```typescript
// Tuple with fixed length and types
type Point = [number, number];
const point: Point = [10, 20];

// Named tuple elements
type User = [id: number, name: string, active: boolean];
const user: User = [1, "Alice", true];

// Rest elements in tuples
type StringNumberBooleans = [string, number, ...boolean[]];
const tuple: StringNumberBooleans = ["hello", 42, true, false, true];

// Optional elements
type OptionalTuple = [string, number?];
const t1: OptionalTuple = ["hello"];
const t2: OptionalTuple = ["hello", 42];
```

### Q15: Type Compatibility & Structural Typing

```typescript
// Structural typing (duck typing)
interface Point {
  x: number;
  y: number;
}

interface Named {
  name: string;
}

const point = { x: 10, y: 20, name: "Origin" };

// OK: point has x and y
const p: Point = point;

// OK: point has name
const n: Named = point;

// Function compatibility
type Handler = (s: string) => void;

let handler: Handler = (input: string | number) => {
  // OK: parameter is more general
};
```

### Resources
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [Type Challenges](https://github.com/type-challenges/type-challenges)

---

[← Back to TypeScript README](./README.md) | [Next: Advanced Types →](./types-01a-utility.md)

**Progress:** 15 of 15 fundamental questions completed ✅
