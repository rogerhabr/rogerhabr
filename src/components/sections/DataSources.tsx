'use client';

import SectionHeader from '../SectionHeader';
import { DATA_SOURCES, SOURCE_TYPE_CONFIG, SourceType } from '@/lib/sources';

interface PipelineStatusProps {
  name: string;
  endpoint: string;
  method: string;
  status: 'live' | 'static' | 'manual';
  lastNote: string;
}

function PipelineRow({ name, endpoint, method, status, lastNote }: PipelineStatusProps) {
  const statusCfg = {
    live:   { label: 'Auto-refreshed daily', bg: 'bg-green-900/30',  text: 'text-green-400'  },
    static: { label: 'Static model data',    bg: 'bg-yellow-900/30', text: 'text-yellow-400' },
    manual: { label: 'Manually curated',     bg: 'bg-blue-900/30',   text: 'text-blue-400'   },
  }[status];

  return (
    <tr className="border-b border-sa-border hover:bg-sa-surface/50 transition-colors">
      <td className="px-3 py-3 text-white text-sm font-medium">{name}</td>
      <td className="px-3 py-3 text-sa-muted text-xs font-mono">{endpoint}</td>
      <td className="px-3 py-3 text-sa-muted text-xs">{method}</td>
      <td className="px-3 py-3">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
          {statusCfg.label}
        </span>
      </td>
      <td className="px-3 py-3 text-sa-muted text-xs">{lastNote}</td>
    </tr>
  );
}

