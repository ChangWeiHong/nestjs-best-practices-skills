// Example: Correct input DTO with class-validator + @ApiProperty
// Rules: dto-validation (CRITICAL), dto-swagger-properties (HIGH)
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address — must be unique across all accounts',
    example: 'jane@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Display name shown to other users',
    example: 'Jane Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Account password — minimum 8 characters',
    minLength: 8,
    writeOnly: true, // not included in response schema
  })
  @IsString()
  @MinLength(8)
  password: string;
}
