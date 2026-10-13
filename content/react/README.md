# React

> **Track:** Frontend
> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

React's rendering model, from components and hooks down to reconciliation, concurrent rendering, and Server Components.
It's the most-asked frontend framework in interviews, and the hard questions are about *when* and *why* React renders.

## Scope

- **In:** components and JSX, state and rendering, hooks, effects, reconciliation and keys, Fiber and concurrent rendering, Suspense, context, refs, Server Components and Server Functions as React defines them, the React Compiler.
- **Out:** routing, caching, and deployment → [Next.js](../nextjs/) · typing components → [TypeScript](../typescript/) · accessible widget patterns → [Accessibility](../accessibility/) · component testing → [Testing](../testing/) · client state libraries and server data → [State and data fetching](../state-and-data-fetching/) · native apps → [React Native and Expo](../react-native/).

## Prerequisites

[JavaScript](../javascript/) — especially closures, `this`, and Promises. [Browser runtime](../browser/) helps.

## Chapters

<!-- generated:chapters:start -->
| # | Chapter | Status |
|---|---|---|
<!-- generated:chapters:end -->

## Not yet mapped

Areas this topic owns that have no chapter yet. Move an item into a chapter's sub-topics when the chapter exists.

- Rendering model: components as functions of state, JSX, render vs commit, purity
- State: `useState`, `useReducer`, batching, state snapshots, lifting state
- Effects: `useEffect` vs `useLayoutEffect`, cleanup, dependencies, when you don't need an effect
- Refs and the DOM: `useRef`, ref callbacks, `ref` as a prop
- Reconciliation: keys, identity, preserving and resetting state
- Fiber and concurrent rendering: priorities, `useTransition`, `useDeferredValue`
- Suspense, `use`, and error boundaries
- Context and state management patterns
- Forms and Actions: `useActionState`, `useOptimistic`, `useFormStatus`
- Server Components and Server Functions: the server/client boundary, serialization
- Performance: memoization, `memo`, the React Compiler, profiling
- Custom hooks and composition patterns

## Sources

- [react.dev](https://react.dev/) — Learn and Reference
- [React blog](https://react.dev/blog) — release notes and RFC summaries
- [reactjs/rfcs](https://github.com/reactjs/rfcs)
- [facebook/react](https://github.com/facebook/react) — source and issues, for confirming edge cases
