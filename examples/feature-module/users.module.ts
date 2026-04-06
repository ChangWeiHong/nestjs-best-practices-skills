// Example: Correct feature module structure
// Rule: struct-feature-modules (HIGH)
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
// import { DatabaseModule } from '../db/database.module'; // uncomment in real app

@Module({
  // imports: [DatabaseModule], // provides NodePgDatabase injection token
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // export for other modules that need to call UsersService
})
export class UsersModule {}
