# Rule Categories and Sections

## Category Taxonomy

| Category | Prefix | Description |
|----------|--------|-------------|
| `drizzle` | `drizzle-` | Drizzle ORM schema, queries, migrations, relations |
| `auth` | `auth-` | Better Auth integration, guards, session management |
| `dto` | `dto-` | Data Transfer Objects, validation, Swagger properties |
| `structure` | `struct-` | Module architecture, file organization |
| `controllers` | `ctrl-` | Controller design, Swagger decoration, routing |
| `services` | `svc-` | Service layer, database access patterns |
| `errors` | `err-` | Exception handling, error responses |
| `config` | `config-` | Configuration, environment variables |
| `testing` | `test-` | Unit and E2E testing patterns |
| `api` | `api-` | REST conventions, HTTP semantics |
| `observability` | `obs-` | Logging, monitoring |
| `tooling` | `tool-` | Git, commits, CI/CD tooling |

## Impact Level Definitions

| Level | Meaning | PR Action |
|-------|---------|-----------|
| CRITICAL | Breaks auth security, data integrity, or type safety | Block PR |
| HIGH | Degrades maintainability or correctness significantly | Require fix before merge |
| MEDIUM-HIGH | Reduces test coverage or API consistency | Fix in same PR if possible |
| MEDIUM | Affects observability or team process | Fix in follow-up |

## Full Rule Inventory

### CRITICAL (5 rules)

- `drizzle-schema-definition` — Drizzle Schema Definition
- `drizzle-no-raw-rows-as-response` — Never Return Raw Drizzle Rows as API Response
- `auth-better-auth-setup` — Better Auth Setup and Integration
- `auth-public-routes` — Public Route Opt-Out with @AllowAnonymous
- `dto-validation` — DTO Validation with class-validator

### HIGH (12 rules)

- `auth-session-access` — Session Access with @Session Decorator
- `config-env-validation` — Environment Variable Validation
- `config-no-process-env` — No process.env in Services
- `ctrl-swagger-decorators` — Swagger Decorators on Controllers
- `ctrl-thin-controllers` — Thin Controllers
- `drizzle-migrations` — Drizzle Migration Workflow
- `drizzle-queries-and-transactions` — Drizzle Queries and Transactions
- `drizzle-relations` — Drizzle Relations Definition
- `dto-swagger-properties` — Swagger Properties on DTOs
- `err-nestjs-exceptions` — NestJS HTTP Exceptions
- `struct-feature-modules` — Feature Module Structure
- `svc-no-repository-ceremony` — No Repository Ceremony in Services

### MEDIUM-HIGH (3 rules)

- `api-rest-conventions` — REST API Conventions
- `test-e2e-supertest` — E2E Testing with Supertest
- `test-unit-services` — Unit Testing Services

### MEDIUM (2 rules)

- `obs-structured-logging` — Structured Logging
- `tool-conventional-commits` — Conventional Commits
