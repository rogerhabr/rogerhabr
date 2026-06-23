'use client';

import { useState } from 'react';
import {
  AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, BarChart, Bar,
} from 'recharts';
import SectionHeader from '../SectionHeader';
import MetricCard from '../MetricCard';
import ParamControl from '../ParamControl';
import { tokenEconomyTAM, tokenApps } from '@/lib/data';
import { useGlobalParams } from '@/contexts/ParamsContext';

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: { cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number; name: string }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.08) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

type SegmentFilter = 'all' | 'consumer' | 'api' | 'software';

export default function AddressableMarket() {
  const { mult, params } = useGlobalParams();
  const [selectedYear, setSelectedYear] = useState('2025E');
  const [segmentFilter, setSegmentFilter] = useState<SegmentFilter>('all');

  const adjustedTAM = tokenEconomyTAM.map(d => {
    const isForecast = d.year.endsWith('E');
    const factor = (isForecast && params.scenario !== 'base') ? mult.tam : 1;
    return {
      year: d.year,
      consumerApps: +(d.consumerApps * factor).toFixed(1),
      apiInference: +(d.apiInference * factor).toFixed(1),
      tokenSoftware: +(d.tokenSoftware * factor).toFixed(1),
    };
  });

  const chartTAM = adjustedTAM.map(d => ({
    year: d.year,
    consumerApps: segmentFilter === 'all' || segmentFilter === 'consumer' ? d.consumerApps : 0,
    apiInference: segmentFilter === 'all' || segmentFilter === 'api' ? d.apiInference : 0,
    tokenSoftware: segmentFilter === 'all' || segmentFilter === 'software' ? d.tokenSoftware : 0,
  }));

  const yearData = adjustedTAM.find(d => d.year === selectedYear) ?? adjustedTAM[adjustedTAM.length - 1];
  const total = yearData.consumerApps + yearData.apiInference + yearData.tokenSoftware;

  const pieData = [
    { name: 'Consumer Apps', value: yearData.consumerApps, color: '#f97316' },
    { name: 'API Inference', value: yearData.apiInference, color: '#3b82f6' },
    { name: 'Token Software', value: yearData.tokenSoftware, color: '#10b981' },
  ].filter(p => segmentFilter === 'all'
    || (segmentFilter === 'consumer' && p.name === 'Consumer Apps')
    || (segmentFilter === 'api' && p.name === 'API Inference')
    || (segmentFilter === 'software' && p.name === 'Token Software')
  );

  const appData = tokenApps.map(a => ({
    name: a.name,
    provider: a.provider,
    type: a.type,
    'MAU 2024 (M)': a.mau2024M,
    'MAU 2025 (M)': a.mau2025M,
    'Tokens/User/Day': a.tokensPerUserPerDay.toLocaleString(),
    'Revenue 2025 ($B)': a.revenueRunRate2025B.toFixed(1),
    pricing: a.pricingModel,
    color: a.color,
  }));

  const mauGrowth = tokenApps.slice(0, 8).map(a => ({
    name: a.name.replace(' AI', '').replace(' Overviews', ''),
    '2024': a.mau2024M,
    '2025': a.mau2025M,
    color: a.color,
  }));

  const TYPE_LABELS: Record<string, string> = { consumer: 'Consumer', api: 'API', software: 'Software' };
  const TYPE_COLORS: Record<string, string> = { consumer: '#f97316', api: '#3b82f6', software: '#10b981' };

  const latest2024 = adjustedTAM.find(d => d.year === '2024')!;
  const latest2025 = adjustedTAM.find(d => d.year === '2025E')!;
  const latest2027 = adjustedTAM.find(d => d.year === '2027E')!;
  const latest2028 = adjustedTAM.find(d => d.year === '2028E')!;

  const total2024 = latest2024.consumerApps + latest2024.apiInference + latest2024.tokenSoftware;
  const total2025 = latest2025.consumerApps + latest2025.apiInference + latest2025.tokenSoftware;
  const total2027 = latest2027.consumerApps + latest2027.apiInference + latest2027.tokenSoftware;
  const total2028 = latest2028.consumerApps + latest2028.apiInference + latest2028.tokenSoftware;

  return (
    <div>
      <SectionHeader
        title="Addressable Market — Token Economy"
        subtitle="Total addressable market for AI token consumption across consumer applications (ChatGPT, Grok, Meta AI), API inference endpoints (Claude, Gemini, DeepSeek), and token-consuming software companies (Cursor, Windsurf, Harvey, Perplexity)."
        badge="TAM Analysis"
        sources={[
          { type: 'estimate', label: 'Modeled TAM' },
          { type: 'actual',   label: 'Anchors: OpenAI MAU, API pricing', url: 'https://openai.com/index/chatgpt-usage-march-2025/' },
        ]}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Token Economy TAM 2025" value={`$${total2025.toFixed(1)}B`}
          change={`+${((total2025 / total2024 - 1) * 100).toFixed(0)}% YoY`}
          changePositive accent icon="💰"
          onClick={() => setSelectedYear('2025')}
        />
        <MetricCard
          label="Token Economy TAM 2027E" value={`$${total2027.toFixed(0)}B`}
          change={`+${((total2027 / total2025 - 1) * 100).toFixed(0)}% vs 2025`}
          subtext={`2-yr CAGR: ${((Math.sqrt(total2027 / total2025) - 1) * 100).toFixed(0)}%/yr`}
          changePositive icon="📈"
          onClick={() => setSelectedYear('2027E')}
        />
        <MetricCard
          label="Token Economy TAM 2028E" value={`$${total2028.toFixed(0)}B`}
          change={`+${((total2028 / total2027 - 1) * 100).toFixed(0)}% vs 2027E`}
          changePositive icon="🚀"
          onClick={() => setSelectedYear('2028E')}
        />
        <MetricCard
          label="Largest Segment 2025" value="Consumer"
          subtext={`$${latest2025.consumerApps.toFixed(1)}B (${Math.round(latest2025.consumerApps / total2025 * 100)}% share)`}
          icon="👤"
          onClick={() => setSelectedYear('2025')}
        />
      </div>

      <div className="flex items-center gap-4 mb-4">
        <ParamControl
          label="Segment Filter"
          value={segmentFilter}
          options={[
            { value: 'all', label: 'All' },
            { value: 'consumer', label: 'Consumer Apps' },
            { value: 'api', label: 'API Inference' },
            { value: 'software', label: 'Token Software' },
          ]}
          onChange={v => setSegmentFilter(v as SegmentFilter)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-sa-card rounded-xl border border-sa-border p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Token Economy Growth ($B)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartTAM} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
              <defs>
                {[['cons', '#f97316'], ['api', '#3b82f6'], ['soft', '#10b981']].map(([id, c]) => (
                  <linearGradient key={id} id={`am-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={c} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={c} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
              <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}B`} />
              <Tooltip
                formatter={(v: number, name: string) => [`$${v.toFixed(1)}B`, name]}
                contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Area type="monotone" dataKey="consumerApps" name="Consumer Apps" stackId="1" stroke="#f97316" fill="url(#am-cons)" strokeWidth={2} />
              <Area type="monotone" dataKey="apiInference" name="API Inference" stackId="1" stroke="#3b82f6" fill="url(#am-api)" strokeWidth={2} />
              <Area type="monotone" dataKey="tokenSoftware" name="Token Software" stackId="1" stroke="#10b981" fill="url(#am-soft)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-sa-card rounded-xl border border-sa-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Market Share by Segment</h3>
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="text-xs">
              {adjustedTAM.map(d => <option key={d.year} value={d.year}>{d.year}</option>)}
            </select>
          </div>
          <div className="flex items-center">
            <ResponsiveContainer width="60%" height={200}>
              <PieChart>
                <Pie
                  data={pieData} cx="50%" cy="50%"
                  innerRadius={50} outerRadius={90}
                  labelLine={false} label={renderCustomLabel}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} strokeWidth={2} stroke="#141b2d" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => [`$${v.toFixed(1)}B`]}
                  contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-3 flex-1">
              {pieData.map(p => (
                <div key={p.name}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.color }} />
                    <span className="text-xs text-slate-400">{p.name}</span>
                  </div>
                  <p className="text-lg font-bold number-cell pl-5" style={{ color: p.color }}>${p.value.toFixed(1)}B</p>
                  <p className="text-xs text-sa-muted pl-5">{total > 0 ? ((p.value / total) * 100).toFixed(0) : 0}% of TAM</p>
                </div>
              ))}
              <div className="border-t border-sa-border pt-2 pl-5">
                <p className="text-xs text-sa-muted">Total TAM</p>
                <p className="text-xl font-bold text-white number-cell">${total.toFixed(1)}B</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAU Growth */}
      <div className="bg-sa-card rounded-xl border border-sa-border p-4 mb-5">
        <h3 className="text-sm font-semibold text-white mb-4">Monthly Active Users by App (Millions)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={mauGrowth} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}M`} />
            <Tooltip
              formatter={(v: number, name: string) => [`${v}M users`, name]}
              contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            <Bar dataKey="2024" name="MAU 2024" fill="#1e40af" radius={[4, 4, 0, 0]} />
            <Bar dataKey="2025" name="MAU 2025" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* App details table */}
      <div className="bg-sa-card rounded-xl border border-sa-border overflow-hidden">
        <div className="px-4 py-3 border-b border-sa-border">
          <h3 className="text-sm font-semibold text-white">Token Application Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-sa-border">
                {['Application', 'Provider', 'Type', 'MAU 2024', 'MAU 2025', 'Tokens/User/Day', 'Revenue 2025', 'Pricing'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-sa-muted font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appData.map(app => (
                <tr key={app.name} className="border-b border-sa-border/50 hover:bg-white/2">
                  <td className="px-3 py-2.5 font-semibold" style={{ color: app.color }}>{app.name}</td>
                  <td className="px-3 py-2.5 text-slate-400">{app.provider}</td>
                  <td className="px-3 py-2.5">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: TYPE_COLORS[app.type] + '22', color: TYPE_COLORS[app.type] }}>
                      {TYPE_LABELS[app.type]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-300 number-cell">{app['MAU 2024 (M)']}M</td>
                  <td className="px-3 py-2.5 text-sa-green number-cell font-bold">{app['MAU 2025 (M)']}M</td>
                  <td className="px-3 py-2.5 text-slate-300 number-cell">{app['Tokens/User/Day']}</td>
                  <td className="px-3 py-2.5 number-cell">
                    {parseFloat(app['Revenue 2025 ($B)']) > 0
                      ? <span className="text-sa-accent font-bold">${app['Revenue 2025 ($B)']}B</span>
                      : <span className="text-sa-muted">—</span>
                    }
                  </td>
                  <td className="px-3 py-2.5 text-slate-400">{app.pricing}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
