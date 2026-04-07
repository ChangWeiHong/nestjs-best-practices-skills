// @ts-nocheck
// ❌ ANTI-PATTERN: Fat controller with DB queries and business logic
// Violates rule: ctrl-thin-controllers (HIGH)
// Fix: Move all DB queries and business logic to the service layer

import { Controller, Post, Body } from '@nestjs/common';
import { InjectDrizzle } from '../db/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema/users.schema';
import * as argon2 from 'argon2';

@Controller('users')
export class FatUsersController {
  constructor(
    @InjectDrizzle() private readonly db: NodePgDatabase, // ❌ DB in controller
  ) {}

  @Post()
  async create(@Body() body: any) { // ❌ untyped body, no DTO
    // ❌ Business logic in controller — should be in service
    const existing = await this.db
      .select()
      .from(users)
      .where(eq(users.email, body.email));

    if (existing.length > 0) {
      throw new Error('Email already exists'); // ❌ raw Error, not NestJS exception
    }

    // ❌ Password hashing in controller
    const passwordHash = await argon2.hash(body.password);

    // ❌ DB insert in controller
    const [user] = await this.db
      .insert(users)
      .values({
        email: body.email,
        name: body.name,
        passwordHash,
      })
      .returning();

    // ❌ Manual DTO mapping in controller — and raw row returned
    const { passwordHash: _, ...responseUser } = user;
    return responseUser; // ❌ still not a proper DTO class
  }
}

// ✅ Correct: delegate everything to service
// @Post()
// async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
//   return this.usersService.create(dto); // 1 line
// }
