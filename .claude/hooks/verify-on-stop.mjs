#!/usr/bin/env node
/**
 * Stop
 * Typechecks the app before the turn ends. If tsc fails, the turn is blocked once
 * with the errors so they get fixed instead of shipped. A stamp file guarantees the
 * block fires at most once per failing state — no infinite stop loops.
 */
import { readFileSync, existsSync, writeFileSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8'));
const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const stamp = path.join(root, 'node_modules', '.cache', 'fina-stop-hook');

if (input?.stop_hook_active) process.exit(0);
if (!existsSync(path.join(root, 'tsconfig.app.json'))) process.exit(0);
if (!existsSync(path.join(root, 'node_modules', 'typescript'))) process.exit(0);

let errors = '';
try {
  execSync('npx --no-install tsc --noEmit -p tsconfig.app.json', {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 120000,
  });
} catch (e) {
  errors = `${e.stdout ?? ''}${e.stderr ?? ''}`.trim();
}

if (!errors) {
  try { rmSync(stamp, { force: true }); } catch {}
  process.exit(0);
}

// Same failure as last time? Let the turn end so the user can weigh in.
const fingerprint = errors.slice(0, 4000);
if (existsSync(stamp) && readFileSync(stamp, 'utf8') === fingerprint) process.exit(0);
try {
  writeFileSync(stamp, fingerprint);
} catch {
  process.exit(0);
}

console.log(
  JSON.stringify({
    decision: 'block',
    reason:
      'TypeScript does not compile. Fix these before finishing:\n\n' +
      errors.split('\n').slice(0, 30).join('\n'),
  })
);
process.exit(0);
