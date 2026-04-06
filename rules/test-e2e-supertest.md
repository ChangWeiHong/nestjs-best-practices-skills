---
id: test-e2e-supertest
title: "E2E Testing with Supertest"
category: testing
impact: MEDIUM-HIGH
tags: [testing, e2e, supertest, integration]
---

## Intent

Write E2E tests using Supertest and `@nestjs/testing` against a real test database. Test authentication behavior explicitly — unauthenticated requests to protected routes must return 401.

## Why

E2E tests catch integration issues that unit tests miss: middleware ordering, global pipe behavior, guard application, and actual database interactions. Testing that unauthenticated requests return 401 is the most important E2E test — it verifies the global auth guard is actually applied. Testing with a real (test) database catches query bugs and constraint violations that mocked DB tests miss.

## Apply When

- Every controller endpoint (at minimum: success case and auth failure case)
- Any endpoint with complex business logic spanning multiple DB operations
- Any middleware or guard behavior

## Do Not Apply When

- Business logic already covered thoroughly by service unit tests (avoid duplication)
- Third-party service integrations (mock those at the HTTP level)

## Required Pattern

```typescript
// test/users.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthGuard } from '@thallesp/nestjs-better-auth';

describe('UsersController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule], // real app with test DB
    }).compile();

    app = moduleFixture.createNestApplication({
      bodyParser: false, // ← same as main.ts for Better Auth
    });

    // Register same global configuration as main.ts
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    const authGuard = app.get(AuthGuard);
    app.useGlobalGuards(authGuard);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /users', () => {
    it('creates a user and returns 201', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({ email: 'test@example.com', name: 'Test User', password: 'password123' })
        .expect(201);

      // ✅ Assert specific response fields
      expect(response.body.email).toBe('test@example.com');
      expect(response.body.name).toBe('Test User');
      expect(response.body.id).toBeDefined();
      expect(response.body.passwordHash).toBeUndefined(); // ✅ verify no leakage
    });
  });

  describe('GET /users/me', () => {
    // ✅ Test auth behavior — must return 401 without session
    it('returns 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/users/me')
        .expect(401);
    });
  });
});
```

## Forbidden Pattern

```typescript
// @ts-nocheck
// ❌ No auth behavior test — doesn't verify the guard is working
describe('GET /users/me', () => {
  it('returns 200', async () => {
    // ❌ Missing test: unauthenticated request should return 401
    const response = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', 'Bearer fake-token') // ❌ fake token — test won't reflect reality
      .expect(200);
  });
});

// ❌ Not setting up global pipes/guards — different behavior from production
app = moduleFixture.createNestApplication();
// ❌ Missing: app.useGlobalPipes, app.useGlobalGuards — tests a different app than production
await app.init();

// ❌ Only asserting status code, not response body
it('creates a user', async () => {
  await request(app.getHttpServer())
    .post('/users')
    .send({ email: 'test@example.com', name: 'Test', password: 'pass123' })
    .expect(201); // ❌ doesn't verify the response body shape
});
```

## Review Checklist

- [ ] E2E test file named `{feature}.e2e-spec.ts` in `test/` directory
- [ ] `AppModule` imported (not a stripped-down test module) for real integration
- [ ] `bodyParser: false` set in `createNestApplication()` options (mirrors `main.ts`)
- [ ] Global `ValidationPipe` and `AuthGuard` registered (mirrors `main.ts` setup)
- [ ] Every protected endpoint has an unauthenticated 401 test case
- [ ] Success responses assert specific field values, not just status codes
- [ ] `passwordHash` and other sensitive fields asserted `toBeUndefined()` in responses
- [ ] `afterAll(() => app.close())` to clean up connections

## Stack-Specific Notes

- Test database: set `DATABASE_URL` to a dedicated test DB in `.env.test`
- Run E2E tests: `pnpm jest --config jest-e2e.config.ts`
- Clean test data between tests: truncate tables in `beforeEach` or use database transactions that roll back
- Supertest import: `import * as request from 'supertest'` (CommonJS interop)
- `app.getHttpServer()` returns the raw HTTP server needed by Supertest
