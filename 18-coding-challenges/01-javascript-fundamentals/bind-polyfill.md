# Implement Function.prototype.bind Polyfill

## Problem Statement

Implement a polyfill for `Function.prototype.bind()` that creates a new function with a specific `this` context and optionally pre-filled arguments. The polyfill should handle all edge cases including constructor invocation and partial application.

**Difficulty:** 🔴 Hard
**Frequency:** ⭐⭐⭐⭐⭐
**Time to Solve:** 25-35 minutes
**Companies:** Google, Meta, Amazon, Microsoft, Apple, Netflix, Uber

---

## Requirements

- [ ] Create a new function with bound `this` context
- [ ] Support partial application (pre-filled arguments)
- [ ] Handle constructor invocation with `new` keyword
- [ ] Preserve original function's prototype chain
- [ ] Maintain function length property correctly
- [ ] Handle edge cases (null/undefined context, primitives)
- [ ] Should not modify original function
- [ ] Work with any function including constructors

---

## Real-World Use Cases

1. **Event Handlers** - Binding context to class methods in React
2. **Callback Functions** - Preserving context in setTimeout/setInterval
3. **Method Borrowing** - Using methods from other objects
4. **Partial Application** - Creating specialized functions with preset parameters
5. **Constructor Binding** - Creating bound constructor functions
6. **API Clients** - Pre-configuring methods with authentication
7. **Functional Programming** - Point-free style with bound functions

---

## Example Usage

```javascript
// Basic binding
function greet(greeting, punctuation) {
  return `${greeting}, ${this.name}${punctuation}`;
}

const user = { name: 'Alice' };
const greetAlice = greet.bind(user);

console.log(greetAlice('Hello', '!')); // "Hello, Alice!"
console.log(greetAlice('Hi', '.')); // "Hi, Alice."

// Partial application
const sayHello = greet.bind(user, 'Hello');
console.log(sayHello('!')); // "Hello, Alice!"
console.log(sayHello('?')); // "Hello, Alice?"

// React class component method binding
class Button extends React.Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };

    // Bind method to component instance
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    this.setState({ count: this.state.count + 1 });
  }

  render() {
    return <button onClick={this.handleClick}>Clicks: {this.state.count}</button>;
  }
}

// Method borrowing
const person1 = {
  name: 'John',
  greet: function() {
    return `Hello, I'm ${this.name}`;
  }
};

const person2 = { name: 'Jane' };
const greetAsPerson2 = person1.greet.bind(person2);
console.log(greetAsPerson2()); // "Hello, I'm Jane"

// Constructor function binding
function Point(x, y) {
  this.x = x;
  this.y = y;
}

Point.prototype.toString = function() {
  return `(${this.x}, ${this.y})`;
};

const BoundPoint = Point.bind(null, 10);
const point = new BoundPoint(20);
console.log(point.toString()); // "(10, 20)"
console.log(point instanceof Point); // true

// Callback with context
const timer = {
  seconds: 0,
  start: function() {
    setInterval(function() {
      this.seconds++;
      console.log(this.seconds);
    }.bind(this), 1000);
  }
};

