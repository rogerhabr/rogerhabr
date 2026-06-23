'use client';

import { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import MetricCard from '../MetricCard';
import SectionHeader from '../SectionHeader';
import {
  tokenEconomyTAM, revenueByModel, roicByEntity,
  hyperscalerGPUs, foundationLabGPUs, neocloudGPUs, hyperscalerCapex,
} from '@/lib/data';
import { useGlobalParams } from '@/contexts/ParamsContext';

const DISPLAY_YEARS = ['2025E', '2026E', '2027E', '2028E', '2029E', '2030E'];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-sa-card border border-sa-border rounded-lg p-3 text-xs shadow-xl">
      <p className="text-white font-semibold mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="text-white font-medium">${typeof p.value === 'number' ? p.value.toFixed(1) : p.value}B</span>
        </div>
      ))}
    </div>
  );
};

// Pre-compute GPU base and CapEx totals per year
function buildGPUBase() {
  const m: Record<string, number> = {};
  hyperscalerGPUs.forEach(r => { m[r.year] = (m[r.year] || 0) + r.Microsoft + r.Google + r.Amazon + r.Meta + r.Oracle; });
  foundationLabGPUs.forEach(r => { m[r.year] = (m[r.year] || 0) + r.OpenAI + r.Anthropic + r.xAI + r.DeepSeek + (r['Thinking Machines'] || 0); });
  neocloudGPUs.forEach(r => { m[r.year] = (m[r.year] || 0) + r.CoreWeave + r.Nebius + r.Crusoe + r['Lambda Labs']; });
  return m;
}

function buildCapEx() {
  const m: Record<string, number> = {};
  hyperscalerCapex.forEach(r => { m[r.year] = r.Microsoft + r.Google + r.Amazon + r.Meta + r.Oracle; });
  return m;
}

const GPU_BASE = buildGPUBase();
const CAPEX_TOTAL = buildCapEx();

