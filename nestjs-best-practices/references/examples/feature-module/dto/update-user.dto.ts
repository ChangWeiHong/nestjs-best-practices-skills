// Example: Correct partial update DTO using PartialType from @nestjs/swagger
// Rules: dto-validation (CRITICAL), dto-swagger-properties (HIGH)
import { PartialType } from '@nestjs/swagger'; // NOT from @nestjs/mapped-types — preserves Swagger metadata
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

// PartialType makes all CreateUserDto fields optional and preserves @ApiProperty decorators
export class UpdateUserDto extends PartialType(CreateUserDto) {
  // Additional fields specific to updates can be added here
  @ApiPropertyOptional({
    description: 'New display name',
    example: 'Jane Smith',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string; // re-declaring to add @IsOptional explicitly
}
