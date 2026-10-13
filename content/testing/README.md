# Testing

> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

Testing JavaScript applications: what to test at which level, how test runners and mocks work, and how to keep tests trustworthy.
Interviews use it to judge whether your code can be changed safely — by you or anyone else.

## Scope

- **In:** test strategy, unit and integration testing, test runners (Vitest, Jest, the Node.js test runner), mocking modules/timers/network, testing async code, component testing, end-to-end testing, coverage, flaky tests, TDD.
- **Out:** accessibility checks → [Accessibility](../accessibility/) · performance measurement → [Web performance](../web-performance/) · running tests in CI → [CI/CD](../ci-cd/).

## Prerequisites

[JavaScript](../javascript/). [React](../react/) for component testing.

## Chapters

<!-- generated:chapters:start -->
| # | Chapter | Status |
|---|---|---|
<!-- generated:chapters:end -->

## Not yet mapped

Areas this topic owns that have no chapter yet. Move an item into a chapter's sub-topics when the chapter exists.

- Strategy: what to test, test levels, cost vs confidence
- Test runners: how they discover, isolate, and run tests
- Test doubles: mocks, stubs, spies, fakes; module mocking
- Async code: promises, fake timers, network mocking
- Component testing: Testing Library principles, user-event, queries by role
- End-to-end testing: Playwright, locators, auto-waiting, test isolation
- Coverage: what it measures and what it doesn't
- Flaky tests: causes and fixes
- TDD and testing legacy code

## Sources

- [Vitest docs](https://vitest.dev/)
- [Node.js test runner](https://nodejs.org/docs/latest/api/test.html)
- [Testing Library docs](https://testing-library.com/docs/)
- [Playwright docs](https://playwright.dev/docs/intro)
