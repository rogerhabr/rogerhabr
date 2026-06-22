'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, LineChart, Line, AreaChart, Area,
} from 'recharts';
import SectionHeader from '../SectionHeader';
import MetricCard from '../MetricCard';
import DataTable from '../DataTable';
import ParamControl from '../ParamControl';
import { hardwareDemandForecast, vendorMarketShare } from '@/lib/data';
import { useGlobalParams } from '@/contexts/ParamsContext';

export default function HardwareDemandForecast() {
  const { mult, params } = useGlobalParams();
  const [demandType, setDemandType] = useState('total');
  const [vendor, setVendor] = useState('all');

  const demand2024 = hardwareDemandForecast.find(d => d.year === '2024')!;
  const demand2025 = hardwareDemandForecast.find(d => d.year === '2025')!;
  const demand2027 = hardwareDemandForecast.find(d => d.year === '2027E')!;
  const demand2028 = hardwareDemandForecast.find(d => d.year === '2028E')!;

  const adjustedForecast = hardwareDemandForecast.map(d => {
    const isHistorical = d.year === '2022' || d.year === '2023' || d.year === '2024';
    const factor = (!isHistorical && params.scenario !== 'base') ? mult.gpuDemand : 1;
    return {
      ...d,
      inferenceGPUs: Math.round(d.inferenceGPUs * factor),
      trainingGPUs: Math.round(d.trainingGPUs * factor),
      total: Math.round(d.total * factor),
    };
  });

  // Adjust vendor market share based on user's nvidiaSharePct (base 2025 = 80%)
  const NV_BASE_2025 = 80;
  const nvScale = params.nvidiaSharePct / NV_BASE_2025;

  const adjustedVendorShare = vendorMarketShare.map(d => {
    const adjNV = Math.min(99, Math.round(d.NVIDIA * nvScale));
    const origNonNV = 100 - d.NVIDIA;
    const newNonNV = 100 - adjNV;
    const nonNVScale = origNonNV > 0 ? newNonNV / origNonNV : 1;
    const adjAMD = Math.round(d.AMD * nonNVScale);
    const adjGoogle = Math.round(d.Google * nonNVScale);
    const adjAmazon = Math.round(d.Amazon * nonNVScale);
    const adjOther = Math.max(0, 100 - adjNV - adjAMD - adjGoogle - adjAmazon);
    return { year: d.year, NVIDIA: adjNV, AMD: adjAMD, Google: adjGoogle, Amazon: adjAmazon, Other: adjOther };
  });

  const filteredVendorShare = adjustedVendorShare.map(d => {
    if (vendor === 'NVIDIA') return { year: d.year, NVIDIA: d.NVIDIA, AMD: 0, Google: 0, Amazon: 0, Other: 0 };
    if (vendor === 'AMD') return { year: d.year, NVIDIA: 0, AMD: d.AMD, Google: 0, Amazon: 0, Other: 0 };
    if (vendor === 'Google') return { year: d.year, NVIDIA: 0, AMD: 0, Google: d.Google, Amazon: 0, Other: 0 };
    if (vendor === 'Amazon') return { year: d.year, NVIDIA: 0, AMD: 0, Google: 0, Amazon: d.Amazon, Other: 0 };
    return d;
  });

  const inferenceShare2025 = ((demand2025.inferenceGPUs / demand2025.total) * 100).toFixed(0);

  const demand2025Adj = adjustedForecast.find(d => d.year === '2025')!;
  const demand2027Adj = adjustedForecast.find(d => d.year === '2027E')!;

  const tableData = adjustedForecast.map((d, i) => ({
    Year: d.year,
    'Inference GPUs': `${d.inferenceGPUs.toLocaleString()}k`,
    'Training GPUs': `${d.trainingGPUs.toLocaleString()}k`,
    'Total GPUs': `${d.total.toLocaleString()}k`,
    'Inf. Share': `${((d.inferenceGPUs / d.total) * 100).toFixed(0)}%`,
    'YoY Growth': i === 0 ? '—' : `+${(((d.total / adjustedForecast[i - 1].total) - 1) * 100).toFixed(0)}%`,
  }));

  const vendorShareData = filteredVendorShare.map(d => ({
    year: d.year,
    NVIDIA: d.NVIDIA,
    AMD: d.AMD,
    Google: d.Google,
    Amazon: d.Amazon,
    Other: d.Other,
  }));

  const chartData = demandType === 'inference'
    ? adjustedForecast.map(d => ({ ...d, display: d.inferenceGPUs }))
    : demandType === 'training'
    ? adjustedForecast.map(d => ({ ...d, display: d.trainingGPUs }))
    : adjustedForecast;

  return (
    <div>
      <SectionHeader
        title="AI Hardware Demand Forecast"
        subtitle="Aggregate GPU demand forecast based on inference adoption growth and training workload expansion. Translates token economy revenue growth into AI accelerator demand for NVIDIA, AMD, Google TPUs, Amazon Trainium, and emerging vendors."
        badge="Demand Model"
        sources={[
          { type: 'estimate', label: 'Modeled from NVIDIA guidance + IDC' },
          { type: 'actual',   label: '2025 anchor: NVIDIA FY2026 guidance', url: 'https://investor.nvidia.com' },
        ]}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Total GPU Demand 2025" value={`${(demand2025Adj.total / 1000).toFixed(1)}M`} change={`+${((demand2025Adj.total / demand2024.total - 1) * 100).toFixed(0)}% YoY`} changePositive subtext="B200-eq units shipped" accent icon="📦" />
        <MetricCard label="Inference Share 2025" value={`${inferenceShare2025}%`} change="vs 65% in 2023" changePositive subtext="Inference growing faster" icon="⚡" />
        <MetricCard label="GPU Demand 2027E" value={`${(demand2027Adj.total / 1000).toFixed(1)}M`} change={`+${((demand2027Adj.total / demand2025Adj.total - 1) * 100).toFixed(0)}% vs 2025`} changePositive subtext={`CAGR 2024–27: ${((Math.pow(demand2027Adj.total / demand2024.total, 1/3) - 1) * 100).toFixed(0)}%`} icon="📈" />
        <MetricCard label="NVIDIA Market Share 2027E" value={`${adjustedVendorShare.find(d => d.year === '2027E')?.NVIDIA ?? 70}%`} change={`${params.nvidiaSharePct}% in 2025`} subtext="AMD/Google/Amazon gaining" changePositive={false} icon="🎯" />
      </div>

      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <ParamControl
          label="Demand Type"
          value={demandType}
          options={[
            { value: 'total', label: 'Total' },
            { value: 'inference', label: 'Inference Only' },
            { value: 'training', label: 'Training Only' },
          ]}
          onChange={setDemandType}
        />
        <ParamControl
          label="Vendor"
          value={vendor}
          options={[
            { value: 'all', label: 'All Vendors' },
            { value: 'NVIDIA', label: 'NVIDIA' },
            { value: 'AMD', label: 'AMD' },
            { value: 'Google', label: 'Google' },
            { value: 'Amazon', label: 'Amazon' },
          ]}
          onChange={setVendor}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-sa-card rounded-xl border border-sa-border p-4">
          <h3 className="text-sm font-semibold text-white mb-4">GPU Demand: Inference vs Training (k B200-eq)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={adjustedForecast} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
              <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}M`} />
              <Tooltip
                formatter={(v: number, name: string) => [`${v.toLocaleString()}k GPUs`, name]}
                contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              {(demandType === 'total' || demandType === 'inference') && (
                <Bar dataKey="inferenceGPUs" name="Inference" stackId="a" fill="#3b82f6" />
              )}
              {(demandType === 'total' || demandType === 'training') && (
                <Bar dataKey="trainingGPUs" name="Training" stackId="a" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-sa-card rounded-xl border border-sa-border p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Total GPU Shipments Growth Trajectory</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={adjustedForecast} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
              <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v.toLocaleString()}k`} />
              <Tooltip
                formatter={(v: number) => [`${v.toLocaleString()}k GPUs`]}
                contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }}
              />
              <Area type="monotone" dataKey="total" name="Total GPU Demand" stroke="#f97316" fill="url(#demandGrad)" strokeWidth={2.5} dot={{ r: 5, fill: '#f97316' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Vendor Market Share */}
      <div className="bg-sa-card rounded-xl border border-sa-border p-4 mb-5">
        <h3 className="text-sm font-semibold text-white mb-4">AI Accelerator Vendor Market Share (%) — NVIDIA vs AMD vs Google vs Amazon</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={vendorShareData} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
            <defs>
              {[['nv','#76b900'],['amd','#ed1c24'],['goog','#4285f4'],['amz','#ff9900'],['oth','#64748b']].map(([id, c]) => (
                <linearGradient key={id} id={`vs-${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={c} stopOpacity={0.5} />
                  <stop offset="95%" stopColor={c} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
            <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} domain={[0, 100]} />
            <Tooltip
              formatter={(v: number, name: string) => [`${v}%`, name]}
              contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            <Area type="monotone" dataKey="NVIDIA" stroke="#76b900" fill="url(#vs-nv)" strokeWidth={2} />
            <Area type="monotone" dataKey="AMD" stroke="#ed1c24" fill="url(#vs-amd)" strokeWidth={2} />
            <Area type="monotone" dataKey="Google" stroke="#4285f4" fill="url(#vs-goog)" strokeWidth={2} />
            <Area type="monotone" dataKey="Amazon" stroke="#ff9900" fill="url(#vs-amz)" strokeWidth={2} />
            <Area type="monotone" dataKey="Other" stroke="#64748b" fill="url(#vs-oth)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-xs text-sa-muted mt-2">
          NVIDIA's dominance erodes gradually as AMD MI350X ramps, Google's TPU v7 scales across GCP, and Amazon Trainium 3 achieves production readiness. Custom silicon advantages (cost, efficiency) drive share gains in captive workloads.
        </p>
      </div>

      <DataTable
        title="Hardware Demand Forecast (B200-equivalent GPU Units, Thousands)"
        columns={[
          { key: 'Year', label: 'Year', align: 'left' },
          { key: 'Inference GPUs', label: 'Inference', align: 'right' },
          { key: 'Training GPUs', label: 'Training', align: 'right' },
          { key: 'Total GPUs', label: 'Total', align: 'right', highlight: true },
          { key: 'Inf. Share', label: 'Inf. Share', align: 'right' },
          { key: 'YoY Growth', label: 'YoY Growth', align: 'right', format: (v) => {
            const str = String(v);
            const isPos = str.startsWith('+');
            return str === '—' ? <span className="text-sa-muted">—</span> : (
              <span className={isPos ? 'text-sa-green font-bold' : 'text-sa-red font-bold'}>{str}</span>
            );
          }},
        ]}
        data={tableData}
        compact
      />

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="p-3 rounded-lg bg-sa-surface border border-sa-border">
          <p className="text-xs font-semibold text-white mb-1">Inference Demand Driver</p>
          <p className="text-xs text-sa-muted">MAU growth × tokens/user × 365 days. ChatGPT, Google AI Overviews, and enterprise AI agents drive the majority of inference demand through 2028.</p>
        </div>
        <div className="p-3 rounded-lg bg-sa-surface border border-sa-border">
          <p className="text-xs font-semibold text-white mb-1">Training Demand Driver</p>
          <p className="text-xs text-sa-muted">Model generation cadence × cluster size × training duration. Next-gen foundation models (GPT-6, Claude 5, Gemini 3) require exponentially larger training runs.</p>
        </div>
        <div className="p-3 rounded-lg bg-sa-surface border border-sa-border">
          <p className="text-xs font-semibold text-white mb-1">Key Risk</p>
          <p className="text-xs text-sa-muted">Model efficiency gains (MoE, distillation, quantization) could reduce GPU demand by 30-50% vs baseline. DeepSeek-style efficiency is a structural headwind for GPU demand.</p>
        </div>
      </div>
    </div>
  );
}
