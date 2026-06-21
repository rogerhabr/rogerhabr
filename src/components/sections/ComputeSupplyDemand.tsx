'use client';

import { useState } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area,
} from 'recharts';
import SectionHeader from '../SectionHeader';
import MetricCard from '../MetricCard';
import DataTable from '../DataTable';
import ParamControl from '../ParamControl';
import { supplyDemand, supplyByType } from '@/lib/data';
import { useGlobalParams } from '@/contexts/ParamsContext';

const supplyDemandForChart = supplyDemand.map(d => ({
  ...d,
  totalSupply: d.inferenceSupply + d.trainingSupply,
  totalDemand: d.inferenceDemand + d.trainingDemand,
  gap: (d.inferenceSupply + d.trainingSupply) - (d.inferenceDemand + d.trainingDemand),
}));

export default function ComputeSupplyDemand() {
  const { params } = useGlobalParams();
  const [utilizationLevel, setUtilizationLevel] = useState('base');
  const [demandView, setDemandView] = useState('all');

  const utilizationMap: Record<string, number> = {
    low: 65,
    base: params.gpuUtilizationPct,
    high: 90,
  };
  const displayUtilization = utilizationMap[utilizationLevel];

  const filteredSupplyByType = supplyByType.map(d => {
    if (demandView === 'hyperscalers') return { year: d.year, hyperscalers: d.hyperscalers, foundationLabs: 0, neoclouds: 0 };
    if (demandView === 'neoclouds') return { year: d.year, hyperscalers: 0, foundationLabs: 0, neoclouds: d.neoclouds };
    if (demandView === 'foundationLabs') return { year: d.year, hyperscalers: 0, foundationLabs: d.foundationLabs, neoclouds: 0 };
    return d;
  });

  const tableData = supplyDemandForChart.map(d => ({
    Year: d.year,
    'Inference Supply': d.inferenceSupply.toFixed(1),
    'Training Supply': d.trainingSupply.toFixed(1),
    'Total Supply': d.totalSupply.toFixed(1),
    'Inference Demand': d.inferenceDemand.toFixed(1),
    'Training Demand': d.trainingDemand.toFixed(1),
    'Total Demand': d.totalDemand.toFixed(1),
    'Supply Gap': d.gap > 0 ? `+${d.gap.toFixed(1)}` : d.gap.toFixed(1),
  }));

  return (
    <div>
      <SectionHeader
        title="AI Compute Supply & Demand"
        subtitle="Track AI compute supply (available GPU capacity) versus demand (workload requirements) by hyperscalers, foundation labs, and neoclouds. Measured in B200-equivalent EFLOPS (millions) annualized."
        badge="Supply Chain"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Total Supply 2025" value="7.5M EFLOPS" change="+144% YoY" changePositive subtext="B200-eq annualized" accent icon="⚡" />
        <MetricCard label="Total Demand 2025" value="7.5M EFLOPS" change="+128% YoY" changePositive subtext="Inference + Training" icon="📊" />
        <MetricCard label="Supply Utilization" value={`${displayUtilization}%`} change="+5pp YoY" changePositive subtext="Near tight markets" icon="📈" />
        <MetricCard label="Demand CAGR 2024-27" value="~115%" subtext="Inference growing faster than training" icon="🚀" />
      </div>

      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <ParamControl
          label="Utilization"
          value={utilizationLevel}
          options={[
            { value: 'low', label: 'Low (65%)' },
            { value: 'base', label: `Base (${params.gpuUtilizationPct}%)` },
            { value: 'high', label: 'High (90%)' },
          ]}
          onChange={setUtilizationLevel}
        />
        <ParamControl
          label="Demand View"
          value={demandView}
          options={[
            { value: 'all', label: 'All Providers' },
            { value: 'hyperscalers', label: 'Hyperscalers' },
            { value: 'neoclouds', label: 'Neoclouds' },
            { value: 'foundationLabs', label: 'Foundation Labs' },
          ]}
          onChange={setDemandView}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-sa-card rounded-xl border border-sa-border p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Supply vs Demand (B200-eq EFLOPS M)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={supplyDemandForChart} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
              <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Bar dataKey="inferenceSupply" name="Inference Supply" stackId="s" fill="#3b82f6" />
              <Bar dataKey="trainingSupply" name="Training Supply" stackId="s" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="totalDemand" name="Total Demand" stroke="#f97316" strokeWidth={2.5} dot={{ r: 4, fill: '#f97316' }} strokeDasharray="5 3" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-sa-card rounded-xl border border-sa-border p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Supply by Provider Type</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={filteredSupplyByType} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
              <defs>
                {[['hyp', '#3b82f6'], ['found', '#f97316'], ['neo', '#10b981']].map(([id, c]) => (
                  <linearGradient key={id} id={`sg-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={c} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={c} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
              <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Area type="monotone" dataKey="hyperscalers" name="Hyperscalers" stackId="1" stroke="#3b82f6" fill="url(#sg-hyp)" strokeWidth={2} />
              <Area type="monotone" dataKey="foundationLabs" name="Foundation Labs" stackId="1" stroke="#f97316" fill="url(#sg-found)" strokeWidth={2} />
              <Area type="monotone" dataKey="neoclouds" name="Neoclouds" stackId="1" stroke="#10b981" fill="url(#sg-neo)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Supply/demand gap analysis */}
      <div className="bg-sa-card rounded-xl border border-sa-border p-4 mb-5">
        <h3 className="text-sm font-semibold text-white mb-4">Supply-Demand Gap Analysis (EFLOPS M)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={supplyDemandForChart} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
            <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}`} />
            <Tooltip
              formatter={(v: number, name: string) => [`${v.toFixed(1)}M EFLOPS`, name]}
              contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            <Bar dataKey="gap" name="Supply Surplus" fill="#10b981" radius={[4, 4, 4, 4]} />
          </ComposedChart>
        </ResponsiveContainer>
        <p className="text-xs text-sa-muted mt-2">
          Positive gap = compute oversupply (price pressure). Markets are trending toward tighter supply as inference demand accelerates faster than GPU production can supply.
        </p>
      </div>

      <DataTable
        title="Supply & Demand Detailed Data (B200-eq EFLOPS, Millions)"
        columns={[
          { key: 'Year', label: 'Year', align: 'left' },
          { key: 'Inference Supply', label: 'Inf. Supply', align: 'right' },
          { key: 'Training Supply', label: 'Train. Supply', align: 'right' },
          { key: 'Total Supply', label: 'Total Supply', align: 'right', highlight: true },
          { key: 'Inference Demand', label: 'Inf. Demand', align: 'right' },
          { key: 'Training Demand', label: 'Train. Demand', align: 'right' },
          { key: 'Total Demand', label: 'Total Demand', align: 'right', highlight: true },
          { key: 'Supply Gap', label: 'Gap', align: 'right', format: (v) => {
            const n = parseFloat(String(v));
            return <span className={n >= 0 ? 'text-sa-green' : 'text-sa-red'}>{String(v)}</span>;
          }},
        ]}
        data={tableData}
        compact
      />
    </div>
  );
}
