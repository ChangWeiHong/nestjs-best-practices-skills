---
id: dto-validation
title: "DTO Validation with class-validator"
category: dto
impact: CRITICAL
tags: [dto, validation, class-validator, security]
---

## Intent

Use class-validator decorated DTO classes for all input validation, with a global `ValidationPipe` configured with `whitelist: true`, `forbidNonWhitelisted: true`, and `transform: true`.

## Why

Unvalidated input is the root cause of injection attacks, unexpected behavior, and data corruption. `whitelist: true` strips properties not defined in the DTO, preventing mass assignment. `forbidNonWhitelisted: true` rejects requests with extra properties rather than silently stripping them, which helps clients identify incorrect usage early. `transform: true` enables automatic type coercion (e.g. string `"123"` → number `123` from query params) and `class-transformer` plain-to-class conversion. Without the global pipe, validation only works where explicitly applied, creating gaps.

## Apply When

- Every `@Body()` parameter in a controller
- Every `@Query()` parameter in a controller (use `@IsOptional()` for optional query params)
- Every `@Param()` that needs type coercion (use `ParseUUIDPipe` for UUIDs, `ParseIntPipe` for integers)

## Do Not Apply When

- Response DTOs (these describe output shape, not input validation)
- `@Session()` parameters (typed via Better Auth, not validated via class-validator)

## Required Pattern

```typescript
// src/main.ts — global pipe with all three options
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,              // strip extra properties
  forbidNonWhitelisted: true,   // reject requests with extra properties
  transform: true,              // coerce types + plain-to-class
}));

// src/users/dto/create-user.dto.ts
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Display name', example: 'Jane Doe', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Password (min 8 chars)', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}

// Controller using the DTO
@Post()
async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
  return this.usersService.create(dto);
}
```

## Forbidden Pattern

```typescript
// @ts-nocheck
// ❌ Using plain object type — no validation
@Post()
async create(@Body() body: { email: string; name: string }): Promise<UserResponseDto> {
  // body.email could be anything — no validation
}

// ❌ Missing ValidationPipe or using it without whitelist
app.useGlobalPipes(new ValidationPipe()); // ❌ missing whitelist, forbidNonWhitelisted, transform

// ❌ Manual validation in service
async create(dto: CreateUserDto): Promise<UserResponseDto> {
  if (!dto.email || !dto.email.includes('@')) {
    throw new BadRequestException('Invalid email'); // ❌ duplicate validation, fragile
  }
}

// ❌ Using `any` typed body
@Post()
async create(@Body() body: any): Promise<UserResponseDto> {} // ❌ no type safety, no validation
```

## Review Checklist

- [ ] Global `ValidationPipe` configured with `whitelist`, `forbidNonWhitelisted`, `transform` all set to `true`
- [ ] Every `@Body()` parameter uses a dedicated DTO class (not plain object type)
- [ ] Every property in input DTOs has at least one class-validator decorator
- [ ] Email fields use `@IsEmail()`
- [ ] String fields use `@IsString()` plus length constraints where appropriate
- [ ] Optional fields use `@IsOptional()` as the first decorator
- [ ] DTO class name follows `Create{Feature}Dto`, `Update{Feature}Dto` naming
- [ ] UUID path params use `ParseUUIDPipe`: `@Param('id', ParseUUIDPipe) id: string`

## Stack-Specific Notes

- Install both `class-validator` and `class-transformer` — they're separate packages
- `@IsOptional()` must be the first decorator on optional fields
- For partial update DTOs, extend the create DTO with `PartialType` from `@nestjs/swagger` (not `@nestjs/mapped-types`) to preserve Swagger metadata: `export class UpdateUserDto extends PartialType(CreateUserDto) {}`
- Query params come in as strings — use `@Type(() => Number)` from class-transformer for numeric query params when using `transform: true`
