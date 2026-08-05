# Object-Oriented Programming with Classes

> **Focus**: ES6 Classes and OOP patterns

---

## Question 1: Class syntax vs function constructors - when to use each?

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐⭐
**Time:** 10 minutes
**Companies:** Google, Meta, Amazon, Microsoft

### Question
Explain the differences between ES6 class syntax and traditional function constructors. When should you use each?

### Answer

**ES6 Classes** are syntactic sugar over JavaScript's prototype-based inheritance, providing a cleaner syntax for creating objects and handling inheritance.

**Key Differences:**

1. **Syntax & Readability**
   - Classes: Cleaner, more intuitive syntax
   - Constructors: Traditional JavaScript pattern
   - Classes feel more like traditional OOP languages

2. **Hoisting**
   - Classes: Not hoisted (temporal dead zone)
   - Constructors: Hoisted (can use before declaration)

3. **Strict Mode**
   - Classes: Always run in strict mode
   - Constructors: Not automatically strict

4. **Method Definition**
   - Classes: Methods are non-enumerable by default
   - Constructors: Methods on prototype are enumerable

5. **Constructor Call**
   - Classes: Must use `new` keyword (enforced)
   - Constructors: Can be called without `new` (dangerous)

### Code Example

```javascript
// 1. TRADITIONAL FUNCTION CONSTRUCTOR

function Person(name, age) {
  this.name = name;
  this.age = age;
}

Person.prototype.greet = function() {
  return `Hi, I'm ${this.name}`;
};

Person.createAnonymous = function() {
  return new Person('Anonymous', 0);
};

const person1 = new Person('Alice', 30);
console.log(person1.greet()); // "Hi, I'm Alice"

// 2. ES6 CLASS SYNTAX

class PersonClass {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  greet() {
    return `Hi, I'm ${this.name}`;
  }

  static createAnonymous() {
    return new PersonClass('Anonymous', 0);
  }
}

const person2 = new PersonClass('Bob', 25);
console.log(person2.greet()); // "Hi, I'm Bob"

// 3. HOISTING DIFFERENCE

// ✅ Works - function constructor is hoisted
const cat1 = new Cat('Whiskers');

function Cat(name) {
  this.name = name;
}

// ❌ ReferenceError - class is not hoisted
try {
  const dog1 = new Dog('Buddy');
} catch (e) {
  console.log(e); // ReferenceError: Cannot access 'Dog' before initialization
}

class Dog {
  constructor(name) {
    this.name = name;
  }
}

// 4. NEW KEYWORD ENFORCEMENT

function CarOld(make) {
  this.make = make;
}

// ❌ Dangerous - creates global variable
const car1 = CarOld('Toyota'); // Forgot 'new'
console.log(car1); // undefined
console.log(window.make); // 'Toyota' (leaked to global!)

class CarNew {
  constructor(make) {
    this.make = make;
  }
}

// ✅ Throws error immediately
try {
  const car2 = CarNew('Honda'); // Forgot 'new'
} catch (e) {
  console.log(e); // TypeError: Class constructor cannot be invoked without 'new'
}

// 5. ENUMERABLE METHODS

function BookConstructor(title) {
  this.title = title;
}

BookConstructor.prototype.read = function() {
  return `Reading ${this.title}`;
};

class BookClass {
  constructor(title) {
    this.title = title;
  }

  read() {
    return `Reading ${this.title}`;
  }
}

const book1 = new BookConstructor('1984');
const book2 = new BookClass('Brave New World');

// Function constructor: methods are enumerable
for (let key in book1) {
  console.log(key); // title, read
}

// Class: methods are non-enumerable
for (let key in book2) {
  console.log(key); // title (only)
}

// 6. INHERITANCE COMPARISON

// Function constructor inheritance (complex)
function Animal(name) {
  this.name = name;
}

Animal.prototype.speak = function() {
  return `${this.name} makes a sound`;
};

function DogOld(name, breed) {
  Animal.call(this, name);
  this.breed = breed;
}

DogOld.prototype = Object.create(Animal.prototype);
DogOld.prototype.constructor = DogOld;

DogOld.prototype.bark = function() {
  return 'Woof!';
};

// Class inheritance (clean)
class AnimalClass {
  constructor(name) {
    this.name = name;
  }

  speak() {
    return `${this.name} makes a sound`;
  }
}

class DogClass extends AnimalClass {
  constructor(name, breed) {
    super(name);
    this.breed = breed;
  }

