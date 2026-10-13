# Cloud and IaC

> **Track:** Infrastructure and delivery
> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

Running software on cloud platforms and describing that infrastructure as code: core services, serverless, the edge, and Terraform-style tooling.
Interviews ask which building block fits a problem — and what it costs in latency, limits, and lock-in.

## Scope

- **In:** cloud service models, core building blocks (compute, storage, managed databases, queues), regions and availability zones, identity and access management, serverless functions and their limits, edge runtimes and CDNs (Cloudflare Workers), infrastructure as code (Terraform, Pulumi), state and drift, cost awareness.
- **Out:** containers and orchestration → [Containers and Kubernetes](../containers-and-kubernetes/) · deployment pipelines → [CI/CD](../ci-cd/) · DNS, TLS, and load balancing → [Networking](../networking/) · cache semantics → [Caching](../caching/) · Next.js runtimes → [Next.js](../nextjs/).

## Prerequisites

[Networking](../networking/) helps.

## Chapters

<!-- generated:chapters:start -->
| # | Chapter | Status |
|---|---|---|
<!-- generated:chapters:end -->

## Not yet mapped

Areas this topic owns that have no chapter yet. Move an item into a chapter's sub-topics when the chapter exists.

- Service models: IaaS, PaaS, serverless, managed services — the shared-responsibility line
- Core building blocks: compute, object storage, managed databases, queues
- Regions, availability zones, and designing for zone failure
- Identity and access management: roles, least privilege, workload identity
- Serverless: cold starts, concurrency limits, timeouts, connection reuse
- Edge: CDNs, edge functions, Cloudflare Workers and their runtime constraints
- Infrastructure as code: declarative vs imperative, Terraform plan/apply, Pulumi
- IaC state: remote state, locking, drift, modules and environments
- Cost: what drives a cloud bill, egress, right-sizing

## Sources

- [AWS documentation](https://docs.aws.amazon.com/)
- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)
- [Cloudflare Workers docs](https://developers.cloudflare.com/workers/)
- [Terraform docs](https://developer.hashicorp.com/terraform/docs)
- [Pulumi docs](https://www.pulumi.com/docs/)
