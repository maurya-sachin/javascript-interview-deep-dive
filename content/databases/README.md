# Databases

> **Track:** Backend
> **Status:** 🔴 planned · **Published:** 0/0 · **Last verified:** —

Storing and querying data correctly: relational modelling, indexes, transactions and isolation, NoSQL trade-offs, and data access from Node.js.
Backend interviews use databases to test whether you can reason about correctness under concurrency, not just write a query.

## Scope

- **In:** relational modelling and normalization, SQL (joins, aggregation, window functions), indexes and query plans, transactions, isolation levels and locking, NoSQL models (document, key-value, wide-column), schema migrations, ORMs vs query builders, connection pooling, the N+1 problem.
- **Out:** caching in front of a database → [Caching](../caching/) · replication and sharding as distributed-systems design → [System design](../system-design/) · SQL injection → [Web security](../web-security/) · managed database hosting → [Cloud and IaC](../cloud-and-iac/).

## Prerequisites

[Backend patterns](../backend-patterns/) for where data access sits in a service.

## Chapters

<!-- generated:chapters:start -->
| # | Chapter | Status |
|---|---|---|
<!-- generated:chapters:end -->

## Not yet mapped

Areas this topic owns that have no chapter yet. Move an item into a chapter's sub-topics when the chapter exists.

- Relational modelling: keys, normalization, when to denormalize
- SQL: joins, grouping, window functions, subqueries vs CTEs
- Indexes: B-tree basics, composite indexes and column order, covering indexes, reading `EXPLAIN`
- Transactions: ACID, isolation levels, read phenomena, MVCC
- Concurrency control: row locks, `SELECT … FOR UPDATE`, optimistic locking, deadlocks
- NoSQL: document vs key-value vs wide-column; modelling for access patterns
- Schema migrations: zero-downtime changes, expand and contract
- Data access from Node.js: ORMs vs query builders vs raw SQL, the N+1 problem
- Connection pooling: pool sizing, serverless connection limits

## Sources

- [PostgreSQL docs](https://www.postgresql.org/docs/current/)
- [PostgreSQL — Transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- [PostgreSQL — Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [MongoDB manual](https://www.mongodb.com/docs/manual/)
- [node-postgres — Pooling](https://node-postgres.com/features/pooling)
- [Prisma docs](https://www.prisma.io/docs)