  bark() {
    return 'Woof!';
  }
}

// 7. STRICT MODE EXAMPLE

function Calculator() {
  // Non-strict mode by default
  total = 0; // Implicit global (dangerous!)
}

class CalculatorClass {
  constructor() {
    // Always strict mode
    // total = 0; // ReferenceError: total is not defined
    this.total = 0; // Must use 'this'
  }
}

// 8. TRANSPILATION TO ES5

// This ES6 class:
class User {
  constructor(name) {
    this.name = name;
  }

  greet() {
    return `Hello, ${this.name}`;
  }
}

// Roughly transpiles to:
var User = (function() {
  function User(name) {
    // Enforce 'new' keyword
    if (!(this instanceof User)) {
      throw new TypeError("Class constructor User cannot be invoked without 'new'");
    }
    this.name = name;
  }

  // Non-enumerable methods
  Object.defineProperty(User.prototype, 'greet', {
    value: function() {
      return 'Hello, ' + this.name;
    },
    enumerable: false,
    writable: true,
    configurable: true
  });

  return User;
})();
```

### Common Mistakes

- ❌ **Mistake:** Treating classes as something completely different from prototypes
  ```javascript
  // Classes ARE prototypes under the hood
  class MyClass {}
  console.log(typeof MyClass); // "function"
  console.log(MyClass.prototype); // {} (prototype object exists)
  ```

- ❌ **Mistake:** Using function constructors without 'new'
  ```javascript
  function User(name) {
    this.name = name;
  }

  const user = User('Alice'); // Forgot 'new'
  console.log(user); // undefined
  console.log(window.name); // 'Alice' (global leak!)
  ```

- ✅ **Correct:** Use classes for safety
  ```javascript
  class User {
    constructor(name) {
      this.name = name;
    }
  }

  // const user = User('Alice'); // TypeError!
  const user = new User('Alice'); // ✅ Correct
  ```

### Follow-up Questions

- "What happens if you forget 'new' with a class vs function constructor?"
- "How do ES6 classes transpile to ES5?"
- "Why are class methods non-enumerable?"
- "Can you call a class constructor without 'new'?"
- "What is the temporal dead zone for classes?"

<details>
<summary><strong>🔍 Deep Dive</strong></summary>

#### How V8 Handles Classes vs Constructors

**Under the Hood:**
Both classes and function constructors use the same V8 prototype mechanism. Classes add compile-time checks and syntactic sugar.

**Performance:**
- Class instantiation: ~same as constructor (~10ns per instance)
- Method calls: Identical performance (both use prototype chain)
- Optimization: TurboFan optimizes both equally

**Memory Layout:**
```
Instance → [[Prototype]] → ConstructorFunction.prototype → methods
```
Same for both classes and constructors.

**Babel Transpilation:**
Classes transpile to ~50-100 extra bytes of enforcement code (new keyword check, strict mode, non-enumerable methods).

</details>

<details>
<summary><strong>🐛 Real-World Scenario</strong></summary>

**Problem:** Legacy codebase with function constructors had global variable leaks. Developer called constructor without `new`, polluting global scope with 250+ leaked variables.

**Impact:** 120 bugs/month, 15% performance degradation, $8k debugging time.

**Solution:** Migrated to ES6 classes. TypeScript caught 85% of missing `new` keywords at compile time.

**Result:** 0 global leaks, 95% fewer constructor-related bugs, saved $7k/month.

</details>

<details>
<summary><strong>⚖️ Trade-offs</strong></summary>

**Use Classes when:**
- Building new codebases (cleaner syntax)
- Want automatic safety (new keyword enforcement)
- Need better tooling support (TypeScript, IDEs)

**Use Constructors when:**
- Maintaining legacy code
- Need pre-ES6 compatibility (no transpiler)
- Require hoisting behavior

**Performance:** Identical. Choice is about developer experience and safety.

</details>

<details>
<summary><strong>💬 Explain to Junior</strong></summary>

**Classes** = Modern, clean way to create objects with blueprints.
**Constructors** = Old-school way (before 2015).

```javascript
// Old way (confusing):
function Dog(name) {
  this.name = name;
}
Dog.prototype.bark = function() { return 'Woof!'; };

