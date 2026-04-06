---
id: auth-public-routes
title: "Public Route Opt-Out with @AllowAnonymous"
category: auth
impact: CRITICAL
tags: [auth, guard, decorator, security]
---

## Intent

Mark public routes with `@AllowAnonymous()` from `@thallesp/nestjs-better-auth`. Never disable the global `AuthGuard` or create per-route guards to bypass it.

## Why

The global `AuthGuard` ensures all routes are protected by default — this is a security-first approach where you must consciously opt out. Disabling the guard globally, or replacing it with per-route opt-in guards, means newly added routes are unauthenticated by default. This is the most common source of authentication bypasses: a developer adds a route, forgets to add a guard, and the endpoint is publicly accessible. `@AllowAnonymous()` makes the public intent explicit and auditable.

## Apply When

- Registration/signup endpoints
- Login endpoints
- Password reset flows
- Any endpoint that must be accessible without authentication

## Do Not Apply When

- User profile endpoints (must be authenticated)
- Any endpoint that reads or writes user-specific data
- Admin endpoints

## Required Pattern

```typescript
// src/users/users.controller.ts
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  // ✅ Explicitly marked as public — anyone can register
  @AllowAnonymous()
  @Post()
  @ApiOperation({ summary: 'Create a new user account' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }

  // No @AllowAnonymous — protected by the global AuthGuard
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async getMe(@Session() session: SessionType): Promise<UserResponseDto> {
    return this.usersService.findById(session.user.id);
  }
}

// src/main.ts — global guard registered once
import { AuthGuard } from '@thallesp/nestjs-better-auth';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const authGuard = app.get(AuthGuard);
  app.useGlobalGuards(authGuard); // ← registered globally, applies to all routes
  await app.listen(3000);
}
```

## Forbidden Pattern

```typescript
// @ts-nocheck
// ❌ Disabling global guard — leaves all routes unprotected by default
app.useGlobalGuards(); // no guard at all

// ❌ Per-route opt-in — new routes are unprotected by default
@UseGuards(AuthGuard) // ❌ must remember to add this on every protected route
@Get(':id')
async findOne() {}

// ❌ Custom guard to bypass Better Auth
@Injectable()
export class SkipAuthGuard implements CanActivate {
  canActivate() { return true; } // ❌ blanket bypass
}

@UseGuards(SkipAuthGuard)
@Post('register')
async register() {}

// ❌ Public decorator from wrong package
import { Public } from '@nestjs/common'; // ❌ not the correct decorator for this stack
```

## Review Checklist

- [ ] `AuthGuard` from `@thallesp/nestjs-better-auth` registered globally in `main.ts`
- [ ] `@AllowAnonymous()` imported from `@thallesp/nestjs-better-auth`
- [ ] All registration, login, and password reset endpoints have `@AllowAnonymous()`
- [ ] No custom guards that bypass or replace the global `AuthGuard`
- [ ] No `@UseGuards()` on individual controllers/methods replacing the global guard
- [ ] `@ApiBearerAuth()` on the controller class (Swagger still documents auth requirement)

## Stack-Specific Notes

- `@AllowAnonymous()` from `@thallesp/nestjs-better-auth` sets metadata that the global `AuthGuard` checks
- The Swagger `@ApiBearerAuth()` on the class-level is still correct even if a method has `@AllowAnonymous()` — it documents that the controller generally requires auth
- Better Auth's own routes (e.g. `/api/auth/**`) are handled by `BetterAuthModule` and do not go through the NestJS route guards
