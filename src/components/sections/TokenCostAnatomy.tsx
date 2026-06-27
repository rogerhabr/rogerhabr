'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import SectionHeader from '../SectionHeader';
import MetricCard from '../MetricCard';
import {
  tokenWorkloads, defaultTokenPrices, calcTokenCost,
  type TokenWorkload, type TokenPrices,
} from '@/lib/data';
import { useLiveData } from '@/hooks/useLiveData';

const TOKEN_CLASS_META = [
  { key: 'inputTokens',     label: 'Input (Tᵢ)',      color: '#3b82f6', billed: 'input rate' },
  { key: 'cachedTokens',    label: 'Cached (T_c)',    color: '#06b6d4', billed: 'cached rate' },
  { key: 'retrievalTokens', label: 'Retrieval (T_r)', color: '#10b981', billed: 'input rate' },
  { key: 'outputTokens',    label: 'Output (Tₒ)',     color: '#f59e0b', billed: 'output rate' },
  { key: 'hiddenTokens',    label: 'Hidden (T_h)',    color: '#ef4444', billed: 'output rate' },
] as const;

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return `${n}`;
}

function fmtUSD(n: number): string {
  if (n < 0.01) return `$${n.toFixed(4)}`;
  if (n < 1) return `$${n.toFixed(3)}`;
  return `$${n.toFixed(2)}`;
}

