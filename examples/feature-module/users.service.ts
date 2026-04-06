// Example: Correct service implementation
// Rules: svc-no-repository-ceremony (HIGH), drizzle-no-raw-rows-as-response (CRITICAL),
//        err-nestjs-exceptions (HIGH), obs-structured-logging (MEDIUM), config-no-process-env (HIGH)
import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as argon2 from 'argon2';
import { users, type User } from './schema/users.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import type * as schema from './schema/users.schema';

// Token for database injection — defined in DatabaseModule
const DATABASE_TOKEN = 'DATABASE';

@Injectable()
export class UsersService {
  // ✅ Class-level logger — Rule: obs-structured-logging
  private readonly logger = new Logger(UsersService.name);

  constructor(
    // ✅ Inject NodePgDatabase directly — no repository class — Rule: svc-no-repository-ceremony
    @Inject(DATABASE_TOKEN) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const passwordHash = await argon2.hash(dto.password);

    try {
      const [user] = await this.db
        .insert(users)
        .values({
          email: dto.email,
          name: dto.name,
          passwordHash,
        })
        .returning();

      this.logger.log(`User created: ${user.id}`); // ✅ No sensitive data in log
      return this.toResponseDto(user);
    } catch (error) {
      // ✅ Catch DB constraint violations — Rule: err-nestjs-exceptions
      if ((error as { code?: string }).code === '23505') {
        throw new ConflictException('Email address is already in use');
      }
      this.logger.error(`Failed to create user for email: ${dto.email}`, error);
      throw error;
    }
  }

  async findById(id: string): Promise<UserResponseDto> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      // ✅ NestJS exception, not raw Error — Rule: err-nestjs-exceptions
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // ✅ Always map to response DTO — Rule: drizzle-no-raw-rows-as-response
    return this.toResponseDto(user);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const result = await this.db.select().from(users);
    return result.map(u => this.toResponseDto(u)); // ✅ Map each row
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const updateData: Partial<typeof users.$inferInsert> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.password !== undefined) updateData.passwordHash = await argon2.hash(dto.password);
    updateData.updatedAt = new Date();

    const [updated] = await this.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    this.logger.log(`User updated: ${id}`);
    return this.toResponseDto(updated);
  }

  async remove(id: string): Promise<void> {
    const [deleted] = await this.db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });

    if (!deleted) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    this.logger.warn(`User deleted: ${id}`); // ✅ warn level for destructive operations
  }

  // ✅ Private mapping method — Rule: drizzle-no-raw-rows-as-response
  // Explicitly maps each field — sensitive fields (passwordHash) are excluded
  private toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
      // passwordHash intentionally omitted
    };
  }
}
