# Repo conventions

Rules and layout: `PLAN.md`. Templates: `templates/`.
Record here only conventions not covered there (e.g., maintainer corrections). Delete entries once they're obsolete.

## App (`app/`)
- TypeScript stays `~6.0` until typescript-eslint's peer range allows 7 (it caps at `<6.1`).
- `src/components/ui/` is shadcn-generated: add components with `npx shadcn add`, don't hand-edit; ESLint's react-refresh rule is off there.
- Theme tokens live in `src/index.css`; brand colours are the `link`, `tldr` and `depth-*` utilities.
- Subagents sometimes leave scratch files in `app/`: check `git status` after each one; stage only your own paths when agents commit in parallel.
- Tests: `node:test` files in `app/scripts/lib/*.test.ts`, run by `npm test`. Pure logic gets a test; pages are verified in the browser (390/1024/1440px, light and dark, plus a no-drafts build).
- Modules shared by `src/` and `scripts/` (e.g. `src/content/stats.ts`, `src/lib/contours.ts`) import relatively with `.ts` extensions; `@/` doesn't resolve in Node or the scripts tsconfig.
- Depth colours: use `depthStrokeClass` (`src/lib/depth.ts`) for contour rings; the `--depth-*` ramp must keep ≥ 3:1 against background and muted in both themes.
- Before deleting code, use two signals (grep including dynamic imports, plus git history) and name both in the commit message.
- Pages are prerendered (R19): never read `window`, `document` or `localStorage` at module load or during the first render; use `useSyncExternalStore` with a server snapshot. Every prerendered page must render a `<title>`.
- Session focus and keys: `useShortcuts` (Enter/Space stay native on links and buttons) and `useSessionFocus`.
- Browser-only stores live apart from pure logic so Node tests never compile DOM code: `src/content/reviewStore.ts` (flashcard history) vs `src/content/review.ts`; `src/lib/progress.ts` vs `src/lib/progressTypes.ts`. Never add `/// <reference lib="dom" />` to shared modules.
- Prerendered pages show browser-only counts only after hydration (`useHydrated`), with the space reserved, so the first paint is neutral.
- Route visuals: `RouteLine` (vertical stations, paths only; the roadmap is a status board) and `RouteSummary` (compact, aria-hidden) with `StationMark`/`StationLegend`; states differ by shape as well as colour (check, filled, half, hollow), planned marks use `muted-foreground/70` for 3:1.
