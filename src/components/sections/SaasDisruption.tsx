'use client';

import { useState } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, Legend,
} from 'recharts';
import SectionHeader from '../SectionHeader';
import MetricCard from '../MetricCard';
import { saasDisruptions, tokenConsumers } from '@/lib/data';

const THREAT_COLORS = {
  'Critical': '#ef4444',
  'High': '#f97316',
  'Medium': '#f59e0b',
  'Adapting': '#10b981',
};

const threatOrder = { 'Critical': 3, 'High': 2, 'Medium': 1, 'Adapting': 0 };

export default function SaasDisruption() {
  const [tab, setTab] = useState<'traditional' | 'emerging'>('traditional');

  const scatterData = saasDisruptions.map(d => ({
    ...d,
    revenueAtRiskB: (d.revenue2024B * d.revenueAtRiskPct) / 100,
    fill: THREAT_COLORS[d.threatLevel],
  }));

  const sortedByThreat = [...saasDisruptions].sort(
    (a, b) => threatOrder[b.threatLevel] - threatOrder[a.threatLevel]
  );

  const totalAtRisk = saasDisruptions.reduce(
    (s, d) => s + (d.revenue2024B * d.revenueAtRiskPct) / 100, 0
  );

  return (
    <div>
      <SectionHeader
        title="SAAS Disruption Tracker"
        subtitle="AI removes the 'seat' from software sales. Traditional per-seat SaaS companies face token-based displacement as AI agents replace human workflows. Tracks revenue at risk, threat level, and emerging token-consuming replacements."
        badge="Disruption"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Traditional SAAS Revenue at Risk" value="$107B" change="Across 8 companies tracked" accent icon="⚠️" />
        <MetricCard label="Critical Threat Companies" value="3" subtext="Adobe, Atlassian, ServiceNow" icon="🔴" />
        <MetricCard label="Avg. Seat Revenue at Risk" value="36%" subtext="Weighted average across coverage" icon="📊" />
        <MetricCard label="Emerging Token Co. ARR" value="$1.3B+" change="+320% YoY avg growth" changePositive subtext="8 tracked companies" icon="🚀" />
      </div>

      <div className="flex gap-2 mb-5">
        {[{ id: 'traditional', label: 'Traditional SAAS Disruption' }, { id: 'emerging', label: 'Emerging Token Consumers' }].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as 'traditional' | 'emerging')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-sa-accent text-white' : 'bg-sa-card border border-sa-border text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'traditional' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <div className="bg-sa-card rounded-xl border border-sa-border p-4">
              <h3 className="text-sm font-semibold text-white mb-4">Revenue at Risk vs Total Revenue ($B)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart margin={{ top: 0, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
                  <XAxis
                    type="number" dataKey="revenue2024B" name="Total Revenue"
                    tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `$${v}B`} label={{ value: 'Revenue 2024 ($B)', position: 'insideBottom', offset: -15, fill: '#64748b', fontSize: 11 }}
                  />
                  <YAxis
                    type="number" dataKey="revenueAtRiskPct" name="Revenue at Risk %"
                    tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${v}%`} label={{ value: 'At Risk (%)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3', stroke: '#374151' }}
                    content={({ payload }) => {
                      if (!payload?.length) return null;
                      const d = payload[0].payload as typeof scatterData[0];
                      return (
                        <div className="bg-sa-card border border-sa-border rounded-lg p-3 text-xs shadow-xl">
                          <p className="font-bold text-white mb-1">{d.company}</p>
                          <p className="text-slate-400">Sector: <span className="text-white">{d.sector}</span></p>
                          <p className="text-slate-400">Revenue: <span className="text-white">${d.revenue2024B.toFixed(1)}B</span></p>
                          <p className="text-slate-400">At Risk: <span className="text-sa-red">{d.revenueAtRiskPct}% (${((d.revenue2024B * d.revenueAtRiskPct) / 100).toFixed(1)}B)</span></p>
                          <p className="text-slate-400">Threat: <span style={{ color: THREAT_COLORS[d.threatLevel] }}>{d.threatLevel}</span></p>
                        </div>
                      );
                    }}
                  />
                  <Scatter data={scatterData} fill="#f97316">
                    {scatterData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-sa-card rounded-xl border border-sa-border p-4">
              <h3 className="text-sm font-semibold text-white mb-4">Revenue at Risk by Company ($B)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={scatterData.sort((a, b) => b.revenueAtRiskB - a.revenueAtRiskB)}
                  layout="vertical"
                  margin={{ top: 0, right: 30, bottom: 0, left: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}B`} />
                  <YAxis type="category" dataKey="company" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip
                    formatter={(v: number) => [`$${v.toFixed(1)}B at risk`]}
                    contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="revenueAtRiskB" name="Revenue at Risk ($B)" radius={[0, 4, 4, 0]}>
                    {scatterData.sort((a, b) => b.revenueAtRiskB - a.revenueAtRiskB).map((entry, i) => (
                      <Cell key={i} fill={THREAT_COLORS[entry.threatLevel]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-sa-card rounded-xl border border-sa-border overflow-hidden">
            <div className="px-4 py-3 border-b border-sa-border">
              <h3 className="text-sm font-semibold text-white">Traditional SAAS Disruption Matrix</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-sa-border">
                    {['Company', 'Sector', 'Revenue 2024', 'At Risk %', 'At Risk $B', 'Threat Level', 'AI Response', 'Timeline', 'Disruptors'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-sa-muted font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedByThreat.map(d => (
                    <tr key={d.company} className="border-b border-sa-border/50 hover:bg-white/2">
                      <td className="px-3 py-2.5 text-white font-semibold">{d.company}</td>
                      <td className="px-3 py-2.5 text-slate-400">{d.sector}</td>
                      <td className="px-3 py-2.5 text-slate-300 number-cell">${d.revenue2024B.toFixed(1)}B</td>
                      <td className="px-3 py-2.5 number-cell">
                        <span className="font-bold" style={{ color: THREAT_COLORS[d.threatLevel] }}>{d.revenueAtRiskPct}%</span>
                      </td>
                      <td className="px-3 py-2.5 text-sa-red number-cell font-bold">
                        ${((d.revenue2024B * d.revenueAtRiskPct) / 100).toFixed(1)}B
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: THREAT_COLORS[d.threatLevel] + '22', color: THREAT_COLORS[d.threatLevel], border: `1px solid ${THREAT_COLORS[d.threatLevel]}44` }}>
                          {d.threatLevel}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-400 max-w-32 truncate">{d.aiResponse}</td>
                      <td className="px-3 py-2.5 text-slate-400 number-cell">{d.timelineYears}y</td>
                      <td className="px-3 py-2.5 text-slate-500 max-w-44 truncate">{d.disruptors.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-sa-card rounded-xl border border-sa-border overflow-hidden">
          <div className="px-4 py-3 border-b border-sa-border">
            <h3 className="text-sm font-semibold text-white">Emerging Token-Consuming Software Companies</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-sa-border">
                  {['Company', 'Category', 'Founded', 'ARR 2025E', 'Revenue Model', 'Tokens/$1 Rev.', 'YoY Growth', 'ClusterMAX'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-sa-muted font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tokenConsumers.sort((a, b) => b.arr2025M - a.arr2025M).map(d => (
                  <tr key={d.name} className="border-b border-sa-border/50 hover:bg-white/2">
                    <td className="px-3 py-2.5 text-white font-semibold">{d.name}</td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-0.5 rounded-full bg-sa-accent/10 text-sa-accent text-xs border border-sa-accent/20">{d.category}</span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-400 number-cell">{d.founded}</td>
                    <td className="px-3 py-2.5 text-sa-green number-cell font-bold">${d.arr2025M}M</td>
                    <td className="px-3 py-2.5 text-slate-400">{d.revenueModel}</td>
                    <td className="px-3 py-2.5 text-slate-300 number-cell">{(d.tokensPerDollarRevenue / 1e6).toFixed(1)}M</td>
                    <td className="px-3 py-2.5 number-cell">
                      <span className="text-sa-green font-bold">+{d.growthPctYoY}%</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`font-bold ${d.clusterMaxRating.startsWith('A') ? 'text-sa-green' : 'text-sa-yellow'}`}>
                        {d.clusterMaxRating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-sa-border">
            <p className="text-xs text-sa-muted">
              <span className="text-white font-medium">ClusterMAX Rating:</span> SemiAnalysis proprietary rating system measuring quality of AI compute procurement, cluster architecture, and model efficiency for token-consuming companies. A+ = best-in-class infrastructure.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
