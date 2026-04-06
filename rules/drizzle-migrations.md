---
id: drizzle-migrations
title: "Drizzle Migration Workflow"
category: drizzle
impact: HIGH
tags: [drizzle, migrations, database, production]
---

## Intent

Use `drizzle-kit generate` to create SQL migration files, review the generated SQL, then apply with `drizzle-kit migrate`. Never use `drizzle-kit push` on any non-local environment.

## Why

`drizzle-kit push` directly alters the database schema without creating a migration file. This means there is no record of what changed, no way to review changes before they apply, no way to roll back, and no way to replay the changes on other environments (staging, production). SQL migration files are the audit trail and the deployment artifact — they can be reviewed in PRs, tested in staging, and applied predictably in production. One `drizzle-kit push` in production is enough to corrupt data irreversibly.

## Apply When

- Any schema change (new table, new column, modified column, new index, dropped column)
- Setting up a new environment (run `migrate` to apply all pending migrations)
- After merging a PR that contains schema changes

## Do Not Apply When

- Local development with throwaway databases (push is acceptable there, but still prefer migrate for consistency)

## Required Pattern

```bash
# Step 1: Generate SQL migration from schema changes
pnpm drizzle-kit generate

# Step 2: Review the generated SQL file in drizzle/migrations/
# Look for:
# - Unexpected DROP statements
# - Data-loss column modifications
# - Missing data migration steps
cat drizzle/migrations/0001_add_user_profile.sql

# Step 3: Apply migration
pnpm drizzle-kit migrate

# Rollback: there is no automatic rollback — write a new migration to reverse changes
```

```typescript
// drizzle.config.ts — required for drizzle-kit
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema/*.schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

## Forbidden Pattern

```typescript
// @ts-nocheck
// ❌ drizzle-kit push in any non-local script
// package.json
{
  "scripts": {
    "db:push": "drizzle-kit push", // ❌ never in scripts that run in CI/CD
    "db:push:prod": "drizzle-kit push" // ❌ absolutely never
  }
}

// ❌ Skipping migration review
// Running migrate immediately after generate without reading the SQL
pnpm drizzle-kit generate && pnpm drizzle-kit migrate // ❌ no review step
```

## Review Checklist

- [ ] `drizzle.config.ts` exists with correct `schema` glob and `out` directory
- [ ] Migration files committed in `drizzle/migrations/` directory
- [ ] No `drizzle-kit push` in any npm script targeting non-local environments
- [ ] Generated SQL reviewed for unintended DROP or ALTER statements before applying
- [ ] Migration applied in local → staging → production order
- [ ] `drizzle-kit migrate` (not push) used in deployment pipeline

## Stack-Specific Notes

- Drizzle Kit version: `drizzle-kit` ^0.30.0
- Migration command in CI/CD: `drizzle-kit migrate` (reads `DATABASE_URL` from env)
- Column renames: Drizzle generates DROP + ADD (data loss). For safe renames: add new column, backfill data, deploy code, then drop old column in a separate migration
- For seeding: create a separate `seed.ts` script, do not use migrations for seed data
- The `drizzle/migrations/meta/` directory is generated metadata — commit it alongside the SQL files
