#!/usr/bin/env node
/**
 * Playwright agent that navigates claude.ai/code and sets an environment
 * variable for a project — so you never have to touch the web UI manually.
 *
 * Usage (run on your local machine):
 *   node scripts/set-claude-env-var.mjs --token ghp_xxxx
 *   node scripts/set-claude-env-var.mjs --token ghp_xxxx --project rogerhabr/rogerhabr
 *   node scripts/set-claude-env-var.mjs --token ghp_xxxx --key MY_VAR
 *
 * First run: the browser opens so you can log in to claude.ai. Your session
 * is saved to .claude-session/ and reused on every subsequent run.
 *
 * Requires Playwright + Chromium:
 *   npm install          (playwright is already in devDependencies)
 *   npx playwright install chromium   (only needed on your local machine)
 */

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const ROOT        = join(dirname(fileURLToPath(import.meta.url)), '..');
const SESSION_DIR = join(ROOT, '.claude-session');
const STATE_FILE  = join(SESSION_DIR, 'auth.json');

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const get  = (flag, def = null) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : def;
};

const PROJECT = get('--project', 'rogerhabr/rogerhabr');
const KEY     = get('--key', 'GITHUB_TOKEN');
let   TOKEN   = get('--token');

if (!TOKEN) {
  // Try gh CLI
  try {
    TOKEN = execSync('gh auth token', { encoding: 'utf8', stdio: ['pipe','pipe','pipe'] }).trim();
    if (TOKEN) console.log('Token sourced from gh CLI');
  } catch {}
}

if (!TOKEN) {
  // Try .env.local
  const envLocal = join(ROOT, '.env.local');
  if (existsSync(envLocal)) {
    const line = readFileSync(envLocal, 'utf8').split('\n').find(l => l.startsWith(`${KEY}=`));
    if (line) { TOKEN = line.slice(KEY.length + 1).trim(); console.log('Token sourced from .env.local'); }
  }
}

if (!TOKEN) {
  console.error(`No token found. Provide it with --token ghp_xxxx`);
  process.exit(1);
}

// ── Browser ───────────────────────────────────────────────────────────────────
if (!existsSync(SESSION_DIR)) mkdirSync(SESSION_DIR, { recursive: true });

const executablePath = existsSync('/opt/pw-browsers/chromium')
  ? (existsSync('/opt/pw-browsers/chromium-1194')
      ? (() => {
          const dir = readFileSync('/opt/pw-browsers/chromium', 'utf8').trim();
          return join('/opt/pw-browsers', dir, 'chrome-linux', 'chrome');
        })()
      : '/opt/pw-browsers/chromium')
  : undefined;

// Auto-detect headless: if DISPLAY is unset we're probably in a remote container
const headless = !process.env.DISPLAY && process.env.NODE_ENV !== 'local';

const browser = await chromium.launch({
  headless,
  ...(executablePath ? { executablePath } : {}),
  args: headless ? ['--no-sandbox', '--disable-setuid-sandbox'] : [],
});

const context = await browser.newContext({
  storageState: existsSync(STATE_FILE) ? STATE_FILE : undefined,
  viewport: { width: 1280, height: 900 },
});

const page = await context.newPage();

async function saveSession() {
  await context.storageState({ path: STATE_FILE });
}

async function waitForUser(msg) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  await new Promise(r => rl.question(`\n${msg}\nPress Enter when ready... `, () => { rl.close(); r(); }));
}

// ── Navigate ──────────────────────────────────────────────────────────────────
console.log('Opening claude.ai/code …');
await page.goto('https://claude.ai/code', { waitUntil: 'domcontentloaded', timeout: 30_000 });

// Check if we need to log in
const url = page.url();
const needsLogin = url.includes('/login') || url.includes('/sign') || !url.includes('claude.ai');

if (needsLogin || !existsSync(STATE_FILE)) {
  if (headless) {
    console.error('Cannot log in interactively in headless mode. Run locally with DISPLAY set, or provide a saved session.');
    await browser.close();
    process.exit(1);
  }
  console.log('\n→ Please log in to claude.ai in the browser window that just opened.');
  await waitForUser('After you are fully logged in and can see the claude.ai/code page,');
  await saveSession();
  console.log('Session saved — future runs will skip login.');
}

// ── Find the project ──────────────────────────────────────────────────────────
const [owner, repo] = PROJECT.split('/');

console.log(`Looking for project: ${PROJECT} …`);

// Projects may be listed on the main page or under a sidebar
// Try clicking a link that contains the repo name
const projectLink = page.getByText(repo, { exact: false }).first();
const found = await projectLink.isVisible({ timeout: 8_000 }).catch(() => false);

if (found) {
  await projectLink.click();
  await page.waitForLoadState('domcontentloaded');
} else {
  // Try navigating directly if the UI uses URL-based routing
  await page.goto(`https://claude.ai/code`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1_500);
}

// Screenshot for debugging
if (headless) {
  await page.screenshot({ path: join(SESSION_DIR, '01-projects.png') });
  console.log('Screenshot saved → .claude-session/01-projects.png');
}

