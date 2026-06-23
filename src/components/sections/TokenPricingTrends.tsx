'use client';

import { useState } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend, Cell, BarChart, Bar,
} from 'recharts';
import SectionHeader from '../SectionHeader';
import MetricCard from '../MetricCard';
import DataTable from '../DataTable';
import { modelPricing, priceCompression } from '@/lib/data';

const PROVIDER_COLORS: Record<string, string> = {
  OpenAI:    '#10b981',
  Anthropic: '#f97316',
  Google:    '#4285f4',
  DeepSeek:  '#3b82f6',
  Meta:      '#0668e1',
  Moonshot:  '#8b5cf6',
};

export default function TokenPricingTrends() {
  const [view, setView] = useState<'compression' | 'scatter' | 'table'>('compression');

  // Annotate each pricing point with a numeric x for scatter
  const scatterData = modelPricing.map((m, i) => ({
    ...m,
    blended: (m.inputPerM + m.outputPerM) / 2,
    ratio: m.outputPerM / m.inputPerM,
    idx: i,
  }));

  // Token economy unlocked per dollar (cheapest available model)
  const tokensPerDollar = priceCompression.map(d => ({
    ...d,
    millionTokensPerDollar: 1 / d.cheapestInput,
  }));

  // Latest snapshot for the table
  const latestByModel = [...modelPricing].reverse().reduce<Record<string, typeof modelPricing[0]>>(
    (acc, m) => { if (!acc[m.model]) acc[m.model] = m; return acc; }, {}
  );
  const tableData = Object.values(latestByModel)
    .sort((a, b) => a.inputPerM - b.inputPerM)
    .map(m => ({
      Model: m.model,
      Provider: m.provider,
      'Context (K)': m.contextK,
      'Input $/1M': `$${m.inputPerM.toFixed(3)}`,
      'Output $/1M': `$${m.outputPerM.toFixed(2)}`,
      'Output/Input Ratio': `${(m.outputPerM / m.inputPerM).toFixed(1)}x`,
      'Blended $/1M': `$${((m.inputPerM + m.outputPerM) / 2).toFixed(2)}`,
      'As of': m.quarter,
    }));

  const cheapestNow = modelPricing.reduce((min, m) => m.inputPerM < min.inputPerM ? m : min);
  const mostExpensiveNow = [...modelPricing].filter(m => m.date >= '2025').reduce((max, m) => m.inputPerM > max.inputPerM ? m : max);
  const peakInput2023 = priceCompression[0].frontierInput;
  const priceDropSince2023 = ((peakInput2023 - cheapestNow.inputPerM) / peakInput2023 * 100).toFixed(0);
  const pcActual = priceCompression.filter(d => !d.quarter.endsWith('E'));
  const tpdNow = pcActual[pcActual.length - 1].tokensPerDollar;
  const tpdBase = priceCompression[0].tokensPerDollar;
  const tpdImprovement = Math.round(tpdNow / tpdBase);
  const fmtTokens = (n: number) => n >= 1e6 ? `${(n / 1e6).toFixed(0)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}k` : `${n}`;

  return (
    <div>
      <SectionHeader
        title="Token Pricing Trends"
        subtitle="Price compression in AI inference APIs — from $30/1M tokens in 2023 to sub-$0.10/1M for commodity models. Tracks input/output pricing across OpenAI, Anthropic, Google, DeepSeek, and Meta. Falling prices are the single biggest driver of AI adoption growth."
        badge="Pricing Model"
        sources={[
          { type: 'actual', label: 'API Docs: Anthropic / OpenAI / Google', url: 'https://www.anthropic.com/pricing' },
        ]}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Peak Input Price (2023)"
          value={`$${peakInput2023}/1M`}
          subtext={`Frontier — ${priceCompression[0].quarter}`}
          icon="💸"
        />
        <MetricCard
          label="Cheapest Input Price Now"
          value={`$${cheapestNow.inputPerM.toFixed(3)}/1M`}
          change={`${cheapestNow.model}`}
          changePositive
          subtext={cheapestNow.quarter}
          accent
          icon="⬇️"
        />
        <MetricCard
          label="Price Drop Since 2023"
          value={`-${priceDropSince2023}%`}
          subtext="Frontier input price compression"
          icon="📉"
        />
        <MetricCard
          label="Tokens per $1 (cheapest)"
          value={`${fmtTokens(tpdNow)}+`}
          change={`vs ${fmtTokens(tpdBase)} in ${priceCompression[0].quarter}`}
          changePositive
          subtext={`${tpdImprovement}× improvement`}
          icon="⚡"
        />
      </div>

      <div className="flex gap-2 mb-5">
        {[
          { id: 'compression', label: 'Price Compression' },
          { id: 'scatter', label: 'Model Comparison' },
          { id: 'table', label: 'Pricing Table' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setView(t.id as typeof view)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === t.id ? 'bg-sa-accent text-white' : 'bg-sa-card border border-sa-border text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === 'compression' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <div className="bg-sa-card rounded-xl border border-sa-border p-4">
              <h3 className="text-sm font-semibold text-white mb-4">
                Input Token Price Compression ($/1M tokens)
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={priceCompression} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
                  <XAxis dataKey="quarter" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} scale="log" domain={['auto', 'auto']} />
                  <Tooltip
                    formatter={(v: number, name: string) => [`$${v.toFixed(3)}/1M`, name]}
                    contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                  <Line type="monotone" dataKey="frontierInput" name="Frontier Model" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="medianInput" name="Median Market" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="cheapestInput" name="Cheapest Available" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-xs text-sa-muted mt-2">Log scale. Note: frontier prices can re-inflate when a new more capable model launches (e.g., Claude Opus 4.8, GPT-5).</p>
            </div>

            <div className="bg-sa-card rounded-xl border border-sa-border p-4">
              <h3 className="text-sm font-semibold text-white mb-4">
                Tokens per $1 — Economy Unlocked (Log Scale)
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={tokensPerDollar} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
                  <XAxis dataKey="quarter" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => v >= 1e6 ? `${(v / 1e6).toFixed(0)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                    scale="log" domain={['auto', 'auto']}
                  />
                  <Tooltip
                    formatter={(v: number) => [v >= 1e6 ? `${(v / 1e6).toFixed(1)}M tokens/$1` : `${(v / 1000).toFixed(0)}k tokens/$1`]}
                    contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="tokensPerDollar" name="Tokens per $1" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-sa-muted mt-2">Based on cheapest available model at each point in time. Log scale. This metric drives the AI adoption S-curve — more tokens per dollar = more use cases become economically viable.</p>
            </div>
          </div>

          {/* Key inflection points */}
          <div className="bg-sa-card rounded-xl border border-sa-border p-4">
            <h3 className="text-sm font-semibold text-white mb-4">Key Pricing Inflection Points</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-sa-border" />
              {[
                { date: 'Mar 2023', event: 'GPT-4 launches at $30/1M input', impact: 'First frontier model priced for API access', color: '#ef4444' },
                { date: 'Mar 2024', event: 'Claude 3 Haiku launches at $0.25/1M', impact: '120× cheaper than GPT-4 at launch, democratizes long-context inference', color: '#f97316' },
                { date: 'Jul 2024', event: 'GPT-4o mini at $0.15/1M input', impact: 'OpenAI commoditizes sub-$1 inference, triggering industry-wide price war', color: '#f59e0b' },
                { date: 'Dec 2024', event: 'DeepSeek V3 at $0.27/1M', impact: 'Open-weight MoE model achieves frontier quality at commodity pricing', color: '#3b82f6' },
                { date: 'Jan 2025', event: 'DeepSeek R1 at $0.55/1M', impact: 'Reasoning model breaks price floor — o1 costs 100× more for similar benchmarks', color: '#2563eb' },
                { date: 'Jul 2025', event: 'Kimi K2 at $0.15/1M', impact: 'MoE architecture enables $0.15 input + $0.60 output for 1T parameter model', color: '#8b5cf6' },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 mb-4 pl-10 relative">
                  <div className="absolute left-3 w-2.5 h-2.5 rounded-full -translate-x-1/2 mt-1" style={{ background: item.color }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-mono text-sa-muted">{item.date}</span>
                      <span className="text-sm font-semibold text-white">{item.event}</span>
                    </div>
                    <p className="text-xs text-slate-400">{item.impact}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {view === 'scatter' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-sa-card rounded-xl border border-sa-border p-4">
            <h3 className="text-sm font-semibold text-white mb-1">Input vs Output Price ($/1M)</h3>
            <p className="text-xs text-sa-muted mb-4">Each dot = one model pricing snapshot. Diagonal = 1:1 ratio. Most models price output at 3–5× input.</p>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
                <XAxis
                  type="number" dataKey="inputPerM" name="Input $/1M"
                  tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `$${v}`} scale="log" domain={[0.05, 100]}
                  label={{ value: 'Input $/1M (log)', position: 'insideBottom', offset: -15, fill: '#64748b', fontSize: 11 }}
                />
                <YAxis
                  type="number" dataKey="outputPerM" name="Output $/1M"
                  tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `$${v}`} scale="log" domain={[0.2, 200]}
                  label={{ value: 'Output $/1M (log)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3', stroke: '#374151' }}
                  content={({ payload }) => {
                    if (!payload?.length) return null;
                    const d = payload[0].payload as typeof scatterData[0];
                    return (
                      <div className="bg-sa-card border border-sa-border rounded-lg p-3 text-xs shadow-xl">
                        <p className="font-bold text-white mb-1">{d.model}</p>
                        <p className="text-slate-400">Provider: <span className="text-white">{d.provider}</span></p>
                        <p className="text-slate-400">Input: <span className="text-sa-green">${d.inputPerM.toFixed(3)}/1M</span></p>
                        <p className="text-slate-400">Output: <span className="text-sa-accent">${d.outputPerM.toFixed(2)}/1M</span></p>
                        <p className="text-slate-400">Ratio: <span className="text-white">{(d.outputPerM / d.inputPerM).toFixed(1)}×</span></p>
                        <p className="text-slate-400">Context: <span className="text-white">{d.contextK}K</span></p>
                      </div>
                    );
                  }}
                />
                <Scatter data={scatterData} name="Models">
                  {scatterData.map((entry, i) => (
                    <Cell key={i} fill={PROVIDER_COLORS[entry.provider] || '#64748b'} opacity={0.85} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2">
              {Object.entries(PROVIDER_COLORS).map(([p, c]) => (
                <div key={p} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                  {p}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-sa-card rounded-xl border border-sa-border p-4">
            <h3 className="text-sm font-semibold text-white mb-4">Input Price by Provider ($/1M, current)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[...Object.values(
                  modelPricing.reduce<Record<string, typeof modelPricing[0]>>((acc, m) => {
                    if (!acc[m.model] || m.date > acc[m.model].date) acc[m.model] = m;
                    return acc;
                  }, {})
                )].sort((a, b) => b.inputPerM - a.inputPerM).slice(0, 12)}
                layout="vertical"
                margin={{ top: 0, right: 40, bottom: 0, left: 120 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <YAxis type="category" dataKey="model" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={120} />
                <Tooltip
                  formatter={(v: number) => [`$${v.toFixed(3)}/1M tokens`]}
                  contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="inputPerM" name="Input $/1M" radius={[0, 4, 4, 0]}>
                  {[...Object.values(
                    modelPricing.reduce<Record<string, typeof modelPricing[0]>>((acc, m) => {
                      if (!acc[m.model] || m.date > acc[m.model].date) acc[m.model] = m;
                      return acc;
                    }, {})
                  )].sort((a, b) => b.inputPerM - a.inputPerM).slice(0, 12).map((entry, i) => (
                    <Cell key={i} fill={PROVIDER_COLORS[entry.provider] || '#64748b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {view === 'table' && (
        <DataTable
          title="Current Model Pricing (most recent snapshot per model)"
          columns={[
            { key: 'Model', label: 'Model', align: 'left' },
            { key: 'Provider', label: 'Provider', align: 'left' },
            { key: 'Context (K)', label: 'Context', align: 'right' },
            { key: 'Input $/1M', label: 'Input $/1M', align: 'right', highlight: true },
            { key: 'Output $/1M', label: 'Output $/1M', align: 'right', highlight: true },
            { key: 'Output/Input Ratio', label: 'Out/In Ratio', align: 'right' },
            { key: 'Blended $/1M', label: 'Blended', align: 'right' },
            { key: 'As of', label: 'As of', align: 'left' },
          ]}
          data={tableData}
          compact
        />
      )}

      <div className="mt-5 p-4 rounded-xl bg-sa-surface border border-sa-border">
        <p className="text-xs text-sa-muted leading-relaxed">
          <span className="text-white font-semibold">Price compression dynamics:</span> Token prices are driven by GPU throughput improvements (hardware), model efficiency gains (MoE, distillation), competition (DeepSeek open-weights, Meta Llama), and market structure (oligopoly at frontier vs commodity at mid-tier). The frontier-to-commodity price gap widens as labs race for capability while efficiency gains trickle down. Prices listed are public API list prices; enterprise contracts typically negotiate 20–50% discounts. All prices in USD per million tokens.
        </p>
      </div>
    </div>
  );
}
