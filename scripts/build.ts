import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const RULES_DIR = join(process.cwd(), 'rules');
const OUTPUT_FILE = join(process.cwd(), 'AGENTS.md');
const RULEBOOK_FILE = join(process.cwd(), 'RULEBOOK.md');
const MAX_AGENTS_SIZE_KB = 8;

const IMPACT_ORDER: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  'MEDIUM-HIGH': 2,
  MEDIUM: 3,
};

interface RuleMeta {
  id: string;
  title: string;
  category: string;
  impact: string;
  tags: string[];
  content: string;
  filename: string;
}

const CATEGORY_ORDER = [
  'auth',
  'drizzle',
  'dto',
  'controllers',
  'services',
  'structure',
  'config',
  'errors',
  'testing',
  'api',
  'observability',
  'tooling',
];

const RULE_SUMMARIES: Record<string, string> = {
  'auth-better-auth-setup': 'Use Better Auth as the only app auth system and disable Nest body parsing in bootstrap.',
  'auth-public-routes': 'Protect routes by default and mark public endpoints explicitly with `@AllowAnonymous()`.',
  'drizzle-no-raw-rows-as-response': 'Map Drizzle rows to response DTOs before returning them from controllers or services.',
  'drizzle-schema-definition': 'Define tables with `pgTable()` and export Drizzle infer types from schema files.',
  'dto-validation': 'Validate every input DTO through the global `ValidationPipe` with whitelist, forbid, and transform enabled.',
  'auth-session-access': 'Read the current user through `@Session()` typed from the Better Auth config.',
  'config-env-validation': 'Validate every environment variable at startup through `ConfigModule.forRoot({ validate })`.',
  'config-no-process-env': 'Inject `ConfigService` instead of reading `process.env` inside application code.',
  'ctrl-swagger-decorators': 'Document every controller with Swagger decorators for tags, operations, and responses.',
  'ctrl-thin-controllers': 'Keep controllers limited to transport concerns and delegate business logic to services.',
  'drizzle-migrations': 'Use generated Drizzle migrations and avoid schema push workflows in production.',
  'drizzle-queries-and-transactions': 'Use typed Drizzle queries directly in services and wrap multi-step writes in transactions.',
  'drizzle-relations': 'Define Drizzle relations explicitly so relational queries stay typed and consistent.',
  'dto-swagger-properties': 'Add `@ApiProperty` metadata to every DTO field that appears in the API contract.',
  'err-nestjs-exceptions': 'Throw NestJS HTTP exceptions instead of raw errors for request-facing failures.',
  'struct-feature-modules': 'Organize code by feature module with clear module, controller, service, and DTO boundaries.',
  'svc-no-repository-ceremony': 'Query Drizzle directly from services instead of adding repository wrapper layers.',
  'api-rest-conventions': 'Use predictable REST resource naming, HTTP verbs, status codes, and route structure.',
  'test-e2e-supertest': 'Cover request flows with Supertest-based E2E tests against the Nest application.',
  'test-unit-services': 'Unit test service behavior in isolation, especially branch logic and failure paths.',
  'obs-structured-logging': 'Use structured Nest logging instead of ad hoc console output.',
  'tool-conventional-commits': 'Use Conventional Commits for commit subjects and related git workflow conventions.',
};

