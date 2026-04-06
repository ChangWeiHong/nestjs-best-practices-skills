# nestjs-best-practices

Claude Code skill repository for NestJS projects using Drizzle ORM, Better Auth, Swagger, and `class-validator`.

## Skill Package

The installable skill lives in `nestjs-best-practices/`.

That folder follows the Claude skill packaging model:

- `SKILL.md`: minimal entrypoint and trigger instructions
- `references/`: detailed docs, generated guides, examples, and rule source files
- `scripts/`: build tooling for generated artifacts

For Claude Code or Claude.ai, package or upload the `nestjs-best-practices/` folder rather than the repository root.

## Repository Layout

- `nestjs-best-practices/SKILL.md`: installable skill entrypoint
- `nestjs-best-practices/references/AGENTS.md`: compact generated routing guide
- `nestjs-best-practices/references/RULEBOOK.md`: full generated handbook
- `nestjs-best-practices/references/rules/`: source-of-truth rule files
- `nestjs-best-practices/references/examples/`: positive and negative examples
- `nestjs-best-practices/references/metadata.json`: machine-readable rule inventory
- `nestjs-best-practices/scripts/build.ts`: generator for the derived markdown artifacts

## Build

```bash
pnpm build
```

This regenerates:

- `nestjs-best-practices/references/AGENTS.md`
- `nestjs-best-practices/references/RULEBOOK.md`

## Editing Rules

1. Edit the relevant files in `nestjs-best-practices/references/rules/`.
2. Run `pnpm build`.
3. Review the generated changes in `nestjs-best-practices/references/AGENTS.md` and `nestjs-best-practices/references/RULEBOOK.md`.

## Usage Model

- Keep `nestjs-best-practices/SKILL.md` small so skill triggering stays efficient.
- Use `references/AGENTS.md` for compact task routing and critical rules.
- Use `references/RULEBOOK.md` or the individual files in `references/rules/` for full guidance.