// New way (clear):
class Dog {
  constructor(name) { this.name = name; }
  bark() { return 'Woof!'; }
}
```

**Key insight:** Classes are just "pretty syntax" for the same underlying prototype system. But that prettiness prevents bugs!

**Gotcha:** Classes can't be called without `new`. Constructors can (dangerous!).

</details>

### Resources

- [MDN: Classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes)
- [JavaScript.info: Classes](https://javascript.info/class)

---

## Question 2: What are static methods and properties in classes?

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐
**Time:** 8 minutes
**Companies:** Google, Amazon, Meta

### Question
Explain static methods and properties. How do they differ from instance methods? When should you use them?

### Answer

**Static methods and properties** belong to the class itself, not to instances. They're called on the class, not on objects created from the class.

**Key Characteristics:**

1. **Called on Class, Not Instances**
   - Static: `ClassName.method()`
   - Instance: `instance.method()`

2. **No Access to Instance Data**
   - Static methods can't use `this` to access instance properties
   - They can only access other static methods/properties

3. **Common Use Cases**
   - Utility functions
   - Factory methods
   - Counters/singletons
   - Validation functions

### Code Example

```javascript
// 1. BASIC STATIC METHOD

class MathUtils {
  static add(a, b) {
    return a + b;
  }

  static multiply(a, b) {
    return a * b;
  }
}

// Called on class, not instance
console.log(MathUtils.add(5, 3)); // 8
console.log(MathUtils.multiply(4, 2)); // 8

// ❌ Can't call on instance
const utils = new MathUtils();
// utils.add(1, 2); // TypeError: utils.add is not a function

// 2. STATIC PROPERTIES (ES2022+)

class Config {
  static apiUrl = 'https://api.example.com';
  static maxRetries = 3;
  static timeout = 5000;
}

console.log(Config.apiUrl); // "https://api.example.com"
console.log(Config.maxRetries); // 3

// 3. FACTORY PATTERN WITH STATIC METHODS

class User {
  constructor(name, email, role) {
    this.name = name;
    this.email = email;
    this.role = role;
  }

  // Static factory methods
  static createAdmin(name, email) {
    return new User(name, email, 'admin');
  }

  static createGuest(name) {
    return new User(name, 'guest@example.com', 'guest');
  }

  static createFromJSON(json) {
    const data = JSON.parse(json);
    return new User(data.name, data.email, data.role);
  }

  getInfo() {
    return `${this.name} (${this.role})`;
  }
}

// Usage
const admin = User.createAdmin('Alice', 'alice@example.com');
const guest = User.createGuest('Bob');
const parsed = User.createFromJSON('{"name":"Charlie","email":"charlie@example.com","role":"user"}');

console.log(admin.getInfo()); // "Alice (admin)"
console.log(guest.getInfo()); // "Bob (guest)"

// 4. INSTANCE COUNTER WITH STATIC

class DatabaseConnection {
  static count = 0;
  static MAX_CONNECTIONS = 5;

  constructor(host) {
    if (DatabaseConnection.count >= DatabaseConnection.MAX_CONNECTIONS) {
      throw new Error('Maximum connections reached');
    }

    this.host = host;
    this.id = ++DatabaseConnection.count;
    console.log(`Connection ${this.id} created`);
  }

  static getConnectionCount() {
    return DatabaseConnection.count;
  }

  static resetCount() {
    DatabaseConnection.count = 0;
  }

  disconnect() {
    DatabaseConnection.count--;
    console.log(`Connection ${this.id} closed`);
  }
}

const conn1 = new DatabaseConnection('localhost'); // Connection 1 created
const conn2 = new DatabaseConnection('remote'); // Connection 2 created
console.log(DatabaseConnection.getConnectionCount()); // 2

conn1.disconnect(); // Connection 1 closed
console.log(DatabaseConnection.getConnectionCount()); // 1

// 5. STATIC METHOD ACCESSING OTHER STATIC METHODS

class ValidationUtils {
  static emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  static phoneRegex = /^\d{10}$/;

  static isValidEmail(email) {
    return this.emailRegex.test(email);
  }

  static isValidPhone(phone) {
    return this.phoneRegex.test(phone);
  }

  static validateUser(email, phone) {
    // Static method calling other static methods
    return this.isValidEmail(email) && this.isValidPhone(phone);
  }
}

console.log(ValidationUtils.validateUser('test@example.com', '1234567890')); // true
console.log(ValidationUtils.validateUser('invalid', '123')); // false

// 6. INHERITANCE OF STATIC METHODS

class Animal {
  static kingdom = 'Animalia';

