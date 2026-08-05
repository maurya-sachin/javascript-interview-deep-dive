# Testing Interview Preparation

> **90+ questions covering Jest, React Testing Library, E2E testing, mocking strategies, testing patterns, and advanced topics**

Master frontend testing from fundamentals to advanced patterns. Essential for senior frontend interviews.

---

## 📚 Table of Contents

### 1️⃣ Jest Fundamentals (1 file, 8 Q&A)
| File | Topics | Difficulty |
|------|--------|------------|
| [01. Jest Fundamentals](./jest-01-fundamentals.md) | Test structure, matchers, async, mocking, coverage | 🟢 🟡 |

### 2️⃣ React Testing Library (1 file, 5 Q&A)
| File | Topics | Difficulty |
|------|--------|------------|
| [02. React Testing Library](./rtl-01-basics.md) | RTL philosophy, queries, user interactions, async, forms | 🟡 |

### 3️⃣ E2E Testing (1 file, 12 Q&A)
| File | Topics | Difficulty |
|------|--------|------------|
| [03. E2E Testing](./e2e-01-cypress.md) | Cypress, Playwright, test strategies, CI/CD | 🟡 🔴 |

### 4️⃣ Testing Patterns (1 file, 12 Q&A)
| File | Topics | Difficulty |
|------|--------|------------|
| [04. Testing Patterns](./patterns-01-strategies.md) | AAA, TDD, test doubles, coverage strategies | 🟡 |

### 5️⃣ Mocking Strategies (1 file, 12 Q&A)
| File | Topics | Difficulty |
|------|--------|------------|
| [05. Mocking Strategies](./mocking-01-strategies.md) | Mocks, stubs, spies, API mocking, module mocking | 🟡 🔴 |

### 6️⃣ Integration Testing (1 file, 12 Q&A)
| File | Topics | Difficulty |
|------|--------|------------|
| [06. Integration Testing](./README.md) | Component integration, API integration, full-stack testing | 🟡 🔴 |

### 7️⃣ Snapshot Testing (1 file, 10 Q&A)
| File | Topics | Difficulty |
|------|--------|------------|
| [07. Snapshot Testing](./README.md) | Jest snapshots, visual regression, best practices | 🟡 |

### 8️⃣ Accessibility Testing (1 file, 10 Q&A)
| File | Topics | Difficulty |
|------|--------|------------|
| [08. Accessibility Testing](./README.md) | ARIA testing, jest-axe, accessibility best practices | 🟡 🔴 |

### 9️⃣ Testing Hooks (1 file, 10 Q&A)
| File | Topics | Difficulty |
|------|--------|------------|
| [09. Testing Hooks](./README.md) | Custom hooks, renderHook, hook testing patterns | 🟡 |

### 🔟 Testing Context & State (1 file, 12 Q&A)
| File | Topics | Difficulty |
|------|--------|------------|
| [10. Testing Context & State](./README.md) | Context providers, Redux, Zustand, state testing | 🟡 🔴 |

**Total:** 93 Q&A across 10 comprehensive files

---

## ⭐ Most Frequently Asked

1. **Jest Basics** - Test structure, matchers, assertions (⭐⭐⭐⭐⭐)
2. **RTL Queries** - getBy, queryBy, findBy differences (⭐⭐⭐⭐⭐)
3. **Async Testing** - Promises, async/await, waitFor (⭐⭐⭐⭐⭐)
4. **Mocking** - Mock functions, modules, APIs (⭐⭐⭐⭐⭐)
5. **userEvent vs fireEvent** - User interaction testing (⭐⭐⭐⭐)
6. **Testing Hooks** - renderHook, custom hooks (⭐⭐⭐⭐)
7. **E2E Testing** - Cypress/Playwright fundamentals (⭐⭐⭐⭐)
8. **Code Coverage** - Metrics, thresholds, strategies (⭐⭐⭐⭐)
9. **Test Organization** - File structure, test suites (⭐⭐⭐)
10. **Accessibility Testing** - ARIA, jest-axe, a11y (⭐⭐⭐)

---

## 🎯 Learning Path

### Beginners (New to Testing)
1. **Start:** Jest Fundamentals - Learn test structure and matchers
2. **Then:** React Testing Library - Component testing basics
3. **Practice:** Testing Patterns - Understand AAA pattern
4. **Skip:** E2E testing initially (focus on unit/component tests)

### Intermediate (6+ months testing experience)
1. **Master:** Async Testing - Promises, waitFor, findBy
2. **Deep Dive:** Mocking Strategies - Module mocks, API mocking
3. **Learn:** Testing Hooks - Custom hooks testing
4. **Explore:** E2E Testing - Cypress basics

### Advanced (1+ year testing experience)
1. **All Sections** - Complete mastery of all topics
2. **Focus:** Integration Testing - Complex scenarios
3. **Master:** E2E Testing - Playwright, CI/CD integration
4. **Perfect:** Testing Context & State - Advanced patterns
5. **Optimize:** Coverage strategies, performance testing

---

## 🏆 Interview Readiness Checklist

### Junior Level (0-2 years)
- [ ] Can write basic Jest tests with describe/it/expect
- [ ] Understand common matchers (toBe, toEqual, toContain)
- [ ] Can test React components with RTL
- [ ] Know difference between getBy, queryBy, findBy
- [ ] Can test user interactions with fireEvent
- [ ] Understand what code coverage means

