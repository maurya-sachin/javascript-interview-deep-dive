# System design

> **Track:** Engineering practice
> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

Designing systems that scale and stay up: scalability, consistency, reliability patterns, and the classic design questions — backend and frontend.
The system design round is often the one that decides seniority, and it rewards a method more than memorized diagrams.

## Scope

- **In:** the interview method (requirements, estimates, trade-offs), stateless services and horizontal scaling, replication and sharding, consistency models and CAP/PACELC, consensus at a high level, reliability patterns (timeouts, retries, circuit breakers, bulkheads), sagas, classic backend designs, frontend system design.
- **Out:** the building blocks in depth → [HTTP and APIs](../http-and-apis/), [Databases](../databases/), [Caching](../caching/), [Messaging and jobs](../messaging-and-jobs/) · running it → [Cloud and IaC](../cloud-and-iac/), [Observability](../observability/) · algorithmic complexity → [Data structures and algorithms](../data-structures-and-algorithms/).

## Prerequisites

[HTTP and APIs](../http-and-apis/), [Databases](../databases/), [Caching](../caching/).

## Chapters

<!-- generated:chapters:start -->
| # | Chapter | Status |
|---|---|---|
<!-- generated:chapters:end -->

## Not yet mapped

Areas this topic owns that have no chapter yet. Move an item into a chapter's sub-topics when the chapter exists.

- The method: clarifying requirements, back-of-the-envelope estimates, stating trade-offs
- Scaling: stateless services, horizontal vs vertical scaling, load balancing at design level
- Data at scale: replication, read replicas, sharding and partition keys, hot spots
- Consistency: strong vs eventual, read-your-writes, CAP and PACELC, quorums
- Consensus and leader election: what Raft solves, at interview depth
- Reliability patterns: timeouts, retries with backoff, circuit breakers, bulkheads, load shedding
- Distributed transactions: two-phase commit vs sagas
- Classic designs: URL shortener, rate limiter, news feed, chat, notification system
- Frontend system design: component architecture, data flow, rendering strategy, offline, performance budgets

## Sources

- [Azure Architecture Center — Cloud design patterns](https://learn.microsoft.com/en-us/azure/architecture/patterns/)
- [AWS Well-Architected — Reliability pillar](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html)
- [Jepsen — Consistency models](https://jepsen.io/consistency)
- [Raft](https://raft.github.io/) — the consensus algorithm and its paper
- [Dynamo paper](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf) — Amazon, SOSP 2007
- [Google SRE book](https://sre.google/sre-book/table-of-contents/)
