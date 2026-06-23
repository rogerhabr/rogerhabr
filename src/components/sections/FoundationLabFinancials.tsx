'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, LineChart, Line, ComposedChart, Area, AreaChart,
} from 'recharts';
import SectionHeader from '../SectionHeader';
import MetricCard from '../MetricCard';
import DataTable from '../DataTable';
import {
  labRevenue, labOperatingIncome, fundingRounds, labValuations, labHeadcount,
  foundationLabColors,
} from '@/lib/data';

const LAB_COLORS: Record<string, string> = {
  OpenAI:    '#10b981',
  Anthropic: '#f97316',
  xAI:       '#8b5cf6',
  DeepSeek:  '#3b82f6',
};

// Combine revenue + income for P&L chart
const plData = labRevenue.map((r, i) => {
  const loss = labOperatingIncome[i];
  return {
    year: r.year,
    'OpenAI Rev': r.OpenAI,
    'Anthropic Rev': r.Anthropic,
    'xAI Rev': r.xAI,
    'DeepSeek Rev': r.DeepSeek,
    'OpenAI OI': loss.OpenAI,
    'Anthropic OI': loss.Anthropic,
    'xAI OI': loss.xAI,
    'DeepSeek OI': loss.DeepSeek,
  };
});

export default function FoundationLabFinancials() {
  const [tab, setTab] = useState<'revenue' | 'profitability' | 'valuation' | 'funding'>('revenue');

  // Revenue per employee
  const revenuePerEmployee = labRevenue.map((r, i) => {
    const h = labHeadcount[i] || { OpenAI: null, Anthropic: null, xAI: null, DeepSeek: null };
    return {
      year: r.year,
      OpenAI:    h.OpenAI    ? parseFloat(((r.OpenAI    * 1000) / h.OpenAI   ).toFixed(0)) : null,
      Anthropic: h.Anthropic ? parseFloat(((r.Anthropic * 1000) / h.Anthropic).toFixed(0)) : null,
      xAI:       h.xAI      ? parseFloat(((r.xAI       * 1000) / h.xAI      ).toFixed(0)) : null,
      DeepSeek:  h.DeepSeek  ? parseFloat(((r.DeepSeek  * 1000) / h.DeepSeek ).toFixed(0)) : null,
    };
  });

  // Funding rounds sorted
  const sortedFunding = [...fundingRounds].sort((a, b) => a.date.localeCompare(b.date));
  const totalFunding: Record<string, number> = {};
  sortedFunding.forEach(r => {
    totalFunding[r.company] = (totalFunding[r.company] || 0) + r.amountB;
  });

  // Headline figures derived from the lab data arrays (single source of truth)
  const rev2024 = labRevenue.find(r => r.year === '2024');
  const rev2025 = labRevenue.find(r => r.year === '2025E');
  const val2024 = labValuations.find(r => r.year === '2024');
  const val2025 = labValuations.find(r => r.year === '2025E');
  const yoy = (curr?: number, prev?: number) => (curr != null && prev != null && prev !== 0)
    ? `+${((curr / prev - 1) * 100).toFixed(0)}%` : '';

  return (
    <div>
      <SectionHeader
        title="Foundation Lab Financials"
        subtitle="Revenue growth, operating losses, funding rounds, and valuations for OpenAI, Anthropic, xAI, and DeepSeek. Tracks the path to profitability as model API revenue scales against compute and R&D costs."
        badge="Lab Economics"
        sources={[
          { type: 'estimate', label: 'Estimate: Private company disclosures' },
          { type: 'actual',   label: 'Revenue anchors: Bloomberg / Reuters' },
        ]}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="OpenAI Revenue 2025" value={`$${rev2025?.OpenAI ?? 11.6}B`} change={`${yoy(rev2025?.OpenAI, rev2024?.OpenAI)} YoY`} changePositive subtext="Largest foundation lab by revenue" accent={tab === 'revenue'} icon="🟢" onClick={() => setTab('revenue')} />
        <MetricCard label="Anthropic Revenue 2025" value={`$${rev2025?.Anthropic ?? 3.0}B`} change={`${yoy(rev2025?.Anthropic, rev2024?.Anthropic)} YoY`} changePositive subtext="API + Claude.ai + enterprise" accent={tab === 'profitability'} icon="🟠" onClick={() => setTab('profitability')} />
        <MetricCard label="Total Lab Funding Raised" value={`$${Object.values(totalFunding).reduce((a, b) => a + b, 0).toFixed(0)}B+`} subtext="OpenAI, Anthropic, xAI combined" accent={tab === 'funding'} icon="💰" onClick={() => setTab('funding')} />
        <MetricCard label="OpenAI Valuation 2025" value={`$${val2025?.OpenAI ?? 340}B`} change={`${yoy(val2025?.OpenAI, val2024?.OpenAI)} vs 2024`} changePositive subtext="SoftBank strategic round" accent={tab === 'valuation'} icon="🦄" onClick={() => setTab('valuation')} />
      </div>

      <div className="flex gap-2 mb-5">
        {[
          { id: 'revenue', label: 'Revenue Growth' },
          { id: 'profitability', label: 'Profitability' },
          { id: 'valuation', label: 'Valuations' },
          { id: 'funding', label: 'Funding Rounds' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-sa-accent text-white' : 'bg-sa-card border border-sa-border text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'revenue' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <div className="bg-sa-card rounded-xl border border-sa-border p-4">
              <h3 className="text-sm font-semibold text-white mb-4">Annual Revenue by Lab ($B)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={labRevenue} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
                  <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}B`} />
                  <Tooltip
                    formatter={(v: number, name: string) => [`$${v.toFixed(1)}B`, name]}
                    contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                  <Bar dataKey="OpenAI" fill={LAB_COLORS.OpenAI} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Anthropic" fill={LAB_COLORS.Anthropic} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="xAI" fill={LAB_COLORS.xAI} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="DeepSeek" fill={LAB_COLORS.DeepSeek} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-sa-card rounded-xl border border-sa-border p-4">
              <h3 className="text-sm font-semibold text-white mb-4">Revenue Growth Trajectory</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={labRevenue} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
                  <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}B`} />
                  <Tooltip
                    formatter={(v: number, name: string) => [`$${v.toFixed(1)}B`, name]}
                    contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                  {Object.keys(LAB_COLORS).map(lab => (
                    <Line key={lab} type="monotone" dataKey={lab} stroke={LAB_COLORS[lab]} strokeWidth={2} dot={{ r: 4 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-sa-card rounded-xl border border-sa-border p-4 mb-5">
            <h3 className="text-sm font-semibold text-white mb-4">Revenue per Employee ($K) — Productivity Metric</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenuePerEmployee} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
                <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}K`} />
                <Tooltip
                  formatter={(v: unknown, name: string) => (v != null && v !== 0) ? [`$${v}K`, name] : ['—', name]}
                  contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                {Object.keys(LAB_COLORS).map(lab => (
                  <Line key={lab} type="monotone" dataKey={lab} stroke={LAB_COLORS[lab]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-sa-muted mt-2">DeepSeek shows highest revenue/employee due to lean structure (~300 researchers vs. 1,800+ at OpenAI). Excludes compute costs from the denominator.</p>
          </div>

          <DataTable
            title="Revenue Detail ($B)"
            columns={[
              { key: 'year', label: 'Year', align: 'left' },
              { key: 'OpenAI', label: 'OpenAI', align: 'right', highlight: true, format: v => `$${v}B` },
              { key: 'Anthropic', label: 'Anthropic', align: 'right', format: v => `$${v}B` },
              { key: 'xAI', label: 'xAI', align: 'right', format: v => `$${v}B` },
              { key: 'DeepSeek', label: 'DeepSeek', align: 'right', format: v => `$${v}B` },
            ]}
            data={labRevenue}
            compact
          />
        </>
      )}

      {tab === 'profitability' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <div className="bg-sa-card rounded-xl border border-sa-border p-4">
              <h3 className="text-sm font-semibold text-white mb-4">Operating Income / (Loss) ($B)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={labOperatingIncome} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
                  <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}B`} />
                  <Tooltip
                    formatter={(v: number, name: string) => [`$${v.toFixed(2)}B`, name]}
                    contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                  {Object.keys(LAB_COLORS).map(lab => (
                    <Bar key={lab} dataKey={lab} fill={LAB_COLORS[lab]} radius={[4, 4, 4, 4]} />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
              <p className="text-xs text-sa-muted mt-2">OpenAI turns operating-income positive in 2026E as API revenue scales. Foundation labs run heavy losses due to training compute costs amortized against future revenue.</p>
            </div>

            <div className="bg-sa-card rounded-xl border border-sa-border p-4">
              <h3 className="text-sm font-semibold text-white mb-4">Revenue vs Operating Income — OpenAI ($B)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart
                  data={labRevenue.map((r, i) => ({ year: r.year, Revenue: r.OpenAI, 'Operating Income': labOperatingIncome[i].OpenAI }))}
                  margin={{ top: 0, right: 10, bottom: 0, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
                  <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}B`} />
                  <Tooltip
                    formatter={(v: number, name: string) => [`$${v.toFixed(1)}B`, name]}
                    contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                  <Bar dataKey="Revenue" fill="#10b981" opacity={0.8} radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="Operating Income" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: '#ef4444' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <DataTable
            title="Operating Income / (Loss) Detail ($B)"
            columns={[
              { key: 'year', label: 'Year', align: 'left' },
              ...Object.keys(LAB_COLORS).map(lab => ({
                key: lab,
                label: lab,
                align: 'right' as const,
                format: (v: unknown) => {
                  const n = Number(v);
                  return <span className={n >= 0 ? 'text-sa-green font-bold' : 'text-sa-red'}>${n.toFixed(2)}B</span>;
                },
              })),
            ]}
            data={labOperatingIncome}
            compact
          />
        </>
      )}

      {tab === 'valuation' && (
        <>
          <div className="bg-sa-card rounded-xl border border-sa-border p-4 mb-5">
            <h3 className="text-sm font-semibold text-white mb-4">Implied Valuation ($B)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={labValuations} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  {Object.entries(LAB_COLORS).map(([lab, color]) => (
                    <linearGradient key={lab} id={`val-${lab}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
                <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}B`} />
                <Tooltip
                  formatter={(v: number, name: string) => [`$${v}B`, name]}
                  contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                {Object.keys(LAB_COLORS).map(lab => (
                  <Area key={lab} type="monotone" dataKey={lab} stroke={LAB_COLORS[lab]}
                    fill={`url(#val-${lab})`} strokeWidth={2} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            {Object.entries(LAB_COLORS).map(([lab, color]) => {
              const latest = labValuations[labValuations.length - 1];
              const rev2025 = labRevenue.find(r => r.year === '2025')!;
              const revMultiple = lab in latest ? (latest as unknown as Record<string, number>)[lab] / (rev2025 as unknown as Record<string, number>)[lab] : 0;
              return (
                <div key={lab} className="bg-sa-card rounded-xl border border-sa-border p-4">
                  <div className="w-3 h-3 rounded-full mb-2" style={{ background: color }} />
                  <p className="text-xs text-sa-muted uppercase tracking-wider font-semibold">{lab}</p>
                  <p className="text-2xl font-black number-cell mt-1" style={{ color }}>
                    ${(latest as unknown as Record<string, number>)[lab] ?? 0}B
                  </p>
                  <p className="text-xs text-sa-muted mt-1">2027E valuation</p>
                  {revMultiple > 0 && (
                    <p className="text-xs font-medium mt-2" style={{ color }}>
                      {revMultiple.toFixed(0)}× 2025 revenue
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'funding' && (
        <>
          <div className="bg-sa-card rounded-xl border border-sa-border overflow-hidden mb-5">
            <div className="px-4 py-3 border-b border-sa-border">
              <h3 className="text-sm font-semibold text-white">Funding Rounds Timeline</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-sa-border">
                    {['Date', 'Company', 'Amount', 'Valuation', 'Round', 'Lead Investors'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-sa-muted font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedFunding.map((r, i) => (
                    <tr key={i} className="border-b border-sa-border/50 hover:bg-white/2">
                      <td className="px-3 py-2.5 text-slate-400 number-cell">{r.date}</td>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: LAB_COLORS[r.company] }}>{r.company}</td>
                      <td className="px-3 py-2.5 text-sa-green number-cell font-bold">${r.amountB.toFixed(1)}B</td>
                      <td className="px-3 py-2.5 text-slate-300 number-cell">${r.valuationB}B</td>
                      <td className="px-3 py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-sa-border text-slate-300">{r.type}</span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-400">{r.leadInvestors}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {Object.entries(totalFunding).map(([company, total]) => (
              <div key={company} className="bg-sa-card rounded-xl border border-sa-border p-4">
                <p className="text-xs text-sa-muted font-semibold uppercase tracking-wider">{company}</p>
                <p className="text-2xl font-black number-cell mt-1" style={{ color: LAB_COLORS[company] }}>
                  ${total.toFixed(1)}B
                </p>
                <p className="text-xs text-sa-muted mt-1">Total raised</p>
                <p className="text-xs text-slate-400 mt-2">
                  {fundingRounds.filter(r => r.company === company).length} rounds tracked
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
