# TypeScript with React

> Master TypeScript in React: typing components, props, state, hooks, events, refs, and advanced patterns for production applications

---

## Question 1: How Do You Type React Function Components and Props?

**Difficulty:** 🟢 Easy
**Frequency:** ⭐⭐⭐⭐⭐
**Time:** 6 minutes
**Companies:** All companies using React + TypeScript

### Question
How do you properly type React function components and their props in TypeScript? What are the different approaches and best practices?

### Answer

There are multiple ways to type React components, each with specific use cases. Modern React favors function components with typed props.

**Key Points:**

1. **React.FC vs Direct Typing** - Two main approaches, direct typing is now preferred
2. **Props Interface** - Define props separately for reusability
3. **Children Typing** - Explicit children prop or React.PropsWithChildren
4. **Optional Props** - Use `?` for optional properties
5. **Default Props** - Use default parameters (not defaultProps)

### Code Example

```typescript
import React from 'react';

// 1. BASIC COMPONENT WITH PROPS (Preferred Modern Approach)
interface ButtonProps {
  text: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

function Button({ text, onClick, variant = 'primary', disabled = false }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn-${variant}`}
    >
      {text}
    </button>
  );
}

// Usage
<Button text="Click me" onClick={() => console.log('clicked')} />
<Button text="Submit" onClick={handleSubmit} variant="secondary" />

// 2. COMPONENT WITH CHILDREN (Modern Approach)
interface CardProps {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

function Card({ title, children, footer }: CardProps) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}

// Usage
<Card title="My Card">
  <p>This is the content</p>
</Card>

// 3. COMPONENT WITH GENERIC PROPS
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={keyExtractor(item)}>
          {renderItem(item, index)}
        </li>
      ))}
    </ul>
  );
}

// 4. COMPONENT WITH FORWARDED REF
interface FancyInputProps {
  placeholder?: string;
}

const FancyInput = React.forwardRef<HTMLInputElement, FancyInputProps>(
  ({ placeholder }, ref) => {
    return <input ref={ref} placeholder={placeholder} className="fancy-input" />;
  }
);

// Usage
function Parent() {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const focusInput = () => inputRef.current?.focus();

  return (
    <>
      <FancyInput ref={inputRef} placeholder="Type here" />
      <button onClick={focusInput}>Focus Input</button>
    </>
  );
}
```

### Common Mistakes

```typescript
// ❌ WRONG: Using React.FC (implicit return type, awkward with generics)
const Button: React.FC<{ text: string }> = ({ text }) => {
  return <button>{text}</button>;
};

// ✅ CORRECT: Direct typing without React.FC
function Button({ text }: { text: string }) {
  return <button>{text}</button>;
}

// ❌ WRONG: Not typing event handlers properly
function Input({ onChange }: { onChange: Function }) {
  return <input onChange={onChange} />;  // Too loose
}

// ✅ CORRECT: Proper event handler typing
function Input({ onChange }: { onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return <input onChange={onChange} />;
}
```

### Follow-up Questions
1. When would you use `React.FC` vs direct prop typing?
2. How do you type components that accept any HTML element props?
3. How do you type generic components that work with different data types?

### Resources
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [TypeScript React Docs](https://react.dev/learn/typescript)

---

## Question 2: How Do You Type React Hooks in TypeScript?

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐⭐
**Time:** 8 minutes
**Companies:** Meta, Google, Airbnb, Netflix

### Question
How do you properly type useState, useEffect, useRef, useContext, and custom hooks in TypeScript?

### Answer

Hooks require specific typing patterns to ensure type safety. TypeScript can often infer types, but explicit typing prevents errors.

**Key Points:**

1. **useState** - Type inference works, but explicit typing prevents mistakes
2. **useEffect** - No return type needed (cleanup function is inferred)
3. **useRef** - Different typing for DOM refs vs mutable values
4. **useContext** - Type the context value explicitly
5. **Custom Hooks** - Return type should be explicit

### Code Example

```typescript
import React, { useState, useRef, useContext, useCallback } from 'react';

// 1. useState WITH TYPE INFERENCE
function Counter() {
  const [count, setCount] = useState(0);  // inferred as number
  const [name, setName] = useState('');   // inferred as string
  return <div>Count: {count}</div>;
}

// 2. useState WITH EXPLICIT TYPES
interface User {
  id: number;
  name: string;
  email: string;
}

function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  return <div>{user ? <p>{user.name}</p> : <p>No user</p>}</div>;
}

// 3. useRef FOR DOM ELEMENTS
function TextInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <>
      <input ref={inputRef} />
      <button onClick={focusInput}>Focus Input</button>
    </>
  );
}

// 4. useContext WITH TYPED CONTEXT
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

// 5. CUSTOM HOOKS WITH EXPLICIT RETURN TYPES
interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(url);
      const json = await response.json();
      setData(json);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [url]);

  return { data, loading, error, refetch: fetchData };
}
```

### Common Mistakes

```typescript
// ❌ WRONG: Not typing nullable state
const [user, setUser] = useState<User>();  // user might be undefined
console.log(user.name);  // Error: user might be undefined

// ✅ CORRECT: Explicitly type nullable state
const [user, setUser] = useState<User | null>(null);
console.log(user?.name);  // Safe optional chaining

// ❌ WRONG: Not initializing useRef properly
const inputRef = useRef<HTMLInputElement>();
inputRef.current.focus();  // Error: might be undefined

