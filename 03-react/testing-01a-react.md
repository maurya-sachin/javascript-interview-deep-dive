# Testing React Components

> React Testing Library, testing hooks, async testing, mocking, and best practices.

---

## Question 1: React Testing Library Best Practices

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐⭐
**Time:** 10 minutes
**Companies:** Meta, Google, Netflix

### Question
How do you test React components with React Testing Library? What are the best practices?

### Answer

**React Testing Library (RTL)** - Tests components from a user's perspective, not implementation details.

**Key Points:**
1. **Query by role** - Use accessible queries (getByRole, getByLabelText)
2. **User interactions** - Use userEvent library for realistic interactions
3. **Async testing** - Use findBy queries for async elements
4. **Don't test implementation** - Avoid testing state, props directly
5. **Arrange-Act-Assert** - Structure tests clearly

### Code Example

```jsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Counter, LoginForm, UserList } from './components';

// 1. BASIC COMPONENT TEST
test('counter increments when button clicked', async () => {
  // Arrange
  render(<Counter />);
  const user = userEvent.setup();

  // Act
  const button = screen.getByRole('button', { name: /increment/i });
  await user.click(button);

  // Assert
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});

// 2. FORM TESTING
test('login form submits with user credentials', async () => {
  const mockSubmit = jest.fn();
  render(<LoginForm onSubmit={mockSubmit} />);
  const user = userEvent.setup();

  // Fill form
  const emailInput = screen.getByLabelText(/email/i);
  const passwordInput = screen.getByLabelText(/password/i);
  const submitButton = screen.getByRole('button', { name: /submit/i });

  await user.type(emailInput, 'test@example.com');
  await user.type(passwordInput, 'password123');
  await user.click(submitButton);

  // Verify submission
  expect(mockSubmit).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'password123'
  });
});

// 3. ASYNC DATA FETCHING
test('displays user list after loading', async () => {
  // Mock API
  const mockUsers = [
    { id: 1, name: 'John' },
    { id: 2, name: 'Jane' }
  ];

  jest.spyOn(global, 'fetch').mockResolvedValue({
    json: async () => mockUsers
  });

  render(<UserList />);

  // Initially shows loading
  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  // Wait for users to appear
  const userItems = await screen.findAllByRole('listitem');
  expect(userItems).toHaveLength(2);
  expect(screen.getByText('John')).toBeInTheDocument();

  global.fetch.mockRestore();
});

// 4. TESTING ACCESSIBLE QUERIES (Best Practice)
test('uses accessible queries', () => {
  render(<LoginForm />);

  // ✅ GOOD: Query by role (most accessible)
  screen.getByRole('button', { name: /submit/i });
  screen.getByRole('textbox', { name: /email/i });

  // ✅ GOOD: Query by label text
  screen.getByLabelText(/password/i);

  // ✅ GOOD: Query by placeholder (when no label)
  screen.getByPlaceholderText(/enter your email/i);

  // ❌ BAD: Query by test ID (last resort only)
  // screen.getByTestId('submit-button');

  // ❌ BAD: Query by class or element type
  // screen.getByClassName('btn-primary');
});

// 5. ERROR HANDLING
test('displays error message when API fails', async () => {
  jest.spyOn(global, 'fetch').mockRejectedValue(new Error('API Error'));

  render(<UserList />);

  // Wait for error message
  const errorMessage = await screen.findByText(/failed to load users/i);
  expect(errorMessage).toBeInTheDocument();

  global.fetch.mockRestore();
});

// 6. CONDITIONAL RENDERING
test('shows/hides content based on user interaction', async () => {
  render(<AccordionItem />);
  const user = userEvent.setup();

  // Initially collapsed
  expect(screen.queryByText(/content/i)).not.toBeInTheDocument();

  // Click to expand
  const button = screen.getByRole('button', { name: /expand/i });
  await user.click(button);

  // Content now visible
  expect(screen.getByText(/content/i)).toBeInTheDocument();
});

// 7. CUSTOM RENDER WITH PROVIDERS
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';

const customRender = (ui, { theme = 'light', ...options } = {}) => {
  return render(
    <BrowserRouter>
      <ThemeProvider value={theme}>
        {ui}
      </ThemeProvider>
    </BrowserRouter>,
    options
  );
};

test('renders with theme provider', () => {
  customRender(<Header />, { theme: 'dark' });
  expect(screen.getByRole('banner')).toHaveClass('dark-theme');
});
```

### Common Mistakes

