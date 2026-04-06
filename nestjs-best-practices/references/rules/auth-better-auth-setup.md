---
id: auth-better-auth-setup
title: "Better Auth Setup and Integration"
category: auth
impact: CRITICAL
tags: [auth, better-auth, nestjs, security]
---

## Intent

Use `BetterAuthModule.forRoot({ auth })` from `@thallesp/nestjs-better-auth` as the sole authentication provider. Never use Passport.js, custom JWT guards, or manual session management.

## Why

Better Auth provides a complete, maintained authentication system with session management, OAuth providers, and 2FA. Using it through the NestJS adapter means authentication is handled at the framework level with type-safe session access. Mixing authentication strategies (e.g. Better Auth + custom JWT) creates security gaps where some routes use one system and others use another, leading to inconsistent auth enforcement. The `bodyParser: false` requirement in `main.ts` is critical — Better Auth reads the raw request body for certain auth flows; if NestJS's body parser runs first, it consumes the stream and auth breaks silently.

## Apply When

- Bootstrapping any new NestJS application
- Adding authentication to an existing application
- Setting up OAuth or social login

## Do Not Apply When

- Internal service-to-service calls with API keys (use a separate guard for those endpoints)
- Webhook endpoints that use HMAC signature verification (use `@AllowAnonymous()` + manual verification)

## Required Pattern

```typescript
// src/auth/auth.config.ts — Better Auth configuration
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db/database.module';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: { enabled: true },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,      // update session if older than 1 day
  },
});

// src/app.module.ts
import { BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './auth/auth.config';

@Module({
  imports: [
    BetterAuthModule.forRoot({ auth }),
    // other feature modules...
  ],
})
export class AppModule {}

// src/main.ts — CRITICAL: disable body parser before Better Auth
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // ← required for Better Auth to read raw request body
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger setup...
  await app.listen(3000);
}
```

## Forbidden Pattern

```typescript
// @ts-nocheck
// ❌ Passport.js strategy — do not use
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken() });
  }
}

// ❌ Custom JWT guard
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}
  canActivate(context: ExecutionContext): boolean {
    const token = request.headers.authorization?.split(' ')[1];
    return this.jwtService.verify(token); // manual JWT verification — do not do this
  }
}

// ❌ bodyParser enabled (default) — breaks Better Auth
const app = await NestFactory.create(AppModule); // missing bodyParser: false
```

## Review Checklist

- [ ] `BetterAuthModule.forRoot({ auth })` imported in `AppModule`
- [ ] `bodyParser: false` set in `NestFactory.create()` options
- [ ] No `passport`, `passport-jwt`, `@nestjs/passport` in `package.json`
- [ ] No custom JWT service or guard
- [ ] `auth` config exported from a dedicated `auth.config.ts` file
- [ ] Session expiry and update age configured in `betterAuth()`

## Stack-Specific Notes

- Package: `@thallesp/nestjs-better-auth` ^2.0.0
- Better Auth version: `better-auth` ^1.2.0
- The `drizzleAdapter` requires the same `db` instance used by the application
- Better Auth automatically creates its own tables (sessions, accounts, verifications) — include them in the schema glob for Drizzle Kit
- For OAuth providers, configure them in `betterAuth()` — do not add separate Passport strategies
