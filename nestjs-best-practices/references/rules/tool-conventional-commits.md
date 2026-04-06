---
id: tool-conventional-commits
title: "Conventional Commits"
category: tooling
impact: MEDIUM
tags: [git, commits, commitlint, husky]
---

## Intent

All commits must follow the `type(scope): description` format enforced by Commitlint and Husky. Never bypass hooks with `--no-verify`.

## Why

Conventional commits enable automated changelog generation, semantic versioning, and structured history that can be read by tools and humans alike. `--no-verify` bypasses the pre-commit and commit-msg hooks, allowing broken code, missing tests, or malformed commit messages to enter the repository. Once `--no-verify` becomes acceptable in one case, it becomes the default for everyone when hooks are inconvenient. The hooks exist for a reason — fix the underlying issue rather than bypassing the check.

## Apply When

- Every commit
- Commit message format
- When hooks fail

## Do Not Apply When

- (No exceptions — all commits must follow the format, hooks must never be bypassed)

## Required Pattern

```bash
# Format: type(scope): short description (imperative mood, lowercase, no period)
git commit -m "feat(users): add email verification flow"
git commit -m "fix(auth): handle expired session refresh correctly"
git commit -m "refactor(drizzle): extract shared query helpers"
git commit -m "test(users): add E2E tests for user deletion"
git commit -m "docs(readme): update setup instructions for mise"
git commit -m "chore(deps): upgrade drizzle-orm to 0.38.0"
git commit -m "perf(queries): add index on users.email column"
```

```javascript
// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 'refactor',
      'test', 'chore', 'perf', 'ci', 'revert',
    ]],
    'scope-case': [2, 'always', 'kebab-case'],
    'subject-case': [2, 'always', 'lower-case'],
  },
};

// .husky/commit-msg
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
npx --no -- commitlint --edit "$1"
```

## Forbidden Pattern

```bash
# ❌ Missing type prefix
git commit -m "add user registration"

# ❌ Vague description
git commit -m "feat: fix stuff"
git commit -m "fix: bug"

# ❌ Bypassing hooks — NEVER do this
git commit -m "feat(users): add feature" --no-verify

# ❌ Past tense (use imperative: "add" not "added")
git commit -m "feat(users): added email validation"

# ❌ Uppercase description
git commit -m "feat(users): Add email validation"

# ❌ Period at end of description
git commit -m "feat(users): add email validation."
```

## Review Checklist

- [ ] Commit message matches `type(scope): description` format
- [ ] Type is one of: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `revert`
- [ ] Scope is the feature module name in kebab-case (e.g. `users`, `auth`, `drizzle`)
- [ ] Description is lowercase, imperative mood, no trailing period
- [ ] No `--no-verify` flag used
- [ ] Commitlint and Husky configured in repo (`commitlint.config.js` + `.husky/commit-msg`)

## Stack-Specific Notes

- Install: `pnpm add -D @commitlint/cli @commitlint/config-conventional husky`
- Init Husky: `pnpm exec husky init`
- Commitlint hook: `echo 'npx --no -- commitlint --edit "$1"' > .husky/commit-msg`
- For breaking changes: add `!` after type: `feat(auth)!: replace session tokens with JWTs`
- `BREAKING CHANGE:` footer in commit body triggers major version bump in semantic-release