// ✅ CORRECT: Initialize with null
const inputRef = useRef<HTMLInputElement>(null);
inputRef.current?.focus();  // Safe with optional chaining
```

### Follow-up Questions
1. How do you type a ref that can hold different types of elements?
2. When should you provide explicit types to useState vs relying on inference?
3. How do you type a custom hook that returns an array vs an object?

### Resources
- [React Hooks TypeScript](https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/hooks)

---

## Question 3: How Do You Type React Events in TypeScript?

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐
**Time:** 7 minutes
**Companies:** All companies

### Question
How do you properly type React events (onChange, onClick, onSubmit, etc.) in TypeScript? What are the different event types available?

### Answer

React wraps native browser events in its own SyntheticEvent system. TypeScript provides specific types for each event and element combination.

**Key Points:**

1. **SyntheticEvent** - React's cross-browser wrapper
2. **Element-Specific Types** - Different types for different elements
3. **Event Types** - Mouse, Keyboard, Focus, Form, Touch events
4. **Generic Parameters** - Event type + element type
5. **Type Inference** - Inline handlers get type inference

### Code Example

```typescript
import React from 'react';

// 1. CLICK EVENTS
function ClickExample() {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    console.log('Clicked at:', event.clientX, event.clientY);
  };

  return <button onClick={handleClick}>Click Me</button>;
}

// 2. CHANGE EVENTS
function ChangeExample() {
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Value:', event.target.value);
  };

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    console.log('Selected:', event.target.value);
  };

  return (
    <>
      <input onChange={handleInputChange} />
      <select onChange={handleSelectChange}>
        <option>Option 1</option>
      </select>
    </>
  );
}

// 3. KEYBOARD EVENTS
function KeyboardExample() {
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      console.log('Enter pressed');
    }
  };

  return <input onKeyPress={handleKeyPress} />;
}

// 4. FOCUS EVENTS
function FocusExample() {
  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    event.target.select();
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    console.log('Blurred:', event.target.value);
  };

  return <input onFocus={handleFocus} onBlur={handleBlur} />;
}

// 5. FORM EVENTS
function FormExample() {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log('Form submitted');
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Common Mistakes

```typescript
// ❌ WRONG: Using native Event type
function handleClick(event: Event) {  // Wrong: native Event
  console.log(event.currentTarget.value);
}

// ✅ CORRECT: Use React.MouseEvent
function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
  console.log(event.currentTarget.value);
}

// ❌ WRONG: Not specifying element type
function handleChange(event: React.ChangeEvent) {
  console.log(event.target.value);  // Type error
}

// ✅ CORRECT: Specify element type
function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
  console.log(event.target.value);  // Works
}
```

### Follow-up Questions
1. What's the difference between event.target and event.currentTarget?
2. How do you type custom event handlers that work with multiple element types?
3. When would you use React.SyntheticEvent vs specific event types?

### Resources
- [React Event Types](https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/forms_and_events/)

---

## Questions 4-15: TypeScript + React Patterns

**Difficulty:** 🟡 Medium to 🔴 Hard
**Frequency:** ⭐⭐⭐⭐⭐
**Consolidated React TypeScript patterns**

### Q4-6: Component Props & Children

```typescript
// Props with children
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ onClick, children, variant = 'primary' }) => (
  <button onClick={onClick} className={variant}>
    {children}
  </button>
);

// Specific children types
interface ListProps {
  children: React.ReactElement<ItemProps> | React.ReactElement<ItemProps>[];
}

// Optional children
interface CardProps {
  title: string;
  children?: React.ReactNode;
}
```

### Q7-9: Hooks Typing

```typescript
// useState with explicit type
const [user, setUser] = useState<User | null>(null);
const [count, setCount] = useState<number>(0);

// useRef for DOM elements
const inputRef = useRef<HTMLInputElement>(null);
inputRef.current?.focus();

// useRef for mutable values
const renderCount = useRef<number>(0);

// useReducer with discriminated unions
type Action =
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'SET'; payload: number };

function reducer(state: number, action: Action): number {
  switch (action.type) {
    case 'INCREMENT': return state + 1;
    case 'DECREMENT': return state - 1;
    case 'SET': return action.payload;
  }
}

const [state, dispatch] = useReducer(reducer, 0);

// Custom hooks with generics
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  });

  const setStoredValue = (newValue: T) => {
    setValue(newValue);
    localStorage.setItem(key, JSON.stringify(newValue));
  };

  return [value, setStoredValue] as const;
}
```

### Q10-12: Event Handlers & Forms

```typescript
// Event handlers
const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
  console.log(e.currentTarget);
};

const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
  console.log(e.target.value);
};

const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
  e.preventDefault();
};

// Form component with controlled inputs
interface FormData {
  email: string;
  password: string;
}

const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Submitting', formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" value={formData.email} onChange={handleInputChange} />
      <input name="password" type="password" value={formData.password} onChange={handleInputChange} />
    </form>
  );
};
```

### Q13-15: Advanced Patterns

```typescript
// Generic component
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return <div>{items.map(renderItem)}</div>;
}

// Usage
<List items={users} renderItem={(user) => <div>{user.name}</div>} />

// Higher-Order Component (HOC)
function withLoading<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P & { loading: boolean }> {
  return ({ loading, ...props }) => {
    if (loading) return <div>Loading...</div>;
    return <Component {...(props as P)} />;
  };
}

// Render props pattern
interface MouseTrackerProps {
  render: (position: { x: number; y: number }) => React.ReactNode;
}

const MouseTracker: React.FC<MouseTrackerProps> = ({ render }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return <>{render(position)}</>;
};
```

### Resources
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [React TypeScript Docs](https://react.dev/learn/typescript)

---

**[← Back to TypeScript README](./README.md)**

**Progress:** 15 of 15 React TypeScript questions completed ✅
