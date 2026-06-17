'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, LineChart, Line, ComposedChart, Area,
} from 'recharts';
import SectionHeader from '../SectionHeader';
import MetricCard from '../MetricCard';
import DataTable from '../DataTable';
import { revenueByModel, marginsByModel, roicByEntity } from '@/lib/data';

// Combine revenue and margin data
const combinedData = revenueByModel.map((r, i) => {
  const m = marginsByModel[i];
  return {
    year: r.year,
    rental: r.rental,
    model: r.model,
    software: r.software,
    total: r.rental + r.model + r.software,
    rentalMargin: m.rental,
    modelMargin: m.model,
    softwareMargin: m.software,
    blendedMargin: (r.rental * m.rental + r.model * Math.max(m.model, 0) + r.software * m.software) /
      (r.rental + r.model + r.software),
  };
});

export default function RevenueProfit() {
  const r2024 = combinedData.find(d => d.year === '2024')!;
  const r2025 = combinedData.find(d => d.year === '2025E')!;
  const r2027 = combinedData.find(d => d.year === '2027E')!;
  const r2028 = combinedData.find(d => d.year === '2028E')!;

  const tableData = combinedData.map(d => ({
    Year: d.year,
    'Rental ($B)': `$${d.rental}B`,
    'Model ($B)': `$${d.model}B`,
    'Software ($B)': `$${d.software}B`,
    'Total ($B)': `$${d.total}B`,
    'Rental Margin': `${d.rentalMargin}%`,
    'Model Margin': `${d.modelMargin}%`,
    'Sw. Margin': `${d.softwareMargin}%`,
  }));

  return (
    <div>
      <SectionHeader
        title="AI Revenue & Profit Forecast"
        subtitle="Three-layer revenue model for the AI value chain: compute rental (hyperscalers/neoclouds), model API revenue (foundation labs), and AI software/SaaS revenue (token consumers). Tracks operating margins by segment as the industry matures."
        badge="P&L Model"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Total AI Revenue 2025E" value="$133B" change="+145% YoY" changePositive subtext="All 3 business models" accent icon="💰" />
        <MetricCard label="Total AI Revenue 2027E" value="$600B" change="+351% vs 2025E" changePositive subtext="CAGR 2024-27: 90%" icon="📈" />
        <MetricCard label="Blended Margin 2025E" value="~28%" change="+8pp vs 2024" changePositive subtext="Model biz still negative" icon="📊" />
        <MetricCard label="Software Margin 2027E" value="52%" change="Best-in-class SaaS-like" changePositive subtext="Token software at scale" icon="💎" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-sa-card rounded-xl border border-sa-border p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Revenue by Business Model ($B)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={combinedData} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
              <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}B`} />
              <Tooltip
                formatter={(v: number, name: string) => [`$${v}B`, name]}
                contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Bar dataKey="rental" name="Compute Rental" stackId="a" fill="#3b82f6" />
              <Bar dataKey="model" name="Model / API" stackId="a" fill="#8b5cf6" />
              <Bar dataKey="software" name="Software / SaaS" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-sa-card rounded-xl border border-sa-border p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Operating Margins by Segment (%)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={combinedData} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
              <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v: number, name: string) => [`${v}%`, name]} contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Line type="monotone" dataKey="rentalMargin" name="Rental Margin" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="modelMargin" name="Model API Margin" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
              <Line type="monotone" dataKey="softwareMargin" name="Software Margin" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="blendedMargin" name="Blended" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} strokeDasharray="6 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue composition shift */}
      <div className="bg-sa-card rounded-xl border border-sa-border p-4 mb-5">
        <h3 className="text-sm font-semibold text-white mb-2">Revenue Mix Shift: Compute → Model → Software</h3>
        <p className="text-xs text-sa-muted mb-4">
          The AI value chain shifts from compute-intensive (rental revenue dominates early) to software-driven (SaaS/token software compresses margins long-term). Model revenue inflects positive EBIT in 2026E as scale offsets training cost amortization.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { year: '2024', rental: Math.round((r2024.rental / r2024.total) * 100), model: Math.round((r2024.model / r2024.total) * 100), software: Math.round((r2024.software / r2024.total) * 100), total: r2024.total },
            { year: '2025E', rental: Math.round((r2025.rental / r2025.total) * 100), model: Math.round((r2025.model / r2025.total) * 100), software: Math.round((r2025.software / r2025.total) * 100), total: r2025.total },
            { year: '2027E', rental: Math.round((r2027.rental / r2027.total) * 100), model: Math.round((r2027.model / r2027.total) * 100), software: Math.round((r2027.software / r2027.total) * 100), total: r2027.total },
          ].map(d => (
            <div key={d.year} className="p-3 rounded-lg bg-sa-surface border border-sa-border">
              <p className="text-xs font-semibold text-white mb-3">{d.year}</p>
              <p className="text-xs text-sa-muted mb-1">Total: <span className="text-sa-accent font-bold">${d.total}B</span></p>
              <div className="w-full rounded-full overflow-hidden h-3 flex mb-3">
                <div className="bg-blue-600" style={{ width: `${d.rental}%` }} title={`Rental ${d.rental}%`} />
                <div className="bg-purple-500" style={{ width: `${d.model}%` }} title={`Model ${d.model}%`} />
                <div className="bg-orange-500" style={{ width: `${d.software}%` }} title={`Software ${d.software}%`} />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs"><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600" />Rental</span><span className="text-slate-300 number-cell">{d.rental}%</span></div>
                <div className="flex justify-between text-xs"><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" />Model</span><span className="text-slate-300 number-cell">{d.model}%</span></div>
                <div className="flex justify-between text-xs"><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" />Software</span><span className="text-slate-300 number-cell">{d.software}%</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <DataTable
        title="Revenue & Margin Detailed Data"
        columns={[
          { key: 'Year', label: 'Year', align: 'left' },
          { key: 'Rental ($B)', label: 'Rental ($B)', align: 'right' },
          { key: 'Model ($B)', label: 'Model ($B)', align: 'right' },
          { key: 'Software ($B)', label: 'Software ($B)', align: 'right' },
          { key: 'Total ($B)', label: 'Total ($B)', align: 'right', highlight: true },
          { key: 'Rental Margin', label: 'Rental Margin', align: 'right' },
          { key: 'Model Margin', label: 'Model Margin', align: 'right', format: (v) => {
            const n = parseInt(String(v));
            return <span className={n < 0 ? 'text-sa-red' : 'text-sa-green'}>{String(v)}</span>;
          }},
          { key: 'Sw. Margin', label: 'Sw. Margin', align: 'right' },
        ]}
        data={tableData}
        compact
      />

      <div className="mt-4 p-4 rounded-xl bg-sa-surface border border-sa-border">
        <p className="text-xs text-sa-muted leading-relaxed">
          <span className="text-white font-semibold">Revenue definitions:</span> Rental revenue = GPU/compute cloud revenue from hyperscalers (Azure AI, GCP, AWS Bedrock) and neoclouds. Model/API revenue = inference API revenue charged per token by foundation labs (OpenAI, Anthropic, Google, DeepSeek). Software revenue = subscription + usage-based revenue from token-consuming applications (Cursor, Harvey, Perplexity, enterprise AI tools). Margins exclude CapEx amortization for rental; include training CapEx amortization for model revenue. All figures SemiAnalysis estimates; subject to revision.
        </p>
      </div>
    </div>
  );
}
