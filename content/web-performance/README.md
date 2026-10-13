# Web performance

> **Track:** Engineering practice
> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

Measuring and improving how fast pages load and respond: Core Web Vitals, the critical path, JavaScript cost, and the main thread.
Interviews use it to test whether you can find a bottleneck with data instead of guessing.

## Scope

- **In:** Core Web Vitals and how they're measured (lab vs field), loading performance (critical rendering path, resource hints, priorities, caching for asset delivery), images and fonts, JavaScript cost (bundle size, code splitting, hydration), runtime responsiveness (long tasks, layout thrashing, scheduling), profiling.
- **Out:** how the rendering pipeline works → [Browser runtime](../browser/) · engine optimizations → [JavaScript](../javascript/) · bundler configuration → [Tooling](../tooling/) · server-side caching → [Caching](../caching/) · TCP, TLS, and HTTP/2–3 on the wire → [Networking](../networking/).

## Prerequisites

[Browser runtime](../browser/).

## Chapters

<!-- generated:chapters:start -->
| # | Chapter | Status |
|---|---|---|
<!-- generated:chapters:end -->

## Not yet mapped

Areas this topic owns that have no chapter yet. Move an item into a chapter's sub-topics when the chapter exists.

- Core Web Vitals: LCP, INP, CLS — what each measures and how to improve it
- Measurement: lab vs field data, RUM, Performance APIs, Lighthouse and its limits
- Critical rendering path: render-blocking resources, preload, preconnect, `fetchpriority`
- HTTP delivery: caching headers, CDNs, compression, HTTP/2 and HTTP/3
- Images and fonts: formats, responsive images, lazy loading, font loading strategies
- JavaScript cost: bundle size, code splitting, tree-shaking results, hydration
- Main-thread responsiveness: long tasks, yielding, layout thrashing
- Memory: leaks in long-lived apps, detached DOM
- Profiling with browser DevTools

## Sources

- [web.dev Learn Performance](https://web.dev/learn/performance) and [Web Vitals](https://web.dev/articles/vitals)
- [W3C Web Performance Working Group](https://www.w3.org/webperf/) — specs for the Performance APIs
- [MDN Web performance](https://developer.mozilla.org/en-US/docs/Web/Performance)
