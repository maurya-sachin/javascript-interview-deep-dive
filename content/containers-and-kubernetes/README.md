# Containers and Kubernetes

> **Track:** Infrastructure and delivery
> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

Packaging a service as a container image and running it on Kubernetes: images, isolation, scheduling, networking, and rollouts.
Backend and platform interviews expect you to explain what a container really is and why a pod restarts.

## Scope

- **In:** what a container is (namespaces, cgroups), images and layers, Dockerfiles and multi-stage builds, image size and security, Docker Compose for local stacks, Kubernetes objects (Pods, Deployments, Services, Ingress, ConfigMaps, Secrets), probes and restarts, resource requests and limits, autoscaling, rollouts, Helm.
- **Out:** pipelines that build and deploy images → [CI/CD](../ci-cd/) · managed clusters and infrastructure as code → [Cloud and IaC](../cloud-and-iac/) · load balancing and DNS → [Networking](../networking/) · graceful shutdown inside the app → [Backend patterns](../backend-patterns/).

## Prerequisites

[Node.js runtime](../nodejs/) — especially processes and signals.

## Chapters

<!-- generated:chapters:start -->
| # | Chapter | Status |
|---|---|---|
<!-- generated:chapters:end -->

## Not yet mapped

Areas this topic owns that have no chapter yet. Move an item into a chapter's sub-topics when the chapter exists.

- Containers vs VMs: namespaces, cgroups, what isolation you actually get
- Images: layers, caching, tags vs digests, the OCI image format
- Dockerfiles: multi-stage builds, small and non-root images, `.dockerignore`
- PID 1 and signals in containers: why Node apps don't shut down cleanly
- Docker Compose for local multi-service development
- Kubernetes architecture: control plane, nodes, scheduler, desired state
- Workloads: Pods, Deployments, ReplicaSets, Jobs; rolling updates and rollbacks
- Networking: Services, Ingress, cluster DNS
- Configuration: ConfigMaps, Secrets, environment
- Health and capacity: liveness/readiness/startup probes, requests and limits, autoscaling

## Sources

- [Docker docs](https://docs.docker.com/)
- [Docker — Building best practices](https://docs.docker.com/build/building/best-practices/)
- [OCI image specification](https://github.com/opencontainers/image-spec)
- [Kubernetes docs](https://kubernetes.io/docs/home/) — especially [Concepts](https://kubernetes.io/docs/concepts/)
- [Kubernetes — Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [Helm docs](https://helm.sh/docs/)
