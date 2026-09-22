#!/usr/bin/env node
/**
 * PreToolUse · Write|Edit
 * Blocks writes to generated, vendored or secret files before they happen.
 */
import { readFileSync } from 'node:fs';

const input = JSON.parse(readFileSync(0, 'utf8'));
const path = input?.tool_input?.file_path ?? '';

const BLOCKED = [
  [/(^|\/)node_modules\//, 'node_modules is vendored — change package.json and reinstall instead.'],
  [/(^|\/)(dist|build|coverage)\//, 'This is a build output. Edit the source in src/ instead.'],
  [/(^|\/)\.env(\.|$)/, 'Secrets file. Ask the user to edit it directly; never write credentials.'],
  [/package-lock\.json$/, 'Lockfiles are generated. Run npm install instead of editing.'],
  [/(^|\/)\.git\//, 'Internal git state — use git commands, not file writes.'],
];

for (const [re, reason] of BLOCKED) {
  if (re.test(path)) {
    console.log(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: `Blocked by guard-paths hook: ${reason}`,
        },
      })
    );
    process.exit(0);
  }
}
process.exit(0);
