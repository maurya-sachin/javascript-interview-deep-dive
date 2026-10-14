# Repo conventions

Rules and layout: `PLAN.md`. Templates: `templates/`.
Record here only conventions not covered there (e.g., maintainer corrections). Delete entries once they're obsolete.

## App (`app/`)
- TypeScript stays `~6.0` until typescript-eslint's peer range allows 7 (it caps at `<6.1`).
- `src/components/ui/` is shadcn-generated: add components with `npx shadcn add`, don't hand-edit; ESLint's react-refresh rule is off there.
- Theme tokens live in `src/index.css`; brand colours are the `link`, `tldr` and `depth-*` utilities.
- Subagents sometimes leave scratch files in `app/`: check `git status` after each one; stage only your own paths when agents commit in parallel.
