# Stack Reference

## Pinned Versions

| Package | Version |
|---------|---------|
| Node.js | 24.x |
| NestJS | ^11.0.0 |
| TypeScript | ^5.8.0 |
| Drizzle ORM | ^0.38.0 |
| Drizzle Kit | ^0.30.0 |
| Better Auth | ^1.2.0 |
| @thallesp/nestjs-better-auth | ^2.0.0 |
| class-validator | ^0.14.0 |
| class-transformer | ^0.5.0 |
| @nestjs/swagger | ^8.0.0 |
| Jest | ^29.0.0 |
| Supertest | ^7.0.0 |
| pnpm | ^9.0.0 |
| ESLint | ^9.0.0 (flat config) |
| Prettier | ^3.0.0 |
| Husky | ^9.0.0 |
| Commitlint | ^19.0.0 |
| mise | latest |

## Architectural Decisions

1. **Drizzle ORM, not TypeORM or Prisma** — Drizzle is type-safe, SQL-first, and has no ORM magic. Schema is TypeScript, queries are composable, migrations are plain SQL files you can review.

2. **Better Auth, not Passport.js** — Better Auth provides session management, OAuth, and 2FA out of the box without middleware chains. The NestJS adapter `@thallesp/nestjs-better-auth` provides `BetterAuthModule`, `AuthGuard`, `@AllowAnonymous()`, and `@Session()`.

3. **Global AuthGuard — opt-out, not opt-in** — All routes are protected by default. Public routes use `@AllowAnonymous()`. Never disable the global guard; never create per-route guards to replace it.

4. **No Repository Pattern** — Inject `NodePgDatabase` directly into services. Repository classes add ceremony without value in a Drizzle-based application.

5. **Response DTOs always** — Never return raw Drizzle row types from controllers. Always map to a response DTO class that explicitly defines the API shape and excludes sensitive fields.

6. **Migrations, not push** — Use `drizzle-kit generate` to create SQL migrations, review the SQL, then run `drizzle-kit migrate`. Never use `drizzle-kit push` in production.

7. **ConfigService, not process.env** — All configuration is accessed via NestJS `ConfigService`. Environment variables are validated at startup using a class-validator schema.

8. **Structured logging** — Use `new Logger(ClassName.name)` from `@nestjs/common`. Never use `console.log`. Never log sensitive data (passwords, tokens, PII).

9. **class-validator + ValidationPipe** — Global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`. Every input DTO has class-validator decorators.

10. **Conventional commits** — All commits follow `type(scope): description` format enforced by Commitlint + Husky. Never bypass with `--no-verify`.

## Module Structure

```
src/
├── app.module.ts          # Root module — imports feature modules only
├── main.ts                # Bootstrap — global pipes, guards, swagger
├── config/
│   ├── app.config.ts      # ConfigModule setup + env validation schema
│   └── database.config.ts # DatabaseModule with NodePgDatabase provider
├── db/
│   └── schema/            # All Drizzle table definitions
│       ├── index.ts       # Re-exports all schemas
│       └── *.schema.ts    # One file per domain entity
└── {feature}/             # Feature modules
    ├── {feature}.module.ts
    ├── {feature}.controller.ts
    ├── {feature}.service.ts
    └── dto/
        ├── create-{feature}.dto.ts
        ├── update-{feature}.dto.ts
        └── {feature}-response.dto.ts
```