export default function Overview() {
  const { mult, params, navigate } = useGlobalParams();
  const [selectedYear, setSelectedYear] = useState('2025E');

  const tamData = tokenEconomyTAM.map(d => {
    const isForecast = d.year !== '2024';
    const factor = isForecast ? mult.tam : 1;
    return {
      year: d.year,
      'Consumer Apps': +(d.consumerApps * factor).toFixed(1),
      'API Inference': +(d.apiInference * factor).toFixed(1),
      'Token Software': +(d.tokenSoftware * factor).toFixed(1),
      total: +((d.consumerApps + d.apiInference + d.tokenSoftware) * factor).toFixed(1),
    };
  });

  const revenueData = revenueByModel.map(d => {
    const isForecast = d.year !== '2024';
    const factor = isForecast ? mult.revenue : 1;
    return {
      year: d.year,
      rental: +(d.rental * factor).toFixed(1),
      model: +(d.model * factor).toFixed(1),
      software: +(d.software * factor).toFixed(1),
      total: +((d.rental + d.model + d.software) * factor).toFixed(1),
    };
  });

  const roicData = roicByEntity.map(d => {
    const isForecast = d.year !== '2024';
    const offset = isForecast ? mult.roicOffset : 0;
    return {
      year: d.year,
      hyperscalers: Math.max(-50, d.hyperscalers + offset),
      foundationLabs: Math.max(-50, d.foundationLabs + offset),
      neoclouds: Math.max(-50, d.neoclouds + offset),
    };
  });

  const rev2030 = revenueData.find(d => d.year === '2030E');
  const rev2025base = revenueData.find(d => d.year === '2025E');
  const rev2030Total = rev2030?.total ?? 0;
  const rev2025Total = rev2025base?.total ?? 0;
  const rev2030Mult = rev2025Total > 0 ? rev2030Total / rev2025Total : 0;
  const rev2030Cagr = rev2025Total > 0 ? (Math.pow(rev2030Total / rev2025Total, 1 / 5) - 1) * 100 : 0;
  const fmtMoney = (b: number) => b >= 1000 ? `$${(b / 1000).toFixed(2)}T` : `$${b.toFixed(0)}B`;

  const prevYear = DISPLAY_YEARS[DISPLAY_YEARS.indexOf(selectedYear) - 1] ?? '2024';

  const tam = tamData.find(d => d.year === selectedYear);
  const tamPrev = tamData.find(d => d.year === prevYear);
  const rev = revenueData.find(d => d.year === selectedYear);
  const revPrev = revenueData.find(d => d.year === prevYear);
  const roic = roicData.find(d => d.year === selectedYear);

  const tamTotal = tam ? tam.total : 0;
  const tamPrevTotal = tamPrev ? tamPrev.total : 0;
  const revTotal = rev ? rev.total : 0;
  const revPrevTotal = revPrev ? revPrev.total : 0;
  const gpuBase = GPU_BASE[selectedYear] || 0;
  const gpuBasePrev = GPU_BASE[prevYear] || 0;
  const capex = CAPEX_TOTAL[selectedYear] || 0;
  const capexPrev = CAPEX_TOTAL[prevYear] || 0;

  const fmtPct = (curr: number, prev: number) => prev > 0 ? `+${((curr / prev - 1) * 100).toFixed(0)}% YoY` : '';
  const fmtGPU = (n: number) => n >= 1000 ? `~${(n / 1000).toFixed(2)}M` : `${n}k`;

  return (
    <div>
      <SectionHeader
        title="AI Tokenomics — Overview Dashboard"
        subtitle="End-to-end analysis connecting AI hardware investments to software revenue. Tracks the full value chain from GPU CapEx to token consumption and ROIC for hyperscalers, foundation labs, and neoclouds."
        badge="2026 Edition"
      />

      {params.scenario !== 'base' && (
        <div className={`mb-4 px-4 py-2.5 rounded-lg border text-xs font-medium ${
          params.scenario === 'bull'
            ? 'bg-green-900/20 border-green-800/50 text-green-400'
            : 'bg-red-900/20 border-red-800/50 text-red-400'
        }`}>
          Showing {params.scenario === 'bull' ? 'Bull' : 'Bear'} scenario — projections adjusted
        </div>
      )}

      {/* Year selector */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {DISPLAY_YEARS.map(y => (
          <button
            key={y}
            onClick={() => setSelectedYear(y)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedYear === y
                ? 'bg-sa-accent text-white'
                : 'bg-sa-card border border-sa-border text-slate-400 hover:text-white'
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label={`Token Economy TAM ${selectedYear}`}
          value={tamTotal >= 1000 ? `$${(tamTotal / 1000).toFixed(2)}T` : `$${tamTotal.toFixed(1)}B`}
          change={fmtPct(tamTotal, tamPrevTotal)} changePositive
          subtext="Consumer + API + Software" accent icon="💰"
          onClick={() => navigate('addressable-market')}
        />
        <MetricCard
          label={`AI Revenue ${selectedYear}`}
          value={revTotal >= 1000 ? `$${(revTotal / 1000).toFixed(2)}T` : `$${revTotal.toFixed(0)}B`}
          change={fmtPct(revTotal, revPrevTotal)} changePositive
          subtext="Rental + Model + Software" icon="💎"
          onClick={() => navigate('revenue-profit')}
        />
        <MetricCard
          label={`Total AI CapEx ${selectedYear}`}
          value={`$${capex}B`}
          change={fmtPct(capex, capexPrev)} changePositive
          subtext="Big 5 hyperscalers" icon="🏗️"
          onClick={() => navigate('hardware-base')}
        />
        <MetricCard
          label={`GPU Installed Base ${selectedYear}`}
          value={fmtGPU(gpuBase)}
          change={fmtPct(gpuBase, gpuBasePrev)} changePositive
          subtext="B200-eq units (all players)" icon="⚡"
          onClick={() => navigate('hardware-base')}
        />
        <MetricCard
          label={`Hyperscaler ROIC ${selectedYear}`}
          value={`${roic?.hyperscalers ?? 0}%`}
          change={roic && roicData.find(d => d.year === prevYear) ? `${roic.hyperscalers - (roicData.find(d => d.year === prevYear)?.hyperscalers ?? 0) >= 0 ? '+' : ''}${roic.hyperscalers - (roicData.find(d => d.year === prevYear)?.hyperscalers ?? 0)}pp YoY` : ''}
          changePositive={roic ? roic.hyperscalers > (roicData.find(d => d.year === prevYear)?.hyperscalers ?? 0) : false}
          subtext="AI-dedicated compute" icon="📊"
          onClick={() => navigate('roic-calculator')}
        />
        <MetricCard
          label={`Foundation Lab ROIC ${selectedYear}`}
          value={`${roic?.foundationLabs ?? 0}%`}
          change={roic && roicData.find(d => d.year === prevYear) ? `${roic.foundationLabs - (roicData.find(d => d.year === prevYear)?.foundationLabs ?? 0) >= 0 ? '+' : ''}${roic.foundationLabs - (roicData.find(d => d.year === prevYear)?.foundationLabs ?? 0)}pp YoY` : ''}
          changePositive={roic ? roic.foundationLabs > (roicData.find(d => d.year === prevYear)?.foundationLabs ?? 0) : false}
          subtext="OpenAI, Anthropic, xAI" icon="🧠"
          onClick={() => navigate('roic-calculator')}
        />
        <MetricCard
          label={`Neocloud ROIC ${selectedYear}`}
          value={`${roic?.neoclouds ?? 0}%`}
          change={roic && roicData.find(d => d.year === prevYear) ? `${roic.neoclouds - (roicData.find(d => d.year === prevYear)?.neoclouds ?? 0) >= 0 ? '+' : ''}${roic.neoclouds - (roicData.find(d => d.year === prevYear)?.neoclouds ?? 0)}pp YoY` : ''}
          changePositive={roic ? roic.neoclouds > (roicData.find(d => d.year === prevYear)?.neoclouds ?? 0) : false}
          subtext="CoreWeave, Nebius, Crusoe" icon="☁️"
          onClick={() => navigate('roic-calculator')}
        />
        <MetricCard
          label="AI Revenue 2030E"
          value={fmtMoney(rev2030Total)}
          change={rev2025Total > 0 ? `+${rev2030Mult.toFixed(0)}× vs 2025E` : ''} changePositive
          subtext={rev2025Total > 0 ? `5-yr CAGR: ${rev2030Cagr.toFixed(0)}%` : ''} icon="🚀"
          onClick={() => navigate('revenue-profit')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-sa-card rounded-xl border border-sa-border p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Token Economy TAM ($B)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={tamData} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
              <defs>
                {[['Consumer Apps', '#f97316'], ['API Inference', '#3b82f6'], ['Token Software', '#10b981']].map(([name, color]) => (
                  <linearGradient key={name} id={`grad-${name}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
              <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}B`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Area type="monotone" dataKey="Consumer Apps" stackId="1" stroke="#f97316" fill="url(#grad-Consumer Apps)" strokeWidth={2} />
              <Area type="monotone" dataKey="API Inference" stackId="1" stroke="#3b82f6" fill="url(#grad-API Inference)" strokeWidth={2} />
              <Area type="monotone" dataKey="Token Software" stackId="1" stroke="#10b981" fill="url(#grad-Token Software)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-sa-card rounded-xl border border-sa-border p-4">
          <h3 className="text-sm font-semibold text-white mb-4">AI Revenue by Business Model ($B)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenueData} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
              <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}B`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Bar dataKey="rental" name="Compute Rental" stackId="a" fill="#3b82f6" radius={[0,0,0,0]} />
              <Bar dataKey="model" name="Model / API" stackId="a" fill="#8b5cf6" radius={[0,0,0,0]} />
              <Bar dataKey="software" name="Software / SaaS" stackId="a" fill="#f97316" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-sa-card rounded-xl border border-sa-border p-4">
        <h3 className="text-sm font-semibold text-white mb-4">ROIC by Entity Type (%)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={roicData} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
            <defs>
              {[['hyper', '#3b82f6'], ['found', '#f97316'], ['neo', '#10b981']].map(([id, color]) => (
                <linearGradient key={id} id={`roic-${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
            <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
            <Tooltip formatter={(v: number) => [`${v}%`]} contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            <Area type="monotone" dataKey="hyperscalers" name="Hyperscalers" stroke="#3b82f6" fill="url(#roic-hyper)" strokeWidth={2} />
            <Area type="monotone" dataKey="foundationLabs" name="Foundation Labs" stroke="#f97316" fill="url(#roic-found)" strokeWidth={2} />
            <Area type="monotone" dataKey="neoclouds" name="Neoclouds" stroke="#10b981" fill="url(#roic-neo)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-5 p-4 rounded-xl bg-sa-accent/5 border border-sa-accent/20">
        <p className="text-xs text-sa-muted leading-relaxed">
          <span className="text-sa-accent font-semibold">Model Methodology:</span> Token economy TAM measured as total AI inference revenue across consumer applications, API endpoints, and token-consuming software companies. GPU installed base normalized to B200-equivalent FP8 throughput (B200 = 1×, B300 = 1.5×, H100 = 0.31×). ROIC calculated as (Annual AI-related operating income) / (Cumulative AI CapEx deployed). Historical CapEx: SEC EDGAR 10-K filings (auto-refreshed daily). GPU counts: derived from CapEx ÷ blended ASP, anchored to NVIDIA revenue guidance and company disclosures. Forward estimates are model projections; each section labels sources as Actual, Derived, or Forecast.
        </p>
      </div>
    </div>
  );
}
