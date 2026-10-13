# Observability

> **Track:** Infrastructure and delivery
> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

Knowing what a running system is doing: logs, metrics, traces, alerting, SLOs, and responding when it breaks.
Senior interviews ask how you'd find the cause of a production incident — and how you'd know about it before users do.

## Scope

- **In:** structured logging, metrics types and cardinality, distributed tracing and context propagation, OpenTelemetry, dashboards, alerting on symptoms, SLIs/SLOs and error budgets, incident response and postmortems, frontend monitoring (error tracking, real-user monitoring).
- **Out:** profiling a single Node.js process → [Node.js runtime](../nodejs/) · Core Web Vitals measurement → [Web performance](../web-performance/) · gating a rollout on health → [CI/CD](../ci-cd/) · reliability patterns by design → [System design](../system-design/).

## Prerequisites

[Backend patterns](../backend-patterns/).

## Chapters

<!-- generated:chapters:start -->
| # | Chapter | Status |
|---|---|---|
<!-- generated:chapters:end -->

## Not yet mapped

Areas this topic owns that have no chapter yet. Move an item into a chapter's sub-topics when the chapter exists.

- Monitoring vs observability; the three signals and what each answers
- Structured logging: levels, correlation ids, what never to log
- Metrics: counters, gauges, histograms; percentiles; cardinality limits
- Distributed tracing: spans, context propagation, W3C Trace Context, sampling
- OpenTelemetry: API vs SDK, collector, instrumenting Node.js
- Alerting: symptoms vs causes, the four golden signals, alert fatigue
- SLIs, SLOs, and error budgets
- Incident response: on-call, mitigation first, blameless postmortems
- Frontend monitoring: error tracking, source-mapped stack traces, real-user monitoring

## Sources

- [OpenTelemetry docs](https://opentelemetry.io/docs/)
- [W3C Trace Context](https://www.w3.org/TR/trace-context/)
- [Prometheus overview](https://prometheus.io/docs/introduction/overview/)
- [Google SRE book](https://sre.google/sre-book/table-of-contents/) — especially [Monitoring distributed systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Google SRE workbook](https://sre.google/workbook/table-of-contents/)
