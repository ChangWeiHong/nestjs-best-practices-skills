---
id: config-env-validation
title: "Environment Variable Validation"
category: config
impact: HIGH
tags: [config, validation, environment, startup]
---

## Intent

Validate all required environment variables at application startup using a class-validator schema passed to `ConfigModule.forRoot({ validate })`. The application must fail fast with a descriptive error if required variables are missing or invalid.

## Why

Missing or malformed environment variables cause cryptic runtime errors deep in the application — a database connection error minutes after startup instead of "DATABASE_URL is required" at boot. Startup validation catches misconfiguration immediately, makes the required configuration explicit and documentable, and prevents deploying a broken configuration to production. Using a class-validator schema means the same decorators used for DTOs validate config, no extra libraries needed.

## Apply When

- Every environment variable the application reads
- Both required and optional variables (use `@IsOptional()` + default values for optional)

## Do Not Apply When

- (No exceptions — all env vars must be in the validation schema)

## Required Pattern

```typescript
// src/config/env.validation.ts
import { IsString, IsInt, Min, Max, IsUrl, IsOptional, validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';

export class EnvironmentVariables {
  @IsUrl({ require_tld: false }) // allow localhost
  DATABASE_URL: string;

  @IsString()
  BETTER_AUTH_SECRET: string;

  @IsString()
  @IsOptional()
  BETTER_AUTH_URL: string = 'http://localhost:3000';

  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT: number = 3000;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.toString()); // fails fast at startup
  }
  return validated;
}

// src/app.module.ts
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    // ...
  ],
})
export class AppModule {}
```

## Forbidden Pattern

```typescript
// @ts-nocheck
// ❌ No env validation — missing vars cause cryptic runtime errors
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })], // ❌ no validate
})
export class AppModule {}

// ❌ Manual validation scattered in services
@Injectable()
export class DatabaseService {
  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required'); // ❌ validated too late, wrong layer
    }
  }
}

// ❌ Joi schema instead of class-validator (adds a dependency, inconsistent with stack)
ConfigModule.forRoot({
  validationSchema: Joi.object({ DATABASE_URL: Joi.string().required() }),
})
```

## Review Checklist

- [ ] `EnvironmentVariables` class defined in `src/config/env.validation.ts`
- [ ] Every env var used anywhere in the application is declared in `EnvironmentVariables`
- [ ] Required vars have no `@IsOptional()` decorator
- [ ] Optional vars have `@IsOptional()` and a sensible default value
- [ ] `validateEnv` function passed to `ConfigModule.forRoot({ validate: validateEnv })`
- [ ] `ConfigModule.forRoot({ isGlobal: true })` so no need to import in every feature module
- [ ] Application fails to start (throws) when validation fails

## Stack-Specific Notes

- `plainToInstance` with `{ enableImplicitConversion: true }` handles string→number coercion (PORT="3000" → 3000)
- `validateSync` (not `validate`) is used because `validateEnv` is synchronous (called during module initialization)
- `BETTER_AUTH_SECRET` must be a cryptographically secure random string — minimum 32 characters
- For typed access to config in services, use `ConfigService.get<string>('DATABASE_URL')` not `process.env.DATABASE_URL`
