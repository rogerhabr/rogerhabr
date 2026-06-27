'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import SectionHeader from '../SectionHeader';
import MetricCard from '../MetricCard';
import {
  workflowTemplates, calcWorkflowAllocation, type WorkflowStage,
} from '@/lib/data';

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return `${n}`;
}

export default function WorkflowAllocation() {
  const [templateId, setTemplateId] = useState(workflowTemplates[0].id);
  const template = workflowTemplates.find(t => t.id === templateId) ?? workflowTemplates[0];
  const [stages, setStages] = useState<WorkflowStage[]>(template.stages);

  // Re-seed stages when the template changes
  useEffect(() => {
    setStages(template.stages);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  const { rows, totalTokens, qFinal } = calcWorkflowAllocation(stages);

  // The stage with the highest token share, and the one with the highest marginal value
  const biggestToken = rows.reduce((a, b) => (b.tokenShare > a.tokenShare ? b : a), rows[0]);
  const highestValue = rows.reduce((a, b) => (b.marginalImpact > a.marginalImpact ? b : a), rows[0]);
  const misaligned = biggestToken.name !== highestValue.name;
  const valueGap = biggestToken.marginalImpact > 0
    ? ((highestValue.marginalImpact / biggestToken.marginalImpact - 1) * 100)
    : 0;

  const chartData = rows.map(r => ({
    name: r.name,
    icon: r.icon,
    tokenShare: parseFloat(r.tokenShare.toFixed(1)),
    impactShare: parseFloat(r.impactShare.toFixed(1)),
    color: r.color,
  }));

  const updateQuality = (idx: number, v: number) => {
    setStages(prev => prev.map((s, i) => (i === idx ? { ...s, quality: v } : s)));
  };
  const updateTokens = (idx: number, v: number) => {
    setStages(prev => prev.map((s, i) => (i === idx ? { ...s, tokens: v } : s)));
  };

  return (
    <div>
      <SectionHeader
        title="Workflow Token Allocation"
        subtitle="In a multi-stage AI workflow, quality propagates multiplicatively (q_final = Π qᵢ). A stage's marginal value is ∂q_final/∂qᵢ = q_final ÷ qᵢ — set by its position in the dependency graph, not its token volume. This is why the stage burning the most tokens is often NOT the one worth feeding more."
        badge="Interactive"
        sources={[
          { type: 'derived', label: 'Marginal value: computed from stage qualities' },
          { type: 'estimate', label: 'Stage qualities: paper case-study defaults' },
        ]}
      />

      {/* Headline insight */}
      {misaligned && (
        <div className="mb-5 p-4 rounded-xl border bg-sa-card border-orange-700/40">
          <p className="text-sm text-white">
            <span className="text-orange-400 font-semibold">Misallocation signal: </span>
            <span className="font-semibold">{biggestToken.icon} {biggestToken.name}</span> consumes the most tokens
            ({biggestToken.tokenShare.toFixed(1)}% of the budget), but
            <span className="font-semibold"> {highestValue.icon} {highestValue.name}</span> has the highest downstream
            marginal value — about <span className="text-orange-400 font-bold">{valueGap.toFixed(1)}% higher</span> impact
            at just {highestValue.tokenShare.toFixed(1)}% of the tokens. The next token does more good in {highestValue.name}.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Controls */}
        <div className="lg:col-span-1 bg-sa-card rounded-xl border border-sa-border p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Workflow</h3>
          <select
            value={templateId}
            onChange={e => setTemplateId(e.target.value)}
            className="w-full text-xs mb-2"
          >
            {workflowTemplates.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <p className="text-xs text-sa-muted mb-4 leading-relaxed">{template.description}</p>

          <div className="space-y-4">
            {stages.map((s, i) => (
              <div key={s.name} className="pb-3 border-b border-sa-border/50 last:border-0">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-xs font-semibold text-white">{s.icon} {s.name}</span>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between mb-1">
                    <label className="text-xs text-slate-400">Tokens</label>
                    <span className="text-xs font-bold text-white number-cell">{fmtTokens(s.tokens)}</span>
                  </div>
                  <input type="range" min={1_000} max={150_000} step={1_000} value={s.tokens}
                    onChange={e => updateTokens(i, parseInt(e.target.value))} className="w-full" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs text-slate-400">Stage quality q</label>
                    <span className="text-xs font-bold text-white number-cell">{s.quality.toFixed(2)}</span>
                  </div>
                  <input type="range" min={0.3} max={0.99} step={0.01} value={s.quality}
                    onChange={e => updateQuality(i, parseFloat(e.target.value))} className="w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            <MetricCard label="Final Quality" value={qFinal.toFixed(3)} subtext="Π of stage qualities" accent />
            <MetricCard label="Total Tokens" value={fmtTokens(totalTokens)} subtext={`${stages.length} stages`} />
            <MetricCard
              label="Highest-Value Stage"
              value={`${highestValue.icon} ${highestValue.name}`}
              subtext={`${highestValue.marginalImpact.toFixed(3)} marginal impact`}
            />
          </div>

          {/* Token share vs marginal value share */}
          <div className="bg-sa-card rounded-xl border border-sa-border p-4 mb-4">
            <h3 className="text-sm font-semibold text-white mb-1">Token Share vs Marginal-Value Share</h3>
            <p className="text-xs text-sa-muted mb-3">
              Where the bars diverge, token spend is misaligned with value. Tall value bar + short token bar = under-fed, high-leverage stage.
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v: number, n: string) => [`${v}%`, n === 'tokenShare' ? 'Token share' : 'Marginal-value share']} contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} formatter={(v) => (v === 'tokenShare' ? 'Token share %' : 'Marginal-value share %')} />
                <Bar dataKey="tokenShare" fill="#475569" radius={[4, 4, 0, 0]} />
                <Bar dataKey="impactShare" radius={[4, 4, 0, 0]}>
                  {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Stage table */}
          <div className="bg-sa-card rounded-xl border border-sa-border p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Stage-Level Marginal Value</h3>
            <div className="overflow-x-auto">
              <table className="text-xs w-full">
                <thead>
                  <tr className="text-sa-muted">
                    <th className="px-2 py-1.5 text-left font-semibold">Stage</th>
                    <th className="px-2 py-1.5 text-right font-semibold">Tokens</th>
                    <th className="px-2 py-1.5 text-right font-semibold">Token %</th>
                    <th className="px-2 py-1.5 text-right font-semibold">Quality q</th>
                    <th className="px-2 py-1.5 text-right font-semibold">∂q_final/∂qᵢ</th>
                    <th className="px-2 py-1.5 text-right font-semibold">Value / token-share</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const leverage = r.valuePerTokenShare;
                    const isLeveraged = r.name === highestValue.name;
                    return (
                      <tr key={r.name} className="border-t border-sa-border/30">
                        <td className="px-2 py-1.5 text-white font-medium whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                            {r.icon} {r.name}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-right text-slate-300 number-cell">{fmtTokens(r.tokens)}</td>
                        <td className="px-2 py-1.5 text-right text-slate-400 number-cell">{r.tokenShare.toFixed(1)}%</td>
                        <td className="px-2 py-1.5 text-right text-slate-300 number-cell">{r.quality.toFixed(2)}</td>
                        <td className="px-2 py-1.5 text-right font-bold number-cell" style={{ color: isLeveraged ? '#f97316' : '#fff' }}>
                          {r.marginalImpact.toFixed(3)}
                        </td>
                        <td className="px-2 py-1.5 text-right number-cell" style={{ color: leverage >= 1 ? '#10b981' : '#94a3b8' }}>
                          {leverage.toFixed(2)}×
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-sa-muted mt-3">
              <span className="text-white font-semibold">Value / token-share &gt; 1</span> means the stage delivers more
              marginal value than its share of the token budget — a candidate for more tokens. The optimal allocation
              equalizes risk-adjusted marginal value across stages (μ·∂φ/∂T = λ).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
