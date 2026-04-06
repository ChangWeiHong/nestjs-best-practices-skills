// @ts-nocheck
// ❌ ANTI-PATTERN: Custom JWT guard with Passport.js
// Violates rule: auth-better-auth-setup (CRITICAL)
// Fix: Use BetterAuthModule.forRoot({ auth }) + global AuthGuard from @thallesp/nestjs-better-auth

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport'; // ❌ do not use Passport
import { Strategy, ExtractJwt } from 'passport-jwt'; // ❌ do not use passport-jwt
import { JwtService } from '@nestjs/jwt'; // ❌ do not use manual JWT service

// ❌ Passport JWT strategy — bypasses Better Auth entirely
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET, // ❌ process.env directly
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email };
  }
}

// ❌ Custom guard — duplicates what BetterAuthModule already provides
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) return false;

    try {
      const payload = this.jwtService.verify(token); // ❌ manual verification
      request.user = payload;
      return true;
    } catch {
      return false;
    }
  }
}

// ✅ Correct: no custom guards needed
// In app.module.ts:
//   BetterAuthModule.forRoot({ auth })
// In main.ts:
//   const authGuard = app.get(AuthGuard); // from @thallesp/nestjs-better-auth
//   app.useGlobalGuards(authGuard);
// Public routes:
//   @AllowAnonymous() from @thallesp/nestjs-better-auth
