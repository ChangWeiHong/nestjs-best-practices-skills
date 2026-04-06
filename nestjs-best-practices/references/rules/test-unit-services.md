---
id: test-unit-services
title: "Unit Testing Services"
category: testing
impact: MEDIUM-HIGH
tags: [testing, jest, unit, services]
---

## Intent

Unit test service methods by mocking all dependencies and asserting on specific return values, not just `toBeDefined()`. Every service method must have at least one test for the happy path and one for each error case.

## Why

Tests that only assert `expect(result).toBeDefined()` prove nothing — `undefined` is defined, an empty object is defined. Assertions must verify the actual values returned or the exceptions thrown. Mocking `NodePgDatabase` isolates the service under test from the database, making tests fast and deterministic. Testing error paths (not found, duplicate email) ensures the service throws the correct HTTP exception with the correct message.

## Apply When

- Every public method of every service class
- Happy path (successful operation)
- Every `NotFoundException`, `ConflictException`, or other error the service can throw

## Do Not Apply When

- Private methods (`toResponseDto`) — tested implicitly through public methods
- Integration tests that need real database behavior (use E2E tests for those)

## Required Pattern

```typescript
// src/users/users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { DATABASE_TOKEN } from '../db/database.module';

describe('UsersService', () => {
  let service: UsersService;
  let mockDb: jest.Mocked<{ select: jest.Mock; insert: jest.Mock }>;

  beforeEach(async () => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: DATABASE_TOKEN, useValue: mockDb },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findById', () => {
    it('returns a UserResponseDto when user exists', async () => {
      const mockUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'jane@example.com',
        name: 'Jane Doe',
        passwordHash: 'hashed',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };
      mockDb.limit.mockResolvedValueOnce([mockUser]);

      const result = await service.findById(mockUser.id);

      // ✅ Assert specific values, not just toBeDefined()
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(result.name).toBe(mockUser.name);
      // ✅ Assert sensitive fields are excluded
      expect((result as any).passwordHash).toBeUndefined();
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      await expect(service.findById('nonexistent-id'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
```

## Forbidden Pattern

```typescript
// @ts-nocheck
// ❌ Useless assertions — proves nothing
it('should return a user', async () => {
  const result = await service.findById('some-id');
  expect(result).toBeDefined(); // ❌ this passes even if result is undefined
});

// ❌ No error case tests
describe('findById', () => {
  it('returns user', async () => { /* ... */ });
  // ❌ Missing: 'throws NotFoundException when user not found'
});

// ❌ Real database in unit tests — slow and brittle
beforeEach(async () => {
  const module = await Test.createTestingModule({
    imports: [DatabaseModule], // ❌ real DB in unit test
    providers: [UsersService],
  }).compile();
});
```

## Review Checklist

- [ ] All public service methods have at least one test
- [ ] Happy path tests assert specific field values (id, email, name), not just `toBeDefined()`
- [ ] Error path tests use `rejects.toThrow(SpecificException)`
- [ ] `DATABASE_TOKEN` mocked with `useValue: mockDb`
- [ ] Sensitive fields (passwordHash) asserted to be `undefined` in response DTO tests
- [ ] Test file named `{feature}.service.spec.ts` co-located with the service

## Stack-Specific Notes

- Use `jest.fn().mockReturnThis()` for chainable Drizzle query builder methods
- For `db.transaction()`, mock it as: `mockDb.transaction.mockImplementation(async (fn) => fn(mockDb))`
- `@nestjs/testing` `Test.createTestingModule()` handles DI — no need to instantiate services manually
- Run unit tests with: `pnpm jest --testPathPattern="spec.ts"` (excludes E2E tests)