function SourceCard({ id }: { id: string }) {
  const src = DATA_SOURCES[id];
  if (!src) return null;
  const cfg = SOURCE_TYPE_CONFIG[src.sourceType];
  return (
    <div className="bg-sa-card rounded-xl border border-sa-border p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-semibold text-white leading-snug">{src.label}</h4>
        <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>
      <p className="text-xs text-sa-accent mb-2 font-medium">{src.primarySource}</p>
      {src.notes && <p className="text-xs text-sa-muted leading-relaxed">{src.notes}</p>}
      <div className="flex items-center gap-4 mt-3 flex-wrap">
        {src.yearsActual && (
          <span className="text-xs bg-green-900/20 text-green-400 px-2 py-0.5 rounded">
            Actual: {src.yearsActual}
          </span>
        )}
        {src.yearsForecast && (
          <span className="text-xs bg-purple-900/20 text-purple-400 px-2 py-0.5 rounded">
            Forecast: {src.yearsForecast}
          </span>
        )}
        {src.sourceURL && (
          <a
            href={src.sourceURL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-sa-accent hover:text-white underline underline-offset-2 transition-colors"
          >
            Primary Source ↗
          </a>
        )}
      </div>
    </div>
  );
}

const SOURCE_TYPE_ORDER: SourceType[] = ['actual', 'derived', 'estimate', 'forecast'];

export default function DataSources() {
  const grouped: Record<SourceType, string[]> = { actual: [], derived: [], estimate: [], forecast: [] };
  for (const id of Object.keys(DATA_SOURCES)) {
    grouped[DATA_SOURCES[id].sourceType].push(id);
  }

  return (
    <div>
      <SectionHeader
        title="Data Sources & Methodology"
        subtitle="Complete transparency into what is real data from primary sources, what is derived from primary data, and what is modeled/estimated. Users should cross-check modeled figures against the cited sources before making decisions."
        badge="Methodology"
      />

      {/* Honesty disclaimer */}
      <div className="mb-6 p-4 rounded-xl border border-yellow-800/50 bg-yellow-900/10">
        <h3 className="text-sm font-semibold text-yellow-400 mb-2">⚠ Disclosure</h3>
        <p className="text-xs text-sa-muted leading-relaxed">
          This model combines <strong className="text-white">actual primary-source data</strong> (hardware specs, API pricing,
          SEC 10-K CapEx, confirmed press-reported revenues) with <strong className="text-white">derived estimates</strong> (GPU
          installed base computed from CapEx ÷ ASP) and <strong className="text-white">modeled projections</strong> (TAM, ROIC,
          revenue splits, market share). Modeled figures represent the author&apos;s best estimates and should not be treated as
          authoritative. For investment decisions, verify all figures independently against the cited primary sources below.
          <br /><br />
          The live data pipeline (GitHub Actions, running daily) fetches stock prices from Yahoo Finance, CapEx from SEC EDGAR
          XBRL, and GPU cloud pricing from Azure Retail Prices API and Lambda Labs. These are shown with live badges where
          populated; null values indicate the pipeline has not yet run or the API was unavailable.
        </p>
      </div>

      {/* Live data pipeline status */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-white mb-3">Live Data Pipelines (GitHub Actions — Daily 06:00 UTC)</h3>
        <div className="bg-sa-card rounded-xl border border-sa-border overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-sa-border bg-sa-surface">
                {['Pipeline', 'Endpoint', 'Method', 'Refresh', 'Notes'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-xs font-semibold text-sa-muted uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <PipelineRow
                name="Stock Prices"
                endpoint="query1.finance.yahoo.com/v8/finance/chart/{symbol}"
                method="Yahoo Finance API v8 (public)"
                status="live"
                lastNote="NVDA, MSFT, GOOGL, AMZN, META, AMD, ORCL — price, prev close, market cap"
              />
              <PipelineRow
                name="Hyperscaler CapEx"
                endpoint="data.sec.gov/api/xbrl/companyfacts/CIK{n}.json"
                method="SEC EDGAR XBRL API (public, User-Agent required)"
                status="live"
                lastNote="PaymentsToAcquirePropertyPlantAndEquipment from latest 10-K — most recent annual figure"
              />
              <PipelineRow
                name="Azure H100 Cloud Price"
                endpoint="prices.azure.com/api/retail/prices"
                method="Azure Retail Prices API (public)"
                status="live"
                lastNote="Lowest non-spot H100 VM SKU in USD per hour"
              />
              <PipelineRow
                name="Lambda Labs GPU Price"
                endpoint="cloud.lambdalabs.com/api/v1/instance-types"
                method="Lambda Labs Public API"
                status="live"
                lastNote="Lowest H100 instance per hour (no auth required)"
              />
              <PipelineRow
                name="Model API Pricing"
                endpoint="anthropic.com/pricing, platform.openai.com/docs/pricing, etc."
                method="Manual curation from provider pages"
                status="manual"
                lastNote="Updated in source code — requires manual PR when pricing changes. Last reviewed June 2026."
              />
              <PipelineRow
                name="GPU Installed Base"
                endpoint="N/A — computed"
                method="Derived from hyperscalerCapex ÷ GPU ASP × allocation factor"
                status="static"
                lastNote="Not publicly disclosed by hyperscalers. Calibrated against Meta (350k H100 Feb 2024), Microsoft (1.8M fleet Build 2024) disclosures."
              />
              <PipelineRow
                name="Token Economy TAM / Revenue / ROIC"
                endpoint="N/A — model"
                method="Bottom-up model from public anchors"
                status="static"
                lastNote="Modeled. Key anchors: OpenAI $11.6B 2025 (Bloomberg), CoreWeave S-1, ChatGPT 400M MAU (OpenAI). Cross-check against cited sources."
              />
            </tbody>
          </table>
        </div>
      </div>

      {/* Source legend */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <span className="text-xs text-sa-muted font-medium">Data type legend:</span>
        {SOURCE_TYPE_ORDER.map(t => {
          const cfg = SOURCE_TYPE_CONFIG[t];
          return (
            <span key={t} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          );
        })}
      </div>

      {/* Source cards grouped by type */}
      {SOURCE_TYPE_ORDER.map(type => (
        grouped[type].length === 0 ? null : (
          <div key={type} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2.5 h-2.5 rounded-full ${SOURCE_TYPE_CONFIG[type].dot}`} />
              <h3 className={`text-sm font-semibold ${SOURCE_TYPE_CONFIG[type].text}`}>
                {SOURCE_TYPE_CONFIG[type].label} Data
              </h3>
              <span className="text-xs text-sa-muted">({grouped[type].length} series)</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {grouped[type].map(id => <SourceCard key={id} id={id} />)}
            </div>
          </div>
        )
      ))}

      {/* Primary source links table */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-white mb-3">Primary Source Quick Links</h3>
        <div className="bg-sa-card rounded-xl border border-sa-border overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-sa-border bg-sa-surface">
                {['Source', 'What It Covers', 'How to Access'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-xs font-semibold text-sa-muted uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['SEC EDGAR XBRL', 'CapEx, revenue, financial statements for all public US companies', 'data.sec.gov/api/xbrl/companyfacts/CIK{10-digit}.json'],
                ['SEC EDGAR Full-Text', 'Annual 10-K, quarterly 10-Q filings in full', 'sec.gov/cgi-bin/browse-edgar → search by ticker'],
                ['Anthropic Pricing', 'Claude API token prices (input/output per 1M)', 'anthropic.com/pricing'],
                ['OpenAI Pricing', 'GPT series token prices', 'platform.openai.com/docs/pricing'],
                ['Google AI Pricing', 'Gemini series token prices', 'ai.google.dev/pricing'],
                ['NVIDIA IR', 'Quarterly revenue, data center segment, guidance', 'investor.nvidia.com'],
                ['MLCommons MLPerf', 'AI chip inference benchmarks', 'mlcommons.org/benchmarks/inference-datacenter/'],
                ['Azure Retail Prices', 'VM pricing including GPU instances', 'prices.azure.com/api/retail/prices'],
                ['Lambda Labs API', 'GPU cloud pricing', 'cloud.lambdalabs.com/api/v1/instance-types'],
                ['CoreWeave S-1', 'Neocloud business model, margins, GPU deployment', 'sec.gov — search CoreWeave CIK'],
              ].map(([source, covers, access]) => (
                <tr key={source} className="border-b border-sa-border hover:bg-sa-surface/50 transition-colors">
                  <td className="px-3 py-2.5 text-white text-sm font-medium whitespace-nowrap">{source}</td>
                  <td className="px-3 py-2.5 text-sa-muted text-xs">{covers}</td>
                  <td className="px-3 py-2.5 text-sa-muted text-xs font-mono">{access}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
