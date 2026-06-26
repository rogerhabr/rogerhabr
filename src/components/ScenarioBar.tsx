'use client';

import { useGlobalParams } from '@/contexts/ParamsContext';
import { useLiveData, StalenessSeverity } from '@/hooks/useLiveData';
import { Scenario } from '@/lib/params';

const SCENARIO_STYLES: Record<Scenario, { active: string; inactive: string; label: string }> = {
  bear: {
    active: 'bg-red-900/30 text-red-400 border-red-800',
    inactive: 'bg-transparent text-red-400/60 border-red-800/40 hover:border-red-800',
    label: 'Bear',
  },
  base: {
    active: 'bg-sa-card text-slate-300 border-sa-border',
    inactive: 'bg-transparent text-slate-500 border-sa-border/40 hover:border-sa-border',
    label: 'Base',
  },
  bull: {
    active: 'bg-green-900/30 text-green-400 border-green-800',
    inactive: 'bg-transparent text-green-400/60 border-green-800/40 hover:border-green-800',
    label: 'Bull',
  },
};

const SEVERITY_COLORS: Record<StalenessSeverity, string> = {
  fresh:   'text-green-400',
  aging:   'text-yellow-400',
  stale:   'text-red-400',
  unknown: 'text-slate-500',
};

const SEVERITY_DOT: Record<StalenessSeverity, string> = {
  fresh:   'bg-green-400',
  aging:   'bg-yellow-400',
  stale:   'bg-red-400',
  unknown: 'bg-slate-500',
};

function fmtAge(hours: number | null): string {
  if (hours === null) return 'unknown';
  if (hours < 1) return `${Math.round(hours * 60)}m ago`;
  if (hours < 24) return `${Math.round(hours)}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function ScenarioBar() {
  const { params, setScenario } = useGlobalParams();
  const { liveData, liveLoaded, ageHours, severity } = useLiveData();

  const nvda = liveData.stocks['NVDA'];
  const scenarios: Scenario[] = ['bear', 'base', 'bull'];

  return (
    <div className="fixed top-14 left-0 md:left-64 right-0 h-10 bg-sa-surface border-b border-sa-border px-4 md:px-6 flex items-center gap-2 md:gap-4 text-xs z-10">
      <span className="text-sa-muted font-medium">Scenario:</span>
      <div className="flex items-center gap-1">
        {scenarios.map(s => {
          const style = SCENARIO_STYLES[s];
          const isActive = params.scenario === s;
          return (
            <button
              key={s}
              onClick={() => setScenario(s)}
              className={`px-3 py-0.5 rounded border text-xs font-semibold transition-colors ${
                isActive ? style.active : style.inactive
              }`}
            >
              {style.label}
            </button>
          );
        })}
      </div>

      <div className="w-px h-4 bg-sa-border mx-1" />

      {nvda && nvda.price != null ? (
        <span className="text-slate-300 font-medium">
          NVDA{' '}
          <span className="text-white">${nvda.price.toFixed(2)}</span>
          {nvda.changePct != null && (
            <span className={`ml-1 ${nvda.changePct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ({nvda.changePct >= 0 ? '+' : ''}{nvda.changePct.toFixed(1)}%)
            </span>
          )}
        </span>
      ) : null}

      <div className="ml-auto flex items-center gap-2">
        {!liveLoaded ? (
          <span className="text-sa-muted">Live data: loading…</span>
        ) : liveData.lastUpdated ? (
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${liveLoaded ? SEVERITY_DOT[severity] : 'bg-slate-500'}`} />
            <span className={`text-xs font-medium ${SEVERITY_COLORS[severity]}`}>
              {fmtAge(ageHours)}
              {severity === 'stale' && ' — stale'}
            </span>
            <span className="text-sa-muted text-xs">· refreshes 6AM UTC</span>
          </span>
        ) : (
          <span className="text-sa-muted">Live data: not yet fetched</span>
        )}
      </div>
    </div>
  );
}