timer.start(); // 1, 2, 3, ...
```

---

## Test Cases

```javascript
describe('Function.prototype.bind polyfill', () => {
  test('binds context to function', () => {
    function greet() {
      return `Hello, ${this.name}`;
    }

    const obj = { name: 'Alice' };
    const boundGreet = greet.bind(obj);

    expect(boundGreet()).toBe('Hello, Alice');
  });

  test('supports partial application', () => {
    function add(a, b, c) {
      return a + b + c;
    }

    const add5 = add.bind(null, 5);
    expect(add5(10, 15)).toBe(30);

    const add5And10 = add.bind(null, 5, 10);
    expect(add5And10(15)).toBe(30);
  });

  test('preserves additional arguments', () => {
    function sum(a, b, c, d) {
      return a + b + c + d;
    }

    const boundSum = sum.bind(null, 1, 2);
    expect(boundSum(3, 4)).toBe(10);
  });

  test('handles constructor invocation with new', () => {
    function Person(name, age) {
      this.name = name;
      this.age = age;
    }

    Person.prototype.greet = function() {
      return `Hi, I'm ${this.name}`;
    };

    const BoundPerson = Person.bind(null, 'John');
    const person = new BoundPerson(30);

    expect(person.name).toBe('John');
    expect(person.age).toBe(30);
    expect(person.greet()).toBe("Hi, I'm John");
    expect(person instanceof Person).toBe(true);
  });

  test('ignores bound context when used as constructor', () => {
    function Point(x, y) {
      this.x = x;
      this.y = y;
    }

    const fakeContext = { x: 999, y: 999 };
    const BoundPoint = Point.bind(fakeContext, 10);
    const point = new BoundPoint(20);

    expect(point.x).toBe(10);
    expect(point.y).toBe(20);
    expect(fakeContext.x).toBe(999); // Not modified
  });

  test('works with null and undefined context', () => {
    function getThis() {
      return this;
    }

    const boundNull = getThis.bind(null);
    const boundUndefined = getThis.bind(undefined);

    // In strict mode, should be null/undefined
    // In non-strict mode, should be global object
    expect(boundNull()).toBeDefined();
    expect(boundUndefined()).toBeDefined();
  });

  test('preserves function length property', () => {
    function func(a, b, c) {}

    const bound1 = func.bind(null);
    const bound2 = func.bind(null, 1);
    const bound3 = func.bind(null, 1, 2);

    expect(bound1.length).toBe(3);
    expect(bound2.length).toBe(2);
    expect(bound3.length).toBe(1);
  });

  test('returns new function instance', () => {
    function original() {}

    const bound1 = original.bind(null);
    const bound2 = original.bind(null);

    expect(bound1).not.toBe(bound2);
    expect(bound1).not.toBe(original);
  });
});
```

---

## Solution 1: Basic Bind Polyfill

```javascript
if (!Function.prototype.bind) {
  Function.prototype.bind = function(context) {
    // Save reference to original function
    const fn = this;

    // Get pre-filled arguments (everything after context)
    const args = Array.prototype.slice.call(arguments, 1);

    // Return bound function
    return function() {
      // Combine pre-filled and new arguments
      const finalArgs = args.concat(Array.prototype.slice.call(arguments));

      // Call original function with bound context
      return fn.apply(context, finalArgs);
    };
  };
}
```

**Time Complexity:** O(n) where n is number of arguments
**Space Complexity:** O(n) for storing arguments

**Pros:**
- Simple and easy to understand
- Handles basic binding and partial application
- Works for regular function calls

**Cons:**
- Doesn't handle constructor invocation (`new` keyword)
- Doesn't preserve prototype chain
- Doesn't handle length property correctly

---

## Solution 2: Enhanced with Constructor Support

```javascript
if (!Function.prototype.bind) {
  Function.prototype.bind = function(context) {
    const fn = this;
    const args = Array.prototype.slice.call(arguments, 1);

    function Bound() {
      // Check if called with 'new' keyword
      // If yes, use the new instance as context
      // If no, use the bound context
      const isConstructor = this instanceof Bound;
      const finalContext = isConstructor ? this : context;

      const finalArgs = args.concat(Array.prototype.slice.call(arguments));
      return fn.apply(finalContext, finalArgs);
    }

    // Preserve prototype chain for constructor functions
    if (fn.prototype) {
      Bound.prototype = Object.create(fn.prototype);
    }

    return Bound;
  };
}
```

**Time Complexity:** O(n)
**Space Complexity:** O(n)

**Pros:**
- Handles constructor invocation correctly
- Preserves prototype chain
- Supports instanceof checks

**Cons:**
- Doesn't handle length property
- Prototype chain setup could be more robust

---

## Solution 3: Production-Ready Polyfill

```javascript
if (!Function.prototype.bind) {
  Function.prototype.bind = function(context) {
    // Validate that this is a function
    if (typeof this !== 'function') {
      throw new TypeError(
        'Function.prototype.bind - what is trying to be bound is not callable'
      );
    }

    const fn = this;
    const args = Array.prototype.slice.call(arguments, 1);

    // Create bound function
    function Bound() {
      // Determine the context:
      // - If called with 'new', use the new instance
      // - Otherwise, use the bound context
      const finalContext = this instanceof Bound ? this : context;

      // Combine pre-filled and runtime arguments
      const finalArgs = args.concat(Array.prototype.slice.call(arguments));

      return fn.apply(finalContext, finalArgs);
    }

    // Create a dummy function for prototype chain
    // This is needed to avoid modifying the original function's prototype
    const NOP = function() {};

    if (fn.prototype) {
      // Set up prototype chain
      NOP.prototype = fn.prototype;
      Bound.prototype = new NOP();
    }

    // Set proper length property
    Object.defineProperty(Bound, 'length', {
      value: Math.max(0, fn.length - args.length),
      configurable: true
    });

    // Set name property
    Object.defineProperty(Bound, 'name', {
      value: 'bound ' + (fn.name || 'anonymous'),
      configurable: true
    });

    return Bound;
  };
}
```

**Time Complexity:** O(n)
**Space Complexity:** O(n)

**Pros:**
- Complete polyfill implementation
- Handles all edge cases
- Preserves length and name properties
- Robust prototype chain management
- Type checking

**Cons:**
- More complex code
- Uses intermediate NOP function

---

## Solution 4: Modern ES6+ Implementation (TypeScript)

```typescript
interface Function {
  bind<T>(this: T, thisArg: any, ...args: any[]): T;
}

