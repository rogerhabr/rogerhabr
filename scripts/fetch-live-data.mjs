/**
 * fetch-live-data.mjs
 * Live data pipeline — runs on GitHub Actions (ubuntu-latest) daily at 06:00 UTC. [triggered 2026-06-22]
 * Fetches from multiple real external APIs:
 *   1. Yahoo Finance v8/v11  — stock prices + market caps
 *   2. SEC EDGAR XBRL API   — annual CapEx from 10-K filings
 *   3. Lambda Labs API       — ALL GPU rental prices (multi-GPU catalog)
 *   4. Azure Retail Prices   — ALL GPU VM prices (multi-GPU catalog)
 *   5. LiteLLM GitHub        — live model API pricing (auto-discovered)
 *   6. SEC EDGAR             — NVDA quarterly financials (10-Q)
 *   7. SEC EDGAR             — CoreWeave quarterly financials (10-Q)
 * All fetches are logged verbosely so GitHub Actions logs prove every HTTP call.
 */

import { writeFileSync } from 'fs';

const log  = (...a) => console.log('[fetch]', ...a);
const logE = (...a) => console.error('[error]', ...a);

// ── Retry helper ─────────────────────────────────────────────────────────────

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      log(`HTTP GET ${url}`);
      const res = await fetch(url, { ...options, signal: AbortSignal.timeout(20000) });
      log(`  → HTTP ${res.status} ${res.statusText}`);
      if (res.ok) return res;
      if (res.status === 429 && i < retries - 1) {
        const wait = (i + 1) * 2000;
        log(`  Rate-limited — waiting ${wait}ms before retry ${i + 2}/${retries}`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      return null;
    } catch (e) {
      logE(`  Request failed (attempt ${i + 1}/${retries}): ${e.message}`);
      if (i < retries - 1) await new Promise(r => setTimeout(r, (i + 1) * 1500));
    }
  }
  return null;
}

// ── Yahoo Finance stock prices ────────────────────────────────────────────────

