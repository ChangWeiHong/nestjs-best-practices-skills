# Skills Quick Reference

## Category Index

| Category | Rules | Description |
|----------|-------|-------------|
| `drizzle` | 5 | Schema, queries, transactions, migrations, relations |
| `auth` | 3 | Better Auth setup, public routes, session access |
| `dto` | 2 | Validation, Swagger properties |
| `structure` | 1 | Feature module architecture |
| `controllers` | 2 | Thin controllers, Swagger decorators |
| `services` | 1 | No repository ceremony |
| `errors` | 1 | NestJS HTTP exceptions |
| `config` | 2 | Env validation, no process.env |
| `testing` | 2 | Unit tests, E2E with Supertest |
| `api` | 1 | REST conventions |
| `observability` | 1 | Structured logging |
| `tooling` | 1 | Conventional commits |

## All Rules

| ID | Title | Impact |
|----|-------|--------|
| `drizzle-schema-definition` | Drizzle Schema Definition | CRITICAL |
| `drizzle-no-raw-rows-as-response` | Never Return Raw Drizzle Rows | CRITICAL |
| `auth-better-auth-setup` | Better Auth Setup | CRITICAL |
| `auth-public-routes` | Public Route Opt-Out | CRITICAL |
| `dto-validation` | DTO Validation | CRITICAL |
| `struct-feature-modules` | Feature Module Structure | HIGH |
| `ctrl-thin-controllers` | Thin Controllers | HIGH |
| `ctrl-swagger-decorators` | Swagger on Controllers | HIGH |
| `svc-no-repository-ceremony` | No Repository Ceremony | HIGH |
| `dto-swagger-properties` | Swagger on DTOs | HIGH |
| `drizzle-queries-and-transactions` | Queries and Transactions | HIGH |
| `drizzle-migrations` | Migration Workflow | HIGH |
| `drizzle-relations` | Relations Definition | HIGH |
| `err-nestjs-exceptions` | NestJS HTTP Exceptions | HIGH |
| `config-env-validation` | Env Validation | HIGH |
| `config-no-process-env` | No process.env | HIGH |
| `auth-session-access` | Session Access | HIGH |
| `test-unit-services` | Unit Testing Services | MEDIUM-HIGH |
| `test-e2e-supertest` | E2E with Supertest | MEDIUM-HIGH |
| `api-rest-conventions` | REST Conventions | MEDIUM-HIGH |
| `obs-structured-logging` | Structured Logging | MEDIUM |
| `tool-conventional-commits` | Conventional Commits | MEDIUM |

## Impact Level Definitions

- **CRITICAL** — Violation breaks auth security, data integrity, or type safety. Block PR.
- **HIGH** — Violation degrades maintainability or correctness significantly. Require fix before merge.
- **MEDIUM-HIGH** — Violation reduces test coverage or API consistency. Fix in same PR if possible.
- **MEDIUM** — Violation affects observability or team process. Fix in follow-up.