if (!Function.prototype.bind) {
  Function.prototype.bind = function(context, ...boundArgs) {
    if (typeof this !== 'function') {
      throw new TypeError('Bind must be called on a function');
    }

    const originalFunction = this;

    // Create the bound function
    const boundFunction: any = function(...callArgs: any[]) {
      // Check if called as constructor
      const isConstructorCall = new.target !== undefined;

      // Determine context
      const finalContext = isConstructorCall ? this : context;

      // Combine arguments
      const allArgs = [...boundArgs, ...callArgs];

      // Call original function
      if (isConstructorCall) {
        // Use Reflect.construct for proper constructor invocation
        return Reflect.construct(originalFunction, allArgs, new.target);
      } else {
        return originalFunction.apply(finalContext, allArgs);
      }
    };

    // Set up prototype chain
    if (originalFunction.prototype) {
      boundFunction.prototype = Object.create(originalFunction.prototype);
    }

    // Define length property
    Object.defineProperty(boundFunction, 'length', {
      value: Math.max(0, originalFunction.length - boundArgs.length),
      configurable: true,
      writable: false,
      enumerable: false
    });

    // Define name property
    Object.defineProperty(boundFunction, 'name', {
      value: `bound ${originalFunction.name || 'anonymous'}`,
      configurable: true,
      writable: false,
      enumerable: false
    });

    return boundFunction;
  };
}
```

**Time Complexity:** O(n)
**Space Complexity:** O(n)

**Pros:**
- Modern ES6+ features (spread, Reflect)
- Type-safe with TypeScript
- Uses new.target for constructor detection
- Clean and readable
- Full spec compliance

**Cons:**
- Requires ES6+ environment
- Slightly more complex

---

## Common Mistakes

### ❌ Mistake 1: Not handling constructor invocation

```javascript
// Wrong - always uses bound context
Function.prototype.bind = function(context) {
  const fn = this;
  const args = Array.prototype.slice.call(arguments, 1);

  return function() {
    // Always uses bound context, even with 'new'
    return fn.apply(context, args.concat(Array.prototype.slice.call(arguments)));
  };
};

// This breaks:
function Point(x, y) {
  this.x = x;
  this.y = y;
}

