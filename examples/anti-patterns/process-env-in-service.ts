// @ts-nocheck
// ❌ ANTI-PATTERN: Reading process.env directly in services
// Violates rule: config-no-process-env (HIGH)
// Fix: Inject ConfigService and use configService.get('KEY', { infer: true })

import { Injectable } from '@nestjs/common';

@Injectable()
export class BadEmailService {
  // ❌ process.env read at class initialization — may be undefined
  private readonly smtpHost = process.env.SMTP_HOST; // string | undefined

  constructor() {
    // ❌ process.env in constructor — bypasses NestJS DI and startup validation
    if (!process.env.SMTP_PORT) {
      console.log('Warning: SMTP_PORT not set'); // ❌ console.log AND missing env
    }
  }

  async sendEmail(to: string, subject: string): Promise<void> {
    // ❌ process.env in method — not validated at startup
    const apiKey = process.env.EMAIL_API_KEY!; // non-null assertion is a lie
    const fromAddress = process.env.FROM_EMAIL ?? 'noreply@example.com';

    // If EMAIL_API_KEY is not set, this fails at runtime with a confusing error
    // instead of failing at startup with "EMAIL_API_KEY is required"
  }
}

@Injectable()
export class BadDatabaseService {
  constructor() {
    // ❌ Hardcoded fallback hides misconfiguration
    const dbUrl = process.env.DATABASE_URL ?? 'postgresql://localhost/dev';
    // In production, DATABASE_URL might be missing — silently connects to 'localhost'
  }
}

// ✅ Correct: use ConfigService with typed EnvironmentVariables
// @Injectable()
// export class EmailService {
//   constructor(
//     private readonly configService: ConfigService<EnvironmentVariables, true>,
//   ) {}
//
//   async sendEmail(to: string): Promise<void> {
//     const apiKey = this.configService.get('EMAIL_API_KEY', { infer: true });
//     // Validated at startup — guaranteed to be a string here
//   }
// }
