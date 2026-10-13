# CI/CD

> **Track:** Infrastructure and delivery
> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

Getting a change from a commit to production safely: pipelines, deployment strategies, feature flags, mobile releases, and secrets.
Interviews ask how you ship without breaking users, and how fast you can undo it when you do.

## Scope

- **In:** continuous integration (pipelines, caching, parallelism, required checks), build artifacts and environments, deployment strategies (rolling, blue-green, canary), rollbacks, feature flags, preview deployments, mobile releases (store builds, signing, OTA updates), secrets in pipelines, supply-chain integrity of builds.
- **Out:** branching and pull requests → [Git](../git/) · what the tests check → [Testing](../testing/) · package managers and bundlers → [Tooling](../tooling/) · rollouts on Kubernetes → [Containers and Kubernetes](../containers-and-kubernetes/) · provisioning infrastructure → [Cloud and IaC](../cloud-and-iac/) · deciding a rollout is unhealthy → [Observability](../observability/).

## Prerequisites

[Git](../git/), [Testing](../testing/).

## Chapters

<!-- generated:chapters:start -->
| # | Chapter | Status |
|---|---|---|
<!-- generated:chapters:end -->

## Not yet mapped

Areas this topic owns that have no chapter yet. Move an item into a chapter's sub-topics when the chapter exists.

- CI pipelines: triggers, jobs, dependency caching, parallelism, running checks
- Build once, deploy many: artifacts, environments, promotion
- Deployment strategies: rolling, blue-green, canary; database changes during a deploy
- Rollbacks vs roll-forward; deploy freezes
- Feature flags: release vs experiment flags, kill switches, flag debt
- Preview deployments per pull request
- Mobile releases: store builds, signing, phased rollouts, OTA updates and runtime versions
- Secrets: storing, scoping, and rotating them in pipelines; OIDC instead of long-lived keys
- Build integrity: pinned actions, provenance, SLSA levels

## Sources

- [GitHub Actions docs](https://docs.github.com/en/actions)
- [GitHub Actions — Using secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)
- [GitLab CI/CD docs](https://docs.gitlab.com/ci/)
- [OpenFeature](https://openfeature.dev/docs/reference/intro/) — vendor-neutral feature flag specification
- [EAS Update](https://docs.expo.dev/eas-update/introduction/) — OTA updates for Expo apps
- [SLSA](https://slsa.dev/) — supply-chain levels for software artifacts