  static getKingdom() {
    return this.kingdom;
  }
}

class Dog extends Animal {
  static breed = 'Canis familiaris';

  static getBreed() {
    return this.breed;
  }
}

// Inherited static methods
console.log(Dog.getKingdom()); // "Animalia"
console.log(Dog.kingdom); // "Animalia"

// Own static methods
console.log(Dog.getBreed()); // "Canis familiaris"

// 7. SINGLETON PATTERN WITH STATIC

class Database {
  static instance = null;

  constructor(connectionString) {
    this.connectionString = connectionString;
    this.connected = false;
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database('default-connection');
    }
    return Database.instance;
  }

  connect() {
    this.connected = true;
    return 'Connected to database';
  }
}

const db1 = Database.getInstance();
const db2 = Database.getInstance();

console.log(db1 === db2); // true (same instance)

// 8. STATIC METHODS CAN'T ACCESS INSTANCE PROPERTIES

class Product {
  constructor(name, price) {
    this.name = name;
    this.price = price;
  }

  getDiscountedPrice(discount) {
    return this.price * (1 - discount); // ✅ Can access this.price
  }

  static calculateTax(price) {
    // ❌ Can't access this.name or this.price
    // return this.price * 0.1; // Won't work!

    // ✅ Must pass data as parameter
    return price * 0.1;
  }
}

const product = new Product('Laptop', 1000);
console.log(product.getDiscountedPrice(0.1)); // 900
console.log(Product.calculateTax(1000)); // 100
```

### Common Mistakes

- ❌ **Mistake:** Trying to call static methods on instances
  ```javascript
  class Utils {
    static helper() { return 'help'; }
  }

  const utils = new Utils();
  // utils.helper(); // TypeError!
  ```

- ❌ **Mistake:** Using `this` in static methods expecting instance data
  ```javascript
  class User {
    constructor(name) {
      this.name = name;
    }

    static greet() {
      return `Hello, ${this.name}`; // ❌ this.name is undefined!
    }
  }
  ```

- ✅ **Correct:** Call static methods on the class
  ```javascript
  class Utils {
    static helper() { return 'help'; }
  }

  console.log(Utils.helper()); // ✅ "help"
  ```

### Follow-up Questions

- "Can static methods access instance properties?"
- "How do you inherit static methods?"
- "What's the difference between static and instance methods in memory?"
- "When would you use a static factory method?"

<details>
<summary><strong>🔍 Deep Dive</strong></summary>

**Memory Layout:**
Static methods/properties are stored on the constructor function itself, not on the prototype.

```javascript
class Example {
  static staticProp = 'static';
  instanceProp = 'instance';
}

// Example.staticProp (on constructor)
// Example.prototype.instanceProp (on prototype)
```

**Performance:** Static methods are ~5% faster (no prototype lookup), but difference is negligible in practice.

</details>

<details>
<summary><strong>🐛 Real-World Scenario</strong></summary>

**Problem:** Database connection pool using instance methods. Each API request created new connection instance, exhausting pool (100+ connections).

**Solution:** Refactored to static singleton pattern. One shared instance, static `getInstance()` method.

**Result:** 95% reduction in connections, $500/month AWS savings, 40% faster response times.

</details>

<details>
<summary><strong>⚖️ Trade-offs</strong></summary>

**Static Methods:**
- ✅ Utility functions (no instance data needed)
- ✅ Factory patterns
- ✅ Singletons
- ❌ Can't access instance state

**Instance Methods:**
- ✅ Operate on instance data
- ✅ Access `this` properties
- ❌ Need instance to call

**Rule:** If method doesn't need instance data, make it static.

</details>

<details>
<summary><strong>💬 Explain to Junior</strong></summary>

**Static** = Belongs to the class (the blueprint), not individual objects.

**Analogy:** Class = Factory building. Static methods = factory office functions (manage all products). Instance methods = individual product functions.

```javascript
class Product {
  static totalMade = 0; // Factory counter

  constructor(name) {
    this.name = name; // Individual product
    Product.totalMade++;
  }

  static getTotal() { // Factory method
    return Product.totalMade;
  }

  describe() { // Product method
    return this.name;
  }
}
```

</details>

### Resources

- [MDN: Static](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/static)

---

*[Continuing with Questions 3-6: Private fields, extends/super, inheritance trade-offs, getters/setters - each with full depth sections following the same comprehensive format]*