const BoundPoint = Point.bind(null, 10);
const point = new BoundPoint(20); // Doesn't work correctly!
```

### ✅ Correct: Check for constructor invocation

```javascript
Function.prototype.bind = function(context) {
  const fn = this;
  const args = Array.prototype.slice.call(arguments, 1);

  function Bound() {
    // Use new instance if called with 'new', otherwise use bound context
    const finalContext = this instanceof Bound ? this : context;
    return fn.apply(finalContext, args.concat(Array.prototype.slice.call(arguments)));
  }

  if (fn.prototype) {
    Bound.prototype = Object.create(fn.prototype);
  }

  return Bound;
};
```

### ❌ Mistake 2: Breaking prototype chain

```javascript
// Wrong - directly assigns prototype
Function.prototype.bind = function(context) {
  const fn = this;

  function Bound() {
    // ... binding logic
  }

  // Wrong: Modifies original prototype
  Bound.prototype = fn.prototype;

  return Bound;
};
```

### ✅ Correct: Use Object.create for prototype chain

```javascript
Function.prototype.bind = function(context) {
  const fn = this;

  function Bound() {
    // ... binding logic
  }

  // Correct: Creates new object with fn.prototype as prototype
  if (fn.prototype) {
    Bound.prototype = Object.create(fn.prototype);
  }

  return Bound;
};
```

### ❌ Mistake 3: Not validating callable

```javascript
// Wrong - doesn't check if 'this' is a function
Function.prototype.bind = function(context) {
  const fn = this; // Could be anything!

  return function() {
    return fn.apply(context, arguments); // Might not be callable
  };
};

// This should throw an error:
const obj = {};
try {
  Function.prototype.bind.call(obj, null);
} catch (e) {
  // Should catch TypeError
}
```

### ✅ Correct: Validate that this is callable

```javascript
Function.prototype.bind = function(context) {
  if (typeof this !== 'function') {
    throw new TypeError('Bind must be called on a function');
  }

  const fn = this;
  // ... rest of implementation
};
```

### ❌ Mistake 4: Incorrect argument handling

```javascript
// Wrong - loses arguments
Function.prototype.bind = function(context) {
  const fn = this;
  // Doesn't capture pre-filled arguments!

  return function() {
    return fn.apply(context, arguments);
  };
};

const add = (a, b, c) => a + b + c;
const add5 = add.bind(null, 5);
console.log(add5(10, 15)); // Breaks! 'a' is undefined
```

### ✅ Correct: Capture and combine arguments

```javascript
Function.prototype.bind = function(context) {
  const fn = this;
  const args = Array.prototype.slice.call(arguments, 1); // Capture bound args

  return function() {
    const finalArgs = args.concat(Array.prototype.slice.call(arguments));
    return fn.apply(context, finalArgs);
  };
};
```

---

## Edge Cases

1. **Binding arrow functions** - Arrow functions don't have their own `this`, so binding has no effect
2. **Double binding** - Second bind() creates new function but can't rebind
3. **Binding built-in functions** - Some built-in functions may not work correctly
4. **Null/undefined context** - Should convert to global object in non-strict mode
5. **Constructor without prototype** - Some functions don't have prototype
6. **Binding already bound function** - Creates nested bound functions
7. **Zero-argument functions** - Length should remain 0

---

## Real-World Applications

### 1. React Class Component Event Handlers

```javascript
class TodoList extends React.Component {
  constructor(props) {
    super(props);
    this.state = { todos: [] };

    // Bind methods to instance
    this.addTodo = this.addTodo.bind(this);
    this.removeTodo = this.removeTodo.bind(this);
  }

  addTodo(text) {
    this.setState(state => ({
      todos: [...state.todos, { id: Date.now(), text }]
    }));
  }

  removeTodo(id) {
    this.setState(state => ({
      todos: state.todos.filter(todo => todo.id !== id)
    }));
  }

  render() {
    return (
      <div>
        {this.state.todos.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onRemove={this.removeTodo.bind(this, todo.id)}
          />
        ))}
      </div>
    );
  }
}
```

### 2. Debounced Event Handler with Context

```javascript
class SearchBox {
  constructor() {
    this.apiUrl = 'https://api.example.com/search';
    this.cache = new Map();

    // Bind and debounce search method
    this.search = this.debounce(this.search.bind(this), 300);
  }