- ❌ Using `getByTestId` for everything (use accessible queries instead)
- ❌ Testing implementation details (state, props, component methods)
- ❌ Using `fireEvent` instead of `userEvent` (userEvent is more realistic)
- ❌ Not waiting for async updates (`waitFor`, `findBy` queries)
- ✅ Query by role, label, text (how users interact)
- ✅ Test behavior, not implementation
- ✅ Use `userEvent.setup()` with async/await

### Follow-up Questions

1. What's the difference between `getBy`, `queryBy`, and `findBy`?
2. How do you test custom hooks?
3. When should you use `waitFor` vs `findBy`?

### Resources
- [React Testing Library](https://testing-library.com/react)
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

<details>
<summary><strong>🔍 Deep Dive: React Testing Library Philosophy and Architecture</strong></summary>

**React Testing Library Philosophy and Internal Architecture**

React Testing Library (RTL) represents a fundamental shift in testing philosophy, built on the principle that tests should resemble how users interact with applications rather than testing implementation details. Understanding its internal architecture reveals why this approach produces more maintainable and reliable tests.

**Query Priority System and DOM Testing Library Foundation**

RTL is built on top of DOM Testing Library, which provides the core query system. The library implements a sophisticated priority hierarchy for element queries, ranked by accessibility and user perception. The highest priority queries are `getByRole` and `getByLabelText`, which directly map to how assistive technologies and users perceive elements. These queries force developers to write accessible markup because if a test can't find an element by role or label, real users likely face similar challenges.

The query system uses three prefixes (`getBy`, `queryBy`, `findBy`) combined with various suffixes (Role, LabelText, PlaceholderText, Text, DisplayValue, AltText, Title, TestId). Each prefix serves a distinct purpose: `getBy` throws errors immediately when elements don't exist (useful for asserting presence), `queryBy` returns null for missing elements (perfect for asserting absence), and `findBy` returns promises that retry queries (essential for async elements). This design elegantly handles synchronous assertions, absence checks, and asynchronous rendering without requiring different mental models.

**userEvent vs fireEvent: Realistic User Simulation**

The `userEvent` library represents a sophisticated simulation layer that mirrors actual browser user interactions. When you call `await user.click(button)`, it doesn't simply dispatch a click event. Instead, it simulates the complete interaction sequence: mouseover, mousemove, mousedown, focus, mouseup, click. This sequence matters because real components may respond to any of these events, and testing only the click event misses potential bugs.

Similarly, `userEvent.type()` simulates individual keydown, keypress, and keyup events for each character, triggering input events and properly updating selection ranges. This catches issues like debounce logic, input validation, or character-by-character processing that fireEvent's single synthetic event would miss. The library also handles browser quirks, such as preventing default actions when inputs are disabled and properly managing focus order during Tab key navigation.

**waitFor and Retry Mechanism Internals**

The `waitFor` utility implements a polling mechanism with exponential backoff that's crucial for testing asynchronous behavior. By default, it checks your assertion every 50ms for up to 1000ms, but these values are configurable. The implementation uses mutation observers and RAF (requestAnimationFrame) callbacks to detect DOM changes efficiently, avoiding unnecessary polling when the DOM hasn't changed.

When using `findBy` queries, you're actually using `waitFor` under the hood. The query `await screen.findByText('Hello')` is syntactic sugar for `await waitFor(() => screen.getByText('Hello'))`. This explains why `findBy` automatically handles loading states – it keeps retrying the query until the element appears or the timeout expires.

**Screen vs Container: Debug Output and Query Scope**

The `screen` object provides queries scoped to the entire document.body, offering superior debug output through `screen.debug()`. This method uses pretty-dom to format and syntax-highlight the DOM tree, making it invaluable during test development. When a query fails, RTL automatically prints the accessible tree, showing elements by their roles and accessible names, which helps identify both test issues and accessibility problems.

The container returned by `render()` limits queries to that specific rendered tree, useful when testing multiple components simultaneously or when you need to assert elements are NOT in a specific subtree. However, `screen` is generally preferred because it better matches how users perceive the page as a single document.

**Custom Render Functions and Provider Wrapping**

Production applications typically require components to be wrapped in various providers (Router, Theme, State Management, i18n). RTL's render function accepts a wrapper option that automatically wraps your component during each test. Best practice is creating a custom render function that includes all global providers:

```jsx
function customRender(ui, {
  theme = 'light',
  locale = 'en',
  initialRoute = '/',
  ...options
} = {}) {
  return render(
    <BrowserRouter initialEntries={[initialRoute]}>
      <I18nProvider locale={locale}>
        <ThemeProvider theme={theme}>
          {ui}
        </ThemeProvider>
      </I18nProvider>
    </BrowserRouter>,
    options
  );
}
```

This approach eliminates repetitive setup code and ensures consistent test environments. The function accepts configuration options for provider state, making it flexible enough to test different scenarios while maintaining DRY principles.

**Act Warnings and React's Internal Update Queue**

The "not wrapped in act()" warning occurs when React state updates happen outside React's knowledge during tests. React batches state updates and flushes them synchronously in tests, but async operations (setTimeout, promises, fetch) complete after the test function's synchronous execution. The `act()` utility tells React to flush all pending effects and updates before proceeding.

Modern RTL largely eliminates manual `act()` usage by wrapping user interactions and async queries automatically. However, understanding act() remains crucial when testing custom async logic or third-party libraries. The warning is React protecting you from race conditions where assertions run before state updates complete, producing flaky tests that sometimes pass based on timing.

**Accessibility Testing Integration**

RTL's query system doubles as basic accessibility testing. If `getByRole('button')` fails, your button likely has accessibility issues. The library integrates with jest-axe for comprehensive a11y testing: `expect(await axe(container)).toHaveNoViolations()` runs the same checks screen readers use, catching missing labels, invalid ARIA attributes, color contrast issues, and semantic HTML problems.

This integration embeds accessibility into the development workflow rather than treating it as a separate concern. When tests force you to add labels for querying elements, you're simultaneously improving the experience for assistive technology users.

</details>

---

<details>
<summary><strong>🐛 Real-World Scenario: Flaky Tests Causing CI Pipeline Failures</strong></summary>

### 🐛 Real-World Scenario

**Production Bug: Flaky Tests Causing CI Pipeline Failures**

**Context:** An e-commerce platform with 2,500+ React component tests was experiencing random CI failures, with 5-8 tests failing on each run but different tests failing each time. The flakiness rate reached 12%, meaning nearly 1 in 8 test runs failed despite no code changes. This blocked deployments and eroded team confidence in the test suite.

**Initial Symptoms and Metrics:**
- Average CI run time: 14 minutes
- Failure rate: 12% (300 tests failing non-deterministically)
- Most common failures: "Unable to find element", "Expected element not to be in document"
- Time wasted re-running CI: ~2.5 hours per day across team
- Failed deployments due to false negatives: 3-4 per week

**Investigation Process:**

The team first analyzed failure patterns by scraping CI logs for two weeks. They discovered three main failure categories:

1. **Async Race Conditions (45% of failures):** Tests asserting elements appeared/disappeared without proper async queries
2. **Improper Cleanup (30% of failures):** Tests leaving timers, subscriptions, or pending promises that affected subsequent tests
3. **Shared Mutable State (25% of failures):** Tests modifying global objects without restoration

**Root Cause Analysis – Deep Dive:**

**Issue 1: Overuse of getBy for Async Elements**

The codebase had 800+ instances of this anti-pattern:

```jsx
// ❌ FLAKY: Race condition depending on render timing
test('shows user data', () => {
  render(<UserProfile id={123} />);
  expect(screen.getByText('John Doe')).toBeInTheDocument(); // Sometimes fails!
});
```

This test passes if React finishes rendering before the assertion runs but fails if the assertion runs during the initial loading state. The race condition is invisible on fast development machines but manifests in slower CI environments.

**Issue 2: Missing Cleanup for Timers and Subscriptions**

```jsx
// ❌ POLLUTES SUBSEQUENT TESTS
function usePolling(url, interval) {
  useEffect(() => {
    const timer = setInterval(() => fetch(url), interval);
    // Missing cleanup!
  }, [url, interval]);
}

test('polling hook', () => {
  renderHook(() => usePolling('/api/data', 1000));
  // Timer continues running, affecting next test!
});
```

Uncleared timers caused cascading failures. Test A creates a timer, Test B runs and receives unexpected fetch calls from Test A's timer, Test B fails with "Unexpected fetch call".

**Issue 3: Global Object Mutation**

```jsx
// ❌ MODIFIES GLOBAL STATE
test('handles offline mode', () => {
  Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
  // Never restored! All subsequent tests think browser is offline
});
```

**Solution Implementation:**

**Fix 1: Async Query Migration (2 weeks of effort)**

The team ran a codebase-wide transformation using ast-grep to identify and fix async patterns:

```jsx
// ✅ RELIABLE: Proper async query
test('shows user data', async () => {
  render(<UserProfile id={123} />);
  expect(await screen.findByText('John Doe')).toBeInTheDocument();
  // Automatically waits up to 1s for element to appear
});

// ✅ PROPER LOADING + SUCCESS ASSERTION
test('shows loading then data', async () => {
  render(<UserProfile id={123} />);

  // Assert loading state exists
  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  // Wait for data to replace loading state
  expect(await screen.findByText('John Doe')).toBeInTheDocument();
  expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
});
```

**Fix 2: Standardized Cleanup Patterns**

Created a custom render function with automatic cleanup:

```jsx
// utils/test-utils.js
const timers = new Set();
const subscriptions = new Set();

export function customRender(ui, options) {
  const result = render(ui, options);

  // Track any timers/intervals created during test
  const originalSetTimeout = global.setTimeout;
  const originalSetInterval = global.setInterval;

  global.setTimeout = (...args) => {
    const id = originalSetTimeout(...args);
    timers.add(id);
    return id;
  };

  global.setInterval = (...args) => {
    const id = originalSetInterval(...args);
    timers.add(id);
    return id;
  };

  return result;
}

afterEach(() => {
  // Cleanup all tracked timers
  timers.forEach(clearTimeout);
  timers.clear();
  subscriptions.forEach(unsubscribe => unsubscribe());
  subscriptions.clear();
});
```

**Fix 3: Global State Restoration**

```jsx
// utils/test-setup.js
const originalNavigator = { ...navigator };
const originalFetch = global.fetch;

afterEach(() => {
  // Restore all global objects
  Object.keys(navigator).forEach(key => {
    if (navigator[key] !== originalNavigator[key]) {
      navigator[key] = originalNavigator[key];
    }
  });

  global.fetch = originalFetch;
  jest.clearAllMocks();
  jest.clearAllTimers();
});
```

**Results After Fixes:**

- **Flakiness rate:** 12% → 0.3% (40x improvement)
- **CI reliability:** 88% → 99.7%
- **Average CI run time:** 14min → 11min (parallel execution now safe)
- **Failed deployments:** 3-4/week → 1-2/month
- **Developer confidence:** Significantly improved (measured via survey)
- **Time saved:** 2.5 hours/day → 0.1 hours/day (~$50k annual savings for 20-person team)

**Key Lessons:**

1. **Always use findBy for async elements** – The 1-second automatic wait is worth it
2. **Cleanup is non-negotiable** – One leaked timer can cascade into dozens of failed tests
3. **Global mocks must restore** – afterEach should restore every global modification
4. **Test isolation is critical** – Each test should be able to run independently in any order
5. **CI environment differs from local** – Slower CI machines expose race conditions hidden locally

**Interview Answer Template:**

"I encountered flaky tests causing 12% CI failure rates. I analyzed failure patterns and found three root causes: using `getBy` for async elements instead of `findBy`, missing cleanup for timers and subscriptions, and global state mutations without restoration. I implemented standardized cleanup patterns, migrated 800+ tests to use proper async queries, and created custom render utilities with automatic cleanup. This reduced flakiness from 12% to 0.3%, improved CI reliability to 99.7%, and saved ~2.5 hours daily in wasted re-runs."

</details>

---

<details>
<summary><strong>⚖️ Trade-offs: Query Strategy and Testing Approaches</strong></summary>

### ⚖️ Trade-offs

**Query Strategy Selection: Accessibility vs Speed vs Specificity**

**getByRole vs getByTestId**

The fundamental trade-off in RTL is between accessibility-driven queries and specificity. `getByRole` encourages accessible markup but can be slower and more verbose:

```jsx
// ✅ ACCESSIBLE BUT VERBOSE
screen.getByRole('button', { name: /submit/i })

// ❌ FAST BUT MISSES A11Y ISSUES
screen.getByTestId('submit-btn')
```

**Decision Matrix:**

| Factor | getByRole | getByTestId | Use When |
|--------|-----------|-------------|----------|
| **Accessibility** | Forces accessible markup | Bypasses a11y concerns | getByRole: Public UI, getByTestId: Internal components |
| **Specificity** | Can match multiple elements | Guaranteed unique | getByTestId: Complex forms, getByRole: Simple interactions |
| **Maintenance** | Resilient to structure changes | Brittle if IDs change | getByRole: Long-term projects |
| **Performance** | Slower (DOM traversal + role computation) | Fast (direct attribute match) | getByTestId: Large test suites needing speed |
| **Refactoring Safety** | Breaks if accessibility regresses | Breaks if testId removed | getByRole: Better regression detection |

**Recommendation:** Use `getByRole` for all user-facing elements (buttons, inputs, links) and reserve `getByTestId` for complex scenarios where roles are ambiguous (e.g., nested lists, multiple similar elements).

**Real Example:**
A financial dashboard had 50+ buttons on a single page. Using `getByRole('button')` returned arrays requiring filtering. The team adopted a hybrid: `getByRole` for primary actions (submit, cancel) and `getByTestId` for grid cell actions (edit-row-5, delete-row-5).

---

**Testing Strategy: Integration vs Unit vs E2E**

**React Testing Library: Integration-Level Component Tests**

RTL naturally produces integration tests – rendering full component trees with child components. This differs from traditional unit testing that mocks all dependencies.

**Comparison:**

| Aspect | RTL Integration Tests | Jest Unit Tests | E2E (Cypress/Playwright) |
|--------|----------------------|-----------------|--------------------------|
| **Scope** | Component + children + providers | Single component, children mocked | Full application with backend |
| **Speed** | Moderate (10-100ms per test) | Fast (1-10ms per test) | Slow (500-5000ms per test) |
| **Confidence** | High for UI behavior | Low for integration | Highest for user flows |
| **Maintenance** | Moderate (refactoring-resistant) | High (breaks on implementation changes) | High (breaks on UI changes) |
| **Debugging** | Easy (synchronous, debug output) | Easy | Hard (async, headless) |
| **Cost** | Low (runs in Jest) | Low | High (infrastructure, flakiness) |

**Decision Framework:**

**Use RTL when:**
- Testing component behavior and user interactions (90% of frontend tests)
- Verifying conditional rendering, form validation, state updates
- Testing components in isolation but with real child components

**Use Unit Tests when:**
- Testing pure utility functions (formatCurrency, validateEmail)
- Testing complex algorithms without UI (state reducers, data transformations)
- Testing hooks in isolation with `renderHook`

**Use E2E when:**
- Testing critical user flows (signup, checkout, payment)
- Verifying multi-page interactions and navigation
- Testing integration with real backend APIs
- Smoke testing production deployments

**Real Example:**
An e-commerce team had 2,500 tests:
- 2,200 RTL tests (88%): Component behavior, forms, product lists
- 200 unit tests (8%): Price calculations, discount logic, inventory algorithms
- 100 E2E tests (4%): Checkout flow, payment processing, order confirmation

This pyramid structure provided 95% code coverage with fast CI runs (12 minutes) and high confidence in deployments.

---

**Mocking Strategy: MSW vs Direct Mocking vs Real API**

**Mock Service Worker (MSW) vs jest.fn() fetch mocks**

MSW intercepts network requests at the network layer, while direct mocking replaces functions.

| Factor | MSW | Direct fetch Mock | Real API (Test Database) |
|--------|-----|-------------------|-------------------------|
| **Realism** | High (actual HTTP requests) | Medium (mocked function) | Highest (real responses) |
| **Setup Complexity** | Medium (server setup) | Low (jest.fn()) | High (test database, migrations) |
| **Speed** | Fast (in-memory) | Fastest (no network layer) | Slow (network + DB overhead) |
| **Reliability** | High (deterministic responses) | Highest (no network) | Medium (network issues, DB state) |
| **Flexibility** | High (request handlers, delays, errors) | Medium (return values) | Low (must seed DB for each test) |
| **Maintenance** | Low (shared handlers) | High (per-test mocks) | High (DB schema migrations) |
| **Dev Experience** | Excellent (works in browser too) | Good (familiar jest API) | Poor (slow feedback) |

**Decision Guide:**

**Use MSW when:**
- Testing components that make multiple API calls with different endpoints
- Wanting to reuse API mocks in both tests and development (MSW works in browser)
- Testing error scenarios (network failures, 500 errors, timeouts)
- Working with GraphQL APIs (MSW has excellent GraphQL support)

```jsx
// ✅ MSW: Realistic, reusable, handles errors elegantly
const server = setupServer(
  rest.get('/api/users/:id', (req, res, ctx) => {
    return res(ctx.delay(100), ctx.json({ name: 'John' }));
  })
);

// Error simulation
server.use(rest.get('/api/users/:id', (req, res, ctx) => {
  return res(ctx.status(500));
}));
```

**Use Direct Mocking when:**
- Simple tests with one or two API calls
- Testing utility functions that call fetch directly
- Maximum speed is critical (large test suites)

```jsx
// ✅ Direct mock: Simple, fast for isolated tests
global.fetch = jest.fn().mockResolvedValue({
  json: async () => ({ name: 'John' })
});
```

**Use Real API when:**
- Testing API integration layer itself (not component tests)
- Contract testing between frontend and backend
- Smoke tests in staging environment

**Real Example:**
A SaaS dashboard app used MSW for 90% of tests (user flows, data fetching, error handling), direct mocks for 8% (simple utility tests), and real API calls for 2% (contract tests ensuring API schema matches frontend expectations).

---

**userEvent vs fireEvent: Realism vs Simplicity**

`userEvent` simulates realistic user interactions but requires async/await and is slower. `fireEvent` directly dispatches events synchronously.

| Factor | userEvent | fireEvent | Recommendation |
|--------|-----------|-----------|----------------|
| **Realism** | Complete interaction sequence | Single event dispatch | userEvent for user-facing features |
| **Speed** | Slower (multiple events) | Faster (single event) | fireEvent for internal events |
| **API** | Async (await required) | Synchronous | userEvent: Better for most tests |
| **Event Details** | Accurate (bubbling, focus, etc.) | Manual (must specify details) | userEvent: Catches more bugs |

**When fireEvent is acceptable:**
- Testing focus/blur events directly: `fireEvent.focus(input)`
- Testing paste events: `fireEvent.paste(input, { clipboardData: { getData: () => 'text' } })`
- Custom events: `fireEvent(element, new CustomEvent('myEvent'))`

**Best Practice:** Default to `userEvent`, use `fireEvent` only for events that users can't trigger directly.

---

**async/await vs waitFor: Implicit vs Explicit Waiting**

`findBy` queries use `waitFor` internally, creating a choice between implicit (findBy) and explicit (waitFor) waiting.

```jsx
// IMPLICIT: Clean, handles simple cases
expect(await screen.findByText('Hello')).toBeInTheDocument();

// EXPLICIT: Verbose, handles complex assertions
await waitFor(() => {
  expect(screen.getByText('Hello')).toBeInTheDocument();
  expect(screen.getAllByRole('listitem')).toHaveLength(5);
});
```

**Use findBy when:** Single element assertion, element will definitely appear

**Use waitFor when:** Multiple assertions, asserting element disappearance, custom retry logic

**Performance Consideration:** `findBy` has 1000ms timeout by default. If your component loads in 50ms, you're still waiting up to 1000ms unnecessarily. Configure timeout for faster tests: `await screen.findByText('Hello', {}, { timeout: 500 })`.

</details>

---

<details>
<summary><strong>💬 Explain to Junior: Testing Concepts and Patterns</strong></summary>

### 💬 Explain to Junior

**The Library That Changed How We Test**

Imagine you're a chef creating a new recipe. You could test it two ways:

**The Old Way (Enzyme/Traditional Testing):**
Check that you added exactly 2 eggs, stirred clockwise 50 times, and the mixing bowl is the right brand. But you never taste the food! You're testing HOW you cook, not WHAT you produce.

**The RTL Way (React Testing Library):**
Serve the dish to someone and see if they enjoy it. Did it taste good? Does it look appetizing? Can they eat it easily? You're testing the RESULT, not the process.

React Testing Library applies this philosophy to code: test what users see and do, not the internal React machinery.

---

**The Three Query Types: A Traffic Light Analogy**

Think of finding elements like checking if a traffic light is on:

**getBy – "Must Be There"** (Throws error if missing)
```jsx
screen.getByRole('button', { name: /submit/i })
// Like walking up to an intersection and demanding: "Show me the traffic light!"
// If there's no light → you immediately yell: "ERROR! NO LIGHT!"
```

Use `getBy` when: You know the element exists right now (like a submit button on a form).

**queryBy – "Maybe There"** (Returns null if missing)
```jsx
screen.queryByText(/error message/i)
// Like calmly looking around: "Is there a traffic light here?"
// If no light → you note: "Nope, no light" and move on
```

Use `queryBy` when: You're checking if something is ABSENT (asserting an error message disappeared).

**findBy – "Will Be There Soon"** (Waits up to 1 second)
```jsx
await screen.findByText('John Doe')
// Like waiting at an intersection: "I'll wait for the light to appear..."
// Checks every 50ms for up to 1 second, then gives up
```

Use `findBy` when: Elements appear after loading (API data, animations, delayed renders).

---

**Real-World Analogy: Testing a Coffee Machine**

**Bad Test (Implementation Details):**
```jsx
expect(component.state.temperature).toBe(95); // Internal state
expect(component.props.coffeeBeans).toBe('arabica'); // Props
expect(WaterHeater.mock.calls).toHaveLength(1); // Mocked internals
```

This is like testing a coffee machine by:
- Opening it up and checking the water temperature sensor reads 95°C
- Verifying the bean hopper is labeled "arabica"
- Counting how many times the heating element activated

**Good Test (User Perspective):**
```jsx
await user.click(screen.getByRole('button', { name: /brew coffee/i }));
expect(await screen.findByText(/coffee ready/i)).toBeInTheDocument();
expect(screen.getByRole('img', { name: /coffee cup/i })).toBeVisible();
```

This is like testing by:
- Pressing the "Brew" button (what users do)
- Waiting for the "Coffee Ready" light (what users see)
- Checking that coffee is in the cup (what users get)

If the coffee comes out perfect, WHO CARES how the internal heating element works? If it tastes burnt, the test fails regardless of whether the temperature sensor is accurate.

---

**Why userEvent, Not fireEvent?**

**Analogy: Pressing a Doorbell**

**fireEvent approach:**
```jsx
fireEvent.click(doorbell);
// Like teleporting your finger through the door and directly triggering the bell circuit
```

**userEvent approach:**
```jsx
await user.click(doorbell);
// Like actually walking up to the door, moving your hand, pressing the button, and releasing
```

When you click a real button:
1. Your mouse moves over it (mouseover event)
2. You press down (mousedown event)
3. The button gets focus (focus event)
4. You release (mouseup event)
5. The click registers (click event)

Some components respond to these intermediate events! For example:
- A button might show a tooltip on mouseover
- An input might validate on blur
- A form might track "time to first interaction" on focus

`fireEvent.click()` skips all this and goes straight to click. `userEvent.click()` simulates the real sequence, catching bugs that fireEvent misses.

**Real Bug Example:**

```jsx
// Button shows loading spinner on MOUSEDOWN, not CLICK
function SubmitButton() {
  const [loading, setLoading] = useState(false);

  return (
    <button
      onMouseDown={() => setLoading(true)}
      onClick={handleSubmit}
    >
      {loading ? 'Loading...' : 'Submit'}
    </button>
  );
}

// ❌ MISSES BUG: fireEvent doesn't trigger mousedown
fireEvent.click(button);
expect(screen.queryByText(/loading/i)).toBeInTheDocument(); // FAILS

// ✅ CATCHES BUG: userEvent triggers full sequence
await user.click(button);
expect(screen.getByText(/loading/i)).toBeInTheDocument(); // PASSES
```

---

**The Async Testing Pattern: A Restaurant Order Analogy**

Imagine ordering food at a restaurant:

**Synchronous (getBy):**
```jsx
screen.getByText('Your meal')
// Like demanding your food the instant you sit down
// Waiter: "Uh... we haven't cooked it yet!" → ERROR
```

**Asynchronous (findBy):**
```jsx
await screen.findByText('Your meal')
// Like sitting down and patiently waiting for your order
// Checks every 50ms: "Is my food ready? No? I'll wait..."
// After 1 second: "Okay, this is taking too long" → ERROR
```

**The Pattern:**
```jsx
test('displays user profile after loading', async () => {
  render(<UserProfile id={123} />);

  // 1. Assert loading state (synchronous, must be there NOW)
  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  // 2. Wait for data to appear (asynchronous, will appear SOON)
  expect(await screen.findByText('John Doe')).toBeInTheDocument();

  // 3. Assert loading state disappeared (synchronous, must be gone NOW)
  expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
});
```

This tests three states:
1. **Loading state exists** (immediate assertion)
2. **Data appears** (patient waiting)
3. **Loading state disappears** (immediate assertion after data loads)

---

**Interview Answer Template**

**Question:** "How do you test React components?"

**Strong Answer:**

"I use React Testing Library because it tests components from a user's perspective rather than implementation details. I follow the query priority: `getByRole` for buttons and inputs, `getByLabelText` for form fields, and `getByText` for content. For user interactions, I use the `userEvent` library because it simulates realistic event sequences – when I call `await user.click(button)`, it triggers mouseover, mousedown, focus, mouseup, and click, catching bugs that simple event dispatching misses.

For async behavior, I use `findBy` queries which automatically wait up to 1 second for elements to appear. For example, when testing a component that fetches user data, I first assert the loading state with `getByText(/loading/i)`, then wait for data with `await findByText('John Doe')`, and finally verify the loading state disappeared with `queryByText(/loading/i)`.

I structure tests with Arrange-Act-Assert: render the component, simulate user actions with `userEvent`, and assert the expected outcome. I avoid testing implementation details like state or props, focusing instead on what users see and experience. For API calls, I use Mock Service Worker to intercept requests at the network level, providing realistic mocking that works in both tests and development.

In production, I've used these practices to maintain test suites with 2,000+ tests while keeping CI times under 15 minutes and flakiness under 1%. The key is using async queries consistently, cleaning up side effects in afterEach, and preferring integration tests over mocking every dependency."

**Why This Answers Lands:**

1. **Philosophy first:** Shows you understand WHY, not just HOW
2. **Specific techniques:** Mentions exact APIs (userEvent, findBy, queryBy)
3. **Real async pattern:** Demonstrates proper loading → data → no loading sequence
4. **Avoids pitfalls:** Explicitly mentions common mistakes (implementation details, fireEvent)
5. **Production experience:** Provides metrics (2,000+ tests, 15 min CI, <1% flakiness)
6. **Best practices:** MSW for mocking, Arrange-Act-Assert structure, cleanup

</details>

---

## Question 2: Testing Async Behavior and API Calls

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐
**Time:** 10 minutes
**Companies:** All companies

### Question
How do you test components that fetch data or perform async operations in React Testing Library?

### Answer

**Async Testing** - Use `findBy` queries, `waitFor`, and proper mocking for async operations.

**Key Points:**
1. **findBy queries** - Automatically wait for elements to appear
2. **waitFor** - Wait for assertions to pass
3. **Mock fetch/axios** - Control API responses in tests
4. **Loading states** - Test loading, success, and error states
5. **Act warnings** - Ensure state updates are wrapped in act()

### Code Example

```jsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

// 1. USING findBy (Recommended for async)
test('displays user data after fetch', async () => {
  render(<UserProfile userId={1} />);

  // findBy automatically waits up to 1000ms
  const username = await screen.findByText(/john doe/i);
  expect(username).toBeInTheDocument();
});

// 2. USING waitFor (for complex assertions)
test('updates UI after data loads', async () => {
  render(<Dashboard />);

  await waitFor(() => {
    expect(screen.getByText(/dashboard loaded/i)).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });
});

// 3. MOCK SERVICE WORKER (MSW) - Best Practice
const server = setupServer(
  rest.get('/api/users/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.json({
        id,
        name: 'John Doe',
        email: 'john@example.com'
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('fetches and displays user with MSW', async () => {
  render(<UserProfile userId={1} />);

  // Wait for data to load
  expect(await screen.findByText('John Doe')).toBeInTheDocument();
  expect(screen.getByText('john@example.com')).toBeInTheDocument();
});

// 4. ERROR HANDLING
test('shows error message when fetch fails', async () => {
  server.use(
    rest.get('/api/users/:id', (req, res, ctx) => {
      return res(ctx.status(500), ctx.json({ error: 'Server error' }));
    })
  );

  render(<UserProfile userId={1} />);

  expect(await screen.findByText(/failed to load/i)).toBeInTheDocument();
});

// 5. MOCK FETCH DIRECTLY (alternative to MSW)
beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  global.fetch.mockRestore();
});

test('fetches user data with mocked fetch', async () => {
  const mockUser = { id: 1, name: 'John' };

  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockUser
  });

  render(<UserProfile userId={1} />);

  expect(await screen.findByText('John')).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith('/api/users/1');
});

// 6. TESTING LOADING STATES
test('shows loading spinner then content', async () => {
  render(<UserList />);

  // Initially shows loading
  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  // Loading disappears, content appears
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

  expect(screen.getByRole('list')).toBeInTheDocument();
});

// 7. DEBOUNCED SEARCH
test('debounces search input', async () => {
  render(<SearchUsers />);
  const user = userEvent.setup();

  const searchInput = screen.getByRole('textbox', { name: /search/i });

  // Type quickly
  await user.type(searchInput, 'John');

  // Should only call API once after debounce
  await waitFor(
    () => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    },
    { timeout: 600 } // Wait for debounce delay
  );
});

// 8. POLLING/REFETCHING
test('refetches data on interval', async () => {
  jest.useFakeTimers();
  render(<LiveDashboard refreshInterval={5000} />);

  // Initial fetch
  expect(await screen.findByText(/initial data/i)).toBeInTheDocument();

  // Fast-forward time
  jest.advanceTimersByTime(5000);

  // Should refetch
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  jest.useRealTimers();
});
```

### Common Mistakes

- ❌ Not using `await` with `findBy` queries
- ❌ Using `getBy` for elements that appear async (use `findBy`)
- ❌ Not cleaning up mocks in `afterEach`
- ❌ Testing implementation details of async logic
- ✅ Use MSW for realistic API mocking
- ✅ Test loading, success, and error states
- ✅ Use `findBy` for async elements that will appear

### Follow-up Questions

1. What's the difference between `waitFor` and `findBy`?
2. How do you handle tests with multiple async operations?
3. When would you use MSW vs direct fetch mocking?

### Resources
- [Async Testing](https://testing-library.com/docs/dom-testing-library/api-async/)
- [Mock Service Worker](https://mswjs.io/)
