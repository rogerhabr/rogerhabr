import { writeFileSync } from 'fs';

// Retry with exponential backoff
async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
      if (res.ok) return res;
      if (res.status === 429 && i < retries - 1) {
        await new Promise(r => setTimeout(r, (i + 1) * 2000));
        continue;
      }
      return null;
    } catch (e) {
      if (i === retries - 1) return null;
      await new Promise(r => setTimeout(r, (i + 1) * 1500));
    }
  }
  return null;
}

// Yahoo Finance — try v8 then v11 API
async function fetchStock(symbol) {
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
  const headers = {
    'User-Agent': UA,
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://finance.yahoo.com/',
  };

  // Try v8 chart API
  const url8 = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;
  const res8 = await fetchWithRetry(url8, { headers });
  if (res8) {
    try {
      const d = await res8.json();
      const meta = d.chart?.result?.[0]?.meta;
      if (meta?.regularMarketPrice) {
        const price = meta.regularMarketPrice;
        const prev = meta.chartPreviousClose ?? meta.previousClose;
        return {
          price,
          prevClose: prev ?? null,
          changePct: prev ? +((price - prev) / prev * 100).toFixed(2) : null,
          marketCap: meta.marketCap ?? null,
        };
      }
    } catch {}
  }

  // Fallback: v11 quoteSummary
  await new Promise(r => setTimeout(r, 800));
  const url11 = `https://query2.finance.yahoo.com/v11/finance/quoteSummary/${symbol}?modules=price`;
  const res11 = await fetchWithRetry(url11, { headers });
  if (res11) {
    try {
      const d = await res11.json();
      const price = d.quoteSummary?.result?.[0]?.price;
      if (price) {
        return {
          price: price.regularMarketPrice?.raw ?? null,
          prevClose: price.regularMarketPreviousClose?.raw ?? null,
          changePct: price.regularMarketChangePercent?.raw
            ? +(price.regularMarketChangePercent.raw * 100).toFixed(2) : null,
          marketCap: price.marketCap?.raw ?? null,
        };
      }
    } catch {}
  }

  return null;
}

// SEC EDGAR — fetch latest annual CapEx from 10-K filings
// Source: https://data.sec.gov/api/xbrl/companyfacts/CIK{padded}.json
async function fetchSECCapex(company, cik) {
  try {
    const padded = String(cik).padStart(10, '0');
    const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${padded}.json`;
    const headers = {
      'User-Agent': 'AI-Tokenomics-Model rogerhabr71@gmail.com',
      'Accept': 'application/json',
    };
    const res = await fetchWithRetry(url, { headers }, 2);
    if (!res) return null;

    const d = await res.json();
    const usGaap = d.facts?.['us-gaap'];
    if (!usGaap) return null;

    // Try multiple CapEx field names
    const capexFields = [
      'PaymentsToAcquirePropertyPlantAndEquipment',
      'CapitalExpendituresIncurredButNotYetPaid',
      'PurchasesOfPropertyAndEquipmentAndOtherProductiveAssets',
    ];

    for (const field of capexFields) {
      const data = usGaap[field];
      if (!data?.units?.USD?.length) continue;

      const items = data.units.USD;
      // Get annual 10-K entries, most recent first
      const annual = items
        .filter(i => i.form === '10-K' && i.val > 0)
        .sort((a, b) => b.end.localeCompare(a.end));

      if (annual.length > 0) {
        return { value: +(annual[0].val / 1e9).toFixed(2), period: annual[0].end, source: 'SEC EDGAR 10-K' };
      }
    }
    return null;
  } catch (e) {
    console.error(`SEC EDGAR failed for ${company}:`, e.message);
    return null;
  }
}

// Azure GPU cloud pricing — H100 and A100 VMs
async function fetchAzureGPUPrice() {
  try {
    // Try multiple H100 SKU patterns
    const queries = [
      `serviceName eq 'Virtual Machines' and contains(skuName,'H100') and priceType eq 'Consumption' and currencyCode eq 'USD'`,
      `serviceName eq 'Virtual Machines' and contains(productName,'NC') and contains(productName,'H100') and priceType eq 'Consumption' and currencyCode eq 'USD'`,
    ];
    for (const filter of queries) {
      const url = `https://prices.azure.com/api/retail/prices?$filter=${encodeURIComponent(filter)}`;
      const res = await fetchWithRetry(url, {}, 2);
      if (!res) continue;
      const d = await res.json();
      const items = (d.Items ?? []).filter(i => i.retailPrice > 0 && !i.skuName?.toLowerCase().includes('spot'));
      if (items.length > 0) {
        items.sort((a, b) => a.retailPrice - b.retailPrice);
        return { perHour: items[0].retailPrice, sku: items[0].skuName, source: 'Azure Retail Prices API' };
      }
    }
    return null;
  } catch { return null; }
}

