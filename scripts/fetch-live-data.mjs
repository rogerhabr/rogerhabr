import { writeFileSync } from 'fs';

async function fetchStock(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LiveDataBot/1.0)' } });
  if (!res.ok) return null;
  const d = await res.json();
  const meta = d.chart?.result?.[0]?.meta;
  if (!meta) return null;
  return {
    price: meta.regularMarketPrice ?? null,
    prevClose: meta.previousClose ?? null,
    changePct: meta.regularMarketPrice && meta.previousClose
      ? +((meta.regularMarketPrice - meta.previousClose) / meta.previousClose * 100).toFixed(2)
      : null,
    marketCap: meta.marketCap ?? null,
  };
}

async function fetchAzureH100Price() {
  try {
    const url = `https://prices.azure.com/api/retail/prices?$filter=serviceName eq 'Virtual Machines' and contains(skuName,'NC40ads H100 v5') and priceType eq 'Consumption' and currencyCode eq 'USD'`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const d = await res.json();
    const item = d.Items?.find(i => i.retailPrice > 0);
    return item?.retailPrice ?? null;
  } catch { return null; }
}

async function main() {
  const result = {
    lastUpdated: new Date().toISOString(),
    stocks: {},
    gpuCloud: {},
    modelPricing: {
      // Hardcoded pricing as of 2026-06 — updated manually when providers change
      'GPT-4o': { inputPerM: 2.50, outputPerM: 10.00 },
      'GPT-4o-mini': { inputPerM: 0.15, outputPerM: 0.60 },
      'Claude Sonnet 4.6': { inputPerM: 3.00, outputPerM: 15.00 },
      'Claude Haiku 4.5': { inputPerM: 0.80, outputPerM: 4.00 },
      'Gemini 1.5 Pro': { inputPerM: 1.25, outputPerM: 5.00 },
      'Gemini 2.0 Flash': { inputPerM: 0.10, outputPerM: 0.40 },
      'DeepSeek V3': { inputPerM: 0.07, outputPerM: 0.28 },
      'Llama 3.3 70B': { inputPerM: 0.23, outputPerM: 0.40 },
    },
  };

  const symbols = ['NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'AMD', 'ORCL', 'MSFT'];
  const uniqueSymbols = [...new Set(symbols)];
  for (const sym of uniqueSymbols) {
    try {
      result.stocks[sym] = await fetchStock(sym);
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      console.error(`Failed ${sym}:`, e.message);
      result.stocks[sym] = null;
    }
  }

  result.gpuCloud.azureH100PerHour = await fetchAzureH100Price();

  writeFileSync('public/live-data.json', JSON.stringify(result, null, 2));
  console.log('Done. NVDA:', result.stocks['NVDA']?.price);
}

main().catch(e => { console.error(e); process.exit(1); });
