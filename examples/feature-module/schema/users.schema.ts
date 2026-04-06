// Example: Correct Drizzle schema definition
// Rule: drizzle-schema-definition (CRITICAL)
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Table definition using pgTable() from drizzle-orm/pg-core
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  // Sensitive field — present in schema but EXCLUDED from response DTO
  passwordHash: text('password_hash').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Relations co-located with table definition
// Rule: drizzle-relations (HIGH)
// export const usersRelations = relations(users, ({ many }) => ({
//   posts: many(posts), // uncomment when posts schema is available
// }));

// Always export InferSelectModel and InferInsertModel type aliases
// These are the canonical types for this entity throughout the codebase
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
