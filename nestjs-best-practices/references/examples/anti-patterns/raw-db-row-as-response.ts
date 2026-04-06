// @ts-nocheck
// ❌ ANTI-PATTERN: Returning raw Drizzle rows as API response
// Violates rule: drizzle-no-raw-rows-as-response (CRITICAL)
// Fix: Create a UserResponseDto and use a toResponseDto() mapping method

import { Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { users, type User } from '../db/schema/users.schema';

@Injectable()
export class BadUsersService {
  constructor(private readonly db: NodePgDatabase) {}

  // ❌ Returns raw Drizzle row type — exposes passwordHash to API consumers
  async findById(id: string): Promise<User> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user; // ❌ includes passwordHash, isActive, and any future internal columns
  }

  // ❌ Returns raw array — same problem at scale
  async findAll(): Promise<User[]> {
    return this.db.select().from(users); // ❌ all columns for all users
  }

  // ❌ Omit is not enough — it's still not a DTO class (no Swagger, no class instance)
  async findByIdPartial(id: string): Promise<Omit<User, 'passwordHash'>> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    const { passwordHash, ...rest } = user;
    return rest; // ❌ not a DTO class — can't decorate for Swagger, no validation
  }
}

// ✅ Correct: map to response DTO
// private toResponseDto(user: User): UserResponseDto {
//   return {
//     id: user.id,
//     email: user.email,
//     name: user.name,
//     isActive: user.isActive,
//     createdAt: user.createdAt,
//     // passwordHash intentionally excluded
//   };
// }
