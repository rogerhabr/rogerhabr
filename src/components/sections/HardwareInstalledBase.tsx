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

export default function HardwareInstalledBase() {
  const [view, setView] = useState<View>('hyperscalers');
  const [timeRange, setTimeRange] = useState('2022-2028');
  const [gpuMetric, setGpuMetric] = useState('units');

  const tabs: { id: View; label: string }[] = [
    { id: 'hyperscalers', label: 'Hyperscalers' },
    { id: 'foundationLabs', label: 'Foundation Labs' },
    { id: 'neoclouds', label: 'Neoclouds' },
    { id: 'capex', label: 'CapEx ($B)' },
  ];

  const dataMap = {
    hyperscalers: { data: hyperscalerGPUs, colors: hyperscalerColors, keys: ['Microsoft', 'Google', 'Amazon', 'Meta', 'Oracle'], unit: 'k B200-eq GPUs' },
    foundationLabs: { data: foundationLabGPUs, colors: foundationLabColors, keys: ['OpenAI', 'Anthropic', 'xAI', 'DeepSeek', 'Thinking Machines'], unit: 'k B200-eq GPUs' },
    neoclouds: { data: neocloudGPUs, colors: neocloudColors, keys: ['CoreWeave', 'Nebius', 'Crusoe', 'Lambda Labs'], unit: 'k B200-eq GPUs' },
    capex: { data: hyperscalerCapex, colors: hyperscalerColors, keys: ['Microsoft', 'Google', 'Amazon', 'Meta', 'Oracle'], unit: '$B CapEx' },
  };

  const { data: rawData, colors, keys, unit } = dataMap[view];

  const allowedYears = TIME_RANGE_YEARS[timeRange] || TIME_RANGE_YEARS['2022-2028'];
  const data = rawData.filter(row => allowedYears.includes(row.year));

  // Build table data
  const tableData = data.map(row => {
    const r: Record<string, unknown> = { Year: row.year };
    keys.forEach(k => { r[k] = (row as Record<string, unknown>)[k]; });
    const total = keys.reduce((s, k) => s + ((row as Record<string, unknown>)[k] as number || 0), 0);
    r['Total'] = view === 'capex' ? `$${total.toFixed(0)}B` : `${total.toLocaleString()}k`;
    return r;
  });

  const cols = [
    { key: 'Year', label: 'Year', align: 'left' as const },
    ...keys.map(k => ({ key: k, label: k, align: 'right' as const, format: (v: unknown) => view === 'capex' ? `$${v}B` : `${v}k` })),
    { key: 'Total', label: 'Total', align: 'right' as const, highlight: true },
  ];

  return (
    <div>
      <SectionHeader
        title="AI Hardware Installed Base"
        subtitle="GPU compute inventory normalized to B200-equivalent units across hyperscalers, foundation labs, and neoclouds. Tracks cumulative installed base with FP8 performance normalization across NVIDIA (B200/B300), Google, and Amazon silicon."
        badge="Bottoms-Up"
        sources={[
          { type: 'derived', label: 'Derived: CapEx ÷ GPU ASP' },
          { type: 'actual',  label: 'CapEx: SEC EDGAR 10-K 2022–2024', url: 'https://www.sec.gov/cgi-bin/browse-edgar' },
        ]}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Hyperscaler GPUs 2025" value="1.40M" change="+86% YoY" changePositive subtext="B200-eq units (5 players)" accent icon="🖥️" />
        <MetricCard label="Foundation Lab GPUs 2025" value="172k" change="+121% YoY" changePositive subtext="OpenAI, Anthropic, xAI, DeepSeek" icon="🧠" />
        <MetricCard label="Neocloud GPUs 2025" value="215k" change="+145% YoY" changePositive subtext="CoreWeave leads at 150k" icon="☁️" />
        <MetricCard label="Total AI CapEx 2025" value="$355B" change="+64% YoY" changePositive subtext="Big 5 hyperscalers combined" icon="💵" />
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

      <div className="mt-4 p-3 rounded-lg bg-sa-surface border border-sa-border">
        <p className="text-xs text-sa-muted">
          <span className="text-white font-medium">Normalization methodology:</span> All GPU counts normalized to B200 SXM FP8 throughput baseline (4,500 TFLOPS). H100 = 0.31×, H200 = 0.44×, B300 = 1.50×, GB200 NVL72 = 12.5× per rack, TPU v5p = 0.28×, TPU v7 Ironwood = 1.41×, Trainium 2 = 0.47×, Trainium 3 = 0.94×, MI300X = 0.56×, MI350X = 1.09×. Hyperscaler AI-dedicated compute only. Estimates based on public announcements, earnings calls, and supply chain analysis.
        </p>
      </div>
    </div>
  );
}
