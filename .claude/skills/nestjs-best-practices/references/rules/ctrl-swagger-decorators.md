---
id: ctrl-swagger-decorators
title: "Swagger Decorators on Controllers"
category: controllers
impact: HIGH
tags: [swagger, openapi, documentation, controllers]
---

## Intent

Every controller class must have `@ApiTags` and `@ApiBearerAuth`. Every controller method must have `@ApiOperation` and at least one `@ApiResponse`. No endpoint is left undocumented.

## Why

Auto-generated Swagger documentation is the primary API contract for consumers (frontend, mobile, other teams). Missing `@ApiOperation` means the endpoint appears in Swagger without description. Missing `@ApiResponse` means consumers don't know what the response shape looks like. Missing `@ApiTags` means the endpoint isn't grouped. Incomplete Swagger docs lead to consumers reading source code or making incorrect assumptions about the API. The requirement to document every endpoint creates a forcing function to think about the API contract before implementing.

## Apply When

- Every controller class
- Every public controller method (GET, POST, PUT, PATCH, DELETE)
- Every response status code the endpoint can return (200, 201, 400, 401, 404, 409, etc.)

## Do Not Apply When

- Internal methods or private helper methods (not controller handler methods)
- Health check endpoints can be minimal but should still have `@ApiOperation`

## Required Pattern

```typescript
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Users')           // ← groups endpoints in Swagger UI
@ApiBearerAuth()            // ← marks controller as requiring auth
@Controller('users')
export class UsersController {
  @AllowAnonymous()
  @Post()
  @ApiOperation({
    summary: 'Create a new user account',
    description: 'Registers a new user with email and password.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  @HttpCode(201)
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User found', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.usersService.findById(id);
  }
}
```

## Forbidden Pattern

```typescript
// @ts-nocheck
// ❌ No Swagger decorators at all
@Controller('users')
export class UsersController {
  @Post()
  async create(@Body() dto: CreateUserDto) { // ❌ invisible in Swagger
    return this.usersService.create(dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) { // ❌ no ApiParam, no response type
    return this.usersService.findById(id);
  }
}

// ❌ Partial decoration — @ApiTags but no method-level docs
@ApiTags('Users')
@Controller('users')
export class UsersController {
  @Get(':id')
  // ❌ Missing @ApiOperation and @ApiResponse
  async findOne(@Param('id') id: string) {}
}
```

## Review Checklist

- [ ] `@ApiTags('FeatureName')` on the controller class
- [ ] `@ApiBearerAuth()` on the controller class (even if some methods are `@AllowAnonymous`)
- [ ] `@ApiOperation({ summary: '...' })` on every handler method
- [ ] `@ApiResponse({ status: X, type: ResponseDto })` for the success response
- [ ] `@ApiResponse({ status: 400 })` on POST/PUT/PATCH methods (validation error)
- [ ] `@ApiResponse({ status: 401 })` on all protected endpoints
- [ ] `@ApiResponse({ status: 404 })` on GET/PUT/PATCH/DELETE by ID
- [ ] `@ApiParam` on path parameter methods
- [ ] `@ApiBody` on POST/PUT/PATCH methods (optional if type is inferred from `@Body()` DTO)

## Stack-Specific Notes

- `@nestjs/swagger` version ^8.0.0
- Enable Swagger in `main.ts`:
  ```typescript
  const config = new DocumentBuilder()
    .setTitle('API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  ```
- `type: ResponseDto` in `@ApiResponse` enables schema generation — must be a class, not an interface
- For arrays: `type: [UserResponseDto]` or `isArray: true` option
