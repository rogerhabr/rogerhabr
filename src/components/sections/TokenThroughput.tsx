'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, LineChart, Line,
} from 'recharts';
import SectionHeader from '../SectionHeader';
import MetricCard from '../MetricCard';
import DataTable from '../DataTable';
import { hardwareSpecs, modelSpecs, throughputMatrix, workloads, CHART_COLORS } from '@/lib/data';

const HARDWARE_KEYS = Object.keys(throughputMatrix);
const MODEL_KEYS = Object.keys(throughputMatrix[HARDWARE_KEYS[0]] || {});

export default function TokenThroughput() {
  const [selectedModel, setSelectedModel] = useState('Claude Sonnet 4');
  const [selectedHardware, setSelectedHardware] = useState('GB200 NVL72');

  // By hardware for selected model
  const hwChartData = HARDWARE_KEYS.map(hw => ({
    name: hw.replace(' SXM5', '').replace(' NVL72', '').replace(' Ironwood', ''),
    tokPerSec: throughputMatrix[hw][selectedModel] || 0,
    fullName: hw,
  })).sort((a, b) => b.tokPerSec - a.tokPerSec);

  // By model for selected hardware
  const modelChartData = MODEL_KEYS.map(model => ({
    name: model.replace('Claude ', 'C. ').replace('DeepSeek ', 'DS ').replace('Gemini ', 'Gem. '),
    tokPerSec: throughputMatrix[selectedHardware]?.[model] || 0,
    fullName: model,
  })).sort((a, b) => b.tokPerSec - a.tokPerSec);

  // Workload token consumption
  const workloadChartData = workloads.map(w => ({
    name: w.name.replace(' / ', '/'),
    '2025 Share (%)': w.adoptionShare2025,
    '2027 Share (%)': w.adoptionShare2027,
    tokensPerSession: w.avgInputTokens + w.avgOutputTokens,
    color: w.color,
  }));

  // Throughput matrix table
  const matrixTableData = HARDWARE_KEYS.map(hw => {
    const row: Record<string, unknown> = { Hardware: hw };
    MODEL_KEYS.forEach(m => {
      row[m] = throughputMatrix[hw][m];
    });
    return row;
  });

  // Hardware spec table
  const hwSpecData = hardwareSpecs.map(h => ({
    Chip: h.name,
    Vendor: h.vendor,
    'FP8 TFLOPS': h.fp8TFLOPS.toLocaleString(),
    'HBM (TB)': h.hbmTB.toFixed(3),
    'BW (TB/s)': h.hbmBWTBs.toFixed(2),
    'Power (W)': h.powerW.toLocaleString(),
    'B200 Equiv.': `${h.b200Equiv}x`,
    'Year': h.releaseYear,
  }));

  return (
    <div>
      <SectionHeader
        title="Token Throughput Forecast"
        subtitle="Bottoms-up token throughput analysis across hardware systems (GB200 NVL72, TPU v7, Trainium 3) and model architectures (GPT-5, Claude Sonnet, DeepSeek V3, Kimi K2). Measures actual inference capacity in tokens/second per chip."
        badge="Bottoms-Up"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="GB200 Peak Throughput" value="2,230 t/s" subtext="Claude Sonnet 4 per chip" accent icon="⚡" />
        <MetricCard label="MoE Advantage" value="~6x" subtext="DeepSeek V3 vs GPT-5 on same HW" icon="🔮" />
        <MetricCard label="TPU v7 vs H100" value="2.0x" subtext="Throughput per chip (MoE models)" icon="📊" />
        <MetricCard label="Total Tokens/Day 2025E" value="~850T" subtext="Global AI inference demand" icon="🌍" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <div className="bg-sa-card rounded-xl border border-sa-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Throughput by Hardware</h3>
            <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} className="text-xs">
              {MODEL_KEYS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={hwChartData} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip
                formatter={(v: number) => [`${v} tok/s`]}
                contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="tokPerSec" name="Tokens/sec" fill="#f97316" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-sa-card rounded-xl border border-sa-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Throughput by Model</h3>
            <select value={selectedHardware} onChange={e => setSelectedHardware(e.target.value)} className="text-xs">
              {HARDWARE_KEYS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={modelChartData} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip
                formatter={(v: number) => [`${v} tok/s`]}
                contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="tokPerSec" name="Tokens/sec" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Throughput Heatmap Table */}
      <div className="bg-sa-card rounded-xl border border-sa-border overflow-hidden mb-5">
        <div className="px-4 py-3 border-b border-sa-border">
          <h3 className="text-sm font-semibold text-white">Throughput Matrix — Tokens/sec per Chip (Inference, FP8, ~70B effective params)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-sa-border">
                <th className="px-4 py-3 text-left text-sa-muted font-semibold uppercase tracking-wider w-44">Hardware</th>
                {MODEL_KEYS.map(m => (
                  <th key={m} className="px-3 py-3 text-right text-sa-muted font-semibold uppercase tracking-wider whitespace-nowrap">
                    {m.replace('Claude ', 'C.').replace('DeepSeek ', 'DS ').replace('Gemini ', 'Gem.')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HARDWARE_KEYS.map((hw, i) => {
                const vals = MODEL_KEYS.map(m => throughputMatrix[hw][m] || 0);
                const max = Math.max(...Object.values(throughputMatrix).flatMap(r => Object.values(r)));
                return (
                  <tr key={hw} className="border-b border-sa-border/50 hover:bg-white/2">
                    <td className="px-4 py-2.5 text-slate-300 font-medium">{hw}</td>
                    {vals.map((v, j) => {
                      const intensity = v / max;
                      const bg = `rgba(249, 115, 22, ${intensity * 0.6})`;
                      return (
                        <td key={j} className="px-3 py-2.5 text-right number-cell font-medium" style={{ color: intensity > 0.5 ? '#fff' : '#94a3b8' }}>
                          <span className="inline-block px-2 py-0.5 rounded" style={{ background: bg }}>
                            {v.toLocaleString()}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Workload Mix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-sa-card rounded-xl border border-sa-border p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Workload Adoption Share (%)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={workloadChartData} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={{ background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Bar dataKey="2025 Share (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="2027 Share (%)" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-sa-card rounded-xl border border-sa-border overflow-hidden">
          <div className="px-4 py-3 border-b border-sa-border">
            <h3 className="text-sm font-semibold text-white">Workload Token Characteristics</h3>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-sa-border">
                <th className="px-4 py-2.5 text-left text-sa-muted font-semibold uppercase tracking-wider">Workload</th>
                <th className="px-3 py-2.5 text-right text-sa-muted font-semibold uppercase tracking-wider">Input</th>
                <th className="px-3 py-2.5 text-right text-sa-muted font-semibold uppercase tracking-wider">Output</th>
                <th className="px-3 py-2.5 text-right text-sa-muted font-semibold uppercase tracking-wider">Sessions/Day</th>
              </tr>
            </thead>
            <tbody>
              {workloads.map(w => (
                <tr key={w.name} className="border-b border-sa-border/50 hover:bg-white/2">
                  <td className="px-4 py-2.5 flex items-center gap-2">
                    <span>{w.icon}</span>
                    <span className="text-slate-300">{w.name}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right number-cell text-slate-400">{w.avgInputTokens.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right number-cell text-slate-400">{w.avgOutputTokens.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right number-cell text-sa-accent">{w.sessionsPerUserPerDay}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DataTable
        title="Hardware Specification Reference"
        columns={[
          { key: 'Chip', label: 'Chip', align: 'left' },
          { key: 'Vendor', label: 'Vendor', align: 'left' },
          { key: 'FP8 TFLOPS', label: 'FP8 TFLOPS', align: 'right', highlight: true },
          { key: 'HBM (TB)', label: 'HBM (TB)', align: 'right' },
          { key: 'BW (TB/s)', label: 'BW (TB/s)', align: 'right' },
          { key: 'Power (W)', label: 'Power (W)', align: 'right' },
          { key: 'B200 Equiv.', label: 'B200 Equiv.', align: 'right' },
          { key: 'Year', label: 'Year', align: 'right' },
        ]}
        data={hwSpecData}
        compact
      />
    </div>
  );
}
