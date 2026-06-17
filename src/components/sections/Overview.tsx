'use client';

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import MetricCard from '../MetricCard';
import SectionHeader from '../SectionHeader';
import { tokenEconomyTAM, revenueByModel, roicByEntity } from '@/lib/data';

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

export default function Overview() {
  const tamTotal = tokenEconomyTAM.map(d => ({
    year: d.year,
    'Consumer Apps': d.consumerApps,
    'API Inference': d.apiInference,
    'Token Software': d.tokenSoftware,
    total: d.consumerApps + d.apiInference + d.tokenSoftware,
  }));

  const latest2025 = tamTotal.find(d => d.year === '2025E')!;
  const latest2027 = tamTotal.find(d => d.year === '2027E')!;
  const latest2028 = tamTotal.find(d => d.year === '2028E')!;

  return (
    <div>
      <SectionHeader
        title="AI Tokenomics — Overview Dashboard"
        subtitle="End-to-end analysis connecting AI hardware investments to software revenue. Tracks the full value chain from GPU CapEx to token consumption and ROIC for hyperscalers, foundation labs, and neoclouds."
        badge="2026 Edition"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Token Economy TAM 2025E"
          value="$35.5B"
          change="+196% YoY"
          changePositive
          subtext="Consumer + API + Software"
          accent
          icon="💰"
        />
        <MetricCard
          label="Token Economy TAM 2027E"
          value="$201B"
          change="+465% vs 2025E"
          changePositive
          subtext="3-year CAGR: 138%"
          icon="📈"
        />
        <MetricCard
          label="Total AI CapEx 2025E"
          value="$355B"
          change="+64% YoY"
          changePositive
          subtext="Big 5 hyperscalers + labs"
          icon="🏗️"
        />
        <MetricCard
          label="GPU Installed Base 2025E"
          value="~6.4M"
          change="+105% YoY"
          changePositive
          subtext="H100-eq units (all players)"
          icon="⚡"
        />
        <MetricCard
          label="Avg Hyperscaler ROIC 2025E"
          value="19%"
          change="+10pp vs 2024"
          changePositive
          subtext="vs. -12% for foundation labs"
          icon="📊"
        />
        <MetricCard
          label="Neocloud ROIC 2025E"
          value="26%"
          change="+4pp YoY"
          changePositive
          subtext="CoreWeave, Nebius, Crusoe"
          icon="☁️"
        />
        <MetricCard
          label="AI Revenue 2025E"
          value="$133B"
          change="+145% YoY"
          changePositive
          subtext="Rental + Model + Software"
          icon="💎"
        />
        <MetricCard
          label="AI Revenue 2028E"
          value="$1.1T"
          change="+725% vs 2025E"
          changePositive
          subtext="3-year CAGR: 101%"
          icon="🚀"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-sa-card rounded-xl border border-sa-border p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Token Economy TAM ($B)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={tamTotal} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
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
            <BarChart data={revenueByModel} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
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
          <AreaChart data={roicByEntity} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
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
          <span className="text-sa-accent font-semibold">Model Methodology:</span> Token economy TAM measured as total AI inference revenue across consumer applications, API endpoints, and token-consuming software companies. GPU installed base normalized to H100-equivalent FP8 throughput. ROIC calculated as (Annual AI-related operating income) / (Cumulative AI CapEx deployed). All figures are estimates based on public data, earnings disclosures, and SemiAnalysis proprietary research. Forecasts are not investment advice.
        </p>
      </div>
    </div>
  );
}
