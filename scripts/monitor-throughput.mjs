/**
 * monitor-throughput.mjs
 * ──────────────────────────────────────────────────────────────────────────────
 * Autonomous "tokens / model / xPU" monitoring agent.
 *
 * Watches industry evolution of inference throughput (output tokens per second,
 * per model, per accelerator) and proposes RELIABLE updates to the model via a
 * pull request — it never writes to the live model directly.
 *
 * Design (see AskUserQuestion decisions):
 *   • HYBRID engine — deterministic cross-validating collectors that run for free
 *     in CI, plus an optional Claude-API extraction layer that activates ONLY when
 *     ANTHROPIC_API_KEY is present in the environment.
 *   • PR-GATED — writes a candidate dataset + an evidence report; the GitHub
 *     Actions workflow opens/updates a PR. A human reviews before anything reaches
 *     the model.
 *   • ISOLATED — owns public/throughput-data.json exclusively. The daily
 *     fetch-live-data.mjs pipeline rewrites live-data.json from scratch and must
 *     never clobber throughput, so throughput lives in its own file.
 *
 * Reliability model:
 *   Each (model, accelerator) cell is corroborated across independent sources.
 *     high   — ≥2 independent sources agreeing within ±TOLERANCE
 *     medium — exactly 1 source, or ≥2 sources disagreeing beyond tolerance
 *   A cell is only treated as a "material change" (→ opens a PR) if it is new,
 *   moved >MATERIAL_DELTA vs the last accepted value, or its confidence improved.
 *
 * NO throughput numbers are hardcoded. The alias tables below are name-mapping
 * configuration only; every tokens/sec value comes from a live source at runtime.
 */

import { writeFileSync, readFileSync, existsSync, appendFileSync } from 'fs';

const log  = (...a) => console.log('[throughput]', ...a);
const logE = (...a) => console.error('[error]', ...a);

const OUT_DATA   = 'public/throughput-data.json';
const OUT_REPORT = 'throughput-update-report.md';

// Cross-source agreement tolerance and "material change" threshold.
const TOLERANCE        = 0.15; // ±15% → two sources count as agreeing
const MATERIAL_DELTA   = 0.10; // >10% move vs last accepted value → propose update

// ── Canonical vocabularies (must match the columns/rows of throughputMatrix in
//    src/lib/data.ts so the UI override lines up exactly). Names only — no values.

// Canonical accelerator → regex matchers for messy source names.
const HARDWARE_ALIASES = [
  { canon: 'GB300',            patterns: [/gb300/i] },
  { canon: 'GB200',            patterns: [/gb200/i, /nvl72/i] },
  { canon: 'VR200',            patterns: [/vera.?rubin/i, /\bvr200\b/i, /\br100\b/i] },
  { canon: 'B300',             patterns: [/\bb300\b/i] },
  { canon: 'B200',             patterns: [/\bb200\b/i] },
  { canon: 'H200',             patterns: [/\bh200\b/i] },
  { canon: 'H100',             patterns: [/\bh100\b/i, /hopper/i] },
  { canon: 'TPU v7 Ironwood',  patterns: [/ironwood/i, /tpu.?v7/i] },
  { canon: 'TPU v5p',          patterns: [/tpu.?v5p/i] },
  { canon: 'Trainium 3',       patterns: [/trainium.?3/i, /\btrn3\b/i] },
  { canon: 'Trainium 2',       patterns: [/trainium.?2/i, /\btrn2\b/i] },
  { canon: 'MI350X',           patterns: [/mi350x/i] },
  { canon: 'MI300X',           patterns: [/mi300x/i] },
];

// Canonical model → regex matchers. Keys match throughputMatrix model columns.
const MODEL_ALIASES = [
  { canon: 'GPT-5',            patterns: [/gpt[\s-]?5/i] },
  { canon: 'GPT-4o',          patterns: [/gpt[\s-]?4o/i, /gpt[\s-]?4[\s-]?omni/i] },
  { canon: 'Claude Opus 4.8',  patterns: [/claude.*opus.*4\.?8/i, /opus[\s-]?4\.?8/i] },
  { canon: 'Claude Sonnet 4',  patterns: [/claude.*sonnet.*4/i, /sonnet[\s-]?4/i] },
  { canon: 'Fable 5',          patterns: [/\bfable[\s-]?5\b/i] },
  { canon: 'DeepSeek V3',      patterns: [/deepseek.*v3/i, /deepseek[\s-]?3/i] },
  { canon: 'Kimi K2',          patterns: [/kimi.?k2/i] },
  { canon: 'Gemini 2.5 Pro',   patterns: [/gemini.*2\.5.*pro/i] },
];

