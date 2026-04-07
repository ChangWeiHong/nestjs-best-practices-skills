// @ts-nocheck
// ❌ ANTI-PATTERN: Using drizzle-kit push in production scripts
// Violates rule: drizzle-migrations (HIGH)
// Fix: Use generate → review SQL → migrate workflow

// ❌ package.json scripts that use push
const badPackageJsonScripts = {
  scripts: {
    // ❌ push destroys migration history and cannot be reviewed before applying
    'db:push': 'drizzle-kit push',
    // ❌ never push to staging or production
    'db:push:staging': 'DATABASE_URL=$STAGING_URL drizzle-kit push',
    // ❌ absolutely never
    'db:push:prod': 'DATABASE_URL=$PROD_URL drizzle-kit push',
    // ❌ chaining generate+migrate without a review step
    'db:migrate:unsafe': 'drizzle-kit generate && drizzle-kit migrate',
  },
};

// ❌ CI/CD pipeline step using push
const badCiStep = `
  - name: Migrate database
    run: pnpm drizzle-kit push  # ❌ no audit trail, no review, data loss risk
`;

// ✅ Correct workflow:
const correctPackageJsonScripts = {
  scripts: {
    // Step 1: Generate SQL migration files (commit these)
    'db:generate': 'drizzle-kit generate',
    // Step 2: Review the generated SQL manually, then:
    // Step 3: Apply pending migrations
    'db:migrate': 'drizzle-kit migrate',
    // Local dev only — acceptable but still prefer migrate
    'db:push:local': 'drizzle-kit push', // explicitly named :local
  },
};

// ✅ Correct CI/CD:
const correctCiStep = `
  - name: Apply database migrations
    run: pnpm db:migrate  # applies pre-reviewed SQL migration files
`;

export {};