export default function TokenCostAnatomy() {
  const { liveData, liveLoaded } = useLiveData();
  const [workloadIdx, setWorkloadIdx] = useState(0);
  const [workload, setWorkload] = useState<TokenWorkload>(tokenWorkloads[0]);
  const [selectedModel, setSelectedModel] = useState('');

  // Reset token counts when a different template is picked
  useEffect(() => {
    setWorkload(tokenWorkloads[workloadIdx]);
  }, [workloadIdx]);

  // Pricing: live model when selected, else default reference prices
  const prices: TokenPrices = useMemo(() => {
    if (selectedModel && liveData.modelPricing?.[selectedModel]) {
      const p = liveData.modelPricing[selectedModel];
      return {
        inputPerM: p.inputPerM,
        outputPerM: p.outputPerM,
        // Most providers price cache-read at ~10% of input; fall back to that.
        cachedPerM: p.inputPerM * 0.1,
      };
    }
    return defaultTokenPrices;
  }, [selectedModel, liveData.modelPricing]);

  const result = calcTokenCost(workload, prices);

  const priceLabel = selectedModel && liveData.modelPricing?.[selectedModel]
    ? `${liveData.modelPricing[selectedModel].displayName} (live)`
    : 'Claude Opus 4.8 reference';

  // Token-count vs cost-share comparison (the core insight)
  const shareData = [
    { name: 'Token count',   visible: 100 - result.hiddenTokenShare, hidden: result.hiddenTokenShare },
    { name: 'Cost',          visible: 100 - result.hiddenCostShare,  hidden: result.hiddenCostShare },
  ];

  // Per-class cost breakdown
  const classCosts = [
    { name: 'Input',     cost: result.inputCost,  color: '#3b82f6' },
    { name: 'Cached',    cost: result.cachedCost, color: '#06b6d4' },
    { name: 'Output',    cost: result.outputCost, color: '#f59e0b' },
    { name: 'Hidden',    cost: result.hiddenCost, color: '#ef4444' },
  ].filter(c => c.cost > 0);

  const updateClass = (key: keyof TokenWorkload, v: number) => {
    setWorkload(prev => ({ ...prev, [key]: v } as TokenWorkload));
  };

  return (
    <div>
      <SectionHeader
        title="Token Cost Anatomy"
        subtitle="Decompose any AI workload into the five token classes from Zhu (2026) — input, cached, retrieval, output, and hidden reasoning — and price each at its real billing rate. The key result: because thinking tokens bill at the (higher) output rate, hidden reasoning's share of COST exceeds its share of token COUNT."
        badge="Interactive"
        sources={[
          { type: 'actual',  label: 'Pricing: live API rates', url: 'https://www.anthropic.com/pricing' },
          { type: 'derived', label: 'Cost: computed from your token mix' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Inputs */}
        <div className="lg:col-span-1 bg-sa-card rounded-xl border border-sa-border p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Workload</h3>

          <div className="mb-4">
            <label className="text-xs text-slate-400 mb-1.5 block">Template (from paper case studies)</label>
            <select
              value={workloadIdx}
              onChange={e => setWorkloadIdx(parseInt(e.target.value))}
              className="w-full text-xs"
            >
              {tokenWorkloads.map((w, i) => (
                <option key={w.name} value={i}>{w.icon} {w.name}</option>
              ))}
            </select>
            <p className="text-xs text-sa-muted mt-1.5 leading-relaxed">{workload.description}</p>
          </div>

          <div className="mb-4 pb-4 border-b border-sa-border">
            <label className="text-xs text-slate-400 mb-1.5 block">
              Price model
              {liveLoaded && liveData.lastUpdated && (
                <span className="text-green-400 ml-1">· live {new Date(liveData.lastUpdated).toLocaleDateString()}</span>
              )}
            </label>
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="w-full text-xs"
            >
              <option value="">Claude Opus 4.8 (reference)</option>
              {liveLoaded && Object.entries(liveData.modelPricing || {}).map(([model, p]) => (
                <option key={model} value={model}>
                  {p.displayName} — ${p.inputPerM}/${p.outputPerM} in/out
                </option>
              ))}
            </select>
            <p className="text-xs text-sa-muted mt-1.5">
              Output is <span className="text-white font-semibold">{result.priceRatio.toFixed(1)}×</span> input price
              &nbsp;·&nbsp; {fmtUSD(prices.inputPerM)}/{fmtUSD(prices.outputPerM)} per M
            </p>
          </div>

          <div className="space-y-3">
            {TOKEN_CLASS_META.map(c => (
              <div key={c.key}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                    <span className="text-slate-300">{c.label}</span>
                    <span className="text-sa-muted">· {c.billed}</span>
                  </label>
                  <span className="text-xs font-bold text-white number-cell">{fmtTokens(workload[c.key])}</span>
                </div>
                <input
                  type="range" min={0} max={200_000} step={500}
                  value={workload[c.key]}
                  onChange={e => updateClass(c.key, parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <MetricCard label="Total Cost" value={fmtUSD(result.total)} subtext={priceLabel} accent />
            <MetricCard label="Total Tokens" value={fmtTokens(result.totalTokens)} subtext={`${fmtTokens(result.visibleTokens)} visible to user`} />
            <MetricCard
              label="Hidden Token Share"
              value={`${result.hiddenTokenShare.toFixed(1)}%`}
              subtext="of total token count"
            />
            <MetricCard
              label="Hidden Cost Share"
              value={`${result.hiddenCostShare.toFixed(1)}%`}
              subtext="of total $ — note the gap"
              change={result.hiddenCostShare > result.hiddenTokenShare ? `+${(result.hiddenCostShare - result.hiddenTokenShare).toFixed(1)}pp vs token share` : undefined}
              changePositive={false}
            />
          </div>

          {/* The core insight: token share vs cost share */}
          <div className="bg-sa-card rounded-xl border border-sa-border p-4 mb-4">
            <h3 className="text-sm font-semibold text-white mb-1">Hidden Reasoning — Token Share vs Cost Share</h3>
            <p className="text-xs text-sa-muted mb-3">
              Thinking tokens (T_h) are billed at the output rate. When output costs {result.priceRatio.toFixed(1)}× input,
              hidden reasoning eats a larger slice of the bill than its raw token count suggests.
            </p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={shareData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 10 }} stackOffset="expand">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" horizontal={false} />
                <XAxis type="number" domain={[0, 1]} tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip formatter={(v: number, n: string) => [`${v.toFixed(1)}%`, n === 'hidden' ? 'Hidden reasoning' : 'Visible (input+cache+retrieval+output)']} contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="visible" stackId="a" fill="#334155" radius={[4, 0, 0, 4]} />
                <Bar dataKey="hidden" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Per-class cost breakdown */}
          <div className="bg-sa-card rounded-xl border border-sa-border p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Cost by Token Class ($)</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={classCosts} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v.toFixed(2)}`} />
                <Tooltip formatter={(v: number) => [fmtUSD(v), 'Cost']} contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                  {classCosts.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