function canonicalize(table, raw) {
  if (!raw) return null;
  for (const entry of table) {
    if (entry.patterns.some(p => p.test(raw))) return entry.canon;
  }
  return null;
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      log(`HTTP ${options.method || 'GET'} ${url}`);
      const res = await fetch(url, { ...options, signal: AbortSignal.timeout(25000) });
      log(`  → HTTP ${res.status} ${res.statusText}`);
      if (res.ok) return res;
      if (res.status === 429 && i < retries - 1) {
        await new Promise(r => setTimeout(r, (i + 1) * 2000));
        continue;
      }
      return null;
    } catch (e) {
      logE(`  request failed (${i + 1}/${retries}): ${e.message}`);
      if (i < retries - 1) await new Promise(r => setTimeout(r, (i + 1) * 1500));
    }
  }
  return null;
}

/**
 * A record produced by a collector:
 *   { model, hardware, tokensPerSec, source, url }
 * model/hardware are RAW source strings; they get canonicalized centrally.
 */

// ── Collector 1: Artificial Analysis ──────────────────────────────────────────
// Continuously benchmarks median output tokens/sec per model across providers.
// Their API requires AA_API_KEY (https://artificialanalysis.ai/api). Without a
// key the collector returns [] rather than guessing.
async function collectArtificialAnalysis() {
  const key = process.env.AA_API_KEY;
  if (!key) { log('Artificial Analysis: no AA_API_KEY — skipping'); return []; }
  const res = await fetchWithRetry('https://artificialanalysis.ai/api/v2/data/llms/models', {
    headers: { 'x-api-key': key, 'Accept': 'application/json' },
  });
  if (!res) return [];
  try {
    const json = await res.json();
    const rows = Array.isArray(json?.data) ? json.data : [];
    const out = [];
    for (const m of rows) {
      // AA exposes median output speed (tokens/s). Hardware is provider-dependent
      // and not always disclosed; only keep rows that name an accelerator.
      const tps = m?.median_output_tokens_per_second ?? m?.output_speed;
      const hw  = m?.hardware ?? m?.accelerator ?? '';
      if (typeof tps === 'number' && tps > 0 && hw) {
        out.push({ model: m.name ?? m.model_name, hardware: hw, tokensPerSec: tps,
          source: 'Artificial Analysis', url: 'https://artificialanalysis.ai/' });
      }
    }
    log(`Artificial Analysis: ${out.length} usable rows`);
    return out;
  } catch (e) { logE(`Artificial Analysis parse: ${e.message}`); return []; }
}

// ── Collector 2: MLPerf Inference (MLCommons) ─────────────────────────────────
// MLPerf publishes per-system inference results (tokens/s) for reference models.
// Results live in versioned CSVs; a results-summary URL can be supplied via
// MLPERF_RESULTS_URL. Without it the collector returns [].
async function collectMLPerf() {
  const url = process.env.MLPERF_RESULTS_URL;
  if (!url) { log('MLPerf: no MLPERF_RESULTS_URL — skipping'); return []; }
  const res = await fetchWithRetry(url, { headers: { 'Accept': 'text/csv,application/json' } });
  if (!res) return [];
  try {
    const text = await res.text();
    const out = [];
    // Tolerant CSV: detect columns named like model / accelerator / tokens-per-second.
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const iModel = header.findIndex(h => /model|benchmark|network/.test(h));
    const iHw    = header.findIndex(h => /accelerator|system|device|gpu|chip/.test(h));
    const iTps   = header.findIndex(h => /tokens.*s(ec)?|throughput|samples.*s/.test(h));
    if (iModel < 0 || iHw < 0 || iTps < 0) return [];
    for (const line of lines.slice(1)) {
      const cols = line.split(',');
      const tps = parseFloat(cols[iTps]);
      if (Number.isFinite(tps) && tps > 0) {
        out.push({ model: cols[iModel]?.trim(), hardware: cols[iHw]?.trim(),
          tokensPerSec: tps, source: 'MLPerf Inference', url });
      }
    }
    log(`MLPerf: ${out.length} usable rows`);
    return out;
  } catch (e) { logE(`MLPerf parse: ${e.message}`); return []; }
}

