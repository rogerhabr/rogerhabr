'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import SectionHeader from '../SectionHeader';
import MetricCard from '../MetricCard';
import { defaultROICInputs, hardwareDefaults, calcROIC, roicByEntity } from '@/lib/data';
import { useGlobalParams } from '@/contexts/ParamsContext';
import { useLiveData } from '@/hooks/useLiveData';

const HARDWARE_OPTIONS = Object.keys(hardwareDefaults);

const ROIC_SCENARIO_PRESETS = {
  bear: { utilizationPct: 65, revenuePerMTokens: 0.50, powerCostPerKWh: 0.055 },
  base: { utilizationPct: 82, revenuePerMTokens: 1.50, powerCostPerKWh: 0.040 },
  bull: { utilizationPct: 92, revenuePerMTokens: 3.00, powerCostPerKWh: 0.033 },
};

function SliderInput({ label, value, min, max, step, onChange, format }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; format: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs text-slate-400">{label}</label>
        <span className="text-xs font-bold text-white number-cell">{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-sa-muted mt-0.5">
        <span>{format(min)}</span><span>{format(max)}</span>
      </div>
    </div>
  );
}

export default function ROICCalculator() {
  const { params } = useGlobalParams();
  const { liveData, liveLoaded } = useLiveData();
  const [inputs, setInputs] = useState(() => ({
    ...defaultROICInputs,
    utilizationPct: params.gpuUtilizationPct,
    powerCostPerKWh: params.powerCostPerKwh,
    amortizationYears: params.gpuDepreciationYears,
    costPerGPU: params.gpuCostB200kUSD * 1000,
    revenuePerMTokens: params.tokenInputPricePerM,
  }));
  const [activePreset, setActivePreset] = useState<'bear' | 'base' | 'bull' | null>(null);
  const [selectedPricingModel, setSelectedPricingModel] = useState('');

  const results = calcROIC(inputs);

  const update = (key: keyof typeof inputs) => (v: number | string) => {
    setInputs(prev => ({ ...prev, [key]: v }));
    setActivePreset(null);
  };

  const handleHardwareChange = (hw: string) => {
    const defaults = hardwareDefaults[hw] || {};
    setInputs(prev => ({ ...prev, hardware: hw, ...defaults }));
    setActivePreset(null);
    setSelectedPricingModel('');
  };

  const handleModelPricingSelect = (modelName: string) => {
    setSelectedPricingModel(modelName);
    if (modelName && liveData.modelPricing[modelName]) {
      const p = liveData.modelPricing[modelName];
      // Blended rate: 3:1 input-to-output token ratio (typical chat/API workload)
      const blended = parseFloat(((p.inputPerM * 3 + p.outputPerM) / 4).toFixed(3));
      setInputs(prev => ({ ...prev, revenuePerMTokens: blended }));
      setActivePreset(null);
    }
  };

  const applyPreset = (preset: 'bear' | 'base' | 'bull') => {
    const p = ROIC_SCENARIO_PRESETS[preset];
    setInputs(prev => ({ ...prev, ...p }));
    setActivePreset(preset);
  };

  // Build sensitivity data - vary utilization
  const sensitivityData = [60, 65, 70, 75, 80, 85, 90, 95].map(util => {
    const r = calcROIC({ ...inputs, utilizationPct: util });
    return { utilization: `${util}%`, roic: parseFloat(r.roic.toFixed(1)), revenue: parseFloat((r.annualRevenue / 1e6).toFixed(2)), profit: parseFloat((r.annualProfit / 1e6).toFixed(2)) };
  });

  // Build price sensitivity
  const priceSensData = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0].map(price => {
    const r = calcROIC({ ...inputs, revenuePerMTokens: price });
    return { price: `$${price}`, roic: parseFloat(r.roic.toFixed(1)) };
  });

  const roicColor = results.roic > 25 ? '#10b981' : results.roic > 10 ? '#f97316' : results.roic > 0 ? '#f59e0b' : '#ef4444';

  const presetStyles: Record<string, { active: string; inactive: string }> = {
    bear: {
      active: 'bg-red-900/40 text-red-400 border-red-700',
      inactive: 'bg-sa-card text-slate-400 border-sa-border hover:border-red-800/60 hover:text-red-400',
    },
    base: {
      active: 'bg-sa-accent/20 text-sa-accent border-sa-accent/60',
      inactive: 'bg-sa-card text-slate-400 border-sa-border hover:border-sa-accent/40',
    },
    bull: {
      active: 'bg-green-900/40 text-green-400 border-green-700',
      inactive: 'bg-sa-card text-slate-400 border-sa-border hover:border-green-800/60 hover:text-green-400',
    },
  };

  return (
    <div>
      <SectionHeader
        title="ROIC Calculator"
        subtitle="Interactive return on invested capital model for AI compute deployments. Calculate revenue, costs, and ROIC for hyperscalers, foundation labs, and neoclouds. Adjust hardware, utilization, pricing, and OpEx assumptions."
        badge="Interactive"
        sources={[
          { type: 'actual',   label: 'Inputs: User-adjustable' },
          { type: 'derived',  label: 'ROIC: Computed from your parameters' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Inputs Panel */}
        <div className="lg:col-span-1 bg-sa-card rounded-xl border border-sa-border p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Model Inputs</h3>

          {/* Scenario Preset */}
          <div className="mb-4 pb-4 border-b border-sa-border">
            <p className="text-xs text-slate-400 mb-2">Scenario Preset</p>
            <div className="flex gap-2">
              {(['bear', 'base', 'bull'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => applyPreset(p)}
                  className={`flex-1 py-1.5 rounded border text-xs font-semibold transition-colors ${
                    activePreset === p ? presetStyles[p].active : presetStyles[p].inactive
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="text-xs text-slate-400 mb-1.5 block">Hardware Platform</label>
            <select
              value={inputs.hardware}
              onChange={e => handleHardwareChange(e.target.value)}
              className="w-full text-xs"
            >
              {HARDWARE_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>

          {/* Live model pricing — sets revenue/M tokens from actual API prices */}
          <div className="mb-4 pb-4 border-b border-sa-border">
            <p className="text-xs text-slate-400 mb-1.5">
              Revenue/M tokens from live API pricing
              {liveLoaded && liveData.lastUpdated && (
                <span className="text-green-400 ml-1">· fetched {new Date(liveData.lastUpdated).toLocaleDateString()}</span>
              )}
            </p>
            <select
              value={selectedPricingModel}
              onChange={e => handleModelPricingSelect(e.target.value)}
              className="w-full text-xs"
            >
              <option value="">Manual (use slider below)</option>
              {liveLoaded && Object.entries(liveData.modelPricing).map(([model, p]) => (
                <option key={model} value={model}>
                  {model} — ${p.inputPerM}/M in, ${p.outputPerM}/M out
                </option>
              ))}
            </select>
            {selectedPricingModel && liveData.modelPricing[selectedPricingModel] && (() => {
              const p = liveData.modelPricing[selectedPricingModel];
              const blended = (p.inputPerM * 3 + p.outputPerM) / 4;
              return (
                <p className="text-xs text-sa-muted mt-1">
                  Blended ${blended.toFixed(3)}/M at 3:1 in:out ratio → applied to slider
                </p>
              );
            })()}
            {liveLoaded && liveData.gpuCloud?.azureH100PerHour && (
              <div className="mt-2 p-2 rounded bg-blue-900/20 border border-blue-800/40 text-xs">
                <span className="text-blue-400 font-medium">Azure H100 cloud price: </span>
                <span className="text-white">${liveData.gpuCloud.azureH100PerHour.toFixed(2)}/hr</span>
                <span className="text-sa-muted"> = ${(liveData.gpuCloud.azureH100PerHour * 24 * 365 / 1000).toFixed(0)}k/yr at 100% util</span>
                <span className="text-sa-muted block mt-0.5">Source: Azure Retail Prices API</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <SliderInput
              label="Cluster Size (GPUs)" value={inputs.numGPUs} min={8} max={2048} step={8}
              onChange={update('numGPUs')} format={v => `${v}`}
            />
            <SliderInput
              label="Cost per GPU ($)" value={inputs.costPerGPU} min={15000} max={100000} step={1000}
              onChange={update('costPerGPU')} format={v => `$${(v / 1000).toFixed(0)}k`}
            />
            <SliderInput
              label="GPU Utilization (%)" value={inputs.utilizationPct} min={40} max={100} step={1}
              onChange={update('utilizationPct')} format={v => `${v}%`}
            />
            <SliderInput
              label="Revenue per 1M Tokens ($)" value={inputs.revenuePerMTokens} min={0.25} max={20} step={0.05}
              onChange={update('revenuePerMTokens')} format={v => `$${v.toFixed(2)}`}
            />
            <SliderInput
              label="Throughput (tok/s/GPU)" value={inputs.tokensPerGPUPerSec} min={50} max={3000} step={50}
              onChange={update('tokensPerGPUPerSec')} format={v => `${v}`}
            />
            <SliderInput
              label="Power per GPU (W)" value={inputs.powerW} min={100} max={2000} step={50}
              onChange={update('powerW')} format={v => `${v}W`}
            />
            <SliderInput
              label="Power Cost ($/kWh)" value={inputs.powerCostPerKWh} min={0.02} max={0.15} step={0.005}
              onChange={update('powerCostPerKWh')} format={v => `$${v.toFixed(3)}`}
            />
            <SliderInput
              label="Other OpEx (% of CapEx/yr)" value={inputs.opexPctCapex} min={5} max={30} step={1}
              onChange={update('opexPctCapex')} format={v => `${v}%`}
            />
            <SliderInput
              label="Amortization Period (yrs)" value={inputs.amortizationYears} min={1} max={5} step={0.5}
              onChange={update('amortizationYears')} format={v => `${v}yr`}
            />
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="col-span-2 p-4 rounded-xl border-2 bg-sa-surface" style={{ borderColor: roicColor + '60' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-sa-muted uppercase tracking-wider">Calculated ROIC</p>
                  <p className="text-5xl font-black number-cell mt-1" style={{ color: roicColor }}>
                    {results.roic > 0 ? '+' : ''}{results.roic.toFixed(1)}%
                  </p>
                  <p className="text-xs text-sa-muted mt-1">
                    Payback: {results.paybackMonths === Infinity ? 'Never' : `${results.paybackMonths.toFixed(0)} months`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-sa-muted">Annual Tokens</p>
                  <p className="text-2xl font-bold text-white number-cell">{results.annualTokensB.toFixed(1)}B</p>
                  <p className="text-xs text-sa-muted mt-2">Gross Margin</p>
                  <p className="text-xl font-bold number-cell" style={{ color: results.grossMarginPct > 0 ? '#10b981' : '#ef4444' }}>
                    {results.grossMarginPct.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <MetricCard label="Total CapEx" value={`$${(results.capex / 1e6).toFixed(1)}M`} subtext={`${inputs.numGPUs} × $${(inputs.costPerGPU / 1e3).toFixed(0)}k`} />
            <MetricCard label="Annual Revenue" value={`$${(results.annualRevenue / 1e6).toFixed(1)}M`} subtext={`${inputs.utilizationPct}% utilization`} changePositive change={`${(results.annualRevenue / results.annualTotalCost * 100 - 100).toFixed(0)}% above costs`} />
            <MetricCard label="Annual Power Cost" value={`$${(results.annualPowerCost / 1e6).toFixed(2)}M`} subtext={`${inputs.powerW}W × ${inputs.numGPUs} GPUs`} />
            <MetricCard label="Annual Other OpEx" value={`$${(results.annualOpex / 1e6).toFixed(1)}M`} subtext={`${inputs.opexPctCapex}% of CapEx`} />
            <MetricCard label="Annual Amortization" value={`$${(results.annualAmortization / 1e6).toFixed(1)}M`} subtext={`Over ${inputs.amortizationYears}yr`} />
            <MetricCard
              label="Annual Profit"
              value={`${results.annualProfit > 0 ? '+' : ''}$${(results.annualProfit / 1e6).toFixed(1)}M`}
              changePositive={results.annualProfit > 0}
              accent={results.annualProfit > 0}
            />
          </div>

          {/* Revenue vs Cost Waterfall */}
          <div className="bg-sa-card rounded-xl border border-sa-border p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Annual P&L Breakdown ($M)</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={[
                  { name: 'Revenue', value: parseFloat((results.annualRevenue / 1e6).toFixed(2)), fill: '#10b981' },
                  { name: 'Power', value: -parseFloat((results.annualPowerCost / 1e6).toFixed(2)), fill: '#ef4444' },
                  { name: 'OpEx', value: -parseFloat((results.annualOpex / 1e6).toFixed(2)), fill: '#f97316' },
                  { name: 'Amort.', value: -parseFloat((results.annualAmortization / 1e6).toFixed(2)), fill: '#8b5cf6' },
                  { name: 'Profit', value: parseFloat((results.annualProfit / 1e6).toFixed(2)), fill: roicColor },
                ]}
                margin={{ top: 5, right: 10, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}M`} />
                <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}M`]} contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" name="Amount ($M)" radius={[4, 4, 4, 4]}>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sensitivity Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-sa-card rounded-xl border border-sa-border p-4">
          <h3 className="text-sm font-semibold text-white mb-4">ROIC vs. Utilization Rate</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={sensitivityData} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
              <XAxis dataKey="utilization" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v: number) => [`${v}%`]} contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="roic" name="ROIC (%)" stroke="#f97316" strokeWidth={2.5} dot={{ r: 4, fill: '#f97316' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-sa-card rounded-xl border border-sa-border p-4">
          <h3 className="text-sm font-semibold text-white mb-4">ROIC vs. Token Price</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={priceSensData} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
              <XAxis dataKey="price" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v: number) => [`${v}%`]} contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="roic" name="ROIC (%)" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Industry ROIC Benchmark */}
      <div className="bg-sa-card rounded-xl border border-sa-border p-4">
        <h3 className="text-sm font-semibold text-white mb-4">Industry ROIC Benchmarks by Entity Type (%)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={roicByEntity} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
            <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
            <Tooltip formatter={(v: number) => [`${v}%`]} contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            <Line type="monotone" dataKey="hyperscalers" name="Hyperscalers" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="foundationLabs" name="Foundation Labs" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
            <Line type="monotone" dataKey="neoclouds" name="Neoclouds" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-xs text-sa-muted mt-3">
          Foundation lab ROIC turns positive in 2026E as revenue scales and model inference efficiency improves. Neoclouds maintain premium ROIC through specialized GPU infrastructure and high-value workloads.
        </p>
      </div>
    </div>
  );
}
