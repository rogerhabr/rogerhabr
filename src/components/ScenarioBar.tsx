'use client';

import { useGlobalParams } from '@/contexts/ParamsContext';
import { useLiveData } from '@/hooks/useLiveData';
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

export default function ScenarioBar() {
  const { params, setScenario } = useGlobalParams();
  const { liveData, liveLoaded } = useLiveData();

  const nvda = liveData.stocks['NVDA'];
  const scenarios: Scenario[] = ['bear', 'base', 'bull'];

  const formatDate = (iso: string | null) => {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return null;
    }
  };

  return (
    <div className="fixed top-14 left-64 right-0 h-10 bg-sa-surface border-b border-sa-border px-6 flex items-center gap-4 text-xs z-10">
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
          <span className="text-sa-muted">Live data: loading...</span>
        ) : liveData.lastUpdated ? (
          <span className="text-sa-muted">
            Live data: <span className="text-slate-400">{formatDate(liveData.lastUpdated)}</span>
          </span>
        ) : (
          <span className="text-sa-muted">Live data: not yet fetched</span>
        )}
      </div>
    </div>
  );
}
