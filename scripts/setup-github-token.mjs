#!/usr/bin/env node
/**
 * One-time setup: writes GITHUB_TOKEN to .env.local so the Claude Code
 * remote session-start hook can inject it into each session's environment.
 *
 * Token discovery order:
 *   1. GITHUB_TOKEN already in the current environment
 *   2. `gh auth token` from the GitHub CLI
 *   3. Interactive prompt (stdin)
 *
 * Usage:  node scripts/setup-github-token.mjs
 *         node scripts/setup-github-token.mjs --token ghp_xxxx
 */

import { execSync } from 'child_process';
import { createInterface } from 'readline';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_LOCAL = join(ROOT, '.env.local');

function tryGhCli() {
  try {
    const token = execSync('gh auth token', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    if (token && token.startsWith('gh')) return token;
  } catch {}
  return null;
}

function parseEnvLocal() {
  if (!existsSync(ENV_LOCAL)) return {};
  const lines = readFileSync(ENV_LOCAL, 'utf8').split('\n');
  return Object.fromEntries(
    lines
      .filter(l => l.includes('=') && !l.startsWith('#'))
      .map(l => l.split('=').map(s => s.trim()))
      .map(([k, ...rest]) => [k, rest.join('=')])
  );
}

function writeEnvLocal(entries) {
  const existing = parseEnvLocal();
  const merged = { ...existing, ...entries };
  const content = Object.entries(merged)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n') + '\n';
  writeFileSync(ENV_LOCAL, content, 'utf8');
}

async function promptToken() {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  return new Promise(resolve => {
    process.stderr.write('Enter your GitHub personal access token (needs repo + read:org scopes): ');
    rl.question('', answer => { rl.close(); resolve(answer.trim()); });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const flagIdx = args.indexOf('--token');
  let token = flagIdx >= 0 ? args[flagIdx + 1] : null;

  if (!token) token = process.env.GITHUB_TOKEN || null;

  if (!token) {
    console.error('Trying gh CLI...');
    token = tryGhCli();
    if (token) console.error('  Found token via `gh auth token`');
  }

  if (!token) {
    token = await promptToken();
  }

  if (!token) {
    console.error('No token provided. Aborting.');
    process.exit(1);
  }

  writeEnvLocal({ GITHUB_TOKEN: token });

  console.log(`GITHUB_TOKEN written to .env.local`);
  console.log('The session-start hook will inject it into every remote Claude Code session.');
  console.log('');
  console.log('Verify your token works:');
  console.log('  gh api user --hostname api.github.com -H "Authorization: Bearer $GITHUB_TOKEN"');
}

main().catch(err => { console.error(err); process.exit(1); });
