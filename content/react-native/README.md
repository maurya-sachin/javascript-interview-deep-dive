# React Native and Expo

> **Track:** Frontend
> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

How React renders to native iOS and Android views: the New Architecture, native modules, navigation, and shipping with Expo.
Mobile interviews test whether you know where JavaScript ends and native begins — and what that costs in performance and releases.

## Scope

- **In:** the New Architecture (JSI, Fabric, TurboModules), Hermes, core components and styling, layout with Yoga, lists and performance, navigation and Expo Router, native modules and config plugins, platform differences, Expo's managed workflow and development builds.
- **Out:** React itself → [React](../react/) · client state and server data → [State and data fetching](../state-and-data-fetching/) · build pipelines, store releases, and OTA updates → [CI/CD](../ci-cd/) · login flows and token storage → [Authentication](../authentication/).

## Prerequisites

[React](../react/). [JavaScript](../javascript/) — especially the event loop.

## Chapters

<!-- generated:chapters:start -->
| # | Chapter | Status |
|---|---|---|
<!-- generated:chapters:end -->

## Not yet mapped

Areas this topic owns that have no chapter yet. Move an item into a chapter's sub-topics when the chapter exists.

- Architecture: JSI, Fabric renderer, TurboModules, how the New Architecture replaced the bridge
- Hermes: bytecode precompilation, what it changes about startup and debugging
- Core components, `StyleSheet`, and Flexbox layout with Yoga — how it differs from CSS on the web
- Lists: `FlatList`, virtualization, keys, and why long lists drop frames
- Performance: JS thread vs UI thread, re-renders, animations off the JS thread
- Navigation: stacks, tabs, deep links; Expo Router's file-based routes
- Native code: native modules, Expo Modules API, config plugins, prebuild
- Platform differences: `Platform` checks, permissions, safe areas, keyboard handling
- Expo: managed workflow vs bare, Expo Go vs development builds
- Storage and offline: AsyncStorage, SQLite, secure storage

## Sources

- [React Native docs](https://reactnative.dev/docs/getting-started)
- [React Native architecture](https://reactnative.dev/architecture/landing-page)
- [React Native performance overview](https://reactnative.dev/docs/performance)
- [Expo docs](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
