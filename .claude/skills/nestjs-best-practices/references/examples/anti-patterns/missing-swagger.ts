// @ts-nocheck
// ❌ ANTI-PATTERN: Missing Swagger decorators on controller and DTO
// Violates rules: ctrl-swagger-decorators (HIGH), dto-swagger-properties (HIGH)
// Fix: Add @ApiTags/@ApiOperation/@ApiResponse to controller, @ApiProperty to every DTO field

import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';

// ❌ DTO without @ApiProperty — invisible in Swagger schema
export class BadCreateUserDto {
  @IsEmail()
  email: string; // ❌ no @ApiProperty — doesn't appear in Swagger docs

  @IsString()
  @MinLength(2)
  name: string; // ❌ no description, no example

  @IsString()
  @MinLength(8)
  password: string; // ❌ no @ApiProperty, no writeOnly: true
}

// ❌ Response DTO without @ApiProperty — Swagger can't describe response shape
export class BadUserResponseDto {
  id: string;          // ❌ no @ApiProperty — Swagger shows empty schema
  email: string;       // ❌ no format: 'email'
  createdAt: Date;     // ❌ Date without format: 'date-time' renders as {}
}

// ❌ Controller with no Swagger decorators
@Controller('users') // ❌ missing @ApiTags
export class BadUsersController {
  @Post()             // ❌ missing @ApiOperation, @ApiResponse, @ApiBody
  async create(@Body() dto: BadCreateUserDto) {
    return {};        // ❌ consumers don't know the response shape
  }

  @Get(':id')         // ❌ missing @ApiParam, @ApiOperation, @ApiResponse
  async findOne(@Param('id') id: string) {
    return {};
  }
}

// ✅ Correct controller:
// @ApiTags('Users')
// @ApiBearerAuth()
// @Controller('users')
// export class UsersController {
//   @Post()
//   @ApiOperation({ summary: 'Create user' })
//   @ApiResponse({ status: 201, type: UserResponseDto })
//   @ApiResponse({ status: 400, description: 'Validation error' })
//   async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> { ... }
// }
