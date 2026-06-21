'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, LineChart, Line,
} from 'recharts';
import SectionHeader from '../SectionHeader';
import MetricCard from '../MetricCard';
import DataTable from '../DataTable';
import ParamControl from '../ParamControl';
import {
  hyperscalerGPUs, hyperscalerColors, foundationLabGPUs, foundationLabColors,
  neocloudGPUs, neocloudColors, hyperscalerCapex,
} from '@/lib/data';
import { useLiveData } from '@/hooks/useLiveData';

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-sa-card border border-sa-border rounded-lg p-3 text-xs shadow-xl">
      <p className="text-white font-semibold mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="text-white font-medium">{p.value.toLocaleString()}k GPUs</span>
        </div>
      ))}
      <div className="border-t border-sa-border mt-2 pt-2 flex justify-between">
        <span className="text-slate-400">Total:</span>
        <span className="text-sa-accent font-bold">
          {payload.reduce((s, p) => s + p.value, 0).toLocaleString()}k
        </span>
      </div>
    </div>
  );
};

type View = 'hyperscalers' | 'foundationLabs' | 'neoclouds' | 'capex';

const TIME_RANGE_YEARS: Record<string, string[]> = {
  '2022-2025': ['2022', '2023', '2024', '2025'],
  '2022-2026': ['2022', '2023', '2024', '2025', '2026E'],
  '2022-2028': ['2022', '2023', '2024', '2025', '2026E', '2027E', '2028E'],
};

const HYPERSCALER_KEYS = ['Microsoft', 'Google', 'Amazon', 'Meta', 'Oracle'] as const;
const FOUNDATION_LAB_KEYS = ['OpenAI', 'Anthropic', 'xAI', 'DeepSeek', 'Thinking Machines'] as const;
const NEOCLOUD_KEYS = ['CoreWeave', 'Nebius', 'Crusoe', 'Lambda Labs'] as const;

function sumKeys(row: Record<string, unknown>, keys: readonly string[]): number {
  return keys.reduce((s, k) => s + ((row[k] as number) || 0), 0);
}

function yoyPct(curr: number, prev: number): string {
  return `+${((curr / prev - 1) * 100).toFixed(0)}% YoY`;
}

