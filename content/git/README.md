# Git

> **Track:** Infrastructure and delivery
> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

How Git stores history and how teams work with it: the object model, branching and merging, rewriting history, and repository strategies.
Interviews ask it through scenarios — a bad merge, a lost commit, a monorepo that's too slow — that only make sense once the model is clear.

## Scope

- **In:** the object model (blobs, trees, commits, refs), the index, branching, merge vs rebase, conflict resolution, rewriting history, recovering work with the reflog, remotes and fetch/push, branching workflows (trunk-based, GitHub flow), pull requests and code review, monorepo vs polyrepo, large repositories.
- **Out:** workspaces and task runners inside a monorepo → [Tooling](../tooling/) · what runs on a push or pull request → [CI/CD](../ci-cd/).

## Prerequisites

None.

## Chapters

<!-- generated:chapters:start -->
| # | Chapter | Status |
|---|---|---|
<!-- generated:chapters:end -->

## Not yet mapped

Areas this topic owns that have no chapter yet. Move an item into a chapter's sub-topics when the chapter exists.

- Object model: blobs, trees, commits, content addressing, refs and `HEAD`
- Working tree, index, and commits: what `add`, `commit`, `reset`, and `restore` move
- Branching and merging: fast-forward, three-way merge, merge commits, conflicts
- Rebase: how it replays commits, interactive rebase, when not to rewrite history
- Recovery: reflog, detached `HEAD`, undoing a bad merge or reset
- Remotes: fetch vs pull, tracking branches, force-push safely
- Workflows: trunk-based development, GitHub flow, release branches, tags
- Pull requests and code review; commit hygiene and conventional commits
- Monorepo vs polyrepo; scaling large repos (sparse checkout, partial clone)
- Finding regressions with `bisect`; history with `log`, `blame`

## Sources

- [Pro Git](https://git-scm.com/book/en/v2) — the official book
- [Git reference](https://git-scm.com/docs)
- [Pro Git — Git objects](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects)
- [GitHub — Pull requests](https://docs.github.com/en/pull-requests)
