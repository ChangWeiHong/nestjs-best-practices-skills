---
name: nestjs-best-practices
description: Use when generating, reviewing, or refactoring a NestJS codebase that uses Drizzle ORM, Better Auth, class-validator, and Swagger. Apply the repository's stack-specific rules, read AGENTS.md for the compact workflow, then open only the relevant rule files and examples for the task.
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

Read `AGENTS.md` first for the compact routing guide and non-negotiable rules.

## Workflow

1. Identify the task type before reading deeper references.
   - Auth or session work: open the relevant files in `rules/auth-*.md`
   - DTO or controller work: open the relevant files in `rules/dto-*.md` and `rules/ctrl-*.md`
   - Database and schema work: open the relevant files in `rules/drizzle-*.md`
   - Config, testing, errors, structure, API, or observability work: open only the matching rule files
2. Treat `rules/*.md` as the source of truth for detailed constraints, examples, and anti-patterns.
3. Open files in `examples/` only when the correct implementation shape is unclear or you need a concrete comparison.
4. Apply only the rules relevant to the current task, but always enforce the critical rules.

## Always Enforce

- Do not introduce Passport, custom JWT guards, or manual session auth where Better Auth is required.
- Do not return raw Drizzle rows from API responses.
- Do not skip DTO validation for request input.
- Do not read `process.env` directly in services.
- Do not generate Prisma, TypeORM, GraphQL, Fastify, or repository-wrapper patterns for this stack.

## References

- `AGENTS.md`: compact agent workflow and rule index
- `rules/`: full rule definitions
- `examples/feature-module/`: positive examples
- `examples/anti-patterns/`: forbidden patterns
- `metadata.json`: machine-readable rule inventory