### Mid Level (2-4 years)
- [ ] Can test async code with promises/async-await
- [ ] Can mock functions and modules with Jest
- [ ] Proficient with userEvent for realistic interactions
- [ ] Can test forms with validation
- [ ] Understand when to use integration vs unit tests
- [ ] Can write tests for custom hooks
- [ ] Know how to use snapshots appropriately
- [ ] Can debug failing tests effectively

### Senior Level (4+ years)
- [ ] Can design comprehensive testing strategies
- [ ] Expert in mocking complex dependencies
- [ ] Can set up E2E testing pipelines
- [ ] Understand trade-offs between test types
- [ ] Can test complex state management (Redux, etc.)
- [ ] Proficient with accessibility testing
- [ ] Can optimize test performance and CI/CD
- [ ] Can mentor juniors on testing best practices
- [ ] Understand visual regression testing
- [ ] Can handle flaky tests and test stability

---

## 📊 Progress Tracking

**Core Testing**
- [ ] 01. Jest Fundamentals (8 Q&A)
- [ ] 02. React Testing Library (5 Q&A)

**Advanced Testing**
- [ ] 03. E2E Testing (12 Q&A)
- [ ] 04. Testing Patterns (12 Q&A)
- [ ] 05. Mocking Strategies (12 Q&A)

**Specialized Topics**
- [ ] 06. Integration Testing (12 Q&A)
- [ ] 07. Snapshot Testing (10 Q&A)
- [ ] 08. Accessibility Testing (10 Q&A)
- [ ] 09. Testing Hooks (10 Q&A)
- [ ] 10. Testing Context & State (12 Q&A)

---

## 🔑 Key Concepts

### Testing Philosophy
- **Test behavior, not implementation** - Focus on what users see/do
- **Accessibility-first** - Query by roles and labels
- **Confidence over coverage** - 100% coverage doesn't mean bug-free
- **Fast feedback** - Tests should run quickly
- **Independent tests** - No shared state between tests

### Testing Pyramid
```
        /\
       /  \      E2E Tests (Few)
      /____\     - Slow, expensive
     /      \    - High confidence
    /        \
   /__________\  Integration Tests (Some)
  /            \ - Medium speed
 /              \- Good confidence
/________________\ Unit Tests (Many)
                   - Fast, cheap
                   - Quick feedback
```

### Test Types
1. **Unit Tests** - Individual functions/components
2. **Integration Tests** - Multiple components working together
3. **E2E Tests** - Full user workflows
4. **Visual Regression** - UI appearance testing
5. **Accessibility Tests** - A11y compliance
6. **Performance Tests** - Speed and efficiency

### Common Mistakes
- Testing implementation details
- Not testing user interactions
- Over-reliance on snapshots
- Ignoring accessibility
- Flaky tests
- Slow test suites
- Poor test organization
- Not mocking external dependencies

---

## 💡 Testing Best Practices

### DO's ✅
- Write tests that resemble how users interact
- Query by accessible roles and labels
- Use userEvent for realistic interactions
- Test loading states, errors, and edge cases
- Mock external dependencies (APIs, timers)
- Keep tests independent and isolated
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Test accessibility with jest-axe
- Use data-testid sparingly (last resort)

### DON'Ts ❌
- Test implementation details (state, props directly)
- Use shallow rendering
- Over-use snapshots without review
- Write tests just for coverage numbers
- Share state between tests
- Skip error scenarios
- Ignore flaky tests
- Test third-party libraries
- Use sleep/wait with fixed timeouts
- Query by CSS classes or element types

---

## 🛠️ Tools & Libraries

### Core Tools
- **Jest** - Test runner and assertion library
- **React Testing Library** - Component testing
- **@testing-library/user-event** - User interactions
- **@testing-library/jest-dom** - Custom matchers

### E2E Tools
- **Cypress** - E2E testing framework
- **Playwright** - Modern E2E testing
- **Puppeteer** - Browser automation

### Mocking & Testing Utilities
- **MSW (Mock Service Worker)** - API mocking
- **jest-axe** - Accessibility testing
- **@testing-library/react-hooks** - Hook testing

### CI/CD Integration
- **GitHub Actions** - Automated testing
- **CircleCI** - CI/CD pipeline
- **Jenkins** - Build automation

---

## 📈 Coverage Goals

### Recommended Thresholds
```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    }
  }
};
```

### What to Prioritize
1. **Critical paths** - User flows that must work
2. **Business logic** - Core functionality
3. **Error handling** - Edge cases and failures
4. **Complex components** - State-heavy components
5. **Shared utilities** - Reused functions

### What to Skip
- Third-party libraries
- Simple presentational components
- Configuration files
- Type definitions
- Mocks and test utilities

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# Run specific file
npm test -- Button.test.js

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

---

## 📚 Resources

### Official Documentation
- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library Queries](https://testing-library.com/docs/queries/about/)
- [Cypress Docs](https://docs.cypress.io/)
- [Playwright Docs](https://playwright.dev/)

### Articles & Guides
- [Kent C. Dodds - Testing Blog](https://kentcdodds.com/blog?q=testing)
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- [Effective Snapshot Testing](https://kentcdodds.com/blog/effective-snapshot-testing)

### Videos
- [Testing JavaScript with Kent C. Dodds](https://testingjavascript.com/)
- [React Testing Library Tutorial](https://www.youtube.com/watch?v=JKOwJUM4_RM)

---

[← Back to Main README](../README.md) | [Start Learning →](./jest-01-fundamentals.md)

**Total:** 93 comprehensive questions across all testing topics ✅
