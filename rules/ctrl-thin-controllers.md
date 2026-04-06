---
id: ctrl-thin-controllers
title: "Thin Controllers"
category: controllers
impact: HIGH
tags: [controllers, architecture, separation-of-concerns]
---

## Intent

Controllers parse the request, delegate to a service, and return the response. Each method should be ≤15 lines. No database queries, business logic, or data transformation in controllers.

## Why

Controllers that contain business logic are hard to test (you'd need to mock HTTP contexts for unit tests), hard to reuse (the same logic can't be called from a job scheduler or event handler), and hard to understand (mixing HTTP parsing with domain logic). Thin controllers mean the service is the authoritative source of business logic, and tests can call the service directly without HTTP overhead. The 15-line limit is a forcing function — if a method exceeds it, business logic has leaked in.

## Apply When

- Every controller method
- Any time you're tempted to add conditional logic or data transformation in a controller

## Do Not Apply When

- (No exceptions — all controllers should be thin)

## Required Pattern

```typescript
// src/users/users.controller.ts
@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ✅ Parse → delegate → return. ~5 lines.
  @AllowAnonymous()
  @Post()
  @ApiOperation({ summary: 'Create a new user account' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  @HttpCode(201)
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }

  // ✅ Pipe-parsed param, session from decorator, delegate
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    return this.usersService.findById(id);
  }
}
```

## Forbidden Pattern

```typescript
// @ts-nocheck
// ❌ Fat controller with DB queries and business logic
@Post()
async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
  // ❌ DB query in controller
  const existing = await this.db.select().from(users)
    .where(eq(users.email, dto.email));
  if (existing.length > 0) {
    throw new ConflictException('Email already in use');
  }

  // ❌ Business logic (password hashing) in controller
  const passwordHash = await argon2.hash(dto.password);

  // ❌ Direct DB insert in controller
  const [user] = await this.db.insert(users)
    .values({ ...dto, passwordHash })
    .returning();

  // ❌ Manual DTO mapping in controller
  const { passwordHash: _, ...response } = user;
  return response as UserResponseDto;
}
```

## Review Checklist

- [ ] Each controller method is ≤15 lines
- [ ] No database imports or queries in controller file
- [ ] No business logic (validation, transformation, conditional flows) in controller
- [ ] No `import { db } from '../db'` or direct database injection in controller
- [ ] Controller only uses: `@Body()`, `@Param()`, `@Query()`, `@Session()`, service method calls
- [ ] Path params use NestJS pipes: `ParseUUIDPipe`, `ParseIntPipe`
- [ ] Controller injects only its feature's service (not other services directly)

## Stack-Specific Notes

- Exception to service delegation: throwing `NotFoundException` for 404 responses is acceptable in the controller if you prefer it there, but consistency matters — pick one layer and stick to it (typically the service)
- `ParseUUIDPipe` validates UUID format and returns 400 automatically — no need to check in service
- For controllers that need to call multiple services (e.g. sending an email after user creation), keep the orchestration in the controller minimal and consider creating a facade service
