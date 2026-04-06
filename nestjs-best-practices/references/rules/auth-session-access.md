---
id: auth-session-access
title: "Session Access with @Session Decorator"
category: auth
impact: HIGH
tags: [auth, session, decorator, better-auth]
---

## Intent

Use `@Session()` from `@thallesp/nestjs-better-auth` to access the current user's session in controller methods. Type the session as `typeof auth.$Infer.Session` for compile-time type safety.

## Why

The `@Session()` decorator extracts the authenticated session from the request context that Better Auth populates after the global `AuthGuard` verifies the request. Using it ensures you're accessing session data through the framework's typed interface rather than reading from raw `request.user` or `request.session` properties, which are untyped. The `typeof auth.$Infer.Session` type is derived from your Better Auth configuration, so if you add plugins that extend the session (e.g. organization plugin, 2FA plugin), the type updates automatically.

## Apply When

- Any controller method that needs the current user's ID
- Any controller method that accesses user-specific data
- Methods that check user permissions based on session data

## Do Not Apply When

- Routes marked `@AllowAnonymous()` (session may be null)
- Background jobs or scheduled tasks (no HTTP context)

## Required Pattern

```typescript
import { Controller, Get } from '@nestjs/common';
import { Session, AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { auth } from '../auth/auth.config';

// Type alias for convenience
type SessionType = typeof auth.$Infer.Session;

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ✅ @Session() typed to the Better Auth session type
  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async getMe(@Session() session: SessionType): Promise<UserResponseDto> {
    return this.usersService.findById(session.user.id);
  }

  // ✅ Session for authorization check
  @Delete(':id')
  @ApiOperation({ summary: 'Delete user account' })
  @ApiResponse({ status: 204 })
  @HttpCode(204)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: SessionType,
  ): Promise<void> {
    if (session.user.id !== id) {
      throw new ForbiddenException('Cannot delete another user\'s account');
    }
    return this.usersService.remove(id);
  }
}
```

## Forbidden Pattern

```typescript
// @ts-nocheck
// ❌ Accessing raw request.user — untyped, bypasses Better Auth
@Get('me')
async getMe(@Req() request: Request): Promise<UserResponseDto> {
  const userId = (request as any).user?.id; // ❌ any-typed, fragile
  return this.usersService.findById(userId);
}

// ❌ Manual JWT token parsing in controller
@Get('me')
async getMe(@Headers('authorization') auth: string): Promise<UserResponseDto> {
  const token = auth.split(' ')[1];
  const payload = this.jwtService.verify(token); // ❌ bypass Better Auth
  return this.usersService.findById(payload.sub);
}

// ❌ Wrong session type (no type safety)
@Get('me')
async getMe(@Session() session: any): Promise<UserResponseDto> { // ❌ any
  return this.usersService.findById(session.user.id);
}
```

## Review Checklist

- [ ] `@Session()` imported from `@thallesp/nestjs-better-auth`
- [ ] Session parameter typed as `typeof auth.$Infer.Session`
- [ ] `auth` object imported from `auth.config.ts` for type inference
- [ ] No `@Req() req: Request` usage for session/user access
- [ ] No manual JWT parsing in controllers or services
- [ ] `session.user.id` used to identify the current user (not `session.id` which is the session ID)

## Stack-Specific Notes

- `auth.$Infer.Session` is a Better Auth type helper — it reflects the session shape including any plugin extensions
- The session object contains: `session.user` (user data), `session.session` (session metadata including expiry)
- If using the organizations plugin: `session.session.activeOrganizationId` is available
- In services, do not pass the entire session object — extract only the needed values in the controller and pass them as parameters
