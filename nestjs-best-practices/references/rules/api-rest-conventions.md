---
id: api-rest-conventions
title: "REST API Conventions"
category: api
impact: MEDIUM-HIGH
tags: [api, rest, conventions, http]
---

## Intent

Use plural noun resource names, correct HTTP methods for each operation, 201 for resource creation, 204 for deletion, and no envelope wrappers around response bodies.

## Why

Consistent REST conventions mean API consumers can predict endpoint behavior without reading documentation for every endpoint. Wrong HTTP methods (POST for updates, GET with side effects) break caching, cause idempotency bugs, and confuse clients. 200 for creation (instead of 201) removes the `Location` header and makes it impossible for clients to know a new resource was created vs retrieved. Envelope wrappers (`{ data: {...}, status: 'ok' }`) add unnecessary nesting that complicates client deserialization — use HTTP status codes for status.

## Apply When

- Every controller endpoint
- Route path naming
- HTTP method selection
- Response status codes

## Do Not Apply When

- RPC-style internal endpoints (e.g. `/users/merge-accounts`) — acceptable to use verb when no REST resource maps cleanly
- Bulk operations that don't fit standard CRUD (document the deviation)

## Required Pattern

```typescript
@ApiTags('Users')
@Controller('users') // ← plural noun
export class UsersController {
  @Get()                          // GET /users — list all
  @HttpCode(200)
  async findAll(): Promise<UserResponseDto[]> {
    return this.usersService.findAll();
  }

  @Get(':id')                     // GET /users/:id — get one
  @HttpCode(200)
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.usersService.findById(id);
  }

  @Post()                         // POST /users — create
  @HttpCode(201)                  // ← 201 Created, not 200
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }

  @Patch(':id')                   // PATCH /users/:id — partial update
  @HttpCode(200)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')                  // DELETE /users/:id — delete
  @HttpCode(204)                  // ← 204 No Content
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}
```

## Forbidden Pattern

```typescript
// @ts-nocheck
// ❌ Singular resource name
@Controller('user') // ❌ should be 'users'

// ❌ Wrong HTTP method for create
@Get('create')       // ❌ GET with side effects — not idempotent, not cacheable
@Post('getUser')     // ❌ POST for read — wrong method

// ❌ 200 for creation (should be 201)
@Post()
@HttpCode(200)       // ❌ should be 201
async create() {}

// ❌ 200 for deletion (should be 204)
@Delete(':id')
@HttpCode(200)       // ❌ should be 204 (No Content)
async remove() { return { success: true }; } // ❌ response body on DELETE

// ❌ Envelope wrapper
async findAll(): Promise<{ data: UserResponseDto[]; total: number; status: string }> {
  return {
    data: users,
    total: users.length,
    status: 'ok', // ❌ use HTTP status codes for status
  };
}
```

## Review Checklist

- [ ] Controller path uses plural nouns (`users`, `posts`, `organizations`)
- [ ] `@Get()` for reads, `@Post()` for creates, `@Patch()` for partial updates, `@Put()` for full replaces, `@Delete()` for deletes
- [ ] `@HttpCode(201)` on `@Post()` create methods
- [ ] `@HttpCode(204)` on `@Delete()` methods
- [ ] Delete methods return `Promise<void>` (no response body)
- [ ] No envelope wrappers — return the DTO directly or an array of DTOs
- [ ] Path parameters use `:id` (UUID) consistently

## Stack-Specific Notes

- NestJS default response code for `@Post()` is 201 — explicitly set `@HttpCode(201)` for clarity
- NestJS default for all other methods is 200 — explicitly set `@HttpCode(204)` for DELETE
- For nested resources: `@Controller('users/:userId/posts')` — use `@Param('userId', ParseUUIDPipe)`
- Pagination: return `{ items: UserResponseDto[], total: number, page: number, limit: number }` — not an envelope, but a structured paginated response DTO
