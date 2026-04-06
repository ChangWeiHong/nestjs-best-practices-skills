# nestjs-best-practices

Codex skill and rule repository for NestJS projects using Drizzle ORM, Better Auth, Swagger, and `class-validator`.

## Repository Layout

- `SKILL.md`: skill entrypoint with YAML frontmatter and the minimal operating workflow
- `AGENTS.md`: compact agent-facing routing guide generated from the rule set
- `RULEBOOK.md`: full compiled handbook generated from the rule set
- `rules/`: source-of-truth rule files
- `examples/feature-module/`: positive implementation examples
- `examples/anti-patterns/`: negative examples and forbidden patterns
- `metadata.json`: machine-readable rule inventory
- `scripts/build.ts`: generator for the derived markdown artifacts

## Build

```bash
pnpm build
```

This regenerates:

- `AGENTS.md`
- `RULEBOOK.md`

## Editing Rules

1. Edit the relevant files in `rules/`.
2. Run `pnpm build`.
3. Review the generated changes in `AGENTS.md` and `RULEBOOK.md`.

## Usage Model

- Keep `SKILL.md` small so skill triggering stays efficient.
- Use `AGENTS.md` for compact task routing and critical rules.
- Use `RULEBOOK.md` or the individual files in `rules/` for full guidance.
