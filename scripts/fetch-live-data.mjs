/**
 * fetch-live-data.mjs
 * Live data pipeline — runs on GitHub Actions (ubuntu-latest) daily at 06:00 UTC.
 * Fetches from three real external APIs:
 *   1. Yahoo Finance v8/v11  — stock prices + market caps
 *   2. SEC EDGAR XBRL API   — annual CapEx from 10-K filings
 *   3. Azure Retail Prices  — H100 cloud VM hourly cost
 *   4. Lambda Labs API      — H100 GPU rental price
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

  // Collect ALL 10-K annual CapEx entries across EVERY known field name,
  // then pick the single most recent by period-end date.
  // This handles companies that changed XBRL field names (e.g. Amazon post-2016,
  // NVIDIA whose CapEx field history is fragmented across fiscal years).
  const capexFields = [
    'PaymentsToAcquirePropertyPlantAndEquipment',
    'CapitalExpendituresIncurredButNotYetPaid',
    'PurchasesOfPropertyAndEquipmentAndOtherProductiveAssets',
    'PurchaseOfPropertyPlantAndEquipmentNetOfProceedsFromSales',
    'PurchasesOfPropertyAndEquipment',
    'AcquisitionsOfPropertyPlantAndEquipment',
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
  const result = { value: +(top.val / 1e9).toFixed(2), period: top.end, source: 'SEC EDGAR 10-K' };
  log(`  ${company}: $${result.value}B CapEx (period ending ${result.period}, field: ${top._field})`);
  log(`  Source URL: https://data.sec.gov/api/xbrl/companyfacts/CIK${padded}.json`);
  return result;
}

// ── Azure GPU cloud pricing ───────────────────────────────────────────────────

async function fetchAzureGPUPrice() {
  log(`\n── Azure H100 VM price ──`);
  // Filter: NC-series H100 VMs, Consumption pricing, USD, not spot/low-priority
  // NC40ads_H100_v5 = 1x H100 SXM5 80GB; NC80adis_H100_v5 = 2x H100
  // We want the per-VM price (not per-vCPU), so filter for SKUs with GPU counts
  const queries = [
    `serviceName eq 'Virtual Machines' and contains(skuName,'NC') and contains(skuName,'H100') and priceType eq 'Consumption' and currencyCode eq 'USD'`,
    `serviceName eq 'Virtual Machines' and contains(skuName,'H100') and priceType eq 'Consumption' and currencyCode eq 'USD'`,
  ];
  for (const filter of queries) {
    const url = `https://prices.azure.com/api/retail/prices?$filter=${encodeURIComponent(filter)}`;
    const res = await fetchWithRetry(url, {}, 2);
    if (!res) continue;
    try {
      const d = await res.json();
      log(`  Azure returned ${d.Items?.length ?? 0} items for filter`);
      // Log all matching SKUs so we can see exactly what we got
      (d.Items ?? []).slice(0, 10).forEach(i =>
        log(`    SKU: ${i.skuName} | $${i.retailPrice}/hr | region: ${i.armRegionName} | type: ${i.type}`)
      );
      // Exclude Spot/LowPriority, keep only pay-as-you-go > $5/hr (true GPU VMs cost >$10/hr)
      const items = (d.Items ?? []).filter(i =>
        i.retailPrice > 5 &&
        !i.skuName?.toLowerCase().includes('spot') &&
        !i.skuName?.toLowerCase().includes('low priority') &&
        i.type !== 'DevTest'
      );
      if (items.length > 0) {
        items.sort((a, b) => a.retailPrice - b.retailPrice);
        const item = items[0];
        log(`  Azure H100 (selected): $${item.retailPrice}/hr (SKU: ${item.skuName}, region: ${item.armRegionName})`);
        log(`  Source URL: https://prices.azure.com/api/retail/prices`);
        return { perHour: item.retailPrice, sku: item.skuName, source: 'Azure Retail Prices API' };
      }
    } catch (e) { logE(`  Parse error: ${e.message}`); }
  }
  logE('  Azure H100: no matching SKU found with price > $5/hr');
  return null;
}

// ── Lambda Labs GPU pricing ───────────────────────────────────────────────────

async function fetchLambdaGPUPrice() {
  log(`\n── Lambda Labs H100 price ──`);
  const url = 'https://cloud.lambdalabs.com/api/v1/instance-types';
  const res = await fetchWithRetry(url, {}, 2);
  if (!res) { logE('  Lambda Labs: no response'); return null; }
  try {
    const d = await res.json();
    const instances = Object.values(d.data ?? {});
    const h100 = instances
      .filter(i => i.instance_type?.name?.toLowerCase().includes('h100'))
      .map(i => ({ name: i.instance_type.name, perHour: i.instance_type.price_cents_per_hour / 100 }))
      .sort((a, b) => a.perHour - b.perHour);
    if (h100.length > 0) {
      log(`  Lambda H100: $${h100[0].perHour}/hr (instance: ${h100[0].name})`);
      log(`  Source URL: https://cloud.lambdalabs.com/api/v1/instance-types`);
      return { perHour: h100[0].perHour, sku: h100[0].name, source: 'Lambda Labs API' };
    }
  } catch (e) { logE(`  Parse error: ${e.message}`); }
  logE('  Lambda Labs: no H100 instances found');
  return null;
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
      stocks:       'Yahoo Finance API (query1.finance.yahoo.com/v8/finance/chart/{symbol})',
      capex:        'SEC EDGAR XBRL API (data.sec.gov/api/xbrl/companyfacts/CIK{n}.json) — PaymentsToAcquirePropertyPlantAndEquipment from 10-K',
      gpuCloud:     'Azure Retail Prices API (prices.azure.com) + Lambda Labs API (cloud.lambdalabs.com)',
      modelPricing: 'Public API documentation — manually curated, last reviewed 2026-06',
    },
    stocks:   {},
    gpuCloud: { azureH100PerHour: null, lambdaH100PerHour: null },
    capex:    { MSFT: null, GOOGL: null, AMZN: null, META: null, ORCL: null, NVDA: null },
    modelPricing: {
      // Prices from public API documentation — verified June 2026
      // Anthropic: anthropic.com/pricing
      'Claude Opus 4.8':  { inputPerM: 15.00, outputPerM: 75.00 },
      'Claude Sonnet 4':  { inputPerM:  3.00, outputPerM: 15.00 },
      'Claude Haiku 4.5': { inputPerM:  0.80, outputPerM:  4.00 },
      // OpenAI: platform.openai.com/docs/pricing
      'GPT-4o':           { inputPerM:  2.50, outputPerM: 10.00 },
      'GPT-4o-mini':      { inputPerM:  0.15, outputPerM:  0.60 },
      'GPT-5':            { inputPerM: 10.00, outputPerM: 40.00 },
      // Google: ai.google.dev/pricing
      'Gemini 2.5 Pro':   { inputPerM:  1.25, outputPerM: 10.00 },
      'Gemini 2.5 Flash': { inputPerM: 0.075, outputPerM:  0.30 },
      // DeepSeek: platform.deepseek.com
      'DeepSeek V3':      { inputPerM:  0.07, outputPerM:  0.28 },
      'DeepSeek R2':      { inputPerM:  0.80, outputPerM:  3.20 },
      // Moonshot: platform.moonshot.cn
      'Kimi K2':          { inputPerM:  0.15, outputPerM:  0.60 },
      // Meta via cloud providers
      'Llama 4 Maverick': { inputPerM:  0.19, outputPerM:  0.49 },
    },
  };

  // ── Stocks ────────────────────────────────────────────────────────────────
  log('\n════════════════════════════════════════');
  log(' SECTION 1: Stock Prices (Yahoo Finance)');
  log('════════════════════════════════════════');
  const symbols = ['NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'AMD', 'ORCL'];
  for (const sym of symbols) {
    result.stocks[sym] = await fetchStock(sym);
    await new Promise(r => setTimeout(r, 600));
  }

  // ── SEC EDGAR CapEx ────────────────────────────────────────────────────────
  log('\n════════════════════════════════════════');
  log(' SECTION 2: CapEx from SEC EDGAR 10-K');
  log('════════════════════════════════════════');
  const companies = [
    { ticker: 'MSFT',  cik: 789019  },
    { ticker: 'GOOGL', cik: 1652044 },
    { ticker: 'AMZN',  cik: 1018724 },
    { ticker: 'META',  cik: 1326801 },
    { ticker: 'ORCL',  cik: 1341439 },
    { ticker: 'NVDA',  cik: 1045810 },
  ];
  for (const { ticker, cik } of companies) {
    result.capex[ticker] = await fetchSECCapex(ticker, cik);
    await new Promise(r => setTimeout(r, 800));
  }

  // ── GPU Cloud Pricing ──────────────────────────────────────────────────────
  log('\n════════════════════════════════════════');
  log(' SECTION 3: GPU Cloud Pricing');
  log('════════════════════════════════════════');
  const [azure, lambda] = await Promise.all([fetchAzureGPUPrice(), fetchLambdaGPUPrice()]);
  result.gpuCloud.azureH100PerHour  = azure?.perHour  ?? null;
  result.gpuCloud.lambdaH100PerHour = lambda?.perHour ?? null;

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
  log(`  Azure H100: ${result.gpuCloud.azureH100PerHour ? '$' + result.gpuCloud.azureH100PerHour + '/hr' : 'NULL'}`);
  log(`  Lambda H100: ${result.gpuCloud.lambdaH100PerHour ? '$' + result.gpuCloud.lambdaH100PerHour + '/hr' : 'NULL'}`);

  const nullCount = [
    ...Object.values(result.stocks),
    ...Object.values(result.capex),
    result.gpuCloud.azureH100PerHour,
    result.gpuCloud.lambdaH100PerHour,
  ].filter(v => v === null).length;

  const totalCount = Object.keys(result.stocks).length + Object.keys(result.capex).length + 2;
  log(`\n  Fetched: ${totalCount - nullCount}/${totalCount} data points successfully`);
  log(`  Finished: ${new Date().toISOString()}`);

  writeFileSync('public/live-data.json', JSON.stringify(result, null, 2));
  log('\n  Written to public/live-data.json');

  if (nullCount === totalCount) {
    logE('\n  WARNING: All fetches returned null — check network and API availability');
    process.exit(1);
  }
}

main().catch(e => { logE('Fatal:', e); process.exit(1); });