// ── Collector 3 (HYBRID LLM layer): Claude extraction from heterogeneous pages ─
// Activates ONLY when ANTHROPIC_API_KEY is set. Fetches a small list of source
// pages (THROUGHPUT_LLM_SOURCES, comma-separated URLs) and asks Claude to extract
// structured {model, hardware, tokensPerSec} records with provenance. The model
// id is configurable (THROUGHPUT_LLM_MODEL) so this script is not pinned to one.
async function collectViaLLM() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) { log('LLM layer: no ANTHROPIC_API_KEY — skipping (deterministic-only run)'); return []; }
  const srcEnv = process.env.THROUGHPUT_LLM_SOURCES;
  const sources = (srcEnv ? srcEnv.split(',') : []).map(s => s.trim()).filter(Boolean);
  if (sources.length === 0) { log('LLM layer: no THROUGHPUT_LLM_SOURCES configured — skipping'); return []; }

  const model = process.env.THROUGHPUT_LLM_MODEL || 'claude-sonnet-4-6';
  const docs = [];
  for (const url of sources.slice(0, 8)) {
    const res = await fetchWithRetry(url, { headers: { 'User-Agent': 'rogerhabr-throughput/1.0' } });
    if (!res) continue;
    const raw = await res.text();
    // Strip tags crudely; cap length to keep token use bounded.
    const text = raw.replace(/<script[\s\S]*?<\/script>/gi, ' ')
                    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
                    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 24000);
    docs.push({ url, text });
  }
  if (docs.length === 0) return [];

  const instruction = [
    'You extract LLM inference throughput facts from source text.',
    'Return ONLY a JSON array. Each item: {"model": string, "hardware": string, "tokensPerSec": number, "url": string}.',
    'tokensPerSec = output (generation) tokens per second for ONE accelerator/chip running ONE model.',
    'Only include a row if the source explicitly states a numeric tokens/sec tied to a named model AND a named accelerator (e.g. H100, B200, GB200, MI300X, TPU). Do NOT estimate or infer. If unsure, omit the row.',
    'No prose, no markdown — just the JSON array.',
  ].join(' ');

  const userContent = docs.map((d, i) => `SOURCE ${i + 1} (${d.url}):\n${d.text}`).join('\n\n---\n\n');

  const res = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4000,
      system: instruction,
      messages: [{ role: 'user', content: userContent }],
    }),
  }, 2);
  if (!res) return [];
  try {
    const json = await res.json();
    const txt = json?.content?.[0]?.text ?? '[]';
    const match = txt.match(/\[[\s\S]*\]/);
    const arr = match ? JSON.parse(match[0]) : [];
    const out = arr
      .filter(r => r && typeof r.tokensPerSec === 'number' && r.tokensPerSec > 0 && r.model && r.hardware)
      .map(r => ({ model: String(r.model), hardware: String(r.hardware),
        tokensPerSec: r.tokensPerSec, source: 'LLM extraction', url: r.url || 'llm' }));
    log(`LLM layer: ${out.length} extracted rows from ${docs.length} sources`);
    return out;
  } catch (e) { logE(`LLM parse: ${e.message}`); return []; }
}

// ── Aggregation + confidence ──────────────────────────────────────────────────

function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function aggregate(records) {
  // Canonicalize and bucket by "HW||MODEL".
  const buckets = new Map();
  let canonHits = 0;
  for (const r of records) {
    const hw = canonicalize(HARDWARE_ALIASES, r.hardware);
    const md = canonicalize(MODEL_ALIASES, r.model);
    if (!hw || !md) continue;
    canonHits++;
    const k = `${hw}||${md}`;
    if (!buckets.has(k)) buckets.set(k, { hardware: hw, model: md, samples: [] });
    buckets.get(k).samples.push({ value: r.tokensPerSec, source: r.source, url: r.url });
  }
  log(`Canonicalized ${canonHits}/${records.length} records into ${buckets.size} (model×xPU) cells`);

  const cells = {}; // cells[hardware][model] = {...}
  for (const { hardware, model, samples } of buckets.values()) {
    const sources = [...new Set(samples.map(s => s.source))];
    const values = samples.map(s => s.value);
    const value = Math.round(median(values));
    const spread = values.length > 1 ? (Math.max(...values) - Math.min(...values)) / median(values) : 0;
    const independent = sources.length;
    const confidence = independent >= 2 && spread <= TOLERANCE ? 'high' : 'medium';
    cells[hardware] ??= {};
    cells[hardware][model] = {
      tokensPerSec: value,
      confidence,
      sources,
      sampleCount: samples.length,
      spreadPct: Math.round(spread * 1000) / 10,
      evidence: samples.map(s => ({ value: s.value, source: s.source, url: s.url })),
    };
  }
  return cells;
}

// ── Diff vs last accepted ─────────────────────────────────────────────────────

function loadBaseline() {
  if (!existsSync(OUT_DATA)) return { cells: {} };
  try { return JSON.parse(readFileSync(OUT_DATA, 'utf8')); }
  catch { return { cells: {} }; }
}