// ── Open Settings ─────────────────────────────────────────────────────────────
console.log('Looking for Settings …');

// Try multiple strategies to find settings
const settingsSelectors = [
  '[aria-label*="Settings" i]',
  'button:has-text("Settings")',
  'a:has-text("Settings")',
  '[data-testid*="settings"]',
  'button[title*="Settings" i]',
];

let settingsBtn = null;
for (const sel of settingsSelectors) {
  const el = page.locator(sel).first();
  if (await el.isVisible({ timeout: 2_000 }).catch(() => false)) { settingsBtn = el; break; }
}

if (settingsBtn) {
  await settingsBtn.click();
  await page.waitForLoadState('domcontentloaded');
} else if (!headless) {
  await waitForUser(`Could not find a Settings button automatically.\nPlease navigate to the project settings page manually (look for a gear/Settings option).`);
} else {
  await page.screenshot({ path: join(SESSION_DIR, '02-no-settings.png') });
  console.error('Could not find Settings. Screenshot saved to .claude-session/02-no-settings.png');
  await browser.close();
  process.exit(1);
}

if (headless) {
  await page.screenshot({ path: join(SESSION_DIR, '02-settings.png') });
  console.log('Screenshot saved → .claude-session/02-settings.png');
}

// ── Find Environment Variables section ────────────────────────────────────────
console.log('Looking for Environment Variables …');

const envSelectors = [
  'text="Environment variables"',
  'text="Environment Variables"',
  '[aria-label*="environment" i]',
  'button:has-text("Environment")',
];

let envSection = null;
for (const sel of envSelectors) {
  const el = page.locator(sel).first();
  if (await el.isVisible({ timeout: 3_000 }).catch(() => false)) { envSection = el; break; }
}

if (envSection) {
  await envSection.click();
  await page.waitForTimeout(800);
} else if (!headless) {
  await waitForUser('Please navigate to the Environment Variables section in Settings.');
}

// ── Check if KEY already exists ───────────────────────────────────────────────
const existingKey = page.locator(`text="${KEY}"`).first();
const alreadySet = await existingKey.isVisible({ timeout: 2_000 }).catch(() => false);

if (alreadySet) {
  console.log(`${KEY} is already set. Updating value …`);
  // Try to find an edit/update button near the existing key
  const editBtn = page.locator(`text="${KEY}"`).locator('..').getByRole('button').first();
  if (await editBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await editBtn.click();
    await page.waitForTimeout(500);
  }
}

// ── Add / update the env var ──────────────────────────────────────────────────
console.log(`Setting ${KEY} …`);

// Look for an "Add variable" or "+" button
const addSelectors = [
  'button:has-text("Add variable")',
  'button:has-text("Add")',
  'button:has-text("New")',
  '[aria-label*="add" i]',
  'button:has-text("+")',
];

if (!alreadySet) {
  let addBtn = null;
  for (const sel of addSelectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 2_000 }).catch(() => false)) { addBtn = el; break; }
  }

  if (addBtn) {
    await addBtn.click();
    await page.waitForTimeout(600);
  } else if (!headless) {
    await waitForUser(`Could not find an "Add variable" button.\nPlease click "Add variable" or "+" to add a new environment variable.`);
  } else {
    await page.screenshot({ path: join(SESSION_DIR, '03-no-add-btn.png') });
    console.error('Could not find Add button. Screenshot → .claude-session/03-no-add-btn.png');
    await browser.close();
    process.exit(1);
  }
}

// Fill in the key field
const keyInput = page.getByPlaceholder(/key|name|variable/i).first();
if (await keyInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
  await keyInput.fill(KEY);
} else if (!headless) {
  await waitForUser(`Please type "${KEY}" into the key/name field.`);
}

// Fill in the value field
const valueInput = page.getByPlaceholder(/value|token|secret/i).first();
if (await valueInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
  await valueInput.fill(TOKEN);
} else if (!headless) {
  await waitForUser(`Please paste your token into the value field.`);
}

// ── Save ──────────────────────────────────────────────────────────────────────
const saveSelectors = [
  'button:has-text("Save")',
  'button:has-text("Add")',
  'button:has-text("Confirm")',
  'button[type="submit"]',
];

let saved = false;
for (const sel of saveSelectors) {
  const el = page.locator(sel).first();
  if (await el.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await el.click();
    await page.waitForTimeout(1_000);
    saved = true;
    break;
  }
}

if (!saved && !headless) {
  await waitForUser('Please click Save / Confirm to save the environment variable.');
  saved = true;
}

if (headless) {
  await page.screenshot({ path: join(SESSION_DIR, '04-done.png') });
  console.log('Screenshot saved → .claude-session/04-done.png');
}

await saveSession();
await browser.close();

if (saved) {
  console.log(`\n✓ ${KEY} set successfully for ${PROJECT}`);
  console.log('  It will be injected into every future Claude Code remote session.');
} else {
  console.log(`\nBrowser closed. If the variable was saved, you are done.`);
}
