'use client';

import { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import SectionHeader from '../SectionHeader';
import { hardwareDefaults, calcRefreshCycle, defaultRefreshInputs, type RefreshInputs } from '@/lib/data';

const HW_OPTIONS = Object.keys(hardwareDefaults);
const COLORS = { noRefresh: '#64748b', retire: '#f97316', resale: '#10b981' };

const RESALE_VALS  = [0, 10, 20, 30, 40];
const DECAY_VALS   = [0, 10, 20, 30];

function Slider({ label, value, min, max, step, onChange, format }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; format: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xs font-bold text-white number-cell">{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))} className="w-full" />
    </div>
  );
}

function ScenarioCard({ label, fcf, capex, revenue, accentClass }: {
  label: string; fcf: number; capex: number; revenue: number; accentClass: string;
}) {
  return (
    <div className={`bg-sa-card rounded-xl border p-4 ${accentClass}`}>
      <p className="text-xs text-sa-muted mb-1">{label}</p>
      <p className={`text-2xl font-black number-cell ${fcf >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {fcf >= 0 ? '+' : ''}${(fcf / 1e6).toFixed(0)}M
      </p>
      <div className="flex gap-3 mt-1.5 text-xs text-sa-muted">
        <span>CapEx <span className="text-white">${(capex / 1e6).toFixed(0)}M</span></span>
        <span>Rev <span className="text-white">${(revenue / 1e6).toFixed(0)}M</span></span>
      </div>
    </div>
  );
}

export default function HardwareRefreshSensitivity() {
  const [inp, setInp] = useState<RefreshInputs>(defaultRefreshInputs);
  const set = (k: keyof RefreshInputs) => (v: number | string) => setInp(p => ({ ...p, [k]: v }));

  // analysis period always covers exactly 2 refresh cycles
  const effectiveInputs = useMemo(() => ({
    ...inp,
    analysisPeriodYears: inp.refreshCycleYears * 2,
  }), [inp]);

  const { noRefresh, refreshRetire, refreshResale } = useMemo(
    () => calcRefreshCycle(effectiveInputs),
    [effectiveInputs],
  );

  const capexG0 = (hardwareDefaults[inp.gen0Hardware]?.costPerGPU ?? 0) * inp.numGPUs;
  const capexG1 = (hardwareDefaults[inp.gen1Hardware]?.costPerGPU ?? 0) * inp.numGPUs;
  const thrG0   = hardwareDefaults[inp.gen0Hardware]?.tokensPerGPUPerSec ?? 0;
  const thrG1   = hardwareDefaults[inp.gen1Hardware]?.tokensPerGPUPerSec ?? 0;
  const uplift  = thrG0 > 0 ? (thrG1 / thrG0).toFixed(1) : '—';

  // Cumulative FCF chart (year 0 to N)
  const cumFCFChart = noRefresh.years.map((_, i) => ({
    year: `Y${i}`,
    'No Refresh':       parseFloat((noRefresh.years[i].cumFCF     / 1e6).toFixed(1)),
    'Refresh + Retire': parseFloat((refreshRetire.years[i].cumFCF / 1e6).toFixed(1)),
    'Refresh + Resale': parseFloat((refreshResale.years[i].cumFCF / 1e6).toFixed(1)),
  }));

  // Annual FCF (years 1..N, skip Y0 which is pure capex)
  const annualFCFChart = noRefresh.years.slice(1).map((_, i) => ({
    year: `Y${i + 1}`,
    'No Refresh':       parseFloat((noRefresh.years[i + 1].fcf     / 1e6).toFixed(1)),
    'Refresh + Retire': parseFloat((refreshRetire.years[i + 1].fcf / 1e6).toFixed(1)),
    'Refresh + Resale': parseFloat((refreshResale.years[i + 1].fcf / 1e6).toFixed(1)),
  }));

  // Revenue comparison chart
  const revenueChart = noRefresh.years.slice(1).map((_, i) => ({
    year: `Y${i + 1}`,
    'No Refresh':       parseFloat((noRefresh.years[i + 1].revenue     / 1e6).toFixed(1)),
    'Refresh + Retire': parseFloat((refreshRetire.years[i + 1].revenue / 1e6).toFixed(1)),
    'Refresh + Resale': parseFloat((refreshResale.years[i + 1].revenue / 1e6).toFixed(1)),
  }));

  // Sensitivity grid: resale% × token decay → FCF advantage of Refresh+Resale vs No Refresh
  const sensitivityGrid = useMemo(() => RESALE_VALS.map(rPct => ({
    resalePct: rPct,
    cells: DECAY_VALS.map(dPct => {
      const r = calcRefreshCycle({ ...effectiveInputs, resalePct: rPct, tokenPriceDecayPctPerYr: dPct });
      return { decayPct: dPct, adv: (r.refreshResale.totalFCF - r.noRefresh.totalFCF) / 1e6 };
    }),
  })), [effectiveInputs]);

  const fcfAdv = refreshResale.totalFCF - noRefresh.totalFCF;
  const N = effectiveInputs.analysisPeriodYears;

  const tableRows: Array<{ label: string; vals: number[]; positive?: boolean }> = [
    { label: 'Gen 0 CapEx',         vals: [noRefresh.totalCapex,    refreshRetire.totalCapex,    refreshResale.totalCapex]    },
    { label: 'Gen 1 CapEx',         vals: [0,                        capexG1,                     capexG1]                     },
    { label: 'Resale Proceeds',     vals: [0,                        0,                           refreshResale.totalSaleProceeds], positive: true },
    { label: 'Net CapEx',           vals: [noRefresh.netCapex,       refreshRetire.netCapex,      refreshResale.netCapex]      },
    { label: `Total Revenue (${N}Y)`, vals: [noRefresh.totalRevenue, refreshRetire.totalRevenue,  refreshResale.totalRevenue],   positive: true },
    { label: `Total OpEx (${N}Y)`,  vals: [noRefresh.totalOpex,      refreshRetire.totalOpex,     refreshResale.totalOpex]     },
    { label: `Net FCF (${N}Y)`,     vals: [noRefresh.totalFCF,       refreshRetire.totalFCF,      refreshResale.totalFCF],      positive: true },
  ];

  const tooltipStyle = { background: '#141b2d', border: '1px solid #1e2a42', borderRadius: 8, fontSize: 12 };

  return (
    <div>
      <SectionHeader
        title="Hardware Refresh & CapEx Sensitivity"
        subtitle={`3-year GPU refresh cycle: compare keeping existing hardware vs. upgrading to frontier GPUs every ${inp.refreshCycleYears} years. Models re-investment CapEx, old fleet retirement or resale, throughput uplift, and token price compression. ${N}-year FCF sensitivity across scenarios.`}
        badge="Sensitivity"
        sources={[
          { type: 'derived',   label: 'Derived from ROIC model & hardware defaults' },
          { type: 'estimate',  label: 'Token price decay: modeled assumption' },
          { type: 'forecast',  label: `${N}-year projection (2026E–${2026 + N}E)` },
        ]}
      />

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <ScenarioCard label={`No Refresh — ${N}Y FCF`}
          fcf={noRefresh.totalFCF} capex={noRefresh.netCapex} revenue={noRefresh.totalRevenue}
          accentClass="border-sa-border" />
        <ScenarioCard label={`Refresh + Retire — ${N}Y FCF`}
          fcf={refreshRetire.totalFCF} capex={refreshRetire.netCapex} revenue={refreshRetire.totalRevenue}
          accentClass="border-orange-800/40" />
        <ScenarioCard label={`Refresh + Resale — ${N}Y FCF`}
          fcf={refreshResale.totalFCF} capex={refreshResale.netCapex} revenue={refreshResale.totalRevenue}
          accentClass="border-green-800/40" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Inputs */}
        <div className="bg-sa-card rounded-xl border border-sa-border p-4 space-y-4">
          <h3 className="text-sm font-semibold text-white">Refresh Assumptions</h3>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Gen 0 — Current hardware</label>
            <select value={inp.gen0Hardware} onChange={e => set('gen0Hardware')(e.target.value)} className="w-full text-xs">
              {HW_OPTIONS.map(h => <option key={h}>{h}</option>)}
            </select>
            <p className="text-xs text-sa-muted mt-0.5">
              ${((hardwareDefaults[inp.gen0Hardware]?.costPerGPU ?? 0) / 1e3).toFixed(0)}k/GPU · {thrG0} tok/s
            </p>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Gen 1 — Next-gen replacement</label>
            <select value={inp.gen1Hardware} onChange={e => set('gen1Hardware')(e.target.value)} className="w-full text-xs">
              {HW_OPTIONS.map(h => <option key={h}>{h}</option>)}
            </select>
            <p className="text-xs text-sa-muted mt-0.5">
              ${((hardwareDefaults[inp.gen1Hardware]?.costPerGPU ?? 0) / 1e3).toFixed(0)}k/GPU · {thrG1} tok/s · <span className="text-orange-400 font-semibold">{uplift}× throughput uplift</span>
            </p>
          </div>

          <Slider label="Cluster Size (GPUs)" value={inp.numGPUs} min={64} max={4096} step={64}
            onChange={set('numGPUs')} format={v => `${v}`} />
          <Slider label="GPU Utilization" value={inp.utilizationPct} min={40} max={100} step={1}
            onChange={set('utilizationPct')} format={v => `${v}%`} />
          <Slider label="Revenue / 1M Tokens (Y0)" value={inp.revenuePerMTokensY0} min={0.25} max={5} step={0.05}
            onChange={set('revenuePerMTokensY0')} format={v => `$${v.toFixed(2)}`} />
          <Slider label="Token Price Decay (%/yr)" value={inp.tokenPriceDecayPctPerYr} min={0} max={50} step={1}
            onChange={set('tokenPriceDecayPctPerYr')} format={v => `${v}%`} />
          <Slider label="Old GPU Resale Value (%)" value={inp.resalePct} min={0} max={50} step={5}
            onChange={set('resalePct')} format={v => `${v}%`} />
          <Slider label="Refresh Cycle (years)" value={inp.refreshCycleYears} min={2} max={5} step={1}
            onChange={set('refreshCycleYears')} format={v => `${v}yr`} />
          <Slider label="Power Cost ($/kWh)" value={inp.powerCostPerKWh} min={0.02} max={0.12} step={0.005}
            onChange={set('powerCostPerKWh')} format={v => `$${v.toFixed(3)}`} />
          <Slider label="Other OpEx (% of CapEx/yr)" value={inp.opexPctCapex} min={5} max={25} step={1}
            onChange={set('opexPctCapex')} format={v => `${v}%`} />

          <div className="pt-3 border-t border-sa-border text-xs space-y-1.5">
            <div className="flex justify-between"><span className="text-sa-muted">Gen 0 CapEx</span><span className="text-white font-semibold">${(capexG0 / 1e6).toFixed(1)}M</span></div>
            <div className="flex justify-between"><span className="text-sa-muted">Gen 1 CapEx</span><span className="text-white font-semibold">${(capexG1 / 1e6).toFixed(1)}M</span></div>
            <div className="flex justify-between"><span className="text-sa-muted">Resale Proceeds</span><span className="text-green-400 font-semibold">+${(capexG0 * inp.resalePct / 100 / 1e6).toFixed(1)}M</span></div>
            <div className="flex justify-between"><span className="text-sa-muted">Net Refresh Cost</span><span className="text-orange-400 font-semibold">${((capexG1 - capexG0 * inp.resalePct / 100) / 1e6).toFixed(1)}M</span></div>
            <div className="flex justify-between pt-1 border-t border-sa-border/50"><span className="text-sa-muted">Refresh+Resale vs No Refresh</span><span className={`font-bold ${fcfAdv >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fcfAdv >= 0 ? '+' : ''}${(fcfAdv / 1e6).toFixed(0)}M FCF</span></div>
          </div>
        </div>

        {/* Charts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-sa-card rounded-xl border border-sa-border p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Cumulative Free Cashflow — {N} Years ($M)</h3>
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={cumFCFChart} margin={{ right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
                <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}M`} />
                <Tooltip formatter={(v: number) => [`$${v.toFixed(0)}M`]} contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 2" />
                <Line type="monotone" dataKey="No Refresh"       stroke={COLORS.noRefresh} strokeWidth={2}   dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Refresh + Retire" stroke={COLORS.retire}    strokeWidth={2}   dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Refresh + Resale" stroke={COLORS.resale}    strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-sa-card rounded-xl border border-sa-border p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Annual FCF by Year ($M)</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={annualFCFChart} margin={{ right: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
                  <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}M`} />
                  <Tooltip formatter={(v: number) => [`$${v.toFixed(1)}M`]} contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
                  <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 2" />
                  <Bar dataKey="No Refresh"       fill={COLORS.noRefresh} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Refresh + Retire" fill={COLORS.retire}    radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Refresh + Resale" fill={COLORS.resale}    radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-sa-card rounded-xl border border-sa-border p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Annual Revenue by Year ($M)</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={revenueChart} margin={{ right: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" />
                  <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}M`} />
                  <Tooltip formatter={(v: number) => [`$${v.toFixed(1)}M`]} contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
                  <Bar dataKey="No Refresh"       fill={COLORS.noRefresh} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Refresh + Retire" fill={COLORS.retire}    radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Refresh + Resale" fill={COLORS.resale}    radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Scenario comparison table */}
      <div className="bg-sa-card rounded-xl border border-sa-border overflow-hidden mb-5">
        <div className="px-4 py-3 border-b border-sa-border">
          <h3 className="text-sm font-semibold text-white">{N}-Year Scenario Comparison ({inp.numGPUs} GPUs)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-sa-border">
                <th className="px-4 py-2.5 text-left text-sa-muted font-semibold uppercase tracking-wider">Metric</th>
                <th className="px-4 py-2.5 text-right text-slate-400 font-semibold uppercase tracking-wider">No Refresh</th>
                <th className="px-4 py-2.5 text-right text-orange-400 font-semibold uppercase tracking-wider">Refresh + Retire</th>
                <th className="px-4 py-2.5 text-right text-green-400 font-semibold uppercase tracking-wider">Refresh + Resale</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map(({ label, vals, positive }) => {
                const isFCF = label.startsWith('Net FCF');
                return (
                  <tr key={label} className={`border-b border-sa-border/50 hover:bg-white/2 ${isFCF ? 'bg-white/3' : ''}`}>
                    <td className="px-4 py-2.5 text-slate-300 font-medium">{label}</td>
                    {vals.map((v, i) => {
                      const sign = positive ? '+' : v === 0 ? '' : '-';
                      const color = isFCF ? (v >= 0 ? 'text-green-400' : 'text-red-400')
                        : positive ? 'text-green-300' : 'text-slate-300';
                      return (
                        <td key={i} className={`px-4 py-2.5 text-right number-cell font-${isFCF ? 'bold' : 'medium'} ${color}`}>
                          {v === 0 ? '—' : `${isFCF && v > 0 ? '+' : ''}${positive && v > 0 ? '+' : ''}$${Math.abs(v / 1e6).toFixed(0)}M`}
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

      {/* Sensitivity heatmap */}
      <div className="bg-sa-card rounded-xl border border-sa-border p-4">
        <h3 className="text-sm font-semibold text-white mb-1">
          Sensitivity: Refresh + Resale vs No Refresh — {N}Y FCF Delta ($M)
        </h3>
        <p className="text-xs text-sa-muted mb-3">
          Green = refresh+resale wins; red = keep existing hardware wins. Rows = old GPU resale %, columns = annual token price compression.
          Throughput uplift from {inp.gen0Hardware} → {inp.gen1Hardware}: <span className="text-orange-400 font-semibold">{uplift}×</span>.
        </p>
        <div className="overflow-x-auto">
          <table className="text-xs w-full">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-sa-muted font-semibold">Resale % \ Decay /yr</th>
                {DECAY_VALS.map(d => (
                  <th key={d} className="px-3 py-2 text-center text-sa-muted font-semibold">{d}%/yr</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sensitivityGrid.map(row => (
                <tr key={row.resalePct} className="border-t border-sa-border/30">
                  <td className="px-3 py-2 text-slate-400 font-semibold whitespace-nowrap">{row.resalePct}% resale</td>
                  {row.cells.map(cell => {
                    const v = cell.adv;
                    const intensity = Math.min(Math.abs(v) / 150, 1);
                    const bg = v > 0
                      ? `rgba(16,185,129,${0.1 + intensity * 0.4})`
                      : `rgba(239,68,68,${0.1 + intensity * 0.4})`;
                    const nearest = Math.abs(row.resalePct - inp.resalePct) < 5.1 && Math.abs(cell.decayPct - inp.tokenPriceDecayPctPerYr) < 5.1;
                    return (
                      <td key={cell.decayPct}
                        className="px-3 py-2.5 text-center font-bold number-cell rounded"
                        style={{ background: bg, color: v > 0 ? '#10b981' : '#ef4444', outline: nearest ? '2px solid #f97316' : 'none' }}>
                        {v > 0 ? '+' : ''}{v.toFixed(0)}M
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-sa-muted mt-2">
          Current inputs highlighted in orange. Break-even: refresh pays off when resale proceeds + revenue uplift exceed the net CapEx reinvestment.
          At {inp.tokenPriceDecayPctPerYr}% annual price compression, {uplift}× throughput uplift {fcfAdv >= 0 ? 'still generates' : 'does not recover'} the incremental CapEx within {N} years.
        </p>
      </div>
    </div>
  );
}
