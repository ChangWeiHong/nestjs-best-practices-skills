---
id: obs-structured-logging
title: "Structured Logging"
category: observability
impact: MEDIUM
tags: [logging, observability, nestjs, security]
---

## Intent

Use `new Logger(ClassName.name)` from `@nestjs/common` for all logging. Never use `console.log`. Never log sensitive data (passwords, tokens, PII).

## Why

`console.log` bypasses NestJS's logging infrastructure, ignores log levels, and produces unstructured output that's hard to parse in log aggregation systems. NestJS's `Logger` adds context (the class name), respects the configured log level (`LOG_LEVEL` env var), and can be swapped for a structured logging adapter (e.g. Pino, Winston) without changing application code. Logging sensitive data is a security violation — logs are often stored in less-secure systems (log aggregators, S3 buckets) and rotated slowly, making leaked tokens/passwords long-lived risks.

## Apply When

- Any significant operation in a service (creation, updates, errors)
- All error paths
- Any external service call (email, payment, third-party API)

## Do Not Apply When

- Debug noise that would trigger on every request (use `this.logger.debug()` and ensure `LOG_LEVEL` filters it in production)
- Already-handled HTTP exceptions (NestJS logs these automatically)

## Required Pattern

```typescript
import { Injectable, Logger, NotFoundException } from '@nestjs/common';

@Injectable()
export class UsersService {
  // ✅ Class-level logger with class name as context
  private readonly logger = new Logger(UsersService.name);

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    try {
      const user = await this.performCreate(dto);
      // ✅ Log with context, no sensitive data
      this.logger.log(`User created: ${user.id}`);
      return this.toResponseDto(user);
    } catch (error) {
      // ✅ Log errors with error object (NestJS Logger formats it)
      this.logger.error(`Failed to create user for email ${dto.email}`, error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    this.logger.warn(`User account deleted: ${id}`); // ✅ warn level for deletions
    await this.performDelete(id);
  }
}
```

## Forbidden Pattern

```typescript
// @ts-nocheck
// ❌ console.log — unstructured, ignores log level
console.log('User created:', userId);
console.error('Error:', error);

// ❌ Logging sensitive data
this.logger.log(`User login attempt: ${dto.email} password: ${dto.password}`); // ❌ password in log
this.logger.log(`Token: ${sessionToken}`); // ❌ token in log
this.logger.log(`User data: ${JSON.stringify(user)}`); // ❌ may include passwordHash

// ❌ Logger not initialized with class name
private readonly logger = new Logger(); // ❌ no context — can't filter logs by module
private readonly logger = new Logger('my-custom-string'); // ❌ use ClassName.name instead
```

## Review Checklist

- [ ] `new Logger(ClassName.name)` initialized as a private readonly field
- [ ] No `console.log`, `console.error`, `console.warn`, `console.debug` in `src/**/*.ts`
- [ ] Log messages do not contain passwords, tokens, session IDs, or full user objects
- [ ] Error paths use `this.logger.error(message, error)` — the error object as second argument
- [ ] Significant operations (create, delete, external calls) have a log entry
- [ ] Log level used correctly: `log` for info, `warn` for non-fatal issues, `error` for failures, `debug` for verbose

## Stack-Specific Notes

- NestJS `Logger` log levels (from verbose to silent): `verbose`, `debug`, `log`, `warn`, `error`
- Set log level via `app.useLogger(new Logger())` with `LogLevel[]` or via the bootstrap option
- For production structured logging (JSON output), swap to `nestjs-pino` — the `Logger` interface is compatible
- `this.logger.error(message, trace)` — second argument is the stack trace string or error object
- Never log request body or response body at the application level (use HTTP logging middleware only if sanitized)
