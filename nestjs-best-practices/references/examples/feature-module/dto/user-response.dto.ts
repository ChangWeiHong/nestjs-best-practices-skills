// Example: Correct response DTO — explicit shape, excludes sensitive fields
// Rules: drizzle-no-raw-rows-as-response (CRITICAL), dto-swagger-properties (HIGH)
import { ApiProperty } from '@nestjs/swagger';

// Response DTOs do NOT have class-validator decorators
// They define the API output shape — not the input validation
export class UserResponseDto {
  @ApiProperty({
    description: 'User unique identifier',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'jane@example.com',
    format: 'email',
  })
  email: string;

  @ApiProperty({
    description: 'Display name',
    example: 'Jane Doe',
  })
  name: string;

  @ApiProperty({
    description: 'Whether the account is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Timestamp when the account was created',
    format: 'date-time',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  // passwordHash is intentionally NOT included — never expose it
}
