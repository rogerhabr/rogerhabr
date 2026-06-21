'use client';

import { useGlobalParams } from '@/contexts/ParamsContext';
import { Scenario } from '@/lib/params';

function Slider({
  label, value, min, max, step, format, onChange, source,
}: {
  label: string; value: number; min: number; max: number; step: number;
  format: (v: number) => string; onChange: (v: number) => void; source?: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <label className="text-xs text-slate-400 truncate">{label}</label>
          {source && (
            <span className="text-xs text-sa-muted opacity-50 shrink-0">· {source}</span>
          )}
        </div>
        <span className="text-xs font-bold text-white tabular-nums ml-2 shrink-0">{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1 rounded cursor-pointer"
        style={{ accentColor: '#f97316' }}
      />
      <div className="flex justify-between text-xs text-sa-muted mt-0.5">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

function Divider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-5">
      <span className="text-xs font-semibold text-sa-accent uppercase tracking-wider whitespace-nowrap">
        {title}
      </span>
      <div className="flex-1 h-px bg-sa-border" />
    </div>
  );
}

const SCENARIO_STYLES: Record<Scenario, { active: string; inactive: string }> = {
  bear: {
    active: 'bg-red-900/40 text-red-400 border-red-700',
    inactive: 'bg-sa-card text-slate-400 border-sa-border hover:text-red-400 hover:border-red-800/60',
  },
  base: {
    active: 'bg-sa-accent/20 text-sa-accent border-sa-accent/60',
    inactive: 'bg-sa-card text-slate-400 border-sa-border hover:text-sa-accent hover:border-sa-accent/40',
  },
  bull: {
    active: 'bg-green-900/40 text-green-400 border-green-700',
    inactive: 'bg-sa-card text-slate-400 border-sa-border hover:text-green-400 hover:border-green-800/60',
  },
};

export default function AssumptionsPanel() {
  const { params, setParam, setScenario, resetParams, panelOpen, setPanelOpen } = useGlobalParams();

  if (!panelOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={() => setPanelOpen(false)}
      />

      <aside className="fixed top-0 right-0 h-full w-80 bg-[#0d1420] border-l border-sa-border z-50 flex flex-col">
        {/* Sticky header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-sa-border bg-sa-surface shrink-0">
          <div>
            <h2 className="text-sm font-bold text-white">Model Assumptions</h2>
            <p className="text-xs text-sa-muted">Tune every parameter live</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetParams}
              title="Reset to scenario defaults"
              className="text-xs px-2.5 py-1 rounded bg-sa-card border border-sa-border text-slate-400 hover:text-white hover:border-sa-accent transition-colors"
            >
              Reset
            </button>
            <button
              onClick={() => setPanelOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded bg-sa-card border border-sa-border text-slate-400 hover:text-white transition-colors text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-4">

          {/* ── Scenario ── */}
          <Divider title="Scenario" />
          <div className="flex gap-2 mb-5">
            {(['bear', 'base', 'bull'] as const).map(s => (
              <button
                key={s}
                onClick={() => setScenario(s)}
                className={`flex-1 py-1.5 rounded border text-xs font-semibold transition-colors capitalize ${
                  params.scenario === s ? SCENARIO_STYLES[s].active : SCENARIO_STYLES[s].inactive
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* ── Token Demand ── */}
          <Divider title="Token Demand" />
          <Slider
            label="Token Demand CAGR"
            value={params.tokenDemandCAGRPct}
            min={20} max={400} step={5}
            format={v => `${v}%`}
            onChange={v => setParam('tokenDemandCAGRPct', v)}
            source="Analyst est."
          />
          <Slider
            label="Inference % of Compute"
            value={params.inferenceSharePct}
            min={40} max={95} step={1}
            format={v => `${v}%`}
            onChange={v => setParam('inferenceSharePct', v)}
            source="DC surveys"
          />
          <Slider
            label="Token Input Price ($/1M)"
            value={params.tokenInputPricePerM}
            min={0.05} max={10} step={0.05}
            format={v => `$${v.toFixed(2)}`}
            onChange={v => setParam('tokenInputPricePerM', v)}
            source="API pricing pages"
          />

          {/* ── Hardware & Compute ── */}
          <Divider title="Hardware & Compute" />
          <Slider
            label="GPU Utilization"
            value={params.gpuUtilizationPct}
            min={40} max={100} step={1}
            format={v => `${v}%`}
            onChange={v => setParam('gpuUtilizationPct', v)}
            source="Hyperscaler disclosures"
          />
          <Slider
            label="GPU Cost / B200-eq"
            value={params.gpuCostB200kUSD}
            min={20} max={130} step={1}
            format={v => `$${v}k`}
            onChange={v => setParam('gpuCostB200kUSD', v)}
            source="Vendor list prices"
          />
          <Slider
            label="Power Cost ($/kWh)"
            value={params.powerCostPerKwh}
            min={0.02} max={0.12} step={0.005}
            format={v => `$${v.toFixed(3)}`}
            onChange={v => setParam('powerCostPerKwh', v)}
            source="Energy mkt data"
          />
          <Slider
            label="GPU Depreciation"
            value={params.gpuDepreciationYears}
            min={1} max={6} step={0.5}
            format={v => `${v}yr`}
            onChange={v => setParam('gpuDepreciationYears', v)}
            source="Hyperscaler accounting"
          />

          {/* ── Revenue & Margins ── */}
          <Divider title="Revenue & Margins" />
          <Slider
            label="Compute Rental Margin"
            value={params.rentalMarginPct}
            min={5} max={70} step={1}
            format={v => `${v}%`}
            onChange={v => setParam('rentalMarginPct', v)}
            source="Hyperscaler filings"
          />
          <Slider
            label="Model API Margin Adj."
            value={params.modelMarginOffset}
            min={-30} max={30} step={1}
            format={v => `${v > 0 ? '+' : ''}${v}pp`}
            onChange={v => setParam('modelMarginOffset', v)}
            source="Lab estimates"
          />
          <Slider
            label="Software / SaaS Margin"
            value={params.softwareMarginPct}
            min={10} max={80} step={1}
            format={v => `${v}%`}
            onChange={v => setParam('softwareMarginPct', v)}
            source="SaaS benchmarks"
          />

          {/* ── Market Structure ── */}
          <Divider title="Market Structure" />
          <Slider
            label="NVIDIA Share (2025E)"
            value={params.nvidiaSharePct}
            min={40} max={95} step={1}
            format={v => `${v}%`}
            onChange={v => setParam('nvidiaSharePct', v)}
            source="IDC / Omdia"
          />

          {/* Data Sources note */}
          <div className="mt-6 p-3 rounded-lg bg-sa-card border border-sa-border text-xs text-sa-muted leading-relaxed">
            <p className="text-white font-semibold mb-1">Data Sources</p>
            <ul className="space-y-0.5">
              <li>· GPU specs: NVIDIA/AMD/Google datasheets</li>
              <li>· CapEx: SEC EDGAR 10-K filings (auto-refreshed daily)</li>
              <li>· Stock prices: Yahoo Finance (daily refresh)</li>
              <li>· Token pricing: Public API documentation</li>
              <li>· Market share: IDC, Omdia research</li>
              <li>· Lab financials: Public filings &amp; press releases</li>
              <li>· Forecasts: Analyst estimates (GS, MS, JPM)</li>
            </ul>
          </div>

          <p className="text-xs text-sa-muted text-center mt-4 opacity-50">
            Changes persist across sessions · Esc to close
          </p>
        </div>
      </aside>
    </>
  );
}
