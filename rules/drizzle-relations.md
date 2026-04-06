---
id: drizzle-relations
title: "Drizzle Relations Definition"
category: drizzle
impact: HIGH
tags: [drizzle, relations, queries, database]
---

## Intent

Define `relations()` co-located with each table in its schema file. Relations are required for the `db.query.*` relational query API and must reflect actual foreign key constraints.

## Why

Drizzle has two query APIs: the SQL-like query builder (`db.select().from()`) and the relational query API (`db.query.users.findMany({ with: { posts: true } })`). The relational API is more ergonomic for fetching nested data but requires `relations()` definitions to know how tables connect. Without `relations()`, `db.query.*` won't have the nested query options. Co-locating `relations()` with the table definition means schema changes and relation changes happen in the same file, reducing the chance of stale relation definitions.

## Apply When

- Any table that has a foreign key column referencing another table
- Any table that is referenced by a foreign key in another table
- Both sides of every relationship must define their half

## Do Not Apply When

- Tables with no relationships (standalone lookup tables)
- The relationship is purely at the application level with no FK constraint

## Required Pattern

```typescript
// src/db/schema/users.schema.ts
import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { posts } from './posts.schema';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Co-located with the table definition — one author has many posts
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

// src/db/schema/posts.schema.ts
import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users } from './users.schema';

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Each post belongs to one author
export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));

export type Post = InferSelectModel<typeof posts>;
export type NewPost = InferInsertModel<typeof posts>;

// Usage with relational query API
const usersWithPosts = await db.query.users.findMany({
  with: { posts: true },
});
```

## Forbidden Pattern

```typescript
// @ts-nocheck
// ❌ Relations defined in a separate file from the schema
// src/db/relations.ts — separate file causes mismatch when schema changes
import { relations } from 'drizzle-orm';
export const usersRelations = relations(users, ...); // ❌ not co-located

// ❌ Missing both-sides definition — one-sided relation breaks relational API
// posts.schema.ts defines postsRelations but users.schema.ts has no usersRelations
// db.query.users.findMany({ with: { posts: true } }) won't work

// ❌ Using manual joins instead of relational API where relations are defined
const result = await db
  .select()
  .from(users)
  .leftJoin(posts, eq(posts.authorId, users.id)); // ❌ when relations exist, use db.query.*
```

## Review Checklist

- [ ] `relations()` exported from the same file as `pgTable()`
- [ ] Both sides of every relationship defined (`usersRelations` and `postsRelations`)
- [ ] `one()` used for many-to-one (post → author), `many()` used for one-to-many (user → posts)
- [ ] `fields` and `references` arrays specified in `one()` definitions
- [ ] Foreign key columns use `.references(() => parentTable.id)` for DB-level FK constraints
- [ ] All relation definitions included in the Drizzle Kit config schema glob

## Stack-Specific Notes

- Import `relations` from `drizzle-orm` (not `drizzle-orm/pg-core`)
- The `db` instance must be created with schema: `drizzle(pool, { schema })` for `db.query.*` to work
- For many-to-many: create a junction table (`usersToPosts`) with `one()` relations on both sides
- Self-referential relations (e.g. parent/child categories): use the lazy function form `relations(categories, ({ one, many }) => ({ parent: one(categories, ...) }))`
