// @ts-nocheck
// ❌ ANTI-PATTERN: Useless test assertions that prove nothing
// Violates rule: test-unit-services (MEDIUM-HIGH)
// Fix: Assert specific field values, test all error paths, verify sensitive data exclusion

import { Test } from '@nestjs/testing';
import { UsersService } from '../../examples/feature-module/users.service';

describe('UsersService (bad tests)', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        // ❌ Real DatabaseModule — unit tests should mock the DB
        // DatabaseModule,
      ],
    }).compile();
    service = module.get(UsersService);
  });

  describe('findById', () => {
    it('should return a user', async () => {
      // ❌ toBeDefined() proves nothing — undefined is not "defined" but an empty object IS
      const result = await service.findById('some-id');
      expect(result).toBeDefined(); // ❌ passes even if result is {}
    });

    it('should work', async () => {
      // ❌ No assertion at all — this test always passes
      await service.findById('some-id');
    });

    // ❌ Missing error case test — NotFoundException not tested
  });

  describe('create', () => {
    it('creates user', async () => {
      const result = await service.create({
        email: 'test@example.com',
        name: 'Test',
        password: 'password123',
      });
      expect(result).toBeTruthy(); // ❌ toBeTruthy — too loose, any object passes
      // ❌ Not checking: result.id, result.email, result.name
      // ❌ Not checking: result.passwordHash is undefined (sensitive data leak!)
      // ❌ Not testing: ConflictException when email is duplicate
    });
  });
});

// ✅ Correct test:
// it('returns UserResponseDto with correct fields', async () => {
//   mockDb.limit.mockResolvedValueOnce([mockUser]);
//   const result = await service.findById(mockUser.id);
//   expect(result.id).toBe(mockUser.id);         // specific value
//   expect(result.email).toBe(mockUser.email);   // specific value
//   expect((result as any).passwordHash).toBeUndefined(); // security check
// });
//
// it('throws NotFoundException when user does not exist', async () => {
//   mockDb.limit.mockResolvedValueOnce([]);
//   await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
// });