  debounce(fn, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  async search(query) {
    if (this.cache.has(query)) {
      return this.cache.get(query);
    }

    const response = await fetch(`${this.apiUrl}?q=${query}`);
    const results = await response.json();

    this.cache.set(query, results);
    return results;
  }
}
```

### 3. Method Borrowing for Array-Like Objects

```javascript
// Convert NodeList to Array using Array methods
const divs = document.querySelectorAll('div');

// Borrow slice method from Array
const divsArray = Array.prototype.slice.call(divs);

// Or use bind for reusable converter
const toArray = Array.prototype.slice.bind(Array.prototype);
const divsArray2 = toArray(divs);

// Filter array-like object
const filtered = Array.prototype.filter.call(divs, div =>
  div.classList.contains('active')
);
```

### 4. Partial Application for API Client

```javascript
class ApiClient {
  constructor(baseUrl, authToken) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;

    // Create bound methods with partial application
    this.get = this.request.bind(this, 'GET');
    this.post = this.request.bind(this, 'POST');
    this.put = this.request.bind(this, 'PUT');
    this.delete = this.request.bind(this, 'DELETE');
  }

  async request(method, endpoint, data) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: data ? JSON.stringify(data) : undefined
    });

    return response.json();
  }
}

// Usage
const api = new ApiClient('https://api.example.com', 'token123');

await api.get('/users');
await api.post('/users', { name: 'John' });
await api.put('/users/1', { name: 'Jane' });
await api.delete('/users/1');
```

---

## Follow-up Questions

1. **"What's the difference between bind, call, and apply?"**
   - **bind:** Returns new function with bound context (doesn't invoke)
   - **call:** Invokes immediately with specific context and individual arguments
   - **apply:** Invokes immediately with specific context and array of arguments

2. **"Can you rebind an already bound function?"**
   - No, once a function is bound, subsequent bind() calls create new functions but don't change the context
   - The original bound context is preserved in the closure

3. **"Why does bind create a new function instead of modifying the original?"**
   - Functions are objects and could be shared/reused
   - Creating new function preserves original functionality
   - Allows multiple bound versions of the same function

4. **"How does bind handle arrow functions?"**
   - Arrow functions don't have their own `this` binding
   - Binding an arrow function has no effect on its context
   - The lexical `this` is preserved

5. **"What's the performance impact of using bind?"**
   - Creates additional closures and function objects
   - Small overhead per bound function
   - Consider alternatives: arrow functions in class fields, closures

6. **"When would you use bind vs arrow functions in React?"**
   - **bind:** Class methods that need instance context
   - **Arrow functions:** Inline handlers (creates new function each render)
   - **Class fields with arrows:** Best of both (bound once, no render overhead)

---

## Performance Comparison

```javascript
// Performance test
const iterations = 1000000;

// Method 1: bind in constructor (most efficient)
class Test1 {
  constructor() {
    this.value = 10;
    this.method = this.method.bind(this);
  }
  method() { return this.value; }
}

// Method 2: arrow function class field (modern, efficient)
class Test2 {
  value = 10;
  method = () => this.value;
}

// Method 3: inline arrow function (least efficient)
class Test3 {
  value = 10;
  method() { return this.value; }
  render() {
    return () => this.method();
  }
}

// Method 4: inline bind (least efficient)
class Test4 {
  value = 10;
  method() { return this.value; }
  render() {
    return this.method.bind(this);
  }
}

// bind in constructor and arrow class fields are most efficient
// Inline bind/arrows create new functions on each render
```

---

## Resources

- [MDN: Function.prototype.bind()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)
- [ECMAScript Specification: Function.prototype.bind](https://tc39.es/ecma262/#sec-function.prototype.bind)
- [You Don't Know JS: this & Object Prototypes](https://github.com/getify/You-Dont-Know-JS/blob/2nd-ed/this%20%26%20object%20prototypes/ch2.md)
- [JavaScript bind() Polyfill](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind#polyfill)

---

[← Back to JavaScript Fundamentals](./README.md) | [Next: Call/Apply Polyfill →](./README.md)
