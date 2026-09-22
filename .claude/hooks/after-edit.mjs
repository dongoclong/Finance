#!/usr/bin/env node
/**
 * PostToolUse · Write|Edit
 * 1. Formats the touched file with Prettier (silent on success).
 * 2. Runs the design-system lint from .claude/skills/frontend-craft.
 *    Findings are returned to Claude as additional context, not as a hard block —
 *    the goal is a correction on the next turn, not a stalled session.
 */
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8'));
const file = input?.tool_input?.file_path ?? '';
const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();

if (!file || !existsSync(file)) process.exit(0);
const ext = path.extname(file);
if (!['.ts', '.tsx', '.css', '.json', '.md'].includes(ext)) process.exit(0);

// --- 1. format -------------------------------------------------------------
try {
  execFileSync('npx', ['--no-install', 'prettier', '--write', file], {
    cwd: root,
    stdio: 'ignore',
    timeout: 20000,
  });
} catch {
  /* prettier missing or file unparseable — never fail the edit over formatting */
}

// --- 2. design lint --------------------------------------------------------
const src = readFileSync(file, 'utf8');
const lines = src.split('\n');
const findings = [];
const isComponent = ext === '.tsx';
const isToken = /tokens\.css$|globals\.css$/.test(file);

const RULES = [
  {
    when: isComponent,
    re: /(?:text|bg|border|from|to|fill|stroke)-\[#[0-9a-fA-F]{3,8}\]|(?<![\w-])#[0-9a-fA-F]{6}(?![\w-])/,
    msg: 'Raw hex color in a component. Use a semantic token (--ink-*, --bg-*, --series-*). See frontend-craft/references/design-tokens.md.',
  },
  {
    when: isComponent,
    re: /\b(?:p|m|gap|w|h|top|left|right|bottom)[trblxy]?-\[\d+px\]/,
    msg: 'Off-scale spacing. The scale is 4/8/12/16/20/24/32/40/56/72.',
  },
  {
    when: isComponent,
    re: /<div[^>]*\sonClick=/,
    msg: 'Clickable <div>. Use <button> — a div is not keyboard reachable.',
  },
  {
    when: ext === '.ts' || isComponent,
    re: /:\s*any\b|<any>|as any\b/,
    msg: 'Explicit `any`. Give it a real type.',
  },
  {
    when: !isToken,
    re: /outline:\s*none|outline-none(?!.*(?:focus-visible:ring|ring-))/,
    msg: 'Focus outline removed with no visible replacement ring.',
  },
  {
    when: isComponent,
    re: /useEffect\(\(\)\s*=>\s*\{?\s*set[A-Z]\w*\(/,
    msg: 'Possible derived-state effect. If it is computable during render, use useMemo instead.',
  },
  {
    when: isComponent,
    re: /\.map\(\((?:\w+),\s*(?:i|idx|index)\)\s*=>[\s\S]{0,120}?key=\{(?:i|idx|index)\}/,
    msg: 'Array index used as a React key. Use the item id.',
  },
];

lines.forEach((line, i) => {
  if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
  for (const rule of RULES) {
    if (rule.when && rule.re.test(line)) {
      findings.push(`${path.relative(root, file)}:${i + 1} — ${rule.msg}`);
    }
  }
});

if (findings.length) {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext:
          'Design-system lint found issues in the file you just wrote. Fix them now:\n' +
          findings.slice(0, 12).map((f) => `  • ${f}`).join('\n'),
      },
    })
  );
}
process.exit(0);
