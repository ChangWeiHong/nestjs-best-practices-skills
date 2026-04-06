---
id: err-nestjs-exceptions
title: "NestJS HTTP Exceptions"
category: errors
impact: HIGH
tags: [errors, exceptions, http, nestjs]
---

## Intent

Throw NestJS built-in HTTP exceptions (`NotFoundException`, `ConflictException`, etc.) from services and controllers. Catch database errors and rethrow as appropriate HTTP exceptions. Never throw raw `Error` objects from business logic.

## Why

NestJS's global exception filter converts `HttpException` subclasses to correctly structured HTTP responses with the right status code and message. Raw `Error` objects are caught by the default filter and returned as 500 Internal Server Error with a generic message — the actual error is lost for the client. Using the correct exception type (404 vs 409 vs 422) gives clients the information they need to handle errors correctly. Catching database errors and rethrowing as HTTP exceptions also prevents internal details (SQL state, constraint names) from leaking to clients.

## Apply When

- Resource not found: `NotFoundException`
- Duplicate/conflict: `ConflictException`
- Bad input (beyond validation): `UnprocessableEntityException`
- Unauthorized: `UnauthorizedException`
- Forbidden (authenticated but not allowed): `ForbiddenException`
- Database constraint violations: catch and rethrow as `ConflictException`

## Do Not Apply When

- Truly unexpected errors (let them propagate as 500 — that's correct)
- Logging: log the original error before rethrowing

## Required Pattern

```typescript
import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  async findById(id: string): Promise<UserResponseDto> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return this.toResponseDto(user);
  }

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    try {
      const [user] = await this.db
        .insert(users)
        .values({
          email: dto.email,
          name: dto.name,
          passwordHash: await argon2.hash(dto.password),
        })
        .returning();
      return this.toResponseDto(user);
    } catch (error) {
      // Catch PostgreSQL unique constraint violation
      if ((error as NodePgError).code === '23505') {
        throw new ConflictException('Email address is already in use');
      }
      this.logger.error('Failed to create user', error);
      throw error; // re-throw unexpected errors
    }
  }
}
```

## Forbidden Pattern

```typescript
// @ts-nocheck
// ❌ Raw Error throw — becomes 500 with no useful client message
async findById(id: string) {
  const user = await this.db.select()...;
  if (!user) {
    throw new Error('User not found'); // ❌ wrong — client gets 500
  }
}

// ❌ Returning null instead of throwing — controller must check and throw
async findById(id: string): Promise<User | null> {
  const [user] = await this.db.select()...;
  return user ?? null; // ❌ controller then has to handle null — inconsistent
}

// ❌ Custom error class without extending HttpException
class UserNotFoundError extends Error {
  constructor(id: string) {
    super(`User ${id} not found`); // ❌ still becomes 500
  }
}

// ❌ Exposing DB error details to client
} catch (error) {
  throw new BadRequestException(error.message); // ❌ leaks SQL/constraint details
}
```

## Review Checklist

- [ ] `NotFoundException` thrown when a resource lookup returns null/undefined
- [ ] `ConflictException` thrown for unique constraint violations (catch PG error code `23505`)
- [ ] No raw `throw new Error(...)` in service or controller code
- [ ] Database errors caught, logged, and rethrown as appropriate `HttpException` subclass
- [ ] Exception messages are user-friendly, not SQL/technical details
- [ ] Unexpected errors re-thrown (not swallowed) to produce correct 500 responses

## Stack-Specific Notes

- PostgreSQL error codes: `23505` (unique violation), `23503` (foreign key violation), `23502` (not null violation)
- `NodePgError` type from `pg` package for typed error code access
- All `HttpException` subclasses: `BadRequestException` (400), `UnauthorizedException` (401), `ForbiddenException` (403), `NotFoundException` (404), `MethodNotAllowedException` (405), `ConflictException` (409), `GoneException` (410), `UnprocessableEntityException` (422), `InternalServerErrorException` (500)
- The global NestJS exception filter handles all `HttpException` subclasses automatically — no need for custom exception filters unless you need a different response format
