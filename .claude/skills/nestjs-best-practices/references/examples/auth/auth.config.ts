// Example: Better Auth configuration
// Rule: auth-better-auth-setup (CRITICAL)
// This file is referenced by users.controller.ts for session type inference

import { betterAuth } from 'better-auth';
// import { drizzleAdapter } from 'better-auth/adapters/drizzle';
// import { db } from '../db/database.module';

export const auth = betterAuth({
  // database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: { enabled: true },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,      // update session if older than 1 day
  },
});

// typeof auth.$Infer.Session is used to type the @Session() decorator
// in controllers — this provides full type safety for session access
