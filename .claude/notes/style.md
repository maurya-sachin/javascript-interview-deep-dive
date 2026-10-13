# Repo conventions

Rules and layout: `PLAN.md`. Templates: `templates/` (from Phase 2).
Record here only conventions not covered there (e.g., maintainer corrections). Delete entries once they're obsolete.

## App (`app/`)
- TypeScript stays `~6.0` until typescript-eslint's peer range allows 7 (it caps at `<6.1`).
- `src/components/ui/` is shadcn-generated: add components with `npx shadcn add`, don't hand-edit; ESLint's react-refresh rule is off there.
- Theme tokens live in `src/index.css` (R13); brand colours are `link`, `tldr` utilities.
