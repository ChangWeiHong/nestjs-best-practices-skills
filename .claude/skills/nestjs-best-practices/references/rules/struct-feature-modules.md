---
id: struct-feature-modules
title: "Feature Module Structure"
category: structure
impact: HIGH
tags: [structure, modules, architecture, nestjs]
---

## Intent

Organize code into one NestJS module per feature domain. `AppModule` imports feature modules only and contains no business logic. All Drizzle schemas live in `src/db/schema/`.

## Why

Feature modules enforce separation of concerns and make it possible to understand, test, and modify one domain without touching others. When `AppModule` contains providers and controllers directly, the application becomes a monolith in disguise — you can't see boundaries, can't extract features, and can't reason about dependencies. Centralizing schemas in `src/db/schema/` means there's one place to look for the data model, and all schemas are included in the Drizzle Kit migration scan.

## Apply When

- Any new domain entity or business concept
- Any new set of related endpoints
- Any module that needs its own database tables

## Do Not Apply When

- Pure utility modules (e.g. `LoggerModule`, `ConfigModule`) that are shared cross-cutting concerns — these live in `src/` directly

## Required Pattern

```
src/
├── app.module.ts             # Root module — imports only
├── main.ts                   # Bootstrap
├── db/
│   └── schema/
│       ├── index.ts          # Re-exports: export * from './users.schema'
│       ├── users.schema.ts
│       └── posts.schema.ts
└── users/
    ├── users.module.ts
    ├── users.controller.ts
    ├── users.service.ts
    └── dto/
        ├── create-user.dto.ts
        ├── update-user.dto.ts
        └── user-response.dto.ts
```

```typescript
// src/app.module.ts — imports modules, zero providers/controllers here
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    DatabaseModule,           // provides NodePgDatabase globally
    BetterAuthModule.forRoot({ auth }),
    UsersModule,
    PostsModule,
  ],
})
export class AppModule {}

// src/users/users.module.ts
@Module({
  imports: [DatabaseModule],  // inject db
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],    // export if other modules need it
})
export class UsersModule {}
```

## Forbidden Pattern

```typescript
// @ts-nocheck
// ❌ AppModule with inline providers — no feature boundaries
@Module({
  controllers: [UsersController, PostsController, AuthController],
  providers: [UsersService, PostsService, AuthService, JwtService],
})
export class AppModule {}

// ❌ Schema file outside src/db/schema/
// src/users/user.entity.ts — wrong location, won't be found by drizzle-kit
export const users = pgTable('users', { ... });
```

## Review Checklist

- [ ] One module file per feature (`users.module.ts`, `posts.module.ts`)
- [ ] `AppModule` contains no controllers or providers (only imports)
- [ ] All schema files are in `src/db/schema/` and re-exported from `src/db/schema/index.ts`
- [ ] Feature module imports `DatabaseModule` if it needs database access
- [ ] Module exports `Service` if other modules need to call its service methods
- [ ] File naming follows `{feature}.module.ts`, `{feature}.controller.ts`, `{feature}.service.ts`
- [ ] DTOs are in `{feature}/dto/` subdirectory

## Stack-Specific Notes

- `DatabaseModule` should be global (`@Global()`) to avoid importing it in every feature module
- `ConfigModule.forRoot({ isGlobal: true })` — same pattern for config
- Drizzle Kit config `schema` glob: `'./src/db/schema/*.schema.ts'` picks up all schema files automatically
- For shared logic (e.g. hashing, pagination), create a `shared/` directory with a `SharedModule`, not a file per feature
