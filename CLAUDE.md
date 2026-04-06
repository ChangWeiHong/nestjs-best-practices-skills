# Claude Code Instructions

## FIRST: Read AGENTS.md

Before generating any NestJS code, read `AGENTS.md` in full. It contains all the rules and patterns for this stack.

## Stack

This project uses:
- **NestJS 11** with TypeScript strict mode
- **Drizzle ORM** (NOT TypeORM, NOT Prisma)
- **Better Auth** via `@thallesp/nestjs-better-auth` (NOT Passport.js, NOT custom JWT)
- **PostgreSQL** as the database
- **pnpm** as the package manager
- **class-validator + class-transformer** for validation
- **@nestjs/swagger** for API documentation

## NEVER Generate

- `@prisma/client` or Prisma schema files
- `typeorm` entities or repositories
- `passport` strategies or `passport-jwt`
- GraphQL schemas or resolvers
- Fastify adapters (use Express)
- `yarn` or `npm` commands (use `pnpm`)
- `console.log` (use `new Logger(ClassName.name)`)
- `process.env` in services (use `ConfigService`)
- Raw `Error` throws (use NestJS HTTP exceptions)
- Custom JWT guards or middleware
- Repository classes wrapping Drizzle (`*.repository.ts`)

## ALWAYS Generate

- Feature modules with proper separation
- Response DTOs (never return raw Drizzle rows)
- `@ApiProperty` on every DTO field
- `@ApiTags`, `@ApiOperation`, `@ApiResponse` on every controller
- `@AllowAnonymous()` for public routes (never disable global guard)
- Validation with class-validator decorators on all input DTOs
- Structured logging with `this.logger = new Logger(ClassName.name)`

## Build

```bash
pnpm build  # compiles rules/*.md → AGENTS.md
```
