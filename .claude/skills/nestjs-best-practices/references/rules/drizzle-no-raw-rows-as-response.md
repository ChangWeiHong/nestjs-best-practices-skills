---
id: drizzle-no-raw-rows-as-response
title: "Never Return Raw Drizzle Rows as API Response"
category: drizzle
impact: CRITICAL
tags: [drizzle, dto, response, security]
---

## Intent

Always map Drizzle query results to a response DTO before returning from a service or controller. Never expose the raw `InferSelectModel` type as an API response.

## Why

Raw Drizzle rows contain every column in the table, including sensitive fields like `passwordHash`, `secretKey`, or internal flags. Returning them directly leaks data to API consumers and bypasses the explicit API contract defined by response DTOs. Response DTOs also enable Swagger documentation of the exact response shape. When schema changes (new columns added), raw row responses automatically expose new fields — response DTOs prevent accidental data leakage.

## Apply When

- Every service method that returns data to a controller
- Every controller endpoint that returns a response body
- Paginated responses (map each item in the array)

## Do Not Apply When

- Internal service-to-service calls where both sides own the schema (still prefer DTOs but not blocking)
- Test fixtures that need the full row shape

## Required Pattern

```typescript
// users-response.dto.ts — explicit response shape
export class UserResponseDto {
  @ApiProperty({ description: 'User UUID', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Email address', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: 'Display name', example: 'Jane Doe' })
  name: string;

  @ApiProperty({ description: 'Account creation timestamp', format: 'date-time' })
  createdAt: Date;
  // passwordHash is intentionally excluded
}

// users.service.ts
export class UsersService {
  async findById(id: string): Promise<UserResponseDto> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) throw new NotFoundException(`User ${id} not found`);

    // Always map through toResponseDto before returning
    return this.toResponseDto(user);
  }

  private toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      // passwordHash deliberately omitted
    };
  }
}
```

## Forbidden Pattern

```typescript
// @ts-nocheck
// ❌ Returning raw Drizzle row — leaks passwordHash
async findById(id: string): Promise<User> {  // User = InferSelectModel<typeof users>
  const [user] = await this.db.select().from(users).where(eq(users.id, id));
  return user; // ❌ includes passwordHash, internal flags, etc.
}

// ❌ Returning raw array without mapping
async findAll(): Promise<User[]> {
  return this.db.select().from(users); // ❌ leaks all columns to API
}

// ❌ Using Omit<User, 'passwordHash'> as return type — still a raw row type
async findById(id: string): Promise<Omit<User, 'passwordHash'>> {
  // ❌ Not a DTO class — can't be decorated for Swagger, no validation
}
```

## Review Checklist

- [ ] Service methods return a response DTO class, not `InferSelectModel` or raw table types
- [ ] A `toResponseDto()` private method maps each field explicitly
- [ ] Sensitive fields (`passwordHash`, tokens, internal flags) are excluded from the DTO
- [ ] Controller return type annotation matches the response DTO class
- [ ] `@ApiResponse({ type: UserResponseDto })` on the controller method
- [ ] Response DTO class has `@ApiProperty` on every field

## Stack-Specific Notes

- Response DTO classes do NOT need class-validator decorators (those go on input DTOs)
- For lists, return `UserResponseDto[]` — map with `users.map(u => this.toResponseDto(u))`
- For paginated responses, create a `PaginatedUsersResponseDto` wrapping `items: UserResponseDto[]`
- `toResponseDto()` should be private — it's an implementation detail of the service
