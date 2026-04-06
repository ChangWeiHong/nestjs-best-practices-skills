// Example: Correct thin controller with full Swagger decoration
// Rules: ctrl-thin-controllers (HIGH), ctrl-swagger-decorators (HIGH),
//        auth-public-routes (CRITICAL), auth-session-access (HIGH), api-rest-conventions (MEDIUM-HIGH)
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AllowAnonymous, Session } from '@thallesp/nestjs-better-auth';
import { auth } from '../auth/auth.config'; // for type inference
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

type SessionType = typeof auth.$Infer.Session;

@ApiTags('Users')         // ✅ Groups in Swagger UI — Rule: ctrl-swagger-decorators
@ApiBearerAuth()          // ✅ Marks controller as requiring auth
@Controller('users')      // ✅ Plural noun — Rule: api-rest-conventions
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ✅ @AllowAnonymous — public route opt-out — Rule: auth-public-routes
  @AllowAnonymous()
  @Post()
  @HttpCode(201)            // ✅ 201 for creation — Rule: api-rest-conventions
  @ApiOperation({ summary: 'Create a new user account', description: 'Registers a new user with email and password.' })
  @ApiResponse({ status: 201, description: 'User successfully created', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error — check request body' })
  @ApiResponse({ status: 409, description: 'Email address already in use' })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    // ✅ Parse → delegate → return (~3 lines) — Rule: ctrl-thin-controllers
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, description: 'List of users', type: [UserResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(): Promise<UserResponseDto[]> {
    return this.usersService.findAll();
  }

  // ✅ @Session() typed via Better Auth — Rule: auth-session-access
  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Current user', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@Session() session: SessionType): Promise<UserResponseDto> {
    return this.usersService.findById(session.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User found', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiParam({ name: 'id', description: 'User UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User updated', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @Session() session: SessionType,
  ): Promise<UserResponseDto> {
    if (session.user.id !== id) throw new ForbiddenException();
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)            // ✅ 204 No Content for deletion — Rule: api-rest-conventions
  @ApiOperation({ summary: 'Delete user account' })
  @ApiParam({ name: 'id', description: 'User UUID', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'User deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Cannot delete another user\'s account' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: SessionType,
  ): Promise<void> {
    if (session.user.id !== id) throw new ForbiddenException();
    return this.usersService.remove(id);
  }
}