// Lambda Labs GPU pricing — public pricing page API
async function fetchLambdaGPUPrice() {
  try {
    const url = 'https://cloud.lambdalabs.com/api/v1/instance-types';
    const res = await fetchWithRetry(url, {}, 2);
    if (!res) return null;
    const d = await res.json();
    const instances = Object.values(d.data ?? {});
    const h100 = instances
      .filter(i => i.instance_type?.name?.toLowerCase().includes('h100'))
      .map(i => ({ name: i.instance_type.name, perHour: i.instance_type.price_cents_per_hour / 100 }))
      .sort((a, b) => a.perHour - b.perHour);
    if (h100.length > 0) {
      return { perHour: h100[0].perHour, sku: h100[0].name, source: 'Lambda Labs API' };
    }
    return null;
  } catch { return null; }
}

async function main() {
  const result = {
    lastUpdated: new Date().toISOString(),
    sources: {
      stocks: 'Yahoo Finance API (query1.finance.yahoo.com)',
      capex: 'SEC EDGAR XBRL API (data.sec.gov) — 10-K filings',
      gpuCloud: 'Azure Retail Prices API + Lambda Labs API',
      modelPricing: 'Public API documentation (manually curated, last reviewed 2026-06)',
    },
    stocks: {},
    gpuCloud: {
      azureH100PerHour: null,
      lambdaH100PerHour: null,
    },
    capex: {
      MSFT: null, GOOGL: null, AMZN: null, META: null, ORCL: null, NVDA: null,
    },
    modelPricing: {
      // Prices from public API documentation — updated 2026-06
      'GPT-4o':          { inputPerM: 2.50,  outputPerM: 10.00 },
      'GPT-4o-mini':     { inputPerM: 0.15,  outputPerM: 0.60  },
      'GPT-5':           { inputPerM: 10.00, outputPerM: 40.00 },
      'Claude Opus 4.8': { inputPerM: 15.00, outputPerM: 75.00 },
      'Claude Sonnet 4': { inputPerM: 3.00,  outputPerM: 15.00 },
      'Claude Haiku 4.5':{ inputPerM: 0.80,  outputPerM: 4.00  },
      'Gemini 2.5 Pro':  { inputPerM: 1.25,  outputPerM: 10.00 },
      'Gemini 2.5 Flash':{ inputPerM: 0.075, outputPerM: 0.30  },
      'DeepSeek V3':     { inputPerM: 0.07,  outputPerM: 0.28  },
      'DeepSeek R2':     { inputPerM: 0.80,  outputPerM: 3.20  },
      'Kimi K2':         { inputPerM: 0.15,  outputPerM: 0.60  },
      'Llama 4 Maverick':{ inputPerM: 0.19,  outputPerM: 0.49  },
    },
  };

  // Stocks
  const symbols = ['NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'AMD', 'ORCL'];
  for (const sym of symbols) {
    try {
      result.stocks[sym] = await fetchStock(sym);
      console.log(`${sym}: $${result.stocks[sym]?.price ?? 'null'}`);
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.error(`Stock ${sym} failed:`, e.message);
      result.stocks[sym] = null;
    }
  }

  // SEC EDGAR CapEx — real filings (CIK numbers from EDGAR company search)
  const companies = [
    { ticker: 'MSFT',  cik: 789019  },
    { ticker: 'GOOGL', cik: 1652044 },
    { ticker: 'AMZN',  cik: 1018724 },
    { ticker: 'META',  cik: 1326801 },
    { ticker: 'ORCL',  cik: 1341439 },
    { ticker: 'NVDA',  cik: 1045810 },
  ];
  for (const { ticker, cik } of companies) {
    try {
      result.capex[ticker] = await fetchSECCapex(ticker, cik);
      console.log(`CapEx ${ticker}: $${result.capex[ticker]?.value ?? 'null'}B`);
      await new Promise(r => setTimeout(r, 600));
    } catch (e) {
      console.error(`CapEx ${ticker} failed:`, e.message);
    }
  }

  // GPU Cloud Pricing
  const [azure, lambda] = await Promise.all([fetchAzureGPUPrice(), fetchLambdaGPUPrice()]);
  result.gpuCloud.azureH100PerHour = azure?.perHour ?? null;
  result.gpuCloud.lambdaH100PerHour = lambda?.perHour ?? null;
  console.log(`Azure H100: $${azure?.perHour ?? 'null'}/hr (${azure?.sku ?? '—'})`);
  console.log(`Lambda H100: $${lambda?.perHour ?? 'null'}/hr`);

  writeFileSync('public/live-data.json', JSON.stringify(result, null, 2));
  console.log('\nDone. NVDA:', result.stocks['NVDA']?.price ?? 'null');
}

main().catch(e => { console.error(e); process.exit(1); });
