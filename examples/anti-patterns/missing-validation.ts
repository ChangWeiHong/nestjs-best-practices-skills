// @ts-nocheck
// ❌ ANTI-PATTERN: Missing input validation
// Violates rule: dto-validation (CRITICAL)
// Fix: Use class-validator decorated DTO + global ValidationPipe with whitelist/forbidNonWhitelisted/transform

import { Controller, Post, Body } from '@nestjs/common';

// ❌ Plain interface — no validation decorators possible
interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
}

@Controller('users')
export class MissingValidationController {
  // ❌ Accepts any object as body — no validation enforced
  @Post()
  async create(@Body() body: CreateUserRequest) {
    // body.email could be 12345, an object, or undefined
    // body.password could be 1 character
    // extra fields like 'isAdmin: true' pass through silently
    return this.service.create(body);
  }

  // ❌ Using `any` — worst case
  @Post('worse')
  async createWorse(@Body() body: any) {
    return this.service.create(body);
  }

  // ❌ Manual validation in service — fragile and not DRY
  @Post('manual')
  async createManual(@Body() body: CreateUserRequest) {
    if (!body.email || !body.email.includes('@')) {
      throw new Error('Invalid email'); // ❌ raw Error, wrong exception type
    }
    if (!body.password || body.password.length < 8) {
      throw new Error('Password too short');
    }
    // still doesn't strip extra fields — mass assignment risk
    return this.service.create(body);
  }
}

// ✅ Correct: class-validator DTO
// export class CreateUserDto {
//   @ApiProperty({ example: 'jane@example.com' })
//   @IsEmail()
//   email: string;
//
//   @ApiProperty({ minLength: 8 })
//   @IsString()
//   @MinLength(8)
//   password: string;
// }
//
// @Post()
// async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
//   return this.service.create(dto);
// }
