# 09 — Navigation and page lifecycle

> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

Moving between views and pages: the History and Navigation APIs behind client-side routing, View Transitions, the back/forward cache, and the events a page gets as it is hidden or left.

## Learning goals

After this chapter you can:

- Build client-side routing on the History API and handle `popstate`
- Say what the Navigation API changes
- Animate a route change with a View Transition
- Keep a page eligible for the back/forward cache and pick the right lifecycle event

## Sub-topics

Coverage checklist: each concept points to the questions covering it; `→ —` marks a gap.

- History API: `pushState()`, `replaceState()`, `popstate`, state objects, scroll restoration → —
- Navigation API: the `navigate` event, `intercept()`, entries → —
- View Transitions: `document.startViewTransition()`, cross-document `@view-transition` → —
- Back/forward cache: eligibility, `pageshow` and `persisted`, why `unload` blocks it → —
- Page lifecycle: `visibilitychange`, `pagehide`, `beforeunload`, freezing → —

## Questions

<!-- generated:questions:start -->
| # | Question | Difficulty | Status |
|---|---|---|---|
<!-- generated:questions:end -->

## Sources

- [HTML — Navigation and session history APIs](https://html.spec.whatwg.org/multipage/nav-history-apis.html)
- [HTML — Navigation API](https://html.spec.whatwg.org/multipage/nav-history-apis.html#navigation-api)
- [CSS View Transitions Level 1](https://drafts.csswg.org/css-view-transitions-1/)
- [CSS View Transitions Level 2](https://drafts.csswg.org/css-view-transitions-2/)
- [HTML — Browsing the web](https://html.spec.whatwg.org/multipage/browsing-the-web.html)
- [Page Lifecycle](https://wicg.github.io/page-lifecycle/)
