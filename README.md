# nestjs-best-practices

Project-local Claude Code skill for NestJS projects using Drizzle ORM, Better Auth, Swagger, and `class-validator`.

## Skill Location

The installable skill now lives at `.claude/skills/nestjs-best-practices/`.

This matches Anthropic's current Claude Code skill layout:

- project skills live in `.claude/skills/<skill-name>/SKILL.md`
- each skill directory contains `SKILL.md` plus optional supporting files

For Claude.ai or other upload workflows, package the `.claude/skills/nestjs-best-practices/` folder itself rather than the repository root.

## Repository Layout

- `.claude/skills/nestjs-best-practices/SKILL.md`: installable skill entrypoint
- `.claude/skills/nestjs-best-practices/references/AGENTS.md`: compact generated routing guide
- `.claude/skills/nestjs-best-practices/references/RULEBOOK.md`: full generated handbook
- `.claude/skills/nestjs-best-practices/references/rules/`: source-of-truth rule files
- `.claude/skills/nestjs-best-practices/references/examples/`: positive and negative examples
- `.claude/skills/nestjs-best-practices/references/metadata.json`: machine-readable rule inventory
- `.claude/skills/nestjs-best-practices/scripts/build.ts`: generator for the derived markdown artifacts

## Build

```bash
pnpm build
```

This regenerates:

- `.claude/skills/nestjs-best-practices/references/AGENTS.md`
- `.claude/skills/nestjs-best-practices/references/RULEBOOK.md`

## Editing Rules

1. Edit the relevant files in `.claude/skills/nestjs-best-practices/references/rules/`.
2. Run `pnpm build`.
3. Review the generated changes in `.claude/skills/nestjs-best-practices/references/AGENTS.md` and `.claude/skills/nestjs-best-practices/references/RULEBOOK.md`.

## Usage Model

- Keep `.claude/skills/nestjs-best-practices/SKILL.md` small so skill triggering stays efficient.
- Use `references/AGENTS.md` for compact task routing and critical rules.
- Use `references/RULEBOOK.md` or the individual files in `references/rules/` for full guidance.
