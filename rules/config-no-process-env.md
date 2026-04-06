---
id: config-no-process-env
title: "No process.env in Services"
category: config
impact: HIGH
tags: [config, environment, services, nestjs]
---

## Intent

Access all configuration values via `ConfigService` from `@nestjs/config`. Never read `process.env` directly in services, controllers, guards, or any application code below `main.ts` and the config validation module.

## Why

`process.env` bypasses the startup validation, returns `string | undefined` without type safety, and makes the service's configuration dependencies invisible. `ConfigService` provides typed access to validated values, makes dependencies injectable (testable with different configs), and ensures values have been validated before use. A service reading `process.env.DATABASE_URL` directly can start up without a database URL and fail at the first query — `ConfigService` backed by a validated schema fails at startup.

## Apply When

- Any service, guard, interceptor, or filter that needs configuration values
- Any NestJS module factory that needs configuration (`forRootAsync` patterns)

## Do Not Apply When

- `src/main.ts` for the bootstrap port: `app.listen(process.env.PORT ?? 3000)` is acceptable
- `drizzle.config.ts` (Drizzle Kit runs outside NestJS context — `process.env` is required there)
- `src/config/env.validation.ts` itself

## Required Pattern

```typescript
// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../config/env.validation';

@Injectable()
export class UsersService {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  async sendWelcomeEmail(email: string): Promise<void> {
    // ✅ Type-safe config access — inferred as string because of EnvironmentVariables generic
    const appUrl = this.configService.get('BETTER_AUTH_URL', { infer: true });
    // send email with appUrl...
  }
}

// For module configuration (async factory pattern)
DatabaseModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
    url: config.get('DATABASE_URL', { infer: true }),
  }),
})
```

## Forbidden Pattern

```typescript
// @ts-nocheck
// ❌ process.env in service — no validation, no type safety
@Injectable()
export class EmailService {
  private readonly smtpHost = process.env.SMTP_HOST; // ❌ may be undefined

  async send(to: string): Promise<void> {
    // smtpHost is string | undefined — causes runtime error if not set
    const transport = nodemailer.createTransport({ host: this.smtpHost });
  }
}

// ❌ process.env in module factory
DatabaseModule.forRoot({
  url: process.env.DATABASE_URL!, // ❌ bypasses validation, non-null assertion is a lie
})

// ❌ Hardcoded values (should be in config)
@Injectable()
export class AuthService {
  private readonly secret = 'my-secret-key'; // ❌ hardcoded secret
}
```

## Review Checklist

- [ ] No `process.env.*` references in `src/**/*.ts` except `main.ts`, `env.validation.ts`, and `drizzle.config.ts`
- [ ] `ConfigService` injected in constructor with `EnvironmentVariables` generic: `ConfigService<EnvironmentVariables, true>`
- [ ] Config values accessed with `configService.get('KEY', { infer: true })` for type inference
- [ ] `ConfigModule` imported in any module whose providers use `ConfigService`
- [ ] (Or `ConfigModule.forRoot({ isGlobal: true })` so it's available everywhere)

## Stack-Specific Notes

- The `true` second generic on `ConfigService<EnvironmentVariables, true>` makes `.get()` throw if the key is missing (no `undefined` in return type)
- `{ infer: true }` in `.get()` options enables TypeScript to infer the return type from `EnvironmentVariables`
- Grep for `process\.env` to audit violations: `grep -r "process\.env" src/ --include="*.ts" --exclude="main.ts"`
