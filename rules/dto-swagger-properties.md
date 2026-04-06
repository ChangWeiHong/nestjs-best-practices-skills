---
id: dto-swagger-properties
title: "Swagger Properties on DTOs"
category: dto
impact: HIGH
tags: [swagger, dto, openapi, documentation]
---

## Intent

Every property on every DTO (both input and response) must have an `@ApiProperty` or `@ApiPropertyOptional` decorator with at minimum a `description` and `example`.

## Why

`@ApiProperty` is how Swagger knows the shape, type, and example values of request and response bodies. Without it, properties either don't appear in Swagger or appear with inferred types that may be incorrect (e.g. TypeScript's `Date` type renders as `object` without `format: 'date-time'`). Complete Swagger documentation means frontend developers can use the Swagger UI as the single source of truth, reducing back-and-forth communication. It also catches API design issues early — writing the description forces you to think about what each field means.

## Apply When

- Every property on input DTOs (`CreateUserDto`, `UpdateUserDto`, query DTOs)
- Every property on response DTOs (`UserResponseDto`)
- Inherited properties from `PartialType` parent (they inherit `@ApiProperty` automatically)

## Do Not Apply When

- Internal service types or interfaces not exposed via the API
- Private fields or computed properties not part of the API contract

## Required Pattern

```typescript
// Input DTO — @ApiProperty with description, example, and constraints
export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'jane@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Display name shown to other users',
    example: 'Jane Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Password for the account',
    minLength: 8,
    writeOnly: true, // ← won't appear in response schema
  })
  @IsString()
  @MinLength(8)
  password: string;
}

// Response DTO — @ApiProperty on every field
export class UserResponseDto {
  @ApiProperty({ description: 'User unique identifier', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'Email address', example: 'jane@example.com' })
  email: string;

  @ApiProperty({ description: 'Display name', example: 'Jane Doe' })
  name: string;

  @ApiProperty({ description: 'Timestamp when the account was created', format: 'date-time' })
  createdAt: Date;
}

// Optional fields — use @ApiPropertyOptional
export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'New display name', example: 'Jane Smith' })
  @IsOptional()
  @IsString()
  name?: string;
}
```

## Forbidden Pattern

```typescript
// @ts-nocheck
// ❌ Properties without @ApiProperty — invisible in Swagger
export class CreateUserDto {
  @IsEmail()
  email: string; // ❌ no @ApiProperty

  @IsString()
  name: string; // ❌ no description or example
}

// ❌ @ApiProperty without description or example
export class UserResponseDto {
  @ApiProperty() // ❌ no description or example
  id: string;

  @ApiProperty({ type: Date }) // ❌ missing format: 'date-time', renders incorrectly
  createdAt: Date;
}
```

## Review Checklist

- [ ] Every DTO property has `@ApiProperty` (required) or `@ApiPropertyOptional` (optional)
- [ ] Every `@ApiProperty` has at minimum `description` and `example`
- [ ] `Date` fields have `format: 'date-time'`
- [ ] UUID fields have `format: 'uuid'`
- [ ] Email fields have `format: 'email'`
- [ ] Password/secret fields in input DTOs have `writeOnly: true`
- [ ] Optional fields use `@ApiPropertyOptional` (not `@ApiProperty({ required: false })`)
- [ ] Array fields have `isArray: true` or `type: [ItemDto]`

## Stack-Specific Notes

- `@ApiPropertyOptional` is shorthand for `@ApiProperty({ required: false })`
- For `PartialType(CreateUserDto)` in update DTOs, `@ApiProperty` is inherited — no need to re-declare on inherited fields
- Enums: use `@ApiProperty({ enum: MyEnum, enumName: 'MyEnum' })` for proper Swagger enum rendering
- Nested objects: `@ApiProperty({ type: () => NestedDto })` — use the lazy function form to avoid circular reference issues
