# Testing React Components - Part 2

> Custom hooks testing, renderHook patterns, and advanced testing techniques.

---

## Question 1: Testing Custom Hooks

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐
**Time:** 8 minutes
**Companies:** Meta, Netflix

### Question
How do you test custom React hooks? What tools and patterns should you use?

### Answer

**Testing Custom Hooks** - Use `renderHook` (built into `@testing-library/react`) or render a test component.

**Key Points:**
1. **renderHook** - Dedicated utility for testing hooks
2. **result.current** - Access hook's return value
3. **act** - Wrap state updates in act()
4. **waitFor** - Wait for async hook updates
5. **Test component approach** - Alternative for complex scenarios

### Code Example

```jsx
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCounter, useFetch, useLocalStorage } from './hooks';

// 1. TESTING SIMPLE CUSTOM HOOK
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);

  const increment = () => setCount(c => c + 1);
  const decrement = () => setCount(c => c - 1);
  const reset = () => setCount(initialValue);

  return { count, increment, decrement, reset };
}

test('useCounter increments count', () => {
  const { result } = renderHook(() => useCounter(0));

  expect(result.current.count).toBe(0);

  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});

test('useCounter resets to initial value', () => {
  const { result } = renderHook(() => useCounter(10));

  act(() => {
    result.current.increment();
    result.current.increment();
  });

  expect(result.current.count).toBe(12);

  act(() => {
    result.current.reset();
  });

  expect(result.current.count).toBe(10);
});

// 2. TESTING ASYNC HOOK
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [url]);

  return { data, loading, error };
}

test('useFetch fetches data', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    json: async () => ({ id: 1, name: 'John' })
  });

  const { result } = renderHook(() => useFetch('/api/users/1'));

  // Initially loading
  expect(result.current.loading).toBe(true);
  expect(result.current.data).toBe(null);

  // Wait for data to load
  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  expect(result.current.data).toEqual({ id: 1, name: 'John' });
  expect(result.current.error).toBe(null);

  global.fetch.mockRestore();
});

// 3. TESTING HOOK WITH DEPENDENCIES
test('useFetch refetches when URL changes', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    json: async () => ({ id: 1 })
  });

  const { result, rerender } = renderHook(
    ({ url }) => useFetch(url),
    { initialProps: { url: '/api/users/1' } }
  );

  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(global.fetch).toHaveBeenCalledWith('/api/users/1');

  // Change URL
  rerender({ url: '/api/users/2' });

  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(global.fetch).toHaveBeenCalledWith('/api/users/2');
  expect(global.fetch).toHaveBeenCalledTimes(2);

  global.fetch.mockRestore();
});

// 4. TESTING HOOK WITH CONTEXT
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

test('useAuth returns context value', () => {
  const wrapper = ({ children }) => (
    <AuthContext.Provider value={{ user: { name: 'John' }, logout: jest.fn() }}>
      {children}
    </AuthContext.Provider>
  );

  const { result } = renderHook(() => useAuth(), { wrapper });

  expect(result.current.user).toEqual({ name: 'John' });
  expect(result.current.logout).toBeInstanceOf(Function);
});

// 5. ALTERNATIVE: TEST COMPONENT APPROACH
function TestComponent() {
  const { count, increment } = useCounter(0);

  return (
    <div>
      <span>Count: {count}</span>
      <button onClick={increment}>Increment</button>
    </div>
  );
}

test('useCounter works in component', async () => {
  render(<TestComponent />);
  const user = userEvent.setup();

  expect(screen.getByText('Count: 0')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /increment/i }));

  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

### Common Mistakes

- ❌ Forgetting to wrap state updates in `act()`
- ❌ Not providing required context/providers when testing hooks
- ❌ Testing hook implementation details instead of behavior
- ❌ Not cleaning up side effects (timers, subscriptions)
- ✅ Use `renderHook` for most cases
- ✅ Use test component approach for complex scenarios
- ✅ Properly mock dependencies (fetch, localStorage, etc.)

### Follow-up Questions

1. When would you use `renderHook` vs rendering a test component?
2. How do you test hooks that use context?
3. How do you test cleanup functions in useEffect?

### Resources
- [Testing React Hooks](https://react-hooks-testing-library.com/)
- [React Testing Library Hooks](https://testing-library.com/docs/react-testing-library/api#renderhook)
