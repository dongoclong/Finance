#!/usr/bin/env node
/**
 * SessionStart
 * Puts the project's working rules and current shape in front of Claude on every
 * session, so conventions do not have to be rediscovered by reading files.
 */
import { existsSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const lines = [];

const pkgPath = path.join(root, 'package.json');
if (existsSync(pkgPath)) {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  lines.push(`Project: ${pkg.name} v${pkg.version} — scripts: ${Object.keys(pkg.scripts ?? {}).join(', ')}`);
}

try {
  const count = execSync(`find "${root}/src" -name '*.tsx' -o -name '*.ts' | wc -l`, {
    stdio: ['ignore', 'pipe', 'ignore'],
  })
    .toString()
    .trim();
  lines.push(`Source files: ${count} under src/`);
} catch {}

lines.push(
  'Working rules for this repo:',
  '  • Load the `frontend-craft` skill before writing or restyling any UI.',
  '  • Load the `finance-domain` skill before touching amounts, budgets, periods or categories.',
  '  • Load the `dataviz` skill before writing any chart, KPI tile or dashboard layout.',
  '  • Run the `ship-ui` checklist before reporting a UI change as done.',
  '  • Money is an integer of đồng. Transfers never count as income or expense.'
);

console.log(
  JSON.stringify({
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: lines.join('\n') },
  })
);
