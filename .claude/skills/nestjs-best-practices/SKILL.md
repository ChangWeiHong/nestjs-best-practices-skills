---
name: nestjs-best-practices
description: Enforce NestJS best practices for Drizzle, Better Auth, DTO validation, and Swagger. Use for feature modules, controller or DTO reviews, auth refactors, and schema changes.
compatibility: Claude Code and Claude.ai. Best for repositories using NestJS 11, PostgreSQL, Drizzle ORM, Better Auth, class-validator, Swagger, and pnpm.
metadata:
  author: ChangWeiHong
  version: 1.0.0
---

# NestJS Best Practices

Use this skill for work in a NestJS service that follows this stack:

- NestJS 11
- TypeScript strict mode
- Drizzle ORM with PostgreSQL
- Better Auth with `@thallesp/nestjs-better-auth`
- `class-validator` and `class-transformer`
- `@nestjs/swagger`
- `pnpm`

## First Step

Read `references/AGENTS.md` first for the compact routing guide and non-negotiable rules.

## Primary Use Cases

- Generate a new NestJS feature module with the expected controller, service, DTO, and schema patterns.
- Review or refactor an existing NestJS endpoint for auth, validation, response DTO, Swagger, and Drizzle compliance.
- Fix stack drift when generated code introduces Prisma, Passport, repository wrappers, raw rows, or direct `process.env` access.

## Workflow

1. Identify the task type before reading deeper references.
   - Auth or session work: open the relevant files in `references/rules/auth-*.md`
   - DTO or controller work: open the relevant files in `references/rules/dto-*.md` and `references/rules/ctrl-*.md`
   - Database and schema work: open the relevant files in `references/rules/drizzle-*.md`
   - Config, testing, errors, structure, API, or observability work: open only the matching rule files in `references/rules/`
2. Treat `references/rules/*.md` as the source of truth for detailed constraints, examples, and anti-patterns.
3. Open files in `references/examples/` only when the correct implementation shape is unclear or you need a concrete comparison.
4. Apply only the rules relevant to the current task, but always enforce the critical rules.

## Quality Checks

- Confirm the generated or reviewed code matches the stack and does not introduce banned frameworks or patterns.
- Confirm request DTOs, response DTOs, auth behavior, and Swagger annotations are covered where relevant.
- Confirm outputs are consistent with `references/AGENTS.md` before finalizing.

## Always Enforce

- Do not introduce Passport, custom JWT guards, or manual session auth where Better Auth is required.
- Do not return raw Drizzle rows from API responses.
- Do not skip DTO validation for request input.
- Do not read `process.env` directly in services.
- Do not generate Prisma, TypeORM, GraphQL, Fastify, or repository-wrapper patterns for this stack.

## References

- `references/AGENTS.md`: compact agent workflow and rule index
- `references/rules/`: full rule definitions
- `references/examples/feature-module/`: positive examples
- `references/examples/anti-patterns/`: forbidden patterns
- `references/metadata.json`: machine-readable rule inventory