function parseFrontmatter(content: string): { meta: Record<string, string>; body: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  if (!match) return { meta: {}, body: content };

  const meta: Record<string, string> = {};
  const rawMeta = match[1];
  const body = match[2];

  for (const line of rawMeta.split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();
    meta[key] = value.replace(/^["']|["']$/g, '');
  }

  return { meta, body };
}

function loadRules(): RuleMeta[] {
  const files = readdirSync(RULES_DIR)
    .filter(f => f.endsWith('.md') && !f.startsWith('_'))
    .sort();

  const rules: RuleMeta[] = [];

  for (const file of files) {
    const filepath = join(RULES_DIR, file);
    const raw = readFileSync(filepath, 'utf-8');
    const { meta, body } = parseFrontmatter(raw);

    if (!meta.id || !meta.impact) {
      console.warn(`Skipping ${file}: missing id or impact in frontmatter`);
      continue;
    }

    rules.push({
      id: meta.id,
      title: meta.title || meta.id,
      category: meta.category || 'general',
      impact: meta.impact,
      tags: meta.tags ? meta.tags.replace(/[\[\]]/g, '').split(',').map(t => t.trim()) : [],
      content: body.trim(),
      filename: file,
    });
  }

  return rules;
}

function sortRules(rules: RuleMeta[]): RuleMeta[] {
  return [...rules].sort((a, b) => {
    const impactDiff = (IMPACT_ORDER[a.impact] ?? 99) - (IMPACT_ORDER[b.impact] ?? 99);
    if (impactDiff !== 0) return impactDiff;
    return a.id.localeCompare(b.id);
  });
}

function groupByImpact(rules: RuleMeta[]): Record<string, RuleMeta[]> {
  const byImpact: Record<string, RuleMeta[]> = {};
  for (const rule of rules) {
    if (!byImpact[rule.impact]) byImpact[rule.impact] = [];
    byImpact[rule.impact].push(rule);
  }
  return byImpact;
}

function groupByCategory(rules: RuleMeta[]): Record<string, RuleMeta[]> {
  const byCategory: Record<string, RuleMeta[]> = {};
  for (const rule of rules) {
    if (!byCategory[rule.category]) byCategory[rule.category] = [];
    byCategory[rule.category].push(rule);
  }
  return byCategory;
}

function buildAgentsMd(rules: RuleMeta[]): string {
  const byImpact = groupByImpact(rules);
  const byCategory = groupByCategory(rules);
  const stack = [
    'NestJS 11',
    'TypeScript strict mode',
    'PostgreSQL',
    'Drizzle ORM + Drizzle Kit',
    'Better Auth + `@thallesp/nestjs-better-auth`',
    '`class-validator` + `class-transformer`',
    '`@nestjs/swagger`',
    '`pnpm`',
  ];

  const lines: string[] = [
    '# AGENTS.md — NestJS Best Practices',
    '',
    '> Auto-generated by `pnpm build`. Do not edit directly — edit files in `rules/` and rebuild.',
    '',
    `> Generated: ${new Date().toISOString()}`,
    `> Total rules: ${rules.length}`,
    '',
    '---',
    '',
    '## Purpose',
    '',
    'Use this file as a compact routing guide for NestJS work in this stack. Read the critical rules first, then open only the matching files in `rules/` for the task at hand.',
    '',
    '## Stack',
    '',
  ];

  for (const item of stack) {
    lines.push(`- ${item}`);
  }
  lines.push('');
  lines.push('## Always Enforce');
  lines.push('');

  for (const rule of byImpact.CRITICAL ?? []) {
    const summary = RULE_SUMMARIES[rule.id] ?? rule.title;
    lines.push(`- \`${rule.id}\`: ${summary} See \`rules/${rule.filename}\`.`);
  }

  lines.push('');
  lines.push('## Task Routing');
  lines.push('');
  lines.push('- Auth or session changes: read `rules/auth-*.md`.');
  lines.push('- DTO, controller, or response-shape changes: read `rules/dto-*.md` and `rules/ctrl-*.md`.');
  lines.push('- Database, schema, query, relation, or migration changes: read `rules/drizzle-*.md`.');
  lines.push('- Config changes: read `rules/config-*.md`.');
  lines.push('- Feature layout changes: read `rules/struct-*.md` and `rules/svc-*.md`.');
  lines.push('- Error handling, API semantics, logging, or tests: read the matching `rules/err-*`, `rules/api-*`, `rules/obs-*`, or `rules/test-*` files.');
  lines.push('- Open `examples/feature-module/` only when you need a concrete implementation shape.');
  lines.push('- Open `examples/anti-patterns/` only when you need a counterexample or review baseline.');
  lines.push('');
  lines.push('## Rule Index');
  lines.push('');

  for (const category of CATEGORY_ORDER) {
    const group = byCategory[category];
    if (!group || group.length === 0) {
      continue;
    }
    lines.push(`### ${category}`);
    lines.push('');
    for (const rule of group) {
      const summary = RULE_SUMMARIES[rule.id] ?? rule.title;
      lines.push(`- \`${rule.id}\` (${rule.impact}): ${summary} File: \`rules/${rule.filename}\`.`);
    }
    lines.push('');
  }

  lines.push('## Maintenance');
  lines.push('');
  lines.push('- Detailed guidance lives in `rules/`.');
  lines.push('- `SKILL.md` should stay short and operational.');
  lines.push('- `metadata.json` is the machine-readable rule inventory.');
  lines.push('- Rebuild this file with `pnpm build` after changing rule metadata or summaries.');

  return lines.join('\n');
}

function buildRulebookMd(rules: RuleMeta[]): string {
  const lines: string[] = [
    '# RULEBOOK.md — NestJS Best Practices Rules',
    '',
    '> Auto-generated by `pnpm build`. Do not edit directly — edit files in `rules/` and rebuild.',
    '',
    `> Generated: ${new Date().toISOString()}`,
    `> Total rules: ${rules.length}`,
    '',
    '---',
    '',
    '## Table of Contents',
    '',
  ];

  const byImpact = groupByImpact(rules);

  for (const impact of Object.keys(IMPACT_ORDER)) {
    const group = byImpact[impact];
    if (!group || group.length === 0) {
      continue;
    }
    lines.push(`### ${impact} (${group.length})`);
    lines.push('');
    for (const rule of group) {
      const anchor = `rule-${rule.id}`;
      lines.push(`- [${rule.id}](#${anchor}) — ${rule.title}`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  for (const rule of rules) {
    const anchor = `rule-${rule.id}`;
    lines.push(`<a id="${anchor}"></a>`);
    lines.push('');
    lines.push(`## [${rule.impact}] ${rule.title}`);
    lines.push('');
    lines.push(`**Rule ID:** \`${rule.id}\` | **Category:** \`${rule.category}\` | **Impact:** \`${rule.impact}\``);
    lines.push('');
    if (rule.tags.length > 0) {
      lines.push(`**Tags:** ${rule.tags.map(t => `\`${t}\``).join(', ')}`);
      lines.push('');
    }
    lines.push(rule.content);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

function main() {
  console.log('Loading rules...');
  const rules = loadRules();
  console.log(`Found ${rules.length} rules`);

  const sorted = sortRules(rules);
  console.log('Rules sorted by impact:');
  for (const [impact, count] of Object.entries(
    sorted.reduce((acc, r) => { acc[r.impact] = (acc[r.impact] || 0) + 1; return acc; }, {} as Record<string, number>)
  )) {
    console.log(`  ${impact}: ${count}`);
  }

  const output = buildAgentsMd(sorted);
  writeFileSync(OUTPUT_FILE, output, 'utf-8');
  const rulebook = buildRulebookMd(sorted);
  writeFileSync(RULEBOOK_FILE, rulebook, 'utf-8');

  const sizeKb = (output.length / 1024).toFixed(1);
  if (Number(sizeKb) > MAX_AGENTS_SIZE_KB) {
    throw new Error(`AGENTS.md exceeds ${MAX_AGENTS_SIZE_KB}KB budget (${sizeKb}KB)`);
  }
  console.log(`\nWrote AGENTS.md (${sizeKb}KB, ${rules.length} rules)`);
  console.log(`Wrote RULEBOOK.md (${(rulebook.length / 1024).toFixed(1)}KB, ${rules.length} rules)`);
}

main();
