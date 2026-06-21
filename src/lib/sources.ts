// Data source metadata for every series in the model.
// sourceType:
//   'actual'   — directly from a primary source (10-K, official API docs, press release)
//   'derived'  — computed from actual primary data (e.g. CapEx ÷ GPU price)
//   'estimate' — modeled / analyst consensus; NOT from a primary source
//   'forecast' — model projection for future years (inherently uncertain)

export type SourceType = 'actual' | 'derived' | 'estimate' | 'forecast';

export interface DataSource {
  label: string;
  sourceType: SourceType;
  primarySource: string;
  sourceURL?: string;
  notes?: string;
  yearsActual?: string;   // e.g. "2022–2024"
  yearsForecast?: string; // e.g. "2026E–2028E"
}

export const DATA_SOURCES: Record<string, DataSource> = {

  // ── Hardware ──────────────────────────────────────────────────────────────

  hardwareSpecs: {
    label: 'GPU / Accelerator Specs (FP8 TFLOPS, HBM, Power)',
    sourceType: 'actual',
    primarySource: 'NVIDIA, AMD, Google, Amazon — official product datasheets',
    sourceURL: 'https://www.nvidia.com/en-us/data-center/products/hopper-gpu/',
    notes: 'B200-equivalent normalization uses FP8 TFLOPS ratio: B200 SXM = 4,500 TFLOPS baseline.',
  },

  throughputMatrix: {
    label: 'Token Throughput Matrix (tokens/sec per chip)',
    sourceType: 'derived',
    primarySource: 'Derived from FP8 TFLOPS specs × empirical batch-32 inference scaling factors',
    notes: 'NOT independently benchmarked. Estimates based on published TFLOPS ratios and MLPerf Inference results where available. Treat as order-of-magnitude only.',
    sourceURL: 'https://mlcommons.org/benchmarks/inference-datacenter/',
  },

  hardwareDemandForecast: {
    label: 'GPU Demand Forecast (B200-eq units shipped)',
    sourceType: 'estimate',
    primarySource: 'Modeled from NVIDIA revenue guidance, hyperscaler CapEx, and IDC/Omdia AI server forecasts',
    notes: 'Hyperscalers do not publicly disclose GPU unit purchases. Figures derived from CapEx data ÷ blended GPU ASP. 2025 aligns with NVIDIA revenue guidance (~$175–185B for fiscal 2026). 2026E+ are model projections.',
    yearsActual: '2022–2024',
    yearsForecast: '2026E–2028E',
  },

  vendorMarketShare: {
    label: 'AI Accelerator Market Share by Vendor (%)',
    sourceType: 'estimate',
    primarySource: 'Omdia AI Chips report (2024), IDC Worldwide AI Server Tracker, NVIDIA earnings disclosures',
    notes: 'NVIDIA does not publicly disclose unit share by segment. Estimates based on known customer disclosures (Meta 350k H100s, Microsoft Azure GPU fleet, Google TPU disclosures) and sell-side analyst reports.',
  },

  // ── CapEx ────────────────────────────────────────────────────────────────

  hyperscalerCapex: {
    label: 'Hyperscaler CapEx ($B, calendar year)',
    sourceType: 'actual',
    primarySource: 'SEC EDGAR 10-K/10-Q filings — PaymentsToAcquirePropertyPlantAndEquipment',
    sourceURL: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany',
    notes: [
      'CY2022–2024: Derived from quarterly 10-Q filings (calendar-year sum).',
      'MSFT fiscal year ends June — CY estimate from Q3+Q4 FY prior + Q1+Q2 FY current.',
      'ORCL fiscal year ends May — CY estimate blends two fiscal years.',
      'CY2025: Mix of confirmed guidance (GOOGL $75B, AMZN ~$105B, META $60–65B) and estimates.',
      'CY2026E–2028E: Model projections. Live data from SEC EDGAR XBRL API auto-refreshed daily by GitHub Actions.',
    ].join(' | '),
    yearsActual: '2022–2024',
    yearsForecast: '2026E–2028E',
  },

  hyperscalerGPUs: {
    label: 'Hyperscaler GPU Installed Base (B200-eq units, thousands)',
    sourceType: 'derived',
    primarySource: 'Derived from annual CapEx × estimated GPU CapEx allocation % ÷ blended GPU ASP; cross-checked against company disclosures',
    notes: 'Hyperscalers do NOT publicly disclose exact GPU counts. Meta disclosed 350k H100s (Feb 2024 earnings). Microsoft disclosed 1.8M GPUs total fleet (Build 2024). These anchor points calibrate the model. Other figures are estimates.',
    yearsActual: '2022–2024',
    yearsForecast: '2026E–2028E',
  },

  // ── Revenue & Profit ─────────────────────────────────────────────────────

  revenueByModel: {
    label: 'AI Revenue by Business Model ($B)',
    sourceType: 'estimate',
    primarySource: 'Modeled from: CoreWeave S-1 (compute rental), OpenAI/Anthropic press reports (model API), Cursor/Harvey/Perplexity ARR reports (software)',
    notes: 'Revenue splits between rental/model/software are modeled — no single public source covers all three segments. CoreWeave 2024 revenue ~$1.9B (S-1 filing). OpenAI 2025 ~$11.6B (Bloomberg). Aggregates from these anchors.',
    sourceURL: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=CoreWeave',
    yearsActual: '2022–2025',
    yearsForecast: '2026E–2028E',
  },

  marginsByModel: {
    label: 'Operating Margins by Segment (%)',
    sourceType: 'estimate',
    primarySource: 'CoreWeave S-1 (compute rental ~35%), OpenAI leak/Reuters (model API negative in 2024), public SaaS benchmarks (software margins)',
    notes: 'No comprehensive public margin data for AI segments. CoreWeave gross margin ~45% (2024 S-1). OpenAI reported ~$5B loss on ~$3.7B 2024 revenue (Reuters). Foundation lab margins are private — estimates only.',
  },

  roicByEntity: {
    label: 'ROIC by Entity Type (%)',
    sourceType: 'estimate',
    primarySource: 'Computed from revenue and CapEx estimates above. NOT from primary financial statements.',
    notes: 'ROIC = (revenue − operating costs − amortization) / invested capital. Hyperscaler ROIC directionally consistent with reported returns on invested capital in cloud segments. Foundation lab ROIC from estimated operating income / cumulative funding.',
  },

  // ── Token Economy ────────────────────────────────────────────────────────

  tokenEconomyTAM: {
    label: 'Token Economy TAM ($B)',
    sourceType: 'estimate',
    primarySource: 'Modeled from: OpenAI/Anthropic reported revenues, ChatGPT MAU × ARPU, API pricing × estimated volume, ARR of token-software companies',
    notes: 'TAM methodology: Consumer = MAU × subscription + ad attribution. API Inference = token volume × API price (from Anthropic/OpenAI pricing pages). Token Software = ARR of Cursor, Harvey, Perplexity, Glean, etc. from press/VC disclosures.',
    yearsActual: '2022–2025',
    yearsForecast: '2026E–2028E',
  },

  tokenApps: {
    label: 'Token App MAU & Revenue',
    sourceType: 'estimate',
    primarySource: 'ChatGPT MAU: OpenAI public statements (400M weekly active, March 2025). Google AI Overviews: Google I/O 2024 announcement. Anthropic revenue: Bloomberg. Cursor ARR: press/VC disclosures.',
    notes: 'MAU figures for private apps (Grok, Perplexity, Cursor) are from press reports and may be monthly vs weekly. Revenue figures for private companies are from VC/press disclosures and unaudited.',
    sourceURL: 'https://openai.com/index/chatgpt-usage-march-2025/',
  },

  // ── Model Pricing ────────────────────────────────────────────────────────

  modelPricing: {
    label: 'Model API Pricing ($/1M tokens)',
    sourceType: 'actual',
    primarySource: 'Official API pricing pages — Anthropic, OpenAI, Google AI, DeepSeek, Moonshot, Meta',
    sourceURL: 'https://www.anthropic.com/pricing',
    notes: [
      'Anthropic: anthropic.com/pricing',
      'OpenAI: platform.openai.com/docs/pricing',
      'Google: ai.google.dev/pricing',
      'DeepSeek: platform.deepseek.com/docs/pricing',
      'Meta (Llama): Various cloud providers.',
      'Last reviewed: June 2026. Auto-refreshed from public docs — manual curation required.',
    ].join(' | '),
  },

  priceCompression: {
    label: 'Token Price Compression History',
    sourceType: 'actual',
    primarySource: 'Historical API pricing pages, archived via Wayback Machine / provider changelogs',
    notes: 'Historical prices sourced from provider release announcements. Median/frontier computed from observed prices at each quarter. Verified against known inflection points: GPT-4 launch (Mar 2023 $30/M), GPT-4o (May 2024 $5/M), DeepSeek V3 (Dec 2024 $0.27/M).',
  },

  // ── Foundation Labs ──────────────────────────────────────────────────────

  labRevenue: {
    label: 'Foundation Lab Revenue ($B)',
    sourceType: 'estimate',
    primarySource: 'OpenAI: Bloomberg / Reuters. Anthropic: Bloomberg. xAI: press reports. DeepSeek: industry estimates.',
    notes: 'OpenAI 2025: ~$11.6B annualized run rate confirmed by multiple outlets (Bloomberg, WSJ, NYT). Anthropic 2025: ~$3B+ confirmed (Bloomberg). xAI, DeepSeek: unconfirmed estimates from industry sources. 2022–2023 figures reconstructed from funding context and limited disclosures.',
    yearsActual: '2024–2025',
    yearsForecast: '2026E–2027E',
  },

  labOperatingIncome: {
    label: 'Foundation Lab Operating Income ($B)',
    sourceType: 'estimate',
    primarySource: 'OpenAI: Reuters (~$5B loss on $3.7B revenue, 2024). Anthropic: estimated from headcount × cost benchmarks. xAI/DeepSeek: estimates only.',
    notes: 'Private company financials are not publicly disclosed. These are modeled estimates, NOT audited figures. OpenAI 2024 loss broadly confirmed by multiple media reports. All other figures are the author\'s estimates.',
  },

  fundingRounds: {
    label: 'Foundation Lab Funding Rounds',
    sourceType: 'actual',
    primarySource: 'Public press releases, SEC Form D filings, and verified press coverage',
    notes: 'All rounds verified from at least two independent sources. Valuations are post-money at time of announcement. OpenAI $40B SoftBank round (Mar 2025): confirmed by SoftBank and OpenAI press releases.',
    sourceURL: 'https://efts.sec.gov/LATEST/search-index?q=%22OpenAI%22&dateRange=custom',
  },

  labValuations: {
    label: 'Foundation Lab Valuations ($B)',
    sourceType: 'estimate',
    primarySource: 'Based on latest known funding rounds; 2026E–2027E are model projections',
    notes: '2022–2025 valuations based on most recent confirmed funding round post-money valuation at year-end. Future valuations extrapolated from revenue multiples. Not mark-to-market — private valuations are point-in-time estimates.',
    yearsActual: '2022–2025',
    yearsForecast: '2026E–2027E',
  },

  labHeadcount: {
    label: 'Foundation Lab Headcount',
    sourceType: 'estimate',
    primarySource: 'LinkedIn public data, press reports, company blog posts',
    notes: 'OpenAI: CEO statements and LinkedIn. Anthropic: LinkedIn scrapes. xAI and DeepSeek: press estimates. Numbers are approximate and likely undercounted for China-based labs.',
  },

  // ── SaaS & Disruption ────────────────────────────────────────────────────

  saasDisruptions: {
    label: 'SaaS Disruption Risk Analysis',
    sourceType: 'actual',
    primarySource: 'Revenue from SEC 10-K/earnings reports. Risk % are author\'s estimates based on product analysis.',
    notes: 'Revenue figures: Salesforce FY2024 10-K, ServiceNow 10-K, Adobe 10-K, Atlassian 10-K, Workday 10-K, SAP annual report, Microsoft 10-K, Oracle 10-K. "Revenue at risk %" is the AUTHOR\'S ESTIMATE of revenue from features automatable by AI agents — NOT from company disclosures.',
    sourceURL: 'https://www.sec.gov/cgi-bin/browse-edgar',
  },

  tokenConsumers: {
    label: 'Token-Consuming Software Companies (ARR)',
    sourceType: 'estimate',
    primarySource: 'Press reports, VC disclosures, and company blog posts. None are from audited financial statements.',
    notes: 'Cursor $500M ARR: confirmed by press reports (2025). Perplexity $150M ARR: press reports. Harvey $100M ARR: press reports. All others estimated. ARR figures for private companies are unaudited and sourced from VC/media.',
  },

  // ── Compute Supply/Demand ─────────────────────────────────────────────────

  supplyDemand: {
    label: 'Compute Supply vs Demand (B200-eq EFLOPS)',
    sourceType: 'derived',
    primarySource: 'Derived from GPU installed base × utilization rate × operational efficiency assumptions',
    notes: 'Supply = installed GPUs × FP8 TFLOPS × utilization % × 0.85 efficiency. Demand estimated from workload analysis. Balance is model output, not measured data. EFLOPS = 10^18 FP8 FLOPS.',
  },

  // ── Workloads ─────────────────────────────────────────────────────────────

  workloads: {
    label: 'AI Workload Mix & Token Characteristics',
    sourceType: 'estimate',
    primarySource: 'Inferred from API provider pricing tier structures, Anthropic usage reports, and published AI adoption surveys',
    notes: 'Token counts per session are estimates from API cost analyses and public Anthropic model card data. Adoption shares are the author\'s estimates — no comprehensive public survey covers this breakdown.',
  },
};

// ── Colour coding for source types ──────────────────────────────────────────

export const SOURCE_TYPE_CONFIG: Record<SourceType, { label: string; bg: string; text: string; dot: string }> = {
  actual:   { label: 'Actual',   bg: 'bg-green-900/30',  text: 'text-green-400',  dot: 'bg-green-400'  },
  derived:  { label: 'Derived',  bg: 'bg-blue-900/30',   text: 'text-blue-400',   dot: 'bg-blue-400'   },
  estimate: { label: 'Modeled',  bg: 'bg-yellow-900/30', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  forecast: { label: 'Forecast', bg: 'bg-purple-900/30', text: 'text-purple-400', dot: 'bg-purple-400' },
};
