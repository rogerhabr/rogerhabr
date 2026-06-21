'use client';
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { GlobalParams, Scenario, SCENARIO_PRESETS, SCENARIO_MULTS, ScenarioMult } from '@/lib/params';

const STORAGE_KEY = 'ai-tokenomics-params-v2';

interface ParamsCtx {
  params: GlobalParams;
  mult: ScenarioMult;
  activeSection: string;
  panelOpen: boolean;
  setScenario: (s: Scenario) => void;
  setParam: <K extends keyof GlobalParams>(k: K, v: GlobalParams[K]) => void;
  resetParams: () => void;
  navigate: (sectionId: string) => void;
  setPanelOpen: (open: boolean) => void;
}

const Ctx = createContext<ParamsCtx>({
  params: SCENARIO_PRESETS.base,
  mult: SCENARIO_MULTS.base,
  activeSection: 'overview',
  panelOpen: false,
  setScenario: () => {},
  setParam: () => {},
  resetParams: () => {},
  navigate: () => {},
  setPanelOpen: () => {},
});

export function ParamsProvider({
  children,
  activeSection,
  onNavigate,
}: {
  children: ReactNode;
  activeSection: string;
  onNavigate: (id: string) => void;
}) {
  const [params, setParams] = useState<GlobalParams>(SCENARIO_PRESETS.base);
  const [panelOpen, setPanelOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as GlobalParams;
        // Merge stored with current preset defaults so new keys always exist
        setParams(prev => ({ ...prev, ...stored }));
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(params)); } catch {}
  }, [params, hydrated]);

  // Close panel on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setPanelOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const setScenario = (s: Scenario) => setParams(SCENARIO_PRESETS[s]);
  const setParam = <K extends keyof GlobalParams>(k: K, v: GlobalParams[K]) =>
    setParams(prev => ({ ...prev, [k]: v }));
  const resetParams = () => setParams(SCENARIO_PRESETS[params.scenario] ?? SCENARIO_PRESETS.base);
  const navigate = useCallback((id: string) => onNavigate(id), [onNavigate]);

  return (
    <Ctx.Provider value={{
      params,
      mult: SCENARIO_MULTS[params.scenario],
      activeSection,
      panelOpen,
      setScenario,
      setParam,
      resetParams,
      navigate,
      setPanelOpen,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useGlobalParams = () => useContext(Ctx);
