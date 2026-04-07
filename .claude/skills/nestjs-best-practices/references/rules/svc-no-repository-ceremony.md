---
id: svc-no-repository-ceremony
title: "No Repository Ceremony in Services"
category: services
impact: HIGH
tags: [services, drizzle, architecture, simplicity]
---

## Intent

Inject `NodePgDatabase` directly into services and write Drizzle queries inline. Do not create `*.repository.ts` wrapper classes.

## Why

The repository pattern was invented to abstract over ORMs that have complex APIs. Drizzle queries are already type-safe, composable, and testable — adding a repository layer just adds indirection with no benefit. You'd end up with `UserRepository.findById()` that wraps `db.select().from(users).where(eq(users.id, id))` — the repository method signature is less expressive than the Drizzle query itself. In tests, mocking a `NodePgDatabase` is straightforward. Repository classes also create a naming problem: the service becomes `UserService` (wrong) or `UserApplicationService` (awkward).

## Apply When

- Every service that needs database access
- Both simple queries and complex multi-join queries

## Do Not Apply When

- (No exceptions — always inject `NodePgDatabase` directly)

## Required Pattern

```typescript
// src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDatabase } from '../db/database.module'; // or use @Inject(DATABASE_TOKEN)
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { users, type User } from '../db/schema';
import type * as schema from '../db/schema';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectDatabase() private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findById(id: string): Promise<UserResponseDto> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) throw new NotFoundException(`User ${id} not found`);
    return this.toResponseDto(user);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const result = await this.db.select().from(users);
    return result.map(u => this.toResponseDto(u));
  }
}
```

## Forbidden Pattern

```typescript
// @ts-nocheck
// ❌ Unnecessary repository class
@Injectable()
export class UserRepository {
  constructor(private db: NodePgDatabase) {}

  async findById(id: string) {
    return this.db.select().from(users).where(eq(users.id, id)).limit(1);
  }
}

// ❌ Injecting repository instead of db
@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {} // ❌ extra layer

  async findById(id: string) {
    return this.userRepository.findById(id);
  }
}

// ❌ TypeORM-style repository injection (wrong ORM)
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}
}
```

## Review Checklist

- [ ] No `*.repository.ts` files in the codebase
- [ ] Service constructor injects `NodePgDatabase` directly
- [ ] Database queries are written inline in service methods using Drizzle's query builder
- [ ] `DatabaseModule` is imported in the feature module
- [ ] The `db` field is typed as `NodePgDatabase<typeof schema>` for full type inference

## Stack-Specific Notes

- Token injection pattern: use a custom `@InjectDatabase()` decorator or `@Inject(DATABASE_TOKEN)` defined in `DatabaseModule`
- For complex read queries, it's acceptable to extract a private method within the service (not a separate class)
- In tests, provide the `NodePgDatabase` mock directly: `{ provide: DATABASE_TOKEN, useValue: mockDb }`
- `NodePgDatabase` is from `drizzle-orm/node-postgres` — use the generic form `NodePgDatabase<typeof schema>` for typed query API