function diffCells(baseCells, newCells) {
  const changes = [];
  for (const hw of Object.keys(newCells)) {
    for (const md of Object.keys(newCells[hw])) {
      const next = newCells[hw][md];
      const prev = baseCells?.[hw]?.[md];
      if (!prev) {
        changes.push({ hw, md, kind: 'new', prev: null, next });
      } else {
        const delta = prev.tokensPerSec > 0
          ? Math.abs(next.tokensPerSec - prev.tokensPerSec) / prev.tokensPerSec : 1;
        const confImproved = prev.confidence !== 'high' && next.confidence === 'high';
        if (delta > MATERIAL_DELTA || confImproved) {
          changes.push({ hw, md, kind: confImproved && delta <= MATERIAL_DELTA ? 'confidence' : 'moved',
            prev, next, deltaPct: Math.round(delta * 1000) / 10 });
        }
      }
    }
  }
  return changes;
}

// ── Report ────────────────────────────────────────────────────────────────────

function buildReport(changes, cells, collectorStats, asOf) {
  const high = changes.filter(c => c.next.confidence === 'high').length;
  const lines = [];
  lines.push('## Proposed tokens/sec-per-model-per-xPU updates');
  lines.push('');
  lines.push(`Generated by the throughput monitoring agent on \`${asOf}\`.`);
  lines.push('');
  lines.push('### Collectors');
  for (const [name, n] of Object.entries(collectorStats)) {
    lines.push(`- **${name}** — ${n} usable record(s)`);
  }
  lines.push('');
  lines.push(`### Material changes: ${changes.length} (${high} high-confidence)`);
  lines.push('');
  if (changes.length) {
    lines.push('| Accelerator | Model | Change | New tok/s | Δ | Confidence | Sources |');
    lines.push('|---|---|---|---|---|---|---|');
    for (const c of changes) {
      const prev = c.prev ? c.prev.tokensPerSec : '—';
      const delta = c.kind === 'new' ? 'NEW' : c.kind === 'confidence' ? '↑ conf' : `${c.deltaPct}%`;
      lines.push(`| ${c.hw} | ${c.md} | ${c.kind} | ${prev} → **${c.next.tokensPerSec}** | ${delta} | ${c.next.confidence} | ${c.next.sources.join(', ')} |`);
    }
  } else {
    lines.push('_No material changes vs the last accepted dataset._');
  }
  lines.push('');
  lines.push('### Reliability notes');
  lines.push('- **high** = ≥2 independent sources agreeing within ±15% (median used).');
  lines.push('- **medium** = single source, or sources disagreeing beyond tolerance.');
  lines.push('- The UI prefers these live values only where confidence is high; the static `throughputMatrix` remains the fallback.');
  lines.push('- Every value is traceable to its source in `public/throughput-data.json` (`evidence` field). No values are hardcoded.');
  lines.push('');
  lines.push('> Review the diff in `public/throughput-data.json` before merging. Merging publishes these into the live model on the next deploy.');
  return lines.join('\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const asOf = new Date().toISOString();
  log('Throughput monitoring agent starting', asOf);

  const [aa, mlperf, llm] = await Promise.all([
    collectArtificialAnalysis(),
    collectMLPerf(),
    collectViaLLM(),
  ]);
  const all = [...aa, ...mlperf, ...llm];
  const collectorStats = {
    'Artificial Analysis': aa.length,
    'MLPerf Inference': mlperf.length,
    'LLM extraction': llm.length,
  };
  log(`Collected ${all.length} raw records total`);

  const cells = aggregate(all);
  const cellCount = Object.values(cells).reduce((n, m) => n + Object.keys(m).length, 0);

  const baseline = loadBaseline();
  const changes = diffCells(baseline.cells || {}, cells);

  // Preserve previously-accepted cells that no source covered this run, so a
  // transient source outage never deletes good data.
  const merged = JSON.parse(JSON.stringify(baseline.cells || {}));
  for (const hw of Object.keys(cells)) {
    merged[hw] ??= {};
    for (const md of Object.keys(cells[hw])) merged[hw][md] = cells[hw][md];
  }

  const hasChanges = changes.length > 0;

  // Emit GitHub Actions output so the workflow can gate the PR step.
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `has_changes=${hasChanges}\n`);
    appendFileSync(process.env.GITHUB_OUTPUT, `change_count=${changes.length}\n`);
  }

  log(`\nSUMMARY: ${all.length} records → ${cellCount} cells this run, ${changes.length} material change(s)`);

  if (!hasChanges) {
    log('No material changes — not writing candidate or report (no PR will be opened).');
    return;
  }

  const payload = {
    asOf,
    tolerance: TOLERANCE,
    materialDelta: MATERIAL_DELTA,
    collectorStats,
    cells: merged,
  };
  writeFileSync(OUT_DATA, JSON.stringify(payload, null, 2));
  writeFileSync(OUT_REPORT, buildReport(changes, merged, collectorStats, asOf));
  log(`Wrote ${OUT_DATA} and ${OUT_REPORT} — ${changes.length} change(s) ready for PR review.`);
}

main().catch(e => { logE('Fatal:', e); process.exit(1); });