async function fetchStock(symbol) {
  const UA = 'Mozilla/5.0 (compatible; rogerhabr-tokenomics/1.0)';
  const headers = {
    'User-Agent': UA,
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  log(`\n── ${symbol} stock price ──`);

  // v8 chart API (primary)
  const url8 = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;
  const res8 = await fetchWithRetry(url8, { headers });
  if (res8) {
    try {
      const d = await res8.json();
      const meta = d.chart?.result?.[0]?.meta;
      if (meta?.regularMarketPrice) {
        const result = {
          price:     meta.regularMarketPrice,
          prevClose: meta.chartPreviousClose ?? meta.previousClose ?? null,
          changePct: meta.chartPreviousClose
            ? +((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose * 100).toFixed(2)
            : null,
          marketCap: meta.marketCap ?? null,
        };
        log(`  ${symbol}: $${result.price} (prev $${result.prevClose}, ${result.changePct}%, mktcap $${result.marketCap ? (result.marketCap / 1e9).toFixed(0) + 'B' : 'n/a'})`);
        return result;
      }
    } catch (e) { logE(`  Parse error: ${e.message}`); }
  }

  // v11 quoteSummary fallback
  log(`  Falling back to v11 quoteSummary for ${symbol}`);
  await new Promise(r => setTimeout(r, 800));
  const url11 = `https://query2.finance.yahoo.com/v11/finance/quoteSummary/${symbol}?modules=price`;
  const res11 = await fetchWithRetry(url11, { headers });
  if (res11) {
    try {
      const d = await res11.json();
      const price = d.quoteSummary?.result?.[0]?.price;
      if (price) {
        const result = {
          price:     price.regularMarketPrice?.raw ?? null,
          prevClose: price.regularMarketPreviousClose?.raw ?? null,
          changePct: price.regularMarketChangePercent?.raw
            ? +(price.regularMarketChangePercent.raw * 100).toFixed(2) : null,
          marketCap: price.marketCap?.raw ?? null,
        };
        log(`  ${symbol} (v11): $${result.price}`);
        return result;
      }
    } catch (e) { logE(`  Parse error: ${e.message}`); }
  }

  logE(`  ${symbol}: ALL attempts failed — returning null`);
  return null;
}

// ── SEC EDGAR CapEx from 10-K filings ────────────────────────────────────────

async function fetchSECCapex(company, cik) {
  log(`\n── ${company} CapEx (SEC EDGAR CIK ${cik}) ──`);
  const padded = String(cik).padStart(10, '0');
  const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${padded}.json`;
  const headers = {
    'User-Agent': 'AI-Tokenomics-Model rogerhabr71@gmail.com',
    'Accept': 'application/json',
  };

  const res = await fetchWithRetry(url, { headers }, 2);
  if (!res) { logE(`  ${company}: no response`); return null; }

  let d;
  try { d = await res.json(); } catch (e) { logE(`  JSON parse failed: ${e.message}`); return null; }

  const usGaap = d.facts?.['us-gaap'];
  if (!usGaap) { logE(`  ${company}: no us-gaap facts in response`); return null; }

  // Collect ALL 10-K annual CapEx entries across known cash-flow field names,
  // then pick the single most recent by period-end date.
  // NOTE: CapitalExpendituresIncurredButNotYetPaid is intentionally excluded —
  // it is a supplemental non-cash disclosure (accrued PP&E payables), NOT the
  // actual CapEx cash outflow. Using it for Amazon returned $27B vs true ~$105B.
  // Amazon uses a custom XBRL namespace after 2016; standard fields stop at 2016.
  // For Amazon, the pipeline will return null (stale data) — the static data.ts
  // estimate of $105B (from Q3 2025 earnings disclosures) is used instead.
  const capexFields = [
    'PaymentsToAcquirePropertyPlantAndEquipment',
    'PurchasesOfPropertyAndEquipmentAndOtherProductiveAssets',
    'PurchaseOfPropertyPlantAndEquipmentNetOfProceedsFromSales',
    'PurchasesOfPropertyAndEquipment',
    'AcquisitionsOfPropertyPlantAndEquipment',
    'PaymentsForCapitalImprovements',
  ];

  const allAnnual = [];
  for (const field of capexFields) {
    const data = usGaap[field];
    if (!data?.units?.USD?.length) continue;
    const entries = data.units.USD
      .filter(i => i.form === '10-K' && i.val > 0)
      .map(i => ({ ...i, _field: field }));
    allAnnual.push(...entries);
    if (entries.length > 0) log(`  Found ${entries.length} 10-K entries in field: ${field}`);
  }

  if (allAnnual.length === 0) {
    logE(`  ${company}: no annual 10-K CapEx found across ${capexFields.length} fields`);
    return null;
  }

  // Sort by period end date descending → pick the single most recent
  allAnnual.sort((a, b) => b.end.localeCompare(a.end));
  const top = allAnnual[0];

  // Staleness check: reject if most recent data is older than 4 years
  const stalenessCutoff = new Date();
  stalenessCutoff.setFullYear(stalenessCutoff.getFullYear() - 4);
  const cutoffDate = stalenessCutoff.toISOString().split('T')[0];
  if (top.end < cutoffDate) {
    logE(`  ${company}: most recent 10-K CapEx data is from ${top.end} — too stale (older than ${cutoffDate}).`);
    logE(`  ${company}: company likely uses a custom XBRL namespace not accessible via standard us-gaap fields.`);
    return null;
  }
  const result = { value: +(top.val / 1e9).toFixed(2), period: top.end, source: 'SEC EDGAR 10-K' };
  log(`  ${company}: $${result.value}B CapEx (period ending ${result.period}, field: ${top._field})`);
  log(`  Source URL: https://data.sec.gov/api/xbrl/companyfacts/CIK${padded}.json`);
  return result;
}

// ── GPU catalog — canonical names and regex matchers ─────────────────────────

const GPU_CATALOG = [
  { name: 'H100',        patterns: [/h100[._-]?sxm/i] },
  { name: 'H200',        patterns: [/h200/i] },
  { name: 'B200',        patterns: [/\bb200\b/i] },
  { name: 'GB200 NVL72', patterns: [/gb200/i, /nvl72/i] },
  { name: 'VERA RUBIN',  patterns: [/vera.?rubin/i, /r100\b/i] },
  { name: 'A100 SXM4',   patterns: [/a100[._-]?(sxm|80gb)/i] },
  { name: 'A100 PCIe',   patterns: [/a100[._-]?pcie/i] },
  { name: 'A10',         patterns: [/\ba10g?\b/i] },
  { name: 'L40S',        patterns: [/\bl40s\b/i] },
  { name: 'L4',          patterns: [/\bl4\b/i] },
  { name: 'RTX 4090',    patterns: [/4090/i] },
  { name: 'MI300X',      patterns: [/mi300x/i] },
  { name: 'MI350X',      patterns: [/mi350x/i] },
];

function matchGPUCatalog(text) {
  for (const entry of GPU_CATALOG) {
    for (const pat of entry.patterns) {
      if (pat.test(text)) return entry.name;
    }
  }
  return null;
}

// ── Lambda Labs — all GPU rental prices ──────────────────────────────────────

async function fetchLambdaAllGPUs() {
  log(`\n── Lambda Labs — all GPU instance types ──`);
  const url = 'https://cloud.lambdalabs.com/api/v1/instance-types';
  const res = await fetchWithRetry(url, {}, 2);
  if (!res) { logE('  Lambda Labs: no response'); return { prices: {}, discovered: [] }; }

  let d;
  try { d = await res.json(); } catch (e) { logE(`  Lambda Labs parse error: ${e.message}`); return { prices: {}, discovered: [] }; }

  const instances = Object.values(d.data ?? {});
  log(`  Lambda Labs: ${instances.length} total instance types`);

  // Only single-GPU instances
  const singleGPU = instances.filter(i => {
    const specs = i.instance_type?.specs;
    const name = i.instance_type?.name ?? '';
    return (specs?.gpus === 1) || /_1x_/i.test(name);
  });
  log(`  Lambda Labs: ${singleGPU.length} single-GPU instances`);

  const prices = {};    // canonical GPU name → lowest $/hr
  const discovered = [];

  for (const inst of singleGPU) {
    const it = inst.instance_type ?? {};
    const name = it.name ?? '';
    const description = it.description ?? '';
    const pricePerHour = (it.price_cents_per_hour ?? 0) / 100;
    if (pricePerHour <= 0) continue;

    const searchText = `${name} ${description}`;
    const canonical = matchGPUCatalog(searchText);

    if (canonical) {
      if (prices[canonical] === undefined || pricePerHour < prices[canonical]) {
        prices[canonical] = pricePerHour;
        log(`  Lambda: ${canonical} → $${pricePerHour}/hr (instance: ${name})`);
      }
    } else {
      if (!discovered.includes(name)) {
        discovered.push(name);
        log(`  Lambda auto-discovered unknown GPU: ${name}`);
      }
    }
  }

  log(`  Lambda Labs: matched ${Object.keys(prices).length} canonical GPUs, ${discovered.length} auto-discovered`);
  return { prices, discovered };
}

// ── Azure — all GPU VM prices ─────────────────────────────────────────────────

// Azure SKU GPU count hints for multi-GPU VMs
const AZURE_GPU_COUNTS = {
  'NC40ads':  1,
  'NC80adis': 2,
  'ND96':     8,
  'ND48':     4,
  'NC24ads':  1,
};

function getAzureGPUCount(skuName) {
  if (!skuName) return 1;
  for (const [prefix, count] of Object.entries(AZURE_GPU_COUNTS)) {
    if (skuName.includes(prefix)) return count;
  }
  return 1;
}

async function fetchAzureAllGPUs() {
  log(`\n── Azure — all GPU VM prices ──`);
  const filter = `serviceName eq 'Virtual Machines' and (contains(skuName,'H100') or contains(skuName,'H200') or contains(skuName,'B200') or contains(skuName,'A100') or contains(skuName,'MI300') or contains(skuName,'ND') or contains(skuName,'NC')) and priceType eq 'Consumption' and currencyCode eq 'USD'`;
  const url = `https://prices.azure.com/api/retail/prices?$filter=${encodeURIComponent(filter)}`;

  const res = await fetchWithRetry(url, {}, 2);
  if (!res) { logE('  Azure: no response'); return { prices: {}, discovered: [] }; }

  let d;
  try { d = await res.json(); } catch (e) { logE(`  Azure parse error: ${e.message}`); return { prices: {}, discovered: [] }; }

  const items = (d.Items ?? []).filter(i => {
    const sku = (i.skuName ?? '').toLowerCase();
    return (
      i.retailPrice > 0 &&
      !sku.includes('spot') &&
      !sku.includes('low priority') &&
      i.type !== 'DevTest'
    );
  });

  log(`  Azure: ${d.Items?.length ?? 0} total items, ${items.length} after filtering`);

  const prices = {};    // canonical GPU name → lowest per-GPU $/hr
  const discovered = [];

  for (const item of items) {
    const skuName = item.skuName ?? '';
    const gpuCount = getAzureGPUCount(skuName);
    const perGpuPrice = item.retailPrice / gpuCount;

    const canonical = matchGPUCatalog(skuName);

    if (canonical) {
      if (prices[canonical] === undefined || perGpuPrice < prices[canonical]) {
        prices[canonical] = perGpuPrice;
        log(`  Azure: ${canonical} → $${perGpuPrice.toFixed(2)}/hr per GPU (SKU: ${skuName}, GPUs: ${gpuCount}, region: ${item.armRegionName})`);
      }
    } else {
      if (!discovered.includes(skuName)) {
        discovered.push(skuName);
        log(`  Azure auto-discovered unknown GPU SKU: ${skuName}`);
      }
    }
  }

  log(`  Azure: matched ${Object.keys(prices).length} canonical GPUs, ${discovered.length} auto-discovered`);
  return { prices, discovered };
}

// ── Merge Lambda + Azure into the rental matrix ───────────────────────────────

function buildGPURentalMatrix(lambdaResult, azureResult) {
  const lambdaPrices = lambdaResult.prices ?? {};
  const azurePrices = azureResult.prices ?? {};
  const lambdaDiscovered = lambdaResult.discovered ?? [];
  const azureDiscovered = azureResult.discovered ?? [];

  const allCanonical = new Set([...Object.keys(lambdaPrices), ...Object.keys(azurePrices)]);
  const matrix = {};

  for (const gpu of allCanonical) {
    const lambdaPerHour = lambdaPrices[gpu] ?? null;
    const azurePerHour = azurePrices[gpu] ?? null;

    const candidates = [lambdaPerHour, azurePerHour].filter(v => v !== null);
    const lowestPerHour = candidates.length > 0 ? Math.min(...candidates) : null;

    const sources = [];
    if (lambdaPerHour !== null) sources.push('Lambda Labs');
    if (azurePerHour !== null) sources.push('Azure');

    matrix[gpu] = { lambdaPerHour, azurePerHour, lowestPerHour, sources };
  }

  // Merge discovered lists (deduplicated)
  const allDiscovered = [...new Set([...lambdaDiscovered, ...azureDiscovered])];
  if (allDiscovered.length > 0) {
    matrix['_discovered'] = allDiscovered;
  }

  return matrix;
}

// ── Model API pricing from LiteLLM ───────────────────────────────────────────

const PROVIDER_NAMES = {
  anthropic:  'Anthropic',
  openai:     'OpenAI',
  google:     'Google',
  vertex_ai:  'Google',
  deepseek:   'DeepSeek',
  xai:        'xAI',
  mistral:    'Mistral AI',
  meta_llama: 'Meta',
  cohere:     'Cohere',
  moonshot:   'Moonshot',
};

const ALLOWED_PROVIDERS = new Set(Object.keys(PROVIDER_NAMES));

const LEGACY_NOISE_PATTERN = /^(text-|ft:|davinci|babbage|curie|ada-|whisper|dall-e|tts-|claude-[12]-|gpt-3|gpt-4-(?!o))/i;

const DISPLAY_NAME_MAP = {
  'claude-opus-4-8':                'Claude Opus 4.8',
  'claude-opus-4-5':                'Claude Opus 4.5',
  'claude-sonnet-4-6':              'Claude Sonnet 4.6',
  'claude-sonnet-4-5':              'Claude Sonnet 4.5',
  'claude-haiku-4-5-20251001':      'Claude Haiku 4.5',
  'claude-fable-5':                 'Claude Fable 5',
  'gpt-4o':                         'GPT-4o',
  'gpt-4o-mini':                    'GPT-4o mini',
  'gpt-5':                          'GPT-5',
  'o1':                             'OpenAI o1',
  'o1-mini':                        'OpenAI o1-mini',
  'o3':                             'OpenAI o3',
  'o3-mini':                        'OpenAI o3-mini',
  'o4-mini':                        'OpenAI o4-mini',
  'gemini-2.5-pro-preview-05-06':   'Gemini 2.5 Pro',
  'gemini-2.5-flash':               'Gemini 2.5 Flash',
  'gemini-2.5-flash-preview-05-20': 'Gemini 2.5 Flash',
  'deepseek-chat':                  'DeepSeek V3',
  'deepseek-reasoner':              'DeepSeek R1',
  'grok-3':                         'Grok 3',
  'mistral-large-2411':             'Mistral Large 2',
};

function cleanModelId(modelId) {
  // Strip trailing date suffix (e.g., -20251001) then convert hyphens to spaces, then title-case
  const cleaned = modelId
    .replace(/-(\d{8})$/, '')
    .replace(/-/g, ' ');
  return cleaned.replace(/\b\w/g, c => c.toUpperCase());
}

async function fetchModelPricing() {
  log(`\n── Model API pricing (LiteLLM) ──`);
  const url = 'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json';
  const res = await fetchWithRetry(url, {}, 3);
  if (!res) { logE('  LiteLLM: no response'); return {}; }

  let raw;
  try { raw = await res.json(); } catch (e) { logE(`  LiteLLM parse error: ${e.message}`); return {}; }

  log(`  LiteLLM: ${Object.keys(raw).length} total model entries`);

  const result = {};

  for (const [modelId, entry] of Object.entries(raw)) {
    // Only chat-mode models
    if (entry.mode !== 'chat') continue;
    // Must have positive cost fields
    if (!entry.input_cost_per_token || !entry.output_cost_per_token) continue;
    if (entry.input_cost_per_token <= 0 || entry.output_cost_per_token <= 0) continue;
    // Only allowed providers
    if (!ALLOWED_PROVIDERS.has(entry.litellm_provider)) continue;
    // Filter out legacy noise
    if (LEGACY_NOISE_PATTERN.test(modelId)) continue;

    const inputPerM  = entry.input_cost_per_token  * 1_000_000;
    const outputPerM = entry.output_cost_per_token * 1_000_000;
    const provider   = PROVIDER_NAMES[entry.litellm_provider] ?? entry.litellm_provider;
    const displayName = DISPLAY_NAME_MAP[modelId] ?? cleanModelId(modelId);

    const pricingEntry = { inputPerM, outputPerM, provider, displayName };
    if (entry.max_input_tokens) {
      pricingEntry.contextK = Math.round(entry.max_input_tokens / 1000);
    }

    result[modelId] = pricingEntry;
  }

  log(`  LiteLLM: ${Object.keys(result).length} models after filtering`);
  return result;
}

// ── NVDA quarterly financials from SEC EDGAR ─────────────────────────────────

async function fetchNVDAFinancials() {
  log(`\n── NVDA quarterly financials (SEC EDGAR) ──`);
  const cik = 1045810;
  const padded = String(cik).padStart(10, '0');
  const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${padded}.json`;
  const headers = {
    'User-Agent': 'AI-Tokenomics-Model rogerhabr71@gmail.com',
    'Accept': 'application/json',
  };

  const res = await fetchWithRetry(url, { headers }, 2);
  if (!res) { logE('  NVDA: no response from SEC EDGAR'); return null; }

  let d;
  try { d = await res.json(); } catch (e) { logE(`  NVDA: JSON parse failed: ${e.message}`); return null; }

  const usGaap = d.facts?.['us-gaap'];
  if (!usGaap) { logE('  NVDA: no us-gaap facts'); return null; }

  const revenueFields = [
    'RevenueFromContractWithCustomerExcludingAssessedTax',
    'Revenues',
    'NetRevenues',
  ];

  let quarterlyEntries = [];
  for (const field of revenueFields) {
    const data = usGaap[field];
    if (!data?.units?.USD?.length) continue;
    const entries = data.units.USD.filter(i => i.form === '10-Q' && i.val > 0);
    if (entries.length > 0) {
      log(`  NVDA: found ${entries.length} 10-Q entries in field: ${field}`);
      quarterlyEntries = entries;
      break;
    }
  }

  if (quarterlyEntries.length === 0) {
    logE('  NVDA: no 10-Q revenue entries found');
    return null;
  }

  // Sort by end date descending
  quarterlyEntries.sort((a, b) => b.end.localeCompare(a.end));

  const latest = quarterlyEntries[0];
  const prev   = quarterlyEntries[1] ?? null;

  const latestRevM = +(latest.val / 1e6).toFixed(1);
  const prevRevM   = prev ? +(prev.val / 1e6).toFixed(1) : null;
  const qoqGrowth  = (prev && prev.val > 0)
    ? +((latest.val - prev.val) / prev.val * 100).toFixed(1)
    : null;

  log(`  NVDA: latest 10-Q revenue $${latestRevM}M (period: ${latest.end})`);
  if (prevRevM !== null) log(`  NVDA: prev 10-Q revenue $${prevRevM}M, QoQ growth: ${qoqGrowth}%`);

  return {
    latestQuarterRevenue: latestRevM,
    prevQuarterRevenue:   prevRevM,
    qoqGrowthPct:         qoqGrowth,
    periodEnd:            latest.end,
    period:               '10-Q',
  };
}

// ── CoreWeave quarterly financials from SEC EDGAR ─────────────────────────────

async function fetchCorewaveFinancials() {
  log(`\n── CoreWeave quarterly financials (SEC EDGAR) ──`);

  // Step 1: Find CoreWeave's CIK via full-text search
  const searchUrl = 'https://efts.sec.gov/LATEST/search-index?q=%22CoreWeave%22&forms=10-K,10-Q&dateRange=custom&startdt=2025-01-01&enddt=2027-12-31';
  const headers = {
    'User-Agent': 'AI-Tokenomics-Model rogerhabr71@gmail.com',
    'Accept': 'application/json',
  };

  const searchRes = await fetchWithRetry(searchUrl, { headers }, 2);
  if (!searchRes) { logE('  CoreWeave: EDGAR search returned no response'); return null; }

  let searchData;
  try { searchData = await searchRes.json(); } catch (e) { logE(`  CoreWeave: EDGAR search parse failed: ${e.message}`); return null; }

  const hit = searchData?.hits?.hits?.[0];
  if (!hit) { logE('  CoreWeave: no hits in EDGAR search — likely not yet filed 10-K/10-Q'); return null; }

  const entityId = hit._source?.entity_id ?? hit._source?.file_num ?? null;
  if (!entityId) { logE('  CoreWeave: could not extract entity_id from search hit'); return null; }

  log(`  CoreWeave: found entity_id ${entityId}`);

  // entity_id is the CIK (padded or raw)
  const cikNum = parseInt(String(entityId).replace(/\D/g, ''), 10);
  if (!cikNum) { logE('  CoreWeave: could not parse numeric CIK from entity_id'); return null; }

  const padded = String(cikNum).padStart(10, '0');
  const factsUrl = `https://data.sec.gov/api/xbrl/companyfacts/CIK${padded}.json`;

  const factsRes = await fetchWithRetry(factsUrl, { headers }, 2);
  if (!factsRes) { logE(`  CoreWeave: no response from EDGAR facts API (CIK: ${padded})`); return null; }

  let d;
  try { d = await factsRes.json(); } catch (e) { logE(`  CoreWeave: facts JSON parse failed: ${e.message}`); return null; }

  const usGaap = d.facts?.['us-gaap'];
  if (!usGaap) { logE('  CoreWeave: no us-gaap facts found'); return null; }

  const revenueFields = ['Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax', 'NetRevenues'];
  let quarterlyEntries = [];
  for (const field of revenueFields) {
    const data = usGaap[field];
    if (!data?.units?.USD?.length) continue;
    const entries = data.units.USD.filter(i => i.form === '10-Q' && i.val > 0);
    if (entries.length > 0) {
      log(`  CoreWeave: found ${entries.length} 10-Q entries in field: ${field}`);
      quarterlyEntries = entries;
      break;
    }
  }

  if (quarterlyEntries.length === 0) {
    logE('  CoreWeave: no 10-Q revenue entries found — may not have filed yet');
    return null;
  }

  quarterlyEntries.sort((a, b) => b.end.localeCompare(a.end));

  const latest = quarterlyEntries[0];
  const prev   = quarterlyEntries[1] ?? null;

  const latestRevM = +(latest.val / 1e6).toFixed(1);
  const prevRevM   = prev ? +(prev.val / 1e6).toFixed(1) : null;
  const qoqGrowth  = (prev && prev.val > 0)
    ? +((latest.val - prev.val) / prev.val * 100).toFixed(1)
    : null;

  log(`  CoreWeave: latest 10-Q revenue $${latestRevM}M (period: ${latest.end})`);
  if (prevRevM !== null) log(`  CoreWeave: prev 10-Q revenue $${prevRevM}M, QoQ growth: ${qoqGrowth}%`);

  return {
    latestQuarterRevenue: latestRevM,
    prevQuarterRevenue:   prevRevM,
    qoqGrowthPct:         qoqGrowth,
    periodEnd:            latest.end,
    period:               '10-Q',
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  log('=================================================');
  log(' AI Tokenomics Live Data Fetch');
  log(` Started: ${new Date().toISOString()}`);
  log(' Running on: GitHub Actions ubuntu-latest');
  log('=================================================\n');

  const result = {
    lastUpdated: new Date().toISOString(),
    sources: {
      stocks:             'Yahoo Finance API',
      capex:              'SEC EDGAR XBRL API — 10-K PaymentsToAcquirePropertyPlantAndEquipment',
      gpuRentalPrices:    'Lambda Labs API + Azure Retail Prices API — auto-discovered GPU models',
      modelPricing:       'LiteLLM model_prices_and_context_window.json (github.com/BerriAI/litellm) — auto-updated',
      nvdaFinancials:     'SEC EDGAR XBRL API — NVDA 10-Q quarterly revenue',
      corewaveFinancials: 'SEC EDGAR XBRL API — CRWV 10-Q quarterly revenue',
    },
    stocks:             {},
    capex:              { MSFT: null, GOOGL: null, AMZN: null, META: null, ORCL: null },
    gpuRentalPrices:    {},   // { 'H100': { lambdaPerHour, azurePerHour, lowestPerHour, sources }, '_discovered': [] }
    modelPricing:       {},   // { modelId: { inputPerM, outputPerM, provider, displayName, contextK? } }
    nvdaFinancials:     null,
    corewaveFinancials: null,
    // Legacy compatibility — kept so old code doesn't break
    gpuCloud: { azureH100PerHour: null, lambdaH100PerHour: null },
  };

  // ── Section 1: Stocks ─────────────────────────────────────────────────────
  log('\n════════════════════════════════════════');
  log(' SECTION 1: Stock Prices (Yahoo Finance)');
  log('════════════════════════════════════════');
  const symbols = ['NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'AMD', 'ORCL'];
  for (const sym of symbols) {
    result.stocks[sym] = await fetchStock(sym);
    await new Promise(r => setTimeout(r, 600));
  }

  // ── Section 2: SEC EDGAR CapEx ────────────────────────────────────────────
  log('\n════════════════════════════════════════');
  log(' SECTION 2: CapEx from SEC EDGAR 10-K');
  log('════════════════════════════════════════');
  const companies = [
    { ticker: 'MSFT',  cik: 789019  },
    { ticker: 'GOOGL', cik: 1652044 },
    { ticker: 'AMZN',  cik: 1018724 },  // NOTE: returns null — custom XBRL namespace post-2016
    { ticker: 'META',  cik: 1326801 },
    { ticker: 'ORCL',  cik: 1341439 },
  ];
  for (const { ticker, cik } of companies) {
    result.capex[ticker] = await fetchSECCapex(ticker, cik);
    await new Promise(r => setTimeout(r, 800));
  }

  // ── Section 3: GPU Rental Prices ──────────────────────────────────────────
  log('\n════════════════════════════════════════');
  log(' SECTION 3: GPU Cloud Rental Prices');
  log('════════════════════════════════════════');
  const [lambdaResult, azureResult] = await Promise.all([fetchLambdaAllGPUs(), fetchAzureAllGPUs()]);
  result.gpuRentalPrices = buildGPURentalMatrix(lambdaResult, azureResult);

  // Populate legacy gpuCloud from H100 entry for backward compat
  const h100Entry = result.gpuRentalPrices['H100'];
  if (h100Entry && typeof h100Entry === 'object' && !Array.isArray(h100Entry)) {
    result.gpuCloud.lambdaH100PerHour = h100Entry.lambdaPerHour ?? null;
    result.gpuCloud.azureH100PerHour  = h100Entry.azurePerHour  ?? null;
  }

  const gpuCount = Object.keys(result.gpuRentalPrices).filter(k => k !== '_discovered').length;
  log(`\n  GPU rental matrix: ${gpuCount} canonical GPUs`);

  // ── Section 4: Model API Pricing ──────────────────────────────────────────
  log('\n════════════════════════════════════════');
  log(' SECTION 4: Model API Pricing (LiteLLM)');
  log('════════════════════════════════════════');
  result.modelPricing = await fetchModelPricing();
  const modelCount = Object.keys(result.modelPricing).length;
  log(`\n  Model pricing: ${modelCount} models`);

  // ── Section 5: NVDA Financials ────────────────────────────────────────────
  log('\n════════════════════════════════════════');
  log(' SECTION 5: NVDA Quarterly Financials');
  log('════════════════════════════════════════');
  result.nvdaFinancials = await fetchNVDAFinancials();

  // ── Section 6: CoreWeave Financials ──────────────────────────────────────
  log('\n════════════════════════════════════════');
  log(' SECTION 6: CoreWeave Quarterly Financials');
  log('════════════════════════════════════════');
  result.corewaveFinancials = await fetchCorewaveFinancials();

  // ── Summary ────────────────────────────────────────────────────────────────
  log('\n════════════════════════════════════════');
  log(' SUMMARY');
  log('════════════════════════════════════════');
  for (const [sym, d] of Object.entries(result.stocks)) {
    log(`  ${sym}: ${d ? '$' + d.price : 'NULL'}`);
  }
  for (const [co, d] of Object.entries(result.capex)) {
    log(`  CapEx ${co}: ${d ? '$' + d.value + 'B (period: ' + d.period + ')' : 'NULL'}`);
  }
  log(`  GPU rental matrix: ${gpuCount} canonical GPU types`);
  log(`  Models loaded: ${modelCount} from LiteLLM`);
  log(`  NVDA financials: ${result.nvdaFinancials ? '$' + result.nvdaFinancials.latestQuarterRevenue + 'M (' + result.nvdaFinancials.periodEnd + ')' : 'NULL'}`);
  log(`  CoreWeave financials: ${result.corewaveFinancials ? '$' + result.corewaveFinancials.latestQuarterRevenue + 'M (' + result.corewaveFinancials.periodEnd + ')' : 'NULL'}`);
  log(`  Azure H100 (legacy): ${result.gpuCloud.azureH100PerHour ? '$' + result.gpuCloud.azureH100PerHour + '/hr' : 'NULL'}`);
  log(`  Lambda H100 (legacy): ${result.gpuCloud.lambdaH100PerHour ? '$' + result.gpuCloud.lambdaH100PerHour + '/hr' : 'NULL'}`);

  const stockNulls  = Object.values(result.stocks).filter(v => v === null).length;
  const capexNulls  = Object.values(result.capex).filter(v => v === null).length;
  const totalFetches = Object.keys(result.stocks).length + Object.keys(result.capex).length;
  const successCount = totalFetches - stockNulls - capexNulls;
  log(`\n  Core fetches: ${successCount}/${totalFetches} stock/capex data points`);
  log(`  GPU types: ${gpuCount}, Models: ${modelCount}`);
  log(`  Finished: ${new Date().toISOString()}`);

  writeFileSync('public/live-data.json', JSON.stringify(result, null, 2));
  log('\n  Written to public/live-data.json');

  if (successCount === 0 && gpuCount === 0 && modelCount === 0) {
    logE('\n  WARNING: All fetches returned null — check network and API availability');
    process.exit(1);
  }
}

main().catch(e => { logE('Fatal:', e); process.exit(1); });