export default function HardwareInstalledBase() {
  const [view, setView] = useState<View>('hyperscalers');
  const [timeRange, setTimeRange] = useState('2022-2028');
  const [gpuMetric, setGpuMetric] = useState('units');
  const { liveData, liveLoaded } = useLiveData();

  // 2025 CapEx: use live SEC EDGAR values where available; Amazon falls back to earnings estimate
  const liveCapex2025 = {
    Microsoft: liveData.capex?.['MSFT']?.value ?? 64.55,
    Google:    liveData.capex?.['GOOGL']?.value ?? 91.45,
    Amazon:    105,   // EDGAR XBRL unavailable for AMZN — Q3 2025 earnings estimate
    Meta:      liveData.capex?.['META']?.value ?? 69.69,
    Oracle:    liveData.capex?.['ORCL']?.value ?? 21.21,
  };

  // Replace 2025 row with live data; all other years use static 10-K actuals
  const mergedCapex = hyperscalerCapex.map(row =>
    row.year === '2025' ? { ...row, ...liveCapex2025 } : row
  );

  // Compute all metric values from data arrays — no hardcoded numbers in MetricCards
  const h2024 = hyperscalerGPUs.find(d => d.year === '2024')!;
  const h2025 = hyperscalerGPUs.find(d => d.year === '2025')!;
  const hyperscalerTotal2024 = sumKeys(h2024, HYPERSCALER_KEYS);
  const hyperscalerTotal2025 = sumKeys(h2025, HYPERSCALER_KEYS);

  const fl2024 = foundationLabGPUs.find(d => d.year === '2024')!;
  const fl2025 = foundationLabGPUs.find(d => d.year === '2025')!;
  const foundationLabTotal2024 = sumKeys(fl2024, FOUNDATION_LAB_KEYS);
  const foundationLabTotal2025 = sumKeys(fl2025, FOUNDATION_LAB_KEYS);

  const nc2024 = neocloudGPUs.find(d => d.year === '2024')!;
  const nc2025 = neocloudGPUs.find(d => d.year === '2025')!;
  const neocloudTotal2024 = sumKeys(nc2024, NEOCLOUD_KEYS);
  const neocloudTotal2025 = sumKeys(nc2025, NEOCLOUD_KEYS);

  const capex2024 = hyperscalerCapex.find(d => d.year === '2024')!;
  const capex2024Total = sumKeys(capex2024, HYPERSCALER_KEYS);
  const capex2025Total = Object.values(liveCapex2025).reduce((s, v) => s + v, 0);

  const capexFetchDate = liveLoaded && liveData.lastUpdated
    ? new Date(liveData.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const tabs: { id: View; label: string }[] = [
    { id: 'hyperscalers', label: 'Hyperscalers' },
    { id: 'foundationLabs', label: 'Foundation Labs' },
    { id: 'neoclouds', label: 'Neoclouds' },
    { id: 'capex', label: 'CapEx ($B)' },
  ];

  const dataMap = {
    hyperscalers: { data: hyperscalerGPUs,   colors: hyperscalerColors,   keys: [...HYPERSCALER_KEYS],    unit: 'k B200-eq GPUs' },
    foundationLabs: { data: foundationLabGPUs, colors: foundationLabColors, keys: [...FOUNDATION_LAB_KEYS], unit: 'k B200-eq GPUs' },
    neoclouds:    { data: neocloudGPUs,       colors: neocloudColors,       keys: [...NEOCLOUD_KEYS],       unit: 'k B200-eq GPUs' },
    capex:        { data: mergedCapex,         colors: hyperscalerColors,   keys: [...HYPERSCALER_KEYS],    unit: '$B CapEx' },
  };

  const { data: rawData, colors, keys, unit } = dataMap[view];
  const allowedYears = TIME_RANGE_YEARS[timeRange] || TIME_RANGE_YEARS['2022-2028'];
  const data = rawData.filter(row => allowedYears.includes(row.year));

  const tableData = data.map(row => {
    const r: Record<string, unknown> = { Year: row.year };
    keys.forEach(k => { r[k] = (row as Record<string, unknown>)[k]; });
    const total = keys.reduce((s, k) => s + ((row as Record<string, unknown>)[k] as number || 0), 0);
    r['Total'] = view === 'capex' ? `$${total.toFixed(1)}B` : `${total.toLocaleString()}k`;
    return r;
  });

  const cols = [
    { key: 'Year', label: 'Year', align: 'left' as const },
    ...keys.map(k => ({
      key: k,
      label: k,
      align: 'right' as const,
      format: (v: unknown) => view === 'capex' ? `$${v}B` : `${v}k`,
    })),
    { key: 'Total', label: 'Total', align: 'right' as const, highlight: true },
  ];

  return (
    <div>
      <SectionHeader
        title="AI Hardware Installed Base"
        subtitle="GPU compute inventory normalized to B200-equivalent units across hyperscalers, foundation labs, and neoclouds. Tracks cumulative installed base with FP8 performance normalization across NVIDIA (B200/B300), Google, and Amazon silicon."
        badge="Bottoms-Up"
        sources={[
          { type: 'derived', label: 'GPU counts: Derived — CapEx ÷ GPU ASP' },
          { type: 'actual',  label: `CapEx 2022–2025: SEC EDGAR 10-K${capexFetchDate ? ` · fetched ${capexFetchDate}` : ''}`, url: 'https://www.sec.gov/cgi-bin/browse-edgar' },
        ]}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Hyperscaler GPUs 2025"
          value={`${(hyperscalerTotal2025 / 1000).toFixed(2)}M`}
          change={yoyPct(hyperscalerTotal2025, hyperscalerTotal2024)}
          changePositive
          subtext="B200-eq units, 5 players"
          accent={view === 'hyperscalers'}
          icon="🖥️"
          onClick={() => setView('hyperscalers')}
        />
        <MetricCard
          label="Foundation Lab GPUs 2025"
          value={`${foundationLabTotal2025}k`}
          change={yoyPct(foundationLabTotal2025, foundationLabTotal2024)}
          changePositive
          subtext="OpenAI, Anthropic, xAI, DeepSeek"
          accent={view === 'foundationLabs'}
          icon="🧠"
          onClick={() => setView('foundationLabs')}
        />
        <MetricCard
          label="Neocloud GPUs 2025"
          value={`${neocloudTotal2025}k`}
          change={yoyPct(neocloudTotal2025, neocloudTotal2024)}
          changePositive
          subtext="CoreWeave, Nebius, Crusoe, Lambda"
          accent={view === 'neoclouds'}
          icon="☁️"
          onClick={() => setView('neoclouds')}
        />
        <MetricCard
          label="Total AI CapEx 2025"
          value={`$${capex2025Total.toFixed(1)}B`}
          change={yoyPct(capex2025Total, capex2024Total)}
          changePositive
          subtext={liveLoaded && liveData.capex?.['MSFT']?.value ? 'SEC EDGAR live · AMZN est.' : 'Big 5 hyperscalers'}
          accent={view === 'capex'}
          icon="💵"
          onClick={() => setView('capex')}
        />
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === tab.id
                ? 'bg-sa-accent text-white'
                : 'bg-sa-card border border-sa-border text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <ParamControl
          label="Time Range"
          value={timeRange}
          options={[
            { value: '2022-2025', label: '2022–2025' },
            { value: '2022-2026', label: '2022–2026E' },
            { value: '2022-2028', label: '2022–2028E (full)' },
          ]}
          onChange={setTimeRange}
        />
        <ParamControl
          label="GPU Metric"
          value={gpuMetric}
          options={[
            { value: 'units', label: 'B200-eq Units' },
            { value: 'tflops', label: 'Raw TFLOPS' },
            { value: 'dollar-year', label: '$/Unit-Year' },
          ]}
          onChange={setGpuMetric}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-sa-card rounded-xl border border-sa-border p-4">
          <h3 className="text-sm font-semibold text-white mb-4">
            Stacked Installed Base — {unit}
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
              <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              {keys.map((k, i) => (
                <Bar key={k} dataKey={k} stackId="a" fill={colors[k] || '#64748b'}
                  radius={i === keys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-sa-card rounded-xl border border-sa-border p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Individual Trajectories — {unit}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
              <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              {keys.map(k => (
                <Line key={k} type="monotone" dataKey={k} stroke={colors[k] || '#64748b'}
                  strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <DataTable
        title={`Detailed Data — ${unit}`}
        columns={cols}
        data={tableData}
        compact
      />

      <div className="mt-4 p-3 rounded-lg bg-sa-surface border border-sa-border text-xs text-sa-muted">
        <span className="text-white font-medium">Data sources: </span>
        CapEx 2022–2025 from SEC EDGAR 10-K filings (auto-refreshed daily via GitHub Actions).
        {' '}<span className="text-yellow-400 font-medium">Amazon 2025 CapEx is an estimate from Q3 2025 earnings guidance (~$105B)</span>
        {' '}— EDGAR XBRL pipeline cannot parse AMZN post-2016 custom namespace; treat as estimate.
        {' '}GPU installed base is derived (not directly disclosed): CapEx × AI-allocation factor ÷ blended GPU ASP. Anchors: Meta 350k H100s (Feb 2024 earnings), Microsoft 1.8M total GPU fleet (Build 2024).
        {liveLoaded && liveData.lastUpdated && (
          <> Live data last fetched: <span className="text-green-400">{new Date(liveData.lastUpdated).toLocaleDateString()}</span>.</>
        )}
      </div>
    </div>
  );
}
