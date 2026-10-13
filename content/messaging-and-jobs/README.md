# Messaging and jobs

> **Track:** Backend
> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

Work that happens outside the request: queues, streams, background jobs, retries, and scheduling.
Interviews use it to test whether you can keep work correct when messages arrive twice, late, or out of order.

## Scope

- **In:** queues vs streams vs pub/sub, delivery guarantees, acknowledgements and visibility timeouts, retries with backoff, dead-letter queues, idempotent consumers, ordering and partitioning, the outbox pattern, background job runners (BullMQ), scheduling and cron, event-driven architecture basics.
- **Out:** request-time idempotency keys → [Backend patterns](../backend-patterns/) · transactions → [Databases](../databases/) · sagas and distributed consistency at architecture level → [System design](../system-design/) · managed queue services and serverless triggers → [Cloud and IaC](../cloud-and-iac/).

## Prerequisites

[Backend patterns](../backend-patterns/), [Databases](../databases/).

## Chapters

<!-- generated:chapters:start -->
| # | Chapter | Status |
|---|---|---|
<!-- generated:chapters:end -->

## Not yet mapped

Areas this topic owns that have no chapter yet. Move an item into a chapter's sub-topics when the chapter exists.

- Why async work: offloading from the request path, smoothing load spikes
- Models: work queues, pub/sub, append-only logs and streams (RabbitMQ vs Kafka vs SQS)
- Delivery guarantees: at-most-once, at-least-once, why exactly-once is mostly a myth
- Acknowledgements, visibility timeouts, and redelivery
- Retries: exponential backoff, jitter, poison messages, dead-letter queues
- Idempotent consumers and deduplication
- Ordering: partitions, consumer groups, per-key ordering
- Transactional outbox: publishing events and writing data atomically
- Background jobs in Node.js: BullMQ, concurrency, job progress, graceful shutdown
- Scheduling: cron, delayed jobs, avoiding duplicate runs across instances

## Sources

- [RabbitMQ docs](https://www.rabbitmq.com/docs)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Amazon SQS Developer Guide](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html)
- [Redis Streams](https://redis.io/docs/latest/develop/data-types/streams/)
- [BullMQ docs](https://docs.bullmq.io/)
- [CloudEvents](https://cloudevents.io/) — CNCF event format specification
